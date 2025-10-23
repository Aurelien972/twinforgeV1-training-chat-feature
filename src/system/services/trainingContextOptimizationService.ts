/**
 * Training Context Optimization Service
 * Analyzes user feedback history to optimize future training generation
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';

export interface UserFeedbackSummary {
  recentFeedbacks: Array<{
    sessionId: string;
    feedbackText: string;
    sentimentScore: number | null;
    keyThemes: any[];
    createdAt: Date;
  }>;
  averageSentiment: number;
  commonThemes: Record<string, number>;
  painPoints: string[];
  positivePatterns: string[];
}

export interface ContextOptimizationData {
  userPreferences: {
    preferredExerciseTypes: string[];
    avoidedExercises: string[];
    energyPatterns: Record<string, number>;
    recoveryNeeds: string[];
  };
  performanceTrends: {
    improvingAreas: string[];
    strugglingAreas: string[];
    consistencyScore: number;
  };
  feedbackInsights: UserFeedbackSummary;
}

class TrainingContextOptimizationService {
  /**
   * Get recent user feedbacks with aggregated insights
   */
  async getUserFeedbackSummary(userId: string, limit: number = 5): Promise<UserFeedbackSummary> {
    try {
      logger.info('CONTEXT_OPTIMIZATION', 'Fetching user feedback summary', {
        userId,
        limit,
      });

      // Get recent feedbacks using the SQL function
      const { data: feedbacksData, error: feedbacksError } = await supabase
        .rpc('get_user_recent_feedbacks', {
          p_user_id: userId,
          p_limit: limit,
        });

      if (feedbacksError) {
        logger.error('CONTEXT_OPTIMIZATION', 'Error fetching feedbacks', {
          error: feedbacksError.message,
        });
        throw feedbacksError;
      }

      const feedbacks = (feedbacksData || []).map((fb: any) => ({
        sessionId: fb.session_id,
        feedbackText: fb.feedback_text,
        sentimentScore: fb.sentiment_score,
        keyThemes: fb.key_themes || [],
        createdAt: new Date(fb.created_at),
      }));

      // Get average sentiment
      const { data: avgSentimentData, error: avgError } = await supabase
        .rpc('get_user_average_sentiment', {
          p_user_id: userId,
          p_days: 30,
        });

      if (avgError) {
        logger.warn('CONTEXT_OPTIMIZATION', 'Could not fetch average sentiment', {
          error: avgError.message,
        });
      }

      const averageSentiment = avgSentimentData || 0;

      // Analyze common themes
      const themeFrequency: Record<string, number> = {};
      feedbacks.forEach((fb) => {
        if (Array.isArray(fb.keyThemes)) {
          fb.keyThemes.forEach((theme: string) => {
            themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
          });
        }
      });

      // Extract pain points (negative feedback patterns)
      const painPoints = this.extractPainPoints(feedbacks);

      // Extract positive patterns
      const positivePatterns = this.extractPositivePatterns(feedbacks);

      logger.info('CONTEXT_OPTIMIZATION', 'Feedback summary generated', {
        feedbackCount: feedbacks.length,
        averageSentiment,
        themesCount: Object.keys(themeFrequency).length,
        painPointsCount: painPoints.length,
        positiveCount: positivePatterns.length,
      });

      return {
        recentFeedbacks: feedbacks,
        averageSentiment,
        commonThemes: themeFrequency,
        painPoints,
        positivePatterns,
      };
    } catch (error) {
      logger.error('CONTEXT_OPTIMIZATION', 'Error in getUserFeedbackSummary', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return empty summary on error
      return {
        recentFeedbacks: [],
        averageSentiment: 0,
        commonThemes: {},
        painPoints: [],
        positivePatterns: [],
      };
    }
  }

  /**
   * Extract pain points from feedback texts
   */
  private extractPainPoints(
    feedbacks: Array<{
      feedbackText: string;
      sentimentScore: number | null;
    }>
  ): string[] {
    const painKeywords = [
      'douleur',
      'mal',
      'fatigue',
      'épuisé',
      'difficile',
      'trop',
      'dur',
      'impossible',
      'blessure',
      'courbature',
    ];

    const painPoints: string[] = [];

    feedbacks
      .filter((fb) => (fb.sentimentScore || 0) < 0)
      .forEach((fb) => {
        const lowerText = fb.feedbackText.toLowerCase();
        painKeywords.forEach((keyword) => {
          if (lowerText.includes(keyword)) {
            // Extract sentence containing the pain keyword
            const sentences = fb.feedbackText.split(/[.!?]/);
            const relevantSentence = sentences.find((s) =>
              s.toLowerCase().includes(keyword)
            );
            if (relevantSentence && relevantSentence.trim()) {
              painPoints.push(relevantSentence.trim());
            }
          }
        });
      });

    return [...new Set(painPoints)].slice(0, 5); // Max 5 unique pain points
  }

  /**
   * Extract positive patterns from feedback texts
   */
  private extractPositivePatterns(
    feedbacks: Array<{
      feedbackText: string;
      sentimentScore: number | null;
    }>
  ): string[] {
    const positiveKeywords = [
      'bien',
      'excellent',
      'super',
      'parfait',
      'motivé',
      'fort',
      'progrès',
      'mieux',
      'facile',
      'réussi',
    ];

    const positivePatterns: string[] = [];

    feedbacks
      .filter((fb) => (fb.sentimentScore || 0) > 0)
      .forEach((fb) => {
        const lowerText = fb.feedbackText.toLowerCase();
        positiveKeywords.forEach((keyword) => {
          if (lowerText.includes(keyword)) {
            const sentences = fb.feedbackText.split(/[.!?]/);
            const relevantSentence = sentences.find((s) =>
              s.toLowerCase().includes(keyword)
            );
            if (relevantSentence && relevantSentence.trim()) {
              positivePatterns.push(relevantSentence.trim());
            }
          }
        });
      });

    return [...new Set(positivePatterns)].slice(0, 5); // Max 5 unique positive patterns
  }

  /**
   * Generate optimization context for training generation
   * This data will be passed to the AI training generator
   */
  async getOptimizationContext(userId: string): Promise<ContextOptimizationData> {
    try {
      logger.info('CONTEXT_OPTIMIZATION', 'Generating optimization context', {
        userId,
      });

      // Get feedback summary
      const feedbackInsights = await this.getUserFeedbackSummary(userId);

      // Get user preferences from recent sessions
      const userPreferences = await this.extractUserPreferences(userId);

      // Get performance trends
      const performanceTrends = await this.analyzePerformanceTrends(userId);

      logger.info('CONTEXT_OPTIMIZATION', 'Optimization context generated', {
        userId,
        hasFeedback: feedbackInsights.recentFeedbacks.length > 0,
        averageSentiment: feedbackInsights.averageSentiment,
      });

      return {
        userPreferences,
        performanceTrends,
        feedbackInsights,
      };
    } catch (error) {
      logger.error('CONTEXT_OPTIMIZATION', 'Error generating optimization context', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return minimal context on error
      return {
        userPreferences: {
          preferredExerciseTypes: [],
          avoidedExercises: [],
          energyPatterns: {},
          recoveryNeeds: [],
        },
        performanceTrends: {
          improvingAreas: [],
          strugglingAreas: [],
          consistencyScore: 0,
        },
        feedbackInsights: {
          recentFeedbacks: [],
          averageSentiment: 0,
          commonThemes: {},
          painPoints: [],
          positivePatterns: [],
        },
      };
    }
  }

  /**
   * Extract user preferences from feedback and session history
   */
  private async extractUserPreferences(userId: string) {
    // TODO: Analyze session history to extract preferences
    // For now, return default structure
    return {
      preferredExerciseTypes: [],
      avoidedExercises: [],
      energyPatterns: {},
      recoveryNeeds: [],
    };
  }

  /**
   * Analyze performance trends from session data
   */
  private async analyzePerformanceTrends(userId: string) {
    // TODO: Analyze session performance data
    // For now, return default structure
    return {
      improvingAreas: [],
      strugglingAreas: [],
      consistencyScore: 0,
    };
  }

  /**
   * Format feedback summary for AI coach prompt
   */
  formatFeedbackForAI(feedbackSummary: UserFeedbackSummary): string {
    if (feedbackSummary.recentFeedbacks.length === 0) {
      return 'Aucun feedback utilisateur disponible.';
    }

    let prompt = `Résumé des retours utilisateur (${feedbackSummary.recentFeedbacks.length} dernières séances):\n\n`;

    // Average sentiment
    const sentimentLabel =
      feedbackSummary.averageSentiment > 0.3
        ? 'Positif'
        : feedbackSummary.averageSentiment < -0.3
        ? 'Négatif'
        : 'Neutre';
    prompt += `Sentiment global: ${sentimentLabel} (${feedbackSummary.averageSentiment.toFixed(2)})\n\n`;

    // Pain points
    if (feedbackSummary.painPoints.length > 0) {
      prompt += `Points de douleur identifiés:\n`;
      feedbackSummary.painPoints.forEach((pain, idx) => {
        prompt += `${idx + 1}. ${pain}\n`;
      });
      prompt += '\n';
    }

    // Positive patterns
    if (feedbackSummary.positivePatterns.length > 0) {
      prompt += `Aspects positifs:\n`;
      feedbackSummary.positivePatterns.forEach((positive, idx) => {
        prompt += `${idx + 1}. ${positive}\n`;
      });
      prompt += '\n';
    }

    // Recent feedbacks
    prompt += `Derniers retours:\n`;
    feedbackSummary.recentFeedbacks.slice(0, 3).forEach((fb, idx) => {
      const date = new Date(fb.createdAt).toLocaleDateString('fr-FR');
      prompt += `${idx + 1}. [${date}] ${fb.feedbackText.substring(0, 100)}${
        fb.feedbackText.length > 100 ? '...' : ''
      }\n`;
    });

    return prompt;
  }
}

export const trainingContextOptimizationService =
  new TrainingContextOptimizationService();

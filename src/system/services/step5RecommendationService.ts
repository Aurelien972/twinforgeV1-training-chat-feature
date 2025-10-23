/**
 * Step 5 Recommendation Service
 * Service for generating personalized recommendations, calculating recovery status,
 * and managing progression data for Step 5 (Avancer)
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';
import {
  determineNextAction,
  calculateRecoveryPercentage,
  calculateOptimalWindows,
  type Recommendation,
  type RecommendationContext
} from '../../config/step5RecommendationLogic';
import {
  determineMotivationalPattern,
  generateMotivationalMessage
} from '../../config/step5CoachMessages';
import type { SessionFeedback, SessionPrescription, PreparerData } from '../store/trainingPipeline/types';
import { trainingWearableIntegrationService } from './trainingWearableIntegrationService';

export interface UserProgressionData {
  currentLevel: string;
  targetLevel: string | null;
  sessionsCompleted: number;
  lastTestDate: Date | null;
  nextTestDue: Date | null;
  milestones: Milestone[];
}

export interface Milestone {
  type: 'session' | 'test' | 'upgrade';
  date: Date;
  achieved: boolean;
  metrics?: Record<string, any>;
}

export interface RecoveryData {
  muscularRecovery: number;
  systemicRecovery: number;
  optimalWindows: {
    morning: { start: Date; end: Date };
    evening: { start: Date; end: Date };
  };
  lastSessionDate: Date;
  wearableData?: {
    hasWearableData: boolean;
    deviceName?: string;
    restingHeartRate?: number;
    hrv?: number;
    sleepHours?: number;
    recoveryScore?: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface ProgressionMilestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  date?: Date;
  type: 'session' | 'test' | 'upgrade';
}

export interface QuickAction {
  id: string;
  type: 'schedule' | 'adjust' | 'history' | 'goals' | 'equipment' | 'nutrition' | 'recovery' | 'stats';
  label: string;
  action: string;
}

class Step5RecommendationService {
  private userId: string | null = null;
  private sessionId: string | null = null;

  /**
   * Initialize the service with user and session context
   */
  async initialize(sessionId: string) {
    this.sessionId = sessionId;

    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;

    logger.info('STEP5_RECOMMENDATION_SERVICE', 'Service initialized', {
      sessionId,
      userId: this.userId
    });
  }

  /**
   * Fetch the latest AI analysis for the current session
   */
  private async getLatestAIAnalysis() {
    if (!this.userId || !this.sessionId) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('training_session_analysis')
        .select('analysis_data, overall_score, performance_rating')
        .eq('session_id', this.sessionId)
        .eq('user_id', this.userId)
        .maybeSingle();

      if (error) {
        logger.warn('STEP5_RECOMMENDATION_SERVICE', 'Could not fetch AI analysis', { error: error.message });
        return null;
      }

      if (data) {
        logger.info('STEP5_RECOMMENDATION_SERVICE', 'AI analysis retrieved', {
          hasAnalysisData: !!data.analysis_data,
          overallScore: data.overall_score,
          rating: data.performance_rating
        });
      }

      return data?.analysis_data || null;
    } catch (error) {
      logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error fetching AI analysis', { error });
      return null;
    }
  }

  /**
   * Generate personalized recommendation based on session feedback and user data
   */
  async generateRecommendationFromSession(
    sessionFeedback: SessionFeedback,
    preparerData: PreparerData | null
  ): Promise<Recommendation> {
    if (!this.userId) {
      logger.warn('STEP5_RECOMMENDATION_SERVICE', 'No user ID available');
      throw new Error('User not authenticated');
    }

    try {
      // Get user stats
      const userStats = await this.getUserStats();

      // Build context
      const context: RecommendationContext = {
        sessionFeedback,
        preparerData,
        userStats
      };

      // Determine next action
      const recommendation = determineNextAction(context);

      // Save to database
      await this.saveRecommendation(recommendation);

      logger.info('STEP5_RECOMMENDATION_SERVICE', 'Recommendation generated', {
        type: recommendation.type,
        confidence: recommendation.confidence
      });

      return recommendation;
    } catch (error) {
      logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error generating recommendation', { error });
      throw error;
    }
  }

  /**
   * Get wearable recovery data for the user
   */
  async getWearableRecoveryData(userId: string): Promise<RecoveryData['wearableData'] | null> {
    try {
      logger.info('STEP5_RECOMMENDATION_SERVICE', 'Fetching wearable recovery data', { userId });

      // Get recovery metrics from wearable service
      const recoveryMetrics = await trainingWearableIntegrationService.getRecoveryMetrics(userId);

      // Get intensity adjustment suggestion
      const intensityAdjustment = await trainingWearableIntegrationService.suggestIntensityAdjustment(userId);

      // Check if we have any wearable data
      const hasAnyData = !!(
        recoveryMetrics.restingHeartRate ||
        recoveryMetrics.hrv ||
        recoveryMetrics.sleepHours ||
        recoveryMetrics.recoveryScore
      );

      if (!hasAnyData) {
        logger.info('STEP5_RECOMMENDATION_SERVICE', 'No wearable data available', { userId });
        return null;
      }

      // Determine data quality based on available metrics
      let dataQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
      const metricsCount = [
        recoveryMetrics.restingHeartRate,
        recoveryMetrics.hrv,
        recoveryMetrics.sleepHours
      ].filter(v => v !== undefined).length;

      if (metricsCount === 3 && recoveryMetrics.recoveryScore) {
        dataQuality = 'excellent';
      } else if (metricsCount >= 2) {
        dataQuality = 'good';
      } else if (metricsCount === 1) {
        dataQuality = 'fair';
      }

      // Get device name from connected devices
      const { data: devices } = await supabase
        .from('connected_devices')
        .select('device_name')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_sync_at', { ascending: false })
        .limit(1);

      const deviceName = devices?.[0]?.device_name || 'Wearable Device';

      const wearableData: RecoveryData['wearableData'] = {
        hasWearableData: true,
        deviceName,
        restingHeartRate: recoveryMetrics.restingHeartRate,
        hrv: recoveryMetrics.hrv,
        sleepHours: recoveryMetrics.sleepHours,
        recoveryScore: recoveryMetrics.recoveryScore,
        dataQuality
      };

      logger.info('STEP5_RECOMMENDATION_SERVICE', 'Wearable recovery data fetched', {
        userId,
        hasData: true,
        dataQuality,
        recoveryScore: recoveryMetrics.recoveryScore,
        shouldReduceIntensity: intensityAdjustment.shouldReduceIntensity
      });

      return wearableData;
    } catch (error) {
      logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error fetching wearable recovery data', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      return null;
    }
  }

  /**
   * Calculate and update recovery status
   * Now integrates wearable data when available
   */
  async calculateRecoveryStatus(
    sessionFeedback: SessionFeedback
  ): Promise<RecoveryData> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    try {
      const lastSessionDate = new Date();
      const currentDate = new Date();

      // Try to get wearable recovery data first
      const wearableData = await this.getWearableRecoveryData(this.userId);

      let muscular: number;
      let systemic: number;

      // If we have wearable data with recovery score, prioritize it
      if (wearableData?.recoveryScore !== undefined) {
        logger.info('STEP5_RECOMMENDATION_SERVICE', 'Using wearable recovery score', {
          recoveryScore: wearableData.recoveryScore,
          source: 'wearable'
        });

        // Use wearable recovery score directly
        // Map 0-100 score to recovery percentages
        muscular = wearableData.recoveryScore;
        systemic = wearableData.recoveryScore;
      } else {
        // Fallback to manual calculation
        logger.info('STEP5_RECOMMENDATION_SERVICE', 'Using manual recovery calculation', {
          source: 'fallback'
        });

        const recovery = calculateRecoveryPercentage(
          lastSessionDate,
          sessionFeedback.overallRpe,
          currentDate
        );

        muscular = recovery.muscular;
        systemic = recovery.systemic;
      }

      // Calculate optimal windows
      const nextSessionDate = new Date();
      nextSessionDate.setHours(nextSessionDate.getHours() + 48);
      const optimalWindows = calculateOptimalWindows(nextSessionDate);

      const recoveryData: RecoveryData = {
        muscularRecovery: muscular,
        systemicRecovery: systemic,
        optimalWindows,
        lastSessionDate,
        wearableData: wearableData || undefined
      };

      // Save to database
      await this.saveRecoveryStatus(sessionFeedback, recoveryData);

      logger.info('STEP5_RECOMMENDATION_SERVICE', 'Recovery status calculated', {
        muscular,
        systemic,
        hasWearableData: !!wearableData,
        dataSource: wearableData ? 'wearable' : 'manual'
      });

      return recoveryData;
    } catch (error) {
      logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error calculating recovery', { error });
      throw error;
    }
  }

  /**
   * Get or create user progression path (database version)
   */
  async getProgressionPathFromDB(): Promise<UserProgressionData> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Try to get existing progression path
      const { data: existing, error: fetchError } = await supabase
        .from('user_progression_path')
        .select('*')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (fetchError) {
        logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error fetching progression path', { fetchError });
      }

      if (existing) {
        return {
          currentLevel: existing.current_level,
          targetLevel: existing.target_level,
          sessionsCompleted: existing.sessions_completed,
          lastTestDate: existing.last_test_date ? new Date(existing.last_test_date) : null,
          nextTestDue: existing.next_test_due ? new Date(existing.next_test_due) : null,
          milestones: existing.milestones || []
        };
      }

      // Create new progression path
      const { data: created, error: createError } = await supabase
        .from('user_progression_path')
        .insert({
          user_id: this.userId,
          current_level: 'beginner',
          sessions_completed: 0,
          milestones: []
        })
        .select()
        .single();

      if (createError) {
        logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error creating progression path', { createError });
        throw createError;
      }

      return {
        currentLevel: created.current_level,
        targetLevel: created.target_level,
        sessionsCompleted: created.sessions_completed,
        lastTestDate: null,
        nextTestDue: null,
        milestones: []
      };
    } catch (error) {
      logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error getting progression path', { error });
      throw error;
    }
  }

  /**
   * Generate motivational message based on session performance
   */
  async generateMotivationalMessage(
    sessionFeedback: SessionFeedback,
    sessionPrescription: SessionPrescription
  ): Promise<string> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Get user stats for context
      const userStats = await this.getUserStats();

      // Calculate metrics
      const exercisesCompleted = sessionFeedback.exercises.filter(e => e.completed).length;
      const totalExercises = sessionPrescription.exercises.length;
      const avgTechnique = sessionFeedback.exercises.reduce((sum, e) => sum + (e.technique || 0), 0) / sessionFeedback.exercises.length;
      const totalVolume = sessionFeedback.exercises.reduce((sum, e) => {
        const exerciseVolume = e.repsActual.reduce((s, reps) => s + reps, 0) * (e.loadUsed || 0);
        return sum + exerciseVolume;
      }, 0);

      // Get previous max volume
      const { data: previousSessions } = await supabase
        .from('training_sessions')
        .select('total_volume')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const previousMaxVolume = previousSessions
        ? Math.max(...previousSessions.map(s => s.total_volume || 0))
        : 0;

      // Determine pattern and generate message
      const { pattern, context } = determineMotivationalPattern({
        overallRpe: sessionFeedback.overallRpe,
        exercisesCompleted,
        totalExercises,
        avgTechnique,
        consecutiveSessions: userStats.consecutiveSessions,
        totalVolume,
        previousMaxVolume,
        recentAvgRpe: userStats.avgRecentRpe,
        progressionPercent: 5 // TODO: Calculate actual progression
      });

      const message = generateMotivationalMessage(pattern, context);

      // Save message to database
      await this.saveMotivationalMessage(message, pattern);

      return message;
    } catch (error) {
      logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error generating motivational message', { error });
      return 'Excellente séance ! Continue sur cette lancée ! 💪';
    }
  }

  /**
   * Get user statistics for recommendation logic
   */
  private async getUserStats(): Promise<{
    sessionsSinceTest: number;
    consecutiveSessions: number;
    avgRecentRpe: number;
    avgRecentTechnique: number;
    totalSessions: number;
  }> {
    if (!this.userId) {
      return {
        sessionsSinceTest: 0,
        consecutiveSessions: 0,
        avgRecentRpe: 7,
        avgRecentTechnique: 7,
        totalSessions: 0
      };
    }

    // TODO: Implement actual queries when training_sessions table is available
    // For now, return mock data
    return {
      sessionsSinceTest: 3,
      consecutiveSessions: 2,
      avgRecentRpe: 7.5,
      avgRecentTechnique: 8.0,
      totalSessions: 5
    };
  }

  /**
   * Save recommendation to database
   */
  private async saveRecommendation(recommendation: Recommendation): Promise<void> {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('training_recommendations')
        .insert({
          user_id: this.userId,
          session_id: this.sessionId,
          recommendation_type: recommendation.type,
          recommended_date: recommendation.recommendedDate,
          confidence_score: recommendation.confidence,
          reasoning: { factors: recommendation.reasoning }
        });

      if (error) {
        logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error saving recommendation', { error });
      }
    } catch (error) {
      logger.error('STEP5_RECOMMENDATION_SERVICE', 'Exception saving recommendation', { error });
    }
  }

  /**
   * Save recovery status to database
   */
  private async saveRecoveryStatus(
    sessionFeedback: SessionFeedback,
    recoveryData: RecoveryData
  ): Promise<void> {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('recovery_status')
        .upsert({
          user_id: this.userId,
          last_session_id: this.sessionId,
          last_session_date: recoveryData.lastSessionDate.toISOString(),
          last_session_rpe: sessionFeedback.overallRpe,
          muscular_recovery_percent: recoveryData.muscularRecovery,
          systemic_recovery_percent: recoveryData.systemicRecovery,
          optimal_next_session_start: recoveryData.optimalWindows.morning.start.toISOString(),
          optimal_next_session_end: recoveryData.optimalWindows.evening.end.toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error saving recovery status', { error });
      }
    } catch (error) {
      logger.error('STEP5_RECOMMENDATION_SERVICE', 'Exception saving recovery status', { error });
    }
  }

  /**
   * Save motivational message to database
   */
  private async saveMotivationalMessage(message: string, pattern: string): Promise<void> {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('motivational_messages')
        .insert({
          user_id: this.userId,
          session_id: this.sessionId,
          message,
          pattern_type: pattern
        });

      if (error) {
        logger.error('STEP5_RECOMMENDATION_SERVICE', 'Error saving motivational message', { error });
      }
    } catch (error) {
      logger.error('STEP5_RECOMMENDATION_SERVICE', 'Exception saving motivational message', { error });
    }
  }

  /**
   * Get mock data for recovery status (for testing without session feedback)
   */
  async getRecoveryStatus(): Promise<RecoveryData> {
    const lastSessionDate = new Date();
    lastSessionDate.setHours(lastSessionDate.getHours() - 24);

    const nextSessionDate = new Date();
    nextSessionDate.setHours(nextSessionDate.getHours() + 24);

    return {
      muscularRecovery: 75,
      systemicRecovery: 85,
      optimalWindows: calculateOptimalWindows(nextSessionDate),
      lastSessionDate
    };
  }

  /**
   * Generate recommendation based on AI analysis when available
   */
  async generateRecommendation(): Promise<Recommendation> {
    const aiAnalysis = await this.getLatestAIAnalysis();

    if (aiAnalysis && aiAnalysis.progressionRecommendations) {
      const recommendations = aiAnalysis.progressionRecommendations;
      const nextSession = recommendations.nextSession;
      const longTerm = recommendations.longTerm;

      logger.info('STEP5_RECOMMENDATION_SERVICE', 'Using AI recommendations for next session', {
        hasVolumeAdjustment: !!nextSession.volumeAdjustment,
        hasIntensityAdjustment: !!nextSession.intensityAdjustment,
        focusPointsCount: nextSession.focusPoints?.length || 0
      });

      // Build reasoning from AI data
      const reasoning: string[] = [];

      if (nextSession.volumeAdjustment) {
        reasoning.push(nextSession.volumeAdjustment);
      }

      if (nextSession.intensityAdjustment) {
        reasoning.push(nextSession.intensityAdjustment);
      }

      if (nextSession.focusPoints && nextSession.focusPoints.length > 0) {
        reasoning.push(...nextSession.focusPoints.slice(0, 2));
      }

      // Determine icon and color based on adjustments
      let icon: any = 'Dumbbell';
      let color = '#22C55E';
      let title = 'Prochaine Séance d\'Entraînement';

      if (nextSession.intensityAdjustment?.toLowerCase().includes('augment')) {
        icon = 'TrendingUp';
        color = '#10B981';
        title = 'Intensifier l\'Entraînement';
      } else if (nextSession.volumeAdjustment?.toLowerCase().includes('diminu')) {
        icon = 'TrendingDown';
        color = '#F59E0B';
        title = 'Réduire la Charge';
      }

      return {
        type: 'next_session',
        title,
        subtitle: longTerm.goalAlignment || 'Progression Personnalisée',
        description: longTerm.strategicAdvice || 'Continue sur ta lancée avec des ajustements personnalisés.',
        icon,
        color,
        recommendedDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        confidence: 0.9,
        reasoning
      };
    }

    // Fallback to default recommendation
    logger.info('STEP5_RECOMMENDATION_SERVICE', 'Using default recommendation (no AI data)');

    return {
      type: 'next_session',
      title: 'Prochaine Séance d\'Entraînement',
      subtitle: 'Dans 48h',
      description: 'Continue sur ta lancée ! Ton corps est prêt pour une nouvelle séance progressive.',
      icon: 'Dumbbell',
      color: '#22C55E',
      recommendedDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      confidence: 0.85,
      reasoning: [
        'Récupération optimale',
        'Progression régulière',
        'Continuité recommandée'
      ]
    };
  }

  /**
   * Get progression path milestones
   */
  async getProgressionPath(): Promise<ProgressionMilestone[]> {
    return [
      {
        id: '1',
        title: 'Séance complétée',
        description: 'Excellente exécution technique',
        status: 'completed',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        type: 'session'
      },
      {
        id: '2',
        title: 'Prochaine séance',
        description: 'Progression sur les charges',
        status: 'current',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        type: 'session'
      },
      {
        id: '3',
        title: 'Test étalon',
        description: 'Mesure tes progrès maximaux',
        status: 'upcoming',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: 'test'
      }
    ];
  }

  /**
   * Get motivational message with category - uses AI data when available
   */
  async getMotivationalMessage(): Promise<{ message: string; category: 'strength' | 'endurance' | 'consistency' | 'recovery' }> {
    const aiAnalysis = await this.getLatestAIAnalysis();

    if (aiAnalysis && aiAnalysis.personalizedInsights?.motivationalMessage) {
      logger.info('STEP5_RECOMMENDATION_SERVICE', 'Using AI motivational message');

      // Determine category based on AI insights
      const strengths = aiAnalysis.personalizedInsights.strengths || [];
      const strengthsText = strengths.join(' ').toLowerCase();

      let category: 'strength' | 'endurance' | 'consistency' | 'recovery' = 'strength';

      if (strengthsText.includes('endurance') || strengthsText.includes('capacité')) {
        category = 'endurance';
      } else if (strengthsText.includes('régula') || strengthsText.includes('consistan') || strengthsText.includes('complétion')) {
        category = 'consistency';
      } else if (strengthsText.includes('récup') || strengthsText.includes('repos')) {
        category = 'recovery';
      }

      return {
        message: aiAnalysis.personalizedInsights.motivationalMessage,
        category
      };
    }

    // Fallback to default messages
    logger.info('STEP5_RECOMMENDATION_SERVICE', 'Using default motivational message');

    const messages = [
      { message: 'Ta force progresse régulièrement. Continue à pousser tes limites avec intelligence.', category: 'strength' as const },
      { message: 'Ta capacité de travail s\'améliore. Ton endurance musculaire est impressionnante !', category: 'endurance' as const },
      { message: 'Trois séances cette semaine ! Ta régularité est la clé de ta progression.', category: 'consistency' as const },
      { message: 'Ton corps récupère bien. Continue à respecter tes temps de repos.', category: 'recovery' as const }
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get quick actions
   */
  async getQuickActions(): Promise<QuickAction[]> {
    // Map to the 5 main Training tabs
    return [
      { id: '1', type: 'history', label: 'Historique', action: 'navigate_history' },
      { id: '2', type: 'stats', label: 'Analyse', action: 'navigate_analysis' },
      { id: '3', type: 'equipment', label: 'Progression', action: 'navigate_progression' },
      { id: '4', type: 'schedule', label: 'Lieux', action: 'navigate_locations' },
      { id: '5', type: 'goals', label: 'Objectifs', action: 'navigate_goals' }
    ];
  }

  /**
   * Save recommendation acceptance
   */
  async saveRecommendationAcceptance(recommendationId: string): Promise<void> {
    logger.info('STEP5_RECOMMENDATION_SERVICE', 'Recommendation accepted', { recommendationId });
  }

  /**
   * Reset service state
   */
  reset(): void {
    this.sessionId = null;
    logger.info('STEP5_RECOMMENDATION_SERVICE', 'Service reset');
  }
}

export const step5RecommendationService = new Step5RecommendationService();

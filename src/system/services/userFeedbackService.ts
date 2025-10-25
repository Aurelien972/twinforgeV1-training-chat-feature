/**
 * User Feedback Service
 * Handles saving and retrieving user feedback from training sessions
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';

interface SaveFeedbackParams {
  sessionId: string;
  userId: string;
  feedbackText: string;
  source: 'text' | 'voice';
  transcriptionConfidence?: number;
}

interface SaveFeedbackResult {
  success: boolean;
  feedbackId?: string;
  error?: string;
}

class UserFeedbackService {
  /**
   * Save user feedback to database
   */
  async saveFeedback(params: SaveFeedbackParams): Promise<SaveFeedbackResult> {
    const { sessionId, userId, feedbackText, source, transcriptionConfidence } = params;

    try {
      logger.info('USER_FEEDBACK', 'Saving user feedback', {
        sessionId,
        userId,
        textLength: feedbackText.length,
        source
      });

      // Validation
      const trimmed = feedbackText.trim();
      if (trimmed.length === 0) {
        return { success: false, error: 'Feedback text is empty' };
      }

      if (trimmed.length > 5000) {
        return { success: false, error: 'Feedback text too long (max 5000 characters)' };
      }

      // Insert into database
      const { data, error } = await supabase
        .from('training_session_user_feedback')
        .insert({
          session_id: sessionId,
          user_id: userId,
          feedback_text: trimmed,
          sentiment_score: null, // Will be analyzed later by AI
          key_themes: []
        })
        .select('id')
        .single();

      if (error) {
        logger.error('USER_FEEDBACK', 'Database insertion failed', {
          error: error.message,
          code: error.code,
          sessionId,
          userId
        });
        return { success: false, error: error.message };
      }

      logger.info('USER_FEEDBACK', 'Feedback saved successfully', {
        feedbackId: data.id,
        sessionId,
        userId,
        source,
        textLength: trimmed.length
      });

      // Trigger async analysis (fire-and-forget)
      this.triggerAsyncAnalysis(data.id, trimmed, userId).catch(err => {
        logger.warn('USER_FEEDBACK', 'Async analysis trigger failed', {
          error: err.message,
          feedbackId: data.id
        });
      });

      return { success: true, feedbackId: data.id };

    } catch (error) {
      logger.error('USER_FEEDBACK', 'Unexpected error saving feedback', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sessionId,
        userId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Trigger async AI analysis of feedback
   * This will be called by Phase B.3 edge function
   */
  private async triggerAsyncAnalysis(feedbackId: string, text: string, userId: string): Promise<void> {
    try {
      logger.info('USER_FEEDBACK', 'Triggering async feedback analysis', {
        feedbackId,
        userId,
        textLength: text.length
      });

      // Call edge function for analysis (to be created in Phase B.3)
      const { data, error } = await supabase.functions.invoke('analyze-user-feedback', {
        body: {
          feedbackId,
          text,
          userId
        }
      });

      if (error) {
        logger.warn('USER_FEEDBACK', 'Edge function call failed', {
          error: error.message,
          feedbackId
        });
        return;
      }

      logger.info('USER_FEEDBACK', 'Analysis triggered successfully', {
        feedbackId,
        analysisResult: data
      });

    } catch (error) {
      logger.error('USER_FEEDBACK', 'Error triggering analysis', {
        error: error instanceof Error ? error.message : String(error),
        feedbackId
      });
      // Don't throw - this is fire-and-forget
    }
  }

  /**
   * Get recent feedbacks for a user
   */
  async getUserRecentFeedbacks(userId: string, limit: number = 10): Promise<any[]> {
    try {
      logger.info('USER_FEEDBACK', 'Fetching recent feedbacks', {
        userId,
        limit
      });

      const { data, error } = await supabase
        .rpc('get_user_recent_feedbacks', {
          p_user_id: userId,
          p_limit: limit
        });

      if (error) {
        logger.error('USER_FEEDBACK', 'Error fetching feedbacks', {
          error: error.message,
          userId
        });
        return [];
      }

      logger.info('USER_FEEDBACK', 'Feedbacks fetched', {
        userId,
        count: data?.length || 0
      });

      return data || [];

    } catch (error) {
      logger.error('USER_FEEDBACK', 'Unexpected error fetching feedbacks', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      return [];
    }
  }

  /**
   * Get average sentiment for a user
   */
  async getUserAverageSentiment(userId: string, days: number = 30): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_average_sentiment', {
          p_user_id: userId,
          p_days: days
        });

      if (error) {
        logger.warn('USER_FEEDBACK', 'Error fetching average sentiment', {
          error: error.message,
          userId
        });
        return 0;
      }

      return data || 0;

    } catch (error) {
      logger.error('USER_FEEDBACK', 'Unexpected error fetching sentiment', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      return 0;
    }
  }

  /**
   * Get feedback for a specific session
   */
  async getSessionFeedback(sessionId: string, userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_session_feedback', {
          p_session_id: sessionId,
          p_user_id: userId
        });

      if (error) {
        logger.error('USER_FEEDBACK', 'Error fetching session feedback', {
          error: error.message,
          sessionId,
          userId
        });
        return null;
      }

      return data && data.length > 0 ? data[0] : null;

    } catch (error) {
      logger.error('USER_FEEDBACK', 'Unexpected error fetching session feedback', {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
        userId
      });
      return null;
    }
  }
}

export const userFeedbackService = new UserFeedbackService();

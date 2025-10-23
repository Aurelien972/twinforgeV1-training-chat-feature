/**
 * Session State Manager Service
 * Centralizes session state management and prevents unwanted regenerations
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';

export interface SessionState {
  sessionId: string;
  userId: string;
  generationTriggered: boolean;
  generationTriggeredAt: string | null;
  generationCompletedAt: string | null;
  prescriptionExists: boolean;
  currentStep: 'preparer' | 'activer' | 'seance' | 'adapter' | 'avancer';
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationCheckResult {
  canTrigger: boolean;
  reason?: string;
  existingState?: SessionState;
}

class SessionStateManager {
  /**
   * Check if generation can be triggered for a session
   */
  async canTriggerGeneration(sessionId: string): Promise<GenerationCheckResult> {
    try {
      logger.info('SESSION_STATE_MANAGER', 'Checking if generation can be triggered', {
        sessionId
      });

      const { data, error } = await supabase
        .rpc('can_trigger_generation', { p_session_id: sessionId });

      if (error) {
        logger.error('SESSION_STATE_MANAGER', 'Error checking generation permission', {
          error: error.message,
          sessionId
        });
        // On error, allow generation to prevent blocking the user
        return { canTrigger: true, reason: 'Error checking state, allowing by default' };
      }

      const canTrigger = data as boolean;

      // Get existing state for context
      const { data: stateData } = await supabase
        .from('training_session_states')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!canTrigger) {
        const reason = stateData?.prescription_exists
          ? 'Prescription already exists for this session'
          : 'Cooldown period active (5 seconds)';

        logger.warn('SESSION_STATE_MANAGER', 'Generation blocked', {
          sessionId,
          reason,
          state: stateData
        });

        return {
          canTrigger: false,
          reason,
          existingState: stateData as SessionState
        };
      }

      logger.info('SESSION_STATE_MANAGER', 'Generation allowed', { sessionId });

      return {
        canTrigger: true,
        existingState: stateData as SessionState | undefined
      };
    } catch (error) {
      logger.error('SESSION_STATE_MANAGER', 'Exception checking generation permission', {
        error: error instanceof Error ? error.message : 'Unknown',
        sessionId
      });
      // On exception, allow generation to prevent blocking the user
      return { canTrigger: true, reason: 'Exception occurred, allowing by default' };
    }
  }

  /**
   * Mark generation as triggered
   */
  async markGenerationTriggered(sessionId: string, userId: string): Promise<boolean> {
    try {
      logger.info('SESSION_STATE_MANAGER', 'Marking generation as triggered', {
        sessionId,
        userId
      });

      const { error } = await supabase.rpc('mark_generation_triggered', {
        p_session_id: sessionId,
        p_user_id: userId
      });

      if (error) {
        logger.error('SESSION_STATE_MANAGER', 'Error marking generation triggered', {
          error: error.message,
          sessionId,
          userId
        });
        return false;
      }

      logger.info('SESSION_STATE_MANAGER', 'Generation marked as triggered', {
        sessionId,
        userId
      });

      return true;
    } catch (error) {
      logger.error('SESSION_STATE_MANAGER', 'Exception marking generation triggered', {
        error: error instanceof Error ? error.message : 'Unknown',
        sessionId,
        userId
      });
      return false;
    }
  }

  /**
   * Mark generation as completed
   */
  async markGenerationCompleted(sessionId: string): Promise<boolean> {
    try {
      logger.info('SESSION_STATE_MANAGER', 'Marking generation as completed', {
        sessionId
      });

      const { error } = await supabase.rpc('mark_generation_completed', {
        p_session_id: sessionId
      });

      if (error) {
        logger.error('SESSION_STATE_MANAGER', 'Error marking generation completed', {
          error: error.message,
          sessionId
        });
        return false;
      }

      logger.info('SESSION_STATE_MANAGER', 'Generation marked as completed', {
        sessionId
      });

      return true;
    } catch (error) {
      logger.error('SESSION_STATE_MANAGER', 'Exception marking generation completed', {
        error: error instanceof Error ? error.message : 'Unknown',
        sessionId
      });
      return false;
    }
  }

  /**
   * Update current step in pipeline
   */
  async updateSessionStep(
    sessionId: string,
    step: 'preparer' | 'activer' | 'seance' | 'adapter' | 'avancer'
  ): Promise<boolean> {
    try {
      logger.debug('SESSION_STATE_MANAGER', 'Updating session step', {
        sessionId,
        step
      });

      const { error } = await supabase.rpc('update_session_step', {
        p_session_id: sessionId,
        p_step: step
      });

      if (error) {
        logger.error('SESSION_STATE_MANAGER', 'Error updating session step', {
          error: error.message,
          sessionId,
          step
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('SESSION_STATE_MANAGER', 'Exception updating session step', {
        error: error instanceof Error ? error.message : 'Unknown',
        sessionId,
        step
      });
      return false;
    }
  }

  /**
   * Get current session state
   */
  async getSessionState(sessionId: string): Promise<SessionState | null> {
    try {
      const { data, error } = await supabase
        .from('training_session_states')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) {
        logger.error('SESSION_STATE_MANAGER', 'Error fetching session state', {
          error: error.message,
          sessionId
        });
        return null;
      }

      if (!data) {
        logger.debug('SESSION_STATE_MANAGER', 'No session state found', { sessionId });
        return null;
      }

      return {
        sessionId: data.session_id,
        userId: data.user_id,
        generationTriggered: data.generation_triggered,
        generationTriggeredAt: data.generation_triggered_at,
        generationCompletedAt: data.generation_completed_at,
        prescriptionExists: data.prescription_exists,
        currentStep: data.current_step,
        lastActivityAt: data.last_activity_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      logger.error('SESSION_STATE_MANAGER', 'Exception fetching session state', {
        error: error instanceof Error ? error.message : 'Unknown',
        sessionId
      });
      return null;
    }
  }

  /**
   * Check if a prescription exists for this session
   */
  async prescriptionExists(sessionId: string): Promise<boolean> {
    try {
      const state = await this.getSessionState(sessionId);
      return state?.prescriptionExists ?? false;
    } catch (error) {
      logger.error('SESSION_STATE_MANAGER', 'Exception checking prescription existence', {
        error: error instanceof Error ? error.message : 'Unknown',
        sessionId
      });
      return false;
    }
  }

  /**
   * Reset session state (for when user explicitly wants to regenerate)
   */
  async resetSessionState(sessionId: string): Promise<boolean> {
    try {
      logger.info('SESSION_STATE_MANAGER', 'Resetting session state', { sessionId });

      const { error } = await supabase
        .from('training_session_states')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        logger.error('SESSION_STATE_MANAGER', 'Error resetting session state', {
          error: error.message,
          sessionId
        });
        return false;
      }

      logger.info('SESSION_STATE_MANAGER', 'Session state reset successfully', {
        sessionId
      });

      return true;
    } catch (error) {
      logger.error('SESSION_STATE_MANAGER', 'Exception resetting session state', {
        error: error instanceof Error ? error.message : 'Unknown',
        sessionId
      });
      return false;
    }
  }

  /**
   * Cleanup old session states
   */
  async cleanupOldSessions(): Promise<number> {
    try {
      logger.info('SESSION_STATE_MANAGER', 'Cleaning up old session states');

      const { data, error } = await supabase.rpc('cleanup_old_session_states');

      if (error) {
        logger.error('SESSION_STATE_MANAGER', 'Error cleaning up old sessions', {
          error: error.message
        });
        return 0;
      }

      const deletedCount = data as number;

      logger.info('SESSION_STATE_MANAGER', 'Old sessions cleaned up', {
        deletedCount
      });

      return deletedCount;
    } catch (error) {
      logger.error('SESSION_STATE_MANAGER', 'Exception cleaning up old sessions', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      return 0;
    }
  }

  /**
   * Create or update session state with current step
   */
  async upsertSessionState(
    sessionId: string,
    userId: string,
    step: 'preparer' | 'activer' | 'seance' | 'adapter' | 'avancer'
  ): Promise<boolean> {
    try {
      logger.debug('SESSION_STATE_MANAGER', 'Upserting session state', {
        sessionId,
        userId,
        step
      });

      const { error } = await supabase
        .from('training_session_states')
        .upsert({
          session_id: sessionId,
          user_id: userId,
          current_step: step,
          last_activity_at: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        });

      if (error) {
        logger.error('SESSION_STATE_MANAGER', 'Error upserting session state', {
          error: error.message,
          sessionId,
          userId,
          step
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('SESSION_STATE_MANAGER', 'Exception upserting session state', {
        error: error instanceof Error ? error.message : 'Unknown',
        sessionId,
        userId,
        step
      });
      return false;
    }
  }
}

// Export singleton instance
export const sessionStateManager = new SessionStateManager();

/**
 * Session Persistence Service
 * Handles saving training sessions with discipline and metrics to Supabase
 */

import { supabase } from '../supabase/client';
import { trainingMetricsService } from './trainingMetricsService';
import logger from '../../lib/utils/logger';

interface SaveSessionParams {
  sessionId: string;
  userId: string;
  prescription: any;
  preparerContext: any;
  feedback?: any;
  analysisResult?: any;
}

class SessionPersistenceService {
  /**
   * Save completed session with discipline and metrics
   */
  async saveCompletedSession(params: SaveSessionParams): Promise<void> {
    const { sessionId, userId, prescription, preparerContext, feedback, analysisResult } = params;

    try {
      const discipline = this.extractDiscipline(prescription, preparerContext);
      const coachType = this.determineCoachType(discipline);

      logger.info('SESSION_PERSISTENCE', 'Saving completed session', {
        sessionId,
        discipline,
        coachType
      });

      // CRITICAL: Ensure 'type' is always defined (NOT NULL constraint)
      const sessionType = prescription.type || discipline || 'strength';

      const sessionData = {
        id: sessionId,
        user_id: userId,
        plan_id: null, // Standalone sessions have no plan association
        session_index: null, // Not applicable for standalone sessions
        week_number: null, // Not applicable for standalone sessions
        type: sessionType, // REQUIRED: NOT NULL column in database
        discipline,
        coach_type: coachType,
        session_type: sessionType, // Duplicate for backwards compatibility
        status: 'completed',
        prescription: prescription,
        duration_target_min: prescription.durationTarget,
        duration_actual_min: feedback?.totalDuration || prescription.durationTarget,
        exercises_total: prescription.exercises?.length || prescription.mainWorkout?.length || 0,
        exercises_completed: feedback?.exercisesCompleted || prescription.exercises?.length || 0,
        rpe_avg: feedback?.overallRPE || 7,
        completed_at: new Date().toISOString(),
        analysis_result: analysisResult,
        wearable_device_used: feedback?.wearableDeviceUsed || null,
        hr_tracking_enabled: feedback?.hrTrackingEnabled || false,
        wearable_data_quality: feedback?.wearableMetrics?.dataQuality || null,
        feedback_data: feedback || null
      };

      const { error: sessionError } = await supabase
        .from('training_sessions')
        .upsert(sessionData, { onConflict: 'id' });

      if (sessionError) {
        logger.error('SESSION_PERSISTENCE', 'Failed to save session', { error: sessionError });
        throw sessionError;
      }

      const fullSession = {
        ...sessionData,
        prescription
      };
      const metrics = trainingMetricsService.extractMetrics(fullSession);
      await trainingMetricsService.saveMetrics(sessionId, metrics);

      if (feedback?.wearableMetrics) {
        await this.saveWearableMetrics(sessionId, userId, feedback.wearableMetrics);
      }

      logger.info('SESSION_PERSISTENCE', 'Session and metrics saved successfully', {
        sessionId,
        discipline,
        hasMetrics: Object.keys(metrics).length > 1,
        hasWearableMetrics: !!feedback?.wearableMetrics
      });
    } catch (error) {
      logger.error('SESSION_PERSISTENCE', 'Error saving session', { error, sessionId });
      throw error;
    }
  }

  /**
   * Save draft session (in-progress)
   */
  async saveDraftSession(params: SaveSessionParams): Promise<void> {
    const { sessionId, userId, prescription, preparerContext } = params;

    try {
      const discipline = this.extractDiscipline(prescription, preparerContext);
      const coachType = this.determineCoachType(discipline);
      const normalizedCoachType = this.normalizeCoachType(coachType);

      // CRITICAL: Ensure 'type' is always defined (NOT NULL constraint)
      const sessionType = prescription.type || discipline || 'strength';

      // Validate coach_type before saving
      this.validateCoachType(normalizedCoachType);

      const sessionData = {
        id: sessionId,
        user_id: userId,
        plan_id: null, // Standalone sessions (drafts) have no plan association
        session_index: null, // Not applicable for standalone sessions
        week_number: null, // Not applicable for standalone sessions
        type: sessionType, // REQUIRED: NOT NULL column in database
        discipline,
        coach_type: normalizedCoachType, // Normalized format without prefix
        session_type: sessionType, // Duplicate for backwards compatibility
        status: 'draft',
        prescription: prescription,
        duration_target_min: prescription.durationTarget,
        exercises_total: prescription.exercises?.length || prescription.mainWorkout?.length || 0
      };

      logger.info('SESSION_PERSISTENCE', 'Prepared session data for save', {
        sessionId,
        discipline,
        coachType: normalizedCoachType,
        hasValidCoachType: this.isValidCoachType(normalizedCoachType)
      });

      // Save to database with retry logic
      const saveResult = await this.saveWithRetry(sessionData, sessionId);

      if (saveResult.success) {
        logger.info('SESSION_PERSISTENCE', 'Draft session saved successfully', {
          sessionId,
          discipline,
          coachType: normalizedCoachType,
          attemptNumber: saveResult.attemptNumber
        });
      } else {
        // Save failed after retries - backup to localStorage
        this.backupToLocalStorage(sessionId, sessionData);

        logger.error('SESSION_PERSISTENCE', 'Failed to save draft after retries, backed up to localStorage', {
          sessionId,
          error: saveResult.error,
          totalAttempts: saveResult.attemptNumber
        });

        // Don't throw - allow user to continue working
        // The data is safely backed up in localStorage
      }
    } catch (error) {
      logger.error('SESSION_PERSISTENCE', 'Unexpected error in save flow', { error, sessionId });

      // Last resort: try to backup to localStorage
      try {
        const minimalData = { sessionId, userId, prescription };
        this.backupToLocalStorage(sessionId, minimalData);
      } catch (backupError) {
        logger.error('SESSION_PERSISTENCE', 'Failed to backup to localStorage', { backupError });
      }

      // Don't throw - allow user to continue
    }
  }

  /**
   * Extract discipline from prescription and context
   */
  private extractDiscipline(prescription: any, preparerContext: any): string {
    if (prescription.discipline) {
      return prescription.discipline;
    }

    if ((preparerContext as any).tempSport) {
      return (preparerContext as any).tempSport;
    }

    if (prescription.category === 'endurance') {
      return 'running';
    }

    if (prescription.type === 'endurance') {
      return 'running';
    }

    return 'strength';
  }

  /**
   * Determine coach type from discipline
   * Returns normalized coach_type without 'coach-' prefix
   */
  private determineCoachType(discipline: string): string {
    const normalizedDiscipline = discipline.toLowerCase().trim();

    const enduranceTypes = ['running', 'cycling', 'swimming', 'triathlon', 'cardio', 'endurance'];
    if (enduranceTypes.includes(normalizedDiscipline)) {
      return 'endurance';
    }

    const forceTypes = ['strength', 'powerlifting', 'bodybuilding', 'strongman', 'force'];
    if (forceTypes.includes(normalizedDiscipline)) {
      return 'force';
    }

    const functionalTypes = ['crossfit', 'hiit', 'functional', 'circuit'];
    if (functionalTypes.includes(normalizedDiscipline)) {
      return 'functional';
    }

    const calisthenicsTypes = ['calisthenics', 'street-workout'];
    if (calisthenicsTypes.includes(normalizedDiscipline)) {
      return 'calisthenics';
    }

    const competitionsTypes = ['hyrox', 'deka', 'competitions', 'fitness-competitions'];
    if (competitionsTypes.includes(normalizedDiscipline)) {
      return 'competitions';
    }

    const wellnessTypes = ['yoga', 'pilates', 'wellness', 'mobility'];
    if (wellnessTypes.includes(normalizedDiscipline)) {
      return 'wellness';
    }

    const combatTypes = ['boxing', 'mma', 'combat', 'martial-arts'];
    if (combatTypes.includes(normalizedDiscipline)) {
      return 'combat';
    }

    return 'force';
  }

  /**
   * Normalize coach_type to format without prefix
   * Removes 'coach-' prefix if present
   */
  private normalizeCoachType(coachType: string): string {
    if (!coachType) {
      return 'force'; // Default fallback
    }

    // Remove 'coach-' prefix if present
    if (coachType.startsWith('coach-')) {
      return coachType.substring(6); // Remove 'coach-' (6 chars)
    }

    return coachType;
  }

  /**
   * Validate that coach_type is one of the accepted values
   */
  private validateCoachType(coachType: string): void {
    const validTypes = [
      'force',
      'functional',
      'competitions',
      'calisthenics',
      'combat',
      'endurance',
      'wellness',
      'sports',
      'mixed',
      'hybrid',
      'mobility'
    ];

    if (!validTypes.includes(coachType)) {
      logger.warn('SESSION_PERSISTENCE', 'Invalid coach_type detected', {
        coachType,
        validTypes
      });
    }
  }

  /**
   * Check if coach_type is valid
   */
  private isValidCoachType(coachType: string): boolean {
    const validTypes = [
      'force',
      'functional',
      'competitions',
      'calisthenics',
      'combat',
      'endurance',
      'wellness',
      'sports',
      'mixed',
      'hybrid',
      'mobility'
    ];

    return validTypes.includes(coachType);
  }

  /**
   * Save session data with retry logic
   * Attempts up to 3 times with exponential backoff
   */
  private async saveWithRetry(
    sessionData: any,
    sessionId: string,
    maxAttempts: number = 3
  ): Promise<{ success: boolean; error?: any; attemptNumber: number }> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info('SESSION_PERSISTENCE', `Attempting to save draft (attempt ${attempt}/${maxAttempts})`, {
          sessionId,
          attempt
        });

        const { error } = await supabase
          .from('training_sessions')
          .upsert(sessionData, { onConflict: 'id' });

        if (!error) {
          return { success: true, attemptNumber: attempt };
        }

        logger.warn('SESSION_PERSISTENCE', `Save attempt ${attempt} failed`, {
          sessionId,
          error,
          attempt,
          willRetry: attempt < maxAttempts
        });

        // Wait before retrying (exponential backoff)
        if (attempt < maxAttempts) {
          const delayMs = Math.pow(2, attempt) * 500; // 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // Last attempt failed
          return { success: false, error, attemptNumber: attempt };
        }
      } catch (error) {
        logger.error('SESSION_PERSISTENCE', `Save attempt ${attempt} threw error`, {
          sessionId,
          error,
          attempt
        });

        if (attempt === maxAttempts) {
          return { success: false, error, attemptNumber: attempt };
        }

        // Wait before retrying
        const delayMs = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return { success: false, error: 'Max attempts reached', attemptNumber: maxAttempts };
  }

  /**
   * Backup session data to localStorage as fallback
   */
  private backupToLocalStorage(sessionId: string, sessionData: any): void {
    try {
      const backupKey = `training_session_backup_${sessionId}`;
      const backupData = {
        sessionId,
        timestamp: new Date().toISOString(),
        data: sessionData
      };

      localStorage.setItem(backupKey, JSON.stringify(backupData));

      logger.info('SESSION_PERSISTENCE', 'Session backed up to localStorage', {
        sessionId,
        backupKey
      });

      // Also save to a list of pending backups
      const pendingKey = 'training_sessions_pending_backups';
      const existing = localStorage.getItem(pendingKey);
      const pending = existing ? JSON.parse(existing) : [];
      if (!pending.includes(sessionId)) {
        pending.push(sessionId);
        localStorage.setItem(pendingKey, JSON.stringify(pending));
      }
    } catch (error) {
      logger.error('SESSION_PERSISTENCE', 'Failed to backup to localStorage', {
        sessionId,
        error
      });
    }
  }

  /**
   * Attempt to sync pending backups from localStorage to database
   */
  async syncPendingBackups(): Promise<void> {
    try {
      const pendingKey = 'training_sessions_pending_backups';
      const existing = localStorage.getItem(pendingKey);

      if (!existing) {
        return; // No pending backups
      }

      const pending: string[] = JSON.parse(existing);

      logger.info('SESSION_PERSISTENCE', 'Syncing pending backups', {
        count: pending.length
      });

      for (const sessionId of pending) {
        const backupKey = `training_session_backup_${sessionId}`;
        const backupData = localStorage.getItem(backupKey);

        if (!backupData) {
          continue;
        }

        try {
          const backup = JSON.parse(backupData);
          const result = await this.saveWithRetry(backup.data, sessionId, 2);

          if (result.success) {
            // Successfully synced - remove from localStorage
            localStorage.removeItem(backupKey);
            const newPending = pending.filter(id => id !== sessionId);
            localStorage.setItem(pendingKey, JSON.stringify(newPending));

            logger.info('SESSION_PERSISTENCE', 'Successfully synced backup', {
              sessionId
            });
          }
        } catch (error) {
          logger.error('SESSION_PERSISTENCE', 'Failed to sync backup', {
            sessionId,
            error
          });
        }
      }
    } catch (error) {
      logger.error('SESSION_PERSISTENCE', 'Error in syncPendingBackups', { error });
    }
  }

  /**
   * Save wearable metrics to dedicated table
   */
  private async saveWearableMetrics(sessionId: string, userId: string, wearableMetrics: any): Promise<void> {
    try {
      logger.info('SESSION_PERSISTENCE', 'Saving wearable metrics', {
        sessionId,
        avgHR: wearableMetrics.avgHeartRate,
        maxHR: wearableMetrics.maxHeartRate,
        dataPoints: wearableMetrics.heartRateData?.length || 0
      });

      const { error } = await supabase
        .from('training_session_wearable_metrics')
        .upsert({
          session_id: sessionId,
          user_id: userId,
          hr_data: wearableMetrics.heartRateData || [],
          avg_hr: wearableMetrics.avgHeartRate,
          max_hr: wearableMetrics.maxHeartRate,
          min_hr: wearableMetrics.minHeartRate,
          zones_distribution: wearableMetrics.timeInZones,
          calories_burned: wearableMetrics.caloriesBurned,
          effort_score: wearableMetrics.effortScore,
          data_quality: wearableMetrics.dataQuality,
          device_name: wearableMetrics.deviceName,
          device_id: wearableMetrics.deviceId,
          session_start_time: wearableMetrics.sessionStartTime,
          session_end_time: wearableMetrics.sessionEndTime,
          duration_seconds: wearableMetrics.durationSeconds,
          created_at: new Date().toISOString()
        }, { onConflict: 'session_id' });

      if (error) {
        logger.error('SESSION_PERSISTENCE', 'Failed to save wearable metrics', {
          error,
          sessionId
        });
        throw error;
      }

      logger.info('SESSION_PERSISTENCE', 'Wearable metrics saved successfully', { sessionId });
    } catch (error) {
      logger.error('SESSION_PERSISTENCE', 'Error saving wearable metrics', {
        error,
        sessionId
      });
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(sessionId: string, status: 'draft' | 'in_progress' | 'completed' | 'abandoned'): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_sessions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        logger.error('SESSION_PERSISTENCE', 'Failed to update status', { error, sessionId, status });
        throw error;
      }

      logger.info('SESSION_PERSISTENCE', 'Session status updated', { sessionId, status });
    } catch (error) {
      logger.error('SESSION_PERSISTENCE', 'Error updating status', { error, sessionId });
      throw error;
    }
  }
}

export const sessionPersistenceService = new SessionPersistenceService();

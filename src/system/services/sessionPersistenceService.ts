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

      const sessionData = {
        id: sessionId,
        user_id: userId,
        discipline,
        coach_type: coachType,
        session_type: prescription.type || discipline,
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

      const sessionData = {
        id: sessionId,
        user_id: userId,
        discipline,
        coach_type: coachType,
        session_type: prescription.type || discipline,
        status: 'draft',
        prescription: prescription,
        duration_target_min: prescription.durationTarget,
        exercises_total: prescription.exercises?.length || prescription.mainWorkout?.length || 0
      };

      const { error } = await supabase
        .from('training_sessions')
        .upsert(sessionData, { onConflict: 'id' });

      if (error) {
        logger.error('SESSION_PERSISTENCE', 'Failed to save draft', { error });
        throw error;
      }

      logger.info('SESSION_PERSISTENCE', 'Draft session saved', {
        sessionId,
        discipline,
        coachType
      });
    } catch (error) {
      logger.error('SESSION_PERSISTENCE', 'Error saving draft', { error, sessionId });
      throw error;
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
   */
  private determineCoachType(discipline: string): string {
    const enduranceTypes = ['running', 'cycling', 'swimming', 'triathlon', 'cardio'];
    if (enduranceTypes.includes(discipline)) {
      return 'coach-endurance';
    }

    const forceTypes = ['strength', 'powerlifting', 'bodybuilding', 'strongman'];
    if (forceTypes.includes(discipline)) {
      return 'coach-force';
    }

    return 'coach-force';
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

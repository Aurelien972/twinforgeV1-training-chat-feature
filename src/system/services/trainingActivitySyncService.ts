/**
 * Training Activity Sync Service
 * Service de synchronisation entre les sessions de training et les activités de la Forge Énergétique
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';
import type { SessionMetrics } from './trainingMetricsService';

export interface ActivityFromTraining {
  id: string;
  userId: string;
  type: string;
  durationMin: number;
  intensity: 'low' | 'medium' | 'high' | 'very_high';
  caloriesEst: number;
  notes?: string;
  timestamp: Date;
  trainingSessionId: string;
  trainingMetadata: {
    sessionId: string;
    discipline: string;
    sessionType: string;
    rpeAvg?: number;
    effortPerceived?: number;
    enjoyment?: number;
    venue?: string;
  };
}

export interface UnifiedActivityStats {
  totalCalories: number;
  totalDuration: number;
  activitiesCount: number;
  trainingSessionsCount: number;
  manualActivitiesCount: number;
  lastActivityTime?: Date;
  lastTrainingTime?: Date;
}

class TrainingActivitySyncService {
  private readonly DISCIPLINE_TO_ACTIVITY_TYPE: Record<string, string> = {
    strength: 'musculation',
    powerlifting: 'musculation',
    bodybuilding: 'musculation',
    strongman: 'musculation',
    functional: 'functional_training',
    crossfit: 'functional_training',
    hiit: 'functional_training',
    calisthenics: 'functional_training',
    running: 'course',
    trail: 'course',
    cycling: 'velo',
    biking: 'velo',
    swimming: 'natation',
    triathlon: 'triathlon',
    cardio: 'cardio',
  };

  /**
   * Synchronise manuellement une session complétée vers une activité
   * (Backup si le trigger DB échoue ou pour les anciennes sessions)
   */
  async syncCompletedSessionToActivity(sessionId: string): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error('TRAINING_ACTIVITY_SYNC', 'User not authenticated', { sessionId });
        return false;
      }

      // Récupérer la session
      const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (sessionError || !session) {
        logger.error('TRAINING_ACTIVITY_SYNC', 'Session not found', {
          sessionId,
          error: sessionError?.message,
        });
        return false;
      }

      // Vérifier que la session est complétée
      if (session.status !== 'completed' || !session.completed_at) {
        logger.warn('TRAINING_ACTIVITY_SYNC', 'Session not completed', {
          sessionId,
          status: session.status,
        });
        return false;
      }

      // Vérifier qu'une activité n'existe pas déjà
      const { data: existingActivity } = await supabase
        .from('activities')
        .select('id')
        .eq('training_session_id', sessionId)
        .maybeSingle();

      if (existingActivity) {
        logger.info('TRAINING_ACTIVITY_SYNC', 'Activity already exists for this session', {
          sessionId,
          activityId: existingActivity.id,
        });
        return true;
      }

      // Mapper la session vers une activité
      const activity = this.mapSessionToActivity(session);

      // Insérer l'activité
      const { data: createdActivity, error: insertError } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          type: activity.type,
          duration_min: activity.durationMin,
          intensity: activity.intensity,
          calories_est: activity.caloriesEst,
          notes: activity.notes,
          timestamp: activity.timestamp.toISOString(),
          training_session_id: sessionId,
          is_from_training: true,
          training_metadata: activity.trainingMetadata,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('TRAINING_ACTIVITY_SYNC', 'Failed to create activity', {
          sessionId,
          error: insertError.message,
        });
        return false;
      }

      logger.info('TRAINING_ACTIVITY_SYNC', 'Successfully synced session to activity', {
        sessionId,
        activityId: createdActivity.id,
      });

      return true;
    } catch (error) {
      logger.error('TRAINING_ACTIVITY_SYNC', 'Sync failed with exception', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Récupère l'activité liée à une session de training
   */
  async getActivityForSession(sessionId: string): Promise<ActivityFromTraining | null> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return null;
      }

      const { data: activity, error } = await supabase
        .from('activities')
        .select('*')
        .eq('training_session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !activity) {
        return null;
      }

      return {
        id: activity.id,
        userId: activity.user_id,
        type: activity.type,
        durationMin: activity.duration_min,
        intensity: activity.intensity,
        caloriesEst: activity.calories_est,
        notes: activity.notes,
        timestamp: new Date(activity.timestamp),
        trainingSessionId: activity.training_session_id,
        trainingMetadata: activity.training_metadata,
      };
    } catch (error) {
      logger.error('TRAINING_ACTIVITY_SYNC', 'Failed to get activity for session', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Récupère les statistiques unifiées (training + activités manuelles) pour une période
   */
  async getUnifiedActivityStats(
    startDate: Date,
    endDate: Date,
    includeTraining: boolean = true,
    includeManual: boolean = true
  ): Promise<UnifiedActivityStats> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return this.getEmptyStats();
      }

      // Construire la requête avec filtres
      let query = supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Appliquer les filtres sur l'origine des activités
      if (includeTraining && !includeManual) {
        query = query.eq('is_from_training', true);
      } else if (!includeTraining && includeManual) {
        query = query.eq('is_from_training', false);
      }

      const { data: activities, error } = await query;

      if (error || !activities) {
        logger.error('TRAINING_ACTIVITY_SYNC', 'Failed to get unified stats', {
          error: error?.message,
        });
        return this.getEmptyStats();
      }

      // Calculer les statistiques
      const stats = activities.reduce(
        (acc, activity) => {
          acc.totalCalories += activity.calories_est || 0;
          acc.totalDuration += activity.duration_min || 0;
          acc.activitiesCount += 1;

          if (activity.is_from_training) {
            acc.trainingSessionsCount += 1;
            const timestamp = new Date(activity.timestamp);
            if (!acc.lastTrainingTime || timestamp > acc.lastTrainingTime) {
              acc.lastTrainingTime = timestamp;
            }
          } else {
            acc.manualActivitiesCount += 1;
          }

          const timestamp = new Date(activity.timestamp);
          if (!acc.lastActivityTime || timestamp > acc.lastActivityTime) {
            acc.lastActivityTime = timestamp;
          }

          return acc;
        },
        {
          totalCalories: 0,
          totalDuration: 0,
          activitiesCount: 0,
          trainingSessionsCount: 0,
          manualActivitiesCount: 0,
          lastActivityTime: undefined as Date | undefined,
          lastTrainingTime: undefined as Date | undefined,
        }
      );

      return stats;
    } catch (error) {
      logger.error('TRAINING_ACTIVITY_SYNC', 'Failed to compute unified stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.getEmptyStats();
    }
  }

  /**
   * Récupère les sessions de training complétées pour une période
   */
  async getTrainingSessionsForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return [];
      }

      const { data: sessions, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: false });

      if (error || !sessions) {
        logger.error('TRAINING_ACTIVITY_SYNC', 'Failed to get training sessions', {
          error: error?.message,
        });
        return [];
      }

      return sessions;
    } catch (error) {
      logger.error('TRAINING_ACTIVITY_SYNC', 'Failed to fetch training sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Mapper une session de training vers une activité de la Forge
   */
  private mapSessionToActivity(session: any): Omit<ActivityFromTraining, 'id' | 'userId' | 'trainingSessionId'> {
    const discipline = session.discipline || session.session_type || 'strength';
    const durationMin = session.duration_actual || session.duration_target_min || 45;
    const rpeAvg = session.rpe_avg || 5;

    // Mapper le type d'activité
    const type = this.DISCIPLINE_TO_ACTIVITY_TYPE[discipline] || 'autre';

    // Calculer l'intensité basée sur RPE
    const intensity: 'low' | 'medium' | 'high' | 'very_high' =
      rpeAvg <= 4 ? 'low' : rpeAvg <= 6 ? 'medium' : rpeAvg <= 8 ? 'high' : 'very_high';

    // Estimer les calories
    const caloriesEst = this.estimateCalories(discipline, durationMin, rpeAvg);

    // Notes
    const notes = session.notes || 'Session générée automatiquement depuis l\'Atelier de Training';

    // Timestamp
    const timestamp = new Date(session.completed_at);

    // Métadonnées
    const trainingMetadata = {
      sessionId: session.id,
      discipline,
      sessionType: session.session_type,
      rpeAvg: session.rpe_avg,
      effortPerceived: session.effort_perceived,
      enjoyment: session.enjoyment,
      venue: session.venue,
    };

    return {
      type,
      durationMin,
      intensity,
      caloriesEst,
      notes,
      timestamp,
      trainingMetadata,
    };
  }

  /**
   * Estimer les calories brûlées selon la discipline, durée et RPE
   */
  private estimateCalories(discipline: string, durationMin: number, rpeAvg: number): number {
    let baseRate = 6; // Taux de base calories/minute

    // Ajuster selon la discipline
    if (['strength', 'powerlifting', 'bodybuilding', 'strongman'].includes(discipline)) {
      baseRate = 5;
    } else if (['functional', 'crossfit', 'hiit'].includes(discipline)) {
      baseRate = 8;
    } else if (['running', 'cycling', 'swimming', 'triathlon'].includes(discipline)) {
      baseRate = 10;
    }

    // Calculer avec un facteur RPE
    const rpeFactor = 1 + ((rpeAvg - 5) / 10);
    const estimated = Math.round(durationMin * baseRate * rpeFactor);

    // Limiter entre 0 et 2000
    return Math.max(0, Math.min(estimated, 2000));
  }

  /**
   * Retourne des stats vides
   */
  private getEmptyStats(): UnifiedActivityStats {
    return {
      totalCalories: 0,
      totalDuration: 0,
      activitiesCount: 0,
      trainingSessionsCount: 0,
      manualActivitiesCount: 0,
    };
  }
}

export const trainingActivitySyncService = new TrainingActivitySyncService();

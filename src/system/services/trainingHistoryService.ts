/**
 * Training History Service
 * Service pour gérer l'historique des sessions d'entraînement complétées
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';
import type {
  SessionHistoryDetail,
  HistoryStats,
  HistoryFilters
} from '../../domain/trainingToday';
import { trainingMetricsService } from './trainingMetricsService';

interface CompletedSession {
  id: string;
  type: string;
  session_type: string;
  discipline: string;
  completed_at: Date;
  duration_actual_min: number;
  duration_target_min: number;
  rpe_avg: number | null;
  effort_perceived: number | null;
  enjoyment: number | null;
  prescription: any;
  context: any;
  notes: string | null;
  venue: string | null;
  completion_actual: number | null;
}

class TrainingHistoryService {
  /**
   * Get paginated session history with filters
   * Only returns training_sessions (excludes manual activities from Forge)
   * @param filters - Filtres de période et type
   * @param page - Numéro de page
   * @param limit - Limite par page
   */
  async getSessionHistory(
    filters: HistoryFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ sessions: SessionHistoryDetail[]; totalCount: number; hasMore: boolean }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error('TRAINING_HISTORY', 'User not authenticated');
        return { sessions: [], totalCount: 0, hasMore: false };
      }

      // Build date filter based on period
      const now = new Date();
      let startDate: Date;

      switch (filters.period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          startDate = new Date(0); // Beginning of time
          break;
      }

      // Build query
      let query = supabase
        .from('training_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false });

      // Apply type filter
      if (filters.type && filters.type !== 'all') {
        query = query.or(`type.eq.${filters.type},session_type.eq.${filters.type}`);
      }

      // Apply discipline filter
      if (filters.discipline) {
        query = query.eq('discipline', filters.discipline);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      logger.info('TRAINING_HISTORY', 'Query executed', {
        filters,
        page,
        limit,
        dataLength: data?.length,
        count,
        error: error?.message,
        startDate: startDate.toISOString()
      });

      if (error) {
        logger.error('TRAINING_HISTORY', 'Failed to fetch session history', {
          error: error.message,
          filters
        });
        return { sessions: [], totalCount: 0, hasMore: false };
      }

      if (!data || data.length === 0) {
        logger.info('TRAINING_HISTORY', 'No sessions found', { filters, count });
        return { sessions: [], totalCount: 0, hasMore: false };
      }

      // Transform to SessionHistoryDetail format with metrics
      const sessions: SessionHistoryDetail[] = await Promise.all(
        data.map(async record => {
          const prescription = record.prescription || {};
          const exercises = prescription.exercises || [];

          // Extract metrics for discipline-specific data
          const metrics = trainingMetricsService.extractMetrics(record);

          // Determine discipline and exercise info
          const discipline = record.discipline || record.session_type || 'strength';
          const completed = record.status === 'completed';
          const totalExercises = exercises.length;
          const completedExercises = completed ? totalExercises : Math.floor((record.completion_actual || 0) / 100 * totalExercises);

          return {
            id: record.id,
            date: new Date(record.completed_at),
            type: (record.session_type || record.type) as any,
            duration: record.duration_actual_min || record.duration_target_min || 0,
            rpeAverage: record.rpe_avg || 0,
            completed,
            exercisesCompleted: completedExercises,
            exercisesTotal: totalExercises,
            effortPerceived: record.effort_perceived || 0,
            enjoyment: record.enjoyment || 0,
            location: record.venue,
            equipment: Array.isArray(record.equipment_needed) ? record.equipment_needed : [],
            totalVolume: metrics.volumeKg || metrics.distanceKm || this.calculateTotalVolume(exercises),
            avgIntensity: record.rpe_avg || 0,
            performanceScore: this.calculatePerformanceScore(record),
            notes: record.notes || '',
            exercises: exercises.map((ex: any) => ({
              id: ex.id || ex.exerciseId || '',
              name: ex.name || ex.exerciseName || '',
              sets: ex.sets,
              reps: ex.reps,
              load: ex.load,
              rpeTarget: ex.rpeTarget || ex.rpe,
              completed: true
            })),
            discipline,
            primaryMetric: metrics.volumeKg || metrics.distanceKm || 0,
            primaryMetricUnit: metrics.volumeKg ? 'kg' : (metrics.distanceKm ? 'km' : ''),
            secondaryMetric: metrics.maxWeight || (metrics.paceAvg ? parseFloat(metrics.paceAvg) : undefined)
          };
        })
      );

      const totalCount = count || 0;
      const hasMore = totalCount > offset + data.length;

      logger.info('TRAINING_HISTORY', 'Fetched session history', {
        count: sessions.length,
        totalCount,
        page,
        hasMore
      });

      return { sessions, totalCount, hasMore };
    } catch (error) {
      logger.error('TRAINING_HISTORY', 'Exception fetching session history', {
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        filters
      });
      console.error('TRAINING_HISTORY Exception:', error);
      return { sessions: [], totalCount: 0, hasMore: false };
    }
  }

  /**
   * Get history statistics
   */
  async getHistoryStats(filters: HistoryFilters): Promise<HistoryStats> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error('TRAINING_HISTORY', 'User not authenticated');
        return this.getEmptyStats();
      }

      // Build date filter
      const now = new Date();
      let startDate: Date;

      switch (filters.period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }

      let query = supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString());

      if (filters.type && filters.type !== 'all') {
        query = query.or(`type.eq.${filters.type},session_type.eq.${filters.type}`);
      }

      // Apply discipline filter
      if (filters.discipline) {
        query = query.eq('discipline', filters.discipline);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('TRAINING_HISTORY', 'Failed to fetch stats', {
          error: error.message
        });
        return this.getEmptyStats();
      }

      if (!data || data.length === 0) {
        return this.getEmptyStats();
      }

      // Calculate statistics
      const totalSessions = data.length;
      const totalMinutes = data.reduce((sum, s) => sum + (s.duration_actual_min || s.duration_target_min || 0), 0);
      const avgRpe = totalSessions > 0 ? data.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / totalSessions : 0;
      const avgDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

      // Calculate streak
      const sortedSessions = [...data]
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

      let currentStreak = 0;
      const oneDayMs = 24 * 60 * 60 * 1000;

      for (let i = 0; i < sortedSessions.length; i++) {
        const sessionDate = new Date(sortedSessions[i].completed_at);
        const daysDiff = Math.floor((now.getTime() - sessionDate.getTime()) / oneDayMs);

        if (i === 0 && daysDiff <= 2) {
          currentStreak = 1;
        } else if (i > 0) {
          const prevSessionDate = new Date(sortedSessions[i - 1].completed_at);
          const daysBetween = Math.floor((prevSessionDate.getTime() - sessionDate.getTime()) / oneDayMs);

          if (daysBetween <= 3) {
            currentStreak++;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      // Calculate discipline-specific aggregated metrics
      let volumeKg = 0;
      let maxWeight = 0;
      let distanceKm = 0;
      let paceCount = 0;
      let paceSum = 0;

      data.forEach(session => {
        const metrics = trainingMetricsService.extractMetrics(session);

        if (metrics.volumeKg) volumeKg += metrics.volumeKg;
        if (metrics.maxWeight && metrics.maxWeight > maxWeight) maxWeight = metrics.maxWeight;
        if (metrics.distanceKm) distanceKm += metrics.distanceKm;
        if (metrics.paceAvg) {
          const paceMinutes = this.parsePaceToMinutes(metrics.paceAvg);
          if (paceMinutes) {
            paceSum += paceMinutes;
            paceCount++;
          }
        }
      });

      const avgPaceMinutes = paceCount > 0 ? paceSum / paceCount : 0;
      const avgPace = avgPaceMinutes > 0 ? this.formatMinutesToPace(avgPaceMinutes) : undefined;

      const stats: HistoryStats = {
        totalSessions,
        totalMinutes,
        avgRpe: Number(avgRpe.toFixed(1)),
        avgDuration,
        currentStreak,
        completionRate: 100,
        periodLabel: this.getPeriodLabel(filters.period),
        volumeKg: volumeKg > 0 ? Math.round(volumeKg) : undefined,
        maxWeight: maxWeight > 0 ? Math.round(maxWeight) : undefined,
        distanceKm: distanceKm > 0 ? Math.round(distanceKm * 10) / 10 : undefined,
        avgPace
      };

      logger.info('TRAINING_HISTORY', 'Calculated stats', stats);

      return stats;
    } catch (error) {
      logger.error('TRAINING_HISTORY', 'Exception calculating stats', {
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      console.error('TRAINING_HISTORY Stats Exception:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Helper: Calculate total volume from exercises
   */
  private calculateTotalVolume(exercises: any[]): number {
    return exercises.reduce((total, ex) => {
      const sets = ex.sets || 0;
      const reps = ex.reps || 0;
      const load = typeof ex.load === 'number' ? ex.load : 0;
      return total + (sets * reps * load);
    }, 0);
  }

  /**
   * Helper: Calculate performance score
   */
  private calculatePerformanceScore(record: any): number {
    const completionPct = record.completion_actual || 100;
    const targetRpe = 7.5;
    const actualRpe = record.rpe_avg || targetRpe;
    const rpeDeviation = Math.abs(actualRpe - targetRpe);
    const rpeScore = Math.max(0, 10 - rpeDeviation);

    return Math.round((completionPct / 100) * rpeScore);
  }

  /**
   * Helper: Get period label for stats
   */
  private getPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      week: 'Cette semaine',
      month: 'Ce mois',
      quarter: 'Ce trimestre',
      year: 'Cette année',
      all: 'Tout l\'historique'
    };
    return labels[period] || labels.all;
  }

  /**
   * Helper: Get empty stats object
   */
  private getEmptyStats(): HistoryStats {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      avgRpe: 0,
      avgDuration: 0,
      currentStreak: 0,
      completionRate: 0,
      periodLabel: 'Aucune donnée'
    };
  }

  /**
   * Helper: Parse pace string to minutes (e.g. "5:30" -> 5.5)
   */
  private parsePaceToMinutes(pace: string): number | null {
    const match = pace.match(/(\d+):(\d+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      return minutes + seconds / 60;
    }
    return null;
  }

  /**
   * Helper: Format minutes to pace string (e.g. 5.5 -> "5:30")
   */
  private formatMinutesToPace(minutes: number): string {
    const min = Math.floor(minutes);
    const sec = Math.round((minutes - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }
}

export const trainingHistoryService = new TrainingHistoryService();

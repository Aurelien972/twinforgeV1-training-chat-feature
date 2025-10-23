/**
 * Training Progression Service
 * Real data service for progression metrics and long-term evolution
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';
import { subDays, subWeeks, addDays, format } from 'date-fns';
import { trainingMetricsService } from './trainingMetricsService';
import type {
  ProgressionTabData,
  UserLevel,
  Achievement,
  Milestone,
  VolumeDataPoint,
  StrengthEvolution,
  ConsistencyCalendar,
  CalendarDay,
  PersonalRecord,
  MonthlyComparison,
  MonthlyStats,
  YearlyComparison,
  RPEDistribution,
  IntensityVolumePoint,
  RecoveryTrend,
  ProgressionPrediction,
  ProgressionQuest,
  ProgressionFilters
} from '../../domain/trainingProgression';

class TrainingProgressionService {
  private cache: Map<string, { data: ProgressionTabData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  /**
   * Get complete progression tab data
   * @param filters - Filtres incluant la période et l'option d'inclusion des activités manuelles
   * @param includeManualActivities - Inclure les activités manuelles de la Forge dans les stats (default: true)
   */
  async getProgressionData(
    filters: ProgressionFilters = { period: '3months' },
    includeManualActivities: boolean = true
  ): Promise<ProgressionTabData> {
    const cacheKey = JSON.stringify({ ...filters, includeManualActivities });
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error('PROGRESSION', 'User not authenticated');
      return this.getEmptyProgressionData();
    }

    const [
      userLevel,
      achievements,
      milestones,
      activeQuests,
      volumeProgression,
      strengthEvolution,
      consistencyCalendar,
      personalRecords,
      monthlyComparison,
      yearlyComparison,
      rpeDistribution,
      intensityVolumeData,
      recoveryTrends,
      predictions
    ] = await Promise.all([
      this.getUserLevel(user.id),
      this.getAchievements(user.id),
      this.getMilestones(user.id),
      this.getActiveQuests(user.id),
      this.getVolumeProgression(user.id, filters.period),
      this.getStrengthEvolution(user.id, filters.period),
      this.getConsistencyCalendar(user.id, filters.period === '1month' ? 30 : filters.period === '3months' ? 90 : 180),
      this.getPersonalRecords(user.id),
      this.getMonthlyComparison(user.id),
      this.getYearlyComparison(user.id),
      this.getRPEDistribution(user.id),
      this.getIntensityVolumeData(user.id),
      this.getRecoveryTrends(user.id),
      this.getProgressionPredictions(user.id)
    ]);

    const summary = {
      totalSessions: consistencyCalendar.stats.activeDays,
      totalVolume: volumeProgression.reduce((sum, v) => sum + v.totalVolume, 0),
      totalDuration: 0,
      achievementsUnlocked: achievements.filter(a => a.isUnlocked).length,
      milestonesCompleted: milestones.filter(m => m.isCompleted).length,
      currentStreak: consistencyCalendar.stats.currentStreak,
      longestStreak: consistencyCalendar.stats.longestStreak,
      recordsSet: personalRecords.length
    };

    const data: ProgressionTabData = {
      userLevel,
      achievements,
      milestones,
      activeQuests,
      volumeProgression,
      strengthEvolution,
      consistencyCalendar,
      personalRecords,
      monthlyComparison,
      yearlyComparison,
      rpeDistribution,
      intensityVolumeData,
      recoveryTrends,
      predictions,
      summary
    };

    this.cache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  }

  /**
   * Get user level and XP data based on completed sessions
   */
  async getUserLevel(userId: string): Promise<UserLevel> {
    const { count } = await supabase
      .from('training_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    const totalXP = (count || 0) * 50;
    const currentLevel = Math.floor(totalXP / 1000) + 1;
    const xpForNextLevel = currentLevel * 1000;
    const currentXP = totalXP % 1000;

    return {
      currentLevel,
      currentXP,
      xpForNextLevel,
      xpProgress: (currentXP / xpForNextLevel) * 100,
      totalXP,
      levelTitle: this.getLevelTitle(currentLevel)
    };
  }

  /**
   * Get level title based on level number
   */
  private getLevelTitle(level: number): string {
    const levelTitles = [
      'Novice',
      'Apprenti',
      'Pratiquant',
      'Régulier',
      'Dévoué',
      'Expert',
      'Vétéran',
      'Maître',
      'Champion',
      'Légende'
    ];
    return levelTitles[Math.min(level, levelTitles.length - 1)];
  }

  /**
   * Get volume progression data over time
   */
  async getVolumeProgression(userId: string, period: string): Promise<VolumeDataPoint[]> {
    const weeks = period === '1month' ? 4 : period === '3months' ? 12 : 24;
    const now = new Date();
    const dataPoints: VolumeDataPoint[] = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = subWeeks(now, weeks - i - 1);
      const weekEnd = addDays(weekStart, 7);

      const { data: sessions } = await supabase
        .from('training_sessions')
        .select('*, training_metrics(volume_kg, distance_km)')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', weekStart.toISOString())
        .lt('completed_at', weekEnd.toISOString());

      const totalVolume = sessions?.reduce((sum, s) => {
        const metrics = s.training_metrics?.[0];
        return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
      }, 0) || 0;

      dataPoints.push({
        weekLabel: `S${i + 1}`,
        weekNumber: i + 1,
        totalVolume: Math.round(totalVolume),
        sessionsCount: sessions?.length || 0,
        avgVolumePerSession: sessions && sessions.length > 0
          ? Math.round(totalVolume / sessions.length)
          : 0,
        startDate: weekStart,
        endDate: weekEnd
      });
    }

    return dataPoints;
  }

  /**
   * Get personal records
   */
  async getPersonalRecords(userId: string, discipline?: string): Promise<PersonalRecord[]> {
    let query = supabase
      .from('training_personal_records')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false })
      .limit(10);

    if (discipline) {
      query = query.eq('discipline', discipline);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map(record => ({
      id: record.id,
      exerciseName: record.exercise_name,
      muscleGroup: this.getMuscleGroupFromExercise(record.exercise_name),
      recordType: record.record_type,
      value: record.value,
      unit: record.unit,
      achievedAt: new Date(record.achieved_at),
      previousRecord: record.previous_record,
      improvement: record.improvement,
      color: this.getColorForDiscipline(record.discipline)
    }));
  }

  /**
   * Get consistency calendar
   */
  async getConsistencyCalendar(userId: string, days: number): Promise<ConsistencyCalendar> {
    const now = new Date();
    const startDate = subDays(now, days - 1);

    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('completed_at, rpe_avg, training_metrics(volume_kg, distance_km)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString());

    const sessionsByDay = new Map<string, any[]>();
    sessions?.forEach(s => {
      const day = format(new Date(s.completed_at), 'yyyy-MM-dd');
      if (!sessionsByDay.has(day)) {
        sessionsByDay.set(day, []);
      }
      sessionsByDay.get(day)!.push(s);
    });

    const calendarDays: CalendarDay[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      const dayKey = format(date, 'yyyy-MM-dd');
      const daySessions = sessionsByDay.get(dayKey) || [];

      calendarDays.push({
        date,
        hasSession: daySessions.length > 0,
        sessionsCount: daySessions.length,
        totalVolume: Math.round(daySessions.reduce((sum, s) =>
          sum + (s.training_metrics?.[0]?.volume_kg || s.training_metrics?.[0]?.distance_km || 0), 0
        )),
        avgRPE: daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / daySessions.length
          : 0,
        intensity: this.calculateIntensity(daySessions)
      });
    }

    const activeDays = calendarDays.filter(d => d.hasSession).length;
    const currentStreak = this.calculateCurrentStreak(calendarDays);
    const longestStreak = this.calculateLongestStreak(calendarDays);

    return {
      startDate,
      endDate: now,
      days: calendarDays,
      stats: {
        totalDays: days,
        activeDays,
        consistencyPercentage: Math.round((activeDays / days) * 100),
        currentStreak,
        longestStreak
      }
    };
  }

  /**
   * Calculate current streak
   */
  private calculateCurrentStreak(days: CalendarDay[]): number {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].hasSession) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * Calculate longest streak
   */
  private calculateLongestStreak(days: CalendarDay[]): number {
    let longest = 0;
    let current = 0;

    for (const day of days) {
      if (day.hasSession) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    return longest;
  }

  /**
   * Calculate intensity from sessions
   */
  private calculateIntensity(sessions: any[]): 'none' | 'light' | 'moderate' | 'high' {
    if (sessions.length === 0) return 'none';

    const avgRPE = sessions.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / sessions.length;

    if (avgRPE < 6.5) return 'light';
    if (avgRPE < 8) return 'moderate';
    return 'high';
  }

  /**
   * Get muscle group from exercise name
   */
  private getMuscleGroupFromExercise(exerciseName: string): string {
    const lowerName = exerciseName.toLowerCase();

    if (lowerName.includes('squat') || lowerName.includes('leg')) return 'Jambes';
    if (lowerName.includes('bench') || lowerName.includes('pec')) return 'Pecs';
    if (lowerName.includes('row') || lowerName.includes('pull') || lowerName.includes('lat')) return 'Dos';
    if (lowerName.includes('press') && (lowerName.includes('shoulder') || lowerName.includes('military'))) return 'Épaules';
    if (lowerName.includes('deadlift')) return 'Dos';

    return 'Autre';
  }

  /**
   * Get color for discipline
   */
  private getColorForDiscipline(discipline: string): string {
    const colorMap: Record<string, string> = {
      strength: '#18E3FF',
      powerlifting: '#8B5CF6',
      bodybuilding: '#22C55E',
      running: '#F59E0B',
      cycling: '#EF4444',
      swimming: '#3B82F6'
    };

    return colorMap[discipline] || '#18E3FF';
  }

  /**
   * Placeholder methods for features not yet fully implemented
   */
  private async getAchievements(userId: string): Promise<Achievement[]> {
    return [];
  }

  private async getMilestones(userId: string): Promise<Milestone[]> {
    return [];
  }

  private async getActiveQuests(userId: string): Promise<ProgressionQuest[]> {
    return [];
  }

  private async getStrengthEvolution(userId: string, period: string): Promise<StrengthEvolution[]> {
    return [];
  }

  private async getMonthlyComparison(userId: string): Promise<MonthlyComparison> {
    const now = new Date();
    const currentMonth: MonthlyStats = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      monthLabel: format(now, 'MMMM yyyy'),
      totalSessions: 0,
      totalVolume: 0,
      totalDuration: 0,
      avgRPE: 0,
      newRecords: 0,
      consistencyPercentage: 0
    };

    const previousMonth: MonthlyStats = {
      year: now.getFullYear(),
      month: now.getMonth(),
      monthLabel: format(subDays(now, 30), 'MMMM yyyy'),
      totalSessions: 0,
      totalVolume: 0,
      totalDuration: 0,
      avgRPE: 0,
      newRecords: 0,
      consistencyPercentage: 0
    };

    return {
      currentMonth,
      previousMonth,
      changes: {
        sessions: { value: 0, percentage: 0 },
        volume: { value: 0, percentage: 0 },
        duration: { value: 0, percentage: 0 },
        rpe: { value: 0, percentage: 0 },
        consistency: { value: 0, percentage: 0 }
      }
    };
  }

  private async getYearlyComparison(userId: string): Promise<YearlyComparison | null> {
    return null;
  }

  private async getRPEDistribution(userId: string): Promise<RPEDistribution[]> {
    return [];
  }

  private async getIntensityVolumeData(userId: string): Promise<IntensityVolumePoint[]> {
    return [];
  }

  private async getRecoveryTrends(userId: string): Promise<RecoveryTrend[]> {
    return [];
  }

  private async getProgressionPredictions(userId: string): Promise<ProgressionPrediction[]> {
    return [];
  }

  /**
   * Get empty progression data
   */
  private getEmptyProgressionData(): ProgressionTabData {
    return {
      userLevel: {
        currentLevel: 1,
        currentXP: 0,
        xpForNextLevel: 1000,
        xpProgress: 0,
        totalXP: 0,
        levelTitle: 'Novice'
      },
      achievements: [],
      milestones: [],
      activeQuests: [],
      volumeProgression: [],
      strengthEvolution: [],
      consistencyCalendar: {
        startDate: new Date(),
        endDate: new Date(),
        days: [],
        stats: {
          totalDays: 0,
          activeDays: 0,
          consistencyPercentage: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      },
      personalRecords: [],
      monthlyComparison: {
        currentMonth: {
          year: 2025,
          month: 10,
          monthLabel: 'Octobre 2025',
          totalSessions: 0,
          totalVolume: 0,
          totalDuration: 0,
          avgRPE: 0,
          newRecords: 0,
          consistencyPercentage: 0
        },
        previousMonth: {
          year: 2025,
          month: 9,
          monthLabel: 'Septembre 2025',
          totalSessions: 0,
          totalVolume: 0,
          totalDuration: 0,
          avgRPE: 0,
          newRecords: 0,
          consistencyPercentage: 0
        },
        changes: {
          sessions: { value: 0, percentage: 0 },
          volume: { value: 0, percentage: 0 },
          duration: { value: 0, percentage: 0 },
          rpe: { value: 0, percentage: 0 },
          consistency: { value: 0, percentage: 0 }
        }
      },
      yearlyComparison: null,
      rpeDistribution: [],
      intensityVolumeData: [],
      recoveryTrends: [],
      predictions: [],
      summary: {
        totalSessions: 0,
        totalVolume: 0,
        totalDuration: 0,
        achievementsUnlocked: 0,
        milestonesCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        recordsSet: 0
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const trainingProgressionService = new TrainingProgressionService();

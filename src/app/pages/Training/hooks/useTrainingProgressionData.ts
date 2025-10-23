/**
 * useTrainingProgressionData Hook
 * Hook for fetching real training progression data from training_sessions
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../system/supabase/client';
import { useUserStore } from '../../../../system/store/userStore';
import { subWeeks, subMonths, subDays, addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import logger from '../../../../lib/utils/logger';

export type ProgressionPeriod = 'week' | 'month' | 'quarter';

interface WeeklyVolumeData {
  weekLabel: string;
  weekNumber: number;
  totalVolume: number;
  sessionsCount: number;
  avgVolumePerSession: number;
  avgRPE: number;
  totalDuration: number;
  startDate: Date;
  endDate: Date;
}

interface ProgressionStats {
  totalSessions: number;
  totalVolume: number;
  totalDuration: number;
  avgRPE: number;
  currentWeekSessions: number;
  previousWeekSessions: number;
  sessionsChange: number;
  volumeChange: number;
  currentWeekVolume: number;
  avgWeekVolume: number;
}

interface ConsistencyDay {
  date: Date;
  hasSession: boolean;
  sessionsCount: number;
  totalVolume: number;
  avgRPE: number;
  intensity: 'none' | 'light' | 'moderate' | 'high';
}

interface ConsistencyStats {
  totalDays: number;
  activeDays: number;
  consistencyPercentage: number;
  currentStreak: number;
  longestStreak: number;
}

interface PersonalRecord {
  id: string;
  exerciseName: string;
  recordType: 'max_weight' | 'max_volume' | 'max_distance' | 'max_duration';
  value: number;
  unit: string;
  achievedAt: Date;
  improvement: number;
  discipline: string;
}

export interface TrainingProgressionData {
  volumeProgression: WeeklyVolumeData[];
  stats: ProgressionStats;
  consistencyDays: ConsistencyDay[];
  consistencyStats: ConsistencyStats;
  personalRecords: PersonalRecord[];
  period: ProgressionPeriod;
}

async function fetchProgressionData(
  userId: string,
  period: ProgressionPeriod
): Promise<TrainingProgressionData> {
  const weeks = period === 'week' ? 4 : period === 'month' ? 12 : 24;
  const days = period === 'week' ? 30 : period === 'month' ? 90 : 180;
  const now = new Date();
  const startDate = period === 'week' ? subWeeks(now, weeks) : period === 'month' ? subMonths(now, 3) : subMonths(now, 6);

  // Fetch training sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('training_sessions')
    .select(`
      id,
      completed_at,
      duration_actual_min,
      rpe_avg,
      discipline,
      status,
      training_metrics (
        volume_kg,
        distance_km,
        reps_total
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', startDate.toISOString())
    .order('completed_at', { ascending: true });

  if (sessionsError) {
    logger.error('TRAINING_PROGRESSION', 'Failed to fetch sessions', { error: sessionsError });
    throw new Error('Failed to fetch training sessions');
  }

  const completedSessions = sessions || [];

  // Calculate weekly volume progression
  const volumeProgression: WeeklyVolumeData[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = subWeeks(now, weeks - i);
    const weekEnd = addDays(weekStart, 7);

    const weekSessions = completedSessions.filter(s => {
      const sessionDate = new Date(s.completed_at);
      return sessionDate >= weekStart && sessionDate < weekEnd;
    });

    const totalVolume = weekSessions.reduce((sum, s) => {
      const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
      return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
    }, 0);

    const totalDuration = weekSessions.reduce((sum, s) => sum + (s.duration_actual_min || 0), 0);
    const avgRPE = weekSessions.length > 0
      ? weekSessions.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / weekSessions.length
      : 0;

    volumeProgression.push({
      weekLabel: `S${i + 1}`,
      weekNumber: i + 1,
      totalVolume: Math.round(totalVolume),
      sessionsCount: weekSessions.length,
      avgVolumePerSession: weekSessions.length > 0 ? Math.round(totalVolume / weekSessions.length) : 0,
      avgRPE: Math.round(avgRPE * 10) / 10,
      totalDuration,
      startDate: weekStart,
      endDate: weekEnd
    });
  }

  // Calculate progression stats
  const totalSessions = completedSessions.length;
  const totalVolume = completedSessions.reduce((sum, s) => {
    const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
    return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
  }, 0);
  const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration_actual_min || 0), 0);
  const avgRPE = totalSessions > 0
    ? completedSessions.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / totalSessions
    : 0;

  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const previousWeekStart = subWeeks(currentWeekStart, 1);
  const previousWeekEnd = subWeeks(currentWeekEnd, 1);

  const currentWeekSessions = completedSessions.filter(s => {
    const sessionDate = new Date(s.completed_at);
    return sessionDate >= currentWeekStart && sessionDate <= currentWeekEnd;
  });

  const previousWeekSessions = completedSessions.filter(s => {
    const sessionDate = new Date(s.completed_at);
    return sessionDate >= previousWeekStart && sessionDate <= previousWeekEnd;
  });

  const currentWeekVolume = currentWeekSessions.reduce((sum, s) => {
    const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
    return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
  }, 0);

  const previousWeekVolume = previousWeekSessions.reduce((sum, s) => {
    const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
    return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
  }, 0);

  const sessionsChange = previousWeekSessions.length > 0
    ? ((currentWeekSessions.length - previousWeekSessions.length) / previousWeekSessions.length) * 100
    : 0;

  const volumeChange = previousWeekVolume > 0
    ? ((currentWeekVolume - previousWeekVolume) / previousWeekVolume) * 100
    : 0;

  const avgWeekVolume = volumeProgression.length > 0
    ? volumeProgression.reduce((sum, w) => sum + w.totalVolume, 0) / volumeProgression.length
    : 0;

  const stats: ProgressionStats = {
    totalSessions,
    totalVolume: Math.round(totalVolume),
    totalDuration,
    avgRPE: Math.round(avgRPE * 10) / 10,
    currentWeekSessions: currentWeekSessions.length,
    previousWeekSessions: previousWeekSessions.length,
    sessionsChange: Math.round(sessionsChange),
    volumeChange: Math.round(volumeChange),
    currentWeekVolume: Math.round(currentWeekVolume),
    avgWeekVolume: Math.round(avgWeekVolume)
  };

  // Calculate consistency calendar
  const consistencyStartDate = subDays(now, days - 1);
  const sessionsByDay = new Map<string, any[]>();

  completedSessions.forEach(s => {
    const dayKey = format(new Date(s.completed_at), 'yyyy-MM-dd');
    if (!sessionsByDay.has(dayKey)) {
      sessionsByDay.set(dayKey, []);
    }
    sessionsByDay.get(dayKey)!.push(s);
  });

  const consistencyDays: ConsistencyDay[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(consistencyStartDate, i);
    const dayKey = format(date, 'yyyy-MM-dd');
    const daySessions = sessionsByDay.get(dayKey) || [];

    const totalVolume = daySessions.reduce((sum, s) => {
      const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
      return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
    }, 0);

    const avgRPE = daySessions.length > 0
      ? daySessions.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / daySessions.length
      : 0;

    let intensity: 'none' | 'light' | 'moderate' | 'high' = 'none';
    if (daySessions.length > 0) {
      if (avgRPE < 6.5) intensity = 'light';
      else if (avgRPE < 8) intensity = 'moderate';
      else intensity = 'high';
    }

    consistencyDays.push({
      date,
      hasSession: daySessions.length > 0,
      sessionsCount: daySessions.length,
      totalVolume: Math.round(totalVolume),
      avgRPE: Math.round(avgRPE * 10) / 10,
      intensity
    });
  }

  // Calculate consistency stats
  const activeDays = consistencyDays.filter(d => d.hasSession).length;
  let currentStreak = 0;
  for (let i = consistencyDays.length - 1; i >= 0; i--) {
    if (consistencyDays[i].hasSession) {
      currentStreak++;
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let tempStreak = 0;
  for (const day of consistencyDays) {
    if (day.hasSession) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  const consistencyStats: ConsistencyStats = {
    totalDays: days,
    activeDays,
    consistencyPercentage: Math.round((activeDays / days) * 100),
    currentStreak,
    longestStreak
  };

  // Fetch personal records
  const { data: records, error: recordsError } = await supabase
    .from('training_personal_records')
    .select('*')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false })
    .limit(10);

  const personalRecords: PersonalRecord[] = (records || []).map(r => ({
    id: r.id,
    exerciseName: r.exercise_name,
    recordType: r.record_type,
    value: r.value,
    unit: r.unit,
    achievedAt: new Date(r.achieved_at),
    improvement: r.improvement || 0,
    discipline: r.discipline
  }));

  return {
    volumeProgression,
    stats,
    consistencyDays,
    consistencyStats,
    personalRecords,
    period
  };
}

export function useTrainingProgressionData(period: ProgressionPeriod = 'month') {
  const { session } = useUserStore();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['training-progression', userId, period],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return fetchProgressionData(userId, period);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

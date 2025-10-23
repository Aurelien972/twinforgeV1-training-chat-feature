/**
 * useTrainingHistoryData Hook
 * Hook for fetching training history with filters and pagination
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../system/supabase/client';
import { useUserStore } from '../../../../system/store/userStore';
import { subMonths, subWeeks } from 'date-fns';
import logger from '../../../../lib/utils/logger';

export type HistoryPeriod = 'week' | 'month' | 'quarter' | 'all';
export type HistoryDiscipline = 'all' | 'force' | 'endurance' | 'calisthenics' | 'functional' | 'competitions';

interface HistorySession {
  id: string;
  discipline: string;
  completed_at: string;
  duration_actual_min: number;
  rpe_avg: number;
  volume_kg?: number;
  distance_km?: number;
  exercises_count: number;
  location_name?: string;
}

interface HistoryStats {
  totalSessions: number;
  totalVolume: number;
  totalDuration: number;
  avgRPE: number;
  disciplineBreakdown: Record<string, number>;
}

export interface TrainingHistoryData {
  sessions: HistorySession[];
  stats: HistoryStats;
  hasMore: boolean;
  total: number;
}

async function fetchHistoryData(
  userId: string,
  period: HistoryPeriod,
  discipline: HistoryDiscipline,
  page: number = 0,
  pageSize: number = 20
): Promise<TrainingHistoryData> {
  const now = new Date();
  let startDate: Date | null = null;

  switch (period) {
    case 'week':
      startDate = subWeeks(now, 1);
      break;
    case 'month':
      startDate = subMonths(now, 1);
      break;
    case 'quarter':
      startDate = subMonths(now, 3);
      break;
    case 'all':
      startDate = null;
      break;
  }

  let query = supabase
    .from('training_sessions')
    .select(`
      id,
      discipline,
      completed_at,
      duration_actual_min,
      rpe_avg,
      exercises_tracked,
      training_metrics (
        volume_kg,
        distance_km
      ),
      training_locations (
        name
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (startDate) {
    query = query.gte('completed_at', startDate.toISOString());
  }

  if (discipline !== 'all') {
    query = query.eq('discipline', discipline);
  }

  query = query
    .order('completed_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data: sessions, error: sessionsError, count } = await query;

  if (sessionsError) {
    logger.error('TRAINING_HISTORY', 'Failed to fetch sessions', { error: sessionsError });
    throw new Error('Failed to fetch training history');
  }

  const completedSessions = sessions || [];
  const total = count || 0;
  const hasMore = total > (page + 1) * pageSize;

  const historySessions: HistorySession[] = completedSessions.map(s => {
    const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
    const location = Array.isArray(s.training_locations) ? s.training_locations[0] : s.training_locations;

    return {
      id: s.id,
      discipline: s.discipline,
      completed_at: s.completed_at,
      duration_actual_min: s.duration_actual_min,
      rpe_avg: s.rpe_avg,
      volume_kg: metrics?.volume_kg,
      distance_km: metrics?.distance_km,
      exercises_count: Array.isArray(s.exercises_tracked) ? s.exercises_tracked.length : 0,
      location_name: location?.name
    };
  });

  // Calculate stats for all matching sessions (not just current page)
  let statsQuery = supabase
    .from('training_sessions')
    .select(`
      id,
      discipline,
      duration_actual_min,
      rpe_avg,
      training_metrics (
        volume_kg,
        distance_km
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (startDate) {
    statsQuery = statsQuery.gte('completed_at', startDate.toISOString());
  }

  if (discipline !== 'all') {
    statsQuery = statsQuery.eq('discipline', discipline);
  }

  const { data: allSessions, error: statsError } = await statsQuery;

  if (statsError) {
    logger.error('TRAINING_HISTORY', 'Failed to fetch stats', { error: statsError });
  }

  const statsSessionsData = allSessions || [];
  const totalVolume = statsSessionsData.reduce((sum, s) => {
    const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
    return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
  }, 0);

  const totalDuration = statsSessionsData.reduce((sum, s) => sum + (s.duration_actual_min || 0), 0);
  const avgRPE = statsSessionsData.length > 0
    ? statsSessionsData.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / statsSessionsData.length
    : 0;

  const disciplineBreakdown: Record<string, number> = {};
  statsSessionsData.forEach(s => {
    disciplineBreakdown[s.discipline] = (disciplineBreakdown[s.discipline] || 0) + 1;
  });

  const stats: HistoryStats = {
    totalSessions: statsSessionsData.length,
    totalVolume: Math.round(totalVolume),
    totalDuration,
    avgRPE: Math.round(avgRPE * 10) / 10,
    disciplineBreakdown
  };

  return {
    sessions: historySessions,
    stats,
    hasMore,
    total
  };
}

export function useTrainingHistoryData(
  period: HistoryPeriod = 'month',
  discipline: HistoryDiscipline = 'all',
  page: number = 0
) {
  const { session } = useUserStore();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['training-history', userId, period, discipline, page],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return fetchHistoryData(userId, period, discipline, page);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

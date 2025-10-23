/**
 * useTrainingTodayData Hook
 * Hook for fetching today's training data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../system/supabase/client';
import { useUserStore } from '../../../../system/store/userStore';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import logger from '../../../../lib/utils/logger';

interface DraftSession {
  id: string;
  discipline: string;
  created_at: string;
  updated_at: string;
  location_name?: string;
}

interface CurrentGoal {
  id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  target_date: string;
  is_active: boolean;
}

interface WeekStats {
  sessionsCount: number;
  totalVolume: number;
  totalDuration: number;
  avgRPE: number;
}

interface LastSession {
  id: string;
  discipline: string;
  completed_at: string;
  duration_actual_min: number;
  rpe_avg: number;
}

export interface TrainingTodayData {
  draftSessions: DraftSession[];
  currentGoals: CurrentGoal[];
  weekStats: WeekStats;
  lastSession: LastSession | null;
  hasCompletedToday: boolean;
}

async function fetchTodayData(userId: string): Promise<TrainingTodayData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Fetch draft sessions
  const { data: drafts, error: draftsError } = await supabase
    .from('training_sessions')
    .select(`
      id,
      discipline,
      created_at,
      updated_at,
      training_locations (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (draftsError) {
    logger.error('TRAINING_TODAY', 'Failed to fetch drafts', { error: draftsError });
  }

  const draftSessions: DraftSession[] = (drafts || []).map(d => ({
    id: d.id,
    discipline: d.discipline,
    created_at: d.created_at,
    updated_at: d.updated_at,
    location_name: Array.isArray(d.training_locations) ? d.training_locations[0]?.name : d.training_locations?.name
  }));

  // Fetch active goals
  const { data: goals, error: goalsError } = await supabase
    .from('training_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(3);

  if (goalsError) {
    logger.error('TRAINING_TODAY', 'Failed to fetch goals', { error: goalsError });
  }

  const currentGoals: CurrentGoal[] = (goals || []).map(g => ({
    id: g.id,
    goal_type: g.goal_type,
    target_value: g.target_value,
    current_value: g.current_value,
    target_date: g.target_date,
    is_active: g.is_active
  }));

  // Fetch week stats
  const { data: weekSessions, error: weekError } = await supabase
    .from('training_sessions')
    .select(`
      id,
      duration_actual_min,
      rpe_avg,
      training_metrics (
        volume_kg,
        distance_km
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', weekStart.toISOString())
    .lte('completed_at', weekEnd.toISOString());

  if (weekError) {
    logger.error('TRAINING_TODAY', 'Failed to fetch week stats', { error: weekError });
  }

  const completedWeekSessions = weekSessions || [];
  const totalVolume = completedWeekSessions.reduce((sum, s) => {
    const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
    return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
  }, 0);

  const totalDuration = completedWeekSessions.reduce((sum, s) => sum + (s.duration_actual_min || 0), 0);
  const avgRPE = completedWeekSessions.length > 0
    ? completedWeekSessions.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / completedWeekSessions.length
    : 0;

  const weekStats: WeekStats = {
    sessionsCount: completedWeekSessions.length,
    totalVolume: Math.round(totalVolume),
    totalDuration,
    avgRPE: Math.round(avgRPE * 10) / 10
  };

  // Check if completed today
  const { data: todaySessions, error: todayError } = await supabase
    .from('training_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', todayStart.toISOString())
    .lte('completed_at', todayEnd.toISOString())
    .limit(1);

  if (todayError) {
    logger.error('TRAINING_TODAY', 'Failed to check today sessions', { error: todayError });
  }

  const hasCompletedToday = (todaySessions || []).length > 0;

  // Fetch last completed session
  const { data: lastSessionData, error: lastError } = await supabase
    .from('training_sessions')
    .select('id, discipline, completed_at, duration_actual_min, rpe_avg')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastError) {
    logger.error('TRAINING_TODAY', 'Failed to fetch last session', { error: lastError });
  }

  const lastSession: LastSession | null = lastSessionData ? {
    id: lastSessionData.id,
    discipline: lastSessionData.discipline,
    completed_at: lastSessionData.completed_at,
    duration_actual_min: lastSessionData.duration_actual_min,
    rpe_avg: lastSessionData.rpe_avg
  } : null;

  return {
    draftSessions,
    currentGoals,
    weekStats,
    lastSession,
    hasCompletedToday
  };
}

export function useTrainingTodayData() {
  const { session } = useUserStore();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['training-today', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return fetchTodayData(userId);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}

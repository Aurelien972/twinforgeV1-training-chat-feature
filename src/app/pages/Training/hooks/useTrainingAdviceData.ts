/**
 * useTrainingAdviceData Hook
 * Hook for fetching training advice and recommendations
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../system/supabase/client';
import { useUserStore } from '../../../../system/store/userStore';
import { subWeeks } from 'date-fns';
import logger from '../../../../lib/utils/logger';

interface VolumeAdvice {
  currentWeekVolume: number;
  avgWeekVolume: number;
  recommendation: 'increase' | 'maintain' | 'decrease';
  changePercentage: number;
}

interface IntensityAdvice {
  avgRPE: number;
  recommendation: 'increase' | 'maintain' | 'decrease';
  optimalRPERange: [number, number];
}

interface RecoveryAdvice {
  needsRecovery: boolean;
  daysSinceLastSession: number;
  recommendation: string;
}

interface DisciplineBalance {
  discipline: string;
  sessionsCount: number;
  percentage: number;
}

export interface TrainingAdviceData {
  volumeAdvice: VolumeAdvice;
  intensityAdvice: IntensityAdvice;
  recoveryAdvice: RecoveryAdvice;
  disciplineBalance: DisciplineBalance[];
  totalSessions: number;
  period: 'month';
}

async function fetchAdviceData(userId: string): Promise<TrainingAdviceData> {
  const now = new Date();
  const fourWeeksAgo = subWeeks(now, 4);

  const { data: sessions, error: sessionsError } = await supabase
    .from('training_sessions')
    .select(`
      id,
      completed_at,
      discipline,
      rpe_avg,
      training_metrics (
        volume_kg,
        distance_km
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', fourWeeksAgo.toISOString())
    .order('completed_at', { ascending: true });

  if (sessionsError) {
    logger.error('TRAINING_ADVICE', 'Failed to fetch sessions', { error: sessionsError });
    throw new Error('Failed to fetch training sessions');
  }

  const completedSessions = sessions || [];
  const totalSessions = completedSessions.length;

  // Calculate current week volume
  const oneWeekAgo = subWeeks(now, 1);
  const currentWeekSessions = completedSessions.filter(s =>
    new Date(s.completed_at) >= oneWeekAgo
  );

  const currentWeekVolume = currentWeekSessions.reduce((sum, s) => {
    const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
    return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
  }, 0);

  const totalVolume = completedSessions.reduce((sum, s) => {
    const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
    return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
  }, 0);

  const avgWeekVolume = totalSessions > 0 ? totalVolume / 4 : 0;

  const volumeChangePercentage = avgWeekVolume > 0
    ? ((currentWeekVolume - avgWeekVolume) / avgWeekVolume) * 100
    : 0;

  let volumeRecommendation: 'increase' | 'maintain' | 'decrease' = 'maintain';
  if (volumeChangePercentage < -10) volumeRecommendation = 'increase';
  else if (volumeChangePercentage > 10) volumeRecommendation = 'decrease';

  const volumeAdvice: VolumeAdvice = {
    currentWeekVolume: Math.round(currentWeekVolume),
    avgWeekVolume: Math.round(avgWeekVolume),
    recommendation: volumeRecommendation,
    changePercentage: Math.round(volumeChangePercentage)
  };

  // Calculate intensity advice
  const avgRPE = totalSessions > 0
    ? completedSessions.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / totalSessions
    : 0;

  let intensityRecommendation: 'increase' | 'maintain' | 'decrease' = 'maintain';
  if (avgRPE < 6.5) intensityRecommendation = 'increase';
  else if (avgRPE > 8.5) intensityRecommendation = 'decrease';

  const intensityAdvice: IntensityAdvice = {
    avgRPE: Math.round(avgRPE * 10) / 10,
    recommendation: intensityRecommendation,
    optimalRPERange: [7, 8]
  };

  // Calculate recovery advice
  const lastSession = completedSessions[completedSessions.length - 1];
  const daysSinceLastSession = lastSession
    ? Math.floor((now.getTime() - new Date(lastSession.completed_at).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const needsRecovery = daysSinceLastSession === 0 || (avgRPE > 8 && daysSinceLastSession < 2);

  let recoveryRecommendationText = 'Continuez votre routine actuelle';
  if (needsRecovery) {
    recoveryRecommendationText = 'Prenez un jour de repos pour optimiser votre récupération';
  } else if (daysSinceLastSession > 3) {
    recoveryRecommendationText = 'Il est temps de reprendre l\'entraînement';
  }

  const recoveryAdvice: RecoveryAdvice = {
    needsRecovery,
    daysSinceLastSession,
    recommendation: recoveryRecommendationText
  };

  // Calculate discipline balance
  const disciplineCount: Record<string, number> = {};
  completedSessions.forEach(s => {
    disciplineCount[s.discipline] = (disciplineCount[s.discipline] || 0) + 1;
  });

  const disciplineBalance: DisciplineBalance[] = Object.entries(disciplineCount).map(([discipline, count]) => ({
    discipline,
    sessionsCount: count,
    percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0
  })).sort((a, b) => b.sessionsCount - a.sessionsCount);

  return {
    volumeAdvice,
    intensityAdvice,
    recoveryAdvice,
    disciplineBalance,
    totalSessions,
    period: 'month'
  };
}

export function useTrainingAdviceData() {
  const { session } = useUserStore();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['training-advice', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return fetchAdviceData(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

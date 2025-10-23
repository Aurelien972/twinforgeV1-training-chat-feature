/**
 * useTrainingAdvice Hook
 * React Query hook for managing training advice and coaching insights
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingAdviceService } from '../system/services/trainingAdviceService';
import type { TrainingInsights, AdviceRecommendation } from '../system/services/trainingAdviceService';
import logger from '../lib/utils/logger';

export function useTrainingAdvice(forceRefresh: boolean = false) {
  return useQuery<TrainingInsights | null>({
    queryKey: ['training-advice', 'global'],
    queryFn: async () => {
      logger.info('ADVICE_HOOK', 'Fetching global coaching insights', { forceRefresh });
      return await trainingAdviceService.getCoachingInsights(undefined, forceRefresh);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  });
}

export function usePriorityRecommendations(insights: TrainingInsights | null) {
  return trainingAdviceService.getPriorityRecommendations(insights);
}

export function useRecommendationsByCategory(
  insights: TrainingInsights | null,
  category: AdviceRecommendation['category']
) {
  return trainingAdviceService.getRecommendationsByCategory(insights, category);
}

export function useCriticalImbalances(insights: TrainingInsights | null) {
  return trainingAdviceService.getCriticalImbalances(insights);
}

export function useMarkRecommendationHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recommendationId, helpful }: { recommendationId: string; helpful: boolean }) => {
      await trainingAdviceService.markRecommendationHelpful(recommendationId, helpful);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-advice'] });
    }
  });
}

export function useRefreshAdvice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      logger.info('ADVICE_HOOK', 'Forcing refresh of global coaching insights');
      return await trainingAdviceService.getCoachingInsights(undefined, true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-advice'] });
    }
  });
}

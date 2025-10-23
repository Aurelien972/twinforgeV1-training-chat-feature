/**
 * useProgressionInsights Hook
 * React Query hook for managing training progression insights
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingProgressionInsightsService, type ProgressionPeriod, type ProgressionInsights } from '../system/services/trainingProgressionInsightsService';
import logger from '../lib/utils/logger';

export function useProgressionInsights(period: ProgressionPeriod) {
  return useQuery<ProgressionInsights | null>({
    queryKey: ['progression-insights', period],
    queryFn: async () => {
      logger.info('PROGRESSION_INSIGHTS_HOOK', 'Fetching progression insights', { period });
      return await trainingProgressionInsightsService.getProgressionInsights(period);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });
}

export function useRefreshProgressionInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (period: ProgressionPeriod) => {
      logger.info('PROGRESSION_INSIGHTS_HOOK', 'Forcing refresh of progression insights', { period });
      return await trainingProgressionInsightsService.refreshInsights(period);
    },
    onSuccess: (_, period) => {
      queryClient.invalidateQueries({ queryKey: ['progression-insights', period] });
    }
  });
}

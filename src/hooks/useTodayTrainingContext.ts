/**
 * useTodayTrainingContext Hook
 * Hook principal pour récupérer le contexte complet d'entraînement d'aujourd'hui
 */

import { useQuery } from '@tanstack/react-query';
import { trainingTodayDynamicService, type TodayTrainingContext } from '../system/services/trainingTodayDynamicService';
import { useUserStore } from '../system/store/userStore';

export function useTodayTrainingContext() {
  const { session } = useUserStore();

  return useQuery({
    queryKey: ['today-training-context', session?.user?.id],
    queryFn: async () => {
      return await trainingTodayDynamicService.getTodayContext();
    },
    enabled: !!session?.user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export type UseTodayTrainingContextResult = ReturnType<typeof useTodayTrainingContext>;

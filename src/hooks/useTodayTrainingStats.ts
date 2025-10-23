/**
 * useTodayTrainingStats Hook
 * Hook to get today's training stats from todayContext
 */

import { useTodayTrainingContext } from './useTodayTrainingContext';

export function useTodayTrainingStats() {
  const { data: context, isLoading, error } = useTodayTrainingContext();

  return {
    data: context?.todayTrainingStats || null,
    isLoading,
    error
  };
}

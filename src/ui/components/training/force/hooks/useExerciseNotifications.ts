/**
 * useExerciseNotifications Hook
 * Manages notifications for exercise adjustments
 */

import { useCallback } from 'react';
import { step2NotificationService } from '../../../../../system/services/step2NotificationService';
import { getTopSet } from '../utils/exerciseCalculations';

export interface UseExerciseNotificationsReturn {
  notifySetsIncreased: (exerciseName: string, newSets: number) => void;
  notifySetsDecreased: (exerciseName: string, newSets: number) => void;
  notifyRepsIncreased: (exerciseName: string, newReps: number) => void;
  notifyRepsDecreased: (exerciseName: string, newReps: number) => void;
  notifyLoadIncreased: (exerciseName: string, oldLoad: number, newLoad: number) => void;
  notifyLoadDecreased: (exerciseName: string, oldLoad: number, newLoad: number) => void;
  notifyAlternativeSelected: (originalName: string, alternativeName: string) => void;
}

/**
 * Hook for managing exercise-related notifications
 */
export const useExerciseNotifications = (): UseExerciseNotificationsReturn => {
  const notifySetsIncreased = useCallback((exerciseName: string, newSets: number) => {
    step2NotificationService.onSetsIncreased(exerciseName, newSets);
  }, []);

  const notifySetsDecreased = useCallback((exerciseName: string, newSets: number) => {
    step2NotificationService.onSetsDecreased(exerciseName, newSets);
  }, []);

  const notifyRepsIncreased = useCallback((exerciseName: string, newReps: number) => {
    step2NotificationService.onRepsIncreased(exerciseName, newReps);
  }, []);

  const notifyRepsDecreased = useCallback((exerciseName: string, newReps: number) => {
    step2NotificationService.onRepsDecreased(exerciseName, newReps);
  }, []);

  const notifyLoadIncreased = useCallback((exerciseName: string, oldLoad: number, newLoad: number) => {
    step2NotificationService.onLoadIncreased(exerciseName, oldLoad, newLoad);
  }, []);

  const notifyLoadDecreased = useCallback((exerciseName: string, oldLoad: number, newLoad: number) => {
    step2NotificationService.onLoadDecreased(exerciseName, oldLoad, newLoad);
  }, []);

  const notifyAlternativeSelected = useCallback((originalName: string, alternativeName: string) => {
    step2NotificationService.onAlternativeSelected(originalName, alternativeName);
  }, []);

  return {
    notifySetsIncreased,
    notifySetsDecreased,
    notifyRepsIncreased,
    notifyRepsDecreased,
    notifyLoadIncreased,
    notifyLoadDecreased,
    notifyAlternativeSelected,
  };
};

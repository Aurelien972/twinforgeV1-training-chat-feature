/**
 * useExerciseAdjustment Hook
 * Manages exercise adjustments with service integration
 */

import { useCallback } from 'react';
import { exerciseProgressionService } from '../../../../../system/services/exerciseProgressionService';
import type { Exercise } from '../types';
import type { AdjustmentResult } from '../types';

export interface UseExerciseAdjustmentReturn {
  increaseSets: (currentSets: number) => AdjustmentResult;
  decreaseSets: (currentSets: number) => AdjustmentResult;
  increaseReps: (currentReps: number) => AdjustmentResult;
  decreaseReps: (currentReps: number) => AdjustmentResult;
  increaseLoad: (currentLoad: number | number[]) => AdjustmentResult;
  decreaseLoad: (currentLoad: number | number[]) => AdjustmentResult;
}

/**
 * Hook for managing exercise adjustments
 */
export const useExerciseAdjustment = (): UseExerciseAdjustmentReturn => {
  const increaseSets = useCallback((currentSets: number): AdjustmentResult => {
    const result = exerciseProgressionService.increaseSets(currentSets);
    return {
      newValue: result.newValue as number,
      changeAmount: 1,
      changeType: 'increase_sets',
    };
  }, []);

  const decreaseSets = useCallback((currentSets: number): AdjustmentResult => {
    const result = exerciseProgressionService.decreaseSets(currentSets);
    return {
      newValue: result.newValue as number,
      changeAmount: -1,
      changeType: 'decrease_sets',
    };
  }, []);

  const increaseReps = useCallback((currentReps: number): AdjustmentResult => {
    const result = exerciseProgressionService.increaseReps(currentReps);
    return {
      newValue: result.newValue as number,
      changeAmount: 1,
      changeType: 'increase_reps',
    };
  }, []);

  const decreaseReps = useCallback((currentReps: number): AdjustmentResult => {
    const result = exerciseProgressionService.decreaseReps(currentReps);
    return {
      newValue: result.newValue as number,
      changeAmount: -1,
      changeType: 'decrease_reps',
    };
  }, []);

  const increaseLoad = useCallback((currentLoad: number | number[]): AdjustmentResult => {
    const result = exerciseProgressionService.increaseLoad(currentLoad);
    return {
      newValue: result.newValue,
      changeAmount: Array.isArray(result.newValue)
        ? result.newValue[result.newValue.length - 1] - (Array.isArray(currentLoad) ? currentLoad[currentLoad.length - 1] : currentLoad)
        : (result.newValue as number) - (currentLoad as number),
      changeType: 'increase_load',
    };
  }, []);

  const decreaseLoad = useCallback((currentLoad: number | number[]): AdjustmentResult => {
    const result = exerciseProgressionService.decreaseLoad(currentLoad);
    return {
      newValue: result.newValue,
      changeAmount: Array.isArray(result.newValue)
        ? (Array.isArray(currentLoad) ? currentLoad[currentLoad.length - 1] : currentLoad) - result.newValue[result.newValue.length - 1]
        : (currentLoad as number) - (result.newValue as number),
      changeType: 'decrease_load',
    };
  }, []);

  return {
    increaseSets,
    decreaseSets,
    increaseReps,
    decreaseReps,
    increaseLoad,
    decreaseLoad,
  };
};

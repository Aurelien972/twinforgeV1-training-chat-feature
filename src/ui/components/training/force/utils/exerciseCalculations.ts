/**
 * Exercise Calculations Utilities
 * Functions for calculating exercise adjustments and progressions
 */

import {
  MIN_REPS,
  MAX_REPS,
  MIN_SETS,
  MAX_SETS,
  MIN_LOAD,
  LOAD_INCREASE_PERCENT,
  LOAD_DECREASE_PERCENT,
} from '../constants';
import type { AdjustmentResult } from '../types';

/**
 * Calculate load increase
 */
export const calculateLoadIncrease = (currentLoad: number | number[]): AdjustmentResult => {
  if (Array.isArray(currentLoad)) {
    const increase = Math.ceil(currentLoad[currentLoad.length - 1] * LOAD_INCREASE_PERCENT);
    const newValue = currentLoad.map(l => l + increase);
    return {
      newValue,
      changeAmount: increase,
      changeType: 'increase_load',
    };
  }

  const increase = Math.ceil(currentLoad * LOAD_INCREASE_PERCENT);
  return {
    newValue: currentLoad + increase,
    changeAmount: increase,
    changeType: 'increase_load',
  };
};

/**
 * Calculate load decrease
 */
export const calculateLoadDecrease = (currentLoad: number | number[]): AdjustmentResult => {
  if (Array.isArray(currentLoad)) {
    const decrease = Math.ceil(currentLoad[currentLoad.length - 1] * LOAD_DECREASE_PERCENT);
    const newValue = currentLoad.map(l => Math.max(MIN_LOAD, l - decrease));
    return {
      newValue,
      changeAmount: decrease,
      changeType: 'decrease_load',
    };
  }

  const decrease = Math.ceil(currentLoad * LOAD_DECREASE_PERCENT);
  return {
    newValue: Math.max(MIN_LOAD, currentLoad - decrease),
    changeAmount: decrease,
    changeType: 'decrease_load',
  };
};

/**
 * Calculate reps increase
 */
export const calculateRepsIncrease = (currentReps: number): AdjustmentResult => {
  const newValue = Math.min(MAX_REPS, currentReps + 1);
  return {
    newValue,
    changeAmount: 1,
    changeType: 'increase_reps',
  };
};

/**
 * Calculate reps decrease
 */
export const calculateRepsDecrease = (currentReps: number): AdjustmentResult => {
  const newValue = Math.max(MIN_REPS, currentReps - 1);
  return {
    newValue,
    changeAmount: 1,
    changeType: 'decrease_reps',
  };
};

/**
 * Calculate sets increase
 */
export const calculateSetsIncrease = (currentSets: number): AdjustmentResult => {
  const newValue = Math.min(MAX_SETS, currentSets + 1);
  return {
    newValue,
    changeAmount: 1,
    changeType: 'increase_sets',
  };
};

/**
 * Calculate sets decrease
 */
export const calculateSetsDecrease = (currentSets: number): AdjustmentResult => {
  const newValue = Math.max(MIN_SETS, currentSets - 1);
  return {
    newValue,
    changeAmount: 1,
    changeType: 'decrease_sets',
  };
};

/**
 * Get top set value from ramping load
 */
export const getTopSet = (load: number | number[]): number => {
  if (Array.isArray(load)) {
    return load[load.length - 1];
  }
  return load;
};

/**
 * Get initial load from ramping load
 */
export const getInitialLoad = (load: number | number[]): number => {
  if (Array.isArray(load)) {
    return load[0];
  }
  return load;
};

/**
 * Check if load is ramping (progressive)
 */
export const isRampingLoad = (load: number | number[] | null): boolean => {
  return Array.isArray(load);
};

/**
 * Get load progression summary text
 */
export const getLoadProgressionSummary = (load: number | number[]): string => {
  if (!Array.isArray(load)) {
    return 'Charge fixe';
  }

  const steps = load.length;
  const initial = load[0];
  const final = load[load.length - 1];
  const increment = steps > 1 ? (final - initial) / (steps - 1) : 0;

  return `${steps} paliers • +${increment.toFixed(1)}kg par série`;
};

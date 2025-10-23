/**
 * Formatters
 * Utility functions for formatting display values
 */

import type { LoadDisplay } from '../types';
import { isRampingLoad, getInitialLoad, getTopSet, getLoadProgressionSummary } from './exerciseCalculations';

/**
 * Format time in MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format time in human-readable format
 */
export const formatTimeHuman = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${mins}min`;
  }
  return `${mins}min ${secs}s`;
};

/**
 * Format load for display
 */
export const formatLoadDisplay = (load: number | number[] | null): LoadDisplay => {
  if (load === null || load === undefined) {
    return {
      value: 'PDC',
      label: 'Poids de corps',
      isProgressive: false,
    };
  }

  if (isRampingLoad(load)) {
    return {
      value: `${getInitialLoad(load)}-${getTopSet(load)}kg`,
      label: 'Charge progressive',
      isProgressive: true,
      summary: getLoadProgressionSummary(load),
    };
  }

  return {
    value: `${load}kg`,
    label: 'Charge',
    isProgressive: false,
  };
};

/**
 * Format rest time for display
 */
export const formatRestTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${mins}min`;
  }
  return `${mins}min ${secs}s`;
};

/**
 * Format tempo for display
 */
export const formatTempo = (tempo: string): string => {
  // Tempo format is typically "3-1-2-0" representing eccentric-pause-concentric-pause
  const parts = tempo.split('-');
  if (parts.length !== 4) {
    return tempo;
  }

  return `${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}`;
};

/**
 * Format percentage change
 */
export const formatPercentageChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change}%`;
};

/**
 * Format weight change
 */
export const formatWeightChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change}kg`;
};

/**
 * Format reps change
 */
export const formatRepsChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change} rep${Math.abs(change) > 1 ? 's' : ''}`;
};

/**
 * Format sets change
 */
export const formatSetsChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change} série${Math.abs(change) > 1 ? 's' : ''}`;
};

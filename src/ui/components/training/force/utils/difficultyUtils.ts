/**
 * Difficulty Utils
 * Functions for determining exercise difficulty and RPE-based classification
 */

import { RPE_EASY_MAX, RPE_MODERATE_MAX, RPE_INTENSE_MAX } from '../constants';
import { DIFFICULTY_COLORS, getRpeColor } from '../constants/colors';
import type { DifficultyBadge, DifficultyLevel } from '../types';

/**
 * Get difficulty level from RPE
 */
export const getDifficultyLevel = (rpe?: number): DifficultyLevel => {
  if (!rpe) return 'moderate';
  if (rpe >= RPE_INTENSE_MAX) return 'very_intense';
  if (rpe >= RPE_MODERATE_MAX) return 'intense';
  if (rpe <= RPE_EASY_MAX) return 'easy';
  return 'moderate';
};

/**
 * Get difficulty badge configuration
 */
export const getDifficultyBadge = (rpe?: number): DifficultyBadge => {
  const level = getDifficultyLevel(rpe);

  const badges: Record<DifficultyLevel, DifficultyBadge> = {
    easy: {
      label: 'Facile',
      color: DIFFICULTY_COLORS.easy,
      level: 'easy',
    },
    moderate: {
      label: 'Modéré',
      color: DIFFICULTY_COLORS.moderate,
      level: 'moderate',
    },
    intense: {
      label: 'Intense',
      color: DIFFICULTY_COLORS.intense,
      level: 'intense',
    },
    very_intense: {
      label: 'Très Intense',
      color: DIFFICULTY_COLORS.veryIntense,
      level: 'very_intense',
    },
  };

  return badges[level];
};

/**
 * Get RPE description
 */
export const getRpeDescription = (rpe: number): string => {
  if (rpe >= 10) return 'Effort maximal';
  if (rpe >= 9) return 'Presque maximum';
  if (rpe >= 8) return 'Très difficile';
  if (rpe >= 7) return 'Difficile';
  if (rpe >= 6) return 'Moyennement difficile';
  if (rpe >= 5) return 'Modéré';
  if (rpe >= 4) return 'Facile';
  return 'Très facile';
};

/**
 * Calculate estimated 1RM from reps and RPE
 * Using Epley formula with RPE adjustment
 */
export const calculateEstimated1RM = (
  weight: number,
  reps: number,
  rpe?: number
): number => {
  // Base Epley formula: 1RM = weight * (1 + reps/30)
  let estimated1RM = weight * (1 + reps / 30);

  // Adjust based on RPE
  if (rpe && rpe < 10) {
    // If RPE < 10, they could have done more reps
    const repsInReserve = 10 - rpe;
    const adjustedReps = reps + repsInReserve;
    estimated1RM = weight * (1 + adjustedReps / 30);
  }

  return Math.round(estimated1RM * 10) / 10; // Round to 1 decimal
};

/**
 * Suggest load based on target RPE and reps
 */
export const suggestLoad = (
  estimated1RM: number,
  targetReps: number,
  targetRpe: number
): number => {
  // Calculate percentage of 1RM based on reps and RPE
  const repsInReserve = 10 - targetRpe;
  const totalReps = targetReps + repsInReserve;

  // Reverse Epley: weight = 1RM / (1 + reps/30)
  const suggestedLoad = estimated1RM / (1 + totalReps / 30);

  return Math.round(suggestedLoad * 2) / 2; // Round to nearest 0.5kg
};

/**
 * Re-export color utility for convenience
 */
export { getRpeColor };

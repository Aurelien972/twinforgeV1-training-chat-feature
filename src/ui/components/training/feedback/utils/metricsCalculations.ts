/**
 * Metrics Calculations
 * Pure functions for calculating session metrics
 */

import { calculateSessionVolume } from '../../../../../utils/loadUtils';
import type { SessionFeedback, SessionPrescription } from '../../../../../system/store/trainingPipeline/types';
import type { SessionMetrics, EnduranceMetrics } from '../types';
import { CALCULATION_CONSTANTS } from '../config/constants';

/**
 * Calculate total volume (weight x reps x sets)
 */
export function calculateTotalVolume(sessionFeedback: SessionFeedback): number {
  return calculateSessionVolume(sessionFeedback.exercises);
}

/**
 * Calculate total reps across all exercises
 */
export function calculateTotalReps(sessionFeedback: SessionFeedback): number {
  return sessionFeedback.exercises.reduce((total, exercise) => {
    return total + exercise.repsActual.reduce((sum, reps) => sum + reps, 0);
  }, 0);
}

/**
 * Calculate work/rest ratio
 */
export function calculateWorkRestRatio(
  sessionFeedback: SessionFeedback,
  sessionPrescription: SessionPrescription
): number {
  const totalRestTime = sessionPrescription.exercises.reduce((total, ex) => {
    return total + (ex.rest * (ex.sets - 1));
  }, 0);

  if (totalRestTime === 0) return 0;

  const workTime = sessionFeedback.durationActual - totalRestTime;
  return workTime / totalRestTime;
}

/**
 * Estimate calories burned (simplified formula)
 */
export function calculateCaloriesBurned(
  totalVolume: number,
  durationMinutes: number,
  avgRpe: number
): number {
  if (isNaN(totalVolume) || isNaN(durationMinutes) || isNaN(avgRpe)) {
    return 0;
  }

  const baseCalories =
    (totalVolume / CALCULATION_CONSTANTS.CALORIES_BASE_VOLUME_DIVISOR) +
    (durationMinutes * CALCULATION_CONSTANTS.CALORIES_DURATION_MULTIPLIER);

  const rpeMultiplier =
    CALCULATION_CONSTANTS.CALORIES_RPE_BASE +
    (avgRpe / 10) * CALCULATION_CONSTANTS.CALORIES_RPE_RANGE;

  const result = Math.round(baseCalories * rpeMultiplier);
  return isNaN(result) ? 0 : result;
}

/**
 * Calculate average intensity (simplified - would need 1RM data in production)
 */
export function calculateAverageIntensity(avgRpe: number): number {
  return Math.round(
    CALCULATION_CONSTANTS.INTENSITY_BASE +
    (avgRpe * CALCULATION_CONSTANTS.INTENSITY_RPE_MULTIPLIER)
  );
}

/**
 * Calculate time under tension (simplified)
 */
export function calculateTimeUnderTension(totalReps: number): number {
  return totalReps * CALCULATION_CONSTANTS.AVG_TEMPO_PER_REP;
}

/**
 * Calculate average technique score
 */
export function calculateAverageTechnique(sessionFeedback: SessionFeedback): number {
  const validTechniques = sessionFeedback.exercises
    .map(ex => ex.technique || 0)
    .filter(t => t > 0);

  if (validTechniques.length === 0) return 0;

  return validTechniques.reduce((sum, t) => sum + t, 0) / validTechniques.length;
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(sessionFeedback: SessionFeedback): number {
  if (sessionFeedback.exercises.length === 0) return 0;

  const completedCount = sessionFeedback.exercises.filter(ex => ex.completed).length;
  return completedCount / sessionFeedback.exercises.length;
}

/**
 * Calculate all session metrics at once
 */
export function calculateSessionMetrics(
  sessionFeedback: SessionFeedback,
  sessionPrescription: SessionPrescription
): SessionMetrics {
  const totalVolume = calculateTotalVolume(sessionFeedback);
  const totalReps = calculateTotalReps(sessionFeedback);
  const durationMinutes = sessionFeedback.durationActual / 60;
  const avgRpe = sessionFeedback.overallRpe || 7;

  return {
    totalVolume,
    totalReps,
    workRestRatio: calculateWorkRestRatio(sessionFeedback, sessionPrescription),
    caloriesBurned: calculateCaloriesBurned(totalVolume, durationMinutes, avgRpe),
    avgIntensity: calculateAverageIntensity(avgRpe),
    timeUnderTension: calculateTimeUnderTension(totalReps),
    avgTechnique: calculateAverageTechnique(sessionFeedback),
    completionRate: calculateCompletionRate(sessionFeedback),
    durationMinutes,
    avgRpe,
  };
}

/**
 * Calculate endurance-specific metrics
 */
export function calculateEnduranceMetrics(
  sessionFeedback: SessionFeedback,
  aiAnalysis?: { sessionAnalysis?: { volumeAnalysis?: { totalVolume?: number }; intensityAnalysis?: { avgRPE?: number; intensityZones?: string } } } | null
): EnduranceMetrics {
  const totalDuration = aiAnalysis?.sessionAnalysis?.volumeAnalysis?.totalVolume || sessionFeedback.durationActual || 0;
  const avgRPE = aiAnalysis?.sessionAnalysis?.intensityAnalysis?.avgRPE || sessionFeedback.overallRpe || 0;
  const estimatedCalories = Math.round(
    (totalDuration / 60) *
    CALCULATION_CONSTANTS.ENDURANCE_BASE_CAL_PER_MIN *
    (1 + avgRPE / 10)
  );

  return {
    totalDuration,
    avgRPE,
    estimatedCalories,
    zones: aiAnalysis?.sessionAnalysis?.intensityAnalysis?.intensityZones,
  };
}

/**
 * Check if session is endurance type
 */
export function isEnduranceSession(sessionPrescription: SessionPrescription): boolean {
  return !!(sessionPrescription as any).mainWorkout || !!(sessionPrescription as any).discipline;
}

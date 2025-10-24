/**
 * Feedback Validation Utilities
 * Centralized validation functions for training session feedback data
 */

import type { SessionFeedback, SessionPrescription } from '../system/store/trainingPipeline/types';
import logger from '../lib/utils/logger';

export interface FeedbackValidationResult {
  isValid: boolean;
  hasMinimalData: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
}

/**
 * Validates session feedback structure and data completeness
 */
export function validateSessionFeedback(
  feedback: SessionFeedback | null | undefined,
  prescription: SessionPrescription | null | undefined
): FeedbackValidationResult {
  const result: FeedbackValidationResult = {
    isValid: false,
    hasMinimalData: false,
    errors: [],
    warnings: [],
    missingFields: []
  };

  // Check if feedback exists
  if (!feedback) {
    result.errors.push('Feedback object is null or undefined');
    logger.error('FEEDBACK_VALIDATION', 'Feedback is null', { feedback });
    return result;
  }

  // Check if prescription exists for context
  if (!prescription) {
    result.warnings.push('Prescription is null - limited validation possible');
  }

  // Detect session type
  const isEnduranceSession = !!(prescription as any)?.mainWorkout || !!(prescription as any)?.discipline;
  const isFunctionalSession = !!(feedback as any)?.functionalMetrics;
  const isCompetitionSession = !!(feedback as any)?.competitionMetrics ||
                                !!(prescription as any)?.competitionFormat;

  // CRITICAL: Check durationActual (required for all sessions)
  if (typeof feedback.durationActual !== 'number' || feedback.durationActual < 1) {
    result.errors.push('durationActual is missing or invalid');
    result.missingFields.push('durationActual');
  } else {
    // At least we have duration - this is minimal data
    result.hasMinimalData = true;
  }

  // Validate based on session type
  if (isEnduranceSession) {
    // Endurance: duration is sufficient for minimal data
    if (feedback.durationActual && feedback.durationActual >= 1) {
      result.isValid = true;
    }
  } else if (isFunctionalSession) {
    // Functional: Check functionalMetrics
    const functionalMetrics = (feedback as any).functionalMetrics;
    if (!functionalMetrics || typeof functionalMetrics !== 'object') {
      result.warnings.push('functionalMetrics is missing or invalid');
      result.missingFields.push('functionalMetrics');
    } else {
      // Check if we have at least rounds or reps
      if (typeof functionalMetrics.roundsCompleted !== 'number' &&
          typeof functionalMetrics.totalReps !== 'number') {
        result.warnings.push('functionalMetrics missing both roundsCompleted and totalReps');
      } else {
        result.isValid = true;
      }
    }
    // Even without functionalMetrics, if we have duration, it's minimal data
    if (result.hasMinimalData && !result.isValid) {
      result.isValid = true; // Accept minimal data
    }
  } else if (isCompetitionSession) {
    // Competition: Check competitionMetrics
    const competitionMetrics = (feedback as any).competitionMetrics;
    if (!competitionMetrics || typeof competitionMetrics !== 'object') {
      result.warnings.push('competitionMetrics is missing or invalid');
      result.missingFields.push('competitionMetrics');
    } else {
      // Check if we have stations and time
      if (typeof competitionMetrics.stationsCompleted !== 'number' ||
          typeof competitionMetrics.totalTime !== 'number') {
        result.warnings.push('competitionMetrics missing required fields');
      } else {
        result.isValid = true;
      }
    }
    // Even without competitionMetrics, if we have duration, it's minimal data
    if (result.hasMinimalData && !result.isValid) {
      result.isValid = true; // Accept minimal data
    }
  } else {
    // Force/Calisthenics: Check exercises array
    if (!feedback.exercises || !Array.isArray(feedback.exercises)) {
      result.errors.push('exercises array is missing or not an array');
      result.missingFields.push('exercises');
    } else if (feedback.exercises.length === 0) {
      result.warnings.push('exercises array is empty');
      result.missingFields.push('exercises[0]');
    } else {
      result.isValid = true;
    }
    // Even without exercises, if we have duration, it's minimal data
    if (result.hasMinimalData && !result.isValid) {
      result.isValid = true; // Accept minimal data
    }
  }

  // Check optional but important fields
  if (typeof feedback.overallRpe !== 'number') {
    result.warnings.push('overallRpe is missing');
    result.missingFields.push('overallRpe');
  }

  // Log validation result
  logger.info('FEEDBACK_VALIDATION', 'Validation completed', {
    isValid: result.isValid,
    hasMinimalData: result.hasMinimalData,
    errorsCount: result.errors.length,
    warningsCount: result.warnings.length,
    isEnduranceSession,
    isFunctionalSession,
    isCompetitionSession
  });

  return result;
}

/**
 * Checks if exercises array exists and is valid
 */
export function hasValidExercisesArray(feedback: SessionFeedback | null | undefined): boolean {
  if (!feedback) return false;
  if (!feedback.exercises || !Array.isArray(feedback.exercises)) return false;
  if (feedback.exercises.length === 0) return false;
  return true;
}

/**
 * Checks if feedback has any completed exercises
 */
export function hasCompletedExercises(feedback: SessionFeedback | null | undefined): boolean {
  if (!hasValidExercisesArray(feedback)) return false;
  return feedback!.exercises.some(ex => ex && ex.completed);
}

/**
 * Safely gets exercise count
 */
export function getExerciseCount(feedback: SessionFeedback | null | undefined): number {
  if (!hasValidExercisesArray(feedback)) return 0;
  return feedback!.exercises.length;
}

/**
 * Safely gets completed exercise count
 */
export function getCompletedExerciseCount(feedback: SessionFeedback | null | undefined): number {
  if (!hasValidExercisesArray(feedback)) return 0;
  return feedback!.exercises.filter(ex => ex && ex.completed).length;
}

/**
 * Checks if feedback has minimal required data to proceed
 */
export function hasMinimalDataToProceed(feedback: SessionFeedback | null | undefined): boolean {
  if (!feedback) return false;
  // At minimum, we need durationActual
  return typeof feedback.durationActual === 'number' && feedback.durationActual >= 1;
}

/**
 * Gets a human-readable description of what data is missing
 */
export function getMissingDataDescription(validation: FeedbackValidationResult): string {
  if (validation.isValid) {
    return 'Données complètes';
  }

  if (validation.hasMinimalData) {
    return 'Données minimales disponibles';
  }

  if (validation.errors.length > 0) {
    return `Données critiques manquantes: ${validation.missingFields.join(', ')}`;
  }

  return 'Données incomplètes';
}

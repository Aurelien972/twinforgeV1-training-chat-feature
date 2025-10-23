/**
 * Functional Adjustment Service
 * Handles adjustments for functional/CrossFit WODs
 * Manages scaling, time caps, rounds, reps, and exercise substitutions
 */

import logger from '../../lib/utils/logger';
import type { Exercise } from '../../domain/functional/functionalTypes';

export interface FunctionalAdjustmentOptions {
  adjustmentType: 'timeCap' | 'rounds' | 'reps' | 'scaling' | 'exercise';
  exerciseId?: string;
  delta?: number; // For numeric adjustments (+/- value)
  newValue?: any; // For direct value changes
  scalingLevel?: 'rx' | 'scaled' | 'foundations';
  newExercise?: Exercise; // For exercise substitutions
}

export interface AdjustmentResult {
  success: boolean;
  updatedPrescription: any;
  message: string;
  suggestions?: string[];
}

class FunctionalAdjustmentService {
  /**
   * Adjust time cap for WODs
   */
  adjustTimeCap(
    prescription: any,
    delta: number
  ): AdjustmentResult {
    const currentTimeCap = prescription.timeCapMinutes || 20;
    const newTimeCap = Math.max(5, Math.min(60, currentTimeCap + delta));

    logger.info('FUNCTIONAL_ADJUSTMENT', 'Adjusting time cap', {
      currentTimeCap,
      delta,
      newTimeCap,
      wodFormat: prescription.wodFormat
    });

    const updatedPrescription = {
      ...prescription,
      timeCapMinutes: newTimeCap
    };

    const message = delta > 0
      ? `Time cap augmenté à ${newTimeCap} minutes`
      : `Time cap réduit à ${newTimeCap} minutes`;

    const suggestions = this.generateTimeCapSuggestions(prescription.wodFormat, newTimeCap);

    return {
      success: true,
      updatedPrescription,
      message,
      suggestions
    };
  }

  /**
   * Adjust target rounds for AMRAP
   */
  adjustTargetRounds(
    prescription: any,
    delta: number
  ): AdjustmentResult {
    if (prescription.wodFormat !== 'amrap') {
      return {
        success: false,
        updatedPrescription: prescription,
        message: 'Ajustement de rounds disponible uniquement pour AMRAP'
      };
    }

    // Parse current target (e.g., "15-20 rounds" -> adjust to "17-22 rounds")
    const currentTarget = prescription.targetRounds || '10-15';
    const numbers = currentTarget.match(/\d+/g)?.map(Number) || [10, 15];
    const newNumbers = numbers.map(n => Math.max(1, n + delta));
    const newTarget = `${newNumbers[0]}-${newNumbers[1]} rounds`;

    logger.info('FUNCTIONAL_ADJUSTMENT', 'Adjusting target rounds', {
      currentTarget,
      delta,
      newTarget
    });

    const updatedPrescription = {
      ...prescription,
      targetRounds: newTarget
    };

    const message = delta > 0
      ? `Objectif augmenté: ${newTarget}`
      : `Objectif réduit: ${newTarget}`;

    return {
      success: true,
      updatedPrescription,
      message
    };
  }

  /**
   * Adjust reps for a specific exercise
   */
  adjustExerciseReps(
    prescription: any,
    exerciseId: string,
    delta: number
  ): AdjustmentResult {
    const exerciseIndex = prescription.exercises.findIndex((ex: Exercise) => ex.id === exerciseId);

    if (exerciseIndex === -1) {
      return {
        success: false,
        updatedPrescription: prescription,
        message: 'Exercice non trouvé'
      };
    }

    const exercise = prescription.exercises[exerciseIndex];
    const currentReps = typeof exercise.reps === 'number' ? exercise.reps : parseInt(exercise.reps) || 10;
    const newReps = Math.max(1, currentReps + delta);

    logger.info('FUNCTIONAL_ADJUSTMENT', 'Adjusting exercise reps', {
      exerciseId,
      exerciseName: exercise.name,
      currentReps,
      delta,
      newReps
    });

    const updatedExercises = [...prescription.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      reps: newReps
    };

    const updatedPrescription = {
      ...prescription,
      exercises: updatedExercises
    };

    const message = `${exercise.name}: ${currentReps} → ${newReps} reps`;

    return {
      success: true,
      updatedPrescription,
      message
    };
  }

  /**
   * Apply scaling level to an exercise
   */
  applyScaling(
    prescription: any,
    exerciseId: string,
    scalingLevel: 'rx' | 'scaled' | 'foundations'
  ): AdjustmentResult {
    const exerciseIndex = prescription.exercises.findIndex((ex: Exercise) => ex.id === exerciseId);

    if (exerciseIndex === -1) {
      return {
        success: false,
        updatedPrescription: prescription,
        message: 'Exercice non trouvé'
      };
    }

    const exercise = prescription.exercises[exerciseIndex];
    const scalingOption = exercise.scalingOptions?.find((opt: any) => opt.level === scalingLevel);

    if (!scalingOption) {
      return {
        success: false,
        updatedPrescription: prescription,
        message: 'Option de scaling non disponible'
      };
    }

    logger.info('FUNCTIONAL_ADJUSTMENT', 'Applying scaling', {
      exerciseId,
      exerciseName: exercise.name,
      scalingLevel,
      modification: scalingOption.modification
    });

    const updatedExercises = [...prescription.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      currentScaling: scalingLevel,
      scalingModification: scalingOption.modification
    };

    const updatedPrescription = {
      ...prescription,
      exercises: updatedExercises
    };

    const message = `${exercise.name} → ${scalingLevel.toUpperCase()}: ${scalingOption.description}`;

    return {
      success: true,
      updatedPrescription,
      message,
      suggestions: [scalingOption.description]
    };
  }

  /**
   * Substitute an exercise with an alternative
   */
  substituteExercise(
    prescription: any,
    exerciseId: string,
    newExercise: Exercise
  ): AdjustmentResult {
    const exerciseIndex = prescription.exercises.findIndex((ex: Exercise) => ex.id === exerciseId);

    if (exerciseIndex === -1) {
      return {
        success: false,
        updatedPrescription: prescription,
        message: 'Exercice non trouvé'
      };
    }

    const oldExercise = prescription.exercises[exerciseIndex];

    logger.info('FUNCTIONAL_ADJUSTMENT', 'Substituting exercise', {
      exerciseId,
      oldExerciseName: oldExercise.name,
      newExerciseName: newExercise.name
    });

    const updatedExercises = [...prescription.exercises];
    updatedExercises[exerciseIndex] = {
      ...newExercise,
      id: exerciseId, // Keep same ID for tracking
      sets: oldExercise.sets,
      reps: oldExercise.reps, // Maintain same volume
      rest: oldExercise.rest
    };

    const updatedPrescription = {
      ...prescription,
      exercises: updatedExercises
    };

    const message = `${oldExercise.name} remplacé par ${newExercise.name}`;

    return {
      success: true,
      updatedPrescription,
      message
    };
  }

  /**
   * Get exercise alternatives based on category
   */
  getExerciseAlternatives(exercise: Exercise): Exercise[] {
    const alternatives: Record<string, Partial<Exercise>[]> = {
      'pull-ups': [
        { name: 'Ring Rows', variant: 'Horizontal pulling', category: 'gymnastic' },
        { name: 'Jumping Pull-ups', variant: 'Assisted', category: 'gymnastic' },
        { name: 'Lat Pulldown', variant: 'Machine', category: 'weighted' }
      ],
      'push-ups': [
        { name: 'Knee Push-ups', variant: 'Modified', category: 'bodyweight' },
        { name: 'Elevated Push-ups', variant: 'Hands on box', category: 'bodyweight' },
        { name: 'DB Floor Press', variant: 'Weighted', category: 'weighted' }
      ],
      'thruster': [
        { name: 'Front Squat + Push Press', variant: 'Separated', category: 'weighted' },
        { name: 'Goblet Squat + DB Press', variant: 'Dumbbells', category: 'weighted' },
        { name: 'Wall Ball', variant: 'Ball to target', category: 'weighted' }
      ],
      'burpees': [
        { name: 'Step-back Burpee', variant: 'No jump', category: 'bodyweight' },
        { name: 'Elevated Burpee', variant: 'Hands on box', category: 'bodyweight' },
        { name: 'Jumping Jacks', variant: 'Lower impact', category: 'bodyweight' }
      ],
      'air-squats': [
        { name: 'Box Squats', variant: 'Sit to target', category: 'bodyweight' },
        { name: 'Goblet Squats', variant: 'Weighted', category: 'weighted' },
        { name: 'Jump Squats', variant: 'Explosive', category: 'bodyweight' }
      ]
    };

    const exerciseKey = exercise.name.toLowerCase().replace(/\s+/g, '-');
    const alts = alternatives[exerciseKey] || [];

    return alts.map((alt, index) => ({
      id: `alt-${index}`,
      name: alt.name!,
      variant: alt.variant,
      category: alt.category as any,
      sets: exercise.sets,
      reps: exercise.reps,
      rest: exercise.rest,
      rpeTarget: exercise.rpeTarget,
      techniqueLevel: 'developing' as any,
      movementPattern: exercise.movementPattern,
      scalingOptions: [],
      executionCues: [],
      coachNotes: `Alternative à ${exercise.name}`,
      coachTips: []
    }));
  }

  /**
   * Generate time cap suggestions based on WOD format
   */
  private generateTimeCapSuggestions(wodFormat: string, newTimeCap: number): string[] {
    const suggestions: Record<string, (cap: number) => string[]> = {
      'amrap': (cap) => [
        `Target ${Math.floor(cap * 0.75)}-${cap} rounds pour débutant`,
        `Pacing: Maintenir intensité 80% sur toute la durée`,
        `Break intelligent: Ne pas griller les premières minutes`
      ],
      'forTime': (cap) => [
        `Objectif: Terminer en ${Math.floor(cap * 0.6)}-${Math.floor(cap * 0.8)} minutes`,
        `Stratégie: Breaks courts et fréquents plutôt que longs`,
        `Si time cap atteint: scaled version next time`
      ],
      'emom': (cap) => [
        `${cap} minutes = ${cap} rounds de travail`,
        `Objectif: Terminer chaque round en 40-45 secondes max`,
        `Rest 15-20 secondes minimum par round`
      ],
      'tabata': (cap) => [
        `8 rounds de 20s work / 10s rest`,
        `Score = worst round (reps minimum)`,
        `Maintenir intensité maximale sur 20 secondes`
      ]
    };

    const generator = suggestions[wodFormat];
    return generator ? generator(newTimeCap) : [`Time cap ajusté à ${newTimeCap} minutes`];
  }

  /**
   * Validate prescription after adjustments
   */
  validatePrescription(prescription: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prescription.timeCapMinutes || prescription.timeCapMinutes < 5) {
      errors.push('Time cap trop court (minimum 5 minutes)');
    }

    if (!prescription.exercises || prescription.exercises.length === 0) {
      errors.push('Aucun exercice dans le WOD');
    }

    prescription.exercises?.forEach((ex: Exercise, index: number) => {
      if (!ex.name) {
        errors.push(`Exercice ${index + 1}: Nom manquant`);
      }
      if (!ex.reps || (typeof ex.reps === 'number' && ex.reps < 1)) {
        errors.push(`Exercice ${ex.name}: Reps invalides`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const functionalAdjustmentService = new FunctionalAdjustmentService();

/**
 * Exercise Progression Service
 * Calcule et gère les charges progressives adaptées par exercice
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';
import type { Exercise } from '../store/trainingPipeline/types';

interface LoadConversionRatio {
  exerciseA: string;
  exerciseB: string;
  ratio: number;
}

const EXERCISE_LOAD_RATIOS: LoadConversionRatio[] = [
  { exerciseA: 'Squat', exerciseB: 'Fentes Bulgares', ratio: 0.6 },
  { exerciseA: 'Squat', exerciseB: 'Goblet Squat', ratio: 0.5 },
  { exerciseA: 'Squat', exerciseB: 'Front Squat', ratio: 0.85 },
  { exerciseA: 'Développé Couché', exerciseB: 'Développé Incliné', ratio: 0.85 },
  { exerciseA: 'Développé Couché', exerciseB: 'Pompes', ratio: 0 },
  { exerciseA: 'Soulevé de Terre', exerciseB: 'Romanian Deadlift', ratio: 0.8 },
  { exerciseA: 'Traction', exerciseB: 'Tirage Vertical', ratio: 0.7 },
  { exerciseA: 'Développé Militaire', exerciseB: 'Élévations Latérales', ratio: 0.4 },
];

interface AdjustmentResult {
  oldValue: number | number[];
  newValue: number | number[];
  adjustment: number;
  adjustmentType: 'load_increase' | 'load_decrease' | 'sets_increase' | 'sets_decrease' | 'reps_increase' | 'reps_decrease';
}

class ExerciseProgressionService {
  async recordAdjustment(
    userId: string,
    exerciseName: string,
    adjustmentType: string,
    oldValue: number,
    newValue: number,
    context?: any
  ): Promise<void> {
    if (!userId) {
      logger.warn('EXERCISE_PROGRESSION_SERVICE', 'Cannot record adjustment: no user ID provided');
      return;
    }

    try {
      const { error } = await supabase
        .from('training_exercise_load_adjustments')
        .insert({
          user_id: userId,
          exercise_name: exerciseName,
          adjustment_type: adjustmentType,
          old_value: oldValue,
          new_value: newValue,
          context: context || {}
        });

      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST205') {
          logger.error('EXERCISE_PROGRESSION_SERVICE', 'Database table not found - migration may not be applied', {
            error: error.message,
            code: error.code,
            hint: 'Check if training_exercise_load_adjustments table exists in Supabase'
          });
        } else if (error.code === '42501') {
          logger.error('EXERCISE_PROGRESSION_SERVICE', 'Permission denied - RLS policy issue', {
            error: error.message,
            code: error.code,
            userId,
            hint: 'Check RLS policies on training_exercise_load_adjustments table'
          });
        } else {
          logger.error('EXERCISE_PROGRESSION_SERVICE', 'Failed to record adjustment', {
            error: error.message,
            code: error.code,
            details: error.details
          });
        }
      } else {
        logger.info('EXERCISE_PROGRESSION_SERVICE', 'Adjustment recorded successfully', {
          userId,
          exerciseName,
          adjustmentType,
          oldValue,
          newValue
        });
      }
    } catch (error) {
      logger.error('EXERCISE_PROGRESSION_SERVICE', 'Exception recording adjustment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        exerciseName
      });
    }
  }

  async getAverageAdjustment(
    userId: string,
    exerciseName: string,
    adjustmentType: string,
    limit: number = 10
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_user_exercise_adjustment_avg', {
        p_user_id: userId,
        p_exercise_name: exerciseName,
        p_adjustment_type: adjustmentType,
        p_limit: limit
      });

      if (error) {
        logger.error('EXERCISE_PROGRESSION_SERVICE', 'Failed to get average adjustment', { error });
        return 0;
      }

      return data || 0;
    } catch (error) {
      logger.error('EXERCISE_PROGRESSION_SERVICE', 'Exception getting average adjustment', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  convertLoadBetweenExercises(
    fromExercise: string,
    toExercise: string,
    fromLoad: number | number[]
  ): number | number[] {
    const normalizedFrom = this.normalizeExerciseName(fromExercise);
    const normalizedTo = this.normalizeExerciseName(toExercise);

    const ratio = this.findConversionRatio(normalizedFrom, normalizedTo);

    if (ratio === null) {
      logger.warn('EXERCISE_PROGRESSION_SERVICE', 'No conversion ratio found, using 70% default', {
        fromExercise,
        toExercise
      });
      return this.applyRatio(fromLoad, 0.7);
    }

    logger.info('EXERCISE_PROGRESSION_SERVICE', 'Converting load between exercises', {
      fromExercise,
      toExercise,
      fromLoad,
      ratio,
      resultLoad: this.applyRatio(fromLoad, ratio)
    });

    return this.applyRatio(fromLoad, ratio);
  }

  private normalizeExerciseName(exerciseName: string): string {
    return exerciseName
      .toLowerCase()
      .replace(/[éèê]/g, 'e')
      .replace(/[àâ]/g, 'a')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private findConversionRatio(fromExercise: string, toExercise: string): number | null {
    const match = EXERCISE_LOAD_RATIOS.find(
      ratio =>
        (this.normalizeExerciseName(ratio.exerciseA).includes(fromExercise) &&
          this.normalizeExerciseName(ratio.exerciseB).includes(toExercise)) ||
        (this.normalizeExerciseName(ratio.exerciseB).includes(fromExercise) &&
          this.normalizeExerciseName(ratio.exerciseA).includes(toExercise))
    );

    if (!match) return null;

    if (this.normalizeExerciseName(match.exerciseA).includes(fromExercise)) {
      return match.ratio;
    } else {
      return 1 / match.ratio;
    }
  }

  private applyRatio(load: number | number[], ratio: number): number | number[] {
    if (Array.isArray(load)) {
      return load.map(l => Math.round(l * ratio * 2) / 2);
    }
    return Math.round(load * ratio * 2) / 2;
  }

  increaseSets(currentSets: number): AdjustmentResult {
    const newSets = Math.min(currentSets + 1, 8);
    return {
      oldValue: currentSets,
      newValue: newSets,
      adjustment: newSets - currentSets,
      adjustmentType: 'sets_increase'
    };
  }

  decreaseSets(currentSets: number): AdjustmentResult {
    const newSets = Math.max(currentSets - 1, 1);
    return {
      oldValue: currentSets,
      newValue: newSets,
      adjustment: currentSets - newSets,
      adjustmentType: 'sets_decrease'
    };
  }

  increaseReps(currentReps: number): AdjustmentResult {
    const newReps = Math.min(currentReps + 2, 20);
    return {
      oldValue: currentReps,
      newValue: newReps,
      adjustment: newReps - currentReps,
      adjustmentType: 'reps_increase'
    };
  }

  decreaseReps(currentReps: number): AdjustmentResult {
    const newReps = Math.max(currentReps - 2, 1);
    return {
      oldValue: currentReps,
      newValue: newReps,
      adjustment: currentReps - newReps,
      adjustmentType: 'reps_decrease'
    };
  }

  increaseLoad(currentLoad: number | number[]): AdjustmentResult {
    if (Array.isArray(currentLoad)) {
      const increment = currentLoad[0] < 20 ? 2.5 : currentLoad[0] < 60 ? 5 : 10;
      const newLoad = currentLoad.map(l => l + increment);
      return {
        oldValue: currentLoad,
        newValue: newLoad,
        adjustment: increment,
        adjustmentType: 'load_increase'
      };
    } else {
      const increment = currentLoad < 20 ? 2.5 : currentLoad < 60 ? 5 : 10;
      const newLoad = currentLoad + increment;
      return {
        oldValue: currentLoad,
        newValue: newLoad,
        adjustment: increment,
        adjustmentType: 'load_increase'
      };
    }
  }

  decreaseLoad(currentLoad: number | number[]): AdjustmentResult {
    if (Array.isArray(currentLoad)) {
      const decrement = currentLoad[0] < 20 ? 2.5 : currentLoad[0] < 60 ? 5 : 10;
      const newLoad = currentLoad.map(l => Math.max(l - decrement, 0));
      return {
        oldValue: currentLoad,
        newValue: newLoad,
        adjustment: decrement,
        adjustmentType: 'load_decrease'
      };
    } else {
      const decrement = currentLoad < 20 ? 2.5 : currentLoad < 60 ? 5 : 10;
      const newLoad = Math.max(currentLoad - decrement, 0);
      return {
        oldValue: currentLoad,
        newValue: newLoad,
        adjustment: decrement,
        adjustmentType: 'load_decrease'
      };
    }
  }

  generateProgressiveLoad(baseLoad: number, sets: number): number[] {
    const progression: number[] = [];
    const increment = baseLoad < 20 ? 2.5 : baseLoad < 60 ? 5 : 10;

    if (sets <= 3) {
      for (let i = 0; i < sets; i++) {
        progression.push(baseLoad);
      }
    } else {
      const warmupSets = Math.max(1, Math.floor(sets * 0.4));
      const workingSets = sets - warmupSets;

      for (let i = 0; i < warmupSets; i++) {
        const load = baseLoad - (warmupSets - i) * increment;
        progression.push(Math.max(load, baseLoad * 0.5));
      }

      for (let i = 0; i < workingSets; i++) {
        progression.push(baseLoad);
      }
    }

    return progression.map(l => Math.round(l * 2) / 2);
  }
}

export const exerciseProgressionService = new ExerciseProgressionService();

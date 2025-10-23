/**
 * useExerciseIllustrations Hook
 * Manages exercise illustrations with persistence across pipeline steps
 */

import { useCallback, useEffect } from 'react';
import { useTrainingPipeline } from '../system/store/trainingPipeline';
import { illustrationCacheService } from '../system/services/illustrationCacheService';
import logger from '../lib/utils/logger';

export interface ExerciseIllustrationInfo {
  exerciseName: string;
  discipline: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  isGenerating: boolean;
  error: boolean;
}

export function useExerciseIllustrations() {
  const { sessionPrescription, currentSessionId, exerciseIllustrations, setExerciseIllustrations } = useTrainingPipeline();

  const getIllustration = useCallback((exerciseName: string, discipline: string) => {
    const key = `${exerciseName}-${discipline}`;
    return exerciseIllustrations?.[key] || null;
  }, [exerciseIllustrations]);

  const setIllustration = useCallback((
    exerciseName: string,
    discipline: string,
    data: {
      imageUrl?: string;
      thumbnailUrl?: string;
      isGenerating: boolean;
      error: boolean;
    }
  ) => {
    const key = `${exerciseName}-${discipline}`;
    setExerciseIllustrations((prev) => ({
      ...prev,
      [key]: {
        exerciseName,
        discipline,
        ...data
      }
    }));

    logger.debug('USE_EXERCISE_ILLUSTRATIONS', 'Illustration state updated', {
      exerciseName,
      discipline,
      hasImage: !!data.imageUrl,
      isGenerating: data.isGenerating,
      error: data.error
    });
  }, [setExerciseIllustrations]);

  const preloadFromCache = useCallback(async () => {
    if (!sessionPrescription) return;

    const exercises = sessionPrescription.exercises || [];
    const discipline = sessionPrescription.discipline || sessionPrescription.category || 'force';

    logger.info('USE_EXERCISE_ILLUSTRATIONS', 'Preloading illustrations from cache', {
      exerciseCount: exercises.length,
      discipline
    });

    exercises.forEach((exercise) => {
      const cached = illustrationCacheService.get(exercise.name, discipline);
      if (cached) {
        setIllustration(exercise.name, discipline, {
          imageUrl: cached.imageUrl,
          thumbnailUrl: cached.thumbnailUrl,
          isGenerating: false,
          error: false
        });
        logger.debug('USE_EXERCISE_ILLUSTRATIONS', 'Preloaded from cache', {
          exerciseName: exercise.name
        });
      }
    });
  }, [sessionPrescription, setIllustration]);

  useEffect(() => {
    if (!sessionPrescription) return;

    const exercises = sessionPrescription.exercises || [];
    const discipline = sessionPrescription.discipline || sessionPrescription.category || 'force';

    logger.info('USE_EXERCISE_ILLUSTRATIONS', 'Preloading illustrations from cache', {
      exerciseCount: exercises.length,
      discipline
    });

    exercises.forEach((exercise) => {
      const cached = illustrationCacheService.get(exercise.name, discipline);
      if (cached) {
        setIllustration(exercise.name, discipline, {
          imageUrl: cached.imageUrl,
          thumbnailUrl: cached.thumbnailUrl,
          isGenerating: false,
          error: false
        });
        logger.debug('USE_EXERCISE_ILLUSTRATIONS', 'Preloaded from cache', {
          exerciseName: exercise.name
        });
      }
    });
  }, [sessionPrescription, setIllustration]);

  const clearIllustrations = useCallback(() => {
    setExerciseIllustrations({});
    logger.info('USE_EXERCISE_ILLUSTRATIONS', 'Cleared all illustrations');
  }, [setExerciseIllustrations]);

  return {
    getIllustration,
    setIllustration,
    clearIllustrations,
    preloadFromCache
  };
}

import type { SessionPrescription, Exercise, EnduranceWorkoutItem } from '../system/store/trainingPipeline/types';
import logger from '../lib/utils/logger';

export function isEndurancePrescription(prescription: any): boolean {
  return !!(prescription.mainWorkout && Array.isArray(prescription.mainWorkout));
}

export function isForcePrescription(prescription: any): boolean {
  return !!(prescription.exercises && Array.isArray(prescription.exercises));
}

export function isCompetitionPrescription(prescription: any): boolean {
  return !!(prescription.stations && Array.isArray(prescription.stations));
}

export function getWorkoutItems(prescription: SessionPrescription): Exercise[] | EnduranceWorkoutItem[] {
  if (prescription.mainWorkout && prescription.mainWorkout.length > 0) {
    return prescription.mainWorkout;
  }
  return prescription.exercises || [];
}

export function getWorkoutItemsCount(prescription: SessionPrescription | null | undefined): number {
  if (!prescription) return 0;

  if (prescription.mainWorkout && prescription.mainWorkout.length > 0) {
    return prescription.mainWorkout.length;
  }

  return prescription.exercises?.length || 0;
}

function convertEnduranceWorkoutToExercise(workoutItem: EnduranceWorkoutItem): Exercise {
  const durationMinutes = workoutItem.duration || 0;
  const restSeconds = Math.round(durationMinutes * 0.1 * 60);

  return {
    id: workoutItem.id,
    name: workoutItem.name,
    variant: workoutItem.type,
    sets: workoutItem.intervals?.repeats || 1,
    reps: workoutItem.intervals?.work?.duration || durationMinutes,
    rest: workoutItem.intervals?.rest?.duration || restSeconds,
    rpeTarget: workoutItem.rpeTarget,
    coachNotes: workoutItem.coachNotes || workoutItem.description,
    coachTips: workoutItem.cues || [],
    safetyNotes: [],
    commonMistakes: []
  };
}

function convertCompetitionStationToExercise(station: any): Exercise {
  logger.info('PRESCRIPTION_NORMALIZER', 'Converting competition station to exercise', {
    stationId: station.id,
    stationName: station.name,
    stationType: station.stationType,
    hasExercises: !!station.exercises,
    exercisesCount: station.exercises?.length || 0
  });

  // For competitions, stations have a different structure
  // Station = { id, name, type, distance, targetTime, exercises: [...] }
  return {
    id: station.id,
    name: station.name,
    variant: station.stationType || 'competition',
    sets: 1, // Competitions typically have 1 set per station
    reps: station.targetReps || station.distance || 0,
    rest: station.transitionTime || 0,
    rpeTarget: station.rpeTarget,
    coachNotes: station.coachNotes || station.description || '',
    coachTips: station.cues || station.tips || [],
    safetyNotes: station.safetyNotes || [],
    commonMistakes: station.commonMistakes || [],
    // Preserve competition-specific fields
    distance: station.distance,
    targetTime: station.targetTime,
    stationType: station.stationType,
    exercises: station.exercises // For multi-exercise stations
  };
}

function deduceDisciplineFromContext(prescription: any): string {
  const sessionName = (prescription.sessionName || '').toLowerCase();
  const sessionSummary = (prescription.sessionSummary || '').toLowerCase();
  const combinedText = `${sessionName} ${sessionSummary}`;

  if (combinedText.includes('course') || combinedText.includes('run') || combinedText.includes('footing')) {
    return 'running';
  }
  if (combinedText.includes('v\u00e9lo') || combinedText.includes('cycl') || combinedText.includes('bike')) {
    return 'cycling';
  }
  if (combinedText.includes('natation') || combinedText.includes('piscine') || combinedText.includes('swim')) {
    return 'swimming';
  }
  if (combinedText.includes('triathlon')) {
    return 'triathlon';
  }

  logger.warn('PRESCRIPTION_NORMALIZER', 'Could not deduce discipline, defaulting to cardio', {
    sessionName: prescription.sessionName,
    sessionSummary: prescription.sessionSummary
  });

  return 'cardio';
}

export function normalizePrescription(rawPrescription: any): SessionPrescription {
  const isEndurance = isEndurancePrescription(rawPrescription);
  const isCompetition = isCompetitionPrescription(rawPrescription);

  logger.info('PRESCRIPTION_NORMALIZER', 'Normalizing prescription', {
    isEndurance,
    isCompetition,
    hasMainWorkout: !!rawPrescription.mainWorkout,
    hasExercises: !!rawPrescription.exercises,
    hasStations: !!rawPrescription.stations,
    mainWorkoutLength: rawPrescription.mainWorkout?.length || 0,
    exercisesLength: rawPrescription.exercises?.length || 0,
    stationsLength: rawPrescription.stations?.length || 0,
    type: rawPrescription.type,
    category: rawPrescription.category,
    competitionFormat: rawPrescription.competitionFormat,
    hasDiscipline: !!rawPrescription.discipline,
    discipline: rawPrescription.discipline
  });

  // Handle COMPETITIONS format (stations)
  if (isCompetition) {
    logger.info('PRESCRIPTION_NORMALIZER', 'Processing competition prescription with stations', {
      stationsCount: rawPrescription.stations.length,
      competitionFormat: rawPrescription.competitionFormat,
      category: rawPrescription.category
    });

    const normalizedExercises = (rawPrescription.stations || []).map(convertCompetitionStationToExercise);

    const normalized = {
      ...rawPrescription,
      exercises: normalizedExercises,
      focus: rawPrescription.focusZones || rawPrescription.focus || [],
      // Preserve competition-specific fields
      competitionFormat: rawPrescription.competitionFormat,
      stations: rawPrescription.stations // Keep original stations data
    };

    console.log('✅ PRESCRIPTION_NORMALIZER - Competition normalized:', {
      originalStationsCount: rawPrescription.stations?.length || 0,
      normalizedExercisesCount: normalizedExercises.length,
      competitionFormat: rawPrescription.competitionFormat,
      hasStationsInResult: !!normalized.stations,
      hasExercisesInResult: !!normalized.exercises,
      exercisesCountInResult: normalized.exercises?.length || 0,
      resultKeys: Object.keys(normalized),
      firstExerciseSample: normalized.exercises?.[0]
    });

    logger.info('PRESCRIPTION_NORMALIZER', 'Competition prescription normalized', {
      originalStationsCount: rawPrescription.stations?.length || 0,
      normalizedExercisesCount: normalizedExercises.length,
      competitionFormat: rawPrescription.competitionFormat,
      hasStationsInResult: !!normalized.stations,
      hasExercisesInResult: !!normalized.exercises,
      exercisesCountInResult: normalized.exercises?.length || 0
    });

    return normalized;
  }

  // Handle ENDURANCE format (mainWorkout)
  if (isEndurance) {
    const normalizedExercises = (rawPrescription.mainWorkout || []).map(convertEnduranceWorkoutToExercise);

    const effectiveDiscipline = rawPrescription.discipline || deduceDisciplineFromContext(rawPrescription);

    if (!rawPrescription.discipline) {
      logger.warn('PRESCRIPTION_NORMALIZER', 'Discipline missing, using deduced value', {
        originalDiscipline: rawPrescription.discipline,
        deducedDiscipline: effectiveDiscipline,
        sessionName: rawPrescription.sessionName
      });
    }

    const normalized = {
      ...rawPrescription,
      discipline: effectiveDiscipline,
      exercises: normalizedExercises,
      focus: rawPrescription.focusZones || rawPrescription.focus || []
    };

    console.log('✅ PRESCRIPTION_NORMALIZER - Endurance normalized:', {
      originalMainWorkoutCount: rawPrescription.mainWorkout?.length || 0,
      normalizedExercisesCount: normalizedExercises.length,
      discipline: effectiveDiscipline,
      hasMainWorkoutInResult: !!normalized.mainWorkout,
      mainWorkoutCountInResult: normalized.mainWorkout?.length || 0,
      hasExercisesInResult: !!normalized.exercises,
      exercisesCountInResult: normalized.exercises?.length || 0,
      resultKeys: Object.keys(normalized),
      mainWorkoutSample: normalized.mainWorkout?.[0]
    });

    logger.info('PRESCRIPTION_NORMALIZER', 'Endurance prescription normalized', {
      originalMainWorkoutCount: rawPrescription.mainWorkout?.length || 0,
      normalizedExercisesCount: normalizedExercises.length,
      discipline: effectiveDiscipline,
      hasMainWorkoutInResult: !!normalized.mainWorkout,
      mainWorkoutCountInResult: normalized.mainWorkout?.length || 0,
      hasExercisesInResult: !!normalized.exercises,
      exercisesCountInResult: normalized.exercises?.length || 0,
      resultKeys: Object.keys(normalized)
    });

    return normalized;
  }

  // Handle FORCE format (exercises already present)
  if (!rawPrescription.exercises || rawPrescription.exercises.length === 0) {
    logger.warn('PRESCRIPTION_NORMALIZER', 'Prescription missing exercises, mainWorkout, and stations', {
      keys: Object.keys(rawPrescription),
      type: rawPrescription.type,
      category: rawPrescription.category,
      hasExercises: !!rawPrescription.exercises,
      hasMainWorkout: !!rawPrescription.mainWorkout,
      hasStations: !!rawPrescription.stations
    });

    return {
      ...rawPrescription,
      exercises: [],
      focus: rawPrescription.focus || []
    };
  }

  logger.info('PRESCRIPTION_NORMALIZER', 'Force prescription already normalized', {
    exercisesCount: rawPrescription.exercises.length
  });

  return rawPrescription;
}

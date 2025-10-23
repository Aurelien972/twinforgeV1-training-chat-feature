/**
 * Coach Messages Utilities
 * Generate personalized motivational messages based on session characteristics
 */

import type { SessionPrescription } from '../system/store/trainingPipeline/types';

/**
 * Calculate average RPE across all exercises in prescription
 */
export const calculateAvgRPE = (prescription: SessionPrescription): number => {
  if (!prescription.exercises || prescription.exercises.length === 0) return 7;

  const totalRPE = prescription.exercises.reduce((sum, exercise) => {
    return sum + (exercise.rpeTarget || 7);
  }, 0);

  return Math.round((totalRPE / prescription.exercises.length) * 10) / 10;
};

/**
 * Calculate total sets across all exercises
 */
export const calculateTotalSets = (prescription: SessionPrescription): number => {
  if (!prescription.exercises || prescription.exercises.length === 0) return 0;

  return prescription.exercises.reduce((sum, exercise) => {
    return sum + (exercise.sets || 0);
  }, 0);
};

/**
 * Calculate total volume (sets × reps) across all exercises
 */
export const calculateTotalVolume = (prescription: SessionPrescription): number => {
  if (!prescription.exercises || prescription.exercises.length === 0) return 0;

  return prescription.exercises.reduce((sum, exercise) => {
    return sum + ((exercise.sets || 0) * (exercise.reps || 0));
  }, 0);
};

/**
 * Get session intensity level based on average RPE
 */
export const getSessionIntensity = (avgRPE: number): 'light' | 'moderate' | 'hard' | 'extreme' => {
  if (avgRPE >= 9) return 'extreme';
  if (avgRPE >= 8) return 'hard';
  if (avgRPE >= 6) return 'moderate';
  return 'light';
};

/**
 * Get motivational message based on session characteristics
 */
export const getCoachMotivationalMessage = (prescription: SessionPrescription): string => {
  const avgRPE = calculateAvgRPE(prescription);
  const intensity = getSessionIntensity(avgRPE);
  const focus = prescription.focus && prescription.focus.length > 0 ? prescription.focus[0] : 'ton entraînement';
  const sessionName = prescription.sessionName || prescription.type;

  // Use sessionSummary if available
  if (prescription.sessionSummary) {
    return prescription.sessionSummary;
  }

  // Generate based on intensity
  switch (intensity) {
    case 'extreme':
      return `Séance extrême aujourd'hui ! Le ${focus} va être sérieusement challengé. Concentre-toi sur chaque répétition et donne absolument tout. C'est maintenant que tu progresses ! 💪`;

    case 'hard':
      return `Séance intense qui va te pousser dans tes retranchements. Focus ${focus}, technique impeccable, et mental d'acier. Tu vas sortir grandi de cette session ! 🔥`;

    case 'moderate':
      return `Session équilibrée avec focus ${focus}. L'objectif : qualité d'exécution et progression mesurée. Profite de chaque série pour perfectionner ta technique. On y va ! ⚡`;

    case 'light':
      return `Séance technique et qualitative axée ${focus}. Aujourd'hui c'est la perfection du mouvement qui compte. Chaque répétition doit être irréprochable. Let's do this ! ✨`;

    default:
      return `${sessionName} - Une séance qui te correspond. Reste concentré et profite de chaque mouvement pour progresser ! 🎯`;
  }
};

/**
 * Get session emoji based on intensity
 */
export const getSessionEmoji = (prescription: SessionPrescription): string => {
  const avgRPE = calculateAvgRPE(prescription);
  const intensity = getSessionIntensity(avgRPE);

  switch (intensity) {
    case 'extreme': return '💀';
    case 'hard': return '🔥';
    case 'moderate': return '⚡';
    case 'light': return '✨';
    default: return '💪';
  }
};

/**
 * Get intensity color based on RPE
 */
export const getIntensityColor = (avgRPE: number): string => {
  if (avgRPE >= 9) return '#DC2626'; // red-600
  if (avgRPE >= 8) return '#F59E0B'; // amber-500
  if (avgRPE >= 6) return '#10B981'; // emerald-500
  return '#3B82F6'; // blue-500
};

/**
 * Get intensity label based on RPE
 */
export const getIntensityLabel = (avgRPE: number): string => {
  if (avgRPE >= 9) return 'Extrême';
  if (avgRPE >= 8) return 'Intense';
  if (avgRPE >= 6) return 'Modéré';
  return 'Technique';
};

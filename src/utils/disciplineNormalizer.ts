/**
 * Discipline Normalizer
 * Ensures discipline values are consistent across the app and match DB constraints
 */

import logger from '../lib/utils/logger';

/**
 * Valid discipline values according to DB CHECK constraint
 */
export type NormalizedDiscipline = 'force' | 'endurance' | 'functional' | 'competitions' | 'calisthenics';

/**
 * Mapping of alternative discipline names to normalized values
 */
const DISCIPLINE_MAP: Record<string, NormalizedDiscipline> = {
  // Force variants
  'force': 'force',
  'Force': 'force',
  'strength': 'force',
  'Strength': 'force',
  'power': 'force',
  'Power': 'force',
  'musculation': 'force',
  'Musculation': 'force',
  'weights': 'force',
  'Weights': 'force',

  // Endurance variants
  'endurance': 'endurance',
  'Endurance': 'endurance',
  'running': 'endurance',
  'Running': 'endurance',
  'cycling': 'endurance',
  'Cycling': 'endurance',
  'cardio': 'endurance',
  'Cardio': 'endurance',

  // Functional variants
  'functional': 'functional',
  'Functional': 'functional',
  'functional-crosstraining': 'functional',
  'Functional-CrossTraining': 'functional',
  'crossfit': 'functional',
  'CrossFit': 'functional',
  'wod': 'functional',
  'WOD': 'functional',

  // Competitions variants
  'competitions': 'competitions',
  'Competitions': 'competitions',
  'fitness-competitions': 'competitions',
  'Fitness-Competitions': 'competitions',
  'hyrox': 'competitions',
  'Hyrox': 'competitions',
  'deka': 'competitions',
  'Deka': 'competitions',

  // Calisthenics variants
  'calisthenics': 'calisthenics',
  'Calisthenics': 'calisthenics',
  'callisthenics': 'calisthenics',
  'bodyweight': 'calisthenics',
  'Bodyweight': 'calisthenics',
};

/**
 * Normalize a discipline value to match DB constraints
 * Returns 'force' as default if value is not recognized
 */
export function normalizeDiscipline(discipline: string | undefined | null): NormalizedDiscipline {
  if (!discipline) {
    logger.warn('DISCIPLINE_NORMALIZER', 'Empty discipline provided, defaulting to force');
    return 'force';
  }

  const normalized = DISCIPLINE_MAP[discipline];

  if (!normalized) {
    logger.warn('DISCIPLINE_NORMALIZER', 'Unknown discipline value, defaulting to force', {
      originalValue: discipline,
      availableValues: Object.keys(DISCIPLINE_MAP)
    });
    return 'force';
  }

  return normalized;
}

/**
 * Validate if a discipline value is valid (matches DB constraint)
 */
export function isValidDiscipline(discipline: string): boolean {
  const validValues: NormalizedDiscipline[] = ['force', 'endurance', 'functional', 'competitions', 'calisthenics'];
  return validValues.includes(discipline as NormalizedDiscipline);
}

/**
 * Get discipline from session prescription with fallback
 */
export function getDisciplineFromPrescription(prescription: any): NormalizedDiscipline {
  // Try multiple possible field names
  const rawDiscipline = prescription?.discipline ||
                        prescription?.category ||
                        prescription?.type ||
                        prescription?.sessionType;

  return normalizeDiscipline(rawDiscipline);
}

/**
 * Normalize discipline in an object (mutates the object)
 */
export function normalizeDisciplineInObject<T extends { discipline?: string; category?: string }>(
  obj: T
): T & { discipline: NormalizedDiscipline } {
  const rawDiscipline = obj.discipline || obj.category;
  const normalized = normalizeDiscipline(rawDiscipline);

  return {
    ...obj,
    discipline: normalized
  };
}

/**
 * Discipline Color Mapper
 * Maps training disciplines to their respective brand colors
 */

import type { AgentType } from '../domain/ai/trainingAiTypes';

export const DISCIPLINE_COLORS: Record<string, string> = {
  // Force & Powerbuilding - Blue
  'strength': '#3B82F6',
  'powerlifting': '#3B82F6',
  'bodybuilding': '#3B82F6',
  'strongman': '#3B82F6',

  // Endurance - Green
  'running': '#22C55E',
  'cycling': '#22C55E',
  'swimming': '#22C55E',
  'triathlon': '#22C55E',
  'cardio': '#22C55E',

  // Functional & CrossTraining - Red
  'crossfit': '#DC2626',
  'hiit': '#DC2626',
  'functional': '#DC2626',
  'circuit': '#DC2626',

  // Calisthenics & Street - Cyan
  'calisthenics': '#06B6D4',
  'street-workout': '#06B6D4',

  // Wellness & Mobility - Purple
  'yoga': '#A855F7',
  'pilates': '#A855F7',

  // Default fallback
  'default': '#3B82F6'
};

export const CATEGORY_COLORS: Record<string, string> = {
  'force-powerbuilding': '#3B82F6',
  'endurance': '#22C55E',
  'functional-crosstraining': '#DC2626',
  'calisthenics-street': '#06B6D4',
  'wellness-mobility': '#A855F7',
  'default': '#3B82F6'
};

/**
 * Get the color for a specific discipline
 * @param discipline - The discipline name (e.g., 'strength', 'running', 'crossfit')
 * @returns The hex color code for the discipline
 */
export function getDisciplineColor(discipline: string | undefined): string {
  if (!discipline) return DISCIPLINE_COLORS.default;

  const normalizedDiscipline = discipline.toLowerCase().trim();
  return DISCIPLINE_COLORS[normalizedDiscipline] || DISCIPLINE_COLORS.default;
}

/**
 * Get the color for a category
 * @param category - The category ID (e.g., 'force-powerbuilding', 'endurance')
 * @returns The hex color code for the category
 */
export function getCategoryColor(category: string | undefined): string {
  if (!category) return CATEGORY_COLORS.default;

  const normalizedCategory = category.toLowerCase().trim();
  return CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.default;
}

/**
 * Get category from discipline
 * @param discipline - The discipline name
 * @returns The category ID
 */
export function getCategoryFromDiscipline(discipline: string): string {
  const normalizedDiscipline = discipline.toLowerCase().trim();

  if (['strength', 'powerlifting', 'bodybuilding', 'strongman'].includes(normalizedDiscipline)) {
    return 'force-powerbuilding';
  }

  if (['running', 'cycling', 'swimming', 'triathlon', 'cardio'].includes(normalizedDiscipline)) {
    return 'endurance';
  }

  if (['crossfit', 'hiit', 'functional', 'circuit'].includes(normalizedDiscipline)) {
    return 'functional-crosstraining';
  }

  if (['calisthenics', 'street-workout'].includes(normalizedDiscipline)) {
    return 'calisthenics-street';
  }

  if (['yoga', 'pilates'].includes(normalizedDiscipline)) {
    return 'wellness-mobility';
  }

  return 'force-powerbuilding';
}

/**
 * Get coach type for a discipline
 * @param discipline - The discipline name
 * @returns The AgentType for the discipline
 */
export function getCoachForDiscipline(discipline: string): AgentType {
  const normalizedDiscipline = discipline.toLowerCase().trim();

  if (['strength', 'powerlifting', 'bodybuilding', 'strongman'].includes(normalizedDiscipline)) {
    return 'coach-force';
  }

  if (['running', 'cycling', 'swimming', 'triathlon', 'cardio'].includes(normalizedDiscipline)) {
    return 'coach-endurance';
  }

  if (['crossfit', 'hiit', 'functional', 'circuit'].includes(normalizedDiscipline)) {
    return 'coach-functional';
  }

  if (['calisthenics', 'street-workout'].includes(normalizedDiscipline)) {
    return 'coach-calisthenics';
  }

  if (['yoga', 'pilates'].includes(normalizedDiscipline)) {
    return 'coach-wellness';
  }

  return 'coach-force';
}

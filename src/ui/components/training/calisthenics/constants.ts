/**
 * Calisthenics Component Constants
 * Configuration constants for calisthenics UI components
 */

export const CALISTHENICS_THEME_COLOR = '#06B6D4'; // Cyan from TRAINING_CATEGORIES

export const CALISTHENICS_COLORS = {
  primary: '#06B6D4',
  primaryHover: '#0891B2',
  primaryLight: '#22D3EE',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
} as const;

export const SKILL_LEVEL_COLORS: Record<string, string> = {
  beginner: '#22C55E',
  novice: '#10B981',
  intermediate: '#06B6D4',
  advanced: '#3B82F6',
  elite: '#8B5CF6',
  master: '#EC4899'
};

export const PROGRESSION_STAGE_LABELS: Record<string, string> = {
  'assisted': 'Assisté',
  'negative': 'Négatif',
  'regular': 'Régulier',
  'tuck': 'Groupé',
  'advanced-tuck': 'Groupé Avancé',
  'one-leg': 'Une Jambe',
  'straddle': 'Écart',
  'half-lay': 'Semi-Tendu',
  'full': 'Complet',
  'weighted': 'Lesté',
  'advanced': 'Avancé'
};

export const ADJUSTMENT_MESSAGES = {
  easier: {
    title: 'Exercice simplifié',
    description: 'Passage à une variante plus accessible'
  },
  harder: {
    title: 'Exercice intensifié',
    description: 'Progression vers une variante plus difficile'
  }
};

export const DEFAULT_HOLD_TIME_INCREMENT = 5; // seconds
export const DEFAULT_REPS_INCREMENT = 1;
export const MIN_HOLD_TIME = 5; // seconds
export const MAX_HOLD_TIME = 180; // 3 minutes
export const MIN_REPS = 1;
export const MAX_REPS = 50;

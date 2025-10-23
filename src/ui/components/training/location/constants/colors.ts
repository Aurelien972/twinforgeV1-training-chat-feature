/**
 * Location Colors Constants
 * Constantes des couleurs associées aux lieux
 */

import type { LocationType } from '../../../../../domain/trainingLocation';

/**
 * Couleurs principales par type de lieu
 */
export const LOCATION_COLORS: Record<LocationType, string> = {
  home: '#10B981',
  gym: '#3B82F6',
  outdoor: '#F59E0B'
};

/**
 * Couleur par défaut pour les types inconnus
 */
export const DEFAULT_LOCATION_COLOR = '#06B6D4';

/**
 * Couleurs d'état pour l'analyse de photos
 */
export const ANALYSIS_STATUS_COLORS = {
  pending: 'rgba(255, 255, 255, 0.2)',
  analyzing: 'rgba(6, 182, 212, 0.9)',
  completed: 'rgba(34, 197, 94, 0.9)',
  error: 'rgba(239, 68, 68, 0.9)'
} as const;

/**
 * Couleurs pour les badges
 */
export const BADGE_COLORS = {
  new: {
    background: 'rgba(6, 182, 212, 0.3)',
    border: 'rgba(6, 182, 212, 0.6)',
    text: '#06B6D4'
  },
  selected: {
    background: 'rgba(34, 197, 94, 0.2)',
    border: 'rgba(34, 197, 94, 0.4)',
    text: '#22C55E'
  },
  ai: {
    background: 'rgba(6, 182, 212, 0.2)',
    border: 'rgba(6, 182, 212, 0.4)',
    text: '#06B6D4'
  }
} as const;

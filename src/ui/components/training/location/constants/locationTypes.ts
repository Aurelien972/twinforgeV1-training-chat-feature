/**
 * Location Types Constants
 * Constantes et métadonnées des types de lieux
 */

import type { LocationType } from '../../../../../domain/trainingLocation';

/**
 * Types de lieux disponibles
 */
export const LOCATION_TYPES: LocationType[] = ['home', 'gym', 'outdoor'];

/**
 * Labels localisés des types de lieux
 */
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  home: 'Maison',
  gym: 'Salle de Sport',
  outdoor: 'Extérieur'
};

/**
 * Labels courts des types de lieux
 */
export const LOCATION_TYPE_LABELS_SHORT: Record<LocationType, string> = {
  home: 'Maison',
  gym: 'Salle',
  outdoor: 'Extérieur'
};

/**
 * Descriptions des types de lieux
 */
export const LOCATION_TYPE_DESCRIPTIONS: Record<LocationType, string> = {
  home: 'Entraînement à domicile',
  gym: 'Salle équipée',
  outdoor: 'Entraînement en plein air'
};

/**
 * Placeholders pour les noms de lieux
 */
export const LOCATION_NAME_PLACEHOLDERS: Record<LocationType, string> = {
  home: 'Ma salle à domicile',
  gym: 'Basic Fit Centre',
  outdoor: 'Parc de la ville'
};

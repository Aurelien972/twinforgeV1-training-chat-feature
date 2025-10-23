/**
 * Location Helper Functions
 * Fonctions utilitaires pour la gestion des lieux d'entraînement
 */

import { ICONS } from '../../../../icons/registry';
import type { LocationType } from '../../../../../domain/trainingLocation';

/**
 * Retourne l'icône appropriée pour un type de lieu
 */
export const getLocationIcon = (type: string) => {
  switch (type) {
    case 'home':
      return ICONS.Home;
    case 'gym':
      return ICONS.Dumbbell;
    case 'outdoor':
      return ICONS.TreePine;
    default:
      return ICONS.MapPin;
  }
};

/**
 * Retourne la couleur associée à un type de lieu
 */
export const getLocationColor = (type: string): string => {
  switch (type) {
    case 'home':
      return '#10B981';
    case 'gym':
      return '#3B82F6';
    case 'outdoor':
      return '#F59E0B';
    default:
      return '#06B6D4';
  }
};

/**
 * Retourne le label localisé pour un type de lieu
 */
export const getLocationLabel = (type: string): string => {
  switch (type) {
    case 'home':
      return 'Maison';
    case 'gym':
      return 'Salle de Sport';
    case 'outdoor':
      return 'Extérieur';
    default:
      return type;
  }
};

/**
 * Retourne le label court pour un type de lieu
 */
export const getLocationLabelShort = (type: string): string => {
  switch (type) {
    case 'home':
      return 'Maison';
    case 'gym':
      return 'Salle';
    case 'outdoor':
      return 'Extérieur';
    default:
      return type;
  }
};

/**
 * Vérifie si un type de lieu est valide
 */
export const isValidLocationType = (type: string): type is LocationType => {
  return ['home', 'gym', 'outdoor'].includes(type);
};

/**
 * Retourne les métadonnées complètes d'un lieu
 */
export const getLocationMetadata = (type: string) => ({
  icon: getLocationIcon(type),
  color: getLocationColor(type),
  label: getLocationLabel(type),
  labelShort: getLocationLabelShort(type)
});

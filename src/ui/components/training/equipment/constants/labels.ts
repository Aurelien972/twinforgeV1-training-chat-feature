/**
 * Equipment Labels Constants
 * Label mappings for location types and equipment categories
 */

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  home: 'Maison',
  gym: 'Salle',
  outdoor: 'Extérieur'
};

export const EQUIPMENT_BADGE_LABELS = {
  ai: 'IA',
  manual: 'Manuel',
  custom: 'Custom'
} as const;

export const FILTER_LABELS = {
  all: 'Tous',
  ai: 'IA',
  manual: 'Manuels',
  custom: 'Personnalisés'
} as const;

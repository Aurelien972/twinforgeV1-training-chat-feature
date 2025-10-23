/**
 * Photo Configuration Constants
 * Configuration pour la gestion des photos
 */

/**
 * Nombre maximum de photos par lieu
 */
export const MAX_PHOTOS_PER_LOCATION = 5;

/**
 * Taille maximale d'un fichier photo en Mo
 */
export const MAX_PHOTO_SIZE_MB = 10;

/**
 * Formats d'image acceptés
 */
export const ACCEPTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Extensions d'image acceptées (pour l'attribut accept)
 */
export const ACCEPTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

/**
 * Durée estimée d'analyse par photo (en secondes)
 */
export const ESTIMATED_ANALYSIS_TIME_PER_PHOTO = {
  min: 45,
  max: 50,
  average: 47
} as const;

/**
 * Configuration de la progression d'analyse
 */
export const ANALYSIS_PROGRESS_CONFIG = {
  phase1: { start: 0, end: 30, incrementPerSecond: 2, description: 'Phase initiale rapide' },
  phase2: { start: 30, end: 60, incrementPerSecond: 1, description: 'Phase d\'analyse' },
  phase3: { start: 60, end: 85, incrementPerSecond: 0.5, description: 'Phase de détection fine' },
  phase4: { start: 85, end: 92, incrementPerSecond: 0.25, description: 'Phase de finalisation' }
} as const;

/**
 * Durée totale maximale pour atteindre 92% de progression (en secondes)
 */
export const MAX_PROGRESS_TIME_SECONDS = 70;

/**
 * Conseils pour les photos
 */
export const PHOTO_TIPS = [
  'Photographiez l\'espace d\'entraînement complet',
  'Montrez les équipements disponibles sous différents angles',
  'Assurez-vous que les photos sont bien éclairées',
  'Évitez les photos floues ou trop sombres'
] as const;

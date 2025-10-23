/**
 * Types Barrel Export
 * Point d'entrée centralisé pour tous les types
 */

export * from './modal.types';
export * from './photo.types';
export * from './component.types';

// Re-export domain types for convenience
export type {
  LocationType,
  TrainingLocationWithDetails,
  LocationPhoto
} from '../../../../../domain/trainingLocation';

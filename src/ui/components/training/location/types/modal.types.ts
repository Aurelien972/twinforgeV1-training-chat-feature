/**
 * Modal Types
 * Types et interfaces pour les composants modaux
 */

import type { LocationType, TrainingLocationWithDetails } from '../../../../../domain/trainingLocation';

/**
 * Data pour la création/édition d'un lieu (avec photos)
 */
export interface LocationEditorData {
  name?: string;
  type: LocationType;
  is_default?: boolean;
  equipment?: string[];
  photos?: File[];
}

/**
 * Data pour la création manuelle d'un lieu (sans photos)
 */
export interface CreateLocationManualData {
  name?: string;
  type: LocationType;
  is_default?: boolean;
  equipment?: string[];
}

/**
 * Props pour LocationEditorModal
 */
export interface LocationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: LocationEditorData) => Promise<void | TrainingLocationWithDetails>;
  existingLocation?: TrainingLocationWithDetails | null;
  mode: 'create' | 'edit';
}

/**
 * Props pour CreateLocationManualModal
 */
export interface CreateLocationManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: CreateLocationManualData) => Promise<void>;
}

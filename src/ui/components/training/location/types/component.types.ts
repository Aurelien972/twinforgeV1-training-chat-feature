/**
 * Component Types
 * Types et interfaces pour les composants de location
 */

import type { LocationType, TrainingLocationWithDetails } from '../../../../../domain/trainingLocation';

/**
 * Props pour LocationTypeCard
 */
export interface LocationTypeCardProps {
  type: LocationType;
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  color?: string;
}

/**
 * Props pour LocationQuickSelector
 */
export interface LocationQuickSelectorProps {
  selectedLocationId?: string;
  onLocationSelect: (location: TrainingLocationWithDetails) => void;
  color?: string;
}

/**
 * Props pour TrainingLocationManager
 */
export interface TrainingLocationManagerProps {
  className?: string;
}

/**
 * Props pour LocationCardSkeleton
 */
export interface LocationCardSkeletonProps {
  count?: number;
}

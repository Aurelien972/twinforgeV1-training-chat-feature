/**
 * Equipment Components Index
 * Components for managing training equipment, detection, and selection
 *
 * Architecture:
 * - atoms/: Atomic components (EquipmentChip)
 * - molecules/: Composed components (Selectors, Filters, Lists, Detection viewers)
 * - organisms/: Complex components (EquipmentManagerCard)
 * - hooks/: Custom React hooks for equipment logic
 * - utils/: Helper functions and mappers
 * - types/: TypeScript interfaces and types
 * - constants/: Configuration and constants
 */

// Main exports (default exports for backward compatibility)
export { default as EquipmentChip } from './atoms/EquipmentChip';
export { default as EquipmentDetectionViewer } from './molecules/EquipmentDetectionViewer';
export { default as EquipmentManagerCard } from './organisms/EquipmentManagerCard';
export { default as EquipmentSelector } from './molecules/EquipmentSelector';

// Named exports from molecules (for advanced usage)
export {
  EquipmentSearchBar,
  CustomEquipmentInput,
  EquipmentCategory,
  DetectionMarker,
  DetectionTooltip,
  DetectionsList,
  FullscreenViewer,
  LocationSelector,
  EquipmentStatsGrid,
  EquipmentFilters,
  EquipmentList,
  LocationCreationActions
} from './molecules';

// Hooks
export {
  useEquipmentSelection,
  useEquipmentFiltering,
  useDetectionInteraction,
  useEquipmentStats
} from './hooks';

// Utils
export {
  getLocationColor,
  getMarkerColor,
  formatEquipmentName,
  formatConfidenceScore,
  pluralize,
  getLocationIcon,
  getLocationLabel,
  getLocationMetadata,
  getEquipmentBadge
} from './utils';

// Types
export type {
  EquipmentChipProps,
  EquipmentItem,
  EquipmentCategory,
  EquipmentSelectorProps,
  FilterType,
  EquipmentStats,
  EquipmentBadge,
  DetectionMarkerProps,
  DetectionTooltipProps,
  EquipmentDetectionViewerProps,
  DetectionInteractionState
} from './types';

// Constants
export {
  LOCATION_COLORS,
  EQUIPMENT_TYPE_COLORS,
  CONFIDENCE_COLORS,
  DEFAULT_EQUIPMENT_COLOR,
  CONFIDENCE_THRESHOLDS,
  DETECTION_MARKER_SIZES,
  LOCATION_TYPE_LABELS,
  EQUIPMENT_BADGE_LABELS,
  FILTER_LABELS
} from './constants';

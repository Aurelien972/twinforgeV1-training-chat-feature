/**
 * Detection Types
 * Types for equipment detection and visualization
 */

export interface DetectionMarkerProps {
  detection: any;
  isHovered: boolean;
  isSelected: boolean;
  color: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export interface DetectionTooltipProps {
  equipmentName: string;
  color: string;
}

export interface EquipmentDetectionViewerProps {
  photoUrl: string;
  detections: any[];
  showAnnotations?: boolean;
  className?: string;
  enableFullscreen?: boolean;
}

export interface DetectionInteractionState {
  hoveredMarker: number | null;
  selectedMarker: number | null;
  isFullscreen: boolean;
}

/**
 * Equipment Types
 * Local types for equipment components
 */

export interface EquipmentChipProps {
  label: string;
  icon?: string;
  isSelected?: boolean;
  isCustom?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  color?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface EquipmentItem {
  id: string;
  label: string;
  icon?: string;
}

export interface EquipmentCategory {
  id: string;
  label: string;
  equipment: EquipmentItem[];
}

export interface EquipmentSelectorProps {
  locationType: string;
  selectedEquipment: string[];
  onEquipmentChange: (equipment: string[]) => void;
  disabled?: boolean;
  color?: string;
}

export type FilterType = 'all' | 'ai' | 'manual' | 'custom';

export interface EquipmentStats {
  ai: number;
  manual: number;
  custom: number;
  total: number;
}

export interface EquipmentBadge {
  label: string;
  color: string;
  icon: any;
}

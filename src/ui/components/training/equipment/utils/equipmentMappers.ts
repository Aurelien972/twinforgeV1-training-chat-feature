/**
 * Equipment Mapper Utilities
 * Helper functions for mapping equipment properties and badges
 */

import { ICONS } from '../../../../icons/registry';
import { EQUIPMENT_TYPE_COLORS } from '../constants';
import type { EquipmentBadge } from '../types';

export function getEquipmentBadge(
  isCustom: boolean,
  hasPhotos: boolean
): EquipmentBadge {
  if (isCustom) {
    return {
      label: 'Custom',
      color: EQUIPMENT_TYPE_COLORS.custom,
      icon: ICONS.Plus
    };
  }
  if (hasPhotos) {
    return {
      label: 'IA',
      color: EQUIPMENT_TYPE_COLORS.ai,
      icon: ICONS.Sparkles
    };
  }
  return {
    label: 'Manuel',
    color: EQUIPMENT_TYPE_COLORS.manual,
    icon: ICONS.List
  };
}

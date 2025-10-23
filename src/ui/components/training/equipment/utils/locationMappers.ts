/**
 * Location Mapper Utilities
 * Helper functions for mapping location properties
 */

import { ICONS } from '../../../../icons/registry';
import { LOCATION_TYPE_LABELS } from '../constants';
import { getLocationColor } from './colorUtils';

export function getLocationIcon(type: string) {
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
}

export function getLocationLabel(type: string): string {
  return LOCATION_TYPE_LABELS[type] || type;
}

export function getLocationMetadata(type: string) {
  return {
    icon: getLocationIcon(type),
    color: getLocationColor(type),
    label: getLocationLabel(type)
  };
}

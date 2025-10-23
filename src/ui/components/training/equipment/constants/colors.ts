/**
 * Equipment Color Constants
 * Color mappings for different equipment types and states
 */

export const LOCATION_COLORS = {
  home: '#10B981',
  gym: '#3B82F6',
  outdoor: '#F59E0B',
  default: '#06B6D4'
} as const;

export const EQUIPMENT_TYPE_COLORS = {
  ai: '#22D3EE',
  manual: '#3B82F6',
  custom: '#A855F7'
} as const;

export const CONFIDENCE_COLORS = {
  high: '#10B981',
  good: '#3B82F6',
  medium: '#F59E0B',
  low: '#EF4444'
} as const;

export const DEFAULT_EQUIPMENT_COLOR = '#06B6D4';

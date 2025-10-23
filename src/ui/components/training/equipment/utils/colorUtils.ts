/**
 * Color Utilities
 * Helper functions for equipment color management
 */

import { LOCATION_COLORS, CONFIDENCE_COLORS } from '../constants';

export function getLocationColor(type: string): string {
  return LOCATION_COLORS[type as keyof typeof LOCATION_COLORS] || LOCATION_COLORS.default;
}

export function getMarkerColor(confidence: number): string {
  if (confidence >= 0.9) return CONFIDENCE_COLORS.high;
  if (confidence >= 0.7) return CONFIDENCE_COLORS.good;
  if (confidence >= 0.5) return CONFIDENCE_COLORS.medium;
  return CONFIDENCE_COLORS.low;
}

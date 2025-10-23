/**
 * Color Schemes Configuration
 * Support for multiple coaches with different color schemes
 */

import type { ColorScheme } from '../types';
import { PROGRESSION_COLORS } from './constants';

/**
 * Default color scheme (current coach)
 */
export const DEFAULT_COLOR_SCHEME: ColorScheme = {
  LEVEL: PROGRESSION_COLORS.LEVEL,
  XP: PROGRESSION_COLORS.XP,
  ACHIEVEMENT: PROGRESSION_COLORS.ACHIEVEMENT,
  RECORD: PROGRESSION_COLORS.RECORD,
  STREAK: PROGRESSION_COLORS.STREAK,
  MILESTONE: PROGRESSION_COLORS.MILESTONE,
  RPE: PROGRESSION_COLORS.RPE,
  VOLUME: PROGRESSION_COLORS.VOLUME,
  INTENSITY: PROGRESSION_COLORS.INTENSITY,
  SUCCESS: PROGRESSION_COLORS.SUCCESS,
  WARNING: PROGRESSION_COLORS.WARNING,
  DANGER: PROGRESSION_COLORS.DANGER,
  INFO: PROGRESSION_COLORS.INFO,
};

/**
 * Alternative color scheme for future coach #2
 * Example: Endurance-focused coach with cooler tones
 */
export const ENDURANCE_COLOR_SCHEME: ColorScheme = {
  LEVEL: '#06B6D4',
  XP: '#06B6D4',
  ACHIEVEMENT: '#14B8A6',
  RECORD: '#0EA5E9',
  STREAK: '#10B981',
  MILESTONE: '#6366F1',
  RPE: '#F43F5E',
  VOLUME: '#0EA5E9',
  INTENSITY: '#06B6D4',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#14B8A6',
};

/**
 * Alternative color scheme for future coach #3
 * Example: Power-focused coach with warmer tones
 */
export const POWER_COLOR_SCHEME: ColorScheme = {
  LEVEL: '#DC2626',
  XP: '#DC2626',
  ACHIEVEMENT: '#EA580C',
  RECORD: '#F59E0B',
  STREAK: '#EAB308',
  MILESTONE: '#F97316',
  RPE: '#DC2626',
  VOLUME: '#EA580C',
  INTENSITY: '#DC2626',
  SUCCESS: '#22C55E',
  WARNING: '#F59E0B',
  DANGER: '#DC2626',
  INFO: '#F97316',
};

/**
 * Map of available color schemes by coach ID
 */
export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  default: DEFAULT_COLOR_SCHEME,
  force: DEFAULT_COLOR_SCHEME, // Current force coach
  endurance: ENDURANCE_COLOR_SCHEME, // Future endurance coach
  power: POWER_COLOR_SCHEME, // Future power coach
};

/**
 * Get color scheme for a specific coach
 */
export function getColorScheme(coachId: string): ColorScheme {
  return COLOR_SCHEMES[coachId] || DEFAULT_COLOR_SCHEME;
}

/**
 * Merge custom colors with a base color scheme
 */
export function mergeColorScheme(
  baseScheme: ColorScheme,
  customColors: Partial<ColorScheme>
): ColorScheme {
  return {
    ...baseScheme,
    ...customColors,
  };
}

/**
 * Create a color scheme from a primary color
 * Useful for dynamic coach creation
 */
export function createColorSchemeFromPrimary(primaryColor: string): ColorScheme {
  return {
    LEVEL: primaryColor,
    XP: primaryColor,
    ACHIEVEMENT: adjustColorBrightness(primaryColor, 20),
    RECORD: adjustColorHue(primaryColor, 30),
    STREAK: adjustColorHue(primaryColor, -30),
    MILESTONE: adjustColorHue(primaryColor, 60),
    RPE: '#EF4444',
    VOLUME: adjustColorHue(primaryColor, 30),
    INTENSITY: primaryColor,
    SUCCESS: '#22C55E',
    WARNING: '#F59E0B',
    DANGER: '#EF4444',
    INFO: adjustColorHue(primaryColor, -60),
  };
}

/**
 * Helper: Adjust color brightness (simplified)
 */
function adjustColorBrightness(color: string, percent: number): string {
  return color;
}

/**
 * Helper: Adjust color hue (simplified)
 */
function adjustColorHue(color: string, degrees: number): string {
  return color;
}

/**
 * Feedback Constants
 * Centralized constants for feedback components
 */

import type { RatingColorMap, RatingLabelMap, RatingIconMap } from '../types';

// Color mappings
export const RATING_COLORS: RatingColorMap = {
  excellent: '#10B981', // Green
  good: '#3B82F6',      // Blue
  average: '#F59E0B',   // Amber
  'needs-improvement': '#EF4444', // Red
} as const;

export const RATING_LABELS: RatingLabelMap = {
  excellent: 'Excellent',
  good: 'Bien',
  average: 'Correct',
  'needs-improvement': 'À Améliorer',
} as const;

export const RATING_ICONS: RatingIconMap = {
  excellent: 'Trophy',
  good: 'Star',
  average: 'TrendingUp',
  'needs-improvement': 'Target',
} as const;

// Metric colors
export const METRIC_COLORS = {
  calories: '#EF4444',      // Red
  volume: '#8B5CF6',        // Purple
  reps: '#10B981',          // Green
  timeUnderTension: '#F59E0B', // Amber
  intensity: '#3B82F6',     // Blue
  workRest: '#EC4899',      // Pink
  duration: '#3B82F6',      // Blue
  zones: '#A855F7',         // Purple
} as const;

// Badge colors
export const BADGE_COLORS = {
  'volume-king': '#8B5CF6',
  'endurance-beast': '#F59E0B',
  'perfect-form': '#22C55E',
  'calorie-crusher': '#EF4444',
  'consistency-master': '#3B82F6',
} as const;

// Calculation constants
export const CALCULATION_CONSTANTS = {
  // Calories calculation
  CALORIES_BASE_VOLUME_DIVISOR: 100,
  CALORIES_DURATION_MULTIPLIER: 5,
  CALORIES_RPE_BASE: 0.8,
  CALORIES_RPE_RANGE: 0.4,

  // Intensity calculation
  INTENSITY_BASE: 50,
  INTENSITY_RPE_MULTIPLIER: 3.5,

  // Time under tension
  AVG_TEMPO_PER_REP: 3, // seconds

  // Badge thresholds
  VOLUME_THRESHOLD_KG: 5000,
  WORK_REST_RATIO_THRESHOLD: 2,
  TECHNIQUE_THRESHOLD: 8,
  CALORIES_THRESHOLD: 400,

  // Endurance calculations
  ENDURANCE_BASE_CAL_PER_MIN: 8,

  // Progress tracking
  AVERAGE_TIME_PER_PHOTO_MS: 75000, // 75 seconds
  MAX_PROGRESS_PER_PHOTO: 95,
} as const;

// Animation durations (ms)
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  PROGRESS_BAR: 1500,
} as const;

// Circle progress
export const CIRCLE_PROGRESS = {
  MOBILE_SIZE: 140,
  DESKTOP_SIZE: 160,
  MOBILE_RADIUS: 55,
  DESKTOP_RADIUS: 60,
  STROKE_WIDTH_MOBILE: 10,
  STROKE_WIDTH_DESKTOP: 12,
} as const;

// Glow intensities
export const GLOW_INTENSITY = {
  LOW: 35,
  MEDIUM: 40,
  HIGH: 50,
  VERY_HIGH: 60,
} as const;

// Glass card styles
export const GLASS_CARD_STYLES = {
  OPACITY: 'rgba(255, 255, 255, 0.08)',
  BORDER_OPACITY: 'rgba(255, 255, 255, 0.1)',
  SHADOW_OPACITY: 'rgba(0, 0, 0, 0.2)',
} as const;

// Responsive breakpoints (match with Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;

// Phase colors for analysis progress
export const PHASE_COLORS: Record<string, string> = {
  completed: '#10B981',
  error: '#EF4444',
  analyzing: '#3B82F6',
  default: '#06B6D4',
} as const;

// AI badge colors
export const AI_COLORS = {
  PRIMARY: '#18E3FF',
  BACKGROUND: 'rgba(24, 227, 255, 0.1)',
  BORDER: 'rgba(24, 227, 255, 0.3)',
} as const;

// Encouragement messages
export const ENCOURAGEMENT_MESSAGES = {
  ONE_BADGE: "Premier badge ! Continue comme ça 💪",
  TWO_BADGES: "Deux badges ! Tu es en feu 🔥",
  THREE_PLUS_BADGES: "Trio de badges ! Performance exceptionnelle 🌟",
} as const;

// Format constants
export const FORMAT_CONSTANTS = {
  VOLUME_THRESHOLD_DISPLAY: 1000, // Display in tons above this
  MAX_TEXT_LENGTH_MOBILE: 18,
  MAX_TEXT_LENGTH_DESKTOP: 24,
} as const;

// Z-index layers
export const Z_INDEX = {
  OVERLAY_BACKDROP: 9998,
  OVERLAY_CONTENT: 9999,
  BACKGROUND_INDICATOR: 100,
} as const;

/**
 * Progression Module Constants
 * Centralized constants for colors, thresholds, and magic values
 */

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export const PROGRESSION_COLORS = {
  // Primary progression colors
  LEVEL: '#F59E0B',
  XP: '#F59E0B',
  
  // Achievement colors
  ACHIEVEMENT: '#10B981',
  RECORD: '#3B82F6',
  STREAK: '#22C55E',
  MILESTONE: '#8B5CF6',
  
  // Metric colors
  RPE: '#EF4444',
  VOLUME: '#3B82F6',
  INTENSITY: '#F59E0B',
  
  // Status colors
  SUCCESS: '#22C55E',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#18E3FF',
  
  // Neutral colors
  NEUTRAL: '#94A3B8',
  ACCENT: '#8B5CF6',
} as const;

// ============================================================================
// RARITY COLORS
// ============================================================================

export const RARITY_COLORS = {
  common: {
    border: '#6B7280',
    glow: '#6B72804D',
    color: '#9CA3AF',
    background: 'rgba(107, 114, 128, 0.1)',
  },
  rare: {
    border: '#3B82F6',
    glow: '#3B82F64D',
    color: '#60A5FA',
    background: 'rgba(59, 130, 246, 0.1)',
  },
  epic: {
    border: '#8B5CF6',
    glow: '#8B5CF64D',
    color: '#A78BFA',
    background: 'rgba(139, 92, 246, 0.1)',
  },
  legendary: {
    border: '#F59E0B',
    glow: '#F59E0B4D',
    color: '#FBBF24',
    background: 'rgba(245, 158, 11, 0.1)',
  },
} as const;

// ============================================================================
// MUSCLE GROUP COLORS
// ============================================================================

export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  chest: '#EF4444',
  back: '#3B82F6',
  shoulders: '#F59E0B',
  arms: '#8B5CF6',
  legs: '#10B981',
  core: '#EC4899',
  fullBody: '#06B6D4',
  cardio: '#22C55E',
};

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

export const ANIMATION_DURATIONS = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5,
  VERY_SLOW: 0.8,
} as const;

export const ANIMATION_DELAYS = {
  STAGGER_SMALL: 0.05,
  STAGGER_MEDIUM: 0.1,
  STAGGER_LARGE: 0.15,
  INITIAL: 0.2,
} as const;

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const CARD_SPACING = {
  SMALL: '0.75rem',
  MEDIUM: '1rem',
  LARGE: '1.5rem',
  XLARGE: '2rem',
} as const;

export const CARD_PADDING = {
  SMALL: '1rem',
  MEDIUM: '1.5rem',
  LARGE: '2rem',
} as const;

// ============================================================================
// BADGE AND ICON SIZES
// ============================================================================

export const ICON_SIZES = {
  XS: 16,
  SM: 20,
  MD: 24,
  LG: 32,
  XL: 40,
  XXL: 48,
} as const;

export const BADGE_SIZES = {
  sm: { width: 64, height: 64, iconSize: 24 },
  md: { width: 80, height: 80, iconSize: 32 },
  lg: { width: 96, height: 96, iconSize: 40 },
  xl: { width: 128, height: 128, iconSize: 48 },
} as const;

// ============================================================================
// PROGRESSION THRESHOLDS
// ============================================================================

export const XP_THRESHOLDS = {
  BASE_XP: 100,
  MULTIPLIER: 1.5,
  MAX_LEVEL: 100,
} as const;

export const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365] as const;

export const SESSION_COUNT_MILESTONES = [10, 25, 50, 100, 250, 500, 1000] as const;

// ============================================================================
// BALANCE RATINGS
// ============================================================================

export const BALANCE_THRESHOLDS = {
  EXCELLENT: { min: 0.8, max: 1.2 },
  GOOD: { min: 0.6, max: 1.4 },
  NEEDS_WORK: { min: 0, max: Infinity },
} as const;

export const BALANCE_COLORS = {
  excellent: '#22C55E',
  good: '#F59E0B',
  needsWork: '#EF4444',
} as const;

// ============================================================================
// CHART CONSTANTS
// ============================================================================

export const CHART_DEFAULTS = {
  WIDTH: 800,
  HEIGHT: 400,
  PADDING: {
    TOP: 20,
    RIGHT: 20,
    BOTTOM: 40,
    LEFT: 50,
  },
  POINT_RADIUS: 4,
  LINE_WIDTH: 2,
  GRID_COLOR: 'rgba(255, 255, 255, 0.1)',
  AXIS_COLOR: 'rgba(255, 255, 255, 0.3)',
} as const;

export const HEATMAP_COLORS = {
  EMPTY: 'rgba(255, 255, 255, 0.05)',
  LOW: 'rgba(34, 197, 94, 0.2)',
  MEDIUM: 'rgba(34, 197, 94, 0.5)',
  HIGH: 'rgba(34, 197, 94, 0.8)',
  VERY_HIGH: 'rgba(34, 197, 94, 1)',
} as const;

// ============================================================================
// RECORD IMPROVEMENT THRESHOLDS
// ============================================================================

export const IMPROVEMENT_THRESHOLDS = {
  SMALL: 5, // %
  MODERATE: 10, // %
  SIGNIFICANT: 20, // %
  MAJOR: 50, // %
} as const;

// ============================================================================
// DISPLAY LIMITS
// ============================================================================

export const DISPLAY_LIMITS = {
  RECENT_RECORDS: 5,
  VISIBLE_ACHIEVEMENTS: 6,
  UPCOMING_MILESTONES: 3,
  HISTORY_ENTRIES: 10,
  CHART_DATA_POINTS: 30,
} as const;

// ============================================================================
// TEXT AND LABELS
// ============================================================================

export const LABELS = {
  LEVEL: 'Niveau',
  XP: 'XP',
  TOTAL_XP: 'XP Total',
  PROGRESS: 'Progression',
  ACHIEVEMENTS: 'Réussites',
  RECORDS: 'Records',
  MILESTONES: 'Jalons',
  STREAK: 'Série',
  SESSIONS: 'Séances',
  IMPROVEMENT: 'Amélioration',
  BALANCE: 'Équilibre',
  VOLUME: 'Volume',
  INTENSITY: 'Intensité',
} as const;

// ============================================================================
// EMPTY STATE MESSAGES
// ============================================================================

export const EMPTY_STATES = {
  NO_ACHIEVEMENTS: 'Aucune réussite débloquée',
  NO_RECORDS: 'Aucun record personnel',
  NO_MILESTONES: 'Aucun jalon actif',
  NO_HISTORY: 'Aucun historique disponible',
  NO_DATA: 'Aucune donnée disponible',
} as const;

// ============================================================================
// TOOLTIP TEXTS
// ============================================================================

export const TOOLTIPS = {
  LEVEL: 'Votre niveau actuel basé sur l\'XP total',
  XP: 'Points d\'expérience gagnés',
  STREAK: 'Jours consécutifs d\'entraînement',
  BALANCE: 'Équilibre entre volume et intensité',
  IMPROVEMENT: 'Pourcentage d\'amélioration par rapport au précédent record',
} as const;

/**
 * Force Training Constants
 * Configuration values and defaults for force training
 */

/**
 * Re-export colors from colors.ts
 */
export * from './colors';

/**
 * Re-export animations from animations.ts
 */
export * from './animations';

/**
 * Default timing values (in seconds)
 */
export const DEFAULT_REST_TIME = 90;
export const DEFAULT_PREP_TIME = 10;
export const DEFAULT_TRANSITION_TIME = 3;
export const DEFAULT_SET_COUNTDOWN = 3;

/**
 * Adjustment percentages
 */
export const LOAD_ADJUSTMENT_PERCENT = 0.08; // 8%
export const LOAD_INCREASE_PERCENT = 0.08;
export const LOAD_DECREASE_PERCENT = 0.08;

/**
 * Reps boundaries
 */
export const MIN_REPS = 3;
export const MAX_REPS = 15;
export const REPS_INCREMENT = 1;

/**
 * Sets boundaries
 */
export const MIN_SETS = 1;
export const MAX_SETS = 10;
export const SETS_INCREMENT = 1;

/**
 * Load boundaries
 */
export const MIN_LOAD = 0;
export const MAX_LOAD = 500; // kg

/**
 * RPE (Rate of Perceived Exertion) thresholds
 */
export const RPE_EASY_MAX = 6;
export const RPE_MODERATE_MAX = 7;
export const RPE_INTENSE_MAX = 9;
export const RPE_VERY_INTENSE = 10;

/**
 * Haptic feedback intensity levels
 */
export const HAPTIC_LIGHT = 'light';
export const HAPTIC_MEDIUM = 'medium';
export const HAPTIC_HEAVY = 'heavy';

/**
 * Audio feedback settings
 */
export const AUDIO_COUNTDOWN_ENABLED = true;
export const AUDIO_COMPLETION_ENABLED = true;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_FADE_DURATION = 300;
export const ANIMATION_SCALE_DURATION = 200;
export const ANIMATION_SLIDE_DURATION = 400;

/**
 * Icon ratio for consistent sizing
 */
export const ICON_CONTAINER_RATIO = 0.65;

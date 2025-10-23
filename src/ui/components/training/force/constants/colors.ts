/**
 * Force Training Color Palette
 * Color definitions for different states and difficulty levels
 */

/**
 * Difficulty colors based on RPE
 */
export const DIFFICULTY_COLORS = {
  easy: '#22C55E', // Green
  moderate: '#64748B', // Slate
  intense: '#F59E0B', // Amber
  veryIntense: '#EF4444', // Red
} as const;

/**
 * Action colors for adjustment buttons
 */
export const ACTION_COLORS = {
  increase: '#22C55E', // Green
  decrease: '#EF4444', // Red
  neutral: '#3B82F6', // Blue
  info: '#60A5FA', // Light Blue
  warning: '#F59E0B', // Amber
  success: '#10B981', // Emerald
} as const;

/**
 * Timer state colors
 */
export const TIMER_COLORS = {
  session: '#3B82F6', // Blue
  rest: '#22C55E', // Green
  preparation: '#F59E0B', // Amber
  paused: '#64748B', // Slate
  countdown: '#EF4444', // Red (final countdown)
} as const;

/**
 * RPE color mapping function
 */
export const getRpeColor = (rpe?: number): string => {
  if (!rpe) return DIFFICULTY_COLORS.moderate;
  if (rpe >= 9) return DIFFICULTY_COLORS.veryIntense;
  if (rpe >= 7) return DIFFICULTY_COLORS.intense;
  return DIFFICULTY_COLORS.easy;
};

/**
 * Countdown color based on remaining time
 */
export const getCountdownColor = (count: number): string => {
  if (count === 0) return ACTION_COLORS.success;
  if (count === 1) return ACTION_COLORS.warning;
  return ACTION_COLORS.neutral;
};

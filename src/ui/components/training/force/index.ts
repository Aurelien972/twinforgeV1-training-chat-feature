/**
 * Force Training Components
 * Components specific to force training sessions (weightlifting, bodyweight)
 * Used in Pipeline Step 2/3 for force/strength workouts
 *
 * Architecture:
 * - cards/: Main display cards for exercises
 * - controls/: Adjustment buttons and panels
 * - timers/: Timer display components
 * - countdowns/: Countdown components for preparation and transitions
 * - hooks/: Custom React hooks for force training logic
 * - utils/: Utility functions for calculations and formatting
 * - adapters/: Adapters for external services and stores
 * - types/: TypeScript types and interfaces
 * - constants/: Configuration values and constants
 */

// ============================================
// CARDS - Main Display Components
// ============================================
export { TrainingPrescriptionCard } from './cards';

// ============================================
// CONTROLS - Adjustment & Interaction
// ============================================
export { ForceAdjustmentButtons, ExerciseAdjustmentPanel } from './controls';

// ============================================
// TIMERS - Time Display Components
// ============================================
export { FloatingTimerCard } from './timers';

// ============================================
// COUNTDOWNS - Preparation & Transition
// ============================================
export { PreparationCountdown, TransitionCountdown } from './countdowns';

// For backward compatibility, also export PreparationCountdownOptimized
// (can be removed once migration is complete)
export { default as PreparationCountdownOptimized } from './PreparationCountdown';

// ============================================
// HOOKS - Custom React Hooks
// ============================================
export {
  useExerciseAdjustment,
  useExerciseNotifications,
  useHapticFeedback,
} from './hooks';

// ============================================
// UTILS - Utility Functions
// ============================================
export {
  // Exercise calculations
  calculateLoadIncrease,
  calculateLoadDecrease,
  calculateRepsIncrease,
  calculateRepsDecrease,
  calculateSetsIncrease,
  calculateSetsDecrease,
  getTopSet,
  getInitialLoad,
  isRampingLoad,
  getLoadProgressionSummary,

  // Difficulty utilities
  getDifficultyLevel,
  getDifficultyBadge,
  getRpeDescription,
  getRpeColor,
  calculateEstimated1RM,
  suggestLoad,

  // Formatters
  formatTime,
  formatTimeHuman,
  formatLoadDisplay,
  formatRestTime,
  formatTempo,
  formatPercentageChange,
  formatWeightChange,
  formatRepsChange,
  formatSetsChange,
} from './utils';

// ============================================
// ADAPTERS - External Service Interfaces
// ============================================
export {
  notificationAdapter,
  createNotificationAdapter,
  chatStoreAdapter,
  useChatStoreAdapter,
} from './adapters';

// ============================================
// TYPES - TypeScript Definitions
// ============================================
export type {
  Exercise,
  ExerciseAdjustmentType,
  TimerMode,
  CountdownPhase,
  DifficultyLevel,
  DifficultyBadge,
  AdjustmentResult,
  TimerState,
  TimerConfig,
  CountdownPropsBase,
  PreparationCountdownProps,
  TransitionCountdownProps,
  TrainingPrescriptionCardProps,
  ForceAdjustmentButtonsProps,
  ExerciseAdjustmentPanelProps,
  FloatingTimerCardProps,
  ExerciseStats,
  LoadDisplay,
} from './types';

// ============================================
// CONSTANTS - Configuration Values
// ============================================
export {
  // Timing
  DEFAULT_REST_TIME,
  DEFAULT_PREP_TIME,
  DEFAULT_TRANSITION_TIME,
  DEFAULT_SET_COUNTDOWN,

  // Adjustments
  LOAD_ADJUSTMENT_PERCENT,
  LOAD_INCREASE_PERCENT,
  LOAD_DECREASE_PERCENT,

  // Boundaries
  MIN_REPS,
  MAX_REPS,
  REPS_INCREMENT,
  MIN_SETS,
  MAX_SETS,
  SETS_INCREMENT,
  MIN_LOAD,
  MAX_LOAD,

  // RPE
  RPE_EASY_MAX,
  RPE_MODERATE_MAX,
  RPE_INTENSE_MAX,
  RPE_VERY_INTENSE,

  // Colors
  DIFFICULTY_COLORS,
  ACTION_COLORS,
  TIMER_COLORS,
  getCountdownColor,

  // Animations
  EASING,
  SPRING_CONFIG,
  fadeIn,
  scaleIn,
  slideUp,
  cardHover,
  cardTap,
  buttonHover,
  buttonTap,
  pulse,
  countdownNumber,
  rotate,
  expandCollapse,
} from './constants';

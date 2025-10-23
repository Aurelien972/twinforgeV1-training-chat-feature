/**
 * Calisthenics Training Components
 * Exports for calisthenics-specific UI components
 */

// Re-export Force components that work directly for calisthenics
export {
  FloatingTimerCard,
  PreparationCountdown,
  TransitionCountdown,
  ExerciseSessionCard // Can be used with adapted props
} from '../force';

// Export calisthenics constants
export * from './constants';

// Note: Most calisthenics training uses the same components as Force
// with different color theme and adapted logic.
// Create specific wrappers only when necessary.

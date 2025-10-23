/**
 * Force Training Types
 * Shared types and interfaces for force training components
 */

import type { Exercise } from '../../../../../system/store/trainingPipeline/types';

/**
 * Exercise adjustment types
 */
export type ExerciseAdjustmentType =
  | 'increase_load'
  | 'decrease_load'
  | 'increase_reps'
  | 'decrease_reps'
  | 'increase_sets'
  | 'decrease_sets';

/**
 * Timer modes
 */
export type TimerMode = 'session' | 'rest' | 'preparation' | 'paused';

/**
 * Countdown phases
 */
export type CountdownPhase = 'preparation' | 'transition' | 'set' | 'completed';

/**
 * Difficulty levels based on RPE
 */
export type DifficultyLevel = 'easy' | 'moderate' | 'intense' | 'very_intense';

/**
 * Difficulty badge configuration
 */
export interface DifficultyBadge {
  label: string;
  color: string;
  level: DifficultyLevel;
}

/**
 * Exercise adjustment result
 */
export interface AdjustmentResult {
  newValue: number | number[];
  changeAmount: number;
  changeType: ExerciseAdjustmentType;
}

/**
 * Timer state
 */
export interface TimerState {
  sessionTime: number;
  restTime: number;
  isRunning: boolean;
  isResting: boolean;
  mode: TimerMode;
}

/**
 * Timer configuration
 */
export interface TimerConfig {
  defaultRestTime: number;
  defaultPrepTime: number;
  enableAudio: boolean;
  enableHaptics: boolean;
}

/**
 * Countdown props base
 */
export interface CountdownPropsBase {
  duration: number;
  onComplete: () => void;
  stepColor: string;
}

/**
 * Exercise preparation countdown props
 */
export interface PreparationCountdownProps extends CountdownPropsBase {
  exerciseName: string;
  exerciseVariant?: string;
}

/**
 * Transition countdown props
 */
export interface TransitionCountdownProps {
  onComplete: () => void;
  duration?: number;
}

/**
 * Training prescription card props
 */
export interface TrainingPrescriptionCardProps {
  exercise: Exercise;
  stepColor: string;
  onExerciseUpdate: (exerciseId: string, updates: Partial<Exercise>) => void;
  onExerciseSubstitution?: (exerciseId: string, substitutionName: string) => void;
  onExerciseRegenerate?: (exerciseId: string) => void;
  isRegenerating?: boolean;
  className?: string;
}

/**
 * Force adjustment buttons props
 */
export interface ForceAdjustmentButtonsProps {
  exercise: Exercise;
  stepColor: string;
  onAdjustLoad: (newLoad: number | number[]) => void;
  onAdjustReps: (newReps: number) => void;
}

/**
 * Exercise adjustment panel props
 */
export interface ExerciseAdjustmentPanelProps {
  exercise: Exercise;
  onAdjustment: (exerciseId: string, adjustmentId: string, message: string) => void;
  stepColor: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

/**
 * Floating timer card props
 */
export interface FloatingTimerCardProps {
  sessionTime: number;
  restTime: number;
  isResting: boolean;
  formatTime: (seconds: number) => string;
  stepColor: string;
  currentExerciseIndex: number;
  totalExercises: number;
  isSessionRunning: boolean;
  onPlayPause: () => void;
}

/**
 * Exercise stats for display
 */
export interface ExerciseStats {
  sets: number;
  reps: number;
  load: number | number[] | null;
  tempo?: string;
  rest: number;
  rpeTarget?: number;
}

/**
 * Load display configuration
 */
export interface LoadDisplay {
  value: string;
  label: string;
  isProgressive: boolean;
  summary?: string;
}

/**
 * Re-export Exercise type for convenience
 */
export type { Exercise };

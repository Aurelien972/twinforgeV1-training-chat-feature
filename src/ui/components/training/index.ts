/**
 * Training UI Components Exports
 * Centralized export for all training-related components
 */

// Session Components
export * from './session';

// Location Components
export * from './location';

// Equipment Components
export * from './equipment';

// Endurance Components
export * from './endurance';

// Force Components
export * from './force';

// Functional Components (CrossFit, HIIT, WODs)
export * from './functional';

// Feedback Components (Post-Session Analysis)
export * from './feedback';

// Recovery Components
export * from './recovery';

// Temporary exports for components not yet organized
export { default as ModeToggle } from './ModeToggle';
export { default as ExerciseCardSkeleton } from './ExerciseCardSkeleton';
export { default as GlowIcon } from './GlowIcon';
export { default as TrainingCoachNotificationBubble } from './TrainingCoachNotificationBubble';
export { default as FloatingGenerateButton } from './FloatingGenerateButton';
export { default as TrainingGenerationLoader } from './TrainingGenerationLoader';

// Today Tab Components
export * from './today';

// Insights Tab Components
export * from './insights';

// Progression Tab Components
export * from './progression';

// History Tab Components
export * from './history';

// Discipline Selector Components
export * from './discipline-selector';

// Utility Components
export { default as TrendIndicator } from './TrendIndicator';
export { default as ProgressBarAnimated } from './ProgressBarAnimated';
export { default as StatComparisonBadge } from './StatComparisonBadge';

// Modals
export { default as TrainingSaveModal } from './TrainingSaveModal';
export { default as TrainingRegenerateModal } from './TrainingRegenerateModal';
export { default as TrainingBackModal } from './TrainingBackModal';

// Dev Tools
export { default as DevModeControls } from './DevModeControls';

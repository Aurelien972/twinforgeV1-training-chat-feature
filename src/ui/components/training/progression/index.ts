/**
 * Progression Tab Components
 * Components for the "Progression" training tab
 *
 * This module has been refactored into a modular structure:
 * - /cards - Main progression cards
 * - /charts - Chart components for data visualization
 * - /shared - Reusable components (LevelBadge, AchievementCard, etc.)
 * - /utils - Calculation utilities
 * - /config - Constants and configurations
 * - /types - TypeScript types
 */

// Export refactored cards from new structure
export { ProgressionOverviewCard } from './cards';

// Export components still in old location (to be refactored)
export { default as PersonalBestsTimeline } from './PersonalBestsTimeline';
export { default as AchievementsBadgesGrid } from './AchievementsBadgesGrid';
export { default as MilestonesProgressCard } from './MilestonesProgressCard';
export { default as ProgressionPathCard } from './ProgressionPathCard';
export { default as MuscleGroupProgressGrid } from './MuscleGroupProgressGrid';
export { default as VolumeIntensityBalanceGauge } from './VolumeIntensityBalanceGauge';
export { default as PersonalRecordsGrid } from './PersonalRecordsGrid';

// Re-export charts
export * from './charts';

// Export shared components for advanced usage
export * from './shared';

// Export utilities and types for advanced usage
export * from './utils';
export * from './types';
export * from './config';

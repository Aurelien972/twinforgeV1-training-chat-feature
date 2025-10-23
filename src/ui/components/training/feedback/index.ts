/**
 * Feedback Components Exports
 * Post-session analysis and metrics components
 *
 * This module has been refactored into a modular structure:
 * - /cards - Performance cards (ScoreGlobalCard, SessionBadgesCard, etc.)
 * - /overlays - Modal overlays (AnalysisProgressOverlay, BackgroundAnalysisIndicator)
 * - /stats - Statistics displays (SessionSummaryStats)
 * - /sections - Complex sections (MeasurableGoalsSection)
 * - /shared - Reusable components (MetricCard, CircularProgress, ProgressBar)
 * - /utils - Calculation utilities
 * - /config - Constants and configurations
 * - /types - TypeScript types
 */

// Re-export refactored components from new structure
export { ScoreGlobalCard, SessionBadgesCard } from './cards';
export { AnalysisProgressOverlay, BackgroundAnalysisIndicator } from './overlays';
export { SessionSummaryStats } from './stats';

// Export components still in old location (to be refactored)
export { default as ExerciseAnalysisCard } from './ExerciseAnalysisCard';
export { default as PersonalizedMetricsCard } from './PersonalizedMetricsCard';
export { default as MeasurableGoalsSection } from './MeasurableGoalsSection';

// Export shared components for internal use
export * from './shared';

// Export utilities and types for advanced usage
export * from './utils';
export * from './types';
export * from './config/constants';
export * from './config/badgeConfigs';

/**
 * Progression Types
 * Centralized type definitions for progression components
 */

import type {
  UserLevel,
  Achievement,
  Milestone,
  PersonalRecord,
  AchievementCategory,
  AchievementRarity,
  MilestoneType,
} from '../../../../../domain/trainingProgression';

import type { ProgressionTrend } from '../../../../../domain/trainingToday';
import type { IconName } from '../../../../icons/registry';

// Re-export domain types for convenience
export type {
  UserLevel,
  Achievement,
  Milestone,
  PersonalRecord,
  AchievementCategory,
  AchievementRarity,
  MilestoneType,
  ProgressionTrend,
};

// Rarity configuration
export type RarityLevel = 'common' | 'rare' | 'epic' | 'legendary';

export interface RarityConfig {
  border: string;
  glow: string;
  color: string;
  background: string;
}

// Color scheme types
export interface ColorScheme {
  LEVEL: string;
  XP: string;
  ACHIEVEMENT: string;
  RECORD: string;
  STREAK: string;
  MILESTONE: string;
  RPE: string;
  VOLUME: string;
  INTENSITY: string;
  SUCCESS: string;
  WARNING: string;
  DANGER: string;
  INFO: string;
}

// Chart types
export interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
  value: number;
}

export interface ChartMetric {
  key: string;
  label: string;
  color: string;
}

export interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Component props base types
export interface ProgressionCardBaseProps {
  stepColor?: string;
  animated?: boolean;
  className?: string;
}

export interface ProgressionOverviewCardProps extends ProgressionCardBaseProps {
  userLevel: UserLevel;
  totalSessions: number;
  currentStreak: number;
}

export interface AchievementsBadgesGridProps extends ProgressionCardBaseProps {
  achievements: Achievement[];
}

export interface PersonalBestsTimelineProps extends ProgressionCardBaseProps {
  records: PersonalRecord[];
}

export interface MilestonesProgressCardProps extends ProgressionCardBaseProps {
  milestones: Milestone[];
}

export interface PersonalRecordsGridProps extends ProgressionCardBaseProps {
  records: PersonalRecord[];
  groupBy?: 'exercise' | 'muscleGroup' | 'date';
}

export interface ProgressionPathCardProps extends ProgressionCardBaseProps {
  currentLevel: number;
  nextMilestones: Milestone[];
}

export interface MuscleGroupProgressGridProps extends ProgressionCardBaseProps {
  muscleGroupData: MuscleGroupProgress[];
}

export interface VolumeIntensityBalanceGaugeProps extends ProgressionCardBaseProps {
  volumeScore: number;
  intensityScore: number;
  balanceRating: 'excellent' | 'good' | 'needsWork';
}

// Chart component props
export interface ProgressionTrendChartProps extends ProgressionCardBaseProps {
  trends?: ProgressionTrend[];
  loading?: boolean;
}

export interface VolumeProgressionChartProps extends ProgressionCardBaseProps {
  data: ChartDataPoint[];
}

export interface StrengthEvolutionChartProps extends ProgressionCardBaseProps {
  data: ChartDataPoint[];
  exerciseName?: string;
}

export interface ConsistencyCalendarHeatmapProps extends ProgressionCardBaseProps {
  sessionDates: Date[];
  startDate?: Date;
  endDate?: Date;
}

export interface WeeklyPatternHeatmapProps extends ProgressionCardBaseProps {
  weeklyData: WeeklySessionData[];
}

// Shared component props
export interface LevelBadgeProps {
  level: number;
  title?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

export interface AchievementCardProps {
  achievement: Achievement;
  compact?: boolean;
  showProgress?: boolean;
  onUnlock?: (achievementId: string) => void;
}

export interface RecordEntryProps {
  record: PersonalRecord;
  showTimeline?: boolean;
  showImprovement?: boolean;
  isLast?: boolean;
}

export interface MilestoneProgressProps {
  milestone: Milestone;
  showPercentage?: boolean;
  animated?: boolean;
  compact?: boolean;
}

export interface StatMetricProps {
  icon: IconName;
  value: string | number;
  label: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

// Data structure types
export interface MuscleGroupProgress {
  muscleGroup: string;
  totalVolume: number;
  sessionCount: number;
  averageIntensity: number;
  lastTrained?: Date;
  progress: number;
  color: string;
}

export interface WeeklySessionData {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  sessionCount: number;
  avgIntensity: number;
}

// Level system types
export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
  xpForNext: number;
  progress: number;
}

export interface XPGain {
  amount: number;
  source: string;
  timestamp: Date;
}

// Achievement system types
export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  percentage: number;
  isUnlocked: boolean;
}

export interface AchievementCategoryConfig {
  color: string;
  icon: IconName;
  label: string;
}

// Record comparison types
export interface RecordComparison {
  current: number;
  previous?: number;
  improvement?: number;
  improvementPercentage?: number;
  isNewRecord: boolean;
}

export interface RecordsByMuscleGroup {
  muscleGroup: string;
  records: PersonalRecord[];
  bestRecord: PersonalRecord;
}

// Coach system types (for future multi-coach support)
export interface CoachProfile {
  id: string;
  name: string;
  specialty: string;
  colorScheme: ColorScheme;
  progressionEmphasis: 'volume' | 'intensity' | 'consistency' | 'balanced';
  achievementWeights: Record<AchievementCategory, number>;
}

export interface CoachProgressionConfig {
  coachId: string;
  emphasisMetrics: string[];
  customColors?: Partial<ColorScheme>;
  hiddenCategories?: AchievementCategory[];
}

// Hook return types
export interface UseProgressionDataReturn {
  userLevel: UserLevel | null;
  achievements: Achievement[];
  records: PersonalRecord[];
  milestones: Milestone[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseAchievementsReturn {
  achievements: Achievement[];
  unlocked: Achievement[];
  locked: Achievement[];
  byCategory: (category: AchievementCategory) => Achievement[];
  sortByProgress: () => Achievement[];
  filterByRarity: (rarity: RarityLevel) => Achievement[];
  loading: boolean;
}

export interface UsePersonalRecordsReturn {
  records: PersonalRecord[];
  byMuscleGroup: Map<string, PersonalRecord[]>;
  recent: PersonalRecord[];
  addRecord: (record: Omit<PersonalRecord, 'id' | 'achievedAt'>) => Promise<void>;
  updateRecord: (id: string, updates: Partial<PersonalRecord>) => Promise<void>;
  loading: boolean;
}

export interface UseLevelSystemReturn {
  level: number;
  xp: number;
  totalXP: number;
  progress: number;
  nextLevel: number;
  xpForNextLevel: number;
  title: string;
  addXP: (amount: number, source: string) => Promise<void>;
  levelUp: () => Promise<void>;
  loading: boolean;
}

// Utility function types
export type LevelCalculator = (xp: number) => number;
export type XPCalculator = (level: number) => number;
export type ProgressCalculator = (current: number, target: number) => number;
export type ImprovementCalculator = (current: number, previous: number) => number;

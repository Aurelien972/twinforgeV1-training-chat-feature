/**
 * Feedback Types
 * Centralized type definitions for feedback components
 */

import type { SessionFeedback, SessionPrescription, ExerciseFeedback } from '../../../../../system/store/trainingPipeline/types';
import type { SessionAnalysisResult } from '../../../../../system/services/sessionAnalysisService';
import type { IconName } from '../../../../icons/registry';

// Rating types
export type PerformanceRating = 'excellent' | 'good' | 'average' | 'needs-improvement';

// Analysis phase types
export type AnalysisPhase = 'idle' | 'preparing' | 'uploading' | 'analyzing' | 'validating' | 'saving' | 'completed' | 'error';

// Badge types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  emoji: string;
  earned: boolean;
}

export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  emoji: string;
  condition: (metrics: SessionMetrics) => boolean;
}

// Metrics types
export interface SessionMetrics {
  totalVolume: number;
  totalReps: number;
  workRestRatio: number;
  caloriesBurned: number;
  avgIntensity: number;
  timeUnderTension: number;
  avgTechnique: number;
  completionRate: number;
  durationMinutes: number;
  avgRpe: number;
}

export interface EnduranceMetrics {
  totalDuration: number;
  avgRPE: number;
  estimatedCalories: number;
  zones?: string;
}

// Analysis progress types
export interface AnalysisProgress {
  phase: AnalysisPhase;
  progress: number;
  message: string;
  elapsedTime: number;
  currentPhotoIndex: number;
  totalPhotos: number;
  photosCompleted: number;
  estimatedTimeRemaining: number;
}

// Component props types
export interface ScoreGlobalCardProps {
  score: number;
  rating: PerformanceRating;
  summary: string;
  coachRationale: string;
  stepColor: string;
}

export interface SessionBadgesCardProps {
  sessionFeedback: SessionFeedback;
  sessionPrescription: SessionPrescription;
  stepColor: string;
  aiAnalysis?: SessionAnalysisResult | null;
}

export interface PersonalizedMetricsCardProps {
  sessionFeedback: SessionFeedback;
  sessionPrescription: SessionPrescription;
  stepColor: string;
  aiAnalysis?: SessionAnalysisResult | null;
}

export interface ExerciseAnalysisCardProps {
  sessionFeedback: SessionFeedback;
  sessionPrescription: SessionPrescription;
  stepColor: string;
  aiAnalysis?: SessionAnalysisResult | null;
}

export interface SessionSummaryStatsProps {
  prescription: SessionPrescription;
  stepColor: string;
}

export interface AnalysisProgressOverlayProps {
  isOpen: boolean;
  progress: AnalysisProgress;
  onCancel?: () => void;
}

// Stats types
export interface StatConfig {
  icon: IconName;
  label: string;
  value: string;
  color: string;
}

// Color mapping types
export interface RatingColorMap {
  [key: string]: string;
}

export interface RatingLabelMap {
  [key: string]: string;
}

export interface RatingIconMap {
  [key: string]: IconName;
}

// Re-export commonly used types
export type { SessionFeedback, SessionPrescription, ExerciseFeedback, SessionAnalysisResult };

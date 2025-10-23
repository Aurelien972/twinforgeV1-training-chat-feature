/**
 * useAdviceAdaptiveContent Hook
 * Provides discipline-adapted content for training advice components
 * Integrates DisciplineConfig with terminology service
 */

import { useMemo } from 'react';
import { disciplineTerminologyService } from '../system/services/disciplineTerminologyService';
import type { DisciplineConfig } from './useDisciplineAdaptiveContent';
import type { TrainingInsights } from '../system/services/trainingAdviceService';

interface AdviceAdaptiveContent {
  config: DisciplineConfig;
  terminology: ReturnType<typeof disciplineTerminologyService.getTerminology>;
  recommendations: ReturnType<typeof disciplineTerminologyService.getRecommendations>;

  // Helper methods
  formatSessionCount: (count: number) => string;
  getMetricDescription: (type: 'volume' | 'intensity' | 'recovery') => string;
  getVolumeRecommendations: (trend: 'increasing' | 'stable' | 'decreasing') => {
    title: string;
    descriptions: string[];
  };
  getIntensityRecommendations: (level: 'high' | 'optimal' | 'low') => {
    title: string;
    descriptions: string[];
  };
}

export function useAdviceAdaptiveContent(
  config: DisciplineConfig,
  insights: TrainingInsights | null
): AdviceAdaptiveContent {
  const disciplineId = config.id;

  const terminology = useMemo(
    () => disciplineTerminologyService.getTerminology(disciplineId),
    [disciplineId]
  );

  const recommendations = useMemo(
    () => disciplineTerminologyService.getRecommendations(disciplineId),
    [disciplineId]
  );

  const formatSessionCount = useMemo(
    () => (count: number) => disciplineTerminologyService.formatSessionCount(disciplineId, count),
    [disciplineId]
  );

  const getMetricDescription = useMemo(
    () => (type: 'volume' | 'intensity' | 'recovery') =>
      disciplineTerminologyService.getMetricDescription(disciplineId, type),
    [disciplineId]
  );

  const getVolumeRecommendations = useMemo(
    () => (trend: 'increasing' | 'stable' | 'decreasing') =>
      disciplineTerminologyService.getVolumeRecommendations(disciplineId, trend),
    [disciplineId]
  );

  const getIntensityRecommendations = useMemo(
    () => (level: 'high' | 'optimal' | 'low') =>
      disciplineTerminologyService.getIntensityRecommendations(disciplineId, level),
    [disciplineId]
  );

  return {
    config,
    terminology,
    recommendations,
    formatSessionCount,
    getMetricDescription,
    getVolumeRecommendations,
    getIntensityRecommendations,
  };
}

/**
 * TrainingAdviceTab Component
 * AI-powered training advice and recommendations
 */

import React from 'react';
import { useTrainingAdviceData } from './hooks/useTrainingAdviceData';
import GlassCard from '../../../ui/cards/GlassCard';
import SpatialIcon from '../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../ui/icons/registry';
import {
  AIPrimaryAdviceCard,
  VolumeAdviceCard,
  IntensityAdviceCard,
  RecoveryOptimizationAdvice,
  StrategyAdviceCard,
  DisciplineDistributionCard,
  WeeklyCoachingInsightsGrid
} from '../../../ui/components/training/advice';
import EmptyCoachingAdviceState from './components/EmptyStates/EmptyCoachingAdviceState';

const TrainingAdviceTab: React.FC = () => {
  const { data: adviceData, isLoading, error } = useTrainingAdviceData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <GlassCard key={i} className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-white/10 rounded w-1/3"></div>
              <div className="h-32 bg-white/5 rounded"></div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard
        className="p-8 text-center"
        style={{
          background: 'var(--glass-opacity)',
          borderColor: 'color-mix(in srgb, #EF4444 25%, transparent)'
        }}
      >
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{
            background: 'color-mix(in srgb, #EF4444 15%, transparent)',
            border: '2px solid color-mix(in srgb, #EF4444 30%, transparent)'
          }}
        >
          <SpatialIcon Icon={ICONS.AlertCircle} size={32} style={{ color: '#EF4444' }} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Erreur de Chargement</h3>
        <p className="text-white/60">
          Impossible de charger les conseils. Veuillez réessayer.
        </p>
      </GlassCard>
    );
  }

  if (!adviceData || adviceData.totalSessions === 0) {
    return <EmptyCoachingAdviceState />;
  }

  return (
    <div className="space-y-6">
      {/* AI Primary Advice Card */}
      <AIPrimaryAdviceCard
        volumeAdvice={adviceData.volumeAdvice}
        intensityAdvice={adviceData.intensityAdvice}
        recoveryAdvice={adviceData.recoveryAdvice}
      />

      {/* Weekly Coaching Insights */}
      <WeeklyCoachingInsightsGrid
        totalSessions={adviceData.totalSessions}
        volumeAdvice={adviceData.volumeAdvice}
        intensityAdvice={adviceData.intensityAdvice}
      />

      {/* Volume Advice */}
      <VolumeAdviceCard advice={adviceData.volumeAdvice} />

      {/* Intensity Advice */}
      <IntensityAdviceCard advice={adviceData.intensityAdvice} />

      {/* Recovery Optimization */}
      <RecoveryOptimizationAdvice advice={adviceData.recoveryAdvice} />

      {/* Discipline Distribution */}
      {adviceData.disciplineBalance.length > 1 && (
        <DisciplineDistributionCard distribution={adviceData.disciplineBalance} />
      )}

      {/* Strategy Advice */}
      <StrategyAdviceCard
        volumeAdvice={adviceData.volumeAdvice}
        intensityAdvice={adviceData.intensityAdvice}
        disciplineBalance={adviceData.disciplineBalance}
      />

      {/* Link to Progression Tab */}
      <GlassCard
        className="p-6 text-center"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, #3B82F6 8%, transparent) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'color-mix(in srgb, #3B82F6 20%, transparent)'
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <SpatialIcon Icon={ICONS.TrendingUp} size={16} style={{ color: '#3B82F6' }} />
          <p className="text-white/70 text-sm">
            Consultez l'onglet <strong className="text-blue-300">Progression</strong> pour voir vos graphiques d'évolution
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default TrainingAdviceTab;

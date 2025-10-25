/**
 * TrainingTodayTab Component
 * Today's training overview and quick actions
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingTodayData } from './hooks/useTrainingTodayData';
import { useTrainingPipeline } from '../../../system/store/trainingPipeline';
import GlassCard from '../../../ui/cards/GlassCard';
import SpatialIcon from '../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../ui/icons/registry';
import {
  HeroTrainingCTA,
  TodayStatusWidget,
  CurrentGoalCard,
  SavedDraftsCard,
  QuickHistoryCard,
  WearableTodayDashboard,
  OptimalTrainingWindow
} from '../../../ui/components/training/today';
import EmptyCoachingTodayState from './components/EmptyStates/EmptyCoachingTodayState';
import { useHasConnectedWearable } from '../../../hooks/useHasConnectedWearable';

const TrainingTodayTab: React.FC = () => {
  const navigate = useNavigate();
  const { data: todayData, isLoading, error } = useTrainingTodayData();
  const { startPipeline } = useTrainingPipeline();
  const { hasConnectedWearable } = useHasConnectedWearable();

  const handleStartSession = () => {
    startPipeline();
    navigate('/training/pipeline');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
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
          Impossible de charger les données du jour. Veuillez réessayer.
        </p>
      </GlassCard>
    );
  }

  // Show empty state only if no completed sessions AND no draft sessions
  if (!todayData || (todayData.weekStats.sessionsCount === 0 && todayData.draftSessions.length === 0)) {
    return <EmptyCoachingTodayState onStartTraining={handleStartSession} />;
  }

  return (
    <div className="space-y-6">
      {/* Hero CTA */}
      <HeroTrainingCTA onStartSession={handleStartSession} />

      {/* Today Status */}
      <TodayStatusWidget
        hasCompletedToday={todayData.hasCompletedToday}
        weekStats={todayData.weekStats}
        lastSession={todayData.lastSession}
      />

      {/* Wearable Dashboard (if connected) */}
      {hasConnectedWearable && <WearableTodayDashboard />}

      {/* Optimal Training Window */}
      <OptimalTrainingWindow />

      {/* Current Goals */}
      {todayData.currentGoals.length > 0 && (
        <div className="space-y-4">
          {todayData.currentGoals.map((goal) => (
            <CurrentGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {/* Saved Drafts */}
      {todayData.draftSessions.length > 0 && (
        <SavedDraftsCard drafts={todayData.draftSessions} />
      )}

      {/* Quick History */}
      <QuickHistoryCard weekStats={todayData.weekStats} />
    </div>
  );
};

export default TrainingTodayTab;

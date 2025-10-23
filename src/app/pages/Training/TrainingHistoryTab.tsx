/**
 * TrainingHistoryTab Component
 * Complete training history with filters and timeline
 */

import React, { useState } from 'react';
import { useTrainingHistoryData, type HistoryPeriod, type HistoryDiscipline } from './hooks/useTrainingHistoryData';
import GlassCard from '../../../ui/cards/GlassCard';
import SpatialIcon from '../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../ui/icons/registry';
import {
  HistoryFilterBar,
  SessionHistoryTimeline,
  HistoryStatsOverview,
  HistoryEmptyState
} from '../../../ui/components/training/history';
import EmptyCoachingHistoryState from './components/EmptyStates/EmptyCoachingHistoryState';
import { useFeedback } from '../../../hooks/useFeedback';
import logger from '../../../lib/utils/logger';

const TrainingHistoryTab: React.FC = () => {
  const { click } = useFeedback();
  const [selectedPeriod, setSelectedPeriod] = useState<HistoryPeriod>('month');
  const [selectedDiscipline, setSelectedDiscipline] = useState<HistoryDiscipline>('all');
  const [currentPage, setCurrentPage] = useState(0);

  const { data: historyData, isLoading, error } = useTrainingHistoryData(
    selectedPeriod,
    selectedDiscipline,
    currentPage
  );

  const handlePeriodChange = (period: HistoryPeriod) => {
    click();
    setSelectedPeriod(period);
    setCurrentPage(0);

    logger.info('TRAINING_HISTORY_TAB', 'Period changed', {
      newPeriod: period,
      timestamp: new Date().toISOString()
    });
  };

  const handleDisciplineChange = (discipline: HistoryDiscipline) => {
    click();
    setSelectedDiscipline(discipline);
    setCurrentPage(0);

    logger.info('TRAINING_HISTORY_TAB', 'Discipline changed', {
      newDiscipline: discipline,
      timestamp: new Date().toISOString()
    });
  };

  const handleLoadMore = () => {
    click();
    setCurrentPage(prev => prev + 1);
  };

  if (isLoading && currentPage === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center mb-6">
          <div className="inline-flex gap-2 p-1 rounded-lg" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {['week', 'month', 'quarter', 'all'].map(period => (
              <button
                key={period}
                disabled
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/50 cursor-not-allowed"
              >
                {period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : period === 'quarter' ? 'Trimestre' : 'Tout'}
              </button>
            ))}
          </div>
        </div>

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
          Impossible de charger l'historique. Veuillez réessayer.
        </p>
      </GlassCard>
    );
  }

  if (!historyData || historyData.total === 0) {
    return <EmptyCoachingHistoryState />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <HistoryFilterBar
        selectedPeriod={selectedPeriod}
        selectedDiscipline={selectedDiscipline}
        onPeriodChange={handlePeriodChange}
        onDisciplineChange={handleDisciplineChange}
      />

      {/* Stats Overview */}
      <HistoryStatsOverview stats={historyData.stats} period={selectedPeriod} />

      {/* Sessions Timeline */}
      {historyData.sessions.length > 0 ? (
        <>
          <SessionHistoryTimeline sessions={historyData.sessions} />

          {/* Load More Button */}
          {historyData.hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-6 py-3 rounded-lg text-sm font-medium text-white transition-all"
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
                  opacity: isLoading ? 0.5 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <SpatialIcon Icon={ICONS.Loader2} size={16} className="animate-spin" />
                    <span>Chargement...</span>
                  </div>
                ) : (
                  <span>Charger plus de sessions</span>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <HistoryEmptyState period={selectedPeriod} discipline={selectedDiscipline} />
      )}

      {/* Link to other tabs */}
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

export default TrainingHistoryTab;

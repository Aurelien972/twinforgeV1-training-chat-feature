/**
 * TrainingProgressTab Component
 * New progression tab with real training data and no gamification
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useActivityPeriodStore } from '../../../system/store/activityPeriodStore';
import { useTrainingProgressionData, ProgressionPeriod } from './hooks/useTrainingProgressionData';
import GlassCard from '../../../ui/cards/GlassCard';
import SpatialIcon from '../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../ui/icons/registry';
import ProgressionStatsCard from './components/ProgressionStatsCard';
import VolumeProgressionChartV2 from './components/VolumeProgressionChartV2';
import ConsistencyCalendarSection from './components/ConsistencyCalendarSection';
import TrainingLoadChart from './components/TrainingLoadChart';
import PersonalRecordsSection from './components/PersonalRecordsSection';
import ProgressionAIInsightsCard from './components/ProgressionAIInsightsCard';
import TrainingProgressTabSkeleton from '../../../ui/components/skeletons/TrainingProgressTabSkeleton';
import { useFeedback } from '../../../hooks/useFeedback';
import logger from '../../../lib/utils/logger';

const PERIOD_MAPPING: Record<string, ProgressionPeriod> = {
  'week': 'week',
  'month': 'month',
  'quarter': 'quarter',
};

const TrainingProgressTab: React.FC = () => {
  const { click } = useFeedback();
  const selectedPeriod = useActivityPeriodStore((state) => state.selectedPeriod);
  const setGlobalPeriod = useActivityPeriodStore((state) => state.setSelectedPeriod);

  const apiPeriod = PERIOD_MAPPING[selectedPeriod] || 'month';

  const { data: progressionData, isLoading, error } = useTrainingProgressionData(apiPeriod);

  const handlePeriodChange = (period: 'week' | 'month' | 'quarter') => {
    click();
    setGlobalPeriod(period);

    logger.info('TRAINING_PROGRESSION_TAB', 'Period changed', {
      newPeriod: period,
      timestamp: new Date().toISOString()
    });
  };

  if (isLoading) {
    return <TrainingProgressTabSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
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
            Impossible de charger les données de progression. Veuillez réessayer.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (!progressionData || progressionData.stats.totalSessions === 0) {
    return (
      <div className="space-y-6">
        <GlassCard
          className="p-10 text-center space-y-6"
          style={{
            background: `
              radial-gradient(circle at 50% 20%, color-mix(in srgb, #3B82F6 15%, transparent) 0%, transparent 60%),
              radial-gradient(circle at 20% 80%, color-mix(in srgb, #8B5CF6 10%, transparent) 0%, transparent 50%),
              rgba(255, 255, 255, 0.08)
            `,
            border: '2px solid color-mix(in srgb, #3B82F6 30%, transparent)',
            boxShadow: `
              0 12px 40px rgba(0, 0, 0, 0.3),
              0 0 40px color-mix(in srgb, #3B82F6 20%, transparent),
              inset 0 2px 0 rgba(255, 255, 255, 0.15)
            `
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%),
                  linear-gradient(135deg, color-mix(in srgb, #3B82F6 40%, transparent), color-mix(in srgb, #3B82F6 25%, transparent))
                `,
                border: '3px solid color-mix(in srgb, #3B82F6 50%, transparent)',
                boxShadow: '0 0 40px color-mix(in srgb, #3B82F6 40%, transparent)'
              }}
            >
              <SpatialIcon Icon={ICONS.TrendingUp} size={48} style={{ color: '#3B82F6' }} />
            </motion.div>
          </motion.div>

          <div>
            <h2 className="text-4xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
              Débloquez votre Progression
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-4">
              Votre tableau de bord d'évolution personnalisé
            </p>
            <p className="text-white/60 leading-relaxed max-w-lg mx-auto">
              Complétez quelques séances pour voir vos graphiques de progression, votre régularité,
              et l'évolution de votre charge d'entraînement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: ICONS.BarChart, label: 'Graphiques Volume', color: '#3B82F6' },
              { icon: ICONS.Calendar, label: 'Calendrier Régularité', color: '#8B5CF6' },
              { icon: ICONS.Activity, label: 'Charge Entraînement', color: '#22C55E' }
            ].map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-4 rounded-lg"
                style={{
                  background: `color-mix(in srgb, ${feature.color} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${feature.color} 25%, transparent)`
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{
                      background: `color-mix(in srgb, ${feature.color} 20%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${feature.color} 35%, transparent)`
                    }}
                  >
                    <SpatialIcon Icon={feature.icon} size={24} style={{ color: feature.color }} />
                  </div>
                  <span className="text-white/70 text-sm text-center">{feature.label}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="pt-6"
          >
            <motion.button
              onClick={() => handlePeriodChange('week')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 rounded-xl font-bold text-lg"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, #3B82F6 50%, transparent), color-mix(in srgb, #3B82F6 35%, transparent))`,
                border: '2px solid color-mix(in srgb, #3B82F6 60%, transparent)',
                color: '#FFFFFF',
                boxShadow: `0 8px 30px color-mix(in srgb, #3B82F6 30%, transparent)`
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <SpatialIcon Icon={ICONS.Play} size={20} style={{ color: '#FFFFFF' }} />
                <span>Commencer mon parcours</span>
              </div>
            </motion.button>
          </motion.div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="inline-flex gap-2 p-1 rounded-lg" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {(['week', 'month', 'quarter'] as const).map(period => {
            const isActive = selectedPeriod === period;
            return (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: isActive ? '#3B82F6' : 'rgba(255, 255, 255, 0.7)',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 20px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                {period === 'week' ? '4 Semaines' : period === 'month' ? '12 Semaines' : '24 Semaines'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progression Stats Card */}
      <ProgressionStatsCard
        totalSessions={progressionData.stats.totalSessions}
        totalVolume={progressionData.stats.totalVolume}
        totalDuration={progressionData.stats.totalDuration}
        avgRPE={progressionData.stats.avgRPE}
        currentWeekSessions={progressionData.stats.currentWeekSessions}
        previousWeekSessions={progressionData.stats.previousWeekSessions}
        sessionsChange={progressionData.stats.sessionsChange}
        volumeChange={progressionData.stats.volumeChange}
        currentWeekVolume={progressionData.stats.currentWeekVolume}
        period={apiPeriod}
      />

      {/* AI Insights Card */}
      <ProgressionAIInsightsCard period={apiPeriod} />

      {/* Volume Progression Chart */}
      {progressionData.volumeProgression.length > 0 && (
        <VolumeProgressionChartV2 data={progressionData.volumeProgression} />
      )}

      {/* Training Load Chart */}
      {progressionData.volumeProgression.length > 0 && (
        <TrainingLoadChart data={progressionData.volumeProgression} />
      )}

      {/* Consistency Calendar */}
      {progressionData.consistencyDays.length > 0 && (
        <ConsistencyCalendarSection
          days={progressionData.consistencyDays}
          stats={progressionData.consistencyStats}
        />
      )}

      {/* Link to Records Tab */}
      {progressionData.personalRecords.length > 0 && (
        <GlassCard
          className="p-6 text-center cursor-pointer hover:scale-[1.02] transition-all"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, color-mix(in srgb, #F59E0B 12%, transparent) 0%, transparent 60%),
              var(--glass-opacity)
            `,
            borderColor: 'color-mix(in srgb, #F59E0B 25%, transparent)'
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                  linear-gradient(135deg, color-mix(in srgb, #F59E0B 30%, transparent), color-mix(in srgb, #F59E0B 20%, transparent))
                `,
                border: '2px solid color-mix(in srgb, #F59E0B 40%, transparent)',
                boxShadow: '0 0 30px color-mix(in srgb, #F59E0B 30%, transparent)'
              }}
            >
              <SpatialIcon Icon={ICONS.Trophy} size={24} style={{ color: '#F59E0B' }} />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {progressionData.personalRecords.length} Record{progressionData.personalRecords.length > 1 ? 's' : ''} Personnel{progressionData.personalRecords.length > 1 ? 's' : ''}
          </h3>
          <p className="text-white/70 text-sm mb-4">
            Consultez l'onglet <strong className="text-orange-300">Records</strong> pour voir tous vos records personnels, leur évolution et les opportunités de battre de nouveaux records
          </p>
          <button
            className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)'
            }}
          >
            Voir tous mes records →
          </button>
        </GlassCard>
      )}

      {/* Link to Conseils Tab */}
      <GlassCard
        className="p-6 text-center"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, #F59E0B 8%, transparent) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'color-mix(in srgb, #F59E0B 20%, transparent)'
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <SpatialIcon Icon={ICONS.Lightbulb} size={16} style={{ color: '#F59E0B' }} />
          <p className="text-white/70 text-sm">
            Consultez l'onglet <strong className="text-orange-300">Conseils</strong> pour des recommandations personnalisées basées sur votre progression
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default TrainingProgressTab;

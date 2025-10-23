/**
 * TrainingRecordsTab Component
 * Dedicated tab for personal records tracking and visualization
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useActivityPeriodStore } from '../../../system/store/activityPeriodStore';
import { useTrainingProgressionData, ProgressionPeriod } from './hooks/useTrainingProgressionData';
import GlassCard from '../../../ui/cards/GlassCard';
import SpatialIcon from '../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../ui/icons/registry';
import PersonalRecordsSection from './components/PersonalRecordsSection';
import RecordsTimeline from './components/RecordsTimeline';
import RecordsByDisciplineView from './components/RecordsByDisciplineView';
import RecordsProgressionChart from './components/RecordsProgressionChart';
import RecordsHeatmapCalendar from './components/RecordsHeatmapCalendar';
import RecordOpportunitiesWidget from './components/RecordOpportunitiesWidget';
import { useFeedback } from '../../../hooks/useFeedback';
import logger from '../../../lib/utils/logger';

const PERIOD_MAPPING: Record<string, ProgressionPeriod> = {
  'week': 'week',
  'month': 'month',
  'quarter': 'quarter',
};

type RecordsView = 'overview' | 'timeline' | 'discipline';

const TrainingRecordsTab: React.FC = () => {
  const { click } = useFeedback();
  const selectedPeriod = useActivityPeriodStore((state) => state.selectedPeriod);
  const setGlobalPeriod = useActivityPeriodStore((state) => state.setSelectedPeriod);
  const [activeView, setActiveView] = useState<RecordsView>('overview');

  const apiPeriod = PERIOD_MAPPING[selectedPeriod] || 'month';
  const { data: progressionData, isLoading, error } = useTrainingProgressionData(apiPeriod);

  const handlePeriodChange = (period: 'week' | 'month' | 'quarter') => {
    click();
    setGlobalPeriod(period);

    logger.info('TRAINING_RECORDS_TAB', 'Period changed', {
      newPeriod: period,
      timestamp: new Date().toISOString()
    });
  };

  const handleViewChange = (view: RecordsView) => {
    click();
    setActiveView(view);

    logger.info('TRAINING_RECORDS_TAB', 'View changed', {
      newView: view,
      timestamp: new Date().toISOString()
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center mb-6">
          <div className="inline-flex gap-2 p-1 rounded-lg" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {['week', 'month', 'quarter'].map(period => (
              <button
                key={period}
                disabled
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/50 cursor-not-allowed"
              >
                {period === 'week' ? '4 Semaines' : period === 'month' ? '12 Semaines' : '24 Semaines'}
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
            Impossible de charger les records. Veuillez réessayer.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (!progressionData || progressionData.personalRecords.length === 0) {
    return (
      <div className="space-y-6">
        <GlassCard
          className="p-10 text-center space-y-6"
          style={{
            background: `
              radial-gradient(circle at 50% 20%, color-mix(in srgb, #F59E0B 15%, transparent) 0%, transparent 60%),
              radial-gradient(circle at 20% 80%, color-mix(in srgb, #EF4444 10%, transparent) 0%, transparent 50%),
              rgba(255, 255, 255, 0.08)
            `,
            border: '2px solid color-mix(in srgb, #F59E0B 30%, transparent)',
            boxShadow: `
              0 12px 40px rgba(0, 0, 0, 0.3),
              0 0 40px color-mix(in srgb, #F59E0B 20%, transparent),
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
              animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 60%),
                  linear-gradient(135deg, color-mix(in srgb, #F59E0B 40%, transparent), color-mix(in srgb, #EF4444 25%, transparent))
                `,
                border: '3px solid color-mix(in srgb, #F59E0B 50%, transparent)',
                boxShadow: '0 0 40px color-mix(in srgb, #F59E0B 40%, transparent)'
              }}
            >
              <SpatialIcon Icon={ICONS.Trophy} size={48} style={{ color: '#F59E0B' }} />
            </motion.div>
          </motion.div>

          <div>
            <h2 className="text-4xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
              Établissez vos Records
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-4">
              Votre palmarès personnel de champions
            </p>
            <p className="text-white/60 leading-relaxed max-w-lg mx-auto">
              Chaque performance exceptionnelle sera automatiquement détectée et célébrée.
              Suivez votre évolution record après record.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: ICONS.Medal, label: '1RM Records', color: '#F59E0B' },
              { icon: ICONS.Timer, label: 'Records Temps', color: '#EF4444' },
              { icon: ICONS.TrendingUp, label: 'Records Distance', color: '#22C55E' },
              { icon: ICONS.Award, label: 'Jalons Atteints', color: '#A855F7' }
            ].map((recordType, index) => (
              <motion.div
                key={recordType.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-4 rounded-lg"
                style={{
                  background: `color-mix(in srgb, ${recordType.color} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${recordType.color} 25%, transparent)`
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{
                      background: `color-mix(in srgb, ${recordType.color} 20%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${recordType.color} 35%, transparent)`
                    }}
                  >
                    <SpatialIcon Icon={recordType.icon} size={24} style={{ color: recordType.color }} />
                  </div>
                  <span className="text-white/70 text-sm text-center">{recordType.label}</span>
                  <span className="text-white/50 text-xs">0 records</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-6">
            <motion.button
              onClick={() => click()}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 rounded-xl font-bold text-lg"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, #F59E0B 50%, transparent), color-mix(in srgb, #F59E0B 35%, transparent))`,
                border: '2px solid color-mix(in srgb, #F59E0B 60%, transparent)',
                color: '#FFFFFF',
                boxShadow: `0 8px 30px color-mix(in srgb, #F59E0B 30%, transparent)`
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <SpatialIcon Icon={ICONS.Sparkles} size={20} style={{ color: '#FFFFFF' }} />
                <span>Établir mon premier record</span>
              </div>
            </motion.button>
          </div>
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
                  background: isActive ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: isActive ? '#F59E0B' : 'rgba(255, 255, 255, 0.7)',
                  border: isActive ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none'
                }}
              >
                {period === 'week' ? '4 Semaines' : period === 'month' ? '12 Semaines' : '24 Semaines'}
              </button>
            );
          })}
        </div>
      </div>

      {/* View Selector */}
      <div className="flex justify-center">
        <div className="inline-flex gap-2 p-1 rounded-lg" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {[
            { value: 'overview', label: 'Vue Ensemble', icon: ICONS.Trophy },
            { value: 'timeline', label: 'Chronologie', icon: ICONS.Clock },
            { value: 'discipline', label: 'Par Discipline', icon: ICONS.Target }
          ].map(view => {
            const isActive = activeView === view.value;
            return (
              <button
                key={view.value}
                onClick={() => handleViewChange(view.value as RecordsView)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                style={{
                  background: isActive ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: isActive ? '#F59E0B' : 'rgba(255, 255, 255, 0.7)',
                  border: isActive ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none'
                }}
              >
                <SpatialIcon Icon={view.icon} size={16} style={{ color: isActive ? '#F59E0B' : 'rgba(255, 255, 255, 0.7)' }} />
                {view.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Record Opportunities Widget */}
      <RecordOpportunitiesWidget records={progressionData.personalRecords} />

      {/* Main Content Based on Active View */}
      {activeView === 'overview' && (
        <>
          <PersonalRecordsSection records={progressionData.personalRecords} />
          <RecordsProgressionChart records={progressionData.personalRecords} />
          <RecordsHeatmapCalendar records={progressionData.personalRecords} />
        </>
      )}

      {activeView === 'timeline' && (
        <RecordsTimeline records={progressionData.personalRecords} />
      )}

      {activeView === 'discipline' && (
        <RecordsByDisciplineView records={progressionData.personalRecords} />
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
            Consultez l'onglet <strong className="text-blue-300">Progression</strong> pour voir l'évolution complète de votre entraînement
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default TrainingRecordsTab;

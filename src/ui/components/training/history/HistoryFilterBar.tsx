/**
 * HistoryFilterBar Component
 * Filter bar for history tab with period and type selectors
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { HistoryFilterPeriod, HistoryFilterType } from '../../../../domain/trainingToday';

interface HistoryFilterBarProps {
  period: HistoryFilterPeriod;
  type: HistoryFilterType;
  discipline?: string;
  onPeriodChange: (period: HistoryFilterPeriod) => void;
  onTypeChange: (type: HistoryFilterType) => void;
  onDisciplineChange?: (discipline: string) => void;
}

const TRAINING_COLOR = '#18E3FF';

const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
  period,
  type,
  discipline,
  onPeriodChange,
  onTypeChange,
  onDisciplineChange
}) => {
  const periods: { value: HistoryFilterPeriod; label: string }[] = [
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Année' },
    { value: 'all', label: 'Tout' }
  ];

  const types: { value: HistoryFilterType; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'upper', label: 'Upper' },
    { value: 'lower', label: 'Lower' },
    { value: 'push', label: 'Push' },
    { value: 'pull', label: 'Pull' },
    { value: 'legs', label: 'Jambes' },
    { value: 'full_body', label: 'Full Body' }
  ];

  const disciplines = [
    { value: 'all', label: 'Toutes disciplines' },
    { value: 'strength', label: 'Force' },
    { value: 'powerlifting', label: 'Powerlifting' },
    { value: 'bodybuilding', label: 'Bodybuilding' },
    { value: 'functional', label: 'Fonctionnel' },
    { value: 'crossfit', label: 'CrossFit' },
    { value: 'calisthenics', label: 'Calisthenics' },
    { value: 'running', label: 'Course' },
    { value: 'cycling', label: 'Cyclisme' },
    { value: 'swimming', label: 'Natation' },
    { value: 'triathlon', label: 'Triathlon' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard
        className="p-4"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: `1px solid color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent)`
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <SpatialIcon Icon={ICONS.Calendar} size={18} style={{ color: TRAINING_COLOR }} />
            <div className="flex gap-2">
              {periods.map(p => (
                <button
                  key={p.value}
                  onClick={() => onPeriodChange(p.value)}
                  className="px-3 py-1.5 rounded-lg font-medium text-xs transition-all"
                  style={{
                    background: period === p.value
                      ? `color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent)`
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${period === p.value
                      ? `color-mix(in srgb, ${TRAINING_COLOR} 40%, transparent)`
                      : 'rgba(255, 255, 255, 0.1)'}`,
                    color: period === p.value ? TRAINING_COLOR : 'rgba(255, 255, 255, 0.6)'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10" />

          {/* Discipline Filter */}
          {onDisciplineChange && (
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Target} size={18} style={{ color: TRAINING_COLOR }} />
              <select
                value={discipline || 'all'}
                onChange={(e) => onDisciplineChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg font-medium text-xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  minWidth: '140px'
                }}
              >
                {disciplines.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <SpatialIcon Icon={ICONS.Filter} size={18} style={{ color: TRAINING_COLOR }} />
            <select
              value={type}
              onChange={(e) => onTypeChange(e.target.value as HistoryFilterType)}
              className="px-3 py-1.5 rounded-lg font-medium text-xs"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white'
              }}
            >
              {types.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default HistoryFilterBar;

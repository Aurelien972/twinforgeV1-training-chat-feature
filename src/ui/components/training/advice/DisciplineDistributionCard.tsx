/**
 * DisciplineDistributionCard Component
 * Visualizes the distribution of training sessions across different disciplines
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { TrainingInsights, DisciplineBreakdown } from '../../../../system/services/trainingAdviceService';
import { getDisciplineConfig } from '../../../../hooks/useDisciplineAdaptiveContent';

interface DisciplineDistributionCardProps {
  insights: TrainingInsights;
}

const DisciplineDistributionCard: React.FC<DisciplineDistributionCardProps> = ({ insights }) => {
  if (!insights.disciplineBreakdown || insights.disciplineBreakdown.length === 0) {
    return null;
  }

  const breakdown = insights.disciplineBreakdown;
  const totalSessions = breakdown.reduce((sum, d) => sum + d.sessionsCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <SpatialIcon Icon={ICONS.BarChart} size={28} style={{ color: '#18E3FF' }} />
          <div>
            <h3 className="text-xl font-bold text-white">Répartition par discipline</h3>
            <p className="text-white/60 text-sm">Distribution de vos {totalSessions} séances</p>
          </div>
        </div>

        <div className="space-y-4">
          {breakdown.map((discipline, index) => {
            const config = getDisciplineConfig(discipline.disciplineId);
            const percentage = totalSessions > 0 ? (discipline.sessionsCount / totalSessions) * 100 : 0;
            const DisciplineIcon = ICONS[config.icon as keyof typeof ICONS] || ICONS.Target;

            return (
              <motion.div
                key={discipline.disciplineId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: `color-mix(in srgb, ${config.color} 20%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${config.color} 40%, transparent)`
                      }}
                    >
                      <SpatialIcon
                        Icon={DisciplineIcon}
                        size={20}
                        style={{ color: config.color }}
                      />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{config.label}</div>
                      <div className="text-white/60 text-sm">{discipline.sessionsCount} séances</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: config.color }}>
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${config.color} 0%, color-mix(in srgb, ${config.color} 70%, #000) 100%)`,
                      boxShadow: `0 0 12px ${config.color}`
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default DisciplineDistributionCard;

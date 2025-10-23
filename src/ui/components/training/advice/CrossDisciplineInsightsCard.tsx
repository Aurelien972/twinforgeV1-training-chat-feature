/**
 * CrossDisciplineInsightsCard Component
 * Shows comparisons and insights across multiple disciplines
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { TrainingInsights } from '../../../../system/services/trainingAdviceService';
import { getDisciplineConfig } from '../../../../hooks/useDisciplineAdaptiveContent';

interface CrossDisciplineInsightsCardProps {
  insights: TrainingInsights;
}

const CrossDisciplineInsightsCard: React.FC<CrossDisciplineInsightsCardProps> = ({ insights }) => {
  if (!insights.disciplineComparison) {
    return null;
  }

  const comparison = insights.disciplineComparison;

  const getComparisonItem = (label: string, disciplineId: string, icon: keyof typeof ICONS) => {
    const config = getDisciplineConfig(disciplineId);
    const DisciplineIcon = ICONS[config.icon as keyof typeof ICONS] || ICONS.Target;

    return (
      <div
        className="p-4 rounded-lg"
        style={{
          background: `color-mix(in srgb, ${config.color} 8%, transparent)`,
          border: `1px solid color-mix(in srgb, ${config.color} 20%, transparent)`
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: `color-mix(in srgb, ${config.color} 20%, transparent)`,
              border: `1px solid color-mix(in srgb, ${config.color} 40%, transparent)`
            }}
          >
            <SpatialIcon Icon={ICONS[icon]} size={20} style={{ color: config.color }} />
          </div>
          <div className="flex-1">
            <div className="text-xs text-white/60 mb-1">{label}</div>
            <div className="flex items-center gap-2">
              <SpatialIcon
                Icon={DisciplineIcon}
                size={16}
                style={{ color: config.color }}
              />
              <span className="text-white font-semibold">{config.label}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <SpatialIcon Icon={ICONS.GitCompare} size={28} style={{ color: '#18E3FF' }} />
          <div>
            <h3 className="text-xl font-bold text-white">Analyse comparative</h3>
            <p className="text-white/60 text-sm">Votre pratique multi-disciplines</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getComparisonItem('Plus active', comparison.mostActive, 'TrendingUp')}
          {getComparisonItem('Plus intense', comparison.mostIntense, 'Zap')}
          {getComparisonItem('Plus régulière', comparison.bestConsistency, 'Calendar')}
        </div>

        {comparison.recommendations && comparison.recommendations.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <SpatialIcon Icon={ICONS.Lightbulb} size={20} style={{ color: '#F59E0B' }} />
              <h4 className="text-white font-semibold">Recommandations cross-training</h4>
            </div>
            {comparison.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <SpatialIcon
                  Icon={ICONS.CheckCircle}
                  size={18}
                  style={{ color: '#22C55E', marginTop: '2px' }}
                />
                <p className="text-white/80 text-sm leading-relaxed flex-1">{rec}</p>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default CrossDisciplineInsightsCard;

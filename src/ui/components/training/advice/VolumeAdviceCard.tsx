/**
 * VolumeAdviceCard Component
 * Dedicated component for training volume advice and recommendations
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { TrainingInsights, ProgressionTrend } from '../../../../system/services/trainingAdviceService';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

interface VolumeAdviceCardProps {
  insights: TrainingInsights;
}

const DEFAULT_COLOR = TRAINING_COLORS.progress;

const VolumeAdviceCard: React.FC<VolumeAdviceCardProps> = ({ insights }) => {
  const volumeTrend = insights.progressionTrends.volume;
  const DISCIPLINE_COLOR = DEFAULT_COLOR;

  const getTrendConfig = (trend: ProgressionTrend['trend']) => {
    switch (trend) {
      case 'increasing':
        return {
          icon: 'TrendingUp' as keyof typeof ICONS,
          color: '#22C55E',
          label: 'En Augmentation',
          badge: 'Croissance',
          description: 'Votre volume d\'entraînement est en progression constante.'
        };
      case 'decreasing':
        return {
          icon: 'TrendingDown' as keyof typeof ICONS,
          color: '#EF4444',
          label: 'En Diminution',
          badge: 'Décroissance',
          description: 'Votre volume d\'entraînement a diminué récemment.'
        };
      default:
        return {
          icon: 'Minus' as keyof typeof ICONS,
          color: DEFAULT_COLOR,
          label: 'Stable',
          badge: 'Stabilité',
          description: 'Votre volume d\'entraînement est stable.'
        };
    }
  };

  const getVolumeRecommendations = () => {
    const recs: Array<{ title: string; description: string; icon: keyof typeof ICONS; priority: 'high' | 'medium' | 'low' }> = [];

    if (volumeTrend.trend === 'increasing') {
      recs.push({
        title: 'Volume en progression',
        description: volumeTrend.comment || 'Votre volume d\'entraînement augmente progressivement. Continuez sur cette voie.',
        icon: 'TrendingUp',
        priority: 'high'
      });
    } else if (volumeTrend.trend === 'decreasing') {
      recs.push({
        title: 'Volume en baisse',
        description: volumeTrend.comment || 'Votre volume d\'entraînement diminue. Pensez à augmenter progressivement.',
        icon: 'TrendingDown',
        priority: 'high'
      });
    } else {
      recs.push({
        title: 'Volume stable',
        description: volumeTrend.comment || 'Votre volume d\'entraînement est stable. Maintenez cette régularité.',
        icon: 'Minus',
        priority: 'medium'
      });
    }

    return recs;
  };

  const trendConfig = getTrendConfig(volumeTrend.trend);
  const recommendations = getVolumeRecommendations();
  const TrendIcon = ICONS[trendConfig.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${DISCIPLINE_COLOR} 10%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.05)
          `,
          border: `2px solid color-mix(in srgb, ${DISCIPLINE_COLOR} 25%, transparent)`
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${DISCIPLINE_COLOR} 30%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.15)
              `,
              border: `2px solid color-mix(in srgb, ${DISCIPLINE_COLOR} 40%, transparent)`,
              boxShadow: `0 4px 16px color-mix(in srgb, ${DISCIPLINE_COLOR} 25%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={ICONS.TrendingUp}
              size={28}
              style={{
                color: DISCIPLINE_COLOR,
                filter: `drop-shadow(0 0 8px ${DISCIPLINE_COLOR})`
              }}
            />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              Évolution du Volume
            </h3>
            <p className="text-white/60 text-sm">
              Analyse de votre charge de travail totale
            </p>
          </div>

          <div
            className="px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{
              background: `color-mix(in srgb, ${trendConfig.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${trendConfig.color} 30%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={TrendIcon}
              size={16}
              style={{ color: trendConfig.color }}
            />
            <span className="text-sm font-semibold" style={{ color: trendConfig.color }}>
              {trendConfig.badge}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div
            className="p-4 rounded-xl"
            style={{
              background: `color-mix(in srgb, ${DISCIPLINE_COLOR} 8%, transparent)`,
              border: `1px solid color-mix(in srgb, ${DISCIPLINE_COLOR} 20%, transparent)`
            }}
          >
            <div className="flex items-start gap-3">
              <SpatialIcon
                Icon={ICONS.Info}
                size={20}
                style={{ color: DISCIPLINE_COLOR, marginTop: '2px' }}
              />
              <div>
                <div className="text-sm font-semibold mb-1" style={{ color: DISCIPLINE_COLOR }}>
                  Tendance actuelle
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {trendConfig.description} {volumeTrend.comment}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <div className="text-sm font-semibold text-white/90 mb-3">
            Recommandations
          </div>

          {recommendations.map((rec, index) => {
            const Icon = ICONS[rec.icon];
            const priorityColor = rec.priority === 'high' ? '#EF4444' : rec.priority === 'medium' ? '#F59E0B' : DISCIPLINE_COLOR;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${DISCIPLINE_COLOR} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${DISCIPLINE_COLOR} 25%, transparent)`
                  }}
                >
                  <SpatialIcon
                    Icon={Icon}
                    size={18}
                    style={{ color: DISCIPLINE_COLOR }}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-white text-sm">
                      {rec.title}
                    </div>
                    {rec.priority === 'high' && (
                      <div
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: `color-mix(in srgb, ${priorityColor} 15%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${priorityColor} 25%, transparent)`,
                          color: priorityColor
                        }}
                      >
                        Important
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {volumeTrend.percentage !== undefined && (
          <div className="mt-6">
            <div
              className="p-4 rounded-lg"
              style={{
                background: `color-mix(in srgb, ${DISCIPLINE_COLOR} 8%, transparent)`,
                border: `1px solid color-mix(in srgb, ${DISCIPLINE_COLOR} 15%, transparent)`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/80">
                  Variation du volume
                </span>
                <span className="text-lg font-bold" style={{ color: trendConfig.color }}>
                  {volumeTrend.trend === 'increasing' ? '+' : volumeTrend.trend === 'decreasing' ? '-' : ''}
                  {Math.abs(volumeTrend.percentage || 0)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: trendConfig.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.abs(volumeTrend.percentage || 0)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default VolumeAdviceCard;

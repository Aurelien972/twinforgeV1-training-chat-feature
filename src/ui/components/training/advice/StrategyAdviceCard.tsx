/**
 * StrategyAdviceCard Component
 * Dedicated component for training strategy and next week planning
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { TrainingInsights, NextWeekFocus } from '../../../../system/services/trainingAdviceService';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

interface StrategyAdviceCardProps {
  insights: TrainingInsights;
}

const DEFAULT_COLOR = TRAINING_COLORS.strategy;

const StrategyAdviceCard: React.FC<StrategyAdviceCardProps> = ({ insights }) => {
  const nextWeek = insights.nextWeekFocus;
  const DISCIPLINE_COLOR = DEFAULT_COLOR;

  if (!nextWeek) return null;

  const getIntensityColor = (type: 'light' | 'moderate' | 'intense') => {
    switch (type) {
      case 'light': return '#22C55E';
      case 'moderate': return '#F59E0B';
      case 'intense': return '#EF4444';
    }
  };

  const getIntensityLabel = (type: 'light' | 'moderate' | 'intense') => {
    switch (type) {
      case 'light': return 'Légère';
      case 'moderate': return 'Modérée';
      case 'intense': return 'Intense';
    }
  };

  const totalIntensitySessions = nextWeek.intensityDistribution.light +
                                  nextWeek.intensityDistribution.moderate +
                                  nextWeek.intensityDistribution.intense;

  const getWorkloadAssessment = () => {
    const ratio = nextWeek.suggestedSessions / (7 - nextWeek.restDaysRecommended);

    if (ratio > 1) {
      return {
        level: 'Charge Élevée',
        color: '#F59E0B',
        icon: 'TrendingUp' as keyof typeof ICONS,
        description: 'Semaine intense prévue. Assurez-vous d\'être bien reposé.'
      };
    } else if (ratio < 0.7) {
      return {
        level: 'Charge Légère',
        color: '#22C55E',
        icon: 'Droplet' as keyof typeof ICONS,
        description: 'Semaine de récupération ou deload recommandée.'
      };
    }

    return {
      level: 'Charge Équilibrée',
      color: DISCIPLINE_COLOR,
      icon: 'Activity' as keyof typeof ICONS,
      description: 'Volume optimal pour progresser en toute sécurité.'
    };
  };

  const workload = getWorkloadAssessment();
  const WorkloadIcon = ICONS[workload.icon];

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
              Icon={ICONS.Brain}
              size={28}
              style={{
                color: DISCIPLINE_COLOR,
                filter: `drop-shadow(0 0 8px ${DISCIPLINE_COLOR})`
              }}
            />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              Stratégie d'Entraînement
            </h3>
            <p className="text-white/60 text-sm">
              Plan pour la semaine prochaine
            </p>
          </div>

          <div
            className="px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{
              background: `color-mix(in srgb, ${workload.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${workload.color} 30%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={WorkloadIcon}
              size={16}
              style={{ color: workload.color }}
            />
            <span className="text-sm font-semibold" style={{ color: workload.color }}>
              {workload.level}
            </span>
          </div>
        </div>

        <div
          className="p-5 rounded-xl mt-4"
          style={{
            background: `color-mix(in srgb, ${DISCIPLINE_COLOR} 8%, transparent)`,
            border: `2px solid color-mix(in srgb, ${DISCIPLINE_COLOR} 20%, transparent)`
          }}
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div
                className="text-4xl font-bold mb-1"
                style={{ color: DISCIPLINE_COLOR }}
              >
                {nextWeek.suggestedSessions}
              </div>
              <div className="text-xs text-white/60">Séances recommandées</div>
            </div>
            <div className="text-center">
              <div
                className="text-4xl font-bold mb-1"
                style={{ color: '#22C55E' }}
              >
                {nextWeek.restDaysRecommended}
              </div>
              <div className="text-xs text-white/60">Jours de repos</div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t border-white/10">
            <SpatialIcon
              Icon={ICONS.Info}
              size={18}
              style={{ color: DISCIPLINE_COLOR, marginTop: '2px' }}
            />
            <p className="text-sm text-white/80 leading-relaxed">
              {workload.description}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <div className="text-sm font-semibold text-white/90 mb-3">
            Distribution de l'intensité
          </div>

          <div className="space-y-3">
            {(['intense', 'moderate', 'light'] as const).map((type) => {
              const count = nextWeek.intensityDistribution[type];
              if (count === 0) return null;

              const color = getIntensityColor(type);
              const label = getIntensityLabel(type);
              const percentage = totalIntensitySessions > 0 ? (count / totalIntensitySessions) * 100 : 0;

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: color,
                          boxShadow: `0 0 8px ${color}`
                        }}
                      />
                      <span className="text-sm text-white/80">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {count} {count === 1 ? 'séance' : 'séances'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {nextWeek.focusAreas && nextWeek.focusAreas.length > 0 && (
          <div className="pt-2">
            <div className="text-sm font-semibold text-white/90 mb-3">
              Zones de focus prioritaires
            </div>

            <div className="grid grid-cols-1 gap-2">
              {nextWeek.focusAreas.slice(0, 4).map((area, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `color-mix(in srgb, ${DISCIPLINE_COLOR} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${DISCIPLINE_COLOR} 25%, transparent)`
                    }}
                  >
                    <span className="text-sm font-bold" style={{ color: DISCIPLINE_COLOR }}>
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm text-white/90">{area}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {insights.weakPoints && insights.weakPoints.length > 0 && (
          <div className="pt-2">
            <div className="text-sm font-semibold text-white/90 mb-3">
              Points techniques à améliorer
            </div>

            <div className="space-y-3">
              {insights.weakPoints.slice(0, 2).map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="p-3 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${DISCIPLINE_COLOR} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${DISCIPLINE_COLOR} 25%, transparent)`
                      }}
                    >
                      <SpatialIcon
                        Icon={ICONS.AlertCircle}
                        size={16}
                        style={{ color: '#F59E0B' }}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className="px-2 py-0.5 rounded text-xs font-medium mb-2 inline-block"
                        style={{
                          background: `color-mix(in srgb, ${DISCIPLINE_COLOR} 15%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${DISCIPLINE_COLOR} 25%, transparent)`,
                          color: DISCIPLINE_COLOR
                        }}
                      >
                        {point.exercise}
                      </div>
                      <p className="text-sm text-white/70 mb-2">{point.issue}</p>
                      <div
                        className="p-2 rounded text-xs"
                        style={{
                          background: `color-mix(in srgb, ${DISCIPLINE_COLOR} 8%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${DISCIPLINE_COLOR} 15%, transparent)`,
                          color: 'rgba(255, 255, 255, 0.8)'
                        }}
                      >
                        <strong style={{ color: DISCIPLINE_COLOR }}>Conseil:</strong> {point.recommendation}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div
          className="p-4 rounded-lg mt-2"
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}
        >
          <div className="flex items-start gap-2">
            <SpatialIcon Icon={ICONS.CheckCircle} size={18} style={{ color: '#22C55E', marginTop: '1px' }} />
            <div>
              <div className="text-xs font-semibold text-white/90 mb-1">
                Conseil stratégique
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Planifiez vos séances en début de semaine pour maintenir votre engagement.
                Répartissez les jours de repos de manière équilibrée pour optimiser la récupération.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default StrategyAdviceCard;

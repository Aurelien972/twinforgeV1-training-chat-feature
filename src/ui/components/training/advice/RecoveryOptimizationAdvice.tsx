/**
 * RecoveryOptimizationAdvice Component
 * Specific recovery-focused advice based on detected patterns
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { TrainingInsights, Imbalance } from '../../../../system/services/trainingAdviceService';
interface RecoveryOptimizationAdviceProps {
  insights: TrainingInsights;
}

const DEFAULT_COLOR = '#18E3FF';

const RecoveryOptimizationAdvice: React.FC<RecoveryOptimizationAdviceProps> = ({ insights }) => {
  const DISCIPLINE_COLOR = DEFAULT_COLOR;
  const getRecoveryStatus = () => {
    const { intensity, consistency } = insights.progressionTrends;
    const avgRPE = intensity?.avgRPE || 7;
    const consistencyPct = consistency?.percentage || 0;

    if (avgRPE >= 8.5 && consistencyPct >= 80) {
      return {
        status: 'critical',
        level: 'Risque de Surmenage',
        color: '#EF4444',
        icon: 'AlertTriangle' as keyof typeof ICONS,
        recommendation: 'Planifiez une semaine de deload immédiatement'
      };
    }

    if (avgRPE >= 8 && consistencyPct >= 75) {
      return {
        status: 'warning',
        level: 'Fatigue Accumulée',
        color: '#F59E0B',
        icon: 'AlertCircle' as keyof typeof ICONS,
        recommendation: 'Réduire l\'intensité de 15-20% cette semaine'
      };
    }

    if (avgRPE < 6.5 && consistencyPct < 60) {
      return {
        status: 'underload',
        level: 'Sous-Stimulation',
        color: '#18E3FF',
        icon: 'TrendingUp' as keyof typeof ICONS,
        recommendation: 'Vous pouvez augmenter progressivement la charge'
      };
    }

    return {
      status: 'optimal',
      level: 'Récupération Optimale',
      color: '#22C55E',
      icon: 'CheckCircle' as keyof typeof ICONS,
      recommendation: 'Maintenez cette balance charge-récupération'
    };
  };

  const getRecoveryRecommendations = () => {
    const recs: Array<{ title: string; description: string; icon: keyof typeof ICONS }> = [];
    const recoveryStatus = getRecoveryStatus();

    if (recoveryStatus.status === 'critical' || recoveryStatus.status === 'warning') {
      recs.push({
        title: 'Jours de Repos Actifs',
        description: 'Intégrez 2-3 jours de repos actif avec mobilité légère',
        icon: 'Moon'
      });

      recs.push({
        title: 'Qualité de Sommeil',
        description: 'Visez 8h de sommeil pour optimiser la récupération musculaire',
        icon: 'Moon'
      });
    }

    if (insights.imbalances && insights.imbalances.length > 0) {
      const recoveryImbalance = insights.imbalances.find(i =>
        i.description.toLowerCase().includes('récupération') ||
        i.description.toLowerCase().includes('repos')
      );

      if (recoveryImbalance) {
        recs.push({
          title: 'Pattern de Récupération',
          description: recoveryImbalance.description,
          icon: 'Activity'
        });
      }
    }

    if (insights.nextWeekFocus) {
      const { restDaysRecommended } = insights.nextWeekFocus;
      recs.push({
        title: 'Repos Planifiés',
        description: `${restDaysRecommended} jours de repos complet recommandés la semaine prochaine`,
        icon: 'Calendar'
      });
    }

    return recs.slice(0, 3);
  };

  const recoveryStatus = getRecoveryStatus();
  const recommendations = getRecoveryRecommendations();
  const StatusIcon = ICONS[recoveryStatus.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
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
              Icon={ICONS.Heart}
              size={28}
              style={{
                color: DISCIPLINE_COLOR,
                filter: `drop-shadow(0 0 8px ${DISCIPLINE_COLOR})`
              }}
            />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              Récupération
            </h3>
            <p className="text-white/60 text-sm">
              État et recommandations
            </p>
          </div>

          <div
            className="px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{
              background: `color-mix(in srgb, ${recoveryStatus.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${recoveryStatus.color} 30%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={StatusIcon}
              size={16}
              style={{ color: recoveryStatus.color }}
            />
            <span className="text-sm font-semibold" style={{ color: recoveryStatus.color }}>
              {recoveryStatus.level}
            </span>
          </div>
        </div>

        <div
          className="p-4 rounded-xl mt-2 mb-2"
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
                Recommandation principale
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                {recoveryStatus.recommendation}
              </p>
            </div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-white/90 mb-3">
              Actions Recommandées
            </div>

            {recommendations.map((rec, index) => {
              const Icon = ICONS[rec.icon];

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
                    <div className="font-medium text-white text-sm mb-1">
                      {rec.title}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {insights.imbalances && insights.imbalances.length > 0 && (
          <div
            className="p-4 rounded-lg mt-3"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.Info} size={16} style={{ color: '#EF4444' }} />
              <span className="text-xs font-semibold text-white/90">
                Points d'Attention
              </span>
            </div>
            <div className="space-y-1">
              {insights.imbalances.slice(0, 2).map((imbalance, index) => (
                <p key={index} className="text-xs text-white/70">
                  • {imbalance.description}
                </p>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default RecoveryOptimizationAdvice;

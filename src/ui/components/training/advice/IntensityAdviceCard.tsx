/**
 * IntensityAdviceCard Component
 * Dedicated component for training intensity advice and RPE analysis
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { TrainingInsights } from '../../../../system/services/trainingAdviceService';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

interface IntensityAdviceCardProps {
  insights: TrainingInsights;
}

const DEFAULT_COLOR = TRAINING_COLORS.intensity;

const IntensityAdviceCard: React.FC<IntensityAdviceCardProps> = ({ insights }) => {
  const intensityTrend = insights.progressionTrends.intensity;
  const avgRPE = intensityTrend.avgRPE || 7;
  const DISCIPLINE_COLOR = DEFAULT_COLOR;

  const getIntensityLevel = (rpe: number) => {
    if (rpe >= 9) return { level: 'Très Intense', color: '#EF4444', status: 'critical' };
    if (rpe >= 8) return { level: 'Intense', color: '#F59E0B', status: 'warning' };
    if (rpe >= 7) return { level: 'Modéré-Élevé', color: DISCIPLINE_COLOR, status: 'optimal' };
    if (rpe >= 6) return { level: 'Modéré', color: '#22C55E', status: 'good' };
    if (rpe >= 5) return { level: 'Léger', color: '#22C55E', status: 'light' };
    return { level: 'Très Léger', color: '#94A3B8', status: 'too-light' };
  };

  const getTrendIcon = (trend: string): keyof typeof ICONS => {
    if (trend === 'increasing') return 'TrendingUp';
    if (trend === 'decreasing') return 'TrendingDown';
    return 'Minus';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'increasing') return '#F59E0B';
    if (trend === 'decreasing') return '#22C55E';
    return DISCIPLINE_COLOR;
  };

  const getIntensityRecommendations = () => {
    const recs: Array<{ title: string; description: string; icon: keyof typeof ICONS }> = [];

    if (avgRPE >= 9) {
      recs.push({
        title: 'Réduire l\'intensité immédiatement',
        description: 'RPE trop élevé. Risque de surmenage et blessure. Diminuez de 20-25%.',
        icon: 'AlertTriangle'
      });
      recs.push({
        title: 'Planifier une semaine de deload',
        description: 'Intégrez une semaine de récupération active à 60-70% de votre intensité habituelle',
        icon: 'Moon'
      });
    } else if (avgRPE >= 8) {
      recs.push({
        title: 'Moduler l\'intensité',
        description: 'Alternez entre séances intenses et légères pour optimiser la récupération',
        icon: 'Activity'
      });
      recs.push({
        title: 'Surveiller les signes de fatigue',
        description: 'Soyez attentif aux signaux de surmenage (sommeil, appétit, motivation)',
        icon: 'Eye'
      });
    } else if (avgRPE >= 6.5) {
      recs.push({
        title: 'Zone optimale',
        description: 'Votre intensité est dans la zone idéale pour progresser durablement',
        icon: 'CheckCircle'
      });
      recs.push({
        title: 'Maintenir la constance',
        description: 'Gardez cette intensité en ajustant le volume progressivement',
        icon: 'Target'
      });
    } else if (avgRPE >= 5) {
      recs.push({
        title: 'Augmenter progressivement',
        description: 'Vous pouvez augmenter l\'intensité de 5-10% pour stimuler davantage',
        icon: 'TrendingUp'
      });
      recs.push({
        title: 'Intégrer des pics d\'intensité',
        description: 'Ajoutez 1-2 séances plus intenses par semaine (RPE 7-8)',
        icon: 'Zap'
      });
    } else {
      recs.push({
        title: 'Intensité insuffisante',
        description: 'Pour progresser, visez un RPE moyen de 6-7 avec des pics à 8-9',
        icon: 'AlertCircle'
      });
      recs.push({
        title: 'Revoir la programmation',
        description: 'Augmentez graduellement la charge, le tempo ou réduisez les temps de repos',
        icon: 'RefreshCw'
      });
    }

    return recs.slice(0, 3);
  };

  const intensityLevel = getIntensityLevel(avgRPE);
  const recommendations = getIntensityRecommendations();
  const TrendIcon = ICONS[getTrendIcon(intensityTrend.trend)];
  const trendColor = getTrendColor(intensityTrend.trend);

  const getRPEDescription = (rpe: number) => {
    if (rpe >= 9) return 'Effort maximal ou quasi-maximal';
    if (rpe >= 8) return 'Très difficile, conversation impossible';
    if (rpe >= 7) return 'Difficile, conversation limitée';
    if (rpe >= 6) return 'Modérément difficile, conversation possible';
    if (rpe >= 5) return 'Légèrement difficile, confortable';
    return 'Très facile, échauffement';
  };

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
              Icon={ICONS.Zap}
              size={28}
              style={{
                color: DISCIPLINE_COLOR,
                filter: `drop-shadow(0 0 8px ${DISCIPLINE_COLOR})`
              }}
            />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              Intensité Moyenne
            </h3>
            <p className="text-white/60 text-sm">
              Analyse de votre effort perçu (RPE)
            </p>
          </div>

          <div
            className="px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{
              background: `color-mix(in srgb, ${trendColor} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${trendColor} 30%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={TrendIcon}
              size={16}
              style={{ color: trendColor }}
            />
            <span className="text-sm font-semibold" style={{ color: trendColor }}>
              {intensityTrend.trend === 'increasing' ? 'Hausse' : intensityTrend.trend === 'decreasing' ? 'Baisse' : 'Stable'}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div
            className="p-5 rounded-xl"
            style={{
              background: `color-mix(in srgb, ${intensityLevel.color} 8%, transparent)`,
              border: `2px solid color-mix(in srgb, ${intensityLevel.color} 20%, transparent)`
            }}
          >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-semibold text-white/60 mb-1">
                RPE Moyen
              </div>
              <div className="text-4xl font-bold" style={{ color: intensityLevel.color }}>
                {avgRPE.toFixed(1)}
                <span className="text-lg text-white/50 ml-1">/10</span>
              </div>
            </div>
            <div
              className="px-4 py-2 rounded-lg"
              style={{
                background: `color-mix(in srgb, ${intensityLevel.color} 15%, transparent)`,
                border: `1px solid color-mix(in srgb, ${intensityLevel.color} 30%, transparent)`
              }}
            >
              <div className="text-center">
                <div className="text-xs text-white/60 mb-0.5">Niveau</div>
                <div className="text-sm font-bold" style={{ color: intensityLevel.color }}>
                  {intensityLevel.level}
                </div>
              </div>
            </div>
          </div>

          <div className="h-3 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${intensityLevel.color} 0%, ${intensityLevel.color}CC 100%)`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(avgRPE / 10) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          <p className="text-xs text-white/70 leading-relaxed">
            {getRPEDescription(avgRPE)}
          </p>
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
                  Analyse de la tendance
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {intensityTrend.comment}
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

        <div className="mt-6">
          <div
            className="p-4 rounded-lg"
            style={{
              background: 'rgba(24, 227, 255, 0.08)',
              border: '1px solid rgba(24, 227, 255, 0.2)'
            }}
          >
          <div className="flex items-center gap-2">
            <SpatialIcon Icon={ICONS.Lightbulb} size={16} style={{ color: DISCIPLINE_COLOR }} />
            <p className="text-xs text-white/80">
              <span className="font-semibold">Échelle RPE:</span> 1-3 Très léger • 4-6 Modéré • 7-8 Difficile • 9-10 Maximal
            </p>
          </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default IntensityAdviceCard;

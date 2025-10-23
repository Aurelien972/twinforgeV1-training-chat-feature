/**
 * WeeklyCoachingInsightsGrid Component
 * Grid display of 3-4 key coaching insights from AI analysis
 * Focus on actionable feedback without progression/records data
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { TrainingInsights } from '../../../../system/services/trainingAdviceService';
import { getDisciplineConfig } from '../../../../hooks/useDisciplineAdaptiveContent';

interface WeeklyCoachingInsightsGridProps {
  insights: TrainingInsights;
}

const CARD_COLORS = {
  consistency: '#A855F7',
  intensity: '#EF4444',
  imbalances: '#D97706',
  technique: '#22C55E',
  nextweek: '#18E3FF'
};

interface InsightCard {
  id: string;
  icon: keyof typeof ICONS;
  color: string;
  title: string;
  value: string;
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

const WeeklyCoachingInsightsGrid: React.FC<WeeklyCoachingInsightsGridProps> = ({ insights }) => {
  const getInsightCards = (): InsightCard[] => {
    const cards: InsightCard[] = [];

    if (insights.progressionTrends.consistency) {
      cards.push({
        id: 'consistency',
        icon: 'Calendar',
        color: CARD_COLORS.consistency,
        title: 'Régularité',
        value: `${insights.progressionTrends.consistency.percentage}%`,
        description: insights.progressionTrends.consistency.comment,
        trend: insights.progressionTrends.consistency.percentage >= 75 ? 'up' : 'stable'
      });
    }

    if (insights.progressionTrends.intensity) {
      const rpe = insights.progressionTrends.intensity.avgRPE ?? 7;
      let intensityLevel = 'Équilibré';

      if (rpe >= 8.5) {
        intensityLevel = 'Très Élevé';
      } else if (rpe >= 7.5) {
        intensityLevel = 'Élevé';
      } else if (rpe < 6) {
        intensityLevel = 'Léger';
      }

      cards.push({
        id: 'intensity',
        icon: 'Zap',
        color: CARD_COLORS.intensity,
        title: 'Intensité Moyenne',
        value: `${rpe.toFixed(1)} RPE`,
        description: `Niveau ${intensityLevel}. ${insights.progressionTrends.intensity.comment}`,
        trend: insights.progressionTrends.intensity.trend === 'increasing' ? 'up' :
               insights.progressionTrends.intensity.trend === 'decreasing' ? 'down' : 'stable'
      });
    }

    if (insights.imbalances && insights.imbalances.length > 0) {
      const criticalImbalances = insights.imbalances.filter(i => i.severity === 'high' || i.severity === 'medium');
      const imbalanceCount = criticalImbalances.length;

      if (imbalanceCount > 0) {
        cards.push({
          id: 'imbalances',
          icon: 'AlertTriangle',
          color: imbalanceCount > 2 ? '#EF4444' : CARD_COLORS.imbalances,
          title: 'Déséquilibres Détectés',
          value: `${imbalanceCount}`,
          description: criticalImbalances[0]?.description || 'Points d\'attention identifiés',
          trend: 'down'
        });
      }
    }

    if (insights.weakPoints && insights.weakPoints.length > 0) {
      const technicalIssuesCount = insights.weakPoints.length;
      cards.push({
        id: 'technique',
        icon: 'Target',
        color: CARD_COLORS.technique,
        title: 'Points Techniques',
        value: `${technicalIssuesCount}`,
        description: technicalIssuesCount === 1 ? 'Axe d\'amélioration identifié' : 'Axes d\'amélioration identifiés',
        trend: 'stable'
      });
    }

    if (insights.nextWeekFocus) {
      const { suggestedSessions, restDaysRecommended } = insights.nextWeekFocus;
      const ratio = suggestedSessions / (7 - restDaysRecommended);
      let workloadLevel = 'Équilibré';
      let workloadColor = CARD_COLORS.nextweek;

      if (ratio > 1) {
        workloadLevel = 'Intense';
        workloadColor = '#F59E0B';
      } else if (ratio < 0.7) {
        workloadLevel = 'Léger';
        workloadColor = '#22C55E';
      }

      cards.push({
        id: 'nextweek',
        icon: 'Calendar',
        color: workloadColor,
        title: 'Semaine Prochaine',
        value: `${suggestedSessions} séances`,
        description: `${restDaysRecommended} jours de repos. Charge ${workloadLevel}.`,
        trend: 'stable'
      });
    }

    return cards.slice(0, 3);
  };

  const insightCards = getInsightCards();

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return ICONS.TrendingUp;
    if (trend === 'down') return ICONS.TrendingDown;
    return ICONS.Minus;
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return '#22C55E';
    if (trend === 'down') return '#EF4444';
    return '#94A3B8';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {insightCards.map((card, index) => {
        const TrendIcon = getTrendIcon(card.trend);
        const trendColor = getTrendColor(card.trend);

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
          >
            <GlassCard
              className="p-5 h-full"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${card.color} 10%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.05)
                `,
                border: `2px solid color-mix(in srgb, ${card.color} 20%, transparent)`
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <GlowIcon
                  icon={card.icon}
                  color={card.color}
                  size="small"
                  glowIntensity={35}
                />

                {card.trend && (
                  <div
                    className="p-1.5 rounded-lg"
                    style={{
                      background: `color-mix(in srgb, ${trendColor} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${trendColor} 25%, transparent)`
                    }}
                  >
                    <SpatialIcon
                      Icon={TrendIcon}
                      size={16}
                      style={{ color: trendColor }}
                    />
                  </div>
                )}
              </div>

              <div className="mb-2">
                <div className="text-xs font-medium text-white/60 mb-1">
                  {card.title}
                </div>
                <div
                  className="text-3xl font-bold mb-2"
                  style={{ color: card.color }}
                >
                  {card.value}
                </div>
              </div>

              <p className="text-sm text-white/70 leading-relaxed">
                {card.description}
              </p>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
};

export default WeeklyCoachingInsightsGrid;

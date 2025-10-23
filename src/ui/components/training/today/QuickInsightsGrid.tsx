/**
 * QuickInsightsGrid Component
 * Grid of 4 key metrics for quick insights
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { trainingTodayService } from '../../../../system/services/trainingTodayService';
import type { QuickInsights } from '../../../../domain/trainingToday';

const TRAINING_COLOR = '#18E3FF';

const QuickInsightsGrid: React.FC = () => {
  const [insights, setInsights] = useState<QuickInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const insightsData = await trainingTodayService.getQuickInsights();
        setInsights(insightsData);
      } catch (error) {
        console.error('Error loading quick insights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, []);

  if (loading || !insights) {
    return (
      <div className="grid grid-cols-2 gap-3" style={{ minHeight: '200px' }}>
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="p-4">
            <div className="text-white/40 text-center">...</div>
          </GlassCard>
        ))}
      </div>
    );
  }

  const getRpeColor = (rpe: number): string => {
    if (rpe >= 7 && rpe <= 8.5) return '#22C55E';
    if (rpe < 6 || rpe > 9) return '#EF4444';
    return '#F59E0B';
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h${mins > 0 ? mins : ''}`;
    return `${mins}min`;
  };

  const metrics = [
    {
      icon: ICONS.Flame,
      value: insights.streak,
      label: 'Jours de suite',
      color: insights.streak >= 7 ? '#22C55E' : insights.streak >= 3 ? TRAINING_COLOR : '#F59E0B',
      badge: insights.streak >= 7 ? '🔥' : null
    },
    {
      icon: ICONS.Dumbbell,
      value: insights.sessionsThisMonth,
      label: 'Séances ce mois',
      color: TRAINING_COLOR,
      badge: insights.comparisons.sessionsVsLastMonth > 0
        ? `+${insights.comparisons.sessionsVsLastMonth}`
        : null
    },
    {
      icon: ICONS.Activity,
      value: insights.rpeAverage7d.toFixed(1),
      label: 'RPE moyen 7j',
      color: getRpeColor(insights.rpeAverage7d),
      badge: null
    },
    {
      icon: ICONS.Clock,
      value: formatTime(insights.totalTimeThisMonth),
      label: 'Temps total mois',
      color: TRAINING_COLOR,
      badge: insights.comparisons.timeVsGoal ? `${insights.comparisons.timeVsGoal}%` : null
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.5 + index * 0.05,
              duration: 0.3,
              type: 'spring',
              stiffness: 200
            }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <GlassCard
              className="p-4 text-center space-y-2 relative overflow-hidden"
              style={{
                background: `
                  radial-gradient(circle at 50% 20%, color-mix(in srgb, ${metric.color} 15%, transparent) 0%, transparent 60%),
                  radial-gradient(circle at 50% 100%, color-mix(in srgb, ${metric.color} 8%, transparent) 0%, transparent 50%),
                  rgba(255, 255, 255, 0.05)
                `,
                border: `1px solid color-mix(in srgb, ${metric.color} 30%, transparent)`,
                boxShadow: `
                  0 4px 16px rgba(0, 0, 0, 0.3),
                  0 0 24px color-mix(in srgb, ${metric.color} 15%, transparent),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `
              }}
            >
              {/* Badge */}
              {metric.badge && (
                <div
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%),
                      color-mix(in srgb, ${metric.color} 25%, transparent)
                    `,
                    border: `1px solid color-mix(in srgb, ${metric.color} 50%, transparent)`,
                    color: metric.color,
                    boxShadow: `
                      0 0 12px color-mix(in srgb, ${metric.color} 40%, transparent),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2)
                    `,
                    textShadow: `0 0 10px ${metric.color}60`
                  }}
                >
                  {metric.badge}
                </div>
              )}

              {/* Icon with Enhanced Glow */}
              <div className="flex justify-center mb-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 60%),
                      radial-gradient(circle at 50% 50%, color-mix(in srgb, ${metric.color} 40%, transparent) 0%, transparent 70%)
                    `,
                    border: `2px solid color-mix(in srgb, ${metric.color} 60%, transparent)`,
                    boxShadow: `
                      0 0 20px color-mix(in srgb, ${metric.color} 50%, transparent),
                      0 0 40px color-mix(in srgb, ${metric.color} 30%, transparent),
                      inset 0 0 20px color-mix(in srgb, ${metric.color} 20%, transparent)
                    `
                  }}
                >
                  <SpatialIcon
                    Icon={metric.icon}
                    size={24}
                    style={{
                      color: metric.color,
                      filter: `
                        drop-shadow(0 0 6px ${metric.color})
                        drop-shadow(0 0 12px color-mix(in srgb, ${metric.color} 70%, transparent))
                      `
                    }}
                  />
                </div>
              </div>

              {/* Value */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.6 + index * 0.05,
                  type: 'spring',
                  stiffness: 300
                }}
                className="text-3xl font-bold"
                style={{
                  color: metric.color,
                  textShadow: `
                    0 0 20px ${metric.color}80,
                    0 0 40px ${metric.color}40,
                    0 2px 8px rgba(0, 0, 0, 0.5)
                  `
                }}
              >
                {metric.value}
              </motion.div>

              {/* Label */}
              <div className="text-xs text-white/60 font-medium">
                {metric.label}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickInsightsGrid;

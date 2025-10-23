/**
 * ProgressionTrendChart Component
 * Visual chart showing RPE, volume and intensity trends over 8 weeks
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import GlowIcon from '../../GlowIcon';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { trainingTodayService } from '../../../../../system/services/trainingTodayService';
import type { ProgressionTrend } from '../../../../../domain/trainingToday';

const TRAINING_COLOR = '#18E3FF';

const ProgressionTrendChart: React.FC = () => {
  const [trends, setTrends] = useState<ProgressionTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'rpe' | 'volume' | 'intensity'>('rpe');

  useEffect(() => {
    const loadTrends = async () => {
      try {
        const data = await trainingTodayService.getProgressionTrends();
        setTrends(data);
      } catch (error) {
        console.error('Error loading progression trends:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrends();
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-6" style={{ minHeight: '320px' }}>
        <div className="text-white/60 text-center">Chargement des tendances...</div>
      </GlassCard>
    );
  }

  const getMetricValue = (trend: ProgressionTrend, metric: string) => {
    switch (metric) {
      case 'rpe':
        return trend.rpeAverage;
      case 'volume':
        return trend.volumeTotal / 100;
      case 'intensity':
        return trend.intensityScore;
      default:
        return 0;
    }
  };

  const getMetricColor = () => {
    switch (activeMetric) {
      case 'rpe':
        return '#22C55E';
      case 'volume':
        return '#8B5CF6';
      case 'intensity':
        return '#F59E0B';
      default:
        return TRAINING_COLOR;
    }
  };

  const maxValue = Math.max(...trends.map(t => getMetricValue(t, activeMetric)));
  const minValue = Math.min(...trends.map(t => getMetricValue(t, activeMetric)));
  const range = maxValue - minValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${getMetricColor()} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${getMetricColor()} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${getMetricColor()} 12%, transparent)`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GlowIcon icon="TrendingUp" color={getMetricColor()} size="medium" />
            <div>
              <h3 className="text-lg font-bold text-white">Tendance de Progression</h3>
              <p className="text-white/60 text-sm">8 dernières semaines</p>
            </div>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'rpe', label: 'RPE', color: '#22C55E' },
            { key: 'volume', label: 'Volume', color: '#8B5CF6' },
            { key: 'intensity', label: 'Intensité', color: '#F59E0B' }
          ].map(metric => (
            <button
              key={metric.key}
              onClick={() => setActiveMetric(metric.key as any)}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{
                background: activeMetric === metric.key
                  ? `color-mix(in srgb, ${metric.color} 20%, transparent)`
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${activeMetric === metric.key
                  ? `color-mix(in srgb, ${metric.color} 40%, transparent)`
                  : 'rgba(255, 255, 255, 0.1)'}`,
                color: activeMetric === metric.key ? metric.color : 'rgba(255, 255, 255, 0.6)'
              }}
            >
              {metric.label}
            </button>
          ))}
        </div>

        {/* Chart Area */}
        <div className="relative h-48">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-white/50">
            <span>{Math.round(maxValue)}</span>
            <span>{Math.round((maxValue + minValue) / 2)}</span>
            <span>{Math.round(minValue)}</span>
          </div>

          {/* Chart content */}
          <div className="absolute left-14 right-0 top-0 bottom-0">
            <svg className="w-full h-full" preserveAspectRatio="none">
              {/* Grid lines */}
              <line
                x1="0"
                y1="0"
                x2="100%"
                y2="0"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="100%"
                x2="100%"
                y2="100%"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />

              {/* Line chart */}
              <motion.polyline
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: {
                    duration: 1.5,
                    ease: [0.16, 1, 0.3, 1]
                  },
                  opacity: {
                    duration: 0.5
                  }
                }}
                points={trends
                  .map((trend, i) => {
                    const x = (i / (trends.length - 1)) * 100;
                    const value = getMetricValue(trend, activeMetric);
                    const y = 100 - ((value - minValue) / range) * 100;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={getMetricColor()}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: `drop-shadow(0 0 8px ${getMetricColor()}60)`,
                  willChange: 'stroke-dasharray, stroke-dashoffset, opacity'
                }}
              />

              {/* Data points */}
              {trends.map((trend, i) => {
                const x = (i / (trends.length - 1)) * 100;
                const value = getMetricValue(trend, activeMetric);
                const y = 100 - ((value - minValue) / range) * 100;

                return (
                  <motion.circle
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.1 + i * 0.05,
                      type: 'spring',
                      stiffness: 500,
                      damping: 25
                    }}
                    whileHover={{
                      scale: 1.5,
                      transition: {
                        type: 'spring',
                        stiffness: 600,
                        damping: 20
                      }
                    }}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="5"
                    fill={getMetricColor()}
                    style={{
                      filter: `drop-shadow(0 0 6px ${getMetricColor()}80)`,
                      cursor: 'pointer',
                      willChange: 'transform'
                    }}
                  />
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-white/50">
              {trends.map((trend, i) => {
                if (i % 2 === 0 || i === trends.length - 1) {
                  return <span key={i}>{trend.period}</span>;
                }
                return <span key={i} />;
              })}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Actuel</div>
            <div className="text-lg font-bold" style={{ color: getMetricColor() }}>
              {Math.round(getMetricValue(trends[trends.length - 1], activeMetric))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Moyen</div>
            <div className="text-lg font-bold text-white">
              {Math.round(
                trends.reduce((sum, t) => sum + getMetricValue(t, activeMetric), 0) / trends.length
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Tendance</div>
            <div className="text-lg font-bold" style={{ color: '#22C55E' }}>
              <SpatialIcon Icon={ICONS.TrendingUp} size={20} style={{ margin: '0 auto' }} />
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default ProgressionTrendChart;

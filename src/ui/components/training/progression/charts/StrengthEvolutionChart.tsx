/**
 * StrengthEvolutionChart Component
 * Multi-line chart showing strength evolution by muscle group
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import GlowIcon from '../../GlowIcon';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { usePerformanceMode } from '../../../../../hooks/usePerformanceMode';
import type { StrengthEvolution } from '../../../../../domain/trainingProgression';

interface StrengthEvolutionChartProps {
  data: StrengthEvolution[];
}

const StrengthEvolutionChart: React.FC<StrengthEvolutionChartProps> = ({ data }) => {
  const { enableAnimations, maxDataPoints, animationDelay } = usePerformanceMode();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (data.length === 0) return null;

  const visibleData = useMemo(() => {
    return selectedGroup
      ? data.filter(d => d.muscleGroup === selectedGroup)
      : data;
  }, [data, selectedGroup]);

  const limitedVisibleData = useMemo(() => {
    return visibleData.map(group => {
      if (group.dataPoints.length <= maxDataPoints) return group;
      const step = Math.ceil(group.dataPoints.length / maxDataPoints);
      return {
        ...group,
        dataPoints: group.dataPoints.filter((_, index) => index % step === 0 || index === group.dataPoints.length - 1)
      };
    });
  }, [visibleData, maxDataPoints]);

  const { maxWeight, minWeight, range } = useMemo(() => {
    const allDataPoints = limitedVisibleData.flatMap(group => group.dataPoints);
    const max = Math.max(...allDataPoints.map(d => d.maxWeight));
    const min = Math.min(...allDataPoints.map(d => d.maxWeight));
    return { maxWeight: max, minWeight: min, range: max - min };
  }, [limitedVisibleData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(24, 227, 255, 0.08) 0%, transparent 60%), rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(24, 227, 255, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px rgba(24, 227, 255, 0.12)'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GlowIcon icon="Zap" color="#18E3FF" size="medium" />
            <div>
              <h3 className="text-lg font-bold text-white">Évolution de la Force</h3>
              <p className="text-white/60 text-sm">Par groupe musculaire</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedGroup(null)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: !selectedGroup
                ? 'rgba(24, 227, 255, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
              border: !selectedGroup
                ? '1px solid rgba(24, 227, 255, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              color: !selectedGroup ? '#18E3FF' : 'rgba(255, 255, 255, 0.6)'
            }}
          >
            Tous
          </button>
          {data.map(group => (
            <button
              key={group.muscleGroup}
              onClick={() => setSelectedGroup(group.muscleGroup)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: selectedGroup === group.muscleGroup
                  ? `color-mix(in srgb, ${group.color} 20%, transparent)`
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedGroup === group.muscleGroup
                  ? `1px solid color-mix(in srgb, ${group.color} 40%, transparent)`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedGroup === group.muscleGroup ? group.color : 'rgba(255, 255, 255, 0.6)'
              }}
            >
              {group.muscleGroup}
            </button>
          ))}
        </div>

        <div className="relative h-56">
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-white/50">
            <span>{Math.round(maxWeight)}kg</span>
            <span>{Math.round((maxWeight + minWeight) / 2)}kg</span>
            <span>{Math.round(minWeight)}kg</span>
          </div>

          <div className="absolute left-16 right-0 top-0 bottom-0">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
              <line x1="0" y1="33%" x2="100%" y2="33%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
              <line x1="0" y1="66%" x2="100%" y2="66%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
              <line x1="0" y1="100%" x2="100%" y2="100%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />

              {limitedVisibleData.map((group, groupIndex) => {
                const points = group.dataPoints;
                if (points.length === 0) return null;

                return (
                  <g key={group.muscleGroup}>
                    {enableAnimations ? (
                      <motion.polyline
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                          pathLength: { duration: 0.8, ease: 'easeOut', delay: 0.1 + groupIndex * 0.05 },
                          opacity: { duration: 0.3, delay: 0.1 + groupIndex * 0.05 }
                        }}
                        points={points
                          .map((point, i) => {
                            const x = (i / (points.length - 1)) * 100;
                            const y = 100 - ((point.maxWeight - minWeight) / range) * 100;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke={group.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: `drop-shadow(0 0 6px ${group.color}60)` }}
                      />
                    ) : (
                      <polyline
                        points={points
                          .map((point, i) => {
                            const x = (i / (points.length - 1)) * 100;
                            const y = 100 - ((point.maxWeight - minWeight) / range) * 100;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke={group.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: `drop-shadow(0 0 6px ${group.color}60)` }}
                      />
                    )}

                    {points.map((point, i) => {
                      const x = (i / (points.length - 1)) * 100;
                      const y = 100 - ((point.maxWeight - minWeight) / range) * 100;

                      return enableAnimations ? (
                        <motion.circle
                          key={`${group.muscleGroup}-${i}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 + groupIndex * 0.05 + i * animationDelay, duration: 0.15 }}
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="3"
                          fill={group.color}
                          style={{ filter: `drop-shadow(0 0 4px ${group.color}80)` }}
                        />
                      ) : (
                        <circle
                          key={`${group.muscleGroup}-${i}`}
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="3"
                          fill={group.color}
                          style={{ filter: `drop-shadow(0 0 4px ${group.color}80)` }}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          {limitedVisibleData.map((group, index) => (
            <motion.div
              key={group.muscleGroup}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="p-3 rounded-lg"
              style={{
                background: `color-mix(in srgb, ${group.color} 8%, transparent)`,
                border: `1px solid color-mix(in srgb, ${group.color} 20%, transparent)`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/70 font-medium">{group.muscleGroup}</span>
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: group.percentageChange >= 0
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                    border: group.percentageChange >= 0
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <SpatialIcon
                    Icon={group.percentageChange >= 0 ? ICONS.TrendingUp : ICONS.TrendingDown}
                    size={10}
                    style={{ color: group.percentageChange >= 0 ? '#22C55E' : '#EF4444' }}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: group.percentageChange >= 0 ? '#22C55E' : '#EF4444' }}
                  >
                    {Math.abs(group.percentageChange).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-lg font-bold" style={{ color: group.color }}>
                {group.bestLift.weight}kg
              </div>
              <div className="text-xs text-white/50">
                {group.bestLift.exercise}
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(StrengthEvolutionChart);

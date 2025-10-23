/**
 * VolumeProgressionChart Component
 * Chart showing volume progression over weeks
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import GlowIcon from '../../GlowIcon';
import TrendIndicator from '../../TrendIndicator';
import { usePerformanceMode } from '../../../../../hooks/usePerformanceMode';
import type { VolumeDataPoint } from '../../../../../domain/trainingProgression';

interface VolumeProgressionChartProps {
  data: VolumeDataPoint[];
}

const VOLUME_COLOR = '#8B5CF6';

const VolumeProgressionChart: React.FC<VolumeProgressionChartProps> = ({ data }) => {
  const { enableAnimations, maxDataPoints, animationDelay } = usePerformanceMode();

  if (data.length === 0) return null;

  const limitedData = useMemo(() => {
    if (data.length <= maxDataPoints) return data;
    const step = Math.ceil(data.length / maxDataPoints);
    return data.filter((_, index) => index % step === 0 || index === data.length - 1);
  }, [data, maxDataPoints]);

  const { maxVolume, minVolume, range, firstWeek, lastWeek, volumeChange, avgVolume } = useMemo(() => {
    const max = Math.max(...limitedData.map(d => d.totalVolume));
    const min = Math.min(...limitedData.map(d => d.totalVolume));
    const rng = max - min;
    const first = limitedData[0];
    const last = limitedData[limitedData.length - 1];
    const change = last ? ((last.totalVolume - first.totalVolume) / first.totalVolume) * 100 : 0;
    const avg = Math.round(limitedData.reduce((sum, d) => sum + d.totalVolume, 0) / limitedData.length);
    return { maxVolume: max, minVolume: min, range: rng, firstWeek: first, lastWeek: last, volumeChange: change, avgVolume: avg };
  }, [limitedData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${VOLUME_COLOR} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${VOLUME_COLOR} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${VOLUME_COLOR} 12%, transparent)`
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GlowIcon icon="TrendingUp" color={VOLUME_COLOR} size="medium" />
            <div>
              <h3 className="text-lg font-bold text-white">Progression du Volume</h3>
              <p className="text-white/60 text-sm">{limitedData.length} dernières semaines</p>
            </div>
          </div>
          <TrendIndicator value={volumeChange} />
        </div>

        <div className="relative h-48 mt-4">
          <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-white/50">
            <span>{(maxVolume / 1000).toFixed(0)}k</span>
            <span>{((maxVolume + minVolume) / 2000).toFixed(0)}k</span>
            <span>{(minVolume / 1000).toFixed(0)}k</span>
          </div>

          <div className="absolute left-20 right-0 top-0 bottom-0">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={VOLUME_COLOR} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={VOLUME_COLOR} stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
              <line x1="0" y1="100%" x2="100%" y2="100%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />

              {enableAnimations ? (
                <motion.polygon
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  points={[
                    ...limitedData.map((d, i) => {
                      const x = (i / (limitedData.length - 1)) * 100;
                      const y = 100 - ((d.totalVolume - minVolume) / range) * 100;
                      return `${x},${y}`;
                    }),
                    `100,100`,
                    `0,100`
                  ].join(' ')}
                  fill="url(#volumeGradient)"
                />
              ) : (
                <polygon
                  points={[
                    ...limitedData.map((d, i) => {
                      const x = (i / (limitedData.length - 1)) * 100;
                      const y = 100 - ((d.totalVolume - minVolume) / range) * 100;
                      return `${x},${y}`;
                    }),
                    `100,100`,
                    `0,100`
                  ].join(' ')}
                  fill="url(#volumeGradient)"
                />
              )}

              {enableAnimations ? (
                <motion.polyline
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  points={limitedData
                    .map((d, i) => {
                      const x = (i / (limitedData.length - 1)) * 100;
                      const y = 100 - ((d.totalVolume - minVolume) / range) * 100;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke={VOLUME_COLOR}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 8px ${VOLUME_COLOR}60)` }}
                />
              ) : (
                <polyline
                  points={limitedData
                    .map((d, i) => {
                      const x = (i / (limitedData.length - 1)) * 100;
                      const y = 100 - ((d.totalVolume - minVolume) / range) * 100;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke={VOLUME_COLOR}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 8px ${VOLUME_COLOR}60)` }}
                />
              )}

              {limitedData.map((d, i) => {
                const x = (i / (limitedData.length - 1)) * 100;
                const y = 100 - ((d.totalVolume - minVolume) / range) * 100;

                return enableAnimations ? (
                  <motion.circle
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * animationDelay, duration: 0.2 }}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill={VOLUME_COLOR}
                    style={{ filter: `drop-shadow(0 0 6px ${VOLUME_COLOR}80)` }}
                  />
                ) : (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill={VOLUME_COLOR}
                    style={{ filter: `drop-shadow(0 0 6px ${VOLUME_COLOR}80)` }}
                  />
                );
              })}
            </svg>

            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-white/50">
              {limitedData.map((d, i) => {
                if (i % Math.ceil(limitedData.length / 6) === 0 || i === limitedData.length - 1) {
                  return <span key={i}>{d.weekLabel}</span>;
                }
                return <span key={i} />;
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Actuel</div>
            <div className="text-lg font-bold" style={{ color: VOLUME_COLOR }}>
              {(lastWeek?.totalVolume || 0).toLocaleString()}kg
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Moyen</div>
            <div className="text-lg font-bold text-white">
              {avgVolume.toLocaleString()}kg
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Record</div>
            <div className="text-lg font-bold text-white">
              {maxVolume.toLocaleString()}kg
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(VolumeProgressionChart);

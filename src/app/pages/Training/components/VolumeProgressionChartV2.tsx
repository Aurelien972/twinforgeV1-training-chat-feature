/**
 * VolumeProgressionChartV2 Component
 * Enhanced volume progression chart with real training data
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';
import TrendIndicator from '../../../../ui/components/training/TrendIndicator';

interface WeeklyVolumeData {
  weekLabel: string;
  weekNumber: number;
  totalVolume: number;
  sessionsCount: number;
  avgVolumePerSession: number;
  avgRPE: number;
  totalDuration: number;
  startDate: Date;
  endDate: Date;
}

interface VolumeProgressionChartV2Props {
  data: WeeklyVolumeData[];
}

const VOLUME_COLOR = '#8B5CF6';

const VolumeProgressionChartV2: React.FC<VolumeProgressionChartV2Props> = ({ data }) => {
  if (data.length === 0) return null;

  const { maxVolume, minVolume, range, firstWeek, lastWeek, volumeChange, avgVolume } = useMemo(() => {
    const max = Math.max(...data.map(d => d.totalVolume));
    const min = Math.min(...data.map(d => d.totalVolume));
    const rng = max - min || 1;
    const first = data[0];
    const last = data[data.length - 1];
    const change = first && last && first.totalVolume > 0
      ? ((last.totalVolume - first.totalVolume) / first.totalVolume) * 100
      : 0;
    const avg = Math.round(data.reduce((sum, d) => sum + d.totalVolume, 0) / data.length);
    return { maxVolume: max, minVolume: min, range: rng, firstWeek: first, lastWeek: last, volumeChange: change, avgVolume: avg };
  }, [data]);

  // Calculate trend line (linear regression)
  const trendLine = useMemo(() => {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    data.forEach((d, i) => {
      sumX += i;
      sumY += d.totalVolume;
      sumXY += i * d.totalVolume;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
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
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                  linear-gradient(135deg, color-mix(in srgb, ${VOLUME_COLOR} 30%, transparent), color-mix(in srgb, ${VOLUME_COLOR} 20%, transparent))
                `,
                border: `2px solid color-mix(in srgb, ${VOLUME_COLOR} 40%, transparent)`,
                boxShadow: `0 0 20px color-mix(in srgb, ${VOLUME_COLOR} 30%, transparent)`
              }}
            >
              <SpatialIcon Icon={ICONS.TrendingUp} size={20} style={{ color: VOLUME_COLOR }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Progression du Volume</h3>
              <p className="text-white/60 text-sm">{data.length} dernières semaines</p>
            </div>
          </div>
          <TrendIndicator value={volumeChange} />
        </div>

        <div className="relative h-56 mt-4">
          <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-white/50">
            <span>{(maxVolume / 1000).toFixed(0)}k</span>
            <span>{((maxVolume + minVolume) / 2000).toFixed(0)}k</span>
            <span>{(minVolume / 1000).toFixed(0)}k</span>
          </div>

          <div className="absolute left-20 right-0 top-0 bottom-0">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={VOLUME_COLOR} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={VOLUME_COLOR} stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />

              {/* Area fill */}
              <polygon
                points={[
                  ...data.map((d, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    const y = 100 - ((d.totalVolume - minVolume) / range) * 100;
                    return `${x},${y}`;
                  }),
                  `100,100`,
                  `0,100`
                ].join(' ')}
                fill="url(#volumeGradient)"
              />

              {/* Trend line */}
              <line
                x1="0"
                y1={100 - ((trendLine.intercept - minVolume) / range) * 100}
                x2="100"
                y2={100 - ((trendLine.intercept + trendLine.slope * (data.length - 1) - minVolume) / range) * 100}
                stroke={VOLUME_COLOR}
                strokeWidth="0.8"
                strokeDasharray="3,3"
                opacity="0.5"
              />

              {/* Main line */}
              <polyline
                points={data
                  .map((d, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    const y = 100 - ((d.totalVolume - minVolume) / range) * 100;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={VOLUME_COLOR}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 8px ${VOLUME_COLOR}60)` }}
              />

              {/* Data points */}
              {data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - ((d.totalVolume - minVolume) / range) * 100;

                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill={VOLUME_COLOR}
                      style={{ filter: `drop-shadow(0 0 6px ${VOLUME_COLOR}80)` }}
                    >
                      <title>{`${d.weekLabel}: ${d.totalVolume}kg (${d.sessionsCount} séances)`}</title>
                    </circle>
                  </g>
                );
              })}
            </svg>

            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-white/50">
              {data.map((d, i) => {
                if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
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
              {(lastWeek?.totalVolume || 0) >= 1000
                ? `${((lastWeek?.totalVolume || 0) / 1000).toFixed(1)}k`
                : lastWeek?.totalVolume || 0}kg
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Moyen</div>
            <div className="text-lg font-bold text-white">
              {avgVolume >= 1000 ? `${(avgVolume / 1000).toFixed(1)}k` : avgVolume}kg
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Record</div>
            <div className="text-lg font-bold text-white">
              {maxVolume >= 1000 ? `${(maxVolume / 1000).toFixed(1)}k` : maxVolume}kg
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(VolumeProgressionChartV2);

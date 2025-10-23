/**
 * TrainingLoadChart Component
 * Visualizes training load (volume x intensity) over time
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';

interface WeeklyVolumeData {
  weekLabel: string;
  weekNumber: number;
  totalVolume: number;
  avgRPE: number;
  sessionsCount: number;
}

interface TrainingLoadChartProps {
  data: WeeklyVolumeData[];
}

const LOAD_COLOR = '#06B6D4';
const INTENSITY_COLOR = '#F59E0B';

const TrainingLoadChart: React.FC<TrainingLoadChartProps> = ({ data }) => {
  if (data.length === 0) return null;

  const { maxLoad, minLoad, range, avgLoad } = useMemo(() => {
    const loads = data.map(d => (d.totalVolume / 1000) * d.avgRPE);
    const max = Math.max(...loads);
    const min = Math.min(...loads);
    const rng = max - min || 1;
    const avg = loads.reduce((sum, l) => sum + l, 0) / loads.length;
    return { maxLoad: max, minLoad: min, range: rng, avgLoad: avg };
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <GlassCard
        className="p-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${LOAD_COLOR} 8%, transparent) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: `color-mix(in srgb, ${LOAD_COLOR} 20%, transparent)`,
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.2), 0 0 30px color-mix(in srgb, ${LOAD_COLOR} 12%, transparent)`
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                  linear-gradient(135deg, color-mix(in srgb, ${LOAD_COLOR} 30%, transparent), color-mix(in srgb, ${LOAD_COLOR} 20%, transparent))
                `,
                border: `2px solid color-mix(in srgb, ${LOAD_COLOR} 40%, transparent)`,
                boxShadow: `0 0 20px color-mix(in srgb, ${LOAD_COLOR} 30%, transparent)`
              }}
            >
              <SpatialIcon Icon={ICONS.Activity} size={20} style={{ color: LOAD_COLOR }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Charge d'Entraînement</h3>
              <p className="text-cyan-200 text-sm">Volume x Intensité par semaine</p>
            </div>
          </div>
        </div>

        <div className="relative h-48">
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-white/50">
            <span>{maxLoad.toFixed(0)}</span>
            <span>{((maxLoad + minLoad) / 2).toFixed(0)}</span>
            <span>{minLoad.toFixed(0)}</span>
          </div>

          <div className="absolute left-16 right-0 top-0 bottom-0">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              {/* Grid lines */}
              <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />

              {/* Average line */}
              <line
                x1="0"
                y1={100 - ((avgLoad - minLoad) / range) * 100}
                x2="100"
                y2={100 - ((avgLoad - minLoad) / range) * 100}
                stroke={LOAD_COLOR}
                strokeWidth="0.8"
                strokeDasharray="3,3"
                opacity="0.4"
              />

              {/* Bars */}
              {data.map((d, i) => {
                const load = (d.totalVolume / 1000) * d.avgRPE;
                const x = (i / (data.length - 1)) * 100;
                const barWidth = Math.max(100 / data.length - 1, 2);
                const barHeight = ((load - minLoad) / range) * 100;
                const y = 100 - barHeight;

                const intensity = d.avgRPE;
                const barColor = intensity < 6.5
                  ? '#22C55E'
                  : intensity < 8
                  ? INTENSITY_COLOR
                  : '#EF4444';

                return (
                  <g key={i}>
                    <rect
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={`url(#barGradient-${i})`}
                      rx="1"
                    />
                    <defs>
                      <linearGradient id={`barGradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={barColor} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={barColor} stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <title>{`${d.weekLabel}: Charge ${load.toFixed(1)} (${d.totalVolume}kg x RPE ${d.avgRPE})`}</title>
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

        {/* Legend */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#22C55E' }} />
            <span className="text-white/70">Légère (RPE &lt; 6.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: INTENSITY_COLOR }} />
            <span className="text-white/70">Modérée (RPE 6.5-8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: '#EF4444' }} />
            <span className="text-white/70">Intense (RPE &gt; 8)</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(TrainingLoadChart);

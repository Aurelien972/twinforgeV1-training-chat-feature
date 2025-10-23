/**
 * Heart Rate Zones Chart
 * Displays time distribution across heart rate zones with bar chart visualization
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { HeartRateZoneDistribution } from '../../../../domain/ai/trainingAiTypes';

interface HeartRateZonesChartProps {
  zonesData: HeartRateZoneDistribution;
  prescribedZones?: string[];
  compact?: boolean;
}

interface ZoneConfig {
  label: string;
  color: string;
  range: string;
  description: string;
}

const ZONE_CONFIGS: Record<string, ZoneConfig> = {
  'Zone 1': {
    label: 'Zone 1',
    color: '#10B981', // Green
    range: '50-60%',
    description: 'Récupération'
  },
  'Zone 2': {
    label: 'Zone 2',
    color: '#3B82F6', // Blue
    range: '60-70%',
    description: 'Endurance'
  },
  'Zone 3': {
    label: 'Zone 3',
    color: '#F59E0B', // Orange
    range: '70-80%',
    description: 'Tempo'
  },
  'Zone 4': {
    label: 'Zone 4',
    color: '#EF4444', // Red
    range: '80-90%',
    description: 'Seuil'
  },
  'Zone 5': {
    label: 'Zone 5',
    color: '#DC2626', // Dark Red
    range: '90-100%',
    description: 'VO2Max'
  }
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

export const HeartRateZonesChart: React.FC<HeartRateZonesChartProps> = ({
  zonesData,
  prescribedZones = [],
  compact = false
}) => {
  // Calculate total time for percentage calculations
  const totalTime = Object.values(zonesData).reduce((sum, time) => sum + time, 0);

  // Sort zones by zone number
  const sortedZones = Object.entries(zonesData)
    .sort(([a], [b]) => {
      const zoneA = parseInt(a.replace('Zone ', ''));
      const zoneB = parseInt(b.replace('Zone ', ''));
      return zoneA - zoneB;
    });

  // Find max value for bar width calculation
  const maxTime = Math.max(...Object.values(zonesData));

  if (totalTime === 0) {
    return (
      <div className="text-center py-6 text-white/60">
        Aucune donnée de zones cardiaques disponible
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedZones.map(([zone, timeInZone], index) => {
        const zoneConfig = ZONE_CONFIGS[zone];
        const percentage = totalTime > 0 ? (timeInZone / totalTime) * 100 : 0;
        const barWidth = maxTime > 0 ? (timeInZone / maxTime) * 100 : 0;
        const isPrescribed = prescribedZones.includes(zone);

        if (timeInZone === 0 && compact) return null;

        return (
          <motion.div
            key={zone}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative"
          >
            {/* Zone Label and Stats */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: zoneConfig.color,
                    boxShadow: `0 0 8px ${zoneConfig.color}80`
                  }}
                />
                <span className="text-sm font-medium text-white">
                  {zoneConfig.label}
                  {!compact && (
                    <span className="text-white/50 ml-1.5 text-xs">
                      {zoneConfig.range}
                    </span>
                  )}
                </span>
                {isPrescribed && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: `${zoneConfig.color}20`,
                      color: zoneConfig.color,
                      border: `1px solid ${zoneConfig.color}40`
                    }}
                  >
                    Cible
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white tabular-nums">
                  {percentage.toFixed(0)}%
                </span>
                <span className="text-xs text-white/60 tabular-nums min-w-[50px] text-right">
                  {formatTime(timeInZone)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg,
                    ${zoneConfig.color}dd 0%,
                    ${zoneConfig.color} 50%,
                    ${zoneConfig.color}dd 100%
                  )`,
                  boxShadow: `0 0 8px ${zoneConfig.color}60`
                }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg,
                      transparent 0%,
                      rgba(255,255,255,0.3) 50%,
                      transparent 100%
                    )`,
                    width: '50%'
                  }}
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              </motion.div>
            </div>

            {!compact && (
              <div className="mt-1 text-xs text-white/40">
                {zoneConfig.description}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default HeartRateZonesChart;

/**
 * WearableTodayDashboard
 * Dashboard des métriques wearable du jour
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { WearableMetrics } from '../../../../system/services/trainingTodayDynamicService';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

interface WearableTodayDashboardProps {
  metrics: WearableMetrics;
  deviceName?: string;
}

const WearableTodayDashboard: React.FC<WearableTodayDashboardProps> = ({ metrics, deviceName }) => {
  const getDataQualityColor = (quality?: string) => {
    switch (quality) {
      case 'excellent':
        return '#22C55E';
      case 'good':
        return '#3B82F6';
      case 'fair':
        return '#F59E0B';
      case 'poor':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getZoneColor = (zone: number) => {
    const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#F97316', '#EF4444'];
    return colors[zone - 1] || '#6B7280';
  };

  const totalZoneTime = metrics.zonesDistribution
    ? Object.values(metrics.zonesDistribution).reduce((sum, val) => sum + val, 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard
        className="p-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${TRAINING_COLORS.wearable} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLORS.wearable} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${TRAINING_COLORS.wearable} 15%, transparent)`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid rgba(239, 68, 68, 0.3)',
              }}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <SpatialIcon
                Icon={ICONS.Heart}
                size={20}
                style={{ color: '#EF4444' }}
              />
            </motion.div>
            <div>
              <h3 className="text-white font-semibold text-base">
                Données Wearable
              </h3>
              <p className="text-white/50 text-xs">
                {deviceName || 'Device connecté'}
              </p>
            </div>
          </div>

          {/* Data Quality Badge */}
          {metrics.dataQuality && (
            <div
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: `${getDataQualityColor(metrics.dataQuality)}20`,
                color: getDataQualityColor(metrics.dataQuality),
                border: `1px solid ${getDataQualityColor(metrics.dataQuality)}40`,
              }}
            >
              {metrics.dataQuality === 'excellent' && 'Excellent'}
              {metrics.dataQuality === 'good' && 'Bon'}
              {metrics.dataQuality === 'fair' && 'Correct'}
              {metrics.dataQuality === 'poor' && 'Faible'}
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Average HR */}
          {metrics.avgHr && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <SpatialIcon Icon={ICONS.Heart} size={16} style={{ color: '#EF4444' }} />
                <span className="text-xs text-white/60">Moy. HR</span>
              </div>
              <p className="text-white font-bold text-2xl">{metrics.avgHr}</p>
              <span className="text-white/50 text-xs">bpm</span>
            </div>
          )}

          {/* Max HR */}
          {metrics.maxHr && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <SpatialIcon Icon={ICONS.TrendingUp} size={16} style={{ color: '#EF4444' }} />
                <span className="text-xs text-white/60">Max HR</span>
              </div>
              <p className="text-white font-bold text-2xl">{metrics.maxHr}</p>
              <span className="text-white/50 text-xs">bpm</span>
            </div>
          )}

          {/* Calories */}
          {metrics.caloriesBurned && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <SpatialIcon Icon={ICONS.Flame} size={16} style={{ color: '#F59E0B' }} />
                <span className="text-xs text-white/60">Calories</span>
              </div>
              <p className="text-white font-bold text-2xl">{metrics.caloriesBurned}</p>
              <span className="text-white/50 text-xs">kcal</span>
            </div>
          )}

          {/* Effort Score */}
          {metrics.effortScore !== undefined && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <SpatialIcon Icon={ICONS.Zap} size={16} style={{ color: '#3B82F6' }} />
                <span className="text-xs text-white/60">Effort</span>
              </div>
              <p className="text-white font-bold text-2xl">{metrics.effortScore}</p>
              <span className="text-white/50 text-xs">/100</span>
            </div>
          )}
        </div>

        {/* HR Zones Distribution */}
        {metrics.zonesDistribution && totalZoneTime > 0 && (
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">
              Distribution des Zones HR
            </h4>
            <div className="space-y-2">
              {Object.entries(metrics.zonesDistribution).map(([zone, time], index) => {
                const percentage = totalZoneTime > 0 ? (time / totalZoneTime) * 100 : 0;
                const zoneNumber = index + 1;

                if (time === 0) return null;

                return (
                  <div key={zone} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">Zone {zoneNumber}</span>
                      <span className="text-white/90 font-medium">
                        {Math.round(time)}min ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: getZoneColor(zoneNumber) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default WearableTodayDashboard;

/**
 * HistoryStatsOverview Component
 * Overview stats for history tab
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { HistoryStats } from '../../../../domain/trainingToday';

interface HistoryStatsOverviewProps {
  stats: HistoryStats;
}

const HistoryStatsOverview: React.FC<HistoryStatsOverviewProps> = ({ stats }) => {
  const totalMinutes = stats.totalMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const durationDisplay = totalMinutes === 0 ? '0min' : hours > 0 ? `${hours}h${minutes}min` : `${minutes}min`;

  const avgRpe = stats.avgRpe || 0;
  const rpeDisplay = avgRpe === 0 ? '-' : avgRpe.toFixed(1);

  const completionRate = stats.completionRate || 0;

  // Build stat cards based on available metrics
  const statCards = [
    { label: 'Total Séances', value: stats.totalSessions, color: '#18E3FF', iconName: 'Dumbbell' },
    { label: 'Temps Total', value: durationDisplay, color: '#8B5CF6', iconName: 'Clock' },
    { label: 'RPE Moyen', value: rpeDisplay, color: '#22C55E', iconName: 'Activity' },
    { label: 'Taux Complétion', value: `${Math.round(completionRate)}%`, color: '#F59E0B', iconName: 'Target' }
  ];

  // Add discipline-specific metrics if available
  if (stats.volumeKg && stats.volumeKg > 0) {
    statCards.push({
      label: 'Volume Total',
      value: `${stats.volumeKg}kg`,
      color: '#EC4899',
      iconName: 'Zap'
    });
  }

  if (stats.distanceKm && stats.distanceKm > 0) {
    statCards.push({
      label: 'Distance Totale',
      value: `${stats.distanceKm}km`,
      color: '#10B981',
      iconName: 'Navigation'
    });
  }

  if (stats.maxWeight && stats.maxWeight > 0) {
    statCards.push({
      label: 'Charge Max',
      value: `${stats.maxWeight}kg`,
      color: '#EF4444',
      iconName: 'TrendingUp'
    });
  }

  if (stats.avgPace) {
    statCards.push({
      label: 'Allure Moyenne',
      value: `${stats.avgPace}/km`,
      color: '#06B6D4',
      iconName: 'Gauge'
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <GlassCard
              className="p-4 text-center"
              style={{
                background: `radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stat.color} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.05)`,
                border: `2px solid color-mix(in srgb, ${stat.color} 20%, transparent)`,
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15), 0 0 16px color-mix(in srgb, ${stat.color} 10%, transparent)`
              }}
            >
              <div className="flex justify-center mb-3">
                <GlowIcon icon={stat.iconName as any} color={stat.color} size="small" />
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs text-white/60">{stat.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default HistoryStatsOverview;

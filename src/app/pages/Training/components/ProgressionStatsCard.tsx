/**
 * ProgressionStatsCard Component
 * Displays key progression metrics and comparisons
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';
import TrendIndicator from '../../../../ui/components/training/TrendIndicator';

interface ProgressionStatsCardProps {
  totalSessions: number;
  totalVolume: number;
  totalDuration: number;
  avgRPE: number;
  currentWeekSessions: number;
  previousWeekSessions: number;
  sessionsChange: number;
  volumeChange: number;
  currentWeekVolume: number;
  period: 'week' | 'month' | 'quarter';
}

const ProgressionStatsCard: React.FC<ProgressionStatsCardProps> = ({
  totalSessions,
  totalVolume,
  totalDuration,
  avgRPE,
  currentWeekSessions,
  previousWeekSessions,
  sessionsChange,
  volumeChange,
  currentWeekVolume,
  period
}) => {
  const periodLabel = period === 'week' ? '4 dernières semaines' : period === 'month' ? '12 dernières semaines' : '24 dernières semaines';

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard
        className="p-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, #3B82F6 10%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, color-mix(in srgb, #06B6D4 8%, transparent) 0%, transparent 50%),
            var(--glass-opacity)
          `,
          borderColor: 'color-mix(in srgb, #3B82F6 25%, transparent)',
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.2), 0 0 30px color-mix(in srgb, #3B82F6 15%, transparent)`
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                  linear-gradient(135deg, color-mix(in srgb, #3B82F6 30%, transparent), color-mix(in srgb, #06B6D4 25%, transparent))
                `,
                border: '2px solid color-mix(in srgb, #3B82F6 40%, transparent)',
                boxShadow: '0 0 20px color-mix(in srgb, #3B82F6 30%, transparent)'
              }}
            >
              <SpatialIcon Icon={ICONS.BarChart3} size={20} style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Statistiques Globales</h3>
              <p className="text-blue-200 text-sm">{periodLabel}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sessions */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'color-mix(in srgb, #3B82F6 6%, transparent)',
              border: '1px solid color-mix(in srgb, #3B82F6 15%, transparent)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.Activity} size={16} style={{ color: '#3B82F6' }} />
              <span className="text-white/70 text-xs font-medium">Séances</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalSessions}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-white/60 text-xs">Cette semaine: {currentWeekSessions}</span>
              {sessionsChange !== 0 && <TrendIndicator value={sessionsChange} size="small" />}
            </div>
          </div>

          {/* Total Volume */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'color-mix(in srgb, #8B5CF6 6%, transparent)',
              border: '1px solid color-mix(in srgb, #8B5CF6 15%, transparent)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.TrendingUp} size={16} style={{ color: '#8B5CF6' }} />
              <span className="text-white/70 text-xs font-medium">Volume Total</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}kg
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-white/60 text-xs">
                Semaine: {currentWeekVolume >= 1000 ? `${(currentWeekVolume / 1000).toFixed(1)}k` : currentWeekVolume}kg
              </span>
              {volumeChange !== 0 && <TrendIndicator value={volumeChange} size="small" />}
            </div>
          </div>

          {/* Total Duration */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'color-mix(in srgb, #06B6D4 6%, transparent)',
              border: '1px solid color-mix(in srgb, #06B6D4 15%, transparent)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.Clock} size={16} style={{ color: '#06B6D4' }} />
              <span className="text-white/70 text-xs font-medium">Durée Totale</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatDuration(totalDuration)}</div>
            <div className="mt-2">
              <span className="text-white/60 text-xs">
                Moyenne: {totalSessions > 0 ? formatDuration(Math.round(totalDuration / totalSessions)) : '0min'}
              </span>
            </div>
          </div>

          {/* Average RPE */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'color-mix(in srgb, #F59E0B 6%, transparent)',
              border: '1px solid color-mix(in srgb, #F59E0B 15%, transparent)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.Zap} size={16} style={{ color: '#F59E0B' }} />
              <span className="text-white/70 text-xs font-medium">RPE Moyen</span>
            </div>
            <div className="text-2xl font-bold text-white">{avgRPE.toFixed(1)}</div>
            <div className="mt-2">
              <span className="text-white/60 text-xs">
                {avgRPE < 6.5 ? 'Léger' : avgRPE < 8 ? 'Modéré' : 'Intense'}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Comparison */}
        <div
          className="mt-4 p-4 rounded-xl"
          style={{
            background: 'color-mix(in srgb, #22C55E 5%, transparent)',
            border: '1px solid color-mix(in srgb, #22C55E 12%, transparent)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.TrendingUp} size={16} style={{ color: '#22C55E' }} />
              <span className="text-white font-medium text-sm">Comparaison Hebdomadaire</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-white/60 text-xs">Séances</div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{currentWeekSessions} vs {previousWeekSessions}</span>
                  {sessionsChange !== 0 && <TrendIndicator value={sessionsChange} size="small" />}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/60 text-xs">Volume</div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">
                    {currentWeekVolume >= 1000 ? `${(currentWeekVolume / 1000).toFixed(1)}k` : currentWeekVolume}kg
                  </span>
                  {volumeChange !== 0 && <TrendIndicator value={volumeChange} size="small" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(ProgressionStatsCard);

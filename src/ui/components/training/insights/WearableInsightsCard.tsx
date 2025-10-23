/**
 * Wearable Insights Card
 * Displays heart rate metrics and analysis from wearable device tracking
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { HeartRateZonesChart } from './HeartRateZonesChart';
import type { WearableSessionMetrics, WearableAnalysis } from '../../../../domain/ai/trainingAiTypes';

interface WearableInsightsCardProps {
  wearableMetrics: WearableSessionMetrics;
  wearableAnalysis?: WearableAnalysis;
  prescribedZones?: string[];
  stepColor: string;
  compact?: boolean;
}

interface MetricCardProps {
  icon: any;
  label: string;
  value: string;
  subtext?: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, subtext, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col gap-2 p-4 rounded-xl"
    style={{
      background: `
        radial-gradient(circle at 20% 20%, color-mix(in srgb, ${color} 8%, transparent), transparent 70%),
        rgba(255, 255, 255, 0.06)
      `,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)'
    }}
  >
    <div className="flex items-center gap-2">
      <SpatialIcon
        Icon={icon}
        size={16}
        style={{
          color,
          filter: `drop-shadow(0 0 6px color-mix(in srgb, ${color} 50%, transparent))`
        }}
      />
      <span className="text-xs text-white/60 font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="flex flex-col">
      <span
        className="text-2xl font-bold tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
      {subtext && (
        <span className="text-xs text-white/50 mt-0.5">
          {subtext}
        </span>
      )}
    </div>
  </motion.div>
);

interface PerformanceBadgeProps {
  type: 'excellent' | 'good' | 'moderate' | 'poor';
  label: string;
  description: string;
}

const PerformanceBadge: React.FC<PerformanceBadgeProps> = ({ type, label, description }) => {
  const colorMap = {
    excellent: '#10B981',
    good: '#3B82F6',
    moderate: '#F59E0B',
    poor: '#EF4444'
  };

  const iconMap = {
    excellent: ICONS.Trophy,
    good: ICONS.Target,
    moderate: ICONS.AlertCircle,
    poor: ICONS.AlertTriangle
  };

  const color = colorMap[type];
  const Icon = iconMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`
      }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
        style={{
          background: `color-mix(in srgb, ${color} 20%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`
        }}
      >
        <SpatialIcon
          Icon={Icon}
          size={16}
          style={{ color }}
        />
      </div>
      <div className="flex flex-col gap-0.5 flex-1">
        <span className="text-sm font-medium text-white">
          {label}
        </span>
        <span className="text-xs text-white/60 leading-relaxed">
          {description}
        </span>
      </div>
    </motion.div>
  );
};

export const WearableInsightsCard: React.FC<WearableInsightsCardProps> = ({
  wearableMetrics,
  wearableAnalysis,
  prescribedZones = [],
  stepColor,
  compact = false
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getDataQualityColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'fair': return '#F59E0B';
      case 'poor': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDataQualityLabel = (quality: string): string => {
    switch (quality) {
      case 'excellent': return 'Excellente';
      case 'good': return 'Bonne';
      case 'fair': return 'Correcte';
      case 'poor': return 'Faible';
      default: return 'Inconnue';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6 p-6 rounded-2xl"
      style={{
        background: `
          radial-gradient(circle at 10% 10%, color-mix(in srgb, ${stepColor} 8%, transparent), transparent 60%),
          linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)
        `,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(20px)',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.2),
          0 0 0 1px rgba(255, 255, 255, 0.05) inset,
          0 0 24px color-mix(in srgb, ${stepColor} 8%, transparent)
        `
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [1, 0.8, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 20%, transparent), transparent 70%),
                rgba(255, 255, 255, 0.08)
              `,
              border: `1px solid color-mix(in srgb, ${stepColor} 30%, transparent)`,
              boxShadow: `0 0 16px color-mix(in srgb, ${stepColor} 20%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={ICONS.Activity}
              size={20}
              style={{
                color: stepColor,
                filter: `drop-shadow(0 0 8px color-mix(in srgb, ${stepColor} 60%, transparent))`
              }}
            />
          </motion.div>
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-white">
              Données Wearable
            </h3>
            <span className="text-xs text-white/50">
              {wearableMetrics.deviceName}
            </span>
          </div>
        </div>

        {/* Data Quality Badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: `color-mix(in srgb, ${getDataQualityColor(wearableMetrics.dataQuality)} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${getDataQualityColor(wearableMetrics.dataQuality)} 30%, transparent)`,
            color: getDataQualityColor(wearableMetrics.dataQuality)
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: getDataQualityColor(wearableMetrics.dataQuality),
              boxShadow: `0 0 8px ${getDataQualityColor(wearableMetrics.dataQuality)}80`
            }}
          />
          Qualité: {getDataQualityLabel(wearableMetrics.dataQuality)}
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={ICONS.Heart}
          label="FC Moyenne"
          value={`${wearableMetrics.avgHeartRate}`}
          subtext="bpm"
          color="#EF4444"
        />
        <MetricCard
          icon={ICONS.TrendingUp}
          label="FC Max"
          value={`${wearableMetrics.maxHeartRate}`}
          subtext="bpm"
          color="#F59E0B"
        />
        <MetricCard
          icon={ICONS.Flame}
          label="Calories"
          value={`${wearableMetrics.caloriesBurned}`}
          subtext="kcal"
          color="#F97316"
        />
        <MetricCard
          icon={ICONS.Zap}
          label="Effort"
          value={`${wearableMetrics.effortScore}`}
          subtext="/100"
          color={stepColor}
        />
      </div>

      {/* Heart Rate Zones Chart */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <SpatialIcon
            Icon={ICONS.BarChart}
            size={16}
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          />
          <h4 className="text-sm font-semibold text-white">
            Distribution des Zones Cardiaques
          </h4>
        </div>
        <HeartRateZonesChart
          zonesData={{
            'Zone 1': wearableMetrics.timeInZones.zone1,
            'Zone 2': wearableMetrics.timeInZones.zone2,
            'Zone 3': wearableMetrics.timeInZones.zone3,
            'Zone 4': wearableMetrics.timeInZones.zone4,
            'Zone 5': wearableMetrics.timeInZones.zone5
          }}
          prescribedZones={prescribedZones}
          compact={compact}
        />
      </div>

      {/* Performance Badges */}
      {wearableAnalysis && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <SpatialIcon
              Icon={ICONS.Award}
              size={16}
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            />
            <h4 className="text-sm font-semibold text-white">
              Analyse de Performance
            </h4>
          </div>

          <div className="flex flex-col gap-2">
            <PerformanceBadge
              type={wearableAnalysis.effortAccuracy.rating}
              label="Précision de l'Effort"
              description={wearableAnalysis.effortAccuracy.analysis}
            />

            {wearableAnalysis.zoneCompliance && (
              <PerformanceBadge
                type={
                  wearableAnalysis.zoneCompliance.overallCompliance >= 80 ? 'excellent' :
                  wearableAnalysis.zoneCompliance.overallCompliance >= 60 ? 'good' :
                  wearableAnalysis.zoneCompliance.overallCompliance >= 40 ? 'moderate' : 'poor'
                }
                label={`Respect des Zones (${Math.round(wearableAnalysis.zoneCompliance.overallCompliance)}%)`}
                description={wearableAnalysis.zoneCompliance.recommendation}
              />
            )}
          </div>
        </div>
      )}

      {/* Insights & Recommendations */}
      {wearableAnalysis && (wearableAnalysis.insights.length > 0 || wearableAnalysis.recommendations.length > 0) && (
        <div className="flex flex-col gap-3">
          {wearableAnalysis.insights.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SpatialIcon
                  Icon={ICONS.Lightbulb}
                  size={14}
                  style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                />
                <h5 className="text-xs font-medium text-white/80 uppercase tracking-wider">
                  Insights
                </h5>
              </div>
              <ul className="flex flex-col gap-1.5">
                {wearableAnalysis.insights.map((insight, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 text-sm text-white/70"
                  >
                    <span className="text-white/40 mt-0.5">•</span>
                    <span>{insight}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {wearableAnalysis.recommendations.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SpatialIcon
                  Icon={ICONS.MessageSquare}
                  size={14}
                  style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                />
                <h5 className="text-xs font-medium text-white/80 uppercase tracking-wider">
                  Recommandations
                </h5>
              </div>
              <ul className="flex flex-col gap-1.5">
                {wearableAnalysis.recommendations.map((recommendation, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 text-sm text-white/70"
                  >
                    <span className="text-white/40 mt-0.5">→</span>
                    <span>{recommendation}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recovery Impact */}
      {wearableAnalysis && (
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div className="flex items-center gap-3">
            <SpatialIcon
              Icon={ICONS.Clock}
              size={18}
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            />
            <div className="flex flex-col">
              <span className="text-xs text-white/50 uppercase tracking-wider">
                Impact Récupération
              </span>
              <span className="text-sm font-medium text-white">
                {wearableAnalysis.recoveryImpact.estimatedRecoveryHours}h de récupération estimée
              </span>
            </div>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.8)'
            }}
          >
            Intensité: {wearableAnalysis.recoveryImpact.intensityLevel}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WearableInsightsCard;

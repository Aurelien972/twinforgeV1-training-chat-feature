/**
 * Wearable Recovery Gauge
 * Displays recovery score from wearable device with detailed metrics
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';

interface WearableRecoveryGaugeProps {
  recoveryScore: number;
  deviceName: string;
  metrics?: {
    hrv?: number;
    restingHeartRate?: number;
    sleepHours?: number;
  };
  dataQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export const WearableRecoveryGauge: React.FC<WearableRecoveryGaugeProps> = ({
  recoveryScore,
  deviceName,
  metrics = {},
  dataQuality = 'good'
}) => {
  const getRecoveryColor = (score: number): string => {
    if (score >= 70) return '#10B981';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getRecoveryLabel = (score: number): string => {
    if (score >= 80) return 'Excellente';
    if (score >= 70) return 'Bonne';
    if (score >= 50) return 'Modérée';
    if (score >= 40) return 'Faible';
    return 'Très Faible';
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

  const color = getRecoveryColor(recoveryScore);
  const recoveryLabel = getRecoveryLabel(recoveryScore);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (recoveryScore / 100) * circumference;

  return (
    <div className="flex flex-col gap-6">
      {/* Circular Gauge */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <svg width="180" height="180" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r="70"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="90"
              cy="90"
              r="70"
              stroke={color}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                filter: `drop-shadow(0 0 8px ${color}80)`
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="text-5xl font-bold tabular-nums"
              style={{ color }}
            >
              {Math.round(recoveryScore)}
            </motion.div>
            <span className="text-sm text-white/60 font-medium">/ 100</span>
          </div>
        </div>

        {/* Recovery Label */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              background: `color-mix(in srgb, ${color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
              color
            }}
          >
            Récupération {recoveryLabel}
          </div>

          {/* Device Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <SpatialIcon
              Icon={ICONS.Watch}
              size={12}
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            />
            Données {deviceName}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {(metrics.hrv !== undefined || metrics.restingHeartRate !== undefined || metrics.sleepHours !== undefined) && (
        <div className="grid grid-cols-3 gap-3">
          {/* HRV Metric */}
          {metrics.hrv !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <SpatialIcon
                Icon={ICONS.Activity}
                size={20}
                style={{ color: '#8B5CF6' }}
              />
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-white tabular-nums">
                  {Math.round(metrics.hrv)}
                </span>
                <span className="text-xs text-white/50">ms</span>
              </div>
              <span className="text-xs text-white/60 font-medium">
                HRV
              </span>
            </motion.div>
          )}

          {/* Resting HR Metric */}
          {metrics.restingHeartRate !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <SpatialIcon
                Icon={ICONS.Heart}
                size={20}
                style={{ color: '#EF4444' }}
              />
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-white tabular-nums">
                  {Math.round(metrics.restingHeartRate)}
                </span>
                <span className="text-xs text-white/50">bpm</span>
              </div>
              <span className="text-xs text-white/60 font-medium">
                FC Repos
              </span>
            </motion.div>
          )}

          {/* Sleep Metric */}
          {metrics.sleepHours !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <SpatialIcon
                Icon={ICONS.Moon}
                size={20}
                style={{ color: '#3B82F6' }}
              />
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-white tabular-nums">
                  {metrics.sleepHours.toFixed(1)}
                </span>
                <span className="text-xs text-white/50">h</span>
              </div>
              <span className="text-xs text-white/60 font-medium">
                Sommeil
              </span>
            </motion.div>
          )}
        </div>
      )}

      {/* Data Quality Indicator */}
      <div
        className="flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-medium"
        style={{
          background: `color-mix(in srgb, ${getDataQualityColor(dataQuality)} 8%, transparent)`,
          border: `1px solid color-mix(in srgb, ${getDataQualityColor(dataQuality)} 20%, transparent)`,
          color: getDataQualityColor(dataQuality)
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: getDataQualityColor(dataQuality),
            boxShadow: `0 0 6px ${getDataQualityColor(dataQuality)}80`
          }}
        />
        Qualité des données:{' '}
        {dataQuality === 'excellent' ? 'Excellente' :
         dataQuality === 'good' ? 'Bonne' :
         dataQuality === 'fair' ? 'Correcte' : 'Faible'}
      </div>

      {/* Explanation */}
      <div
        className="p-3 rounded-lg text-xs text-white/60 leading-relaxed"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        <span className="text-white/80 font-medium">Basé sur vos données physiologiques:</span>
        {' '}Le score de récupération combine votre variabilité cardiaque (HRV), votre fréquence cardiaque au repos et la qualité de votre sommeil pour évaluer votre état de forme.
      </div>
    </div>
  );
};

export default WearableRecoveryGauge;

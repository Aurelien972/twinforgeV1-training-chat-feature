/**
 * TodayStatusWidget Component
 * Displays instant readiness status for training
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import { RecoveryGauge } from '../recovery';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { trainingTodayService } from '../../../../system/services/trainingTodayService';
import type { TodayStatus } from '../../../../domain/trainingToday';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

const TRAINING_COLOR = TRAINING_COLORS.wellness;

const TodayStatusWidget: React.FC = () => {
  const [status, setStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const todayStatus = await trainingTodayService.getTodayStatus();
        setStatus(todayStatus);
      } catch (error) {
        console.error('Error loading today status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  if (loading || !status) {
    return (
      <GlassCard className="p-6" style={{ minHeight: '280px' }}>
        <div className="text-white/60 text-center">Chargement du statut...</div>
      </GlassCard>
    );
  }

  const getStatusColor = () => {
    if (status.readinessStatus === 'ready') return '#22C55E';
    if (status.readinessStatus === 'recovering') return '#F59E0B';
    return '#EF4444';
  };

  const getStatusText = () => {
    if (status.readinessStatus === 'ready') return 'PRÊT';
    if (status.readinessStatus === 'recovering') return 'EN RÉCUPÉRATION';
    return 'REPOS RECOMMANDÉ';
  };

  const getStatusIcon = () => {
    if (status.readinessStatus === 'ready') return ICONS.CheckCircle;
    if (status.readinessStatus === 'recovering') return ICONS.Clock;
    return ICONS.AlertCircle;
  };

  const getEnergyColor = () => {
    if (status.estimatedEnergy >= 8) return '#22C55E';
    if (status.estimatedEnergy >= 5) return '#F59E0B';
    return '#EF4444';
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.1,
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${TRAINING_COLOR} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent)`
        }}
      >
        {/* Header with Status Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GlowIcon icon="Activity" color={TRAINING_COLOR} size="small" />
            <div>
              <h3 className="text-lg font-bold text-white">Statut du Jour</h3>
              <p className="text-white/60 text-sm">Votre préparation à l'entraînement</p>
            </div>
          </div>

          {/* Status Badge */}
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="px-3 py-1.5 rounded-full flex items-center gap-2 cursor-default"
            style={{
              background: `color-mix(in srgb, ${getStatusColor()} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${getStatusColor()} 30%, transparent)`,
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <SpatialIcon
                Icon={getStatusIcon()}
                size={14}
                style={{ color: getStatusColor() }}
              />
            </motion.div>
            <span className="text-xs font-bold" style={{ color: getStatusColor() }}>
              {getStatusText()}
            </span>
          </motion.div>
        </div>

        {/* Recovery Gauges */}
        <div className="grid grid-cols-2 gap-4">
          <RecoveryGauge
            percentage={status.recovery.muscular}
            label="Muscles"
          />
          <RecoveryGauge
            percentage={status.recovery.systemic}
            label="Système"
          />
        </div>

        {/* Energy Available */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70 font-medium">Énergie Disponible</span>
            <span
              className="text-2xl font-bold"
              style={{
                color: getEnergyColor(),
                textShadow: `0 0 20px ${getEnergyColor()}50`
              }}
            >
              {status.estimatedEnergy}/10
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
          >
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: `${status.estimatedEnergy * 10}%`,
                opacity: 1
              }}
              transition={{
                width: {
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.3
                },
                opacity: {
                  duration: 0.5,
                  delay: 0.2
                }
              }}
              className="h-full rounded-full relative overflow-hidden"
              style={{
                background: `linear-gradient(90deg, ${getEnergyColor()}, ${TRAINING_COLOR})`,
                boxShadow: `0 0 12px ${getEnergyColor()}60`,
                willChange: 'width',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)'
              }}
            >
              {/* Animated shimmer effect */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)'
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                  repeatDelay: 1
                }}
              />
            </motion.div>
          </div>
        </div>

      </GlassCard>
    </motion.div>
  );
};

export default TodayStatusWidget;

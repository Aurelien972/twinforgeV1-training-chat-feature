import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import RecoveryGauge from './RecoveryGauge';
import { WearableRecoveryGauge } from './WearableRecoveryGauge';
import OptimalWindowDisplay from './OptimalWindowDisplay';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { RecoveryData } from '../../../../system/services/step5RecommendationService';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

interface RecoveryStatusCardProps {
  recoveryData: RecoveryData;
  stepColor: string;
}

const RecoveryStatusCard: React.FC<RecoveryStatusCardProps> = ({ recoveryData, stepColor = TRAINING_COLORS.recovery }) => {
  const hasWearableData = recoveryData.wearableData?.hasWearableData;
  const wearableData = recoveryData.wearableData;

  return (
    <GlassCard style={{ background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`, border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`, boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent)`, padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <GlowIcon icon="Activity" color={stepColor} size="small" />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '4px' }}>
            Statut de Récupération
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
            {hasWearableData ? 'Basé sur vos données physiologiques' : 'Votre état de forme actuel'}
          </p>
        </div>

        {/* Wearable Badge */}
        {hasWearableData && wearableData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: '12px',
              fontWeight: '500',
              color: '#60A5FA'
            }}
          >
            <SpatialIcon
              Icon={ICONS.Watch}
              size={14}
              style={{ color: '#60A5FA' }}
            />
            Recovery Insights from {wearableData.deviceName}
          </motion.div>
        )}
      </div>

      {/* Recovery Display - Wearable or Standard */}
      {hasWearableData && wearableData?.recoveryScore !== undefined ? (
        <div style={{ marginBottom: '32px' }}>
          <WearableRecoveryGauge
            recoveryScore={wearableData.recoveryScore}
            deviceName={wearableData.deviceName || 'Wearable Device'}
            metrics={{
              hrv: wearableData.hrv,
              restingHeartRate: wearableData.restingHeartRate,
              sleepHours: wearableData.sleepHours
            }}
            dataQuality={wearableData.dataQuality}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <RecoveryGauge percentage={recoveryData.muscularRecovery} label="Muscles" />
          <RecoveryGauge percentage={recoveryData.systemicRecovery} label="Système" />
        </div>
      )}

      {/* Optimal Windows */}
      <OptimalWindowDisplay morningWindow={recoveryData.optimalWindows.morning} eveningWindow={recoveryData.optimalWindows.evening} stepColor={stepColor} />
    </GlassCard>
  );
};

export default RecoveryStatusCard;

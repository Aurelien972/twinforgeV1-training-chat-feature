/**
 * NextActionRecommendationCard Component
 * Hero card displaying the main AI-generated recommendation
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { Recommendation } from '../../../config/step5RecommendationLogic';
import type { RecoveryData } from '../../../../system/services/step5RecommendationService';
import { Haptics } from '../../../../utils/haptics';
import TrainingButton from '../../../../app/pages/Training/Pipeline/components/TrainingButton';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

interface NextActionRecommendationCardProps {
  recommendation: Recommendation;
  stepColor?: string;
  onAccept: () => void;
  wearableRecoveryData?: RecoveryData['wearableData'];
}

const NextActionRecommendationCard: React.FC<NextActionRecommendationCardProps> = ({
  recommendation,
  stepColor = TRAINING_COLORS.recommendations,
  onAccept,
  wearableRecoveryData
}) => {
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatRelativeTime = (date: Date | null): string => {
    if (!date) return '';
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.round(diff / (1000 * 60 * 60));

    if (hours < 24) return `Dans ${hours}h`;
    const days = Math.round(hours / 24);
    return `Dans ${days}j`;
  };

  const handleAccept = () => {
    Haptics.success();
    onAccept();
  };

  return (
    <GlassCard
      className="space-y-6"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 60%),
          radial-gradient(circle at 70% 70%, color-mix(in srgb, ${recommendation.color} 10%, transparent) 0%, transparent 60%),
          rgba(255, 255, 255, 0.08)
        `,
        border: `2px solid color-mix(in srgb, ${stepColor} 25%, transparent)`,
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.3),
          0 0 32px color-mix(in srgb, ${stepColor} 20%, transparent),
          inset 0 1px 0 rgba(255, 255, 255, 0.15)
        `,
        padding: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Hero Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.2
        }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px'
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: `
              radial-gradient(circle at 30% 30%, ${recommendation.color}40 0%, transparent 70%),
              rgba(255, 255, 255, 0.1)
            `,
            border: `2px solid ${recommendation.color}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `
              0 8px 24px ${recommendation.color}30,
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <SpatialIcon
            Icon={ICONS[recommendation.icon as keyof typeof ICONS]}
            size={44}
            style={{
              color: recommendation.color,
              filter: `drop-shadow(0 0 16px ${recommendation.color}80)`
            }}
          />
        </motion.div>
      </motion.div>

      {/* Title & Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          textAlign: 'center',
          marginBottom: '16px'
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.98)',
            marginBottom: '8px',
            lineHeight: 1.2
          }}
        >
          {recommendation.title}
        </h2>
        <div
          style={{
            fontSize: '16px',
            color: recommendation.color,
            fontWeight: 600,
            textShadow: `0 0 12px ${recommendation.color}50`
          }}
        >
          {formatRelativeTime(recommendation.recommendedDate)} • {formatDate(recommendation.recommendedDate)}
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            margin: 0
          }}
        >
          {recommendation.description}
        </p>

        {/* Wearable Justification Badge */}
        {wearableRecoveryData?.hasWearableData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              maxWidth: '400px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <SpatialIcon
                Icon={ICONS.Watch}
                size={16}
                style={{ color: '#60A5FA' }}
              />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#60A5FA',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                Basé sur vos données physiologiques
              </span>
            </div>
            <p
              style={{
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
                margin: 0
              }}
            >
              {wearableRecoveryData.hrv !== undefined && wearableRecoveryData.sleepHours !== undefined ? (
                <>
                  Votre HRV de <strong>{Math.round(wearableRecoveryData.hrv)} ms</strong> et{' '}
                  <strong>{wearableRecoveryData.sleepHours.toFixed(1)}h de sommeil</strong> indiquent que{' '}
                  {wearableRecoveryData.recoveryScore && wearableRecoveryData.recoveryScore < 60 ? (
                    'votre corps a besoin de récupération'
                  ) : (
                    'vous êtes prêt pour l\'entraînement'
                  )}
                </>
              ) : wearableRecoveryData.recoveryScore !== undefined ? (
                <>
                  Score de récupération: <strong>{Math.round(wearableRecoveryData.recoveryScore)}/100</strong>
                </>
              ) : (
                'Votre corps a besoin de récupération'
              )}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Confidence indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '24px'
        }}
      >
        <div
          style={{
            height: '4px',
            flex: 1,
            maxWidth: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${recommendation.confidence * 100}%` }}
            transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${recommendation.color}, ${stepColor})`,
              borderRadius: '2px',
              boxShadow: `0 0 8px ${recommendation.color}60`
            }}
          />
        </div>
        <span
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: 500
          }}
        >
          Confiance: {Math.round(recommendation.confidence * 100)}%
        </span>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <TrainingButton
          variant="primary"
          size="lg"
          icon="CheckCircle"
          iconPosition="right"
          onClick={handleAccept}
          fullWidth
          stepColor={stepColor}
        >
          Accepter et Planifier
        </TrainingButton>
      </motion.div>
    </GlassCard>
  );
};

export default NextActionRecommendationCard;

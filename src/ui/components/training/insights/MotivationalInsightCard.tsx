/**
 * MotivationalInsightCard Component
 * Displays personalized motivational insights and messages
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import { ICONS } from '../../../icons/registry';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

interface MotivationalInsightCardProps {
  message: string;
  category: 'strength' | 'endurance' | 'consistency' | 'recovery';
  stepColor?: string;
}

const categoryConfig = {
  strength: {
    icon: ICONS.Zap,
    label: 'Force'
  },
  endurance: {
    icon: ICONS.Heart,
    label: 'Endurance'
  },
  consistency: {
    icon: ICONS.Target,
    label: 'Régularité'
  },
  recovery: {
    icon: ICONS.Moon,
    label: 'Récupération'
  }
};

const MotivationalInsightCard: React.FC<MotivationalInsightCardProps> = ({
  message,
  category,
  stepColor = TRAINING_COLORS.motivation
}) => {
  const config = categoryConfig[category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20
      }}
    >
      <GlassCard
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent)`,
          padding: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${stepColor}, transparent)`,
            boxShadow: `0 0 12px ${stepColor}80`
          }}
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <GlowIcon icon={category === 'strength' ? 'Zap' : category === 'endurance' ? 'Heart' : category === 'consistency' ? 'Target' : 'Moon'} color={stepColor} size="small" />
            <div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'rgba(255, 255, 255, 0.95)',
                  marginBottom: '4px'
                }}
              >
                {config.label}
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0
                }}
              >
                Message personnalisé
              </p>
            </div>
          </div>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              fontWeight: 500
            }}
          >
            {message}
          </p>
        </div>

        <motion.div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${stepColor}15, transparent 70%)`,
            filter: 'blur(20px)',
            pointerEvents: 'none'
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </GlassCard>
    </motion.div>
  );
};

export default MotivationalInsightCard;

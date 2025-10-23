/**
 * SessionSummaryStats Component
 * Displays 4 key summary statistics before starting a training session
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import type { IconName } from '../../../icons/registry';
import type { SessionPrescription } from '../../../../system/store/trainingPipeline/types';

interface SessionSummaryStatsProps {
  prescription: SessionPrescription;
  stepColor: string;
}

const SessionSummaryStats: React.FC<SessionSummaryStatsProps> = ({
  prescription,
  stepColor,
}) => {
  // Truncate text to avoid overflow
  const truncateText = (text: string, maxLength: number = 10) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };

  const stats = [
    {
      icon: 'Dumbbell' as IconName,
      label: 'Exercices',
      value: prescription.exercises.length.toString(),
      color: stepColor,
    },
    {
      icon: 'Clock' as IconName,
      label: 'Durée cible',
      value: `${prescription.durationTarget}min`,
      color: stepColor,
    },
    {
      icon: 'Flame' as IconName,
      label: 'Séance',
      value: prescription.sessionName
        ? truncateText(prescription.sessionName, 18)
        : truncateText(prescription.type, 12),
      color: stepColor,
    },
    {
      icon: 'Target' as IconName,
      label: 'Focus Principal',
      value: prescription.focus.length > 0
        ? truncateText(prescription.focus[0], 16)
        : 'Complet',
      color: stepColor,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <GlassCard
            className="p-4 text-center"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stat.color} 12%, transparent) 0%, transparent 65%),
                rgba(255, 255, 255, 0.06)
              `,
              border: `1.5px solid color-mix(in srgb, ${stat.color} 18%, rgba(255, 255, 255, 0.12))`,
              borderRadius: '16px',
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              boxShadow: `
                0 4px 16px rgba(0, 0, 0, 0.15),
                0 0 20px color-mix(in srgb, ${stat.color} 8%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.12)
              `,
            }}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              className="mb-3 flex justify-center"
            >
              <GlowIcon
                icon={stat.icon}
                color={stat.color}
                size="medium"
                glowIntensity={40}
              />
            </motion.div>
            <div
              className="text-xl sm:text-2xl font-bold text-white mb-1 truncate px-1"
              style={{
                letterSpacing: '-0.02em',
                textShadow: `0 0 16px color-mix(in srgb, ${stat.color} 30%, transparent)`,
                fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
              }}
            >
              {stat.value}
            </div>
            <div
              className="text-xs text-white/60 font-semibold uppercase tracking-wider truncate px-1"
              style={{
                fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
              }}
            >
              {stat.label}
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};

export default SessionSummaryStats;

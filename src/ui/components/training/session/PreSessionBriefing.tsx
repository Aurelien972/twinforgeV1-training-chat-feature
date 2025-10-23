/**
 * PreSessionBriefing Component
 * Rich pre-session briefing with session name, summary, and motivational coaching
 * VisionOS 26 Design
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { SessionPrescription } from '../../../../system/store/trainingPipeline/types';
import {
  getCoachMotivationalMessage,
  calculateAvgRPE,
  calculateTotalSets,
  getSessionEmoji,
  getIntensityLabel,
  getIntensityColor
} from '../../../../utils/coachMessages';

interface PreSessionBriefingProps {
  prescription: SessionPrescription;
  stepColor: string;
}

const PreSessionBriefing: React.FC<PreSessionBriefingProps> = ({
  prescription,
  stepColor
}) => {
  const sessionTitle = prescription.sessionName || prescription.type || 'Séance du jour';
  const coachMessage = getCoachMotivationalMessage(prescription);
  const avgRPE = calculateAvgRPE(prescription);
  const totalSets = calculateTotalSets(prescription);
  const emoji = getSessionEmoji(prescription);
  const intensityLabel = getIntensityLabel(avgRPE);
  const intensityColor = getIntensityColor(avgRPE);

  return (
    <div className="space-y-6 mb-8">
      {/* Main Briefing Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlassCard
          className="p-8 text-center relative overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
              rgba(255, 255, 255, 0.06)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.15))`,
            borderRadius: '24px',
            backdropFilter: 'blur(16px) saturate(150%)',
            WebkitBackdropFilter: 'blur(16px) saturate(150%)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.2),
              0 0 40px color-mix(in srgb, ${stepColor} 12%, transparent),
              inset 0 2px 0 rgba(255, 255, 255, 0.15)
            `
          }}
        >
          {/* Icon with breathing animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <div
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 60%),
                  linear-gradient(135deg, color-mix(in srgb, ${stepColor} 40%, transparent), color-mix(in srgb, ${stepColor} 30%, transparent))
                `,
                border: `2px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                boxShadow: `0 0 40px color-mix(in srgb, ${stepColor} 50%, transparent)`
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <SpatialIcon
                  Icon={ICONS.Dumbbell}
                  size={48}
                  className="text-white"
                  style={{
                    filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 60%, transparent))`
                  }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Session Title */}
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{
              letterSpacing: '-0.02em',
              textShadow: `0 0 24px color-mix(in srgb, ${stepColor} 40%, transparent)`
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {sessionTitle} {emoji}
          </motion.h2>

          {/* Coach Message */}
          <motion.p
            className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {coachMessage}
          </motion.p>

          {/* Quick Stats Pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Intensity Pill */}
            <div
              className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                background: `
                  linear-gradient(135deg, ${intensityColor}40, ${intensityColor}30),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `1.5px solid ${intensityColor}60`,
                boxShadow: `0 0 20px ${intensityColor}30`
              }}
            >
              {intensityLabel} • RPE {avgRPE}
            </div>

            {/* Volume Pill */}
            <div
              className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                background: `
                  linear-gradient(135deg, color-mix(in srgb, ${stepColor} 40%, transparent), color-mix(in srgb, ${stepColor} 30%, transparent)),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                boxShadow: `0 0 20px color-mix(in srgb, ${stepColor} 30%, transparent)`
              }}
            >
              {totalSets} séries
            </div>

            {/* Duration Pill */}
            <div
              className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                background: `
                  linear-gradient(135deg, color-mix(in srgb, ${stepColor} 40%, transparent), color-mix(in srgb, ${stepColor} 30%, transparent)),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                boxShadow: `0 0 20px color-mix(in srgb, ${stepColor} 30%, transparent)`
              }}
            >
              {prescription.durationTarget}min
            </div>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default PreSessionBriefing;

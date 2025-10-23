/**
 * PreparationCountdown Component
 * Full-screen countdown timer (10, 9, 8... Go) before starting a new exercise
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import { Haptics } from '../../../../utils/haptics';
import { countdownTick, countdownGo } from '../../../../audio';

interface PreparationCountdownProps {
  duration: number;
  exerciseName: string;
  exerciseVariant?: string;
  onComplete: () => void;
  stepColor: string;
}

const PreparationCountdown: React.FC<PreparationCountdownProps> = ({
  duration = 10,
  exerciseName,
  exerciseVariant,
  onComplete,
  stepColor,
}) => {
  const [countdown, setCountdown] = useState(duration);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (countdown === 0) {
      setIsComplete(true);
      // Double success haptic for GO
      Haptics.success();
      // Play energetic GO sound
      countdownGo();
      setTimeout(() => {
        onComplete();
      }, 400);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
      // Play countdown tick sound with increasing urgency
      countdownTick(countdown - 1, duration);
      // Progressive haptic intensity: stronger as countdown decreases
      if (countdown <= 3) {
        // Heavy impact for final countdown
        Haptics.impact();
      } else if (countdown <= 5) {
        // Medium impact for mid countdown
        Haptics.press();
      } else {
        // Light tap for early countdown
        Haptics.tap();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete, duration]);

  const progress = ((duration - countdown) / duration) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="w-full max-w-md">
        <GlassCard
          className="p-10 text-center space-y-8 relative overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 50% 30%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 70%),
              rgba(15, 15, 15, 0.95)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 40%, rgba(255, 255, 255, 0.2))`,
            boxShadow: `
              0 20px 60px rgba(0, 0, 0, 0.6),
              0 0 60px color-mix(in srgb, ${stepColor} 25%, transparent),
              inset 0 1px 0 rgba(255, 255, 255, 0.15)
            `,
          }}
        >
          {/* Animated Background Pulse */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 70%)`,
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Exercise Info */}
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <GlowIcon
                  icon="Dumbbell"
                  color={stepColor}
                  size="large"
                  glowIntensity={60}
                  animate={true}
                />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
              {exerciseName}
            </h2>
            {exerciseVariant && (
              <p className="text-lg text-white/60 font-medium">{exerciseVariant}</p>
            )}
          </div>

          {/* Countdown Display */}
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {!isComplete ? (
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="text-9xl font-bold"
                  style={{
                    color: countdown <= 3 ? '#EF4444' : stepColor,
                    letterSpacing: '-0.05em',
                    lineHeight: '1',
                    textShadow: countdown <= 3
                      ? '0 0 60px rgba(239, 68, 68, 0.8)'
                      : `0 0 60px color-mix(in srgb, ${stepColor} 80%, transparent)`,
                  }}
                >
                  {countdown}
                </motion.div>
              ) : (
                <motion.div
                  key="go"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="text-9xl font-bold"
                  style={{
                    color: '#22C55E',
                    letterSpacing: '-0.05em',
                    lineHeight: '1',
                    textShadow: '0 0 60px rgba(34, 197, 94, 0.8)',
                  }}
                >
                  GO!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="relative z-10 mt-6">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isComplete
                    ? 'linear-gradient(90deg, #22C55E, #10B981)'
                    : countdown <= 3
                    ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                    : `linear-gradient(90deg, ${stepColor}, color-mix(in srgb, ${stepColor} 70%, white))`,
                  boxShadow: isComplete
                    ? '0 0 20px rgba(34, 197, 94, 0.6)'
                    : countdown <= 3
                    ? '0 0 20px rgba(239, 68, 68, 0.6)'
                    : `0 0 20px color-mix(in srgb, ${stepColor} 60%, transparent)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            <p className="text-sm text-white/50 mt-3 font-medium">Préparez-vous...</p>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default PreparationCountdown;

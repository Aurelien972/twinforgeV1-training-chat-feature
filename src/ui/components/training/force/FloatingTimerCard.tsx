/**
 * FloatingTimerCard Component
 * Non-sticky timer card with dynamic summary display
 * Positioned between TrainingProgressHeader and ExerciseSessionCard
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import GlowIcon from '../GlowIcon';
import { ICONS } from '../../../icons/registry';

interface FloatingTimerCardProps {
  sessionTime: number;
  restTime: number;
  isResting: boolean;
  formatTime: (seconds: number) => string;
  stepColor: string;
  currentExerciseIndex: number;
  totalExercises: number;
  isSessionRunning: boolean;
  onPlayPause: () => void;
}

const FloatingTimerCard: React.FC<FloatingTimerCardProps> = ({
  sessionTime,
  restTime,
  isResting,
  formatTime,
  stepColor,
  currentExerciseIndex,
  totalExercises,
  isSessionRunning,
  onPlayPause,
}) => {
  const displayTime = isResting ? restTime : sessionTime;
  const displayLabel = isResting ? 'Repos' : 'Session';
  const displayColor = isResting ? '#22C55E' : stepColor;
  const displayIcon = isResting ? ICONS.Timer : ICONS.Play;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full px-4 mb-6"
    >
      <GlassCard
        className="p-4"
        style={{
          background: `
            radial-gradient(circle at 50% 20%, color-mix(in srgb, ${displayColor} 15%, transparent) 0%, transparent 65%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${displayColor} 25%, rgba(255, 255, 255, 0.15))`,
          borderRadius: '24px',
          backdropFilter: 'blur(16px) saturate(150%)',
          WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.25),
            0 0 40px color-mix(in srgb, ${displayColor} 15%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `,
        }}
      >
        <div className="space-y-3">
          {/* Exercise Progress Indicator - Always visible */}
          <div className="flex items-center justify-center gap-2">
            <div
              className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{
                background: `color-mix(in srgb, ${displayColor} 15%, rgba(255, 255, 255, 0.08))`,
                border: `1px solid color-mix(in srgb, ${displayColor} 30%, transparent)`,
                color: displayColor,
                textShadow: `0 0 10px color-mix(in srgb, ${displayColor} 40%, transparent)`,
              }}
            >
              Exercice {currentExerciseIndex + 1}/{totalExercises}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4" style={{ marginTop: '12px' }}>
          {/* Play/Pause Button */}
          <motion.button
            onClick={onPlayPause}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 cursor-pointer"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              outline: 'none'
            }}
            aria-label={isSessionRunning ? "Mettre en pause" : "Reprendre"}
          >
            <motion.div
              animate={
                isSessionRunning
                  ? isResting
                    ? { scale: [1, 1.08, 1] }
                    : { scale: [1, 1.05, 1] }
                  : { scale: 1 }
              }
              transition={{
                duration: isResting ? 1.5 : 2,
                repeat: isSessionRunning ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <GlowIcon
                icon={isResting ? "Timer" : (isSessionRunning ? "Pause" : "Play")}
                color={displayColor}
                size="large"
                glowIntensity={45}
                animate={isSessionRunning}
              />
            </motion.div>
          </motion.button>

          {/* Timer Display with Smooth Transition */}
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayLabel}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div
                  className="text-4xl font-bold"
                  style={{
                    color: displayColor,
                    letterSpacing: '-0.03em',
                    lineHeight: '1',
                    textShadow: `0 0 24px color-mix(in srgb, ${displayColor} 40%, transparent)`,
                    marginBottom: '4px',
                  }}
                >
                  {isResting ? `${displayTime}s` : formatTime(displayTime)}
                </div>
                <div
                  className="font-semibold uppercase tracking-wider"
                  style={{
                    fontSize: '11px',
                    color: `color-mix(in srgb, ${displayColor} 80%, white)`,
                  }}
                >
                  {isResting ? 'Temps de repos' : displayLabel}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Ring Indicator - Always visible */}
          <motion.div
            className="flex-shrink-0 relative"
            style={{
              width: '56px',
              height: '56px',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <div
              className="w-full h-full rounded-2xl flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, color-mix(in srgb, ${displayColor} 25%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.1)
                `,
                border: `2px solid color-mix(in srgb, ${displayColor} 30%, transparent)`,
                boxShadow: `
                  0 4px 16px color-mix(in srgb, ${displayColor} 20%, transparent),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <svg className="w-12 h-12 -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="3"
                />
                {isResting ? (
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    fill="none"
                    stroke={displayColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="100"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 100 }}
                    transition={{ duration: restTime, ease: 'linear' }}
                    style={{
                      filter: `drop-shadow(0 0 8px ${displayColor})`,
                    }}
                  />
                ) : (
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    fill="none"
                    stroke={displayColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="100"
                    animate={
                      isSessionRunning
                        ? {
                            strokeDashoffset: [0, -100],
                            opacity: [0.8, 1, 0.8]
                          }
                        : {
                            strokeDashoffset: 0,
                            opacity: 0.6
                          }
                    }
                    transition={{
                      duration: 3,
                      repeat: isSessionRunning ? Infinity : 0,
                      ease: 'linear'
                    }}
                    style={{
                      filter: `drop-shadow(0 0 8px ${displayColor})`,
                    }}
                  />
                )}
              </svg>
              <div
                className="absolute inset-0 flex items-center justify-center font-bold"
                style={{
                  color: displayColor,
                  fontSize: '12px',
                  textShadow: `0 0 12px color-mix(in srgb, ${displayColor} 50%, transparent)`
                }}
              >
                {isResting ? restTime : '•'}
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default FloatingTimerCard;

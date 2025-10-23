/**
 * Training Progress Header
 * Premium GlassCard-based progress indicator with dynamic titles and responsive design
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../../ui/icons/SpatialIcon';
import GlowIcon from '../../../../../ui/components/training/GlowIcon';
import { ICONS } from '../../../../../ui/icons/registry';
import type { TrainingPipelineStep, TrainingPipelineStepId } from '../../../../../system/store/trainingPipeline';
import { STEP_COLORS } from '../../../../../system/store/trainingPipeline';

interface TrainingProgressHeaderProps {
  steps: TrainingPipelineStep[];
  currentStep: TrainingPipelineStepId;
  progress: number;
  className?: string;
  // Session mode props (for Step 3)
  sessionMode?: boolean;
  sessionTime?: number;
  restTime?: number;
  isResting?: boolean;
  isSessionRunning?: boolean;
  formatTime?: (seconds: number) => string;
  onPlayPause?: () => void;
  onStop?: () => void;
  currentExerciseIndex?: number;
  totalExercises?: number;
}

const TrainingProgressHeader: React.FC<TrainingProgressHeaderProps> = ({
  steps,
  currentStep,
  progress,
  className = '',
  sessionMode = false,
  sessionTime = 0,
  restTime = 0,
  isResting = false,
  isSessionRunning = false,
  formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`,
  onPlayPause,
  onStop,
  currentExerciseIndex = 0,
  totalExercises = 0
}) => {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const currentStepData = steps[currentStepIndex];
  const stepColor = STEP_COLORS[currentStep];

  const displayTime = isResting ? restTime : sessionTime;
  const displayLabel = isResting ? 'Repos' : 'Session';
  const displayColor = isResting ? '#22C55E' : stepColor;
  const displayIcon = isResting ? ICONS.Timer : (isSessionRunning ? ICONS.Pause : ICONS.Play);

  return (
    <div className={`training-progress-header ${className}`}>
      <GlassCard
        className="p-4 md:p-5"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 28%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 50%),
            color-mix(in srgb, ${stepColor} 12%, transparent)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 50px color-mix(in srgb, ${stepColor} 35%, transparent),
            inset 0 2px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)'
        }}
      >
        {/* Header Row: Icon, Title/Subtitle, Step Badge */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Decorative Icon with Pulse Animation */}
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.9, 1, 0.9]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="relative flex-shrink-0"
            >
              <div
                className="w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center"
                style={{
                  background: `
                    radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 50%, transparent) 0%, transparent 70%),
                    radial-gradient(circle at 70% 70%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 60%),
                    rgba(255, 255, 255, 0.15)
                  `,
                  border: `3px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                  boxShadow: `
                    0 12px 48px color-mix(in srgb, ${stepColor} 55%, transparent),
                    0 0 90px color-mix(in srgb, ${stepColor} 50%, transparent),
                    0 0 130px color-mix(in srgb, ${stepColor} 35%, transparent),
                    inset 0 2px 0 rgba(255, 255, 255, 0.3)
                  `,
                  backdropFilter: 'blur(16px) saturate(170%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(170%)'
                }}
              >
                <SpatialIcon
                  Icon={ICONS.Sparkles}
                  size={68}
                  variant="pure"
                  style={{
                    color: stepColor,
                    filter: `drop-shadow(0 0 28px color-mix(in srgb, ${stepColor} 90%, transparent))`
                  }}
                />
              </div>
            </motion.div>

            {/* Dynamic Title and Subtitle */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 min-w-0"
            >
              <h2
                className="text-xl md:text-2xl font-bold text-white mb-1"
                style={{
                  textShadow: `0 0 30px color-mix(in srgb, ${stepColor} 50%, transparent)`
                }}
              >
                {currentStepData.label}
              </h2>
              <p
                className="text-sm md:text-base text-white/70"
                style={{
                  color: `color-mix(in srgb, #E5E7EB 85%, ${stepColor} 15%)`
                }}
              >
                {currentStepData.description}
              </p>
            </motion.div>
          </div>

          {/* Dynamic Step Badge */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <div
              className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-sm md:text-base font-semibold text-white whitespace-nowrap"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 45%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.12)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 50%, transparent)`,
                boxShadow: `
                  0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
                textShadow: `0 0 16px color-mix(in srgb, ${stepColor} 60%, transparent)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            >
              Étape {currentStepIndex + 1}/5
            </div>
          </motion.div>
        </div>

        {/* Global Progress Bar */}
        <div className="relative w-full h-3 rounded-full overflow-hidden mb-5"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              background: `linear-gradient(90deg, ${stepColor}, color-mix(in srgb, ${stepColor} 80%, white))`,
              boxShadow: `0 0 20px color-mix(in srgb, ${stepColor} 50%, transparent)`
            }}
          />
        </div>

        {/* Step Indicators Grid - Responsive */}
        <div className="grid grid-cols-5 gap-3 md:gap-4 w-full mb-5">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            const Icon = ICONS[step.icon as keyof typeof ICONS];
            const iconStepColor = STEP_COLORS[step.id as TrainingPipelineStepId];

            return (
              <motion.div
                key={step.id}
                className="flex flex-col items-center"
                whileHover={isActive ? { scale: 1.05 } : undefined}
                transition={{ duration: 0.2 }}
              >
                {/* Micro GlassCard for Icon */}
                <div
                  className="relative w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300"
                  style={{
                    background: isCompleted
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))'
                      : isActive
                      ? `
                        radial-gradient(circle at 30% 30%, color-mix(in srgb, ${iconStepColor} 35%, transparent) 0%, transparent 60%),
                        radial-gradient(circle at 70% 70%, color-mix(in srgb, var(--brand-primary) 25%, transparent) 0%, transparent 50%),
                        rgba(255, 255, 255, 0.12)
                      `
                      : 'rgba(255, 255, 255, 0.06)',
                    border: isCompleted
                      ? '2px solid rgba(34, 197, 94, 0.6)'
                      : isActive
                      ? `2px solid color-mix(in srgb, ${iconStepColor} 60%, transparent)`
                      : '2px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: isCompleted
                      ? '0 4px 16px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      : isActive
                      ? `
                        0 8px 24px color-mix(in srgb, ${iconStepColor} 35%, transparent),
                        0 0 40px color-mix(in srgb, ${iconStepColor} 25%, transparent),
                        inset 0 2px 0 rgba(255, 255, 255, 0.2),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                      `
                      : '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(150%)'
                  }}
                >
                  {/* Icon or Check */}
                  {isCompleted ? (
                    <GlowIcon
                      icon="CheckCircle"
                      color="#22C55E"
                      size="small"
                      glowIntensity={50}
                    />
                  ) : (
                    <SpatialIcon
                      Icon={Icon}
                      size={20}
                      shape="square"
                      className={isActive ? 'text-white' : 'text-white/50'}
                      style={isActive ? {
                        color: iconStepColor,
                        filter: `drop-shadow(0 0 12px color-mix(in srgb, ${iconStepColor} 70%, transparent))`
                      } : undefined}
                    />
                  )}

                  {/* Pulsing Ring for Active Step */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.6, 0, 0.6]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      style={{
                        border: `2px solid ${iconStepColor}`,
                        boxShadow: `0 0 20px color-mix(in srgb, ${iconStepColor} 50%, transparent)`
                      }}
                    />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className="text-xs md:text-sm font-medium text-center leading-tight transition-all duration-300"
                  style={
                    isActive
                      ? {
                          color: stepColor,
                          textShadow: `0 0 12px color-mix(in srgb, ${stepColor} 50%, transparent)`
                        }
                      : isCompleted
                      ? { color: '#22C55E' }
                      : { color: 'rgba(255, 255, 255, 0.5)' }
                  }
                >
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Session Timer & Controls - Only in Session Mode - Positioned AFTER step indicators */}
        {sessionMode && onPlayPause && onStop && (
          <div className="mt-5">
            <div
              className="p-4 rounded-2xl"
              style={{
                background: `
                  radial-gradient(circle at 50% 20%, color-mix(in srgb, ${displayColor} 18%, transparent) 0%, transparent 65%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `2px solid color-mix(in srgb, ${displayColor} 30%, rgba(255, 255, 255, 0.15))`,
                borderRadius: '20px',
                backdropFilter: 'blur(16px) saturate(150%)',
                WebkitBackdropFilter: 'blur(16px) saturate(150%)',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.25),
                  0 0 40px color-mix(in srgb, ${displayColor} 18%, transparent),
                  inset 0 1px 0 rgba(255, 255, 255, 0.15)
                `,
              }}
            >
              {/* Exercise Progress Indicator */}
              {totalExercises > 0 && (
                <div className="flex items-center justify-center gap-2 mb-3">
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
              )}

              <div className="flex items-center justify-between gap-4">
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

                {/* Timer Display */}
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

                {/* Stop Button */}
                <motion.button
                  onClick={onStop}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: `
                      radial-gradient(circle at 30% 30%, color-mix(in srgb, #EF4444 25%, transparent) 0%, transparent 70%),
                      rgba(255, 255, 255, 0.1)
                    `,
                    border: `2px solid color-mix(in srgb, #EF4444 30%, transparent)`,
                    boxShadow: `
                      0 4px 16px color-mix(in srgb, #EF4444 20%, transparent),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2)
                    `,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  aria-label="Arrêter la séance"
                >
                  <SpatialIcon
                    Icon={ICONS.Square}
                    size={24}
                    style={{
                      color: '#EF4444',
                      filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))'
                    }}
                  />
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default TrainingProgressHeader;

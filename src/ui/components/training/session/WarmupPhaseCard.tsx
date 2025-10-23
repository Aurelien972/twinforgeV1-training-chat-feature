/**
 * WarmupPhaseCard Component
 * Interactive warmup execution phase with timer and optional skip
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { Haptics } from '../../../../utils/haptics';
import type { WarmupPrescription } from '../../../../system/store/trainingPipeline/types';

interface WarmupPhaseCardProps {
  warmup: WarmupPrescription;
  stepColor: string;
  onComplete: () => void;
  onSkip: () => void;
}

const WARMUP_COLOR = '#FF8C42';

const WarmupPhaseCard: React.FC<WarmupPhaseCardProps> = ({
  warmup,
  stepColor,
  onComplete,
  onSkip
}) => {
  const [timeRemaining, setTimeRemaining] = useState(warmup.duration * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const currentExercise = warmup.exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === warmup.exercises.length - 1;

  useEffect(() => {
    if (!isPaused && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            Haptics.success();
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPaused, timeRemaining, onComplete]);

  const handlePause = () => {
    setIsPaused(!isPaused);
    Haptics.tap();
  };

  const handleSkip = () => {
    Haptics.warning();
    onSkip();
  };

  const handleNextExercise = () => {
    if (!isLastExercise) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      Haptics.tap();
    } else {
      Haptics.success();
      onComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((warmup.duration * 60 - timeRemaining) / (warmup.duration * 60)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div className="max-w-2xl w-full">
        <GlassCard
          className="p-8"
          style={{
            background: `
              radial-gradient(circle at 50% 20%, color-mix(in srgb, ${WARMUP_COLOR} 18%, transparent) 0%, transparent 65%),
              rgba(20, 20, 20, 0.95)
            `,
            border: `2px solid color-mix(in srgb, ${WARMUP_COLOR} 35%, transparent)`,
            boxShadow: `
              0 20px 60px rgba(0, 0, 0, 0.5),
              0 0 50px color-mix(in srgb, ${WARMUP_COLOR} 25%, transparent)
            `
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: `
                    radial-gradient(circle at 30% 30%, color-mix(in srgb, ${WARMUP_COLOR} 35%, transparent) 0%, transparent 60%),
                    rgba(255, 255, 255, 0.15)
                  `,
                  border: `2px solid color-mix(in srgb, ${WARMUP_COLOR} 50%, transparent)`,
                  boxShadow: `0 4px 16px color-mix(in srgb, ${WARMUP_COLOR} 30%, transparent)`
                }}
              >
                <SpatialIcon
                  Icon={ICONS.Flame}
                  size={24}
                  style={{
                    color: WARMUP_COLOR,
                    filter: `drop-shadow(0 0 10px color-mix(in srgb, ${WARMUP_COLOR} 70%, transparent))`
                  }}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Échauffement</h2>
                <p className="text-white/70 text-sm">Mobilité articulaire</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-white/60">
                {currentExerciseIndex + 1} / {warmup.exercises.length}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <motion.div
                className="h-full"
                style={{
                  background: `linear-gradient(90deg, ${WARMUP_COLOR}, color-mix(in srgb, ${WARMUP_COLOR} 80%, white))`,
                  boxShadow: `0 0 12px color-mix(in srgb, ${WARMUP_COLOR} 60%, transparent)`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Current Exercise */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentExercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-6 rounded-xl"
              style={{
                background: `
                  radial-gradient(circle at 50% 20%, color-mix(in srgb, ${WARMUP_COLOR} 12%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.06)
                `,
                border: `1.5px solid color-mix(in srgb, ${WARMUP_COLOR} 25%, transparent)`
              }}
            >
              <h3 className="text-xl font-bold text-white mb-2">
                {currentExercise.name}
              </h3>
              <p className="text-white/80 mb-4">{currentExercise.instructions}</p>
              <div className="flex flex-wrap gap-2">
                {currentExercise.sets && currentExercise.reps && (
                  <div
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                    style={{
                      background: `color-mix(in srgb, ${WARMUP_COLOR} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${WARMUP_COLOR} 30%, transparent)`,
                      color: WARMUP_COLOR
                    }}
                  >
                    {currentExercise.sets} × {currentExercise.reps} reps
                  </div>
                )}
                {currentExercise.duration && (
                  <div
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                    style={{
                      background: `color-mix(in srgb, ${WARMUP_COLOR} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${WARMUP_COLOR} 30%, transparent)`,
                      color: WARMUP_COLOR
                    }}
                  >
                    {currentExercise.duration}s
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {/* Skip Button */}
            <motion.button
              onClick={handleSkip}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-3 rounded-xl font-semibold text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                color: '#EF4444'
              }}
            >
              Passer
            </motion.button>

            {/* Pause/Play Button */}
            <motion.button
              onClick={handlePause}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{
                background: `color-mix(in srgb, ${WARMUP_COLOR} 20%, transparent)`,
                border: `1.5px solid color-mix(in srgb, ${WARMUP_COLOR} 40%, transparent)`,
                color: WARMUP_COLOR
              }}
            >
              <SpatialIcon
                Icon={isPaused ? ICONS.Play : ICONS.Pause}
                size={16}
                style={{ color: WARMUP_COLOR }}
              />
              {isPaused ? 'Reprendre' : 'Pause'}
            </motion.button>

            {/* Next Button */}
            <motion.button
              onClick={handleNextExercise}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${WARMUP_COLOR}, color-mix(in srgb, ${WARMUP_COLOR} 80%, white))`,
                border: `1.5px solid color-mix(in srgb, ${WARMUP_COLOR} 60%, transparent)`,
                color: 'white',
                boxShadow: `0 4px 16px color-mix(in srgb, ${WARMUP_COLOR} 35%, transparent)`
              }}
            >
              {isLastExercise ? 'Terminer' : 'Suivant'}
              <SpatialIcon
                Icon={isLastExercise ? ICONS.Check : ICONS.ArrowRight}
                size={16}
                style={{ color: 'white' }}
              />
            </motion.button>
          </div>

          {/* Optional Tag */}
          {warmup.isOptional && (
            <div className="mt-4 text-center text-xs text-white/50">
              Cet échauffement est optionnel - Vous pouvez le passer
            </div>
          )}
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default WarmupPhaseCard;

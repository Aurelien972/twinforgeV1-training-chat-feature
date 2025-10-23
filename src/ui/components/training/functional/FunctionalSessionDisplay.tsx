/**
 * Functional Session Display - Refonte Complète
 * Affichage exercice par exercice avec navigation intuitive
 * Best practices CrossFit/Functional pour gestion rounds et progression
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SessionPrescription, Exercise } from '../../../../system/store/trainingPipeline/types';
import { Haptics } from '../../../../utils/haptics';
import logger from '../../../../lib/utils/logger';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import GlowIcon from '../GlowIcon';
import { ICONS } from '../../../icons/registry';
import { SessionFeedbackModal } from '../session';
import TrainingProgressHeader from '../../../../app/pages/Training/Pipeline/components/TrainingProgressHeader';
import { TRAINING_PIPELINE_STEPS } from '../../../../system/store/trainingPipeline';
import { CompactRepDisplay } from '../shared/RepDisplay';
import WearableTrackingBadge from '../WearableTrackingBadge';
import type { UseWearableTrackingReturn } from '../../../../hooks/useWearableTracking';
import { ExerciseIllustration } from '../illustrations';

const TrainingButton = React.lazy(() => import('../../../../app/pages/Training/Pipeline/components/TrainingButton'));

type WodFormat = 'amrap' | 'forTime' | 'emom' | 'tabata' | 'chipper' | 'ladder';
type SessionPhase = 'COUNTDOWN' | 'WARMUP' | 'MAIN_WOD' | 'COOLDOWN' | 'COMPLETED';

interface FunctionalSessionDisplayProps {
  sessionId: string;
  prescription: SessionPrescription & {
    wodFormat?: WodFormat;
    wodName?: string;
    timeCapMinutes?: number;
    targetRounds?: string;
    targetTimeMinutes?: string;
    exercises: Exercise[];
  };
  userId: string;
  onComplete: (metrics: any) => void;
  onExit: () => void;
  wearableTracking?: UseWearableTrackingReturn;
}

const FunctionalSessionDisplay: React.FC<FunctionalSessionDisplayProps> = ({
  sessionId,
  prescription,
  userId,
  onComplete,
  onExit,
  wearableTracking,
}) => {
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('COUNTDOWN');
  const [sessionTime, setSessionTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [repsTracking, setRepsTracking] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState(10);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepColor = '#10B981';

  const wodFormat = prescription.wodFormat || 'forTime';
  const timeCapSeconds = (prescription.timeCapMinutes || 20) * 60;
  const exercises = prescription.exercises || [];

  useEffect(() => {
    logger.info('FUNCTIONAL_SESSION', 'Session initialized', {
      sessionId,
      wodFormat,
      timeCapMinutes: prescription.timeCapMinutes,
      exercisesCount: exercises.length,
      wodName: prescription.wodName
    });
  }, []);

  // Timer management
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          if ((wodFormat === 'amrap' || wodFormat === 'forTime') && newTime >= timeCapSeconds) {
            handleSessionComplete();
            return timeCapSeconds;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, wodFormat, timeCapSeconds]);

  // Countdown before start
  useEffect(() => {
    if (sessionPhase === 'COUNTDOWN' && countdown > 0) {
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            startMainWod();
            return 0;
          }
          if (prev <= 3) {
            Haptics.impact('medium');
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [sessionPhase, countdown]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startMainWod = () => {
    logger.info('FUNCTIONAL_SESSION', 'Starting main WOD', { wodFormat });
    setSessionPhase('MAIN_WOD');
    setIsRunning(true);
    setSessionTime(0);
    Haptics.success();
  };

  const handlePlayPause = () => {
    if (isPaused || !isRunning) {
      setIsPaused(false);
      setIsRunning(true);
      Haptics.tap();
      logger.debug('FUNCTIONAL_SESSION', 'Session resumed', { sessionTime });
    } else {
      setIsPaused(true);
      Haptics.tap();
      logger.debug('FUNCTIONAL_SESSION', 'Session paused', { sessionTime });
    }
  };

  const handleStop = () => {
    setShowStopModal(true);
    Haptics.press();
  };

  const handleStopConfirm = () => {
    logger.info('FUNCTIONAL_SESSION', 'Session stopped by user', {
      sessionId,
      roundsCompleted,
      sessionTime,
      wodFormat
    });
    setIsRunning(false);
    setShowStopModal(false);
    Haptics.warning();
    onExit();
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      Haptics.tap();
      logger.info('FUNCTIONAL_SESSION', 'Moving to next exercise', {
        from: currentExerciseIndex,
        to: currentExerciseIndex + 1,
        exerciseName: exercises[currentExerciseIndex + 1].name,
        currentRound: roundsCompleted + 1
      });
    } else {
      // Last exercise, complete round
      handleRoundComplete();
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      Haptics.tap();
      logger.info('FUNCTIONAL_SESSION', 'Moving to previous exercise', {
        from: currentExerciseIndex,
        to: currentExerciseIndex - 1
      });
    }
  };

  const handleRoundComplete = () => {
    const newRounds = roundsCompleted + 1;
    setRoundsCompleted(newRounds);
    setCurrentExerciseIndex(0);
    Haptics.success();

    logger.info('FUNCTIONAL_SESSION', 'Round completed', {
      round: newRounds,
      sessionTime,
      wodFormat
    });

    // For 'forTime' WODs, check if we should auto-complete after target rounds
    if (wodFormat === 'forTime' && prescription.targetRounds) {
      const targetRoundsNum = parseInt(prescription.targetRounds);
      if (!isNaN(targetRoundsNum) && newRounds >= targetRoundsNum) {
        logger.info('FUNCTIONAL_SESSION', 'Target rounds reached - auto completing', {
          targetRounds: targetRoundsNum,
          completedRounds: newRounds
        });
        handleSessionComplete();
      }
    }
  };

  const handleSessionComplete = () => {
    logger.info('FUNCTIONAL_SESSION', 'handleSessionComplete called', {
      sessionId,
      roundsCompleted,
      totalTime: sessionTime,
      wodFormat,
      exercises: exercises.length,
      currentPhase: sessionPhase
    });

    // Stop timer immediately
    setIsRunning(false);
    setIsPaused(false);

    // Clear timer ref to prevent any race conditions
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Update phase FIRST
    setSessionPhase('COMPLETED');
    Haptics.success();

    logger.info('FUNCTIONAL_SESSION', 'WOD completed, showing feedback modal', {
      sessionId,
      roundsCompleted,
      totalTime: sessionTime,
      wodFormat
    });

    // Show feedback modal with a small delay to ensure state is updated
    setTimeout(() => {
      setShowFeedbackModal(true);
      logger.info('FUNCTIONAL_SESSION', 'Feedback modal state set to true');
    }, 100);
  };

  const handleFeedbackSubmit = (feedbackText: string) => {
    setShowFeedbackModal(false);

    const metrics = {
      wodFormat,
      roundsCompleted,
      totalTime: sessionTime,
      timeCapReached: sessionTime >= timeCapSeconds,
      exercises: exercises.length,
      userFeedbackText: feedbackText,
      wodName: prescription.wodName,
    };

    logger.info('FUNCTIONAL_SESSION', 'Feedback submitted', {
      sessionId,
      metrics,
      feedbackLength: feedbackText.length
    });

    onComplete(metrics);
  };

  const handleFeedbackSkip = () => {
    setShowFeedbackModal(false);

    const metrics = {
      wodFormat,
      roundsCompleted,
      totalTime: sessionTime,
      timeCapReached: sessionTime >= timeCapSeconds,
      exercises: exercises.length,
    };

    logger.info('FUNCTIONAL_SESSION', 'Feedback skipped');
    onComplete(metrics);
  };

  const getRemainingTime = () => {
    return Math.max(0, timeCapSeconds - sessionTime);
  };

  const getProgressPercentage = () => {
    if (wodFormat === 'amrap' || wodFormat === 'forTime') {
      return Math.min(100, (sessionTime / timeCapSeconds) * 100);
    }
    return 0;
  };

  const currentExercise = exercises[currentExerciseIndex];

  // Countdown phase
  if (sessionPhase === 'COUNTDOWN') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      >
        <div className="text-center">
          <motion.div
            key={countdown}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-9xl font-bold mb-8"
            style={{
              color: countdown <= 3 ? '#EF4444' : stepColor,
              textShadow: `0 0 60px ${countdown <= 3 ? '#EF4444' : stepColor}`,
            }}
          >
            {countdown}
          </motion.div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <h2 className="text-2xl font-bold text-white">
              {prescription.wodName || 'WOD'}
            </h2>
            {wearableTracking?.isTracking && wearableTracking.deviceInfo && (
              <WearableTrackingBadge
                deviceName={wearableTracking.deviceInfo.deviceName}
                stepColor="#22C55E"
                compact={true}
              />
            )}
          </div>
          <p className="text-white/60 text-lg" style={{ marginTop: '12px' }}>
            {wodFormat === 'amrap' && `AMRAP ${prescription.timeCapMinutes} min`}
            {wodFormat === 'forTime' && `For Time - Time Cap ${prescription.timeCapMinutes} min`}
            {wodFormat === 'emom' && 'EMOM'}
            {wodFormat === 'tabata' && 'Tabata'}
            {wodFormat === 'chipper' && 'Chipper'}
            {wodFormat === 'ladder' && 'Ladder'}
          </p>
        </div>
      </motion.div>
    );
  }

  // Main WOD phase
  if (sessionPhase === 'MAIN_WOD') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative pb-6"
        >
          {/* Universal Progress Header */}
          <div className="mb-6">
            <TrainingProgressHeader
              steps={TRAINING_PIPELINE_STEPS}
              currentStep="seance"
              progress={getProgressPercentage()}
              sessionMode={true}
              sessionTime={sessionTime}
              isSessionRunning={isRunning && !isPaused}
              formatTime={formatTime}
              onPlayPause={handlePlayPause}
              onStop={handleStop}
              currentExerciseIndex={currentExerciseIndex}
              totalExercises={exercises.length}
            />
          </div>

          {/* WOD Stats Card - Complementary to Progress Header */}
          <div className="px-4 mb-6">
            <GlassCard
              className="p-4"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 12%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.06)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 25%, transparent)`,
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Rounds Counter */}
                <div className="text-center functional-rounds-counter">
                  <motion.div
                    key={roundsCompleted}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="functional-rounds-increment"
                  >
                    <div className="text-4xl font-bold functional-timer-digit" style={{ color: stepColor, letterSpacing: '-0.03em' }}>
                      {roundsCompleted}
                    </div>
                  </motion.div>
                  <div className="text-xs text-white/60 uppercase tracking-wider mt-1">
                    Rounds Complétés
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    En cours: Round {roundsCompleted + 1}
                  </div>
                </div>

                {/* Time Remaining (AMRAP) or Progress (For Time) */}
                {(wodFormat === 'amrap' || wodFormat === 'forTime') && (
                  <div className="text-center functional-timer">
                    <div className="text-2xl font-bold text-white functional-timer-digit" style={{ letterSpacing: '-0.02em' }}>
                      {formatTime(getRemainingTime())}
                    </div>
                    <div className="text-xs text-white/60 uppercase tracking-wider mt-1">Restant</div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Current Exercise Card - Enhanced Design */}
          <div className="px-4 mb-6">
            <AnimatePresence mode="wait">
              {currentExercise && (
                <motion.div
                  key={currentExerciseIndex}
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <GlassCard
                    className="p-6"
                    style={{
                      background: `
                        radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 60%),
                        radial-gradient(circle at 80% 80%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 50%),
                        rgba(255, 255, 255, 0.1)
                      `,
                      border: `3px solid ${stepColor}`,
                      boxShadow: `
                        0 12px 48px rgba(0, 0, 0, 0.4),
                        0 0 60px color-mix(in srgb, ${stepColor} 45%, transparent),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `,
                    }}
                  >
                    {/* Exercise Progress Indicator */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                          style={{
                            background: `color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.1))`,
                            border: `2px solid ${stepColor}`,
                            color: stepColor,
                          }}
                        >
                          Round {roundsCompleted + 1} • Exercice {currentExerciseIndex + 1}/{exercises.length}
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <GlowIcon icon="Zap" color={stepColor} size="medium" glowIntensity={50} />
                      </motion.div>
                    </div>

                    {/* Exercise Illustration */}
                    <div className="relative z-20 mb-6 flex justify-center w-full">
                      <div className="w-full max-w-[400px]">
                        <ExerciseIllustration
                          exerciseName={currentExercise.name}
                          discipline="functional"
                          muscleGroups={currentExercise.muscleGroups}
                          equipment={currentExercise.equipment ? [currentExercise.equipment] : []}
                          size="thumb"
                          showSkeleton={true}
                          fallbackIcon="Zap"
                          className="rounded-xl w-full"
                        />
                      </div>
                    </div>

                    {/* Exercise Name */}
                    <h2 className="text-3xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
                      {currentExercise.name}
                    </h2>

                    {currentExercise.variant && (
                      <p className="text-base text-white/70 mb-4">{currentExercise.variant}</p>
                    )}

                    {/* Exercise Details Grid */}
                    <div className="space-y-4 mb-6">
                      {/* Reps - Full Width */}
                      <div
                        className="p-3 rounded-2xl flex items-center justify-center w-full"
                        style={{
                          background: `
                            radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 65%),
                            rgba(255, 255, 255, 0.08)
                          `,
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          minHeight: '100px',
                        }}
                      >
                        <CompactRepDisplay
                          reps={currentExercise.reps}
                          color={stepColor}
                          className="w-full"
                        />
                      </div>

                      {/* Secondary Info Grid */}
                      <div className="grid grid-cols-2 gap-4">

                      {/* Load */}
                      {currentExercise.load !== undefined && currentExercise.load !== null && (
                        <div
                          className="p-4 rounded-2xl text-center"
                          style={{
                            background: `
                              radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 18%, transparent) 0%, transparent 65%),
                              rgba(255, 255, 255, 0.08)
                            `,
                            border: `2px solid color-mix(in srgb, ${stepColor} 30%, rgba(255, 255, 255, 0.2))`,
                          }}
                        >
                          <div className="text-4xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
                            {typeof currentExercise.load === 'number' ? currentExercise.load : 'PDC'}
                          </div>
                          <div className="text-xs text-white/70 font-semibold uppercase tracking-wider">
                            {typeof currentExercise.load === 'number' ? 'kg' : 'Poids Corps'}
                          </div>
                        </div>
                      )}
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Previous Exercise */}
                      <motion.button
                        onClick={handlePreviousExercise}
                        disabled={currentExerciseIndex === 0}
                        whileHover={currentExerciseIndex > 0 ? { scale: 1.02 } : {}}
                        whileTap={currentExerciseIndex > 0 ? { scale: 0.98 } : {}}
                        className="py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                        style={{
                          background: currentExerciseIndex > 0
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(255, 255, 255, 0.03)',
                          border: currentExerciseIndex > 0
                            ? '2px solid rgba(255, 255, 255, 0.2)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          opacity: currentExerciseIndex > 0 ? 1 : 0.3,
                          cursor: currentExerciseIndex > 0 ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <SpatialIcon Icon={ICONS.ChevronLeft} size={20} style={{ color: 'white' }} />
                        Précédent
                      </motion.button>

                      {/* Next Exercise / Complete Round */}
                      <motion.button
                        onClick={handleNextExercise}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                        style={{
                          background: `
                            radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 70%),
                            color-mix(in srgb, ${stepColor} 22%, rgba(255, 255, 255, 0.12))
                          `,
                          border: `2px solid ${stepColor}`,
                          color: 'white',
                          boxShadow: `0 8px 32px color-mix(in srgb, ${stepColor} 30%, transparent)`,
                        }}
                      >
                        {currentExerciseIndex < exercises.length - 1
                          ? 'Exercice Suivant'
                          : `Terminer Round ${roundsCompleted + 1}`}
                        <SpatialIcon
                          Icon={currentExerciseIndex < exercises.length - 1 ? ICONS.ChevronRight : ICONS.CheckCircle}
                          size={20}
                          style={{ color: 'white' }}
                        />
                      </motion.button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Complete WOD Button - Show only after at least 1 round */}
          {roundsCompleted >= 1 && (
            <div className="px-4">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.button
                  onClick={handleSessionComplete}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3"
                  style={{
                    background: `
                      linear-gradient(135deg,
                        color-mix(in srgb, #F59E0B 80%, transparent),
                        color-mix(in srgb, #EF4444 80%, transparent)
                      )
                    `,
                    border: '3px solid #F59E0B',
                    color: 'white',
                    boxShadow: `
                      0 12px 48px rgba(245, 158, 11, 0.4),
                      0 0 60px rgba(245, 158, 11, 0.3)
                    `,
                  }}
                >
                  <SpatialIcon Icon={ICONS.Flag} size={24} style={{ color: 'white' }} />
                  Terminer le WOD
                </motion.button>
                <p className="text-center text-white/60 text-sm mt-2">
                  {roundsCompleted} round{roundsCompleted > 1 ? 's' : ''} complété{roundsCompleted > 1 ? 's' : ''} • {formatTime(sessionTime)}
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Stop Confirmation Modal */}
        <AnimatePresence>
          {showStopModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
              }}
              onClick={() => setShowStopModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <GlassCard
                  className="p-8 max-w-md"
                  style={{
                    background: 'rgba(20, 20, 20, 0.95)',
                    border: '2px solid rgba(239, 68, 68, 0.4)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div className="text-center space-y-6">
                    <SpatialIcon
                      Icon={ICONS.StopCircle}
                      size={56}
                      style={{ color: '#EF4444', margin: '0 auto' }}
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Arrêter le WOD ?
                      </h3>
                      <p className="text-white/70">
                        Votre progression ne sera pas sauvegardée.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowStopModal(false)}
                        className="flex-1 py-3 rounded-xl font-semibold text-white"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        Continuer
                      </button>
                      <button
                        onClick={handleStopConfirm}
                        className="flex-1 py-3 rounded-xl font-semibold"
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '2px solid #EF4444',
                          color: '#EF4444',
                        }}
                      >
                        Arrêter
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </>
    );
  }

  // Session Feedback Modal - Render outside phase conditionals
  return (
    <>
      <AnimatePresence>
        {sessionPhase === 'COMPLETED' && showFeedbackModal && (
          <SessionFeedbackModal
            sessionId={sessionId}
            userId={userId}
            isOpen={showFeedbackModal}
            onClose={handleFeedbackSkip}
            onSubmit={handleFeedbackSubmit}
            stepColor={stepColor}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FunctionalSessionDisplay;

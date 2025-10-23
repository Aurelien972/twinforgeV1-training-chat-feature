/**
 * ExerciseSessionCard Component
 * Dynamic card with three states: active, rest, and feedback
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import GlowIcon from '../GlowIcon';
import { ICONS } from '../../../icons/registry';
import type { Exercise } from '../../../../system/store/trainingPipeline/types';
import { getLoadForSet, formatLoadDisplay, isRampingSet, getInitialLoad } from '../../../../utils/loadUtils';
import { exerciseLoadAdjustmentService } from '../../../../system/services/exerciseLoadAdjustmentService';
import logger from '../../../../lib/utils/logger';
import { RepDisplay } from '../shared/RepDisplay';
import WearableTrackingBadge from '../WearableTrackingBadge';
import type { UseWearableTrackingReturn } from '../../../../hooks/useWearableTracking';
import { ExerciseIllustration } from '../illustrations/ExerciseIllustration';
import { MuscleGroupsBadges } from '../shared';

type ExerciseState = 'active' | 'rest' | 'feedback';

interface ExerciseSessionCardProps {
  exercise: Exercise;
  exerciseIndex: number;
  stepColor: string;
  currentSet: number;
  onSetComplete: () => void;
  onExerciseComplete: (rpe: number) => void;
  onAdjustLoad: (newLoad: number) => void;
  onSkipRest: () => void;
  restTimeRemaining: number;
  isResting: boolean;
  onFeedbackStateEntered?: () => void;
  wearableTracking?: UseWearableTrackingReturn;
  discipline?: string;
  showIllustration?: boolean;
}

const ExerciseSessionCard: React.FC<ExerciseSessionCardProps> = ({
  exercise,
  exerciseIndex,
  stepColor,
  currentSet,
  onSetComplete,
  onExerciseComplete,
  onAdjustLoad,
  onSkipRest,
  restTimeRemaining,
  isResting,
  onFeedbackStateEntered,
  wearableTracking,
  discipline = 'force',
  showIllustration = true,
}) => {
  const [exerciseState, setExerciseState] = useState<ExerciseState>('active');
  const [selectedRpe, setSelectedRpe] = useState<number | null>(null);
  const [showCoachDetails, setShowCoachDetails] = useState(false);

  // During active state: currentSet is the set being performed
  // During rest state: currentSet is ALREADY the next set to perform (incremented in Step3Seance line 269)
  const currentLoad = getLoadForSet(exercise.load, currentSet);
  const nextSetLoad = getLoadForSet(exercise.load, currentSet);
  const [tempLoad, setTempLoad] = useState(nextSetLoad || currentLoad || 0);
  const hasLoad = currentLoad !== null;

  // Log state changes for debugging
  React.useEffect(() => {
    logger.debug('EXERCISE_CARD_STATE', 'Component state updated', {
      exerciseName: exercise.name,
      exerciseIndex,
      currentSet,
      isResting,
      currentLoad,
      nextSetLoad,
      tempLoad,
      exerciseLoad: exercise.load,
      isRamping: isRampingSet(exercise.load)
    });
  }, [exercise.load, currentSet, isResting, currentLoad, nextSetLoad, tempLoad, exercise.name, exerciseIndex]);

  // Analyze ramping progression
  // During rest, currentSet is already incremented, so pass currentSet - 1 as the completed set
  const rampingProgression = isResting && isRampingSet(exercise.load)
    ? exerciseLoadAdjustmentService.analyzeRampingProgression(exercise.load, currentSet - 1, exercise.sets)
    : null;

  // Check if current set is the last set
  const isLastSet = currentSet === exercise.sets;

  const handleSetComplete = () => {
    if (isLastSet) {
      setExerciseState('feedback');
      if (onFeedbackStateEntered) {
        setTimeout(() => {
          onFeedbackStateEntered();
        }, 100);
      }
    } else {
      onSetComplete();
    }
  };

  const handleRpeSubmit = () => {
    if (selectedRpe !== null) {
      onExerciseComplete(selectedRpe);
    }
  };

  const handleLoadAdjust = (delta: number) => {
    const newLoad = Math.max(0, tempLoad + delta);
    setTempLoad(newLoad);
  };

  const handleQuickAdjust = (adjustment: 'decrease' | 'keep' | 'increase') => {
    if (!rampingProgression) return;

    let newLoad = rampingProgression.nextSetLoad;
    if (adjustment === 'decrease') {
      newLoad = Math.max(0, newLoad - 5);
    } else if (adjustment === 'increase') {
      newLoad = newLoad + 5;
    }
    setTempLoad(newLoad);
  };

  // Update tempLoad when entering rest phase - load for the NEXT set
  // Note: currentSet is ALREADY the next set during rest (incremented before rest starts)
  React.useEffect(() => {
    if (isResting) {
      const loadForNextSet = getLoadForSet(exercise.load, currentSet);
      const calculatedTempLoad = loadForNextSet || currentLoad || 0;

      logger.info('LOAD_PROGRESSION', 'Entering rest phase', {
        exerciseName: exercise.name,
        exerciseIndex,
        completedSet: currentSet - 1,
        nextSet: currentSet,
        currentLoad,
        loadForNextSet,
        calculatedTempLoad,
        exerciseLoad: exercise.load,
        isRamping: isRampingSet(exercise.load)
      });

      setTempLoad(calculatedTempLoad);
      setHasUserAdjusted(false);
    }
  }, [isResting, currentSet, exercise.load, currentLoad, exerciseIndex, exercise.name]);

  // Auto-apply suggested load when skipping rest (if user hasn't adjusted)
  const handleAutoApplyOnSkip = () => {
    if (!hasUserAdjusted && tempLoad !== nextSetLoad && nextSetLoad !== null) {
      handleLoadConfirm();
    }
  };

  // Call auto-apply before skip
  React.useEffect(() => {
    const originalOnSkipRest = onSkipRest;
    // We'll handle this in Step3Seance instead to avoid hook dependency issues
  }, []);

  const handleLoadConfirm = () => {
    logger.info('LOAD_PROGRESSION', 'Confirming load adjustment', {
      exerciseName: exercise.name,
      exerciseIndex,
      completedSet: currentSet - 1,
      nextSet: currentSet,
      tempLoad,
      currentExerciseLoad: exercise.load,
      isRamping: isRampingSet(exercise.load),
      hasUserAdjusted
    });

    let updatedLoad: number | number[];

    if (isRampingSet(exercise.load) && Array.isArray(exercise.load)) {
      // During rest, currentSet is already the next set, so pass currentSet - 1 as completed set
      updatedLoad = exerciseLoadAdjustmentService.applyProgressionToRemainingSets(
        exercise.load,
        currentSet - 1,
        tempLoad,
        exercise.sets
      );
      logger.info('LOAD_PROGRESSION', 'Updated ramping loads', {
        exerciseName: exercise.name,
        updatedLoads: updatedLoad
      });
    } else {
      updatedLoad = tempLoad;
      logger.info('LOAD_PROGRESSION', 'Setting single load', {
        exerciseName: exercise.name,
        newLoad: tempLoad
      });
    }

    onAdjustLoad(updatedLoad as number);
  };

  // Auto-apply suggested load when rest ends if user hasn't made changes
  const [hasUserAdjusted, setHasUserAdjusted] = useState(false);
  const wasRestingRef = React.useRef(false);

  React.useEffect(() => {
    if (!isResting) {
      setHasUserAdjusted(false);
    }
  }, [isResting]);

  // Track when user makes manual adjustments
  React.useEffect(() => {
    if (isResting && tempLoad !== nextSetLoad) {
      setHasUserAdjusted(true);
    }
  }, [tempLoad, nextSetLoad, isResting]);

  // Auto-apply load when transitioning from rest to active (rest naturally completed)
  React.useEffect(() => {
    // Detect transition from resting to not resting
    if (wasRestingRef.current && !isResting && !hasUserAdjusted && nextSetLoad !== null) {
      logger.info('LOAD_PROGRESSION', 'Rest ended naturally, auto-applying load', {
        exerciseName: exercise.name,
        exerciseIndex,
        completedSet: currentSet - 1,
        nextSet: currentSet,
        tempLoad,
        nextSetLoad,
        hasUserAdjusted
      });

      // Apply the load progression
      handleLoadConfirm();
    }

    wasRestingRef.current = isResting;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResting]);

  return (
    <AnimatePresence mode="wait">
      {/* Active State - During Set Execution */}
      {exerciseState === 'active' && !isResting && (
        <motion.div
          key="active"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard
            className="p-4 sm:p-5 text-center relative overflow-hidden active-exercise-card"
            style={{
              marginBottom: '16px',
              background: `
                radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 60%),
                radial-gradient(circle at 80% 80%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 50%),
                var(--liquid-glass-bg-elevated)
              `,
              border: `2px solid color-mix(in srgb, ${stepColor} 50%, rgba(255, 255, 255, 0.2))`,
              boxShadow: `
                0 12px 48px rgba(0, 0, 0, 0.4),
                0 0 60px color-mix(in srgb, ${stepColor} 45%, transparent),
                0 0 30px color-mix(in srgb, ${stepColor} 25%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                inset 0 0 40px color-mix(in srgb, ${stepColor} 8%, transparent)
              `,
              isolation: 'isolate',
            }}
          >
            <div className="space-y-4" style={{
              paddingTop: '16px',
              paddingBottom: '16px',
            }}
          >
            {/* Shimmer Effect - VisionOS 26 */}
            <div
              className="absolute inset-0 rounded-[20px] pointer-events-none"
              style={{
                overflow: 'hidden',
                zIndex: 2,
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.8) 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.8) 100%)',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(
                    90deg,
                    transparent 0%,
                    color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.4)) 45%,
                    color-mix(in srgb, ${stepColor} 35%, rgba(255, 255, 255, 0.5)) 50%,
                    color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.4)) 55%,
                    transparent 100%
                  )`,
                  width: '40%',
                  height: '100%',
                  animation: 'active-exercise-shimmer 3s ease-in-out infinite',
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                  contain: 'layout style paint',
                }}
              />
            </div>
            {/* Animated Border Pulse Effect - Renforcé */}
            <motion.div
              className="absolute inset-0 rounded-[20px] pointer-events-none"
              style={{
                border: `2px solid ${stepColor}`,
                opacity: 0.5,
                zIndex: 1,
              }}
              animate={{
                opacity: [0.5, 1.0, 0.5],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Exercise Illustration */}
            {showIllustration && (
              <div className="relative z-20 mb-6 flex justify-center w-full">
                <div className="w-full max-w-[400px]">
                  <ExerciseIllustration
                    exerciseName={exercise.name}
                    discipline={discipline}
                    muscleGroups={exercise.muscleGroups}
                    equipment={exercise.equipment}
                    movementPattern={exercise.movementPattern}
                    size="thumb"
                    showSkeleton={true}
                    className="rounded-xl w-full"
                  />
                </div>
              </div>
            )}

            {/* Exercise Name */}
            <div className="relative z-20" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <h2 className="text-xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                  {exercise.name}
                </h2>
                {exercise.variant && (
                  <p className="text-sm text-white/70 font-medium" style={{ marginTop: '4px' }}>{exercise.variant}</p>
                )}

                {/* Muscle Groups Badges */}
                {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                  <div className="w-full">
                    <MuscleGroupsBadges
                      muscleGroups={exercise.muscleGroups}
                      disciplineColor={stepColor}
                      className="flex justify-center"
                    />
                  </div>
                )}

                {/* Wearable Tracking Badge */}
                {wearableTracking?.isTracking && wearableTracking.deviceInfo && (
                  <WearableTrackingBadge
                    deviceName={wearableTracking.deviceInfo.deviceName}
                    stepColor={stepColor}
                    compact={true}
                  />
                )}
              </div>
            </div>

            {/* Set Counter with Enhanced Pulse Animation */}
            <div className="relative z-20" style={{ margin: '16px 0' }}>
              <motion.div
                className="text-5xl font-bold"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  letterSpacing: '-0.04em',
                  lineHeight: '1',
                  color: stepColor,
                  textShadow: `
                    0 0 32px color-mix(in srgb, ${stepColor} 60%, transparent),
                    0 0 16px color-mix(in srgb, ${stepColor} 80%, transparent),
                    0 2px 8px rgba(0, 0, 0, 0.5)
                  `,
                }}
              >
                {currentSet} / {exercise.sets}
              </motion.div>
            </div>

            {/* Execution Technique / Intensification Section */}
            {(exercise.intensificationTechnique || exercise.executionCues) && (
              <div className="relative z-20" style={{ margin: '16px 0' }}>
                <div
                  className="p-4 rounded-xl space-y-3"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 70%),
                      rgba(255, 255, 255, 0.06)
                    `,
                    border: `1.5px solid color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.12))`,
                    boxShadow: `
                      0 2px 8px rgba(0, 0, 0, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `,
                  }}
                >
                  {exercise.intensificationTechnique && exercise.intensificationTechnique !== 'none' && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <GlowIcon
                          icon="Zap"
                          color={stepColor}
                          size="small"
                          glowIntensity={35}
                        />
                        <div className="text-xs text-white/60 font-bold uppercase tracking-wider" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>
                          Intensification
                        </div>
                      </div>
                      <div className="flex items-start gap-2 flex-wrap pl-10">
                        <span
                          className="px-3 py-1.5 rounded-lg text-xs font-bold inline-block"
                          style={{
                            background: `color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.12))`,
                            border: `2px solid color-mix(in srgb, ${stepColor} 35%, transparent)`,
                            color: 'white',
                            boxShadow: `0 0 16px color-mix(in srgb, ${stepColor} 20%, transparent)`,
                            fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                          }}
                        >
                          {exercise.intensificationTechnique}
                        </span>
                        {exercise.intensificationDetails && (
                          <span className="text-xs text-white/70 mt-1 leading-relaxed" style={{ fontSize: 'clamp(0.65rem, 1.8vw, 0.7rem)' }}>
                            {exercise.intensificationDetails}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {exercise.executionCues && exercise.executionCues.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <GlowIcon
                          icon="Zap"
                          color="#22C55E"
                          size="small"
                          glowIntensity={35}
                        />
                        <div className="text-xs text-white/60 font-bold uppercase tracking-wider" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>
                          Exécution
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pl-10">
                        {exercise.executionCues.map((cue, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-white/85"
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1.5px solid rgba(255, 255, 255, 0.2)',
                              fontSize: 'clamp(0.65rem, 1.8vw, 0.7rem)',
                            }}
                          >
                            {cue}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Coach Details Section - Collapsible */}
            {(exercise.coachTips || exercise.safetyNotes || exercise.commonMistakes) && (
              <div className="relative z-20" style={{ marginTop: '12px', marginBottom: '16px' }}>
                <motion.button
                  onClick={() => setShowCoachDetails(!showCoachDetails)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full rounded-xl flex items-center justify-between"
                  style={{
                    padding: '10px 12px',
                    background: showCoachDetails
                      ? `color-mix(in srgb, ${stepColor} 12%, rgba(255, 255, 255, 0.06))`
                      : 'rgba(255, 255, 255, 0.06)',
                    border: showCoachDetails
                      ? `1.5px solid color-mix(in srgb, ${stepColor} 25%, transparent)`
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-2" style={{ gap: '8px' }}>
                    <SpatialIcon
                      Icon={ICONS.Info}
                      size={16}
                      style={{ color: stepColor }}
                    />
                    <span className="text-xs font-semibold text-white/80">
                      Conseils du Coach
                    </span>
                    {/* Badge showing count of tips */}
                    <span
                      className="px-1.5 py-0.5 rounded-full font-bold"
                      style={{
                        fontSize: '9px',
                        background: `color-mix(in srgb, ${stepColor} 20%, transparent)`,
                        color: stepColor,
                        border: `1px solid color-mix(in srgb, ${stepColor} 30%, transparent)`,
                      }}
                    >
                      {[
                        exercise.coachTips?.length || 0,
                        exercise.safetyNotes?.length || 0,
                        exercise.commonMistakes?.length || 0
                      ].reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: showCoachDetails ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SpatialIcon
                      Icon={ICONS.ChevronDown}
                      size={16}
                      style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {showCoachDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2" style={{ marginTop: '8px' }}>
                        {exercise.coachTips && exercise.coachTips.length > 0 && (
                          <div
                            className="rounded-xl"
                            style={{
                              padding: '10px',
                              background: 'rgba(59, 130, 246, 0.08)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                            }}
                          >
                            <div className="flex items-center gap-2" style={{ marginBottom: '6px', gap: '6px' }}>
                              <GlowIcon
                                icon="Lightbulb"
                                color="#3B82F6"
                                size="small"
                                glowIntensity={35}
                              />
                              <span className="font-bold text-blue-400 uppercase tracking-wider" style={{ fontSize: '10px' }}>
                                Conseils
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {exercise.coachTips.map((tip, idx) => (
                                <li key={idx} className="text-white/70 flex items-start" style={{ fontSize: '11px', gap: '6px' }}>
                                  <span className="text-blue-400" style={{ marginTop: '2px' }}>•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {exercise.safetyNotes && exercise.safetyNotes.length > 0 && (
                          <div
                            className="rounded-xl"
                            style={{
                              padding: '10px',
                              background: 'rgba(251, 146, 60, 0.08)',
                              border: '1px solid rgba(251, 146, 60, 0.2)',
                            }}
                          >
                            <div className="flex items-center gap-2" style={{ marginBottom: '6px', gap: '6px' }}>
                              <GlowIcon
                                icon="Shield"
                                color="#FB923C"
                                size="small"
                                glowIntensity={35}
                              />
                              <span className="font-bold text-orange-400 uppercase tracking-wider" style={{ fontSize: '10px' }}>
                                Sécurité
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {exercise.safetyNotes.map((note, idx) => (
                                <li key={idx} className="text-white/70 flex items-start" style={{ fontSize: '11px', gap: '6px' }}>
                                  <span className="text-orange-400" style={{ marginTop: '2px' }}>•</span>
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
                          <div
                            className="rounded-xl"
                            style={{
                              padding: '10px',
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                            }}
                          >
                            <div className="flex items-center gap-2" style={{ marginBottom: '6px', gap: '6px' }}>
                              <GlowIcon
                                icon="AlertTriangle"
                                color="#EF4444"
                                size="small"
                                glowIntensity={35}
                              />
                              <span className="font-bold text-red-400 uppercase tracking-wider" style={{ fontSize: '10px' }}>
                                Erreurs à éviter
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {exercise.commonMistakes.map((mistake, idx) => (
                                <li key={idx} className="text-white/70 flex items-start" style={{ fontSize: '11px', gap: '6px' }}>
                                  <span className="text-red-400" style={{ marginTop: '2px' }}>•</span>
                                  <span>{mistake}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Main Details Grid */}
            <div className="grid grid-cols-2 relative z-20" style={{ gap: '12px', marginTop: '16px' }}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="p-2.5 rounded-xl relative overflow-hidden"
                style={{
                  background: `
                    radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 25%, transparent) 0%, transparent 70%),
                    rgba(255, 255, 255, 0.12)
                  `,
                  border: `2px solid color-mix(in srgb, ${stepColor} 35%, rgba(255, 255, 255, 0.2))`,
                  boxShadow: `
                    0 0 30px color-mix(in srgb, ${stepColor} 20%, transparent),
                    inset 0 1px 0 rgba(255, 255, 255, 0.25)
                  `,
                  minHeight: '100px',
                }}
              >
                <RepDisplay
                  reps={exercise.reps}
                  color={stepColor}
                  showBadge={true}
                  compact={false}
                />
              </motion.div>

              {hasLoad ? (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="p-2.5 rounded-xl overflow-hidden relative flex flex-col items-center justify-center"
                  style={{
                    background: `
                      radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 70%),
                      rgba(255, 255, 255, 0.10)
                    `,
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                    minHeight: '100px',
                  }}
                >
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div
                      className="text-3xl font-bold text-white mb-1"
                      style={{
                        letterSpacing: '-0.03em',
                        lineHeight: '1',
                      }}
                    >
                      {formatLoadDisplay(exercise.load, currentSet)}
                    </div>
                    <div className="text-white/70 font-semibold uppercase tracking-wider" style={{ fontSize: '10px' }}>Charge</div>
                    {isRampingSet(exercise.load) && (
                      <div className="text-[9px] text-white/50 mt-1.5">Série progressive</div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="p-2.5 rounded-xl flex flex-col items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    minHeight: '100px',
                  }}
                >
                  <div className="text-3xl font-bold text-white/90 mb-1">PDC</div>
                  <div className="text-white/60 font-semibold uppercase tracking-wider" style={{ fontSize: '10px' }}>Poids Corps</div>
                </motion.div>
              )}
            </div>


            {/* Action Button */}
            <motion.button
              onClick={handleSetComplete}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 rounded-xl font-bold text-base relative z-30"
              style={{
                paddingTop: '14px',
                paddingBottom: '14px',
                marginTop: '16px',
                minHeight: '52px',
                background: `
                  radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 70%),
                  radial-gradient(circle at 50% 80%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 60%),
                  color-mix(in srgb, ${stepColor} 22%, rgba(255, 255, 255, 0.12))
                `,
                border: `2.5px solid color-mix(in srgb, ${stepColor} 45%, transparent)`,
                color: 'white',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.25),
                  0 0 40px color-mix(in srgb, ${stepColor} 35%, transparent),
                  inset 0 2px 0 rgba(255, 255, 255, 0.25),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `,
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                textShadow: `0 0 20px color-mix(in srgb, ${stepColor} 40%, transparent)`,
              }}
            >
              {isLastSet ? 'Terminer l\'exercice' : 'Série terminée'}
            </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Rest State - Between Sets */}
      {exerciseState === 'active' && isResting && (
        <motion.div
          key="rest"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard
            className="p-4 sm:p-5"
            style={{
              marginBottom: '4px',
              background: `
                radial-gradient(ellipse at 50% 20%, rgba(34, 197, 94, 0.15) 0%, transparent 60%),
                var(--liquid-glass-bg-elevated)
              `,
              border: '2px solid rgba(34, 197, 94, 0.35)',
              boxShadow: `
                0 12px 48px rgba(0, 0, 0, 0.3),
                0 0 40px rgba(34, 197, 94, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.15)
              `,
            }}
          >
            <div className="space-y-4" style={{
              paddingTop: '12px',
              paddingBottom: '12px',
            }}
          >
            {/* Rest Header */}
            <div className="text-center">
              <div className="flex justify-center" style={{ marginBottom: '12px' }}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <GlowIcon
                    icon="Timer"
                    color="#22C55E"
                    size="medium"
                    glowIntensity={40}
                  />
                </motion.div>
              </div>
              <h3 className="text-lg font-bold text-white" style={{ marginBottom: '8px' }}>Temps de Repos</h3>
              <div
                className="text-4xl font-bold"
                style={{
                  color: '#22C55E',
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 24px rgba(34, 197, 94, 0.4)',
                  marginBottom: '12px',
                }}
              >
                {restTimeRemaining}s
              </div>
              {/* Show next set info - currentSet is already the next set during rest */}
              {currentSet <= exercise.sets && (
                <div className="flex items-center justify-center gap-2" style={{ marginBottom: '4px' }}>
                  <p className="text-xs text-white/70">Prochaine série : {currentSet}/{exercise.sets}</p>
                  {isRampingSet(exercise.load) && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        color: '#22C55E',
                        fontSize: '9px',
                      }}
                    >
                      Série progressive
                    </span>
                  )}
                </div>
              )}
              {/* Show programmed load for next set only if it exists */}
              {currentSet <= exercise.sets && isRampingSet(exercise.load) && nextSetLoad !== null && (
                <p className="text-xs text-white/50" style={{ fontSize: '10px', marginTop: '2px' }}>
                  Charge programmée : {nextSetLoad}kg
                </p>
              )}
            </div>

            {/* Ramping Progression Display - Removed per user request */}

            {/* Quick Adjustment Buttons for Ramping Sets */}
            {rampingProgression && hasLoad && (
              <div className="space-y-3" style={{ marginTop: '12px' }}>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xs text-white/70 text-center font-semibold">
                    Charge pour série {currentSet}
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <motion.button
                    onClick={() => handleQuickAdjust('decrease')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-xl"
                    style={{
                      padding: '10px 8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1.5px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <div className="text-xs text-red-400 font-bold mb-1">-5kg</div>
                    <div className="text-[10px] text-white/60">Trop dur</div>
                  </motion.button>

                  <motion.button
                    onClick={() => handleQuickAdjust('keep')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-xl"
                    style={{
                      padding: '10px 8px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '2px solid rgba(34, 197, 94, 0.4)',
                    }}
                  >
                    <div className="text-xs text-green-400 font-bold mb-1">✓ {nextSetLoad}kg</div>
                    <div className="text-[10px] text-white/70">Comme prévu</div>
                  </motion.button>

                  <motion.button
                    onClick={() => handleQuickAdjust('increase')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-xl"
                    style={{
                      padding: '10px 8px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1.5px solid rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    <div className="text-xs text-green-400 font-bold mb-1">+5kg</div>
                    <div className="text-[10px] text-white/60">Trop facile</div>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Fine Adjustment Controls */}
            {hasLoad && (
              <div className="space-y-2" style={{ marginTop: '12px' }}>
                {!rampingProgression && (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xs text-white/60 text-center font-semibold">Ajuster la charge pour série {currentSet}</p>
                  </div>
                )}
                <div className="flex items-center justify-center" style={{ gap: '12px' }}>
                  <motion.button
                    onClick={() => handleLoadAdjust(-2.5)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-xl flex items-center justify-center"
                    style={{
                      width: '44px',
                      height: '44px',
                      minWidth: '44px',
                      minHeight: '44px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <SpatialIcon Icon={ICONS.Minus} size={20} style={{ color: 'white' }} />
                  </motion.button>

                  <div
                    className="text-2xl font-bold text-white rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1.5px solid rgba(255, 255, 255, 0.25)',
                      minWidth: '100px',
                      padding: '8px 16px',
                      textAlign: 'center',
                    }}
                  >
                    {tempLoad}kg
                  </div>

                  <motion.button
                    onClick={() => handleLoadAdjust(2.5)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-xl flex items-center justify-center"
                    style={{
                      width: '44px',
                      height: '44px',
                      minWidth: '44px',
                      minHeight: '44px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <SpatialIcon Icon={ICONS.Plus} size={20} style={{ color: 'white' }} />
                  </motion.button>
                </div>

                {tempLoad !== nextSetLoad && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    {isRampingSet(exercise.load) && (
                      <div
                        className="text-xs text-center rounded-lg"
                        style={{
                          padding: '6px 8px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          color: 'rgba(255, 255, 255, 0.7)',
                        }}
                      >
                        La progression sera maintenue pour toutes les séries restantes
                      </div>
                    )}
                    <motion.button
                      onClick={handleLoadConfirm}
                      className="w-full px-4 rounded-xl text-xs font-semibold"
                      style={{
                        paddingTop: '10px',
                        paddingBottom: '10px',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1.5px solid rgba(34, 197, 94, 0.4)',
                        color: '#22C55E',
                      }}
                    >
                      Confirmer le changement
                    </motion.button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Skip Rest Button */}
            <motion.button
              onClick={() => {
                logger.info('LOAD_PROGRESSION', 'Skip rest clicked', {
                  exerciseName: exercise.name,
                  exerciseIndex,
                  completedSet: currentSet - 1,
                  nextSet: currentSet,
                  tempLoad,
                  nextSetLoad,
                  hasUserAdjusted,
                  currentExerciseLoad: exercise.load,
                  willAutoApply: !hasUserAdjusted
                });

                // Auto-apply the suggested load if user hasn't manually adjusted
                // This ensures the progression is applied even if tempLoad equals nextSetLoad
                if (!hasUserAdjusted && nextSetLoad !== null) {
                  logger.info('LOAD_PROGRESSION', 'Auto-applying load progression before skip', {
                    exerciseName: exercise.name,
                    exerciseIndex,
                    completedSet: currentSet - 1,
                    nextSet: currentSet,
                    tempLoad,
                    nextSetLoad,
                    areEqual: tempLoad === nextSetLoad
                  });
                  handleLoadConfirm();
                }

                onSkipRest();
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 rounded-xl font-semibold"
              style={{
                paddingTop: '12px',
                paddingBottom: '12px',
                marginTop: '12px',
                minHeight: '48px',
                background: `
                  radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: '2px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                boxShadow: `
                  0 4px 16px rgba(0, 0, 0, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.15)
                `,
                backdropFilter: 'blur(12px) saturate(150%)',
                WebkitBackdropFilter: 'blur(12px) saturate(150%)',
              }}
            >
              Passer le repos
            </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Feedback State - After All Sets */}
      {exerciseState === 'feedback' && (
        <motion.div
          key="feedback"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard
            className="p-4 sm:p-5"
            style={{
              marginBottom: '8px',
            }}
          >
            <div className="space-y-4" style={{
              paddingTop: '12px',
              paddingBottom: '12px',
            }}
          >
            {/* Success Icon */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ marginBottom: '12px', display: 'inline-block' }}
              >
                <GlowIcon
                  icon="CheckCircle"
                  color="#22C55E"
                  size="large"
                  glowIntensity={50}
                />
              </motion.div>
              <h3 className="text-xl font-bold text-white" style={{ marginBottom: '4px' }}>Exercice Terminé !</h3>
              <p className="text-sm text-white/70">{exercise.name}</p>
            </div>

            {/* RPE Selection */}
            <div className="space-y-3" style={{ marginTop: '16px' }}>
              <p className="text-center text-white/80 font-semibold text-sm">
                Comment était la difficulté ?
              </p>
              <div className="grid grid-cols-3" style={{ gap: '10px' }}>
                {[
                  { rpe: 5, emoji: '😌', label: 'Très Facile' },
                  { rpe: 6, emoji: '😊', label: 'Facile' },
                  { rpe: 7, emoji: '🙂', label: 'Confortable' },
                  { rpe: 8, emoji: '😤', label: 'Difficile' },
                  { rpe: 9, emoji: '😰', label: 'Très Dur' },
                  { rpe: 10, emoji: '🥵', label: 'Maximum' },
                ].map(({ rpe, emoji, label }) => (
                  <motion.button
                    key={rpe}
                    onClick={() => setSelectedRpe(rpe)}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center justify-center rounded-xl font-bold"
                    style={{
                      padding: '10px 8px',
                      minHeight: '72px',
                      background:
                        selectedRpe === rpe
                          ? `
                              radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 30%, transparent) 0%, transparent 70%),
                              color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.15))
                            `
                          : 'rgba(255, 255, 255, 0.08)',
                      border:
                        selectedRpe === rpe
                          ? `2px solid color-mix(in srgb, ${stepColor} 40%, transparent)`
                          : '1px solid rgba(255, 255, 255, 0.15)',
                      color: selectedRpe === rpe ? stepColor : 'rgba(255, 255, 255, 0.7)',
                      boxShadow:
                        selectedRpe === rpe
                          ? `0 0 20px color-mix(in srgb, ${stepColor} 30%, transparent)`
                          : 'none',
                    }}
                  >
                    <motion.div
                      className="text-xl"
                      animate={selectedRpe === rpe ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      style={{ marginBottom: '4px' }}
                    >
                      {emoji}
                    </motion.div>
                    <div className="text-lg font-bold" style={{ marginBottom: '2px' }}>{rpe}</div>
                    <div className="text-center leading-tight" style={{ fontSize: '9px', opacity: 0.7 }}>{label}</div>
                  </motion.button>
                ))}
              </div>
              <p className="text-center text-white/50" style={{ fontSize: '10px', marginTop: '8px' }}>5 = Très Facile 😌 • 10 = Maximum 🥵</p>
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleRpeSubmit}
              disabled={selectedRpe === null}
              whileHover={selectedRpe !== null ? { scale: 1.02, y: -2 } : {}}
              whileTap={selectedRpe !== null ? { scale: 0.98 } : {}}
              className="w-full px-6 rounded-xl font-bold text-base"
              style={{
                marginTop: '16px',
                paddingTop: '14px',
                paddingBottom: '14px',
                minHeight: '52px',
                background:
                  selectedRpe !== null
                    ? `
                        radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 70%),
                        radial-gradient(circle at 50% 80%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 60%),
                        color-mix(in srgb, ${stepColor} 22%, rgba(255, 255, 255, 0.12))
                      `
                    : 'rgba(255, 255, 255, 0.05)',
                border:
                  selectedRpe !== null
                    ? `2.5px solid color-mix(in srgb, ${stepColor} 45%, transparent)`
                    : '2px solid rgba(255, 255, 255, 0.1)',
                color: selectedRpe !== null ? 'white' : 'rgba(255, 255, 255, 0.3)',
                opacity: selectedRpe !== null ? 1 : 0.5,
                cursor: selectedRpe !== null ? 'pointer' : 'not-allowed',
                boxShadow:
                  selectedRpe !== null
                    ? `
                        0 8px 32px rgba(0, 0, 0, 0.25),
                        0 0 40px color-mix(in srgb, ${stepColor} 35%, transparent),
                        inset 0 2px 0 rgba(255, 255, 255, 0.25),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                      `
                    : 'none',
                backdropFilter: selectedRpe !== null ? 'blur(16px) saturate(180%)' : 'none',
                WebkitBackdropFilter: selectedRpe !== null ? 'blur(16px) saturate(180%)' : 'none',
                textShadow: selectedRpe !== null ? `0 0 20px color-mix(in srgb, ${stepColor} 40%, transparent)` : 'none',
              }}
            >
              Exercice suivant
            </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExerciseSessionCard;

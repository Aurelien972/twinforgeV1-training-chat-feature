/**
 * Step 3 - Seance
 * Live session execution with exercise tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTrainingPipeline, STEP_COLORS } from '../../../../../system/store/trainingPipeline';
import { useSessionTimer } from '../../../../../hooks/useSessionTimer';
import { useWearableTracking } from '../../../../../hooks/useWearableTracking';
import StepContainer from '../components/StepContainer';
import TrainingButton from '../components/TrainingButton';
import SessionGuard from '../components/SessionGuard';
import { ExerciseSessionCard, NextExercisePreview, PreparationCountdown, SetCountdown, WarmupPhaseCard, PreSessionBriefing, TransitionCountdown, SessionSummaryStats, GlowIcon, SessionFeedbackModal, DevModeControls, FunctionalSessionDisplay } from '../../../../../ui/components/training';
import {
  ExerciseSessionCardSkeleton,
  WarmupPhaseCardSkeleton,
  SessionTimerSkeleton
} from '../../../../../ui/components/skeletons';
import TrainingProgressHeader from '../components/TrainingProgressHeader';
import GlassCard from '../../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../../ui/icons/registry';
import { Haptics } from '../../../../../utils/haptics';
import logger from '../../../../../lib/utils/logger';
import type { Exercise, ExerciseFeedback } from '../../../../../system/store/trainingPipeline/types';
import { getLoadForSet } from '../../../../../utils/loadUtils';
import TrainingCoachNotificationBubble from '../../../../../ui/components/training/TrainingCoachNotificationBubble';
import { trainingCoachNotificationService } from '../../../../../system/services/trainingCoachNotificationService';
import type { TrainingNotificationContext } from '../../../../../domain/trainingCoachNotification';
import { useChatButtonRef } from '../../../../../system/context/ChatButtonContext';
import { useUserStore } from '../../../../../system/store/userStore';
import { EnduranceSessionDisplay } from '../../../../../ui/components/training';
import CompetitionSessionDisplay from '../../../../../ui/components/training/competitions/session/CompetitionSessionDisplay';
import { getWorkoutItems, getWorkoutItemsCount } from '../../../../../utils/prescriptionNormalizer';
import { useExerciseIllustrations } from '../../../../../hooks/useExerciseIllustrations';
import { ExerciseIllustration } from '../../../../../ui/components/training/illustrations';
import { ForceProgressionGuide } from '../../../../../ui/components/training/force/widgets';

const Step3SeanceContent: React.FC = () => {
  const navigate = useNavigate();
  const {
    goToNextStep,
    goToPreviousStep,
    resetPipeline,
    sessionPrescription,
    updateExerciseLoad,
    setSessionFeedback,
    currentSessionId,
    steps,
    progress
  } = useTrainingPipeline();

  const stepColor = STEP_COLORS.seance;

  const { chatButtonRef } = useChatButtonRef();

  const {
    sessionTime,
    restTime,
    isSessionRunning,
    isResting,
    isPreparingExercise,
    isPreparingSet,
    startSession,
    pauseSession,
    startRest,
    skipRest,
    formatTime,
    startExercisePreparation,
    finishExercisePreparation,
    startSetPreparation,
    finishSetPreparation,
    resetSession,
  } = useSessionTimer();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [exerciseFeedbacks, setExerciseFeedbacks] = useState<ExerciseFeedback[]>([]);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showWarmup, setShowWarmup] = useState(false);
  const [warmupCompleted, setWarmupCompleted] = useState(false);
  const [showExerciseCountdown, setShowExerciseCountdown] = useState(false);
  const [showSetCountdown, setShowSetCountdown] = useState(false);
  const [showTransitionCountdown, setShowTransitionCountdown] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [userFeedbackText, setUserFeedbackText] = useState('');
  const [isContentReady, setIsContentReady] = useState(false);
  const [showExerciseSkeleton, setShowExerciseSkeleton] = useState(false);
  const [showProgressionGuide, setShowProgressionGuide] = useState(() => {
    // Check localStorage to see if user has already seen the guide
    const hasSeenGuide = localStorage.getItem('force-progression-guide-seen');
    return !hasSeenGuide;
  });

  const exerciseCardRef = useRef<HTMLDivElement>(null);
  const timerCardRef = useRef<HTMLDivElement>(null);

  const { user } = useUserStore();

  // Exercise illustrations
  const { getIllustration, preloadFromCache } = useExerciseIllustrations();

  // Wearable tracking integration
  const wearableTracking = useWearableTracking({
    sessionId: currentSessionId,
    userId: user?.id || '',
    autoStart: false
  });

  const getExercises = () => {
    if (!sessionPrescription) return [];
    return getWorkoutItems(sessionPrescription);
  };

  const exercises = getExercises();
  const isEnduranceSession = !!sessionPrescription?.mainWorkout;
  const isFunctionalSession = sessionPrescription?.category === 'functional-crosstraining' ||
                               sessionPrescription?.type?.toLowerCase().includes('functional') ||
                               !!(sessionPrescription as any)?.wodFormat;
  const isCompetitionSession = !!(sessionPrescription as any)?.competitionFormat || !!(sessionPrescription as any)?.stations;

  useEffect(() => {
    if (!sessionPrescription) {
      navigate('/training/pipeline');
    }
  }, [sessionPrescription, navigate]);

  useEffect(() => {
    if (sessionPrescription && currentSessionId) {
      trainingCoachNotificationService.initialize(currentSessionId);
    }

    return () => {
      trainingCoachNotificationService.cleanup();
    };
  }, [sessionPrescription, currentSessionId]);

  const scrollToExerciseCard = () => {
    // Scroll immédiatement après le countdown (0 délai au lieu de 500ms)
    setTimeout(() => {
      if (exerciseCardRef.current) {
        const element = exerciseCardRef.current;
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        // Calculer offset pour garder visible timer + progress header
        const offset = window.innerHeight * 0.2;
        const scrollPosition = absoluteElementTop - offset;

        window.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
        Haptics.tap();
      }
    }, 0);
  };

  const scrollToTimerCard = () => {
    setTimeout(() => {
      if (timerCardRef.current) {
        const element = timerCardRef.current;
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const offset = window.innerHeight * 0.15;
        const scrollPosition = absoluteElementTop - offset;

        window.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
        Haptics.tap();
      }
    }, 500);
  };


  const scrollToExerciseCardForFeedback = () => {
    setTimeout(() => {
      if (exerciseCardRef.current) {
        const element = exerciseCardRef.current;
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const offset = window.innerHeight * 0.18;
        const scrollPosition = absoluteElementTop - offset;

        window.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
        Haptics.tap();
      }
    }, 400);
  };

  if (!sessionPrescription) {
    return null;
  }

  // ENDURANCE SESSION - Skip all warmup/countdown logic
  if (isEnduranceSession) {
    // Validation: ensure we have prescription and user before rendering
    if (!sessionPrescription || !currentSessionId || !user?.id) {
      logger.error('STEP_3_SEANCE', 'Missing required data for endurance session', {
        hasPrescription: !!sessionPrescription,
        hasSessionId: !!currentSessionId,
        hasUserId: !!user?.id
      });
      return (
        <StepContainer>
          <GlassCard className="p-8 text-center">
            <SpatialIcon
              Icon={ICONS.AlertCircle}
              size={64}
              style={{ color: '#EF4444', margin: '0 auto 1.5rem' }}
            />
            <h3 className="text-xl font-bold text-white mb-4">
              Données de session manquantes
            </h3>
            <p className="text-white/70 mb-6">
              Impossible de démarrer la séance d'endurance. Veuillez retourner à l'étape précédente.
            </p>
            <TrainingButton
              variant="secondary"
              size="lg"
              icon="ArrowLeft"
              onClick={goToPreviousStep}
            >
              Retour
            </TrainingButton>
          </GlassCard>
        </StepContainer>
      );
    }

    return (
      <>
        <TrainingCoachNotificationBubble chatButtonRef={chatButtonRef} isStep1={false} />
        <EnduranceSessionDisplay
          sessionId={currentSessionId}
          prescription={sessionPrescription as any}
          userId={user.id}
          wearableTracking={wearableTracking}
          onComplete={async (metrics) => {
            logger.info('STEP_3_TO_STEP_4', 'Endurance session completed, transitioning to Step 4', {
              sessionId: currentSessionId,
              metrics,
              timestamp: new Date().toISOString()
            });

            // Convert endurance metrics to SessionFeedback format
            const enduranceToSessionFeedback = {
              warmupCompleted: true,
              exercises: [], // Empty for endurance sessions
              durationActual: metrics.totalDuration || 0,
              overallRpe: 7, // Default RPE for endurance
              effortPerceived: 7,
              enjoyment: 8,
              userFeedbackText: metrics.userFeedbackText || undefined,
              // Store endurance-specific data in notes
              notes: JSON.stringify({
                type: 'endurance',
                discipline: sessionPrescription.discipline,
                blocksCompleted: metrics.blocksCompleted || 0,
                intervalsCompleted: metrics.intervalsCompleted || 0,
                zonesDistribution: metrics.zonesDistribution || {},
              }),
            };

            setSessionFeedback(enduranceToSessionFeedback);
            goToNextStep();
          }}
          onExit={() => {
            logger.info('STEP3_SEANCE', 'Exiting endurance session');
            goToPreviousStep();
          }}
        />
      </>
    );
  }

  // COMPETITION SESSION - Use dedicated Competition component
  if (isCompetitionSession) {
    // Validation: ensure we have prescription and user before rendering
    if (!sessionPrescription || !currentSessionId || !user?.id) {
      logger.error('STEP_3_SEANCE', 'Missing required data for competition session', {
        hasPrescription: !!sessionPrescription,
        hasSessionId: !!currentSessionId,
        hasUserId: !!user?.id
      });
      return (
        <StepContainer>
          <GlassCard className="p-8 text-center">
            <SpatialIcon
              Icon={ICONS.AlertCircle}
              size={64}
              style={{ color: '#EF4444', margin: '0 auto 1.5rem' }}
            />
            <h3 className="text-xl font-bold text-white mb-4">
              Données de session manquantes
            </h3>
            <p className="text-white/70 mb-6">
              Impossible de démarrer la séance de compétition. Veuillez retourner à l'étape précédente.
            </p>
            <TrainingButton
              variant="secondary"
              size="lg"
              icon="ArrowLeft"
              onClick={goToPreviousStep}
            >
              Retour
            </TrainingButton>
          </GlassCard>
        </StepContainer>
      );
    }

    return (
      <>
        <TrainingCoachNotificationBubble chatButtonRef={chatButtonRef} isStep1={false} />
        <CompetitionSessionDisplay
          sessionId={currentSessionId}
          sessionName={(sessionPrescription as any).name || 'Séance de Compétition'}
          competitionFormat={(sessionPrescription as any).competitionFormat || 'Competition'}
          stations={(sessionPrescription as any).stations || []}
          userId={user.id}
          wearableTracking={wearableTracking}
          onComplete={async (metrics) => {
            logger.info('STEP_3_COMPETITION_METRICS_RAW', 'Raw metrics from CompetitionSessionDisplay', {
              sessionId: currentSessionId,
              metricsReceived: JSON.stringify(metrics),
              totalTime: metrics.totalTime,
              stationsCompleted: metrics.stationsCompleted,
              stationTimesLength: metrics.stationTimes?.length,
              stationTimesArray: metrics.stationTimes,
              hasUserFeedback: !!metrics.userFeedbackText,
              timestamp: new Date().toISOString()
            });

            // Convert competition metrics to SessionFeedback format
            const competitionToSessionFeedback = {
              warmupCompleted: true,
              exercises: [], // Empty for competition sessions
              durationActual: metrics.totalTime || 0,
              overallRpe: 8, // Default RPE for competition
              effortPerceived: 8,
              enjoyment: 8,
              userFeedbackText: metrics.userFeedbackText || undefined,
              // CRITICAL: Store competition-specific data in dedicated field
              competitionMetrics: {
                totalTime: metrics.totalTime || 0,
                stationsCompleted: metrics.stationsCompleted || 0,
                stationTimes: metrics.stationTimes || [],
                competitionFormat: (sessionPrescription as any).competitionFormat,
                userFeedbackText: metrics.userFeedbackText
              },
              // Also keep in notes for backward compatibility
              notes: JSON.stringify({
                type: 'competition',
                discipline: sessionPrescription.discipline,
                stationsCompleted: metrics.stationsCompleted || 0,
                stationTimes: metrics.stationTimes || [],
              }),
            };

            logger.info('STEP_3_COMPETITION_FEEDBACK_CREATED', 'Feedback object created BEFORE setSessionFeedback', {
              sessionId: currentSessionId,
              feedbackKeys: Object.keys(competitionToSessionFeedback),
              hasCompetitionMetrics: !!competitionToSessionFeedback.competitionMetrics,
              competitionMetricsContent: JSON.stringify(competitionToSessionFeedback.competitionMetrics),
              durationActual: competitionToSessionFeedback.durationActual,
              exercisesLength: competitionToSessionFeedback.exercises.length
            });

            setSessionFeedback(competitionToSessionFeedback);

            logger.info('STEP_3_TO_STEP_4', 'Competition session completed, transitioning to Step 4', {
              sessionId: currentSessionId,
              feedbackSet: true,
              timestamp: new Date().toISOString()
            });

            goToNextStep();
          }}
          onExit={() => {
            logger.info('STEP3_SEANCE', 'Exiting competition session');
            goToPreviousStep();
          }}
          disciplineColor={stepColor}
        />
      </>
    );
  }

  // FUNCTIONAL SESSION - Use dedicated WOD component
  if (isFunctionalSession) {
    // Validation: ensure we have prescription and user before rendering
    if (!sessionPrescription || !currentSessionId || !user?.id) {
      logger.error('STEP_3_SEANCE', 'Missing required data for functional session', {
        hasPrescription: !!sessionPrescription,
        hasSessionId: !!currentSessionId,
        hasUserId: !!user?.id
      });
      return (
        <StepContainer>
          <GlassCard className="p-8 text-center">
            <SpatialIcon
              Icon={ICONS.AlertCircle}
              size={64}
              style={{ color: '#EF4444', margin: '0 auto 1.5rem' }}
            />
            <h3 className="text-xl font-bold text-white mb-4">
              Données de session manquantes
            </h3>
            <p className="text-white/70 mb-6">
              Impossible de démarrer la séance fonctionnelle. Veuillez retourner à l'étape précédente.
            </p>
            <TrainingButton
              variant="secondary"
              size="lg"
              icon="ArrowLeft"
              onClick={goToPreviousStep}
            >
              Retour
            </TrainingButton>
          </GlassCard>
        </StepContainer>
      );
    }

    return (
      <>
        <TrainingCoachNotificationBubble chatButtonRef={chatButtonRef} isStep1={false} />
        <FunctionalSessionDisplay
          sessionId={currentSessionId}
          prescription={sessionPrescription as any}
          userId={user.id}
          wearableTracking={wearableTracking}
          onComplete={async (metrics) => {
            logger.info('STEP_3_TO_STEP_4', 'Functional session completed, transitioning to Step 4', {
              sessionId: currentSessionId,
              metricsReceived: {
                wodFormat: metrics.wodFormat,
                roundsCompleted: metrics.roundsCompleted,
                totalReps: metrics.totalReps,
                totalTime: metrics.totalTime,
                timeCapReached: metrics.timeCapReached,
                wodName: metrics.wodName,
                hasUserFeedback: !!metrics.userFeedbackText
              },
              timestamp: new Date().toISOString()
            });

            // Collect wearable data for functional session
            let wearableMetrics = null;
            if (wearableTracking.isTracking) {
              try {
                wearableMetrics = await wearableTracking.stopTracking();
                logger.info('STEP_3_WEARABLE_FUNCTIONAL', 'Wearable data collected', {
                  sessionId: currentSessionId,
                  hasData: !!wearableMetrics
                });
              } catch (error) {
                logger.error('STEP_3_WEARABLE_FUNCTIONAL', 'Failed to collect', { error });
              }
            }

            // Convert functional metrics to SessionFeedback format
            const functionalToSessionFeedback = {
              warmupCompleted: true,
              exercises: [], // Empty for functional sessions
              durationActual: metrics.totalTime || 0,
              overallRpe: 8, // Default RPE for functional
              effortPerceived: 8,
              enjoyment: 8,
              userFeedbackText: metrics.userFeedbackText || undefined,
              functionalMetrics: {
                wodFormat: metrics.wodFormat,
                roundsCompleted: metrics.roundsCompleted || 0,
                totalReps: metrics.totalReps || 0,
                timeCapReached: metrics.timeCapReached || false,
                wodName: metrics.wodName || 'WOD',
              },
              wearableMetrics: wearableMetrics || undefined,
              wearableDeviceUsed: wearableTracking.deviceInfo?.deviceName,
              hrTrackingEnabled: wearableTracking.isTracking
            };

            logger.info('STEP_3_TO_STEP_4', 'SessionFeedback constructed for functional session', {
              feedback: {
                durationActual: functionalToSessionFeedback.durationActual,
                overallRpe: functionalToSessionFeedback.overallRpe,
                hasUserFeedback: !!functionalToSessionFeedback.userFeedbackText,
                functionalMetrics: functionalToSessionFeedback.functionalMetrics
              }
            });

            setSessionFeedback(functionalToSessionFeedback);

            logger.info('STEP_3_TO_STEP_4', 'Navigating to Step 4', {
              sessionId: currentSessionId
            });

            goToNextStep();
          }}
          onExit={() => {
            logger.info('STEP3_SEANCE', 'Exiting functional session');
            goToPreviousStep();
          }}
        />
      </>
    );
  }

  // FORCE SESSION - Continue with normal logic
  const currentExercise = exercises[currentExerciseIndex];
  const nextExercise = exercises[currentExerciseIndex + 1];
  const isLastExercise = currentExerciseIndex >= exercises.length - 1;

  // CRITICAL: Guard against undefined currentExercise (can happen if prescription normalization failed)
  if (!currentExercise && !isEnduranceSession && !isFunctionalSession) {
    logger.error('STEP_3_SEANCE', 'currentExercise is undefined - prescription normalization may have failed', {
      currentExerciseIndex,
      exercisesLength: exercises.length,
      sessionPrescriptionKeys: sessionPrescription ? Object.keys(sessionPrescription) : [],
      hasExercises: !!sessionPrescription?.exercises,
      exercisesCount: sessionPrescription?.exercises?.length || 0,
      hasMainWorkout: !!sessionPrescription?.mainWorkout,
      mainWorkoutCount: sessionPrescription?.mainWorkout?.length || 0,
      hasStations: !!(sessionPrescription as any)?.stations,
      stationsCount: (sessionPrescription as any)?.stations?.length || 0,
      competitionFormat: (sessionPrescription as any)?.competitionFormat
    });

    return (
      <StepContainer
        title="Erreur de chargement"
        subtitle="Impossible de charger la séance"
        stepColor={stepColor}
      >
        <GlassCard variant="primary">
          <div className="text-center py-12">
            <SpatialIcon Icon={ICONS.AlertTriangle} size={64} className="mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-bold text-white mb-2">Erreur de normalisation</h3>
            <p className="text-white/70 mb-6">
              La séance n'a pas pu être correctement chargée. Les exercices sont introuvables.
            </p>
            <TrainingButton
              variant="primary"
              onClick={() => navigate('/training/pipeline')}
              icon="ArrowLeft"
            >
              Retour à l'étape précédente
            </TrainingButton>
          </div>
        </GlassCard>
      </StepContainer>
    );
  }

  const handleStartSession = async () => {
    setSessionStarted(true);

    // Start wearable tracking when session begins
    if (wearableTracking.hasWearable && !wearableTracking.isTracking) {
      try {
        await wearableTracking.startTracking();
        logger.info('STEP_3_WEARABLE', 'Started wearable tracking', {
          sessionId: currentSessionId,
          deviceName: wearableTracking.deviceInfo?.deviceName
        });
      } catch (error) {
        logger.error('STEP_3_WEARABLE', 'Failed to start tracking', { error });
      }
    }

    if (sessionPrescription.warmup && !warmupCompleted) {
      setShowWarmup(true);
      Haptics.press();
      logger.info('STEP_3_SEANCE', 'Starting warmup phase', {
        warmupDuration: sessionPrescription.warmup.duration,
        exercisesCount: sessionPrescription.warmup.exercises?.length || 0
      });
      return;
    }

    setShowExerciseCountdown(true);
    startExercisePreparation();
    Haptics.press();

    const context: TrainingNotificationContext = {
      exerciseName: currentExercise.name,
      exerciseVariant: currentExercise.variant,
      totalExercises: exercises.length,
      currentExerciseIndex: 0
    };

    trainingCoachNotificationService.onArrival(context);

    logger.info('STEP_3_SEANCE', 'Session started', {
      sessionId: currentSessionId,
      exerciseCount: exercises.length,
      timestamp: new Date().toISOString(),
    });
  };

  const handleWarmupComplete = () => {
    setShowWarmup(false);
    setWarmupCompleted(true);
    Haptics.success();
    logger.info('STEP_3_SEANCE', 'Warmup completed', {
      timestamp: new Date().toISOString()
    });

    setShowExerciseCountdown(true);
    startExercisePreparation();
  };

  const handleWarmupSkip = () => {
    setShowWarmup(false);
    setWarmupCompleted(true);
    Haptics.warning();
    logger.info('STEP_3_SEANCE', 'Warmup skipped', {
      timestamp: new Date().toISOString()
    });

    setShowExerciseCountdown(true);
    startExercisePreparation();
  };

  const handleExerciseCountdownComplete = () => {
    setShowExerciseCountdown(false);
    finishExercisePreparation();
    startSession();
  };

  const handleSetCountdownComplete = () => {
    const loadForCurrentSet = getLoadForSet(currentExercise.load, currentSet);

    logger.info('STEP_3_SEANCE', 'Set countdown complete, starting set', {
      exercise: currentExercise.name,
      currentSet,
      loadForCurrentSet,
      exerciseLoad: currentExercise.load,
      timestamp: new Date().toISOString()
    });

    setShowSetCountdown(false);
    finishSetPreparation();
    startSession();
  };

  const handlePlayPause = () => {
    if (isSessionRunning) {
      pauseSession();
      Haptics.tap();
      trainingCoachNotificationService.onSessionPaused(isResting, {
        exerciseName: currentExercise.name,
        restTime: isResting ? restTime : undefined
      });
      logger.debug('STEP_3_SEANCE', 'Session paused', { sessionTime, isResting });
    } else {
      if (!sessionStarted) {
        handleStartSession();
      } else {
        startSession();
        Haptics.tap();
        trainingCoachNotificationService.onSessionResumed(isResting, {
          exerciseName: currentExercise.name,
          restTime: isResting ? restTime : undefined
        });
        logger.debug('STEP_3_SEANCE', 'Session resumed', { sessionTime, isResting });
      }
    }
  };

  const handleStop = () => {
    setShowStopConfirmation(true);
    Haptics.press();
  };

  const handleStopConfirm = () => {
    pauseSession();
    resetSession();
    resetPipeline();
    setShowStopConfirmation(false);
    Haptics.warning();
    logger.info('STEP_3_SEANCE', 'Session stopped by user', {
      sessionId: currentSessionId,
      completedExercises: currentExerciseIndex,
      totalExercises: exercises.length,
      sessionDuration: sessionTime,
    });
    navigate('/training');
  };

  const handleStopCancel = () => {
    setShowStopConfirmation(false);
    Haptics.tap();
  };

  const handleSetComplete = () => {
    if (currentSet < currentExercise.sets) {
      const context: TrainingNotificationContext = {
        exerciseName: currentExercise.name,
        currentSet,
        totalSets: currentExercise.sets
      };

      trainingCoachNotificationService.onSetComplete(context);

      const currentLoad = getLoadForSet(currentExercise.load, currentSet);
      const nextSetLoad = getLoadForSet(currentExercise.load, currentSet + 1);

      logger.debug('STEP_3_SEANCE', 'Set completed', {
        exercise: currentExercise.name,
        set: currentSet,
        totalSets: currentExercise.sets,
        currentLoad,
        nextSetLoad,
        exerciseLoad: currentExercise.load
      });

      setCurrentSet(currentSet + 1);
      startRest(currentExercise.rest);
      Haptics.success();

      setTimeout(() => {
        if (timerCardRef.current) {
          const element = timerCardRef.current;
          const elementRect = element.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const offset = window.innerHeight * 0.12;
          const scrollPosition = absoluteElementTop - offset;

          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  };

  const handleRestComplete = () => {
    pauseSession();
    setShowTransitionCountdown(true);
  };

  const handleTransitionComplete = () => {
    const loadForCurrentSet = getLoadForSet(currentExercise.load, currentSet);

    logger.info('STEP_3_SEANCE', 'Transition complete, starting next set', {
      exercise: currentExercise.name,
      currentSet,
      loadForCurrentSet,
      exerciseLoad: currentExercise.load,
      timestamp: new Date().toISOString()
    });

    setShowTransitionCountdown(false);
    startSession();
    scrollToExerciseCard();

    trainingCoachNotificationService.onTransitionReady({
      exerciseName: currentExercise.name,
      currentSet
    });
  };

  useEffect(() => {
    if (restTime === 0 && isResting) {
      handleRestComplete();
    }
  }, [restTime, isResting]);

  useEffect(() => {
    if (isResting && restTime > 0 && restTime === currentExercise.rest) {
      // Calculate progression info for ramping sets
      const currentLoad = getLoadForSet(currentExercise.load, currentSet);
      const nextSetLoad = getLoadForSet(currentExercise.load, currentSet + 1);

      let loadIncrement = 0;
      if (currentLoad !== null && nextSetLoad !== null) {
        loadIncrement = nextSetLoad - currentLoad;
      }

      const context: TrainingNotificationContext = {
        exerciseName: currentExercise.name,
        nextExerciseName: nextExercise?.name,
        nextExerciseVariant: nextExercise?.variant,
        restTime,
        currentSet,
        totalSets: currentExercise.sets,
        newLoad: nextSetLoad || undefined,
        loadIncrement: loadIncrement > 0 ? loadIncrement : undefined
      };

      trainingCoachNotificationService.onRestPhase(context);
    }
  }, [isResting, restTime, currentExercise, nextExercise, currentSet]);

  useEffect(() => {
    if (sessionStarted && !showExerciseCountdown && !showSetCountdown && !showTransitionCountdown) {
      if (isResting) {
        scrollToTimerCard();
      } else {
        scrollToExerciseCard();
      }
    }
  }, [isResting, sessionStarted, showExerciseCountdown, showSetCountdown, showTransitionCountdown]);

  const handleExerciseComplete = (rpe: number) => {
    const feedback: ExerciseFeedback = {
      exerciseId: currentExercise.id,
      completed: true,
      setsCompleted: currentExercise.sets,
      repsActual: Array(currentExercise.sets).fill(currentExercise.reps),
      loadUsed: currentExercise.load,
      rpe,
      hadPain: false,
      technique: 8,
      wasSubstituted: false,
    };

    setExerciseFeedbacks([...exerciseFeedbacks, feedback]);

    Haptics.success();

    const context: TrainingNotificationContext = {
      exerciseName: currentExercise.name,
      rpe,
      currentExerciseIndex,
      totalExercises: getWorkoutItemsCount(sessionPrescription)
    };

    trainingCoachNotificationService.onRPEFeedback(rpe, context);
    trainingCoachNotificationService.onExerciseComplete(context);

    logger.info('STEP_3_SEANCE', 'Exercise completed', {
      exercise: currentExercise.name,
      rpe,
      setsCompleted: currentExercise.sets,
    });

    if (isLastExercise) {
      logger.info('STEP_3_TO_STEP_4', 'All exercises completed, transitioning to Step 4', {
        sessionId: currentSessionId,
        totalExercises: exercises.length,
        sessionDuration: sessionTime,
        averageRpe: Math.round(exerciseFeedbacks.reduce((sum, ex) => sum + (ex.rpe || 0), 0) / exerciseFeedbacks.length),
        timestamp: new Date().toISOString()
      });
      handleSessionComplete();
    } else {
      setShowExerciseSkeleton(true);
      setTimeout(() => {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setShowExerciseCountdown(true);
        startExercisePreparation();
        pauseSession();
        setShowExerciseSkeleton(false);

        const nextExerciseContext: TrainingNotificationContext = {
          exerciseName: nextExercise?.name,
          exerciseVariant: nextExercise?.variant,
          currentExerciseIndex: currentExerciseIndex + 1,
          totalExercises: getWorkoutItemsCount(sessionPrescription)
        };

        trainingCoachNotificationService.queueNotification(
          'step3-new-exercise',
          2000,
          nextExerciseContext
        );
      }, 300);
    }
  };

  const handleAdjustLoad = (newLoad: number | number[]) => {
    const oldLoad = currentExercise.load;

    // Update load through the store to trigger re-renders
    updateExerciseLoad(currentExerciseIndex, newLoad);

    Haptics.tap();

    const loadValue = typeof newLoad === 'number' ? newLoad : (Array.isArray(newLoad) ? newLoad[newLoad.length - 1] : 0);
    const oldLoadValue = typeof oldLoad === 'number' ? oldLoad : (Array.isArray(oldLoad) ? oldLoad[oldLoad.length - 1] : 0);

    const context: TrainingNotificationContext = {
      exerciseName: currentExercise.name,
      load: loadValue
    };

    if (loadValue > (oldLoadValue || 0)) {
      trainingCoachNotificationService.onLoadAdjustUp(context);
    } else {
      trainingCoachNotificationService.onLoadAdjustDown(context);
    }

    logger.info('STEP_3_SEANCE', 'Load adjusted', {
      exercise: currentExercise.name,
      exerciseIndex: currentExerciseIndex,
      oldLoad,
      newLoad,
      isRamping: Array.isArray(newLoad),
      timestamp: new Date().toISOString()
    });
  };

  const handleSkipRest = () => {
    const currentLoad = getLoadForSet(currentExercise.load, currentSet);

    logger.info('STEP_3_SEANCE', 'Rest skipped', {
      exercise: currentExercise.name,
      currentSet,
      nextSet: currentSet,
      loadForNextSet: currentLoad,
      exerciseLoad: currentExercise.load,
      timestamp: new Date().toISOString()
    });

    skipRest();
    pauseSession();
    setShowSetCountdown(true);
    startSetPreparation();
    Haptics.tap();
  };

  const handleSessionComplete = async () => {
    pauseSession();

    // Collect wearable data if tracking was active
    let wearableMetrics = null;
    if (wearableTracking.isTracking) {
      try {
        wearableMetrics = await wearableTracking.stopTracking();
        logger.info('STEP_3_WEARABLE', 'Wearable data collected', {
          sessionId: currentSessionId,
          hasData: !!wearableMetrics,
          dataQuality: wearableMetrics?.dataQuality
        });
      } catch (error) {
        logger.error('STEP_3_WEARABLE', 'Failed to collect wearable data', { error });
      }
    }

    const sessionFeedback = {
      warmupCompleted,
      warmupDuration: warmupCompleted && sessionPrescription.warmup ? sessionPrescription.warmup.duration : undefined,
      exercises: exerciseFeedbacks,
      durationActual: sessionTime,
      overallRpe: Math.round(
        exerciseFeedbacks.reduce((sum, ex) => sum + (ex.rpe || 0), 0) / exerciseFeedbacks.length
      ),
      effortPerceived: 8,
      enjoyment: 8,
      wearableMetrics: wearableMetrics || undefined,
      wearableDeviceUsed: wearableTracking.deviceInfo?.deviceName,
      hrTrackingEnabled: wearableTracking.isTracking
    };

    setSessionFeedback(sessionFeedback);

    Haptics.success();

    logger.info('STEP_3_SEANCE', 'Session completed, showing feedback modal', {
      sessionId: currentSessionId,
      duration: sessionTime,
      exercisesCompleted: exerciseFeedbacks.length,
      averageRpe: sessionFeedback.overallRpe,
      timestamp: new Date().toISOString(),
    });

    // Show feedback modal before going to next step
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = (feedbackText: string) => {
    setUserFeedbackText(feedbackText);
    setShowFeedbackModal(false);

    // Update session feedback with user feedback text
    setSessionFeedback((prev) => ({
      ...prev!,
      userFeedbackText: feedbackText,
    }));

    logger.info('STEP_3_SEANCE', 'User feedback submitted', {
      sessionId: currentSessionId,
      feedbackLength: feedbackText.length,
    });

    // Continue to step 4
    goToNextStep();
  };

  const handleFeedbackSkip = () => {
    setShowFeedbackModal(false);

    logger.info('STEP_3_SEANCE', 'User feedback skipped');

    // Continue to step 4 without feedback
    goToNextStep();
  };

  const handleDismissProgressionGuide = () => {
    setShowProgressionGuide(false);
    localStorage.setItem('force-progression-guide-seen', 'true');
    Haptics.tap();
    logger.info('STEP_3_SEANCE', 'Force progression guide dismissed');
  };


  if (!sessionStarted) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <StepContainer>
            <GlassCard
              className="p-12 text-center space-y-8"
              style={{
                background: `
                  radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `2px solid color-mix(in srgb, ${stepColor} 25%, transparent)`,
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.25),
                  0 0 40px color-mix(in srgb, ${stepColor} 18%, transparent),
                  inset 0 1px 0 rgba(255, 255, 255, 0.12)
                `,
              }}
            >
          {/* Pre-Session Briefing with sessionName and summary */}
          <PreSessionBriefing prescription={sessionPrescription} stepColor={stepColor} />

          {/* Session Summary Stats */}
          <SessionSummaryStats prescription={sessionPrescription} stepColor={stepColor} />

          <div className="flex gap-4">
            <TrainingButton
              variant="secondary"
              size="lg"
              icon="ArrowLeft"
              onClick={goToPreviousStep}
            >
              Retour
            </TrainingButton>
            <TrainingButton
              variant="primary"
              size="lg"
              icon="Play"
              iconPosition="right"
              onClick={handleStartSession}
              fullWidth
              stepColor={stepColor}
            >
              Commencer la Séance
            </TrainingButton>
          </div>

            </GlassCard>
          </StepContainer>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <TrainingCoachNotificationBubble chatButtonRef={chatButtonRef} isStep1={false} />
      <motion.div
        className="relative"
        style={{ paddingBottom: '16px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => setIsContentReady(true)}
      >
      {/* Warmup Phase Modal */}
      <AnimatePresence mode="wait">
        {showWarmup && sessionPrescription.warmup && (
          <WarmupPhaseCard
            warmup={sessionPrescription.warmup}
            stepColor={stepColor}
            onComplete={handleWarmupComplete}
            onSkip={handleWarmupSkip}
          />
        )}
      </AnimatePresence>

      {/* Preparation Countdown Modal */}
      <AnimatePresence mode="wait">
        {showExerciseCountdown && (
          <PreparationCountdown
            duration={10}
            exerciseName={currentExercise.name}
            exerciseVariant={currentExercise.variant}
            onComplete={handleExerciseCountdownComplete}
            stepColor={stepColor}
          />
        )}
      </AnimatePresence>

      {/* Set Countdown Overlay */}
      <AnimatePresence mode="wait">
        {showSetCountdown && (
          <SetCountdown
            duration={3}
            onComplete={handleSetCountdownComplete}
            stepColor={stepColor}
          />
        )}
      </AnimatePresence>

      {/* Transition Countdown - Between rest and new exercise */}
      <AnimatePresence mode="wait">
        {showTransitionCountdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          >
            <div className="max-w-md w-full">
              <TransitionCountdown
                duration={3}
                onComplete={handleTransitionComplete}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Hidden during SetCountdown and TransitionCountdown */}
      {!showSetCountdown && !showTransitionCountdown && isContentReady && (
      <div className="space-y-3" style={{ paddingTop: '12px', paddingBottom: '16px' }}>
        {/* Progress Header with Integrated Timer & Controls */}
        <div style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '16px', marginBottom: '24px' }}>
          <TrainingProgressHeader
            steps={steps}
            currentStep="seance"
            progress={progress}
            sessionMode={true}
            sessionTime={sessionTime}
            restTime={restTime}
            isResting={isResting}
            isSessionRunning={isSessionRunning}
            formatTime={formatTime}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            currentExerciseIndex={currentExerciseIndex}
            totalExercises={getWorkoutItemsCount(sessionPrescription)}
          />
        </div>

        {/* Current Exercise Card - Seul l'exercice actif est visible */}
        <div ref={exerciseCardRef} style={{ scrollMarginTop: '80px' }}>
          <AnimatePresence mode="wait">
            {showExerciseSkeleton ? (
              <motion.div
                key="exercise-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ExerciseSessionCardSkeleton stepColor={stepColor} />
              </motion.div>
            ) : (
              <motion.div
                key={currentExercise.id}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <ExerciseSessionCard
                  exercise={currentExercise}
                  exerciseIndex={currentExerciseIndex}
                  stepColor={stepColor}
                  currentSet={currentSet}
                  onSetComplete={handleSetComplete}
                  onExerciseComplete={handleExerciseComplete}
                  onAdjustLoad={handleAdjustLoad}
                  onSkipRest={handleSkipRest}
                  restTimeRemaining={restTime}
                  isResting={isResting}
                  onFeedbackStateEntered={scrollToExerciseCardForFeedback}
                  wearableTracking={wearableTracking}
                  discipline={sessionPrescription?.discipline || sessionPrescription?.category || 'force'}
                  showIllustration={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Force Progression Guide - Shown after exercise cards */}
        {showProgressionGuide && (
          <ForceProgressionGuide
            isVisible={showProgressionGuide}
            onDismiss={handleDismissProgressionGuide}
            stepColor={stepColor}
          />
        )}
      </div>
      )}

      {/* Removed: Action buttons now in Progress Header */}

      {/* Stop Confirmation Modal */}
      <AnimatePresence>
        {showStopConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={handleStopCancel}
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
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.2)',
                }}
              >
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <SpatialIcon
                      Icon={ICONS.StopCircle}
                      size={56}
                      style={{
                        color: '#EF4444',
                        filter: 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.5))',
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Arrêter la séance ?</h3>
                    <p className="text-white/70 mb-3">
                      Votre progression ne sera pas sauvegardée si vous quittez maintenant.
                    </p>
                  </div>

                  <div
                    className="text-sm px-4 py-3 rounded-xl"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <p className="text-red-400 font-semibold">⚠️ Attention</p>
                    <p className="text-white/60 text-xs mt-1">
                      Exercices réalisés : {currentExerciseIndex} / {exercises.length}
                    </p>
                    <p className="text-white/60 text-xs">
                      Temps écoulé : {formatTime(sessionTime)}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <TrainingButton
                      variant="secondary"
                      size="lg"
                      onClick={handleStopCancel}
                      fullWidth
                    >
                      Continuer
                    </TrainingButton>
                    <TrainingButton
                      variant="primary"
                      size="lg"
                      onClick={handleStopConfirm}
                      fullWidth
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '2px solid rgba(239, 68, 68, 0.4)',
                        color: '#EF4444',
                      }}
                    >
                      Arrêter
                    </TrainingButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Feedback Modal */}
      {showFeedbackModal && currentSessionId && user && (
        <SessionFeedbackModal
          sessionId={currentSessionId}
          userId={user.id}
          isOpen={showFeedbackModal}
          onClose={handleFeedbackSkip}
          onSubmit={handleFeedbackSubmit}
          stepColor={stepColor}
        />
      )}

      {/* Dev Mode Controls - Universal for Force sessions */}
      <DevModeControls
        onSkipWarmup={warmupCompleted ? undefined : handleWarmupSkip}
        onSkipCountdown={showExerciseCountdown || showSetCountdown || showTransitionCountdown ? () => {
          if (showExerciseCountdown) {
            handleExerciseCountdownComplete();
          } else if (showSetCountdown) {
            handleSetCountdownComplete();
          } else if (showTransitionCountdown) {
            handleTransitionComplete();
          }
        } : undefined}
        onSkipSet={currentSet < currentExercise.sets ? handleSetComplete : undefined}
        onSkipBlock={() => {
          const feedback: ExerciseFeedback = {
            exerciseId: currentExercise.id,
            completed: true,
            setsCompleted: currentExercise.sets,
            repsActual: Array(currentExercise.sets).fill(currentExercise.reps),
            loadUsed: currentExercise.load,
            rpe: 7,
            hadPain: false,
            technique: 8,
            wasSubstituted: false,
          };
          setExerciseFeedbacks([...exerciseFeedbacks, feedback]);
          handleExerciseComplete(7);
        }}
        onComplete={handleSessionComplete}
        currentBlock={`Ex ${currentExerciseIndex + 1} - Set ${currentSet}`}
        totalBlocks={exercises.length}
        sessionType="force"
        additionalInfo={`${currentExercise.name} ${currentExercise.variant || ''}`}
      />

    </motion.div>
    </>
  );
};

const Step3Seance: React.FC = () => {
  return (
    <SessionGuard
      step="seance"
      requiresPrescription={true}
      requiresSessionStarted={false}
      requiresFeedback={false}
    >
      <Step3SeanceContent />
    </SessionGuard>
  );
};

export default Step3Seance;

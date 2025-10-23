/**
 * Endurance Session Display
 * Main component for live endurance session tracking
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  EnduranceSessionPrescription,
  EnduranceSessionState,
  EnduranceBlock,
  HeartRateZone,
} from '../../../../../domain/enduranceSession';
import { DISCIPLINE_CONFIGS } from '../../../../../domain/enduranceSession';
import { enduranceMotivationEngine } from '../../../../../system/services/enduranceMotivationEngine';
import { enduranceSessionService } from '../../../../../system/services/enduranceSessionService';
import { enduranceCoachNotificationService } from '../../../../../system/services/enduranceCoachNotificationService';
import { Haptics } from '../../../../../utils/haptics';
import logger from '../../../../../lib/utils/logger';
import { useEnduranceTimer, useEnduranceNotifications } from '../hooks';
import { formatTime, calculateSessionProgress, scrollToElement } from '../utils';
import { gpsTrackingService } from '../../../../../system/services/gpsTrackingService';
import type { GPSCoordinate, RouteStats } from '../../../../../system/services/gpsTrackingService';
import EnduranceBlockCard from './EnduranceBlockCard';
import EnduranceStopModal from '../modals/EnduranceStopModal';
import EnduranceCountdownHelper from '../modals/EnduranceCountdownHelper';
import { EnduranceProgressionGuide } from '../widgets';
import DevModeControls from '../../DevModeControls';
import TrainingProgressHeader from '../../../../../app/pages/Training/Pipeline/components/TrainingProgressHeader';
import { STEP_COLORS } from '../../../../../system/store/trainingPipeline';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { SessionFeedbackModal } from '../../session';
import TrainingBackModal from '../../TrainingBackModal';
import WearableTrackingBadge from '../../WearableTrackingBadge';
import type { UseWearableTrackingReturn } from '../../../../../hooks/useWearableTracking';

const TrainingButton = React.lazy(() => import('../../../../../app/pages/Training/Pipeline/components/TrainingButton'));

interface EnduranceSessionDisplayProps {
  sessionId: string;
  prescription: EnduranceSessionPrescription;
  userId: string;
  onComplete: (metrics: any) => void;
  onExit: () => void;
  wearableTracking?: UseWearableTrackingReturn;
}

const EnduranceSessionDisplay: React.FC<EnduranceSessionDisplayProps> = ({
  sessionId,
  prescription,
  userId,
  onComplete,
  onExit,
  wearableTracking,
}) => {
  if (!prescription || !prescription.mainWorkout || prescription.mainWorkout.length === 0) {
    logger.error('ENDURANCE_SESSION_DISPLAY', 'Invalid prescription received', {
      hasPrescription: !!prescription,
      hasMainWorkout: !!prescription?.mainWorkout,
      mainWorkoutLength: prescription?.mainWorkout?.length,
      hasDiscipline: !!prescription?.discipline,
      discipline: prescription?.discipline
    });
    return (
      <GlassCard variant="frosted" className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <SpatialIcon name="AlertCircle" className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Prescription invalide</h2>
          <p className="text-white/60 mb-6">
            La prescription d'endurance est incomplète ou invalide.
          </p>
          <TrainingButton
            label="Retour"
            onClick={onExit}
            variant="secondary"
            icon="ArrowLeft"
            fullWidth
          />
        </div>
      </GlassCard>
    );
  }

  const effectiveDiscipline = prescription.discipline || 'cardio';
  if (!prescription.discipline) {
    logger.warn('ENDURANCE_SESSION_DISPLAY', 'Discipline missing from prescription, using default', {
      sessionId,
      defaultDiscipline: effectiveDiscipline,
      sessionName: prescription.sessionName
    });
  }

  const disciplineConfig = DISCIPLINE_CONFIGS[effectiveDiscipline];
  const stepColor = STEP_COLORS.seance;

  // Mock steps for progress header (endurance is always on step 3 - seance)
  const steps = [
    { id: 'preparer', label: 'Préparer', description: 'Configuration', icon: 'Settings' },
    { id: 'activer', label: 'Activer', description: 'Prescription', icon: 'Zap' },
    { id: 'seance', label: 'Séance', description: 'Entraînement', icon: 'Activity' },
    { id: 'adapter', label: 'Adapter', description: 'Feedback', icon: 'RefreshCw' },
    { id: 'avancer', label: 'Avancer', description: 'Progression', icon: 'TrendingUp' }
  ];

  const [sessionState, setSessionState] = useState<EnduranceSessionState>({
    phase: 'COUNTDOWN_PREPARATION',
    currentBlockIndex: 0,
    currentIntervalIndex: 0,
    currentIntervalRepeat: 0,
    sessionTime: 0,
    blockTime: 0,
    intervalTime: 0,
    isRunning: false,
    isPaused: false,
  });

  const [currentZone, setCurrentZone] = useState<HeartRateZone>('Z2');
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [motivationMessage, setMotivationMessage] = useState<string>('');
  const [actualSessionId] = useState<string>(() => crypto.randomUUID());
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdownType, setCountdownType] = useState<'preparation' | 'transition'>('preparation');
  const [showStopModal, setShowStopModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<GPSCoordinate[]>([]);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [showProgressionGuide, setShowProgressionGuide] = useState(true);

  const blockCardRef = useRef<HTMLDivElement | null>(null);

  const allBlocks: EnduranceBlock[] = [];
  if (prescription.warmup) {
    allBlocks.push({
      id: 'warmup',
      type: 'warmup',
      name: 'Échauffement',
      duration: prescription.warmup.duration,
      targetZone: prescription.warmup.targetZone,
      description: prescription.warmup.description,
      rpeTarget: 3,
    });
  }
  if (prescription.mainWorkout) {
    allBlocks.push(...prescription.mainWorkout);
  }
  if (prescription.cooldown) {
    allBlocks.push({
      id: 'cooldown',
      type: 'cooldown',
      name: 'Retour au calme',
      duration: prescription.cooldown.duration,
      targetZone: prescription.cooldown.targetZone,
      description: prescription.cooldown?.description,
      rpeTarget: 2,
    });
  }

  const currentBlock = allBlocks[sessionState.currentBlockIndex];

  useEnduranceNotifications({
    sessionId: actualSessionId,
    isRunning: sessionState.isRunning,
    isPaused: sessionState.isPaused,
    sessionTime: sessionState.sessionTime,
    allBlocks,
  });

  const handleTick = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      sessionTime: prev.sessionTime + 1,
      blockTime: prev.blockTime + 1,
      intervalTime: prev.intervalTime + 1,
    }));

    // Update GPS coordinates state every tick if tracking
    if (gpsTracking) {
      const currentCoords = gpsTrackingService.getCoordinates();
      if (currentCoords.length !== gpsCoordinates.length) {
        setGpsCoordinates([...currentCoords]);
        logger.debug('GPS_TRACKING_UPDATE', 'Coordinates updated', {
          count: currentCoords.length,
          lastPoint: currentCoords.length > 0 ? {
            lat: currentCoords[currentCoords.length - 1].lat.toFixed(6),
            lng: currentCoords[currentCoords.length - 1].lng.toFixed(6),
            accuracy: currentCoords[currentCoords.length - 1].accuracy
          } : null
        });
      }
    }
  }, [gpsTracking, gpsCoordinates.length]);

  useEnduranceTimer({
    isRunning: sessionState.isRunning,
    isPaused: sessionState.isPaused,
    onTick: handleTick,
  });

  const scrollToCurrentBlock = useCallback(() => {
    scrollToElement(blockCardRef.current);
    Haptics.tap();
  }, []);

  const determinePhase = (block: EnduranceBlock | undefined): EnduranceSessionState['phase'] => {
    if (!block) {
      logger.warn('ENDURANCE_SESSION', 'determinePhase called with undefined block');
      return 'CONTINUOUS_ACTIVE';
    }
    if (block.type === 'warmup') return 'WARMUP';
    if (block.type === 'cooldown') return 'COOLDOWN';
    if (block.type === 'intervals') return 'INTERVAL_WORK';
    if (block.type === 'tempo') return 'TEMPO_ACTIVE';
    return 'CONTINUOUS_ACTIVE';
  };

  const handleCountdownComplete = async () => {
    setShowCountdown(false);
    logger.info('ENDURANCE_SESSION', 'Starting session', { actualSessionId });
    Haptics.impact('medium');

    // Enable dev mode for GPS if in development environment
    const isDevEnvironment = import.meta.env.DEV || window.location.hostname === 'localhost';
    if (isDevEnvironment) {
      gpsTrackingService.setDevMode(true);
      logger.info('ENDURANCE_SESSION', 'GPS dev mode enabled for desktop testing', {
        hostname: window.location.hostname,
        isDev: import.meta.env.DEV
      });
    }

    // Request GPS permission and start tracking
    const hasGPS = gpsTrackingService.isSupported();
    logger.info('ENDURANCE_SESSION', 'GPS initialization starting', {
      hasGPS,
      devMode: isDevEnvironment,
      sessionId: actualSessionId
    });

    if (hasGPS) {
      const permissionGranted = await gpsTrackingService.requestPermission();
      logger.info('ENDURANCE_SESSION', 'GPS permission result', { permissionGranted });

      if (permissionGranted) {
        const trackingStarted = await gpsTrackingService.startTracking(actualSessionId);
        logger.info('ENDURANCE_SESSION', 'GPS tracking start result', { trackingStarted });

        if (trackingStarted) {
          setGpsTracking(true);
          logger.info('ENDURANCE_SESSION', 'GPS tracking started successfully', {
            devMode: gpsTrackingService.isDevMode(),
            sessionId: actualSessionId
          });
        } else {
          logger.warn('ENDURANCE_SESSION', 'Failed to start GPS tracking');
        }
      } else {
        logger.warn('ENDURANCE_SESSION', 'GPS permission denied');
      }
    } else {
      logger.info('ENDURANCE_SESSION', 'GPS not supported on this device');
    }

    await enduranceSessionService.initializeSession(
      actualSessionId,
      userId,
      prescription
    );

    const phase = allBlocks[0].type === 'warmup' ? 'WARMUP' : 'CONTINUOUS_ACTIVE';

    setSessionState(prev => ({
      ...prev,
      phase,
      isRunning: true,
      isPaused: false,
    }));

    const blockId = await enduranceSessionService.startBlock(actualSessionId, 0);
    setCurrentBlockId(blockId);

    enduranceCoachNotificationService.onBlockStart(allBlocks[0].name, allBlocks[0].targetZone);
    setMotivationMessage(enduranceMotivationEngine.getWarmupMessage(0).message);
  };

  const pauseSession = () => {
    logger.info('ENDURANCE_SESSION', 'Pausing session');
    Haptics.impact('light');
    enduranceCoachNotificationService.onSessionPaused();

    setSessionState(prev => ({
      ...prev,
      isPaused: true,
    }));
  };

  const resumeSession = () => {
    logger.info('ENDURANCE_SESSION', 'Resuming session');
    Haptics.impact('light');
    enduranceCoachNotificationService.onSessionResumed();

    setSessionState(prev => ({
      ...prev,
      isPaused: false,
    }));
  };

  const handleStopRequest = () => {
    setShowStopModal(true);
  };

  const handleStopConfirm = () => {
    setShowStopModal(false);
    // Stop GPS tracking if active
    if (gpsTracking) {
      gpsTrackingService.stopTracking();
      setGpsTracking(false);
      logger.info('ENDURANCE_SESSION', 'GPS tracking stopped (session stopped early)');
    }
    enduranceCoachNotificationService.cleanup();
    onExit();
  };

  const completeBlock = async () => {
    if (!currentBlockId) {
      logger.warn('ENDURANCE_SESSION', 'No current block ID when completing block');
      // Continue anyway in fallback mode
    }

    const currentIndex = sessionState.currentBlockIndex;

    logger.info('ENDURANCE_SESSION', 'Completing block', {
      blockIndex: currentIndex,
      blockId: currentBlockId,
      blockName: currentBlock?.name,
      totalBlocks: allBlocks.length
    });

    enduranceCoachNotificationService.onBlockComplete(currentBlock.name);

    // Try to save to DB, but don't block progression if it fails
    if (currentBlockId) {
      try {
        await enduranceSessionService.completeBlock(currentBlockId, {
          durationActual: sessionState.blockTime,
          avgHeartRate: undefined,
          rpe: currentBlock.rpeTarget,
        });
      } catch (error) {
        logger.error('ENDURANCE_SESSION', 'Failed to save block completion, continuing anyway', { error });
      }
    }

    if (currentIndex >= allBlocks.length - 1) {
      logger.info('ENDURANCE_SESSION', 'Last block completed, completing session', {
        currentIndex,
        totalBlocks: allBlocks.length
      });
      await completeSession();
    } else {
      logger.info('ENDURANCE_SESSION', 'Block completed, preparing for next block', {
        currentIndex,
        nextIndex: currentIndex + 1,
        nextBlockName: allBlocks[currentIndex + 1]?.name
      });
      setSessionState(prev => ({ ...prev, isPaused: true }));
      setShowCountdown(true);
      setCountdownType('transition');
    }
  };

  const handleNextBlock = () => {
    const nextIndex = sessionState.currentBlockIndex + 1;

    if (nextIndex >= allBlocks.length) {
      logger.info('ENDURANCE_SESSION', 'Already on last block');
      return;
    }

    logger.info('ENDURANCE_SESSION', 'User manually advancing to next block', {
      from: sessionState.currentBlockIndex,
      to: nextIndex
    });

    Haptics.tap();
    setSessionState(prev => ({ ...prev, isPaused: true }));
    setShowCountdown(true);
    setCountdownType('transition');
  };

  const handlePreviousBlock = () => {
    if (sessionState.currentBlockIndex === 0) {
      logger.info('ENDURANCE_SESSION', 'Already on first block');
      return;
    }

    const prevIndex = sessionState.currentBlockIndex - 1;
    const prevBlock = allBlocks[prevIndex];

    logger.info('ENDURANCE_SESSION', 'User manually going back to previous block', {
      from: sessionState.currentBlockIndex,
      to: prevIndex,
      blockName: prevBlock.name
    });

    Haptics.tap();

    setSessionState(prev => ({
      ...prev,
      currentBlockIndex: prevIndex,
      blockTime: 0,
      phase: determinePhase(prevBlock),
    }));

    // Start tracking the previous block (best effort)
    enduranceSessionService.startBlock(actualSessionId, prevIndex).then(blockId => {
      if (blockId) {
        setCurrentBlockId(blockId);
      }
    });
  };

  const handleTransitionComplete = async () => {
    setShowCountdown(false);

    const nextIndex = sessionState.currentBlockIndex + 1;

    if (nextIndex >= allBlocks.length) {
      logger.info('ENDURANCE_SESSION', 'All blocks completed, finishing session', {
        nextIndex,
        totalBlocks: allBlocks.length
      });
      await completeSession();
      return;
    }

    const nextBlock = allBlocks[nextIndex];

    if (!nextBlock) {
      logger.error('ENDURANCE_SESSION', 'No next block found despite index check', {
        nextIndex,
        totalBlocks: allBlocks.length
      });
      await completeSession();
      return;
    }

    // Try to start block in DB, but continue in fallback mode if it fails
    const blockId = await enduranceSessionService.startBlock(actualSessionId, nextIndex);

    if (!blockId) {
      logger.warn('ENDURANCE_SESSION', 'Failed to start next block in DB, continuing in fallback mode', {
        nextIndex,
        blockName: nextBlock.name
      });
      // Continue anyway - we'll use local tracking
      setCurrentBlockId(null);
    } else {
      setCurrentBlockId(blockId);
    }

    setSessionState(prev => ({
      ...prev,
      currentBlockIndex: nextIndex,
      blockTime: 0,
      isPaused: false,
      isRunning: true,
      phase: determinePhase(nextBlock),
    }));

    enduranceCoachNotificationService.onBlockStart(nextBlock.name, nextBlock.targetZone);
    setMotivationMessage(
      enduranceMotivationEngine.getTransitionMessage(nextBlock.name, nextBlock.type).message
    );
    Haptics.impact('medium');

    scrollToCurrentBlock();
  };

  const completeSession = async () => {
    try {
      logger.info('ENDURANCE_SESSION', 'Starting session completion', {
        actualSessionId,
        sessionTime: sessionState.sessionTime,
        blocksCompleted: allBlocks.length,
        currentBlockIndex: sessionState.currentBlockIndex
      });

      // Stop GPS tracking and get coordinates
      let finalGpsData: GPSCoordinate[] = [];
      let finalRouteStats: RouteStats | null = null;
      if (gpsTracking) {
        finalGpsData = gpsTrackingService.stopTracking();
        finalRouteStats = gpsTrackingService.calculateRouteStats();
        setGpsCoordinates(finalGpsData);
        setRouteStats(finalRouteStats);
        logger.info('ENDURANCE_SESSION', 'GPS tracking stopped', {
          pointsCaptured: finalGpsData.length,
          hasRouteStats: !!finalRouteStats,
          distance: finalRouteStats?.totalDistance,
          avgPace: finalRouteStats?.avgPace,
          devMode: gpsTrackingService.isDevMode()
        });
      } else {
        logger.info('ENDURANCE_SESSION', 'GPS tracking was not active, no coordinates to save');
      }

      const metrics = {
        totalDuration: sessionState.sessionTime,
        blocksCompleted: allBlocks.length,
        intervalsCompleted: 0,
        zonesDistribution: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 },
        gpsData: finalGpsData,
        routeStats: finalRouteStats
      };

      await enduranceSessionService.updateSessionMetrics(actualSessionId, metrics as any);

      logger.info('ENDURANCE_SESSION', 'Session metrics updated successfully');

      enduranceCoachNotificationService.onSessionComplete(sessionState.sessionTime, allBlocks.length);

      setSessionState(prev => ({
        ...prev,
        phase: 'COMPLETED',
        isRunning: false,
      }));

      Haptics.impact('heavy');

      logger.info('ENDURANCE_SESSION', 'Session completed - showing feedback modal');
      setShowFeedbackModal(true);
    } catch (error) {
      logger.error('ENDURANCE_SESSION', 'Error completing session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actualSessionId
      });
      setSessionState(prev => ({
        ...prev,
        phase: 'COMPLETED',
        isRunning: false,
      }));
      logger.warn('ENDURANCE_SESSION', 'Session completed with error - showing feedback modal anyway');
      setShowFeedbackModal(true);
    }
  };

  const handleFeedbackSubmit = (feedbackText: string) => {
    logger.info('ENDURANCE_SESSION', 'User feedback submitted', {
      actualSessionId,
      feedbackLength: feedbackText.length
    });

    setShowFeedbackModal(false);

    const metrics = {
      totalDuration: sessionState.sessionTime,
      blocksCompleted: allBlocks.length,
      intervalsCompleted: 0,
      zonesDistribution: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 },
      userFeedbackText: feedbackText,
    };

    onComplete(metrics);
  };

  const handleFeedbackSkip = () => {
    logger.info('ENDURANCE_SESSION', 'User feedback skipped', { actualSessionId });

    setShowFeedbackModal(false);

    const metrics = {
      totalDuration: sessionState.sessionTime,
      blocksCompleted: allBlocks.length,
      intervalsCompleted: 0,
      zonesDistribution: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 },
    };

    onComplete(metrics);
  };

  const handleBackRequest = () => {
    logger.info('ENDURANCE_SESSION', 'Back navigation requested', {
      actualSessionId,
      sessionTime: sessionState.sessionTime,
      isRunning: sessionState.isRunning
    });
    setShowBackModal(true);
    Haptics.warning();
  };

  const handleBackConfirm = () => {
    logger.info('ENDURANCE_SESSION', 'Back navigation confirmed', { actualSessionId });
    setShowBackModal(false);
    onExit();
  };

  if (sessionState.phase === 'COUNTDOWN_PREPARATION') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
        <AnimatePresence>
          {showCountdown && (
            <EnduranceCountdownHelper
              type="preparation"
              blockName={prescription.sessionName}
              onComplete={handleCountdownComplete}
              stepColor={disciplineConfig.color}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Session completed state now shows feedback modal immediately
  // No intermediate completion screen needed

  const totalDuration = allBlocks.reduce((sum, block) => sum + (block.duration * 60), 0);
  const progressPercent = calculateSessionProgress(sessionState.sessionTime, totalDuration);

  return (
    <>
      <AnimatePresence mode="wait">
        {showCountdown && (
          <EnduranceCountdownHelper
            type={countdownType}
            blockName={countdownType === 'preparation'
              ? prescription.sessionName
              : allBlocks[sessionState.currentBlockIndex + 1]?.name}
            onComplete={countdownType === 'preparation'
              ? handleCountdownComplete
              : handleTransitionComplete}
            stepColor={disciplineConfig.color}
          />
        )}
      </AnimatePresence>

      {!showCountdown && (
        <>
          <EnduranceStopModal
            isOpen={showStopModal}
            onClose={() => setShowStopModal(false)}
            onConfirm={handleStopConfirm}
            sessionTime={sessionState.sessionTime}
            blocksCompleted={sessionState.currentBlockIndex}
            totalBlocks={allBlocks.length}
            discipline={disciplineConfig.label}
          />

          <div className="relative pb-4">
            <div style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '16px', marginBottom: '24px' }}>
              <TrainingProgressHeader
                steps={steps as any}
                currentStep="seance"
                progress={progressPercent}
                sessionMode={true}
                sessionTime={sessionState.sessionTime}
                isSessionRunning={sessionState.isRunning && !sessionState.isPaused}
                formatTime={formatTime}
                onPlayPause={sessionState.isPaused ? resumeSession : pauseSession}
                onStop={handleStopRequest}
                currentExerciseIndex={sessionState.currentBlockIndex}
                totalExercises={allBlocks.length}
              />
            </div>

            {/* Progression Guide */}
            {showProgressionGuide && sessionState.currentBlockIndex === 0 && (
              <EnduranceProgressionGuide
                isVisible={showProgressionGuide}
                onDismiss={() => setShowProgressionGuide(false)}
                stepColor={disciplineConfig.color}
              />
            )}

            <div className="px-4 space-y-3" style={{ marginTop: '12px' }}>
              <div ref={blockCardRef} style={{ scrollMarginTop: '100px' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBlock.id}
                    initial={{ opacity: 0, x: 50, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <EnduranceBlockCard
                      block={currentBlock}
                      blockTime={sessionState.blockTime}
                      isActive={true}
                      stepColor={disciplineConfig.color}
                      onComplete={completeBlock}
                      onNext={handleNextBlock}
                      onPrevious={handlePreviousBlock}
                      isFirstBlock={sessionState.currentBlockIndex === 0}
                      isLastBlock={sessionState.currentBlockIndex >= allBlocks.length - 1}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <DevModeControls
            onSkipBlock={completeBlock}
            onSkipCountdown={() => {
              setShowCountdown(false);
              if (countdownType === 'preparation') {
                handleCountdownComplete();
              } else {
                handleTransitionComplete();
              }
            }}
            onComplete={completeSession}
            currentBlock={`${sessionState.currentBlockIndex + 1}`}
            totalBlocks={allBlocks.length}
            sessionType="endurance"
          />
        </>
      )}

      {/* Session Feedback Modal */}
      {showFeedbackModal && (
        <SessionFeedbackModal
          sessionId={actualSessionId}
          userId={userId}
          isOpen={showFeedbackModal}
          onClose={handleFeedbackSkip}
          onSubmit={handleFeedbackSubmit}
          stepColor={disciplineConfig.color}
        />
      )}

      {/* Back Confirmation Modal */}
      <TrainingBackModal
        isOpen={showBackModal}
        onClose={() => setShowBackModal(false)}
        onConfirm={handleBackConfirm}
        trainingType={prescription.sessionName}
      />
    </>
  );
};

export default EnduranceSessionDisplay;

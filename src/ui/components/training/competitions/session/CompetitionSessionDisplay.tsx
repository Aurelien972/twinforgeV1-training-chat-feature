/**
 * Competition Session Display - Refonte complète
 * Interface optimisée pour les entraînements de compétition
 * Focus sur temps, distance, et allure plutôt que séries/reps
 * Unifié avec les autres types de séances (Force, Endurance, Functional)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CompetitionStationCard from './CompetitionStationCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import GlowIcon from '../../GlowIcon';
import { ICONS } from '../../../../icons/registry';
import GlassCard from '../../../../cards/GlassCard';
import { Haptics } from '../../../../../utils/haptics';
import logger from '../../../../../lib/utils/logger';
import TrainingButton from '../../../../../app/pages/Training/Pipeline/components/TrainingButton';
import TrainingProgressHeader from '../../../../../app/pages/Training/Pipeline/components/TrainingProgressHeader';
import { SetCountdown, SessionFeedbackModal } from '../../session';
import { PreparationCountdown } from '../../force';
import { STEP_COLORS } from '../../../../../system/store/trainingPipeline';
import WearableTrackingBadge from '../../WearableTrackingBadge';
import type { UseWearableTrackingReturn } from '../../../../../hooks/useWearableTracking';

interface Station {
  id: string;
  stationNumber: number;
  stationType: 'cardio' | 'strength' | 'hybrid';
  name: string;
  equipment?: string[];
  prescription: string;
  targetTime: number;
  targetPace?: string;
  intensity?: string;
  rpeTarget: number;
  transitionTime: number;
  executionCues: string[];
  pacingStrategy: string;
  coachNotes: string;
  substitutions?: string[];
  distance?: number;
}

interface CompetitionSessionDisplayProps {
  sessionId: string;
  sessionName: string;
  competitionFormat: string;
  stations: Station[];
  userId: string;
  onComplete: (metrics: CompetitionMetrics) => void;
  onExit: () => void;
  disciplineColor?: string;
  wearableTracking?: UseWearableTrackingReturn;
}

interface CompetitionMetrics {
  totalTime: number;
  stationsCompleted: number;
  stationTimes: number[];
  userFeedbackText?: string;
}

interface CompetitionStatsBarProps {
  currentStationIndex: number;
  totalStations: number;
  currentStationTime: number;
  avgStationTime: number;
  estimatedTotalTime: number;
  disciplineColor: string;
  formatTime: (seconds: number) => string;
}

/**
 * CompetitionStatsBar - Barre d'informations complémentaires non-sticky
 * Affiche métriques pertinentes sans concurrencer le ProgressHeader
 */
const CompetitionStatsBar: React.FC<CompetitionStatsBarProps> = ({
  currentStationIndex,
  totalStations,
  currentStationTime,
  avgStationTime,
  estimatedTotalTime,
  disciplineColor,
  formatTime
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-4 my-4"
    >
      <GlassCard
        className="p-4"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${disciplineColor} 12%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.06)
          `,
          border: `1.5px solid color-mix(in srgb, ${disciplineColor} 20%, transparent)`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        <div className="grid grid-cols-3 gap-4">
          {/* Temps station actuelle */}
          <div className="text-center">
            <div
              className="text-2xl font-bold mb-1"
              style={{
                color: disciplineColor,
                textShadow: `0 0 20px color-mix(in srgb, ${disciplineColor} 30%, transparent)`
              }}
            >
              {formatTime(currentStationTime)}
            </div>
            <div className="text-xs text-white/60 uppercase tracking-wider">
              Station actuelle
            </div>
          </div>

          {/* Temps moyen par station */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {formatTime(avgStationTime)}
            </div>
            <div className="text-xs text-white/60 uppercase tracking-wider">
              Temps moyen
            </div>
          </div>

          {/* Temps estimé total */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {formatTime(estimatedTotalTime)}
            </div>
            <div className="text-xs text-white/60 uppercase tracking-wider">
              Estimé total
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

const CompetitionSessionDisplay: React.FC<CompetitionSessionDisplayProps> = ({
  sessionId,
  sessionName,
  competitionFormat,
  stations,
  userId,
  onComplete,
  onExit,
  disciplineColor = '#F59E0B',
  wearableTracking
}) => {
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [stationTimes, setStationTimes] = useState<number[]>(new Array(stations.length).fill(0));
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [showPreparationCountdown, setShowPreparationCountdown] = useState(false);
  const [showTransitionCountdown, setShowTransitionCountdown] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [userFeedbackText, setUserFeedbackText] = useState('');

  // Timer pour la station actuelle
  useEffect(() => {
    if (!isRunning || currentStationIndex >= stations.length || sessionCompleted) return;

    const interval = setInterval(() => {
      setStationTimes(prev => {
        const newTimes = [...prev];
        newTimes[currentStationIndex]++;
        return newTimes;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStationIndex, isRunning, stations.length, sessionCompleted]);

  const handleStart = () => {
    setSessionStarted(true);
    setShowPreparationCountdown(true);
    Haptics.success();
    logger.info('COMPETITION_SESSION', 'Starting preparation countdown', {
      sessionId,
      stationsCount: stations.length,
      format: competitionFormat
    });
  };

  const handlePreparationComplete = () => {
    setShowPreparationCountdown(false);
    setIsRunning(true);
    logger.info('COMPETITION_SESSION', 'Session started after countdown', {
      sessionId
    });

    // Auto-scroll immédiat vers la carte active dès que la station commence
    setTimeout(() => {
      const activeCard = document.getElementById('active-station-card');
      if (activeCard) {
        const headerOffset = 120; // Offset pour le header sticky
        const elementPosition = activeCard.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        logger.debug('COMPETITION_SESSION', 'Auto-scrolled to active station card immediately');
      }
    }, 100);
  };

  const handlePauseResume = () => {
    setIsRunning(!isRunning);
    Haptics.tap();
    logger.debug('COMPETITION_SESSION', isRunning ? 'Session paused' : 'Session resumed');
  };

  const handleCompleteStation = () => {
    if (currentStationIndex < stations.length - 1) {
      // Pause et countdown avant prochaine station
      setIsRunning(false);
      setShowTransitionCountdown(true);
      Haptics.success();
      logger.info('COMPETITION_SESSION', 'Station completed, starting transition', {
        stationIndex: currentStationIndex,
        stationName: stations[currentStationIndex].name,
        time: stationTimes[currentStationIndex]
      });
    } else {
      // Dernière station terminée - afficher feedback modal
      setIsRunning(false);
      Haptics.success();
      logger.info('COMPETITION_SESSION', 'All stations completed, showing feedback modal', {
        sessionId,
        totalTime: stationTimes.reduce((sum, time) => sum + time, 0),
        stationsCompleted: currentStationIndex + 1
      });
      setShowFeedbackModal(true);
    }
  };

  const handleTransitionComplete = () => {
    setShowTransitionCountdown(false);
    setCurrentStationIndex(prev => prev + 1);
    setIsRunning(true);
    logger.info('COMPETITION_SESSION', 'Transition complete, starting next station', {
      newStationIndex: currentStationIndex + 1
    });

    // Auto-scroll immédiat vers la nouvelle carte active dès que la station commence
    setTimeout(() => {
      const activeCard = document.getElementById('active-station-card');
      if (activeCard) {
        const headerOffset = 120;
        const elementPosition = activeCard.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        logger.debug('COMPETITION_SESSION', 'Auto-scrolled to next station card immediately');
      }
    }, 100);
  };

  const handleFeedbackSubmit = (feedbackText: string) => {
    setUserFeedbackText(feedbackText);
    setShowFeedbackModal(false);
    handleSessionComplete(feedbackText);
  };

  const handleFeedbackSkip = () => {
    setShowFeedbackModal(false);
    handleSessionComplete('');
  };

  const handleSessionComplete = (feedbackText: string = '') => {
    setSessionCompleted(true);
    Haptics.success();

    const totalTime = stationTimes.reduce((sum, time) => sum + time, 0);

    const metrics: CompetitionMetrics = {
      totalTime,
      stationsCompleted: currentStationIndex + 1,
      stationTimes,
      userFeedbackText: feedbackText || undefined
    };

    logger.info('COMPETITION_SESSION_COMPLETE', 'Session completed with feedback - metrics being sent to parent', {
      sessionId,
      metricsObject: JSON.stringify(metrics),
      totalTime: metrics.totalTime,
      stationsCompleted: metrics.stationsCompleted,
      stationTimesLength: metrics.stationTimes.length,
      stationTimesArray: metrics.stationTimes,
      hasFeedback: !!feedbackText,
      userFeedbackText: feedbackText,
      timestamp: new Date().toISOString()
    });

    // Validation des métriques avant envoi
    if (metrics.totalTime <= 0) {
      logger.error('COMPETITION_SESSION_VALIDATION', 'Invalid totalTime detected', {
        totalTime: metrics.totalTime,
        stationTimes
      });
    }

    if (metrics.stationsCompleted <= 0) {
      logger.error('COMPETITION_SESSION_VALIDATION', 'Invalid stationsCompleted detected', {
        stationsCompleted: metrics.stationsCompleted,
        currentStationIndex
      });
    }

    // Appeler onComplete pour transition vers Step4
    logger.info('COMPETITION_SESSION_CALLING_ONCOMPLETE', 'Calling onComplete callback with metrics');
    onComplete(metrics);
  };

  const handleExit = () => {
    setShowExitModal(true);
    Haptics.tap();
  };

  const handleConfirmExit = () => {
    logger.info('COMPETITION_SESSION', 'Session exited', {
      sessionId,
      stationsCompleted: currentStationIndex,
      totalStations: stations.length
    });
    onExit();
  };

  const currentStation = stations[currentStationIndex];
  const totalTime = stationTimes.reduce((sum, time) => sum + time, 0);
  const completedStations = currentStationIndex;
  const progressPercent = ((completedStations + 1) / stations.length) * 100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcul du temps moyen et estimation
  const completedStationTimes = stationTimes.slice(0, currentStationIndex);
  const avgStationTime = completedStationTimes.length > 0
    ? Math.round(completedStationTimes.reduce((sum, time) => sum + time, 0) / completedStationTimes.length)
    : 0;
  const estimatedTotalTime = avgStationTime > 0
    ? totalTime + (avgStationTime * (stations.length - currentStationIndex - 1))
    : stations.reduce((sum, s) => sum + s.targetTime, 0);

  const stepColor = STEP_COLORS.seance;

  // Mock steps for ProgressHeader
  const mockSteps = [
    { id: 'preparer' as const, label: 'Préparer', description: '', icon: 'Target', completed: true },
    { id: 'activer' as const, label: 'Activer', description: '', icon: 'Zap', completed: true },
    { id: 'seance' as const, label: 'Séance', description: 'En cours', icon: 'Activity', completed: false },
    { id: 'adapter' as const, label: 'Analyser', description: '', icon: 'BarChart3', completed: false },
    { id: 'avancer' as const, label: 'Avancer', description: '', icon: 'TrendingUp', completed: false }
  ];

  // Pre-session briefing
  if (!sessionStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard
          className="max-w-2xl w-full p-8"
          style={{
            background: `
              radial-gradient(circle at 50% 20%, color-mix(in srgb, ${disciplineColor} 15%, transparent) 0%, transparent 60%),
              rgba(255, 255, 255, 0.08)
            `,
            border: `2px solid color-mix(in srgb, ${disciplineColor} 25%, transparent)`
          }}
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-4">
              <GlowIcon
                icon="Target"
                color={disciplineColor}
                size="xl"
                glowIntensity={50}
                animate
              />
            </div>

            <div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h2 className="text-3xl font-bold text-white">{sessionName}</h2>
                {wearableTracking?.isTracking && wearableTracking.deviceInfo && (
                  <WearableTrackingBadge
                    deviceName={wearableTracking.deviceInfo.deviceName}
                    stepColor={disciplineColor}
                    compact={true}
                  />
                )}
              </div>
              <p className="text-white/70 text-lg capitalize">{competitionFormat}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <div className="text-3xl font-bold" style={{ color: disciplineColor }}>
                  {stations.length}
                </div>
                <div className="text-xs text-white/60 uppercase tracking-wider mt-1">Stations</div>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <div className="text-3xl font-bold text-white">
                  {Math.round(stations.reduce((sum, s) => sum + s.targetTime, 0) / 60)}
                </div>
                <div className="text-xs text-white/60 uppercase tracking-wider mt-1">Minutes</div>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <div className="text-3xl font-bold text-white">
                  {Math.round(stations.reduce((sum, s) => sum + s.rpeTarget, 0) / stations.length)}
                </div>
                <div className="text-xs text-white/60 uppercase tracking-wider mt-1">RPE Moyen</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <TrainingButton
                variant="primary"
                size="lg"
                icon="Play"
                iconPosition="right"
                onClick={handleStart}
                fullWidth
                stepColor={disciplineColor}
              >
                Commencer
              </TrainingButton>
              <TrainingButton
                variant="secondary"
                size="md"
                icon="ArrowLeft"
                onClick={onExit}
                fullWidth
              >
                Retour
              </TrainingButton>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <>
      {/* Preparation Countdown - 10 secondes */}
      <AnimatePresence mode="wait">
        {showPreparationCountdown && (
          <PreparationCountdown
            duration={10}
            exerciseName={currentStation.name}
            exerciseVariant={currentStation.stationType}
            onComplete={handlePreparationComplete}
            stepColor={disciplineColor}
          />
        )}
      </AnimatePresence>

      {/* Transition Countdown - 3 secondes */}
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
              <SetCountdown
                duration={3}
                onComplete={handleTransitionComplete}
                stepColor={disciplineColor}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <SessionFeedbackModal
          sessionId={sessionId}
          userId={userId}
          isOpen={showFeedbackModal}
          onClose={handleFeedbackSkip}
          onSubmit={handleFeedbackSubmit}
          stepColor={disciplineColor}
        />
      )}

      {/* Main Content */}
      {!showPreparationCountdown && !showTransitionCountdown && (
        <div className="min-h-screen pb-32">
          {/* TrainingProgressHeader - Timer global */}
          <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>
            <TrainingProgressHeader
              steps={mockSteps}
              currentStep="seance"
              progress={progressPercent}
              sessionMode={true}
              sessionTime={totalTime}
              restTime={0}
              isResting={false}
              isSessionRunning={isRunning}
              formatTime={formatTime}
              onPlayPause={handlePauseResume}
              onStop={handleExit}
              currentExerciseIndex={currentStationIndex}
              totalExercises={stations.length}
            />
          </div>

          {/* CompetitionStatsBar - Infos complémentaires */}
          <CompetitionStatsBar
            currentStationIndex={currentStationIndex}
            totalStations={stations.length}
            currentStationTime={stationTimes[currentStationIndex]}
            avgStationTime={avgStationTime}
            estimatedTotalTime={estimatedTotalTime}
            disciplineColor={disciplineColor}
            formatTime={formatTime}
          />

          {/* Station active */}
          <div className="max-w-2xl mx-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          <div id="active-station-card">
            <CompetitionStationCard
              key={currentStation.id}
              station={currentStation}
              stationIndex={currentStationIndex}
              totalStations={stations.length}
              currentTime={stationTimes[currentStationIndex]}
              isActive={true}
              isRunning={isRunning}
              onComplete={handleCompleteStation}
              disciplineColor={disciplineColor}
            />
          </div>
        </AnimatePresence>

        {/* Preview de la prochaine station */}
        {currentStationIndex < stations.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{
                  background: `color-mix(in srgb, ${disciplineColor} 20%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${disciplineColor} 30%, transparent)`,
                  color: disciplineColor
                }}
              >
                {stations[currentStationIndex + 1].stationNumber}
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/60 uppercase tracking-wider mb-0.5">
                  À suivre
                </div>
                <div className="text-base font-semibold text-white">
                  {stations[currentStationIndex + 1].name}
                </div>
                <div className="text-sm text-white/60">
                  {stations[currentStationIndex + 1].prescription}
                </div>
              </div>
              <SpatialIcon
                Icon={ICONS.ArrowRight}
                size={20}
                variant="pure"
                style={{ color: disciplineColor, opacity: 0.6 }}
              />
            </div>
          </motion.div>
        )}
          </div>
        </div>
      )}

      {/* Modal de sortie */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowExitModal(false)}
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
                  border: '2px solid rgba(239, 68, 68, 0.4)'
                }}
              >
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <GlowIcon icon="AlertCircle" color="#EF4444" size="large" glowIntensity={50} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Quitter la session ?</h3>
                    <p className="text-white/70">
                      Votre progression ne sera pas sauvegardée
                    </p>
                  </div>

                  <div
                    className="text-sm px-4 py-3 rounded-xl"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <p className="text-red-400 font-semibold mb-1">Stations complétées : {completedStations}/{stations.length}</p>
                    <p className="text-white/60 text-xs">Temps écoulé : {formatTime(totalTime)}</p>
                  </div>

                  <div className="flex gap-3">
                    <TrainingButton
                      variant="secondary"
                      size="lg"
                      onClick={() => setShowExitModal(false)}
                      fullWidth
                    >
                      Continuer
                    </TrainingButton>
                    <TrainingButton
                      variant="primary"
                      size="lg"
                      onClick={handleConfirmExit}
                      fullWidth
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '2px solid rgba(239, 68, 68, 0.4)',
                        color: '#EF4444'
                      }}
                    >
                      Quitter
                    </TrainingButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CompetitionSessionDisplay;
export type { CompetitionMetrics };

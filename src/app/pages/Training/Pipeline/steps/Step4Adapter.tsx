/**
 * Step 4 - Analyser & Adapter
 * Ultra-personalized post-session analysis with metrics and insights powered by AI
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepContainer from '../components/StepContainer';
import TrainingButton from '../components/TrainingButton';
import SessionGuard from '../components/SessionGuard';
import { PersonalizedMetricsCard, ExerciseAnalysisCard, SessionBadgesCard, TrainingCoachNotificationBubble, ScoreGlobalCard } from '../../../../../ui/components/training';
import {
  PersonalizedInsightsCard,
  TechniqueAnalysisCard,
  WearableInsightsCard
} from '../../../../../ui/components/training/insights';
import {
  PersonalizedMetricsCardSkeleton,
  ScoreGlobalCardSkeleton,
  AnalysisCardSkeleton,
  BadgesCardSkeleton
} from '../../../../../ui/components/skeletons';
import { useProgressiveReveal, type ComponentTiming } from '../../../../../hooks/useProgressiveReveal';
import { useTrainingPipeline, STEP_COLORS } from '../../../../../system/store/trainingPipeline';
import { step4NotificationService } from '../../../../../system/services/step4NotificationService';
import { sessionAnalysisService, type SessionAnalysisResult } from '../../../../../system/services/sessionAnalysisService';
import { useChatButtonRef } from '../../../../../system/context/ChatButtonContext';
import logger from '../../../../../lib/utils/logger';
import { useUserStore } from '../../../../../system/store/userStore';
import { useNavigate } from 'react-router-dom';
import { Haptics } from '../../../../../utils/haptics';
import SpatialIcon from '../../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../../ui/icons/registry';

const Step4AdapterContent: React.FC = () => {
  const navigate = useNavigate();
  const { goToNextStep, goToPreviousStep, sessionPrescription, sessionFeedback, preparerData, currentSessionId, setLoadingState, setError, setSessionAnalysisResult } = useTrainingPipeline();
  const stepColor = STEP_COLORS.adapter;
  const { chatButtonRef } = useChatButtonRef();
  const { session } = useUserStore();
  const userId = session?.user?.id;

  // Use feedback from store (generated in Step3 or from real session)
  const feedback = sessionFeedback;

  // AI-powered analysis state
  const [analysis, setAnalysis] = useState<SessionAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Force display after 5 seconds timeout
  const [forceDisplay, setForceDisplay] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceDisplay(true);
      logger.info('STEP_4_ADAPTER', 'Force display timeout reached - showing all components');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const componentTimings: ComponentTiming[] = [
    { id: 'metrics', delayMs: 0, dataReady: true },
    { id: 'wearable', delayMs: 2000, dataReady: !!feedback.wearableMetrics },
    { id: 'score', delayMs: 3000, dataReady: !!analysis || forceDisplay },
    { id: 'exercise-analysis', delayMs: 6000, dataReady: !!analysis || forceDisplay },
    { id: 'technique', delayMs: 9000, dataReady: !!analysis || forceDisplay },
    { id: 'insights', delayMs: 12000, dataReady: !!analysis || forceDisplay },
    { id: 'badges', delayMs: 15000, dataReady: !!analysis || forceDisplay }
  ];

  const { isVisible } = useProgressiveReveal({
    components: componentTimings
  });

  // Auto-scroll to new content on mobile when skeletons reveal
  useEffect(() => {
    const scrollToComponent = (componentId: string) => {
      if (typeof window === 'undefined') return;

      // Only scroll on mobile
      if (window.innerWidth > 768) return;

      const element = document.getElementById(`step4-${componentId}`);
      if (element) {
        setTimeout(() => {
          const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
          const offset = 80; // Account for header
          window.scrollTo({
            top: elementTop - offset,
            behavior: 'smooth'
          });
        }, 300); // Small delay for animation
      }
    };

    // Scroll when each component becomes visible
    if (isVisible('score') && analysis) {
      scrollToComponent('score');
    } else if (isVisible('exercise-analysis') && analysis) {
      scrollToComponent('exercise-analysis');
    } else if (isVisible('technique') && analysis) {
      scrollToComponent('technique');
    } else if (isVisible('insights') && analysis) {
      scrollToComponent('insights');
    } else if (isVisible('badges') && analysis) {
      scrollToComponent('badges');
    }
  }, [isVisible, analysis]);

  useEffect(() => {
    if (feedback && currentSessionId) {
      step4NotificationService.initialize(currentSessionId);
      step4NotificationService.onArrival();
    }

    return () => {
      step4NotificationService.cleanup();
    };
  }, [feedback, currentSessionId]);

  // Fetch AI analysis on mount
  useEffect(() => {
    logger.info('STEP_4_ADAPTER', 'useEffect triggered - checking conditions', {
      hasUserId: !!userId,
      userId: userId,
      hasSessionPrescription: !!sessionPrescription,
      hasFeedback: !!feedback,
      hasAnalysis: !!analysis,
      isAnalyzing,
      feedbackExercisesCount: feedback?.exercises?.length || 0,
      isEnduranceSession: !!sessionPrescription?.mainWorkout,
      feedbackDurationActual: feedback?.durationActual
    });

    const fetchAnalysis = async () => {
      if (!userId || !sessionPrescription || !feedback || analysis || isAnalyzing) {
        logger.warn('STEP_4_ADAPTER', 'Skipping AI analysis - missing requirements', {
          hasUserId: !!userId,
          hasSessionPrescription: !!sessionPrescription,
          hasFeedback: !!feedback,
          hasAnalysis: !!analysis,
          isAnalyzing,
          reason: !userId ? 'no_user_id' : !sessionPrescription ? 'no_prescription' : !feedback ? 'no_feedback' : analysis ? 'already_has_analysis' : 'is_analyzing'
        });
        return;
      }

      // Guard: Prevent analysis if session was not actually completed
      // Check if session has valid data based on its type
      const isEnduranceSession = !!sessionPrescription.mainWorkout;
      const isFunctionalSession = sessionPrescription.category === 'functional-crosstraining' ||
                                   sessionPrescription.type?.toLowerCase().includes('functional') ||
                                   !!(sessionPrescription as any)?.wodFormat;
      const isCompetitionSession = !!(sessionPrescription as any)?.competitionFormat ||
                                    sessionPrescription.category === 'competitions' ||
                                    sessionPrescription.type?.toLowerCase().includes('competition');

      // For functional sessions, check functionalMetrics instead of exercises
      const functionalMetrics = (feedback as any)?.functionalMetrics;

      // For competition sessions, check competitionMetrics with fallback to notes parsing
      let competitionMetrics = (feedback as any)?.competitionMetrics;

      logger.info('STEP_4_COMPETITION_VALIDATION_START', 'Starting competition validation', {
        isCompetitionSession,
        feedbackKeys: Object.keys(feedback),
        hasCompetitionMetricsField: 'competitionMetrics' in feedback,
        competitionMetricsValue: competitionMetrics,
        hasNotes: !!feedback.notes,
        notesPreview: feedback.notes ? feedback.notes.substring(0, 100) : null
      });

      // FALLBACK: If competitionMetrics not found, try to parse from notes (backward compatibility)
      if (isCompetitionSession && !competitionMetrics && feedback.notes) {
        try {
          const parsedNotes = JSON.parse(feedback.notes);
          if (parsedNotes.type === 'competition' && parsedNotes.stationsCompleted !== undefined) {
            competitionMetrics = {
              totalTime: feedback.durationActual || 0,
              stationsCompleted: parsedNotes.stationsCompleted || 0,
              stationTimes: parsedNotes.stationTimes || [],
            };
            logger.info('STEP_4_COMPETITION_FALLBACK', 'Parsed competition metrics from notes', {
              parsedMetrics: competitionMetrics,
              source: 'notes_fallback'
            });
          }
        } catch (error) {
          logger.warn('STEP_4_COMPETITION_FALLBACK_ERROR', 'Failed to parse notes for competition metrics', {
            error: error instanceof Error ? error.message : 'Unknown error',
            notes: feedback.notes
          });
        }
      }

      let hasValidData = false;
      let validationReason = '';
      let isMinimalData = false;

      if (isCompetitionSession) {
        // Competitions: Check for valid metrics OR minimal session data
        const hasCompetitionMetrics = !!(competitionMetrics &&
                         competitionMetrics.stationsCompleted > 0 &&
                         competitionMetrics.totalTime > 0);
        const hasMinimalData = !!(feedback.durationActual && feedback.durationActual >= 1);

        hasValidData = hasCompetitionMetrics || hasMinimalData;
        isMinimalData = !hasCompetitionMetrics && hasMinimalData;
        validationReason = hasCompetitionMetrics ? 'valid_competition_metrics' :
                          hasMinimalData ? 'minimal_competition_data' : 'no_competition_data';

        logger.info('STEP_4_COMPETITION_VALIDATION_RESULT', 'Competition validation completed', {
          hasValidData,
          isMinimalData,
          validationReason,
          metricsSource: (feedback as any)?.competitionMetrics ? 'direct_field' : 'parsed_notes',
          stationsCompleted: competitionMetrics?.stationsCompleted,
          totalTime: competitionMetrics?.totalTime,
          durationActual: feedback.durationActual,
          stationTimesLength: competitionMetrics?.stationTimes?.length
        });
      } else if (isEnduranceSession) {
        // Endurance: Accept any session with duration >= 1 second
        hasValidData = !!(feedback.durationActual && feedback.durationActual >= 1);
        isMinimalData = hasValidData && feedback.durationActual < 60; // Less than 1 minute is minimal
        validationReason = hasValidData ? (isMinimalData ? 'minimal_endurance_data' : 'valid_endurance_duration') : 'no_duration';
      } else if (isFunctionalSession) {
        // Functional: Check for metrics OR minimal exercise data
        const hasFunctionalMetrics = !!(functionalMetrics && (functionalMetrics.roundsCompleted > 0 || functionalMetrics.totalReps > 0));
        const hasMinimalData = !!(feedback.durationActual && feedback.durationActual >= 1);

        hasValidData = hasFunctionalMetrics || hasMinimalData;
        isMinimalData = !hasFunctionalMetrics && hasMinimalData;
        validationReason = hasFunctionalMetrics ? 'valid_functional_metrics' :
                          hasMinimalData ? 'minimal_functional_data' : 'no_functional_data';
      } else {
        // Force/Calisthenics: Accept any session with exercises OR minimal duration
        const hasExercises = !!(feedback.exercises && feedback.exercises.length > 0);
        const hasMinimalData = !!(feedback.durationActual && feedback.durationActual >= 1);

        hasValidData = hasExercises || hasMinimalData;
        isMinimalData = !hasExercises && hasMinimalData;
        validationReason = hasExercises ? 'valid_force_exercises' :
                          hasMinimalData ? 'minimal_force_data' : 'no_exercises';
      }

      logger.info('STEP_4_ADAPTER', 'Session validation check', {
        isCompetitionSession,
        isEnduranceSession,
        isFunctionalSession,
        hasValidData,
        isMinimalData,
        validationReason,
        durationActual: feedback.durationActual,
        exercisesCount: feedback.exercises?.length || 0,
        functionalMetrics: functionalMetrics ? {
          roundsCompleted: functionalMetrics.roundsCompleted,
          totalReps: functionalMetrics.totalReps,
          wodFormat: functionalMetrics.wodFormat
        } : null,
        competitionMetrics: competitionMetrics ? {
          stationsCompleted: competitionMetrics.stationsCompleted,
          totalTime: competitionMetrics.totalTime,
          stationTimes: competitionMetrics.stationTimes?.length || 0
        } : null,
        feedbackNotes: feedback.notes ? 'present' : 'absent'
      });

      if (!hasValidData) {
        logger.warn('STEP_4_ADAPTER', 'Session data validation failed - will show metrics without AI analysis', {
          isCompetitionSession,
          isEnduranceSession,
          isFunctionalSession,
          validationReason,
          durationActual: feedback.durationActual,
          exercisesCount: feedback.exercises?.length || 0,
          functionalMetrics: functionalMetrics || null,
          competitionMetrics: competitionMetrics || null,
          feedbackKeys: Object.keys(feedback),
          willStillDisplayUI: true,
          note: 'User can still proceed to Step 5 with basic metrics'
        });
        // Don't return - let the UI show basic metrics without AI analysis
        // User can still complete the pipeline
        setIsAnalyzing(false);
        setLoadingState('idle');
        setForceDisplay(true); // Force display all components immediately
        return;
      }

      // If we have minimal data, still run AI analysis but with lower expectations
      if (isMinimalData) {
        logger.info('STEP_4_ADAPTER', 'Running AI analysis with minimal data', {
          validationReason,
          willProceedWithAnalysis: true,
          expectLowScores: true
        });
      }

      setIsAnalyzing(true);
      setLoadingState('analyzing', 'Analyse de votre performance...');

      // Notify analysis started
      if (isEnduranceSession || isCompetitionSession) {
        step4NotificationService.onAnalysisStarted();
      }

      logger.info('STEP_4_ADAPTER', 'Starting AI analysis', {
        userId,
        sessionId: currentSessionId
      });

      try {
        // Simulate progress notifications for endurance and competition sessions
        if (isEnduranceSession || isCompetitionSession) {
          setTimeout(() => step4NotificationService.onAnalysisProgress(25), 2000);
          setTimeout(() => step4NotificationService.onAnalysisProgress(50), 5000);
          setTimeout(() => step4NotificationService.onAnalysisProgress(75), 8000);
        }

        // CRITICAL: Wrap AI analysis call in try-catch for resilience
        let aiAnalysis;
        let metadata;
        try {
          const result = await sessionAnalysisService.analyzeSession(
            userId,
            sessionPrescription,
            feedback,
            preparerData
          );
          aiAnalysis = result.analysis;
          metadata = result.metadata;
        } catch (analysisError) {
          logger.error('STEP_4_ADAPTER', 'AI analysis service error - will show basic metrics', {
            error: analysisError instanceof Error ? analysisError.message : 'Unknown',
            errorStack: analysisError instanceof Error ? analysisError.stack : undefined,
            willContinue: true
          });
          // Set error state but continue with basic UI
          setAnalysisError(analysisError instanceof Error ? analysisError.message : 'Unknown error');
          setIsAnalyzing(false);
          setLoadingState('idle');
          setForceDisplay(true);
          return;
        }

        // Analyze wearable metrics if available
        if (feedback.wearableMetrics) {
          logger.info('STEP_4_ADAPTER', 'Analyzing wearable metrics', {
            hasWearableData: true,
            deviceName: feedback.wearableMetrics.deviceName
          });

          const wearableAnalysis = sessionAnalysisService.analyzeWearableMetrics(
            feedback.wearableMetrics,
            sessionPrescription,
            feedback
          );

          aiAnalysis.wearableAnalysis = wearableAnalysis;

          logger.info('STEP_4_ADAPTER', 'Wearable analysis completed', {
            effortScore: wearableAnalysis.effortAccuracy.score,
            rating: wearableAnalysis.effortAccuracy.rating,
            recoveryHours: wearableAnalysis.recoveryImpact.estimatedRecoveryHours
          });
        }

        setAnalysis(aiAnalysis);
        setSessionAnalysisResult(aiAnalysis);
        setAnalysisError(null);
        setLoadingState('idle');

        // Notify analysis complete
        if (isEnduranceSession || isCompetitionSession) {
          setTimeout(() => step4NotificationService.onAnalysisComplete(), 500);
        }

        logger.info('STEP_4_ADAPTER', 'AI analysis completed', {
          cached: metadata.cached,
          tokensUsed: metadata.tokensUsed,
          latencyMs: metadata.latencyMs,
          overallScore: aiAnalysis.sessionAnalysis.overallPerformance.score
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isTimeout = errorMessage.includes('timeout');

        if (isTimeout) {
          logger.warn('STEP_4_ADAPTER', 'AI analysis timeout - using fallback', {
            error: errorMessage,
            willShowFallbackUI: true,
            canStillProceed: true
          });

          setAnalysisError('timeout');
        } else {
          logger.error('STEP_4_ADAPTER', 'AI analysis failed - showing basic metrics', {
            error: errorMessage,
            errorStack: error instanceof Error ? error.stack : undefined,
            canStillProceed: true,
            note: 'User can still see basic metrics and proceed to Step 5'
          });
          setAnalysisError(errorMessage);
        }

        // CRITICAL: Always set loading to idle and force display
        // This ensures user can always proceed even if AI fails
        setLoadingState('idle');
        setForceDisplay(true);
      } finally {
        setIsAnalyzing(false);
      }
    };

    fetchAnalysis();
  }, [userId, sessionPrescription, feedback, preparerData, currentSessionId, analysis, isAnalyzing, setLoadingState, setError]);

  // Don't render if no prescription or feedback
  if (!sessionPrescription || !feedback) {
    return (
      <StepContainer
        icon="BarChart3"
        title="Analyser"
        subtitle="Aucune donnée de séance disponible"
        iconColor={stepColor}
      >
        <div className="text-center text-white/60 py-8">
          Veuillez d'abord compléter une séance pour voir votre analyse.
        </div>
        <TrainingButton
          variant="secondary"
          size="lg"
          icon="ArrowLeft"
          onClick={goToPreviousStep}
          fullWidth
        >
          Retour
        </TrainingButton>
      </StepContainer>
    );
  }

  return (
    <>
      <TrainingCoachNotificationBubble chatButtonRef={chatButtonRef} isStep1={false} />

      <StepContainer
        icon="BarChart3"
        title="Analyser"
        subtitle={analysis ? `Performance: ${analysis.sessionAnalysis.overallPerformance.rating}` : "Performance ultra-personnalisée"}
        iconColor={stepColor}
      >
        <div>
        {/* Error state */}
        {analysisError && analysisError !== 'timeout' && (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 font-medium mb-2">Erreur lors de l'analyse IA</p>
            <p className="text-white/60 text-sm">{analysisError}</p>
            <p className="text-white/40 text-xs mt-2">Affichage des données de base uniquement</p>
          </div>
        )}

        {analysisError === 'timeout' && (
          <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <SpatialIcon Icon={ICONS.Clock} size={20} style={{ color: '#EAB308' }} />
              <p className="text-yellow-400 font-medium">Analyse en cours...</p>
            </div>
            <p className="text-white/60 text-sm">
              L'analyse IA prend plus de temps que prévu. Les données de base sont affichées pendant que l'analyse se termine en arrière-plan.
            </p>
            <p className="text-white/40 text-xs mt-2">Vos insights IA apparaîtront dès qu'ils seront prêts.</p>
          </div>
        )}

        {/* Hero Metrics - Immediate display */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <AnimatePresence mode="wait">
            {isVisible('metrics') ? (
              <motion.div
                key="metrics-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PersonalizedMetricsCard
                  sessionFeedback={feedback}
                  sessionPrescription={sessionPrescription}
                  stepColor={stepColor}
                  aiAnalysis={analysis}
                />
              </motion.div>
            ) : (
              <motion.div
                key="metrics-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PersonalizedMetricsCardSkeleton stepColor={stepColor} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Wearable Insights Card - Progressive reveal (if wearable data available) */}
        {feedback.wearableMetrics && (
          <motion.div
            id="step4-wearable"
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
          >
            <AnimatePresence mode="wait">
              {isVisible('wearable') ? (
                <motion.div
                  key="wearable-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <WearableInsightsCard
                    wearableMetrics={feedback.wearableMetrics}
                    wearableAnalysis={analysis?.wearableAnalysis}
                    prescribedZones={sessionPrescription.wearableGuidance?.recommendedZones}
                    stepColor={stepColor}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="wearable-skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnalysisCardSkeleton stepColor={stepColor} itemCount={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* AI Global Score Card - Progressive reveal */}
        <motion.div
          id="step4-score"
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {isVisible('score') ? (
              analysis ? (
                <motion.div
                  key="score-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ScoreGlobalCard
                    score={analysis.sessionAnalysis.overallPerformance.score}
                    rating={analysis.sessionAnalysis.overallPerformance.rating}
                    summary={analysis.sessionAnalysis.overallPerformance.summary}
                    coachRationale={analysis.coachRationale}
                    stepColor={stepColor}
                  />
                </motion.div>
              ) : forceDisplay ? (
                <motion.div
                  key="score-fallback"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ScoreGlobalCardSkeleton stepColor={stepColor} />
                </motion.div>
              ) : (
                <motion.div
                  key="score-skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ScoreGlobalCardSkeleton stepColor={stepColor} />
                </motion.div>
              )
            ) : (
              <motion.div
                key="score-skeleton-initial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ScoreGlobalCardSkeleton stepColor={stepColor} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Exercise Analysis - Progressive reveal */}
        <motion.div
          id="step4-exercise-analysis"
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {isVisible('exercise-analysis') ? (
              <motion.div
                key="exercise-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ExerciseAnalysisCard
                  sessionFeedback={feedback}
                  sessionPrescription={sessionPrescription}
                  stepColor={stepColor}
                  aiAnalysis={analysis}
                />
              </motion.div>
            ) : (
              <motion.div
                key="exercise-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnalysisCardSkeleton stepColor={stepColor} itemCount={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Technique Analysis - Progressive reveal */}
        <motion.div
          id="step4-technique"
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {isVisible('technique') && analysis ? (
              <motion.div
                key="technique-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TechniqueAnalysisCard
                  aiAnalysis={analysis}
                  stepColor={stepColor}
                />
              </motion.div>
            ) : (
              <motion.div
                key="technique-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnalysisCardSkeleton stepColor={stepColor} itemCount={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Personalized Insights - Progressive reveal */}
        <motion.div
          id="step4-insights"
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {isVisible('insights') ? (
              <motion.div
                key="insights-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PersonalizedInsightsCard
                  sessionFeedback={feedback}
                  sessionPrescription={sessionPrescription}
                  preparerData={preparerData}
                  stepColor={stepColor}
                  aiAnalysis={analysis}
                />
              </motion.div>
            ) : (
              <motion.div
                key="insights-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnalysisCardSkeleton stepColor={stepColor} itemCount={4} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Achievement Badges - Progressive reveal */}
        <motion.div
          id="step4-badges"
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {isVisible('badges') ? (
              <motion.div
                key="badges-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SessionBadgesCard
                  sessionFeedback={feedback}
                  sessionPrescription={sessionPrescription}
                  stepColor={stepColor}
                  aiAnalysis={analysis}
                />
              </motion.div>
            ) : (
              <motion.div
                key="badges-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <BadgesCardSkeleton stepColor={stepColor} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="wait">
          {isVisible('metrics') ? (
            <motion.div
              key="cta-buttons"
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
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
                  icon="Check"
                  iconPosition="right"
                  onClick={goToNextStep}
                  fullWidth
                >
                  Valider et Continuer
                </TrainingButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="cta-skeleton"
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-4">
                <div
                  className="h-14 rounded-xl animate-pulse"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    flex: '0 0 120px'
                  }}
                />
                <div
                  className="h-14 rounded-xl animate-pulse flex-1"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
                      rgba(255, 255, 255, 0.08)
                    `,
                    border: `1px solid color-mix(in srgb, ${stepColor} 20%, transparent)`
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </StepContainer>
    </>
  );
};

const Step4Adapter: React.FC = () => {
  return (
    <SessionGuard
      step="adapter"
      requiresPrescription={true}
      requiresSessionStarted={false}
      requiresFeedback={true}
    >
      <Step4AdapterContent />
    </SessionGuard>
  );
};

export default Step4Adapter;

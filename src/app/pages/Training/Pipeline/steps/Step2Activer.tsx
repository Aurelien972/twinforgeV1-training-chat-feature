/**
 * Step 2 - Activer
 * AI Coach interaction and prescription validation
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../../ui/icons/registry';
import StepContainer from '../components/StepContainer';
import TrainingButton from '../components/TrainingButton';
import { WarmupCard, PreSessionCountdown, EnduranceSessionDisplay, EnduranceAdjustmentButtons, TrainingPrescriptionCard, ForceAdjustmentButtons, FunctionalPrescriptionCard, FunctionalAdjustmentButtons } from '../../../../../ui/components/training';
import { SessionIllustrationCard } from '../../../../../ui/components/training/force/cards';
import { CompetitionStationDisplayCard, CompetitionAdjustmentButtons } from '../../../../../ui/components/training/competitions';
import { EnduranceSessionOverview } from '../../../../../ui/components/training/endurance/session';
import { ForceSessionChart, EnduranceZonesChart, FunctionalTimelineChart, CompetitionsCircuitChart, ExerciseIllustration } from '../../../../../ui/components/training/illustrations';
import ExerciseCardSkeleton from '../../../../../ui/components/training/ExerciseCardSkeleton.tsx';
import TrainingCoachNotificationBubble from '../../../../../ui/components/training/TrainingCoachNotificationBubble';
import TrainingGenerationLoader from '../../../../../ui/components/training/TrainingGenerationLoader';
import TrainingSaveModal from '../../../../../ui/components/training/TrainingSaveModal';
import TrainingRegenerateModal from '../../../../../ui/components/training/TrainingRegenerateModal';
import TrainingQuitModal from '../../../../../ui/components/training/TrainingQuitModal';
import { useTrainingPipeline, STEP_COLORS } from '../../../../../system/store/trainingPipeline';
import { useGlobalChatStore } from '../../../../../system/store/globalChatStore';
import type { Exercise } from '../../../../../system/store/trainingPipeline/types';
import logger from '../../../../../lib/utils/logger';
import { Haptics } from '../../../../../utils/haptics';
import { step2NotificationService } from '../../../../../system/services/step2NotificationService';
import { useChatButtonRef } from '../../../../../system/context/ChatButtonContext';
import { trainingGenerationService } from '../../../../../system/services/ai/trainingGenerationService';
import { exerciseProgressionService } from '../../../../../system/services/exerciseProgressionService';
import { validateProfileForTraining } from '../../../../../system/services/profileValidationService';
import { sessionPersistenceService } from '../../../../../system/services/sessionPersistenceService';
import { useUserStore } from '../../../../../system/store/userStore';
import { useToast } from '../../../../../ui/components/ToastProvider';
import { useNavigate } from 'react-router-dom';
import { useGenerationProgress } from '../../../../../hooks/useGenerationProgress';
import { getWorkoutItemsCount } from '../../../../../utils/prescriptionNormalizer';
import { adjustEnduranceIntensity } from '../../../../../system/services/enduranceIntensityAdjustmentService';
import type { AdjustmentDirection } from '../../../../../system/services/enduranceIntensityAdjustmentService';
import { getDisciplineColor } from '../../../../../utils/disciplineMapper';
import { useExerciseIllustrations } from '../../../../../hooks/useExerciseIllustrations';
import { generationLockService } from '../../../../../system/services/generationLockService';
import { illustrationCacheService } from '../../../../../system/services/illustrationCacheService';
import { sessionStateManager } from '../../../../../system/services/sessionStateManager';

const Step2Activer: React.FC = () => {
  const {
    goToNextStep,
    goToPreviousStep,
    goToStep,
    cleanupAndReturn,
    preparerData,
    sessionPrescription,
    setSessionPrescription,
    currentSessionId,
    userId,
    saveDraft,
    isSavingDraft,
    isDraftSaved,
    addToGenerationHistory,
    generationHistory,
    markGenerationTriggered,
    resetGenerationFlag,
    canTriggerGeneration,
    attemptPrescriptionRecovery,
    resetSessionStateForRegeneration
  } = useTrainingPipeline();
  const { open: openChat, addMessage, messages, startConversation, setMode, setIsInStep2, setHasStep2Intro } = useGlobalChatStore();
  const stepColor = STEP_COLORS.activer;
  const disciplineColor = getDisciplineColor(preparerData?.tempSport);
  const { chatButtonRef } = useChatButtonRef();
  const { profile } = useUserStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Derive discipline from prescription for use in JSX
  const discipline = sessionPrescription?.discipline || sessionPrescription?.category || preparerData?.tempSport || 'force';

  const [isPrescriptionVisible, setIsPrescriptionVisible] = useState(true);
  const [validated, setValidated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isValidatingProfile, setIsValidatingProfile] = useState(false);
  const { progress: generationProgress, startProgress, completeProgress, resetProgress, isGenerating } = useGenerationProgress();
  const [regeneratingExercises, setRegeneratingExercises] = useState<Record<string, boolean>>({});
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const exerciseRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [isServicesInitialized, setIsServicesInitialized] = useState(false);
  const autoGenerationTriggered = React.useRef(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [isPageReload, setIsPageReload] = useState(false);
  const [adjustmentCount, setAdjustmentCount] = useState(0);
  const [lastAdjustedBlockIds, setLastAdjustedBlockIds] = useState<string[]>([]);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const generationStartTime = React.useRef<number | null>(null);

  const { setIllustration: setIllustrationInStore, preloadFromCache } = useExerciseIllustrations();

  const handleExerciseUpdate = (exerciseId: string, updates: Partial<Exercise>) => {
    if (!sessionPrescription) return;

    const updatedExercises = sessionPrescription.exercises.map(ex =>
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    );

    setSessionPrescription({
      ...sessionPrescription,
      exercises: updatedExercises
    });

    if (userId) {
      const exercise = sessionPrescription.exercises.find(ex => ex.id === exerciseId);
      if (exercise && updates.load !== undefined && exercise.load !== updates.load) {
        const oldLoadValue = typeof exercise.load === 'number' ? exercise.load : 0;
        const newLoadValue = typeof updates.load === 'number' ? updates.load : 0;
        const adjustmentType = newLoadValue > oldLoadValue ? 'load_increase' : 'load_decrease';
        exerciseProgressionService.recordAdjustment(
          userId,
          exercise.name,
          adjustmentType,
          oldLoadValue,
          newLoadValue,
          { energyLevel: preparerData?.energyLevel }
        );
      }
    }

    logger.info('STEP_2_ACTIVER', 'Exercise updated', {
      exerciseId,
      updates
    });
  };


  const handleExerciseSubstitution = (exerciseId: string, substitutionName: string) => {
    if (!sessionPrescription) return;

    const exerciseToReplace = sessionPrescription.exercises.find(ex => ex.id === exerciseId);
    if (!exerciseToReplace) return;

    const convertedLoad = exerciseProgressionService.convertLoadBetweenExercises(
      exerciseToReplace.name,
      substitutionName,
      exerciseToReplace.load || 0
    );

    const updatedExercises = sessionPrescription.exercises.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            name: substitutionName,
            load: convertedLoad,
            substitutions: exerciseToReplace.substitutions?.filter(s => s !== substitutionName)
          }
        : ex
    );

    setSessionPrescription({
      ...sessionPrescription,
      exercises: updatedExercises
    });

    logger.info('STEP_2_ACTIVER', 'Exercise substituted with adapted load', {
      exerciseId,
      oldName: exerciseToReplace.name,
      newName: substitutionName,
      oldLoad: exerciseToReplace.load,
      newLoad: convertedLoad
    });
  };

  const handleExerciseRegenerate = async (exerciseId: string) => {
    if (!sessionPrescription || !userId || !preparerData) return;

    const exerciseToReplace = sessionPrescription.exercises.find(ex => ex.id === exerciseId);
    if (!exerciseToReplace) return;

    setRegeneratingExercises(prev => ({ ...prev, [exerciseId]: true }));

    step2NotificationService.onExerciseRegenerating(exerciseToReplace.name);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const existingExercises = sessionPrescription.exercises.map(ex => ex.name);
      const existingAlternatives = exerciseToReplace.substitutions || [];

      const response = await fetch(`${supabaseUrl}/functions/v1/training-exercise-regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          userId,
          currentExercise: {
            id: exerciseToReplace.id,
            name: exerciseToReplace.name,
            category: exerciseToReplace.category || 'strength',
            muscleGroup: exerciseToReplace.muscleGroup || 'full-body',
            equipment: preparerData.availableEquipment
          },
          existingExercises,
          existingAlternatives,
          availableEquipment: preparerData.availableEquipment,
          userContext: {
            energyLevel: preparerData.energyLevel,
            goals: []
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to regenerate exercise: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data?.exercise) {
        throw new Error(result.error || 'Failed to generate new exercise');
      }

      const newExercise = result.data.exercise;

      const updatedExercises = sessionPrescription.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, ...newExercise } : ex
      );

      setSessionPrescription({
        ...sessionPrescription,
        exercises: updatedExercises
      });

      step2NotificationService.onExerciseRegenerated(
        exerciseToReplace.name,
        newExercise.name
      );

      logger.info('STEP_2_ACTIVER', 'Exercise regenerated successfully', {
        oldExercise: exerciseToReplace.name,
        newExercise: newExercise.name
      });

    } catch (error) {
      logger.error('STEP_2_ACTIVER', 'Failed to regenerate exercise', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      step2NotificationService.onExerciseError(exerciseToReplace.name);
    } finally {
      setRegeneratingExercises(prev => ({ ...prev, [exerciseId]: false }));
    }
  };

  const handleScrollToExercise = (exerciseId: string) => {
    const exerciseElement = exerciseRefs.current[exerciseId];
    if (exerciseElement) {
      setHighlightedCard(exerciseId);
      exerciseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      Haptics.impact('light');

      setTimeout(() => {
        setHighlightedCard(null);
      }, 2000);
    }
  };

  const handleRequestHelp = (exerciseName: string, exerciseContext: any) => {
    logger.info('STEP2_ACTIVER', 'User requested help from Help Coach button', {
      exerciseName,
      context: exerciseContext
    });

    // Open global chat with pre-filled context
    const contextMessage = `J'ai besoin d'aide avec l'exercice "${exerciseName}". Voici les détails: ${JSON.stringify(exerciseContext, null, 2)}`;

    openChat();
    addMessage({
      id: `help-${Date.now()}`,
      role: 'user',
      content: contextMessage,
      timestamp: new Date()
    });

    // Trigger haptic feedback
    Haptics.impact('medium');

    // Show toast confirmation
    showToast('Coach ouvert avec votre demande d\'aide', 'info');
  };

  // Set step2 active state
  useEffect(() => {
    logger.debug('STEP_2_ACTIVER', 'Setting isInStep2 to true');
    setIsInStep2(true);
    return () => {
      logger.debug('STEP_2_ACTIVER', 'Setting isInStep2 to false (cleanup)');
      setIsInStep2(false);
      step2NotificationService.cleanup();
    };
  }, [setIsInStep2]);

  // Log preparerData state for debugging
  useEffect(() => {
    logger.info('STEP_2_ACTIVER', 'State check', {
      hasPreparerData: !!preparerData,
      hasSessionPrescription: !!sessionPrescription,
      userId,
      preparerDataSummary: preparerData ? {
        locationId: preparerData.locationId,
        locationName: preparerData.locationName,
        energyLevel: preparerData.energyLevel,
        availableTime: preparerData.availableTime
      } : null
    });
  }, [preparerData, sessionPrescription, userId]);

  // Detect page reload to prevent auto-generation
  useEffect(() => {
    // Check if this is a page reload by checking navigation timing
    const isReload = performance.navigation?.type === 1 ||
                     (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type === 'reload';

    setIsPageReload(isReload);

    if (isReload) {
      logger.warn('STEP_2_ACTIVER', 'Page reload detected - blocking auto-generation', {
        timestamp: new Date().toISOString()
      });
    }

    logger.info('STEP_2_ACTIVER', 'Component mounted - resetting auto-generation flag');
    autoGenerationTriggered.current = false;

    return () => {
      logger.info('STEP_2_ACTIVER', 'Component unmounting - cleanup');
      autoGenerationTriggered.current = false;
    };
  }, []);

  // Auto-generate prescription when arriving from Step 1 (with multiple safeguards)
  useEffect(() => {
    // CRITICAL GUARD 1: Never auto-generate on page reload
    if (isPageReload) {
      logger.warn('STEP_2_ACTIVER', 'Skipping auto-generation - page reload detected');
      return;
    }

    // CRITICAL GUARD 2: If prescription already exists, skip generation
    // This covers both new generations AND resumed drafts
    if (sessionPrescription) {
      logger.info('STEP_2_ACTIVER', 'Skipping auto-generation - prescription already exists', {
        prescriptionType: sessionPrescription.type,
        sessionId: currentSessionId,
        reason: 'resumed_draft_or_existing_prescription'
      });
      // Mark generation as completed for resumed drafts
      if (currentSessionId) {
        sessionStateManager.markGenerationCompleted(currentSessionId).catch((error) => {
          logger.warn('STEP_2_ACTIVER', 'Failed to mark generation completed for resumed draft', {
            error: error instanceof Error ? error.message : 'Unknown'
          });
        });
      }
      return;
    }

    // CRITICAL GUARD 3: Check ref to prevent double-trigger in same mount
    if (autoGenerationTriggered.current) {
      logger.debug('STEP_2_ACTIVER', 'Auto-generation already triggered (ref), skipping');
      return;
    }

    // CRITICAL GUARD 4: Async check with database state
    const checkAndGenerate = async () => {
      const canGenerate = await canTriggerGeneration();

      if (!canGenerate) {
        logger.warn('STEP_2_ACTIVER', 'Generation blocked by database check');
        return;
      }

      // Check if we need to generate
      const shouldGenerate = userId && preparerData && !sessionPrescription && !isGenerating && !generationError && !isValidatingProfile;

      if (shouldGenerate) {
        logger.info('STEP_2_ACTIVER', 'Auto-triggering prescription generation', {
          userId,
          hasPreparerData: !!preparerData,
          sessionId: currentSessionId
        });
        autoGenerationTriggered.current = true;
        await markGenerationTriggered(currentSessionId || 'temp');
        generatePrescription();
      } else {
        logger.debug('STEP_2_ACTIVER', 'Auto-generation conditions not met', {
          userId: !!userId,
          preparerData: !!preparerData,
          sessionPrescription: !!sessionPrescription,
          isGenerating,
          generationError: !!generationError,
          isValidatingProfile
        });
      }
    };

    // Small delay to ensure state is stable and prevent race conditions
    const timeoutId = setTimeout(() => {
      checkAndGenerate();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userId, preparerData, sessionPrescription, isGenerating, generationError, isValidatingProfile, isPageReload, canTriggerGeneration, markGenerationTriggered, currentSessionId]);

  // RECOVERY: Attempt to recover prescription if generation is blocked
  useEffect(() => {
    // CRITICAL: Add showRecoveryOptions to guard to prevent infinite loop
    if (recoveryAttempted || isRecovering || sessionPrescription || !currentSessionId || !userId || showRecoveryOptions) {
      return;
    }

    const attemptRecovery = async () => {
      try {
        logger.info('STEP_2_ACTIVER', 'Checking if prescription recovery is needed', {
          currentSessionId,
          userId
        });

        const canGenerate = await canTriggerGeneration();

        if (canGenerate) {
          logger.info('STEP_2_ACTIVER', 'Generation is allowed - no recovery needed');
          setRecoveryAttempted(true);
          return;
        }

        logger.warn('STEP_2_ACTIVER', 'Generation is blocked - attempting prescription recovery', {
          currentSessionId
        });

        setIsRecovering(true);
        const recovered = await attemptPrescriptionRecovery(currentSessionId);

        if (recovered) {
          logger.info('STEP_2_ACTIVER', 'Prescription recovered successfully');
          showToast({
            type: 'success',
            title: 'Training récupéré',
            message: 'Votre training précédent a été restauré',
            duration: 3000
          });
          setRecoveryAttempted(true);
          setIsRecovering(false);
        } else {
          logger.warn('STEP_2_ACTIVER', 'Could not recover prescription - showing options to user');
          setShowRecoveryOptions(true);
          setRecoveryError('Impossible de récupérer votre training précédent');
          setIsRecovering(false);
          setRecoveryAttempted(true); // Mark as attempted to prevent re-triggering
        }
      } catch (error) {
        logger.error('STEP_2_ACTIVER', 'Error during recovery attempt', {
          error: error instanceof Error ? error.message : 'Unknown'
        });
        setShowRecoveryOptions(true);
        setRecoveryError('Erreur lors de la récupération');
        setIsRecovering(false);
        setRecoveryAttempted(true); // Mark as attempted to prevent re-triggering
      }
    };

    const timeoutId = setTimeout(() => {
      attemptRecovery();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [recoveryAttempted, isRecovering, sessionPrescription, currentSessionId, userId, showRecoveryOptions, canTriggerGeneration, attemptPrescriptionRecovery]);

  // TIMEOUT DETECTION: Detect stuck generation at 0% and trigger recovery
  useEffect(() => {
    if (!isGenerating) {
      generationStartTime.current = null;
      return;
    }

    if (generationStartTime.current === null) {
      generationStartTime.current = Date.now();
    }

    const checkTimeout = setInterval(() => {
      if (generationStartTime.current && isGenerating && generationProgress.progress === 0) {
        const elapsedSeconds = (Date.now() - generationStartTime.current) / 1000;

        if (elapsedSeconds > 10) {
          logger.error('STEP_2_ACTIVER', 'Generation stuck at 0% for 10+ seconds - triggering recovery', {
            elapsedSeconds,
            currentSessionId
          });

          resetProgress();
          setGenerationError('La génération semble bloquée');
          setShowRecoveryOptions(true);
          generationStartTime.current = null;
        }
      }
    }, 2000);

    return () => clearInterval(checkTimeout);
  }, [isGenerating, generationProgress.progress]);

  // CRITICAL: Preload all exercise illustrations in background when prescription arrives
  // This ensures illustrations are ready when user reaches Step 3
  useEffect(() => {
    if (!sessionPrescription) return;

    const discipline = sessionPrescription.discipline || sessionPrescription.category || 'force';

    // Collect exercises from both Force and Endurance sessions
    let exercisesToPreload: { name: string }[] = [];

    // Force/Competitions/Functional: exercises array
    if (sessionPrescription.exercises && sessionPrescription.exercises.length > 0) {
      exercisesToPreload = sessionPrescription.exercises;
    }
    // Endurance: mainWorkout blocks
    else if (sessionPrescription.mainWorkout && sessionPrescription.mainWorkout.length > 0) {
      exercisesToPreload = sessionPrescription.mainWorkout.map(block => ({ name: block.name }));
    }

    if (exercisesToPreload.length === 0) return;

    logger.info('STEP_2_PRELOAD', 'Starting background preload of exercise illustrations', {
      exerciseCount: exercisesToPreload.length,
      discipline,
      sessionId: currentSessionId,
      hasMainWorkout: !!sessionPrescription.mainWorkout,
      hasExercises: !!sessionPrescription.exercises
    });

    // Preload from cache first (synchronous)
    preloadFromCache();

    // Then trigger async generation for missing illustrations in background
    // This will continue even if user navigates to Step 3
    const preloadMissingIllustrations = async () => {
      for (const exercise of exercisesToPreload) {
        // Check if illustration is already in cache
        const cached = illustrationCacheService.get(exercise.name, discipline);
        if (cached) {
          logger.debug('STEP_2_PRELOAD', 'Illustration already in cache, skipping', {
            exerciseName: exercise.name
          });
          continue;
        }

        // Check if already generating
        const pending = illustrationCacheService.getPendingRequest(exercise.name, discipline);
        if (pending) {
          logger.debug('STEP_2_PRELOAD', 'Illustration already generating, skipping', {
            exerciseName: exercise.name
          });
          continue;
        }

        logger.info('STEP_2_PRELOAD', 'Queuing background generation for exercise', {
          exerciseName: exercise.name,
          discipline
        });

        // The ExerciseIllustration component will handle the actual generation
        // when it mounts. We just need to trigger the store update.
        setIllustrationInStore(exercise.name, discipline, {
          isGenerating: true,
          error: false
        });
      }
    };

    // Run preload asynchronously (non-blocking)
    preloadMissingIllustrations().catch((error) => {
      logger.error('STEP_2_PRELOAD', 'Error during background preload', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
    });
  }, [sessionPrescription, currentSessionId]);

  // Initialize notification service early
  useEffect(() => {
    if (currentSessionId && userId && !isServicesInitialized) {
      const initServices = async () => {
        try {
          logger.info('STEP_2_ACTIVER', 'Initializing notification services early', {
            sessionId: currentSessionId,
            userId
          });
          await step2NotificationService.initialize(currentSessionId, userId);
          setIsServicesInitialized(true);
          logger.info('STEP_2_ACTIVER', 'Notification services initialized successfully', {
            canShowNotifications: true
          });
        } catch (error) {
          logger.error('STEP_2_ACTIVER', 'Failed to initialize notification services', {
            error: error instanceof Error ? error.message : 'Unknown error',
            sessionId: currentSessionId,
            userId
          });
        }
      };
      initServices();
    }
  }, [currentSessionId, userId, isServicesInitialized]);

  // Trigger notifications based on generation phase
  useEffect(() => {
    if (!isGenerating || !isServicesInitialized) return;

    const phase = generationProgress.phase;

    if (phase === 'starting') {
      step2NotificationService.onGenerationStart();
    } else if (phase === 'analyzing') {
      step2NotificationService.onGenerationAnalyzing();
    } else if (phase === 'selecting') {
      step2NotificationService.onGenerationSelecting();
    } else if (phase === 'calculating') {
      step2NotificationService.onGenerationCalculating();
    }
  }, [generationProgress.phase, isGenerating, isServicesInitialized]);

  // Show welcome notifications when prescription is ready
  useEffect(() => {
    if (sessionPrescription && isServicesInitialized) {
      logger.info('STEP_2_ACTIVER', 'Showing welcome notifications');
      step2NotificationService.onWelcomeIntro();
      step2NotificationService.onWelcomeHelp();
    }
  }, [sessionPrescription, isServicesInitialized]);


  const generatePrescription = async () => {
    logger.info('STEP_2_ACTIVER', 'generatePrescription called', {
      hasUserId: !!userId,
      hasPreparerData: !!preparerData,
      userId,
      preparerData: preparerData ? 'present' : 'null'
    });

    if (!userId) {
      const errorMsg = 'UserId manquant - utilisateur non authentifié';
      logger.error('STEP_2_ACTIVER', errorMsg);
      setGenerationError(errorMsg);
      return;
    }

    if (!preparerData) {
      const errorMsg = 'PreparerData manquant - retournez à l\'étape 1';
      logger.error('STEP_2_ACTIVER', errorMsg);
      setGenerationError(errorMsg);
      return;
    }

    // CRITICAL: Check if generation is already in progress
    const lockResult = generationLockService.acquireLock('prescription', {
      sessionId: currentSessionId || 'temp',
      userId
    });

    if (!lockResult.success) {
      logger.warn('STEP_2_ACTIVER', 'Generation already in progress, skipping duplicate call', {
        existingLockId: lockResult.existingLock?.lockId,
        existingLockAge: lockResult.existingLock
          ? Date.now() - lockResult.existingLock.timestamp
          : 0
      });
      return;
    }

    logger.info('STEP_2_ACTIVER', 'Generation lock acquired', {
      lockId: lockResult.lockId
    });

    // VALIDATION: Check profile completeness before generating
    setIsValidatingProfile(true);
    try {
      const validation = await validateProfileForTraining(userId, profile);

      if (!validation.valid) {
        setIsValidatingProfile(false);
        logger.warn('STEP_2_ACTIVER', 'Profile incomplete - blocking generation', {
          userId,
          missingFieldsCount: validation.missingFields.length,
          missingTabs: validation.missingTabs
        });

        // Show detailed error with missing fields
        const missingByTab: Record<string, string[]> = {};
        for (const field of validation.missingFields.filter(f => f.required)) {
          if (!missingByTab[field.tab]) {
            missingByTab[field.tab] = [];
          }
          missingByTab[field.tab].push(field.label);
        }

        const tabMessages = Object.entries(missingByTab).map(([tab, fields]) => {
          const tabName = tab === 'identity' ? 'Identité' :
                         tab === 'training' ? 'Training (Préférences)' :
                         tab === 'health' ? 'Santé' : 'Lieux';
          return `${tabName}: ${fields.join(', ')}`;
        }).join('\n');

        showToast({
          type: 'error',
          title: 'Profil incomplet',
          message: `Veuillez compléter votre profil avant de générer un training:\n\n${tabMessages}`,
          duration: 8000,
        });

        // Smart navigation to the correct profile tab
        setTimeout(() => {
          const shouldRedirect = confirm('Voulez-vous compléter votre profil maintenant ?');
          if (shouldRedirect) {
            // Navigate to the first missing tab with priority: identity > training > health
            const primaryTab = validation.missingTabs[0];
            const tabUrls: Record<string, string> = {
              'identity': '/profile?tab=identity',
              'training': '/profile?tab=preferences',
              'health': '/profile?tab=health',
              'locations': '/profile?tab=preferences'
            };
            const targetUrl = tabUrls[primaryTab] || '/profile';
            navigate(targetUrl);
          }
        }, 1000);

        return;
      }

      logger.info('STEP_2_ACTIVER', 'Profile validation passed', { userId });
    } catch (validationError) {
      setIsValidatingProfile(false);
      logger.error('STEP_2_ACTIVER', 'Profile validation error', {
        error: validationError instanceof Error ? validationError.message : 'Unknown'
      });

      showToast({
        type: 'error',
        title: 'Erreur de validation',
        message: 'Impossible de valider votre profil. Veuillez réessayer.',
        duration: 4000,
      });
      return;
    }
    setIsValidatingProfile(false);

    setGenerationError(null);

    // Start the progress tracker immediately before any async operations
    // This ensures progress is initialized to 0% before UI renders
    startProgress();

    // Small delay to ensure progress state is applied before continuing
    await new Promise(resolve => setTimeout(resolve, 50));

    // Ensure notification services are initialized
    try {
      if (!isServicesInitialized) {
        logger.info('STEP_2_ACTIVER', 'Initializing notification services for generation');
        await step2NotificationService.initialize(currentSessionId || 'temp-session', userId);
        setIsServicesInitialized(true);
      }
    } catch (initError) {
      logger.error('STEP_2_ACTIVER', 'Failed to initialize notification services', {
        error: initError instanceof Error ? initError.message : 'Unknown'
      });
      // Continue with generation even if notifications fail
    }

    logger.info('STEP_2_ACTIVER', 'Generating prescription with AI', {
      userId,
      preparerData,
      historyLength: generationHistory.length
    });

    // Build exclusion list from generation history
    const excludedCacheKeys = generationHistory
      .map(item => item.cacheKey)
      .filter((key): key is string => key !== undefined);

    logger.info('STEP_2_ACTIVER', 'Excluding previous generations', {
      excludedCount: excludedCacheKeys.length,
      excludedKeys: excludedCacheKeys
    });

    // Create timeout promise (5 minutes)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: La génération a pris plus de 5 minutes')), 300000);
    });

    try {
      // Race between generation and timeout
      const { prescription } = await Promise.race([
        trainingGenerationService.generateTraining(userId, preparerData, excludedCacheKeys),
        timeoutPromise
      ]);

      // Release lock after successful generation
      generationLockService.releaseLock('prescription', {
        sessionId: currentSessionId || 'temp',
        userId
      });

      // Show completion notification first
      if (isServicesInitialized) {
        step2NotificationService.onGenerationComplete();
      }

      // Then complete progress (jump to 100%)
      completeProgress(true);

      console.log('🎯 STEP_2_ACTIVER - Prescription from AI:', {
        type: prescription.type,
        exerciseCount: getWorkoutItemsCount(prescription),
        sessionId: prescription.sessionId,
        hasExercises: !!prescription.exercises,
        exercisesLength: prescription.exercises?.length || 0,
        hasMainWorkout: !!prescription.mainWorkout,
        mainWorkoutLength: prescription.mainWorkout?.length || 0,
        mainWorkoutType: typeof prescription.mainWorkout,
        mainWorkoutIsArray: Array.isArray(prescription.mainWorkout),
        hasDiscipline: !!prescription.discipline,
        discipline: prescription.discipline,
        prescriptionKeys: Object.keys(prescription),
        mainWorkoutSample: prescription.mainWorkout?.[0]
      });

      logger.info('STEP_2_ACTIVER', 'Prescription generated successfully', {
        type: prescription.type,
        exerciseCount: getWorkoutItemsCount(prescription),
        sessionId: prescription.sessionId,
        hasExercises: !!prescription.exercises,
        exercisesLength: prescription.exercises?.length || 0,
        hasMainWorkout: !!prescription.mainWorkout,
        mainWorkoutLength: prescription.mainWorkout?.length || 0,
        hasDiscipline: !!prescription.discipline,
        discipline: prescription.discipline,
        prescriptionKeys: Object.keys(prescription)
      });

      // Brief delay to show 100% completion before showing prescription
      setTimeout(() => {
        console.log('📦 STEP_2_ACTIVER - Storing in Zustand:', {
          hasMainWorkout: !!prescription.mainWorkout,
          mainWorkoutLength: prescription.mainWorkout?.length || 0,
          hasExercises: !!prescription.exercises,
          exercisesLength: prescription.exercises?.length || 0,
          hasStations: !!(prescription as any).stations,
          stationsLength: (prescription as any).stations?.length || 0,
          discipline: prescription.discipline,
          competitionFormat: (prescription as any).competitionFormat,
          category: prescription.category,
          prescriptionKeys: Object.keys(prescription)
        });
        logger.info('STEP_2_ACTIVER', 'Setting prescription in store', {
          hasMainWorkout: !!prescription.mainWorkout,
          mainWorkoutLength: prescription.mainWorkout?.length || 0,
          hasExercises: !!prescription.exercises,
          exercisesLength: prescription.exercises?.length || 0,
          hasStations: !!(prescription as any).stations,
          stationsLength: (prescription as any).stations?.length || 0,
          discipline: prescription.discipline,
          competitionFormat: (prescription as any).competitionFormat,
          category: prescription.category
        });
        setSessionPrescription(prescription);

        // Save draft session to database
        if (currentSessionId && userId) {
          sessionPersistenceService.saveDraftSession({
            sessionId: currentSessionId,
            userId,
            prescription,
            preparerContext: preparerData
          }).then(() => {
            logger.info('STEP_2_ACTIVER', 'Draft session saved successfully', {
              sessionId: currentSessionId,
              discipline: prescription.discipline || prescription.category || 'force'
            });
          }).catch((saveError) => {
            logger.error('STEP_2_ACTIVER', 'Failed to save draft session', {
              error: saveError instanceof Error ? saveError.message : 'Unknown',
              sessionId: currentSessionId,
              note: 'User can continue normally despite save failure'
            });
          });
        }

        // Reset progress after a moment to allow completion animation
        setTimeout(() => {
          resetProgress();
        }, 300);
        autoGenerationTriggered.current = false;
      }, 600);
    } catch (error) {
      // Release lock on error
      generationLockService.releaseLock('prescription', {
        sessionId: currentSessionId || 'temp',
        userId
      });

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      completeProgress(false, errorMessage);
      setGenerationError(errorMessage);
      autoGenerationTriggered.current = false;

      logger.error('STEP_2_ACTIVER', 'Prescription generation failed', {
        userId,
        error: errorMessage
      });
    }
  };


  const handleValidateAndContinue = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setValidated(true);
    Haptics.success();

    addMessage({
      role: 'system',
      type: 'system',
      content: 'Plan validé par l\'utilisateur'
    });

    logger.info('STEP_2_ACTIVER', 'Starting transition to Step 3');

    // Direct navigation for both endurance and force sessions
    // Endurance sessions will handle their own countdown in Step3
    setTimeout(() => {
      logger.info('STEP_2_ACTIVER', 'Navigating to Step 3', {
        sessionType: sessionPrescription?.mainWorkout ? 'endurance' : 'force'
      });
      goToNextStep();
    }, 800);
  };


  const handleCancelGeneration = () => {
    logger.info('STEP_2_ACTIVER', 'User cancelled generation');
    resetProgress();
    setGenerationError('Génération annulée par l\'utilisateur');
    autoGenerationTriggered.current = false;
  };

  const handleStartFresh = async () => {
    if (!currentSessionId || !userId) {
      logger.error('STEP_2_ACTIVER', 'Cannot start fresh - missing sessionId or userId');
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Session ou utilisateur manquant. Rechargez la page.',
        duration: 4000
      });
      return;
    }

    logger.info('STEP_2_ACTIVER', 'User chose to start fresh - resetting session state');

    setIsRecovering(true);
    setRecoveryError(null);
    setShowRecoveryOptions(false); // Close modal immediately for better UX

    try {
      // Reset session state in database and local store
      const success = await resetSessionStateForRegeneration(currentSessionId);

      if (success) {
        logger.info('STEP_2_ACTIVER', 'Session state reset - navigating to Step 1');

        // Clean up Step 2 local state before navigation
        setSessionPrescription(null);
        setGenerationError(null);
        setRecoveryAttempted(false);
        autoGenerationTriggered.current = false;

        showToast({
          type: 'success',
          title: 'Recommençons !',
          message: 'Retour à l\'étape 1...',
          duration: 2000
        });

        // Small delay for smooth transition
        setTimeout(() => {
          setIsRecovering(false);
          // goToStep('preparer') will clean all data and show Step 1 components
          goToStep('preparer');
        }, 300);
      } else {
        logger.error('STEP_2_ACTIVER', 'Failed to reset session state');
        setRecoveryError('Échec de la réinitialisation');
        showToast({
          type: 'error',
          title: 'Erreur de réinitialisation',
          message: 'Impossible de réinitialiser. Rechargez la page ou réessayez.',
          duration: 5000
        });
        setIsRecovering(false);
      }
    } catch (error) {
      logger.error('STEP_2_ACTIVER', 'Exception in handleStartFresh', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      setRecoveryError('Erreur inattendue');
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue. Rechargez la page.',
        duration: 5000
      });
      setIsRecovering(false);
    }
  };

  const handleForceRegenerate = async () => {
    if (!currentSessionId || !userId) {
      logger.error('STEP_2_ACTIVER', 'Cannot regenerate - missing sessionId or userId');
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Session ou utilisateur manquant. Rechargez la page.',
        duration: 4000
      });
      return;
    }

    logger.info('STEP_2_ACTIVER', 'User forcing regeneration despite block');

    setIsRecovering(true);
    setShowRecoveryOptions(false);
    setRecoveryError(null);

    try {
      // Reset session state (this also cleans preparerData)
      const success = await resetSessionStateForRegeneration(currentSessionId);

      if (success) {
        // IMPORTANT: Since resetSessionStateForRegeneration clears preparerData,
        // we can't regenerate here. Redirect to Step 1 instead.
        logger.info('STEP_2_ACTIVER', 'Session state reset - redirecting to Step 1 for fresh start');

        setIsRecovering(false);
        setRecoveryAttempted(true);
        setRecoveryError(null);
        autoGenerationTriggered.current = false;

        showToast({
          type: 'success',
          title: 'Session réinitialisée',
          message: 'Retour à l\'étape 1 pour recommencer...',
          duration: 2000
        });

        setTimeout(() => {
          goToStep('preparer');
        }, 300);
      } else {
        logger.error('STEP_2_ACTIVER', 'Failed to reset session state for regeneration');
        setIsRecovering(false);
        setShowRecoveryOptions(true);
        setRecoveryError('Impossible de réinitialiser la session');
        showToast({
          type: 'error',
          title: 'Erreur de réinitialisation',
          message: 'Impossible de réinitialiser. Rechargez la page.',
          duration: 5000
        });
      }
    } catch (error) {
      logger.error('STEP_2_ACTIVER', 'Exception in handleForceRegenerate', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      setIsRecovering(false);
      setShowRecoveryOptions(true);
      setRecoveryError('Erreur inattendue');
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue. Rechargez la page.',
        duration: 5000
      });
    }
  };

  const handleSaveDraft = async (customName?: string) => {
    if (!sessionPrescription) return;

    const success = await saveDraft(customName);

    if (success) {
      showToast({
        type: 'success',
        title: 'Training sauvegardé',
        message: customName
          ? `"${customName}" a été sauvegardé pour 48h`
          : 'Ton training a été sauvegardé pour 48h',
        duration: 4000
      });
      Haptics.success();
      step2NotificationService.onDraftSaved(customName);
      setShowSaveModal(false);
    } else {
      showToast({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Impossible de sauvegarder le training. Réessaye.',
        duration: 4000
      });
      Haptics.error();
    }
  };

  const handleRegenerateTraining = async () => {
    if (!userId || !preparerData) return;

    setShowRegenerateModal(false);
    step2NotificationService.onRegenerationStarted();

    if (sessionPrescription) {
      addToGenerationHistory(sessionPrescription);
    }

    autoGenerationTriggered.current = false;
    setSessionPrescription(null);

    await generatePrescription();

    if (isServicesInitialized) {
      step2NotificationService.onRegenerationComplete();
    }
  };

  const handleEnduranceIntensityAdjustment = (direction: AdjustmentDirection) => {
    if (!sessionPrescription || !sessionPrescription.mainWorkout) {
      logger.warn('STEP_2_ACTIVER', 'Cannot adjust: no endurance prescription', {
        hasPrescription: !!sessionPrescription,
        hasMainWorkout: !!sessionPrescription?.mainWorkout
      });
      return;
    }

    logger.info('STEP_2_ACTIVER', `Adjusting endurance intensity: ${direction}`, {
      sessionName: sessionPrescription.sessionName,
      currentAdjustmentCount: adjustmentCount
    });

    const result = adjustEnduranceIntensity(sessionPrescription, direction);

    if (!result.success) {
      showToast({
        type: result.limitReached ? 'warning' : 'error',
        title: result.limitReached ? 'Limite atteinte' : 'Erreur',
        message: result.message,
        duration: 4000
      });

      if (result.limitReached) {
        Haptics.warning();
        // Trigger limit notification
        if (isServicesInitialized) {
          step2NotificationService.onEnduranceAdjustmentLimit(sessionPrescription.sessionName);
        }
      } else {
        Haptics.error();
      }

      return;
    }

    // Update prescription with adjusted version
    setSessionPrescription(result.adjustedPrescription);

    // Track adjusted blocks for highlighting
    const adjustedBlockIds = result.changes.map(c => c.blockId);
    setLastAdjustedBlockIds(adjustedBlockIds);

    // Increment adjustment count
    setAdjustmentCount(prev => prev + 1);

    // Show success feedback
    showToast({
      type: 'success',
      title: direction === 'harder' ? 'Intensité augmentée' : 'Intensité réduite',
      message: result.message,
      duration: 3000
    });

    Haptics.success();

    // Trigger coach notification
    if (isServicesInitialized) {
      const changesSummary = result.changes.map(c =>
        `${c.blockName}: ${c.field} ${c.oldValue} → ${c.newValue}`
      ).join(', ');

      if (direction === 'harder') {
        step2NotificationService.onEnduranceIntensityIncreased(
          sessionPrescription.sessionName,
          changesSummary
        );
      } else {
        step2NotificationService.onEnduranceIntensityDecreased(
          sessionPrescription.sessionName,
          changesSummary
        );
      }
    }

    // Clear highlights after animation
    setTimeout(() => {
      setLastAdjustedBlockIds([]);
    }, 3000);

    logger.info('STEP_2_ACTIVER', 'Adjustment completed', {
      direction,
      changesCount: result.changes.length,
      newDuration: result.adjustedPrescription.durationTarget,
      adjustmentCount: adjustmentCount + 1
    });
  };

  if (isGenerating) {
    // Wait until progress is ready to prevent NaN flash
    if (!generationProgress.isReady) {
      return null;
    }

    const getProgressMessage = () => {
      const phase = generationProgress.phase;
      if (phase === 'starting') return { title: "Connexion au coach IA...", subtitle: "Initialisation du système de personnalisation" };
      if (phase === 'analyzing') return { title: "Analyse de ton profil...", subtitle: "Récupération de ton historique et objectifs" };
      if (phase === 'selecting') return { title: "Génération des exercices...", subtitle: "Sélection optimale selon tes équipements" };
      if (phase === 'calculating') return { title: "Optimisation finale...", subtitle: "Calcul des charges et volumes adaptés" };
      return { title: "Presque prêt...", subtitle: "Finalisation de ta séance personnalisée" };
    };

    const { title, subtitle } = getProgressMessage();

    return (
      <>
        <TrainingCoachNotificationBubble chatButtonRef={chatButtonRef} isStep1={false} />
        <StepContainer>
          <TrainingGenerationLoader
            progress={generationProgress.progress}
            locationName={preparerData?.locationName}
            availableEquipment={preparerData?.availableEquipment}
            discipline={discipline}
            energyLevel={preparerData?.energyLevel}
            availableTime={preparerData?.availableTime}
            disciplineColor={disciplineColor}
            showCancelButton={true}
            onCancel={handleCancelGeneration}
          />
        </StepContainer>
      </>
    );
  }

  if (showRecoveryOptions || (generationError && !sessionPrescription)) {
    return (
      <StepContainer>
        <GlassCard className="p-8 text-center">
          <SpatialIcon
            Icon={ICONS.AlertTriangle}
            size={64}
            style={{ color: '#F59E0B', margin: '0 auto 1.5rem' }}
          />
          <h3 className="text-xl font-bold text-white mb-4">
            {recoveryError || 'Session bloquée'}
          </h3>
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            {recoveryError
              ? 'Nous n\'avons pas pu récupérer votre training précédent. Vous pouvez soit recommencer depuis le début, soit générer un nouveau training.'
              : 'La génération semble bloquée. Choisissez une option pour continuer.'}
          </p>
          <div className="flex flex-col gap-4">
            <TrainingButton
              variant="primary"
              size="lg"
              icon="ArrowLeft"
              onClick={handleStartFresh}
              disabled={isRecovering}
              loading={isRecovering}
              fullWidth
            >
              Recommencer (Étape 1)
            </TrainingButton>
            <TrainingButton
              variant="secondary"
              size="lg"
              icon="RefreshCw"
              onClick={handleForceRegenerate}
              disabled={isRecovering}
              fullWidth
            >
              Générer un nouveau training
            </TrainingButton>
          </div>
        </GlassCard>
      </StepContainer>
    );
  }

  if (generationError) {
    return (
      <StepContainer>
        <GlassCard className="p-8 text-center">
          <SpatialIcon
            Icon={ICONS.AlertCircle}
            size={64}
            style={{ color: '#EF4444', margin: '0 auto 1.5rem' }}
          />
          <h3 className="text-xl font-bold text-white mb-4">
            Erreur lors de la génération
          </h3>
          <p className="text-white/70 mb-6">
            {generationError}
          </p>
          <div className="flex gap-4 justify-center">
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
              icon="RefreshCw"
              onClick={generatePrescription}
            >
              Réessayer
            </TrainingButton>
          </div>
        </GlassCard>
      </StepContainer>
    );
  }

  // No prescription yet - show loader (auto-generation in progress) or error message
  if (!sessionPrescription) {
    // If missing critical data, show error and redirect option
    if (!userId || !preparerData) {
      return (
        <StepContainer>
          <GlassCard
            className="p-8 text-center"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, color-mix(in srgb, #EF4444 10%, transparent) 0%, transparent 60%),
                rgba(255, 255, 255, 0.08)
              `,
              border: `2px solid color-mix(in srgb, #EF4444 20%, transparent)`
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, color-mix(in srgb, #EF4444 35%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.12)
                `,
                border: `2px solid color-mix(in srgb, #EF4444 50%, transparent)`,
                boxShadow: `
                  0 4px 16px color-mix(in srgb, #EF4444 30%, transparent),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `
              }}
            >
              <SpatialIcon
                Icon={ICONS.AlertTriangle}
                size={40}
                variant="pure"
                style={{
                  color: '#EF4444',
                  filter: `drop-shadow(0 0 12px color-mix(in srgb, #EF4444 70%, transparent))`
                }}
              />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Configuration manquante
            </h3>
            <p className="text-white/70 mb-8">
              {!userId && 'Erreur d\'authentification. Veuillez vous reconnecter.'}
              {userId && !preparerData && 'Aucune configuration de séance détectée. Retournez à l\'étape 1.'}
            </p>

            <div className="flex gap-4 justify-center">
              <TrainingButton
                variant="secondary"
                size="lg"
                icon="ArrowLeft"
                onClick={goToPreviousStep}
              >
                Retour à l'étape 1
              </TrainingButton>
            </div>
          </GlassCard>
        </StepContainer>
      );
    }

    // Otherwise, show loader (auto-generation is in progress)
    return (
      <StepContainer>
        <TrainingGenerationLoader
          progress={generationProgress.progress || 0}
          locationName={preparerData?.locationName}
          availableEquipment={preparerData?.availableEquipment}
          discipline={discipline}
          energyLevel={preparerData?.energyLevel}
          availableTime={preparerData?.availableTime}
          disciplineColor={disciplineColor}
          showCancelButton={false}
        />
      </StepContainer>
    );
  }

  return (
    <>
      <TrainingCoachNotificationBubble chatButtonRef={chatButtonRef} isStep1={false} />
      <StepContainer>
      {/* Session Overview Header with CTA - VisionOS 26 spacing */}
      <GlassCard
        className="space-y-4 mb-8"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 12%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 25%, transparent)`,
          boxShadow: `
            0 4px 20px rgba(0, 0, 0, 0.25),
            0 0 30px color-mix(in srgb, ${stepColor} 18%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.12)
          `
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{sessionPrescription.type}</h2>
            <p className="text-white/60 text-sm">Durée cible: {sessionPrescription.durationTarget} minutes</p>
          </div>
          <motion.button
            onClick={() => setIsPrescriptionVisible(!isPrescriptionVisible)}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isPrescriptionVisible ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <SpatialIcon Icon={ICONS.ChevronDown} size={20} style={{ color: 'white' }} />
            </motion.div>
          </motion.button>
        </div>

        {((sessionPrescription.focus && sessionPrescription.focus.length > 0) ||
          (sessionPrescription.focusZones && sessionPrescription.focusZones.length > 0)) && (
          <div className="flex flex-wrap gap-2">
            {(sessionPrescription.focus || sessionPrescription.focusZones || []).map((focus, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: `color-mix(in srgb, ${stepColor} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${stepColor} 30%, transparent)`,
                  color: stepColor
                }}
              >
                {focus}
              </div>
            ))}
          </div>
        )}

        {/* Save Draft Button */}
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-2"
          >
            <TrainingButton
              variant="secondary"
              size="md"
              icon="Bookmark"
              onClick={() => setShowSaveModal(true)}
              disabled={isSavingDraft}
              fullWidth
              stepColor={stepColor}
            >
              {isSavingDraft ? 'Sauvegarde...' : 'Sauvegarder pour plus tard'}
            </TrainingButton>
          </motion.div>
        )}

        {/* Primary CTA - Lancer la Séance */}
        {sessionPrescription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4"
          >
            <TrainingButton
              variant="primary"
              size="lg"
              icon="Play"
              iconPosition="right"
              onClick={handleValidateAndContinue}
              disabled={isTransitioning}
              loading={isTransitioning}
              fullWidth
              stepColor={stepColor}
            >
              {isTransitioning ? 'Préparation...' : 'Lancer la Séance'}
            </TrainingButton>
          </motion.div>
        )}
      </GlassCard>

      {/* Session Overview Charts - Discipline Specific */}
      <AnimatePresence>
        {isPrescriptionVisible && (() => {
          // Force/Power Sessions
          if (!sessionPrescription.mainWorkout &&
              !sessionPrescription.stations &&
              (sessionPrescription.discipline === 'force' ||
               sessionPrescription.category?.toLowerCase().includes('force') ||
               sessionPrescription.category?.toLowerCase().includes('power') ||
               sessionPrescription.category?.toLowerCase().includes('strength'))) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
              >
                <ForceSessionChart
                  data={{
                    exercises: sessionPrescription.exercises || [],
                    sessionName: sessionPrescription.sessionName,
                    category: sessionPrescription.category,
                    totalDuration: sessionPrescription.durationTarget || 30
                  }}
                  onExerciseClick={handleScrollToExercise}
                  className="w-full"
                />
              </motion.div>
            );
          }

          // Endurance Sessions (Running/Cycling)
          if (sessionPrescription.mainWorkout &&
              (sessionPrescription.discipline === 'endurance' ||
               sessionPrescription.category?.toLowerCase().includes('running') ||
               sessionPrescription.category?.toLowerCase().includes('cycling'))) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
              >
                <EnduranceZonesChart
                  data={{
                    chartType: 'zones',
                    mainWorkout: sessionPrescription.mainWorkout || [],
                    warmup: sessionPrescription.warmup,
                    cooldown: sessionPrescription.cooldown,
                    totalDuration: sessionPrescription.durationTarget || 30,
                    discipline: sessionPrescription.discipline || 'endurance',
                    sessionName: sessionPrescription.sessionName,
                    focusZones: sessionPrescription.focusZones
                  }}
                  className="w-full"
                />
              </motion.div>
            );
          }

          // Functional/CrossTraining Sessions
          if (sessionPrescription.category === 'functional-crosstraining' ||
              (sessionPrescription as any)?.wodFormat) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
              >
                <FunctionalTimelineChart
                  data={{
                    chartType: 'timeline',
                    exercises: sessionPrescription.exercises || [],
                    wodFormat: (sessionPrescription as any)?.wodFormat || 'AMRAP',
                    wodName: (sessionPrescription as any)?.wodName,
                    timeCapMinutes: (sessionPrescription as any)?.timeCapMinutes,
                    targetRounds: (sessionPrescription as any)?.targetRounds,
                    sessionName: sessionPrescription.sessionName,
                    category: sessionPrescription.category
                  }}
                  className="w-full"
                />
              </motion.div>
            );
          }

          // Competition Sessions (Hyrox, Deka, etc.)
          if ((sessionPrescription.category === 'fitness-competitions' ||
               (sessionPrescription as any)?.competitionFormat) &&
              (sessionPrescription as any)?.stations) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
              >
                <CompetitionsCircuitChart
                  data={{
                    chartType: 'circuit',
                    stations: (sessionPrescription as any).stations || [],
                    competitionFormat: (sessionPrescription as any)?.competitionFormat || 'Hyrox',
                    sessionName: sessionPrescription.sessionName,
                    estimatedDuration: sessionPrescription.durationTarget,
                    category: sessionPrescription.category
                  }}
                  className="w-full"
                />
              </motion.div>
            );
          }

          return null;
        })()}
      </AnimatePresence>

      {/* Warmup Card - Positioned before exercises */}
      <AnimatePresence>
        {isPrescriptionVisible && sessionPrescription.warmup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 mb-6"
          >
            <WarmupCard warmup={sessionPrescription.warmup} stepColor={stepColor} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Endurance Adjustment Buttons */}
      <AnimatePresence>
        {isPrescriptionVisible && sessionPrescription.mainWorkout && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 mb-8"
          >
            <GlassCard
              className="p-5"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.06)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
              }}
            >
              <EnduranceAdjustmentButtons
                stepColor={stepColor}
                onAdjustEasier={() => handleEnduranceIntensityAdjustment('easier')}
                onAdjustHarder={() => handleEnduranceIntensityAdjustment('harder')}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Functional Adjustment Buttons */}
      <AnimatePresence>
        {isPrescriptionVisible && (sessionPrescription.category === 'functional-crosstraining' || (sessionPrescription as any)?.wodFormat) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 mb-8"
          >
            <GlassCard
              className="p-5"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.06)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
              }}
            >
              <FunctionalAdjustmentButtons
                stepColor={stepColor}
                prescription={sessionPrescription}
                onPrescriptionUpdate={(updatedPrescription) => {
                  setSessionPrescription(updatedPrescription);
                  logger.info('STEP2_ACTIVER', 'Functional prescription updated', {
                    sessionId: updatedPrescription.sessionId,
                    timeCapMinutes: updatedPrescription.timeCapMinutes,
                    targetRounds: updatedPrescription.targetRounds
                  });
                }}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Competition Adjustment Buttons */}
      <AnimatePresence>
        {isPrescriptionVisible && (sessionPrescription.category === 'fitness-competitions' || (sessionPrescription as any)?.competitionFormat) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 mb-8"
          >
            <GlassCard
              className="p-5"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.06)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
              }}
            >
              <CompetitionAdjustmentButtons
                stepColor={stepColor}
                onAdjustEasier={() => {
                  logger.info('STEP2_ACTIVER', 'Competition adjustment: easier');
                  // TODO: Implement competition intensity adjustment logic
                }}
                onAdjustHarder={() => {
                  logger.info('STEP2_ACTIVER', 'Competition adjustment: harder');
                  // TODO: Implement competition intensity adjustment logic
                }}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Endurance Session Overview - Visual Summary at the top */}
      <AnimatePresence>
        {isPrescriptionVisible && sessionPrescription.mainWorkout && (
          <EnduranceSessionOverview
            prescription={sessionPrescription as any}
            stepColor={stepColor}
          />
        )}
      </AnimatePresence>

      {/* Endurance Session Details - Enhanced Display */}
      <AnimatePresence>
        {isPrescriptionVisible && sessionPrescription.mainWorkout && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 mb-6"
          >
            <GlassCard
              className="p-6"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 12%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.06)
                `,
                border: `2px solid color-mix(in srgb, ${stepColor} 25%, transparent)`,
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.2),
                  0 0 30px color-mix(in srgb, ${stepColor} 15%, transparent)
                `
              }}
            >
              {/* Session Summary */}
              {sessionPrescription.sessionSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 pb-6 border-b border-white/10"
                >
                  <p className="text-white/80 text-sm leading-relaxed">
                    {sessionPrescription.sessionSummary}
                  </p>
                </motion.div>
              )}

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-3 mb-6"
              >
                <div
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                  style={{
                    background: `color-mix(in srgb, ${stepColor} 15%, transparent)`,
                    border: `1.5px solid color-mix(in srgb, ${stepColor} 30%, transparent)`
                  }}
                >
                  {sessionPrescription.durationTarget} min
                </div>
                <div
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                  style={{
                    background: `color-mix(in srgb, ${stepColor} 15%, transparent)`,
                    border: `1.5px solid color-mix(in srgb, ${stepColor} 30%, transparent)`
                  }}
                >
                  {sessionPrescription.mainWorkout.length} {sessionPrescription.mainWorkout.length > 1 ? 'blocs' : 'bloc'}
                </div>
                {sessionPrescription.focusZones && sessionPrescription.focusZones.length > 0 && (
                  sessionPrescription.focusZones.map((zone, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                      style={{
                        background: `color-mix(in srgb, ${stepColor} 15%, transparent)`,
                        border: `1.5px solid color-mix(in srgb, ${stepColor} 30%, transparent)`
                      }}
                    >
                      {zone}
                    </div>
                  ))
                )}
              </motion.div>

              {/* Structure Title */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wider px-3">
                  Structure de la séance
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* All Blocks including warmup and cooldown */}
              <div className="space-y-3">
                {/* Warmup */}
                {sessionPrescription.warmup && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                      lastAdjustedBlockIds.includes('warmup') ? 'ring-2 ring-green-400 bg-green-500/10' : ''
                    }`}
                    style={{
                      background: lastAdjustedBlockIds.includes('warmup')
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `color-mix(in srgb, #f97316 20%, transparent)`,
                        border: `1px solid color-mix(in srgb, #f97316 40%, transparent)`
                      }}
                    >
                      <SpatialIcon Icon={ICONS.Flame} size={20} style={{ color: '#f97316' }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">Échauffement</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/60 text-xs">{sessionPrescription.warmup.duration} min</span>
                        <span className="text-white/40">•</span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: '#10b981',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.4)'
                          }}
                        >
                          {sessionPrescription.warmup.targetZone}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Main Workout Blocks */}
                {sessionPrescription.mainWorkout.map((block: any, idx: number) => {
                  const getZoneColor = (zone: string) => {
                    if (zone.includes('Z1')) return '#10b981';
                    if (zone.includes('Z2')) return '#3b82f6';
                    if (zone.includes('Z3')) return '#f59e0b';
                    if (zone.includes('Z4')) return '#ef4444';
                    if (zone.includes('Z5')) return '#dc2626';
                    return '#8b5cf6';
                  };

                  const zoneColor = getZoneColor(block.targetZone);
                  const isAdjusted = lastAdjustedBlockIds.includes(block.id);

                  return (
                    <motion.div
                      key={block.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + idx * 0.05 }}
                      className={`overflow-hidden rounded-xl transition-all duration-500 ${
                        isAdjusted ? 'ring-2 ring-green-400' : ''
                      }`}
                      style={{
                        background: isAdjusted
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {/* Illustration - Full Width at Top */}
                      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                        <ExerciseIllustration
                          exerciseName={block.name}
                          discipline={discipline}
                          size="large"
                          className="w-full h-full"
                          style={{
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                        {/* Block number badge */}
                        <div
                          className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(8px)',
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                          }}
                        >
                          {idx + 1}
                        </div>
                        {/* Adjusted badge */}
                        {isAdjusted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
                            style={{
                              background: 'rgba(34, 197, 94, 0.9)',
                              backdropFilter: 'blur(8px)',
                              color: 'white',
                              border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                          >
                            Ajusté
                          </motion.div>
                        )}
                        {/* Gradient overlay */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)',
                            pointerEvents: 'none'
                          }}
                        />
                      </div>

                      {/* Content below illustration */}
                      <div className="p-3">
                        <div className="text-white font-semibold text-sm flex items-center gap-2 mb-1">
                          {block.name}
                        </div>
                        {block.description && (
                          <p className="text-xs text-white/60 mb-2 line-clamp-2">{block.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <SpatialIcon Icon={ICONS.Clock} size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
                            <span className="text-white/60 text-xs font-medium">{block.duration} min</span>
                          </div>
                          <span className="text-white/40">•</span>
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              color: zoneColor,
                              background: `${zoneColor}20`,
                              border: `1px solid ${zoneColor}40`
                            }}
                          >
                            {block.targetZone}
                          </span>
                          {block.intervals && block.intervals.work && block.intervals.work.duration && (
                            <>
                              <span className="text-white/40">•</span>
                              <div className="flex items-center gap-1.5">
                                <SpatialIcon Icon={ICONS.Activity} size={14} style={{ color: stepColor }} />
                                <span className="text-white/60 text-xs">
                                  {block.intervals.repeats} × {block.intervals.work.duration}min
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[10px] text-white/50 uppercase font-semibold tracking-wide">{block.type}</span>
                          <SpatialIcon Icon={ICONS.Activity} size={14} style={{ color: stepColor, opacity: 0.5 }} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Cooldown */}
                {sessionPrescription.cooldown && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + sessionPrescription.mainWorkout.length * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                      lastAdjustedBlockIds.includes('cooldown') ? 'ring-2 ring-green-400 bg-green-500/10' : ''
                    }`}
                    style={{
                      background: lastAdjustedBlockIds.includes('cooldown')
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `color-mix(in srgb, #06b6d4 20%, transparent)`,
                        border: `1px solid color-mix(in srgb, #06b6d4 40%, transparent)`
                      }}
                    >
                      <SpatialIcon Icon={ICONS.Wind} size={20} style={{ color: '#06b6d4' }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">Retour au calme</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/60 text-xs">{sessionPrescription.cooldown.duration} min</span>
                        <span className="text-white/40">•</span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: '#10b981',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.4)'
                          }}
                        >
                          {sessionPrescription.cooldown.targetZone}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Coach Advice if available */}
              {sessionPrescription.coachRationale && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 pt-6 border-t border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${stepColor} 20%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${stepColor} 40%, transparent)`
                      }}
                    >
                      <SpatialIcon Icon={ICONS.MessageCircle} size={16} style={{ color: stepColor }} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
                        Conseil du coach
                      </h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {sessionPrescription.coachRationale}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercises List (Collapsible) - VisionOS 26 spacing */}
      <AnimatePresence>
        {isPrescriptionVisible && !sessionPrescription.mainWorkout && (() => {
          logger.info('STEP_2_ACTIVER', 'Rendering exercises list', {
            isPrescriptionVisible,
            hasMainWorkout: !!sessionPrescription.mainWorkout,
            hasExercises: !!sessionPrescription.exercises,
            exercisesLength: sessionPrescription.exercises?.length || 0,
            willRenderCards: true
          });
          return true;
        })() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
{/* Render competition stations if this is a competition session */}
            {(sessionPrescription.category === 'fitness-competitions' || (sessionPrescription as any)?.competitionFormat) && (sessionPrescription as any)?.stations ? (
              ((sessionPrescription as any).stations as any[]).map((station, idx) => (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-4"
                >
                  {regeneratingExercises[station.id] ? (
                    <ExerciseCardSkeleton stepColor={stepColor} />
                  ) : (
                    <CompetitionStationDisplayCard
                      station={station}
                      stationIndex={idx}
                      totalStations={(sessionPrescription as any).stations.length}
                      disciplineColor={disciplineColor}
                      onRequestHelp={handleRequestHelp}
                    />
                  )}
                </motion.div>
              ))
            ) : (
              /* Regular exercise cards for Force and Functional sessions */
              sessionPrescription.exercises.map((exercise, idx) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-4"
                  style={{
                    transform: highlightedCard === exercise.id ? 'scale(1.02)' : 'scale(1)',
                    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  ref={(el) => { exerciseRefs.current[exercise.id] = el; }}
                >
                  {regeneratingExercises[exercise.id] ? (
                    <ExerciseCardSkeleton stepColor={stepColor} />
                  ) : (
                    (sessionPrescription.category === 'functional-crosstraining' ||
                    (sessionPrescription as any)?.wodFormat) ? (
                      <FunctionalPrescriptionCard
                        exercise={exercise}
                        stepColor={stepColor}
                        wodFormat={(sessionPrescription as any)?.wodFormat}
                        wodName={(sessionPrescription as any)?.wodName}
                        timeCapMinutes={(sessionPrescription as any)?.timeCapMinutes}
                        targetRounds={(sessionPrescription as any)?.targetRounds}
                        onExerciseUpdate={handleExerciseUpdate}
                        onRequestAlternatives={handleExerciseSubstitution}
                        onRequestHelp={handleRequestHelp}
                        onExerciseRegenerate={handleExerciseRegenerate}
                        isRegenerating={regeneratingExercises[exercise.id] || false}
                      />
                    ) : (
                      <TrainingPrescriptionCard
                        exercise={exercise}
                        stepColor={stepColor}
                        onExerciseUpdate={handleExerciseUpdate}
                        onExerciseSubstitution={handleExerciseSubstitution}
                        onExerciseRegenerate={handleExerciseRegenerate}
                        onRequestHelp={handleRequestHelp}
                        isRegenerating={regeneratingExercises[exercise.id] || false}
                      />
                    )
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons - Bottom position */}
      {sessionPrescription && (
        <div className="space-y-4 mt-6 mb-4">
          {/* Primary CTA - Lancer la Séance (Bottom) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TrainingButton
              variant="primary"
              size="lg"
              icon="Play"
              iconPosition="right"
              onClick={handleValidateAndContinue}
              disabled={isTransitioning}
              loading={isTransitioning}
              fullWidth
              stepColor={stepColor}
            >
              {isTransitioning ? 'Préparation...' : 'Lancer la Séance'}
            </TrainingButton>
          </motion.div>

          {/* Secondary Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4"
          >
            <TrainingButton
              variant="secondary"
              size="lg"
              icon="LogOut"
              onClick={() => setShowQuitModal(true)}
              disabled={isTransitioning}
              stepColor="#EF4444"
            >
              Quitter
            </TrainingButton>
            <TrainingButton
              variant="secondary"
              size="lg"
              icon="RefreshCw"
              onClick={() => setShowRegenerateModal(true)}
              disabled={isTransitioning}
              fullWidth
              stepColor="#F59E0B"
            >
              Générer un nouveau training
            </TrainingButton>
          </motion.div>
        </div>
      )}

      {/* Modals */}
      <TrainingSaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleSaveDraft}
        trainingType={sessionPrescription?.type || ''}
        isSaving={isSavingDraft}
      />

      <TrainingRegenerateModal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        onConfirm={handleRegenerateTraining}
        currentTrainingType={sessionPrescription?.sessionName || sessionPrescription?.type || ''}
        isRegenerating={isGenerating}
      />

      <TrainingQuitModal
        isOpen={showQuitModal}
        onClose={() => setShowQuitModal(false)}
        onQuitWithoutSaving={async () => {
          setShowQuitModal(false);
          logger.info('STEP_2_ACTIVER', 'User chose to quit without saving');
          await cleanupAndReturn();
          navigate('/training');
        }}
        onSaveAndQuit={async () => {
          if (!sessionPrescription) {
            setShowQuitModal(false);
            await cleanupAndReturn();
            navigate('/training');
            return;
          }

          logger.info('STEP_2_ACTIVER', 'User chose to save and quit');
          const success = await saveDraft();

          if (success) {
            showToast({
              type: 'success',
              title: 'Training sauvegardé',
              message: 'Ton training a été sauvegardé pour 48h',
              duration: 3000
            });
            Haptics.success();

            // Wait a bit for user feedback, then navigate
            setTimeout(async () => {
              await cleanupAndReturn();
              navigate('/training');
            }, 1000);
          } else {
            showToast({
              type: 'error',
              title: 'Erreur de sauvegarde',
              message: 'Impossible de sauvegarder. Réessaye.',
              duration: 4000
            });
            Haptics.error();
          }
        }}
        trainingType={sessionPrescription?.sessionName || sessionPrescription?.type}
        isSaving={isSavingDraft}
        isDraftAlreadySaved={isDraftSaved}
      />
      </StepContainer>
    </>
  );
};

export default Step2Activer;

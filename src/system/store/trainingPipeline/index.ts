/**
 * Training Pipeline Store
 * Zustand store for managing the 6-step training generation pipeline
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import logger from '../../../lib/utils/logger';
import type { TrainingPipelineState, TrainingPipelineStepId } from './types';
import { TRAINING_PIPELINE_STEPS, STORAGE_KEY } from './constants';
import { supabase } from '../../supabase/client';
import { sessionStateManager } from '../../services/sessionStateManager';

export const useTrainingPipeline = create<TrainingPipelineState>()(
  persist(
    (set, get) => ({
      currentStep: 'preparer',
      isActive: false,
      progress: 0,

      userId: null,
      preparerData: null,
      sessionPrescription: null,
      sessionFeedback: null,
      sessionAnalysisResult: null,
      adaptations: [],
      nextAction: null,

      currentSessionId: null,
      currentPlanId: null,

      generationHistory: [],
      savedDraft: null,
      isSavingDraft: false,
      isLoadingDraft: false,
      isDraftSaved: false,

      exerciseIllustrations: {},

      // Anti-duplicate generation state
      generationState: {
        hasTriggered: false,
        timestamp: null,
        sessionId: null
      },

      loadingState: 'idle',
      loadingMessage: '',
      error: null,

      steps: TRAINING_PIPELINE_STEPS,

      setCurrentStep: async (step: TrainingPipelineStepId) => {
        const { currentSessionId, userId } = get();
        const stepData = TRAINING_PIPELINE_STEPS.find(s => s.id === step);

        set({
          currentStep: step,
          progress: stepData?.startProgress || 0
        });

        logger.debug('TRAINING_PIPELINE', 'Step changed', {
          newStep: step,
          progress: stepData?.startProgress,
          timestamp: new Date().toISOString()
        });

        // Update step in database
        if (currentSessionId && userId) {
          try {
            await sessionStateManager.upsertSessionState(currentSessionId, userId, step);
            logger.debug('TRAINING_PIPELINE', 'Step updated in database', {
              sessionId: currentSessionId,
              step
            });
          } catch (error) {
            logger.error('TRAINING_PIPELINE', 'Failed to update step in database', {
              error: error instanceof Error ? error.message : 'Unknown',
              sessionId: currentSessionId,
              step
            });
          }
        }
      },

      setProgress: (progress: number) => {
        set({ progress: Math.min(100, Math.max(0, progress)) });
      },

      initializeUser: async () => {
        try {
          logger.info('TRAINING_PIPELINE', 'Initializing user');
          const { data: { user }, error } = await supabase.auth.getUser();

          if (error) {
            logger.error('TRAINING_PIPELINE', 'Failed to get user', { error: error.message });
            set({ error: 'Erreur d\'authentification' });
            return;
          }

          if (user) {
            set({ userId: user.id });
            logger.info('TRAINING_PIPELINE', 'User initialized', { userId: user.id });
          } else {
            logger.error('TRAINING_PIPELINE', 'No user found in session');
            set({ error: 'Aucun utilisateur connecté' });
          }
        } catch (error) {
          logger.error('TRAINING_PIPELINE', 'Exception initializing user', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          set({ error: 'Erreur lors de la récupération de l\'utilisateur' });
        }
      },

      startPipeline: () => {
        const sessionId = crypto.randomUUID();

        set({
          isActive: true,
          currentStep: 'preparer',
          progress: 0,
          currentSessionId: sessionId,
          preparerData: null,
          sessionPrescription: null,
          sessionFeedback: null,
          sessionAnalysisResult: null,
          adaptations: [],
          nextAction: null,
          error: null
        });

        logger.info('TRAINING_PIPELINE', 'Pipeline started', {
          sessionId,
          timestamp: new Date().toISOString()
        });

        get().initializeUser();
      },

      resetPipeline: () => {
        set({
          isActive: false,
          currentStep: 'preparer',
          progress: 0,
          userId: null,
          preparerData: null,
          sessionPrescription: null,
          sessionFeedback: null,
          sessionAnalysisResult: null,
          adaptations: [],
          nextAction: null,
          currentSessionId: null,
          error: null,
          loadingState: 'idle',
          loadingMessage: '',
          exerciseIllustrations: {},
          isDraftSaved: false
        });

        logger.info('TRAINING_PIPELINE', 'Pipeline reset', {
          timestamp: new Date().toISOString()
        });
      },

      cancelPipeline: () => {
        const { currentSessionId } = get();

        set({
          isActive: false,
          loadingState: 'idle',
          loadingMessage: '',
          error: null
        });

        logger.info('TRAINING_PIPELINE', 'Pipeline cancelled', {
          sessionId: currentSessionId,
          timestamp: new Date().toISOString()
        });
      },

      cleanupAndReturn: async () => {
        const { currentSessionId, userId, sessionPrescription } = get();

        logger.info('TRAINING_PIPELINE', 'cleanupAndReturn triggered', {
          sessionId: currentSessionId,
          userId,
          hasPrescription: !!sessionPrescription,
          timestamp: new Date().toISOString()
        });

        set({
          isActive: false,
          currentStep: 'preparer',
          progress: 0,
          preparerData: null,
          sessionPrescription: null,
          sessionFeedback: null,
          sessionAnalysisResult: null,
          adaptations: [],
          nextAction: null,
          currentSessionId: null,
          error: null,
          loadingState: 'idle',
          loadingMessage: '',
          exerciseIllustrations: {},
          generationHistory: [],
          isDraftSaved: false
        });

        logger.info('TRAINING_PIPELINE', 'Cleanup completed - ready for new session', {
          timestamp: new Date().toISOString()
        });
      },

      emergencyExit: async (saveSessionData = false) => {
        const {
          currentSessionId,
          userId,
          sessionPrescription,
          sessionFeedback,
          currentStep
        } = get();

        logger.info('TRAINING_PIPELINE', 'Emergency exit triggered', {
          sessionId: currentSessionId,
          currentStep,
          saveSessionData,
          timestamp: new Date().toISOString()
        });

        if (saveSessionData && userId && currentSessionId && sessionPrescription) {
          try {
            const sessionData: any = {
              id: currentSessionId,
              user_id: userId,
              status: 'abandoned',
              type: sessionPrescription.type,
              session_type: sessionPrescription.type,
              coach_type: sessionPrescription.discipline === 'cardio' || sessionPrescription.discipline === 'running' || sessionPrescription.discipline === 'cycling' ? 'endurance' : 'force',
              prescription: sessionPrescription,
              context: get().preparerData,
              duration_target_min: sessionPrescription.durationTarget || 45,
              equipment_needed: get().preparerData?.availableEquipment || [],
              venue: get().preparerData?.locationName || null,
              abandoned_at: new Date().toISOString(),
              abandoned_at_step: currentStep,
              created_at: new Date().toISOString()
            };

            if (sessionFeedback) {
              sessionData.feedback = sessionFeedback;
              sessionData.feedback_submitted_at = new Date().toISOString();
            }

            const { error } = await supabase
              .from('training_sessions')
              .insert(sessionData);

            if (error) {
              logger.error('TRAINING_PIPELINE', 'Failed to save abandoned session data', {
                error: error.message,
                sessionId: currentSessionId
              });
            } else {
              logger.info('TRAINING_PIPELINE', 'Abandoned session data saved successfully', {
                sessionId: currentSessionId,
                step: currentStep
              });
            }
          } catch (error) {
            logger.error('TRAINING_PIPELINE', 'Exception saving abandoned session', {
              error: error instanceof Error ? error.message : 'Unknown error',
              sessionId: currentSessionId
            });
          }
        }

        set({
          isActive: false,
          currentStep: 'preparer',
          progress: 0,
          userId: null,
          preparerData: null,
          sessionPrescription: null,
          sessionFeedback: null,
          sessionAnalysisResult: null,
          adaptations: [],
          nextAction: null,
          currentSessionId: null,
          error: null,
          loadingState: 'idle',
          loadingMessage: '',
          exerciseIllustrations: {},
          isDraftSaved: false
        });

        logger.info('TRAINING_PIPELINE', 'Emergency exit completed - pipeline reset', {
          timestamp: new Date().toISOString()
        });
      },

      setPreparerData: (data) => {
        set({ preparerData: data });

        logger.debug('TRAINING_PIPELINE', 'Preparer data set', {
          hasData: !!data,
          location: data?.location,
          energyLevel: data?.energyLevel,
          timestamp: new Date().toISOString()
        });
      },

      setSessionPrescription: async (prescription) => {
        const { currentSessionId } = get();

        set({ sessionPrescription: prescription });

        const workoutItemsCount = prescription?.exercises?.length || prescription?.mainWorkout?.length || 0;

        logger.debug('TRAINING_PIPELINE', 'Session prescription set', {
          sessionId: prescription?.sessionId,
          type: prescription?.type,
          category: prescription?.category,
          discipline: prescription?.discipline,
          exercisesCount: prescription?.exercises?.length,
          mainWorkoutCount: prescription?.mainWorkout?.length,
          workoutItemsCount,
          timestamp: new Date().toISOString()
        });

        // Mark generation as completed in database
        if (currentSessionId) {
          try {
            await sessionStateManager.markGenerationCompleted(currentSessionId);
            logger.info('TRAINING_PIPELINE', 'Generation marked as completed in database', {
              sessionId: currentSessionId
            });
          } catch (error) {
            logger.error('TRAINING_PIPELINE', 'Failed to mark generation as completed', {
              error: error instanceof Error ? error.message : 'Unknown',
              sessionId: currentSessionId
            });
          }
        }
      },

      updateExerciseLoad: (exerciseIndex: number, newLoad: number | number[]) => {
        const { sessionPrescription } = get();
        if (!sessionPrescription) return;

        // This function is only for force/powerbuilding (exercises array)
        // Endurance uses mainWorkout array which has different structure
        if (!sessionPrescription.exercises || !Array.isArray(sessionPrescription.exercises)) {
          logger.warn('TRAINING_PIPELINE', 'Cannot update exercise load - exercises array not found', {
            category: sessionPrescription.category,
            type: sessionPrescription.type,
            hasMainWorkout: !!sessionPrescription.mainWorkout
          });
          return;
        }

        const oldExercise = sessionPrescription.exercises[exerciseIndex];
        const oldLoad = oldExercise?.load;

        const updatedExercises = [...sessionPrescription.exercises];
        const exercise = { ...updatedExercises[exerciseIndex] };
        exercise.load = newLoad;
        updatedExercises[exerciseIndex] = exercise;

        const updatedPrescription = {
          ...sessionPrescription,
          exercises: updatedExercises
        };

        set({ sessionPrescription: updatedPrescription });

        logger.info('TRAINING_PIPELINE', 'Exercise load updated in store', {
          exerciseIndex,
          exerciseName: exercise.name,
          oldLoad,
          newLoad,
          isRamping: Array.isArray(newLoad),
          timestamp: new Date().toISOString()
        });
      },

      setSessionFeedback: (feedback) => {
        set({ sessionFeedback: feedback });

        logger.debug('TRAINING_PIPELINE', 'Session feedback set', {
          exercisesCount: feedback?.exercises?.length || 0,
          overallRpe: feedback?.overallRpe,
          hasFunctionalMetrics: !!(feedback as any)?.functionalMetrics,
          timestamp: new Date().toISOString()
        });
      },

      setSessionAnalysisResult: (analysis) => {
        set({ sessionAnalysisResult: analysis });

        logger.debug('TRAINING_PIPELINE', 'Session analysis result set', {
          hasAnalysis: !!analysis,
          timestamp: new Date().toISOString()
        });
      },

      setAdaptations: (adaptations) => {
        set({ adaptations });

        logger.debug('TRAINING_PIPELINE', 'Adaptations set', {
          count: adaptations.length,
          types: adaptations.map(a => a.type),
          timestamp: new Date().toISOString()
        });
      },

      toggleAdaptationAcceptance: (adaptationId) => {
        set((state) => ({
          adaptations: state.adaptations.map(a =>
            a.id === adaptationId ? { ...a, accepted: !a.accepted } : a
          )
        }));

        logger.debug('TRAINING_PIPELINE', 'Adaptation acceptance toggled', {
          adaptationId,
          timestamp: new Date().toISOString()
        });
      },

      setNextAction: (action) => {
        set({ nextAction: action });

        logger.debug('TRAINING_PIPELINE', 'Next action set', {
          type: action?.type,
          timestamp: new Date().toISOString()
        });
      },

      setExerciseIllustrations: (illustrations) => {
        set({ exerciseIllustrations: illustrations });

        logger.debug('TRAINING_PIPELINE', 'Exercise illustrations set', {
          count: Object.keys(illustrations).length,
          timestamp: new Date().toISOString()
        });
      },

      // Anti-duplicate generation methods
      markGenerationTriggered: async (sessionId: string) => {
        const { userId } = get();

        // Update local state immediately
        set({
          generationState: {
            hasTriggered: true,
            timestamp: Date.now(),
            sessionId
          }
        });

        logger.info('TRAINING_PIPELINE', 'Generation marked as triggered (local)', {
          sessionId,
          timestamp: new Date().toISOString()
        });

        // Persist to database for cross-session persistence
        if (userId) {
          try {
            await sessionStateManager.markGenerationTriggered(sessionId, userId);
            logger.info('TRAINING_PIPELINE', 'Generation marked as triggered (database)', {
              sessionId,
              userId
            });
          } catch (error) {
            logger.error('TRAINING_PIPELINE', 'Failed to mark generation in database', {
              error: error instanceof Error ? error.message : 'Unknown',
              sessionId,
              userId
            });
          }
        }
      },

      resetGenerationFlag: () => {
        set({
          generationState: {
            hasTriggered: false,
            timestamp: null,
            sessionId: null
          }
        });

        logger.info('TRAINING_PIPELINE', 'Generation flag reset');
      },

      canTriggerGeneration: async () => {
        const { generationState, currentSessionId, sessionPrescription } = get();

        // CRITICAL: If prescription already exists in store, block generation
        if (sessionPrescription) {
          logger.warn('TRAINING_PIPELINE', 'Cannot trigger - prescription already exists in store', {
            currentSessionId,
            prescriptionType: sessionPrescription.type
          });
          return false;
        }

        // If no sessionId, cannot check state
        if (!currentSessionId) {
          logger.warn('TRAINING_PIPELINE', 'Cannot trigger - no session ID');
          return false;
        }

        // Check local state first for fast rejection
        if (generationState.hasTriggered && generationState.sessionId === currentSessionId) {
          const elapsed = generationState.timestamp ? Date.now() - generationState.timestamp : Infinity;
          if (elapsed < 5000) {
            logger.warn('TRAINING_PIPELINE', 'Cannot trigger - local cooldown active', {
              elapsedMs: elapsed,
              cooldownMs: 5000
            });
            return false;
          }
        }

        // Check database state for persistent verification
        try {
          const result = await sessionStateManager.canTriggerGeneration(currentSessionId);

          if (!result.canTrigger) {
            logger.warn('TRAINING_PIPELINE', 'Cannot trigger - database check failed', {
              reason: result.reason,
              currentSessionId
            });
          }

          return result.canTrigger;
        } catch (error) {
          logger.error('TRAINING_PIPELINE', 'Error checking generation permission', {
            error: error instanceof Error ? error.message : 'Unknown',
            currentSessionId
          });
          // On error, use local state as fallback
          return !generationState.hasTriggered || generationState.sessionId !== currentSessionId;
        }
      },

      goToNextStep: () => {
        const { currentStep } = get();
        const currentIndex = TRAINING_PIPELINE_STEPS.findIndex(s => s.id === currentStep);

        if (currentIndex < TRAINING_PIPELINE_STEPS.length - 1) {
          const nextStep = TRAINING_PIPELINE_STEPS[currentIndex + 1];
          get().setCurrentStep(nextStep.id);

          logger.info('TRAINING_PIPELINE', 'Navigated to next step', {
            from: currentStep,
            to: nextStep.id,
            timestamp: new Date().toISOString()
          });
        }
      },

      goToPreviousStep: () => {
        const { currentStep } = get();
        const currentIndex = TRAINING_PIPELINE_STEPS.findIndex(s => s.id === currentStep);

        if (currentIndex > 0) {
          const previousStep = TRAINING_PIPELINE_STEPS[currentIndex - 1];

          // If going back to Step 1 (preparer), clean session data for fresh start
          if (previousStep.id === 'preparer') {
            logger.info('TRAINING_PIPELINE', 'Returning to Step 1 - cleaning session data', {
              from: currentStep,
              hadPrescription: !!get().sessionPrescription,
              historyLength: get().generationHistory.length
            });

            set({
              sessionPrescription: null,
              generationHistory: [],
              currentSessionId: crypto.randomUUID(),
              sessionFeedback: null,
              sessionAnalysisResult: null,
              adaptations: [],
              error: null,
              loadingState: 'idle',
              loadingMessage: '',
              exerciseIllustrations: {},
              isDraftSaved: false,
              generationState: {
                hasTriggered: false,
                timestamp: null,
                sessionId: null
              }
            });
          }

          // IMPORTANT: When going back from Step 3 to Step 2, preserve prescription
          // This allows user to review/edit their training without regenerating
          if (currentStep === 'seance' && previousStep.id === 'activer') {
            logger.info('TRAINING_PIPELINE', 'Going back to Step 2 from Step 3 - preserving prescription', {
              from: currentStep,
              to: previousStep.id,
              hasPrescription: !!get().sessionPrescription
            });
            // Don't clear prescription - just navigate
          }

          get().setCurrentStep(previousStep.id);

          logger.info('TRAINING_PIPELINE', 'Navigated to previous step', {
            from: currentStep,
            to: previousStep.id,
            cleanedData: previousStep.id === 'preparer',
            preservedPrescription: currentStep === 'seance' && previousStep.id === 'activer',
            timestamp: new Date().toISOString()
          });
        }
      },

      goToStep: (step: TrainingPipelineStepId) => {
        const { currentStep } = get();

        // CRITICAL: If navigating to Step 1 (preparer), clean all session data for fresh start
        if (step === 'preparer') {
          logger.info('TRAINING_PIPELINE', 'Navigating to Step 1 - cleaning all session data', {
            from: currentStep,
            hadPrescription: !!get().sessionPrescription,
            hadPreparerData: !!get().preparerData,
            historyLength: get().generationHistory.length
          });

          // Generate new session ID for fresh start
          const newSessionId = crypto.randomUUID();

          set({
            sessionPrescription: null,
            generationHistory: [],
            currentSessionId: newSessionId,
            sessionFeedback: null,
            sessionAnalysisResult: null,
            adaptations: [],
            error: null,
            loadingState: 'idle',
            loadingMessage: '',
            exerciseIllustrations: {},
            isDraftSaved: false,
            preparerData: null, // CRITICAL: Reset preparerData to show all Step 1 inputs
            savedDraft: null,
            generationState: {
              hasTriggered: false,
              timestamp: null,
              sessionId: null
            }
          });

          logger.info('TRAINING_PIPELINE', 'Step 1 state cleaned - fresh session ready', {
            newSessionId,
            timestamp: new Date().toISOString()
          });
        }

        get().setCurrentStep(step);

        logger.info('TRAINING_PIPELINE', 'Navigated to specific step', {
          from: currentStep,
          to: step,
          cleanedData: step === 'preparer',
          timestamp: new Date().toISOString()
        });
      },

      setLoadingState: (state, message = '') => {
        set({ loadingState: state, loadingMessage: message });

        logger.debug('TRAINING_PIPELINE', 'Loading state changed', {
          state,
          message,
          timestamp: new Date().toISOString()
        });
      },

      setError: (error) => {
        set({ error, loadingState: 'idle' });

        if (error) {
          logger.error('TRAINING_PIPELINE', 'Error occurred', {
            error,
            timestamp: new Date().toISOString()
          });
        }
      },

      addToGenerationHistory: (prescription) => {
        const { generationHistory, currentSessionId } = get();
        const newItem = {
          sessionId: currentSessionId || crypto.randomUUID(),
          prescription,
          generatedAt: new Date().toISOString(),
          cacheKey: prescription.cacheKey
        };

        set({ generationHistory: [...generationHistory, newItem] });

        logger.info('TRAINING_PIPELINE', 'Prescription added to history', {
          sessionId: newItem.sessionId,
          historyLength: generationHistory.length + 1
        });
      },

      clearGenerationHistory: () => {
        set({ generationHistory: [] });
        logger.info('TRAINING_PIPELINE', 'Generation history cleared');
      },

      saveDraft: async (customName) => {
        const { userId, sessionPrescription, preparerData, currentSessionId } = get();

        if (!userId || !sessionPrescription || !preparerData) {
          logger.error('TRAINING_PIPELINE', 'Cannot save draft - missing required data', {
            hasUserId: !!userId,
            hasPrescription: !!sessionPrescription,
            hasPreparerData: !!preparerData
          });
          return false;
        }

        set({ isSavingDraft: true });

        try {
          const draftId = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 48);

          // Prepare session data for insertion
          const sessionData = {
            id: draftId,
            user_id: userId,
            plan_id: null, // Drafts are standalone, no plan association
            session_index: null, // Not applicable for drafts
            week_number: null, // Not applicable for drafts
            type: sessionPrescription.type,
            status: 'draft',
            coach_type: 'force', // Default coach type
            session_type: sessionPrescription.type,
            context: preparerData, // Store complete preparer context
            duration_target_min: sessionPrescription.durationTarget || 45,
            equipment_needed: preparerData.availableEquipment || [],
            venue: preparerData.locationName || null,
            prescription: sessionPrescription, // Full prescription
            custom_name: customName || null,
            draft_expires_at: expiresAt.toISOString(),
            draft_saved_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          };

          logger.debug('TRAINING_PIPELINE', 'Attempting to save draft', {
            draftId,
            sessionType: sessionData.session_type,
            hasCustomName: !!customName
          });

          const { error } = await supabase
            .from('training_sessions')
            .insert(sessionData);

          if (error) {
            logger.error('TRAINING_PIPELINE', 'Supabase error saving draft', {
              error: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint
            });
            throw error;
          }

          const savedDraft = {
            id: draftId,
            userId,
            prescription: sessionPrescription,
            preparerContext: preparerData,
            savedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            customName
          };

          set({ savedDraft, isSavingDraft: false, isDraftSaved: true });

          logger.info('TRAINING_PIPELINE', 'Draft saved successfully', {
            draftId,
            customName,
            sessionType: sessionPrescription.type,
            expiresAt: expiresAt.toISOString()
          });

          return true;
        } catch (error) {
          logger.error('TRAINING_PIPELINE', 'Failed to save draft', {
            error: error instanceof Error ? error.message : 'Unknown error',
            errorDetails: error
          });
          set({ isSavingDraft: false });
          return false;
        }
      },

      loadDraft: async (draftId) => {
        const { userId } = get();

        if (!userId) {
          logger.error('TRAINING_PIPELINE', 'Cannot load draft - no user');
          return false;
        }

        set({ isLoadingDraft: true });

        try {
          const { data, error } = await supabase
            .from('training_sessions')
            .select('*')
            .eq('id', draftId)
            .eq('user_id', userId)
            .eq('status', 'draft')
            .maybeSingle();

          if (error) throw error;
          if (!data) {
            logger.warn('TRAINING_PIPELINE', 'Draft not found', { draftId });
            set({ isLoadingDraft: false });
            return false;
          }

          set({
            sessionPrescription: data.prescription,
            preparerData: data.context,
            currentSessionId: draftId,
            savedDraft: {
              id: data.id,
              userId: data.user_id,
              prescription: data.prescription,
              preparerContext: data.context,
              savedAt: data.created_at,
              expiresAt: data.draft_expires_at,
              customName: data.custom_name
            },
            isLoadingDraft: false,
            isDraftSaved: true
          });

          logger.info('TRAINING_PIPELINE', 'Draft loaded successfully', { draftId });
          return true;
        } catch (error) {
          logger.error('TRAINING_PIPELINE', 'Failed to load draft', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          set({ isLoadingDraft: false });
          return false;
        }
      },

      deleteDraft: async () => {
        const { savedDraft, userId } = get();

        if (!savedDraft || !userId) {
          logger.warn('TRAINING_PIPELINE', 'No draft to delete');
          return false;
        }

        try {
          const { error } = await supabase
            .from('training_sessions')
            .delete()
            .eq('id', savedDraft.id)
            .eq('user_id', userId);

          if (error) throw error;

          set({ savedDraft: null, isDraftSaved: false });

          logger.info('TRAINING_PIPELINE', 'Draft deleted successfully', {
            draftId: savedDraft.id
          });

          return true;
        } catch (error) {
          logger.error('TRAINING_PIPELINE', 'Failed to delete draft', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return false;
        }
      },

      checkForExistingDraft: async () => {
        const { userId } = get();

        if (!userId) return null;

        try {
          const { data, error } = await supabase
            .from('training_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'draft')
            .gt('draft_expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) throw error;
          if (!data) return null;

          const draft = {
            id: data.id,
            userId: data.user_id,
            prescription: data.prescription,
            preparerContext: data.context,
            savedAt: data.created_at,
            expiresAt: data.draft_expires_at,
            customName: data.custom_name
          };

          set({ savedDraft: draft });

          logger.info('TRAINING_PIPELINE', 'Existing draft found', {
            draftId: draft.id
          });

          return draft;
        } catch (error) {
          logger.error('TRAINING_PIPELINE', 'Failed to check for draft', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return null;
        }
      },

      attemptPrescriptionRecovery: async (sessionId: string) => {
        const { userId } = get();

        if (!userId) {
          logger.warn('TRAINING_PIPELINE', 'Cannot recover prescription - no userId');
          return false;
        }

        try {
          logger.info('TRAINING_PIPELINE', 'Attempting prescription recovery', {
            sessionId,
            userId
          });

          const { data, error } = await supabase
            .from('training_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .maybeSingle();

          if (error) {
            logger.error('TRAINING_PIPELINE', 'Error querying for prescription', {
              error: error.message,
              sessionId
            });
            return false;
          }

          if (!data || !data.prescription) {
            logger.warn('TRAINING_PIPELINE', 'No prescription found in database', {
              sessionId,
              hasData: !!data
            });
            return false;
          }

          logger.info('TRAINING_PIPELINE', 'Prescription recovered from database', {
            sessionId,
            type: data.prescription.type,
            status: data.status
          });

          set({
            sessionPrescription: data.prescription,
            preparerData: data.context || get().preparerData,
            currentSessionId: sessionId,
            isDraftSaved: data.status === 'draft'
          });

          await sessionStateManager.markGenerationCompleted(sessionId);

          return true;
        } catch (error) {
          logger.error('TRAINING_PIPELINE', 'Exception during prescription recovery', {
            error: error instanceof Error ? error.message : 'Unknown',
            sessionId
          });
          return false;
        }
      },

      resetSessionStateForRegeneration: async (sessionId: string) => {
        const { userId } = get();

        if (!userId) {
          logger.warn('TRAINING_PIPELINE', 'Cannot reset session state - no userId');
          return false;
        }

        try {
          logger.info('TRAINING_PIPELINE', 'Resetting session state for regeneration', {
            sessionId,
            userId
          });

          // CRITICAL: Clean local store FIRST before database operation
          // This ensures UI updates immediately and Step 1 renders correctly
          set({
            sessionPrescription: null,
            sessionFeedback: null,
            sessionAnalysisResult: null,
            adaptations: [],
            exerciseIllustrations: {},
            error: null,
            loadingState: 'idle',
            loadingMessage: '',
            preparerData: null, // CRITICAL: Clear preparerData so Step 1 shows all inputs
            savedDraft: null,
            isDraftSaved: false,
            generationHistory: [],
            generationState: {
              hasTriggered: false,
              timestamp: null,
              sessionId: null
            }
          });

          logger.info('TRAINING_PIPELINE', 'Local state cleaned for fresh start');

          // Try RPC function first (preferred method)
          const { error: rpcError } = await supabase.rpc('reset_session_state_for_regeneration', {
            p_session_id: sessionId,
            p_user_id: userId
          });

          if (rpcError) {
            // Check if it's a 404 (function doesn't exist) - use fallback
            if (rpcError.message?.includes('PGRST202') || rpcError.message?.includes('not found')) {
              logger.warn('TRAINING_PIPELINE', 'RPC function not found, using fallback method', {
                error: rpcError.message,
                sessionId
              });

              // FALLBACK: Direct database deletion
              const { error: deleteError } = await supabase
                .from('training_session_states')
                .delete()
                .eq('session_id', sessionId)
                .eq('user_id', userId);

              if (deleteError) {
                logger.error('TRAINING_PIPELINE', 'Fallback delete failed', {
                  error: deleteError.message,
                  sessionId
                });
                return false;
              }

              logger.info('TRAINING_PIPELINE', 'Session state reset via fallback method', {
                sessionId
              });
            } else {
              // Other RPC error
              logger.error('TRAINING_PIPELINE', 'RPC error resetting session state', {
                error: rpcError.message,
                sessionId
              });
              return false;
            }
          } else {
            logger.info('TRAINING_PIPELINE', 'Session state reset via RPC', {
              sessionId
            });
          }

          logger.info('TRAINING_PIPELINE', 'Session state reset successfully', {
            sessionId,
            method: rpcError ? 'fallback' : 'rpc',
            localStateCleared: true
          });

          return true;
        } catch (error) {
          logger.error('TRAINING_PIPELINE', 'Exception resetting session state', {
            error: error instanceof Error ? error.message : 'Unknown',
            sessionId
          });
          return false;
        }
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        isActive: state.isActive,
        progress: state.progress,
        userId: state.userId,
        preparerData: state.preparerData,
        // DO NOT persist sessionPrescription - it should be regenerated each time
        // sessionPrescription: state.sessionPrescription,
        sessionAnalysisResult: state.sessionAnalysisResult,
        currentSessionId: state.currentSessionId,
        currentPlanId: state.currentPlanId,
        generationHistory: state.generationHistory,
        savedDraft: state.savedDraft
      })
    }
  )
);

export * from './types';
export * from './constants';

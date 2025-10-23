/**
 * useCoachMessageHandlers Hook
 * Centralizes all handlers for interactive coach messages in Step 2
 */

import { useCallback, useState } from 'react';
import { useGlobalChatStore } from '../system/store/globalChatStore';
import { useExerciseScroll } from './useExerciseScroll';
import type { ExerciseAdjustmentCategory } from '../config/exerciseAdjustmentConfig';
import type { ExtendedChatMessage } from '../domain/chatMessages';
import { EXERCISE_ADJUSTMENT_BUTTONS } from '../config/exerciseAdjustmentConfig';
import { Haptics } from '../utils/haptics';
import logger from '../lib/utils/logger';

interface Exercise {
  id: string;
  name: string;
  orderIndex?: number;
  sets?: number;
  reps?: number;
  load?: string;
  tempo?: string;
  rest?: string;
  rpe?: number;
}

interface UseCoachMessageHandlersProps {
  exercises: Exercise[];
  exerciseRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onExerciseUpdate?: (exerciseId: string, updates: Partial<Exercise>) => void;
}

interface ConversationState {
  selectedExerciseId: string | null;
  selectedExerciseName: string | null;
  selectedCategory: ExerciseAdjustmentCategory | null;
  selectedOptionId: string | null;
  adjustmentCount: number;
}

export function useCoachMessageHandlers({
  exercises,
  exerciseRefs,
  onExerciseUpdate
}: UseCoachMessageHandlersProps) {
  const { addMessage, setTyping } = useGlobalChatStore();
  const { highlightedCard, scrollToExercise } = useExerciseScroll();

  const [conversationState, setConversationState] = useState<ConversationState>({
    selectedExerciseId: null,
    selectedExerciseName: null,
    selectedCategory: null,
    selectedOptionId: null,
    adjustmentCount: 0
  });

  const MAX_ADJUSTMENTS = 5;

  const handleExerciseClick = useCallback((exerciseId: string, exerciseName: string) => {
    Haptics.impact('light');

    setConversationState(prev => ({
      ...prev,
      selectedExerciseId: exerciseId,
      selectedExerciseName: exerciseName,
      selectedCategory: null,
      selectedOptionId: null
    }));

    addMessage({
      role: 'user',
      type: 'text',
      content: `Je veux ajuster ${exerciseName}`
    });

    setTimeout(() => {
      setTyping(true);

      setTimeout(() => {
        setTyping(false);

        const categoryMessage: ExtendedChatMessage = {
          id: '',
          timestamp: new Date(),
          role: 'coach',
          type: 'category-selection',
          content: `Parfait ! Que veux-tu ajuster sur ${exerciseName} ?`,
          metadata: {
            exerciseId,
            exerciseName
          }
        };

        addMessage(categoryMessage);

        logger.debug('COACH_MESSAGE_HANDLERS', 'Category selection shown', {
          exerciseId,
          exerciseName
        });
      }, 800);
    }, 300);
  }, [addMessage, setTyping]);

  const handleCategorySelect = useCallback((category: ExerciseAdjustmentCategory) => {
    if (!conversationState.selectedExerciseId || !conversationState.selectedExerciseName) return;

    Haptics.impact('light');

    setConversationState(prev => ({
      ...prev,
      selectedCategory: category
    }));

    const categoryLabels: Record<ExerciseAdjustmentCategory, string> = {
      'volume': 'le volume',
      'intensity': 'l\'intensité',
      'rest': 'le temps de repos',
      'variant': 'la variante'
    };

    addMessage({
      role: 'user',
      type: 'text',
      content: `Je veux ajuster ${categoryLabels[category]}`
    });

    setTimeout(() => {
      setTyping(true);

      setTimeout(() => {
        setTyping(false);

        const optionMessage: ExtendedChatMessage = {
          id: '',
          timestamp: new Date(),
          role: 'coach',
          type: 'option-selection',
          content: `Comment veux-tu ajuster ${conversationState.selectedExerciseName} ?`,
          metadata: {
            exerciseId: conversationState.selectedExerciseId,
            exerciseName: conversationState.selectedExerciseName,
            category
          }
        };

        addMessage(optionMessage);

        logger.debug('COACH_MESSAGE_HANDLERS', 'Option selection shown', {
          category
        });
      }, 600);
    }, 300);
  }, [conversationState, addMessage, setTyping]);

  const handleOptionSelect = useCallback((optionId: string) => {
    if (!conversationState.selectedExerciseId || !conversationState.selectedExerciseName) return;

    const option = EXERCISE_ADJUSTMENT_BUTTONS.find(btn => btn.id === optionId);
    if (!option) return;

    Haptics.impact('light');

    setConversationState(prev => ({
      ...prev,
      selectedOptionId: optionId
    }));

    addMessage({
      role: 'user',
      type: 'text',
      content: option.label
    });

    const exercise = exercises.find(ex => ex.id === conversationState.selectedExerciseId);
    if (!exercise) return;

    let summary = '';
    let newParams: any = {};

    if (optionId.includes('increase-sets')) {
      newParams.sets = (exercise.sets || 3) + 1;
      summary = `${newParams.sets} séries (au lieu de ${exercise.sets || 3})`;
    } else if (optionId.includes('decrease-sets')) {
      newParams.sets = Math.max(1, (exercise.sets || 3) - 1);
      summary = `${newParams.sets} séries (au lieu de ${exercise.sets || 3})`;
    } else if (optionId.includes('increase-reps')) {
      newParams.reps = (exercise.reps || 10) + 2;
      summary = `${newParams.reps} reps par série (au lieu de ${exercise.reps || 10})`;
    } else if (optionId.includes('decrease-reps')) {
      newParams.reps = Math.max(1, (exercise.reps || 10) - 2);
      summary = `${newParams.reps} reps par série (au lieu de ${exercise.reps || 10})`;
    } else {
      summary = option.description;
    }

    setTimeout(() => {
      setTyping(true);

      setTimeout(() => {
        setTyping(false);

        const validationMessage: ExtendedChatMessage = {
          id: '',
          timestamp: new Date(),
          role: 'coach',
          type: 'validation',
          content: `Voici ce que je vais appliquer à ${conversationState.selectedExerciseName}`,
          metadata: {
            exerciseId: conversationState.selectedExerciseId,
            exerciseName: conversationState.selectedExerciseName,
            validationData: {
              exerciseName: conversationState.selectedExerciseName,
              adjustmentLabel: option.label,
              summary,
              currentValue: exercise,
              newValue: newParams
            }
          }
        };

        addMessage(validationMessage);

        logger.debug('COACH_MESSAGE_HANDLERS', 'Validation shown', {
          optionId,
          summary
        });
      }, 800);
    }, 300);
  }, [conversationState, exercises, addMessage, setTyping]);

  const handleValidate = useCallback(() => {
    if (!conversationState.selectedExerciseId || !conversationState.selectedExerciseName) return;

    Haptics.impact('medium');

    const exercise = exercises.find(ex => ex.id === conversationState.selectedExerciseId);
    if (!exercise) return;

    const option = EXERCISE_ADJUSTMENT_BUTTONS.find(btn => btn.id === conversationState.selectedOptionId);
    if (!option) return;

    let newParams: Partial<Exercise> = {};

    if (conversationState.selectedOptionId?.includes('increase-sets')) {
      newParams.sets = (exercise.sets || 3) + 1;
    } else if (conversationState.selectedOptionId?.includes('decrease-sets')) {
      newParams.sets = Math.max(1, (exercise.sets || 3) - 1);
    } else if (conversationState.selectedOptionId?.includes('increase-reps')) {
      newParams.reps = (exercise.reps || 10) + 2;
    } else if (conversationState.selectedOptionId?.includes('decrease-reps')) {
      newParams.reps = Math.max(1, (exercise.reps || 10) - 2);
    }

    if (onExerciseUpdate) {
      onExerciseUpdate(conversationState.selectedExerciseId, newParams);
    }

    addMessage({
      role: 'user',
      type: 'text',
      content: 'Valider'
    });

    setTimeout(() => {
      setTyping(true);

      setTimeout(() => {
        setTyping(false);

        const updateCompleteMessage: ExtendedChatMessage = {
          id: '',
          timestamp: new Date(),
          role: 'coach',
          type: 'update-complete',
          content: `Modification appliquée ! ${conversationState.selectedExerciseName} a été mis à jour.`,
          metadata: {
            exerciseId: conversationState.selectedExerciseId,
            exerciseName: conversationState.selectedExerciseName,
            updateCompleteData: {
              exerciseName: conversationState.selectedExerciseName,
              newParameters: newParams
            }
          }
        };

        addMessage(updateCompleteMessage);

        setConversationState(prev => ({
          selectedExerciseId: null,
          selectedExerciseName: null,
          selectedCategory: null,
          selectedOptionId: null,
          adjustmentCount: prev.adjustmentCount + 1
        }));

        logger.info('COACH_MESSAGE_HANDLERS', 'Exercise updated', {
          exerciseId: conversationState.selectedExerciseId,
          newParams,
          adjustmentCount: conversationState.adjustmentCount + 1
        });
      }, 1000);
    }, 300);
  }, [conversationState, exercises, addMessage, setTyping, onExerciseUpdate]);

  const handleModify = useCallback(() => {
    Haptics.impact('light');

    if (!conversationState.selectedExerciseId || !conversationState.selectedExerciseName) return;

    addMessage({
      role: 'user',
      type: 'text',
      content: 'Je veux modifier'
    });

    setTimeout(() => {
      setTyping(true);

      setTimeout(() => {
        setTyping(false);

        const categoryMessage: ExtendedChatMessage = {
          id: '',
          timestamp: new Date(),
          role: 'coach',
          type: 'category-selection',
          content: `Pas de souci ! Que veux-tu ajuster sur ${conversationState.selectedExerciseName} ?`,
          metadata: {
            exerciseId: conversationState.selectedExerciseId,
            exerciseName: conversationState.selectedExerciseName
          }
        };

        addMessage(categoryMessage);

        setConversationState(prev => ({
          ...prev,
          selectedCategory: null,
          selectedOptionId: null
        }));
      }, 600);
    }, 300);
  }, [conversationState, addMessage, setTyping]);

  const handleViewExercise = useCallback(() => {
    if (!conversationState.selectedExerciseId) return;

    Haptics.impact('light');
    scrollToExercise(conversationState.selectedExerciseId, exerciseRefs);

    logger.debug('COACH_MESSAGE_HANDLERS', 'Scrolled to exercise', {
      exerciseId: conversationState.selectedExerciseId
    });
  }, [conversationState.selectedExerciseId, exerciseRefs, scrollToExercise]);

  const handleContinue = useCallback(() => {
    Haptics.impact('light');

    if (conversationState.adjustmentCount >= MAX_ADJUSTMENTS) {
      addMessage({
        role: 'coach',
        type: 'text',
        content: 'Tu as fait plusieurs ajustements ! Je pense qu\'on est prêts. Tu veux valider le programme ou faire un dernier ajustement ?'
      });
      return;
    }

    const exerciseListMessage: ExtendedChatMessage = {
      id: '',
      timestamp: new Date(),
      role: 'coach',
      type: 'exercise-list-intro',
      content: 'Super ! Quel autre exercice veux-tu ajuster ?',
      metadata: {
        exerciseListData: {
          exercises: exercises.map((ex, idx) => ({
            id: ex.id,
            name: ex.name,
            orderIndex: ex.orderIndex || idx + 1
          })),
          programType: 'Séance du jour',
          introText: 'Clique sur un exercice pour l\'ajuster :'
        }
      }
    };

    addMessage(exerciseListMessage);

    setConversationState(prev => ({
      ...prev,
      selectedExerciseId: null,
      selectedExerciseName: null,
      selectedCategory: null,
      selectedOptionId: null
    }));
  }, [conversationState.adjustmentCount, exercises, addMessage]);

  const handleBack = useCallback(() => {
    Haptics.impact('light');

    if (!conversationState.selectedExerciseId || !conversationState.selectedExerciseName) return;

    const categoryMessage: ExtendedChatMessage = {
      id: '',
      timestamp: new Date(),
      role: 'coach',
      type: 'category-selection',
      content: `Que veux-tu ajuster sur ${conversationState.selectedExerciseName} ?`,
      metadata: {
        exerciseId: conversationState.selectedExerciseId,
        exerciseName: conversationState.selectedExerciseName
      }
    };

    addMessage(categoryMessage);

    setConversationState(prev => ({
      ...prev,
      selectedCategory: null,
      selectedOptionId: null
    }));
  }, [conversationState, addMessage]);

  return {
    handlers: {
      onExerciseClick: handleExerciseClick,
      onCategorySelect: handleCategorySelect,
      onOptionSelect: handleOptionSelect,
      onValidate: handleValidate,
      onModify: handleModify,
      onViewExercise: handleViewExercise,
      onContinue: handleContinue,
      onBack: handleBack
    },
    conversationState,
    highlightedCard,
    canMakeMoreAdjustments: conversationState.adjustmentCount < MAX_ADJUSTMENTS,
    adjustmentCount: conversationState.adjustmentCount
  };
}

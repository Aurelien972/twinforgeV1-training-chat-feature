/**
 * useTrainingChatContext Hook
 * Provides training-specific context for the chat AI
 */

import { useLocation } from 'react-router-dom';
import { useTrainingPipeline } from '../system/store/trainingPipeline';
import logger from '../lib/utils/logger';
import type { Exercise } from '../system/store/trainingPipeline/types';

export interface Step3Context {
  currentExerciseIndex?: number;
  totalExercises?: number;
  currentExercise?: Exercise;
  nextExercise?: Exercise | null;
  currentSet?: number;
  sessionTime?: number;
  restTime?: number;
  isResting?: boolean;
  lastRPE?: number;
}

export interface TrainingChatContext {
  isInTrainingMode: boolean;
  currentStep?: string;
  stepData?: any;
  contextPrompt: string;
  step3Context?: Step3Context;
}

export function useTrainingChatContext(): TrainingChatContext {
  const location = useLocation();
  const { currentStep, steps, progress, prescription } = useTrainingPipeline();

  const isInTrainingMode = location.pathname.startsWith('/training') || location.pathname.includes('/pipeline');

  if (!isInTrainingMode) {
    return {
      isInTrainingMode: false,
      contextPrompt: ''
    };
  }

  const stepConfig = steps.find(s => s.id === currentStep);
  const stepName = stepConfig?.title || 'Training';
  const stepNumber = steps.findIndex(s => s.id === currentStep) + 1;
  const totalSteps = steps.length;

  const contextParts: string[] = [];

  contextParts.push(`L'utilisateur est actuellement dans la phase "${stepName}" (étape ${stepNumber}/${totalSteps}) du pipeline de génération d'entraînement.`);

  if (prescription) {
    contextParts.push(`Un programme d'entraînement a été généré avec les caractéristiques suivantes:`);

    if (prescription.summary) {
      contextParts.push(`- Résumé: ${prescription.summary}`);
    }

    if (prescription.exercises && prescription.exercises.length > 0) {
      contextParts.push(`- Nombre d'exercices: ${prescription.exercises.length}`);
      const exerciseNames = prescription.exercises.slice(0, 5).map(e => e.name).join(', ');
      contextParts.push(`- Exercices principaux: ${exerciseNames}${prescription.exercises.length > 5 ? '...' : ''}`);
    }

    if (prescription.estimatedDuration) {
      contextParts.push(`- Durée estimée: ${prescription.estimatedDuration}`);
    }
  }

  switch (currentStep) {
    case 'preparer':
      contextParts.push(`Dans cette phase, l'utilisateur prépare sa séance et peut avoir besoin de conseils sur l'échauffement, la préparation mentale, ou l'organisation de son espace d'entraînement.`);
      break;

    case 'activer':
      contextParts.push(`Dans cette phase, l'utilisateur est en train de s'échauffer. Donne des conseils sur l'activation musculaire, la mobilité et la préparation physique.`);
      break;

    case 'seance':
      contextParts.push(`L'utilisateur est en pleine séance d'entraînement. Sois motivant, donne des conseils techniques sur les exercices, et adapte selon ses retours.`);
      break;

    case 'adapter':
      contextParts.push(`L'utilisateur évalue sa séance et peut vouloir ajuster le programme. Aide-le à adapter les exercices, les charges, ou la difficulté.`);
      break;

    case 'avancer':
      contextParts.push(`L'utilisateur termine sa séance. Félicite-le, donne des conseils de récupération, et aide-le à planifier la prochaine séance.`);
      break;
  }

  contextParts.push(`Reste concis, encourageant et axé sur l'action. Adapte tes réponses au contexte de cette étape spécifique.`);

  const contextPrompt = contextParts.join('\n');

  logger.debug('TRAINING_CHAT_CONTEXT', 'Context generated', {
    step: currentStep,
    hasPrescription: !!prescription,
    promptLength: contextPrompt.length
  });

  return {
    isInTrainingMode: true,
    currentStep,
    stepData: {
      stepNumber,
      totalSteps,
      stepConfig,
      progress,
      prescription
    },
    contextPrompt
  };
}

export function useStep3ChatContext(step3Context?: Step3Context): string {
  if (!step3Context) return '';

  const contextParts: string[] = [];

  if (step3Context.currentExercise) {
    const { currentExercise, currentSet, totalExercises, currentExerciseIndex } = step3Context;

    contextParts.push(`\n=== CONTEXTE STEP 3 - SÉANCE EN COURS ===`);
    contextParts.push(`Exercice actuel: ${currentExercise.name}${currentExercise.variant ? ` (${currentExercise.variant})` : ''}`);
    contextParts.push(`Progression: Exercice ${(currentExerciseIndex || 0) + 1}/${totalExercises || 0}`);
    contextParts.push(`Série: ${currentSet || 1}/${currentExercise.sets}`);
    contextParts.push(`Charge: ${currentExercise.load ? `${currentExercise.load}kg` : 'Poids de corps'}`);
    contextParts.push(`Répétitions: ${currentExercise.reps}`);
    contextParts.push(`Repos: ${currentExercise.rest}s entre les séries`);

    if (currentExercise.intensificationTechnique && currentExercise.intensificationTechnique !== 'none') {
      contextParts.push(`Technique d'intensification: ${currentExercise.intensificationTechnique}`);
    }

    if (currentExercise.coachTips && currentExercise.coachTips.length > 0) {
      contextParts.push(`Conseils coach: ${currentExercise.coachTips.join(', ')}`);
    }
  }

  if (step3Context.nextExercise) {
    contextParts.push(`\nProchain exercice: ${step3Context.nextExercise.name}`);
  }

  if (step3Context.isResting && step3Context.restTime) {
    contextParts.push(`\nActuellement en repos: ${step3Context.restTime}s restantes`);
  }

  if (step3Context.lastRPE) {
    contextParts.push(`Dernier RPE (difficulté perçue): ${step3Context.lastRPE}/10`);
  }

  if (step3Context.sessionTime) {
    const minutes = Math.floor(step3Context.sessionTime / 60);
    const seconds = step3Context.sessionTime % 60;
    contextParts.push(`Temps de séance: ${minutes}min ${seconds}s`);
  }

  contextParts.push(`\n=== INSTRUCTIONS COACHING ===`);
  contextParts.push(`Tu es en mode coaching actif pendant la séance. Tes messages doivent être:`);
  contextParts.push(`- ULTRA COURTS: 5-15 mots maximum`);
  contextParts.push(`- MOTIVANTS: encourage, booste, félicite`);
  contextParts.push(`- TECHNIQUES: conseils précis sur l'exercice en cours`);
  contextParts.push(`- ADAPTÉS: utilise le contexte (RPE, série, exercice) pour personnaliser`);
  contextParts.push(`- ÉNERGIQUES: utilise des émojis appropriés (💪🔥🎯👍⚡)`);

  return contextParts.join('\n');
}

/**
 * Progression Suggestion Service
 * Provides automatic progression recommendations for all training disciplines
 */

import { supabase } from '../supabase/client';
import { differenceInDays } from 'date-fns';

interface ExerciseHistory {
  exercise_name: string;
  load_used?: number | number[];
  reps_actual?: number[];
  sets_completed?: number;
  rpe?: number;
  completed: boolean;
  performed_at: string;
  discipline: string;
}

interface ProgressionContext {
  exerciseName: string;
  discipline: string;
  currentLoad?: number | number[];
  currentReps?: number | number[];
  currentSets?: number;
  targetRpe?: number;
  userExperience?: string;
  recentFocus?: string[];
}

export interface ProgressionSuggestion {
  shouldProgress: boolean;
  progressionType: 'load' | 'reps' | 'sets' | 'intensity' | 'skill' | 'pace' | 'maintain';
  suggestionReason: string;
  newLoad?: number | number[];
  newReps?: number | number[];
  newSets?: number;
  newIntensity?: string;
  confidenceScore: number;
  warnings?: string[];
}

/**
 * Analyzes exercise history and suggests progression
 */
export async function analyzeExerciseProgression(
  userId: string,
  context: ProgressionContext
): Promise<ProgressionSuggestion> {
  const lookbackDays = 14;
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  const normalizedExerciseName = context.exerciseName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const { data: sessions, error } = await supabase
    .from('training_sessions')
    .select('id, created_at, discipline')
    .eq('user_id', userId)
    .eq('discipline', context.discipline)
    .gte('created_at', lookbackDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !sessions || sessions.length === 0) {
    return getDefaultProgression(context);
  }

  const exerciseHistory: ExerciseHistory[] = [];
  sessions.forEach(session => {
    const feedback = session.feedback;
    if (feedback?.exercises) {
      feedback.exercises.forEach((ex: any) => {
        const exName = ex.exerciseName || ex.name || '';
        const normalizedName = exName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();

        if (normalizedName.includes(normalizedExerciseName) ||
            normalizedExerciseName.includes(normalizedName)) {
          exerciseHistory.push({
            exercise_name: exName,
            load_used: ex.loadUsed || ex.load,
            reps_actual: ex.repsActual || ex.reps,
            sets_completed: ex.setsCompleted || ex.sets,
            rpe: ex.rpe,
            completed: ex.completed !== false,
            performed_at: session.created_at,
            discipline: session.discipline
          });
        }
      });
    }
  });

  if (exerciseHistory.length === 0) {
    return getDefaultProgression(context);
  }

  return generateProgressionSuggestion(exerciseHistory, context);
}

/**
 * Generates progression suggestion based on history
 */
function generateProgressionSuggestion(
  history: ExerciseHistory[],
  context: ProgressionContext
): ProgressionSuggestion {
  const recentPerformances = history.slice(0, 3);
  const allCompleted = recentPerformances.every(p => p.completed);
  const avgRpe = calculateAverageRpe(recentPerformances);
  const lastPerformance = recentPerformances[0];
  const daysSinceLastPerformance = differenceInDays(
    new Date(),
    new Date(lastPerformance.performed_at)
  );

  if (context.discipline === 'Force' || context.discipline === 'Calisthenics') {
    return generateForceProgression(recentPerformances, context, avgRpe, daysSinceLastPerformance);
  }

  if (context.discipline === 'Endurance') {
    return generateEnduranceProgression(recentPerformances, context, avgRpe);
  }

  if (context.discipline === 'Functional') {
    return generateFunctionalProgression(recentPerformances, context, avgRpe);
  }

  if (context.discipline === 'Competitions') {
    return generateCompetitionsProgression(recentPerformances, context, avgRpe);
  }

  return getDefaultProgression(context);
}

/**
 * Generates Force/Calisthenics progression
 */
function generateForceProgression(
  performances: ExerciseHistory[],
  context: ProgressionContext,
  avgRpe: number,
  daysSince: number
): ProgressionSuggestion {
  const lastPerf = performances[0];
  const allCompleted = performances.every(p => p.completed);
  const consistentLoad = performances.every(p =>
    JSON.stringify(p.load_used) === JSON.stringify(lastPerf.load_used)
  );

  if (!allCompleted) {
    return {
      shouldProgress: false,
      progressionType: 'maintain',
      suggestionReason: 'Toutes les sessions récentes n\'ont pas été complétées, maintenir le niveau actuel',
      confidenceScore: 0.8,
      warnings: ['Assurer la complétion avant de progresser']
    };
  }

  if (avgRpe < 6.5) {
    const currentLoad = Array.isArray(lastPerf.load_used)
      ? lastPerf.load_used
      : (lastPerf.load_used || context.currentLoad);

    const newLoad = Array.isArray(currentLoad)
      ? currentLoad.map(l => Math.round(l * 1.05))
      : (typeof currentLoad === 'number' ? Math.round(currentLoad * 1.05) : undefined);

    return {
      shouldProgress: true,
      progressionType: 'load',
      suggestionReason: `RPE moyen faible (${avgRpe.toFixed(1)}), augmentation de charge recommandée`,
      newLoad,
      confidenceScore: 0.9,
      warnings: avgRpe < 5 ? ['RPE très faible, envisager une augmentation plus importante'] : undefined
    };
  }

  if (avgRpe >= 6.5 && avgRpe <= 8 && consistentLoad && performances.length >= 2) {
    const currentLoad = Array.isArray(lastPerf.load_used)
      ? lastPerf.load_used
      : (lastPerf.load_used || context.currentLoad);

    const newLoad = Array.isArray(currentLoad)
      ? currentLoad.map(l => Math.round(l * 1.025))
      : (typeof currentLoad === 'number' ? Math.round(currentLoad * 1.025) : undefined);

    return {
      shouldProgress: true,
      progressionType: 'load',
      suggestionReason: `Performance stable sur ${performances.length} sessions, progression progressive recommandée`,
      newLoad,
      confidenceScore: 0.85,
      warnings: avgRpe > 7.5 ? ['RPE élevé, surveiller la récupération'] : undefined
    };
  }

  if (avgRpe > 8) {
    return {
      shouldProgress: false,
      progressionType: 'maintain',
      suggestionReason: `RPE élevé (${avgRpe.toFixed(1)}), maintenir pour consolider avant de progresser`,
      confidenceScore: 0.9,
      warnings: ['Privilégier la récupération et la consolidation technique']
    };
  }

  return {
    shouldProgress: false,
    progressionType: 'maintain',
    suggestionReason: 'Maintenir le niveau actuel pour consolider les acquis',
    confidenceScore: 0.7
  };
}

/**
 * Generates Endurance progression
 */
function generateEnduranceProgression(
  performances: ExerciseHistory[],
  context: ProgressionContext,
  avgRpe: number
): ProgressionSuggestion {
  const allCompleted = performances.every(p => p.completed);

  if (!allCompleted) {
    return {
      shouldProgress: false,
      progressionType: 'maintain',
      suggestionReason: 'Complétion incomplète, maintenir le volume actuel',
      confidenceScore: 0.8
    };
  }

  if (avgRpe < 6) {
    return {
      shouldProgress: true,
      progressionType: 'pace',
      suggestionReason: `RPE faible (${avgRpe.toFixed(1)}), augmentation du rythme possible`,
      newIntensity: 'Augmenter de 5-10% le rythme ou réduire les temps de repos',
      confidenceScore: 0.85,
      warnings: ['Progression graduelle sur 2-3 semaines']
    };
  }

  if (avgRpe >= 6 && avgRpe <= 7.5 && performances.length >= 2) {
    return {
      shouldProgress: true,
      progressionType: 'intensity',
      suggestionReason: 'Performance stable, progression d\'intensité recommandée',
      newIntensity: 'Augmenter la durée de 10% ou intensifier les intervalles',
      confidenceScore: 0.8,
      warnings: ['Maintenir les séances faciles faciles (zone 2)']
    };
  }

  if (avgRpe > 7.5) {
    return {
      shouldProgress: false,
      progressionType: 'maintain',
      suggestionReason: `RPE élevé (${avgRpe.toFixed(1)}), consolider avant progression`,
      confidenceScore: 0.9,
      warnings: ['Alterner séances faciles et intenses']
    };
  }

  return {
    shouldProgress: false,
    progressionType: 'maintain',
    suggestionReason: 'Maintenir pour adapter l\'organisme',
    confidenceScore: 0.7
  };
}

/**
 * Generates Functional progression
 */
function generateFunctionalProgression(
  performances: ExerciseHistory[],
  context: ProgressionContext,
  avgRpe: number
): ProgressionSuggestion {
  const allCompleted = performances.every(p => p.completed);

  if (!allCompleted) {
    return {
      shouldProgress: false,
      progressionType: 'maintain',
      suggestionReason: 'Complétion incomplète, consolider avant de progresser',
      confidenceScore: 0.8
    };
  }

  if (avgRpe < 7) {
    return {
      shouldProgress: true,
      progressionType: 'intensity',
      suggestionReason: `RPE faible (${avgRpe.toFixed(1)}), augmentation d\'intensité possible`,
      newIntensity: 'Réduire le temps limite de 10-15% ou augmenter la charge',
      confidenceScore: 0.85
    };
  }

  if (avgRpe >= 7 && avgRpe <= 8.5 && performances.length >= 2) {
    return {
      shouldProgress: true,
      progressionType: 'skill',
      suggestionReason: 'Bonne performance, progression vers mouvements plus complexes',
      newIntensity: 'Introduire des variations plus techniques ou augmenter le volume',
      confidenceScore: 0.8,
      warnings: ['Maintenir la qualité technique']
    };
  }

  if (avgRpe > 8.5) {
    return {
      shouldProgress: false,
      progressionType: 'maintain',
      suggestionReason: `RPE très élevé (${avgRpe.toFixed(1)}), récupération prioritaire`,
      confidenceScore: 0.9,
      warnings: ['Alterner intensité et récupération active']
    };
  }

  return {
    shouldProgress: false,
    progressionType: 'maintain',
    suggestionReason: 'Consolider la capacité de travail actuelle',
    confidenceScore: 0.7
  };
}

/**
 * Generates Competitions progression
 */
function generateCompetitionsProgression(
  performances: ExerciseHistory[],
  context: ProgressionContext,
  avgRpe: number
): ProgressionSuggestion {
  const allCompleted = performances.every(p => p.completed);

  if (!allCompleted) {
    return {
      shouldProgress: false,
      progressionType: 'maintain',
      suggestionReason: 'Stations non complétées, répéter pour maîtriser',
      confidenceScore: 0.85
    };
  }

  if (avgRpe < 7.5) {
    return {
      shouldProgress: true,
      progressionType: 'pace',
      suggestionReason: `RPE faible (${avgRpe.toFixed(1)}), augmentation du rythme recommandée`,
      newIntensity: 'Réduire les transitions et augmenter la vitesse sur stations',
      confidenceScore: 0.85,
      warnings: ['Maintenir la qualité technique sur toutes les stations']
    };
  }

  if (avgRpe >= 7.5 && avgRpe <= 8.5 && performances.length >= 2) {
    return {
      shouldProgress: true,
      progressionType: 'intensity',
      suggestionReason: 'Performance stable, intensification progressive possible',
      newIntensity: 'Augmenter la distance ou réduire les temps de repos entre stations',
      confidenceScore: 0.8
    };
  }

  if (avgRpe > 8.5) {
    return {
      shouldProgress: false,
      progressionType: 'maintain',
      suggestionReason: `Intensité très élevée (${avgRpe.toFixed(1)}), maintenir pour adaptation`,
      confidenceScore: 0.9,
      warnings: ['Format compétition exigeant, privilégier la récupération']
    };
  }

  return {
    shouldProgress: false,
    progressionType: 'maintain',
    suggestionReason: 'Consolider la performance sur format compétition',
    confidenceScore: 0.75
  };
}

/**
 * Calculates average RPE from performances
 */
function calculateAverageRpe(performances: ExerciseHistory[]): number {
  const rpes = performances
    .map(p => p.rpe)
    .filter(rpe => rpe != null) as number[];

  if (rpes.length === 0) return 7;

  return rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length;
}

/**
 * Returns default progression when no history available
 */
function getDefaultProgression(context: ProgressionContext): ProgressionSuggestion {
  if (context.userExperience === 'beginner') {
    return {
      shouldProgress: false,
      progressionType: 'maintain',
      suggestionReason: 'Première session de cet exercice, focus sur la technique',
      confidenceScore: 0.6,
      warnings: ['Privilégier la maîtrise technique avant la progression']
    };
  }

  return {
    shouldProgress: false,
    progressionType: 'maintain',
    suggestionReason: 'Historique insuffisant pour suggérer une progression',
    confidenceScore: 0.5,
    warnings: ['Effectuer 2-3 sessions pour établir une base de référence']
  };
}

/**
 * Batch analyze multiple exercises for progression
 */
export async function analyzeSessionProgression(
  userId: string,
  exercises: ProgressionContext[]
): Promise<Map<string, ProgressionSuggestion>> {
  const suggestions = new Map<string, ProgressionSuggestion>();

  for (const exercise of exercises) {
    const suggestion = await analyzeExerciseProgression(userId, exercise);
    suggestions.set(exercise.exerciseName, suggestion);
  }

  return suggestions;
}

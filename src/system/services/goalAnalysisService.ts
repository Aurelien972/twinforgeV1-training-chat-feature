/**
 * Goal Analysis Service
 * Analyzes user training goals and provides strategic recommendations
 */

import { supabase } from '../supabase/client';

export interface UserGoal {
  id: string;
  goal_type: string;
  target_value?: number;
  target_date?: string;
  current_value?: number;
  priority: 'high' | 'medium' | 'low';
  discipline?: string;
  notes?: string;
  is_active: boolean;
}

export interface GoalAnalysis {
  primaryGoals: UserGoal[];
  secondaryGoals: UserGoal[];
  recommendedFocus: string[];
  trainingEmphasis: {
    discipline: string;
    priority: number;
    reason: string;
  }[];
  volumeRecommendation: {
    weeklySessionsMin: number;
    weeklySessionsMax: number;
    reasoning: string;
  };
  intensityGuidance: {
    targetRpeRange: [number, number];
    reasoning: string;
  };
  periodizationAdvice: string;
  progressMetrics: {
    metric: string;
    targetValue: number;
    currentValue?: number;
    progressPercentage?: number;
    timeRemaining?: string;
  }[];
}

/**
 * Analyzes user goals and provides training recommendations
 */
export async function analyzeUserGoals(userId: string): Promise<GoalAnalysis> {
  const { data: goals, error } = await supabase
    .from('training_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (error || !goals || goals.length === 0) {
    return getDefaultGoalAnalysis();
  }

  const primaryGoals = goals.filter(g => g.priority === 'high');
  const secondaryGoals = goals.filter(g => g.priority === 'medium' || g.priority === 'low');

  const recommendedFocus = deriveRecommendedFocus(primaryGoals, secondaryGoals);
  const trainingEmphasis = calculateTrainingEmphasis(primaryGoals, secondaryGoals);
  const volumeRecommendation = determineVolumeRecommendation(primaryGoals);
  const intensityGuidance = determineIntensityGuidance(primaryGoals);
  const periodizationAdvice = generatePeriodizationAdvice(primaryGoals);
  const progressMetrics = calculateProgressMetrics(goals);

  return {
    primaryGoals,
    secondaryGoals,
    recommendedFocus,
    trainingEmphasis,
    volumeRecommendation,
    intensityGuidance,
    periodizationAdvice,
    progressMetrics
  };
}

/**
 * Derives recommended training focus from goals
 */
function deriveRecommendedFocus(
  primaryGoals: UserGoal[],
  secondaryGoals: UserGoal[]
): string[] {
  const focus = new Set<string>();

  primaryGoals.forEach(goal => {
    const goalType = goal.goal_type.toLowerCase();

    if (goalType.includes('force') || goalType.includes('strength')) {
      focus.add('Développement de la force maximale');
      focus.add('Mouvements composés majeurs');
    }

    if (goalType.includes('masse') || goalType.includes('muscle') || goalType.includes('hypertrophie')) {
      focus.add('Volume d\'entraînement élevé');
      focus.add('Variation des exercices');
      focus.add('Temps sous tension');
    }

    if (goalType.includes('endurance') || goalType.includes('cardio')) {
      focus.add('Base aérobie (Zone 2)');
      focus.add('Volume progressif');
    }

    if (goalType.includes('poids') || goalType.includes('perte') || goalType.includes('composition')) {
      focus.add('Dépense énergétique élevée');
      focus.add('Combinaison force et cardio');
      focus.add('Densité d\'entraînement');
    }

    if (goalType.includes('performance') || goalType.includes('compétition')) {
      focus.add('Spécificité des mouvements');
      focus.add('Intensité élevée');
      focus.add('Pratique sous fatigue');
    }

    if (goalType.includes('mobilité') || goalType.includes('flexibilité')) {
      focus.add('Amplitude de mouvement complète');
      focus.add('Échauffements dynamiques');
    }

    if (goalType.includes('skill') || goalType.includes('technique') || goalType.includes('calisthenics')) {
      focus.add('Pratique quotidienne de la technique');
      focus.add('Progressions graduelles');
      focus.add('Force relative');
    }
  });

  if (focus.size === 0) {
    focus.add('Conditionnement général');
    focus.add('Technique et qualité de mouvement');
  }

  return Array.from(focus);
}

/**
 * Calculates training emphasis distribution
 */
function calculateTrainingEmphasis(
  primaryGoals: UserGoal[],
  secondaryGoals: UserGoal[]
): Array<{ discipline: string; priority: number; reason: string }> {
  const emphasisMap = new Map<string, { priority: number; reasons: string[] }>();

  primaryGoals.forEach(goal => {
    const discipline = mapGoalToDiscipline(goal);
    const existing = emphasisMap.get(discipline) || { priority: 0, reasons: [] };
    existing.priority += 3;
    existing.reasons.push(`Objectif prioritaire: ${goal.goal_type}`);
    emphasisMap.set(discipline, existing);
  });

  secondaryGoals.forEach(goal => {
    const discipline = mapGoalToDiscipline(goal);
    const existing = emphasisMap.get(discipline) || { priority: 0, reasons: [] };
    existing.priority += 1;
    existing.reasons.push(`Objectif secondaire: ${goal.goal_type}`);
    emphasisMap.set(discipline, existing);
  });

  const result = Array.from(emphasisMap.entries())
    .map(([discipline, data]) => ({
      discipline,
      priority: data.priority,
      reason: data.reasons.join(', ')
    }))
    .sort((a, b) => b.priority - a.priority);

  return result;
}

/**
 * Maps goal to training discipline
 */
function mapGoalToDiscipline(goal: UserGoal): string {
  if (goal.discipline) return goal.discipline;

  const goalType = goal.goal_type.toLowerCase();

  if (goalType.includes('force') || goalType.includes('strength') ||
      goalType.includes('masse') || goalType.includes('muscle')) {
    return 'Force';
  }

  if (goalType.includes('endurance') || goalType.includes('cardio') ||
      goalType.includes('marathon') || goalType.includes('running')) {
    return 'Endurance';
  }

  if (goalType.includes('functional') || goalType.includes('crossfit') ||
      goalType.includes('conditioning')) {
    return 'Functional';
  }

  if (goalType.includes('calisthenics') || goalType.includes('skill') ||
      goalType.includes('handstand') || goalType.includes('planche')) {
    return 'Calisthenics';
  }

  if (goalType.includes('competition') || goalType.includes('hyrox') ||
      goalType.includes('spartan') || goalType.includes('deka')) {
    return 'Competitions';
  }

  return 'Force';
}

/**
 * Determines volume recommendation based on goals
 */
function determineVolumeRecommendation(
  primaryGoals: UserGoal[]
): { weeklySessionsMin: number; weeklySessionsMax: number; reasoning: string } {
  if (primaryGoals.length === 0) {
    return {
      weeklySessionsMin: 3,
      weeklySessionsMax: 4,
      reasoning: 'Volume standard pour maintien et progression générale'
    };
  }

  const hasHypertrophyGoal = primaryGoals.some(g =>
    g.goal_type.toLowerCase().includes('masse') ||
    g.goal_type.toLowerCase().includes('muscle') ||
    g.goal_type.toLowerCase().includes('hypertrophie')
  );

  const hasEnduranceGoal = primaryGoals.some(g =>
    g.goal_type.toLowerCase().includes('endurance') ||
    g.goal_type.toLowerCase().includes('marathon')
  );

  const hasCompetitionGoal = primaryGoals.some(g =>
    g.goal_type.toLowerCase().includes('competition')
  );

  if (hasHypertrophyGoal) {
    return {
      weeklySessionsMin: 4,
      weeklySessionsMax: 6,
      reasoning: 'Volume élevé nécessaire pour l\'hypertrophie (4-6 sessions/semaine)'
    };
  }

  if (hasEnduranceGoal) {
    return {
      weeklySessionsMin: 4,
      weeklySessionsMax: 6,
      reasoning: 'Fréquence élevée recommandée pour développement aérobie'
    };
  }

  if (hasCompetitionGoal) {
    return {
      weeklySessionsMin: 4,
      weeklySessionsMax: 5,
      reasoning: 'Volume soutenu pour préparation compétition'
    };
  }

  return {
    weeklySessionsMin: 3,
    weeklySessionsMax: 4,
    reasoning: 'Volume équilibré pour progression continue'
  };
}

/**
 * Determines intensity guidance based on goals
 */
function determineIntensityGuidance(
  primaryGoals: UserGoal[]
): { targetRpeRange: [number, number]; reasoning: string } {
  if (primaryGoals.length === 0) {
    return {
      targetRpeRange: [6, 8],
      reasoning: 'Intensité modérée pour progression durable'
    };
  }

  const hasStrengthGoal = primaryGoals.some(g =>
    g.goal_type.toLowerCase().includes('force') ||
    g.goal_type.toLowerCase().includes('strength')
  );

  const hasHypertrophyGoal = primaryGoals.some(g =>
    g.goal_type.toLowerCase().includes('masse') ||
    g.goal_type.toLowerCase().includes('muscle')
  );

  const hasEnduranceGoal = primaryGoals.some(g =>
    g.goal_type.toLowerCase().includes('endurance')
  );

  if (hasStrengthGoal) {
    return {
      targetRpeRange: [7, 9],
      reasoning: 'Intensité élevée nécessaire pour gains de force maximale'
    };
  }

  if (hasHypertrophyGoal) {
    return {
      targetRpeRange: [7, 8],
      reasoning: 'Intensité modérée-élevée avec volume pour hypertrophie'
    };
  }

  if (hasEnduranceGoal) {
    return {
      targetRpeRange: [5, 7],
      reasoning: 'Majorité en zone 2 (RPE 5-6), intervalles occasionnels plus intenses'
    };
  }

  return {
    targetRpeRange: [6, 8],
    reasoning: 'Intensité équilibrée adaptée aux objectifs multiples'
  };
}

/**
 * Generates periodization advice
 */
function generatePeriodizationAdvice(primaryGoals: UserGoal[]): string {
  if (primaryGoals.length === 0) {
    return 'Cycle classique 4 semaines: 2 semaines accumulation, 1 intensification, 1 deload';
  }

  const hasCompetitionGoal = primaryGoals.some(g =>
    g.goal_type.toLowerCase().includes('competition')
  );

  const hasStrengthGoal = primaryGoals.some(g =>
    g.goal_type.toLowerCase().includes('force') ||
    g.goal_type.toLowerCase().includes('strength')
  );

  if (hasCompetitionGoal) {
    const competitionGoal = primaryGoals.find(g =>
      g.goal_type.toLowerCase().includes('competition')
    );

    if (competitionGoal?.target_date) {
      return `Périodisation inversée vers la compétition (${competitionGoal.target_date}): Base → Spécifique → Affûtage`;
    }

    return 'Périodisation compétition: Base générale → Préparation spécifique → Phase d\'affûtage';
  }

  if (hasStrengthGoal) {
    return 'Cycle force 6 semaines: 3 accumulation (volume), 2 intensification (charge), 1 deload';
  }

  return 'Périodisation ondulée: Alterner semaines volume et intensité, deload toutes les 4 semaines';
}

/**
 * Calculates progress metrics for goals
 */
function calculateProgressMetrics(
  goals: UserGoal[]
): Array<{
  metric: string;
  targetValue: number;
  currentValue?: number;
  progressPercentage?: number;
  timeRemaining?: string;
}> {
  return goals
    .filter(g => g.target_value != null)
    .map(goal => {
      const metric = goal.goal_type;
      const targetValue = goal.target_value!;
      const currentValue = goal.current_value;

      let progressPercentage: number | undefined;
      if (currentValue != null && targetValue > 0) {
        progressPercentage = Math.round((currentValue / targetValue) * 100);
      }

      let timeRemaining: string | undefined;
      if (goal.target_date) {
        const daysRemaining = Math.ceil(
          (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysRemaining > 0) {
          timeRemaining = daysRemaining > 30
            ? `${Math.ceil(daysRemaining / 30)} mois`
            : `${daysRemaining} jours`;
        }
      }

      return {
        metric,
        targetValue,
        currentValue,
        progressPercentage,
        timeRemaining
      };
    });
}

/**
 * Returns default goal analysis when no goals defined
 */
function getDefaultGoalAnalysis(): GoalAnalysis {
  return {
    primaryGoals: [],
    secondaryGoals: [],
    recommendedFocus: [
      'Conditionnement général',
      'Technique et qualité de mouvement',
      'Base de force et endurance'
    ],
    trainingEmphasis: [
      {
        discipline: 'Force',
        priority: 2,
        reason: 'Base fondamentale pour tous les objectifs'
      },
      {
        discipline: 'Endurance',
        priority: 1,
        reason: 'Santé cardiovasculaire'
      },
      {
        discipline: 'Functional',
        priority: 1,
        reason: 'Capacité de travail générale'
      }
    ],
    volumeRecommendation: {
      weeklySessionsMin: 3,
      weeklySessionsMax: 4,
      reasoning: 'Volume standard pour progression équilibrée sans objectifs spécifiques'
    },
    intensityGuidance: {
      targetRpeRange: [6, 8],
      reasoning: 'Intensité modérée pour développement général'
    },
    periodizationAdvice: 'Cycle standard 4 semaines: accumulation → intensification → deload',
    progressMetrics: []
  };
}

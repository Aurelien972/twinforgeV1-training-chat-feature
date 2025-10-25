/**
 * Weekly Plan Coordination Service
 * Provides weekly vision and multi-session coordination
 */

import { supabase } from '../supabase/client';
import { differenceInDays, startOfWeek, addDays, format } from 'date-fns';

export interface WeeklyPlanRecommendation {
  currentWeek: number;
  sessionsCompletedThisWeek: number;
  recommendedSessionsRemaining: number;
  suggestedDisciplines: Array<{
    discipline: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  volumeBalance: {
    currentVolume: number;
    targetVolume: number;
    status: 'low' | 'optimal' | 'high';
  };
  intensityBalance: {
    avgRpe: number;
    targetRpe: number;
    status: 'low' | 'optimal' | 'high';
  };
  recoveryStatus: {
    score: number;
    recommendation: string;
  };
  nextSessionSuggestions: Array<{
    discipline: string;
    focus: string[];
    estimatedDuration: number;
    reasoning: string;
  }>;
}

export interface MultiWeekVision {
  currentPhase: 'accumulation' | 'intensification' | 'realization' | 'deload';
  weekInPhase: number;
  totalWeeksInPhase: number;
  phaseGoals: string[];
  nextPhase: string;
  progressionStrategy: string;
  keyFocusAreas: string[];
}

/**
 * Generates weekly plan recommendations
 */
export async function generateWeeklyPlanRecommendation(
  userId: string
): Promise<WeeklyPlanRecommendation> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const { data: sessionsThisWeek, error } = await supabase
    .from('training_sessions')
    .select('id, discipline, prescription, overall_rpe, duration_actual')
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())
    .order('created_at', { ascending: false });

  if (error || !sessionsThisWeek) {
    return getDefaultWeeklyPlan();
  }

  const sessionsCompletedThisWeek = sessionsThisWeek.length;
  const recommendedSessionsRemaining = Math.max(0, 4 - sessionsCompletedThisWeek);

  const disciplineCounts = sessionsThisWeek.reduce((acc, s) => {
    acc[s.discipline] = (acc[s.discipline] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const suggestedDisciplines = generateDisciplinePriorities(disciplineCounts, sessionsCompletedThisWeek);

  const totalVolume = sessionsThisWeek.reduce((sum, s) => {
    const exercises = s.prescription?.exercises || [];
    return sum + exercises.reduce((exSum: number, ex: any) => {
      const sets = ex.sets || 0;
      const reps = Array.isArray(ex.reps) ? ex.reps[0] : (ex.reps || 0);
      return exSum + (sets * reps);
    }, 0);
  }, 0);

  const rpes = sessionsThisWeek
    .map(s => s.overall_rpe)
    .filter(rpe => rpe != null);
  const avgRpe = rpes.length > 0
    ? rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length
    : 0;

  const volumeBalance = calculateVolumeBalance(totalVolume, sessionsCompletedThisWeek);
  const intensityBalance = calculateIntensityBalance(avgRpe, sessionsCompletedThisWeek);
  const recoveryStatus = assessRecoveryStatus(sessionsThisWeek);
  const nextSessionSuggestions = generateNextSessionSuggestions(
    disciplineCounts,
    volumeBalance,
    intensityBalance,
    recoveryStatus
  );

  return {
    currentWeek: Math.floor(differenceInDays(new Date(), weekStart) / 7) + 1,
    sessionsCompletedThisWeek,
    recommendedSessionsRemaining,
    suggestedDisciplines,
    volumeBalance,
    intensityBalance,
    recoveryStatus,
    nextSessionSuggestions
  };
}

/**
 * Generates multi-week training vision
 */
export async function generateMultiWeekVision(
  userId: string
): Promise<MultiWeekVision> {
  const { data: userProfile } = await supabase
    .from('user_profile')
    .select('training_goals, training_experience')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: recentSessions } = await supabase
    .from('training_sessions')
    .select('created_at, discipline, prescription')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const cycleWeeks = 4;
  const oldestSession = recentSessions?.[recentSessions.length - 1];
  const weeksSinceStart = oldestSession
    ? Math.floor(differenceInDays(new Date(), new Date(oldestSession.created_at)) / 7)
    : 0;
  const weekInPhase = (weeksSinceStart % cycleWeeks) + 1;

  let currentPhase: MultiWeekVision['currentPhase'];
  let phaseGoals: string[];
  let progressionStrategy: string;
  let keyFocusAreas: string[];

  if (weekInPhase === 1 || weekInPhase === 2) {
    currentPhase = 'accumulation';
    phaseGoals = [
      'Augmenter progressivement le volume d\'entraînement',
      'Renforcer les bases techniques',
      'Développer l\'endurance musculaire'
    ];
    progressionStrategy = 'Volume progressif avec intensité modérée (RPE 6-7)';
    keyFocusAreas = ['Technique', 'Volume', 'Endurance'];
  } else if (weekInPhase === 3) {
    currentPhase = 'intensification';
    phaseGoals = [
      'Augmenter l\'intensité relative',
      'Améliorer la force maximale',
      'Tester de nouvelles charges'
    ];
    progressionStrategy = 'Réduction du volume, augmentation de l\'intensité (RPE 8-9)';
    keyFocusAreas = ['Force', 'Intensité', 'Puissance'];
  } else {
    currentPhase = 'deload';
    phaseGoals = [
      'Favoriser la récupération complète',
      'Maintenir la technique',
      'Préparer le prochain cycle'
    ];
    progressionStrategy = 'Volume et intensité réduits (-40%), focus sur la qualité';
    keyFocusAreas = ['Récupération', 'Mobilité', 'Technique'];
  }

  const nextPhaseMap = {
    accumulation: 'intensification',
    intensification: 'deload',
    deload: 'accumulation',
    realization: 'accumulation'
  };

  return {
    currentPhase,
    weekInPhase,
    totalWeeksInPhase: cycleWeeks,
    phaseGoals,
    nextPhase: nextPhaseMap[currentPhase],
    progressionStrategy,
    keyFocusAreas
  };
}

/**
 * Generates discipline priorities based on recent distribution
 */
function generateDisciplinePriorities(
  disciplineCounts: Record<string, number>,
  sessionsCompleted: number
): Array<{ discipline: string; priority: 'high' | 'medium' | 'low'; reason: string }> {
  const allDisciplines = ['Force', 'Endurance', 'Functional', 'Calisthenics', 'Competitions'];

  return allDisciplines.map(discipline => {
    const count = disciplineCounts[discipline] || 0;

    if (count === 0) {
      return {
        discipline,
        priority: 'high' as const,
        reason: 'Non pratiquée cette semaine, recommandée pour l\'équilibre'
      };
    } else if (count === 1) {
      return {
        discipline,
        priority: 'medium' as const,
        reason: 'Une session effectuée, peut être répétée'
      };
    } else {
      return {
        discipline,
        priority: 'low' as const,
        reason: `${count} sessions effectuées, privilégier la variation`
      };
    }
  });
}

/**
 * Calculates volume balance for the week
 */
function calculateVolumeBalance(
  currentVolume: number,
  sessionsCompleted: number
): { currentVolume: number; targetVolume: number; status: 'low' | 'optimal' | 'high' } {
  const targetVolumePerSession = 150;
  const targetVolume = targetVolumePerSession * 4;
  const projectedVolume = sessionsCompleted > 0
    ? (currentVolume / sessionsCompleted) * 4
    : 0;

  let status: 'low' | 'optimal' | 'high';
  if (projectedVolume < targetVolume * 0.8) {
    status = 'low';
  } else if (projectedVolume > targetVolume * 1.2) {
    status = 'high';
  } else {
    status = 'optimal';
  }

  return { currentVolume, targetVolume, status };
}

/**
 * Calculates intensity balance for the week
 */
function calculateIntensityBalance(
  avgRpe: number,
  sessionsCompleted: number
): { avgRpe: number; targetRpe: number; status: 'low' | 'optimal' | 'high' } {
  const targetRpe = 7;

  let status: 'low' | 'optimal' | 'high';
  if (avgRpe < 6) {
    status = 'low';
  } else if (avgRpe > 8) {
    status = 'high';
  } else {
    status = 'optimal';
  }

  return { avgRpe: Math.round(avgRpe * 10) / 10, targetRpe, status };
}

/**
 * Assesses recovery status based on recent sessions
 */
function assessRecoveryStatus(
  sessions: any[]
): { score: number; recommendation: string } {
  if (sessions.length === 0) {
    return {
      score: 100,
      recommendation: 'Récupération complète, prêt pour une session intensive'
    };
  }

  const lastSession = sessions[0];
  const daysSinceLast = differenceInDays(new Date(), new Date(lastSession.created_at));
  const baseScore = Math.min(daysSinceLast * 25, 100);

  const avgRpe = sessions
    .slice(0, 3)
    .reduce((sum, s) => sum + (s.overall_rpe || 0), 0) / Math.min(3, sessions.length);

  const intensityFactor = avgRpe >= 8 ? 0.7 : avgRpe >= 6 ? 0.85 : 1.0;
  const score = Math.round(Math.min(baseScore * intensityFactor, 100));

  let recommendation: string;
  if (score >= 80) {
    recommendation = 'Récupération excellente, tous les types de sessions sont possibles';
  } else if (score >= 60) {
    recommendation = 'Récupération bonne, privilégier des sessions modérées';
  } else {
    recommendation = 'Récupération limitée, opter pour une session légère ou du repos actif';
  }

  return { score, recommendation };
}

/**
 * Generates suggestions for next sessions
 */
function generateNextSessionSuggestions(
  disciplineCounts: Record<string, number>,
  volumeBalance: any,
  intensityBalance: any,
  recoveryStatus: any
): Array<{ discipline: string; focus: string[]; estimatedDuration: number; reasoning: string }> {
  const suggestions = [];

  const leastUsed = Object.entries(disciplineCounts)
    .sort(([, a], [, b]) => a - b)[0]?.[0];

  if (recoveryStatus.score >= 80 && volumeBalance.status === 'low') {
    suggestions.push({
      discipline: 'Force',
      focus: ['Mouvements composés', 'Progression en charge', 'Technique'],
      estimatedDuration: 60,
      reasoning: 'Récupération optimale, bon moment pour une session de force complète'
    });
  }

  if (intensityBalance.status === 'high' && recoveryStatus.score < 70) {
    suggestions.push({
      discipline: 'Endurance',
      focus: ['Zone 2', 'Récupération active', 'Technique'],
      estimatedDuration: 45,
      reasoning: 'Intensité élevée récente, favoriser une session d\'endurance légère'
    });
  }

  if (leastUsed && disciplineCounts[leastUsed] === 0) {
    suggestions.push({
      discipline: leastUsed,
      focus: ['Technique', 'Apprentissage', 'Progression'],
      estimatedDuration: 50,
      reasoning: `${leastUsed} non pratiqué cette semaine, recommandé pour l'équilibre`
    });
  }

  suggestions.push({
    discipline: 'Functional',
    focus: ['Conditionnement', 'Variation', 'Capacité de travail'],
    estimatedDuration: 45,
    reasoning: 'Session polyvalente pour développer le conditionnement général'
  });

  return suggestions.slice(0, 3);
}

/**
 * Returns default weekly plan when no data available
 */
function getDefaultWeeklyPlan(): WeeklyPlanRecommendation {
  return {
    currentWeek: 1,
    sessionsCompletedThisWeek: 0,
    recommendedSessionsRemaining: 4,
    suggestedDisciplines: [
      { discipline: 'Force', priority: 'high', reason: 'Début de semaine, recommandé' },
      { discipline: 'Endurance', priority: 'high', reason: 'Équilibre cardiovasculaire' },
      { discipline: 'Functional', priority: 'medium', reason: 'Conditionnement général' },
      { discipline: 'Calisthenics', priority: 'medium', reason: 'Force relative' },
      { discipline: 'Competitions', priority: 'low', reason: 'Optionnel selon objectifs' }
    ],
    volumeBalance: {
      currentVolume: 0,
      targetVolume: 600,
      status: 'low'
    },
    intensityBalance: {
      avgRpe: 0,
      targetRpe: 7,
      status: 'optimal'
    },
    recoveryStatus: {
      score: 100,
      recommendation: 'Récupération complète, tous les types de sessions sont possibles'
    },
    nextSessionSuggestions: [
      {
        discipline: 'Force',
        focus: ['Mouvements composés', 'Technique', 'Progression'],
        estimatedDuration: 60,
        reasoning: 'Excellent point de départ pour la semaine'
      },
      {
        discipline: 'Endurance',
        focus: ['Base aérobie', 'Zone 2', 'Endurance'],
        estimatedDuration: 45,
        reasoning: 'Développer la capacité cardiovasculaire'
      }
    ]
  };
}

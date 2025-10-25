/**
 * Preparer Context Enrichment Service
 * Enriches PreparerData with intelligent context from training history
 */

import { supabase } from '../supabase/client';
import {
  PreparerData,
  WeeklyProgress,
  PriorityToday,
  RecentFocus,
  CyclePhase
} from '../store/trainingPipeline/types';
import { startOfWeek, differenceInDays, addWeeks, format } from 'date-fns';

interface SessionHistory {
  id: string;
  created_at: string;
  discipline: string;
  prescription: any;
  feedback: any;
  duration_actual_min?: number;
  rpe_avg?: number;
}

interface ExerciseFrequency {
  exerciseName: string;
  frequency: number;
  lastPerformed: string;
}

/**
 * Enriches PreparerData with intelligent context from user history
 */
export async function enrichPreparerContext(
  userId: string,
  baseData: Partial<PreparerData>
): Promise<PreparerData> {
  const lookbackDays = 21;
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  const { data: sessions, error } = await supabase
    .from('training_sessions')
    .select('id, created_at, discipline, prescription, duration_actual_min, rpe_avg')
    .eq('user_id', userId)
    .gte('created_at', lookbackDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !sessions || sessions.length === 0) {
    return baseData as PreparerData;
  }

  const lastSession = sessions[0];
  const lastSessionDate = new Date(lastSession.created_at);
  const daysSinceLastSession = differenceInDays(new Date(), lastSessionDate);

  const weeklyProgress = calculateWeeklyProgress(sessions);
  const priorityToday = determinePriorityToday(sessions, daysSinceLastSession, weeklyProgress);
  const recentFocus = analyzeRecentFocus(sessions);
  const shouldAvoid = identifyOverusedElements(sessions);
  const cyclePhase = determineCyclePhase(sessions);
  const recoveryScore = calculateRecoveryScore(lastSession, daysSinceLastSession);
  const optimalTrainingWindow = determineOptimalWindow(recoveryScore, daysSinceLastSession);

  return {
    ...baseData,
    lastSessionDate: lastSession.created_at,
    daysSinceLastSession,
    lastSessionType: lastSession.prescription?.type || 'unknown',
    lastSessionDiscipline: lastSession.discipline,
    weeklyProgress,
    priorityToday,
    recentFocus,
    shouldAvoid,
    currentWeekInCycle: cyclePhase.currentWeek,
    cyclePhase,
    recoveryScore,
    optimalTrainingWindow
  } as PreparerData;
}

/**
 * Calculates weekly progress metrics
 */
function calculateWeeklyProgress(sessions: SessionHistory[]): WeeklyProgress {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const sessionsThisWeek = sessions.filter(s =>
    new Date(s.created_at) >= weekStart
  );

  const disciplines = new Set(sessionsThisWeek.map(s => s.discipline));

  const totalVolume = sessionsThisWeek.reduce((sum, s) => {
    const exercises = s.prescription?.exercises || [];
    return sum + exercises.reduce((exSum: number, ex: any) => {
      const sets = ex.sets || 0;
      const reps = Array.isArray(ex.reps) ? ex.reps[0] : (ex.reps || 0);
      return exSum + (sets * reps);
    }, 0);
  }, 0);

  const rpes = sessionsThisWeek
    .map(s => s.overall_rpe || s.feedback?.overallRpe)
    .filter(rpe => rpe != null);
  const avgRpe = rpes.length > 0
    ? rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length
    : 0;

  return {
    currentWeek: Math.floor(differenceInDays(now, weekStart) / 7) + 1,
    weekStartDate: weekStart.toISOString(),
    sessionsThisWeek: sessionsThisWeek.length,
    sessionsPlannedThisWeek: 4,
    disciplinesThisWeek: Array.from(disciplines),
    totalVolumeThisWeek: totalVolume,
    avgRpeThisWeek: Math.round(avgRpe * 10) / 10
  };
}

/**
 * Determines training priority for today
 */
function determinePriorityToday(
  sessions: SessionHistory[],
  daysSinceLastSession: number,
  weeklyProgress: WeeklyProgress
): PriorityToday {
  const disciplineCounts = sessions.reduce((acc, s) => {
    acc[s.discipline] = (acc[s.discipline] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedDisciplines = Object.entries(disciplineCounts)
    .sort(([, a], [, b]) => b - a);

  const mostUsed = sortedDisciplines[0]?.[0];
  const leastUsed = sortedDisciplines[sortedDisciplines.length - 1]?.[0];

  const shouldPrioritize: string[] = [];
  const shouldAvoid: string[] = [];
  let reason = '';
  let suggestedDiscipline: string | undefined;

  if (daysSinceLastSession >= 3) {
    reason = 'Repos prolongé détecté, privilégier une session modérée';
    shouldPrioritize.push('Activation progressive', 'Mobilité', 'Technique');
    suggestedDiscipline = 'Force';
  } else if (weeklyProgress.sessionsThisWeek >= 3) {
    reason = 'Volume hebdomadaire élevé, privilégier la récupération active';
    shouldPrioritize.push('Mobilité', 'Endurance légère', 'Technique');
    shouldAvoid.push('Haute intensité', 'Volume élevé');
  } else if (mostUsed && disciplineCounts[mostUsed] >= 3) {
    reason = `Discipline ${mostUsed} très utilisée récemment, varier l'entraînement`;
    shouldAvoid.push(mostUsed);
    suggestedDiscipline = leastUsed;
  } else {
    reason = 'Équilibre normal, continuer la progression';
    shouldPrioritize.push('Progression technique', 'Variation des mouvements');
  }

  return {
    shouldPrioritize,
    shouldAvoid,
    reason,
    suggestedDiscipline
  };
}

/**
 * Analyzes recent training focus
 */
function analyzeRecentFocus(sessions: SessionHistory[]): RecentFocus {
  const exerciseNames: string[] = [];
  const movementPatterns = new Set<string>();
  const muscleGroups = new Set<string>();
  const disciplines = new Set<string>();

  sessions.slice(0, 5).forEach(session => {
    disciplines.add(session.discipline);

    const exercises = session.prescription?.exercises || [];
    exercises.forEach((ex: any) => {
      exerciseNames.push(ex.name);
      if (ex.movementPattern) movementPatterns.add(ex.movementPattern);
      if (ex.muscleGroups) {
        ex.muscleGroups.forEach((mg: string) => muscleGroups.add(mg));
      }
    });
  });

  return {
    exerciseNames: exerciseNames.slice(0, 10),
    movementPatterns: Array.from(movementPatterns),
    muscleGroups: Array.from(muscleGroups),
    disciplines: Array.from(disciplines)
  };
}

/**
 * Identifies overused exercises/patterns
 */
function identifyOverusedElements(sessions: SessionHistory[]): string[] {
  const exerciseFrequency: Record<string, number> = {};
  const threshold = 3;

  sessions.forEach(session => {
    const exercises = session.prescription?.exercises || [];
    exercises.forEach((ex: any) => {
      const name = ex.name || 'Unknown';
      exerciseFrequency[name] = (exerciseFrequency[name] || 0) + 1;
    });
  });

  return Object.entries(exerciseFrequency)
    .filter(([, freq]) => freq >= threshold)
    .map(([name]) => name)
    .slice(0, 5);
}

/**
 * Determines current phase in training cycle
 */
function determineCyclePhase(sessions: SessionHistory[]): CyclePhase {
  const cycleWeeks = 4;
  const oldestSession = sessions[sessions.length - 1];
  const oldestDate = oldestSession ? new Date(oldestSession.created_at) : new Date();
  const weeksSinceStart = Math.floor(differenceInDays(new Date(), oldestDate) / 7);
  const currentWeek = (weeksSinceStart % cycleWeeks) + 1;

  let phase: CyclePhase['phase'];
  if (currentWeek === 1 || currentWeek === 2) {
    phase = 'accumulation';
  } else if (currentWeek === 3) {
    phase = 'intensification';
  } else {
    phase = 'deload';
  }

  const nextPhaseMap = {
    accumulation: 'intensification',
    intensification: 'deload',
    deload: 'accumulation',
    realization: 'accumulation'
  };

  const weeksUntilNextPhase = cycleWeeks - currentWeek + 1;
  const nextPhaseDate = addWeeks(new Date(), weeksUntilNextPhase);

  return {
    currentWeek,
    totalWeeks: cycleWeeks,
    phase,
    nextPhase: nextPhaseMap[phase],
    nextPhaseDate: format(nextPhaseDate, 'yyyy-MM-dd')
  };
}

/**
 * Calculates recovery score based on last session
 */
function calculateRecoveryScore(
  lastSession: SessionHistory,
  daysSinceLastSession: number
): number {
  const baseRecovery = Math.min(daysSinceLastSession * 25, 100);

  const lastRpe = lastSession.overall_rpe || lastSession.feedback?.overallRpe || 5;
  const intensityFactor = lastRpe >= 8 ? 0.7 : lastRpe >= 6 ? 0.85 : 1.0;

  return Math.round(Math.min(baseRecovery * intensityFactor, 100));
}

/**
 * Determines if current time is optimal for training
 */
function determineOptimalWindow(
  recoveryScore: number,
  daysSinceLastSession: number
): { isOptimal: boolean; hoursUntilOptimal?: number; reason?: string } {
  if (recoveryScore >= 80) {
    return {
      isOptimal: true,
      reason: 'Récupération excellente, moment optimal pour s\'entraîner'
    };
  }

  if (daysSinceLastSession === 0) {
    return {
      isOptimal: false,
      hoursUntilOptimal: 12,
      reason: 'Repos recommandé après la session d\'aujourd\'hui'
    };
  }

  if (recoveryScore < 60) {
    const hoursNeeded = Math.ceil((60 - recoveryScore) / 25 * 24);
    return {
      isOptimal: false,
      hoursUntilOptimal: hoursNeeded,
      reason: 'Récupération insuffisante, privilégier une session légère'
    };
  }

  return {
    isOptimal: true,
    reason: 'Récupération suffisante pour une session normale'
  };
}

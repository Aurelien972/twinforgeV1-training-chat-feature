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
import type { AgentType } from '../../domain/ai/trainingAiTypes';
import { getCoachForDiscipline } from '../../utils/disciplineMapper';
import {
  calculateTotalVolume,
  getAdaptiveThresholds,
  analyzeVolumeStatus,
  isExploratorySession,
  logVolumeCalculation
} from './volumeCalculationService';
import logger from '../../lib/utils/logger';

interface SessionHistory {
  id: string;
  created_at: string;
  discipline: string;
  prescription: any;
  feedback: any;
  duration_actual_min?: number;
  rpe_avg?: number;
  coach_type?: AgentType;
}

interface ExerciseFrequency {
  exerciseName: string;
  frequency: number;
  lastPerformed: string;
}

/**
 * Enriches PreparerData with intelligent context from user history
 * Now coach-specific: analyzes only sessions from the selected coach
 */
export async function enrichPreparerContext(
  userId: string,
  baseData: Partial<PreparerData>,
  selectedCoachType?: AgentType
): Promise<PreparerData> {
  const lookbackDays = 21;
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  const { data: sessions, error } = await supabase
    .from('training_sessions')
    .select('id, created_at, discipline, prescription, duration_actual_min, rpe_avg, coach_type')
    .eq('user_id', userId)
    .gte('created_at', lookbackDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  logger.info('PREPARER_ENRICHMENT', 'Fetched sessions', {
    userId,
    sessionsCount: sessions?.length || 0,
    selectedCoachType,
    lookbackDays
  });

  if (error || !sessions || sessions.length === 0) {
    logger.info('PREPARER_ENRICHMENT', 'No sessions found, returning base data', {
      userId,
      hasError: !!error
    });
    return baseData as PreparerData;
  }

  const coachType = selectedCoachType || getCoachForDiscipline(baseData.tempSport || 'strength');

  const coachSessions = sessions.filter(s => {
    const sessionCoach = s.coach_type || getCoachForDiscipline(s.discipline);
    return sessionCoach === coachType;
  });

  logger.info('PREPARER_ENRICHMENT', 'Filtered sessions by coach', {
    totalSessions: sessions.length,
    coachType,
    coachSessions: coachSessions.length
  });

  if (coachSessions.length === 0) {
    logger.info('PREPARER_ENRICHMENT', 'No sessions for this coach, using all sessions as fallback');
    const sessionsToUse = sessions;
    return enrichWithSessions(userId, baseData, sessionsToUse, coachType);
  }

  return enrichWithSessions(userId, baseData, coachSessions, coachType);
}

function enrichWithSessions(
  userId: string,
  baseData: Partial<PreparerData>,
  sessions: SessionHistory[],
  coachType: AgentType
): PreparerData {

  const lastSession = sessions[0];
  const lastSessionDate = new Date(lastSession.created_at);
  const daysSinceLastSession = differenceInDays(new Date(), lastSessionDate);

  const weeklyProgress = calculateWeeklyProgress(sessions, coachType);
  const priorityToday = determinePriorityToday(sessions, daysSinceLastSession, weeklyProgress, coachType);
  const recentFocus = analyzeRecentFocus(sessions);
  const shouldAvoid = identifyOverusedElements(sessions);
  const cyclePhase = determineCyclePhase(sessions);
  const recoveryScore = calculateRecoveryScore(lastSession, daysSinceLastSession);
  const optimalTrainingWindow = determineOptimalWindow(recoveryScore, daysSinceLastSession);

  logger.info('PREPARER_ENRICHMENT', 'Context enriched successfully', {
    userId,
    coachType,
    weeklyVolume: weeklyProgress.totalVolumeThisWeek,
    avgRpe: weeklyProgress.avgRpeThisWeek,
    recoveryScore,
    cyclePhase: cyclePhase.phase
  });

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
 * Calculates weekly progress metrics with coach-specific volume
 */
function calculateWeeklyProgress(sessions: SessionHistory[], coachType: AgentType): WeeklyProgress {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const sessionsThisWeek = sessions.filter(s =>
    new Date(s.created_at) >= weekStart
  );

  const disciplines = new Set(sessionsThisWeek.map(s => s.discipline));

  const volumeResult = calculateTotalVolume(sessionsThisWeek, coachType);
  logVolumeCalculation(sessionsThisWeek, coachType, volumeResult);

  const totalVolume = volumeResult.value;

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
 * Coach-specific recommendations without suggesting other disciplines
 */
function determinePriorityToday(
  sessions: SessionHistory[],
  daysSinceLastSession: number,
  weeklyProgress: WeeklyProgress,
  coachType: AgentType
): PriorityToday {
  if (sessions.length === 0) {
    return getFirstSessionPriority(coachType);
  }

  const thresholds = getAdaptiveThresholds(sessions, coachType);
  const volumeStatus = analyzeVolumeStatus(weeklyProgress.totalVolumeThisWeek, thresholds);

  const isExploratory = sessions.length > 0 && isExploratorySession(
    weeklyProgress.totalVolumeThisWeek,
    thresholds
  );

  logger.info('PRIORITY_TODAY', 'Volume analysis', {
    coachType,
    currentVolume: weeklyProgress.totalVolumeThisWeek,
    thresholds,
    volumeStatus,
    isExploratory
  });

  const exerciseFrequency = analyzeExerciseFrequency(sessions);
  const overusedExercises = exerciseFrequency.filter(e => e.frequency >= 3);

  const shouldPrioritize: string[] = [];
  const shouldAvoid: string[] = [];
  let reason = '';
  let suggestedDiscipline: string | undefined;

  if (daysSinceLastSession >= 3) {
    return getLongRestPriority(daysSinceLastSession, coachType);
  }

  if (volumeStatus === 'high' || weeklyProgress.sessionsThisWeek >= 4) {
    return getHighVolumePriority(weeklyProgress, coachType);
  }

  if (overusedExercises.length > 0) {
    return getOverusePriority(overusedExercises, coachType);
  }

  if (volumeStatus === 'low' && !isExploratory) {
    return getLowVolumePriority(coachType);
  }

  return getOptimalPriority(weeklyProgress, coachType);
}

/**
 * Get first session priority by coach type
 */
function getFirstSessionPriority(coachType: AgentType): PriorityToday {
  const baseRecommendations = {
    shouldPrioritize: ['Apprentissage technique', 'Mouvements fondamentaux', 'Sécurité'],
    shouldAvoid: ['Charges maximales', 'Haute intensité', 'Volumes excessifs'],
    reason: 'Première séance : Focus sur la technique et l\'apprentissage des mouvements de base'
  };

  return baseRecommendations;
}

/**
 * Get priority for long rest period
 */
function getLongRestPriority(days: number, coachType: AgentType): PriorityToday {
  const coachSpecificPriorities: Record<AgentType, { prioritize: string[]; avoid: string[] }> = {
    'coach-force': {
      prioritize: ['Activation neuromusculaire', 'Charges légères 50-60%', 'Schémas moteurs de base'],
      avoid: ['Charges lourdes >80%', 'Volume élevé', 'Techniques d\'intensification']
    },
    'coach-endurance': {
      prioritize: ['Zone 1-2', 'Durée progressive', 'Reprise douce'],
      avoid: ['Intervalles intenses', 'Longue durée immédiate', 'Zone 4-5']
    },
    'coach-functional': {
      prioritize: ['Mouvements gymniques simples', 'Charge légère', 'Mobilité'],
      avoid: ['WODs intenses', 'Mouvements olympiques lourds', 'MetCons longs']
    },
    'coach-calisthenics': {
      prioritize: ['Progressions de base', 'Amplitude contrôlée', 'Activation scapulaire'],
      avoid: ['Skills avancés', 'Volume élevé', 'Tensions maximales']
    },
    'coach-competitions': {
      prioritize: ['Stations techniques', 'Rythme modéré', 'Focus qualité'],
      avoid: ['Circuits complets', 'Intensité compétition', 'Volume maximal']
    }
  } as any;

  const specific = coachSpecificPriorities[coachType] || coachSpecificPriorities['coach-force'];

  return {
    shouldPrioritize: specific.prioritize,
    shouldAvoid: specific.avoid,
    reason: `${days} jours de repos : Reprendre progressivement avec focus technique et charges modérées`
  };
}

/**
 * Get priority for high volume week
 */
function getHighVolumePriority(weeklyProgress: WeeklyProgress, coachType: AgentType): PriorityToday {
  const coachSpecificRecovery: Record<AgentType, { prioritize: string[]; avoid: string[] }> = {
    'coach-force': {
      prioritize: ['Travail technique pur', 'Charges <70%', 'Mobilité articulaire'],
      avoid: ['Volume élevé', 'RPE >7', 'Techniques d\'intensification']
    },
    'coach-endurance': {
      prioritize: ['Zone 1-2 récupération active', 'Durée courte 20-30min', 'Tempo facile'],
      avoid: ['Intervalles', 'Longue durée', 'Zones intenses']
    },
    'coach-functional': {
      prioritize: ['Skill work', 'Mobilité', 'Étirements actifs'],
      avoid: ['MetCons', 'Forte densité', 'Mouvements lourds']
    },
    'coach-calisthenics': {
      prioritize: ['Travail technique', 'Amplitude complète', 'Contrôle'],
      avoid: ['Volume élevé', 'Skills max', 'Intensification']
    },
    'coach-competitions': {
      prioritize: ['Technique pure', 'Stations isolées', 'Tempo contrôlé'],
      avoid: ['Circuits complets', 'Format compétition', 'Haute densité']
    }
  } as any;

  const specific = coachSpecificRecovery[coachType] || coachSpecificRecovery['coach-force'];

  return {
    shouldPrioritize: specific.prioritize,
    shouldAvoid: specific.avoid,
    reason: `${weeklyProgress.sessionsThisWeek} séances cette semaine : Privilégier la récupération active et la qualité technique`
  };
}

/**
 * Get priority for overused exercises
 */
function getOverusePriority(overusedExercises: Array<{ exerciseName: string; frequency: number }>, coachType: AgentType): PriorityToday {
  const exerciseNames = overusedExercises.map(e => e.exerciseName).slice(0, 3);

  const coachSpecificVariation: Record<AgentType, { prioritize: string[]; avoid: string[] }> = {
    'coach-force': {
      prioritize: ['Variantes d\'exercices', 'Schémas de mouvement complémentaires', 'Angles différents'],
      avoid: exerciseNames
    },
    'coach-endurance': {
      prioritize: ['Modalité alternative', 'Terrain différent', 'Format varié'],
      avoid: ['Même modalité répétée', 'Même format d\'entraînement']
    },
    'coach-functional': {
      prioritize: ['Modalité sous-utilisée', 'Nouveau stimulus', 'Format varié'],
      avoid: exerciseNames
    },
    'coach-calisthenics': {
      prioritize: ['Progressions alternatives', 'Skills complémentaires', 'Variations techniques'],
      avoid: exerciseNames
    },
    'coach-competitions': {
      prioritize: ['Stations différentes', 'Format alternatif', 'Nouveau circuit'],
      avoid: exerciseNames
    }
  } as any;

  const specific = coachSpecificVariation[coachType] || coachSpecificVariation['coach-force'];

  return {
    shouldPrioritize: specific.prioritize,
    shouldAvoid: specific.avoid,
    reason: `Exercices sur-utilisés détectés : Varier pour équilibrer le développement et prévenir les déséquilibres`
  };
}

/**
 * Get priority for low volume
 */
function getLowVolumePriority(coachType: AgentType): PriorityToday {
  const coachSpecificRampUp: Record<AgentType, { prioritize: string[]; avoid: string[] }> = {
    'coach-force': {
      prioritize: ['Exercices fondamentaux', 'Charges challengeantes 75-85%', 'Progression contrôlée'],
      avoid: ['Surentraînement', 'Junk volume']
    },
    'coach-endurance': {
      prioritize: ['Zone 3-4', 'Durée standard', 'Progression tempo'],
      avoid: ['Trop de volume d\'un coup', 'Zone 5 immédiate']
    },
    'coach-functional': {
      prioritize: ['WOD complet', 'Forte densité', 'Conditionnement'],
      avoid: ['Volume excessif', 'Fatigue prématurée']
    },
    'coach-calisthenics': {
      prioritize: ['Progressions clés', 'Volume optimal', 'Skills ciblés'],
      avoid: ['Trop de variation', 'Volume excessif']
    },
    'coach-competitions': {
      prioritize: ['Circuit complet', 'Intensité élevée', 'Format spécifique'],
      avoid: ['Volume excessif d\'un coup']
    }
  } as any;

  const specific = coachSpecificRampUp[coachType] || coachSpecificRampUp['coach-force'];

  return {
    shouldPrioritize: specific.prioritize,
    shouldAvoid: specific.avoid,
    reason: 'Volume bas cette semaine : Moment optimal pour une séance de qualité et progression'
  };
}

/**
 * Get priority for optimal conditions
 */
function getOptimalPriority(weeklyProgress: WeeklyProgress, coachType: AgentType): PriorityToday {
  const coachSpecificOptimal: Record<AgentType, { prioritize: string[]; avoid: string[] }> = {
    'coach-force': {
      prioritize: ['Progression contrôlée', 'Qualité technique', 'Intensité modérée'],
      avoid: ['Fatigue excessive', 'Technique dégradée']
    },
    'coach-endurance': {
      prioritize: ['Zone cible', 'Progression tempo', 'Endurance spécifique'],
      avoid: ['Surcompensation', 'Zones inadaptées']
    },
    'coach-functional': {
      prioritize: ['Équilibre modalités', 'Conditionnement', 'Skills'],
      avoid: ['Déséquilibre', 'Fatigue technique']
    },
    'coach-calisthenics': {
      prioritize: ['Progression skills', 'Volume optimal', 'Qualité technique'],
      avoid: ['Compensation', 'Technique approximative']
    },
    'coach-competitions': {
      prioritize: ['Format compétition', 'Toutes modalités', 'Transitions'],
      avoid: ['Négligence technique', 'Fatigue excessive']
    }
  } as any;

  const specific = coachSpecificOptimal[coachType] || coachSpecificOptimal['coach-force'];

  return {
    shouldPrioritize: specific.prioritize,
    shouldAvoid: specific.avoid,
    reason: `${weeklyProgress.sessionsThisWeek} séances cette semaine : Conditions optimales pour continuer la progression`
  };
}

/**
 * Analyze exercise frequency
 */
function analyzeExerciseFrequency(sessions: SessionHistory[]): Array<{ exerciseName: string; frequency: number }> {
  const frequency: Record<string, number> = {};

  sessions.forEach(session => {
    const exercises = session.prescription?.exercises || [];
    exercises.forEach((ex: any) => {
      const name = ex.name || 'Unknown';
      frequency[name] = (frequency[name] || 0) + 1;
    });
  });

  return Object.entries(frequency)
    .map(([exerciseName, freq]) => ({ exerciseName, frequency: freq }))
    .sort((a, b) => b.frequency - a.frequency);
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

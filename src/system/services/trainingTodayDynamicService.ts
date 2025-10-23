/**
 * Training Today Dynamic Service
 * Service unifié pour l'onglet "Aujourd'hui" avec support multi-disciplines et wearables
 */

import { supabase } from '../supabase/client';
import { trainingRecoveryService } from './trainingRecoveryService';
import logger from '../../lib/utils/logger';
import { startOfDay, endOfDay, differenceInDays, differenceInHours, format } from 'date-fns';

export interface WearableMetrics {
  avgHr?: number;
  maxHr?: number;
  minHr?: number;
  caloriesBurned?: number;
  effortScore?: number;
  zonesDistribution?: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  deviceName?: string;
  dataQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TodaySession {
  id: string;
  type: string;
  status: 'draft' | 'active' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  durationMin?: number;
  rpeAvg?: number;
  exercisesCompleted?: number;
  exercisesTotal?: number;
  wearableMetrics?: WearableMetrics;
  coachType?: string;
  locationName?: string;
}

export interface ReadinessScore {
  overall: number; // 0-100
  recovery: number; // 0-100
  energy: number; // 0-100
  consistency: number; // 0-100
  factors: {
    name: string;
    impact: 'positive' | 'neutral' | 'negative';
    message: string;
  }[];
  recommendation: 'rest' | 'light' | 'moderate' | 'intense';
}

export interface OptimalWindow {
  start: Date;
  end: Date;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface TodayTrainingContext {
  userId: string;
  date: Date;

  // Sessions
  todaySession?: TodaySession;
  lastCompletedSession?: TodaySession;
  activeDraft?: TodaySession;

  // Wearable
  todayWearableMetrics?: WearableMetrics;
  hasConnectedWearable: boolean;

  // Stats
  weekSessions: number;
  currentStreak: number;
  longestStreak: number;

  // Recovery & Readiness
  readinessScore: ReadinessScore;
  daysSinceLastSession: number;
  hoursUntilOptimalWindow?: number;
  optimalWindow?: OptimalWindow;

  // Discipline
  activeDiscipline: string;
  coachType: string;

  // Goals
  activeGoal?: {
    id: string;
    type: string;
    targetValue: number;
    currentValue: number;
    progress: number;
    deadline?: Date;
  };

  // Today's training stats (training sessions only)
  todayTrainingStats?: {
    totalCalories: number;
    totalDuration: number;
    sessionsCount: number;
  };
}

class TrainingTodayDynamicService {
  /**
   * Récupère le contexte complet d'entraînement pour aujourd'hui
   */
  async getTodayContext(): Promise<TodayTrainingContext | null> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error('TRAINING_TODAY_DYNAMIC', 'User not authenticated', {
          error: userError?.message,
        });
        return null;
      }

      const today = new Date();
      const startToday = startOfDay(today);
      const endToday = endOfDay(today);

      // Récupérer en parallèle toutes les données nécessaires
      const [
        todaySession,
        lastSession,
        draft,
        weekSessions,
        streak,
        wearableDevice,
        todayWearable,
        activeGoal,
        profile,
      ] = await Promise.all([
        this.getTodaySession(user.id, startToday, endToday),
        this.getLastCompletedSession(user.id),
        this.getActiveDraft(user.id),
        this.getWeekSessionsCount(user.id),
        this.calculateStreak(user.id),
        this.getConnectedWearable(user.id),
        this.getTodayWearableMetrics(user.id, startToday, endToday),
        this.getActiveGoal(user.id),
        this.getUserProfile(user.id),
      ]);

      // Calculate today's training stats (training sessions only)
      const todayTrainingStats = await this.getTodayTrainingStats(user.id, startToday, endToday);

      // Calculer le score de préparation
      const readinessScore = await this.calculateReadinessScore(
        user.id,
        lastSession,
        weekSessions,
        streak,
        todayWearable
      );

      // Calculer jours depuis dernière session
      const daysSinceLastSession = lastSession?.completedAt
        ? differenceInDays(today, lastSession.completedAt)
        : 999;

      // Déterminer discipline et coach
      const activeDiscipline = profile?.preferences?.workout?.type || 'strength';
      const coachType = this.mapDisciplineToCoach(activeDiscipline);

      // Calculer fenêtre optimale
      const optimalWindow = await this.calculateOptimalWindow(user.id, readinessScore);
      const hoursUntilOptimalWindow = optimalWindow
        ? differenceInHours(optimalWindow.start, today)
        : undefined;

      return {
        userId: user.id,
        date: today,
        todaySession,
        lastCompletedSession: lastSession,
        activeDraft: draft,
        todayWearableMetrics: todayWearable,
        hasConnectedWearable: !!wearableDevice,
        weekSessions,
        currentStreak: streak.current,
        longestStreak: streak.longest,
        readinessScore,
        daysSinceLastSession,
        hoursUntilOptimalWindow,
        optimalWindow,
        activeDiscipline,
        coachType,
        activeGoal,
        todayTrainingStats,
      };
    } catch (error) {
      logger.error('TRAINING_TODAY_DYNAMIC', 'Failed to get today context', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Récupère la session d'aujourd'hui (active ou complétée)
   */
  private async getTodaySession(
    userId: string,
    startToday: Date,
    endToday: Date
  ): Promise<TodaySession | undefined> {
    const { data } = await supabase
      .from('training_sessions')
      .select(`
        id,
        session_type,
        status,
        started_at,
        completed_at,
        duration_actual_min,
        rpe_avg,
        exercises_completed,
        exercises_total,
        coach_type,
        location_id
      `)
      .eq('user_id', userId)
      .or(`status.eq.active,and(status.eq.completed,completed_at.gte.${startToday.toISOString()},completed_at.lte.${endToday.toISOString()})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return undefined;

    // Récupérer les métriques wearable pour cette session
    const wearableMetrics = await this.getSessionWearableMetrics(data.id);

    // Récupérer le nom de la location
    let locationName: string | undefined;
    if (data.location_id) {
      const { data: location } = await supabase
        .from('training_locations')
        .select('name')
        .eq('id', data.location_id)
        .maybeSingle();
      locationName = location?.name;
    }

    return {
      id: data.id,
      type: data.session_type || 'strength',
      status: data.status as 'draft' | 'active' | 'completed',
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      durationMin: data.duration_actual_min,
      rpeAvg: data.rpe_avg,
      exercisesCompleted: data.exercises_completed,
      exercisesTotal: data.exercises_total,
      wearableMetrics,
      coachType: data.coach_type,
      locationName,
    };
  }

  /**
   * Récupère la dernière session complétée
   */
  private async getLastCompletedSession(userId: string): Promise<TodaySession | undefined> {
    const { data } = await supabase
      .from('training_sessions')
      .select(`
        id,
        session_type,
        status,
        completed_at,
        duration_actual_min,
        rpe_avg,
        exercises_completed,
        exercises_total,
        coach_type
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return undefined;

    const wearableMetrics = await this.getSessionWearableMetrics(data.id);

    return {
      id: data.id,
      type: data.session_type || 'strength',
      status: 'completed',
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      durationMin: data.duration_actual_min,
      rpeAvg: data.rpe_avg,
      exercisesCompleted: data.exercises_completed,
      exercisesTotal: data.exercises_total,
      wearableMetrics,
      coachType: data.coach_type,
    };
  }

  /**
   * Récupère un draft actif
   */
  private async getActiveDraft(userId: string): Promise<TodaySession | undefined> {
    const { data } = await supabase
      .from('training_sessions')
      .select(`
        id,
        session_type,
        status,
        created_at,
        coach_type,
        location_id
      `)
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return undefined;

    let locationName: string | undefined;
    if (data.location_id) {
      const { data: location } = await supabase
        .from('training_locations')
        .select('name')
        .eq('id', data.location_id)
        .maybeSingle();
      locationName = location?.name;
    }

    return {
      id: data.id,
      type: data.session_type || 'strength',
      status: 'draft',
      coachType: data.coach_type,
      locationName,
    };
  }

  /**
   * Compte les sessions de la semaine
   */
  private async getWeekSessionsCount(userId: string): Promise<number> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const { count } = await supabase
      .from('training_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', weekAgo.toISOString());

    return count || 0;
  }

  /**
   * Calcule le streak actuel et le plus long
   */
  private async calculateStreak(userId: string): Promise<{ current: number; longest: number }> {
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(100);

    if (!sessions || sessions.length === 0) {
      return { current: 0, longest: 0 };
    }

    const dates = sessions.map(s => new Date(s.completed_at));
    const uniqueDays = new Set(dates.map(d => format(d, 'yyyy-MM-dd')));
    const sortedDays = Array.from(uniqueDays).sort().reverse();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');

    for (let i = 0; i < sortedDays.length; i++) {
      const daysDiff = differenceInDays(new Date(today), new Date(sortedDays[i]));

      if (daysDiff === i) {
        tempStreak++;
        if (i === 0 || daysDiff === 0 || daysDiff === 1) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 1;
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * Récupère les métriques wearable d'une session
   */
  private async getSessionWearableMetrics(sessionId: string): Promise<WearableMetrics | undefined> {
    try {
      const { data, error } = await supabase
        .from('training_session_wearable_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) {
        logger.warn('TRAINING_TODAY', 'Wearable metrics table query failed (table may not exist)', {
          error: error.message,
          sessionId
        });
        return undefined;
      }

      if (!data) return undefined;

      return {
        avgHr: data.avg_hr,
        maxHr: data.max_hr,
        minHr: data.min_hr,
        caloriesBurned: data.calories_burned,
        effortScore: data.effort_score,
        zonesDistribution: data.zones_distribution,
        deviceName: data.device_name,
        dataQuality: data.data_quality,
      };
    } catch (error) {
      logger.error('TRAINING_TODAY', 'Failed to fetch session wearable metrics', {
        error: error instanceof Error ? error.message : 'Unknown',
        sessionId
      });
      return undefined;
    }
  }

  /**
   * Récupère les métriques wearable d'aujourd'hui (toutes sessions)
   */
  private async getTodayWearableMetrics(
    userId: string,
    startToday: Date,
    endToday: Date
  ): Promise<WearableMetrics | undefined> {
    try {
      const { data, error } = await supabase
        .from('training_session_wearable_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startToday.toISOString())
        .lte('created_at', endToday.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.warn('TRAINING_TODAY', 'Wearable metrics table query failed (table may not exist)', {
          error: error.message,
          userId
        });
        return undefined;
      }

      if (!data) return undefined;

      return {
        avgHr: data.avg_hr,
        maxHr: data.max_hr,
        minHr: data.min_hr,
        caloriesBurned: data.calories_burned,
        effortScore: data.effort_score,
        zonesDistribution: data.zones_distribution,
        deviceName: data.device_name,
        dataQuality: data.data_quality,
      };
    } catch (error) {
      logger.error('TRAINING_TODAY', 'Failed to fetch today wearable metrics', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId
      });
      return undefined;
    }
  }

  /**
   * Vérifie si un wearable est connecté
   */
  private async getConnectedWearable(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('connected_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_type', 'wearable')
      .eq('status', 'connected')
      .limit(1)
      .maybeSingle();

    return !!data;
  }

  /**
   * Récupère l'objectif actif
   */
  private async getActiveGoal(userId: string): Promise<TodayTrainingContext['activeGoal']> {
    const { data } = await supabase
      .from('training_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return undefined;

    const progress = data.target_value > 0
      ? Math.round((data.current_value / data.target_value) * 100)
      : 0;

    return {
      id: data.id,
      type: data.goal_type,
      targetValue: data.target_value,
      currentValue: data.current_value,
      progress,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    };
  }

  /**
   * Récupère le profil utilisateur
   */
  private async getUserProfile(userId: string): Promise<any> {
    const { data } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return data;
  }

  /**
   * Calcule le score de préparation (0-100)
   */
  private async calculateReadinessScore(
    userId: string,
    lastSession: TodaySession | undefined,
    weekSessions: number,
    streak: { current: number; longest: number },
    todayWearable?: WearableMetrics
  ): Promise<ReadinessScore> {
    let recoveryScore = 50;
    let energyScore = 70;
    let consistencyScore = 50;
    const factors: ReadinessScore['factors'] = [];

    // Score de récupération basé sur dernière session
    if (lastSession?.completedAt) {
      const hoursSinceLastSession = differenceInHours(new Date(), lastSession.completedAt);

      if (hoursSinceLastSession < 12) {
        recoveryScore = 30;
        factors.push({
          name: 'Récupération',
          impact: 'negative',
          message: 'Récupération insuffisante (< 12h)',
        });
      } else if (hoursSinceLastSession < 24) {
        recoveryScore = 60;
        factors.push({
          name: 'Récupération',
          impact: 'neutral',
          message: 'Récupération en cours (< 24h)',
        });
      } else if (hoursSinceLastSession < 48) {
        recoveryScore = 85;
        factors.push({
          name: 'Récupération',
          impact: 'positive',
          message: 'Récupération optimale (24-48h)',
        });
      } else if (hoursSinceLastSession > 96) {
        recoveryScore = 70;
        factors.push({
          name: 'Récupération',
          impact: 'neutral',
          message: 'Longue pause (>4 jours)',
        });
      } else {
        recoveryScore = 90;
        factors.push({
          name: 'Récupération',
          impact: 'positive',
          message: 'Récupération complète',
        });
      }
    } else {
      recoveryScore = 100;
      factors.push({
        name: 'Récupération',
        impact: 'positive',
        message: 'Complètement reposé',
      });
    }

    // Score d'énergie basé sur wearable (si disponible)
    if (todayWearable?.effortScore) {
      energyScore = Math.max(0, 100 - todayWearable.effortScore);
      factors.push({
        name: 'Énergie wearable',
        impact: energyScore > 70 ? 'positive' : energyScore > 50 ? 'neutral' : 'negative',
        message: `Effort déjà dépensé: ${todayWearable.effortScore}/100`,
      });
    }

    // Score de consistance basé sur streak et sessions/semaine
    if (streak.current >= 7) {
      consistencyScore = 95;
      factors.push({
        name: 'Consistance',
        impact: 'positive',
        message: `Streak impressionnant: ${streak.current} jours`,
      });
    } else if (streak.current >= 3) {
      consistencyScore = 75;
      factors.push({
        name: 'Consistance',
        impact: 'positive',
        message: `Bonne dynamique: ${streak.current} jours de suite`,
      });
    } else if (weekSessions >= 4) {
      consistencyScore = 70;
      factors.push({
        name: 'Consistance',
        impact: 'positive',
        message: `Bonne semaine: ${weekSessions} sessions`,
      });
    } else if (weekSessions >= 2) {
      consistencyScore = 50;
      factors.push({
        name: 'Consistance',
        impact: 'neutral',
        message: `${weekSessions} sessions cette semaine`,
      });
    } else {
      consistencyScore = 30;
      factors.push({
        name: 'Consistance',
        impact: 'negative',
        message: 'Peu de sessions cette semaine',
      });
    }

    // Calcul score global (moyenne pondérée)
    const overall = Math.round(
      (recoveryScore * 0.4) + (energyScore * 0.3) + (consistencyScore * 0.3)
    );

    // Recommandation basée sur score global
    let recommendation: ReadinessScore['recommendation'];
    if (overall >= 80) {
      recommendation = 'intense';
    } else if (overall >= 60) {
      recommendation = 'moderate';
    } else if (overall >= 40) {
      recommendation = 'light';
    } else {
      recommendation = 'rest';
    }

    return {
      overall,
      recovery: recoveryScore,
      energy: energyScore,
      consistency: consistencyScore,
      factors,
      recommendation,
    };
  }

  /**
   * Calcule la fenêtre optimale d'entraînement
   */
  private async calculateOptimalWindow(
    userId: string,
    readinessScore: ReadinessScore
  ): Promise<OptimalWindow | undefined> {
    // Récupérer l'historique des heures d'entraînement
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('started_at, rpe_avg, enjoyment')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('started_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20);

    if (!sessions || sessions.length < 3) {
      return undefined;
    }

    // Analyser les patterns horaires
    const hourCounts: Record<number, { count: number; avgRpe: number; avgEnjoyment: number }> = {};

    sessions.forEach(session => {
      const hour = new Date(session.started_at).getHours();
      if (!hourCounts[hour]) {
        hourCounts[hour] = { count: 0, avgRpe: 0, avgEnjoyment: 0 };
      }
      hourCounts[hour].count++;
      hourCounts[hour].avgRpe += session.rpe_avg || 7;
      hourCounts[hour].avgEnjoyment += session.enjoyment || 5;
    });

    // Trouver l'heure la plus fréquente avec bonne performance
    let bestHour = 14; // Défaut: 14h
    let bestScore = 0;

    Object.entries(hourCounts).forEach(([hour, stats]) => {
      const frequency = stats.count / sessions.length;
      const avgRpe = stats.avgRpe / stats.count;
      const avgEnjoyment = stats.avgEnjoyment / stats.count;

      // Score composite: fréquence + performance (RPE bas + enjoyment haut)
      const score = (frequency * 0.5) + ((10 - avgRpe) / 10 * 0.25) + (avgEnjoyment / 10 * 0.25);

      if (score > bestScore) {
        bestScore = score;
        bestHour = parseInt(hour);
      }
    });

    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setHours(bestHour, 0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setHours(bestHour + 2, 0, 0, 0);

    // Ajuster si la fenêtre est déjà passée aujourd'hui
    if (windowEnd < now) {
      windowStart.setDate(windowStart.getDate() + 1);
      windowEnd.setDate(windowEnd.getDate() + 1);
    }

    const confidence: OptimalWindow['confidence'] =
      sessions.length >= 15 ? 'high' :
      sessions.length >= 8 ? 'medium' : 'low';

    return {
      start: windowStart,
      end: windowEnd,
      confidence,
      reasoning: `Basé sur vos ${sessions.length} dernières sessions, vous performez mieux vers ${bestHour}h`,
    };
  }

  /**
   * Calculer les stats d'aujourd'hui (training sessions uniquement)
   */
  private async getTodayTrainingStats(
    userId: string,
    startToday: Date,
    endToday: Date
  ): Promise<TodayTrainingContext['todayTrainingStats']> {
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('duration_actual_min, rpe_avg')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', startToday.toISOString())
      .lte('completed_at', endToday.toISOString());

    if (!sessions || sessions.length === 0) {
      return {
        totalCalories: 0,
        totalDuration: 0,
        sessionsCount: 0,
      };
    }

    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_actual_min || 0), 0);

    // Estimation calories: durée × RPE × facteur métabolique (environ 5-8 kcal/min selon intensité)
    const totalCalories = sessions.reduce((sum, s) => {
      const duration = s.duration_actual_min || 0;
      const rpe = s.rpe_avg || 7;
      const calorieRate = 5 + (rpe / 10) * 3; // 5-8 kcal/min selon RPE
      return sum + (duration * calorieRate);
    }, 0);

    return {
      totalCalories: Math.round(totalCalories),
      totalDuration,
      sessionsCount: sessions.length,
    };
  }

  /**
   * Mapper discipline vers coach type
   */
  private mapDisciplineToCoach(discipline: string): string {
    const mapping: Record<string, string> = {
      strength: 'force',
      powerlifting: 'force',
      bodybuilding: 'force',
      strongman: 'force',
      crossfit: 'functional',
      hiit: 'functional',
      functional: 'functional',
      circuit: 'functional',
      hyrox: 'competitions',
      'deka-fit': 'competitions',
      'deka-mile': 'competitions',
      'deka-strong': 'competitions',
      calisthenics: 'calisthenics',
      'street-workout': 'calisthenics',
      streetlifting: 'calisthenics',
      freestyle: 'calisthenics',
      running: 'endurance',
      cycling: 'endurance',
      swimming: 'endurance',
      triathlon: 'endurance',
      cardio: 'endurance',
    };

    return mapping[discipline] || 'force';
  }
}

export const trainingTodayDynamicService = new TrainingTodayDynamicService();

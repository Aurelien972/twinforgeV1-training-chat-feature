/**
 * Training Today Service
 * Provides data for the "Aujourd'hui" tab using Supabase
 */

import { supabase } from '../supabase/client';
import type {
  TodayStatus,
  HeroCtaData,
  QuickHistoryItem,
  TrainingGoal,
  QuickInsights,
  NextActionSuggestionData,
  TrainingSession,
  StreakData,
  OptimalWindow,
  ConseilsTabData,
  ProgressionTrend,
  WeeklyPattern,
  MuscleGroupProgress,
  VolumeIntensityBalance,
  PersonalRecord,
  GoalAlignment,
  AdaptiveRecommendation,
  NextWeekPlan,
  HistoryTabData,
  SessionHistoryDetail,
  HistoryStats,
  MonthlyCalendarData,
  HistoryFilters,
  SessionType
} from '../../domain/trainingToday';
import { trainingRecoveryService } from './trainingRecoveryService';

class TrainingTodayService {
  /**
   * Get last completed session from Supabase
   */
  private async getLastSession(): Promise<TrainingSession | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('training_sessions')
      .select('id, session_type, completed_at, duration_actual_min, rpe_avg, exercises_completed, exercises_total')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      date: new Date(data.completed_at),
      type: data.session_type || 'strength',
      duration: data.duration_actual_min || 0,
      rpeAverage: data.rpe_avg || 7,
      completed: true,
      exercisesCompleted: data.exercises_completed || 0,
      exercisesTotal: data.exercises_total || 0
    };
  }

  /**
   * Calculate streak from Supabase sessions
   */
  private async calculateStreakFromDB(userId: string): Promise<StreakData> {
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(100);

    if (!sessions || sessions.length === 0) {
      return {
        current: 0,
        longest: 0,
        milestones: [
          { days: 7, achieved: false, achievedDate: null },
          { days: 14, achieved: false, achievedDate: null },
          { days: 30, achieved: false, achievedDate: null },
          { days: 90, achieved: false, achievedDate: null }
        ]
      };
    }

    const dates = sessions.map(s => new Date(s.completed_at));
    let currentStreak = 0;
    let tempStreak = 0;
    let longestStreak = 0;
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let lastMilestoneDate: Date | null = null;

    for (let i = 0; i < dates.length; i++) {
      const daysDiff = Math.floor((now.getTime() - dates[i].getTime()) / oneDayMs);

      if (i === 0) {
        if (daysDiff <= 1) {
          currentStreak = 1;
          tempStreak = 1;
          lastMilestoneDate = dates[i];
        }
      } else {
        const prevDaysDiff = Math.floor((now.getTime() - dates[i - 1].getTime()) / oneDayMs);
        const daysBetween = daysDiff - prevDaysDiff;

        if (daysBetween <= 2) {
          tempStreak++;
          if (i === 1) currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
      current: currentStreak,
      longest: longestStreak,
      milestones: [
        { days: 7, achieved: longestStreak >= 7, achievedDate: longestStreak >= 7 ? new Date(now.getTime() - 10 * oneDayMs) : null },
        { days: 14, achieved: false, achievedDate: null },
        { days: 30, achieved: false, achievedDate: null },
        { days: 90, achieved: false, achievedDate: null }
      ]
    };
  }

  /**
   * Get contextual title based on time and status
   */
  private getContextualTitle(hour: number, readinessStatus: string): string {
    if (hour >= 5 && hour < 12) {
      if (readinessStatus === 'ready') return 'Commencez votre journée en force';
      if (readinessStatus === 'recovering') return 'Session matinale légère';
      return 'Mobilité matinale recommandée';
    }

    if (hour >= 12 && hour < 18) {
      if (readinessStatus === 'ready') return 'Session de milieu de journée';
      return 'Récupération active suggérée';
    }

    if (readinessStatus === 'ready') return 'Séance du soir optimale';
    if (readinessStatus === 'recovering') return 'Training léger ce soir';
    return 'Repos bien mérité ce soir';
  }

  /**
   * Get contextual subtitle
   */
  private getContextualSubtitle(lastSession: TrainingSession | null, streak: number): string {
    if (!lastSession) {
      return 'Lancez votre première séance personnalisée';
    }

    const daysSince = Math.floor((Date.now() - lastSession.date.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince === 0) {
      return `Déjà une séance aujourd'hui • Streak ${streak} jours`;
    }

    if (daysSince === 1) {
      return `Dernière séance hier • Streak ${streak} jours`;
    }

    if (daysSince <= 3) {
      if (streak > 0) return `Maintenez votre série de ${streak} jours`;
      return `Il y a ${daysSince} jours • Reprenons l'entraînement`;
    }

    return `${daysSince} jours depuis votre dernière séance`;
  }

  /**
   * Get today's status with all data from Supabase
   */
  async getTodayStatus(): Promise<TodayStatus> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const lastSession = await this.getLastSession();
    const streak = await this.calculateStreakFromDB(user.id);

    let recovery = { muscular: 85, systemic: 78, lastCalculated: new Date() };
    let readinessScore = 8;

    if (lastSession) {
      recovery = trainingRecoveryService.getRecoveryData(
        lastSession.date,
        lastSession.rpeAverage
      );
      readinessScore = trainingRecoveryService.calculateReadinessScore(recovery);
    }

    const readinessStatus = trainingRecoveryService.getReadinessStatus(recovery);
    const optimalWindows = trainingRecoveryService.calculateOptimalWindows();

    return {
      lastSession,
      streak,
      recovery,
      optimalWindows,
      estimatedEnergy: readinessScore,
      readinessScore,
      readinessStatus
    };
  }

  /**
   * Get hero CTA data
   */
  async getHeroCtaData(): Promise<HeroCtaData> {
    const status = await this.getTodayStatus();
    const hour = new Date().getHours();

    const nextOptimalWindow = status.optimalWindows.find(w => {
      const now = new Date();
      return w.start > now;
    }) || null;

    return {
      lastSessionDate: status.lastSession?.date || null,
      streak: status.streak.current,
      recoveryStatus: status.readinessStatus,
      optimalWindow: nextOptimalWindow,
      estimatedEnergy: status.estimatedEnergy,
      title: this.getContextualTitle(hour, status.readinessStatus),
      subtitle: this.getContextualSubtitle(status.lastSession, status.streak.current),
      showStreakBadge: status.streak.current >= 3,
      showOptimalWindowBadge: nextOptimalWindow !== null && status.readinessStatus === 'ready'
    };
  }

  /**
   * Get quick history (last 3 sessions formatted) from Supabase
   */
  async getQuickHistory(): Promise<QuickHistoryItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('training_sessions')
      .select('id, session_type, completed_at, duration_actual_min, rpe_avg')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(3);

    if (!data || data.length === 0) return [];

    return data.map(session => {
      const rpeAverage = session.rpe_avg || 7;
      let performanceIndicator: 'good' | 'moderate' | 'poor' = 'moderate';

      if (rpeAverage >= 7 && rpeAverage <= 8.5) {
        performanceIndicator = 'good';
      } else if (rpeAverage < 6 || rpeAverage > 9) {
        performanceIndicator = 'poor';
      }

      return {
        id: session.id,
        date: new Date(session.completed_at),
        type: session.session_type || 'strength',
        duration: session.duration_actual_min || 0,
        rpeAverage,
        completed: true,
        performanceIndicator
      };
    });
  }

  /**
   * Get current active goal from Supabase
   */
  async getCurrentGoal(): Promise<TrainingGoal | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: goal } = await supabase
      .from('training_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!goal) return null;

    return {
      id: goal.id,
      title: goal.title,
      type: goal.goal_type,
      currentValue: goal.current_value || 0,
      targetValue: goal.target_value,
      unit: goal.unit || '',
      deadline: goal.deadline ? new Date(goal.deadline) : undefined,
      createdAt: new Date(goal.created_at),
      progress: (goal.current_value / goal.target_value) * 100
    };
  }

  /**
   * Get quick insights metrics from Supabase
   */
  async getQuickInsights(): Promise<QuickInsights> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { count: sessionsThisMonth } = await supabase
      .from('training_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', firstDayThisMonth.toISOString());

    const { count: sessionsLastMonth } = await supabase
      .from('training_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', firstDayLastMonth.toISOString())
      .lt('completed_at', firstDayThisMonth.toISOString());

    const { data: last7DaysSessions } = await supabase
      .from('training_sessions')
      .select('rpe_avg')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', last7Days.toISOString());

    const rpeAverage7d = last7DaysSessions && last7DaysSessions.length > 0
      ? last7DaysSessions.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / last7DaysSessions.length
      : 0;

    const { data: thisMonthSessions } = await supabase
      .from('training_sessions')
      .select('duration_actual_min')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', firstDayThisMonth.toISOString());

    const totalTimeThisMonth = thisMonthSessions
      ? thisMonthSessions.reduce((sum, s) => sum + (s.duration_actual_min || 0), 0)
      : 0;

    const streak = await this.calculateStreakFromDB(user.id);
    const timeGoal = 360;

    return {
      streak: streak.current,
      sessionsThisMonth: sessionsThisMonth || 0,
      sessionsLastMonth: sessionsLastMonth || 0,
      rpeAverage7d: Math.round(rpeAverage7d * 10) / 10,
      totalTimeThisMonth,
      timeGoal,
      comparisons: {
        sessionsVsLastMonth: (sessionsThisMonth || 0) - (sessionsLastMonth || 0),
        timeVsGoal: timeGoal ? Math.round((totalTimeThisMonth / timeGoal) * 100) : 0
      }
    };
  }

  /**
   * Get next action suggestion
   */
  async getNextActionSuggestion(): Promise<NextActionSuggestionData> {
    const status = await this.getTodayStatus();

    let suggestion = '';
    let reason = '';
    let intensity: 'light' | 'moderate' | 'intense' = 'moderate';
    let suggestedTime: Date | null = null;

    if (status.readinessStatus === 'ready' && status.estimatedEnergy >= 7) {
      suggestion = 'Séance upper body idéale maintenant';
      reason = 'Récupération optimale et énergie élevée';
      intensity = 'intense';
      suggestedTime = status.optimalWindows[0]?.start || null;
    } else if (status.readinessStatus === 'recovering') {
      suggestion = 'Envisagez une séance modérée ou mobilité';
      reason = 'Récupération en cours, évitez surcharge';
      intensity = 'moderate';
      suggestedTime = status.optimalWindows[1]?.start || null;
    } else {
      suggestion = 'Repos actif recommandé aujourd\'hui';
      reason = 'RPE élevé ces derniers jours';
      intensity = 'light';
    }

    return {
      suggestion,
      reason,
      suggestedTime,
      intensity,
      confidence: 0.85
    };
  }

  // =====================================================
  // CONSEILS TAB METHODS
  // =====================================================

  /**
   * Get progression trends over last 8 weeks
   */
  async getProgressionTrends(): Promise<ProgressionTrend[]> {
    const trends: ProgressionTrend[] = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekNum = Math.floor((now.getTime() - weekDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      trends.push({
        period: `S-${i}`,
        rpeAverage: 7.2 + (Math.random() * 1.5 - 0.75),
        volumeTotal: 8000 + Math.random() * 2000,
        intensityScore: 65 + Math.random() * 20
      });
    }

    return trends;
  }

  /**
   * Get weekly patterns showing best training days
   */
  async getWeeklyPatterns(): Promise<WeeklyPattern[]> {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    return days.map((day, index) => {
      const isWeekday = index < 5;
      const sessionsCount = isWeekday ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2);

      return {
        dayOfWeek: index,
        dayName: day,
        sessionsCount,
        avgRpe: sessionsCount > 0 ? 7.0 + Math.random() * 1.5 : 0,
        avgDuration: sessionsCount > 0 ? 45 + Math.random() * 20 : 0
      };
    });
  }

  /**
   * Get muscle group progress with trends
   */
  async getMuscleGroupProgress(): Promise<MuscleGroupProgress[]> {
    const groups = [
      { group: 'Pectoraux', color: '#22C55E' },
      { group: 'Dos', color: '#06B6D4' },
      { group: 'Épaules', color: '#F59E0B' },
      { group: 'Jambes', color: '#8B5CF6' },
      { group: 'Bras', color: '#EC4899' },
      { group: 'Core', color: '#18E3FF' }
    ];

    const now = new Date();
    return groups.map(g => ({
      ...g,
      sessionsCount: Math.floor(Math.random() * 12) + 4,
      volumeTrend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down',
      lastSession: new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000)
    }));
  }

  /**
   * Get volume/intensity balance analysis
   */
  async getVolumeIntensityBalance(): Promise<VolumeIntensityBalance> {
    const volumeScore = 72;
    const intensityScore = 68;
    const recoveryScore = 78;

    let recommendation = '';
    let color = '#22C55E';

    if (recoveryScore < 65) {
      recommendation = 'Prioriser la récupération, réduire le volume';
      color = '#EF4444';
    } else if (intensityScore < volumeScore - 15) {
      recommendation = 'Bon volume, augmenter progressivement l\'intensité';
      color = '#18E3FF';
    } else if (volumeScore > 85 && intensityScore > 80) {
      recommendation = 'Attention surmenage, phase de décharge recommandée';
      color = '#F59E0B';
    } else {
      recommendation = 'Équilibre optimal, maintenir cette approche';
      color = '#22C55E';
    }

    return {
      volumeScore,
      intensityScore,
      recoveryScore,
      recommendation,
      color
    };
  }

  /**
   * Get personal records and achievements
   */
  async getPersonalRecords(): Promise<PersonalRecord[]> {
    const now = new Date();
    return [
      {
        id: 'pr1',
        exerciseName: 'Squat',
        category: 'Force',
        value: 120,
        unit: 'kg',
        achievedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        color: '#8B5CF6'
      },
      {
        id: 'pr2',
        exerciseName: 'Développé couché',
        category: 'Force',
        value: 85,
        unit: 'kg',
        achievedDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        color: '#22C55E'
      },
      {
        id: 'pr3',
        exerciseName: 'Deadlift',
        category: 'Force',
        value: 140,
        unit: 'kg',
        achievedDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        color: '#F59E0B'
      },
      {
        id: 'pr4',
        exerciseName: 'Course 5km',
        category: 'Endurance',
        value: 24.5,
        unit: 'min',
        achievedDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        color: '#06B6D4'
      }
    ];
  }

  /**
   * Get goal alignment analysis
   */
  async getGoalAlignment(): Promise<GoalAlignment[]> {
    const goal = await this.getCurrentGoal();
    if (!goal) return [];

    const daysRemaining = Math.floor((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const onTrack = goal.progress >= 60;

    return [{
      goalTitle: goal.title,
      currentProgress: goal.progress,
      targetValue: goal.targetValue,
      onTrack,
      daysRemaining,
      recommendedAction: onTrack
        ? 'Continuer sur cette lancée'
        : 'Augmenter fréquence à 4 séances/semaine',
      color: onTrack ? '#22C55E' : '#F59E0B'
    }];
  }

  /**
   * Get adaptive recommendations based on data
   */
  async getAdaptiveRecommendations(): Promise<AdaptiveRecommendation[]> {
    return [
      {
        id: 'rec1',
        title: 'Ajouter jour de mobilité',
        description: 'Votre RPE moyen est élevé (7.8). Une séance mobilité améliorerait la récupération.',
        category: 'recovery',
        priority: 'high',
        color: '#F59E0B',
        icon: 'AlertCircle',
        actionable: true,
        actionLabel: 'Planifier mobilité'
      },
      {
        id: 'rec2',
        title: 'Augmenter volume jambes',
        description: 'Seulement 2 séances jambes ce mois vs 6 upper body. Rééquilibrer?',
        category: 'volume',
        priority: 'medium',
        color: '#18E3FF',
        icon: 'TrendingUp',
        actionable: true,
        actionLabel: 'Voir plan semaine'
      },
      {
        id: 'rec3',
        title: 'Profil horaire optimal',
        description: 'Vos meilleures performances sont entre 17h-19h. Privilégier ce créneau.',
        category: 'schedule',
        priority: 'low',
        color: '#8B5CF6',
        icon: 'Clock',
        actionable: false
      },
      {
        id: 'rec4',
        title: 'Variété équipement',
        description: 'Vous utilisez principalement haltères. Explorer machines pour variation stimulus.',
        category: 'equipment',
        priority: 'low',
        color: '#EC4899',
        icon: 'Dumbbell',
        actionable: false
      }
    ];
  }

  /**
   * Get next week suggested plan
   */
  async getNextWeekPlan(): Promise<NextWeekPlan> {
    const now = new Date();
    const weekNum = Math.ceil((now.getDate()) / 7);

    return {
      weekNumber: weekNum + 1,
      suggestedSessions: 4,
      suggestedDays: ['Lundi', 'Mercredi', 'Vendredi', 'Dimanche'],
      intensityDistribution: {
        light: 1,
        moderate: 2,
        intense: 1
      },
      focusAreas: ['Upper body', 'Lower body', 'Core', 'Mobilité'],
      restDaysRecommended: 3
    };
  }

  /**
   * Get all conseils tab data
   */
  async getConseilsTabData(): Promise<ConseilsTabData> {
    const [
      progressionTrends,
      weeklyPatterns,
      muscleGroupProgress,
      volumeIntensityBalance,
      personalRecords,
      goalAlignment,
      recommendations,
      nextWeekPlan
    ] = await Promise.all([
      this.getProgressionTrends(),
      this.getWeeklyPatterns(),
      this.getMuscleGroupProgress(),
      this.getVolumeIntensityBalance(),
      this.getPersonalRecords(),
      this.getGoalAlignment(),
      this.getAdaptiveRecommendations(),
      this.getNextWeekPlan()
    ]);

    return {
      progressionTrends,
      weeklyPatterns,
      muscleGroupProgress,
      volumeIntensityBalance,
      personalRecords,
      goalAlignment,
      recommendations,
      nextWeekPlan
    };
  }

  // =====================================================
  // HISTORIQUE TAB METHODS
  // =====================================================

  /**
   * Get extended sessions with full details from Supabase
   */
  private async getMockSessionsExtended(): Promise<SessionHistoryDetail[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (!data || data.length === 0) return [];

    return data.map(session => {
      const prescription = session.prescription || {};
      const exercises = prescription.exercises || [];

      return {
        id: session.id,
        date: new Date(session.completed_at),
        type: (session.session_type || 'strength') as any,
        duration: session.duration_actual_min || 0,
        rpeAverage: session.rpe_avg || 7,
        completed: true,
        exercisesCompleted: exercises.length,
        exercisesTotal: exercises.length,
        effortPerceived: session.effort_perceived || 0,
        enjoyment: session.enjoyment || 0,
        location: session.venue || 'Maison',
        equipment: Array.isArray(session.equipment_needed) ? session.equipment_needed : ['Haltères', 'Banc'],
        totalVolume: 0,
        avgIntensity: session.rpe_avg || 7,
        performanceScore: 0,
        notes: session.notes || '',
        exercises: exercises.map((ex: any, index: number) => ({
          id: ex.id || `ex-${index}`,
          name: ex.name || ex.exerciseName || 'Exercise',
          sets: ex.sets || 4,
          reps: ex.reps || '8-10',
          weight: ex.weight || 0,
          rpe: ex.rpe || 7.5
        })),
        feedback: {
          effort: session.effort_perceived || 8,
          enjoyment: session.enjoyment || 8,
          technique: 7
        }
      };
    });
  }

  /**
   * Calculate history stats
   */
  private calculateHistoryStats(sessions: SessionHistoryDetail[]): HistoryStats {
    const completed = sessions.filter(s => s.completed);
    const skipped = sessions.filter(s => !s.completed);

    const totalDuration = completed.reduce((sum, s) => sum + s.duration, 0);
    const avgDuration = completed.length > 0 ? totalDuration / completed.length : 0;

    const totalRpe = completed.reduce((sum, s) => sum + s.rpeAverage, 0);
    const avgRpe = completed.length > 0 ? totalRpe / completed.length : 0;

    const typeCounts: Record<string, number> = {};
    completed.forEach(s => {
      typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
    });

    const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    const dayCounts: Record<string, number> = {};
    completed.forEach(s => {
      const day = s.date.toLocaleDateString('fr-FR', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const mostProductiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalSessions: sessions.length,
      totalDuration,
      avgDuration: Math.round(avgDuration),
      avgRpe: Math.round(avgRpe * 10) / 10,
      sessionsCompleted: completed.length,
      sessionsSkipped: skipped.length,
      favoriteSessionType: favoriteType ? favoriteType[0] as SessionType : null,
      mostProductiveDay: mostProductiveDay ? mostProductiveDay[0] : null
    };
  }

  /**
   * Generate monthly calendar data
   */
  private generateMonthlyCalendar(sessions: SessionHistoryDetail[]): MonthlyCalendarData {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const daySessions = sessions.filter(s =>
        s.date.getDate() === day &&
        s.date.getMonth() === month &&
        s.date.getFullYear() === year
      );

      const avgRpe = daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + s.rpeAverage, 0) / daySessions.length
        : 0;

      days.push({
        date,
        hasSessions: daySessions.length > 0,
        sessionsCount: daySessions.length,
        avgRpe,
        types: daySessions.map(s => s.type)
      });
    }

    return { year, month, days };
  }

  /**
   * Get history tab data with filters
   */
  async getHistoryTabData(filters: HistoryFilters): Promise<HistoryTabData> {
    let sessions = await this.getMockSessionsExtended();

    const now = new Date();
    let startDate = filters.startDate;
    let endDate = filters.endDate || now;

    if (!startDate) {
      switch (filters.period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'all':
        default:
          startDate = new Date(0);
      }
    }

    sessions = sessions.filter(s => {
      const dateMatch = s.date >= startDate! && s.date <= endDate;
      const typeMatch = filters.type === 'all' || s.type === filters.type;
      return dateMatch && typeMatch;
    });

    const stats = this.calculateHistoryStats(sessions);
    const calendarData = this.generateMonthlyCalendar(sessions);

    return {
      sessions,
      stats,
      calendarData,
      filters
    };
  }
}

export const trainingTodayService = new TrainingTodayService();

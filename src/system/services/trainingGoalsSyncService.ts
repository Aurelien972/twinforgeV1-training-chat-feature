import { supabase } from '../supabase/client';
import { trainingGoalsRepository, TrainingGoal } from '../repositories/trainingGoalsRepository';
import logger from '../../lib/utils/logger';

interface ActivityMetrics {
  id: string;
  user_id: string;
  timestamp: string;
  type: string;
  duration_min?: number;
  distance_meters?: number;
  calories_est?: number;
  vo2max_estimated?: number;
  training_load_score?: number;
  avg_power_watts?: number;
  efficiency_score?: number;
}

interface GoalSyncResult {
  goal_id: string;
  updated: boolean;
  old_value: number;
  new_value: number;
  progress_percentage: number;
}

class TrainingGoalsSyncService {
  async syncActivityWithGoals(activityId: string, userId: string): Promise<GoalSyncResult[]> {
    try {
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (activityError) throw activityError;
      if (!activity) {
        logger.warn('GOALS_SYNC', 'Activity not found', { activityId, userId });
        return [];
      }

      const activeGoals = await trainingGoalsRepository.getActiveGoals(userId);
      const results: GoalSyncResult[] = [];

      for (const goal of activeGoals) {
        const syncResult = await this.syncGoalWithActivity(goal, activity);
        if (syncResult) {
          results.push(syncResult);
        }
      }

      logger.info('GOALS_SYNC', 'Activity synced with goals', { activityId, userId, goalsUpdated: results.length });
      return results;
    } catch (error) {
      logger.error('GOALS_SYNC', 'Failed to sync activity with goals', { error, activityId, userId });
      throw error;
    }
  }

  private async syncGoalWithActivity(goal: TrainingGoal, activity: ActivityMetrics): Promise<GoalSyncResult | null> {
    try {
      const valueToAdd = this.extractValueFromActivity(goal, activity);
      if (valueToAdd === null || valueToAdd === 0) {
        return null;
      }

      const newValue = goal.current_value + valueToAdd;
      const updatedGoal = await trainingGoalsRepository.updateGoalProgress(goal.id, goal.user_id, newValue);

      const progressResult = trainingGoalsRepository.calculateProgress(updatedGoal);

      return {
        goal_id: goal.id,
        updated: true,
        old_value: goal.current_value,
        new_value: newValue,
        progress_percentage: progressResult.progress_percentage,
      };
    } catch (error) {
      logger.error('GOALS_SYNC', 'Failed to sync goal with activity', { error, goalId: goal.id });
      return null;
    }
  }

  private extractValueFromActivity(goal: TrainingGoal, activity: ActivityMetrics): number | null {
    switch (goal.goal_type) {
      case 'volume':
        if (goal.unit === 'minutes' || goal.unit === 'min') {
          return activity.duration_min || 0;
        }
        if (goal.unit === 'sessions') {
          return 1;
        }
        return 0;

      case 'distance':
        if (activity.distance_meters && (goal.unit === 'km' || goal.unit === 'kilometers')) {
          return activity.distance_meters / 1000;
        }
        if (activity.distance_meters && (goal.unit === 'm' || goal.unit === 'meters')) {
          return activity.distance_meters;
        }
        return 0;

      case 'endurance':
        if (goal.unit === 'vo2max' && activity.vo2max_estimated) {
          return activity.vo2max_estimated - goal.current_value;
        }
        return 0;

      case 'strength':
        if (goal.unit === 'sessions' && this.isStrengthActivity(activity.type)) {
          return 1;
        }
        if (goal.unit === 'total_load' && activity.training_load_score) {
          return activity.training_load_score;
        }
        return 0;

      case 'frequency':
        if (goal.unit === 'sessions_per_week') {
          return 1;
        }
        return 0;

      case 'weight':
        return 0;

      case 'custom':
        return 0;

      default:
        return 0;
    }
  }

  private isStrengthActivity(activityType: string): boolean {
    const strengthTypes = ['musculation', 'force', 'strength', 'weightlifting', 'powerlifting', 'crossfit'];
    return strengthTypes.some(type => activityType.toLowerCase().includes(type));
  }

  async recalculateGoalProgress(goalId: string, userId: string): Promise<GoalSyncResult | null> {
    try {
      const goal = await trainingGoalsRepository.getGoalById(goalId, userId);
      if (!goal) {
        logger.warn('GOALS_SYNC', 'Goal not found for recalculation', { goalId, userId });
        return null;
      }

      const since = new Date(goal.created_at);
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      let totalValue = 0;
      for (const activity of activities || []) {
        const value = this.extractValueFromActivity(goal, activity);
        if (value !== null) {
          totalValue += value;
        }
      }

      if (goal.goal_type === 'vo2max' && activities && activities.length > 0) {
        const validActivities = activities.filter(a => a.vo2max_estimated);
        if (validActivities.length > 0) {
          const latestVO2Max = validActivities[validActivities.length - 1].vo2max_estimated;
          totalValue = latestVO2Max || 0;
        }
      }

      const updatedGoal = await trainingGoalsRepository.updateGoalProgress(goalId, userId, totalValue);
      const progressResult = trainingGoalsRepository.calculateProgress(updatedGoal);

      logger.info('GOALS_SYNC', 'Goal progress recalculated', { goalId, userId, totalValue });

      return {
        goal_id: goalId,
        updated: true,
        old_value: goal.current_value,
        new_value: totalValue,
        progress_percentage: progressResult.progress_percentage,
      };
    } catch (error) {
      logger.error('GOALS_SYNC', 'Failed to recalculate goal progress', { error, goalId, userId });
      throw error;
    }
  }

  async recalculateAllGoals(userId: string): Promise<GoalSyncResult[]> {
    try {
      const activeGoals = await trainingGoalsRepository.getActiveGoals(userId);
      const results: GoalSyncResult[] = [];

      for (const goal of activeGoals) {
        const result = await this.recalculateGoalProgress(goal.id, userId);
        if (result) {
          results.push(result);
        }
      }

      logger.info('GOALS_SYNC', 'All goals recalculated', { userId, goalsRecalculated: results.length });
      return results;
    } catch (error) {
      logger.error('GOALS_SYNC', 'Failed to recalculate all goals', { error, userId });
      throw error;
    }
  }

  async checkAndCompleteGoals(userId: string): Promise<TrainingGoal[]> {
    try {
      const activeGoals = await trainingGoalsRepository.getActiveGoals(userId);
      const completedGoals: TrainingGoal[] = [];

      for (const goal of activeGoals) {
        if (goal.current_value >= goal.target_value) {
          const completed = await trainingGoalsRepository.completeGoal(goal.id, userId);
          completedGoals.push(completed);
          logger.info('GOALS_SYNC', 'Goal auto-completed', { goalId: goal.id, userId });
        }
      }

      return completedGoals;
    } catch (error) {
      logger.error('GOALS_SYNC', 'Failed to check and complete goals', { error, userId });
      throw error;
    }
  }

  async getGoalsProgress(userId: string) {
    try {
      const activeGoals = await trainingGoalsRepository.getActiveGoals(userId);
      return activeGoals.map(goal => trainingGoalsRepository.calculateProgress(goal));
    } catch (error) {
      logger.error('GOALS_SYNC', 'Failed to get goals progress', { error, userId });
      throw error;
    }
  }

  async suggestGoalsBasedOnHistory(userId: string, days: number = 90): Promise<TrainingGoal[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', since.toISOString());

      if (error) throw error;
      if (!activities || activities.length === 0) return [];

      const suggestions: TrainingGoal[] = [];

      const totalDuration = activities.reduce((sum, a) => sum + (a.duration_min || 0), 0);
      const avgWeeklyDuration = (totalDuration / days) * 7;
      const suggestedWeeklyMinutes = Math.ceil(avgWeeklyDuration * 1.2);

      const totalDistance = activities.reduce((sum, a) => sum + (a.distance_meters || 0), 0);
      if (totalDistance > 0) {
        const avgWeeklyDistance = ((totalDistance / 1000) / days) * 7;
        const suggestedWeeklyKm = Math.ceil(avgWeeklyDistance * 1.2);

        suggestions.push({
          id: '',
          user_id: userId,
          title: `Parcourir ${suggestedWeeklyKm}km par semaine`,
          goal_type: 'distance',
          target_value: suggestedWeeklyKm * 4,
          current_value: 0,
          unit: 'km',
          status: 'active',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const vo2maxActivities = activities.filter(a => a.vo2max_estimated);
      if (vo2maxActivities.length > 0) {
        const latestVO2Max = vo2maxActivities[vo2maxActivities.length - 1].vo2max_estimated;
        const suggestedVO2Max = Math.ceil((latestVO2Max || 0) * 1.05);

        suggestions.push({
          id: '',
          user_id: userId,
          title: `Atteindre VO2max de ${suggestedVO2Max}`,
          goal_type: 'endurance',
          target_value: suggestedVO2Max,
          current_value: latestVO2Max || 0,
          unit: 'vo2max',
          status: 'active',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      logger.info('GOALS_SYNC', 'Goal suggestions generated', { userId, suggestionsCount: suggestions.length });
      return suggestions;
    } catch (error) {
      logger.error('GOALS_SYNC', 'Failed to suggest goals', { error, userId });
      throw error;
    }
  }
}

export const trainingGoalsSyncService = new TrainingGoalsSyncService();

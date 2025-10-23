import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';

export interface TrainingGoal {
  id: string;
  user_id: string;
  title: string;
  goal_type: 'volume' | 'strength' | 'endurance' | 'weight' | 'frequency' | 'distance' | 'vo2max' | 'custom';
  target_value: number;
  current_value: number;
  unit: string;
  discipline?: string;
  deadline?: string;
  status: 'active' | 'completed' | 'abandoned';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  title: string;
  goal_type: TrainingGoal['goal_type'];
  target_value: number;
  current_value?: number;
  unit: string;
  discipline?: string;
  deadline?: string;
}

export interface UpdateGoalInput {
  title?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  discipline?: string;
  deadline?: string;
  status?: TrainingGoal['status'];
  is_active?: boolean;
}

export interface GoalProgressResult {
  goal: TrainingGoal;
  progress_percentage: number;
  remaining: number;
  estimated_completion_date?: string;
  on_track: boolean;
}

class TrainingGoalsRepository {
  async getActiveGoals(userId: string): Promise<TrainingGoal[]> {
    try {
      const { data, error } = await supabase
        .from('training_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to fetch active goals', { error, userId });
      throw error;
    }
  }

  async getAllGoals(userId: string): Promise<TrainingGoal[]> {
    try {
      const { data, error } = await supabase
        .from('training_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to fetch all goals', { error, userId });
      throw error;
    }
  }

  async getGoalById(goalId: string, userId: string): Promise<TrainingGoal | null> {
    try {
      const { data, error } = await supabase
        .from('training_goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to fetch goal by id', { error, goalId, userId });
      throw error;
    }
  }

  async createGoal(userId: string, input: CreateGoalInput): Promise<TrainingGoal> {
    try {
      const { data, error } = await supabase
        .from('training_goals')
        .insert({
          user_id: userId,
          title: input.title,
          goal_type: input.goal_type,
          target_value: input.target_value,
          current_value: input.current_value || 0,
          unit: input.unit,
          discipline: input.discipline,
          deadline: input.deadline,
          status: 'active',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('TRAINING_GOALS_REPO', 'Goal created successfully', { goalId: data.id, userId });
      return data;
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to create goal', { error, userId, input });
      throw error;
    }
  }

  async updateGoal(goalId: string, userId: string, updates: UpdateGoalInput): Promise<TrainingGoal> {
    try {
      const { data, error } = await supabase
        .from('training_goals')
        .update(updates)
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      logger.info('TRAINING_GOALS_REPO', 'Goal updated successfully', { goalId, userId });
      return data;
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to update goal', { error, goalId, userId, updates });
      throw error;
    }
  }

  async updateGoalProgress(goalId: string, userId: string, newValue: number): Promise<TrainingGoal> {
    try {
      const { data, error } = await supabase
        .from('training_goals')
        .update({ current_value: newValue })
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      logger.info('TRAINING_GOALS_REPO', 'Goal progress updated', { goalId, userId, newValue });
      return data;
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to update goal progress', { error, goalId, userId, newValue });
      throw error;
    }
  }

  async deleteGoal(goalId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', userId);

      if (error) throw error;

      logger.info('TRAINING_GOALS_REPO', 'Goal deleted successfully', { goalId, userId });
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to delete goal', { error, goalId, userId });
      throw error;
    }
  }

  async completeGoal(goalId: string, userId: string): Promise<TrainingGoal> {
    return this.updateGoal(goalId, userId, {
      status: 'completed',
      is_active: false,
    });
  }

  async abandonGoal(goalId: string, userId: string): Promise<TrainingGoal> {
    return this.updateGoal(goalId, userId, {
      status: 'abandoned',
      is_active: false,
    });
  }

  async reactivateGoal(goalId: string, userId: string): Promise<TrainingGoal> {
    return this.updateGoal(goalId, userId, {
      status: 'active',
      is_active: true,
    });
  }

  async getGoalsByDiscipline(userId: string, discipline: string): Promise<TrainingGoal[]> {
    try {
      const { data, error } = await supabase
        .from('training_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('discipline', discipline)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to fetch goals by discipline', { error, userId, discipline });
      throw error;
    }
  }

  async getGoalsByType(userId: string, goalType: TrainingGoal['goal_type']): Promise<TrainingGoal[]> {
    try {
      const { data, error } = await supabase
        .from('training_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_type', goalType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to fetch goals by type', { error, userId, goalType });
      throw error;
    }
  }

  async getExpiredGoals(userId: string): Promise<TrainingGoal[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('training_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lt('deadline', now)
        .order('deadline', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to fetch expired goals', { error, userId });
      throw error;
    }
  }

  async getGoalsNearingDeadline(userId: string, daysThreshold: number = 7): Promise<TrainingGoal[]> {
    try {
      const now = new Date();
      const threshold = new Date(now);
      threshold.setDate(threshold.getDate() + daysThreshold);

      const { data, error } = await supabase
        .from('training_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('deadline', now.toISOString())
        .lte('deadline', threshold.toISOString())
        .order('deadline', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('TRAINING_GOALS_REPO', 'Failed to fetch goals nearing deadline', { error, userId, daysThreshold });
      throw error;
    }
  }

  calculateProgress(goal: TrainingGoal): GoalProgressResult {
    const progressPercentage = (goal.current_value / goal.target_value) * 100;
    const remaining = goal.target_value - goal.current_value;

    let estimatedCompletionDate: string | undefined;
    let onTrack = true;

    if (goal.deadline && goal.current_value > 0) {
      const deadlineDate = new Date(goal.deadline);
      const now = new Date();
      const daysUntilDeadline = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      const daysElapsed = Math.floor((now.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const totalDays = Math.floor((deadlineDate.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24));

      if (daysElapsed > 0 && totalDays > 0) {
        const expectedProgress = (daysElapsed / totalDays) * 100;
        onTrack = progressPercentage >= expectedProgress * 0.8;

        const dailyRate = goal.current_value / daysElapsed;
        const remainingDays = remaining / dailyRate;
        const estimatedDate = new Date(now);
        estimatedDate.setDate(estimatedDate.getDate() + remainingDays);
        estimatedCompletionDate = estimatedDate.toISOString();
      }
    }

    return {
      goal,
      progress_percentage: Math.min(progressPercentage, 100),
      remaining: Math.max(remaining, 0),
      estimated_completion_date: estimatedCompletionDate,
      on_track: onTrack,
    };
  }
}

export const trainingGoalsRepository = new TrainingGoalsRepository();

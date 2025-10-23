/**
 * useTrainingGoals Hook
 * Hook pour gérer les objectifs SMART dans Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../system/supabase/client';
import { useUserStore } from '../system/store/userStore';
import logger from '../lib/utils/logger';

export interface TrainingGoal {
  id: string;
  user_id: string;
  name: string;
  description: string;
  current_value?: number;
  target_value: number;
  unit: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
  is_achieved: boolean;
  achieved_at?: string;
}

export interface CreateGoalInput {
  name: string;
  description?: string;
  current_value?: number;
  target_value: number;
  unit: string;
  deadline?: string;
}

export interface UpdateGoalInput {
  name?: string;
  description?: string;
  current_value?: number;
  target_value?: number;
  unit?: string;
  deadline?: string;
  is_achieved?: boolean;
}

export function useTrainingGoals() {
  const { user } = useUserStore();
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user?.id) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('training_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setGoals(data || []);
      logger.info('TRAINING_GOALS', 'Goals fetched successfully', {
        count: data?.length || 0
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch goals';
      setError(errorMessage);
      logger.error('TRAINING_GOALS', 'Failed to fetch goals', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(async (goalData: CreateGoalInput): Promise<TrainingGoal> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('training_goals')
        .insert({
          user_id: user.id,
          name: goalData.name,
          description: goalData.description || '',
          current_value: goalData.current_value,
          target_value: goalData.target_value,
          unit: goalData.unit,
          deadline: goalData.deadline,
          is_achieved: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      logger.info('TRAINING_GOALS', 'Goal created successfully', {
        goalId: data.id,
        goalName: data.name
      });

      await fetchGoals();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create goal';
      logger.error('TRAINING_GOALS', 'Failed to create goal', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }, [user?.id, fetchGoals]);

  const updateGoal = useCallback(async (goalId: string, updates: UpdateGoalInput): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (updates.is_achieved && !updates.achieved_at) {
        updateData.achieved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('training_goals')
        .update(updateData)
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      logger.info('TRAINING_GOALS', 'Goal updated successfully', {
        goalId
      });

      await fetchGoals();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update goal';
      logger.error('TRAINING_GOALS', 'Failed to update goal', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }, [user?.id, fetchGoals]);

  const deleteGoal = useCallback(async (goalId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('training_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      logger.info('TRAINING_GOALS', 'Goal deleted successfully', {
        goalId
      });

      await fetchGoals();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete goal';
      logger.error('TRAINING_GOALS', 'Failed to delete goal', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }, [user?.id, fetchGoals]);

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals
  };
}

/**
 * Training Drafts Service
 * Service pour gérer les trainings sauvegardés en mode draft
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';

export interface TrainingDraft {
  id: string;
  userId: string;
  sessionType: string;
  customName: string | null;
  prescription: any; // SessionPrescription type
  context: any; // PreparerData type
  durationTarget: number;
  equipmentNeeded: string[];
  venue: string | null;
  createdAt: string;
  expiresAt: string;
  daysUntilExpiration: number;
}

class TrainingDraftsService {
  /**
   * Get all active drafts for current user
   */
  async getUserDrafts(): Promise<TrainingDraft[]> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error('TRAINING_DRAFTS', 'User not authenticated', {
          error: userError?.message
        });
        return [];
      }

      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .gt('draft_expires_at', new Date().toISOString())
        .order('draft_saved_at', { ascending: false });

      if (error) {
        logger.error('TRAINING_DRAFTS', 'Failed to fetch drafts', {
          error: error.message
        });
        return [];
      }

      if (!data || data.length === 0) {
        logger.info('TRAINING_DRAFTS', 'No active drafts found');
        return [];
      }

      // Transform database records to TrainingDraft format
      const drafts: TrainingDraft[] = data.map(record => {
        const expiresAt = new Date(record.draft_expires_at);
        const now = new Date();
        const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: record.id,
          userId: record.user_id,
          sessionType: record.session_type || record.type,
          customName: record.custom_name,
          prescription: record.prescription,
          context: record.context,
          durationTarget: record.duration_target_min,
          equipmentNeeded: record.equipment_needed || [],
          venue: record.venue,
          createdAt: record.draft_saved_at || record.created_at,
          expiresAt: record.draft_expires_at,
          daysUntilExpiration
        };
      });

      logger.info('TRAINING_DRAFTS', 'Fetched active drafts', {
        count: drafts.length
      });

      return drafts;
    } catch (error) {
      logger.error('TRAINING_DRAFTS', 'Exception fetching drafts', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get a specific draft by ID
   */
  async getDraftById(draftId: string): Promise<TrainingDraft | null> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error('TRAINING_DRAFTS', 'User not authenticated');
        return null;
      }

      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', draftId)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .maybeSingle();

      if (error) {
        logger.error('TRAINING_DRAFTS', 'Failed to fetch draft by ID', {
          draftId,
          error: error.message
        });
        return null;
      }

      if (!data) {
        logger.warn('TRAINING_DRAFTS', 'Draft not found', { draftId });
        return null;
      }

      const expiresAt = new Date(data.draft_expires_at);
      const now = new Date();
      const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: data.id,
        userId: data.user_id,
        sessionType: data.session_type || data.type,
        customName: data.custom_name,
        prescription: data.prescription,
        context: data.context,
        durationTarget: data.duration_target_min,
        equipmentNeeded: data.equipment_needed || [],
        venue: data.venue,
        createdAt: data.draft_saved_at || data.created_at,
        expiresAt: data.draft_expires_at,
        daysUntilExpiration
      };
    } catch (error) {
      logger.error('TRAINING_DRAFTS', 'Exception fetching draft by ID', {
        draftId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: string): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error('TRAINING_DRAFTS', 'User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', draftId)
        .eq('user_id', user.id)
        .eq('status', 'draft');

      if (error) {
        logger.error('TRAINING_DRAFTS', 'Failed to delete draft', {
          draftId,
          error: error.message
        });
        return false;
      }

      logger.info('TRAINING_DRAFTS', 'Draft deleted successfully', { draftId });
      return true;
    } catch (error) {
      logger.error('TRAINING_DRAFTS', 'Exception deleting draft', {
        draftId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Delete all expired drafts for current user
   */
  async cleanupExpiredDrafts(): Promise<number> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error('TRAINING_DRAFTS', 'User not authenticated');
        return 0;
      }

      const { data, error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .lt('draft_expires_at', new Date().toISOString())
        .select();

      if (error) {
        logger.error('TRAINING_DRAFTS', 'Failed to cleanup expired drafts', {
          error: error.message
        });
        return 0;
      }

      const deletedCount = data?.length || 0;

      if (deletedCount > 0) {
        logger.info('TRAINING_DRAFTS', 'Expired drafts cleaned up', {
          deletedCount
        });
      }

      return deletedCount;
    } catch (error) {
      logger.error('TRAINING_DRAFTS', 'Exception cleaning up expired drafts', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Get draft count for current user
   */
  async getDraftCount(): Promise<number> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return 0;
      }

      const { count, error } = await supabase
        .from('training_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .gt('draft_expires_at', new Date().toISOString());

      if (error) {
        logger.error('TRAINING_DRAFTS', 'Failed to count drafts', {
          error: error.message
        });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('TRAINING_DRAFTS', 'Exception counting drafts', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }
}

export const trainingDraftsService = new TrainingDraftsService();

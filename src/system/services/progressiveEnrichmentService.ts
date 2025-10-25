/**
 * Progressive Enrichment Service
 * Manages background enrichment of fast-generated training sessions
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';

export interface EnrichmentQueueItem {
  id: string;
  user_id: string;
  session_id: string;
  coach_type: 'force' | 'endurance' | 'functional' | 'calisthenics' | 'competitions';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface EnrichmentStatus {
  status: 'fast' | 'enriching' | 'enriched' | 'full';
  queuePosition?: number;
  estimatedWaitTime?: number;
}

class ProgressiveEnrichmentService {
  private static instance: ProgressiveEnrichmentService;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): ProgressiveEnrichmentService {
    if (!ProgressiveEnrichmentService.instance) {
      ProgressiveEnrichmentService.instance = new ProgressiveEnrichmentService();
    }
    return ProgressiveEnrichmentService.instance;
  }

  /**
   * Queue a session for background enrichment
   */
  async queueForEnrichment(
    userId: string,
    sessionId: string,
    coachType: 'force' | 'endurance' | 'functional' | 'calisthenics' | 'competitions',
    priority: number = 5
  ): Promise<void> {
    try {
      logger.info('ENRICHMENT', 'Queueing session for enrichment', {
        userId,
        sessionId,
        coachType,
        priority
      });

      const { error } = await supabase
        .from('training_enrichment_queue')
        .insert({
          user_id: userId,
          session_id: sessionId,
          coach_type: coachType,
          priority,
          status: 'pending'
        });

      if (error) {
        // Ignore unique constraint errors (already queued)
        if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
          logger.error('ENRICHMENT', 'Failed to queue enrichment', {
            userId,
            sessionId,
            error: error.message
          });
          throw error;
        } else {
          logger.info('ENRICHMENT', 'Session already queued for enrichment', {
            userId,
            sessionId
          });
        }
      } else {
        logger.info('ENRICHMENT', 'Session successfully queued', {
          userId,
          sessionId,
          coachType,
          priority
        });

        // Trigger processing (non-blocking)
        this.triggerProcessing().catch(err => {
          logger.error('ENRICHMENT', 'Failed to trigger processing', {
            error: err.message
          });
        });
      }
    } catch (error) {
      logger.error('ENRICHMENT', 'Exception queueing enrichment', {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get enrichment status for a session
   */
  async getEnrichmentStatus(sessionId: string): Promise<EnrichmentStatus> {
    try {
      // Check session enrichment_status
      const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .select('enrichment_status')
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionError || !session) {
        logger.warn('ENRICHMENT', 'Failed to get session status', {
          sessionId,
          error: sessionError?.message
        });
        return { status: 'full' }; // Default to full if unknown
      }

      const status = session.enrichment_status || 'full';

      // If enriching, get queue position
      if (status === 'enriching') {
        const { data: queueItem } = await supabase
          .from('training_enrichment_queue')
          .select('priority, created_at')
          .eq('session_id', sessionId)
          .eq('status', 'pending')
          .maybeSingle();

        if (queueItem) {
          // Estimate queue position based on priority and creation time
          const { count } = await supabase
            .from('training_enrichment_queue')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
            .or(`priority.lt.${queueItem.priority},and(priority.eq.${queueItem.priority},created_at.lt.${queueItem.created_at})`);

          const queuePosition = (count || 0) + 1;
          const estimatedWaitTime = queuePosition * 30; // 30s per item estimate

          return {
            status,
            queuePosition,
            estimatedWaitTime
          };
        }
      }

      return { status };
    } catch (error) {
      logger.error('ENRICHMENT', 'Exception getting enrichment status', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { status: 'full' }; // Safe default
    }
  }

  /**
   * Start polling for enrichment completion
   */
  startPolling(
    sessionId: string,
    onStatusChange: (status: EnrichmentStatus) => void,
    intervalMs: number = 5000
  ): void {
    // Stop existing polling for this session
    this.stopPolling(sessionId);

    logger.info('ENRICHMENT', 'Starting enrichment polling', {
      sessionId,
      intervalMs
    });

    const intervalId = setInterval(async () => {
      try {
        const status = await this.getEnrichmentStatus(sessionId);
        onStatusChange(status);

        // Stop polling if enriched or failed
        if (status.status === 'enriched' || status.status === 'fast') {
          this.stopPolling(sessionId);
        }
      } catch (error) {
        logger.error('ENRICHMENT', 'Polling error', {
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, intervalMs);

    this.pollingIntervals.set(sessionId, intervalId);
  }

  /**
   * Stop polling for a session
   */
  stopPolling(sessionId: string): void {
    const intervalId = this.pollingIntervals.get(sessionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(sessionId);
      logger.info('ENRICHMENT', 'Stopped enrichment polling', { sessionId });
    }
  }

  /**
   * Trigger processing of pending enrichments
   */
  private async triggerProcessing(): Promise<void> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      logger.info('ENRICHMENT', 'Triggering enrichment processor', {
        url: `${supabaseUrl}/functions/v1/training-enrichment-processor`
      });

      // Call enrichment processor (non-blocking)
      fetch(`${supabaseUrl}/functions/v1/training-enrichment-processor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({})
      }).catch(err => {
        logger.error('ENRICHMENT', 'Failed to trigger processor', {
          error: err.message
        });
      });
    } catch (error) {
      logger.error('ENRICHMENT', 'Exception triggering processor', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const [
        { count: pending },
        { count: processing },
        { count: completed },
        { count: failed }
      ] = await Promise.all([
        supabase.from('training_enrichment_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('training_enrichment_queue').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
        supabase.from('training_enrichment_queue').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('training_enrichment_queue').select('id', { count: 'exact', head: true }).eq('status', 'failed')
      ]);

      return {
        pending: pending || 0,
        processing: processing || 0,
        completed: completed || 0,
        failed: failed || 0
      };
    } catch (error) {
      logger.error('ENRICHMENT', 'Exception getting queue stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }
  }

  /**
   * Subscribe to enrichment updates for a session
   */
  subscribeToEnrichment(
    sessionId: string,
    onUpdate: (status: EnrichmentStatus) => void
  ): () => void {
    logger.info('ENRICHMENT', 'Subscribing to enrichment updates', { sessionId });

    // Set up realtime subscription on training_sessions
    const subscription = supabase
      .channel(`enrichment:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'training_sessions',
          filter: `id=eq.${sessionId}`
        },
        async (payload) => {
          logger.info('ENRICHMENT', 'Enrichment update received', {
            sessionId,
            enrichmentStatus: payload.new.enrichment_status
          });

          const status = await this.getEnrichmentStatus(sessionId);
          onUpdate(status);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      logger.info('ENRICHMENT', 'Unsubscribing from enrichment updates', { sessionId });
      subscription.unsubscribe();
    };
  }
}

export const progressiveEnrichmentService = ProgressiveEnrichmentService.getInstance();

/**
 * Endurance Session Service
 * Manages endurance session state, progression, and persistence
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';
import type {
  EnduranceSessionPrescription,
  EnduranceSessionState,
  EnduranceBlock,
  EnduranceBlockTracking,
  EnduranceIntervalTracking,
  EnduranceSessionMetrics,
  EnduranceSessionFeedback,
  HeartRateZone,
} from '../../domain/enduranceSession';

class EnduranceSessionService {
  /**
   * Initialize a new endurance session tracking
   */
  async initializeSession(
    sessionId: string,
    userId: string,
    prescription: EnduranceSessionPrescription
  ): Promise<void> {
    try {
      logger.info('ENDURANCE_SESSION_SERVICE', 'Initializing endurance session', {
        sessionId,
        discipline: prescription.discipline,
        blocksCount: prescription.mainWorkout?.length || 0,
      });

      // Check if session already exists
      const { data: existingSession } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('id', sessionId)
        .maybeSingle();

      if (existingSession) {
        logger.warn('ENDURANCE_SESSION_SERVICE', 'Session already exists, skipping insert', { sessionId });
        return;
      }

      // Create the session entry in training_sessions
      const { error: sessionError } = await supabase
        .from('training_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          type: 'endurance',
          status: 'in_progress',
          coach_type: 'endurance',
          discipline: prescription.discipline,
          duration_target_min: prescription.durationTarget,
          prescription: prescription,
          started_at: new Date().toISOString(),
        });

      if (sessionError) {
        logger.error('ENDURANCE_SESSION_SERVICE', 'Failed to create session', { error: sessionError });
        throw sessionError;
      }

      // Then create tracking entries for all blocks
      if (prescription.mainWorkout) {
        const blocks = prescription.mainWorkout.map((block, index) => ({
          session_id: sessionId,
          block_index: index,
          block_type: block.type,
          block_name: block.name,
          duration_target: block.duration * 60,
          zone_target: block.targetZone,
          completed: false,
        }));

        logger.info('ENDURANCE_SESSION_SERVICE', 'Creating blocks', {
          sessionId,
          blockCount: blocks.length,
          blocks: blocks.map(b => ({ index: b.block_index, name: b.block_name }))
        });

        const { data: insertedBlocks, error: blocksError } = await supabase
          .from('training_session_endurance_blocks')
          .insert(blocks)
          .select('id, block_index, block_name');

        if (blocksError) {
          logger.error('ENDURANCE_SESSION_SERVICE', 'Failed to create blocks', { error: blocksError });
          throw blocksError;
        }

        logger.info('ENDURANCE_SESSION_SERVICE', 'Blocks created successfully', {
          sessionId,
          blocksCreated: insertedBlocks?.length || 0,
          blockIds: insertedBlocks?.map(b => ({ index: b.block_index, id: b.id, name: b.block_name })) || []
        });

        // Verify blocks were created correctly
        const { data: verifyBlocks, error: verifyError } = await supabase
          .from('training_session_endurance_blocks')
          .select('id, block_index, block_name')
          .eq('session_id', sessionId)
          .order('block_index', { ascending: true });

        if (verifyError) {
          logger.error('ENDURANCE_SESSION_SERVICE', 'Failed to verify blocks', { error: verifyError });
        } else {
          logger.info('ENDURANCE_SESSION_SERVICE', 'Block verification complete', {
            sessionId,
            blocksFound: verifyBlocks?.length || 0,
            blocks: verifyBlocks?.map(b => ({ index: b.block_index, id: b.id, name: b.block_name })) || []
          });
        }
      }

      logger.info('ENDURANCE_SESSION_SERVICE', 'Session initialized successfully');
    } catch (error) {
      logger.error('ENDURANCE_SESSION_SERVICE', 'Error initializing session', { error });
      throw error;
    }
  }

  /**
   * Start a block and track its execution with retry mechanism
   */
  async startBlock(
    sessionId: string,
    blockIndex: number
  ): Promise<string | null> {
    const maxRetries = 5;
    const baseDelay = 200;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Exponential backoff: 200ms, 400ms, 800ms, 1600ms, 3200ms
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        logger.info('ENDURANCE_SESSION_SERVICE', 'Attempting to find block', {
          sessionId,
          blockIndex,
          attempt: attempt + 1,
          maxRetries,
          delay
        });

        const { data, error } = await supabase
          .from('training_session_endurance_blocks')
          .select('id, block_index, session_id')
          .eq('session_id', sessionId)
          .eq('block_index', blockIndex)
          .maybeSingle();

        if (error) {
          logger.error('ENDURANCE_SESSION_SERVICE', 'Error querying block', {
            sessionId,
            blockIndex,
            error,
            attempt: attempt + 1
          });

          if (attempt === maxRetries - 1) {
            return null;
          }
          continue;
        }

        if (!data) {
          logger.warn('ENDURANCE_SESSION_SERVICE', 'Block not found, will retry', {
            sessionId,
            blockIndex,
            attempt: attempt + 1,
            remainingRetries: maxRetries - attempt - 1
          });

          // On last attempt, verify blocks exist and log detailed info
          if (attempt === maxRetries - 1) {
            const { data: allBlocks } = await supabase
              .from('training_session_endurance_blocks')
              .select('id, block_index, session_id')
              .eq('session_id', sessionId);

            logger.error('ENDURANCE_SESSION_SERVICE', 'Block not found after all retries', {
              sessionId,
              blockIndex,
              allBlocks: allBlocks?.map(b => ({ index: b.block_index, id: b.id })) || []
            });
            return null;
          }
          continue;
        }

        // Block found, update it
        const { error: updateError } = await supabase
          .from('training_session_endurance_blocks')
          .update({
            started_at: new Date().toISOString(),
          })
          .eq('id', data.id);

        if (updateError) {
          logger.error('ENDURANCE_SESSION_SERVICE', 'Failed to start block', { updateError });
          return null;
        }

        logger.info('ENDURANCE_SESSION_SERVICE', 'Block started successfully', {
          blockId: data.id,
          blockIndex,
          attempt: attempt + 1
        });
        return data.id;
      } catch (error) {
        logger.error('ENDURANCE_SESSION_SERVICE', 'Error starting block', {
          error,
          attempt: attempt + 1,
          sessionId,
          blockIndex
        });

        if (attempt === maxRetries - 1) {
          return null;
        }
      }
    }

    return null;
  }

  /**
   * Complete a block with metrics
   */
  async completeBlock(
    blockId: string,
    metrics: {
      durationActual: number;
      avgHeartRate?: number;
      rpe?: number;
      notes?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_session_endurance_blocks')
        .update({
          duration_actual: metrics.durationActual,
          avg_heart_rate: metrics.avgHeartRate,
          rpe: metrics.rpe,
          notes: metrics.notes,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', blockId);

      if (error) {
        logger.error('ENDURANCE_SESSION_SERVICE', 'Failed to complete block', { error });
        throw error;
      }

      logger.info('ENDURANCE_SESSION_SERVICE', 'Block completed', { blockId, metrics });
    } catch (error) {
      logger.error('ENDURANCE_SESSION_SERVICE', 'Error completing block', { error });
      throw error;
    }
  }

  /**
   * Create interval tracking for an interval block
   */
  async createIntervals(
    blockId: string,
    intervals: Array<{
      intervalIndex: number;
      phaseType: 'work' | 'rest';
      durationTarget: number;
      zoneTarget: string;
    }>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_session_intervals')
        .insert(
          intervals.map(interval => ({
            block_id: blockId,
            interval_index: interval.intervalIndex,
            phase_type: interval.phaseType,
            duration_target: interval.durationTarget,
            zone_target: interval.zoneTarget,
            completed: false,
          }))
        );

      if (error) {
        logger.error('ENDURANCE_SESSION_SERVICE', 'Failed to create intervals', { error });
        throw error;
      }

      logger.info('ENDURANCE_SESSION_SERVICE', 'Intervals created', { blockId, count: intervals.length });
    } catch (error) {
      logger.error('ENDURANCE_SESSION_SERVICE', 'Error creating intervals', { error });
      throw error;
    }
  }

  /**
   * Start an interval
   */
  async startInterval(blockId: string, intervalIndex: number): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('training_session_intervals')
        .select('id')
        .eq('block_id', blockId)
        .eq('interval_index', intervalIndex)
        .single();

      if (error || !data) {
        logger.error('ENDURANCE_SESSION_SERVICE', 'Interval not found', { blockId, intervalIndex, error });
        return null;
      }

      const { error: updateError } = await supabase
        .from('training_session_intervals')
        .update({
          started_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (updateError) {
        logger.error('ENDURANCE_SESSION_SERVICE', 'Failed to start interval', { updateError });
        return null;
      }

      logger.info('ENDURANCE_SESSION_SERVICE', 'Interval started', { intervalId: data.id, intervalIndex });
      return data.id;
    } catch (error) {
      logger.error('ENDURANCE_SESSION_SERVICE', 'Error starting interval', { error });
      return null;
    }
  }

  /**
   * Complete an interval
   */
  async completeInterval(
    intervalId: string,
    metrics: {
      durationActual: number;
      avgHeartRate?: number;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_session_intervals')
        .update({
          duration_actual: metrics.durationActual,
          avg_heart_rate: metrics.avgHeartRate,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', intervalId);

      if (error) {
        logger.error('ENDURANCE_SESSION_SERVICE', 'Failed to complete interval', { error });
        throw error;
      }

      logger.info('ENDURANCE_SESSION_SERVICE', 'Interval completed', { intervalId, metrics });
    } catch (error) {
      logger.error('ENDURANCE_SESSION_SERVICE', 'Error completing interval', { error });
      throw error;
    }
  }

  /**
   * Update session with final endurance metrics
   */
  async updateSessionMetrics(
    sessionId: string,
    metrics: EnduranceSessionMetrics
  ): Promise<void> {
    try {
      logger.info('ENDURANCE_SESSION_SERVICE', 'Updating session metrics', { sessionId, metrics });

      const updateData: any = {
        blocks_completed: metrics.blocksCompleted,
        intervals_completed: metrics.intervalsCompleted,
        duration_minutes: Math.round(metrics.totalDuration / 60),
        status: 'completed',
        completed_at: new Date().toISOString(),
      };

      // Only add optional metrics if they are provided
      if (metrics.totalDistance !== undefined) {
        updateData.total_distance = metrics.totalDistance;
      }
      if (metrics.avgHeartRate !== undefined) {
        updateData.avg_heart_rate = metrics.avgHeartRate;
      }
      if (metrics.estimatedTSS !== undefined) {
        updateData.estimated_tss = metrics.estimatedTSS;
      }
      if (metrics.zonesDistribution !== undefined) {
        updateData.zones_distribution = metrics.zonesDistribution;
      }

      const { error } = await supabase
        .from('training_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        logger.error('ENDURANCE_SESSION_SERVICE', 'Failed to update session metrics', {
          error,
          errorCode: error.code,
          errorMessage: error.message,
          sessionId
        });
        throw error;
      }

      logger.info('ENDURANCE_SESSION_SERVICE', 'Session metrics updated successfully', { sessionId });
    } catch (error) {
      logger.error('ENDURANCE_SESSION_SERVICE', 'Error updating session metrics', { error });
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('training_endurance_session_stats')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        logger.error('ENDURANCE_SESSION_SERVICE', 'Failed to get session stats', { error });
        return null;
      }

      return data;
    } catch (error) {
      logger.error('ENDURANCE_SESSION_SERVICE', 'Error getting session stats', { error });
      return null;
    }
  }

  /**
   * Calculate zones distribution from blocks
   */
  calculateZonesDistribution(
    blocks: Array<{ zone_target: string; duration_actual: number }>
  ): Record<HeartRateZone, number> {
    const distribution: Record<HeartRateZone, number> = {
      Z1: 0,
      Z2: 0,
      Z3: 0,
      Z4: 0,
      Z5: 0,
    };

    blocks.forEach(block => {
      const zone = this.extractPrimaryZone(block.zone_target);
      if (zone && block.duration_actual) {
        distribution[zone] += block.duration_actual;
      }
    });

    return distribution;
  }

  /**
   * Extract primary zone from zone string (e.g., "Z2" or "Z3-Z4" -> "Z3")
   */
  private extractPrimaryZone(zoneTarget: string): HeartRateZone | null {
    if (!zoneTarget) return null;

    const match = zoneTarget.match(/Z([1-5])/);
    if (match) {
      return `Z${match[1]}` as HeartRateZone;
    }

    return null;
  }
}

export const enduranceSessionService = new EnduranceSessionService();

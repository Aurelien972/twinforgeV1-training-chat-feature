/**
 * useProgressiveEnrichment Hook
 * Manages progressive enrichment for training sessions
 */

import { useEffect, useState, useCallback } from 'react';
import { progressiveEnrichmentService } from '../system/services/progressiveEnrichmentService';
import type { EnrichmentStatus } from '../system/services/progressiveEnrichmentService';

interface UseProgressiveEnrichmentOptions {
  sessionId: string | null;
  enabled?: boolean;
  onEnriched?: () => void;
  onError?: (error: Error) => void;
}

interface UseProgressiveEnrichmentReturn {
  status: EnrichmentStatus | null;
  isLoading: boolean;
  isEnriching: boolean;
  isEnriched: boolean;
  isFastMode: boolean;
  queuePosition: number | null;
  estimatedWaitTime: number | null;
  refetch: () => Promise<void>;
}

export function useProgressiveEnrichment({
  sessionId,
  enabled = true,
  onEnriched,
  onError
}: UseProgressiveEnrichmentOptions): UseProgressiveEnrichmentReturn {
  const [status, setStatus] = useState<EnrichmentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!sessionId || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const enrichmentStatus = await progressiveEnrichmentService.getEnrichmentStatus(sessionId);
      setStatus(enrichmentStatus);
    } catch (error) {
      console.error('Failed to fetch enrichment status:', error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, enabled, onError]);

  useEffect(() => {
    if (!sessionId || !enabled) {
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      await fetchStatus();

      // If enriching, subscribe to real-time updates
      if (status?.status === 'enriching') {
        unsubscribe = progressiveEnrichmentService.subscribeToEnrichment(
          sessionId,
          (updatedStatus) => {
            setStatus(updatedStatus);

            // Notify when enriched
            if (updatedStatus.status === 'enriched' && onEnriched) {
              onEnriched();
            }
          }
        );
      }
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sessionId, enabled, status?.status, onEnriched, fetchStatus]);

  return {
    status,
    isLoading,
    isEnriching: status?.status === 'enriching',
    isEnriched: status?.status === 'enriched',
    isFastMode: status?.status === 'fast',
    queuePosition: status?.queuePosition ?? null,
    estimatedWaitTime: status?.estimatedWaitTime ?? null,
    refetch: fetchStatus
  };
}

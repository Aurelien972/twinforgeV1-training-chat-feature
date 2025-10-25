/**
 * EnrichmentStatusBadge Component
 * Displays the enrichment status of a training session
 */

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Check } from 'lucide-react';
import { progressiveEnrichmentService } from '../../../../system/services/progressiveEnrichmentService';
import type { EnrichmentStatus } from '../../../../system/services/progressiveEnrichmentService';

interface EnrichmentStatusBadgeProps {
  sessionId: string;
  onEnriched?: () => void;
  compact?: boolean;
}

export function EnrichmentStatusBadge({
  sessionId,
  onEnriched,
  compact = false
}: EnrichmentStatusBadgeProps) {
  const [status, setStatus] = useState<EnrichmentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        // Get initial status
        const initialStatus = await progressiveEnrichmentService.getEnrichmentStatus(sessionId);
        setStatus(initialStatus);
        setIsLoading(false);

        // If enriching, subscribe to updates
        if (initialStatus.status === 'enriching') {
          unsubscribe = progressiveEnrichmentService.subscribeToEnrichment(
            sessionId,
            (updatedStatus) => {
              setStatus(updatedStatus);

              // Notify parent when enriched
              if (updatedStatus.status === 'enriched' && onEnriched) {
                onEnriched();
              }
            }
          );
        }
      } catch (error) {
        console.error('Failed to get enrichment status:', error);
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sessionId, onEnriched]);

  if (isLoading || !status) {
    return null;
  }

  // Don't show badge for 'full' status (already fully generated)
  if (status.status === 'full') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status.status) {
      case 'fast':
        return {
          icon: Sparkles,
          label: 'Fast Mode',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20'
        };
      case 'enriching':
        return {
          icon: Loader2,
          label: compact ? 'Enriching...' : `Enriching (${status.queuePosition || '?'} in queue)`,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          animate: true
        };
      case 'enriched':
        return {
          icon: Check,
          label: 'Enriched',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm ${config.bgColor} ${config.borderColor}`}
    >
      <Icon
        className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`}
      />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
      {status.estimatedWaitTime && status.estimatedWaitTime > 0 && !compact && (
        <span className="text-xs text-white/60">
          (~{Math.ceil(status.estimatedWaitTime / 60)}m)
        </span>
      )}
    </div>
  );
}

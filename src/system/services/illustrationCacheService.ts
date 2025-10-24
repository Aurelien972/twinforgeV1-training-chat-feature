/**
 * Illustration Cache Service
 * In-memory cache with TTL for illustration lookups
 * Reduces database queries and improves performance
 */

import logger from '../../lib/utils/logger';

interface CacheEntry {
  illustrationId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  source: string;
  isDiptych?: boolean;
  aspectRatio?: string;
  timestamp: number;
  isPlaceholder?: boolean; // Indicates generation in progress
}

interface PendingRequest {
  promise: Promise<CacheEntry | null>;
  timestamp: number;
  subscribers: Set<(result: CacheEntry | null) => void>;
}

class IllustrationCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly CACHE_TTL_MS = 3600000; // 1 hour
  private readonly PENDING_TTL_MS = 140000; // 140 seconds (server timeout 130s + margin)
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start automatic cleanup of stale pending requests
    this.startCleanupInterval();
  }

  /**
   * Start automatic cleanup interval for stale requests
   */
  private startCleanupInterval(): void {
    // Run cleanup every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupStalePendingRequests();
    }, 30000);

    logger.debug('ILLUSTRATION_CACHE', 'Started automatic cleanup interval');
  }

  /**
   * Clean up stale pending requests
   */
  private cleanupStalePendingRequests(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, pending] of this.pendingRequests.entries()) {
      const age = now - pending.timestamp;
      if (age > this.PENDING_TTL_MS) {
        this.pendingRequests.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('ILLUSTRATION_CACHE', 'Cleaned up stale pending requests', {
        cleanedCount,
        remainingPending: this.pendingRequests.size
      });
    }
  }

  /**
   * Stop cleanup interval (for testing or cleanup)
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.debug('ILLUSTRATION_CACHE', 'Stopped automatic cleanup interval');
    }
  }

  /**
   * Get cache key for exercise
   */
  private getCacheKey(exerciseName: string, discipline: string): string {
    const normalized = exerciseName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

    return `${discipline}::${normalized}`;
  }

  /**
   * Get from cache
   */
  get(exerciseName: string, discipline: string): CacheEntry | null {
    const key = this.getCacheKey(exerciseName, discipline);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // If it's a placeholder, don't return it as a valid cache entry
    if (entry.isPlaceholder) {
      const age = Date.now() - entry.timestamp;
      logger.debug('ILLUSTRATION_CACHE', 'Found placeholder - generation in progress', {
        exerciseName,
        discipline,
        ageMs: age,
        lockId: entry.illustrationId
      });
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      logger.debug('ILLUSTRATION_CACHE', 'Cache entry expired', {
        exerciseName,
        discipline,
        ageMs: age
      });
      return null;
    }

    logger.debug('ILLUSTRATION_CACHE', 'Cache hit', {
      exerciseName,
      discipline,
      ageMs: age
    });

    return entry;
  }

  /**
   * Set in cache
   */
  set(
    exerciseName: string,
    discipline: string,
    illustrationId: string,
    imageUrl: string,
    thumbnailUrl: string | undefined,
    source: string,
    isDiptych?: boolean,
    aspectRatio?: string
  ): void {
    const key = this.getCacheKey(exerciseName, discipline);

    this.cache.set(key, {
      illustrationId,
      imageUrl,
      thumbnailUrl,
      source,
      isDiptych,
      aspectRatio,
      timestamp: Date.now(),
      isPlaceholder: false
    });

    logger.debug('ILLUSTRATION_CACHE', 'Cache set', {
      exerciseName,
      discipline,
      source
    });

    // Limit cache size to 200 entries
    if (this.cache.size > 200) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Set a placeholder in cache to indicate generation in progress
   * This prevents duplicate generations while the first one is running
   */
  setPlaceholder(
    exerciseName: string,
    discipline: string,
    lockId: string
  ): void {
    const key = this.getCacheKey(exerciseName, discipline);

    this.cache.set(key, {
      illustrationId: lockId,
      imageUrl: '',
      thumbnailUrl: '',
      source: 'generating',
      timestamp: Date.now(),
      isPlaceholder: true
    });

    logger.info('ILLUSTRATION_CACHE', 'Placeholder set - generation in progress', {
      exerciseName,
      discipline,
      lockId
    });
  }

  /**
   * Remove placeholder from cache
   */
  removePlaceholder(
    exerciseName: string,
    discipline: string
  ): void {
    const key = this.getCacheKey(exerciseName, discipline);
    const entry = this.cache.get(key);

    if (entry && entry.isPlaceholder) {
      this.cache.delete(key);
      logger.debug('ILLUSTRATION_CACHE', 'Placeholder removed', {
        exerciseName,
        discipline
      });
    }
  }

  /**
   * Check if request is already pending for this exercise
   * Returns the pending promise if exists, null otherwise
   */
  getPendingRequest(exerciseName: string, discipline: string): Promise<CacheEntry | null> | null {
    const key = this.getCacheKey(exerciseName, discipline);
    const pending = this.pendingRequests.get(key);

    if (!pending) {
      return null;
    }

    // Check if expired
    const age = Date.now() - pending.timestamp;
    if (age > this.PENDING_TTL_MS) {
      this.pendingRequests.delete(key);
      logger.warn('ILLUSTRATION_CACHE', 'Pending request expired (timeout)', {
        exerciseName,
        discipline,
        ageMs: age,
        ageSeconds: Math.floor(age / 1000)
      });
      return null;
    }

    logger.info('ILLUSTRATION_CACHE', 'Found pending request - reusing', {
      exerciseName,
      discipline,
      ageMs: age,
      ageSeconds: Math.floor(age / 1000),
      totalPending: this.pendingRequests.size,
      subscribers: pending.subscribers.size
    });

    return pending.promise;
  }

  /**
   * Subscribe to a pending request for real-time updates
   * Returns unsubscribe function
   */
  subscribeToPendingRequest(
    exerciseName: string,
    discipline: string,
    callback: (result: CacheEntry | null) => void
  ): (() => void) | null {
    const key = this.getCacheKey(exerciseName, discipline);
    const pending = this.pendingRequests.get(key);

    if (!pending) {
      logger.debug('ILLUSTRATION_CACHE', 'No pending request to subscribe to', {
        exerciseName,
        discipline
      });
      return null;
    }

    // Add subscriber
    pending.subscribers.add(callback);

    logger.debug('ILLUSTRATION_CACHE', 'Subscribed to pending request', {
      exerciseName,
      discipline,
      totalSubscribers: pending.subscribers.size
    });

    // Return unsubscribe function
    return () => {
      pending.subscribers.delete(callback);
      logger.debug('ILLUSTRATION_CACHE', 'Unsubscribed from pending request', {
        exerciseName,
        discipline,
        remainingSubscribers: pending.subscribers.size
      });
    };
  }

  /**
   * Register a pending request
   */
  setPendingRequest(
    exerciseName: string,
    discipline: string,
    promise: Promise<CacheEntry | null>
  ): void {
    const key = this.getCacheKey(exerciseName, discipline);
    const timestamp = Date.now();
    const subscribers = new Set<(result: CacheEntry | null) => void>();

    this.pendingRequests.set(key, {
      promise,
      timestamp,
      subscribers
    });

    logger.info('ILLUSTRATION_CACHE', 'Registered pending generation', {
      exerciseName,
      discipline,
      totalPending: this.pendingRequests.size,
      timestamp: new Date(timestamp).toISOString()
    });

    // Notify subscribers when promise resolves
    promise.then(
      (result) => {
        // Notify all subscribers of success
        const pending = this.pendingRequests.get(key);
        if (pending && pending.subscribers.size > 0) {
          logger.info('ILLUSTRATION_CACHE', 'Notifying subscribers of completion', {
            exerciseName,
            discipline,
            subscriberCount: pending.subscribers.size,
            success: !!result
          });

          pending.subscribers.forEach(callback => {
            try {
              callback(result);
            } catch (error) {
              logger.error('ILLUSTRATION_CACHE', 'Subscriber callback error', {
                error: error instanceof Error ? error.message : 'Unknown',
                exerciseName,
                discipline
              });
            }
          });
        }
      },
      (error) => {
        // Notify subscribers of error
        const pending = this.pendingRequests.get(key);
        if (pending && pending.subscribers.size > 0) {
          logger.warn('ILLUSTRATION_CACHE', 'Notifying subscribers of error', {
            exerciseName,
            discipline,
            subscriberCount: pending.subscribers.size,
            error: error instanceof Error ? error.message : 'Unknown'
          });

          pending.subscribers.forEach(callback => {
            try {
              callback(null);
            } catch (cbError) {
              logger.error('ILLUSTRATION_CACHE', 'Subscriber error callback failed', {
                error: cbError instanceof Error ? cbError.message : 'Unknown'
              });
            }
          });
        }
      }
    );

    // Clean up when promise resolves (success or failure)
    promise.finally(() => {
      const duration = Date.now() - timestamp;
      const pending = this.pendingRequests.get(key);
      const subscriberCount = pending?.subscribers.size || 0;

      this.pendingRequests.delete(key);

      logger.info('ILLUSTRATION_CACHE', 'Cleared pending request', {
        exerciseName,
        discipline,
        durationMs: duration,
        durationSeconds: Math.floor(duration / 1000),
        remainingPending: this.pendingRequests.size,
        hadSubscribers: subscriberCount > 0
      });
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const cacheSize = this.cache.size;
    const pendingSize = this.pendingRequests.size;

    this.cache.clear();
    this.pendingRequests.clear();

    logger.info('ILLUSTRATION_CACHE', 'Cache cleared', {
      cacheSize,
      pendingSize
    });
  }

  /**
   * Get cache stats
   */
  getStats(): {
    cacheSize: number;
    pendingSize: number;
    oldestPendingAgeMs?: number;
    oldestCacheAgeMs?: number;
  } {
    const stats = {
      cacheSize: this.cache.size,
      pendingSize: this.pendingRequests.size,
      oldestPendingAgeMs: undefined as number | undefined,
      oldestCacheAgeMs: undefined as number | undefined
    };

    // Find oldest pending request
    const now = Date.now();
    for (const pending of this.pendingRequests.values()) {
      const age = now - pending.timestamp;
      if (!stats.oldestPendingAgeMs || age > stats.oldestPendingAgeMs) {
        stats.oldestPendingAgeMs = age;
      }
    }

    // Find oldest cache entry
    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (!stats.oldestCacheAgeMs || age > stats.oldestCacheAgeMs) {
        stats.oldestCacheAgeMs = age;
      }
    }

    return stats;
  }

  /**
   * Log current cache status (useful for debugging)
   */
  logStatus(): void {
    const stats = this.getStats();
    logger.info('ILLUSTRATION_CACHE', 'Cache status', {
      cacheSize: stats.cacheSize,
      pendingSize: stats.pendingSize,
      oldestPendingSeconds: stats.oldestPendingAgeMs
        ? Math.floor(stats.oldestPendingAgeMs / 1000)
        : 'N/A',
      oldestCacheSeconds: stats.oldestCacheAgeMs
        ? Math.floor(stats.oldestCacheAgeMs / 1000)
        : 'N/A'
    });
  }
}

export const illustrationCacheService = new IllustrationCacheService();

// Cleanup on window unload (if in browser)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    illustrationCacheService.stopCleanupInterval();
  });
}

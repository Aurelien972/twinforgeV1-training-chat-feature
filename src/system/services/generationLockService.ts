/**
 * Generation Lock Service
 * Prevents duplicate prescription and illustration generations
 * Global singleton service to manage locks across all components
 */

import logger from '../../lib/utils/logger';

export type LockType = 'prescription' | 'illustration';

interface LockEntry {
  lockId: string;
  type: LockType;
  timestamp: number;
  sessionId?: string;
  userId?: string;
  exerciseName?: string;
  discipline?: string;
}

class GenerationLockService {
  private locks: Map<string, LockEntry> = new Map();
  private readonly LOCK_TIMEOUT_MS = 300000; // 5 minutes (aligned with increased server timeout)
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private readonly MAX_RETRY_ATTEMPTS = 10; // Increased for long-running generations
  private readonly RETRY_DELAY_BASE_MS = 500; // Increased base delay for realistic wait times

  private generateLockKey(type: LockType, params: Record<string, string | undefined>): string {
    switch (type) {
      case 'prescription':
        return `prescription:${params.sessionId || 'unknown'}:${params.userId || 'unknown'}`;
      case 'illustration':
        return `illustration:${params.exerciseName || 'unknown'}:${params.discipline || 'unknown'}`;
      default:
        return `${type}:${JSON.stringify(params)}`;
    }
  }

  acquireLock(
    type: LockType,
    params: {
      sessionId?: string;
      userId?: string;
      exerciseName?: string;
      discipline?: string;
    }
  ): { success: boolean; lockId?: string; existingLock?: LockEntry } {
    const lockKey = this.generateLockKey(type, params);
    const existingLock = this.locks.get(lockKey);

    // Check if existing lock is still valid
    if (existingLock) {
      const elapsed = Date.now() - existingLock.timestamp;

      if (elapsed < this.LOCK_TIMEOUT_MS) {
        logger.warn('GENERATION_LOCK', 'Lock already held', {
          type,
          lockKey,
          elapsedMs: elapsed,
          existingLockId: existingLock.lockId
        });
        return { success: false, existingLock };
      } else {
        // Lock expired, clean it up
        logger.info('GENERATION_LOCK', 'Expired lock cleaned up', {
          type,
          lockKey,
          elapsedMs: elapsed
        });
        this.locks.delete(lockKey);
      }
    }

    // Create new lock
    const lockId = `${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const lockEntry: LockEntry = {
      lockId,
      type,
      timestamp: Date.now(),
      ...params
    };

    this.locks.set(lockKey, lockEntry);

    logger.info('GENERATION_LOCK', 'Lock acquired', {
      type,
      lockKey,
      lockId
    });

    return { success: true, lockId };
  }

  /**
   * Acquire lock with automatic retry and exponential backoff
   * Returns null if unable to acquire after all retries
   */
  async acquireLockWithRetry(
    type: LockType,
    params: {
      sessionId?: string;
      userId?: string;
      exerciseName?: string;
      discipline?: string;
    },
    maxAttempts: number = this.MAX_RETRY_ATTEMPTS
  ): Promise<{ success: boolean; lockId?: string; existingLock?: LockEntry; shouldWait?: boolean }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = this.acquireLock(type, params);

      if (result.success) {
        if (attempt > 0) {
          logger.info('GENERATION_LOCK', 'Lock acquired after retry', {
            type,
            attempt: attempt + 1,
            totalAttempts: maxAttempts
          });
        }
        return result;
      }

      // Check if existing lock is still valid and active
      if (result.existingLock) {
        const lockAge = Date.now() - result.existingLock.timestamp;
        const remainingTime = this.LOCK_TIMEOUT_MS - lockAge;

        // If lock is recent (< 280s), suggest waiting for completion
        if (remainingTime > 20000) {
          logger.info('GENERATION_LOCK', 'Active lock detected - suggesting wait for completion', {
            type,
            lockAge: Math.floor(lockAge / 1000),
            remainingTimeSeconds: Math.floor(remainingTime / 1000),
            attempt: attempt + 1
          });

          // On last attempt, return with shouldWait flag
          if (attempt === maxAttempts - 1) {
            return { ...result, shouldWait: true };
          }
        }
      }

      // If this is the last attempt, return failure
      if (attempt === maxAttempts - 1) {
        logger.warn('GENERATION_LOCK', 'Failed to acquire lock after all retries', {
          type,
          attempts: maxAttempts,
          existingLock: result.existingLock
        });
        return result;
      }

      // Calculate exponential backoff delay with jitter
      // Cap at 8 seconds to avoid excessively long waits
      const baseDelay = Math.min(this.RETRY_DELAY_BASE_MS * Math.pow(1.5, attempt), 8000);
      const jitter = Math.random() * baseDelay * 0.3; // Add 0-30% jitter
      const delay = baseDelay + jitter;

      logger.debug('GENERATION_LOCK', 'Retrying lock acquisition', {
        type,
        attempt: attempt + 1,
        delayMs: Math.round(delay),
        nextAttempt: attempt + 2
      });

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // This should never be reached, but TypeScript needs it
    return { success: false };
  }

  releaseLock(
    type: LockType,
    params: {
      sessionId?: string;
      userId?: string;
      exerciseName?: string;
      discipline?: string;
    }
  ): boolean {
    const lockKey = this.generateLockKey(type, params);
    const existed = this.locks.has(lockKey);

    if (existed) {
      this.locks.delete(lockKey);
      logger.info('GENERATION_LOCK', 'Lock released', {
        type,
        lockKey
      });
    } else {
      logger.debug('GENERATION_LOCK', 'No lock to release', {
        type,
        lockKey
      });
    }

    return existed;
  }

  isLocked(
    type: LockType,
    params: {
      sessionId?: string;
      userId?: string;
      exerciseName?: string;
      discipline?: string;
    }
  ): boolean {
    const lockKey = this.generateLockKey(type, params);
    const existingLock = this.locks.get(lockKey);

    if (!existingLock) {
      return false;
    }

    const elapsed = Date.now() - existingLock.timestamp;

    if (elapsed >= this.LOCK_TIMEOUT_MS) {
      // Expired lock, clean it up
      this.locks.delete(lockKey);
      return false;
    }

    return true;
  }

  getLockInfo(
    type: LockType,
    params: {
      sessionId?: string;
      userId?: string;
      exerciseName?: string;
      discipline?: string;
    }
  ): LockEntry | null {
    const lockKey = this.generateLockKey(type, params);
    const lock = this.locks.get(lockKey);

    if (!lock) {
      return null;
    }

    const elapsed = Date.now() - lock.timestamp;

    if (elapsed >= this.LOCK_TIMEOUT_MS) {
      this.locks.delete(lockKey);
      return null;
    }

    return lock;
  }

  cleanupExpiredLocks(): number {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [key, lock] of this.locks.entries()) {
      const elapsed = now - lock.timestamp;

      if (elapsed >= this.LOCK_TIMEOUT_MS) {
        this.locks.delete(key);
        cleanedCount++;

        logger.debug('GENERATION_LOCK', 'Expired lock removed during cleanup', {
          lockId: lock.lockId,
          type: lock.type,
          elapsedMs: elapsed
        });
      }
    }

    if (cleanedCount > 0) {
      logger.info('GENERATION_LOCK', 'Cleanup completed', {
        cleanedCount,
        remainingLocks: this.locks.size
      });
    }

    return cleanedCount;
  }

  getAllLocks(): LockEntry[] {
    return Array.from(this.locks.values());
  }

  clearAllLocks(): void {
    const count = this.locks.size;
    this.locks.clear();

    logger.warn('GENERATION_LOCK', 'All locks cleared', {
      clearedCount: count
    });
  }

  forceReleaseLock(
    type: LockType,
    params: {
      sessionId?: string;
      userId?: string;
      exerciseName?: string;
      discipline?: string;
    }
  ): boolean {
    const lockKey = this.generateLockKey(type, params);
    const existed = this.locks.has(lockKey);

    if (existed) {
      this.locks.delete(lockKey);
      logger.warn('GENERATION_LOCK', 'Lock force released', {
        type,
        lockKey,
        reason: 'force_release'
      });
    }

    return existed;
  }

  startPeriodicCleanup(intervalMs: number = 30000): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }

    this.cleanupIntervalId = setInterval(() => {
      this.cleanupExpiredLocks();
    }, intervalMs);

    logger.info('GENERATION_LOCK', 'Periodic cleanup started', {
      intervalMs
    });
  }

  stopPeriodicCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
      logger.info('GENERATION_LOCK', 'Periodic cleanup stopped');
    }
  }

  getStats() {
    return {
      totalLocks: this.locks.size,
      prescriptionLocks: Array.from(this.locks.values()).filter(l => l.type === 'prescription').length,
      illustrationLocks: Array.from(this.locks.values()).filter(l => l.type === 'illustration').length,
      oldestLockAge: this.locks.size > 0
        ? Math.max(...Array.from(this.locks.values()).map(l => Date.now() - l.timestamp))
        : 0
    };
  }
}

// Singleton instance
export const generationLockService = new GenerationLockService();

// Periodic cleanup (every 30 seconds)
if (typeof window !== 'undefined') {
  generationLockService.startPeriodicCleanup(30000);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    generationLockService.stopPeriodicCleanup();
    generationLockService.clearAllLocks();
  });
}

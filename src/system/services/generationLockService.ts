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
  private readonly LOCK_TIMEOUT_MS = 180000; // 3 minutes

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
  setInterval(() => {
    generationLockService.cleanupExpiredLocks();
  }, 30000);
}

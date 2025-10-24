/**
 * Strict Mode Helper
 * Utilities to handle React StrictMode double-mounting behavior
 */

import logger from './logger';

interface StrictModeGuard {
  key: string;
  timestamp: number;
  componentId: string;
}

class StrictModeHelper {
  private guards: Map<string, StrictModeGuard> = new Map();
  private readonly GUARD_TIMEOUT_MS = 500; // 500ms window to detect double-mount

  /**
   * Check if we should proceed with an operation or if it's a duplicate
   * due to StrictMode double-mounting
   *
   * Returns true if this is the first (or only) execution
   * Returns false if this is a duplicate within the timeout window
   */
  shouldProceed(
    key: string,
    componentId: string
  ): boolean {
    const now = Date.now();
    const existing = this.guards.get(key);

    if (!existing) {
      // First execution - register and proceed
      this.guards.set(key, {
        key,
        timestamp: now,
        componentId
      });

      logger.debug('STRICT_MODE_HELPER', 'First execution - proceeding', {
        key,
        componentId
      });

      return true;
    }

    const age = now - existing.timestamp;

    // If guard is expired, treat as new execution
    if (age > this.GUARD_TIMEOUT_MS) {
      this.guards.set(key, {
        key,
        timestamp: now,
        componentId
      });

      logger.debug('STRICT_MODE_HELPER', 'Guard expired - proceeding', {
        key,
        componentId,
        previousAge: age
      });

      return true;
    }

    // If same component ID, it's a re-render not a double-mount
    if (existing.componentId === componentId) {
      logger.debug('STRICT_MODE_HELPER', 'Same component re-render - proceeding', {
        key,
        componentId,
        age
      });

      return true;
    }

    // Within timeout window and different component - likely StrictMode double-mount
    logger.info('STRICT_MODE_HELPER', 'Detected duplicate execution - blocking', {
      key,
      componentId,
      existingComponentId: existing.componentId,
      age,
      reason: 'strict_mode_double_mount'
    });

    return false;
  }

  /**
   * Release a guard (e.g., when component unmounts)
   */
  release(key: string, componentId: string): void {
    const existing = this.guards.get(key);

    if (existing && existing.componentId === componentId) {
      this.guards.delete(key);
      logger.debug('STRICT_MODE_HELPER', 'Guard released', {
        key,
        componentId
      });
    }
  }

  /**
   * Clean up expired guards
   */
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, guard] of this.guards.entries()) {
      const age = now - guard.timestamp;
      if (age > this.GUARD_TIMEOUT_MS) {
        this.guards.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('STRICT_MODE_HELPER', 'Cleanup completed', {
        cleanedCount,
        remainingGuards: this.guards.size
      });
    }
  }

  /**
   * Get statistics about active guards
   */
  getStats() {
    return {
      totalGuards: this.guards.size,
      guards: Array.from(this.guards.values())
    };
  }

  /**
   * Clear all guards (for testing)
   */
  clearAll(): void {
    const count = this.guards.size;
    this.guards.clear();
    logger.warn('STRICT_MODE_HELPER', 'All guards cleared', {
      clearedCount: count
    });
  }
}

// Singleton instance
export const strictModeHelper = new StrictModeHelper();

// Periodic cleanup (every 10 seconds)
if (typeof window !== 'undefined') {
  setInterval(() => {
    strictModeHelper.cleanup();
  }, 10000);
}

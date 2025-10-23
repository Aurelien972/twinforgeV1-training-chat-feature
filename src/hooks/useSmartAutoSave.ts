/**
 * Smart Auto-Save Hook
 * Intelligent auto-save system with debouncing, queue management, and state tracking
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useUserStore } from '../system/store/userStore';
import { useToast } from '../ui/components/ToastProvider';
import logger from '../lib/utils/logger';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

const MAX_SAVE_ATTEMPTS_PER_MINUTE = 10;
const LOOP_DETECTION_WINDOW_MS = 60000;

/**
 * Deep equality comparison for objects and arrays
 * Handles nested structures, arrays, and primitive values
 */
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return obj1 === obj2;

  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== 'object') return obj1 === obj2;

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  const keys1 = Object.keys(obj1).sort();
  const keys2 = Object.keys(obj2).sort();

  if (keys1.length !== keys2.length) return false;
  if (!deepEqual(keys1, keys2)) return false;

  for (const key of keys1) {
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

interface SaveQueueItem {
  id: string;
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

interface UseSmartAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  autoSaveIntervalMs?: number;
  maxRetries?: number;
  showToasts?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  /** Warm-up period in ms before enabling auto-save (default: 2000ms) */
  warmUpMs?: number;
  /** Tab key - auto-save only when this tab is visible */
  tabKey?: string;
  /** Current active tab key - for comparison with tabKey */
  activeTabKey?: string;
}

interface UseSmartAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  isDirty: boolean;
  saveNow: () => Promise<void>;
  markDirty: () => void;
  markClean: () => void;
  queueSize: number;
  errorCount: number;
  retryFailedSaves: () => Promise<void>;
  isWarmingUp: boolean;
}

const DEFAULT_OPTIONS = {
  enabled: true,
  debounceMs: 500,
  autoSaveIntervalMs: 30000, // 30 seconds
  maxRetries: 3,
  showToasts: true,
  onSaveSuccess: () => {},
  onSaveError: () => {},
  warmUpMs: 2000, // 2 seconds warm-up
  tabKey: undefined,
  activeTabKey: undefined,
} as const;

/**
 * Hook for intelligent auto-save with debouncing and queue management
 */
export function useSmartAutoSave(
  dataToSave: Record<string, any>,
  options: UseSmartAutoSaveOptions = {}
): UseSmartAutoSaveReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { updateProfile } = useUserStore();
  const { showToast } = useToast();

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isWarmingUp, setIsWarmingUp] = useState(true);

  // Refs to avoid re-creating timers
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warmUpTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveQueueRef = useRef<SaveQueueItem[]>([]);
  const isSavingRef = useRef(false);
  const previousDataRef = useRef<Record<string, any>>(dataToSave);
  const isFirstRenderRef = useRef(true);
  const initialSnapshotRef = useRef<Record<string, any> | null>(null);

  // Infinite loop detection
  const saveAttemptsRef = useRef<number[]>([]);
  const isLoopDetectedRef = useRef(false);

  /**
   * Check for infinite save loops
   */
  const checkForInfiniteLoop = useCallback((): boolean => {
    const now = Date.now();

    // Clean up old attempts outside the detection window
    saveAttemptsRef.current = saveAttemptsRef.current.filter(
      timestamp => now - timestamp < LOOP_DETECTION_WINDOW_MS
    );

    // Add current attempt
    saveAttemptsRef.current.push(now);

    // Check if we've exceeded the threshold
    if (saveAttemptsRef.current.length > MAX_SAVE_ATTEMPTS_PER_MINUTE) {
      if (!isLoopDetectedRef.current) {
        isLoopDetectedRef.current = true;
        logger.error('AUTO_SAVE', 'Infinite loop detected! Auto-save disabled temporarily.', {
          attempts: saveAttemptsRef.current.length,
          windowMs: LOOP_DETECTION_WINDOW_MS
        });

        if (opts.showToasts) {
          showToast({
            type: 'error',
            title: 'Auto-sauvegarde désactivée',
            message: 'Trop de tentatives détectées. Rechargez la page.',
            duration: 10000,
          });
        }
      }
      return true;
    }

    return false;
  }, [opts.showToasts, showToast]);

  /**
   * Core save function with retry logic
   */
  const performSave = useCallback(async (data: Record<string, any>, isRetry = false): Promise<void> => {
    if (isSavingRef.current) {
      logger.debug('AUTO_SAVE', 'Save already in progress, queuing...');
      return;
    }

    // Check for infinite loops
    if (checkForInfiniteLoop()) {
      logger.error('AUTO_SAVE', 'Save blocked due to infinite loop detection');
      return;
    }

    try {
      isSavingRef.current = true;
      setSaveStatus('saving');

      logger.debug('AUTO_SAVE', 'Starting save operation', {
        dataKeys: Object.keys(data),
        isRetry
      });

      // Perform the actual save
      await updateProfile({
        ...data,
        updated_at: new Date().toISOString(),
      });

      // Success - update previous data reference to avoid false positives
      previousDataRef.current = data;
      setSaveStatus('saved');
      setLastSaved(new Date());
      setIsDirty(false);
      setErrorCount(0);

      if (opts.showToasts && !isRetry) {
        showToast({
          type: 'success',
          title: 'Sauvegardé automatiquement',
          duration: 2000,
        });
      }

      opts.onSaveSuccess();

      logger.info('AUTO_SAVE', 'Save successful');
    } catch (error) {
      logger.error('AUTO_SAVE', 'Save failed', error);

      setErrorCount(prev => prev + 1);
      setSaveStatus('error');

      if (opts.showToasts) {
        showToast({
          type: 'error',
          title: 'Erreur de sauvegarde',
          message: 'Vos modifications seront réessayées automatiquement',
          duration: 4000,
        });
      }

      opts.onSaveError(error as Error);

      throw error;
    } finally {
      isSavingRef.current = false;
    }
  }, [updateProfile, showToast, opts, checkForInfiniteLoop]);

  /**
   * Add item to save queue
   */
  const addToQueue = useCallback((data: Record<string, any>) => {
    const queueItem: SaveQueueItem = {
      id: `save-${Date.now()}`,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    saveQueueRef.current.push(queueItem);
    setQueueSize(saveQueueRef.current.length);

    logger.debug('AUTO_SAVE', 'Added to queue', {
      queueSize: saveQueueRef.current.length
    });
  }, []);

  /**
   * Process save queue with exponential backoff
   */
  const processQueue = useCallback(async () => {
    if (saveQueueRef.current.length === 0 || isSavingRef.current) {
      return;
    }

    const item = saveQueueRef.current[0];

    try {
      await performSave(item.data, item.retryCount > 0);

      // Success - remove from queue
      saveQueueRef.current.shift();
      setQueueSize(saveQueueRef.current.length);

      // Process next item if any
      if (saveQueueRef.current.length > 0) {
        setTimeout(processQueue, 100);
      }
    } catch (error) {
      item.retryCount++;

      if (item.retryCount >= opts.maxRetries) {
        logger.error('AUTO_SAVE', 'Max retries reached, removing from queue', {
          itemId: item.id
        });
        saveQueueRef.current.shift();
        setQueueSize(saveQueueRef.current.length);
      } else {
        // Exponential backoff: 2s, 4s, 8s
        const backoffMs = Math.pow(2, item.retryCount) * 1000;
        logger.debug('AUTO_SAVE', 'Retry scheduled', {
          retryCount: item.retryCount,
          backoffMs
        });

        setTimeout(processQueue, backoffMs);
      }
    }
  }, [performSave, opts.maxRetries]);

  /**
   * Manual save function
   */
  const saveNow = useCallback(async () => {
    if (!opts.enabled || !isDirty) {
      logger.debug('AUTO_SAVE', 'Manual save skipped', {
        enabled: opts.enabled,
        isDirty
      });
      return;
    }

    // Clear any pending timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    addToQueue(dataToSave);
    await processQueue();
  }, [opts.enabled, isDirty, dataToSave, addToQueue, processQueue]);

  /**
   * Retry all failed saves in queue
   */
  const retryFailedSaves = useCallback(async () => {
    if (saveQueueRef.current.length === 0) {
      return;
    }

    logger.info('AUTO_SAVE', 'Retrying failed saves', {
      queueSize: saveQueueRef.current.length
    });

    // Reset retry counts
    saveQueueRef.current.forEach(item => {
      item.retryCount = 0;
    });

    await processQueue();
  }, [processQueue]);

  /**
   * Mark data as dirty (has unsaved changes)
   */
  const markDirty = useCallback(() => {
    setIsDirty(true);
    setSaveStatus('unsaved');
  }, []);

  /**
   * Mark data as clean (no unsaved changes)
   */
  const markClean = useCallback(() => {
    setIsDirty(false);
    setSaveStatus('saved');
  }, []);

  /**
   * Warm-up period effect - stabilize before enabling auto-save
   */
  useEffect(() => {
    if (!opts.enabled || opts.warmUpMs === 0) {
      setIsWarmingUp(false);
      return;
    }

    logger.debug('AUTO_SAVE', 'Starting warm-up period', {
      warmUpMs: opts.warmUpMs,
      tabKey: opts.tabKey
    });

    // Set initial snapshot after a short delay to let form stabilize
    const snapshotTimer = setTimeout(() => {
      initialSnapshotRef.current = dataToSave;
      previousDataRef.current = dataToSave;
      logger.debug('AUTO_SAVE', 'Initial snapshot captured', {
        dataKeys: Object.keys(dataToSave)
      });
    }, 100);

    // End warm-up period
    warmUpTimerRef.current = setTimeout(() => {
      setIsWarmingUp(false);
      logger.debug('AUTO_SAVE', 'Warm-up period completed - auto-save enabled', {
        tabKey: opts.tabKey
      });
    }, opts.warmUpMs);

    return () => {
      clearTimeout(snapshotTimer);
      if (warmUpTimerRef.current) {
        clearTimeout(warmUpTimerRef.current);
      }
    };
  }, [opts.enabled, opts.warmUpMs, opts.tabKey]);

  /**
   * Detect changes in data and trigger auto-save
   */
  useEffect(() => {
    if (!opts.enabled) return;
    if (isLoopDetectedRef.current) {
      logger.warn('AUTO_SAVE', 'Auto-save disabled due to infinite loop detection');
      return;
    }

    // Wait for warm-up period to complete
    if (isWarmingUp) {
      logger.debug('AUTO_SAVE', 'Skipping change detection - still warming up');
      return;
    }

    // Only auto-save when tab is visible (if tabKey is provided)
    if (opts.tabKey && opts.activeTabKey && opts.tabKey !== opts.activeTabKey) {
      logger.debug('AUTO_SAVE', 'Skipping auto-save - tab not active', {
        tabKey: opts.tabKey,
        activeTabKey: opts.activeTabKey
      });
      return;
    }

    // Skip the first render to avoid false positives on mount
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousDataRef.current = dataToSave;
      return;
    }

    // Use deep equality comparison instead of JSON.stringify
    // Compare with initial snapshot if available, otherwise with previous data
    const referenceData = initialSnapshotRef.current || previousDataRef.current;
    const hasChanges = !deepEqual(dataToSave, referenceData);

    if (hasChanges) {
      logger.debug('AUTO_SAVE', 'Changes detected', {
        dataKeys: Object.keys(dataToSave)
      });

      markDirty();
      // Don't update previousDataRef here - wait until save succeeds

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        addToQueue(dataToSave);
        processQueue();
      }, opts.debounceMs);
    }
  }, [dataToSave, opts.enabled, opts.debounceMs, opts.tabKey, opts.activeTabKey, isWarmingUp, markDirty, addToQueue, processQueue]);

  /**
   * Set up periodic auto-save interval
   */
  useEffect(() => {
    if (!opts.enabled || opts.autoSaveIntervalMs <= 0) return;

    autoSaveTimerRef.current = setInterval(() => {
      if (isDirty && !isSavingRef.current) {
        logger.debug('AUTO_SAVE', 'Periodic auto-save triggered');
        addToQueue(dataToSave);
        processQueue();
      }
    }, opts.autoSaveIntervalMs);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [opts.enabled, opts.autoSaveIntervalMs, isDirty, dataToSave, addToQueue, processQueue]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      if (warmUpTimerRef.current) {
        clearTimeout(warmUpTimerRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSaved,
    isDirty,
    saveNow,
    markDirty,
    markClean,
    queueSize,
    errorCount,
    retryFailedSaves,
    isWarmingUp,
  };
}

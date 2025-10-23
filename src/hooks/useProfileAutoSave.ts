/**
 * Profile Auto-Save Hook - Centralized & Optimized
 * Best practices implementation for form auto-save with tab awareness
 */

import React, { useCallback } from 'react';
import { useSmartAutoSave, type SaveStatus } from './useSmartAutoSave';
import { useUnsavedChangesStore } from '../system/store/unsavedChangesStore';
import { useFeedback } from './useFeedback';
import { useLocation } from 'react-router-dom';
import Haptics from '../utils/haptics';
import logger from '../lib/utils/logger';

interface UseProfileAutoSaveOptions {
  tabKey: string;
  enabled?: boolean;
  showToasts?: boolean;
  /** Warm-up delay in ms (default: 2000) */
  warmUpMs?: number;
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;
}

interface UseProfileAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  isDirty: boolean;
  saveNow: () => Promise<void>;
  queueSize: number;
  errorCount: number;
  retryFailedSaves: () => Promise<void>;
  isWarmingUp: boolean;
}

/**
 * Centralized hook for auto-saving profile data with:
 * - Tab visibility awareness (only saves on active tab)
 * - Warm-up period to avoid false positives on mount
 * - Deep equality comparison
 * - Smart debouncing and retry logic
 */
export function useProfileAutoSave(
  dataToSave: Record<string, any>,
  options: UseProfileAutoSaveOptions
): UseProfileAutoSaveReturn {
  const {
    tabKey,
    enabled = true,
    showToasts = false,
    warmUpMs = 2000,
    debounceMs = 1000
  } = options;

  const { success, error: errorFeedback } = useFeedback();
  const setTabDirty = useUnsavedChangesStore(state => state.setTabDirty);
  const location = useLocation();

  // Extract active tab from URL hash
  const activeTabKey = React.useMemo(() => {
    const hash = location.hash.replace('#', '');
    return hash || 'identity'; // Default to first tab
  }, [location.hash]);

  // Log tab activation for debugging
  React.useEffect(() => {
    if (activeTabKey === tabKey) {
      logger.debug('PROFILE_AUTO_SAVE', 'Tab activated', {
        tabKey,
        activeTabKey
      });
    }
  }, [activeTabKey, tabKey]);

  const handleSaveSuccess = useCallback(() => {
    // Trigger success feedback (only haptic, no visual since toast is handled)
    success();
    Haptics.success();

    // Mark tab as clean
    setTabDirty(tabKey, false);

    logger.info('PROFILE_AUTO_SAVE', 'Profile data saved successfully', {
      tabKey,
    });
  }, [tabKey, success, setTabDirty]);

  const handleSaveError = useCallback((error: Error) => {
    // Trigger error feedback
    errorFeedback();
    Haptics.error();

    logger.error('PROFILE_AUTO_SAVE', 'Failed to save profile data', {
      tabKey,
      error: error.message,
    });
  }, [tabKey, errorFeedback]);

  const autoSave = useSmartAutoSave(dataToSave, {
    enabled,
    debounceMs,
    autoSaveIntervalMs: 0, // Disable periodic auto-save, rely on change detection only
    maxRetries: 3,
    showToasts,
    warmUpMs,
    tabKey,
    activeTabKey,
    onSaveSuccess: handleSaveSuccess,
    onSaveError: handleSaveError,
  });

  // Update unsaved changes store based on isDirty state
  React.useEffect(() => {
    setTabDirty(tabKey, autoSave.isDirty);
  }, [tabKey, autoSave.isDirty, setTabDirty]);

  return autoSave;
}

export default useProfileAutoSave;

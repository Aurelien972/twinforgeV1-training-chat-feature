/**
 * Hook for managing default training location with bidirectional sync
 * Handles default location selection and synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../system/store/userStore';
import { supabase } from '../system/supabase/client';
import logger from '../lib/utils/logger';
import type { TrainingLocationWithDetails } from '../domain/trainingLocation';

interface UseDefaultLocationResult {
  defaultLocationId: string | null;
  defaultLocation: TrainingLocationWithDetails | null;
  isLoading: boolean;
  error: string | null;
  setDefaultLocation: (locationId: string) => Promise<void>;
  syncFromProfile: () => Promise<void>;
}

export const useDefaultLocation = (): UseDefaultLocationResult => {
  const { profile } = useUserStore();
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>(null);
  const [defaultLocation, setDefaultLocationState] = useState<TrainingLocationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncFromProfile = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_user_default_location', { p_user_id: profile.id });

      if (fetchError) {
        logger.error('DEFAULT_LOCATION', 'Failed to fetch default location', { error: fetchError });
        throw fetchError;
      }

      if (data && data.length > 0) {
        const location = data[0];
        setDefaultLocationId(location.id);
        setDefaultLocationState(location);

        logger.info('DEFAULT_LOCATION', 'Synced from profile', {
          locationId: location.id,
          locationName: location.name,
        });
      } else {
        setDefaultLocationId(null);
        setDefaultLocationState(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync default location';
      setError(errorMessage);
      logger.error('DEFAULT_LOCATION', 'Sync failed', { error: err });
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    syncFromProfile();
  }, [syncFromProfile]);

  const setDefaultLocation = useCallback(
    async (locationId: string) => {
      if (!profile?.id) {
        setError('No user profile available');
        return;
      }

      try {
        setError(null);

        const { error: updateError } = await supabase
          .rpc('set_default_location', {
            p_user_id: profile.id,
            p_location_id: locationId,
          });

        if (updateError) throw updateError;

        await syncFromProfile();

        logger.info('DEFAULT_LOCATION', 'Default location updated', {
          locationId,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set default location';
        setError(errorMessage);
        logger.error('DEFAULT_LOCATION', 'Update failed', { error: err });
        throw err;
      }
    },
    [profile?.id, syncFromProfile]
  );

  return {
    defaultLocationId,
    defaultLocation,
    isLoading,
    error,
    setDefaultLocation,
    syncFromProfile,
  };
};

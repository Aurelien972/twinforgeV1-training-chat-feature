/**
 * Hook for managing discipline preferences with bidirectional sync
 * Handles multi-select disciplines with default selection
 */

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../system/store/userStore';
import { supabase } from '../system/supabase/client';
import logger from '../lib/utils/logger';

interface UseDisciplinePreferencesResult {
  selectedDisciplines: string[];
  defaultDiscipline: string | null;
  isLoading: boolean;
  error: string | null;
  updateDisciplines: (disciplines: string[]) => Promise<void>;
  updateDefaultDiscipline: (disciplineId: string) => Promise<void>;
  syncFromProfile: () => Promise<void>;
}

export const useDisciplinePreferences = (): UseDisciplinePreferencesResult => {
  const { profile, refreshProfile } = useUserStore();
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [defaultDiscipline, setDefaultDiscipline] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncFromProfile = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_profile')
        .select('preferred_disciplines, default_discipline')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        const disciplines = data.preferred_disciplines || [];
        const defaultDisciplineValue = data.default_discipline || null;

        setSelectedDisciplines(disciplines);
        setDefaultDiscipline(defaultDisciplineValue);

        logger.info('DISCIPLINE_PREFERENCES', 'Synced from profile', {
          disciplines,
          defaultDiscipline: defaultDisciplineValue,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync disciplines';
      setError(errorMessage);
      logger.error('DISCIPLINE_PREFERENCES', 'Sync failed', { error: err });
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    syncFromProfile();
  }, [syncFromProfile]);

  const updateDisciplines = useCallback(
    async (disciplines: string[]) => {
      if (!profile?.id) {
        setError('No user profile available');
        return;
      }

      if (disciplines.length === 0) {
        setError('At least one discipline must be selected');
        return;
      }

      try {
        setError(null);

        let newDefaultDiscipline = defaultDiscipline;
        if (!disciplines.includes(defaultDiscipline || '')) {
          newDefaultDiscipline = disciplines[0];
        }

        const { error: updateError } = await supabase
          .from('user_profile')
          .update({
            preferred_disciplines: disciplines,
            default_discipline: newDefaultDiscipline,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', profile.id);

        if (updateError) throw updateError;

        setSelectedDisciplines(disciplines);
        setDefaultDiscipline(newDefaultDiscipline);

        await refreshProfile();

        logger.info('DISCIPLINE_PREFERENCES', 'Disciplines updated', {
          disciplines,
          defaultDiscipline: newDefaultDiscipline,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update disciplines';
        setError(errorMessage);
        logger.error('DISCIPLINE_PREFERENCES', 'Update failed', { error: err });
        throw err;
      }
    },
    [profile?.id, defaultDiscipline, refreshProfile]
  );

  const updateDefaultDiscipline = useCallback(
    async (disciplineId: string) => {
      if (!profile?.id) {
        setError('No user profile available');
        return;
      }

      if (!selectedDisciplines.includes(disciplineId)) {
        setError('Default discipline must be in selected disciplines');
        return;
      }

      try {
        setError(null);

        const { error: updateError } = await supabase
          .from('user_profile')
          .update({
            default_discipline: disciplineId,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', profile.id);

        if (updateError) throw updateError;

        setDefaultDiscipline(disciplineId);

        await refreshProfile();

        logger.info('DISCIPLINE_PREFERENCES', 'Default discipline updated', {
          defaultDiscipline: disciplineId,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update default discipline';
        setError(errorMessage);
        logger.error('DISCIPLINE_PREFERENCES', 'Default update failed', { error: err });
        throw err;
      }
    },
    [profile?.id, selectedDisciplines, refreshProfile]
  );

  return {
    selectedDisciplines,
    defaultDiscipline,
    isLoading,
    error,
    updateDisciplines,
    updateDefaultDiscipline,
    syncFromProfile,
  };
};

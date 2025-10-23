/**
 * useDominantDiscipline Hook
 * Determines the user's dominant training discipline based on recent session history
 */

import { useState, useEffect } from 'react';
import { supabase } from '../system/supabase/client';
import { subDays } from 'date-fns';
import logger from '../lib/utils/logger';

export function useDominantDiscipline() {
  const [dominantDiscipline, setDominantDiscipline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDominantDiscipline = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          logger.error('DOMINANT_DISCIPLINE', 'User not authenticated');
          setLoading(false);
          return;
        }

        const ninetyDaysAgo = subDays(new Date(), 90);

        const { data: sessions, error: sessionsError } = await supabase
          .from('training_sessions')
          .select('discipline')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', ninetyDaysAgo.toISOString());

        if (sessionsError) {
          logger.error('DOMINANT_DISCIPLINE', 'Failed to fetch sessions', { error: sessionsError.message });
          setLoading(false);
          return;
        }

        if (!sessions || sessions.length === 0) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profile')
            .select('preferences')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profileError) {
            logger.error('DOMINANT_DISCIPLINE', 'Failed to fetch profile', { error: profileError.message });
          }

          const fallbackDiscipline = profile?.preferences?.workout?.type || 'strength';
          setDominantDiscipline(fallbackDiscipline);
          setLoading(false);

          logger.info('DOMINANT_DISCIPLINE', 'No sessions found, using profile fallback', {
            discipline: fallbackDiscipline
          });
          return;
        }

        const disciplineCounts = sessions.reduce((acc, s) => {
          const discipline = s.discipline || 'strength';
          acc[discipline] = (acc[discipline] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const dominant = Object.entries(disciplineCounts)
          .sort(([, a], [, b]) => b - a)[0][0];

        setDominantDiscipline(dominant);
        setLoading(false);

        logger.info('DOMINANT_DISCIPLINE', 'Dominant discipline determined', {
          discipline: dominant,
          sessionCount: sessions.length,
          disciplineCounts
        });
      } catch (error) {
        logger.error('DOMINANT_DISCIPLINE', 'Exception fetching dominant discipline', {
          error: error instanceof Error ? error.message : 'Unknown'
        });
        setDominantDiscipline('strength');
        setLoading(false);
      }
    };

    fetchDominantDiscipline();
  }, []);

  return { dominantDiscipline, loading };
}

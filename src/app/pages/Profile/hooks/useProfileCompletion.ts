/**
 * useProfileCompletion Hook
 * Calcule le pourcentage de complétion du profil training
 */

import { useMemo } from 'react';
import type { UserProfile } from '../../../../domain/profile';

export const useProfileCompletion = (profile: UserProfile | null) => {
  const completion = useMemo(() => {
    if (!profile) {
      return { percentage: 0, completedFields: 0, totalFields: 4 };
    }

    const health = (profile as any).health;

    const trainingFields = [
      health?.fitness_level,
      health?.preferred_training_type,
      health?.sessions_per_week,
      health?.preferred_session_duration
    ];

    const completedFields = trainingFields.filter(field =>
      field !== undefined && field !== null && field !== ''
    ).length;

    const percentage = Math.round((completedFields / trainingFields.length) * 100);

    return {
      percentage,
      completedFields,
      totalFields: trainingFields.length
    };
  }, [profile]);

  return completion;
};

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

    // Accéder à profile.health pour les données de training
    const health = (profile as any).health;

    // Vérifier si les champs sont définis et valides
    const trainingFields = [
      health?.fitness_level,
      health?.preferred_training_type,
      health?.sessions_per_week,
      health?.preferred_session_duration
    ];

    // Compter les champs complétés (non vides, non null, non undefined)
    const completedFields = trainingFields.filter(field => {
      if (field === undefined || field === null) return false;
      if (typeof field === 'string' && field.trim() === '') return false;
      if (typeof field === 'number' && field === 0) return false;
      return true;
    }).length;

    const percentage = trainingFields.length > 0
      ? Math.round((completedFields / trainingFields.length) * 100)
      : 0;

    return {
      percentage,
      completedFields,
      totalFields: trainingFields.length
    };
  }, [profile]);

  return completion;
};

/**
 * useProfileTrainingForm Hook
 * Gestion du formulaire de profil sportif
 */

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../../../../system/store/userStore';
import { useToast } from '../../../../ui/components/ToastProvider';
import { supabase } from '../../../../system/supabase/client';

interface TrainingFormData {
  fitness_level?: string;
  preferred_training_type?: string;
  sessions_per_week?: number;
  preferred_session_duration?: number;
}

export const useProfileTrainingForm = () => {
  const { profile, setProfile } = useUserStore();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<TrainingFormData>({
    fitness_level: '',
    preferred_training_type: '',
    sessions_per_week: 3,
    preferred_session_duration: 45
  });

  const [originalData, setOriginalData] = useState<TrainingFormData>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les données du profil
  useEffect(() => {
    if (profile?.health) {
      const trainingData: TrainingFormData = {
        fitness_level: profile.health.fitness_level || '',
        preferred_training_type: profile.health.preferred_training_type || '',
        sessions_per_week: profile.health.sessions_per_week || 3,
        preferred_session_duration: profile.health.preferred_session_duration || 45
      };
      setFormData(trainingData);
      setOriginalData(trainingData);
    }
  }, [profile]);

  // Détecter les modifications
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    setIsDirty(hasChanges);
  }, [formData, originalData]);

  const handleChange = useCallback((field: keyof TrainingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile?.user_id) return;

    try {
      setIsSaving(true);

      // Mettre à jour le profil avec les nouvelles données training
      const updatedHealth = {
        ...(profile.health || {}),
        fitness_level: formData.fitness_level,
        preferred_training_type: formData.preferred_training_type,
        sessions_per_week: formData.sessions_per_week,
        preferred_session_duration: formData.preferred_session_duration
      };

      const { error } = await supabase
        .from('user_profile')
        .update({
          health: updatedHealth,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Mettre à jour le store local
      setProfile({
        ...profile,
        health: updatedHealth
      });

      setOriginalData(formData);
      setIsDirty(false);

      showToast({
        type: 'success',
        title: 'Profil enregistré',
        message: 'Vos préférences d\'entraînement ont été enregistrées',
        duration: 3000
      });
    } catch (err) {
      console.error('Error saving training profile:', err);
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'enregistrer vos préférences',
        duration: 4000
      });
    } finally {
      setIsSaving(false);
    }
  }, [profile, formData, setProfile, showToast]);

  return {
    formData,
    isDirty,
    isSaving,
    handleChange,
    handleSave
  };
};

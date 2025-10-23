/**
 * Allergies Form Hook
 * Manages allergies state and operations with improved error handling
 */

import React from 'react';
import { useUserStore } from '../../../../system/store/userStore';
import logger from '../../../../lib/utils/logger';
import type { HealthProfileV2 } from '../../../../domain/health';
import { useHealthProfileSave } from './useHealthProfileSave';
import { useHealthFormDirtyState } from './useHealthFormDirtyState';

interface Allergy {
  name: string;
  category: 'food' | 'medication' | 'environmental';
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
}

export function useAllergiesForm() {
  const { profile } = useUserStore();
  const { saveSection, isSectionSaving } = useHealthProfileSave();

  // Extract V2 health data
  const healthV2 = (profile as any)?.health as HealthProfileV2 | undefined;

  // Parse allergies from medical_history.allergies (string array) to structured format
  const [allergies, setAllergies] = React.useState<Allergy[]>([]);
  const [initialAllergies, setInitialAllergies] = React.useState<Allergy[]>([]);
  const [hasDeclaredNoAllergies, setHasDeclaredNoAllergies] = React.useState(false);
  const [initialNoAllergies, setInitialNoAllergies] = React.useState(false);

  // Initialize allergies from database
  React.useEffect(() => {
    const storedAllergies = healthV2?.medical_history?.allergies || [];
    const parsedAllergies: Allergy[] = storedAllergies.map(name => ({
      name,
      category: 'food' as const,
      severity: 'mild' as const,
    }));
    const noAllergies = healthV2?.no_allergies || false;

    setAllergies(parsedAllergies);
    setHasDeclaredNoAllergies(noAllergies);

    // Always update initial state when database values change
    setInitialAllergies(parsedAllergies);
    setInitialNoAllergies(noAllergies);

    logger.debug('ALLERGIES_FORM', 'Initialized allergies from database', {
      count: parsedAllergies.length,
      allergies: parsedAllergies,
      noAllergies,
      timestamp: new Date().toISOString(),
    });
  }, [healthV2?.medical_history?.allergies, healthV2?.no_allergies]);

  // Use intelligent dirty state detection
  const { isDirty, changedFieldsCount, resetDirtyState } = useHealthFormDirtyState({
    currentValues: { allergies, hasDeclaredNoAllergies },
    initialValues: { allergies: initialAllergies, hasDeclaredNoAllergies: initialNoAllergies },
    formName: 'ALLERGIES',
  });

  const handleAddAllergy = (allergy: Allergy) => {
    setAllergies((prev) => [...prev, allergy]);
    if (hasDeclaredNoAllergies) {
      setHasDeclaredNoAllergies(false);
    }
    logger.info('ALLERGIES_FORM', 'Added allergy', {
      name: allergy.name,
      category: allergy.category,
      severity: allergy.severity,
    });
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies((prev) => prev.filter((_, i) => i !== index));
    logger.info('ALLERGIES_FORM', 'Removed allergy', { index });
  };

  const handleDeclareNoAllergies = () => {
    const newState = !hasDeclaredNoAllergies;
    setHasDeclaredNoAllergies(newState);
    if (newState) {
      setAllergies([]);
      logger.info('ALLERGIES_FORM', 'User declared no allergies');
    }
  };

  const handleSave = async () => {
    try {
      logger.info('ALLERGIES_FORM', 'Saving allergies', {
        userId: profile?.userId,
        count: allergies.length,
        allergies: allergies.map(a => a.name),
        noAllergies: hasDeclaredNoAllergies,
      });

      // Convert structured allergies to string array for database
      const allergyNames = allergies.map(a => a.name);

      await saveSection({
        section: 'allergies',
        data: {
          allergies: allergyNames,
          no_allergies: hasDeclaredNoAllergies
        },
        onSuccess: () => {
          setInitialAllergies(allergies);
          setInitialNoAllergies(hasDeclaredNoAllergies);
          resetDirtyState({ allergies, hasDeclaredNoAllergies });
          logger.info('ALLERGIES_FORM', 'Successfully saved and reset dirty state', {
            count: allergies.length,
            noAllergies: hasDeclaredNoAllergies,
          });
        },
      });
    } catch (error) {
      logger.error('ALLERGIES_FORM', 'Save failed (already handled by saveSection)', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return {
    allergies,
    onAddAllergy: handleAddAllergy,
    onRemoveAllergy: handleRemoveAllergy,
    onDeclareNoAllergies: handleDeclareNoAllergies,
    hasDeclaredNoAllergies,
    onSave: handleSave,
    isSaving: isSectionSaving('allergies'),
    isDirty,
    changedFieldsCount,
  };
}

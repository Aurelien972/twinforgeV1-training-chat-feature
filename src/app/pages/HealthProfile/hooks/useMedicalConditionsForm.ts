/**
 * useMedicalConditionsForm Hook
 * Manages medical conditions and medications form state with improved error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../../../../system/store/userStore';
import type { HealthProfileV2 } from '../../../../domain/health';
import logger from '../../../../lib/utils/logger';
import { useHealthProfileSave } from './useHealthProfileSave';
import { useHealthFormDirtyState } from './useHealthFormDirtyState';

export function useMedicalConditionsForm() {
  const { profile } = useUserStore();
  const { saveSection, isSectionSaving } = useHealthProfileSave();
  const health = (profile as any)?.health as HealthProfileV2 | undefined;

  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [hasDeclaredNoConditions, setHasDeclaredNoConditions] = useState(false);
  const [hasDeclaredNoMedications, setHasDeclaredNoMedications] = useState(false);
  const [initialState, setInitialState] = useState({
    conditions: [] as string[],
    medications: [] as string[],
    hasDeclaredNoConditions: false,
    hasDeclaredNoMedications: false,
  });

  // Initialize from profile
  useEffect(() => {
    const conditionsData = health?.medical_history?.conditions || [];
    const medicationsData = health?.medical_history?.medications || [];
    const noConditions = health?.no_medical_conditions || false;
    const noMedications = health?.no_medications || false;

    setConditions(conditionsData);
    setMedications(medicationsData);
    setHasDeclaredNoConditions(noConditions);
    setHasDeclaredNoMedications(noMedications);

    // Always update initial state when database values change
    setInitialState({
      conditions: conditionsData,
      medications: medicationsData,
      hasDeclaredNoConditions: noConditions,
      hasDeclaredNoMedications: noMedications,
    });

    logger.debug('MEDICAL_CONDITIONS_FORM', 'Initialized from database', {
      conditionsCount: conditionsData.length,
      medicationsCount: medicationsData.length,
      noConditions,
      noMedications,
      timestamp: new Date().toISOString(),
    });
  }, [
    health?.medical_history?.conditions,
    health?.medical_history?.medications,
    health?.no_medical_conditions,
    health?.no_medications,
  ]);

  // Use intelligent dirty state detection
  const { isDirty, changedFieldsCount, resetDirtyState } = useHealthFormDirtyState({
    currentValues: { conditions, medications, hasDeclaredNoConditions, hasDeclaredNoMedications },
    initialValues: initialState,
    formName: 'MEDICAL_CONDITIONS',
  });

  const addCondition = useCallback(() => {
    if (newCondition.trim()) {
      setConditions(prev => [...prev, newCondition.trim()]);
      setNewCondition('');
      if (hasDeclaredNoConditions) {
        setHasDeclaredNoConditions(false);
      }
      logger.info('MEDICAL_CONDITIONS_FORM', 'Added condition', {
        condition: newCondition.trim(),
      });
    }
  }, [newCondition, hasDeclaredNoConditions]);

  const removeCondition = useCallback((index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
    logger.info('MEDICAL_CONDITIONS_FORM', 'Removed condition', { index });
  }, []);

  const addMedication = useCallback(() => {
    if (newMedication.trim()) {
      setMedications(prev => [...prev, newMedication.trim()]);
      setNewMedication('');
      if (hasDeclaredNoMedications) {
        setHasDeclaredNoMedications(false);
      }
      logger.info('MEDICAL_CONDITIONS_FORM', 'Added medication', {
        medication: newMedication.trim(),
      });
    }
  }, [newMedication, hasDeclaredNoMedications]);

  const removeMedication = useCallback((index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
    logger.info('MEDICAL_CONDITIONS_FORM', 'Removed medication', { index });
  }, []);

  const handleDeclareNoConditions = useCallback(() => {
    const newState = !hasDeclaredNoConditions;
    setHasDeclaredNoConditions(newState);
    if (newState) {
      setConditions([]);
      logger.info('MEDICAL_CONDITIONS_FORM', 'User declared no medical conditions');
    }
  }, [hasDeclaredNoConditions]);

  const handleDeclareNoMedications = useCallback(() => {
    const newState = !hasDeclaredNoMedications;
    setHasDeclaredNoMedications(newState);
    if (newState) {
      setMedications([]);
      logger.info('MEDICAL_CONDITIONS_FORM', 'User declared no medications');
    }
  }, [hasDeclaredNoMedications]);

  const saveChanges = useCallback(async () => {
    try {
      logger.info('MEDICAL_CONDITIONS_FORM', 'Saving medical conditions and medications', {
        conditionsCount: conditions.length,
        medicationsCount: medications.length,
        noConditions: hasDeclaredNoConditions,
        noMedications: hasDeclaredNoMedications,
      });

      await saveSection({
        section: 'medical_conditions',
        data: {
          conditions,
          medications,
          no_medical_conditions: hasDeclaredNoConditions,
          no_medications: hasDeclaredNoMedications,
        },
        onSuccess: () => {
          setInitialState({
            conditions,
            medications,
            hasDeclaredNoConditions,
            hasDeclaredNoMedications
          });
          resetDirtyState({
            conditions,
            medications,
            hasDeclaredNoConditions,
            hasDeclaredNoMedications
          });
          logger.info('MEDICAL_CONDITIONS_FORM', 'Successfully saved and reset dirty state', {
            conditionsCount: conditions.length,
            medicationsCount: medications.length,
          });
        },
      });
    } catch (error) {
      logger.error('MEDICAL_CONDITIONS_FORM', 'Save failed (already handled by saveSection)', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [conditions, medications, hasDeclaredNoConditions, hasDeclaredNoMedications, saveSection, resetDirtyState]);

  return {
    conditions,
    medications,
    newCondition,
    newMedication,
    setNewCondition,
    setNewMedication,
    addCondition,
    removeCondition,
    addMedication,
    removeMedication,
    onDeclareNoConditions: handleDeclareNoConditions,
    onDeclareNoMedications: handleDeclareNoMedications,
    hasDeclaredNoConditions,
    hasDeclaredNoMedications,
    saveChanges,
    saving: isSectionSaving('medical_conditions'),
    isDirty,
    changedFieldsCount,
  };
}

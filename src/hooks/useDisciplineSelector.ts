/**
 * useDisciplineSelector Hook
 * Hook to manage temporary discipline selection for training sessions
 */

import { useState, useEffect } from 'react';
import type { AgentType } from '../domain/ai/trainingAiTypes';
import { getCoachForDiscipline } from '../utils/disciplineMapper';

interface UseDisciplineSelectorReturn {
  activeDiscipline: string;
  activeCoachType: AgentType;
  setTemporaryDiscipline: (discipline: string) => void;
  clearTemporaryDiscipline: () => void;
  isTemporary: boolean;
}

export function useDisciplineSelector(
  profileDiscipline: string | null
): UseDisciplineSelectorReturn {
  const [temporaryDiscipline, setTemporaryDisciplineState] = useState<string | null>(null);

  useEffect(() => {
    const sessionDiscipline = sessionStorage.getItem('temp-discipline');
    if (sessionDiscipline) {
      setTemporaryDisciplineState(sessionDiscipline);
    }
  }, []);

  const setTemporaryDiscipline = (discipline: string) => {
    setTemporaryDisciplineState(discipline);
    sessionStorage.setItem('temp-discipline', discipline);
  };

  const clearTemporaryDiscipline = () => {
    setTemporaryDisciplineState(null);
    sessionStorage.removeItem('temp-discipline');
  };

  const activeDiscipline = temporaryDiscipline || profileDiscipline || 'strength';
  const activeCoachType = getCoachForDiscipline(activeDiscipline);
  const isTemporary = temporaryDiscipline !== null;

  return {
    activeDiscipline,
    activeCoachType,
    setTemporaryDiscipline,
    clearTemporaryDiscipline,
    isTemporary
  };
}

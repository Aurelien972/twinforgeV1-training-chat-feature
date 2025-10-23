/**
 * useExerciseScroll Hook
 * Handles smooth scrolling to exercise cards with highlight animation
 */

import { useCallback, useState } from 'react';
import { Haptics } from '../utils/haptics';
import logger from '../lib/utils/logger';

export function useExerciseScroll() {
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);

  const scrollToExercise = useCallback((
    exerciseId: string,
    exerciseRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  ) => {
    const cardRef = exerciseRefs.current[exerciseId];

    if (!cardRef) {
      logger.warn('EXERCISE_SCROLL', 'Card ref not found', { exerciseId });
      return;
    }

    Haptics.impact('light');

    cardRef.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    setHighlightedCard(exerciseId);

    setTimeout(() => {
      setHighlightedCard(null);
    }, 2000);

    logger.debug('EXERCISE_SCROLL', 'Scrolled to exercise', {
      exerciseId,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    highlightedCard,
    scrollToExercise
  };
}

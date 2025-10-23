/**
 * useEnduranceTimer Hook
 * Manages timer logic for endurance sessions
 */

import { useEffect, useRef } from 'react';

interface UseEnduranceTimerProps {
  isRunning: boolean;
  isPaused: boolean;
  onTick: () => void;
}

export const useEnduranceTimer = ({ isRunning, isPaused, onTick }: UseEnduranceTimerProps) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(onTick, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, onTick]);

  return timerRef;
};

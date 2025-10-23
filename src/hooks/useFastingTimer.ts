/**
 * Fasting Timer Hook
 * Provides real-time updates for active fasting sessions
 */

import { useEffect } from 'react';

/**
 * Hook that triggers re-renders every second when a fasting session is active
 * This ensures timers and progress bars update in real-time
 */
export function useFastingTimer() {
  // Placeholder - Feature not yet implemented
  useEffect(() => {
    // No-op
  }, []);
}

/**
 * Format seconds to HH:MM:SS display
 */
export function formatTimeHMS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

/**
 * Format seconds to HH:MM display (no seconds)
 */
export function formatTimeHM(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

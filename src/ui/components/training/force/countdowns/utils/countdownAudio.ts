/**
 * Countdown Audio Utilities
 * Audio feedback for countdown components
 */

import { countdownTick as audioCountdownTick, countdownGo as audioCountdownGo } from '../../../../../../audio';

/**
 * Play countdown tick sound
 */
export const playCountdownTick = (currentCount: number, totalDuration: number): void => {
  try {
    audioCountdownTick(currentCount, totalDuration);
  } catch (error) {
    console.warn('Failed to play countdown tick:', error);
  }
};

/**
 * Play countdown go sound
 */
export const playCountdownGo = (): void => {
  try {
    audioCountdownGo();
  } catch (error) {
    console.warn('Failed to play countdown go:', error);
  }
};

/**
 * Determine if audio should be played based on settings
 */
export const shouldPlayAudio = (enabled: boolean = true): boolean => {
  return enabled;
};

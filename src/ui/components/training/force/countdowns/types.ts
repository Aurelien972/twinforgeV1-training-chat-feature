/**
 * Countdown Types
 * Type definitions for countdown components
 */

export interface CountdownConfig {
  duration: number;
  onComplete: () => void;
  enableAudio?: boolean;
  enableHaptics?: boolean;
}

export interface CountdownState {
  count: number;
  isComplete: boolean;
  progress: number;
}

export type CountdownMessageType = 'prepare' | 'ready' | 'almostReady' | 'go';

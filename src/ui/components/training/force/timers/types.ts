/**
 * Timer Types
 * Type definitions for timer components
 */

export interface TimerDisplayProps {
  time: number;
  label: string;
  color: string;
  formatTime: (seconds: number) => string;
  isResting: boolean;
}

export interface ProgressRingProps {
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

export interface TimerAnimationConfig {
  duration: number;
  repeat: boolean | number;
  ease: string | number[];
}

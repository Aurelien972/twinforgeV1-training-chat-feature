/**
 * Controls Types
 * Type definitions for control components
 */

export interface AdjustmentButtonProps {
  label: string;
  icon?: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'increase' | 'decrease' | 'neutral';
}

export type AdjustmentDirection = 'increase' | 'decrease';

export interface AdjustmentAction {
  type: 'sets' | 'reps' | 'load';
  direction: AdjustmentDirection;
  value: number | number[];
}

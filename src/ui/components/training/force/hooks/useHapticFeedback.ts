/**
 * useHapticFeedback Hook
 * Centralized haptic feedback management
 */

import { useCallback } from 'react';
import { Haptics } from '../../../../../utils/haptics';

export type HapticType = 'tap' | 'light' | 'medium' | 'heavy' | 'success' | 'press' | 'impact';

export interface UseHapticFeedbackReturn {
  triggerTap: () => void;
  triggerLight: () => void;
  triggerMedium: () => void;
  triggerHeavy: () => void;
  triggerSuccess: () => void;
  triggerPress: () => void;
  triggerImpact: () => void;
  trigger: (type: HapticType) => void;
}

/**
 * Hook for managing haptic feedback
 */
export const useHapticFeedback = (): UseHapticFeedbackReturn => {
  const triggerTap = useCallback(() => {
    Haptics.tap();
  }, []);

  const triggerLight = useCallback(() => {
    Haptics.impact('light');
  }, []);

  const triggerMedium = useCallback(() => {
    Haptics.impact('medium');
  }, []);

  const triggerHeavy = useCallback(() => {
    Haptics.impact('heavy');
  }, []);

  const triggerSuccess = useCallback(() => {
    Haptics.success();
  }, []);

  const triggerPress = useCallback(() => {
    Haptics.press();
  }, []);

  const triggerImpact = useCallback(() => {
    Haptics.impact();
  }, []);

  const trigger = useCallback((type: HapticType) => {
    switch (type) {
      case 'tap':
        Haptics.tap();
        break;
      case 'light':
        Haptics.impact('light');
        break;
      case 'medium':
        Haptics.impact('medium');
        break;
      case 'heavy':
      case 'impact':
        Haptics.impact('heavy');
        break;
      case 'success':
        Haptics.success();
        break;
      case 'press':
        Haptics.press();
        break;
      default:
        Haptics.tap();
    }
  }, []);

  return {
    triggerTap,
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSuccess,
    triggerPress,
    triggerImpact,
    trigger,
  };
};

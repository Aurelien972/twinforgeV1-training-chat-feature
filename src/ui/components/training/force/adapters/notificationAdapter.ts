/**
 * Notification Adapter
 * Adapter for step2NotificationService to isolate external dependencies
 */

import { step2NotificationService } from '../../../../../system/services/step2NotificationService';

/**
 * Notification adapter interface
 */
export interface NotificationAdapter {
  notifySetsAdjustment: (exerciseName: string, newValue: number, increased: boolean) => void;
  notifyRepsAdjustment: (exerciseName: string, newValue: number, increased: boolean) => void;
  notifyLoadAdjustment: (exerciseName: string, oldValue: number, newValue: number, increased: boolean) => void;
  notifyAlternativeSelection: (originalName: string, newName: string) => void;
}

/**
 * Create notification adapter
 */
export const createNotificationAdapter = (): NotificationAdapter => {
  return {
    notifySetsAdjustment: (exerciseName, newValue, increased) => {
      if (increased) {
        step2NotificationService.onSetsIncreased(exerciseName, newValue);
      } else {
        step2NotificationService.onSetsDecreased(exerciseName, newValue);
      }
    },

    notifyRepsAdjustment: (exerciseName, newValue, increased) => {
      if (increased) {
        step2NotificationService.onRepsIncreased(exerciseName, newValue);
      } else {
        step2NotificationService.onRepsDecreased(exerciseName, newValue);
      }
    },

    notifyLoadAdjustment: (exerciseName, oldValue, newValue, increased) => {
      if (increased) {
        step2NotificationService.onLoadIncreased(exerciseName, oldValue, newValue);
      } else {
        step2NotificationService.onLoadDecreased(exerciseName, oldValue, newValue);
      }
    },

    notifyAlternativeSelection: (originalName, newName) => {
      step2NotificationService.onAlternativeSelected(originalName, newName);
    },
  };
};

/**
 * Default notification adapter instance
 */
export const notificationAdapter = createNotificationAdapter();

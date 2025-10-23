/**
 * useEnduranceNotifications Hook
 * Manages coach notifications during endurance sessions
 */

import { useEffect } from 'react';
import { enduranceCoachNotificationService } from '../../../../../system/services/enduranceCoachNotificationService';
import type { EnduranceBlock } from '../../../../../domain/enduranceSession';

interface UseEnduranceNotificationsProps {
  sessionId: string;
  isRunning: boolean;
  isPaused: boolean;
  sessionTime: number;
  allBlocks: EnduranceBlock[];
}

export const useEnduranceNotifications = ({
  sessionId,
  isRunning,
  isPaused,
  sessionTime,
  allBlocks,
}: UseEnduranceNotificationsProps) => {
  useEffect(() => {
    if (sessionId) {
      enduranceCoachNotificationService.initialize(sessionId);
    }

    return () => {
      enduranceCoachNotificationService.cleanup();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const encouragementInterval = setInterval(() => {
      enduranceCoachNotificationService.onEncouragement();
    }, 5 * 60 * 1000);

    return () => clearInterval(encouragementInterval);
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (!isRunning) return;

    const totalDuration = allBlocks.reduce((sum, block) => sum + (block.duration * 60), 0);
    const halfwayPoint = totalDuration / 2;

    if (sessionTime === Math.floor(halfwayPoint)) {
      enduranceCoachNotificationService.onHalfwayPoint();
    }

    if (sessionTime === totalDuration - (5 * 60)) {
      enduranceCoachNotificationService.onFinalStretch();
    }
  }, [sessionTime, isRunning, allBlocks]);
};

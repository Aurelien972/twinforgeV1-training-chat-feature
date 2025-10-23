/**
 * Session Wearable Collection Service
 * Manages wearable data collection during training sessions
 */

import logger from '../../lib/utils/logger';
import { trainingWearableIntegrationService } from './trainingWearableIntegrationService';
import type { WearableSessionMetrics } from '../store/trainingPipeline/types';

interface TrackingSession {
  sessionId: string;
  userId: string;
  startTime: string;
  isActive: boolean;
}

class SessionWearableCollectionService {
  private static instance: SessionWearableCollectionService;
  private activeSessions: Map<string, TrackingSession> = new Map();

  private constructor() {}

  static getInstance(): SessionWearableCollectionService {
    if (!SessionWearableCollectionService.instance) {
      SessionWearableCollectionService.instance = new SessionWearableCollectionService();
    }
    return SessionWearableCollectionService.instance;
  }

  /**
   * Start tracking wearable data for a training session
   */
  async startSessionTracking(
    sessionId: string,
    userId: string,
    startTime?: string
  ): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    try {
      logger.info('SESSION_WEARABLE_COLLECTION', 'Starting wearable tracking', {
        sessionId,
        userId,
        timestamp: startTime || new Date().toISOString()
      });

      const trackingSession: TrackingSession = {
        sessionId,
        userId,
        startTime: startTime || new Date().toISOString(),
        isActive: true
      };

      this.activeSessions.set(sessionId, trackingSession);

      logger.info('SESSION_WEARABLE_COLLECTION', 'Wearable tracking started successfully', {
        sessionId,
        activeSessionsCount: this.activeSessions.size
      });

      return { success: true };
    } catch (error) {
      logger.error('SESSION_WEARABLE_COLLECTION', 'Failed to start wearable tracking', {
        sessionId,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Stop tracking wearable data for a training session
   */
  async stopSessionTracking(
    sessionId: string,
    endTime?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const trackingSession = this.activeSessions.get(sessionId);

      if (!trackingSession) {
        logger.warn('SESSION_WEARABLE_COLLECTION', 'No active tracking session found', {
          sessionId
        });
        return { success: true };
      }

      trackingSession.isActive = false;

      logger.info('SESSION_WEARABLE_COLLECTION', 'Wearable tracking stopped', {
        sessionId,
        endTime: endTime || new Date().toISOString(),
        duration: Date.now() - new Date(trackingSession.startTime).getTime()
      });

      return { success: true };
    } catch (error) {
      logger.error('SESSION_WEARABLE_COLLECTION', 'Failed to stop wearable tracking', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get wearable data collected during session
   * This function enriches session with actual wearable metrics
   */
  async getSessionWearableData(
    sessionId: string,
    userId: string,
    startTime?: string,
    endTime?: string
  ): Promise<{
    success: boolean;
    data?: WearableSessionMetrics;
    error?: string;
  }> {
    try {
      const trackingSession = this.activeSessions.get(sessionId);

      if (!trackingSession) {
        logger.warn('SESSION_WEARABLE_COLLECTION', 'No tracking session found for data collection', {
          sessionId,
          userId
        });
        return {
          success: false,
          error: 'No tracking session found'
        };
      }

      const effectiveStartTime = startTime || trackingSession.startTime;
      const effectiveEndTime = endTime || new Date().toISOString();

      logger.info('SESSION_WEARABLE_COLLECTION', 'Collecting wearable data', {
        sessionId,
        userId,
        startTime: effectiveStartTime,
        endTime: effectiveEndTime,
        durationMinutes: Math.round(
          (new Date(effectiveEndTime).getTime() - new Date(effectiveStartTime).getTime()) / 60000
        )
      });

      const enrichedData = await trainingWearableIntegrationService.enrichTrainingSessionWithWearableData(
        userId,
        effectiveStartTime,
        effectiveEndTime
      );

      if (!enrichedData || !enrichedData.avgHeartRate) {
        logger.warn('SESSION_WEARABLE_COLLECTION', 'No wearable data available for session', {
          sessionId,
          userId,
          hasEnrichedData: !!enrichedData
        });
        return {
          success: false,
          error: 'No wearable data available'
        };
      }

      logger.info('SESSION_WEARABLE_COLLECTION', 'Wearable data collected successfully', {
        sessionId,
        avgHeartRate: enrichedData.avgHeartRate,
        maxHeartRate: enrichedData.maxHeartRate,
        caloriesBurned: enrichedData.caloriesBurned,
        dataPoints: enrichedData.heartRateData?.length || 0
      });

      this.activeSessions.delete(sessionId);

      return {
        success: true,
        data: enrichedData as WearableSessionMetrics
      };
    } catch (error) {
      logger.error('SESSION_WEARABLE_COLLECTION', 'Failed to collect wearable data', {
        sessionId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      this.activeSessions.delete(sessionId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to collect wearable data'
      };
    }
  }

  /**
   * Check if session is currently being tracked
   */
  isSessionTracking(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    return session?.isActive || false;
  }

  /**
   * Get active tracking session info
   */
  getActiveSession(sessionId: string): TrackingSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Clean up inactive sessions (called periodically or on errors)
   */
  cleanupInactiveSessions(): void {
    const now = Date.now();
    const maxAge = 4 * 60 * 60 * 1000; // 4 hours

    this.activeSessions.forEach((session, sessionId) => {
      const age = now - new Date(session.startTime).getTime();
      if (age > maxAge) {
        logger.warn('SESSION_WEARABLE_COLLECTION', 'Cleaning up stale tracking session', {
          sessionId,
          ageHours: Math.round(age / (60 * 60 * 1000))
        });
        this.activeSessions.delete(sessionId);
      }
    });
  }
}

export const sessionWearableCollectionService = SessionWearableCollectionService.getInstance();

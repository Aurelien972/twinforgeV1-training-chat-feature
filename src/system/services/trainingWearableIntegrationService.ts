/**
 * Training Wearable Integration Service
 * Integrates wearable device data with training sessions
 */

import { wearableDataService } from './wearableDataService';
import type { WearableHealthData, NormalizedWorkout } from '../../domain/connectedDevices';
import logger from '../../lib/utils/logger';

export class TrainingWearableIntegrationService {
  async enrichTrainingSessionWithWearableData(
    sessionId: string,
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    heartRateData: WearableHealthData[];
    caloriesBurned?: number;
    avgHeartRate?: number;
    maxHeartRate?: number;
    zones?: any;
  }> {
    try {
      const heartRateData = await wearableDataService.getHealthData(
        userId,
        'heart_rate',
        startTime,
        endTime
      );

      if (heartRateData.length === 0) {
        return { heartRateData: [] };
      }

      const heartRates = heartRateData
        .map((d) => d.valueNumeric)
        .filter((v): v is number => v !== undefined);

      const avgHeartRate = heartRates.reduce((sum, v) => sum + v, 0) / heartRates.length;
      const maxHeartRate = Math.max(...heartRates);

      const zones = this.calculateHeartRateZones(heartRates, maxHeartRate);

      const caloriesData = await wearableDataService.getHealthData(
        userId,
        'calories',
        startTime,
        endTime
      );

      const caloriesBurned = caloriesData.reduce((sum, d) => sum + (d.valueNumeric || 0), 0);

      logger.info('WEARABLE_INTEGRATION', 'Enriched session with wearable data', {
        sessionId,
        dataPoints: heartRateData.length,
        avgHeartRate,
        maxHeartRate,
        caloriesBurned,
      });

      return {
        heartRateData,
        caloriesBurned,
        avgHeartRate: Math.round(avgHeartRate),
        maxHeartRate: Math.round(maxHeartRate),
        zones,
      };
    } catch (error) {
      logger.error('WEARABLE_INTEGRATION', 'Failed to enrich session', { error, sessionId });
      return { heartRateData: [] };
    }
  }

  async findMatchingWorkout(
    userId: string,
    sessionStartTime: Date,
    sessionDuration: number
  ): Promise<NormalizedWorkout | null> {
    try {
      const timeWindow = 15 * 60 * 1000;
      const searchStart = new Date(sessionStartTime.getTime() - timeWindow);
      const searchEnd = new Date(sessionStartTime.getTime() + timeWindow);

      const workouts = await wearableDataService.getLatestWorkouts(userId, 20);

      const matchingWorkout = workouts.find((workout) => {
        const workoutStart = new Date(workout.startTime);
        const timeDiff = Math.abs(workoutStart.getTime() - sessionStartTime.getTime());
        const durationDiff = Math.abs(workout.durationSeconds - sessionDuration * 60);

        return timeDiff < timeWindow && durationDiff < 600;
      });

      if (matchingWorkout) {
        logger.info('WEARABLE_INTEGRATION', 'Found matching workout', {
          userId,
          workoutId: matchingWorkout.id,
        });
      }

      return matchingWorkout || null;
    } catch (error) {
      logger.error('WEARABLE_INTEGRATION', 'Failed to find matching workout', { error, userId });
      return null;
    }
  }

  async getRecoveryMetrics(userId: string): Promise<{
    restingHeartRate?: number;
    hrv?: number;
    sleepHours?: number;
    recoveryScore?: number;
  }> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const now = new Date();

      const [rhrData, hrvData, sleepData] = await Promise.all([
        wearableDataService.getHealthData(userId, 'resting_heart_rate', yesterday, now),
        wearableDataService.getHealthData(userId, 'hrv', yesterday, now),
        wearableDataService.getHealthData(userId, 'sleep', yesterday, now),
      ]);

      const restingHeartRate = rhrData[0]?.valueNumeric;
      const hrv = hrvData[0]?.valueNumeric;
      const sleepHours = sleepData.reduce((sum, d) => sum + (d.valueNumeric || 0), 0);

      let recoveryScore: number | undefined;
      if (restingHeartRate && hrv) {
        recoveryScore = this.calculateRecoveryScore(restingHeartRate, hrv, sleepHours);
      }

      logger.info('WEARABLE_INTEGRATION', 'Retrieved recovery metrics', {
        userId,
        restingHeartRate,
        hrv,
        sleepHours,
        recoveryScore,
      });

      return { restingHeartRate, hrv, sleepHours, recoveryScore };
    } catch (error) {
      logger.error('WEARABLE_INTEGRATION', 'Failed to get recovery metrics', { error, userId });
      return {};
    }
  }

  async suggestIntensityAdjustment(userId: string): Promise<{
    shouldReduceIntensity: boolean;
    reason?: string;
    adjustmentPercent?: number;
  }> {
    try {
      const recovery = await this.getRecoveryMetrics(userId);

      if (!recovery.recoveryScore) {
        return { shouldReduceIntensity: false };
      }

      if (recovery.recoveryScore < 40) {
        return {
          shouldReduceIntensity: true,
          reason: 'Récupération insuffisante détectée',
          adjustmentPercent: -20,
        };
      }

      if (recovery.recoveryScore < 60) {
        return {
          shouldReduceIntensity: true,
          reason: 'Récupération modérée',
          adjustmentPercent: -10,
        };
      }

      return { shouldReduceIntensity: false };
    } catch (error) {
      logger.error('WEARABLE_INTEGRATION', 'Failed to suggest intensity adjustment', {
        error,
        userId,
      });
      return { shouldReduceIntensity: false };
    }
  }

  private calculateHeartRateZones(
    heartRates: number[],
    maxHR: number
  ): {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  } {
    const zones = {
      zone1: 0,
      zone2: 0,
      zone3: 0,
      zone4: 0,
      zone5: 0,
    };

    heartRates.forEach((hr) => {
      const percent = (hr / maxHR) * 100;

      if (percent < 60) zones.zone1++;
      else if (percent < 70) zones.zone2++;
      else if (percent < 80) zones.zone3++;
      else if (percent < 90) zones.zone4++;
      else zones.zone5++;
    });

    return zones;
  }

  private calculateRecoveryScore(
    restingHeartRate: number,
    hrv: number,
    sleepHours: number
  ): number {
    let score = 50;

    if (restingHeartRate < 60) score += 15;
    else if (restingHeartRate < 70) score += 10;
    else if (restingHeartRate > 80) score -= 15;

    if (hrv > 60) score += 20;
    else if (hrv > 40) score += 10;
    else if (hrv < 30) score -= 15;

    if (sleepHours >= 7) score += 15;
    else if (sleepHours >= 6) score += 5;
    else if (sleepHours < 5) score -= 20;

    return Math.max(0, Math.min(100, score));
  }
}

export const trainingWearableIntegrationService = new TrainingWearableIntegrationService();

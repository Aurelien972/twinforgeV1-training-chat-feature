/**
 * Training Recovery Service
 * Calculates recovery metrics based on session data, RPE, and time elapsed
 */

import type { RecoveryData, OptimalWindow } from '../../domain/trainingToday';

const FULL_RECOVERY_HOURS = 48;
const RPE_MULTIPLIER = 1.2;

export class TrainingRecoveryService {
  /**
   * Calculate muscular recovery percentage (0-100)
   * Based on time elapsed and RPE of last session
   */
  calculateMuscularRecovery(
    lastSessionDate: Date,
    lastSessionRpe: number,
    currentDate: Date = new Date()
  ): number {
    const hoursElapsed = (currentDate.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60);

    const baseRecoveryRate = hoursElapsed / FULL_RECOVERY_HOURS;

    const rpeAdjustment = (10 - lastSessionRpe) / 10;
    const adjustedRate = baseRecoveryRate * (0.7 + rpeAdjustment * 0.3);

    const recoveryPercentage = Math.min(100, adjustedRate * 100);

    return Math.round(recoveryPercentage);
  }

  /**
   * Calculate systemic recovery percentage (0-100)
   * Recovers slightly slower than muscular
   */
  calculateSystemicRecovery(
    lastSessionDate: Date,
    lastSessionRpe: number,
    currentDate: Date = new Date()
  ): number {
    const hoursElapsed = (currentDate.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60);

    const baseRecoveryRate = hoursElapsed / (FULL_RECOVERY_HOURS * RPE_MULTIPLIER);

    const rpeAdjustment = (10 - lastSessionRpe) / 10;
    const adjustedRate = baseRecoveryRate * (0.6 + rpeAdjustment * 0.4);

    const recoveryPercentage = Math.min(100, adjustedRate * 100);

    return Math.round(recoveryPercentage);
  }

  /**
   * Calculate optimal training windows for next session
   */
  calculateOptimalWindows(nextSessionDate: Date = new Date()): OptimalWindow[] {
    const morningWindow: OptimalWindow = {
      start: new Date(nextSessionDate.setHours(7, 0, 0, 0)),
      end: new Date(nextSessionDate.setHours(10, 0, 0, 0)),
      type: 'morning',
      reason: 'Énergie élevée après repos nocturne'
    };

    const eveningWindow: OptimalWindow = {
      start: new Date(nextSessionDate.setHours(17, 0, 0, 0)),
      end: new Date(nextSessionDate.setHours(20, 0, 0, 0)),
      type: 'evening',
      reason: 'Performance musculaire optimale'
    };

    return [morningWindow, eveningWindow];
  }

  /**
   * Calculate recovery data from last session
   */
  getRecoveryData(
    lastSessionDate: Date,
    lastSessionRpe: number,
    currentDate: Date = new Date()
  ): RecoveryData {
    return {
      muscular: this.calculateMuscularRecovery(lastSessionDate, lastSessionRpe, currentDate),
      systemic: this.calculateSystemicRecovery(lastSessionDate, lastSessionRpe, currentDate),
      lastCalculated: currentDate
    };
  }

  /**
   * Calculate readiness score (0-10) based on recovery
   */
  calculateReadinessScore(recovery: RecoveryData): number {
    const averageRecovery = (recovery.muscular + recovery.systemic) / 2;
    return Math.round((averageRecovery / 100) * 10);
  }

  /**
   * Get readiness status from recovery data
   */
  getReadinessStatus(recovery: RecoveryData): 'ready' | 'recovering' | 'fatigued' {
    const averageRecovery = (recovery.muscular + recovery.systemic) / 2;

    if (averageRecovery >= 75) return 'ready';
    if (averageRecovery >= 40) return 'recovering';
    return 'fatigued';
  }
}

export const trainingRecoveryService = new TrainingRecoveryService();

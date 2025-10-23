/**
 * Record Detection Service
 * Real-time detection of new personal records during training sessions
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';

export interface RecordDetectionResult {
  isNewRecord: boolean;
  recordType: 'max_weight' | 'max_volume' | 'max_distance' | 'max_duration';
  newValue: number;
  previousRecord: number | null;
  improvement: number | null;
  exerciseName: string;
  discipline: string;
}

class RecordDetectionService {
  private recordCheckCache: Map<string, { value: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 1000;

  async checkForNewRecord(
    userId: string,
    exerciseName: string,
    discipline: string,
    recordType: 'max_weight' | 'max_volume' | 'max_distance' | 'max_duration',
    currentValue: number,
    unit: string
  ): Promise<RecordDetectionResult> {
    try {
      const cacheKey = `${userId}-${exerciseName}-${recordType}`;
      const cached = this.recordCheckCache.get(cacheKey);

      let previousRecord: number | null = null;

      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        previousRecord = cached.value;
      } else {
        const { data: existingRecord } = await supabase
          .from('training_personal_records')
          .select('value')
          .eq('user_id', userId)
          .eq('exercise_name', exerciseName)
          .eq('record_type', recordType)
          .eq('discipline', discipline)
          .maybeSingle();

        previousRecord = existingRecord?.value || null;

        if (previousRecord) {
          this.recordCheckCache.set(cacheKey, {
            value: previousRecord,
            timestamp: Date.now()
          });
        }
      }

      const isNewRecord = previousRecord === null || currentValue > previousRecord;

      let improvement: number | null = null;
      if (isNewRecord && previousRecord) {
        improvement = Math.round(((currentValue - previousRecord) / previousRecord) * 100);
      }

      const result: RecordDetectionResult = {
        isNewRecord,
        recordType,
        newValue: currentValue,
        previousRecord,
        improvement,
        exerciseName,
        discipline
      };

      if (isNewRecord) {
        logger.info('RECORD_DETECTION', 'New personal record detected', {
          exerciseName,
          recordType,
          newValue: currentValue,
          previousRecord,
          improvement
        });
      }

      return result;
    } catch (error) {
      logger.error('RECORD_DETECTION', 'Failed to check for new record', { error });
      return {
        isNewRecord: false,
        recordType,
        newValue: currentValue,
        previousRecord: null,
        improvement: null,
        exerciseName,
        discipline
      };
    }
  }

  async saveNewRecord(
    userId: string,
    sessionId: string,
    detection: RecordDetectionResult,
    unit: string
  ): Promise<boolean> {
    try {
      if (!detection.isNewRecord) {
        return false;
      }

      const { error } = await supabase
        .from('training_personal_records')
        .upsert({
          user_id: userId,
          discipline: detection.discipline,
          exercise_name: detection.exerciseName,
          record_type: detection.recordType,
          value: detection.newValue,
          unit,
          session_id: sessionId,
          previous_record: detection.previousRecord,
          improvement: detection.improvement,
          achieved_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,discipline,exercise_name,record_type'
        });

      if (error) {
        logger.error('RECORD_DETECTION', 'Failed to save new record', { error });
        return false;
      }

      this.recordCheckCache.delete(`${userId}-${detection.exerciseName}-${detection.recordType}`);

      logger.info('RECORD_DETECTION', 'New record saved successfully', {
        exerciseName: detection.exerciseName,
        recordType: detection.recordType,
        value: detection.newValue
      });

      return true;
    } catch (error) {
      logger.error('RECORD_DETECTION', 'Exception while saving new record', { error });
      return false;
    }
  }

  async checkSetForRecords(
    userId: string,
    sessionId: string,
    exerciseName: string,
    discipline: string,
    weight: number,
    reps: number,
    unit: string = 'kg'
  ): Promise<RecordDetectionResult[]> {
    const results: RecordDetectionResult[] = [];

    const maxWeightCheck = await this.checkForNewRecord(
      userId,
      exerciseName,
      discipline,
      'max_weight',
      weight,
      unit
    );
    results.push(maxWeightCheck);

    const volume = weight * reps;
    const maxVolumeCheck = await this.checkForNewRecord(
      userId,
      exerciseName,
      discipline,
      'max_volume',
      volume,
      `${unit}×reps`
    );
    results.push(maxVolumeCheck);

    for (const result of results) {
      if (result.isNewRecord) {
        await this.saveNewRecord(userId, sessionId, result, result.recordType === 'max_weight' ? unit : `${unit}×reps`);
      }
    }

    return results.filter(r => r.isNewRecord);
  }

  async checkEnduranceForRecords(
    userId: string,
    sessionId: string,
    exerciseName: string,
    discipline: string,
    distance: number,
    duration: number,
    distanceUnit: string = 'km',
    durationUnit: string = 'min'
  ): Promise<RecordDetectionResult[]> {
    const results: RecordDetectionResult[] = [];

    if (distance > 0) {
      const maxDistanceCheck = await this.checkForNewRecord(
        userId,
        exerciseName,
        discipline,
        'max_distance',
        distance,
        distanceUnit
      );
      results.push(maxDistanceCheck);

      if (maxDistanceCheck.isNewRecord) {
        await this.saveNewRecord(userId, sessionId, maxDistanceCheck, distanceUnit);
      }
    }

    if (duration > 0) {
      const maxDurationCheck = await this.checkForNewRecord(
        userId,
        exerciseName,
        discipline,
        'max_duration',
        duration,
        durationUnit
      );
      results.push(maxDurationCheck);

      if (maxDurationCheck.isNewRecord) {
        await this.saveNewRecord(userId, sessionId, maxDurationCheck, durationUnit);
      }
    }

    return results.filter(r => r.isNewRecord);
  }

  clearCache(): void {
    this.recordCheckCache.clear();
  }

  clearCacheForUser(userId: string): void {
    for (const key of this.recordCheckCache.keys()) {
      if (key.startsWith(userId)) {
        this.recordCheckCache.delete(key);
      }
    }
  }
}

export const recordDetectionService = new RecordDetectionService();

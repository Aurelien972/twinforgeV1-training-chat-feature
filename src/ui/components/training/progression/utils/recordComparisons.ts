/**
 * Record Comparison Utilities
 * Functions for comparing and analyzing personal records
 */

import type { PersonalRecord, RecordComparison, RecordsByMuscleGroup } from '../types';
import { IMPROVEMENT_THRESHOLDS } from '../config/constants';

/**
 * Compare current record with previous record
 */
export function compareRecords(
  current: number,
  previous: number | undefined
): RecordComparison {
  if (previous === undefined) {
    return {
      current,
      previous: undefined,
      improvement: undefined,
      improvementPercentage: undefined,
      isNewRecord: true,
    };
  }
  
  const improvement = current - previous;
  const improvementPercentage = ((improvement / previous) * 100);
  
  return {
    current,
    previous,
    improvement,
    improvementPercentage,
    isNewRecord: current > previous,
  };
}

/**
 * Get improvement category based on percentage
 */
export function getImprovementCategory(percentage: number): 'small' | 'moderate' | 'significant' | 'major' {
  const abs = Math.abs(percentage);
  
  if (abs >= IMPROVEMENT_THRESHOLDS.MAJOR) return 'major';
  if (abs >= IMPROVEMENT_THRESHOLDS.SIGNIFICANT) return 'significant';
  if (abs >= IMPROVEMENT_THRESHOLDS.MODERATE) return 'moderate';
  return 'small';
}

/**
 * Get improvement color based on percentage
 */
export function getImprovementColor(percentage: number): string {
  if (percentage >= IMPROVEMENT_THRESHOLDS.SIGNIFICANT) return '#22C55E';
  if (percentage >= IMPROVEMENT_THRESHOLDS.MODERATE) return '#10B981';
  if (percentage >= IMPROVEMENT_THRESHOLDS.SMALL) return '#F59E0B';
  if (percentage < 0) return '#EF4444';
  return '#94A3B8';
}

/**
 * Group records by muscle group
 */
export function groupRecordsByMuscleGroup(
  records: PersonalRecord[]
): RecordsByMuscleGroup[] {
  const grouped = new Map<string, PersonalRecord[]>();
  
  for (const record of records) {
    const muscleGroup = record.muscleGroup || 'other';
    if (!grouped.has(muscleGroup)) {
      grouped.set(muscleGroup, []);
    }
    grouped.get(muscleGroup)!.push(record);
  }
  
  const result: RecordsByMuscleGroup[] = [];
  
  for (const [muscleGroup, groupRecords] of grouped.entries()) {
    const bestRecord = groupRecords.reduce((best, current) => {
      return current.value > best.value ? current : best;
    });
    
    result.push({
      muscleGroup,
      records: groupRecords,
      bestRecord,
    });
  }
  
  return result;
}

/**
 * Get most recent records
 */
export function getRecentRecords(
  records: PersonalRecord[],
  limit: number = 5
): PersonalRecord[] {
  return [...records]
    .sort((a, b) => {
      const dateA = new Date(a.achievedAt).getTime();
      const dateB = new Date(b.achievedAt).getTime();
      return dateB - dateA;
    })
    .slice(0, limit);
}

/**
 * Get best records for each exercise
 */
export function getBestRecordsByExercise(
  records: PersonalRecord[]
): Map<string, PersonalRecord> {
  const bestRecords = new Map<string, PersonalRecord>();
  
  for (const record of records) {
    const existing = bestRecords.get(record.exerciseName);
    if (!existing || record.value > existing.value) {
      bestRecords.set(record.exerciseName, record);
    }
  }
  
  return bestRecords;
}

/**
 * Calculate average improvement rate
 */
export function calculateAverageImprovementRate(
  records: PersonalRecord[]
): number {
  if (records.length < 2) return 0;
  
  const sortedRecords = [...records].sort((a, b) => {
    const dateA = new Date(a.achievedAt).getTime();
    const dateB = new Date(b.achievedAt).getTime();
    return dateA - dateB;
  });
  
  let totalImprovement = 0;
  let count = 0;
  
  for (let i = 1; i < sortedRecords.length; i++) {
    const previous = sortedRecords[i - 1];
    const current = sortedRecords[i];
    
    if (previous.exerciseName === current.exerciseName) {
      const improvement = ((current.value - previous.value) / previous.value) * 100;
      totalImprovement += improvement;
      count++;
    }
  }
  
  return count > 0 ? totalImprovement / count : 0;
}

/**
 * Check if record is a personal best
 */
export function isPersonalBest(
  record: PersonalRecord,
  allRecords: PersonalRecord[]
): boolean {
  const exerciseRecords = allRecords.filter(
    r => r.exerciseName === record.exerciseName
  );
  
  return exerciseRecords.every(r => record.value >= r.value);
}

/**
 * Get record progression timeline
 */
export function getRecordProgression(
  exerciseName: string,
  records: PersonalRecord[]
): PersonalRecord[] {
  return records
    .filter(r => r.exerciseName === exerciseName)
    .sort((a, b) => {
      const dateA = new Date(a.achievedAt).getTime();
      const dateB = new Date(b.achievedAt).getTime();
      return dateA - dateB;
    });
}

/**
 * Calculate time between records
 */
export function calculateTimeBetweenRecords(
  record1: PersonalRecord,
  record2: PersonalRecord
): number {
  const date1 = new Date(record1.achievedAt).getTime();
  const date2 = new Date(record2.achievedAt).getTime();
  return Math.abs(date2 - date1);
}

/**
 * Volume Calculation Service
 * Calculates training volume with appropriate units based on coach type
 */

import type { AgentType } from '../../domain/ai/trainingAiTypes';
import logger from '../../lib/utils/logger';

export interface VolumeResult {
  value: number;
  unit: string;
  displayText: string;
}

export interface VolumeThresholds {
  low: number;
  optimal: number;
  high: number;
  unit: string;
}

interface SessionHistory {
  id: string;
  created_at: string;
  discipline: string;
  prescription: any;
  duration_actual_min?: number;
}

/**
 * Calculate volume for a single session based on coach type
 */
export function calculateSessionVolume(
  session: SessionHistory,
  coachType: AgentType
): VolumeResult {
  const exercises = session.prescription?.exercises || [];

  switch (coachType) {
    case 'coach-force':
      return calculateForceVolume(exercises);

    case 'coach-endurance':
      return calculateEnduranceVolume(session);

    case 'coach-functional':
      return calculateFunctionalVolume(exercises, session);

    case 'coach-calisthenics':
      return calculateCalisthenicsVolume(exercises);

    case 'coach-competitions':
      return calculateCompetitionsVolume(exercises, session);

    default:
      return calculateForceVolume(exercises);
  }
}

/**
 * Calculate total volume for multiple sessions
 */
export function calculateTotalVolume(
  sessions: SessionHistory[],
  coachType: AgentType
): VolumeResult {
  const totalValue = sessions.reduce((sum, session) => {
    const sessionVolume = calculateSessionVolume(session, coachType);
    return sum + sessionVolume.value;
  }, 0);

  const unit = getUnitForCoach(coachType);

  return {
    value: totalValue,
    unit,
    displayText: formatVolume(totalValue, unit)
  };
}

/**
 * Get adaptive thresholds based on personal history
 */
export function getAdaptiveThresholds(
  recentSessions: SessionHistory[],
  coachType: AgentType
): VolumeThresholds {
  if (recentSessions.length < 3) {
    return getDefaultThresholds(coachType);
  }

  const volumes = recentSessions.map(s =>
    calculateSessionVolume(s, coachType).value
  );

  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const unit = getUnitForCoach(coachType);

  return {
    low: Math.round(avgVolume * 0.7),
    optimal: Math.round(avgVolume),
    high: Math.round(avgVolume * 1.3),
    unit
  };
}

/**
 * Analyze volume status
 */
export function analyzeVolumeStatus(
  currentVolume: number,
  thresholds: VolumeThresholds
): 'low' | 'optimal' | 'high' {
  if (currentVolume < thresholds.low) {
    return 'low';
  }
  if (currentVolume > thresholds.high) {
    return 'high';
  }
  return 'optimal';
}

/**
 * Calculate Force volume (sets x reps)
 */
function calculateForceVolume(exercises: any[]): VolumeResult {
  const totalReps = exercises.reduce((sum, ex) => {
    const sets = ex.sets || 0;
    const reps = Array.isArray(ex.reps) ? ex.reps[0] : (ex.reps || 0);
    return sum + (sets * reps);
  }, 0);

  return {
    value: totalReps,
    unit: 'reps',
    displayText: formatVolume(totalReps, 'reps')
  };
}

/**
 * Calculate Endurance volume (duration in minutes)
 */
function calculateEnduranceVolume(session: SessionHistory): VolumeResult {
  const duration = session.duration_actual_min || 0;

  return {
    value: duration,
    unit: 'min',
    displayText: formatVolume(duration, 'min')
  };
}

/**
 * Calculate Functional volume (mixed approach)
 */
function calculateFunctionalVolume(exercises: any[], session: SessionHistory): VolumeResult {
  const prescription = session.prescription || {};

  if (prescription.format === 'AMRAP' || prescription.format === 'EMOM') {
    const duration = session.duration_actual_min || prescription.duration || 0;
    return {
      value: duration,
      unit: 'min',
      displayText: formatVolume(duration, 'min')
    };
  }

  if (prescription.format === 'For Time' || prescription.rounds) {
    const rounds = prescription.rounds || 1;
    const repsPerRound = exercises.reduce((sum, ex) => {
      const reps = Array.isArray(ex.reps) ? ex.reps[0] : (ex.reps || 0);
      return sum + reps;
    }, 0);

    const totalReps = rounds * repsPerRound;
    return {
      value: totalReps,
      unit: 'reps',
      displayText: formatVolume(totalReps, 'reps')
    };
  }

  return calculateForceVolume(exercises);
}

/**
 * Calculate Calisthenics volume (reps)
 */
function calculateCalisthenicsVolume(exercises: any[]): VolumeResult {
  return calculateForceVolume(exercises);
}

/**
 * Calculate Competitions volume (depends on format)
 */
function calculateCompetitionsVolume(exercises: any[], session: SessionHistory): VolumeResult {
  const prescription = session.prescription || {};

  if (prescription.format === 'circuit' || prescription.stations) {
    const stations = prescription.stations || exercises.length;
    const rounds = prescription.rounds || 1;

    return {
      value: stations * rounds,
      unit: 'stations',
      displayText: `${stations * rounds} stations`
    };
  }

  const duration = session.duration_actual_min || 0;
  return {
    value: duration,
    unit: 'min',
    displayText: formatVolume(duration, 'min')
  };
}

/**
 * Get unit for coach type
 */
function getUnitForCoach(coachType: AgentType): string {
  switch (coachType) {
    case 'coach-force':
    case 'coach-calisthenics':
      return 'reps';

    case 'coach-endurance':
      return 'min';

    case 'coach-functional':
      return 'reps';

    case 'coach-competitions':
      return 'stations';

    default:
      return 'reps';
  }
}

/**
 * Get default thresholds for coach type
 */
function getDefaultThresholds(coachType: AgentType): VolumeThresholds {
  switch (coachType) {
    case 'coach-force':
      return {
        low: 100,
        optimal: 150,
        high: 200,
        unit: 'reps'
      };

    case 'coach-endurance':
      return {
        low: 30,
        optimal: 45,
        high: 70,
        unit: 'min'
      };

    case 'coach-functional':
      return {
        low: 120,
        optimal: 180,
        high: 250,
        unit: 'reps'
      };

    case 'coach-calisthenics':
      return {
        low: 80,
        optimal: 120,
        high: 160,
        unit: 'reps'
      };

    case 'coach-competitions':
      return {
        low: 6,
        optimal: 8,
        high: 12,
        unit: 'stations'
      };

    default:
      return {
        low: 100,
        optimal: 150,
        high: 200,
        unit: 'reps'
      };
  }
}

/**
 * Format volume for display
 */
function formatVolume(value: number, unit: string): string {
  const roundedValue = Math.round(value);

  switch (unit) {
    case 'reps':
      return `${roundedValue} reps`;
    case 'min':
      return `${roundedValue} min`;
    case 'stations':
      return `${roundedValue} stations`;
    default:
      return `${roundedValue} ${unit}`;
  }
}

/**
 * Detect if session is exploratory (low volume test)
 */
export function isExploratorySession(
  volume: number,
  thresholds: VolumeThresholds
): boolean {
  return volume < thresholds.low * 0.5;
}

/**
 * Log volume calculation for debugging
 */
export function logVolumeCalculation(
  sessions: SessionHistory[],
  coachType: AgentType,
  result: VolumeResult
): void {
  logger.info('VOLUME_CALCULATION', 'Volume calculated', {
    coachType,
    sessionsCount: sessions.length,
    totalValue: result.value,
    unit: result.unit,
    displayText: result.displayText
  });
}

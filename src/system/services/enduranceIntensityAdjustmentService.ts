/**
 * Endurance Intensity Adjustment Service
 * Handles dynamic adjustment of endurance session intensity
 */

import type { EnduranceSessionPrescription, EnduranceBlock, HeartRateZone } from '../../domain/enduranceSession';
import logger from '../../lib/utils/logger';

export type AdjustmentDirection = 'easier' | 'harder';

export interface AdjustmentResult {
  success: boolean;
  adjustedPrescription: EnduranceSessionPrescription;
  changes: AdjustmentChange[];
  message: string;
  limitReached: boolean;
}

export interface AdjustmentChange {
  blockId: string;
  blockName: string;
  field: string;
  oldValue: any;
  newValue: any;
}

const ZONE_ORDER: HeartRateZone[] = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];

const ZONE_LIMITS = {
  min: 'Z1' as HeartRateZone,
  max: 'Z5' as HeartRateZone,
};

const DURATION_ADJUSTMENT_PERCENT = 15; // 15% change in durations
const INTERVAL_WORK_ADJUSTMENT = 20; // 20% change for interval work
const INTERVAL_REST_ADJUSTMENT = 25; // 25% change for interval rest

/**
 * Adjust zone intensity up or down
 */
function adjustZone(currentZone: string, direction: AdjustmentDirection): string {
  const zoneMatch = currentZone.match(/Z[1-5]/);
  if (!zoneMatch) return currentZone;

  const zone = zoneMatch[0] as HeartRateZone;
  const currentIndex = ZONE_ORDER.indexOf(zone);

  if (currentIndex === -1) return currentZone;

  let newIndex: number;
  if (direction === 'harder') {
    newIndex = Math.min(currentIndex + 1, ZONE_ORDER.indexOf(ZONE_LIMITS.max));
  } else {
    newIndex = Math.max(currentIndex - 1, ZONE_ORDER.indexOf(ZONE_LIMITS.min));
  }

  const newZone = ZONE_ORDER[newIndex];

  // Replace the zone in the original string to preserve any additional text
  return currentZone.replace(zone, newZone);
}

/**
 * Adjust duration based on direction
 */
function adjustDuration(duration: number, direction: AdjustmentDirection, isWorkInterval = false): number {
  const adjustmentPercent = isWorkInterval ? INTERVAL_WORK_ADJUSTMENT : DURATION_ADJUSTMENT_PERCENT;
  const multiplier = direction === 'harder' ? (1 + adjustmentPercent / 100) : (1 - adjustmentPercent / 100);
  const newDuration = Math.round(duration * multiplier);

  // Ensure minimum duration of 1 minute
  return Math.max(1, newDuration);
}

/**
 * Adjust interval rest time (inverse logic)
 */
function adjustRestTime(restDuration: number, direction: AdjustmentDirection): number {
  // Harder = less rest, Easier = more rest
  const multiplier = direction === 'harder' ? (1 - INTERVAL_REST_ADJUSTMENT / 100) : (1 + INTERVAL_REST_ADJUSTMENT / 100);
  const newDuration = Math.round(restDuration * multiplier);

  // Ensure minimum rest of 30 seconds (0.5 minutes)
  return Math.max(0.5, newDuration);
}

/**
 * Adjust repeats for intervals
 */
function adjustRepeats(currentRepeats: number, direction: AdjustmentDirection): number {
  if (direction === 'harder') {
    return Math.min(currentRepeats + 1, 12); // Max 12 repeats
  } else {
    return Math.max(currentRepeats - 1, 1); // Min 1 repeat
  }
}

/**
 * Adjust an endurance block
 */
function adjustBlock(block: EnduranceBlock, direction: AdjustmentDirection): { adjustedBlock: EnduranceBlock; changes: AdjustmentChange[] } {
  const changes: AdjustmentChange[] = [];
  const adjustedBlock = { ...block };

  // Adjust target zone
  if (block.targetZone) {
    const oldZone = block.targetZone;
    const newZone = adjustZone(oldZone, direction);

    if (oldZone !== newZone) {
      adjustedBlock.targetZone = newZone;
      changes.push({
        blockId: block.id,
        blockName: block.name,
        field: 'targetZone',
        oldValue: oldZone,
        newValue: newZone,
      });
    }
  }

  // Adjust duration for non-interval blocks
  if (block.type !== 'intervals' && block.duration) {
    const oldDuration = block.duration;
    const newDuration = adjustDuration(oldDuration, direction);

    if (oldDuration !== newDuration) {
      adjustedBlock.duration = newDuration;
      changes.push({
        blockId: block.id,
        blockName: block.name,
        field: 'duration',
        oldValue: oldDuration,
        newValue: newDuration,
      });
    }
  }

  // Adjust intervals if present
  if (block.intervals) {
    const oldWorkDuration = block.intervals.work.duration;
    const oldRestDuration = block.intervals.rest.duration;
    const oldRepeats = block.intervals.repeats;

    const newWorkDuration = adjustDuration(oldWorkDuration, direction, true);
    const newRestDuration = adjustRestTime(oldRestDuration, direction);
    const newRepeats = adjustRepeats(oldRepeats, direction);

    adjustedBlock.intervals = {
      ...block.intervals,
      work: {
        ...block.intervals.work,
        duration: newWorkDuration,
      },
      rest: {
        ...block.intervals.rest,
        duration: newRestDuration,
      },
      repeats: newRepeats,
    };

    if (oldWorkDuration !== newWorkDuration) {
      changes.push({
        blockId: block.id,
        blockName: block.name,
        field: 'intervals.work.duration',
        oldValue: oldWorkDuration,
        newValue: newWorkDuration,
      });
    }

    if (oldRestDuration !== newRestDuration) {
      changes.push({
        blockId: block.id,
        blockName: block.name,
        field: 'intervals.rest.duration',
        oldValue: oldRestDuration,
        newValue: newRestDuration,
      });
    }

    if (oldRepeats !== newRepeats) {
      changes.push({
        blockId: block.id,
        blockName: block.name,
        field: 'intervals.repeats',
        oldValue: oldRepeats,
        newValue: newRepeats,
      });
    }

    // Recalculate total duration for interval blocks
    const totalIntervalDuration = (newWorkDuration + newRestDuration) * newRepeats;
    adjustedBlock.duration = Math.round(totalIntervalDuration);
  }

  return { adjustedBlock, changes };
}

/**
 * Check if we've reached adjustment limits
 */
function checkLimits(prescription: EnduranceSessionPrescription, direction: AdjustmentDirection): boolean {
  if (!prescription.mainWorkout) return false;

  for (const block of prescription.mainWorkout) {
    // Check zone limits
    if (block.targetZone) {
      const zoneMatch = block.targetZone.match(/Z[1-5]/);
      if (zoneMatch) {
        const zone = zoneMatch[0] as HeartRateZone;
        if (direction === 'harder' && zone === ZONE_LIMITS.max) return true;
        if (direction === 'easier' && zone === ZONE_LIMITS.min) return true;
      }
    }

    // Check interval repeat limits
    if (block.intervals) {
      if (direction === 'harder' && block.intervals.repeats >= 12) return true;
      if (direction === 'easier' && block.intervals.repeats <= 1) return true;
    }
  }

  return false;
}

/**
 * Main adjustment function
 */
export function adjustEnduranceIntensity(
  prescription: EnduranceSessionPrescription,
  direction: AdjustmentDirection
): AdjustmentResult {
  logger.info('ENDURANCE_ADJUSTMENT', `Adjusting intensity: ${direction}`, {
    sessionName: prescription.sessionName,
    blocksCount: prescription.mainWorkout?.length || 0,
  });

  try {
    const limitReached = checkLimits(prescription, direction);

    if (limitReached) {
      logger.warn('ENDURANCE_ADJUSTMENT', 'Adjustment limit reached', { direction });
      return {
        success: false,
        adjustedPrescription: prescription,
        changes: [],
        message: direction === 'harder'
          ? 'Tu es déjà au maximum d\'intensité ! 🔥'
          : 'Tu es déjà au minimum d\'intensité recommandé.',
        limitReached: true,
      };
    }

    const allChanges: AdjustmentChange[] = [];
    const adjustedPrescription = { ...prescription };

    // Adjust warmup if present
    if (adjustedPrescription.warmup) {
      const oldZone = adjustedPrescription.warmup.targetZone;
      const newZone = adjustZone(oldZone, direction);

      if (oldZone !== newZone) {
        adjustedPrescription.warmup = {
          ...adjustedPrescription.warmup,
          targetZone: newZone,
        };
        allChanges.push({
          blockId: 'warmup',
          blockName: 'Échauffement',
          field: 'targetZone',
          oldValue: oldZone,
          newValue: newZone,
        });
      }
    }

    // Adjust main workout blocks
    if (adjustedPrescription.mainWorkout) {
      adjustedPrescription.mainWorkout = adjustedPrescription.mainWorkout.map((block) => {
        const { adjustedBlock, changes } = adjustBlock(block, direction);
        allChanges.push(...changes);
        return adjustedBlock;
      });
    }

    // Adjust cooldown if present
    if (adjustedPrescription.cooldown) {
      const oldZone = adjustedPrescription.cooldown.targetZone;
      const newZone = adjustZone(oldZone, direction);

      if (oldZone !== newZone) {
        adjustedPrescription.cooldown = {
          ...adjustedPrescription.cooldown,
          targetZone: newZone,
        };
        allChanges.push({
          blockId: 'cooldown',
          blockName: 'Retour au calme',
          field: 'targetZone',
          oldValue: oldZone,
          newValue: newZone,
        });
      }
    }

    // Recalculate total duration
    let totalDuration = 0;
    if (adjustedPrescription.warmup) totalDuration += adjustedPrescription.warmup.duration;
    if (adjustedPrescription.mainWorkout) {
      totalDuration += adjustedPrescription.mainWorkout.reduce((sum, block) => sum + block.duration, 0);
    }
    if (adjustedPrescription.cooldown) totalDuration += adjustedPrescription.cooldown.duration;
    adjustedPrescription.durationTarget = totalDuration;

    const message = direction === 'harder'
      ? `Intensité augmentée ! 💪 La séance sera plus exigeante.`
      : `Intensité réduite. La séance sera plus accessible.`;

    logger.info('ENDURANCE_ADJUSTMENT', 'Adjustment completed', {
      changesCount: allChanges.length,
      newDuration: totalDuration,
    });

    return {
      success: true,
      adjustedPrescription,
      changes: allChanges,
      message,
      limitReached: false,
    };
  } catch (error) {
    logger.error('ENDURANCE_ADJUSTMENT', 'Adjustment failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      adjustedPrescription: prescription,
      changes: [],
      message: 'Erreur lors de l\'ajustement. Réessaye.',
      limitReached: false,
    };
  }
}

export const enduranceIntensityAdjustmentService = {
  adjustEnduranceIntensity,
};

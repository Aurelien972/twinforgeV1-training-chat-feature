/**
 * Exercise Load Adjustment Service
 * Service pour calculer et appliquer les ajustements de charge intelligents
 */

import logger from '../../lib/utils/logger';
import { getTopSet, getLoadForSet, updateLoadForSet, isRampingSet } from '../../utils/loadUtils';

export interface LoadAdjustment {
  oldLoad: number | null;
  newLoad: number;
  adjustment: number;
  message: string;
}

export interface RampingProgression {
  currentSetLoad: number;
  nextSetLoad: number;
  increment: number;
  remainingSets: Array<{ setNumber: number; load: number }>;
  isFollowingPlan: boolean;
  deviationFromPlan: number;
}

/**
 * Safely extract a numeric load value from either number or array
 */
function extractLoadValue(load: number | number[] | null | undefined): number | null {
  if (load === null || load === undefined) {
    return null;
  }

  if (typeof load === 'number') {
    return load;
  }

  if (Array.isArray(load)) {
    return getTopSet(load);
  }

  return null;
}

class ExerciseLoadAdjustmentService {
  /**
   * Calcule l'incrément de charge approprié basé sur la charge actuelle
   */
  private calculateIncrement(currentLoad: number | null): number {
    if (currentLoad === null || currentLoad === 0) {
      return 2.5;
    }

    if (currentLoad < 20) {
      return 2.5;
    } else if (currentLoad < 60) {
      return 5;
    } else if (currentLoad < 100) {
      return 10;
    } else {
      return 20;
    }
  }

  /**
   * Augmente la charge d'un exercice
   * Accepts number, array, or null
   */
  increaseLoad(currentLoad: number | number[] | null): LoadAdjustment {
    const loadValue = extractLoadValue(currentLoad);
    const increment = this.calculateIncrement(loadValue);
    const oldLoad = loadValue;
    const newLoad = (loadValue || 0) + increment;

    const message = oldLoad === null || oldLoad === 0
      ? `Charge ajoutée : ${newLoad}kg`
      : `Charge augmentée de ${increment}kg (${oldLoad}kg → ${newLoad}kg)`;

    logger.info('LOAD_ADJUSTMENT', 'Load increased', {
      oldLoad,
      newLoad,
      increment
    });

    return {
      oldLoad,
      newLoad,
      adjustment: increment,
      message
    };
  }

  /**
   * Augmente la charge pour une série spécifique dans un système progressif
   */
  increaseLoadForSet(
    currentLoad: number | number[] | null,
    setNumber: number,
    applyToRemaining: boolean = true
  ): { load: number | number[]; adjustment: LoadAdjustment } {
    const loadValue = getLoadForSet(currentLoad, setNumber);
    const increment = this.calculateIncrement(loadValue);
    const oldLoad = loadValue;
    const newLoad = (loadValue || 0) + increment;

    let updatedLoad: number | number[];

    if (isRampingSet(currentLoad) && applyToRemaining) {
      updatedLoad = [...currentLoad];
      for (let i = setNumber - 1; i < updatedLoad.length; i++) {
        updatedLoad[i] = newLoad;
      }
    } else {
      updatedLoad = updateLoadForSet(currentLoad, setNumber, newLoad);
    }

    const message = applyToRemaining && isRampingSet(currentLoad)
      ? `Toutes les séries restantes ajustées à ${newLoad}kg`
      : oldLoad === null || oldLoad === 0
      ? `Charge ajoutée : ${newLoad}kg`
      : `Charge augmentée de ${increment}kg (${oldLoad}kg → ${newLoad}kg)`;

    logger.info('LOAD_ADJUSTMENT', 'Load increased for set', {
      setNumber,
      oldLoad,
      newLoad,
      increment,
      applyToRemaining
    });

    return {
      load: updatedLoad,
      adjustment: {
        oldLoad,
        newLoad,
        adjustment: increment,
        message
      }
    };
  }

  /**
   * Diminue la charge d'un exercice
   * Accepts number, array, or null
   */
  decreaseLoad(currentLoad: number | number[] | null): LoadAdjustment {
    const loadValue = extractLoadValue(currentLoad);
    if (loadValue === null || loadValue === 0) {
      logger.warn('LOAD_ADJUSTMENT', 'Cannot decrease load from 0 or null');
      return {
        oldLoad: null,
        newLoad: 0,
        adjustment: 0,
        message: 'Impossible de réduire la charge (déjà au poids du corps)'
      };
    }

    const increment = this.calculateIncrement(loadValue);
    const oldLoad = loadValue;
    const newLoad = Math.max(0, loadValue - increment);

    const message = newLoad === 0
      ? `Charge retirée (au poids du corps maintenant)`
      : `Charge réduite de ${increment}kg (${oldLoad}kg → ${newLoad}kg)`;

    logger.info('LOAD_ADJUSTMENT', 'Load decreased', {
      oldLoad,
      newLoad,
      decrement: -increment
    });

    return {
      oldLoad,
      newLoad,
      adjustment: -increment,
      message
    };
  }

  /**
   * Diminue la charge pour une série spécifique dans un système progressif
   */
  decreaseLoadForSet(
    currentLoad: number | number[] | null,
    setNumber: number,
    applyToRemaining: boolean = true
  ): { load: number | number[]; adjustment: LoadAdjustment } {
    const loadValue = getLoadForSet(currentLoad, setNumber);
    if (loadValue === null || loadValue === 0) {
      logger.warn('LOAD_ADJUSTMENT', 'Cannot decrease load from 0 or null');
      return {
        load: currentLoad || 0,
        adjustment: {
          oldLoad: null,
          newLoad: 0,
          adjustment: 0,
          message: 'Impossible de réduire la charge (déjà au poids du corps)'
        }
      };
    }

    const increment = this.calculateIncrement(loadValue);
    const oldLoad = loadValue;
    const newLoad = Math.max(0, loadValue - increment);

    let updatedLoad: number | number[];

    if (isRampingSet(currentLoad) && applyToRemaining) {
      updatedLoad = [...currentLoad];
      for (let i = setNumber - 1; i < updatedLoad.length; i++) {
        updatedLoad[i] = newLoad;
      }
    } else {
      updatedLoad = updateLoadForSet(currentLoad, setNumber, newLoad);
    }

    const message = applyToRemaining && isRampingSet(currentLoad)
      ? `Toutes les séries restantes ajustées à ${newLoad}kg`
      : newLoad === 0
      ? `Charge retirée (au poids du corps maintenant)`
      : `Charge réduite de ${increment}kg (${oldLoad}kg → ${newLoad}kg)`;

    logger.info('LOAD_ADJUSTMENT', 'Load decreased for set', {
      setNumber,
      oldLoad,
      newLoad,
      decrement: -increment,
      applyToRemaining
    });

    return {
      load: updatedLoad,
      adjustment: {
        oldLoad,
        newLoad,
        adjustment: -increment,
        message
      }
    };
  }

  /**
   * Ajuste la charge en fonction du feedback (trop facile ou trop difficile)
   * Accepts number, array, or null
   */
  adjustLoadFromFeedback(
    currentLoad: number | number[] | null,
    feedback: 'too-easy' | 'too-hard'
  ): LoadAdjustment {
    if (feedback === 'too-easy') {
      return this.increaseLoad(currentLoad);
    } else {
      return this.decreaseLoad(currentLoad);
    }
  }

  /**
   * Ajuste la charge pour un système de charges progressives
   * Applique l'ajustement à toutes les séries restantes
   */
  adjustLoadForRampingSet(
    currentLoad: number[],
    setNumber: number,
    newLoad: number
  ): number[] {
    const updatedLoads = [...currentLoad];
    for (let i = setNumber - 1; i < updatedLoads.length; i++) {
      updatedLoads[i] = newLoad;
    }
    logger.info('LOAD_ADJUSTMENT', 'Ramping set adjusted', {
      setNumber,
      newLoad,
      affectedSets: updatedLoads.length - (setNumber - 1)
    });
    return updatedLoads;
  }

  /**
   * Calcule l'incrément moyen d'un ramping set
   */
  private calculateRampingIncrement(loads: number[]): number {
    if (loads.length < 2) return 0;

    const increments: number[] = [];
    for (let i = 1; i < loads.length; i++) {
      increments.push(loads[i] - loads[i - 1]);
    }

    const avgIncrement = increments.reduce((sum, inc) => sum + inc, 0) / increments.length;
    return Math.round(avgIncrement * 2) / 2; // Round to nearest 0.5kg
  }

  /**
   * Calcule la charge suggérée pour la prochaine série dans un ramping set
   */
  getSuggestedNextSetLoad(
    currentLoad: number | number[],
    currentSetNumber: number,
    totalSets: number
  ): number | null {
    if (!isRampingSet(currentLoad)) {
      // Pour une charge fixe, retourne la même charge
      return typeof currentLoad === 'number' ? currentLoad : null;
    }

    // Pour un ramping set, retourne la charge prévue pour la prochaine série
    const nextSetIndex = currentSetNumber; // currentSet est 1-based, array est 0-based
    if (nextSetIndex < currentLoad.length) {
      return currentLoad[nextSetIndex];
    }

    // Si on dépasse l'array, calcule une progression basée sur l'incrément moyen
    const avgIncrement = this.calculateRampingIncrement(currentLoad);
    const lastLoad = currentLoad[currentLoad.length - 1];
    return lastLoad + avgIncrement;
  }

  /**
   * Analyse la progression d'un ramping set
   */
  analyzeRampingProgression(
    currentLoad: number | number[],
    completedSetNumber: number,
    totalSets: number
  ): RampingProgression | null {
    if (!isRampingSet(currentLoad) || completedSetNumber >= totalSets) {
      return null;
    }

    const currentSetLoad = getLoadForSet(currentLoad, completedSetNumber) || 0;
    const nextSetLoad = getLoadForSet(currentLoad, completedSetNumber + 1) || 0;
    const increment = nextSetLoad - currentSetLoad;

    const remainingSets: Array<{ setNumber: number; load: number }> = [];
    for (let i = completedSetNumber + 1; i <= totalSets; i++) {
      const load = getLoadForSet(currentLoad, i);
      if (load !== null) {
        remainingSets.push({ setNumber: i, load });
      }
    }

    logger.info('LOAD_ADJUSTMENT', 'Ramping progression analyzed', {
      completedSetNumber,
      currentSetLoad,
      nextSetLoad,
      increment,
      remainingSetsCount: remainingSets.length
    });

    return {
      currentSetLoad,
      nextSetLoad,
      increment,
      remainingSets,
      isFollowingPlan: true,
      deviationFromPlan: 0
    };
  }

  /**
   * Applique une progression intelligente aux séries restantes
   * Maintient l'incrément moyen du ramping set original
   */
  applyProgressionToRemainingSets(
    currentLoad: number | number[],
    completedSetNumber: number,
    newLoadForNextSet: number,
    totalSets: number
  ): number | number[] {
    // Si ce n'est pas un ramping set, retourne simplement la nouvelle charge
    if (!isRampingSet(currentLoad)) {
      return newLoadForNextSet;
    }

    // Calcule l'incrément moyen du ramping set original
    const originalIncrement = this.calculateRampingIncrement(currentLoad);

    // Calcule la déviation par rapport au plan original
    const plannedNextLoad = getLoadForSet(currentLoad, completedSetNumber + 1) || 0;
    const actualDeviation = newLoadForNextSet - plannedNextLoad;

    const updatedLoads = [...currentLoad];

    // Applique la nouvelle charge et maintient la progression
    for (let i = completedSetNumber; i < updatedLoads.length; i++) {
      if (i === completedSetNumber) {
        // Première série restante: utilise la nouvelle charge
        updatedLoads[i] = newLoadForNextSet;
      } else {
        // Séries suivantes: applique l'incrément original à partir de la nouvelle base
        updatedLoads[i] = updatedLoads[i - 1] + originalIncrement;
      }
    }

    logger.info('LOAD_ADJUSTMENT', 'Progression applied to remaining sets', {
      completedSetNumber,
      newLoadForNextSet,
      originalIncrement,
      deviation: actualDeviation,
      updatedLoads
    });

    return updatedLoads;
  }

  /**
   * Vérifie si l'utilisateur suit le plan de progression
   */
  isFollowingProgressionPlan(
    currentLoad: number | number[],
    completedSetNumber: number,
    actualLoadUsed: number
  ): { isFollowing: boolean; deviation: number } {
    if (!isRampingSet(currentLoad)) {
      return { isFollowing: true, deviation: 0 };
    }

    const plannedLoad = getLoadForSet(currentLoad, completedSetNumber) || 0;
    const deviation = actualLoadUsed - plannedLoad;
    const isFollowing = Math.abs(deviation) <= 2.5; // Tolérance de 2.5kg

    return { isFollowing, deviation };
  }

  /**
   * Formate un message de notification pour l'ajustement de charge
   */
  formatNotificationMessage(adjustment: LoadAdjustment, exerciseName: string): string {
    if (adjustment.oldLoad === null || adjustment.oldLoad === 0) {
      return `${exerciseName} : ${adjustment.message}`;
    }

    if (adjustment.newLoad === 0) {
      return `${exerciseName} : ${adjustment.message}`;
    }

    return `${exerciseName} : ${adjustment.message}`;
  }
}

export const exerciseLoadAdjustmentService = new ExerciseLoadAdjustmentService();

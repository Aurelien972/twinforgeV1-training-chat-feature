/**
 * Endurance Pacing Guide Service
 * Provides real-time pacing feedback and guidance
 */

import logger from '../../lib/utils/logger';

export type PacingStatus = 'too_fast' | 'perfect' | 'too_slow';

export interface PacingGuidance {
  status: PacingStatus;
  message: string;
  icon: '⬇️' | '✅' | '⬆️';
  color: string;
  estimation?: string;
}

class EndurancePacingGuide {
  /**
   * Compare current pace to target pace (for running)
   * @param currentPace Current pace in seconds per km
   * @param targetPace Target pace in seconds per km
   * @param tolerance Tolerance in seconds
   */
  comparePace(
    currentPace: number,
    targetPace: number,
    tolerance: number = 15
  ): PacingGuidance {
    const difference = currentPace - targetPace;

    if (Math.abs(difference) <= tolerance) {
      return {
        status: 'perfect',
        message: 'Allure parfaite',
        icon: '✅',
        color: '#22C55E',
      };
    }

    if (difference < 0) {
      // Current pace is faster (lower number = faster)
      const secondsFaster = Math.abs(difference);
      return {
        status: 'too_fast',
        message: `Trop rapide de ${secondsFaster}s/km`,
        icon: '⬇️',
        color: '#F97316',
        estimation: this.estimateFinishTime(currentPace, targetPace, 'faster'),
      };
    }

    // Current pace is slower
    const secondsSlower = difference;
    return {
      status: 'too_slow',
      message: `Trop lent de ${secondsSlower}s/km`,
      icon: '⬆️',
      color: '#3B82F6',
      estimation: this.estimateFinishTime(currentPace, targetPace, 'slower'),
    };
  }

  /**
   * Compare current power to target power (for cycling)
   */
  comparePower(
    currentPower: number,
    targetPower: number,
    tolerance: number = 10
  ): PacingGuidance {
    const difference = currentPower - targetPower;
    const percentageDiff = (difference / targetPower) * 100;

    if (Math.abs(percentageDiff) <= tolerance) {
      return {
        status: 'perfect',
        message: 'Puissance parfaite',
        icon: '✅',
        color: '#22C55E',
      };
    }

    if (difference > 0) {
      return {
        status: 'too_fast',
        message: `Puissance +${Math.round(percentageDiff)}%`,
        icon: '⬇️',
        color: '#F97316',
      };
    }

    return {
      status: 'too_slow',
      message: `Puissance ${Math.round(percentageDiff)}%`,
      icon: '⬆️',
      color: '#3B82F6',
    };
  }

  /**
   * Estimate finish time based on current pace deviation
   */
  private estimateFinishTime(
    currentPace: number,
    targetPace: number,
    deviation: 'faster' | 'slower'
  ): string {
    const paceRatio = currentPace / targetPace;
    const timeDifferencePercent = ((1 - paceRatio) * 100).toFixed(0);

    if (deviation === 'faster') {
      return `À cette allure, tu termineras ${Math.abs(Number(timeDifferencePercent))}% plus tôt`;
    }

    return `À cette allure, tu termineras ${Math.abs(Number(timeDifferencePercent))}% plus tard`;
  }

  /**
   * Parse pace string (e.g., "5:30/km") to seconds
   */
  parsePaceString(paceString: string): number | null {
    if (!paceString) return null;

    // Match formats: "5:30/km", "5:30", "5'30"
    const match = paceString.match(/(\d+)[:'"](\d+)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      return minutes * 60 + seconds;
    }

    return null;
  }

  /**
   * Format pace from seconds to string (e.g., 330 -> "5:30/km")
   */
  formatPace(paceSeconds: number): string {
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  }

  /**
   * Calculate pace from distance and time
   */
  calculatePace(distanceKm: number, timeSeconds: number): number {
    if (distanceKm === 0) return 0;
    return timeSeconds / distanceKm;
  }

  /**
   * Calculate estimated distance from time and pace
   */
  calculateDistance(timeSeconds: number, paceSecondsPerKm: number): number {
    if (paceSecondsPerKm === 0) return 0;
    return timeSeconds / paceSecondsPerKm;
  }

  /**
   * Get pacing advice based on session type
   */
  getPacingAdvice(sessionType: string, currentPhase: string): string {
    const advice: Record<string, Record<string, string>> = {
      intervals: {
        warmup: 'Démarre tranquille, laisse le corps s\'échauffer',
        work: 'Donne tout sur cet intervalle, c\'est court',
        rest: 'Récupère bien, respire profondément',
        cooldown: 'Reviens progressivement au calme',
      },
      tempo: {
        warmup: 'Échauffe-toi progressivement',
        main: 'Maintiens cette intensité, c\'est "comfortably hard"',
        cooldown: 'Récupère en douceur',
      },
      continuous: {
        warmup: 'Commence facile',
        main: 'Allure stable et confortable, tu peux tenir longtemps',
        cooldown: 'Ralentis progressivement',
      },
    };

    return advice[sessionType]?.[currentPhase] || 'Maintiens ton allure';
  }

  /**
   * Check if sustainable for remaining duration
   */
  isSustainable(
    currentIntensity: number,
    targetIntensity: number,
    elapsedPercent: number
  ): boolean {
    // If intensity is too high early in the session, it might not be sustainable
    const intensityRatio = currentIntensity / targetIntensity;

    if (elapsedPercent < 25 && intensityRatio > 1.15) {
      logger.warn('PACING_GUIDE', 'Unsustainable early pace detected', {
        intensityRatio,
        elapsedPercent,
      });
      return false;
    }

    if (elapsedPercent < 50 && intensityRatio > 1.10) {
      logger.warn('PACING_GUIDE', 'Potentially unsustainable pace', {
        intensityRatio,
        elapsedPercent,
      });
      return false;
    }

    return true;
  }

  /**
   * Get sustainability warning
   */
  getSustainabilityWarning(
    currentIntensity: number,
    targetIntensity: number,
    elapsedPercent: number
  ): string | null {
    if (this.isSustainable(currentIntensity, targetIntensity, elapsedPercent)) {
      return null;
    }

    const intensityRatio = currentIntensity / targetIntensity;
    const excessPercent = Math.round((intensityRatio - 1) * 100);

    return `⚠️ Attention: Tu es ${excessPercent}% au-dessus de la cible. Ralentis pour tenir la distance`;
  }
}

export const endurancePacingGuide = new EndurancePacingGuide();

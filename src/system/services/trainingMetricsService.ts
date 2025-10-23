/**
 * Training Metrics Service
 * Extracts and persists discipline-specific metrics from training sessions
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';

export interface SessionMetrics {
  discipline: string;
  volumeKg?: number;
  maxWeight?: number;
  setsTotal?: number;
  repsTotal?: number;
  tonnage?: number;
  distanceKm?: number;
  paceAvg?: string;
  paceMin?: string;
  paceMax?: string;
  tss?: number;
  zonesDistribution?: Record<string, number>;
  heartRateAvg?: number;
  heartRateMax?: number;
  cadenceAvg?: number;
  powerAvg?: number;
  elevationGain?: number;
  caloriesEstimated?: number;
  intensityScore?: number;
}

export interface ForceExercise {
  id: string;
  name: string;
  sets: number;
  reps?: number;
  repsProgression?: number[];
  load?: number | number[];
}

export interface EndurancePrescription {
  discipline?: string;
  distanceTarget?: number;
  mainWorkout?: Array<{
    duration: number;
    distance?: number;
    targetZone?: string;
    targetPace?: string;
    targetHR?: string;
    targetPower?: string;
    targetCadence?: string;
    intervals?: {
      work: { duration: number; intensity: string };
      rest: { duration: number };
      repeats: number;
    };
  }>;
  metrics?: {
    estimatedTSS?: number;
    estimatedCalories?: number;
    estimatedAvgHR?: number;
    estimatedAvgPace?: string;
    estimatedAvgPower?: string;
  };
}

class TrainingMetricsService {
  private readonly FORCE_DISCIPLINES = ['strength', 'powerlifting', 'bodybuilding', 'strongman', 'functional', 'crossfit', 'hiit'];
  private readonly ENDURANCE_DISCIPLINES = ['running', 'cycling', 'swimming', 'triathlon', 'cardio'];

  /**
   * Extract metrics from session based on discipline
   */
  extractMetrics(session: any): SessionMetrics {
    const discipline = session.discipline || session.session_type || 'strength';

    if (this.FORCE_DISCIPLINES.includes(discipline)) {
      return this.extractForceMetrics(session, discipline);
    } else if (this.ENDURANCE_DISCIPLINES.includes(discipline)) {
      return this.extractEnduranceMetrics(session, discipline);
    }

    return { discipline };
  }

  /**
   * Extract Force/Powerbuilding metrics
   */
  private extractForceMetrics(session: any, discipline: string): SessionMetrics {
    const exercises: ForceExercise[] = session.prescription?.exercises || [];

    let volumeKg = 0;
    let maxWeight = 0;
    let setsTotal = 0;
    let repsTotal = 0;

    exercises.forEach((ex: ForceExercise) => {
      const sets = ex.sets || 0;
      setsTotal += sets;

      if (Array.isArray(ex.repsProgression)) {
        const totalReps = ex.repsProgression.reduce((sum, r) => sum + r, 0);
        repsTotal += totalReps;
      } else if (typeof ex.reps === 'number') {
        repsTotal += sets * ex.reps;
      }

      if (ex.load) {
        if (Array.isArray(ex.load)) {
          const loads = ex.load;
          loads.forEach((load, idx) => {
            const reps = Array.isArray(ex.repsProgression)
              ? ex.repsProgression[idx] || ex.repsProgression[0]
              : ex.reps || 0;
            volumeKg += load * reps;

            if (load > maxWeight) {
              maxWeight = load;
            }
          });
        } else {
          const load = ex.load;
          const totalRepsForExercise = Array.isArray(ex.repsProgression)
            ? ex.repsProgression.reduce((sum, r) => sum + r, 0)
            : (ex.reps || 0) * sets;
          volumeKg += load * totalRepsForExercise;

          if (load > maxWeight) {
            maxWeight = load;
          }
        }
      }
    });

    const tonnage = volumeKg;

    const caloriesEstimated = this.estimateCaloriesForce(
      session.duration_actual_min || session.durationTarget || 60,
      setsTotal,
      session.rpe_avg || 7
    );

    const intensityScore = this.calculateIntensityScore(
      session.rpe_avg || 7,
      session.duration_actual_min || session.durationTarget || 60
    );

    return {
      discipline,
      volumeKg: Math.round(volumeKg),
      maxWeight: Math.round(maxWeight),
      setsTotal,
      repsTotal,
      tonnage: Math.round(tonnage),
      caloriesEstimated,
      intensityScore: Math.round(intensityScore * 10) / 10
    };
  }

  /**
   * Extract Endurance metrics
   */
  private extractEnduranceMetrics(session: any, discipline: string): SessionMetrics {
    const prescription: EndurancePrescription = session.prescription || {};

    const distanceKm = prescription.distanceTarget || 0;
    const mainWorkout = prescription.mainWorkout?.[0];

    const paceAvg = mainWorkout?.targetPace || prescription.metrics?.estimatedAvgPace;
    const heartRateAvg = mainWorkout?.targetHR
      ? this.parseHeartRate(mainWorkout.targetHR)
      : prescription.metrics?.estimatedAvgHR;

    const powerAvg = mainWorkout?.targetPower
      ? this.parsePower(mainWorkout.targetPower)
      : prescription.metrics?.estimatedAvgPower
      ? this.parsePower(prescription.metrics.estimatedAvgPower)
      : undefined;

    const cadenceAvg = mainWorkout?.targetCadence
      ? this.parseCadence(mainWorkout.targetCadence)
      : undefined;

    const tss = prescription.metrics?.estimatedTSS || 0;
    const caloriesEstimated = prescription.metrics?.estimatedCalories || 0;

    const zonesDistribution = this.calculateZonesDistribution(prescription);

    const intensityScore = this.calculateIntensityScore(
      session.rpe_avg || 7,
      session.duration_actual_min || session.durationTarget || 60
    );

    return {
      discipline,
      distanceKm,
      paceAvg,
      tss,
      zonesDistribution,
      heartRateAvg,
      cadenceAvg,
      powerAvg,
      caloriesEstimated,
      intensityScore: Math.round(intensityScore * 10) / 10
    };
  }

  /**
   * Calculate zones distribution from prescription
   */
  private calculateZonesDistribution(prescription: EndurancePrescription): Record<string, number> {
    const distribution: Record<string, number> = {
      Z1: 0,
      Z2: 0,
      Z3: 0,
      Z4: 0,
      Z5: 0
    };

    const mainWorkout = prescription.mainWorkout;
    if (!mainWorkout || mainWorkout.length === 0) {
      distribution.Z2 = 100;
      return distribution;
    }

    let totalDuration = 0;
    const zoneDurations: Record<string, number> = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };

    mainWorkout.forEach(block => {
      const duration = block.duration || 0;
      totalDuration += duration;

      const zone = block.targetZone || 'Z2';

      if (block.intervals && block.intervals.work && block.intervals.rest) {
        const workDuration = (block.intervals.work.duration || 0) * (block.intervals.repeats || 1);
        const restDuration = (block.intervals.rest.duration || 0) * (block.intervals.repeats || 1);

        const workZone = this.extractZone(block.intervals.work.intensity || 'Z2');
        zoneDurations[workZone] = (zoneDurations[workZone] || 0) + workDuration;

        const restZone = 'Z1';
        zoneDurations[restZone] = (zoneDurations[restZone] || 0) + restDuration;
      } else {
        const extractedZone = this.extractZone(zone);
        zoneDurations[extractedZone] = (zoneDurations[extractedZone] || 0) + duration;
      }
    });

    if (totalDuration > 0) {
      Object.keys(zoneDurations).forEach(zone => {
        distribution[zone] = Math.round((zoneDurations[zone] / totalDuration) * 100);
      });
    }

    return distribution;
  }

  /**
   * Extract zone from string (e.g., "Z2", "Z3-Z4" -> "Z3")
   */
  private extractZone(zoneString: string): string {
    const match = zoneString.match(/Z[1-5]/);
    return match ? match[0] : 'Z2';
  }

  /**
   * Parse heart rate from string (e.g., "135-150 bpm" -> 142)
   */
  private parseHeartRate(hrString: string): number | undefined {
    const match = hrString.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.round((min + max) / 2);
    }

    const singleMatch = hrString.match(/(\d+)/);
    return singleMatch ? parseInt(singleMatch[1]) : undefined;
  }

  /**
   * Parse power from string (e.g., "200-220W" -> 210)
   */
  private parsePower(powerString: string): number | undefined {
    const match = powerString.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.round((min + max) / 2);
    }

    const singleMatch = powerString.match(/(\d+)/);
    return singleMatch ? parseInt(singleMatch[1]) : undefined;
  }

  /**
   * Parse cadence from string (e.g., "85-95 RPM" -> 90)
   */
  private parseCadence(cadenceString: string): number | undefined {
    const match = cadenceString.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.round((min + max) / 2);
    }

    const singleMatch = cadenceString.match(/(\d+)/);
    return singleMatch ? parseInt(singleMatch[1]) : undefined;
  }

  /**
   * Estimate calories for force training
   */
  private estimateCaloriesForce(durationMin: number, setsTotal: number, rpe: number): number {
    const baseCaloriesPerMin = 8;
    const rpeMultiplier = 0.5 + (rpe / 10) * 0.5;
    const setsMultiplier = 1 + (setsTotal / 50);

    return Math.round(durationMin * baseCaloriesPerMin * rpeMultiplier * setsMultiplier);
  }

  /**
   * Calculate intensity score from RPE and duration
   */
  private calculateIntensityScore(rpe: number, durationMin: number): number {
    const rpeNormalized = rpe / 10;
    const durationFactor = Math.min(durationMin / 60, 2);
    return rpeNormalized * durationFactor * 100;
  }

  /**
   * Save metrics to database
   */
  async saveMetrics(sessionId: string, metrics: SessionMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_metrics')
        .insert({
          session_id: sessionId,
          discipline: metrics.discipline,
          volume_kg: metrics.volumeKg,
          max_weight: metrics.maxWeight,
          sets_total: metrics.setsTotal,
          reps_total: metrics.repsTotal,
          tonnage: metrics.tonnage,
          distance_km: metrics.distanceKm,
          pace_avg: metrics.paceAvg,
          pace_min: metrics.paceMin,
          pace_max: metrics.paceMax,
          tss: metrics.tss,
          zones_distribution: metrics.zonesDistribution,
          heart_rate_avg: metrics.heartRateAvg,
          heart_rate_max: metrics.heartRateMax,
          cadence_avg: metrics.cadenceAvg,
          power_avg: metrics.powerAvg,
          elevation_gain: metrics.elevationGain,
          calories_estimated: metrics.caloriesEstimated,
          intensity_score: metrics.intensityScore
        });

      if (error) {
        logger.error('METRICS', 'Failed to save metrics', { error, sessionId });
        throw error;
      }

      logger.info('METRICS', 'Metrics saved successfully', {
        sessionId,
        discipline: metrics.discipline,
        hasForceMetrics: !!(metrics.volumeKg || metrics.setsTotal),
        hasEnduranceMetrics: !!(metrics.distanceKm || metrics.tss)
      });
    } catch (error) {
      logger.error('METRICS', 'Error saving metrics', { error, sessionId });
      throw error;
    }
  }

  /**
   * Get metrics for a session
   */
  async getMetrics(sessionId: string): Promise<SessionMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('training_metrics')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) {
        logger.error('METRICS', 'Failed to fetch metrics', { error, sessionId });
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        discipline: data.discipline,
        volumeKg: data.volume_kg,
        maxWeight: data.max_weight,
        setsTotal: data.sets_total,
        repsTotal: data.reps_total,
        tonnage: data.tonnage,
        distanceKm: data.distance_km,
        paceAvg: data.pace_avg,
        paceMin: data.pace_min,
        paceMax: data.pace_max,
        tss: data.tss,
        zonesDistribution: data.zones_distribution,
        heartRateAvg: data.heart_rate_avg,
        heartRateMax: data.heart_rate_max,
        cadenceAvg: data.cadence_avg,
        powerAvg: data.power_avg,
        elevationGain: data.elevation_gain,
        caloriesEstimated: data.calories_estimated,
        intensityScore: data.intensity_score
      };
    } catch (error) {
      logger.error('METRICS', 'Error fetching metrics', { error, sessionId });
      return null;
    }
  }
}

export const trainingMetricsService = new TrainingMetricsService();

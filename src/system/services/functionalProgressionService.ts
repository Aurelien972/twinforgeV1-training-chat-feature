/**
 * Functional Progression Service
 * Manages PRs, benchmarks, and WOD progression for Functional/CrossFit training
 */

import { supabase } from '../supabase/client';
import type {
  FunctionalSkill,
  FunctionalBenchmark,
  FunctionalWodData,
  FunctionalSessionData,
  MovementCategory,
  TechniqueLevel,
  ScalingLevel,
  BenchmarkType,
  WodFormat,
  PrAchieved
} from '../../domain/functional';

// ============================================================================
// Functional Skills Management
// ============================================================================

export const functionalProgressionService = {
  /**
   * Get user's functional skills (PRs for all movements)
   */
  async getUserSkills(userId: string): Promise<FunctionalSkill[]> {
    const { data, error } = await supabase
      .from('functional_skills')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching functional skills:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get single skill by movement name
   */
  async getSkill(userId: string, movementName: string): Promise<FunctionalSkill | null> {
    const { data, error } = await supabase
      .from('functional_skills')
      .select('*')
      .eq('user_id', userId)
      .eq('movement_name', movementName)
      .maybeSingle();

    if (error) {
      console.error('Error fetching skill:', error);
      return null;
    }

    return data;
  },

  /**
   * Update or create skill PR
   */
  async updateSkillPR(
    userId: string,
    movementName: string,
    updates: {
      category?: MovementCategory;
      prWeightKg?: number;
      prReps?: number;
      prTimeSeconds?: number;
      techniqueLevel?: TechniqueLevel;
      scalingUsed?: ScalingLevel;
      notes?: string;
    }
  ): Promise<FunctionalSkill | null> {
    // Check if skill exists
    const existing = await this.getSkill(userId, movementName);

    const skillData = {
      user_id: userId,
      movement_name: movementName,
      movement_category: updates.category || existing?.movementCategory || 'other',
      pr_weight_kg: updates.prWeightKg ?? existing?.prWeightKg ?? 0,
      pr_reps: updates.prReps ?? existing?.prReps ?? 0,
      pr_time_seconds: updates.prTimeSeconds ?? existing?.prTimeSeconds ?? 0,
      technique_level: updates.techniqueLevel || existing?.techniqueLevel || 'learning',
      scaling_used: updates.scalingUsed || existing?.scalingUsed || 'scaled',
      notes: updates.notes || existing?.notes || null,
      pr_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('functional_skills')
        .update(skillData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating skill PR:', error);
        return null;
      }

      return data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('functional_skills')
        .insert(skillData)
        .select()
        .single();

      if (error) {
        console.error('Error creating skill PR:', error);
        return null;
      }

      return data;
    }
  },

  /**
   * Get skills by category
   */
  async getSkillsByCategory(userId: string, category: MovementCategory): Promise<FunctionalSkill[]> {
    const { data, error } = await supabase
      .from('functional_skills')
      .select('*')
      .eq('user_id', userId)
      .eq('movement_category', category)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching skills by category:', error);
      return [];
    }

    return data || [];
  },

  // ============================================================================
  // Benchmark WODs Management
  // ============================================================================

  /**
   * Get user's benchmark WOD records
   */
  async getUserBenchmarks(userId: string): Promise<FunctionalBenchmark[]> {
    const { data, error } = await supabase
      .from('functional_benchmarks')
      .select('*')
      .eq('user_id', userId)
      .order('last_attempt_date', { ascending: false });

    if (error) {
      console.error('Error fetching benchmarks:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get single benchmark by name
   */
  async getBenchmark(userId: string, benchmarkName: string): Promise<FunctionalBenchmark | null> {
    const { data, error } = await supabase
      .from('functional_benchmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('benchmark_name', benchmarkName)
      .maybeSingle();

    if (error) {
      console.error('Error fetching benchmark:', error);
      return null;
    }

    return data;
  },

  /**
   * Update or create benchmark record
   */
  async updateBenchmark(
    userId: string,
    benchmarkName: string,
    updates: {
      benchmarkType: BenchmarkType;
      wodFormat: WodFormat;
      wodDescription: string;
      score: string;
      scoreNumeric: number;
      scalingLevel?: ScalingLevel;
    }
  ): Promise<FunctionalBenchmark | null> {
    const existing = await this.getBenchmark(userId, benchmarkName);

    // Check if new score is better (lower time or higher reps)
    const isPR = existing ? this.isBetterScore(
      updates.scoreNumeric,
      existing.bestScoreNumeric || 0,
      updates.wodFormat
    ) : true;

    const benchmarkData = {
      user_id: userId,
      benchmark_name: benchmarkName,
      benchmark_type: updates.benchmarkType,
      wod_format: updates.wodFormat,
      wod_description: updates.wodDescription,
      best_score: isPR ? updates.score : existing?.bestScore,
      best_score_numeric: isPR ? updates.scoreNumeric : existing?.bestScoreNumeric,
      scaling_level: updates.scalingLevel || 'scaled',
      attempt_count: (existing?.attemptCount || 0) + 1,
      last_attempt_date: new Date().toISOString(),
      pr_date: isPR ? new Date().toISOString() : existing?.prDate,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      const { data, error } = await supabase
        .from('functional_benchmarks')
        .update(benchmarkData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating benchmark:', error);
        return null;
      }

      return data;
    } else {
      const { data, error } = await supabase
        .from('functional_benchmarks')
        .insert(benchmarkData)
        .select()
        .single();

      if (error) {
        console.error('Error creating benchmark:', error);
        return null;
      }

      return data;
    }
  },

  /**
   * Get benchmarks by type
   */
  async getBenchmarksByType(userId: string, type: BenchmarkType): Promise<FunctionalBenchmark[]> {
    const { data, error } = await supabase
      .from('functional_benchmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('benchmark_type', type)
      .order('last_attempt_date', { ascending: false });

    if (error) {
      console.error('Error fetching benchmarks by type:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Compare scores to determine if new score is better
   */
  isBetterScore(newScore: number, oldScore: number, wodFormat: WodFormat): boolean {
    switch (wodFormat) {
      case 'forTime':
        // Lower is better (time in seconds)
        return newScore < oldScore || oldScore === 0;

      case 'amrap':
      case 'tabata':
        // Higher is better (rounds/reps)
        return newScore > oldScore;

      case 'emom':
      case 'chipper':
      case 'ladder':
        // Context-dependent, default to higher is better
        return newScore > oldScore;

      default:
        return newScore > oldScore;
    }
  },

  // ============================================================================
  // WOD Session Data
  // ============================================================================

  /**
   * Save WOD session data
   */
  async saveWodData(
    sessionId: string,
    userId: string,
    wodData: Partial<FunctionalWodData>
  ): Promise<FunctionalWodData | null> {
    const data = {
      session_id: sessionId,
      user_id: userId,
      wod_format: wodData.wodFormat,
      wod_name: wodData.wodName || null,
      time_cap_minutes: wodData.timeCapMinutes || null,
      rounds_completed: wodData.roundsCompleted || 0,
      additional_reps: wodData.additionalReps || 0,
      completion_time_seconds: wodData.completionTimeSeconds || null,
      total_reps: wodData.totalReps || 0,
      calories_burned: wodData.caloriesBurned || 0,
      movements_performed: wodData.movementsPerformed || [],
      scaling_modifications: wodData.scalingModifications || [],
      technique_breaks: wodData.techniqueBreaks || 0,
      average_heart_rate: wodData.averageHeartRate || null,
      peak_heart_rate: wodData.peakHeartRate || null,
      perceived_difficulty: wodData.perceivedDifficulty || 7,
      metabolic_intensity: wodData.metabolicIntensity || 'moderate',
      olympic_lifts_performed: wodData.olympicLiftsPerformed || false,
      gymnastic_skills_performed: wodData.gymnasticSkillsPerformed || false,
      notes: wodData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: saved, error } = await supabase
      .from('functional_wod_data')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error saving WOD data:', error);
      return null;
    }

    return saved;
  },

  /**
   * Get WOD data for session
   */
  async getWodData(sessionId: string): Promise<FunctionalWodData | null> {
    const { data, error } = await supabase
      .from('functional_wod_data')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching WOD data:', error);
      return null;
    }

    return data;
  },

  // ============================================================================
  // Session Analytics
  // ============================================================================

  /**
   * Save session analytics
   */
  async saveSessionData(
    sessionId: string,
    userId: string,
    sessionData: Partial<FunctionalSessionData>
  ): Promise<FunctionalSessionData | null> {
    const data = {
      session_id: sessionId,
      user_id: userId,
      total_volume_kg: sessionData.totalVolumeKg || 0,
      olympic_volume_kg: sessionData.olympicVolumeKg || 0,
      gymnastic_volume_reps: sessionData.gymnasticVolumeReps || 0,
      monostructural_calories: sessionData.monostructuralCalories || 0,
      movements_by_category: sessionData.movementsByCategory || {},
      prs_achieved: sessionData.prsAchieved || [],
      technique_quality_score: sessionData.techniqueQualityScore || null,
      consistency_rating: sessionData.consistencyRating || null,
      recommended_rest_hours: sessionData.recommendedRestHours || 24,
      next_focus_areas: sessionData.nextFocusAreas || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: saved, error } = await supabase
      .from('functional_session_data')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error saving session data:', error);
      return null;
    }

    return saved;
  },

  /**
   * Detect PRs from session
   */
  async detectPRs(
    userId: string,
    sessionData: FunctionalWodData
  ): Promise<PrAchieved[]> {
    const prs: PrAchieved[] = [];

    // Check benchmark PR if WOD has name
    if (sessionData.wodName) {
      const benchmark = await this.getBenchmark(userId, sessionData.wodName);

      let scoreNumeric = 0;
      if (sessionData.wodFormat === 'forTime') {
        scoreNumeric = sessionData.completionTimeSeconds || 0;
      } else if (sessionData.wodFormat === 'amrap') {
        scoreNumeric = sessionData.roundsCompleted * 100 + sessionData.additionalReps;
      }

      const isPR = benchmark ? this.isBetterScore(
        scoreNumeric,
        benchmark.bestScoreNumeric || 0,
        sessionData.wodFormat
      ) : true;

      if (isPR && scoreNumeric > 0) {
        prs.push({
          movementName: sessionData.wodName,
          prType: 'benchmark',
          previousValue: benchmark?.bestScore,
          newValue: this.formatScore(scoreNumeric, sessionData.wodFormat),
          celebrationLevel: benchmark ? 'major' : 'epic'
        });
      }
    }

    // Check movement PRs
    for (const movement of sessionData.movementsPerformed || []) {
      if (movement.weightKg && movement.weightKg > 0) {
        const skill = await this.getSkill(userId, movement.name);
        const isPR = !skill || movement.weightKg > (skill.prWeightKg || 0);

        if (isPR) {
          prs.push({
            movementName: movement.name,
            prType: 'weight',
            previousValue: skill?.prWeightKg,
            newValue: movement.weightKg,
            improvement: skill ? `+${(movement.weightKg - (skill.prWeightKg || 0)).toFixed(1)}kg` : undefined,
            celebrationLevel: 'minor'
          });
        }
      }

      if (movement.reps && movement.reps > 0) {
        const skill = await this.getSkill(userId, movement.name);
        const isPR = !skill || movement.reps > (skill.prReps || 0);

        if (isPR) {
          prs.push({
            movementName: movement.name,
            prType: 'reps',
            previousValue: skill?.prReps,
            newValue: movement.reps,
            improvement: skill ? `+${movement.reps - (skill.prReps || 0)} reps` : undefined,
            celebrationLevel: 'minor'
          });
        }
      }
    }

    return prs;
  },

  /**
   * Format score based on WOD format
   */
  formatScore(score: number, wodFormat: WodFormat): string {
    switch (wodFormat) {
      case 'forTime': {
        const minutes = Math.floor(score / 60);
        const seconds = score % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      case 'amrap': {
        const rounds = Math.floor(score / 100);
        const reps = score % 100;
        return `${rounds} rounds + ${reps} reps`;
      }

      default:
        return score.toString();
    }
  },

  /**
   * Get recent WOD history
   */
  async getRecentWods(userId: string, limit: number = 10): Promise<FunctionalWodData[]> {
    const { data, error } = await supabase
      .from('functional_wod_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent WODs:', error);
      return [];
    }

    return data || [];
  }
};

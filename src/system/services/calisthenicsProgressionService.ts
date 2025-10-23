/**
 * Calisthenics Progression Service
 * Manages skill progressions, achievements, and difficulty adjustments for calisthenics training
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CalisthenicsSkill,
  CalisthenicsProgression,
  SkillLevel,
  SkillCategory,
  ProgressionStage
} from '../../domain/calisthenics/calisthenicsTypes';
import { PROGRESSION_PATHS } from '../../domain/calisthenics/calisthenicsTypes';
import logger from '../../lib/utils/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

class CalisthenicsProgressionService {
  /**
   * Get user's current skill data
   */
  async getUserSkill(userId: string, skillName: string): Promise<CalisthenicsSkill | null> {
    try {
      const { data, error } = await supabase
        .from('calisthenics_skills')
        .select('*')
        .eq('user_id', userId)
        .eq('skill_name', skillName)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('CALISTHENICS_SERVICE', 'Failed to get user skill', { error, userId, skillName });
      return null;
    }
  }

  /**
   * Update or create skill record
   */
  async updateSkillProgress(
    userId: string,
    skillName: string,
    updates: {
      maxReps?: number;
      maxHoldTime?: number;
      currentLevel?: SkillLevel;
      currentVariant?: string;
      skillCategory?: SkillCategory;
    }
  ): Promise<CalisthenicsSkill | null> {
    try {
      const existing = await this.getUserSkill(userId, skillName);

      if (existing) {
        const { data, error } = await supabase
          .from('calisthenics_skills')
          .update({
            ...updates,
            last_performed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        logger.info('CALISTHENICS_SERVICE', 'Skill updated', { skillName, updates });
        return data;
      } else {
        const { data, error } = await supabase
          .from('calisthenics_skills')
          .insert({
            user_id: userId,
            skill_name: skillName,
            skill_category: updates.skillCategory || 'general',
            current_level: updates.currentLevel || 'beginner',
            current_variant: updates.currentVariant,
            max_reps: updates.maxReps || 0,
            max_hold_time: updates.maxHoldTime || 0,
            last_performed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        logger.info('CALISTHENICS_SERVICE', 'Skill created', { skillName, updates });
        return data;
      }
    } catch (error) {
      logger.error('CALISTHENICS_SERVICE', 'Failed to update skill', { error, userId, skillName });
      return null;
    }
  }

  /**
   * Get all user skills
   */
  async getAllUserSkills(userId: string): Promise<CalisthenicsSkill[]> {
    try {
      const { data, error } = await supabase
        .from('calisthenics_skills')
        .select('*')
        .eq('user_id', userId)
        .order('last_performed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('CALISTHENICS_SERVICE', 'Failed to get user skills', { error, userId });
      return [];
    }
  }

  /**
   * Get user's progression for a skill
   */
  async getSkillProgressions(userId: string, skillName: string): Promise<CalisthenicsProgression[]> {
    try {
      const { data, error } = await supabase
        .from('calisthenics_progressions')
        .select('*')
        .eq('user_id', userId)
        .eq('skill_name', skillName)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('CALISTHENICS_SERVICE', 'Failed to get progressions', { error, userId, skillName });
      return [];
    }
  }

  /**
   * Mark progression stage as achieved
   */
  async achieveProgressionStage(
    userId: string,
    skillName: string,
    progressionStage: ProgressionStage,
    actualValue: number,
    isHoldTime: boolean = false
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('calisthenics_progressions')
        .update({
          achieved: true,
          achieved_at: new Date().toISOString(),
          notes: isHoldTime
            ? `Achieved ${actualValue}s hold time`
            : `Achieved ${actualValue} reps`
        })
        .eq('user_id', userId)
        .eq('skill_name', skillName)
        .eq('progression_stage', progressionStage)
        .select();

      if (error) throw error;

      logger.info('CALISTHENICS_SERVICE', 'Progression achieved', {
        userId,
        skillName,
        progressionStage,
        actualValue
      });

      return true;
    } catch (error) {
      logger.error('CALISTHENICS_SERVICE', 'Failed to achieve progression', {
        error,
        userId,
        skillName,
        progressionStage
      });
      return false;
    }
  }

  /**
   * Get next recommended progression for a skill
   */
  getNextProgression(skillName: string, currentStage: ProgressionStage): ProgressionStage | null {
    const path = PROGRESSION_PATHS[skillName.toLowerCase()];
    if (!path) return null;

    const currentIndex = path.stages.findIndex(s => s.stage === currentStage);
    if (currentIndex === -1 || currentIndex >= path.stages.length - 1) return null;

    return path.stages[currentIndex + 1].stage;
  }

  /**
   * Get previous regression for a skill (easier variant)
   */
  getPreviousRegression(skillName: string, currentStage: ProgressionStage): ProgressionStage | null {
    const path = PROGRESSION_PATHS[skillName.toLowerCase()];
    if (!path) return null;

    const currentIndex = path.stages.findIndex(s => s.stage === currentStage);
    if (currentIndex <= 0) return null;

    return path.stages[currentIndex - 1].stage;
  }

  /**
   * Adjust exercise difficulty based on user feedback
   */
  adjustDifficulty(
    exerciseName: string,
    currentVariant: string,
    direction: 'easier' | 'harder'
  ): {
    newVariant: string;
    reasoning: string;
  } {
    const variants: Record<string, { easier?: string; harder?: string; reasoning: string }> = {
      'pull-ups': {
        easier: 'Negative pull-ups',
        harder: 'Archer pull-ups',
        reasoning: direction === 'easier'
          ? 'Passer aux négatives pour renforcer excentrique'
          : 'Progresser vers archer pull-ups pour plus de challenge'
      },
      'negative pull-ups': {
        easier: 'Band-assisted pull-ups',
        harder: 'Regular pull-ups',
        reasoning: direction === 'easier'
          ? 'Utiliser élastique pour assistance'
          : 'Passer aux pull-ups complets'
      },
      'push-ups': {
        easier: 'Knee push-ups',
        harder: 'Diamond push-ups',
        reasoning: direction === 'easier'
          ? 'Genou au sol pour réduire charge'
          : 'Diamond pour plus de triceps et difficulté'
      },
      'diamond push-ups': {
        easier: 'Regular push-ups',
        harder: 'Archer push-ups',
        reasoning: direction === 'easier'
          ? 'Revenir aux push-ups classiques'
          : 'Progresser vers archer pour unilatéral'
      },
      'dips': {
        easier: 'Bench dips',
        harder: 'Ring dips',
        reasoning: direction === 'easier'
          ? 'Dips sur banc pour réduire difficulté'
          : 'Anneaux pour instabilité et challenge'
      },
      'l-sit': {
        easier: 'L-sit tucked',
        harder: 'L-sit one leg extended',
        reasoning: direction === 'easier'
          ? 'Genoux repliés pour faciliter'
          : 'Une jambe tendue pour progresser'
      },
      'muscle-up': {
        easier: 'High pull-ups explosifs',
        harder: 'Muscle-up strict',
        reasoning: direction === 'easier'
          ? 'Focus sur explosivité pull-up'
          : 'Muscle-up sans kip pour plus de contrôle'
      }
    };

    const exerciseKey = exerciseName.toLowerCase();
    const variantData = variants[exerciseKey];

    if (!variantData) {
      return {
        newVariant: currentVariant,
        reasoning: 'Pas de variation trouvée pour cet exercice'
      };
    }

    const newVariant = direction === 'easier' ? variantData.easier : variantData.harder;

    return {
      newVariant: newVariant || currentVariant,
      reasoning: variantData.reasoning
    };
  }

  /**
   * Calculate skill level based on performance
   */
  calculateSkillLevel(
    skillName: string,
    maxReps: number,
    maxHoldTime: number
  ): SkillLevel {
    const thresholds: Record<string, { level: SkillLevel; reps?: number; holdTime?: number }[]> = {
      'pull-ups': [
        { level: 'beginner', reps: 1 },
        { level: 'novice', reps: 5 },
        { level: 'intermediate', reps: 10 },
        { level: 'advanced', reps: 15 },
        { level: 'elite', reps: 20 },
        { level: 'master', reps: 25 }
      ],
      'muscle-up': [
        { level: 'advanced', reps: 1 },
        { level: 'elite', reps: 5 },
        { level: 'master', reps: 10 }
      ],
      'handstand': [
        { level: 'intermediate', holdTime: 10 },
        { level: 'advanced', holdTime: 30 },
        { level: 'elite', holdTime: 60 },
        { level: 'master', holdTime: 120 }
      ],
      'front-lever': [
        { level: 'advanced', holdTime: 5 },
        { level: 'elite', holdTime: 10 },
        { level: 'master', holdTime: 20 }
      ],
      'l-sit': [
        { level: 'intermediate', holdTime: 10 },
        { level: 'advanced', holdTime: 20 },
        { level: 'elite', holdTime: 40 },
        { level: 'master', holdTime: 60 }
      ]
    };

    const skillKey = skillName.toLowerCase();
    const skillThresholds = thresholds[skillKey];

    if (!skillThresholds) return 'beginner';

    for (let i = skillThresholds.length - 1; i >= 0; i--) {
      const threshold = skillThresholds[i];
      if (threshold.reps && maxReps >= threshold.reps) {
        return threshold.level;
      }
      if (threshold.holdTime && maxHoldTime >= threshold.holdTime) {
        return threshold.level;
      }
    }

    return 'beginner';
  }

  /**
   * Get skill recommendations based on user's current skills
   */
  getSkillRecommendations(userSkills: CalisthenicsSkill[]): string[] {
    const recommendations: string[] = [];

    const hasPullUps = userSkills.find(s => s.skillName.toLowerCase().includes('pull-up'));
    const hasDips = userSkills.find(s => s.skillName.toLowerCase().includes('dip'));
    const hasLSit = userSkills.find(s => s.skillName.toLowerCase().includes('l-sit'));
    const hasHandstand = userSkills.find(s => s.skillName.toLowerCase().includes('handstand'));

    if (!hasPullUps || (hasPullUps && hasPullUps.maxReps < 5)) {
      recommendations.push('Focus sur pull-ups: fondation critique pour skills avancés');
    }

    if (!hasDips || (hasDips && hasDips.maxReps < 10)) {
      recommendations.push('Développer dips: force poussée essentielle');
    }

    if (hasPullUps && hasPullUps.maxReps >= 10 && hasDips && hasDips.maxReps >= 15) {
      if (!userSkills.find(s => s.skillName.toLowerCase().includes('muscle-up'))) {
        recommendations.push('Prêt pour muscle-up: prérequis atteints!');
      }
    }

    if (!hasLSit) {
      recommendations.push('Commencer L-sit: compression et core essentiels');
    }

    if (!hasHandstand) {
      recommendations.push('Pratiquer handstand: équilibre et force épaules');
    }

    if (hasPullUps && hasPullUps.maxReps >= 8 && hasLSit && hasLSit.maxHoldTime >= 15) {
      if (!userSkills.find(s => s.skillName.toLowerCase().includes('front lever'))) {
        recommendations.push('Débuter front lever: force traction + core suffisants');
      }
    }

    return recommendations;
  }
}

export const calisthenicsProgressionService = new CalisthenicsProgressionService();

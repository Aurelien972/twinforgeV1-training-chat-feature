/**
 * Level System Configuration
 * XP requirements and level titles
 */

import { XP_THRESHOLDS } from './constants';

export interface LevelRequirement {
  level: number;
  xpRequired: number;
  title: string;
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Débutant',
  5: 'Novice',
  10: 'Apprenti',
  15: 'Compétent',
  20: 'Expérimenté',
  25: 'Avancé',
  30: 'Expert',
  40: 'Maître',
  50: 'Champion',
  60: 'Légende',
  70: 'Titan',
  80: 'Dieu',
  90: 'Immortel',
  100: 'Transcendant',
};

/**
 * Calculate XP required for a specific level
 */
export function calculateXPForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += Math.floor(XP_THRESHOLDS.BASE_XP * Math.pow(XP_THRESHOLDS.MULTIPLIER, i - 1));
  }
  
  return totalXP;
}

/**
 * Calculate level from total XP
 */
export function calculateLevelFromXP(xp: number): number {
  let level = 1;
  let xpRequired = 0;
  
  while (level < XP_THRESHOLDS.MAX_LEVEL) {
    const nextLevelXP = calculateXPForLevel(level + 1);
    if (xp < nextLevelXP) break;
    level++;
    xpRequired = nextLevelXP;
  }
  
  return level;
}

/**
 * Get title for a given level
 */
export function getLevelTitle(level: number): string {
  const levels = Object.keys(LEVEL_TITLES)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const threshold of levels) {
    if (level >= threshold) {
      return LEVEL_TITLES[threshold];
    }
  }
  
  return LEVEL_TITLES[1];
}

/**
 * Calculate progress percentage to next level
 */
export function calculateLevelProgress(currentXP: number, level: number): number {
  const currentLevelXP = calculateXPForLevel(level);
  const nextLevelXP = calculateXPForLevel(level + 1);
  const xpInLevel = currentXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  
  return Math.min(100, Math.max(0, (xpInLevel / xpNeededForLevel) * 100));
}

/**
 * Get XP needed for next level
 */
export function getXPForNextLevel(currentXP: number, level: number): number {
  const nextLevelXP = calculateXPForLevel(level + 1);
  return Math.max(0, nextLevelXP - currentXP);
}

/**
 * Generate all level requirements up to max level
 */
export function generateLevelRequirements(): LevelRequirement[] {
  const requirements: LevelRequirement[] = [];
  
  for (let level = 1; level <= XP_THRESHOLDS.MAX_LEVEL; level++) {
    requirements.push({
      level,
      xpRequired: calculateXPForLevel(level),
      title: getLevelTitle(level),
    });
  }
  
  return requirements;
}

/**
 * Level Calculation Utilities
 * Pure functions for XP and level calculations
 */

import {
  calculateXPForLevel,
  calculateLevelFromXP,
  calculateLevelProgress,
  getXPForNextLevel,
  getLevelTitle,
} from '../config/levelConfig';
import type { UserLevel, LevelInfo, XPGain } from '../types';

/**
 * Build complete user level information from raw data
 */
export function buildUserLevelInfo(
  totalXP: number,
  currentLevel: number
): LevelInfo {
  const xpRequired = calculateXPForLevel(currentLevel);
  const xpForNext = calculateXPForLevel(currentLevel + 1);
  const progress = calculateLevelProgress(totalXP, currentLevel);
  
  return {
    level: currentLevel,
    title: getLevelTitle(currentLevel),
    xpRequired,
    xpForNext,
    progress,
  };
}

/**
 * Calculate XP gain from session metrics
 */
export function calculateSessionXP(params: {
  exerciseCount: number;
  totalVolume: number;
  averageRPE: number;
  duration: number;
  isNewRecord: boolean;
}): XPGain {
  const { exerciseCount, totalVolume, averageRPE, duration, isNewRecord } = params;
  
  let xp = 0;
  
  // Base XP from exercises
  xp += exerciseCount * 10;
  
  // Bonus from volume (scaled)
  xp += Math.floor(totalVolume / 100);
  
  // Bonus from intensity
  xp += Math.floor(averageRPE * 5);
  
  // Bonus from duration (1 XP per minute)
  xp += Math.floor(duration / 60);
  
  // New record bonus
  if (isNewRecord) {
    xp += 50;
  }
  
  return {
    amount: xp,
    source: 'session_completion',
    timestamp: new Date(),
  };
}

/**
 * Calculate XP gain from achievement unlock
 */
export function calculateAchievementXP(rarity: 'common' | 'rare' | 'epic' | 'legendary'): XPGain {
  const xpByRarity = {
    common: 50,
    rare: 100,
    epic: 250,
    legendary: 500,
  };
  
  return {
    amount: xpByRarity[rarity],
    source: `achievement_${rarity}`,
    timestamp: new Date(),
  };
}

/**
 * Calculate XP gain from milestone completion
 */
export function calculateMilestoneXP(milestoneType: string, difficulty: number): XPGain {
  const baseXP = 100;
  const difficultyMultiplier = 1 + (difficulty / 10);
  
  return {
    amount: Math.floor(baseXP * difficultyMultiplier),
    source: `milestone_${milestoneType}`,
    timestamp: new Date(),
  };
}

/**
 * Calculate XP gain from streak milestone
 */
export function calculateStreakXP(streakDays: number): XPGain {
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  const index = milestones.findIndex(m => m === streakDays);
  
  if (index === -1) {
    return { amount: 0, source: 'streak', timestamp: new Date() };
  }
  
  const xpRewards = [50, 100, 200, 400, 750, 1500, 3000];
  
  return {
    amount: xpRewards[index],
    source: `streak_${streakDays}_days`,
    timestamp: new Date(),
  };
}

/**
 * Calculate total XP from multiple gains
 */
export function sumXPGains(gains: XPGain[]): number {
  return gains.reduce((total, gain) => total + gain.amount, 0);
}

/**
 * Check if user leveled up after XP gain
 */
export function checkLevelUp(oldXP: number, newXP: number): {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  levelsGained: number;
} {
  const oldLevel = calculateLevelFromXP(oldXP);
  const newLevel = calculateLevelFromXP(newXP);
  
  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    levelsGained: newLevel - oldLevel,
  };
}

/**
 * Get XP progress as a percentage
 */
export function getXPProgressPercentage(userLevel: UserLevel): number {
  return userLevel.xpProgress;
}

/**
 * Get remaining XP to next level
 */
export function getRemainingXP(userLevel: UserLevel): number {
  return userLevel.xpForNextLevel - userLevel.currentXP;
}

/**
 * Estimate sessions needed to level up
 */
export function estimateSessionsToLevelUp(
  remainingXP: number,
  averageXPPerSession: number
): number {
  if (averageXPPerSession <= 0) return Infinity;
  return Math.ceil(remainingXP / averageXPPerSession);
}

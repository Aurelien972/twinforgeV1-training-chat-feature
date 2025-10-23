/**
 * Achievement System Configuration
 * Categories, rarities, and achievement metadata
 */

import type { AchievementCategory, AchievementRarity } from '../types';
import type { IconName } from '../../../../icons/registry';
import { PROGRESSION_COLORS, RARITY_COLORS } from './constants';

export interface AchievementCategoryConfig {
  color: string;
  icon: IconName;
  label: string;
  description: string;
}

export const ACHIEVEMENT_CATEGORIES: Record<AchievementCategory, AchievementCategoryConfig> = {
  strength: {
    color: PROGRESSION_COLORS.INTENSITY,
    icon: 'Dumbbell',
    label: 'Force',
    description: 'Réussites liées à la force',
  },
  endurance: {
    color: PROGRESSION_COLORS.VOLUME,
    icon: 'Zap',
    label: 'Endurance',
    description: 'Réussites liées à l\'endurance',
  },
  consistency: {
    color: PROGRESSION_COLORS.STREAK,
    icon: 'Flame',
    label: 'Régularité',
    description: 'Réussites liées à la régularité',
  },
  volume: {
    color: PROGRESSION_COLORS.VOLUME,
    icon: 'TrendingUp',
    label: 'Volume',
    description: 'Réussites liées au volume d\'entraînement',
  },
  milestone: {
    color: PROGRESSION_COLORS.MILESTONE,
    icon: 'Target',
    label: 'Jalon',
    description: 'Jalons importants atteints',
  },
  special: {
    color: PROGRESSION_COLORS.ACCENT,
    icon: 'Star',
    label: 'Spécial',
    description: 'Réussites spéciales et uniques',
  },
};

export interface RarityConfig {
  border: string;
  glow: string;
  color: string;
  background: string;
  label: string;
  weight: number;
}

export const RARITY_CONFIG: Record<AchievementRarity, RarityConfig> = {
  common: {
    ...RARITY_COLORS.common,
    label: 'Commun',
    weight: 1,
  },
  rare: {
    ...RARITY_COLORS.rare,
    label: 'Rare',
    weight: 2,
  },
  epic: {
    ...RARITY_COLORS.epic,
    label: 'Épique',
    weight: 3,
  },
  legendary: {
    ...RARITY_COLORS.legendary,
    label: 'Légendaire',
    weight: 4,
  },
};

/**
 * Get achievement category configuration
 */
export function getAchievementCategoryConfig(category: AchievementCategory): AchievementCategoryConfig {
  return ACHIEVEMENT_CATEGORIES[category];
}

/**
 * Get rarity configuration
 */
export function getRarityConfig(rarity: AchievementRarity): RarityConfig {
  return RARITY_CONFIG[rarity];
}

/**
 * Sort achievements by rarity (legendary first)
 */
export function sortByRarity<T extends { rarity: AchievementRarity }>(achievements: T[]): T[] {
  return [...achievements].sort((a, b) => {
    return RARITY_CONFIG[b.rarity].weight - RARITY_CONFIG[a.rarity].weight;
  });
}

/**
 * Sort achievements by progress (closest to completion first)
 */
export function sortByProgress<T extends { current: number; target: number }>(achievements: T[]): T[] {
  return [...achievements].sort((a, b) => {
    const progressA = (a.current / a.target) * 100;
    const progressB = (b.current / b.target) * 100;
    return progressB - progressA;
  });
}

/**
 * Filter achievements by category
 */
export function filterByCategory<T extends { category: AchievementCategory }>(
  achievements: T[],
  category: AchievementCategory
): T[] {
  return achievements.filter(achievement => achievement.category === category);
}

/**
 * Filter achievements by rarity
 */
export function filterByRarity<T extends { rarity: AchievementRarity }>(
  achievements: T[],
  rarity: AchievementRarity
): T[] {
  return achievements.filter(achievement => achievement.rarity === rarity);
}

/**
 * Get unlocked achievements
 */
export function getUnlockedAchievements<T extends { unlockedAt?: Date | null }>(
  achievements: T[]
): T[] {
  return achievements.filter(achievement => achievement.unlockedAt != null);
}

/**
 * Get locked achievements
 */
export function getLockedAchievements<T extends { unlockedAt?: Date | null }>(
  achievements: T[]
): T[] {
  return achievements.filter(achievement => achievement.unlockedAt == null);
}

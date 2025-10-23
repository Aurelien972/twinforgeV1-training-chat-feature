/**
 * Rarity Helper Utilities
 * Functions for working with achievement rarities
 */

import type { AchievementRarity, RarityConfig } from '../types';
import { RARITY_CONFIG } from '../config/achievementConfig';

/**
 * Get rarity configuration
 */
export function getRarityConfig(rarity: AchievementRarity): RarityConfig {
  return RARITY_CONFIG[rarity];
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: AchievementRarity): string {
  return RARITY_CONFIG[rarity].color;
}

/**
 * Get rarity border
 */
export function getRarityBorder(rarity: AchievementRarity): string {
  return RARITY_CONFIG[rarity].border;
}

/**
 * Get rarity glow
 */
export function getRarityGlow(rarity: AchievementRarity): string {
  return RARITY_CONFIG[rarity].glow;
}

/**
 * Get rarity background
 */
export function getRarityBackground(rarity: AchievementRarity): string {
  return RARITY_CONFIG[rarity].background;
}

/**
 * Get rarity label
 */
export function getRarityLabel(rarity: AchievementRarity): string {
  return RARITY_CONFIG[rarity].label;
}

/**
 * Get rarity weight for sorting
 */
export function getRarityWeight(rarity: AchievementRarity): number {
  return RARITY_CONFIG[rarity].weight;
}

/**
 * Compare rarities (for sorting)
 */
export function compareRarities(
  rarity1: AchievementRarity,
  rarity2: AchievementRarity
): number {
  return getRarityWeight(rarity2) - getRarityWeight(rarity1);
}

/**
 * Check if rarity is legendary
 */
export function isLegendary(rarity: AchievementRarity): boolean {
  return rarity === 'legendary';
}

/**
 * Check if rarity is epic or higher
 */
export function isEpicOrHigher(rarity: AchievementRarity): boolean {
  return getRarityWeight(rarity) >= getRarityWeight('epic');
}

/**
 * Get rarity styles for card
 */
export function getRarityCardStyles(rarity: AchievementRarity): {
  border: string;
  background: string;
  boxShadow: string;
} {
  const config = getRarityConfig(rarity);
  
  return {
    border: `2px solid ${config.border}`,
    background: config.background,
    boxShadow: `0 0 20px ${config.glow}, 0 8px 32px rgba(0, 0, 0, 0.25)`,
  };
}

/**
 * Get rarity text color with glow
 */
export function getRarityTextStyle(rarity: AchievementRarity): {
  color: string;
  textShadow: string;
} {
  const config = getRarityConfig(rarity);
  
  return {
    color: config.color,
    textShadow: `0 0 12px ${config.glow}`,
  };
}

/**
 * Determine rarity based on achievement difficulty
 */
export function determineRarity(params: {
  targetValue: number;
  averageCompletionRate: number;
  category: string;
}): AchievementRarity {
  const { targetValue, averageCompletionRate, category } = params;
  
  // Very rare achievements (< 5% completion rate)
  if (averageCompletionRate < 0.05) return 'legendary';
  
  // Rare achievements (< 20% completion rate)
  if (averageCompletionRate < 0.2) return 'epic';
  
  // Uncommon achievements (< 50% completion rate)
  if (averageCompletionRate < 0.5) return 'rare';
  
  // Common achievements
  return 'common';
}

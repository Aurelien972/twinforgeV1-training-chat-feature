/**
 * Badge Configurations
 * Defines all available badges and their earning conditions
 */

import type { BadgeConfig, SessionMetrics } from '../types';
import { BADGE_COLORS, CALCULATION_CONSTANTS } from './constants';

export const BADGE_CONFIGS: BadgeConfig[] = [
  {
    id: 'volume-king',
    name: 'Volume King',
    description: 'Plus de 5000kg de volume total',
    icon: 'Weight',
    color: BADGE_COLORS['volume-king'],
    emoji: '👑',
    condition: (metrics: SessionMetrics) =>
      metrics.totalVolume >= CALCULATION_CONSTANTS.VOLUME_THRESHOLD_KG,
  },
  {
    id: 'endurance-beast',
    name: 'Endurance Beast',
    description: 'Ratio travail/repos supérieur à 2:1',
    icon: 'Zap',
    color: BADGE_COLORS['endurance-beast'],
    emoji: '⚡',
    condition: (metrics: SessionMetrics) =>
      metrics.workRestRatio >= CALCULATION_CONSTANTS.WORK_REST_RATIO_THRESHOLD,
  },
  {
    id: 'perfect-form',
    name: 'Perfect Form',
    description: 'Technique moyenne de 8+/10',
    icon: 'Award',
    color: BADGE_COLORS['perfect-form'],
    emoji: '🎯',
    condition: (metrics: SessionMetrics) =>
      metrics.avgTechnique >= CALCULATION_CONSTANTS.TECHNIQUE_THRESHOLD,
  },
  {
    id: 'calorie-crusher',
    name: 'Calorie Crusher',
    description: 'Plus de 400 calories brûlées',
    icon: 'Flame',
    color: BADGE_COLORS['calorie-crusher'],
    emoji: '🔥',
    condition: (metrics: SessionMetrics) =>
      metrics.caloriesBurned >= CALCULATION_CONSTANTS.CALORIES_THRESHOLD,
  },
  {
    id: 'consistency-master',
    name: 'Consistency Master',
    description: 'Tous les exercices complétés',
    icon: 'CheckCircle',
    color: BADGE_COLORS['consistency-master'],
    emoji: '✅',
    condition: (metrics: SessionMetrics) =>
      metrics.completionRate === 1,
  },
];

/**
 * Get all earned badges based on session metrics
 */
export function getEarnedBadges(metrics: SessionMetrics): BadgeConfig[] {
  return BADGE_CONFIGS.filter(badge => badge.condition(metrics));
}

/**
 * Get encouragement message based on badge count
 */
export function getEncouragementMessage(badgeCount: number): string {
  if (badgeCount === 1) return "Premier badge ! Continue comme ça 💪";
  if (badgeCount === 2) return "Deux badges ! Tu es en feu 🔥";
  if (badgeCount >= 3) return "Trio de badges ! Performance exceptionnelle 🌟";
  return "";
}

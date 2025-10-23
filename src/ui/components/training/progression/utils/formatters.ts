/**
 * Formatter Utilities
 * Functions for formatting progression data for display
 */

import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Format XP with thousands separator
 */
export function formatXP(xp: number): string {
  return xp.toLocaleString('fr-FR');
}

/**
 * Format level display
 */
export function formatLevel(level: number): string {
  return `Niveau ${level}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format improvement percentage with sign
 */
export function formatImprovement(value: number, decimals: number = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format date relative to now
 */
export function formatRelativeDate(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

/**
 * Format date as short string
 */
export function formatShortDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: fr });
}

/**
 * Format date as long string
 */
export function formatLongDate(date: Date): string {
  return format(date, 'dd MMMM yyyy', { locale: fr });
}

/**
 * Format streak display
 */
export function formatStreak(days: number): string {
  if (days === 0) return 'Aucune série';
  if (days === 1) return '1 jour';
  return `${days} jours`;
}

/**
 * Format session count
 */
export function formatSessionCount(count: number): string {
  if (count === 0) return 'Aucune séance';
  if (count === 1) return '1 séance';
  return `${count} séances`;
}

/**
 * Format weight with unit
 */
export function formatWeight(kg: number, decimals: number = 1): string {
  return `${kg.toFixed(decimals)} kg`;
}

/**
 * Format volume
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k kg`;
  }
  return `${volume.toFixed(0)} kg`;
}

/**
 * Format duration in minutes
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}

/**
 * Format RPE (Rate of Perceived Exertion)
 */
export function formatRPE(rpe: number): string {
  return `${rpe.toFixed(1)}/10`;
}

/**
 * Format record value based on metric type
 */
export function formatRecordValue(
  value: number,
  metricType: 'weight' | 'reps' | 'time' | 'distance'
): string {
  switch (metricType) {
    case 'weight':
      return formatWeight(value);
    case 'reps':
      return `${value} reps`;
    case 'time':
      return formatDuration(value);
    case 'distance':
      return `${value.toFixed(1)} km`;
    default:
      return value.toString();
  }
}

/**
 * Format achievement progress
 */
export function formatAchievementProgress(current: number, target: number): string {
  return `${current} / ${target}`;
}

/**
 * Format milestone progress percentage
 */
export function formatMilestoneProgress(current: number, target: number): string {
  const percentage = (current / target) * 100;
  return formatPercentage(Math.min(100, percentage), 0);
}

/**
 * Format balance rating
 */
export function formatBalanceRating(
  rating: 'excellent' | 'good' | 'needsWork'
): string {
  const labels = {
    excellent: 'Excellent',
    good: 'Bon',
    needsWork: 'À améliorer',
  };
  return labels[rating];
}

/**
 * Format muscle group name
 */
export function formatMuscleGroup(muscleGroup: string): string {
  const labels: Record<string, string> = {
    chest: 'Pectoraux',
    back: 'Dos',
    shoulders: 'Épaules',
    arms: 'Bras',
    legs: 'Jambes',
    core: 'Abdos',
    fullBody: 'Corps entier',
    cardio: 'Cardio',
  };
  
  return labels[muscleGroup] || muscleGroup;
}

/**
 * Format ordinal number (1er, 2e, 3e, etc.)
 */
export function formatOrdinal(num: number): string {
  if (num === 1) return '1er';
  return `${num}e`;
}

/**
 * Format days between dates
 */
export function formatDaysBetween(date1: Date, date2: Date): string {
  const days = Math.abs(differenceInDays(date2, date1));
  return formatStreak(days);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Format large numbers with K/M suffix
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

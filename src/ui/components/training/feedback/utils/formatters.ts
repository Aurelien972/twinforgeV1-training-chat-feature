/**
 * Formatters
 * Utility functions for formatting values for display
 */

import { FORMAT_CONSTANTS } from '../config/constants';

/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in seconds to HH:MM or MM:SS format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format volume for display (kg or tons)
 */
export function formatVolume(volumeKg: number): string {
  if (volumeKg > FORMAT_CONSTANTS.VOLUME_THRESHOLD_DISPLAY) {
    return `${(volumeKg / 1000).toFixed(1)}t`;
  }
  return `${volumeKg}kg`;
}

/**
 * Format work/rest ratio
 */
export function formatWorkRestRatio(ratio: number): string {
  return `${ratio.toFixed(1)}:1`;
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength);
}

/**
 * Format load for display (handles both single values and arrays)
 */
export function formatLoad(load: number | number[]): string {
  if (Array.isArray(load)) {
    return `${Math.max(...load)}kg (max)`;
  }
  return `${load || 0}kg`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format date to French locale
 */
export function formatDateFr(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR');
}

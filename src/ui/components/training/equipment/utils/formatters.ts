/**
 * Formatter Utilities
 * Helper functions for formatting equipment names and labels
 */

export function formatEquipmentName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatConfidenceScore(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function pluralize(word: string, count: number): string {
  return count > 1 ? `${word}s` : word;
}

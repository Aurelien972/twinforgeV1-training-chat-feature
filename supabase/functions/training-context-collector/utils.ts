/**
 * Utility Functions for Training Context Collector
 */

// Cache schema version - increment when structure changes
export const CACHE_SCHEMA_VERSION = "2.1.0";

/**
 * Calculate cost for OpenAI API usage
 */
export function calculateCost(totalTokens: number, model: string): number {
  if (model === "gpt-5-mini") {
    const inputTokens = totalTokens * 0.6;
    const outputTokens = totalTokens * 0.4;
    return (inputTokens * 0.10 / 1000000) + (outputTokens * 0.30 / 1000000);
  }
  return 0;
}

/**
 * Generate cache key for user context
 */
export function generateCacheKey(userId: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `context-collector:${userId}:${today}:v${CACHE_SCHEMA_VERSION}`;
}

/**
 * Calculate days since a date
 */
export function daysSince(date: string | Date): number {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate hours since a date
 */
export function hoursSince(date: string | Date): number {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

/**
 * Format duration in human readable format
 */
export function formatDuration(hours: number): string {
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Check if date is recent (within last N days)
 */
export function isRecent(date: string | Date, daysThreshold: number = 7): boolean {
  return daysSince(date) <= daysThreshold;
}

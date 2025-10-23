/**
 * Endurance Helper Functions
 * Utility functions for endurance session management
 */

/**
 * Format seconds into MM:SS or HH:MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculate progress percentage for a block
 */
export const calculateBlockProgress = (blockTime: number, duration: number): number => {
  return Math.min((blockTime / (duration * 60)) * 100, 100);
};

/**
 * Calculate total session progress percentage
 */
export const calculateTotalProgress = (
  currentBlockIndex: number,
  blockProgress: number,
  totalBlocks: number
): number => {
  if (totalBlocks === 0) return 0;
  return ((currentBlockIndex + blockProgress / 100) / totalBlocks) * 100;
};

/**
 * Calculate session progress based on elapsed time
 */
export const calculateSessionProgress = (sessionTime: number, totalDuration: number): number => {
  return totalDuration > 0 ? (sessionTime / totalDuration) * 100 : 0;
};

/**
 * Get zone color based on zone key
 */
export const getZoneColor = (zone: string): string => {
  const zoneColors: Record<string, string> = {
    'Z1': '#10b981',
    'Z2': '#3b82f6',
    'Z3': '#f59e0b',
    'Z4': '#ef4444',
    'Z5': '#dc2626',
  };
  return zoneColors[zone] || '#8b5cf6';
};

/**
 * Scroll to element with offset
 */
export const scrollToElement = (element: HTMLElement | null, offset: number = 0.2) => {
  if (!element) return;

  setTimeout(() => {
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const viewportOffset = window.innerHeight * offset;
    const scrollPosition = absoluteElementTop - viewportOffset;

    window.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: 'smooth',
    });
  }, 500);
};

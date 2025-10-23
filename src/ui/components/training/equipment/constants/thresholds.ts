/**
 * Detection Thresholds Constants
 * Confidence score thresholds for equipment detection
 */

export const CONFIDENCE_THRESHOLDS = {
  high: 0.9,
  good: 0.7,
  medium: 0.5,
  low: 0
} as const;

export const DETECTION_MARKER_SIZES = {
  small: {
    width: 20,
    height: 20,
    fontSize: 10
  },
  medium: {
    width: 32,
    height: 32,
    fontSize: 12
  },
  large: {
    width: 40,
    height: 40,
    fontSize: 14
  }
} as const;

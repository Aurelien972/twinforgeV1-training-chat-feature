/**
 * Rep Format Parser
 * Intelligent parsing and display of complex rep schemes
 * Supports: alternatives, progressions, ranges, and special formats
 */

export interface ParsedRep {
  primary: string;
  secondary?: string;
  type: 'standard' | 'alternative' | 'range' | 'progression' | 'amrap' | 'emom';
  fullText: string;
  isComplex: boolean;
}

/**
 * Parse complex rep formats into structured data
 * Examples:
 * - "15 (or 10 pistols total)" → primary: "15", secondary: "10 pistols total"
 * - "21-15-9" → primary: "21-15-9", type: "progression"
 * - "10-15" → primary: "10-15", type: "range"
 * - "AMRAP" → primary: "AMRAP", type: "amrap"
 */
export function parseRepFormat(reps: number | string): ParsedRep {
  const repsString = String(reps);

  // AMRAP detection
  if (repsString.toUpperCase().includes('AMRAP')) {
    return {
      primary: 'AMRAP',
      type: 'amrap',
      fullText: repsString,
      isComplex: false,
    };
  }

  // EMOM detection
  if (repsString.toUpperCase().includes('EMOM')) {
    return {
      primary: 'EMOM',
      type: 'emom',
      fullText: repsString,
      isComplex: false,
    };
  }

  // Alternative format: "15 (or 10 pistols total)"
  const alternativeMatch = repsString.match(/^(\d+)\s*\(or\s+(.+?)\)$/i);
  if (alternativeMatch) {
    return {
      primary: alternativeMatch[1],
      secondary: alternativeMatch[2],
      type: 'alternative',
      fullText: repsString,
      isComplex: true,
    };
  }

  // Alternative format with "or": "15 or 10 pistols"
  const orMatch = repsString.match(/^(\d+)\s+or\s+(.+)$/i);
  if (orMatch) {
    return {
      primary: orMatch[1],
      secondary: orMatch[2],
      type: 'alternative',
      fullText: repsString,
      isComplex: true,
    };
  }

  // Progression format: "21-15-9"
  const progressionMatch = repsString.match(/^\d+(-\d+)+$/);
  if (progressionMatch) {
    return {
      primary: repsString,
      type: 'progression',
      fullText: repsString,
      isComplex: false,
    };
  }

  // Range format: "10-15"
  const rangeMatch = repsString.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch && rangeMatch[1] !== rangeMatch[2]) {
    return {
      primary: `${rangeMatch[1]}-${rangeMatch[2]}`,
      type: 'range',
      fullText: repsString,
      isComplex: false,
    };
  }

  // Standard format
  return {
    primary: repsString,
    type: 'standard',
    fullText: repsString,
    isComplex: false,
  };
}

/**
 * Get dynamic font size based on text length
 */
export function getDynamicFontSize(text: string, baseSize: number = 3): string {
  const length = text.length;

  if (length <= 3) return `${baseSize}rem`; // "15", "100"
  if (length <= 5) return `${baseSize * 0.85}rem`; // "21-15"
  if (length <= 8) return `${baseSize * 0.7}rem`; // "21-15-9"
  if (length <= 12) return `${baseSize * 0.55}rem`; // "AMRAP 10min"

  return `${baseSize * 0.45}rem`; // Very long text
}

/**
 * Get truncated text with ellipsis
 */
export function truncateReps(text: string, maxLength: number = 12): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 1)}…`;
}

/**
 * Format rep display for mobile
 */
export function formatForMobile(parsed: ParsedRep): { main: string; sub?: string } {
  if (!parsed.isComplex) {
    return { main: parsed.primary };
  }

  // For alternatives, show primary prominently
  if (parsed.type === 'alternative' && parsed.secondary) {
    return {
      main: parsed.primary,
      sub: `or ${parsed.secondary}`,
    };
  }

  return { main: parsed.primary, sub: parsed.secondary };
}

/**
 * Get color scheme for rep type
 */
export function getRepTypeColor(type: ParsedRep['type']): string {
  switch (type) {
    case 'amrap':
      return '#10B981'; // Green
    case 'emom':
      return '#3B82F6'; // Blue
    case 'progression':
      return '#F59E0B'; // Amber
    case 'alternative':
      return '#8B5CF6'; // Purple
    case 'range':
      return '#EC4899'; // Pink
    default:
      return '#FFFFFF'; // White
  }
}

/**
 * Get badge label for rep type
 */
export function getRepTypeBadge(type: ParsedRep['type']): string | null {
  switch (type) {
    case 'amrap':
      return 'AMRAP';
    case 'emom':
      return 'EMOM';
    case 'progression':
      return 'Progression';
    case 'alternative':
      return 'Alt';
    case 'range':
      return 'Range';
    default:
      return null;
  }
}

/**
 * Color Schemes for Functional Training Components
 * Hierarchical color system for improved visual distinction
 */

export const WOD_FORMAT_COLORS = {
  amrap: {
    primary: '#10B981',
    secondary: '#059669',
    light: '#34D399',
    accent: '#6EE7B7',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
  },
  forTime: {
    primary: '#F59E0B',
    secondary: '#D97706',
    light: '#FBBF24',
    accent: '#FCD34D',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
  },
  emom: {
    primary: '#3B82F6',
    secondary: '#2563EB',
    light: '#60A5FA',
    accent: '#93C5FD',
    gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
  },
  tabata: {
    primary: '#EF4444',
    secondary: '#DC2626',
    light: '#F87171',
    accent: '#FCA5A5',
    gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
  },
  chipper: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    light: '#A78BFA',
    accent: '#C4B5FD',
    gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  },
  ladder: {
    primary: '#EC4899',
    secondary: '#DB2777',
    light: '#F472B6',
    accent: '#F9A8D4',
    gradient: 'linear-gradient(135deg, #EC4899, #DB2777)',
  },
} as const;

export const EXERCISE_TYPE_COLORS = {
  strength: {
    primary: '#EF4444',
    icon: '#DC2626',
    background: 'rgba(239, 68, 68, 0.12)',
  },
  cardio: {
    primary: '#10B981',
    icon: '#059669',
    background: 'rgba(16, 185, 129, 0.12)',
  },
  gymnastic: {
    primary: '#3B82F6',
    icon: '#2563EB',
    background: 'rgba(59, 130, 246, 0.12)',
  },
  mixed: {
    primary: '#8B5CF6',
    icon: '#7C3AED',
    background: 'rgba(139, 92, 246, 0.12)',
  },
} as const;

export const INTENSITY_COLORS = {
  low: {
    primary: '#10B981',
    label: 'Faible',
    emoji: '😌',
  },
  medium: {
    primary: '#F59E0B',
    label: 'Modérée',
    emoji: '😤',
  },
  high: {
    primary: '#EF4444',
    label: 'Élevée',
    emoji: '🔥',
  },
} as const;

export const STATUS_COLORS = {
  active: '#10B981',
  rest: '#3B82F6',
  completed: '#8B5CF6',
  pending: '#6B7280',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export function getWodFormatColor(format: string): typeof WOD_FORMAT_COLORS.amrap {
  const normalizedFormat = format.toLowerCase() as keyof typeof WOD_FORMAT_COLORS;
  return WOD_FORMAT_COLORS[normalizedFormat] || WOD_FORMAT_COLORS.forTime;
}

export function getExerciseTypeColor(exerciseName: string): typeof EXERCISE_TYPE_COLORS.strength {
  const name = exerciseName.toLowerCase();

  // Strength patterns
  if (name.includes('squat') || name.includes('deadlift') || name.includes('press') ||
      name.includes('clean') || name.includes('snatch') || name.includes('jerk')) {
    return EXERCISE_TYPE_COLORS.strength;
  }

  // Cardio patterns
  if (name.includes('run') || name.includes('row') || name.includes('bike') ||
      name.includes('ski') || name.includes('jump rope') || name.includes('burpee')) {
    return EXERCISE_TYPE_COLORS.cardio;
  }

  // Gymnastic patterns
  if (name.includes('pull-up') || name.includes('dip') || name.includes('muscle-up') ||
      name.includes('handstand') || name.includes('toes-to-bar') || name.includes('ring')) {
    return EXERCISE_TYPE_COLORS.gymnastic;
  }

  return EXERCISE_TYPE_COLORS.mixed;
}

export function getIntensityColor(intensity: number): typeof INTENSITY_COLORS.low {
  if (intensity <= 6) return INTENSITY_COLORS.low;
  if (intensity <= 8) return INTENSITY_COLORS.medium;
  return INTENSITY_COLORS.high;
}

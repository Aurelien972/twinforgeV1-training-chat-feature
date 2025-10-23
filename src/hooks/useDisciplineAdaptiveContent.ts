/**
 * useDisciplineAdaptiveContent Hook
 * Fournit des contenus adaptés selon la discipline active de l'utilisateur
 */

import { useMemo } from 'react';
import type { TodayTrainingContext } from '../system/services/trainingTodayDynamicService';

export interface DisciplineConfig {
  id: string;
  label: string;
  color: string;
  icon: string;
  coachType: string;

  // Métriques pertinentes
  primaryMetrics: {
    key: string;
    label: string;
    unit: string;
    icon: string;
  }[];

  // Messages motivationnels
  motivationalPhrases: string[];

  // Termes spécifiques
  terminology: {
    session: string;
    intensity: string;
    progress: string;
  };
}

const DISCIPLINE_CONFIGS: Record<string, DisciplineConfig> = {
  // Force & Powerbuilding
  strength: {
    id: 'strength',
    label: 'Musculation',
    color: '#3B82F6',
    icon: 'Dumbbell',
    coachType: 'force',
    primaryMetrics: [
      { key: 'volume', label: 'Volume', unit: 'kg', icon: 'TrendingUp' },
      { key: 'rpe', label: 'RPE Moyen', unit: '/10', icon: 'Activity' },
      { key: 'exercises', label: 'Exercices', unit: '', icon: 'List' },
    ],
    motivationalPhrases: [
      'Prêt à soulever lourd aujourd\'hui?',
      'Chaque rep compte vers tes objectifs',
      'La force se construit une séance à la fois',
      'Aujourd\'hui, on progresse',
    ],
    terminology: {
      session: 'séance',
      intensity: 'charge',
      progress: 'progression',
    },
  },

  powerlifting: {
    id: 'powerlifting',
    label: 'Powerlifting',
    color: '#3B82F6',
    icon: 'Zap',
    coachType: 'force',
    primaryMetrics: [
      { key: '1rm', label: '1RM Estimé', unit: 'kg', icon: 'TrendingUp' },
      { key: 'intensity', label: 'Intensité', unit: '%', icon: 'Zap' },
      { key: 'lift_type', label: 'Type de Lift', unit: '', icon: 'Target' },
    ],
    motivationalPhrases: [
      'Prêt pour un nouveau PR?',
      'Force maximale aujourd\'hui',
      'Chaque lift compte',
      'Vers tes records personnels',
    ],
    terminology: {
      session: 'session',
      intensity: 'intensité',
      progress: 'PRs',
    },
  },

  // Endurance
  running: {
    id: 'running',
    label: 'Course à pied',
    color: '#22C55E',
    icon: 'Footprints',
    coachType: 'endurance',
    primaryMetrics: [
      { key: 'distance', label: 'Distance', unit: 'km', icon: 'Route' },
      { key: 'pace', label: 'Allure', unit: 'min/km', icon: 'Timer' },
      { key: 'hr_zones', label: 'Zones HR', unit: '', icon: 'Heart' },
    ],
    motivationalPhrases: [
      'Prêt à faire des kilomètres?',
      'Chaque foulée te rapproche de tes objectifs',
      'La route t\'attend',
      'Un pas à la fois',
    ],
    terminology: {
      session: 'sortie',
      intensity: 'allure',
      progress: 'vitesse',
    },
  },

  cycling: {
    id: 'cycling',
    label: 'Cyclisme',
    color: '#22C55E',
    icon: 'Bike',
    coachType: 'endurance',
    primaryMetrics: [
      { key: 'distance', label: 'Distance', unit: 'km', icon: 'Route' },
      { key: 'power', label: 'Puissance', unit: 'W', icon: 'Zap' },
      { key: 'cadence', label: 'Cadence', unit: 'rpm', icon: 'Activity' },
    ],
    motivationalPhrases: [
      'En selle pour une belle sortie?',
      'Les watts t\'appellent',
      'Chaque tour de pédale compte',
      'La route est à toi',
    ],
    terminology: {
      session: 'sortie',
      intensity: 'puissance',
      progress: 'FTP',
    },
  },

  // Functional
  crossfit: {
    id: 'crossfit',
    label: 'CrossFit',
    color: '#DC2626',
    icon: 'Flame',
    coachType: 'functional',
    primaryMetrics: [
      { key: 'rounds', label: 'Rounds', unit: '', icon: 'RotateCw' },
      { key: 'time', label: 'Temps', unit: 'min', icon: 'Clock' },
      { key: 'reps', label: 'Reps Total', unit: '', icon: 'Hash' },
    ],
    motivationalPhrases: [
      'WOD du jour?',
      'Prêt à te donner à fond?',
      'Functional fitness time',
      'Chaque round compte',
    ],
    terminology: {
      session: 'WOD',
      intensity: 'rounds',
      progress: 'performance',
    },
  },

  hiit: {
    id: 'hiit',
    label: 'HIIT',
    color: '#DC2626',
    icon: 'Zap',
    coachType: 'functional',
    primaryMetrics: [
      { key: 'intervals', label: 'Intervals', unit: '', icon: 'Activity' },
      { key: 'work_rest', label: 'Work:Rest', unit: '', icon: 'Timer' },
      { key: 'hr_peak', label: 'HR Peak', unit: 'bpm', icon: 'Heart' },
    ],
    motivationalPhrases: [
      'Intervals haute intensité?',
      'Prêt à transpirer?',
      'Maximum effort, maximum résultats',
      'On donne tout',
    ],
    terminology: {
      session: 'session',
      intensity: 'intensité',
      progress: 'capacity',
    },
  },

  // Calisthenics
  calisthenics: {
    id: 'calisthenics',
    label: 'Calisthenics',
    color: '#06B6D4',
    icon: 'User',
    coachType: 'calisthenics',
    primaryMetrics: [
      { key: 'skills', label: 'Skills', unit: '', icon: 'Star' },
      { key: 'volume', label: 'Volume', unit: 'reps', icon: 'Hash' },
      { key: 'holds', label: 'Holds', unit: 's', icon: 'Timer' },
    ],
    motivationalPhrases: [
      'Prêt pour les skills?',
      'Ton corps est ton équipement',
      'Maîtrise de soi',
      'Skills et force',
    ],
    terminology: {
      session: 'session',
      intensity: 'difficulty',
      progress: 'skills',
    },
  },

  // Competitions
  hyrox: {
    id: 'hyrox',
    label: 'HYROX',
    color: '#F59E0B',
    icon: 'Award',
    coachType: 'competitions',
    primaryMetrics: [
      { key: 'stations', label: 'Stations', unit: '/8', icon: 'MapPin' },
      { key: 'time', label: 'Temps Total', unit: 'min', icon: 'Clock' },
      { key: 'transitions', label: 'Transitions', unit: 's', icon: 'ArrowRight' },
    ],
    motivationalPhrases: [
      'Prêt pour les 8 stations?',
      'Course + workout stations',
      'HYROX mode activé',
      'Run. Workout. Repeat.',
    ],
    terminology: {
      session: 'session',
      intensity: 'pace',
      progress: 'time',
    },
  },
};

// Fallback par défaut
const DEFAULT_CONFIG: DisciplineConfig = DISCIPLINE_CONFIGS.strength;

export function useDisciplineAdaptiveContent(context: TodayTrainingContext | null | undefined) {
  const config = useMemo(() => {
    if (!context?.activeDiscipline) {
      return DEFAULT_CONFIG;
    }

    return DISCIPLINE_CONFIGS[context.activeDiscipline] || DEFAULT_CONFIG;
  }, [context?.activeDiscipline]);

  const getMotivationalMessage = useMemo(() => {
    const phrases = config.motivationalPhrases;
    const randomIndex = Math.floor(Math.random() * phrases.length);
    return phrases[randomIndex];
  }, [config]);

  const getReadinessMessage = useMemo(() => {
    if (!context?.readinessScore) return 'Vérifions ta préparation...';

    const score = context.readinessScore.overall;
    const rec = context.readinessScore.recommendation;

    if (rec === 'rest') {
      return 'Ton corps a besoin de repos';
    } else if (rec === 'light') {
      return 'Session légère recommandée';
    } else if (rec === 'moderate') {
      return 'Prêt pour une session modérée';
    } else {
      return 'Conditions optimales pour performer!';
    }
  }, [context?.readinessScore]);

  return {
    config,
    motivationalMessage: getMotivationalMessage,
    readinessMessage: getReadinessMessage,
  };
}

/**
 * Get discipline config by ID
 */
export function getDisciplineConfig(disciplineId: string): DisciplineConfig {
  return DISCIPLINE_CONFIGS[disciplineId] || DEFAULT_CONFIG;
}

/**
 * Export the configs for external use
 */
export { DISCIPLINE_CONFIGS };

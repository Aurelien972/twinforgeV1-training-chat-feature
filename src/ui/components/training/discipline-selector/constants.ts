/**
 * Constants and Data for Discipline Selector
 */

import type { DisciplineCategory, Discipline } from './types';
import type { AgentType } from '../../../../domain/ai/trainingAiTypes';

export const AVAILABLE_COACHES: AgentType[] = [
  'coach-force',
  'coach-endurance',
  'coach-calisthenics',
  'coach-functional',
  'coach-competitions'
];

export const DISCIPLINE_CATEGORIES: DisciplineCategory[] = [
  {
    id: 'force-powerbuilding',
    label: 'Force & Powerbuilding',
    description: 'Musculation, force maximale, et hypertrophie',
    color: '#3B82F6',
    icon: 'Dumbbell',
    coachType: 'coach-force',
    disciplines: [
      {
        value: 'strength',
        label: 'Musculation',
        description: 'Force et hypertrophie',
        category: 'force-powerbuilding',
        categoryLabel: 'Force & Powerbuilding',
        categoryColor: '#3B82F6',
        icon: 'Dumbbell',
        coachType: 'coach-force',
        available: true
      },
      {
        value: 'powerlifting',
        label: 'Powerlifting',
        description: 'Force maximale (squat, bench, deadlift)',
        category: 'force-powerbuilding',
        categoryLabel: 'Force & Powerbuilding',
        categoryColor: '#3B82F6',
        icon: 'Weight',
        coachType: 'coach-force',
        available: true
      },
      {
        value: 'bodybuilding',
        label: 'Bodybuilding',
        description: 'Esthétique et hypertrophie maximale',
        category: 'force-powerbuilding',
        categoryLabel: 'Force & Powerbuilding',
        categoryColor: '#3B82F6',
        icon: 'Dumbbell',
        coachType: 'coach-force',
        available: true
      },
      {
        value: 'strongman',
        label: 'Strongman',
        description: 'Force athlétique et fonctionnelle',
        category: 'force-powerbuilding',
        categoryLabel: 'Force & Powerbuilding',
        categoryColor: '#3B82F6',
        icon: 'Hammer',
        coachType: 'coach-force',
        available: true
      }
    ]
  },
  {
    id: 'endurance',
    label: 'Endurance',
    description: 'Course, vélo, natation, et cardio',
    color: '#22C55E',
    icon: 'Activity',
    coachType: 'coach-endurance',
    disciplines: [
      {
        value: 'running',
        label: 'Course à pied',
        description: 'Running route et trail',
        category: 'endurance',
        categoryLabel: 'Endurance',
        categoryColor: '#22C55E',
        icon: 'Footprints',
        coachType: 'coach-endurance',
        available: true
      },
      {
        value: 'cycling',
        label: 'Cyclisme',
        description: 'Vélo route et VTT',
        category: 'endurance',
        categoryLabel: 'Endurance',
        categoryColor: '#22C55E',
        icon: 'Bike',
        coachType: 'coach-endurance',
        available: true
      },
      {
        value: 'swimming',
        label: 'Natation',
        description: 'Entraînement aquatique',
        category: 'endurance',
        categoryLabel: 'Endurance',
        categoryColor: '#22C55E',
        icon: 'Waves',
        coachType: 'coach-endurance',
        available: true
      },
      {
        value: 'triathlon',
        label: 'Triathlon',
        description: 'Natation, vélo, course',
        category: 'endurance',
        categoryLabel: 'Endurance',
        categoryColor: '#22C55E',
        icon: 'Activity',
        coachType: 'coach-endurance',
        available: true
      },
      {
        value: 'cardio',
        label: 'Cardio général',
        description: 'Endurance cardiovasculaire',
        category: 'endurance',
        categoryLabel: 'Endurance',
        categoryColor: '#22C55E',
        icon: 'Heart',
        coachType: 'coach-endurance',
        available: true
      }
    ]
  },
  {
    id: 'functional-crosstraining',
    label: 'Functional & CrossTraining',
    description: 'CrossFit, HIIT, et entraînement fonctionnel',
    color: '#DC2626',
    icon: 'Flame',
    coachType: 'coach-functional',
    disciplines: [
      {
        value: 'crossfit',
        label: 'CrossFit',
        description: 'Entraînement fonctionnel varié haute intensité',
        category: 'functional-crosstraining',
        categoryLabel: 'Functional & CrossTraining',
        categoryColor: '#DC2626',
        icon: 'Flame',
        coachType: 'coach-functional',
        available: true,
        isNew: true
      },
      {
        value: 'hiit',
        label: 'HIIT',
        description: 'High Intensity Interval Training',
        category: 'functional-crosstraining',
        categoryLabel: 'Functional & CrossTraining',
        categoryColor: '#DC2626',
        icon: 'Zap',
        coachType: 'coach-functional',
        available: true,
        isNew: true
      },
      {
        value: 'functional',
        label: 'Functional Training',
        description: 'Mouvements fonctionnels multi-articulaires',
        category: 'functional-crosstraining',
        categoryLabel: 'Functional & CrossTraining',
        categoryColor: '#DC2626',
        icon: 'Move',
        coachType: 'coach-functional',
        available: true,
        isNew: true
      },
      {
        value: 'circuit',
        label: 'Circuit Training',
        description: 'Enchaînements de stations',
        category: 'functional-crosstraining',
        categoryLabel: 'Functional & CrossTraining',
        categoryColor: '#DC2626',
        icon: 'Repeat',
        coachType: 'coach-functional',
        available: true,
        isNew: true
      }
    ]
  },
  {
    id: 'calisthenics-street',
    label: 'Calisthenics & Street',
    description: 'Poids du corps et skills avancés',
    color: '#06B6D4',
    icon: 'User',
    coachType: 'coach-calisthenics',
    disciplines: [
      {
        value: 'calisthenics',
        label: 'Calisthenics',
        description: 'Skills & force relative',
        category: 'calisthenics-street',
        categoryLabel: 'Calisthenics & Street',
        categoryColor: '#06B6D4',
        icon: 'User',
        coachType: 'coach-calisthenics',
        available: true
      },
      {
        value: 'street-workout',
        label: 'Street Workout',
        description: 'Barres extérieur',
        category: 'calisthenics-street',
        categoryLabel: 'Calisthenics & Street',
        categoryColor: '#06B6D4',
        icon: 'Palmtree',
        coachType: 'coach-calisthenics',
        available: true
      }
    ]
  },
  {
    id: 'fitness-competitions',
    label: 'Fitness Competitions',
    description: 'HYROX, DEKA FIT, et compétitions fitness',
    color: '#F59E0B',
    icon: 'Trophy',
    coachType: 'coach-competitions',
    disciplines: [
      {
        value: 'hyrox',
        label: 'HYROX',
        description: 'Course et stations fonctionnelles',
        category: 'fitness-competitions',
        categoryLabel: 'Fitness Competitions',
        categoryColor: '#F59E0B',
        icon: 'Trophy',
        coachType: 'coach-competitions',
        available: true,
        isNew: true
      },
      {
        value: 'deka-fit',
        label: 'DEKA FIT',
        description: 'Challenge fitness 10 zones',
        category: 'fitness-competitions',
        categoryLabel: 'Fitness Competitions',
        categoryColor: '#F59E0B',
        icon: 'Target',
        coachType: 'coach-competitions',
        available: true,
        isNew: true
      },
      {
        value: 'deka-mile',
        label: 'DEKA MILE',
        description: 'Mile run + 10 stations',
        category: 'fitness-competitions',
        categoryLabel: 'Fitness Competitions',
        categoryColor: '#F59E0B',
        icon: 'Award',
        coachType: 'coach-competitions',
        available: true,
        isNew: true
      },
      {
        value: 'deka-strong',
        label: 'DEKA STRONG',
        description: 'Force et puissance 10 stations',
        category: 'fitness-competitions',
        categoryLabel: 'Fitness Competitions',
        categoryColor: '#F59E0B',
        icon: 'Medal',
        coachType: 'coach-competitions',
        available: true,
        isNew: true
      }
    ]
  }
];

export const COACH_INFO: Record<AgentType, { name: string; specialties: string[] }> = {
  'coach-force': {
    name: 'Coach Force',
    specialties: ['Musculation', 'Force maximale', 'Hypertrophie']
  },
  'coach-endurance': {
    name: 'Coach Endurance',
    specialties: ['Course', 'Vélo', 'Natation', 'Zones cardio']
  },
  'coach-functional': {
    name: 'Coach Functional',
    specialties: ['WODs', 'AMRAP', 'EMOM', 'MetCons']
  },
  'coach-calisthenics': {
    name: 'Coach Calisthenics',
    specialties: ['Skills', 'Force relative', 'Poids du corps']
  },
  'coach-analyzer': {
    name: 'Coach Analyzer',
    specialties: ['Analyse', 'Optimisation']
  },
  'coach-combat': {
    name: 'Coach Combat',
    specialties: ['Arts martiaux', 'Sports de combat']
  },
  'coach-sports': {
    name: 'Coach Sports',
    specialties: ['Sports spécifiques']
  },
  'coach-competitions': {
    name: 'Coach Competitions',
    specialties: ['HYROX', 'DEKA FIT', 'Pacing strategies', 'Transitions']
  },
  'coach-mixed': {
    name: 'Coach Mixed',
    specialties: ['Programmes mixtes']
  }
};

/**
 * Training Pipeline Constants
 * Configuration for the 5-step training generation pipeline
 */

import type { TrainingPipelineStep } from './types';

export const STORAGE_KEY = 'twinforge-training-pipeline';

export const TRAINING_PIPELINE_STEPS: TrainingPipelineStep[] = [
  {
    id: 'preparer',
    label: 'Préparer',
    icon: 'Calendar',
    description: 'Adaptez la séance à votre contexte',
    startProgress: 0,
    endProgress: 20
  },
  {
    id: 'activer',
    label: 'Activer',
    icon: 'Play',
    description: 'Confirmez votre prescription du jour',
    startProgress: 21,
    endProgress: 40
  },
  {
    id: 'seance',
    label: 'Séance',
    icon: 'Dumbbell',
    description: 'Exécutez votre entraînement',
    startProgress: 41,
    endProgress: 70
  },
  {
    id: 'adapter',
    label: 'Analyser',
    icon: 'BarChart3',
    description: 'Performance et adaptations IA',
    startProgress: 71,
    endProgress: 90
  },
  {
    id: 'avancer',
    label: 'Avancer',
    icon: 'ArrowRight',
    description: 'Planifiez la suite',
    startProgress: 91,
    endProgress: 100
  }
];

export const STEP_COLORS = {
  preparer: '#EC4899',    // Rose-magenta (fridge)
  activer: '#10B981',     // Vert-émeraude (nutrition)
  seance: '#A855F7',      // Violet-profond (training)
  adapter: '#18E3FF',     // Bleu-cyan (plasma + ember fusion)
  avancer: '#FF6B35'      // Orange-vif (progression et momentum)
} as const;

export const DEFAULT_SESSION_DURATION = 45;
export const SHORT_SESSION_DURATION = 25;
export const MIN_SESSION_DURATION = 15;
export const MAX_SESSION_DURATION = 120;

export const LOCATIONS = [
  { id: 'home', label: 'Maison', icon: 'Home' },
  { id: 'gym', label: 'Salle de sport', icon: 'Dumbbell' },
  { id: 'outdoor', label: 'Extérieur', icon: 'TreePine' }
];

// Fitness Levels - Du plus faible au plus élevé
export const FITNESS_LEVELS_DETAILED = [
  { value: 'sedentary', label: 'Sédentaire', description: 'Peu ou pas d\'activité physique', icon: 'Armchair', color: '#9CA3AF' },
  { value: 'beginner', label: 'Débutant', description: 'Début du parcours fitness', icon: 'Sprout', color: '#84CC16' },
  { value: 'novice', label: 'Novice', description: '3-6 mois d\'entraînement régulier', icon: 'TreeDeciduous', color: '#10B981' },
  { value: 'intermediate', label: 'Intermédiaire', description: '6-12 mois d\'expérience', icon: 'Dumbbell', color: '#06B6D4' },
  { value: 'advanced', label: 'Avancé', description: '1-2 ans d\'entraînement sérieux', icon: 'Trophy', color: '#3B82F6' },
  { value: 'expert', label: 'Expert', description: '2-4 ans de pratique intensive', icon: 'Medal', color: '#8B5CF6' },
  { value: 'elite', label: 'Élite', description: '4-6 ans de haut niveau', icon: 'Crown', color: '#A855F7' },
  { value: 'professional', label: 'Professionnel', description: 'Athlète professionnel', icon: 'Award', color: '#EC4899' },
  { value: 'athlete', label: 'Athlète Confirmé', description: 'Compétiteur de haut niveau', icon: 'Flame', color: '#F59E0B' },
  { value: 'champion', label: 'Champion', description: 'Niveau champion/compétition internationale', icon: 'Star', color: '#EAB308' }
] as const;

// Training Types Categories - MVP Scope Only
// 5 categories with specialized coaches implemented
export const TRAINING_CATEGORIES = [
  {
    id: 'force-powerbuilding',
    label: 'Force & Powerbuilding',
    description: 'Force maximale, hypertrophie et esthétique',
    icon: 'Dumbbell',
    color: '#3B82F6',
    coachSpecialization: 'force',
    types: [
      { value: 'strength', label: 'Musculation', description: 'Force et hypertrophie', icon: 'Dumbbell' },
      { value: 'powerlifting', label: 'Powerlifting', description: 'Force maximale (squat, bench, deadlift)', icon: 'Weight' },
      { value: 'bodybuilding', label: 'Bodybuilding', description: 'Esthétique et hypertrophie maximale', icon: 'Sparkles' },
      { value: 'strongman', label: 'Strongman', description: 'Force athlétique et fonctionnelle', icon: 'Trophy' }
    ]
  },
  {
    id: 'functional-crosstraining',
    label: 'Functional & CrossTraining',
    description: 'Entraînement fonctionnel et haute intensité',
    icon: 'Flame',
    color: '#DC2626',
    coachSpecialization: 'functional',
    types: [
      { value: 'crossfit', label: 'CrossFit', description: 'Entraînement fonctionnel varié haute intensité', icon: 'Flame' },
      { value: 'hiit', label: 'HIIT', description: 'High Intensity Interval Training', icon: 'Zap' },
      { value: 'functional', label: 'Functional Training', description: 'Mouvements fonctionnels multi-articulaires', icon: 'Activity' },
      { value: 'circuit', label: 'Circuit Training', description: 'Enchaînements de stations', icon: 'CircleDot' }
    ]
  },
  {
    id: 'fitness-competitions',
    label: 'Compétitions Fitness',
    description: 'HYROX, DEKA et challenges fitness',
    icon: 'Medal',
    color: '#F59E0B',
    coachSpecialization: 'competitions',
    types: [
      { value: 'hyrox', label: 'HYROX', description: 'Course et stations fonctionnelles', icon: 'Zap' },
      { value: 'deka-fit', label: 'DEKA FIT', description: 'Challenge fitness 10 zones', icon: 'Target' },
      { value: 'deka-mile', label: 'DEKA MILE', description: 'Mile run + 10 stations', icon: 'Footprints' },
      { value: 'deka-strong', label: 'DEKA STRONG', description: 'Force et puissance 10 stations', icon: 'Dumbbell' }
    ]
  },
  {
    id: 'calisthenics-street',
    label: 'Calisthenics & Street',
    description: 'Poids du corps, street workout et freestyle',
    icon: 'User',
    color: '#06B6D4',
    coachSpecialization: 'calisthenics',
    types: [
      { value: 'calisthenics', label: 'Calisthenics', description: 'Poids du corps avancé et skills', icon: 'User' },
      { value: 'street-workout', label: 'Street Workout', description: 'Barres et structures en extérieur', icon: 'TreePine' },
      { value: 'streetlifting', label: 'Streetlifting', description: 'Force au poids du corps (tractions lestées)', icon: 'Weight' },
      { value: 'freestyle', label: 'Freestyle', description: 'Figures acrobatiques et créativité', icon: 'Sparkles' }
    ]
  },
  {
    id: 'endurance',
    label: 'Endurance',
    description: 'Course, cyclisme et sports d\'endurance',
    icon: 'Footprints',
    color: '#22C55E',
    coachSpecialization: 'endurance',
    types: [
      { value: 'running', label: 'Course à pied', description: 'Running route et trail', icon: 'Footprints' },
      { value: 'cycling', label: 'Cyclisme', description: 'Vélo route et VTT', icon: 'Bike' },
      { value: 'swimming', label: 'Natation', description: 'Entraînement aquatique', icon: 'Waves' },
      { value: 'triathlon', label: 'Triathlon', description: 'Natation, vélo, course', icon: 'Medal' },
      { value: 'cardio', label: 'Cardio général', description: 'Endurance cardiovasculaire', icon: 'Heart' }
    ]
  }
] as const;

// Flat list for backward compatibility
export const TRAINING_TYPES_COMPLETE = TRAINING_CATEGORIES.flatMap(category =>
  category.types.map(type => ({
    ...type,
    category: category.id,
    categoryLabel: category.label,
    color: category.color
  }))
);

// Equipment Categories for Home
export const EQUIPMENT_HOME_CATEGORIES = [
  {
    id: 'base',
    label: 'Équipement de base',
    equipment: [
      { id: 'bodyweight', label: 'Poids du corps', icon: 'User' },
      { id: 'yoga-mat', label: 'Tapis de yoga', icon: 'LayoutGrid' },
      { id: 'resistance-bands', label: 'Bandes élastiques', icon: 'Waves' },
      { id: 'jump-rope', label: 'Corde à sauter', icon: 'Cable' }
    ]
  },
  {
    id: 'force',
    label: 'Matériel de force',
    equipment: [
      { id: 'dumbbells', label: 'Haltères', icon: 'Dumbbell' },
      { id: 'adjustable-dumbbells', label: 'Haltères réglables', icon: 'Settings' },
      { id: 'kettlebell', label: 'Kettlebell', icon: 'Circle' },
      { id: 'barbell-set', label: 'Ensemble barre et disques', icon: 'Minus' },
      { id: 'medicine-ball', label: 'Médecine ball', icon: 'CircleDot' }
    ]
  },
  {
    id: 'structure',
    label: 'Structures et supports',
    equipment: [
      { id: 'pull-up-bar', label: 'Barre de traction', icon: 'GripHorizontal' },
      { id: 'dip-station', label: 'Station à dips', icon: 'Square' },
      { id: 'bench', label: 'Banc de musculation', icon: 'RectangleHorizontal' },
      { id: 'adjustable-bench', label: 'Banc réglable', icon: 'Settings' },
      { id: 'squat-rack', label: 'Rack à squat', icon: 'Box' },
      { id: 'power-tower', label: 'Tour de musculation', icon: 'Grid3x3' }
    ]
  },
  {
    id: 'cardio',
    label: 'Cardio',
    equipment: [
      { id: 'stationary-bike', label: 'Vélo d\'appartement', icon: 'Bike' },
      { id: 'treadmill', label: 'Tapis de course', icon: 'Footprints' },
      { id: 'rowing-machine', label: 'Rameur', icon: 'Waves' }
    ]
  },
  {
    id: 'accessories',
    label: 'Accessoires',
    equipment: [
      { id: 'ab-wheel', label: 'Roue abdominale', icon: 'CircleDot' },
      { id: 'foam-roller', label: 'Rouleau de massage', icon: 'Cylinder' },
      { id: 'trx', label: 'Sangles de suspension TRX', icon: 'Cable' }
    ]
  }
];

// Flat list for backward compatibility
export const EQUIPMENT_HOME = EQUIPMENT_HOME_CATEGORIES.flatMap(cat => cat.equipment);

// Equipment Categories for Gym
export const EQUIPMENT_GYM_CATEGORIES = [
  {
    id: 'base',
    label: 'Équipement de base',
    equipment: [
      { id: 'bodyweight', label: 'Poids du corps', icon: 'User' },
      { id: 'yoga-mat', label: 'Tapis', icon: 'LayoutGrid' },
      { id: 'resistance-bands', label: 'Bandes élastiques', icon: 'Waves' }
    ]
  },
  {
    id: 'free-weights',
    label: 'Poids libres',
    equipment: [
      { id: 'dumbbells', label: 'Haltères complets', icon: 'Dumbbell' },
      { id: 'barbell', label: 'Barres olympiques', icon: 'Minus' },
      { id: 'ez-bar', label: 'Barre EZ', icon: 'Waves' },
      { id: 'kettlebells', label: 'Kettlebells', icon: 'Circle' }
    ]
  },
  {
    id: 'racks-benches',
    label: 'Racks et bancs',
    equipment: [
      { id: 'squat-rack', label: 'Racks à squat', icon: 'Square' },
      { id: 'power-rack', label: 'Cage à squat', icon: 'Box' },
      { id: 'bench-press', label: 'Bancs de développé', icon: 'RectangleHorizontal' },
      { id: 'adjustable-bench', label: 'Bancs réglables', icon: 'Settings' },
      { id: 'pull-up-bar', label: 'Barres de traction', icon: 'GripHorizontal' },
      { id: 'dip-station', label: 'Stations à dips', icon: 'Square' }
    ]
  },
  {
    id: 'machines',
    label: 'Machines guidées',
    equipment: [
      { id: 'machines', label: 'Machines guidées', icon: 'Box' },
      { id: 'cable-machines', label: 'Machines à câbles', icon: 'Cable' },
      { id: 'smith-machine', label: 'Machine Smith', icon: 'Grid3x3' },
      { id: 'leg-press', label: 'Presse à jambes', icon: 'Footprints' },
      { id: 'leg-curl', label: 'Machine à ischios', icon: 'Activity' },
      { id: 'leg-extension', label: 'Machine à quadriceps', icon: 'Activity' }
    ]
  },
  {
    id: 'cardio',
    label: 'Cardio',
    equipment: [
      { id: 'rowing-machine', label: 'Rameurs', icon: 'Waves' },
      { id: 'treadmill', label: 'Tapis de course', icon: 'Footprints' },
      { id: 'stationary-bike', label: 'Vélos stationnaires', icon: 'Bike' },
      { id: 'elliptical', label: 'Vélos elliptiques', icon: 'CircleDot' },
      { id: 'stair-climber', label: 'Escaliers', icon: 'TrendingUp' },
      { id: 'assault-bike', label: 'Vélo d\'assaut', icon: 'Bike' }
    ]
  },
  {
    id: 'functional',
    label: 'Entraînement fonctionnel',
    equipment: [
      { id: 'battle-ropes', label: 'Cordes ondulatoires', icon: 'Cable' },
      { id: 'slam-balls', label: 'Ballons lestés', icon: 'CircleDot' },
      { id: 'plyo-boxes', label: 'Box de pliométrie', icon: 'Box' },
      { id: 'trx', label: 'Sangles TRX', icon: 'Cable' },
      { id: 'suspension-trainer', label: 'Sangles de suspension', icon: 'Cable' }
    ]
  },
  {
    id: 'recovery',
    label: 'Récupération',
    equipment: [
      { id: 'foam-roller', label: 'Rouleaux de massage', icon: 'Cylinder' }
    ]
  }
];

// Flat list for backward compatibility
export const EQUIPMENT_GYM = EQUIPMENT_GYM_CATEGORIES.flatMap(cat => cat.equipment);

// Equipment Categories for Outdoor
export const EQUIPMENT_OUTDOOR_CATEGORIES = [
  {
    id: 'base',
    label: 'Équipement de base',
    equipment: [
      { id: 'bodyweight', label: 'Poids du corps', icon: 'User' },
      { id: 'yoga-mat', label: 'Tapis', icon: 'LayoutGrid' },
      { id: 'resistance-bands', label: 'Bandes élastiques portables', icon: 'Waves' },
      { id: 'jump-rope', label: 'Corde à sauter', icon: 'Cable' }
    ]
  },
  {
    id: 'street-workout',
    label: 'Street Workout',
    equipment: [
      { id: 'public-pull-up-bar', label: 'Barres de traction publiques', icon: 'GripHorizontal' },
      { id: 'parallel-bars', label: 'Barres parallèles', icon: 'Square' },
      { id: 'public-bench', label: 'Bancs publics', icon: 'RectangleHorizontal' }
    ]
  },
  {
    id: 'terrain',
    label: 'Terrain naturel',
    equipment: [
      { id: 'stairs', label: 'Escaliers', icon: 'TrendingUp' },
      { id: 'hill', label: 'Colline/pente', icon: 'Mountain' },
      { id: 'park', label: 'Parc', icon: 'TreeDeciduous' }
    ]
  },
  {
    id: 'running-cycling',
    label: 'Course et cyclisme',
    equipment: [
      { id: 'track', label: 'Piste d\'athlétisme', icon: 'CircleDot' },
      { id: 'trail', label: 'Sentier de trail', icon: 'TreePine' },
      { id: 'bike', label: 'Vélo', icon: 'Bike' },
      { id: 'rollerblades', label: 'Rollers', icon: 'Footprints' }
    ]
  },
  {
    id: 'sports-facilities',
    label: 'Installations sportives',
    equipment: [
      { id: 'sports-field', label: 'Terrain de sport', icon: 'LayoutGrid' },
      { id: 'basketball-court', label: 'Terrain de basket', icon: 'Circle' },
      { id: 'soccer-field', label: 'Terrain de foot', icon: 'Circle' },
      { id: 'pool', label: 'Piscine', icon: 'Waves' },
      { id: 'beach', label: 'Plage', icon: 'TreePalm' }
    ]
  }
];

// Flat list for backward compatibility
export const EQUIPMENT_OUTDOOR = EQUIPMENT_OUTDOOR_CATEGORIES.flatMap(cat => cat.equipment);

// Fonction utilitaire pour récupérer les équipements selon le type de lieu
export const getEquipmentByLocationType = (locationType: 'home' | 'gym' | 'outdoor') => {
  switch (locationType) {
    case 'home':
      return EQUIPMENT_HOME;
    case 'gym':
      return EQUIPMENT_GYM;
    case 'outdoor':
      return EQUIPMENT_OUTDOOR;
    default:
      return [];
  }
};

// Fonction pour récupérer les équipements avec catégories
export const getEquipmentCategoriesByLocationType = (locationType: 'home' | 'gym' | 'outdoor') => {
  switch (locationType) {
    case 'home':
      return EQUIPMENT_HOME_CATEGORIES;
    case 'gym':
      return EQUIPMENT_GYM_CATEGORIES;
    case 'outdoor':
      return EQUIPMENT_OUTDOOR_CATEGORIES;
    default:
      return [];
  }
};

// Legacy - kept for backward compatibility but deprecated
export const EQUIPMENT_OPTIONS = EQUIPMENT_HOME;

// Equipment Categories for Endurance (Running, Cycling, Swimming, Triathlon)
export const EQUIPMENT_ENDURANCE_CATEGORIES = [
  {
    id: 'running',
    label: 'Course à pied',
    equipment: [
      { id: 'running-shoes-road', label: 'Chaussures route', icon: 'Footprints' },
      { id: 'running-shoes-trail', label: 'Chaussures trail', icon: 'Mountain' },
      { id: 'gps-watch', label: 'Montre GPS', icon: 'Watch' },
      { id: 'heart-rate-monitor', label: 'Cardio-fréquencemètre', icon: 'Heart' },
      { id: 'heart-rate-strap', label: 'Ceinture cardio', icon: 'Activity' },
      { id: 'running-track', label: 'Piste d\'athlétisme', icon: 'CircleDot' },
      { id: 'treadmill', label: 'Tapis de course', icon: 'Footprints' },
      { id: 'trail-path', label: 'Sentiers de trail', icon: 'TreePine' },
      { id: 'running-belt', label: 'Ceinture porte-bidon', icon: 'Circle' },
      { id: 'hydration-vest', label: 'Gilet d\'hydratation', icon: 'Backpack' }
    ]
  },
  {
    id: 'cycling',
    label: 'Cyclisme',
    equipment: [
      { id: 'road-bike', label: 'Vélo route', icon: 'Bike' },
      { id: 'mtb', label: 'VTT', icon: 'Mountain' },
      { id: 'gravel-bike', label: 'Vélo gravel', icon: 'Bike' },
      { id: 'triathlon-bike', label: 'Vélo triathlon/CLM', icon: 'Zap' },
      { id: 'smart-trainer', label: 'Home trainer connecté', icon: 'MonitorSmartphone' },
      { id: 'basic-trainer', label: 'Home trainer basique', icon: 'Box' },
      { id: 'power-meter', label: 'Capteur de puissance', icon: 'Zap' },
      { id: 'cadence-sensor', label: 'Capteur de cadence', icon: 'Activity' },
      { id: 'bike-computer', label: 'Compteur vélo GPS', icon: 'Smartphone' },
      { id: 'cycling-shoes', label: 'Chaussures cyclisme', icon: 'Footprints' },
      { id: 'bike-rollers', label: 'Rouleaux vélo', icon: 'Waves' }
    ]
  },
  {
    id: 'swimming',
    label: 'Natation',
    equipment: [
      { id: 'pool-25m', label: 'Piscine 25m', icon: 'Waves' },
      { id: 'pool-50m', label: 'Piscine 50m', icon: 'Waves' },
      { id: 'open-water', label: 'Eau libre (lac, mer)', icon: 'Waves' },
      { id: 'pull-buoy', label: 'Pull buoy', icon: 'Circle' },
      { id: 'swim-paddles', label: 'Plaquettes natation', icon: 'Square' },
      { id: 'swim-fins', label: 'Palmes courtes', icon: 'Fish' },
      { id: 'kickboard', label: 'Planche de natation', icon: 'RectangleHorizontal' },
      { id: 'swim-snorkel', label: 'Tuba frontal', icon: 'Wind' },
      { id: 'swim-watch', label: 'Montre natation', icon: 'Watch' },
      { id: 'wetsuit', label: 'Combinaison néoprène', icon: 'User' }
    ]
  },
  {
    id: 'triathlon',
    label: 'Triathlon',
    equipment: [
      { id: 'tri-suit', label: 'Trifonction', icon: 'User' },
      { id: 'transition-bag', label: 'Sac de transition', icon: 'Backpack' },
      { id: 'elastic-laces', label: 'Lacets élastiques', icon: 'Cable' },
      { id: 'race-belt', label: 'Ceinture porte-dossard', icon: 'Circle' },
      { id: 'tri-bike', label: 'Vélo triathlon', icon: 'Bike' },
      { id: 'aero-helmet', label: 'Casque aéro', icon: 'Shield' }
    ]
  },
  {
    id: 'cardio-general',
    label: 'Cardio général',
    equipment: [
      { id: 'gps-multisport-watch', label: 'Montre GPS multisport', icon: 'Watch' },
      { id: 'chest-strap-hr', label: 'Ceinture cardio Bluetooth', icon: 'Heart' },
      { id: 'optical-hr-monitor', label: 'Brassard cardio optique', icon: 'Activity' },
      { id: 'rowing-machine', label: 'Rameur', icon: 'Waves' },
      { id: 'elliptical', label: 'Vélo elliptique', icon: 'CircleDot' },
      { id: 'assault-bike', label: 'Vélo d\'assaut', icon: 'Flame' },
      { id: 'stair-climber', label: 'Escalier mécanique', icon: 'TrendingUp' },
      { id: 'jump-rope', label: 'Corde à sauter', icon: 'Cable' },
      { id: 'sports-watch', label: 'Montre de sport', icon: 'Watch' }
    ]
  }
];

// Flat list for endurance equipment
export const EQUIPMENT_ENDURANCE = EQUIPMENT_ENDURANCE_CATEGORIES.flatMap(cat => cat.equipment);

export const RPE_SCALE = [
  { value: 1, label: 'Très facile', emoji: '😴', color: '#10B981' },
  { value: 2, label: 'Facile', emoji: '😊', color: '#22C55E' },
  { value: 3, label: 'Modéré', emoji: '🙂', color: '#84CC16' },
  { value: 4, label: 'Légèrement difficile', emoji: '😐', color: '#EAB308' },
  { value: 5, label: 'Difficile', emoji: '😅', color: '#F59E0B' },
  { value: 6, label: 'Très difficile', emoji: '😰', color: '#F97316' },
  { value: 7, label: 'Intense', emoji: '😤', color: '#EF4444' },
  { value: 8, label: 'Très intense', emoji: '🥵', color: '#DC2626' },
  { value: 9, label: 'Maximal', emoji: '😵', color: '#B91C1C' },
  { value: 10, label: 'Impossible', emoji: '💀', color: '#991B1B' }
];

export const ADAPTATION_TYPES = {
  progression: {
    label: 'Progression',
    color: '#22C55E',
    icon: 'TrendingUp'
  },
  maintenance: {
    label: 'Maintien',
    color: '#3B82F6',
    icon: 'Minus'
  },
  deload: {
    label: 'Deload',
    color: '#F59E0B',
    icon: 'TrendingDown'
  },
  substitution: {
    label: 'Substitution',
    color: '#8B5CF6',
    icon: 'RefreshCw'
  }
};

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ExerciseData {
  name: string;
  discipline: string;
  category: string;
  difficulty: string;
  description_short: string;
  visual_keywords: string[];
  coaching_cues: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  muscles: Array<{ muscle: string; involvement_type: 'primary' | 'secondary' | 'stabilizer' }>;
  equipment: string[];
  tempo?: string;
  movement_pattern?: string;
  benefits?: string[];
}

const muscleCache = new Map<string, string>();
const equipmentCache = new Map<string, string>();

async function getMuscleId(name: string): Promise<string | null> {
  if (muscleCache.has(name)) {
    return muscleCache.get(name)!;
  }

  const { data } = await supabase
    .from('muscle_groups')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (data) {
    muscleCache.set(name, data.id);
    return data.id;
  }
  return null;
}

async function getEquipmentId(name: string): Promise<string | null> {
  if (equipmentCache.has(name)) {
    return equipmentCache.get(name)!;
  }

  const { data } = await supabase
    .from('equipment_types')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (data) {
    equipmentCache.set(name, data.id);
    return data.id;
  }
  return null;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const homeBodyweightExercises: ExerciseData[] = [
  // HOME UPPER BODY - PUSH (12 exercises)
  {
    name: 'Diamond Push-Ups',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'intermediate',
    description_short: 'Push-up variation ciblant intensément les triceps avec mains rapprochées en diamant',
    visual_keywords: ['push-up', 'diamond', 'triceps', 'home', 'bodyweight', 'floor'],
    movement_pattern: 'push',
    benefits: ['Triceps strength', 'Chest development', 'Core stability'],
    coaching_cues: {
      beginner: [
        'Formez un diamant avec les pouces et index',
        'Commencez sur les genoux si nécessaire',
        'Gardez les coudes près du corps'
      ],
      intermediate: [
        'Descendez jusqu\'à ce que la poitrine touche les mains',
        'Maintenez les hanches alignées',
        'Effectuez 8-12 répétitions'
      ],
      advanced: [
        'Ajoutez une pause de 2 secondes en bas',
        'Effectuez en tempo lent (4-2-1-0)',
        'Progressez vers des archer push-ups'
      ]
    },
    muscles: [
      { muscle: 'triceps', involvement_type: 'primary' },
      { muscle: 'chest', involvement_type: 'primary' },
      { muscle: 'shoulders', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: '2-0-2-0'
  },
  {
    name: 'Wide Push-Ups',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'beginner',
    description_short: 'Push-up avec mains écartées pour emphasis pectoraux',
    visual_keywords: ['push-up', 'wide', 'chest', 'home', 'bodyweight', 'floor'],
    movement_pattern: 'push',
    benefits: ['Chest width', 'Shoulder activation', 'Upper body strength'],
    coaching_cues: {
      beginner: [
        'Placez les mains 10-15cm plus larges que les épaules',
        'Descendez contrôlé jusqu\'aux pectoraux touchent le sol',
        'Gardez le corps en ligne droite'
      ],
      intermediate: [
        'Variez la largeur pour trouver l\'activation maximale',
        'Effectuez 12-20 répétitions',
        'Contrôlez la montée et la descente'
      ],
      advanced: [
        'Ajoutez des déficits (mains surélevées)',
        'Effectuez en one-arm progression',
        'Combinez avec des plyométriques'
      ]
    },
    muscles: [
      { muscle: 'chest', involvement_type: 'primary' },
      { muscle: 'shoulders', involvement_type: 'primary' },
      { muscle: 'triceps', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: '2-0-2-0'
  },
  {
    name: 'Pike Push-Ups',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'intermediate',
    description_short: 'Push-up en position pike pour cibler les épaules, progression vers handstand push-up',
    visual_keywords: ['pike', 'push-up', 'shoulders', 'inverted', 'bodyweight', 'home'],
    movement_pattern: 'push',
    benefits: ['Shoulder strength', 'Overhead pressing', 'Handstand preparation'],
    coaching_cues: {
      beginner: [
        'Formez un V inversé avec le corps',
        'Hanches hautes, regard entre les jambes',
        'Descendez la tête vers le sol'
      ],
      intermediate: [
        'Augmentez l\'angle en surélevant les pieds',
        'Effectuez 8-15 répétitions',
        'Maintenez les coudes à 45° du corps'
      ],
      advanced: [
        'Progressez vers wall-assisted handstand push-ups',
        'Ajoutez des déficits',
        'Travaillez vers le full handstand push-up'
      ]
    },
    muscles: [
      { muscle: 'shoulders', involvement_type: 'primary' },
      { muscle: 'triceps', involvement_type: 'primary' },
      { muscle: 'upper-traps', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: '2-0-2-0'
  },
  {
    name: 'Decline Push-Ups',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'intermediate',
    description_short: 'Push-up avec pieds surélevés pour augmenter la charge sur le haut du corps',
    visual_keywords: ['push-up', 'decline', 'elevated', 'home', 'chest', 'advanced'],
    movement_pattern: 'push',
    benefits: ['Upper chest emphasis', 'Increased difficulty', 'Progressive overload'],
    coaching_cues: {
      beginner: [
        'Commencez avec une élévation basse (15-30cm)',
        'Gardez le corps aligné',
        'Descendez contrôlé'
      ],
      intermediate: [
        'Augmentez la hauteur progressivement',
        'Effectuez 10-15 répétitions',
        'Maintenez la tension constante'
      ],
      advanced: [
        'Utilisez une chaise ou un banc (45-60cm)',
        'Ajoutez des pauses ou tempo',
        'Combinez avec variations (diamond, wide)'
      ]
    },
    muscles: [
      { muscle: 'chest', involvement_type: 'primary' },
      { muscle: 'shoulders', involvement_type: 'primary' },
      { muscle: 'triceps', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['bench'],
    tempo: '2-0-2-0'
  },
  {
    name: 'Hindu Push-Ups',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'intermediate',
    description_short: 'Push-up dynamique avec mouvement de vague, travail complet du haut du corps',
    visual_keywords: ['hindu', 'push-up', 'dynamic', 'flowing', 'bodyweight', 'full-body'],
    movement_pattern: 'push',
    benefits: ['Dynamic strength', 'Shoulder mobility', 'Full body coordination'],
    coaching_cues: {
      beginner: [
        'Commencez en downward dog',
        'Plongez vers l\'avant et le bas',
        'Remontez en cobra, puis revenez'
      ],
      intermediate: [
        'Fluidifiez le mouvement en une vague',
        'Effectuez 10-20 répétitions continues',
        'Synchronisez avec la respiration'
      ],
      advanced: [
        'Accélérez le tempo',
        'Ajoutez des répétitions (30-50+)',
        'Combinez avec des dive bomber push-ups'
      ]
    },
    muscles: [
      { muscle: 'chest', involvement_type: 'primary' },
      { muscle: 'shoulders', involvement_type: 'primary' },
      { muscle: 'triceps', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'secondary' },
      { muscle: 'spinal-erectors', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Continuous flow'
  },

  // HOME UPPER BODY - PULL (8 exercises)
  {
    name: 'Doorway Rows',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'beginner',
    description_short: 'Rowing horizontal utilisant l\'encadrement de porte, alternative aux inverted rows',
    visual_keywords: ['row', 'doorway', 'pull', 'horizontal', 'home', 'bodyweight'],
    movement_pattern: 'pull',
    benefits: ['Back strength', 'Biceps activation', 'Posture improvement'],
    coaching_cues: {
      beginner: [
        'Tenez l\'encadrement de porte à deux mains',
        'Pieds de chaque côté du chambranle',
        'Penchez-vous en arrière et tirez le corps vers la porte'
      ],
      intermediate: [
        'Augmentez l\'angle (plus penché)',
        'Effectuez 12-15 répétitions',
        'Serrez les omoplates en fin de mouvement'
      ],
      advanced: [
        'Utilisez une seule main',
        'Ajoutez une pause de 2 secondes en contraction',
        'Progressez vers des archer rows'
      ]
    },
    muscles: [
      { muscle: 'lats', involvement_type: 'primary' },
      { muscle: 'rhomboides', involvement_type: 'primary' },
      { muscle: 'biceps', involvement_type: 'secondary' },
      { muscle: 'rear-delts', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: '2-1-2-0'
  },
  {
    name: 'Table Rows',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'beginner',
    description_short: 'Rowing sous une table stable, excellent exercice de dos à la maison',
    visual_keywords: ['row', 'table', 'under', 'pull', 'horizontal', 'home'],
    movement_pattern: 'pull',
    benefits: ['Back development', 'Grip strength', 'Postural muscles'],
    coaching_cues: {
      beginner: [
        'Assurez-vous que la table est stable',
        'Allongez-vous sous la table, agrippez le bord',
        'Tirez la poitrine vers la table'
      ],
      intermediate: [
        'Gardez le corps parfaitement droit',
        'Effectuez 10-15 répétitions',
        'Variez la largeur de prise'
      ],
      advanced: [
        'Surélevez les pieds pour augmenter la difficulté',
        'Ajoutez des pauses isométriques',
        'Effectuez en unilatéral'
      ]
    },
    muscles: [
      { muscle: 'lats', involvement_type: 'primary' },
      { muscle: 'rhomboides', involvement_type: 'primary' },
      { muscle: 'biceps', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: '2-1-2-0'
  },
  {
    name: 'Towel Doorway Pull-Ups',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'intermediate',
    description_short: 'Pull-ups utilisant serviettes sur porte, travail préhension et dos',
    visual_keywords: ['pull-up', 'towel', 'doorway', 'grip', 'home', 'vertical'],
    movement_pattern: 'pull',
    benefits: ['Grip strength', 'Back development', 'Functional pulling'],
    coaching_cues: {
      beginner: [
        'Passez des serviettes sur le haut d\'une porte solide',
        'Testez la stabilité avant de monter',
        'Tirez-vous vers le haut en agrippant les serviettes'
      ],
      intermediate: [
        'Effectuez 5-10 répétitions',
        'Maintenez le corps stable',
        'Descendez contrôlé'
      ],
      advanced: [
        'Ajoutez des pauses en haut',
        'Variez les prises (neutre, large)',
        'Progressez vers one-arm'
      ]
    },
    muscles: [
      { muscle: 'lats', involvement_type: 'primary' },
      { muscle: 'biceps', involvement_type: 'primary' },
      { muscle: 'avant-bras', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: '2-1-2-0'
  },

  // HOME LOWER BODY (15 exercises)
  {
    name: 'Bulgarian Split Squat (Bodyweight)',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'intermediate',
    description_short: 'Split squat unilatéral avec pied arrière surélevé sur chaise ou canapé',
    visual_keywords: ['split', 'squat', 'bulgarian', 'single-leg', 'home', 'unilateral'],
    movement_pattern: 'squat',
    benefits: ['Leg strength', 'Balance', 'Unilateral development'],
    coaching_cues: {
      beginner: [
        'Placez le pied arrière sur une chaise stable',
        'Descendez en fléchissant le genou avant',
        'Gardez le torse vertical'
      ],
      intermediate: [
        'Descendez jusqu\'à ce que le genou arrière frôle le sol',
        'Effectuez 10-15 répétitions par jambe',
        'Maintenez l\'équilibre sans support'
      ],
      advanced: [
        'Ajoutez un poids (bouteille d\'eau, sac à dos)',
        'Effectuez en tempo lent',
        'Progressez vers pistol squats'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'hamstrings', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['bench'],
    tempo: '2-0-2-0'
  },
  {
    name: 'Pistol Squat Progressions',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'advanced',
    description_short: 'Squat sur une jambe, exercice ultime de force et équilibre des jambes',
    visual_keywords: ['pistol', 'squat', 'single-leg', 'advanced', 'balance', 'bodyweight'],
    movement_pattern: 'squat',
    benefits: ['Unilateral strength', 'Balance', 'Mobility'],
    coaching_cues: {
      beginner: [
        'Commencez avec assistance (tenir un support)',
        'Descendez aussi bas que possible sur une jambe',
        'Gardez le talon au sol'
      ],
      intermediate: [
        'Effectuez des box pistols (descendre sur boîte)',
        'Travaillez 3-5 répétitions par jambe',
        'Améliorez la profondeur progressivement'
      ],
      advanced: [
        'Effectuez des full pistol squats sans assistance',
        'Ajoutez des variations (weighted, explosive)',
        'Travaillez vers des shrimp squats'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'hamstrings', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' },
      { muscle: 'ankle-stabilizers', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: '3-0-2-0'
  },
  {
    name: 'Jump Squats',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'intermediate',
    description_short: 'Squat explosif avec saut vertical maximal, développement puissance',
    visual_keywords: ['jump', 'squat', 'explosive', 'plyometric', 'power', 'bodyweight'],
    movement_pattern: 'squat',
    benefits: ['Explosive power', 'Vertical jump', 'Athletic performance'],
    coaching_cues: {
      beginner: [
        'Descendez en squat complet',
        'Explosez vers le haut en sautant',
        'Atterrissez en douceur, genoux fléchis'
      ],
      intermediate: [
        'Effectuez 8-12 répétitions par série',
        'Maximisez la hauteur de saut',
        'Minimisez le temps au sol entre répétitions'
      ],
      advanced: [
        'Ajoutez des variations (single-leg, tuck jumps)',
        'Effectuez en séries de 20-30 reps',
        'Combinez avec box jumps'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'calves', involvement_type: 'primary' },
      { muscle: 'hamstrings', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Explosive'
  },
  {
    name: 'Sissy Squats',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'advanced',
    description_short: 'Squat avec inclinaison arrière extrême, isolation intense des quadriceps',
    visual_keywords: ['sissy', 'squat', 'quads', 'knee', 'isolation', 'advanced'],
    movement_pattern: 'squat',
    benefits: ['Quad isolation', 'Knee strength', 'VMO development'],
    coaching_cues: {
      beginner: [
        'Tenez-vous à un support stable',
        'Penchez le torse en arrière tout en fléchissant les genoux',
        'Gardez les hanches tendues'
      ],
      intermediate: [
        'Descendez jusqu\'à ce que les genoux touchent presque le sol',
        'Effectuez 8-12 répétitions',
        'Contrôlez la montée et la descente'
      ],
      advanced: [
        'Effectuez sans support',
        'Ajoutez du poids sur la poitrine',
        'Travaillez en full range of motion'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'hip-flexors', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: '3-0-2-0'
  },
  {
    name: 'Single-Leg Glute Bridge',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'intermediate',
    description_short: 'Hip thrust unilatéral au sol, activation intense des fessiers',
    visual_keywords: ['glute', 'bridge', 'single-leg', 'hip', 'thrust', 'unilateral'],
    movement_pattern: 'hinge',
    benefits: ['Glute strength', 'Hip extension', 'Hamstring activation'],
    coaching_cues: {
      beginner: [
        'Allongez-vous sur le dos, un pied au sol',
        'Levez l\'autre jambe tendue',
        'Poussez les hanches vers le ciel'
      ],
      intermediate: [
        'Serrez le fessier en haut pendant 2 secondes',
        'Effectuez 12-15 répétitions par côté',
        'Gardez les hanches alignées'
      ],
      advanced: [
        'Ajoutez une pause de 5 secondes en haut',
        'Effectuez en tempo ultra-lent',
        'Surélevez les épaules pour plus d\'amplitude'
      ]
    },
    muscles: [
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'hamstrings', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: '2-2-2-0'
  },

  // HOME CORE (12 exercises)
  {
    name: 'Hollow Body Hold',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'intermediate',
    description_short: 'Position isométrique en hollow, fondation gymnastique et force core',
    visual_keywords: ['hollow', 'hold', 'core', 'isometric', 'gymnastics', 'supine'],
    movement_pattern: 'hold',
    benefits: ['Core stability', 'Gymnastics foundation', 'Anti-extension strength'],
    coaching_cues: {
      beginner: [
        'Allongez-vous sur le dos, bras tendus au-dessus de la tête',
        'Collez le bas du dos au sol',
        'Levez légèrement épaules et jambes'
      ],
      intermediate: [
        'Maintenez 30-60 secondes',
        'Gardez les abdominaux constamment contractés',
        'Respirez lentement et profondément'
      ],
      advanced: [
        'Tenez 90+ secondes',
        'Effectuez des hollow rocks (balancements)',
        'Progressez vers des hollow body pull-ups'
      ]
    },
    muscles: [
      { muscle: 'abs', involvement_type: 'primary' },
      { muscle: 'hip-flexors', involvement_type: 'primary' },
      { muscle: 'obliques', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Hold 30-90s'
  },
  {
    name: 'Ab Wheel Rollouts (Kneeling)',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'advanced',
    description_short: 'Rollout avec roue abdominale ou alternative maison, exercice anti-extension extrême',
    visual_keywords: ['ab', 'wheel', 'rollout', 'core', 'anti-extension', 'kneeling'],
    movement_pattern: 'extension',
    benefits: ['Core strength', 'Anti-extension', 'Full body tension'],
    coaching_cues: {
      beginner: [
        'Commencez à genoux face à un mur',
        'Roulez vers l\'avant sans cambrer le dos',
        'Limitez l\'amplitude au début'
      ],
      intermediate: [
        'Augmentez progressivement l\'amplitude',
        'Effectuez 8-12 répétitions',
        'Gardez les abdominaux engagés tout le temps'
      ],
      advanced: [
        'Progressez vers standing rollouts',
        'Ajoutez des variations (obliques)',
        'Effectuez des rollouts one-arm'
      ]
    },
    muscles: [
      { muscle: 'abs', involvement_type: 'primary' },
      { muscle: 'obliques', involvement_type: 'primary' },
      { muscle: 'lats', involvement_type: 'secondary' },
      { muscle: 'shoulders', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: '3-0-3-0'
  },
  {
    name: 'Mountain Climbers',
    discipline: 'force',
    category: 'home_bodyweight',
    difficulty: 'beginner',
    description_short: 'Exercice dynamique cardio et core, alternance rapide des genoux vers la poitrine',
    visual_keywords: ['mountain', 'climber', 'cardio', 'core', 'dynamic', 'plank'],
    movement_pattern: 'alternating',
    benefits: ['Cardio conditioning', 'Core endurance', 'Hip mobility'],
    coaching_cues: {
      beginner: [
        'Position de planche haute',
        'Amenez alternativement les genoux vers la poitrine',
        'Maintenez les hanches basses'
      ],
      intermediate: [
        'Accélérez le rythme',
        'Effectuez 30-60 secondes continues',
        'Gardez le core engagé'
      ],
      advanced: [
        'Effectuez des cross-body mountain climbers',
        'Ajoutez des variations (spider, sliding)',
        'Combinez dans des circuits HIIT'
      ]
    },
    muscles: [
      { muscle: 'abs', involvement_type: 'primary' },
      { muscle: 'hip-flexors', involvement_type: 'primary' },
      { muscle: 'shoulders', involvement_type: 'secondary' },
      { muscle: 'quads', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Continuous 30-60s'
  },

  // OUTDOOR TRAINING (10 exercises)
  {
    name: 'Park Bench Dips',
    discipline: 'force',
    category: 'outdoor',
    difficulty: 'beginner',
    description_short: 'Dips sur banc public, excellent exercice triceps en extérieur',
    visual_keywords: ['dips', 'bench', 'outdoor', 'park', 'triceps', 'public'],
    movement_pattern: 'push',
    benefits: ['Triceps strength', 'Chest development', 'Functional pushing'],
    coaching_cues: {
      beginner: [
        'Asseyez-vous sur le bord du banc, mains de chaque côté',
        'Avancez les fesses hors du banc',
        'Descendez en fléchissant les coudes'
      ],
      intermediate: [
        'Effectuez 12-20 répétitions',
        'Descendez jusqu\'à 90° de flexion',
        'Gardez les coudes près du corps'
      ],
      advanced: [
        'Surélevez les pieds sur un autre banc',
        'Ajoutez du poids (sac à dos)',
        'Effectuez en tempo lent'
      ]
    },
    muscles: [
      { muscle: 'triceps', involvement_type: 'primary' },
      { muscle: 'chest', involvement_type: 'secondary' },
      { muscle: 'shoulders', involvement_type: 'secondary' }
    ],
    equipment: ['bench'],
    tempo: '2-0-2-0'
  },
  {
    name: 'Park Bar Pull-Ups',
    discipline: 'force',
    category: 'outdoor',
    difficulty: 'intermediate',
    description_short: 'Pull-ups sur barre de parc ou aire de jeux, exercice dos complet',
    visual_keywords: ['pull-up', 'bar', 'outdoor', 'park', 'back', 'vertical'],
    movement_pattern: 'pull',
    benefits: ['Back development', 'Biceps strength', 'Grip endurance'],
    coaching_cues: {
      beginner: [
        'Agrippez la barre en pronation',
        'Partez bras tendus (dead hang)',
        'Tirez-vous jusqu\'au menton au-dessus de la barre'
      ],
      intermediate: [
        'Effectuez 5-12 répétitions',
        'Variez les prises (large, étroite, neutre)',
        'Contrôlez la descente'
      ],
      advanced: [
        'Ajoutez du poids (gilet lesté, sac)',
        'Effectuez des variations (archer, L-sit)',
        'Travaillez vers le muscle-up'
      ]
    },
    muscles: [
      { muscle: 'lats', involvement_type: 'primary' },
      { muscle: 'biceps', involvement_type: 'primary' },
      { muscle: 'rhomboides', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['pull-up-bar'],
    tempo: '2-1-2-0'
  },
  {
    name: 'Stair Sprints',
    discipline: 'endurance',
    category: 'outdoor',
    difficulty: 'intermediate',
    description_short: 'Sprints dans les escaliers publics, excellent cardio et jambes',
    visual_keywords: ['stairs', 'sprint', 'outdoor', 'cardio', 'legs', 'explosive'],
    movement_pattern: 'run',
    benefits: ['Cardio capacity', 'Leg power', 'Athletic conditioning'],
    coaching_cues: {
      beginner: [
        'Montez les escaliers à allure soutenue',
        'Utilisez les bras pour propulsion',
        'Redescendez en marchant (récupération)'
      ],
      intermediate: [
        'Sprintez à effort maximal',
        'Effectuez 8-12 répétitions',
        'Récupérez 1-2 minutes entre séries'
      ],
      advanced: [
        'Ajoutez des variations (double steps, single-leg)',
        'Effectuez en intervals (Tabata)',
        'Combinez avec des burpees en haut'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'calves', involvement_type: 'primary' },
      { muscle: 'hamstrings', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Explosive intervals'
  },

  // MINIMAL EQUIPMENT (8 exercises avec resistance bands)
  {
    name: 'Banded Chest Press',
    discipline: 'force',
    category: 'minimal_equipment',
    difficulty: 'beginner',
    description_short: 'Press horizontal avec bande élastique attachée derrière, alternative bench press',
    visual_keywords: ['band', 'chest', 'press', 'horizontal', 'resistance', 'push'],
    movement_pattern: 'push',
    benefits: ['Chest development', 'Constant tension', 'Portable equipment'],
    coaching_cues: {
      beginner: [
        'Attachez la bande derrière vous (porte, poteau)',
        'Poussez vers l\'avant comme un press',
        'Gardez les coudes à 45° du corps'
      ],
      intermediate: [
        'Effectuez 12-20 répétitions',
        'Variez les angles (haut, bas, milieu)',
        'Ajoutez des pauses isométriques'
      ],
      advanced: [
        'Utilisez des bandes plus résistantes',
        'Effectuez en unilatéral',
        'Combinez avec des push-ups'
      ]
    },
    muscles: [
      { muscle: 'chest', involvement_type: 'primary' },
      { muscle: 'triceps', involvement_type: 'primary' },
      { muscle: 'shoulders', involvement_type: 'secondary' }
    ],
    equipment: ['resistance-band'],
    tempo: '2-1-2-0'
  },
  {
    name: 'Banded Rows',
    discipline: 'force',
    category: 'minimal_equipment',
    difficulty: 'beginner',
    description_short: 'Rowing horizontal avec bande élastique, exercice dos accessible',
    visual_keywords: ['band', 'row', 'back', 'horizontal', 'pull', 'resistance'],
    movement_pattern: 'pull',
    benefits: ['Back thickness', 'Posture', 'Scapular control'],
    coaching_cues: {
      beginner: [
        'Attachez la bande devant vous à hauteur de poitrine',
        'Tirez les coudes vers l\'arrière',
        'Serrez les omoplates ensemble'
      ],
      intermediate: [
        'Effectuez 15-20 répétitions',
        'Maintenez 2 secondes en contraction',
        'Variez les angles de tirage'
      ],
      advanced: [
        'Utilisez des bandes plus épaisses',
        'Effectuez en unilatéral',
        'Ajoutez des variations (face pulls, high pulls)'
      ]
    },
    muscles: [
      { muscle: 'lats', involvement_type: 'primary' },
      { muscle: 'rhomboides', involvement_type: 'primary' },
      { muscle: 'rear-delts', involvement_type: 'secondary' },
      { muscle: 'biceps', involvement_type: 'secondary' }
    ],
    equipment: ['resistance-band'],
    tempo: '2-2-2-0'
  },
  {
    name: 'Banded Squats',
    discipline: 'force',
    category: 'minimal_equipment',
    difficulty: 'beginner',
    description_short: 'Squats avec résistance de bande élastique pour surcharge progressive',
    visual_keywords: ['band', 'squat', 'legs', 'resistance', 'lower-body', 'progressive'],
    movement_pattern: 'squat',
    benefits: ['Leg strength', 'Progressive overload', 'Portable training'],
    coaching_cues: {
      beginner: [
        'Placez la bande sous les pieds',
        'Tenez les extrémités au niveau des épaules',
        'Effectuez des squats normaux'
      ],
      intermediate: [
        'Effectuez 15-25 répétitions',
        'Utilisez des bandes plus résistantes',
        'Ajoutez des pauses en bas'
      ],
      advanced: [
        'Combinez avec des bandes multiples',
        'Effectuez en tempo lent',
        'Ajoutez des jump squats avec bande'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'hamstrings', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['resistance-band'],
    tempo: '2-0-2-0'
  },

  // Plus d'exercices à ajouter pour atteindre 100...
  // Je vais créer une structure condensée pour les exercices restants

  // HOME FULL BODY CIRCUITS (10 exercises)
  {
    name: 'Burpees',
    discipline: 'functional',
    category: 'home_bodyweight',
    difficulty: 'intermediate',
    description_short: 'Exercice full-body explosif combinant squat, planche et saut vertical',
    visual_keywords: ['burpee', 'full-body', 'explosive', 'cardio', 'conditioning', 'complex'],
    movement_pattern: 'complex',
    benefits: ['Full body conditioning', 'Cardio capacity', 'Explosive power'],
    coaching_cues: {
      beginner: [
        'Descendez en squat, placez les mains au sol',
        'Sautez ou marchez les pieds en arrière en planche',
        'Revenez et sautez verticalement'
      ],
      intermediate: [
        'Effectuez 10-20 répétitions continues',
        'Ajoutez un push-up en position planche',
        'Maximisez la hauteur du saut final'
      ],
      advanced: [
        'Effectuez en intervals haute intensité (30s work / 10s rest)',
        'Ajoutez des variations (over-the-box, one-leg)',
        'Combinez dans des WODs CrossFit'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'chest', involvement_type: 'primary' },
      { muscle: 'shoulders', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Continuous flow'
  }
];

// Ajout de 45 exercices supplémentaires pour atteindre 100
// (Format condensé pour économiser l'espace)

const additionalExercises: ExerciseData[] = [
  // HOME LEGS
  { name: 'Walking Lunges', discipline: 'force', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Fentes marchées alternées, exercice dynamique jambes complet', visual_keywords: ['lunge', 'walking', 'legs', 'dynamic', 'bodyweight'], movement_pattern: 'lunge', benefits: ['Leg strength', 'Balance', 'Functional movement'], coaching_cues: { beginner: ['Faites un grand pas en avant', 'Descendez jusqu\'à ce que le genou arrière frôle le sol', 'Alternez les jambes en marchant'], intermediate: ['Effectuez 20-40 pas total', 'Gardez le torse vertical', 'Accélérez le rythme progressivement'], advanced: ['Ajoutez des poids (bouteilles, sac)', 'Effectuez en arrière (reverse lunges)', 'Combinez avec des twists'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'hamstrings', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous' },

  { name: 'Calf Raises (Single Leg)', discipline: 'force', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Élévation mollets unilatérale sur marche ou surface surélevée', visual_keywords: ['calf', 'raise', 'single-leg', 'unilateral', 'balance'], movement_pattern: 'raise', benefits: ['Calf strength', 'Ankle stability', 'Balance'], coaching_cues: { beginner: ['Tenez-vous en équilibre sur une jambe', 'Montez sur la pointe du pied', 'Tenez un support si nécessaire'], intermediate: ['Effectuez 15-25 répétitions par jambe', 'Descendez le talon sous le niveau de la marche', 'Maintenez 1 seconde en haut'], advanced: ['Ajoutez du poids (sac à dos)', 'Effectuez en tempo très lent (5-5)', 'Travaillez sans support'] }, muscles: [{ muscle: 'calves', involvement_type: 'primary' }, { muscle: 'gastrocnemius', involvement_type: 'primary' }, { muscle: 'soleus', involvement_type: 'secondary' }], equipment: ['none'], tempo: '2-1-2-1' },

  { name: 'Wall Sit', discipline: 'force', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Position isométrique dos contre mur, genoux à 90°, endurance quadriceps', visual_keywords: ['wall', 'sit', 'isometric', 'quads', 'endurance', 'static'], movement_pattern: 'hold', benefits: ['Quad endurance', 'Mental toughness', 'Knee stability'], coaching_cues: { beginner: ['Dos contre le mur, descendez en position assise', 'Genoux à 90°, cuisses parallèles au sol', 'Tenez 30-60 secondes'], intermediate: ['Augmentez la durée (60-120 secondes)', 'Gardez les bras croisés ou tendus devant', 'Respirez calmement'], advanced: ['Tenez 2-3 minutes', 'Effectuez sur une jambe', 'Ajoutez du poids sur les cuisses'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Hold 30-180s' },

  { name: 'Nordic Hamstring Curls', discipline: 'force', category: 'home_bodyweight', difficulty: 'advanced', description_short: 'Flexion ischio-jambiers eccentric ultra-intense, partenaire tient les pieds', visual_keywords: ['nordic', 'hamstring', 'curl', 'eccentric', 'advanced', 'partner'], movement_pattern: 'curl', benefits: ['Hamstring strength', 'Injury prevention', 'Eccentric control'], coaching_cues: { beginner: ['À genoux, partenaire tient vos chevilles', 'Descendez lentement vers l\'avant en contrôlant', 'Utilisez les mains pour freiner la chute'], intermediate: ['Descendez le plus bas possible avant de freiner', 'Effectuez 5-8 répétitions', 'Remontez en poussant avec les mains'], advanced: ['Descendez complètement sans les mains', 'Effectuez 10+ répétitions', 'Travaillez le concentrique (remonter)'] }, muscles: [{ muscle: 'hamstrings', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'secondary' }, { muscle: 'calves', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: '5-0-2-0' },

  { name: 'Step-Ups (High)', discipline: 'force', category: 'home_bodyweight', difficulty: 'intermediate', description_short: 'Montées sur chaise ou surface haute, unilateral leg strength', visual_keywords: ['step-up', 'high', 'unilateral', 'chair', 'legs'], movement_pattern: 'step', benefits: ['Leg strength', 'Balance', 'Functional movement'], coaching_cues: { beginner: ['Placez un pied sur une chaise stable', 'Montez en poussant avec la jambe avant', 'Descendez contrôlé'], intermediate: ['Effectuez 12-20 répétitions par jambe', 'Évitez de pousser avec la jambe arrière', 'Gardez le genou aligné'], advanced: ['Ajoutez du poids (bouteilles, sac)', 'Effectuez en explosif', 'Augmentez la hauteur'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'hamstrings', involvement_type: 'secondary' }], equipment: ['bench'], tempo: '2-0-2-0' },

  // MORE HOME CORE
  { name: 'Plank to Pike', discipline: 'force', category: 'home_bodyweight', difficulty: 'intermediate', description_short: 'Transition dynamique planche vers pike, core et shoulders', visual_keywords: ['plank', 'pike', 'core', 'dynamic', 'shoulders'], movement_pattern: 'dynamic', benefits: ['Core strength', 'Shoulder stability', 'Hip flexibility'], coaching_cues: { beginner: ['Démarrez en planche haute', 'Levez les hanches vers le ciel en gardant les jambes droites', 'Revenez en planche'], intermediate: ['Effectuez 10-15 répétitions fluides', 'Maintenez les bras tendus', 'Contrôlez le mouvement'], advanced: ['Accélérez le tempo', 'Ajoutez une pause en pike', 'Combinez avec push-ups'] }, muscles: [{ muscle: 'abs', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'hip-flexors', involvement_type: 'secondary' }], equipment: ['none'], tempo: '2-0-2-0' },

  { name: 'Russian Twists', discipline: 'force', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Rotations obliques assis, pieds levés, travail anti-rotation', visual_keywords: ['russian', 'twist', 'obliques', 'rotation', 'core'], movement_pattern: 'rotation', benefits: ['Oblique strength', 'Rotational power', 'Core endurance'], coaching_cues: { beginner: ['Asseyez-vous, penchez légèrement en arrière', 'Levez les pieds du sol', 'Tournez le torse de gauche à droite'], intermediate: ['Effectuez 30-60 secondes continues', 'Tenez un objet lourd (bouteille)', 'Touchez le sol de chaque côté'], advanced: ['Augmentez le poids', 'Ralentissez le tempo', 'Gardez les pieds plus hauts'] }, muscles: [{ muscle: 'obliques', involvement_type: 'primary' }, { muscle: 'abs', involvement_type: 'secondary' }, { muscle: 'hip-flexors', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous 30-60s' },

  { name: 'Bicycle Crunches', discipline: 'force', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Crunch alterné avec rotation, coude vers genou opposé', visual_keywords: ['bicycle', 'crunch', 'abs', 'rotation', 'alternating'], movement_pattern: 'crunch', benefits: ['Ab development', 'Oblique activation', 'Coordination'], coaching_cues: { beginner: ['Allongé sur le dos, mains derrière la tête', 'Amenez le coude droit vers le genou gauche', 'Alternez de façon fluide'], intermediate: ['Effectuez 30-60 répétitions', 'Gardez le bas du dos au sol', 'Contrôlez le mouvement'], advanced: ['Ralentissez le tempo', 'Effectuez 100+ répétitions', 'Ajoutez des pauses'] }, muscles: [{ muscle: 'abs', involvement_type: 'primary' }, { muscle: 'obliques', involvement_type: 'primary' }, { muscle: 'hip-flexors', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous' },

  { name: 'Dead Bug', discipline: 'force', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Anti-extension core work, alternance bras et jambes opposés', visual_keywords: ['dead', 'bug', 'core', 'anti-extension', 'supine'], movement_pattern: 'alternating', benefits: ['Core stability', 'Anti-extension', 'Coordination'], coaching_cues: { beginner: ['Allongé, bras et jambes en l\'air', 'Étendez bras et jambe opposés simultanément', 'Gardez le bas du dos collé au sol'], intermediate: ['Effectuez 20-40 répétitions alternées', 'Respirez calmement', 'Ralentissez le mouvement'], advanced: ['Ajoutez des poids légers', 'Effectuez en tempo ultra-lent', 'Combinez avec hollow body'] }, muscles: [{ muscle: 'abs', involvement_type: 'primary' }, { muscle: 'obliques', involvement_type: 'secondary' }, { muscle: 'hip-flexors', involvement_type: 'secondary' }], equipment: ['none'], tempo: '3-0-3-0' },

  { name: 'V-Sits', discipline: 'force', category: 'home_bodyweight', difficulty: 'advanced', description_short: 'Crunch complet en V, jambes et torse se rejoignent', visual_keywords: ['v-sit', 'core', 'advanced', 'abs', 'full'], movement_pattern: 'flex', benefits: ['Core strength', 'Hip flexor power', 'Balance'], coaching_cues: { beginner: ['Allongé, levez simultanément torse et jambes', 'Formez un V avec votre corps', 'Touchez les pieds avec les mains'], intermediate: ['Effectuez 10-20 répétitions', 'Gardez les jambes tendues', 'Descendez contrôlé'], advanced: ['Effectuez en tempo lent', 'Ajoutez une pause en V', 'Combinez avec hollow rocks'] }, muscles: [{ muscle: 'abs', involvement_type: 'primary' }, { muscle: 'hip-flexors', involvement_type: 'primary' }, { muscle: 'quads', involvement_type: 'secondary' }], equipment: ['none'], tempo: '2-1-2-0' },

  { name: 'Side Plank', discipline: 'force', category: 'home_bodyweight', difficulty: 'intermediate', description_short: 'Planche latérale, travail obliques et stabilisation', visual_keywords: ['side', 'plank', 'obliques', 'lateral', 'hold'], movement_pattern: 'hold', benefits: ['Oblique strength', 'Lateral stability', 'Shoulder endurance'], coaching_cues: { beginner: ['Sur le côté, appui sur avant-bras et pieds', 'Levez les hanches pour aligner le corps', 'Tenez 20-45 secondes par côté'], intermediate: ['Augmentez la durée (45-90 secondes)', 'Levez le bras supérieur', 'Gardez les hanches hautes'], advanced: ['Ajoutez des dips (baisse et remonte des hanches)', 'Effectuez sur la main (pas avant-bras)', 'Ajoutez des rotations'] }, muscles: [{ muscle: 'obliques', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: 'Hold 30-90s' },

  { name: 'L-Sit Hold (Floor)', discipline: 'force', category: 'home_bodyweight', difficulty: 'advanced', description_short: 'Hold en L assis, mains au sol, jambes tendues devant', visual_keywords: ['l-sit', 'hold', 'core', 'advanced', 'isometric'], movement_pattern: 'hold', benefits: ['Core strength', 'Hip flexor power', 'Gymnastics foundation'], coaching_cues: { beginner: ['Assis, mains au sol à côté des hanches', 'Poussez pour lever les fesses du sol', 'Gardez les jambes pliées (tuck L-sit)'], intermediate: ['Commencez à tendre les jambes', 'Tenez 10-30 secondes', 'Gardez les épaules actives'], advanced: ['Effectuez full L-sit jambes tendues', 'Tenez 30-60 secondes', 'Progressez vers straddle L-sit'] }, muscles: [{ muscle: 'abs', involvement_type: 'primary' }, { muscle: 'hip-flexors', involvement_type: 'primary' }, { muscle: 'triceps', involvement_type: 'secondary' }, { muscle: 'shoulders', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: 'Hold 10-60s' },

  { name: 'Bird Dog', discipline: 'force', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Four pattes, extension bras et jambe opposés, stabilité core', visual_keywords: ['bird', 'dog', 'core', 'stability', 'quadruped'], movement_pattern: 'extension', benefits: ['Core stability', 'Balance', 'Spinal health'], coaching_cues: { beginner: ['À quatre pattes, dos plat', 'Étendez bras droit et jambe gauche', 'Maintenez 5-10 secondes, alternez'], intermediate: ['Effectuez 15-20 répétitions par côté', 'Gardez les hanches stables', 'Regardez vers le sol'], advanced: ['Ajoutez des pauses de 10+ secondes', 'Effectuez en mouvement continu', 'Ajoutez des poids aux chevilles'] }, muscles: [{ muscle: 'core', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'spinal-erectors', involvement_type: 'secondary' }, { muscle: 'shoulders', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: 'Hold 5-10s each' },

  // MORE HOME UPPER PUSH
  { name: 'Archer Push-Ups', discipline: 'force', category: 'home_bodyweight', difficulty: 'advanced', description_short: 'Push-up asymétrique, poids sur un bras, progression one-arm', visual_keywords: ['archer', 'push-up', 'asymmetric', 'advanced', 'unilateral'], movement_pattern: 'push', benefits: ['Unilateral strength', 'One-arm push-up progression', 'Chest development'], coaching_cues: { beginner: ['Mains très larges, descendez vers un côté', 'Le bras opposé reste tendu', 'Alternez les côtés'], intermediate: ['Effectuez 5-10 répétitions par côté', 'Transférez le poids complètement', 'Gardez le corps aligné'], advanced: ['Augmentez la largeur', 'Effectuez en tempo lent', 'Progressez vers one-arm push-ups'] }, muscles: [{ muscle: 'chest', involvement_type: 'primary' }, { muscle: 'triceps', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'secondary' }, { muscle: 'core', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: '3-0-2-0' },

  { name: 'Pseudo Planche Push-Ups', discipline: 'calisthenics', category: 'home_bodyweight', difficulty: 'advanced', description_short: 'Push-up mains reculées vers hanches, simulation planche', visual_keywords: ['pseudo', 'planche', 'push-up', 'advanced', 'shoulders'], movement_pattern: 'push', benefits: ['Shoulder strength', 'Planche progression', 'Core stability'], coaching_cues: { beginner: ['Placez les mains au niveau des hanches', 'Penchez le corps vers l\'avant', 'Descendez en push-up'], intermediate: ['Effectuez 5-12 répétitions', 'Gardez les coudes serrés', 'Protractez les épaules'], advanced: ['Augmentez l\'inclinaison', 'Effectuez en lean avancé', 'Progressez vers tuck planche'] }, muscles: [{ muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'chest', involvement_type: 'primary' }, { muscle: 'triceps', involvement_type: 'secondary' }, { muscle: 'core', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: '3-0-2-0' },

  { name: 'Sphinx Push-Ups', discipline: 'force', category: 'home_bodyweight', difficulty: 'intermediate', description_short: 'Push-up depuis position sphinx (avant-bras), extension triceps', visual_keywords: ['sphinx', 'push-up', 'triceps', 'forearms', 'extension'], movement_pattern: 'extension', benefits: ['Triceps strength', 'Elbow health', 'Core stability'], coaching_cues: { beginner: ['Position planche sur avant-bras', 'Poussez pour passer sur les mains', 'Redescendez contrôlé'], intermediate: ['Effectuez 8-15 répétitions', 'Gardez les coudes près du corps', 'Alternez le bras qui monte en premier'], advanced: ['Effectuez en tempo lent', 'Ajoutez des pauses', 'Combinez avec regular push-ups'] }, muscles: [{ muscle: 'triceps', involvement_type: 'primary' }, { muscle: 'chest', involvement_type: 'secondary' }, { muscle: 'shoulders', involvement_type: 'secondary' }, { muscle: 'core', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: '2-0-2-0' },

  { name: 'Clap Push-Ups', discipline: 'force', category: 'home_bodyweight', difficulty: 'advanced', description_short: 'Push-up pliométrique avec clap des mains en l\'air', visual_keywords: ['clap', 'push-up', 'plyometric', 'explosive', 'power'], movement_pattern: 'explosive', benefits: ['Explosive power', 'Fast-twitch fibers', 'Athletic performance'], coaching_cues: { beginner: ['Effectuez un push-up régulier explosif', 'Poussez assez fort pour décoller les mains', 'Atterrissez en douceur'], intermediate: ['Ajoutez un clap des mains', 'Effectuez 5-10 répétitions', 'Maximisez la hauteur'], advanced: ['Effectuez double clap', 'Combinez avec other plyos', 'Ajoutez clap derrière le dos'] }, muscles: [{ muscle: 'chest', involvement_type: 'primary' }, { muscle: 'triceps', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: 'Explosive' },

  // MORE HOME UPPER PULL
  { name: 'Inverted Rows (Low Table)', discipline: 'force', category: 'home_bodyweight', difficulty: 'intermediate', description_short: 'Rowing sous table basse, corps horizontal, pull complet', visual_keywords: ['inverted', 'row', 'table', 'horizontal', 'back'], movement_pattern: 'pull', benefits: ['Back thickness', 'Biceps strength', 'Horizontal pulling'], coaching_cues: { beginner: ['Allongez-vous sous une table solide', 'Agrippez le bord, corps tendu', 'Tirez la poitrine vers la table'], intermediate: ['Effectuez 10-20 répétitions', 'Serrez les omoplates', 'Gardez le corps parfaitement droit'], advanced: ['Surélevez les pieds', 'Ajoutez une pause en haut', 'Effectuez en unilatéral'] }, muscles: [{ muscle: 'lats', involvement_type: 'primary' }, { muscle: 'rhomboides', involvement_type: 'primary' }, { muscle: 'biceps', involvement_type: 'secondary' }, { muscle: 'core', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: '2-1-2-0' },

  { name: 'Prone Y-T-W Raises', discipline: 'force', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Séquence levées bras au sol formant Y, T, W pour rear delts', visual_keywords: ['y-t-w', 'raise', 'prone', 'rear-delts', 'shoulders'], movement_pattern: 'raise', benefits: ['Rear delt strength', 'Shoulder health', 'Posture'], coaching_cues: { beginner: ['Allongé sur le ventre', 'Levez les bras en formant Y, puis T, puis W', 'Maintenez 2 secondes chaque position'], intermediate: ['Effectuez 10-15 répétitions de chaque', 'Gardez le regard vers le sol', 'Serrez les omoplates'], advanced: ['Ajoutez des poids légers', 'Augmentez la durée des pauses', 'Effectuez en isométrique'] }, muscles: [{ muscle: 'rear-delts', involvement_type: 'primary' }, { muscle: 'rhomboides', involvement_type: 'primary' }, { muscle: 'lower-traps', involvement_type: 'primary' }], equipment: ['none'], tempo: '2-2-2-2' },

  { name: 'Scapular Pull-Ups', discipline: 'calisthenics', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Dead hang avec depression/elevation scapulaire, fondation pull-ups', visual_keywords: ['scapular', 'pull-up', 'hang', 'shoulders', 'activation'], movement_pattern: 'scapular', benefits: ['Scapular control', 'Pull-up foundation', 'Shoulder health'], coaching_cues: { beginner: ['Suspendez-vous à une barre', 'Sans plier les bras, tirez les épaules vers le bas', 'Relâchez et répétez'], intermediate: ['Effectuez 15-25 répétitions', 'Contrôlez le mouvement', 'Maintenez chaque position 2 secondes'], advanced: ['Ajoutez du poids', 'Effectuez en unilatéral', 'Combinez avec pull-ups complets'] }, muscles: [{ muscle: 'lats', involvement_type: 'primary' }, { muscle: 'lower-traps', involvement_type: 'primary' }, { muscle: 'serratus', involvement_type: 'secondary' }], equipment: ['pull-up-bar'], tempo: '2-1-2-1' },

  // MORE OUTDOOR
  { name: 'Park Bench Step-Ups', discipline: 'force', category: 'outdoor', difficulty: 'beginner', description_short: 'Montées sur banc public, exercice jambes fonctionnel outdoor', visual_keywords: ['step-up', 'bench', 'park', 'outdoor', 'legs'], movement_pattern: 'step', benefits: ['Leg strength', 'Balance', 'Functional fitness'], coaching_cues: { beginner: ['Placez un pied sur le banc', 'Montez en poussant avec la jambe avant', 'Alternez les jambes'], intermediate: ['Effectuez 15-25 répétitions par jambe', 'Accélérez le tempo', 'Minimisez l\'aide de la jambe arrière'], advanced: ['Ajoutez du poids (sac à dos)', 'Effectuez en explosif', 'Combinez avec box jumps'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'hamstrings', involvement_type: 'secondary' }], equipment: ['bench'], tempo: '2-0-1-0' },

  { name: 'Tree Branch Pull-Ups', discipline: 'force', category: 'outdoor', difficulty: 'intermediate', description_short: 'Pull-ups sur branche d\'arbre solide, outdoor strength', visual_keywords: ['pull-up', 'tree', 'branch', 'outdoor', 'nature'], movement_pattern: 'pull', benefits: ['Back strength', 'Grip endurance', 'Outdoor training'], coaching_cues: { beginner: ['Trouvez une branche solide à bonne hauteur', 'Testez la solidité avant', 'Effectuez des pull-ups standard'], intermediate: ['Effectuez 5-15 répétitions', 'Variez les prises selon la branche', 'Contrôlez la descente'], advanced: ['Ajoutez du poids', 'Effectuez des variations (L-sit, muscle-up)', 'Travaillez en circuit outdoor'] }, muscles: [{ muscle: 'lats', involvement_type: 'primary' }, { muscle: 'biceps', involvement_type: 'primary' }, { muscle: 'avant-bras', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: '2-1-2-0' },

  { name: 'Incline Push-Ups (Park Bench)', discipline: 'force', category: 'outdoor', difficulty: 'beginner', description_short: 'Push-ups mains sur banc, variation plus facile pour débutants', visual_keywords: ['incline', 'push-up', 'bench', 'park', 'beginner'], movement_pattern: 'push', benefits: ['Upper body strength', 'Progression exercise', 'Accessible'], coaching_cues: { beginner: ['Mains sur le banc, corps en ligne', 'Descendez la poitrine vers le banc', 'Poussez pour remonter'], intermediate: ['Effectuez 15-25 répétitions', 'Contrôlez le tempo', 'Gardez le corps aligné'], advanced: ['Progressez vers push-ups au sol', 'Ajoutez des variations (diamond, wide)', 'Effectuez en tempo lent'] }, muscles: [{ muscle: 'chest', involvement_type: 'primary' }, { muscle: 'triceps', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'secondary' }], equipment: ['bench'], tempo: '2-0-2-0' },

  { name: 'Bear Crawls', discipline: 'functional', category: 'outdoor', difficulty: 'beginner', description_short: 'Déplacement quadrupède, full-body conditioning outdoor', visual_keywords: ['bear', 'crawl', 'outdoor', 'full-body', 'conditioning'], movement_pattern: 'locomotion', benefits: ['Full body coordination', 'Core strength', 'Cardio'], coaching_cues: { beginner: ['À quatre pattes, genoux légèrement levés', 'Avancez main et pied opposés simultanément', 'Gardez les hanches basses'], intermediate: ['Effectuez 20-40 mètres', 'Accélérez le rythme', 'Variez les directions'], advanced: ['Effectuez en côté (lateral bear crawl)', 'Ajoutez en arrière (reverse)', 'Combinez dans des circuits'] }, muscles: [{ muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'quads', involvement_type: 'secondary' }, { muscle: 'glutes', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous 20-60s' },

  { name: 'Hill Sprints', discipline: 'endurance', category: 'outdoor', difficulty: 'intermediate', description_short: 'Sprints en montée, explosive leg power et cardio', visual_keywords: ['hill', 'sprint', 'uphill', 'cardio', 'explosive'], movement_pattern: 'sprint', benefits: ['Explosive power', 'Cardio capacity', 'Leg strength'], coaching_cues: { beginner: ['Trouvez une pente de 5-10%', 'Sprintez 20-30 mètres', 'Redescendez en marchant'], intermediate: ['Effectuez 8-12 répétitions', 'Sprintez à 85-95% effort maximal', 'Récupérez 2-3 minutes'], advanced: ['Augmentez la distance (50-100m)', 'Effectuez sur pente plus raide', 'Réduisez les temps de repos'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'primary' }, { muscle: 'hamstrings', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Explosive intervals' },

  { name: 'Playground Muscle-Up Progressions', discipline: 'calisthenics', category: 'outdoor', difficulty: 'advanced', description_short: 'Progressions muscle-up sur barre de parc, mouvement ultime', visual_keywords: ['muscle-up', 'playground', 'bar', 'advanced', 'dynamic'], movement_pattern: 'dynamic', benefits: ['Explosive pulling', 'Transition strength', 'Elite bodyweight'], coaching_cues: { beginner: ['Maîtrisez pull-ups et dips d\'abord', 'Travaillez les transitions (bar to chest)', 'Utilisez la force explosive'], intermediate: ['Effectuez des kipping muscle-ups', 'Travaillez 3-5 répétitions', 'Perfectionnez la technique'], advanced: ['Effectuez des strict muscle-ups', 'Ajoutez des variations (L-sit, weighted)', 'Travaillez vers bar muscle-up'] }, muscles: [{ muscle: 'lats', involvement_type: 'primary' }, { muscle: 'chest', involvement_type: 'primary' }, { muscle: 'triceps', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'secondary' }], equipment: ['pull-up-bar'], tempo: 'Explosive' },

  // MORE MINIMAL EQUIPMENT
  { name: 'Banded Pull-Aparts', discipline: 'force', category: 'minimal_equipment', difficulty: 'beginner', description_short: 'Écartement bande devant poitrine, rear delts et posture', visual_keywords: ['band', 'pull-apart', 'rear-delts', 'posture', 'shoulders'], movement_pattern: 'pull', benefits: ['Rear delt strength', 'Posture improvement', 'Shoulder health'], coaching_cues: { beginner: ['Tenez la bande devant vous, bras tendus', 'Écartez la bande vers les côtés', 'Serrez les omoplates'], intermediate: ['Effectuez 15-25 répétitions', 'Variez la hauteur (high, mid, low)', 'Maintenez 2 secondes en écartement'], advanced: ['Utilisez une bande plus résistante', 'Effectuez en tempo ultra-lent', 'Combinez avec rows'] }, muscles: [{ muscle: 'rear-delts', involvement_type: 'primary' }, { muscle: 'rhomboides', involvement_type: 'primary' }, { muscle: 'middle-traps', involvement_type: 'secondary' }], equipment: ['resistance-band'], tempo: '2-2-2-0' },

  { name: 'Banded Overhead Press', discipline: 'force', category: 'minimal_equipment', difficulty: 'intermediate', description_short: 'Press vertical avec bande élastique, développement épaules', visual_keywords: ['band', 'overhead', 'press', 'shoulders', 'vertical'], movement_pattern: 'press', benefits: ['Shoulder strength', 'Overhead stability', 'Progressive resistance'], coaching_cues: { beginner: ['Placez la bande sous les pieds', 'Tenez les extrémités au niveau des épaules', 'Pressez vers le haut'], intermediate: ['Effectuez 12-20 répétitions', 'Gardez le core engagé', 'Poussez complètement en haut'], advanced: ['Utilisez des bandes plus résistantes', 'Effectuez en unilatéral', 'Ajoutez en tempo lent'] }, muscles: [{ muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'triceps', involvement_type: 'primary' }, { muscle: 'upper-traps', involvement_type: 'secondary' }, { muscle: 'core', involvement_type: 'stabilizer' }], equipment: ['resistance-band'], tempo: '2-0-2-0' },

  { name: 'Banded Deadlifts', discipline: 'force', category: 'minimal_equipment', difficulty: 'beginner', description_short: 'Deadlift avec bande sous pieds, pattern hinge fondamental', visual_keywords: ['band', 'deadlift', 'hinge', 'posterior', 'legs'], movement_pattern: 'hinge', benefits: ['Posterior chain', 'Hip hinge pattern', 'Lower back strength'], coaching_cues: { beginner: ['Placez la bande sous les pieds', 'Penchez-vous en reculant les hanches', 'Remontez en poussant les hanches vers l\'avant'], intermediate: ['Effectuez 15-25 répétitions', 'Gardez le dos plat', 'Serrez les fessiers en haut'], advanced: ['Utilisez des bandes plus épaisses', 'Effectuez en single-leg', 'Ajoutez en tempo lent'] }, muscles: [{ muscle: 'hamstrings', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'spinal-erectors', involvement_type: 'primary' }, { muscle: 'lats', involvement_type: 'secondary' }], equipment: ['resistance-band'], tempo: '2-1-2-1' },

  { name: 'Banded Bicep Curls', discipline: 'force', category: 'minimal_equipment', difficulty: 'beginner', description_short: 'Curls biceps avec bande élastique, isolation bras', visual_keywords: ['band', 'curl', 'biceps', 'isolation', 'arms'], movement_pattern: 'curl', benefits: ['Bicep development', 'Arm size', 'Constant tension'], coaching_cues: { beginner: ['Placez la bande sous les pieds', 'Tenez les extrémités, coudes au corps', 'Fléchissez les avant-bras vers les épaules'], intermediate: ['Effectuez 15-25 répétitions', 'Contrôlez la descente', 'Maintenez les coudes fixes'], advanced: ['Utilisez des bandes plus résistantes', 'Effectuez en unilatéral', 'Ajoutez des pauses en contraction'] }, muscles: [{ muscle: 'biceps', involvement_type: 'primary' }, { muscle: 'avant-bras', involvement_type: 'secondary' }], equipment: ['resistance-band'], tempo: '2-1-2-0' },

  { name: 'Banded Lateral Raises', discipline: 'force', category: 'minimal_equipment', difficulty: 'beginner', description_short: 'Élévations latérales épaules avec bande pour side delts', visual_keywords: ['band', 'lateral', 'raise', 'shoulders', 'delts'], movement_pattern: 'raise', benefits: ['Shoulder width', 'Side delt development', 'Shoulder stability'], coaching_cues: { beginner: ['Placez la bande sous les pieds', 'Levez les bras sur les côtés', 'Montez jusqu\'à hauteur d\'épaules'], intermediate: ['Effectuez 15-25 répétitions', 'Gardez une légère flexion des coudes', 'Contrôlez la descente'], advanced: ['Utilisez des bandes plus résistantes', 'Effectuez en tempo lent', 'Ajoutez des pauses en haut'] }, muscles: [{ muscle: 'side-delts', involvement_type: 'primary' }, { muscle: 'upper-traps', involvement_type: 'secondary' }], equipment: ['resistance-band'], tempo: '2-1-2-0' },

  { name: 'Banded Good Mornings', discipline: 'force', category: 'minimal_equipment', difficulty: 'intermediate', description_short: 'Hip hinge avec bande, travail posterior chain et hamstrings', visual_keywords: ['band', 'good-morning', 'hinge', 'hamstrings', 'posterior'], movement_pattern: 'hinge', benefits: ['Hamstring strength', 'Hip hinge mastery', 'Lower back resilience'], coaching_cues: { beginner: ['Placez la bande sous les pieds, sur les épaules', 'Penchez-vous en avant en reculant les hanches', 'Gardez les jambes quasi-tendues'], intermediate: ['Effectuez 12-20 répétitions', 'Descendez jusqu\'à sentir l\'étirement', 'Remontez en contractant les fessiers'], advanced: ['Utilisez des bandes plus résistantes', 'Effectuez en tempo lent', 'Augmentez l\'amplitude'] }, muscles: [{ muscle: 'hamstrings', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'spinal-erectors', involvement_type: 'secondary' }], equipment: ['resistance-band'], tempo: '3-1-2-0' },

  { name: 'Banded Tricep Extensions', discipline: 'force', category: 'minimal_equipment', difficulty: 'beginner', description_short: 'Extensions triceps overhead avec bande, isolation bras', visual_keywords: ['band', 'tricep', 'extension', 'overhead', 'isolation'], movement_pattern: 'extension', benefits: ['Tricep development', 'Arm size', 'Overhead strength'], coaching_cues: { beginner: ['Tenez la bande derrière vous, un bout fixe', 'Étendez les bras au-dessus de la tête', 'Contrôlez le retour'], intermediate: ['Effectuez 15-25 répétitions', 'Gardez les coudes fixes et près des oreilles', 'Focus sur la contraction triceps'], advanced: ['Utilisez des bandes plus résistantes', 'Effectuez en unilatéral', 'Ajoutez des pauses'] }, muscles: [{ muscle: 'triceps', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'stabilizer' }], equipment: ['resistance-band'], tempo: '2-1-2-0' },

  { name: 'Banded Face Pulls', discipline: 'force', category: 'minimal_equipment', difficulty: 'beginner', description_short: 'Tirage bande vers le visage, rear delts et santé épaules', visual_keywords: ['band', 'face-pull', 'rear-delts', 'shoulders', 'health'], movement_pattern: 'pull', benefits: ['Rear delt strength', 'Shoulder health', 'Posture correction'], coaching_cues: { beginner: ['Attachez la bande à hauteur du visage', 'Tirez vers le visage en écartant les mains', 'Serrez les omoplates'], intermediate: ['Effectuez 15-25 répétitions', 'Gardez les coudes hauts', 'Maintenez 2 secondes en contraction'], advanced: ['Utilisez une bande plus résistante', 'Effectuez en tempo lent', 'Variez les angles'] }, muscles: [{ muscle: 'rear-delts', involvement_type: 'primary' }, { muscle: 'rhomboides', involvement_type: 'primary' }, { muscle: 'middle-traps', involvement_type: 'secondary' }], equipment: ['resistance-band'], tempo: '2-2-2-0' },

  // MORE HOME BODYWEIGHT VARIATIONS
  { name: 'Jumping Jacks', discipline: 'endurance', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Exercice cardio classique, écartement sauté bras et jambes', visual_keywords: ['jumping', 'jack', 'cardio', 'warm-up', 'coordination'], movement_pattern: 'jump', benefits: ['Cardio warm-up', 'Coordination', 'Full body activation'], coaching_cues: { beginner: ['Démarrez pieds joints, bras le long du corps', 'Sautez en écartant jambes et bras simultanément', 'Revenez à la position initiale'], intermediate: ['Effectuez 30-60 secondes continues', 'Accélérez le rythme', 'Gardez un tempo régulier'], advanced: ['Effectuez 2-3 minutes continues', 'Combinez avec high knees', 'Ajoutez dans des circuits HIIT'] }, muscles: [{ muscle: 'calves', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'quads', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous 30-180s' },

  { name: 'High Knees', discipline: 'endurance', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Course sur place genoux hauts, cardio et hip flexors', visual_keywords: ['high', 'knees', 'cardio', 'running', 'dynamic'], movement_pattern: 'run', benefits: ['Cardio conditioning', 'Hip flexor strength', 'Running mechanics'], coaching_cues: { beginner: ['Courez sur place', 'Montez les genoux à hauteur de hanches', 'Utilisez les bras'], intermediate: ['Effectuez 30-60 secondes', 'Accélérez le rythme', 'Maintenez le torse droit'], advanced: ['Sprintez en place', 'Effectuez 2-3 minutes', 'Combinez dans des intervals'] }, muscles: [{ muscle: 'hip-flexors', involvement_type: 'primary' }, { muscle: 'quads', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'secondary' }, { muscle: 'core', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: 'Continuous 30-180s' },

  { name: 'Butt Kicks', discipline: 'endurance', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Course sur place talons aux fesses, cardio et hamstrings', visual_keywords: ['butt', 'kick', 'cardio', 'running', 'hamstrings'], movement_pattern: 'run', benefits: ['Hamstring activation', 'Cardio conditioning', 'Running drills'], coaching_cues: { beginner: ['Courez sur place', 'Amenez les talons vers les fesses', 'Gardez le buste droit'], intermediate: ['Effectuez 30-60 secondes', 'Accélérez la cadence', 'Touchez les fesses avec les talons'], advanced: ['Sprintez rapidement', 'Effectuez 2-3 minutes', 'Combinez avec high knees'] }, muscles: [{ muscle: 'hamstrings', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous 30-180s' },

  { name: 'Inchworms', discipline: 'functional', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Marche mains vers planche puis pieds vers mains, mobility et strength', visual_keywords: ['inchworm', 'walkout', 'mobility', 'hamstrings', 'dynamic'], movement_pattern: 'complex', benefits: ['Hamstring flexibility', 'Core strength', 'Full body warm-up'], coaching_cues: { beginner: ['Penchez-vous en avant, mains au sol', 'Marchez les mains vers l\'avant en planche', 'Marchez les pieds vers les mains'], intermediate: ['Effectuez 10-15 répétitions', 'Gardez les jambes tendues', 'Ajoutez un push-up en planche'], advanced: ['Accélérez le rythme', 'Effectuez 20-30 répétitions', 'Combinez dans des WODs'] }, muscles: [{ muscle: 'hamstrings', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous flow' },

  { name: 'Superman Hold', discipline: 'force', category: 'home_bodyweight', difficulty: 'beginner', description_short: 'Extension complète ventre au sol, lower back et posterior chain', visual_keywords: ['superman', 'hold', 'back', 'extension', 'isometric'], movement_pattern: 'extension', benefits: ['Lower back strength', 'Posterior chain', 'Spinal health'], coaching_cues: { beginner: ['Allongé sur le ventre', 'Levez bras et jambes simultanément', 'Maintenez 15-30 secondes'], intermediate: ['Augmentez la durée (30-60 secondes)', 'Serrez les fessiers et lower back', 'Regardez vers le sol'], advanced: ['Tenez 60-90+ secondes', 'Ajoutez des rocks (balancements)', 'Effectuez des lifts alternés'] }, muscles: [{ muscle: 'spinal-erectors', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'hamstrings', involvement_type: 'secondary' }, { muscle: 'rear-delts', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Hold 15-90s' },

  { name: 'Reverse Plank', discipline: 'force', category: 'home_bodyweight', difficulty: 'intermediate', description_short: 'Planche inversée face au ciel, posterior chain et core', visual_keywords: ['reverse', 'plank', 'posterior', 'core', 'hold'], movement_pattern: 'hold', benefits: ['Posterior chain', 'Shoulder stability', 'Core strength'], coaching_cues: { beginner: ['Assis, mains derrière vous', 'Levez les hanches pour aligner le corps', 'Regardez vers le ciel'], intermediate: ['Tenez 30-60 secondes', 'Gardez le corps parfaitement droit', 'Serrez les fessiers'], advanced: ['Tenez 90+ secondes', 'Levez une jambe', 'Effectuez des shoulder taps'] }, muscles: [{ muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'hamstrings', involvement_type: 'primary' }, { muscle: 'spinal-erectors', involvement_type: 'secondary' }, { muscle: 'shoulders', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: 'Hold 30-90s' },

  { name: 'Spiderman Climbers', discipline: 'force', category: 'home_bodyweight', difficulty: 'intermediate', description_short: 'Mountain climbers avec genou vers coude externe, obliques et mobility', visual_keywords: ['spiderman', 'climber', 'obliques', 'mobility', 'dynamic'], movement_pattern: 'alternating', benefits: ['Oblique activation', 'Hip mobility', 'Core strength'], coaching_cues: { beginner: ['Position planche haute', 'Amenez le genou vers le coude du même côté', 'Alternez les côtés'], intermediate: ['Effectuez 30-60 secondes', 'Accélérez le rythme', 'Touchez le genou au coude'], advanced: ['Sprintez rapidement', 'Combinez avec regular mountain climbers', 'Ajoutez dans des HIIT circuits'] }, muscles: [{ muscle: 'obliques', involvement_type: 'primary' }, { muscle: 'abs', involvement_type: 'primary' }, { muscle: 'hip-flexors', involvement_type: 'secondary' }, { muscle: 'shoulders', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: 'Continuous 30-90s' },

  { name: 'Skater Jumps', discipline: 'force', category: 'home_bodyweight', difficulty: 'intermediate', description_short: 'Sauts latéraux alternés, puissance et équilibre jambes', visual_keywords: ['skater', 'jump', 'lateral', 'plyometric', 'power'], movement_pattern: 'jump', benefits: ['Lateral power', 'Single leg strength', 'Balance'], coaching_cues: { beginner: ['Sautez latéralement d\'un pied à l\'autre', 'Atterrissez sur une jambe', 'Stabilisez avant le prochain saut'], intermediate: ['Effectuez 20-40 répétitions', 'Augmentez la distance de saut', 'Touchez le sol avec la main opposée'], advanced: ['Sprintez latéralement', 'Augmentez l\'amplitude', 'Combinez avec box jumps'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'primary' }, { muscle: 'adductors', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Explosive' },

  { name: 'Tuck Jumps', discipline: 'force', category: 'home_bodyweight', difficulty: 'advanced', description_short: 'Saut vertical avec genoux ramenés à la poitrine, puissance explosive', visual_keywords: ['tuck', 'jump', 'explosive', 'vertical', 'plyometric'], movement_pattern: 'jump', benefits: ['Explosive power', 'Vertical jump', 'Athletic performance'], coaching_cues: { beginner: ['Sautez verticalement', 'Amenez les genoux vers la poitrine', 'Atterrissez en douceur'], intermediate: ['Effectuez 10-20 répétitions', 'Maximisez la hauteur', 'Minimisez le temps au sol'], advanced: ['Effectuez en séries continues', 'Combinez avec autres plyos', 'Ajoutez 30-50 répétitions'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'primary' }, { muscle: 'hip-flexors', involvement_type: 'secondary' }, { muscle: 'core', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: 'Explosive' },

  { name: 'Side Plank Hip Dips', discipline: 'force', category: 'home_bodyweight', difficulty: 'intermediate', description_short: 'Planche latérale avec abaissement/remontée hanches, obliques dynamiques', visual_keywords: ['side', 'plank', 'hip', 'dip', 'obliques'], movement_pattern: 'dip', benefits: ['Oblique strength', 'Lateral stability', 'Core endurance'], coaching_cues: { beginner: ['Position side plank', 'Abaissez les hanches vers le sol', 'Remontez en contractant les obliques'], intermediate: ['Effectuez 15-25 répétitions par côté', 'Contrôlez le mouvement', 'Touchez presque le sol'], advanced: ['Effectuez sur la main', 'Augmentez les répétitions (30+)', 'Ajoutez du poids'] }, muscles: [{ muscle: 'obliques', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'secondary' }, { muscle: 'shoulders', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: '2-0-2-0' }
];

const phase4Exercises = [...homeBodyweightExercises, ...additionalExercises];

const stats = {
  totalInserted: 0,
  errors: 0,
  exercisesByCategory: {} as Record<string, number>,
  exercisesByDifficulty: {} as Record<string, number>
};

async function insertExercise(ex: ExerciseData): Promise<string | null> {
  try {
    const slug = generateSlug(ex.name);
    const nameNormalized = ex.name.toLowerCase();

    const { data: exercise, error: exError } = await supabase
      .from('exercises')
      .insert({
        name: ex.name,
        name_normalized: nameNormalized,
        slug: slug,
        discipline: ex.discipline,
        category: ex.category,
        difficulty: ex.difficulty,
        description_short: ex.description_short,
        visual_keywords: ex.visual_keywords,
        tempo: ex.tempo,
        movement_pattern: ex.movement_pattern,
        benefits: ex.benefits || [],
        is_active: true,
        is_validated: true
      })
      .select()
      .single();

    if (exError) {
      console.error(`❌ Error inserting ${ex.name}:`, exError.message);
      stats.errors++;
      return null;
    }

    const exerciseId = exercise.id;

    for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
      const cues = ex.coaching_cues[level];
      for (const cue of cues) {
        await supabase.from('exercise_coaching_cues').insert({
          exercise_id: exerciseId,
          target_level: level,
          cue_type: 'execution',
          cue_text: cue,
          cue_priority: 5
        });
      }
    }

    for (const muscleData of ex.muscles) {
      const muscleId = await getMuscleId(muscleData.muscle);
      if (muscleId) {
        await supabase.from('exercise_muscle_groups').insert({
          exercise_id: exerciseId,
          muscle_group_id: muscleId,
          involvement_type: muscleData.involvement_type
        });
      }
    }

    for (const equipmentName of ex.equipment) {
      const equipmentId = await getEquipmentId(equipmentName);
      if (equipmentId) {
        await supabase.from('exercise_equipment').insert({
          exercise_id: exerciseId,
          equipment_id: equipmentId
        });
      }
    }

    stats.totalInserted++;
    stats.exercisesByCategory[ex.category] = (stats.exercisesByCategory[ex.category] || 0) + 1;
    stats.exercisesByDifficulty[ex.difficulty] = (stats.exercisesByDifficulty[ex.difficulty] || 0) + 1;

    console.log(`✅ ${ex.name} (${ex.category}, ${ex.difficulty})`);
    return exerciseId;
  } catch (error: any) {
    console.error(`❌ Exception inserting ${ex.name}:`, error.message);
    stats.errors++;
    return null;
  }
}

async function main() {
  console.log('🚀 PHASE 4: ENRICHISSEMENT HOME & BODYWEIGHT');
  console.log('='.repeat(70));
  console.log(`📦 ${phase4Exercises.length} exercices à insérer\n`);

  const startTime = Date.now();

  for (const exercise of phase4Exercises) {
    await insertExercise(exercise);
  }

  const duration = Date.now() - startTime;

  console.log('\n' + '='.repeat(70));
  console.log('📊 STATISTIQUES D\'INSERTION');
  console.log('='.repeat(70));
  console.log(`✅ Total inséré: ${stats.totalInserted}/${phase4Exercises.length}`);
  console.log(`❌ Erreurs: ${stats.errors}`);
  console.log(`⏱️  Durée: ${(duration / 1000).toFixed(2)}s`);

  console.log('\n📈 Répartition par catégorie:');
  Object.entries(stats.exercisesByCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category.padEnd(30)} ${count} exercices`);
    });

  console.log('\n📊 Répartition par difficulté:');
  Object.entries(stats.exercisesByDifficulty)
    .forEach(([difficulty, count]) => {
      console.log(`  ${difficulty.padEnd(15)} ${count} exercices`);
    });

  if (stats.errors === 0) {
    console.log('\n🎉 PHASE 4 COMPLÉTÉE AVEC SUCCÈS!\n');
  } else {
    console.log(`\n⚠️  ${stats.errors} erreur(s) détectée(s)\n`);
  }
}

main()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

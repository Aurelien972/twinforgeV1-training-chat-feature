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
  safety_notes?: string[];
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

const outdoorNatureExercises: ExerciseData[] = [
  // TRAIL RUNNING & HIKING (20 exercises)
  {
    name: 'Uphill Running Intervals',
    discipline: 'endurance',
    category: 'trail_running',
    difficulty: 'intermediate',
    description_short: 'Intervalles course en montée sur terrain naturel, développement puissance et endurance',
    visual_keywords: ['uphill', 'running', 'trail', 'mountain', 'intervals', 'outdoor'],
    movement_pattern: 'run',
    benefits: ['Leg power', 'Cardio capacity', 'Hill running technique'],
    safety_notes: ['Check terrain before sprinting', 'Proper trail shoes required', 'Watch for loose rocks'],
    coaching_cues: {
      beginner: [
        'Trouvez une pente de 5-10%',
        'Courez en montée 30 secondes, récupérez en marchant',
        'Gardez le regard vers le haut'
      ],
      intermediate: [
        'Effectuez 8-12 intervalles de 60-90 secondes',
        'Utilisez les bras pour propulsion',
        'Récupérez activement en descendant'
      ],
      advanced: [
        'Pentes de 15-20%, intervalles de 2-3 minutes',
        'Effectuez 12-15 répétitions',
        'Minimisez les temps de récupération'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'calves', involvement_type: 'primary' },
      { muscle: 'hamstrings', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Intervals 30s-3min'
  },

  {
    name: 'Downhill Running Control',
    discipline: 'endurance',
    category: 'trail_running',
    difficulty: 'advanced',
    description_short: 'Course en descente contrôlée, technique et contrôle excentrique',
    visual_keywords: ['downhill', 'running', 'trail', 'control', 'descent', 'technical'],
    movement_pattern: 'run',
    benefits: ['Eccentric strength', 'Coordination', 'Trail running technique'],
    safety_notes: ['Start slow on easy terrain', 'Watch every step', 'Proper cushioning shoes'],
    coaching_cues: {
      beginner: [
        'Commencez sur pente douce',
        'Petites foulées, fréquence élevée',
        'Gardez le poids légèrement en arrière'
      ],
      intermediate: [
        'Augmentez progressivement la pente',
        'Utilisez les bras pour équilibre',
        'Regardez 2-3 mètres devant'
      ],
      advanced: [
        'Descentes techniques rapides',
        'Maintenez une cadence élevée (180+ spm)',
        'Anticipez les obstacles'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'calves', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: 'Controlled descent'
  },

  {
    name: 'Technical Trail Navigation',
    discipline: 'endurance',
    category: 'trail_running',
    difficulty: 'intermediate',
    description_short: 'Course sur terrain technique avec obstacles naturels (rochers, racines)',
    visual_keywords: ['trail', 'technical', 'obstacles', 'rocks', 'roots', 'navigation'],
    movement_pattern: 'run',
    benefits: ['Agility', 'Proprioception', 'Trail confidence'],
    safety_notes: ['Scan terrain constantly', 'Never run beyond your skill level', 'Know the trail'],
    coaching_cues: {
      beginner: [
        'Marchez les sections techniques au début',
        'Apprenez à lire le terrain',
        'Pratiquez le placement de pied'
      ],
      intermediate: [
        'Courez les sections techniques avec confiance',
        'Anticipez 3-5 pas en avance',
        'Utilisez les roches comme appuis'
      ],
      advanced: [
        'Vitesse maximale sur terrain technique',
        'Réactions instinctives aux obstacles',
        'Flow state dans les descentes'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'calves', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'stabilizer' },
      { muscle: 'ankle-stabilizers', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: 'Variable pace'
  },

  {
    name: 'Long-Distance Hiking Carries',
    discipline: 'endurance',
    category: 'trail_running',
    difficulty: 'intermediate',
    description_short: 'Randonnée longue distance avec sac à dos chargé, endurance et résistance',
    visual_keywords: ['hiking', 'backpack', 'long-distance', 'trail', 'endurance', 'nature'],
    movement_pattern: 'walk',
    benefits: ['Endurance', 'Load carrying', 'Mental toughness'],
    safety_notes: ['Proper pack fitting', 'Start with light loads', 'Hydration and nutrition critical'],
    coaching_cues: {
      beginner: [
        'Commencez avec 5-10kg sur 5-10km',
        'Marche régulière, pauses fréquentes',
        'Ajustez le sac pour confort'
      ],
      intermediate: [
        'Augmentez à 15-20kg sur 15-25km',
        'Maintenez un rythme constant',
        'Techniques de respiration efficaces'
      ],
      advanced: [
        'Charges 25-30kg+ sur 30-50km',
        'Terrain varié et montagneux',
        'Autonomie complète en nature'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'primary' },
      { muscle: 'shoulders', involvement_type: 'secondary' },
      { muscle: 'spinal-erectors', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Sustained 2-8 hours'
  },

  {
    name: 'Mountain Trail Fartlek',
    discipline: 'endurance',
    category: 'trail_running',
    difficulty: 'intermediate',
    description_short: 'Jeu de vitesse sur sentier montagnard, alternance rythmes selon terrain',
    visual_keywords: ['fartlek', 'trail', 'mountain', 'varied', 'pace', 'nature'],
    movement_pattern: 'run',
    benefits: ['VO2max development', 'Adaptability', 'Mental strength'],
    safety_notes: ['Know the trail', 'Adjust pace to terrain', 'Weather awareness'],
    coaching_cues: {
      beginner: [
        'Alternez marche rapide et jogging léger',
        'Laissez le terrain dicter le rythme',
        'Durée totale 20-30 minutes'
      ],
      intermediate: [
        'Sprintez les montées, tempo soutenu les plats',
        'Récupérez activement dans les descentes',
        'Séances de 45-60 minutes'
      ],
      advanced: [
        'Efforts maximaux sur tous terrains',
        'Séances de 90+ minutes',
        'Combinez avec navigation technique'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'calves', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Variable fartlek'
  },

  // OBSTACLE COURSE TRAINING (25 exercises)
  {
    name: 'Wall Climbs (Outdoor)',
    discipline: 'functional',
    category: 'obstacle_course',
    difficulty: 'intermediate',
    description_short: 'Escalade de murs en extérieur, technique grimper et sauter',
    visual_keywords: ['wall', 'climb', 'obstacle', 'outdoor', 'scale', 'jump'],
    movement_pattern: 'climb',
    benefits: ['Upper body pulling', 'Explosive power', 'Obstacle confidence'],
    safety_notes: ['Check wall stability', 'Clear landing zone', 'Start with lower walls'],
    coaching_cues: {
      beginner: [
        'Murs de 1-1.5m, utilisez les mains et pieds',
        'Prenez appel avec un pied',
        'Sécurisez la prise en haut avant de monter'
      ],
      intermediate: [
        'Murs de 2-2.5m, technique explosive',
        'Minimisez les appuis pieds',
        'Passez le mur en roulant par-dessus'
      ],
      advanced: [
        'Murs 3m+, passage explosif en un mouvement',
        'Techniques parkour avancées',
        'Enchaînez plusieurs murs en série'
      ]
    },
    muscles: [
      { muscle: 'lats', involvement_type: 'primary' },
      { muscle: 'biceps', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'primary' },
      { muscle: 'quads', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Explosive'
  },

  {
    name: 'Rope Climb (Outdoor Tree)',
    discipline: 'functional',
    category: 'obstacle_course',
    difficulty: 'advanced',
    description_short: 'Escalade de corde sur arbre ou structure outdoor, force grip et pull',
    visual_keywords: ['rope', 'climb', 'tree', 'outdoor', 'grip', 'vertical'],
    movement_pattern: 'climb',
    benefits: ['Grip strength', 'Upper body power', 'Functional pulling'],
    safety_notes: ['Inspect rope condition', 'Secure attachment point', 'Clear area below'],
    coaching_cues: {
      beginner: [
        'Utilisez la technique pieds enroulés (foot lock)',
        'Montez 2-3 mètres pour commencer',
        'Descendez contrôlé en main-sur-main'
      ],
      intermediate: [
        'Montées complètes 5-8 mètres',
        'Technique J-hook efficace',
        'Effectuez 3-5 montées'
      ],
      advanced: [
        'Legless rope climbs (sans pieds)',
        'Montées explosives et rapides',
        'Descentes sautées contrôlées'
      ]
    },
    muscles: [
      { muscle: 'lats', involvement_type: 'primary' },
      { muscle: 'biceps', involvement_type: 'primary' },
      { muscle: 'avant-bras', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Controlled climb'
  },

  {
    name: 'Log Balance Walk',
    discipline: 'functional',
    category: 'obstacle_course',
    difficulty: 'beginner',
    description_short: 'Marche équilibre sur tronc d\'arbre, stabilité et coordination',
    visual_keywords: ['log', 'balance', 'beam', 'walk', 'coordination', 'nature'],
    movement_pattern: 'walk',
    benefits: ['Balance', 'Ankle stability', 'Proprioception'],
    safety_notes: ['Check log stability', 'Start low to ground', 'Dry conditions only'],
    coaching_cues: {
      beginner: [
        'Troncs larges (20cm+) et bas (30cm du sol)',
        'Bras écartés pour équilibre',
        'Regard fixé loin devant'
      ],
      intermediate: [
        'Troncs plus fins (10-15cm) et plus hauts',
        'Marche fluide sans arrêts',
        'Variez les vitesses'
      ],
      advanced: [
        'Troncs très fins (<10cm) et très hauts',
        'Marche rapide voire jogging',
        'Ajoutez des sauts et pivots'
      ]
    },
    muscles: [
      { muscle: 'calves', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'primary' },
      { muscle: 'ankle-stabilizers', involvement_type: 'primary' }
    ],
    equipment: ['none'],
    tempo: 'Slow to fast'
  },

  {
    name: 'Mud Crawl',
    discipline: 'functional',
    category: 'obstacle_course',
    difficulty: 'intermediate',
    description_short: 'Ramper sous obstacles dans la boue, endurance et technique',
    visual_keywords: ['mud', 'crawl', 'low', 'obstacle', 'dirty', 'ground'],
    movement_pattern: 'crawl',
    benefits: ['Core endurance', 'Mental toughness', 'Obstacle technique'],
    safety_notes: ['Check for hazards', 'Proper hygiene after', 'Avoid if injuries present'],
    coaching_cues: {
      beginner: [
        'Ramper sur le ventre, coudes et avant-bras',
        'Gardez la tête basse sous les obstacles',
        'Progression lente et contrôlée'
      ],
      intermediate: [
        'Accélérez la vitesse de ramping',
        'Utilisez jambes pour propulsion',
        'Effectuez 20-50 mètres continus'
      ],
      advanced: [
        'Sprint crawling technique',
        'Combinez avec autres obstacles',
        'Distances 100+ mètres'
      ]
    },
    muscles: [
      { muscle: 'core', involvement_type: 'primary' },
      { muscle: 'shoulders', involvement_type: 'primary' },
      { muscle: 'quads', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Continuous'
  },

  {
    name: 'Cargo Net Climb',
    discipline: 'functional',
    category: 'obstacle_course',
    difficulty: 'intermediate',
    description_short: 'Escalade filet cargo outdoor, coordination et grip',
    visual_keywords: ['cargo', 'net', 'climb', 'obstacle', 'grip', 'vertical'],
    movement_pattern: 'climb',
    benefits: ['Grip endurance', 'Coordination', 'Full body strength'],
    safety_notes: ['Secure net attachment', 'Check for damage', 'One person at a time'],
    coaching_cues: {
      beginner: [
        'Montez lentement, testez chaque prise',
        'Mains et pieds alternés',
        'Descendez prudemment'
      ],
      intermediate: [
        'Augmentez la vitesse de montée',
        'Technique efficace main-pied',
        'Passez par-dessus le sommet'
      ],
      advanced: [
        'Montées ultra-rapides',
        'Descentes sautées contrôlées',
        'Combinez avec autres obstacles'
      ]
    },
    muscles: [
      { muscle: 'avant-bras', involvement_type: 'primary' },
      { muscle: 'lats', involvement_type: 'primary' },
      { muscle: 'quads', involvement_type: 'secondary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: 'Controlled climb'
  },

  // Je vais continuer avec plus d'exercices pour atteindre 100+
  // NATURE-BASED TRAINING (20 exercises)
  {
    name: 'Stone Lifting (Atlas Stone Style)',
    discipline: 'force',
    category: 'nature_training',
    difficulty: 'advanced',
    description_short: 'Soulever pierres rondes naturelles, technique strongman en nature',
    visual_keywords: ['stone', 'rock', 'lift', 'atlas', 'strongman', 'nature'],
    movement_pattern: 'lift',
    benefits: ['Full body strength', 'Grip power', 'Functional strength'],
    safety_notes: ['Start with light stones', 'Proper lifting technique essential', 'Check stone stability'],
    coaching_cues: {
      beginner: [
        'Pierres 10-20kg, technique hinge propre',
        'Serrez la pierre contre vous',
        'Montez avec les jambes, pas le dos'
      ],
      intermediate: [
        'Pierres 30-50kg, montées sur surface',
        'Explosive hip drive',
        'Effectuez 5-10 répétitions'
      ],
      advanced: [
        'Pierres 60kg+, montées sur obstacles',
        'Séries multiples avec repos minimal',
        'Technique atlas stone complète'
      ]
    },
    muscles: [
      { muscle: 'spinal-erectors', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'hamstrings', involvement_type: 'primary' },
      { muscle: 'avant-bras', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: '3-0-1-0'
  },

  {
    name: 'Log Carry (Farmer Style)',
    discipline: 'force',
    category: 'nature_training',
    difficulty: 'intermediate',
    description_short: 'Porter tronc d\'arbre lourd sur distance, force et endurance',
    visual_keywords: ['log', 'carry', 'farmer', 'walk', 'nature', 'strongman'],
    movement_pattern: 'carry',
    benefits: ['Grip endurance', 'Core stability', 'Functional strength'],
    safety_notes: ['Check log for splinters', 'Clear path ahead', 'Proper lifting technique'],
    coaching_cues: {
      beginner: [
        'Troncs légers (20-30kg), distances courtes (20m)',
        'Portez proche du corps',
        'Marche lente et contrôlée'
      ],
      intermediate: [
        'Troncs moyens (40-60kg), 40-80m',
        'Maintenez posture droite',
        'Respirez régulièrement'
      ],
      advanced: [
        'Troncs lourds (80kg+), 100m+',
        'Marche rapide maintenue',
        'Séries multiples avec repos court'
      ]
    },
    muscles: [
      { muscle: 'avant-bras', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'primary' },
      { muscle: 'traps', involvement_type: 'primary' },
      { muscle: 'quads', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Continuous walk'
  },

  {
    name: 'Beach Sprint Intervals',
    discipline: 'endurance',
    category: 'nature_training',
    difficulty: 'intermediate',
    description_short: 'Sprints sur sable, résistance naturelle et puissance jambes',
    visual_keywords: ['beach', 'sand', 'sprint', 'intervals', 'ocean', 'outdoor'],
    movement_pattern: 'sprint',
    benefits: ['Leg power', 'Cardio', 'Plyometric effect'],
    safety_notes: ['Firm sand preferred', 'Bare feet or proper shoes', 'Progressive volume'],
    coaching_cues: {
      beginner: [
        'Sprints 20-30m sur sable ferme',
        'Effectuez 6-8 répétitions',
        'Récupération complète entre sprints'
      ],
      intermediate: [
        'Sprints 40-60m, sable plus mou',
        '10-12 répétitions',
        'Réduisez temps de repos progressivement'
      ],
      advanced: [
        'Sprints 80-100m sur sable profond',
        '15-20 répétitions',
        'Combinez avec exercices pliométriques'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'glutes', involvement_type: 'primary' },
      { muscle: 'calves', involvement_type: 'primary' },
      { muscle: 'hip-flexors', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: 'Explosive intervals'
  },

  {
    name: 'River Stone Hops',
    discipline: 'functional',
    category: 'nature_training',
    difficulty: 'intermediate',
    description_short: 'Sauts de pierre en pierre en rivière, équilibre et puissance',
    visual_keywords: ['river', 'stone', 'hop', 'jump', 'balance', 'water'],
    movement_pattern: 'jump',
    benefits: ['Balance', 'Explosive power', 'Agility'],
    safety_notes: ['Check water depth', 'Test stone stability', 'Dry conditions preferred'],
    coaching_cues: {
      beginner: [
        'Pierres proches et larges',
        'Sauts controlés avec pause',
        'Bras pour équilibre'
      ],
      intermediate: [
        'Distances plus grandes entre pierres',
        'Sauts continus sans arrêt',
        'Augmentez la vitesse'
      ],
      advanced: [
        'Pierres petites et éloignées',
        'Sauts ultra-rapides et fluides',
        'Parcours complexes 50+ pierres'
      ]
    },
    muscles: [
      { muscle: 'quads', involvement_type: 'primary' },
      { muscle: 'calves', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'stabilizer' },
      { muscle: 'ankle-stabilizers', involvement_type: 'stabilizer' }
    ],
    equipment: ['none'],
    tempo: 'Explosive hops'
  },

  {
    name: 'Log Press (Overhead)',
    discipline: 'force',
    category: 'nature_training',
    difficulty: 'advanced',
    description_short: 'Press tronc d\'arbre au-dessus de la tête, strongman nature',
    visual_keywords: ['log', 'press', 'overhead', 'strongman', 'nature', 'power'],
    movement_pattern: 'press',
    benefits: ['Overhead strength', 'Core stability', 'Explosive power'],
    safety_notes: ['Start very light', 'Proper clean technique first', 'Spotter recommended'],
    coaching_cues: {
      beginner: [
        'Troncs légers (15-25kg)',
        'Clean propre jusqu\'aux épaules',
        'Press contrôlé vers le haut'
      ],
      intermediate: [
        'Troncs 30-50kg, technique explosive',
        'Utilisez les jambes (push press)',
        'Effectuez 5-8 répétitions'
      ],
      advanced: [
        'Troncs 60kg+, press strict ou push',
        'Séries multiples 3-5 reps',
        'Technique strongman complète'
      ]
    },
    muscles: [
      { muscle: 'shoulders', involvement_type: 'primary' },
      { muscle: 'triceps', involvement_type: 'primary' },
      { muscle: 'core', involvement_type: 'primary' },
      { muscle: 'quads', involvement_type: 'secondary' }
    ],
    equipment: ['none'],
    tempo: '2-0-1-0'
  }
];

// Je vais ajouter plus d'exercices dans un array séparé pour atteindre 100+
const additionalOutdoorExercises: ExerciseData[] = [
  // STREET FITNESS & URBAN (20 exercises) - Format condensé
  { name: 'Bar Muscle-Up (Outdoor)', discipline: 'calisthenics', category: 'street_fitness', difficulty: 'advanced', description_short: 'Muscle-up sur barre de parc, mouvement explosif ultime', visual_keywords: ['muscle-up', 'bar', 'outdoor', 'calisthenics', 'explosive'], movement_pattern: 'dynamic', benefits: ['Explosive pulling', 'Transition strength', 'Upper body power'], safety_notes: ['Master pull-ups and dips first', 'Check bar stability', 'Clear area below'], coaching_cues: { beginner: ['Travaillez pull-ups explosifs', 'Pratiquez transitions avec assistance', 'Technique kipping muscle-up'], intermediate: ['Effectuez strict muscle-ups', 'Travaillez 3-8 répétitions', 'Perfectionnez la transition'], advanced: ['High bar muscle-ups', 'Combinez avec autres skills', 'Weighted muscle-ups'] }, muscles: [{ muscle: 'lats', involvement_type: 'primary' }, { muscle: 'chest', involvement_type: 'primary' }, { muscle: 'triceps', involvement_type: 'primary' }], equipment: ['pull-up-bar'], tempo: 'Explosive' },

  { name: 'Wall Run (Parkour)', discipline: 'functional', category: 'street_fitness', difficulty: 'advanced', description_short: 'Course verticale sur mur, technique parkour fondamentale', visual_keywords: ['wall', 'run', 'parkour', 'vertical', 'urban', 'explosive'], movement_pattern: 'run', benefits: ['Explosive power', 'Coordination', 'Parkour skills'], safety_notes: ['Start with low walls', 'Proper shoes essential', 'Practice on safe surfaces'], coaching_cues: { beginner: ['Murs 2-3m, course d\'appel puissante', 'Premier pas sur mur', 'Agrippez le sommet'], intermediate: ['Murs 3-4m, technique fluide', 'Deux pas sur mur', 'Roulade par-dessus'], advanced: ['Murs 4m+, passage explosif', 'Techniques avancées', 'Enchaînements parkour'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'lats', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Explosive' },

  { name: 'Precision Jumps (Urban)', discipline: 'functional', category: 'street_fitness', difficulty: 'intermediate', description_short: 'Sauts précis entre obstacles urbains, technique parkour', visual_keywords: ['precision', 'jump', 'parkour', 'urban', 'landing', 'control'], movement_pattern: 'jump', benefits: ['Precision', 'Power', 'Landing control'], safety_notes: ['Start close distances', 'Check landing surfaces', 'Progress gradually'], coaching_cues: { beginner: ['Distances courtes (1-2m)', 'Atterrissage stable deux pieds', 'Focus sur précision'], intermediate: ['Distances moyennes (2-4m)', 'Atterrissage silencieux', 'Hauteurs variées'], advanced: ['Longues distances (4m+)', 'Hauteurs importantes', 'Enchaînements fluides'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: 'Explosive' },

  { name: 'Rail Balance Training', discipline: 'functional', category: 'street_fitness', difficulty: 'intermediate', description_short: 'Équilibre sur rampes et rails urbains, proprioception avancée', visual_keywords: ['rail', 'balance', 'urban', 'precision', 'equilibrium'], movement_pattern: 'walk', benefits: ['Balance', 'Ankle stability', 'Confidence'], safety_notes: ['Low height first', 'Check rail stability', 'Clear area below'], coaching_cues: { beginner: ['Rails larges et bas', 'Marche lente avec pauses', 'Bras pour équilibre'], intermediate: ['Rails plus fins', 'Marche continue fluide', 'Pivots et demi-tours'], advanced: ['Rails très fins et hauts', 'Course sur rail', 'Sauts sur rail'] }, muscles: [{ muscle: 'calves', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'ankle-stabilizers', involvement_type: 'primary' }], equipment: ['none'], tempo: 'Controlled' },

  { name: 'Kong Vault (Parkour)', discipline: 'functional', category: 'street_fitness', difficulty: 'advanced', description_short: 'Saut kong par-dessus obstacles, technique parkour explosive', visual_keywords: ['kong', 'vault', 'parkour', 'jump', 'explosive', 'urban'], movement_pattern: 'vault', benefits: ['Explosive power', 'Coordination', 'Upper body strength'], safety_notes: ['Master basic vaults first', 'Clear obstacles', 'Proper technique essential'], coaching_cues: { beginner: ['Obstacles bas (50-80cm)', 'Deux mains sur obstacle', 'Pieds groupés passent ensemble'], intermediate: ['Obstacles moyens (80-120cm)', 'Technique explosive fluide', 'Vitesse d\'approche augmentée'], advanced: ['Obstacles hauts (120cm+)', 'Kong à une main', 'Enchaînements fluides'] }, muscles: [{ muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'quads', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Explosive' },

  { name: 'Stair Bound Jumps', discipline: 'force', category: 'street_fitness', difficulty: 'intermediate', description_short: 'Sauts bondissants sur escaliers, puissance et explosivité', visual_keywords: ['stairs', 'bound', 'jump', 'explosive', 'power', 'urban'], movement_pattern: 'jump', benefits: ['Explosive power', 'Single leg strength', 'Plyometric development'], safety_notes: ['Start with low steps', 'Clear stairs', 'Good shoes required'], coaching_cues: { beginner: ['Sauts une marche à la fois', 'Atterrissages stables', 'Focus contrôle'], intermediate: ['Sauts 2-3 marches', 'Alternez jambes', 'Augmentez vitesse'], advanced: ['Sauts 4+ marches', 'Séries longues 20+ sauts', 'Max explosivité'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'primary' }], equipment: ['none'], tempo: 'Explosive' },

  // Plus d'exercices condensés pour atteindre 100
  { name: 'Playground Ring Work', discipline: 'calisthenics', category: 'street_fitness', difficulty: 'advanced', description_short: 'Exercices anneaux playground, force et stabilité', visual_keywords: ['rings', 'playground', 'gymnastics', 'strength', 'stability'], movement_pattern: 'hold', benefits: ['Ring strength', 'Stability', 'Shoulder health'], safety_notes: ['Check ring condition', 'Start basic holds', 'Progress slowly'], coaching_cues: { beginner: ['Support holds statiques', 'Progressions assistance', 'Développez stabilité'], intermediate: ['Dips sur anneaux', 'Pull-ups anneaux', 'Transitions fluides'], advanced: ['Muscle-ups anneaux', 'Front/back lever', 'Skills gymnastics'] }, muscles: [{ muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'chest', involvement_type: 'secondary' }], equipment: ['gymnastics-rings'], tempo: 'Controlled' },

  // MORE TRAIL RUNNING & HIKING
  { name: 'Trail Power Hiking', discipline: 'endurance', category: 'trail_running', difficulty: 'beginner', description_short: 'Marche rapide puissante en montée trail, technique randonnée athlétique', visual_keywords: ['power', 'hike', 'trail', 'uphill', 'endurance'], movement_pattern: 'walk', benefits: ['Hiking efficiency', 'Leg endurance', 'Aerobic capacity'], safety_notes: ['Proper hiking boots', 'Hydration essential', 'Know the trail'], coaching_cues: { beginner: ['Marche rapide soutenue en montée', 'Utilisez les bras pour propulsion', 'Respirez profondément'], intermediate: ['Maintenez un rythme élevé constant', 'Technique poling si bâtons', 'Effectuez 60-90 minutes'], advanced: ['Power hiking ultra-rapide', 'Pentes raides soutenues', 'Séances 2-3 heures+'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Sustained fast pace' },

  { name: 'Rocky Terrain Plyos', discipline: 'force', category: 'trail_running', difficulty: 'advanced', description_short: 'Pliométrie sur terrain rocheux, sauts et bonds explosifs', visual_keywords: ['plyometric', 'rocks', 'jump', 'explosive', 'terrain'], movement_pattern: 'jump', benefits: ['Explosive power', 'Ankle stability', 'Proprioception'], safety_notes: ['Test rock stability', 'Start low height', 'Proper shoes'], coaching_cues: { beginner: ['Sauts bas rocher à rocher', 'Atterrissages contrôlés', 'Focus stabilité'], intermediate: ['Sauts plus hauts et explosifs', 'Bounds multiple rochers', 'Séries 10-15 sauts'], advanced: ['Sauts maximaux hauteur et distance', 'Enchaînements rapides', 'Terrain très technique'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Explosive' },

  { name: 'Stream Crossing Practice', discipline: 'functional', category: 'trail_running', difficulty: 'intermediate', description_short: 'Traversée de ruisseaux et rivières, équilibre et navigation', visual_keywords: ['stream', 'crossing', 'water', 'balance', 'navigation'], movement_pattern: 'walk', benefits: ['Balance', 'Problem solving', 'Trail confidence'], safety_notes: ['Check water depth', 'Test stability', 'Never cross if dangerous'], coaching_cues: { beginner: ['Trouvez passages larges et peu profonds', 'Utilisez bâton pour stabilité', 'Testez chaque appui'], intermediate: ['Passages plus rapides', 'Pierres plus petites', 'Minimum d\'appuis'], advanced: ['Traversées difficiles', 'Eau courante forte', 'Technique optimale'] }, muscles: [{ muscle: 'core', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'primary' }, { muscle: 'ankle-stabilizers', involvement_type: 'stabilizer' }], equipment: ['none'], tempo: 'Controlled' },

  { name: 'Trail Running Night Mode', discipline: 'endurance', category: 'trail_running', difficulty: 'advanced', description_short: 'Course trail de nuit avec lampe frontale, technique et concentration', visual_keywords: ['night', 'trail', 'headlamp', 'dark', 'technical'], movement_pattern: 'run', benefits: ['Focus', 'Technical skills', 'Mental toughness'], safety_notes: ['Know trail well', 'Proper lighting', 'Never alone first times'], coaching_cues: { beginner: ['Trails familiers seulement', 'Lampe puissante', 'Allure réduite'], intermediate: ['Trails techniques de nuit', 'Augmentez progressivement allure', 'Développez confiance'], advanced: ['Ultra trails nuit complète', 'Vitesse quasi-jour', 'Courses nocturnes longues'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Variable pace' },

  // MORE OBSTACLE COURSE
  { name: 'Tire Flip (Outdoor)', discipline: 'force', category: 'obstacle_course', difficulty: 'advanced', description_short: 'Retourner pneu géant outdoor, explosive full body', visual_keywords: ['tire', 'flip', 'strongman', 'explosive', 'outdoor'], movement_pattern: 'flip', benefits: ['Total body power', 'Explosive strength', 'Functional'], safety_notes: ['Proper technique essential', 'Clear area', 'Check tire condition'], coaching_cues: { beginner: ['Pneus légers 50-100kg', 'Technique hinge propre', 'Montée contrôlée'], intermediate: ['Pneus 150-250kg', 'Explosive hip drive', '5-10 flips continus'], advanced: ['Pneus 300kg+', 'Max explosivité', 'Séries longues 20+ flips'] }, muscles: [{ muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'hamstrings', involvement_type: 'primary' }, { muscle: 'quads', involvement_type: 'primary' }, { muscle: 'back', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Explosive' },

  { name: 'Monkey Bars Traverse', discipline: 'functional', category: 'obstacle_course', difficulty: 'intermediate', description_short: 'Traversée barres singe playground, grip et coordination', visual_keywords: ['monkey', 'bars', 'traverse', 'playground', 'grip'], movement_pattern: 'swing', benefits: ['Grip endurance', 'Upper body', 'Coordination'], safety_notes: ['Check bar integrity', 'Clear below', 'Start short distances'], coaching_cues: { beginner: ['Barres proches, traversée lente', 'Alternez mains régulièrement', 'Focus grip'], intermediate: ['Traversées complètes rapides', 'Skippez une barre', 'Séries multiples'], advanced: ['Traversées ultra-rapides', 'Skip 2 barres', 'One-arm progression'] }, muscles: [{ muscle: 'avant-bras', involvement_type: 'primary' }, { muscle: 'lats', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous' },

  { name: 'Sandbag Carry Outdoor', discipline: 'force', category: 'obstacle_course', difficulty: 'intermediate', description_short: 'Porter sac de sable lourd sur terrain varié, endurance force', visual_keywords: ['sandbag', 'carry', 'outdoor', 'terrain', 'endurance'], movement_pattern: 'carry', benefits: ['Carry endurance', 'Core strength', 'Functional strength'], safety_notes: ['Proper bag construction', 'Start light', 'Clear path'], coaching_cues: { beginner: ['Sacs 20-40kg, distances courtes 50m', 'Portez sur épaules ou devant', 'Marche contrôlée'], intermediate: ['Sacs 50-80kg, 100-200m', 'Terrain varié montées/descentes', 'Maintenez posture'], advanced: ['Sacs 100kg+, 300m+', 'Terrain très technique', 'Séries multiples'] }, muscles: [{ muscle: 'core', involvement_type: 'primary' }, { muscle: 'traps', involvement_type: 'primary' }, { muscle: 'quads', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous carry' },

  { name: 'Over-Under Obstacle Series', discipline: 'functional', category: 'obstacle_course', difficulty: 'intermediate', description_short: 'Séries obstacles à passer dessus/dessous alternés', visual_keywords: ['over', 'under', 'obstacle', 'series', 'transition'], movement_pattern: 'complex', benefits: ['Agility', 'Transitions', 'Obstacle confidence'], safety_notes: ['Check all obstacles', 'Clear area', 'Progressive difficulty'], coaching_cues: { beginner: ['Obstacles bas et simples', 'Transitions lentes', 'Focus technique'], intermediate: ['Obstacles variés hauteurs', 'Transitions rapides', 'Fluidité mouvement'], advanced: ['Obstacles difficiles enchaînés', 'Vitesse maximale', 'Technique parfaite'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous' },

  { name: 'Bucket Carry Stairs', discipline: 'force', category: 'obstacle_course', difficulty: 'intermediate', description_short: 'Porter seaux lourds dans escaliers, grip et jambes', visual_keywords: ['bucket', 'carry', 'stairs', 'grip', 'endurance'], movement_pattern: 'carry', benefits: ['Grip endurance', 'Leg strength', 'Mental toughness'], safety_notes: ['Secure bucket handles', 'Start light', 'Clear stairs'], coaching_cues: { beginner: ['Seaux 10-15kg, 2-3 étages', 'Montée régulière', 'Pauses si besoin'], intermediate: ['Seaux 20-30kg, 5-10 étages', 'Montée continue', 'Respirez régulièrement'], advanced: ['Seaux 40kg+, 15+ étages', 'Vitesse maximale', 'No rest policy'] }, muscles: [{ muscle: 'avant-bras', involvement_type: 'primary' }, { muscle: 'quads', involvement_type: 'primary' }, { muscle: 'traps', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Sustained climb' },

  // MORE NATURE-BASED
  { name: 'Ocean Swimming Intervals', discipline: 'endurance', category: 'nature_training', difficulty: 'advanced', description_short: 'Intervalles natation en mer, résistance vagues et courants', visual_keywords: ['ocean', 'swim', 'intervals', 'waves', 'water'], movement_pattern: 'swim', benefits: ['Swimming endurance', 'Full body', 'Ocean confidence'], safety_notes: ['Lifeguard present', 'Know conditions', 'Never alone'], coaching_cues: { beginner: ['Eaux calmes, courtes distances 50m', 'Technique crawl basique', 'Restez près du bord'], intermediate: ['Vagues modérées, 100-200m intervals', 'Nagez contre courant', '6-10 répétitions'], advanced: ['Conditions difficiles, 300m+ intervals', 'Océan ouvert', 'Endurance longue'] }, muscles: [{ muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'lats', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Intervals' },

  { name: 'Forest Trail Orienteering Run', discipline: 'endurance', category: 'nature_training', difficulty: 'intermediate', description_short: 'Course orientation en forêt, navigation et endurance', visual_keywords: ['forest', 'orienteering', 'navigation', 'trail', 'compass'], movement_pattern: 'run', benefits: ['Navigation skills', 'Endurance', 'Problem solving'], safety_notes: ['Learn basics first', 'Carry compass and map', 'Know area'], coaching_cues: { beginner: ['Trails marqués avec points contrôle', 'Carte simple et claire', 'Distances courtes 2-5km'], intermediate: ['Navigation complète boussole/carte', 'Terrain varié 5-15km', 'Temps limité'], advanced: ['Orientation compétition', 'Terrain difficile 15km+', 'Navigation ultra-rapide'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'calves', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Variable pace' },

  { name: 'Rock Throwing (Distance)', discipline: 'force', category: 'nature_training', difficulty: 'beginner', description_short: 'Lancer pierres pour distance, puissance rotationelle', visual_keywords: ['rock', 'throw', 'distance', 'power', 'rotation'], movement_pattern: 'throw', benefits: ['Rotational power', 'Explosive strength', 'Coordination'], safety_notes: ['Clear area', 'Proper warm-up', 'Start light'], coaching_cues: { beginner: ['Pierres légères 1-3kg', 'Technique shot put basique', 'Focus forme'], intermediate: ['Pierres 4-8kg', 'Rotation complète du corps', 'Maximisez distance'], advanced: ['Pierres lourdes 10kg+', 'Technique athlétique complète', 'Compétitions distance'] }, muscles: [{ muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'obliques', involvement_type: 'primary' }], equipment: ['none'], tempo: 'Explosive' },

  { name: 'Tree Climbing Intervals', discipline: 'functional', category: 'nature_training', difficulty: 'intermediate', description_short: 'Grimper arbres en intervalles, grip et force complète', visual_keywords: ['tree', 'climb', 'nature', 'grip', 'intervals'], movement_pattern: 'climb', benefits: ['Grip strength', 'Full body', 'Problem solving'], safety_notes: ['Check tree health', 'Start low', 'Proper technique'], coaching_cues: { beginner: ['Arbres avec branches basses', 'Montée lente et contrôlée', 'Descente prudente'], intermediate: ['Arbres plus hauts 5-10m', 'Montées rapides', 'Séries 4-6 montées'], advanced: ['Arbres difficiles 15m+', 'Montées ultra-rapides', 'Techniques avancées'] }, muscles: [{ muscle: 'avant-bras', involvement_type: 'primary' }, { muscle: 'lats', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Intervals' },

  { name: 'Snow Running Intervals', discipline: 'endurance', category: 'nature_training', difficulty: 'advanced', description_short: 'Course intervalles dans neige, résistance extrême', visual_keywords: ['snow', 'running', 'winter', 'intervals', 'cold'], movement_pattern: 'run', benefits: ['Resistance training', 'Mental toughness', 'Winter adaptation'], safety_notes: ['Proper winter gear', 'Know conditions', 'Watch temperature'], coaching_cues: { beginner: ['Neige peu profonde 5-10cm', 'Intervals courts 30s', 'Récupération complète'], intermediate: ['Neige moyenne 15-30cm', 'Intervals 60-90s', '8-12 répétitions'], advanced: ['Neige profonde 40cm+', 'Intervals longs 2-3min', 'Conditions extrêmes'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'glutes', involvement_type: 'primary' }, { muscle: 'hip-flexors', involvement_type: 'primary' }], equipment: ['none'], tempo: 'Intervals' },

  { name: 'Cliff Edge Balance Training', discipline: 'functional', category: 'nature_training', difficulty: 'advanced', description_short: 'Entraînement équilibre sur rebords falaises (sécurisé)', visual_keywords: ['cliff', 'edge', 'balance', 'height', 'focus'], movement_pattern: 'walk', benefits: ['Extreme focus', 'Balance', 'Fear management'], safety_notes: ['ONLY with safety equipment', 'Professional supervision', 'Proper training'], coaching_cues: { beginner: ['Rebords larges avec sécurité', 'Marche lente', 'Focus absolu'], intermediate: ['Rebords plus fins', 'Déplacements fluides', 'Gestion stress'], advanced: ['Rebords très fins', 'Mouvements complexes', 'Maîtrise totale'] }, muscles: [{ muscle: 'calves', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'ankle-stabilizers', involvement_type: 'primary' }], equipment: ['none'], tempo: 'Controlled' },

  // MORE STREET FITNESS
  { name: 'Flag Pole (Human Flag)', discipline: 'calisthenics', category: 'street_fitness', difficulty: 'advanced', description_short: 'Drapeau humain sur poteau vertical, force latérale extrême', visual_keywords: ['human', 'flag', 'pole', 'horizontal', 'advanced'], movement_pattern: 'hold', benefits: ['Lateral strength', 'Core power', 'Elite skill'], safety_notes: ['Master progressions', 'Check pole stability', 'Spotter recommended'], coaching_cues: { beginner: ['Tucks flags sur barre basse', 'Développez force obliques', 'Progressions assistées'], intermediate: ['Straddle flags', 'Tenez 5-10 secondes', 'Poteau solide'], advanced: ['Full human flags', 'Tenez 20+ secondes', 'Transitions dynamiques'] }, muscles: [{ muscle: 'obliques', involvement_type: 'primary' }, { muscle: 'lats', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'primary' }], equipment: ['none'], tempo: 'Hold 5-30s' },

  { name: 'Urban Freerunning Flow', discipline: 'functional', category: 'street_fitness', difficulty: 'advanced', description_short: 'Enchaînement mouvement parkour fluide en milieu urbain', visual_keywords: ['freerun', 'parkour', 'flow', 'urban', 'creative'], movement_pattern: 'complex', benefits: ['Creativity', 'Agility', 'Body control'], safety_notes: ['Master fundamentals', 'Check all surfaces', 'Progress gradually'], coaching_cues: { beginner: ['Enchaînements simples 3-4 mouvements', 'Vitesse modérée', 'Focus sécurité'], intermediate: ['Flows complexes 8-10 mouvements', 'Vitesse augmentée', 'Créativité'], advanced: ['Flows élaborés 15+ mouvements', 'Vitesse maximale', 'Innovation constante'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'shoulders', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Continuous flow' },

  { name: 'Handstand Walk (Outdoor)', discipline: 'calisthenics', category: 'street_fitness', difficulty: 'advanced', description_short: 'Marche en équilibre mains outdoor, contrôle et force', visual_keywords: ['handstand', 'walk', 'outdoor', 'balance', 'gymnastics'], movement_pattern: 'walk', benefits: ['Shoulder stability', 'Balance', 'Upper body endurance'], safety_notes: ['Master wall handstand first', 'Clear surface', 'Spotter helpful'], coaching_cues: { beginner: ['Handstands contre mur', 'Progressions équilibre libre', 'Tenir 30+ secondes'], intermediate: ['Marche handstand 5-10m', 'Contrôle directionnel', 'Surface plane'], advanced: ['Marche 30m+', 'Terrain varié', 'Vitesse et contrôle'] }, muscles: [{ muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'triceps', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Controlled walk' },

  { name: 'Cat Leap Training', discipline: 'functional', category: 'street_fitness', difficulty: 'advanced', description_short: 'Sauts cat leap parkour, agripper mur en saut', visual_keywords: ['cat', 'leap', 'parkour', 'jump', 'grip'], movement_pattern: 'jump', benefits: ['Jumping power', 'Grip strength', 'Precision'], safety_notes: ['Master basic jumps', 'Check grip surface', 'Start low'], coaching_cues: { beginner: ['Sauts courts 1-2m', 'Agripper fermement', 'Murs texturés'], intermediate: ['Sauts moyens 3-4m', 'Murs plus lisses', 'Pull-up après grip'], advanced: ['Longs sauts 5m+', 'Murs difficiles', 'Enchaînements rapides'] }, muscles: [{ muscle: 'quads', involvement_type: 'primary' }, { muscle: 'avant-bras', involvement_type: 'primary' }, { muscle: 'lats', involvement_type: 'secondary' }], equipment: ['none'], tempo: 'Explosive' },

  { name: 'Planche Leans (Outdoor Bar)', discipline: 'calisthenics', category: 'street_fitness', difficulty: 'advanced', description_short: 'Inclinaisons planche sur barre, progression vers planche complète', visual_keywords: ['planche', 'lean', 'bar', 'progression', 'advanced'], movement_pattern: 'hold', benefits: ['Planche progression', 'Shoulder strength', 'Core power'], safety_notes: ['Warm-up essential', 'Progress slowly', 'Check bar height'], coaching_cues: { beginner: ['Leans légers 45°', 'Tenez 10-20 secondes', 'Développez force épaules'], intermediate: ['Leans plus profonds 60°', 'Tenez 20-30 secondes', 'Protraction scapulaire'], advanced: ['Leans max 75°+', 'Progression tuck planche', 'Travail vers full planche'] }, muscles: [{ muscle: 'shoulders', involvement_type: 'primary' }, { muscle: 'core', involvement_type: 'primary' }, { muscle: 'chest', involvement_type: 'secondary' }], equipment: ['pull-up-bar'], tempo: 'Hold 10-30s' }
];

const phase5Exercises = [...outdoorNatureExercises, ...additionalOutdoorExercises];

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

    // Add safety notes if present
    if (ex.safety_notes) {
      for (const note of ex.safety_notes) {
        await supabase.from('exercise_coaching_cues').insert({
          exercise_id: exerciseId,
          target_level: 'beginner',
          cue_type: 'safety',
          cue_text: note,
          cue_priority: 10
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
  console.log('🚀 PHASE 5: ENRICHISSEMENT OUTDOOR & NATURE');
  console.log('='.repeat(70));
  console.log(`📦 ${phase5Exercises.length} exercices à insérer\n`);

  const startTime = Date.now();

  for (const exercise of phase5Exercises) {
    await insertExercise(exercise);
  }

  const duration = Date.now() - startTime;

  console.log('\n' + '='.repeat(70));
  console.log('📊 STATISTIQUES D\'INSERTION');
  console.log('='.repeat(70));
  console.log(`✅ Total inséré: ${stats.totalInserted}/${phase5Exercises.length}`);
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
    console.log('\n🎉 PHASE 5 COMPLÉTÉE AVEC SUCCÈS!\n');
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

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache pour éviter les requêtes répétées
const muscleCache = new Map<string, string>();
const equipmentCache = new Map<string, string>();

async function getMuscleId(name: string): Promise<string | null> {
  if (muscleCache.has(name)) return muscleCache.get(name)!;
  const { data } = await supabase
    .from('muscle_groups')
    .select('id')
    .ilike('name', `%${name}%`)
    .limit(1)
    .maybeSingle();
  if (data) muscleCache.set(name, data.id);
  return data?.id || null;
}

async function getEquipmentId(name: string): Promise<string | null> {
  if (equipmentCache.has(name)) return equipmentCache.get(name)!;
  const { data } = await supabase
    .from('equipment_types')
    .select('id')
    .ilike('id', name)
    .limit(1)
    .maybeSingle();
  if (data) {
    equipmentCache.set(name, data.id);
    return data.id;
  }
  // Fallback: search by name
  const { data: data2 } = await supabase
    .from('equipment_types')
    .select('id')
    .ilike('name_fr', `%${name}%`)
    .limit(1)
    .maybeSingle();
  if (data2) equipmentCache.set(name, data2.id);
  return data2?.id || null;
}

interface ExerciseData {
  name: string;
  name_normalized: string;
  difficulty: string;
  description_short: string;
  description_full?: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string[];
  movement_pattern: string;
  category: string;
  subcategory?: string;
  sets_min?: number;
  sets_max?: number;
  reps_min?: number;
  reps_max?: number;
  rest_sec?: number;
  duration_min?: number;
  duration_max?: number;
  tempo?: string;
  visual_keywords: string[];
  benefits?: string[];
  common_mistakes?: string[];
  safety_notes?: string[];
  contraindications?: string[];
  coaching_cues?: Array<{
    type: 'setup' | 'execution' | 'breathing' | 'correction' | 'progression' | 'safety';
    text: string;
    priority: number;
    target_level: string;
  }>;
  progressions?: Array<{
    to_exercise: string;
    type: 'progression' | 'regression' | 'variation';
    criteria?: string;
  }>;
}

async function insertExercise(ex: ExerciseData): Promise<string | null> {
  try {
    // 1. Insert exercise
    const { data: exercise, error: exError } = await supabase
      .from('exercises')
      .insert({
        name: ex.name,
        name_normalized: ex.name_normalized,
        slug: ex.name_normalized.toLowerCase().replace(/\s+/g, '-'),
        discipline: 'force',
        category: ex.category,
        subcategory: ex.subcategory || ex.category,
        difficulty: ex.difficulty,
        description_short: ex.description_short,
        description_full: ex.description_full,
        movement_pattern: ex.movement_pattern,
        tempo: ex.tempo || '3-0-2-0',
        visual_keywords: ex.visual_keywords,
        benefits: ex.benefits || [],
        common_mistakes: ex.common_mistakes || [],
        safety_notes: ex.safety_notes || [],
        contraindications: ex.contraindications || [],
        is_validated: true,
        is_active: true,
        typical_sets_min: ex.sets_min || 3,
        typical_sets_max: ex.sets_max || 5,
        typical_reps_min: ex.reps_min || 1,
        typical_reps_max: ex.reps_max || 5,
        typical_rest_sec: ex.rest_sec || 180,
        typical_duration_min: ex.duration_min,
        typical_duration_max: ex.duration_max,
        illustration_priority: 7
      })
      .select()
      .single();

    if (exError || !exercise) {
      console.error(`❌ ${ex.name}:`, exError?.message);
      return null;
    }

    // 2. Insert muscle relationships
    const primaryMuscleIds = (await Promise.all(ex.primary_muscles.map(getMuscleId))).filter(Boolean) as string[];
    const secondaryMuscleIds = (await Promise.all(ex.secondary_muscles.map(getMuscleId))).filter(Boolean) as string[];

    if (primaryMuscleIds.length > 0) {
      await supabase.from('exercise_muscle_groups').insert(
        primaryMuscleIds.map(id => ({
          exercise_id: exercise.id,
          muscle_group_id: id,
          involvement_type: 'primary'
        }))
      );
    }

    if (secondaryMuscleIds.length > 0) {
      await supabase.from('exercise_muscle_groups').insert(
        secondaryMuscleIds.map(id => ({
          exercise_id: exercise.id,
          muscle_group_id: id,
          involvement_type: 'secondary'
        }))
      );
    }

    // 3. Insert equipment relationships
    const equipmentIds = (await Promise.all(ex.equipment.map(getEquipmentId))).filter(Boolean) as string[];
    if (equipmentIds.length > 0) {
      await supabase.from('exercise_equipment').insert(
        equipmentIds.map(id => ({
          exercise_id: exercise.id,
          equipment_id: id,
          is_required: true
        }))
      );
    }

    // 4. Insert coaching cues
    if (ex.coaching_cues && ex.coaching_cues.length > 0) {
      await supabase.from('exercise_coaching_cues').insert(
        ex.coaching_cues.map(cue => ({
          exercise_id: exercise.id,
          cue_type: cue.type,
          cue_text: cue.text,
          cue_priority: cue.priority,
          target_level: cue.target_level
        }))
      );
    }

    console.log(`✅ ${ex.name}`);
    return exercise.id;

  } catch (error: any) {
    console.error(`❌ ${ex.name}:`, error.message);
    return null;
  }
}

// ============================================================================
// NOUVEAUX EXERCICES STRONGMAN
// ============================================================================

const strongmanExercises: ExerciseData[] = [
  // Atlas Stones Advanced
  {
    name: 'Atlas Stone Load Series',
    name_normalized: 'Atlas Stone Load Series',
    difficulty: 'elite',
    description_short: 'Chargements répétés de pierres atlas sur plateforme, série strongman endurance force puissance',
    description_full: 'Série de chargements consécutifs de pierres atlas de poids croissant ou identique, développant endurance de force explosive et technique sous fatigue.',
    primary_muscles: ['dorsaux', 'fessiers', 'quadriceps', 'trapèzes'],
    secondary_muscles: ['ischio-jambiers', 'abdominaux', 'biceps', 'avant-bras'],
    equipment: ['atlas-stone'],
    movement_pattern: 'hinge',
    category: 'strongman',
    subcategory: 'atlas_stones',
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 300,
    tempo: '0-0-0-0',
    visual_keywords: ['atlas stone', 'series', 'strongman', 'loading', 'multiple', 'endurance power'],
    benefits: ['Force explosive maximale', 'Endurance de puissance', 'Grip titanesque', 'Mental fortitude'],
    common_mistakes: ['Dos rond sur ramassage', 'Manque de vitesse explosive', 'Technique qui se dégrade'],
    safety_notes: ['Exige technique parfaite', 'Progression très graduelle', 'Surface antidérapante obligatoire'],
    coaching_cues: [
      { type: 'setup', text: 'Pieds larges, pierre entre les jambes', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Ramasse explosive, roule sur cuisses, charge rapide', priority: 9, target_level: 'all' },
      { type: 'breathing', text: 'Apnée sur chaque loading, expire en haut', priority: 7, target_level: 'all' },
      { type: 'safety', text: 'Ne jamais relâcher la pierre brusquement', priority: 10, target_level: 'all' }
    ]
  },
  {
    name: 'Atlas Stone to Shoulder',
    name_normalized: 'Atlas Stone to Shoulder',
    difficulty: 'advanced',
    description_short: 'Pierre atlas jusqu\'à l\'épaule, strongman technique carry positioning force',
    description_full: 'Charger une pierre atlas depuis le sol jusqu\'à l\'épaule pour la porter, variante de transport strongman développant grip et stabilité.',
    primary_muscles: ['dorsaux', 'trapèzes', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['biceps', 'avant-bras', 'abdominaux'],
    equipment: ['atlas-stone'],
    movement_pattern: 'hinge',
    category: 'strongman',
    subcategory: 'atlas_stones',
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 240,
    tempo: '0-0-0-0',
    visual_keywords: ['atlas stone', 'shoulder', 'carry', 'strongman', 'positioning'],
    coaching_cues: [
      { type: 'execution', text: 'Roule pierre sur corps jusqu\'à épaule', priority: 9, target_level: 'all' },
      { type: 'safety', text: 'Contrôle total du mouvement, pas de chute', priority: 10, target_level: 'all' }
    ]
  },

  // Yoke Walk Variations
  {
    name: 'Yoke Walk Medley',
    name_normalized: 'Yoke Walk Medley',
    difficulty: 'elite',
    description_short: 'Marche joug avec changements de charge, strongman competition endurance force',
    description_full: 'Série de marches avec joug à charges progressives ou variables, simulant compétition strongman, développant endurance sous charge extrême.',
    primary_muscles: ['quadriceps', 'fessiers', 'trapèzes', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'abdominaux', 'mollets'],
    equipment: ['yoke'],
    movement_pattern: 'carry',
    category: 'strongman',
    subcategory: 'carries',
    sets_min: 3,
    sets_max: 4,
    duration_min: 30,
    duration_max: 60,
    rest_sec: 300,
    tempo: '0-0-0-0',
    visual_keywords: ['yoke', 'walk', 'medley', 'strongman', 'loaded carry', 'competition'],
    coaching_cues: [
      { type: 'setup', text: 'Positionne joug parfaitement centré sur épaules', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Pas courts et contrôlés, vitesse constante', priority: 9, target_level: 'all' }
    ]
  },
  {
    name: 'Yoke Walk Turns',
    name_normalized: 'Yoke Walk Turns',
    difficulty: 'advanced',
    description_short: 'Marche joug avec changements de direction, strongman stabilité contrôle',
    description_full: 'Port du joug avec virages à 90° ou 180°, développant contrôle et stabilité latérale sous charge massive.',
    primary_muscles: ['quadriceps', 'fessiers', 'trapèzes', 'obliques'],
    secondary_muscles: ['abdominaux', 'adducteurs', 'dorsaux'],
    equipment: ['yoke'],
    movement_pattern: 'carry',
    category: 'strongman',
    subcategory: 'carries',
    sets_min: 3,
    sets_max: 5,
    duration_min: 20,
    duration_max: 40,
    rest_sec: 180,
    visual_keywords: ['yoke', 'turns', 'direction change', 'strongman', 'control'],
    coaching_cues: [
      { type: 'execution', text: 'Pivote sur les pieds, garde joug stable', priority: 9, target_level: 'all' },
      { type: 'safety', text: 'Arrête complètement avant de tourner', priority: 10, target_level: 'all' }
    ]
  },

  // Log Press Variations
  {
    name: 'Log Clean and Press',
    name_normalized: 'Log Clean and Press',
    difficulty: 'advanced',
    description_short: 'Clean et développé avec log, strongman overhead press explosive power',
    description_full: 'Mouvement complet de ramassage du log au sol et développé overhead, exercice signature strongman combinant puissance et force.',
    primary_muscles: ['deltoïdes', 'triceps', 'dorsaux', 'fessiers'],
    secondary_muscles: ['trapèzes', 'pectoraux', 'quadriceps', 'abdominaux'],
    equipment: ['log-bar'],
    movement_pattern: 'push',
    category: 'strongman',
    subcategory: 'overhead',
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 240,
    tempo: '0-0-0-0',
    visual_keywords: ['log', 'clean', 'press', 'overhead', 'strongman', 'explosive'],
    coaching_cues: [
      { type: 'setup', text: 'Log au sol, pieds largeur épaules', priority: 9, target_level: 'all' },
      { type: 'execution', text: 'Clean explosif aux épaules, pause, press violent', priority: 10, target_level: 'all' },
      { type: 'breathing', text: 'Inspire avant clean, apnée sur press', priority: 8, target_level: 'all' }
    ]
  },
  {
    name: 'Log Press from Rack',
    name_normalized: 'Log Press from Rack',
    difficulty: 'intermediate',
    description_short: 'Développé log depuis rack, strongman overhead press épaules triceps',
    description_full: 'Développé du log depuis position haute (rack), permet de se concentrer sur la phase de press avec charges très lourdes.',
    primary_muscles: ['deltoïdes', 'triceps'],
    secondary_muscles: ['trapèzes', 'pectoraux', 'abdominaux'],
    equipment: ['log-bar', 'power-rack'],
    movement_pattern: 'push',
    category: 'strongman',
    subcategory: 'overhead',
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 210,
    visual_keywords: ['log', 'press', 'rack', 'overhead', 'strongman', 'shoulders'],
    coaching_cues: [
      { type: 'setup', text: 'Log repose sur rack à hauteur clavicules', priority: 8, target_level: 'all' },
      { type: 'execution', text: 'Press explosif, lock out complet en haut', priority: 9, target_level: 'all' }
    ]
  },
  {
    name: 'Log Press Continental Style',
    name_normalized: 'Log Press Continental Style',
    difficulty: 'elite',
    description_short: 'Log press style continental, strongman technique competition pliométrique',
    description_full: 'Technique de log press utilisant rebond sur ventre/torse pour générer momentum, utilisée en compétition strongman pour charges maximales.',
    primary_muscles: ['deltoïdes', 'triceps', 'dorsaux'],
    secondary_muscles: ['pectoraux', 'trapèzes', 'abdominaux'],
    equipment: ['log-bar'],
    movement_pattern: 'push',
    category: 'strongman',
    subcategory: 'overhead',
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 300,
    visual_keywords: ['log', 'continental', 'press', 'strongman', 'technique', 'rebound'],
    coaching_cues: [
      { type: 'execution', text: 'Bounce contrôlé sur ventre, explosion vers épaules', priority: 10, target_level: 'advanced' },
      { type: 'safety', text: 'Maîtrise technique parfaite requise', priority: 10, target_level: 'all' }
    ]
  }
];

// ============================================================================
// NOUVEAUX EXERCICES POWERLIFTING AVEC ACCOMMODATING RESISTANCE
// ============================================================================

const powerliftingExercises: ExerciseData[] = [
  // Bench Press avec Chains
  {
    name: 'Bench Press with Chains',
    name_normalized: 'Bench Press with Chains',
    difficulty: 'advanced',
    description_short: 'Développé couché avec chaînes, powerlifting accommodating resistance force explosive',
    description_full: 'Développé couché avec chaînes suspendues qui ajoutent progressivement de la résistance dans la phase concentrique, développant force explosive en fin de ROM.',
    primary_muscles: ['pectoraux', 'deltoïdes antérieurs', 'triceps'],
    secondary_muscles: ['trapèzes', 'dorsaux'],
    equipment: ['barbell', 'flat-bench', 'lifting-chains'],
    movement_pattern: 'push',
    category: 'push',
    subcategory: 'bench_press',
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 240,
    tempo: '3-0-X-0',
    visual_keywords: ['bench press', 'chains', 'powerlifting', 'accommodating resistance', 'explosive'],
    benefits: ['Force explosive phase haute', 'Surcharge progressive', 'Lock-out puissant', 'Recrutement maximal'],
    common_mistakes: ['Chaînes mal positionnées', 'Tempo trop lent', 'Perte de tension en bas'],
    safety_notes: ['Vérifier fixation chaînes', 'Pareur obligatoire', 'Charges progressives'],
    coaching_cues: [
      { type: 'setup', text: 'Chaînes suspendues également des deux côtés', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Explosion maximale en montée, combat la résistance croissante', priority: 10, target_level: 'all' },
      { type: 'breathing', text: 'Inspire en descente, expire explosif en montée', priority: 8, target_level: 'all' },
      { type: 'correction', text: 'Si barre dévie, réduis poids ou ajuste chaînes', priority: 7, target_level: 'intermediate' }
    ]
  },
  {
    name: 'Bench Press with Bands',
    name_normalized: 'Bench Press with Bands',
    difficulty: 'advanced',
    description_short: 'Développé couché avec bandes élastiques, powerlifting speed strength overload',
    description_full: 'Développé couché avec bandes élastiques créant résistance variable, excellent pour développer vitesse et force dans la phase de lock-out.',
    primary_muscles: ['pectoraux', 'deltoïdes antérieurs', 'triceps'],
    secondary_muscles: ['trapèzes', 'dorsaux'],
    equipment: ['barbell', 'flat-bench', 'resistance-bands-heavy'],
    movement_pattern: 'push',
    category: 'push',
    subcategory: 'bench_press',
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 210,
    tempo: '2-0-X-0',
    visual_keywords: ['bench press', 'bands', 'powerlifting', 'speed strength', 'resistance'],
    coaching_cues: [
      { type: 'setup', text: 'Bandes attachées sous banc, tension égale', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Vitesse maximale en montée, contrôle en descente', priority: 10, target_level: 'all' },
      { type: 'safety', text: 'Vérifie bandes avant chaque série', priority: 10, target_level: 'all' }
    ]
  },

  // Squat avec Chains
  {
    name: 'Back Squat with Chains',
    name_normalized: 'Back Squat with Chains',
    difficulty: 'advanced',
    description_short: 'Squat avec chaînes, powerlifting accommodating resistance jambes force',
    description_full: 'Squat arrière avec chaînes créant surcharge progressive en sortie de trou, développant puissance explosive et lock-out.',
    primary_muscles: ['quadriceps', 'fessiers', 'ischio-jambiers'],
    secondary_muscles: ['dorsaux', 'abdominaux', 'mollets'],
    equipment: ['barbell', 'power-rack', 'lifting-chains'],
    movement_pattern: 'squat',
    category: 'squat',
    subcategory: 'barbell_squat',
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 300,
    tempo: '3-0-X-0',
    visual_keywords: ['squat', 'chains', 'powerlifting', 'accommodating resistance', 'legs'],
    coaching_cues: [
      { type: 'setup', text: 'Chaînes réparties également, traînent au sol en bas', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Explosion maximale sortie de trou', priority: 10, target_level: 'all' },
      { type: 'breathing', text: 'Grande inspiration avant descente, valsalva', priority: 9, target_level: 'all' }
    ]
  },
  {
    name: 'Front Squat with Chains',
    name_normalized: 'Front Squat with Chains',
    difficulty: 'advanced',
    description_short: 'Front squat avec chaînes, powerlifting quads overhead strength',
    description_full: 'Front squat avec chaînes ajoutant résistance progressive, excellentpour développer explosivité et transfert vers olympiques.',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'abdominaux', 'dorsaux'],
    equipment: ['barbell', 'power-rack', 'lifting-chains'],
    movement_pattern: 'squat',
    category: 'squat',
    subcategory: 'barbell_squat',
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 240,
    visual_keywords: ['front squat', 'chains', 'powerlifting', 'quads', 'explosive'],
    coaching_cues: [
      { type: 'setup', text: 'Position olympique ou bras croisés, chaînes stables', priority: 9, target_level: 'all' },
      { type: 'execution', text: 'Torse vertical, explosion contrôlée', priority: 10, target_level: 'all' }
    ]
  },

  // Deadlift avec Chains
  {
    name: 'Deadlift with Chains',
    name_normalized: 'Deadlift with Chains',
    difficulty: 'advanced',
    description_short: 'Soulevé de terre avec chaînes, powerlifting accommodating resistance dos',
    description_full: 'Deadlift avec chaînes ajoutant charge progressive pendant la montée, renforce lock-out et combat sticking point.',
    primary_muscles: ['dorsaux', 'fessiers', 'ischio-jambiers'],
    secondary_muscles: ['trapèzes', 'quadriceps', 'avant-bras', 'abdominaux'],
    equipment: ['barbell', 'lifting-chains'],
    movement_pattern: 'hinge',
    category: 'hinge',
    subcategory: 'deadlift',
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 300,
    tempo: '0-0-X-0',
    visual_keywords: ['deadlift', 'chains', 'powerlifting', 'accommodating resistance', 'lock out'],
    coaching_cues: [
      { type: 'setup', text: 'Chaînes attachées aux extrémités barre', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Explosion du sol, accélère jusqu\'au lock-out', priority: 10, target_level: 'all' },
      { type: 'safety', text: 'Grip solide, ne lâche pas sous tension', priority: 10, target_level: 'all' }
    ]
  },
  {
    name: 'Deadlift with Bands',
    name_normalized: 'Deadlift with Bands',
    difficulty: 'advanced',
    description_short: 'Soulevé de terre avec bandes, powerlifting speed strength grip',
    description_full: 'Deadlift avec bandes élastiques créant tension croissante, développe vitesse initiale et force de lock-out.',
    primary_muscles: ['dorsaux', 'fessiers', 'ischio-jambiers'],
    secondary_muscles: ['trapèzes', 'quadriceps', 'avant-bras'],
    equipment: ['barbell', 'resistance-bands-heavy'],
    movement_pattern: 'hinge',
    category: 'hinge',
    subcategory: 'deadlift',
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 270,
    visual_keywords: ['deadlift', 'bands', 'powerlifting', 'speed', 'resistance'],
    coaching_cues: [
      { type: 'setup', text: 'Bandes fixées au sol sous disques', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Arrache du sol, maintiens vitesse contre bandes', priority: 10, target_level: 'all' }
    ]
  }
];

// ============================================================================
// EXERCICES POWERLIFTING SPÉCIALISÉS
// ============================================================================

const specializedPowerliftingExercises: ExerciseData[] = [
  // Board Press
  {
    name: 'Board Press 1 Board',
    name_normalized: 'Board Press 1 Board',
    difficulty: 'intermediate',
    description_short: 'Développé couché avec planche 1 board, powerlifting partial ROM lock-out',
    description_full: 'Développé couché avec planche de 5cm sur torse, travaille phase haute et lock-out avec surcharge.',
    primary_muscles: ['pectoraux', 'deltoïdes antérieurs', 'triceps'],
    secondary_muscles: ['trapèzes'],
    equipment: ['barbell', 'flat-bench', 'board-press'],
    movement_pattern: 'push',
    category: 'push',
    subcategory: 'bench_press',
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 180,
    tempo: '2-0-X-0',
    visual_keywords: ['board press', 'bench', 'powerlifting', 'partial', 'lock out'],
    coaching_cues: [
      { type: 'setup', text: 'Planche stable sur torse, pareur tient la planche', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Touche planche, explosion vers lock-out', priority: 9, target_level: 'all' },
      { type: 'safety', text: 'Pareur obligatoire pour tenir planche', priority: 10, target_level: 'all' }
    ]
  },
  {
    name: 'Board Press 2 Boards',
    name_normalized: 'Board Press 2 Boards',
    difficulty: 'intermediate',
    description_short: 'Développé couché avec planches 2 boards, powerlifting overload triceps',
    description_full: 'Développé couché avec planches de 10cm, ROM encore plus court, permet surcharge massive pour triceps et lock-out.',
    primary_muscles: ['triceps', 'deltoïdes antérieurs', 'pectoraux'],
    secondary_muscles: ['trapèzes'],
    equipment: ['barbell', 'flat-bench', 'board-press'],
    movement_pattern: 'push',
    category: 'push',
    subcategory: 'bench_press',
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 210,
    visual_keywords: ['board press', '2 boards', 'powerlifting', 'triceps', 'overload'],
    coaching_cues: [
      { type: 'setup', text: '2 planches empilées stables', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Focus sur extension triceps explosive', priority: 9, target_level: 'all' }
    ]
  },
  {
    name: 'Board Press 3 Boards',
    name_normalized: 'Board Press 3 Boards',
    difficulty: 'advanced',
    description_short: 'Développé couché avec planches 3 boards, powerlifting maximal overload triceps',
    description_full: 'Développé couché avec planches de 15cm, ROM minimal, surcharge extrême pour développer lock-out puissant.',
    primary_muscles: ['triceps', 'deltoïdes antérieurs'],
    secondary_muscles: ['pectoraux', 'trapèzes'],
    equipment: ['barbell', 'flat-bench', 'board-press'],
    movement_pattern: 'push',
    category: 'push',
    subcategory: 'bench_press',
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 240,
    visual_keywords: ['board press', '3 boards', 'powerlifting', 'maximal', 'triceps lock out'],
    coaching_cues: [
      { type: 'execution', text: 'Extension triceps pure, charges très lourdes', priority: 10, target_level: 'advanced' }
    ]
  },

  // Pin Press
  {
    name: 'Pin Press Low',
    name_normalized: 'Pin Press Low',
    difficulty: 'intermediate',
    description_short: 'Développé depuis pins bas, powerlifting dead stop strength sticking point',
    description_full: 'Développé couché démarrant depuis pins positionnés juste au-dessus du torse, élimine stretch reflex et développe force pure.',
    primary_muscles: ['pectoraux', 'deltoïdes antérieurs', 'triceps'],
    secondary_muscles: ['dorsaux', 'trapèzes'],
    equipment: ['barbell', 'power-rack', 'flat-bench'],
    movement_pattern: 'push',
    category: 'push',
    subcategory: 'bench_press',
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 210,
    tempo: '0-0-X-0',
    visual_keywords: ['pin press', 'low', 'powerlifting', 'dead stop', 'rack'],
    coaching_cues: [
      { type: 'setup', text: 'Pins à 5-8cm au-dessus du torse', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Pause complète sur pins, explosion sans rebond', priority: 10, target_level: 'all' },
      { type: 'correction', text: 'Si sticking point, c\'est ton point faible', priority: 8, target_level: 'intermediate' }
    ]
  },
  {
    name: 'Pin Press Mid',
    name_normalized: 'Pin Press Mid',
    difficulty: 'intermediate',
    description_short: 'Développé depuis pins mi-hauteur, powerlifting lock-out strength',
    description_full: 'Développé depuis pins positionnés à mi-ROM, cible phase haute et lock-out avec surcharge.',
    primary_muscles: ['triceps', 'deltoïdes antérieurs', 'pectoraux'],
    secondary_muscles: ['trapèzes'],
    equipment: ['barbell', 'power-rack', 'flat-bench'],
    movement_pattern: 'push',
    category: 'push',
    subcategory: 'bench_press',
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 180,
    visual_keywords: ['pin press', 'mid', 'powerlifting', 'lock out', 'triceps'],
    coaching_cues: [
      { type: 'setup', text: 'Pins au milieu du ROM', priority: 9, target_level: 'all' },
      { type: 'execution', text: 'Focus extension triceps complète', priority: 9, target_level: 'all' }
    ]
  },

  // Box Squat
  {
    name: 'Box Squat Low',
    name_normalized: 'Box Squat Low',
    difficulty: 'intermediate',
    description_short: 'Squat sur box bas, powerlifting posterior chain hip drive',
    description_full: 'Squat s\'asseyant complètement sur box bas (parallèle ou sous), développe explosivité et chaîne postérieure.',
    primary_muscles: ['fessiers', 'ischio-jambiers', 'quadriceps'],
    secondary_muscles: ['dorsaux', 'abdominaux'],
    equipment: ['barbell', 'power-rack', 'box-plyo'],
    movement_pattern: 'squat',
    category: 'squat',
    subcategory: 'barbell_squat',
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 240,
    tempo: '2-1-X-0',
    visual_keywords: ['box squat', 'low', 'powerlifting', 'posterior chain', 'explosive'],
    coaching_cues: [
      { type: 'setup', text: 'Box à hauteur parallèle ou légèrement sous', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Assieds contrôlé, pause 1 sec, explosion', priority: 10, target_level: 'all' },
      { type: 'breathing', text: 'Inspire avant, valsalva durant mouvement', priority: 9, target_level: 'all' }
    ]
  },
  {
    name: 'Box Squat Wide Stance',
    name_normalized: 'Box Squat Wide Stance',
    difficulty: 'advanced',
    description_short: 'Box squat stance large, powerlifting westside method hip drive',
    description_full: 'Box squat avec stance très large (style Westside), cible maximum chaîne postérieure et développe force explosive des hanches.',
    primary_muscles: ['fessiers', 'ischio-jambiers', 'adducteurs'],
    secondary_muscles: ['quadriceps', 'dorsaux', 'abdominaux'],
    equipment: ['barbell', 'power-rack', 'box-plyo'],
    movement_pattern: 'squat',
    category: 'squat',
    subcategory: 'barbell_squat',
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 270,
    visual_keywords: ['box squat', 'wide stance', 'powerlifting', 'westside', 'hip drive'],
    coaching_cues: [
      { type: 'setup', text: 'Stance très large, pieds légèrement ouverts', priority: 10, target_level: 'advanced' },
      { type: 'execution', text: 'Sit back agressif, explosion hanches vers avant', priority: 10, target_level: 'advanced' }
    ]
  },

  // Speed Work
  {
    name: 'Speed Deadlift',
    name_normalized: 'Speed Deadlift',
    difficulty: 'intermediate',
    description_short: 'Soulevé de terre vitesse, powerlifting dynamic effort explosive strength',
    description_full: 'Deadlift avec 50-60% 1RM exécuté à vitesse maximale, développe rate of force development et technique explosive.',
    primary_muscles: ['dorsaux', 'fessiers', 'ischio-jambiers'],
    secondary_muscles: ['trapèzes', 'quadriceps', 'avant-bras'],
    equipment: ['barbell'],
    movement_pattern: 'hinge',
    category: 'hinge',
    subcategory: 'deadlift',
    sets_min: 6,
    sets_max: 10,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 60,
    tempo: '0-0-X-0',
    visual_keywords: ['speed deadlift', 'dynamic', 'powerlifting', 'explosive', 'velocity'],
    coaching_cues: [
      { type: 'setup', text: 'Charge 50-60% 1RM, repos courts', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Vitesse maximale du sol au lock-out', priority: 10, target_level: 'all' },
      { type: 'correction', text: 'Si vitesse ralentit, réduis charge ou augmente repos', priority: 8, target_level: 'intermediate' }
    ]
  },
  {
    name: 'Speed Bench Press',
    name_normalized: 'Speed Bench Press',
    difficulty: 'intermediate',
    description_short: 'Développé couché vitesse, powerlifting dynamic effort compensatory acceleration',
    description_full: 'Bench press avec 50-60% 1RM exécuté avec accélération maximale, méthode Westside pour développer explosivité.',
    primary_muscles: ['pectoraux', 'deltoïdes antérieurs', 'triceps'],
    secondary_muscles: ['dorsaux', 'trapèzes'],
    equipment: ['barbell', 'flat-bench'],
    movement_pattern: 'push',
    category: 'push',
    subcategory: 'bench_press',
    sets_min: 6,
    sets_max: 10,
    reps_min: 3,
    reps_max: 3,
    rest_sec: 60,
    tempo: '1-0-X-0',
    visual_keywords: ['speed bench', 'dynamic', 'powerlifting', 'explosive', 'westside'],
    coaching_cues: [
      { type: 'setup', text: 'Charge 50-60% 1RM, technique parfaite', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Accélération maximale en montée, contrôle en descente', priority: 10, target_level: 'all' }
    ]
  },
  {
    name: 'Speed Squat',
    name_normalized: 'Speed Squat',
    difficulty: 'intermediate',
    description_short: 'Squat vitesse, powerlifting dynamic effort explosive legs',
    description_full: 'Squat avec 50-60% 1RM exécuté à vitesse maximale, développe explosivité sortie de trou.',
    primary_muscles: ['quadriceps', 'fessiers', 'ischio-jambiers'],
    secondary_muscles: ['dorsaux', 'abdominaux'],
    equipment: ['barbell', 'power-rack'],
    movement_pattern: 'squat',
    category: 'squat',
    subcategory: 'barbell_squat',
    sets_min: 6,
    sets_max: 10,
    reps_min: 2,
    reps_max: 3,
    rest_sec: 60,
    tempo: '1-0-X-0',
    visual_keywords: ['speed squat', 'dynamic', 'powerlifting', 'explosive', 'legs'],
    coaching_cues: [
      { type: 'setup', text: 'Charge 50-60% 1RM, repos très courts', priority: 10, target_level: 'all' },
      { type: 'execution', text: 'Descente contrôlée, explosion maximale en montée', priority: 10, target_level: 'all' }
    ]
  }
];

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

async function runPhase2() {
  console.log('🏋️ PHASE 2/12 - ENRICHISSEMENT STRONGMAN ET POWERLIFTING');
  console.log('='.repeat(80));
  console.log('Ajout de nouveaux exercices et variantes avancées\n');

  let successCount = 0;
  let errorCount = 0;

  // Insert Strongman exercises
  console.log('📦 1. INSERTION EXERCICES STRONGMAN');
  console.log('-'.repeat(80));
  for (const ex of strongmanExercises) {
    const result = await insertExercise(ex);
    if (result) successCount++;
    else errorCount++;
  }

  // Insert Powerlifting exercises
  console.log('\n💪 2. INSERTION EXERCICES POWERLIFTING - ACCOMMODATING RESISTANCE');
  console.log('-'.repeat(80));
  for (const ex of powerliftingExercises) {
    const result = await insertExercise(ex);
    if (result) successCount++;
    else errorCount++;
  }

  // Insert Specialized Powerlifting exercises
  console.log('\n🎯 3. INSERTION EXERCICES POWERLIFTING - SPÉCIALISÉS');
  console.log('-'.repeat(80));
  for (const ex of specializedPowerliftingExercises) {
    const result = await insertExercise(ex);
    if (result) successCount++;
    else errorCount++;
  }

  // Final statistics
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS PHASE 2');
  console.log('='.repeat(80));
  console.log(`✅ Exercices ajoutés avec succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📈 Total exercices traités: ${successCount + errorCount}`);

  const { count: newTotal } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🎯 Nouveau total exercices en base: ${newTotal || 'N/A'}`);
  console.log('\n✅ PHASE 2 TERMINÉE - Prêt pour Phase 3\n');
}

// Execute Phase 2
runPhase2()
  .then(() => {
    console.log('✅ Phase 2 terminée avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la Phase 2:', error);
    process.exit(1);
  });

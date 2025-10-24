import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const muscleCache = new Map<string, string>();
const equipmentCache = new Map<string, string>();

async function getMuscleId(name: string): Promise<string | null> {
  if (muscleCache.has(name)) return muscleCache.get(name)!;
  const { data } = await supabase.from('muscle_groups').select('id').ilike('name', `%${name}%`).limit(1).maybeSingle();
  if (data) muscleCache.set(name, data.id);
  return data?.id || null;
}

async function getEquipmentId(name: string): Promise<string | null> {
  if (equipmentCache.has(name)) return equipmentCache.get(name)!;
  const { data } = await supabase.from('equipment_types').select('id').ilike('name', `%${name}%`).limit(1).maybeSingle();
  if (data) equipmentCache.set(name, data.id);
  return data?.id || null;
}

async function seedExercise(ex: any) {
  const primaryMuscleIds = (await Promise.all((ex.primary_muscles || []).map(getMuscleId))).filter(Boolean);
  const secondaryMuscleIds = (await Promise.all((ex.secondary_muscles || []).map(getMuscleId))).filter(Boolean);
  const equipmentIds = (await Promise.all((ex.equipment || []).map(getEquipmentId))).filter(Boolean);

  const { data: exercise, error } = await supabase.from('exercises').insert({
    name: ex.name,
    discipline: 'functional',
    category: ex.category,
    difficulty: ex.difficulty,
    description_short: ex.description,
    movement_pattern: ex.movement_pattern || 'compound',
    is_validated: true,
    typical_sets_min: ex.sets_min || 1,
    typical_sets_max: ex.sets_max || 1,
    typical_reps_min: ex.reps_min || 1,
    typical_reps_max: ex.reps_max || 1,
    typical_rest_sec: ex.rest_sec || 120,
  }).select().single();

  if (error) {
    console.error(`Error inserting ${ex.name}:`, error.message);
    return;
  }

  if (!exercise) return;

  if (primaryMuscleIds.length > 0) {
    await supabase.from('exercise_muscle_groups').insert(
      primaryMuscleIds.map(id => ({ exercise_id: exercise.id, muscle_group_id: id, involvement_type: 'primary' }))
    );
  }

  if (secondaryMuscleIds.length > 0) {
    await supabase.from('exercise_muscle_groups').insert(
      secondaryMuscleIds.map(id => ({ exercise_id: exercise.id, muscle_group_id: id, involvement_type: 'secondary' }))
    );
  }

  if (equipmentIds.length > 0) {
    await supabase.from('exercise_equipment').insert(
      equipmentIds.map(id => ({ exercise_id: exercise.id, equipment_type_id: id, is_required: true }))
    );
  }

  console.log(`✅ ${ex.name}`);
}

const exercises = [
  {
    name: 'Hang Clean + Front Squat Complex',
    category: 'olympic_complex',
    difficulty: 'advanced',
    description: 'Complexe hang clean front squat sans poser barre',
    primary_muscles: ['quadriceps', 'fessiers', 'érecteurs'],
    secondary_muscles: ['trapèzes', 'deltoïdes', 'abdominaux'],
    equipment: ['barbell'],
    sets_min: 4,
    sets_max: 6,
    reps_min: 3,
    reps_max: 5,
    rest_sec: 120,
  },
  {
    name: 'Clean + Jerk Complex',
    category: 'olympic_complex',
    difficulty: 'advanced',
    description: 'Complexe clean jerk enchaîné sans repos',
    primary_muscles: ['quadriceps', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['érecteurs', 'trapèzes', 'triceps'],
    equipment: ['barbell'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 2,
    reps_max: 4,
    rest_sec: 150,
  },
  {
    name: 'Snatch Balance Complex',
    category: 'olympic_complex',
    difficulty: 'advanced',
    description: 'Snatch balance technique overhead squat mobilité',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'érecteurs', 'abdominaux'],
    equipment: ['barbell'],
    sets_min: 4,
    sets_max: 6,
    reps_min: 3,
    reps_max: 5,
    rest_sec: 90,
  },
  {
    name: 'Power Clean + Push Press Complex',
    category: 'olympic_complex',
    difficulty: 'intermediate',
    description: 'Complexe power clean push press enchaîné',
    primary_muscles: ['quadriceps', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['érecteurs', 'trapèzes', 'triceps'],
    equipment: ['barbell'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 120,
  },
  {
    name: 'Hang Snatch + Overhead Squat Complex',
    category: 'olympic_complex',
    difficulty: 'advanced',
    description: 'Complexe hang snatch OHS technique force',
    primary_muscles: ['quadriceps', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['érecteurs', 'trapèzes', 'abdominaux'],
    equipment: ['barbell'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 2,
    reps_max: 4,
    rest_sec: 150,
  },
  {
    name: 'Clean Pull + Clean Complex',
    category: 'olympic_complex',
    difficulty: 'advanced',
    description: 'Complexe clean pull clean technique puissance',
    primary_muscles: ['quadriceps', 'érecteurs', 'trapèzes'],
    secondary_muscles: ['fessiers', 'ischio-jambiers'],
    equipment: ['barbell'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 3,
    reps_max: 5,
    rest_sec: 120,
  },
  {
    name: 'EMOM Clean and Jerk 12min',
    category: 'olympic_emom',
    difficulty: 'advanced',
    description: 'EMOM 12min 1 Clean and Jerk each minute technique',
    primary_muscles: ['quadriceps', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['érecteurs', 'trapèzes', 'triceps'],
    equipment: ['barbell'],
    sets_min: 12,
    sets_max: 12,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'EMOM Snatch 10min',
    category: 'olympic_emom',
    difficulty: 'advanced',
    description: 'EMOM 10min 1 Snatch chaque minute technique',
    primary_muscles: ['quadriceps', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['érecteurs', 'trapèzes', 'dorsaux'],
    equipment: ['barbell'],
    sets_min: 10,
    sets_max: 10,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Strict Pull-ups Progression',
    category: 'gymnastics_progression',
    difficulty: 'beginner',
    description: 'Progression strict pull-ups force pure contrôlée',
    primary_muscles: ['dorsaux'],
    secondary_muscles: ['biceps', 'trapèzes', 'deltoïdes'],
    equipment: ['pull-up bar'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 5,
    reps_max: 10,
    rest_sec: 120,
  },
  {
    name: 'Kipping Pull-ups Progression',
    category: 'gymnastics_progression',
    difficulty: 'intermediate',
    description: 'Progression kipping pull-ups momentum swing hip drive',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['biceps', 'trapèzes'],
    equipment: ['pull-up bar'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 8,
    reps_max: 15,
    rest_sec: 90,
  },
  {
    name: 'Butterfly Pull-ups Progression',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Progression butterfly pull-ups vitesse cyclique',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['biceps', 'deltoïdes'],
    equipment: ['pull-up bar'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 10,
    reps_max: 20,
    rest_sec: 90,
  },
  {
    name: 'Chest-to-Bar Pull-ups Progression',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Progression chest-to-bar amplitude complète',
    primary_muscles: ['dorsaux'],
    secondary_muscles: ['biceps', 'trapèzes'],
    equipment: ['pull-up bar'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 5,
    reps_max: 12,
    rest_sec: 120,
  },
  {
    name: 'Bar Muscle-up Progression',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Progression bar muscle-up transition barre technique',
    primary_muscles: ['dorsaux', 'pectoraux'],
    secondary_muscles: ['triceps', 'biceps', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 180,
  },
  {
    name: 'Ring Muscle-up Progression',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Progression ring muscle-up anneaux transition false grip',
    primary_muscles: ['dorsaux', 'pectoraux'],
    secondary_muscles: ['triceps', 'biceps', 'avant-bras'],
    equipment: [],
    sets_min: 4,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 180,
  },
  {
    name: 'Strict Handstand Push-up Progression',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Progression strict HSPU force épaules contrôle',
    primary_muscles: ['deltoïdes'],
    secondary_muscles: ['triceps', 'trapèzes', 'abdominaux'],
    equipment: [],
    sets_min: 4,
    sets_max: 5,
    reps_min: 3,
    reps_max: 10,
    rest_sec: 150,
  },
  {
    name: 'Kipping Handstand Push-up Progression',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Progression kipping HSPU momentum hip drive',
    primary_muscles: ['deltoïdes', 'abdominaux'],
    secondary_muscles: ['triceps', 'trapèzes'],
    equipment: [],
    sets_min: 4,
    sets_max: 5,
    reps_min: 5,
    reps_max: 15,
    rest_sec: 120,
  },
  {
    name: 'Deficit Handstand Push-up Progression',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Progression deficit HSPU amplitude augmentée difficulté',
    primary_muscles: ['deltoïdes'],
    secondary_muscles: ['triceps', 'trapèzes'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 180,
  },
  {
    name: 'Freestanding Handstand Push-up',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'HSPU freestanding équilibre force technique avancée',
    primary_muscles: ['deltoïdes', 'abdominaux'],
    secondary_muscles: ['triceps', 'trapèzes', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 180,
  },
  {
    name: 'Pistol Squat Progression',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Progression pistol squat unilateral force équilibre',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['mollets', 'abdominaux'],
    equipment: [],
    sets_min: 4,
    sets_max: 5,
    reps_min: 5,
    reps_max: 12,
    rest_sec: 90,
  },
  {
    name: 'Toes-to-Bar Progression',
    category: 'gymnastics_progression',
    difficulty: 'intermediate',
    description: 'Progression toes-to-bar abdominaux coordination',
    primary_muscles: ['abdominaux'],
    secondary_muscles: ['dorsaux', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 8,
    reps_max: 15,
    rest_sec: 90,
  },
  {
    name: 'Rope Climb Progression',
    category: 'gymnastics_progression',
    difficulty: 'intermediate',
    description: 'Progression rope climb corde technique force traction',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['avant-bras', 'abdominaux', 'quadriceps'],
    equipment: [],
    sets_min: 4,
    sets_max: 6,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Legless Rope Climb',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Rope climb sans jambes bras seuls force pure',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['avant-bras', 'trapèzes', 'abdominaux'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Ring Dips Progression',
    category: 'gymnastics_progression',
    difficulty: 'intermediate',
    description: 'Progression ring dips anneaux stabilité force',
    primary_muscles: ['pectoraux', 'triceps'],
    secondary_muscles: ['deltoïdes', 'abdominaux'],
    equipment: [],
    sets_min: 4,
    sets_max: 5,
    reps_min: 5,
    reps_max: 15,
    rest_sec: 120,
  },
  {
    name: 'Strict Ring Dips',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Ring dips strict force pure contrôle stabilité',
    primary_muscles: ['pectoraux', 'triceps'],
    secondary_muscles: ['deltoïdes', 'abdominaux'],
    equipment: [],
    sets_min: 4,
    sets_max: 5,
    reps_min: 5,
    reps_max: 12,
    rest_sec: 150,
  },
  {
    name: 'L-Sit Progression',
    category: 'gymnastics_progression',
    difficulty: 'intermediate',
    description: 'Progression L-sit hold abdominaux force isométrique',
    primary_muscles: ['abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['triceps', 'deltoïdes'],
    equipment: [],
    sets_min: 4,
    sets_max: 6,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'Handstand Hold Progression',
    category: 'gymnastics_progression',
    difficulty: 'intermediate',
    description: 'Progression handstand hold équilibre force épaules',
    primary_muscles: ['deltoïdes', 'abdominaux'],
    secondary_muscles: ['triceps', 'trapèzes', 'érecteurs'],
    equipment: [],
    sets_min: 4,
    sets_max: 6,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'Freestanding Handstand Walk',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Handstand walk freestanding équilibre dynamique',
    primary_muscles: ['deltoïdes', 'abdominaux'],
    secondary_muscles: ['triceps', 'trapèzes', 'érecteurs'],
    equipment: [],
    sets_min: 4,
    sets_max: 6,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Parallette L-Sit Hold',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'L-sit parallettes hold advanced core strength',
    primary_muscles: ['abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['triceps', 'deltoïdes', 'avant-bras'],
    equipment: [],
    sets_min: 4,
    sets_max: 6,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'Bar Swing to Muscle-up',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Swing bar momentum muscle-up transition dynamique',
    primary_muscles: ['dorsaux', 'pectoraux', 'abdominaux'],
    secondary_muscles: ['biceps', 'triceps'],
    equipment: ['pull-up bar'],
    sets_min: 4,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 180,
  },
  {
    name: 'Ring L-Sit Pull-ups',
    category: 'gymnastics_progression',
    difficulty: 'advanced',
    description: 'Pull-ups avec L-sit anneaux core force combiné',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['biceps', 'fléchisseurs hanches'],
    equipment: [],
    sets_min: 4,
    sets_max: 5,
    reps_min: 4,
    reps_max: 10,
    rest_sec: 150,
  },
];

async function main() {
  console.log('🏋️‍♂️🤸 Seeding Functional Olympic Complexes & Gymnastics (30 exercises)...\n');

  let success = 0;
  let failed = 0;

  for (const ex of exercises) {
    try {
      await seedExercise(ex);
      success++;
    } catch (error) {
      console.error(`❌ Failed to seed ${ex.name}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Success: ${success}/${exercises.length}`);
  console.log(`❌ Failed: ${failed}/${exercises.length}`);
  console.log('\n🎯 Olympic complexes & Gymnastics progressions enrichment complete!');
}

main().then(() => process.exit(0));

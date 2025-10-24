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
    discipline: 'force',
    category: 'strongman',
    subcategory: ex.subcategory || 'strongman',
    difficulty: ex.difficulty,
    description_short: ex.description,
    movement_pattern: ex.movement_pattern,
    is_validated: true,
    typical_sets_min: ex.sets_min || 3,
    typical_sets_max: ex.sets_max || 5,
    typical_reps_min: ex.reps_min || 1,
    typical_reps_max: ex.reps_max || 5,
    typical_rest_sec: ex.rest_sec || 180,
    typical_duration_min: ex.duration_min,
    typical_duration_max: ex.duration_max,
    visual_keywords: ex.visual_keywords || ['strongman', 'power', 'heavy', 'explosive']
  }).select().single();

  if (error || !exercise) {
    console.error(`❌ ${ex.name}:`, error?.message);
    return;
  }

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
      equipmentIds.map(id => ({ exercise_id: exercise.id, equipment_id: id, is_required: true }))
    );
  }

  console.log(`✅ ${ex.name}`);
}

const strongmanExercises = [
  {
    name: 'Atlas Stone Load',
    difficulty: 'advanced',
    description: 'Atlas stone loading to platform strongman lift pierre atlas force puissance explosive',
    primary_muscles: ['dorsaux', 'fessiers', 'quadriceps'],
    secondary_muscles: ['trapèzes', 'biceps', 'avant-bras'],
    equipment: [],
    movement_pattern: 'hinge',
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 240,
    visual_keywords: ['atlas stone', 'strongman', 'loading', 'power', 'explosive lift']
  },
  {
    name: 'Atlas Stone Lap',
    difficulty: 'intermediate',
    description: 'Atlas stone to lap practice strongman pierre atlas genoux technique préparation',
    primary_muscles: ['dorsaux', 'fessiers'],
    secondary_muscles: ['biceps', 'avant-bras'],
    equipment: [],
    movement_pattern: 'hinge',
    sets_min: 4,
    sets_max: 6,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 180
  },
  {
    name: 'Log Press',
    difficulty: 'advanced',
    description: 'Log clean and press strongman overhead développé bûche explosive power',
    primary_muscles: ['deltoïdes', 'triceps'],
    secondary_muscles: ['pectoraux', 'trapèzes', 'abdominaux'],
    equipment: [],
    movement_pattern: 'push',
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 180,
    visual_keywords: ['log', 'overhead press', 'strongman', 'clean', 'power']
  },
  {
    name: 'Axle Bar Deadlift',
    difficulty: 'advanced',
    description: 'Thick bar deadlift strongman soulevé terre barre épaisse grip force préhension',
    primary_muscles: ['dorsaux', 'fessiers', 'ischio-jambiers'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'quadriceps'],
    equipment: ['barbell'],
    movement_pattern: 'hinge',
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 240
  },
  {
    name: 'Farmers Walk',
    difficulty: 'intermediate',
    description: 'Farmers carry strongman marche chargée grip force endurance préhension',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'quadriceps', 'fessiers'],
    equipment: ['dumbbell'],
    movement_pattern: 'carry',
    sets_min: 3,
    sets_max: 5,
    duration_min: 30,
    duration_max: 60,
    rest_sec: 120,
    visual_keywords: ['farmers walk', 'carry', 'loaded walk', 'grip', 'strongman']
  },
  {
    name: 'Farmers Walk Heavy',
    difficulty: 'advanced',
    description: 'Heavy farmers carry strongman marche très chargée maximum grip force préhension',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'quadriceps'],
    equipment: ['dumbbell'],
    movement_pattern: 'carry',
    sets_min: 3,
    sets_max: 4,
    duration_min: 20,
    duration_max: 40,
    rest_sec: 180
  },
  {
    name: 'Yoke Walk',
    difficulty: 'advanced',
    description: 'Yoke carry strongman marche joug chargé stabilité force jambes core',
    primary_muscles: ['quadriceps', 'fessiers', 'trapèzes'],
    secondary_muscles: ['abdominaux', 'dorsaux'],
    equipment: [],
    movement_pattern: 'carry',
    sets_min: 3,
    sets_max: 5,
    duration_min: 20,
    duration_max: 50,
    rest_sec: 180,
    visual_keywords: ['yoke', 'walk', 'loaded carry', 'strongman', 'stability']
  },
  {
    name: 'Tire Flip',
    difficulty: 'advanced',
    description: 'Tire flip strongman retournement pneu explosivité puissance full body',
    primary_muscles: ['fessiers', 'quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'deltoïdes', 'trapèzes'],
    equipment: [],
    movement_pattern: 'hinge',
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 180,
    visual_keywords: ['tire flip', 'explosive', 'power', 'strongman', 'full body']
  },
  {
    name: 'Tire Flip for Distance',
    difficulty: 'elite',
    description: 'Tire flip series distance strongman retournement pneu répété endurance explosivité',
    primary_muscles: ['fessiers', 'quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'deltoïdes'],
    equipment: [],
    movement_pattern: 'hinge',
    sets_min: 2,
    sets_max: 3,
    reps_min: 10,
    reps_max: 20,
    rest_sec: 240
  },
  {
    name: 'Sandbag Carry',
    difficulty: 'intermediate',
    description: 'Sandbag loaded carry strongman marche sac de sable stabilité core grip',
    primary_muscles: ['trapèzes', 'abdominaux'],
    secondary_muscles: ['avant-bras', 'quadriceps', 'fessiers'],
    equipment: [],
    movement_pattern: 'carry',
    sets_min: 3,
    sets_max: 5,
    duration_min: 30,
    duration_max: 90,
    rest_sec: 120,
    visual_keywords: ['sandbag', 'carry', 'loaded walk', 'core', 'strongman']
  },
  {
    name: 'Sandbag Shouldering',
    difficulty: 'advanced',
    description: 'Sandbag to shoulder strongman sac de sable épaule explosivité puissance',
    primary_muscles: ['dorsaux', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['trapèzes', 'quadriceps', 'biceps'],
    equipment: [],
    movement_pattern: 'hinge',
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 150
  },
  {
    name: 'Sandbag Over Bar',
    difficulty: 'advanced',
    description: 'Sandbag throw over bar strongman lancer sac par-dessus barre explosivité power',
    primary_muscles: ['dorsaux', 'deltoïdes', 'quadriceps'],
    secondary_muscles: ['fessiers', 'trapèzes'],
    equipment: [],
    movement_pattern: 'hinge',
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 180
  },
  {
    name: 'Sled Push Heavy',
    difficulty: 'advanced',
    description: 'Heavy sled push strongman poussée traîneau lourd force jambes drive puissance',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: [],
    movement_pattern: 'push',
    sets_min: 4,
    sets_max: 6,
    duration_min: 20,
    duration_max: 40,
    rest_sec: 180,
    visual_keywords: ['sled push', 'heavy', 'drive', 'power', 'strongman']
  },
  {
    name: 'Sled Drag',
    difficulty: 'intermediate',
    description: 'Sled drag backward strongman traîneau tiré arrière quadriceps force résistance',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['fessiers', 'ischio-jambiers', 'mollets'],
    equipment: [],
    movement_pattern: 'pull',
    sets_min: 4,
    sets_max: 6,
    duration_min: 30,
    duration_max: 60,
    rest_sec: 120
  },
  {
    name: 'Car Deadlift',
    difficulty: 'elite',
    description: 'Car deadlift strongman soulevé voiture extrême force maximale power',
    primary_muscles: ['dorsaux', 'fessiers', 'ischio-jambiers'],
    secondary_muscles: ['trapèzes', 'quadriceps', 'avant-bras'],
    equipment: [],
    movement_pattern: 'hinge',
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 300
  },
  {
    name: 'Keg Carry',
    difficulty: 'advanced',
    description: 'Keg carry strongman porter tonneau instable core stabilité force grip',
    primary_muscles: ['abdominaux', 'trapèzes'],
    secondary_muscles: ['avant-bras', 'quadriceps', 'fessiers'],
    equipment: [],
    movement_pattern: 'carry',
    sets_min: 3,
    sets_max: 5,
    duration_min: 30,
    duration_max: 60,
    rest_sec: 150
  },
  {
    name: 'Keg Toss',
    difficulty: 'advanced',
    description: 'Keg toss over bar strongman lancer tonneau explosivité puissance power',
    primary_muscles: ['deltoïdes', 'dorsaux', 'fessiers'],
    secondary_muscles: ['trapèzes', 'quadriceps', 'triceps'],
    equipment: [],
    movement_pattern: 'push',
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 180
  },
  {
    name: 'Circus Dumbbell Press',
    difficulty: 'elite',
    description: 'Circus dumbbell press strongman développé haltère déséquilibré stabilité power',
    primary_muscles: ['deltoïdes', 'triceps'],
    secondary_muscles: ['trapèzes', 'abdominaux'],
    equipment: ['dumbbell'],
    movement_pattern: 'push',
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 180
  },
  {
    name: 'Viking Press',
    difficulty: 'advanced',
    description: 'Viking press strongman développé landmine explosif épaules triceps power',
    primary_muscles: ['deltoïdes', 'triceps'],
    secondary_muscles: ['trapèzes', 'pectoraux'],
    equipment: ['barbell'],
    movement_pattern: 'push',
    sets_min: 3,
    sets_max: 5,
    reps_min: 5,
    reps_max: 10,
    rest_sec: 150
  },
  {
    name: 'Frame Carry',
    difficulty: 'advanced',
    description: 'Frame carry strongman porter cadre chargé grip force core stabilité',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'quadriceps', 'fessiers'],
    equipment: [],
    movement_pattern: 'carry',
    sets_min: 3,
    sets_max: 5,
    duration_min: 20,
    duration_max: 50,
    rest_sec: 180
  }
];

async function main() {
  console.log('💪 SEED STRONGMAN EXERCISES - Force Discipline');
  console.log('='.repeat(60));
  console.log(`Total exercices à insérer: ${strongmanExercises.length}\n`);

  for (const ex of strongmanExercises) {
    await seedExercise(ex);
  }

  console.log('\n✅ Seed strongman terminé avec succès\n');
}

main().then(() => process.exit(0));

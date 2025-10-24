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
    typical_rest_sec: ex.rest_sec || 0,
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

const girlsWods = [
  {
    name: 'Fran Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '21-15-9 Thrusters 95lbs Pull-ups For Time benchmark féminin',
    primary_muscles: ['quadriceps', 'deltoïdes', 'dorsaux'],
    secondary_muscles: ['fessiers', 'triceps', 'biceps'],
    equipment: ['barbell', 'pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Annie Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '50-40-30-20-10 Double-Unders Sit-Ups For Time',
    primary_muscles: ['mollets', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'avant-bras'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Diane Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '21-15-9 Deadlifts 225lbs Handstand Push-ups For Time',
    primary_muscles: ['érecteurs', 'fessiers', 'deltoïdes'],
    secondary_muscles: ['ischio-jambiers', 'trapèzes', 'triceps'],
    equipment: ['barbell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Grace Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '30 Clean and Jerks 135lbs For Time puissance explosive',
    primary_muscles: ['quadriceps', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['érecteurs', 'trapèzes', 'triceps'],
    equipment: ['barbell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Helen Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '3 Rounds 400m Run 21 KB Swings 53lbs 12 Pull-ups',
    primary_muscles: ['quadriceps', 'fessiers', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'deltoïdes', 'biceps'],
    equipment: ['kettlebell', 'pull-up bar'],
    sets_min: 3,
    sets_max: 3,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Karen Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '150 Wall Balls 20lbs For Time légendaire brutal',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'triceps'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 150,
    reps_max: 150,
    rest_sec: 0,
  },
  {
    name: 'Cindy Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'intermediate',
    description: 'AMRAP 20min 5 Pull-ups 10 Push-ups 15 Air Squats',
    primary_muscles: ['dorsaux', 'pectoraux', 'quadriceps'],
    secondary_muscles: ['biceps', 'triceps', 'fessiers'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Mary Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: 'AMRAP 20min 5 HSPU 10 Pistol Squats 15 Pull-ups',
    primary_muscles: ['deltoïdes', 'quadriceps', 'dorsaux'],
    secondary_muscles: ['triceps', 'fessiers', 'biceps'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Isabel Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '30 Snatches 135lbs For Time technique explosivité',
    primary_muscles: ['quadriceps', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['érecteurs', 'trapèzes', 'dorsaux'],
    equipment: ['barbell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 30,
    reps_max: 30,
    rest_sec: 0,
  },
  {
    name: 'Elizabeth Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '21-15-9 Cleans 135lbs Ring Dips For Time',
    primary_muscles: ['quadriceps', 'pectoraux', 'fessiers'],
    secondary_muscles: ['érecteurs', 'triceps', 'deltoïdes'],
    equipment: ['barbell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Jackie Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '1000m Row 50 Thrusters 45lbs 30 Pull-ups For Time',
    primary_muscles: ['dorsaux', 'quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'biceps', 'triceps'],
    equipment: ['barbell', 'pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Kelly Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '5 Rounds 400m Run 30 Box Jumps 24in 30 Wall Balls 20lbs',
    primary_muscles: ['quadriceps', 'mollets', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'ischio-jambiers'],
    equipment: [],
    sets_min: 5,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Linda Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '10-9-8...1 Deadlift Bench Clean bodyweight For Time',
    primary_muscles: ['érecteurs', 'pectoraux', 'quadriceps'],
    secondary_muscles: ['fessiers', 'triceps', 'deltoïdes'],
    equipment: ['barbell', 'bench'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Nancy Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '5 Rounds 400m Run 15 Overhead Squats 95lbs For Time',
    primary_muscles: ['quadriceps', 'deltoïdes', 'mollets'],
    secondary_muscles: ['fessiers', 'érecteurs', 'abdominaux'],
    equipment: ['barbell'],
    sets_min: 5,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Nicole Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: 'AMRAP 20min 400m Run Max Pull-ups rounds score',
    primary_muscles: ['quadriceps', 'dorsaux', 'mollets'],
    secondary_muscles: ['ischio-jambiers', 'biceps'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Amanda Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '9-7-5 Muscle-ups Snatches 135lbs For Time gymnastique force',
    primary_muscles: ['dorsaux', 'quadriceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'triceps', 'fessiers'],
    equipment: ['barbell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Barbara Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '5 Rounds 20 Pull-ups 30 Push-ups 40 Sit-ups 50 Squats 3min rest',
    primary_muscles: ['dorsaux', 'pectoraux', 'abdominaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'triceps', 'fessiers'],
    equipment: ['pull-up bar'],
    sets_min: 5,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Chelsea Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: 'EMOM 30min 5 Pull-ups 10 Push-ups 15 Squats chaque minute',
    primary_muscles: ['dorsaux', 'pectoraux', 'quadriceps'],
    secondary_muscles: ['biceps', 'triceps', 'fessiers'],
    equipment: ['pull-up bar'],
    sets_min: 30,
    sets_max: 30,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Eva Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '5 Rounds 800m Run 30 KB Swings 70lbs 30 Pull-ups',
    primary_muscles: ['quadriceps', 'fessiers', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'deltoïdes', 'biceps'],
    equipment: ['kettlebell', 'pull-up bar'],
    sets_min: 5,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Annie Half Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'intermediate',
    description: '25-20-15-10-5 Double-Unders Sit-Ups scaled version',
    primary_muscles: ['mollets', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'avant-bras'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Fran Scaled Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'intermediate',
    description: '21-15-9 Thrusters 65lbs Pull-ups scaled version',
    primary_muscles: ['quadriceps', 'deltoïdes', 'dorsaux'],
    secondary_muscles: ['fessiers', 'triceps', 'biceps'],
    equipment: ['barbell', 'pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Grace Scaled Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'intermediate',
    description: '30 Clean and Jerks 95lbs For Time scaled',
    primary_muscles: ['quadriceps', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['érecteurs', 'trapèzes', 'triceps'],
    equipment: ['barbell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 30,
    reps_max: 30,
    rest_sec: 0,
  },
  {
    name: 'Angie Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '100 Pull-ups 100 Push-ups 100 Sit-ups 100 Squats For Time',
    primary_muscles: ['dorsaux', 'pectoraux', 'abdominaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'triceps', 'fessiers'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Christine Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '3 Rounds 500m Row 12 Bodyweight Deadlifts 21 Box Jumps 24in',
    primary_muscles: ['dorsaux', 'érecteurs', 'quadriceps'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'mollets'],
    equipment: ['barbell'],
    sets_min: 3,
    sets_max: 3,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Gwen Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '15-12-9 Clean and Jerk bodyweight unbroken For Time',
    primary_muscles: ['quadriceps', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['érecteurs', 'trapèzes', 'triceps'],
    equipment: ['barbell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Katie Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '3 Rounds 800m Run 30 KB Swings 53lbs 30 Burpees',
    primary_muscles: ['quadriceps', 'fessiers', 'pectoraux'],
    secondary_muscles: ['ischio-jambiers', 'deltoïdes', 'triceps'],
    equipment: ['kettlebell'],
    sets_min: 3,
    sets_max: 3,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Lynne Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '5 Rounds Max Bench Press bodyweight Max Pull-ups score total',
    primary_muscles: ['pectoraux', 'dorsaux'],
    secondary_muscles: ['triceps', 'deltoïdes', 'biceps'],
    equipment: ['barbell', 'bench', 'pull-up bar'],
    sets_min: 5,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Naughty Nancy Benchmark WOD',
    category: 'benchmark_wod',
    difficulty: 'advanced',
    description: '5 Rounds 400m Run 15 Overhead Squats 135lbs harder Nancy',
    primary_muscles: ['quadriceps', 'deltoïdes', 'mollets'],
    secondary_muscles: ['fessiers', 'érecteurs', 'abdominaux'],
    equipment: ['barbell'],
    sets_min: 5,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
];

async function main() {
  console.log('👧 Seeding Functional Benchmark Girls WODs (28 exercises)...\n');

  let success = 0;
  let failed = 0;

  for (const ex of girlsWods) {
    try {
      await seedExercise(ex);
      success++;
    } catch (error) {
      console.error(`❌ Failed to seed ${ex.name}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Success: ${success}/${girlsWods.length}`);
  console.log(`❌ Failed: ${failed}/${girlsWods.length}`);
  console.log('\n🎯 Benchmark Girls WODs enrichment complete!');
}

main().then(() => process.exit(0));

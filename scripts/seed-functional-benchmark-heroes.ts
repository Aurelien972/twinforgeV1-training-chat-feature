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

const heroesWods = [
  {
    name: 'Murph Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '1 Mile Run 100 Pull-ups 200 Push-ups 300 Squats 1 Mile Run',
    primary_muscles: ['quadriceps', 'dorsaux', 'pectoraux', 'mollets'],
    secondary_muscles: ['biceps', 'triceps', 'fessiers'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'DT Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '5 Rounds 12 Deadlifts 9 Hang Power Cleans 6 Push Jerks 155lbs',
    primary_muscles: ['érecteurs', 'quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'trapèzes', 'triceps'],
    equipment: ['barbell'],
    sets_min: 5,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Michael Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '3 Rounds 800m Run 50 Back Extensions 50 Sit-ups For Time',
    primary_muscles: ['quadriceps', 'érecteurs', 'abdominaux'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    sets_min: 3,
    sets_max: 3,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'JT Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '21-15-9 Handstand Push-ups Ring Dips Push-ups For Time',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['trapèzes', 'abdominaux'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Griff Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '800m Run 400m Backward Run 800m Run 400m Backward Run',
    primary_muscles: ['quadriceps', 'mollets'],
    secondary_muscles: ['ischio-jambiers', 'fessiers'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Randy Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '75 Snatches 75lbs For Time technique endurance',
    primary_muscles: ['quadriceps', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['érecteurs', 'trapèzes', 'dorsaux'],
    equipment: ['barbell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 75,
    reps_max: 75,
    rest_sec: 0,
  },
  {
    name: 'Roy Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '5 Rounds 15 Deadlifts 225lbs 20 Box Jumps 25 Pull-ups',
    primary_muscles: ['érecteurs', 'quadriceps', 'dorsaux'],
    secondary_muscles: ['fessiers', 'mollets', 'biceps'],
    equipment: ['barbell', 'pull-up bar'],
    sets_min: 5,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Tommy V Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '21 Thrusters 115lbs 12 Rope Climbs 15ft 15 Thrusters 9 Rope Climbs',
    primary_muscles: ['quadriceps', 'deltoïdes', 'dorsaux'],
    secondary_muscles: ['fessiers', 'triceps', 'biceps'],
    equipment: ['barbell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Daniel Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '50 Pull-ups 400m Run 21 Thrusters 95lbs 800m Run 21 Thrusters',
    primary_muscles: ['dorsaux', 'quadriceps', 'deltoïdes'],
    secondary_muscles: ['biceps', 'mollets', 'fessiers'],
    equipment: ['barbell', 'pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Jason Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '100 Squats 5 Muscle-ups 75 Squats 10 Muscle-ups 50 Squats 15 Muscle-ups',
    primary_muscles: ['quadriceps', 'dorsaux', 'pectoraux'],
    secondary_muscles: ['fessiers', 'triceps', 'biceps'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Nate Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: 'AMRAP 20min 2 Muscle-ups 4 Handstand Push-ups 8 KB Swings 70lbs',
    primary_muscles: ['dorsaux', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['pectoraux', 'triceps', 'ischio-jambiers'],
    equipment: ['kettlebell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'McGhee Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '5 Rounds 5 Deadlifts 275lbs 13 Push-ups 9 Box Jumps 24in',
    primary_muscles: ['érecteurs', 'pectoraux', 'quadriceps'],
    secondary_muscles: ['fessiers', 'triceps', 'mollets'],
    equipment: ['barbell'],
    sets_min: 5,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Arnie Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '21 Turkish Get-ups 45lbs 50 Swings For Time technique force',
    primary_muscles: ['abdominaux', 'deltoïdes', 'fessiers'],
    secondary_muscles: ['obliques', 'quadriceps', 'ischio-jambiers'],
    equipment: ['kettlebell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Badger Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '3 Rounds 30 Squat Cleans 95lbs 30 Pull-ups 800m Run',
    primary_muscles: ['quadriceps', 'dorsaux', 'mollets'],
    secondary_muscles: ['fessiers', 'érecteurs', 'biceps'],
    equipment: ['barbell', 'pull-up bar'],
    sets_min: 3,
    sets_max: 3,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Lumberjack 20 Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '20 Deadlifts 275lbs 400m Run 20 KB Swings 70lbs 400m Run',
    primary_muscles: ['érecteurs', 'quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'trapèzes'],
    equipment: ['barbell', 'kettlebell'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Blake Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '4 Rounds 30 Back Squats 185lbs 30 Bench Press 110lbs 800m Run',
    primary_muscles: ['quadriceps', 'pectoraux', 'mollets'],
    secondary_muscles: ['fessiers', 'érecteurs', 'triceps'],
    equipment: ['barbell', 'bench'],
    sets_min: 4,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Forrest Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '3 Rounds 20 Back Extensions 30 Sit-ups 40 Squats 50 Double-Unders',
    primary_muscles: ['érecteurs', 'abdominaux', 'quadriceps', 'mollets'],
    secondary_muscles: ['fessiers'],
    equipment: [],
    sets_min: 3,
    sets_max: 3,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Clovis Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '10 Rounds 5 Pull-ups 10 Push-ups 15 Squats For Time Cindy variant',
    primary_muscles: ['dorsaux', 'pectoraux', 'quadriceps'],
    secondary_muscles: ['biceps', 'triceps', 'fessiers'],
    equipment: ['pull-up bar'],
    sets_min: 10,
    sets_max: 10,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Whitten Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '5 Rounds 22 KB Swings 53lbs 22 Box Jumps 20in 400m Run 22 Burpees',
    primary_muscles: ['fessiers', 'quadriceps', 'mollets', 'pectoraux'],
    secondary_muscles: ['ischio-jambiers', 'deltoïdes', 'triceps'],
    equipment: ['kettlebell'],
    sets_min: 5,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Manion Hero WOD',
    category: 'hero_wod',
    difficulty: 'advanced',
    description: '7 Rounds 29 Back Squats 135lbs 400m Run hommage fallen hero',
    primary_muscles: ['quadriceps', 'mollets'],
    secondary_muscles: ['fessiers', 'érecteurs', 'ischio-jambiers'],
    equipment: ['barbell'],
    sets_min: 7,
    sets_max: 7,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
];

async function main() {
  console.log('🦸 Seeding Functional Benchmark Heroes WODs (20 exercises)...\n');

  let success = 0;
  let failed = 0;

  for (const ex of heroesWods) {
    try {
      await seedExercise(ex);
      success++;
    } catch (error) {
      console.error(`❌ Failed to seed ${ex.name}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Success: ${success}/${heroesWods.length}`);
  console.log(`❌ Failed: ${failed}/${heroesWods.length}`);
  console.log('\n🎯 Benchmark Heroes WODs enrichment complete!');
}

main().then(() => process.exit(0));

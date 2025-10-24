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
    discipline: ex.discipline,
    category: ex.category,
    difficulty: ex.difficulty,
    description_short: ex.description,
    movement_pattern: ex.movement_pattern,
    is_validated: true,
    typical_sets_min: ex.sets_min || 3,
    typical_sets_max: ex.sets_max || 5,
    typical_reps_min: ex.reps_min || 6,
    typical_reps_max: ex.reps_max || 12,
    typical_rest_sec: ex.rest_sec || 90,
  }).select().single();

  if (error || !exercise) return;

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
}

const extendedFunctionalExercises = [
  // OLYMPIC LIFTS VARIATIONS - 20 exercices
  { name: 'Muscle Clean', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'No dip clean', primary_muscles: ['dorsaux', 'trapèzes'], equipment: ['barbell'], reps_min: 3, reps_max: 5 },
  { name: 'Hang Power Clean', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'Above knee clean', primary_muscles: ['fessiers', 'dorsaux'], equipment: ['barbell'] },
  { name: 'High Hang Clean', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'Hip level clean', primary_muscles: ['fessiers', 'trapèzes'], equipment: ['barbell'] },
  { name: 'Dumbbell Clean', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'Dumbbell variation', primary_muscles: ['fessiers', 'deltoides'], equipment: ['dumbbell'] },
  { name: 'Single Arm Dumbbell Clean', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'Unilateral clean', primary_muscles: ['fessiers', 'deltoides'], equipment: ['dumbbell'] },
  { name: 'Kettlebell Clean', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'Kettlebell clean', primary_muscles: ['fessiers', 'deltoides'], equipment: ['kettlebell'] },
  { name: 'Muscle Snatch', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'No dip snatch', primary_muscles: ['deltoides', 'trapèzes'], equipment: ['barbell'] },
  { name: 'High Hang Snatch', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'Hip snatch', primary_muscles: ['fessiers', 'deltoides'], equipment: ['barbell'] },
  { name: 'Dumbbell Snatch', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'DB overhead', primary_muscles: ['fessiers', 'deltoides'], equipment: ['dumbbell'] },
  { name: 'Kettlebell Snatch', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'KB overhead', primary_muscles: ['fessiers', 'deltoides'], equipment: ['kettlebell'] },
  { name: 'Power Jerk', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'Jerk variation', primary_muscles: ['deltoides'], equipment: ['barbell'] },
  { name: 'Dumbbell Jerk', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'DB overhead', primary_muscles: ['deltoides'], equipment: ['dumbbell'] },
  { name: 'Clean High Pull', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'Partial clean', primary_muscles: ['dorsaux', 'trapèzes'], equipment: ['barbell'] },
  { name: 'Snatch High Pull', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'Partial snatch', primary_muscles: ['dorsaux', 'trapèzes'], equipment: ['barbell'] },
  { name: 'Clean Pull', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'Deadlift to shrug', primary_muscles: ['dorsaux', 'trapèzes'], equipment: ['barbell'] },
  { name: 'Snatch Pull', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'Wide grip pull', primary_muscles: ['dorsaux', 'trapèzes'], equipment: ['barbell'] },

  // GYMNASTIC VARIATIONS - 20 exercices
  { name: 'Chest to Bar Pull-up', discipline: 'functional', category: 'gymnastic', difficulty: 'intermediate', description: 'High pull-up', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'], reps_min: 10, reps_max: 20 },
  { name: 'Bar Facing Burpee', discipline: 'functional', category: 'gymnastic', difficulty: 'beginner', description: 'Burpee over bar', primary_muscles: ['corps-complet'], equipment: ['barbell'] },
  { name: 'Box Facing Burpee', discipline: 'functional', category: 'gymnastic', difficulty: 'beginner', description: 'Burpee over box', primary_muscles: ['corps-complet'], equipment: ['box'] },
  { name: 'Devil Press', discipline: 'functional', category: 'gymnastic', difficulty: 'advanced', description: 'Burpee to overhead', primary_muscles: ['corps-complet'], equipment: ['dumbbell'] },
  { name: 'Man Maker', discipline: 'functional', category: 'gymnastic', difficulty: 'advanced', description: 'Complex movement', primary_muscles: ['corps-complet'], equipment: ['dumbbell'] },
  { name: 'Deficit HSPU', discipline: 'functional', category: 'gymnastic', difficulty: 'elite', description: 'Elevated handstand', primary_muscles: ['deltoides'], equipment: ['wall', 'weight-plates'] },
  { name: 'Freestanding HSPU', discipline: 'functional', category: 'gymnastic', difficulty: 'elite', description: 'No wall support', primary_muscles: ['deltoides'], equipment: ['floor'] },
  { name: 'L-Sit Pull-up', discipline: 'functional', category: 'gymnastic', difficulty: 'advanced', description: 'Core engaged pull', primary_muscles: ['dorsaux', 'abdominaux'], equipment: ['pull-up-bar'] },
  { name: 'Pistol Squat', discipline: 'functional', category: 'gymnastic', difficulty: 'advanced', description: 'Single leg squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['floor'] },
  { name: 'Ring Row', discipline: 'functional', category: 'gymnastic', difficulty: 'beginner', description: 'Horizontal row', primary_muscles: ['dorsaux'], equipment: ['gymnastic-rings'] },
  { name: 'Ring Push-up', discipline: 'functional', category: 'gymnastic', difficulty: 'intermediate', description: 'Unstable push', primary_muscles: ['pectoraux'], equipment: ['gymnastic-rings'] },
  { name: 'Ring Dip', discipline: 'functional', category: 'gymnastic', difficulty: 'advanced', description: 'Ring dips', primary_muscles: ['pectoraux', 'triceps'], equipment: ['gymnastic-rings'] },
  { name: 'GHD Sit-up', discipline: 'functional', category: 'gymnastic', difficulty: 'intermediate', description: 'Hip flexion', primary_muscles: ['abdominaux'], equipment: ['ghd'] },
  { name: 'GHD Hip Extension', discipline: 'functional', category: 'gymnastic', difficulty: 'beginner', description: 'Back extension', primary_muscles: ['lombaires', 'fessiers'], equipment: ['ghd'] },
  { name: 'V-Up', discipline: 'functional', category: 'gymnastic', difficulty: 'intermediate', description: 'Pike sit-up', primary_muscles: ['abdominaux'], equipment: ['floor'] },

  // WEIGHTED MOVEMENTS - 25 exercices
  { name: 'Barbell Thruster', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Squat to press', primary_muscles: ['quadriceps', 'deltoides'], equipment: ['barbell'], reps_min: 15, reps_max: 25 },
  { name: 'Cluster', discipline: 'functional', category: 'weighted', difficulty: 'advanced', description: 'Clean to thruster', primary_muscles: ['corps-complet'], equipment: ['barbell'] },
  { name: 'Overhead Squat', discipline: 'functional', category: 'weighted', difficulty: 'advanced', description: 'Squat with bar overhead', primary_muscles: ['quadriceps', 'deltoides'], equipment: ['barbell'] },
  { name: 'Overhead Walking Lunge', discipline: 'functional', category: 'weighted', difficulty: 'advanced', description: 'Lunge with overhead', primary_muscles: ['quadriceps', 'deltoides'], equipment: ['barbell'] },
  { name: 'Russian Kettlebell Swing', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Eye level swing', primary_muscles: ['fessiers', 'ischiojambiers'], equipment: ['kettlebell'] },
  { name: 'Single Arm Kettlebell Swing', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Unilateral swing', primary_muscles: ['fessiers'], equipment: ['kettlebell'] },
  { name: 'Kettlebell Goblet Squat', discipline: 'functional', category: 'weighted', difficulty: 'beginner', description: 'Front loaded squat', primary_muscles: ['quadriceps'], equipment: ['kettlebell'] },
  { name: 'Turkish Get-Up', discipline: 'functional', category: 'weighted', difficulty: 'advanced', description: 'Complex movement', primary_muscles: ['corps-complet'], equipment: ['kettlebell'] },
  { name: 'Windmill', discipline: 'functional', category: 'weighted', difficulty: 'advanced', description: 'Lateral bend', primary_muscles: ['obliques'], equipment: ['kettlebell'] },
  { name: 'Sandbag Carry', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Loaded carry', primary_muscles: ['trapèzes', 'abdominaux'], equipment: ['sandbag'] },
  { name: 'Sandbag Clean', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Bag to shoulder', primary_muscles: ['fessiers', 'dorsaux'], equipment: ['sandbag'] },
  { name: 'Sandbag Over Shoulder', discipline: 'functional', category: 'weighted', difficulty: 'advanced', description: 'Explosive throw', primary_muscles: ['corps-complet'], equipment: ['sandbag'] },
  { name: 'Medicine Ball Slam', discipline: 'functional', category: 'weighted', difficulty: 'beginner', description: 'Overhead slam', primary_muscles: ['abdominaux', 'dorsaux'], equipment: ['medicine-ball'] },
  { name: 'Medicine Ball Clean', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Ball to shoulder', primary_muscles: ['fessiers'], equipment: ['medicine-ball'] },
  { name: 'Box Step-up', discipline: 'functional', category: 'weighted', difficulty: 'beginner', description: 'Single leg step', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['box'] },
  { name: 'Burpee Box Jump Over', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Burpee with jump', primary_muscles: ['corps-complet'], equipment: ['box'] },
  { name: 'Lateral Box Jump', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Side to side jump', primary_muscles: ['quadriceps'], equipment: ['box'] },
  { name: 'Tire Flip', discipline: 'functional', category: 'weighted', difficulty: 'advanced', description: 'Heavy tire flip', primary_muscles: ['corps-complet'], equipment: ['tire'] },
  { name: 'Sled Push', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Forward sled push', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['sled'] },
  { name: 'Sled Pull', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Backward sled pull', primary_muscles: ['ischiojambiers', 'dorsaux'], equipment: ['sled'] },
  { name: 'Sled Drag', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Walking sled drag', primary_muscles: ['quadriceps'], equipment: ['sled'] },
  { name: 'Rope Climb', discipline: 'functional', category: 'weighted', difficulty: 'advanced', description: 'Climbing rope', primary_muscles: ['dorsaux', 'avant-bras'], equipment: ['rope'] },
  { name: 'Legless Rope Climb', discipline: 'functional', category: 'weighted', difficulty: 'elite', description: 'Arms only climb', primary_muscles: ['dorsaux', 'biceps'], equipment: ['rope'] },

  // BENCHMARK WODS - 10 exercices
  { name: 'Cindy', discipline: 'functional', category: 'benchmark', difficulty: 'intermediate', description: '20min AMRAP 5-10-15', primary_muscles: ['corps-complet'], equipment: ['pull-up-bar'], reps_min: 5, reps_max: 20 },
  { name: 'Mary', discipline: 'functional', category: 'benchmark', difficulty: 'intermediate', description: '20min AMRAP gymnastics', primary_muscles: ['corps-complet'], equipment: ['pull-up-bar'] },
  { name: 'Barbara', discipline: 'functional', category: 'benchmark', difficulty: 'advanced', description: '5 rounds 20-30-40-50', primary_muscles: ['corps-complet'], equipment: ['pull-up-bar'] },
  { name: 'Jackie', discipline: 'functional', category: 'benchmark', difficulty: 'intermediate', description: 'Row-Thruster-PU for time', primary_muscles: ['corps-complet'], equipment: ['rowing-machine', 'barbell', 'pull-up-bar'] },
  { name: 'Chelsea', discipline: 'functional', category: 'benchmark', difficulty: 'advanced', description: '30min EMOM 5-10-15', primary_muscles: ['corps-complet'], equipment: ['pull-up-bar'] },
  { name: 'Nancy', discipline: 'functional', category: 'benchmark', difficulty: 'intermediate', description: '5 rounds run + OHS', primary_muscles: ['corps-complet'], equipment: ['barbell'] },
  { name: 'Eva', discipline: 'functional', category: 'benchmark', difficulty: 'advanced', description: '5 rounds run-KB-PU', primary_muscles: ['corps-complet'], equipment: ['kettlebell', 'pull-up-bar'] },
  { name: 'Kelly', discipline: 'functional', category: 'benchmark', difficulty: 'intermediate', description: '5 rounds run-box-wallball', primary_muscles: ['corps-complet'], equipment: ['box', 'medicine-ball'] },
];

async function main() {
  console.log('🚀 Seeding extended Functional exercises...\n');

  let success = 0;
  let failed = 0;

  for (const ex of extendedFunctionalExercises) {
    try {
      await seedExercise(ex);
      success++;
      process.stdout.write(`\r✅ Seeded: ${success}/${extendedFunctionalExercises.length}`);
    } catch (error) {
      failed++;
      console.error(`\n❌ Failed: ${ex.name}`);
    }
  }

  console.log(`\n\n✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total Functional exercises added: ${extendedFunctionalExercises.length}`);
}

main();

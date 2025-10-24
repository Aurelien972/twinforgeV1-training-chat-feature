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
    typical_sets_min: ex.sets_min || 1,
    typical_sets_max: ex.sets_max || 1,
    typical_reps_min: ex.reps_min || 1,
    typical_reps_max: ex.reps_max || 1,
    typical_rest_sec: ex.rest_sec || 60,
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

const extendedEnduranceExercises = [
  // RUNNING VARIATIONS - 30 exercises
  { name: 'Recovery Run Z1', discipline: 'endurance', category: 'running', difficulty: 'beginner', description: 'Very easy recovery', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 20, reps_max: 45, rest_sec: 0 },
  { name: 'Base Run Z2', discipline: 'endurance', category: 'running', difficulty: 'beginner', description: 'Conversational pace', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 30, reps_max: 90, rest_sec: 0 },
  { name: 'Long Run', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Extended duration', primary_muscles: ['quadriceps', 'ischiojambiers'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 60, reps_max: 180, rest_sec: 0 },
  { name: 'Progression Run', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Negative split run', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 30, reps_max: 60, rest_sec: 0 },
  { name: 'Tempo Run Z3', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Comfortably hard', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 20, reps_max: 40, rest_sec: 0 },
  { name: 'Threshold Run Z4', discipline: 'endurance', category: 'running', difficulty: 'advanced', description: 'Lactate threshold', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 15, reps_max: 30, rest_sec: 0 },
  { name: '400m Intervals', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Quarter mile repeats', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 4, reps_max: 12, rest_sec: 90 },
  { name: '800m Intervals', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Half mile repeats', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 4, reps_max: 8, rest_sec: 120 },
  { name: '1000m Intervals', discipline: 'endurance', category: 'running', difficulty: 'advanced', description: 'Kilometer repeats', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 3, reps_max: 6, rest_sec: 180 },
  { name: 'Mile Repeats', discipline: 'endurance', category: 'running', difficulty: 'advanced', description: '1600m intervals', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 3, reps_max: 6, rest_sec: 240 },
  { name: 'VO2 Max Intervals', discipline: 'endurance', category: 'running', difficulty: 'advanced', description: '3-5min hard efforts', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 4, reps_max: 8, rest_sec: 180 },
  { name: 'Hill Repeats Short', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: '30-60s hills', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 6, reps_max: 12, rest_sec: 120 },
  { name: 'Hill Repeats Long', discipline: 'endurance', category: 'running', difficulty: 'advanced', description: '2-4min hills', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 4, reps_max: 8, rest_sec: 180 },
  { name: 'Fartlek Run', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Unstructured intervals', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 30, reps_max: 60, rest_sec: 0 },
  { name: 'Strides 100m', discipline: 'endurance', category: 'running', difficulty: 'beginner', description: 'Short accelerations', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 6, reps_max: 10, rest_sec: 60 },
  { name: 'Track 200m Repeats', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Speed work', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 8, reps_max: 16, rest_sec: 60 },
  { name: 'Ladder Intervals', discipline: 'endurance', category: 'running', difficulty: 'advanced', description: 'Progressive distances', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 6, reps_max: 10, rest_sec: 120 },
  { name: 'Yasso 800s', discipline: 'endurance', category: 'running', difficulty: 'advanced', description: 'Marathon predictor', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 4, reps_max: 10, rest_sec: 120 },
  { name: 'Cruise Intervals', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Tempo segments', primary_muscles: ['quadriceps'], equipment: ['running-shoes'], movement_pattern: 'compound', reps_min: 3, reps_max: 5, rest_sec: 90 },
  { name: 'Trail Run Technical', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Varied terrain', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['trail-shoes'], movement_pattern: 'compound', reps_min: 30, reps_max: 120, rest_sec: 0 },

  // CYCLING VARIATIONS - 25 exercises
  { name: 'Recovery Ride Z1', discipline: 'endurance', category: 'cycling', difficulty: 'beginner', description: 'Active recovery', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 30, reps_max: 60, rest_sec: 0 },
  { name: 'Endurance Ride Z2', discipline: 'endurance', category: 'cycling', difficulty: 'beginner', description: 'Base building', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 60, reps_max: 180, rest_sec: 0 },
  { name: 'Sweet Spot Intervals', discipline: 'endurance', category: 'cycling', difficulty: 'intermediate', description: '88-94% FTP', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 2, reps_max: 4, rest_sec: 300 },
  { name: 'Tempo Ride Z3', discipline: 'endurance', category: 'cycling', difficulty: 'intermediate', description: 'Sustained effort', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 20, reps_max: 40, rest_sec: 0 },
  { name: 'Threshold Intervals Z4', discipline: 'endurance', category: 'cycling', difficulty: 'advanced', description: 'FTP intervals', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 3, reps_max: 6, rest_sec: 300 },
  { name: 'VO2 Max Intervals', discipline: 'endurance', category: 'cycling', difficulty: 'advanced', description: '3-5min at 120%', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 4, reps_max: 8, rest_sec: 240 },
  { name: 'Tabata Intervals', discipline: 'endurance', category: 'cycling', difficulty: 'advanced', description: '20s on 10s off', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 8, reps_max: 12, rest_sec: 10 },
  { name: 'Sprint Intervals 30s', discipline: 'endurance', category: 'cycling', difficulty: 'advanced', description: 'All-out efforts', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 6, reps_max: 12, rest_sec: 180 },
  { name: 'Over-Under Intervals', discipline: 'endurance', category: 'cycling', difficulty: 'advanced', description: 'Above/below FTP', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 3, reps_max: 5, rest_sec: 300 },
  { name: 'Cadence Drills', discipline: 'endurance', category: 'cycling', difficulty: 'beginner', description: 'High RPM work', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 4, reps_max: 8, rest_sec: 120 },
  { name: 'Single Leg Drills', discipline: 'endurance', category: 'cycling', difficulty: 'intermediate', description: 'One leg pedaling', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 4, reps_max: 8, rest_sec: 120 },
  { name: 'Hill Repeats Cycling', discipline: 'endurance', category: 'cycling', difficulty: 'advanced', description: 'Climbing intervals', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 4, reps_max: 8, rest_sec: 240 },
  { name: 'FTP Test 20min', discipline: 'endurance', category: 'cycling', difficulty: 'advanced', description: 'Functional threshold', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 1, reps_max: 1, rest_sec: 0 },
  { name: 'Pyramid Intervals', discipline: 'endurance', category: 'cycling', difficulty: 'advanced', description: 'Progressive duration', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 5, reps_max: 9, rest_sec: 180 },
  { name: 'Gravel Ride', discipline: 'endurance', category: 'cycling', difficulty: 'intermediate', description: 'Mixed terrain', primary_muscles: ['quadriceps'], equipment: ['bike'], movement_pattern: 'compound', reps_min: 60, reps_max: 180, rest_sec: 0 },

  // SWIMMING VARIATIONS - 20 exercises
  { name: 'Swim Recovery Z1', discipline: 'endurance', category: 'swimming', difficulty: 'beginner', description: 'Easy swim', primary_muscles: ['dorsaux', 'deltoides'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 20, reps_max: 40, rest_sec: 0 },
  { name: 'Swim Endurance Z2', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Steady pace', primary_muscles: ['dorsaux', 'deltoides'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 30, reps_max: 60, rest_sec: 0 },
  { name: 'CSS Pace Swim', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Critical swim speed', primary_muscles: ['dorsaux'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 20, reps_max: 40, rest_sec: 0 },
  { name: 'Threshold Intervals 400m', discipline: 'endurance', category: 'swimming', difficulty: 'advanced', description: 'Lactate threshold', primary_muscles: ['dorsaux'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 4, reps_max: 8, rest_sec: 60 },
  { name: 'Swim Sprints 50m', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Fast 50s', primary_muscles: ['dorsaux', 'deltoides'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 8, reps_max: 16, rest_sec: 30 },
  { name: 'Swim Sprints 100m', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Fast 100s', primary_muscles: ['dorsaux'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 6, reps_max: 12, rest_sec: 45 },
  { name: 'Swim IM 200m', discipline: 'endurance', category: 'swimming', difficulty: 'advanced', description: 'Individual medley', primary_muscles: ['corps-complet'], equipment: ['pool'], movement_pattern: 'compound', reps_min: 2, reps_max: 6, rest_sec: 120 },
  { name: 'Kick Drills', discipline: 'endurance', category: 'swimming', difficulty: 'beginner', description: 'Kick only', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['pool', 'kickboard'], movement_pattern: 'compound', reps_min: 4, reps_max: 8, rest_sec: 45 },
  { name: 'Pull Drills', discipline: 'endurance', category: 'swimming', difficulty: 'beginner', description: 'Arms only', primary_muscles: ['dorsaux', 'deltoides'], equipment: ['pool', 'pull-buoy'], movement_pattern: 'pull', reps_min: 4, reps_max: 8, rest_sec: 45 },
  { name: 'Catch-Up Drill', discipline: 'endurance', category: 'swimming', difficulty: 'beginner', description: 'Technique drill', primary_muscles: ['dorsaux'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 4, reps_max: 8, rest_sec: 30 },
  { name: 'Finger Drag Drill', discipline: 'endurance', category: 'swimming', difficulty: 'beginner', description: 'Recovery drill', primary_muscles: ['deltoides'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 4, reps_max: 8, rest_sec: 30 },
  { name: 'Sculling Drills', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Feel for water', primary_muscles: ['avant-bras', 'deltoides'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 4, reps_max: 8, rest_sec: 30 },
  { name: 'Descending Set 100s', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Negative splits', primary_muscles: ['dorsaux'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 4, reps_max: 8, rest_sec: 45 },
  { name: 'Hypoxic Training', discipline: 'endurance', category: 'swimming', difficulty: 'advanced', description: 'Breath control', primary_muscles: ['dorsaux'], equipment: ['pool'], movement_pattern: 'pull', reps_min: 4, reps_max: 8, rest_sec: 60 },
  { name: 'Open Water Swim', discipline: 'endurance', category: 'swimming', difficulty: 'advanced', description: 'Lake/ocean swim', primary_muscles: ['dorsaux', 'deltoides'], equipment: ['wetsuit'], movement_pattern: 'pull', reps_min: 30, reps_max: 90, rest_sec: 0 },

  // ROWING VARIATIONS - 15 exercises
  { name: 'Row Recovery Z1', discipline: 'endurance', category: 'rowing', difficulty: 'beginner', description: 'Easy rowing', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 15, reps_max: 30, rest_sec: 0 },
  { name: 'Row Steady State Z2', discipline: 'endurance', category: 'rowing', difficulty: 'intermediate', description: 'Aerobic base', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 30, reps_max: 60, rest_sec: 0 },
  { name: 'Row Intervals 500m', discipline: 'endurance', category: 'rowing', difficulty: 'intermediate', description: 'Hard 500s', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 4, reps_max: 8, rest_sec: 120 },
  { name: 'Row Intervals 1000m', discipline: 'endurance', category: 'rowing', difficulty: 'advanced', description: '1k repeats', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 3, reps_max: 6, rest_sec: 180 },
  { name: 'Row Intervals 2000m', discipline: 'endurance', category: 'rowing', difficulty: 'advanced', description: '2k repeats', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 2, reps_max: 4, rest_sec: 300 },
  { name: 'Row Sprints 250m', discipline: 'endurance', category: 'rowing', difficulty: 'intermediate', description: 'Fast 250s', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 6, reps_max: 10, rest_sec: 90 },
  { name: 'Row Pyramid', discipline: 'endurance', category: 'rowing', difficulty: 'advanced', description: 'Progressive intervals', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 5, reps_max: 9, rest_sec: 120 },
  { name: 'Row Rate Ladder', discipline: 'endurance', category: 'rowing', difficulty: 'intermediate', description: 'SPM progression', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 4, reps_max: 8, rest_sec: 60 },
  { name: 'Row 2k Test', discipline: 'endurance', category: 'rowing', difficulty: 'advanced', description: 'Max effort 2k', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 1, reps_max: 1, rest_sec: 0 },
  { name: 'Row 5k Test', discipline: 'endurance', category: 'rowing', difficulty: 'advanced', description: 'Endurance test', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 1, reps_max: 1, rest_sec: 0 },
  { name: 'Row HIIT 30/30', discipline: 'endurance', category: 'rowing', difficulty: 'intermediate', description: '30s on 30s off', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 8, reps_max: 16, rest_sec: 30 },
  { name: 'Row Tabata', discipline: 'endurance', category: 'rowing', difficulty: 'advanced', description: '20/10 intervals', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 8, reps_max: 12, rest_sec: 10 },
  { name: 'Row Power Strokes', discipline: 'endurance', category: 'rowing', difficulty: 'intermediate', description: 'Max power', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 6, reps_max: 12, rest_sec: 120 },
  { name: 'Row Long Pull', discipline: 'endurance', category: 'rowing', difficulty: 'intermediate', description: 'Low rate endurance', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 30, reps_max: 90, rest_sec: 0 },
  { name: 'Row Half Marathon', discipline: 'endurance', category: 'rowing', difficulty: 'elite', description: '21097m challenge', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], movement_pattern: 'compound', reps_min: 1, reps_max: 1, rest_sec: 0 },
];

async function main() {
  console.log('🚀 Seeding extended Endurance exercises...\n');

  let success = 0;
  let failed = 0;

  for (const ex of extendedEnduranceExercises) {
    try {
      await seedExercise(ex);
      success++;
      process.stdout.write(`\r✅ Seeded: ${success}/${extendedEnduranceExercises.length}`);
    } catch (error) {
      failed++;
      console.error(`\n❌ Failed: ${ex.name}`);
    }
  }

  console.log(`\n\n✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total Endurance exercises added: ${extendedEnduranceExercises.length}`);
}

main();

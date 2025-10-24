import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MuscleAssignment {
  exerciseName: string;
  muscles: Array<{
    muscle: string;
    involvement: 'primary' | 'secondary' | 'stabilizer';
  }>;
}

// Mapping DEKA exercises to their muscle groups
const dekaExercisesMuscles: MuscleAssignment[] = [
  {
    exerciseName: 'DEKA STRONG Overhead Press Strength',
    muscles: [
      { muscle: 'shoulders', involvement: 'primary' },
      { muscle: 'triceps', involvement: 'secondary' },
      { muscle: 'core', involvement: 'stabilizer' }
    ]
  },
  {
    exerciseName: 'DEKA Zone 2 Floor to Overhead 20 Reps',
    muscles: [
      { muscle: 'shoulders', involvement: 'primary' },
      { muscle: 'quads', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'core', involvement: 'secondary' },
      { muscle: 'triceps', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA STRONG Bench Press Max Effort',
    muscles: [
      { muscle: 'chest', involvement: 'primary' },
      { muscle: 'triceps', involvement: 'secondary' },
      { muscle: 'shoulders', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA Zone 2 Goblet Squats 30 Reps',
    muscles: [
      { muscle: 'quads', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'core', involvement: 'secondary' },
      { muscle: 'hamstrings', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA STRONG Heavy Deadlifts Max Reps',
    muscles: [
      { muscle: 'hamstrings', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'lower-back', involvement: 'primary' },
      { muscle: 'lats', involvement: 'secondary' },
      { muscle: 'trapezes', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA STRONG Back Squats Max Weight',
    muscles: [
      { muscle: 'quads', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'hamstrings', involvement: 'secondary' },
      { muscle: 'core', involvement: 'stabilizer' },
      { muscle: 'lower-back', involvement: 'stabilizer' }
    ]
  },
  {
    exerciseName: 'DEKA STRONG Zone 6 Box Step-Overs 20 Reps',
    muscles: [
      { muscle: 'quads', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'hamstrings', involvement: 'secondary' },
      { muscle: 'calves', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA MILE Box Jump Speed 30 Reps',
    muscles: [
      { muscle: 'quads', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'calves', involvement: 'primary' },
      { muscle: 'hamstrings', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA MILE BikeErg Sprint 1000m',
    muscles: [
      { muscle: 'quads', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'calves', involvement: 'secondary' },
      { muscle: 'hamstrings', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA MILE Box Jumps Quick 40 Reps',
    muscles: [
      { muscle: 'quads', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'calves', involvement: 'primary' },
      { muscle: 'hamstrings', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA Zone 6 Box Step-Overs 20 Reps',
    muscles: [
      { muscle: 'quads', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'hamstrings', involvement: 'secondary' },
      { muscle: 'calves', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA Zone 1 Box Jumps 30 Reps',
    muscles: [
      { muscle: 'quads', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'calves', involvement: 'primary' },
      { muscle: 'hamstrings', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA STRONG Max Effort Protocols',
    muscles: [
      { muscle: 'corps-complet', involvement: 'primary' },
      { muscle: 'core', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA STRONG Max Effort Protocol',
    muscles: [
      { muscle: 'corps-complet', involvement: 'primary' },
      { muscle: 'core', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA STRONG Full Race Max Effort',
    muscles: [
      { muscle: 'corps-complet', involvement: 'primary' },
      { muscle: 'systeme-cardiovasculaire', involvement: 'primary' }
    ]
  },
  {
    exerciseName: 'DEKA STRONG Heavy Carries Max Distance',
    muscles: [
      { muscle: 'trapezes', involvement: 'primary' },
      { muscle: 'avant-bras', involvement: 'primary' },
      { muscle: 'core', involvement: 'primary' },
      { muscle: 'quads', involvement: 'secondary' },
      { muscle: 'glutes', involvement: 'secondary' }
    ]
  },
  {
    exerciseName: 'DEKA STRONG Sandbag Clean Max Reps',
    muscles: [
      { muscle: 'hamstrings', involvement: 'primary' },
      { muscle: 'glutes', involvement: 'primary' },
      { muscle: 'shoulders', involvement: 'primary' },
      { muscle: 'trapezes', involvement: 'secondary' },
      { muscle: 'core', involvement: 'secondary' }
    ]
  }
];

async function assignMuscles() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 2 - STEP 1: ASSIGNATION MUSCLES DEKA EXERCISES');
  console.log('='.repeat(80) + '\n');

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{exercise: string; error: string}> = [];

  // First, get all muscle groups to create ID mapping
  const { data: muscleGroups, error: muscleError } = await supabase
    .from('muscle_groups')
    .select('id, name');

  if (muscleError || !muscleGroups) {
    console.error('❌ Error fetching muscle groups:', muscleError);
    throw muscleError;
  }

  const muscleMap = new Map<string, string>();
  muscleGroups.forEach(mg => {
    muscleMap.set(mg.name.toLowerCase(), mg.id);
  });

  console.log(`✅ Loaded ${muscleGroups.length} muscle groups\n`);

  for (const assignment of dekaExercisesMuscles) {
    console.log(`Processing: ${assignment.exerciseName}`);

    // Find exercise by name
    const { data: exercises, error: exError } = await supabase
      .from('exercises')
      .select('id, name')
      .ilike('name', assignment.exerciseName)
      .limit(1);

    if (exError || !exercises || exercises.length === 0) {
      console.log(`   ⚠️  Exercise not found or error: ${assignment.exerciseName}`);
      errors.push({ exercise: assignment.exerciseName, error: 'Not found' });
      errorCount++;
      continue;
    }

    const exerciseId = exercises[0].id;

    // Assign each muscle
    for (const muscleAssignment of assignment.muscles) {
      const muscleId = muscleMap.get(muscleAssignment.muscle.toLowerCase());

      if (!muscleId) {
        console.log(`   ⚠️  Muscle not found: ${muscleAssignment.muscle}`);
        errors.push({
          exercise: assignment.exerciseName,
          error: `Muscle ${muscleAssignment.muscle} not found`
        });
        continue;
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from('exercise_muscle_groups')
        .select('id')
        .eq('exercise_id', exerciseId)
        .eq('muscle_group_id', muscleId)
        .maybeSingle();

      if (existing) {
        console.log(`   ℹ️  Already has ${muscleAssignment.muscle} (${muscleAssignment.involvement})`);
        continue;
      }

      // Insert new muscle assignment
      const { error: insertError } = await supabase
        .from('exercise_muscle_groups')
        .insert({
          exercise_id: exerciseId,
          muscle_group_id: muscleId,
          involvement_type: muscleAssignment.involvement
        });

      if (insertError) {
        console.log(`   ❌ Error inserting ${muscleAssignment.muscle}: ${insertError.message}`);
        errors.push({
          exercise: assignment.exerciseName,
          error: `Insert failed for ${muscleAssignment.muscle}`
        });
        errorCount++;
      } else {
        console.log(`   ✅ Added ${muscleAssignment.muscle} (${muscleAssignment.involvement})`);
        successCount++;
      }
    }

    console.log('');
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS');
  console.log('='.repeat(80));
  console.log(`✅ Muscles assignés avec succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Détail des erreurs:');
    errors.forEach(err => {
      console.log(`   - ${err.exercise}: ${err.error}`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

async function verify() {
  console.log('🔍 VERIFICATION POST-ASSIGNATION\n');

  const { data: exercisesWithoutMuscles } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      discipline,
      exercise_muscle_groups(muscle_group_id)
    `)
    .eq('discipline', 'competitions')
    .ilike('name', 'DEKA%');

  const stillMissing = (exercisesWithoutMuscles || []).filter(
    ex => !ex.exercise_muscle_groups || ex.exercise_muscle_groups.length === 0
  );

  console.log(`✅ DEKA exercises avec muscles: ${(exercisesWithoutMuscles?.length || 0) - stillMissing.length}`);
  console.log(`❌ DEKA exercises SANS muscles: ${stillMissing.length}`);

  if (stillMissing.length > 0) {
    console.log('\nExercices restants sans muscles:');
    stillMissing.forEach(ex => {
      console.log(`   - ${ex.name}`);
    });
  }

  console.log('');
}

async function main() {
  try {
    await assignMuscles();
    await verify();
    console.log('✅ SPRINT 2 STEP 1 COMPLÉTÉ\n');
  } catch (error) {
    console.error('❌ ERREUR:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

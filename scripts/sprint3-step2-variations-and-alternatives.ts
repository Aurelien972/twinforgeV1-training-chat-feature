import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createVariationsAndAlternatives() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 3 - STEP 2: VARIATIONS & ALTERNATIVES');
  console.log('='.repeat(80) + '\n');

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, difficulty, discipline')
    .eq('is_active', true)
    .in('discipline', ['force', 'calisthenics', 'functional']);

  if (!exercises) {
    console.error('❌ Erreur récupération exercices');
    return;
  }

  const progressions: any[] = [];

  console.log('🔄 Création variations latérales et alternatives...\n');

  // 1. ALTERNATIVES D'ÉQUIPEMENT (Equipment alternatives)
  console.log('📍 ALTERNATIVES ÉQUIPEMENT\n');

  const equipmentAlternatives = [
    // Barbell → Dumbbell
    { from: 'Barbell Bench Press', to: 'Dumbbell Bench Press', reason: 'Alternative sans barre' },
    { from: 'Barbell Squat', to: 'Dumbbell Squat', reason: 'Alternative sans barre' },
    { from: 'Barbell Row', to: 'Dumbbell Row', reason: 'Alternative sans barre' },
    { from: 'Barbell Curl', to: 'Dumbbell Curl', reason: 'Alternative sans barre' },
    { from: 'Barbell Overhead Press', to: 'Dumbbell Press', reason: 'Alternative sans barre' },

    // Machine → Free weights
    { from: 'Leg Press', to: 'Squat', reason: 'Alternative poids libres' },
    { from: 'Chest Press Machine', to: 'Bench Press', reason: 'Alternative poids libres' },
    { from: 'Lat Pulldown', to: 'Pull-up', reason: 'Alternative poids libres' },
    { from: 'Leg Curl Machine', to: 'Romanian Deadlift', reason: 'Alternative poids libres' },
    { from: 'Leg Extension', to: 'Front Squat', reason: 'Alternative poids libres' },

    // Cable → Dumbbell
    { from: 'Cable Fly', to: 'Dumbbell Fly', reason: 'Alternative sans câble' },
    { from: 'Cable Row', to: 'Dumbbell Row', reason: 'Alternative sans câble' },
    { from: 'Cable Curl', to: 'Dumbbell Curl', reason: 'Alternative sans câble' },
    { from: 'Cable Lateral Raise', to: 'Dumbbell Lateral Raise', reason: 'Alternative sans câble' },

    // Bodyweight alternatives
    { from: 'Lat Pulldown', to: 'Inverted Row', reason: 'Alternative bodyweight' },
    { from: 'Leg Press', to: 'Goblet Squat', reason: 'Alternative bodyweight' },
    { from: 'Bench Press', to: 'Push-up', reason: 'Alternative bodyweight' },

    // Home/outdoor alternatives
    { from: 'Barbell Squat', to: 'Pistol Squat', reason: 'Alternative à domicile' },
    { from: 'Bench Press', to: 'Pike Push-up', reason: 'Alternative à domicile' },
    { from: 'Lat Pulldown', to: 'Pull-up', reason: 'Alternative extérieur' }
  ];

  let altCount = 0;
  for (const alt of equipmentAlternatives) {
    const fromEx = exercises.find(ex => ex.name.toLowerCase().includes(alt.from.toLowerCase()));
    const toEx = exercises.find(ex => ex.name.toLowerCase().includes(alt.to.toLowerCase()));

    if (fromEx && toEx && fromEx.id !== toEx.id) {
      progressions.push({
        exercise_id: fromEx.id,
        related_exercise_id: toEx.id,
        relationship_type: 'alternative',
        difficulty_delta: 0,
        progression_criteria: alt.reason,
        estimated_weeks_to_achieve: 0,
        sequence_order: 1
      });
      altCount++;

      if (altCount <= 5) {
        console.log(`   ✅ ${alt.from} ←→ ${alt.to}`);
      }
    }
  }

  if (altCount > 5) {
    console.log(`   ... et ${altCount - 5} autres alternatives`);
  }

  // 2. VARIATIONS LATÉRALES (Same difficulty, different stimulus)
  console.log('\n📍 VARIATIONS LATÉRALES\n');

  const lateralVariations = [
    // Stance variations
    { ex1: 'Back Squat', ex2: 'Front Squat', reason: 'Variation de placement barre' },
    { ex1: 'Conventional Deadlift', ex2: 'Sumo Deadlift', reason: 'Variation de stance' },
    { ex1: 'Close Grip Bench', ex2: 'Wide Grip Bench', reason: 'Variation de grip' },
    { ex1: 'Neutral Grip Pull-up', ex2: 'Wide Grip Pull-up', reason: 'Variation de grip' },

    // Angle variations
    { ex1: 'Flat Bench Press', ex2: 'Incline Bench Press', reason: "Variation d'angle" },
    { ex1: 'Flat Bench Press', ex2: 'Decline Bench Press', reason: "Variation d'angle" },
    { ex1: 'Flat Dumbbell Press', ex2: 'Incline Dumbbell Press', reason: "Variation d'angle" },

    // Movement pattern variations
    { ex1: 'Barbell Row', ex2: 'T-Bar Row', reason: 'Variation de mouvement' },
    { ex1: 'Leg Press', ex2: 'Hack Squat', reason: 'Variation de machine' },
    { ex1: 'Leg Curl', ex2: 'Nordic Curl', reason: 'Variation de tension' },

    // Unilateral variations
    { ex1: 'Squat', ex2: 'Bulgarian Split Squat', reason: 'Variation unilateral' },
    { ex1: 'Deadlift', ex2: 'Single Leg RDL', reason: 'Variation unilateral' },
    { ex1: 'Bench Press', ex2: 'Single Arm Dumbbell Press', reason: 'Variation unilateral' },

    // Tempo variations
    { ex1: 'Squat', ex2: 'Tempo Squat', reason: 'Variation de tempo' },
    { ex1: 'Deadlift', ex2: 'Tempo Deadlift', reason: 'Variation de tempo' },
    { ex1: 'Bench Press', ex2: 'Tempo Bench Press', reason: 'Variation de tempo' }
  ];

  let varCount = 0;
  for (const variation of lateralVariations) {
    const ex1 = exercises.find(ex => ex.name.toLowerCase().includes(variation.ex1.toLowerCase()));
    const ex2 = exercises.find(ex => ex.name.toLowerCase().includes(variation.ex2.toLowerCase()));

    if (ex1 && ex2 && ex1.id !== ex2.id) {
      // Bidirectional variation
      progressions.push({
        exercise_id: ex1.id,
        related_exercise_id: ex2.id,
        relationship_type: 'variation',
        difficulty_delta: 0,
        progression_criteria: variation.reason,
        estimated_weeks_to_achieve: 2,
        sequence_order: 1
      });

      progressions.push({
        exercise_id: ex2.id,
        related_exercise_id: ex1.id,
        relationship_type: 'variation',
        difficulty_delta: 0,
        progression_criteria: variation.reason,
        estimated_weeks_to_achieve: 2,
        sequence_order: 1
      });

      varCount += 2;

      if (varCount <= 10) {
        console.log(`   ✅ ${variation.ex1} ←→ ${variation.ex2}`);
      }
    }
  }

  if (varCount > 10) {
    console.log(`   ... et ${varCount - 10} autres variations`);
  }

  console.log(`\n✅ Total relations créées: ${progressions.length}`);
  console.log(`   - Alternatives équipement: ${altCount}`);
  console.log(`   - Variations latérales: ${varCount}`);

  if (progressions.length > 0) {
    console.log('\n📥 Insertion dans la base...');

    const { error } = await supabase
      .from('exercise_progressions')
      .insert(progressions);

    if (error) {
      console.error('❌ Erreur:', error.message);
    } else {
      console.log(`✅ ${progressions.length} relations insérées`);
    }
  }

  const { count } = await supabase
    .from('exercise_progressions')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total relations dans la base: ${count || 0}`);
  console.log('\n✅ SPRINT 3 STEP 2 COMPLÉTÉ');
}

createVariationsAndAlternatives().catch(console.error);

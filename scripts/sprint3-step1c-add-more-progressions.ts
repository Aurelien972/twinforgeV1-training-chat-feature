import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addMoreProgressions() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 3 - STEP 1C: PROGRESSIONS COMPLÉMENTAIRES');
  console.log('='.repeat(80) + '\n');

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, difficulty')
    .eq('discipline', 'force')
    .eq('is_active', true);

  if (!exercises) {
    console.error('❌ Erreur récupération exercices');
    return;
  }

  const progressions: any[] = [];

  // Progressions par variations d'intensité
  const intensityProgressions = [
    // Variations de volume (séries/reps)
    { from: 'Squat 5x5', to: 'Squat 10x10 GVT', type: 'variation' },
    { from: 'Squat 3x8', to: 'Squat 5x5', type: 'progression' },
    { from: 'Deadlift 1x5', to: 'Deadlift 5x5', type: 'variation' },

    // Variations de tempo
    { from: 'Squat', to: 'Tempo Squats 2-0-2-0', type: 'variation' },
    { from: 'Bench Press', to: 'Bench Press Tempo 3-2-1-0', type: 'variation' },
    { from: 'RDL', to: 'RDL Tempo 3-2-1-0', type: 'variation' },
    { from: 'RDL Tempo 3-2-1-0', to: 'RDL Tempo 5-0-1-0', type: 'progression' },

    // Variations avec pause
    { from: 'Squat', to: 'Pause Squat', type: 'variation' },
    { from: 'Pause Squat', to: 'Squat Tempo', type: 'progression' },
    { from: 'Bench Press', to: 'Bench Press with Pause', type: 'variation' },
    { from: 'Deadlift', to: 'Deadlift with Pause', type: 'variation' },

    // Variations avec chaînes/bandes
    { from: 'Squat', to: 'Squat with Chains', type: 'progression' },
    { from: 'Bench Press', to: 'Bench Press with Chains', type: 'progression' },
    { from: 'Deadlift', to: 'Deadlift with Chains', type: 'progression' },
    { from: 'Squat', to: 'Squat with Bands', type: 'progression' },
    { from: 'Bench Press', to: 'Bench Press with Bands', type: 'progression' },

    // Drop sets et rest-pause
    { from: 'Bench Press', to: 'Bench Press Rest-Pause', type: 'progression' },
    { from: 'Deadlift', to: 'Deadlift Rest-Pause', type: 'progression' },
    { from: 'Leg Extension', to: 'Leg Extension Drop Set', type: 'variation' },

    // Mechanical drop sets
    { from: 'Squat', to: 'Squat Mechanical Drop', type: 'variation' },
    { from: 'Deadlift', to: 'Deadlift Mechanical Drop', type: 'variation' },

    // Cluster sets
    { from: 'Squat', to: 'Squat Cluster Sets', type: 'variation' },
    { from: 'Bench Press', to: 'Bench Press Cluster Sets', type: 'variation' },
    { from: 'Deadlift', to: 'Deadlift Cluster Sets', type: 'variation' }
  ];

  // Progressions d'isolation
  const isolationProgressions = [
    { from: 'Leg Curl', to: 'Leg Curl Machine', type: 'variation' },
    { from: 'Leg Extension', to: 'Leg Extension Machine', type: 'variation' },
    { from: 'Bicep Curl', to: 'Barbell Curl', type: 'progression' },
    { from: 'Hammer Curl', to: 'Alternating Curl', type: 'variation' },
    { from: 'Tricep Extension', to: 'Overhead Extension', type: 'variation' },
    { from: 'Lateral Raise', to: 'Heavy Lateral Raise', type: 'progression' },
    { from: 'Face Pull', to: 'Heavy Face Pull', type: 'progression' },
    { from: 'Shrugs', to: 'Heavy Shrugs', type: 'progression' }
  ];

  // Progressions machines
  const machineProgressions = [
    { from: 'Leg Press', to: 'Leg Press Heavy', type: 'progression' },
    { from: 'Hack Squat', to: 'Hack Squat Heavy', type: 'progression' },
    { from: 'Chest Press Machine', to: 'Incline Chest Press Machine', type: 'variation' },
    { from: 'Lat Pulldown', to: 'Lat Pulldown Heavy', type: 'progression' },
    { from: 'Cable Row', to: 'Heavy Cable Row', type: 'progression' }
  ];

  // Progressions unilateral
  const unilateralProgressions = [
    { from: 'Goblet Squat', to: 'Bulgarian Split Squat', type: 'progression' },
    { from: 'Bulgarian Split Squat', to: 'Single Leg Squat', type: 'progression' },
    { from: 'Lunge', to: 'Walking Lunge', type: 'progression' },
    { from: 'Walking Lunge', to: 'Reverse Lunge', type: 'variation' },
    { from: 'Dumbbell Row', to: 'Single Arm Row', type: 'variation' },
    { from: 'Dumbbell Press', to: 'Single Arm Press', type: 'variation' }
  ];

  // Progressions strongman
  const strongmanProgressions = [
    { from: 'Farmers Walk', to: 'Farmers Walk Heavy', type: 'progression' },
    { from: 'Sled Push', to: 'Sled Push Heavy', type: 'progression' },
    { from: 'Yoke Walk', to: 'Yoke Walk Medley', type: 'progression' },
    { from: 'Atlas Stone', to: 'Atlas Stone Load', type: 'progression' },
    { from: 'Atlas Stone Load', to: 'Atlas Stone to Shoulder', type: 'progression' },
    { from: 'Log Clean', to: 'Log Press', type: 'progression' },
    { from: 'Log Press', to: 'Log Clean and Press', type: 'progression' }
  ];

  // Progressions grip variations
  const gripProgressions = [
    { from: 'Pull-up', to: 'Wide Grip Pull-up', type: 'variation' },
    { from: 'Pull-up', to: 'Close Grip Pull-up', type: 'variation' },
    { from: 'Bench Press', to: 'Wide Grip Bench', type: 'variation' },
    { from: 'Bench Press', to: 'Close Grip Bench', type: 'variation' },
    { from: 'Deadlift', to: 'Snatch Grip Deadlift', type: 'variation' },
    { from: 'Row', to: 'Wide Grip Row', type: 'variation' },
    { from: 'Row', to: 'Close Grip Row', type: 'variation' }
  ];

  const allProgressionPatterns = [
    ...intensityProgressions,
    ...isolationProgressions,
    ...machineProgressions,
    ...unilateralProgressions,
    ...strongmanProgressions,
    ...gripProgressions
  ];

  console.log(`🔍 Recherche de ${allProgressionPatterns.length} patterns de progression...\n`);

  let matchedCount = 0;

  for (const pattern of allProgressionPatterns) {
    const fromEx = exercises.find(ex =>
      ex.name.toLowerCase().includes(pattern.from.toLowerCase())
    );
    const toEx = exercises.find(ex =>
      ex.name.toLowerCase().includes(pattern.to.toLowerCase())
    );

    if (fromEx && toEx && fromEx.id !== toEx.id) {
      const diffMap: Record<string, number> = {
        'novice': 0, 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'elite': 4
      };

      const delta = pattern.type === 'progression' ? 1 : 0;

      progressions.push({
        exercise_id: fromEx.id,
        related_exercise_id: toEx.id,
        relationship_type: pattern.type,
        difficulty_delta: delta,
        progression_criteria: getCriteria(pattern.from, pattern.to, pattern.type),
        estimated_weeks_to_achieve: pattern.type === 'progression' ? 4 : 2,
        sequence_order: 1
      });

      matchedCount++;

      if (matchedCount <= 10) {
        console.log(`   ✅ ${pattern.from} → ${pattern.to} (${pattern.type})`);
      }
    }
  }

  if (matchedCount > 10) {
    console.log(`   ... et ${matchedCount - 10} autres progressions`);
  }

  console.log(`\n✅ ${progressions.length} nouvelles relations créées`);

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
  console.log('\n✅ SPRINT 3 STEP 1C COMPLÉTÉ');
}

function getCriteria(from: string, to: string, type: string): string {
  if (type === 'progression') {
    return `Maîtriser ${from} avec 3x8 reps bonne forme`;
  } else if (type === 'variation') {
    return `Varier l'entraînement pour stimulus différent`;
  } else {
    return `Alternative selon équipement disponible`;
  }
}

addMoreProgressions().catch(console.error);

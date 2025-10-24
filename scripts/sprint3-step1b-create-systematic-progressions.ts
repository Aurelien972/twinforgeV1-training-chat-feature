import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Exercise {
  id: string;
  name: string;
  difficulty: string;
  category: string;
}

async function createSystematicProgressions() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 3 - STEP 1B: PROGRESSIONS SYSTÉMATIQUES FORCE');
  console.log('='.repeat(80) + '\n');

  // Récupérer tous les exercices Force
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, difficulty, category')
    .eq('discipline', 'force')
    .eq('is_active', true);

  if (!exercises) {
    console.error('❌ Erreur récupération exercices');
    return;
  }

  console.log(`📊 ${exercises.length} exercices Force trouvés\n`);

  const progressions: any[] = [];

  // Définir les chaînes de progression classiques
  const progressionChains: Record<string, string[][]> = {
    // SQUATS - Chaînes de progression
    squat: [
      ['Goblet Squat', 'Front Squat', 'Back Squat', 'Back Squat Heavy'],
      ['Box Squat', 'Pause Squat', 'Tempo Squat'],
      ['Squat', 'Squat Pause', 'Squat Tempo'],
      ['Air Squat', 'Goblet Squat', 'Front Squat'],
      ['Wall Squat', 'Box Squat', 'Back Squat']
    ],

    // DEADLIFTS - Chaînes de progression
    deadlift: [
      ['RDL', 'Romanian Deadlift', 'Deadlift', 'Deadlift Heavy'],
      ['Trap Bar Deadlift', 'Conventional Deadlift', 'Deficit Deadlift'],
      ['Sumo Deadlift', 'Conventional Deadlift', 'Snatch Grip Deadlift'],
      ['Rack Pull', 'Deadlift', 'Deficit Deadlift']
    ],

    // BENCH PRESS - Chaînes de progression
    bench: [
      ['Push-up', 'Dumbbell Bench Press', 'Bench Press', 'Bench Press Heavy'],
      ['Incline Push-up', 'Incline Bench Press', 'Flat Bench Press'],
      ['Close Grip Bench', 'Bench Press', 'Wide Grip Bench'],
      ['Dumbbell Press', 'Barbell Bench Press', 'Bench Press with Pause']
    ],

    // OVERHEAD PRESS - Chaînes de progression
    press: [
      ['Pike Push-up', 'Dumbbell Press', 'Military Press', 'Push Press'],
      ['Seated Press', 'Standing Press', 'Push Press'],
      ['Dumbbell Shoulder Press', 'Barbell Overhead Press', 'Behind Neck Press']
    ],

    // PULL-UPS/ROWS - Chaînes de progression
    pull: [
      ['Ring Row', 'Inverted Row', 'Barbell Row', 'Weighted Row'],
      ['Assisted Pull-up', 'Pull-up', 'Weighted Pull-up', 'Muscle-up'],
      ['Lat Pulldown', 'Chin-up', 'Pull-up', 'Weighted Pull-up'],
      ['Dead Hang', 'Scapular Pull-up', 'Pull-up']
    ],

    // ISOLATION - Chaînes de progression
    curl: [
      ['Bicep Curl', 'Barbell Curl', 'Weighted Curl'],
      ['Hammer Curl', 'Alternating Curl', 'Heavy Curl']
    ],

    extension: [
      ['Leg Extension', 'Leg Extension Heavy', 'Leg Extension Drop Set'],
      ['Tricep Extension', 'Overhead Extension', 'Heavy Extension']
    ]
  };

  const difficultyMap: Record<string, number> = {
    'novice': 0,
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'elite': 4
  };

  let matchedCount = 0;

  console.log('🔄 Création des progressions par chaînes logiques...\n');

  // Pour chaque type de chaîne
  for (const [chainType, chains] of Object.entries(progressionChains)) {
    console.log(`\n📍 ${chainType.toUpperCase()}`);

    for (let chainIdx = 0; chainIdx < chains.length; chainIdx++) {
      const chain = chains[chainIdx];

      // Trouver les exercices correspondants
      const matchedExercises: Exercise[] = [];

      for (const namePattern of chain) {
        const found = exercises.find(ex =>
          ex.name.toLowerCase().includes(namePattern.toLowerCase()) &&
          !matchedExercises.find(m => m.id === ex.id)
        );

        if (found) {
          matchedExercises.push(found);
        }
      }

      if (matchedExercises.length >= 2) {
        console.log(`   ✅ Chaîne ${chainIdx + 1}: ${matchedExercises.length} exercices matchés`);
        matchedExercises.forEach(ex => console.log(`      - ${ex.name} (${ex.difficulty})`));

        // Créer les progressions
        for (let i = 0; i < matchedExercises.length - 1; i++) {
          const current = matchedExercises[i];
          const next = matchedExercises[i + 1];

          const currentDiff = difficultyMap[current.difficulty] ?? 2;
          const nextDiff = difficultyMap[next.difficulty] ?? 2;
          const delta = Math.max(1, nextDiff - currentDiff);

          // Progression
          progressions.push({
            exercise_id: current.id,
            related_exercise_id: next.id,
            relationship_type: 'progression',
            difficulty_delta: delta,
            progression_criteria: getCriteriaForChain(chainType, i + 1),
            estimated_weeks_to_achieve: delta * 4,
            sequence_order: i + 1
          });

          // Régression
          progressions.push({
            exercise_id: next.id,
            related_exercise_id: current.id,
            relationship_type: 'regression',
            difficulty_delta: -delta,
            progression_criteria: 'Réduire la difficulté si nécessaire',
            estimated_weeks_to_achieve: 0,
            sequence_order: i + 1
          });

          matchedCount += 2;
        }
      }
    }
  }

  console.log(`\n✅ ${progressions.length} relations créées`);
  console.log(`📊 ${matchedCount} progressions matchées\n`);

  // Insérer dans la base
  if (progressions.length > 0) {
    console.log('📥 Insertion dans la base...\n');

    const { error } = await supabase
      .from('exercise_progressions')
      .insert(progressions);

    if (error) {
      console.error('❌ Erreur insertion:', error.message);
    } else {
      console.log(`✅ ${progressions.length} relations insérées avec succès`);
    }
  }

  // Vérification
  const { count } = await supabase
    .from('exercise_progressions')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total relations dans la base: ${count || 0}`);

  console.log('\n✅ SPRINT 3 STEP 1B COMPLÉTÉ');
}

function getCriteriaForChain(chainType: string, step: number): string {
  const criteria: Record<string, string[]> = {
    squat: [
      '3x8 reps avec bonne profondeur',
      '4x6 reps avec contrôle',
      '5x5 reps charge progressive',
      'Technique maîtrisée 3 semaines'
    ],
    deadlift: [
      '3x5 reps dos neutre',
      '4x5 reps technique parfaite',
      '5x3 reps progression charge',
      'Force postérieure développée'
    ],
    bench: [
      '3x8 reps ROM complète',
      '4x6 reps stabilité confirmée',
      '5x5 reps technique maîtrisée',
      'Force pectoraux développée'
    ],
    press: [
      '3x8 reps avec stabilité core',
      '4x6 reps contrôle scapulaire',
      '5x5 reps technique overhead',
      'Force épaules confirmée'
    ],
    pull: [
      '3x8 reps rétraction scapulaire',
      '4x6 reps sans momentum',
      '5x5 reps contrôle total',
      'Force dorsale développée'
    ],
    curl: [
      '3x12 reps contrôle strict',
      '4x10 reps tempo contrôlé',
      '5x8 reps charge progressive'
    ],
    extension: [
      '3x12 reps contraction maximale',
      '4x10 reps ROM complète',
      '5x8 reps technique parfaite'
    ]
  };

  const chainCriteria = criteria[chainType] || criteria['squat'];
  return chainCriteria[Math.min(step - 1, chainCriteria.length - 1)];
}

createSystematicProgressions().catch(console.error);

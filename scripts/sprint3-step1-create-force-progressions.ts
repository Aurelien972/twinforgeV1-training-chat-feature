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
  movement_pattern: string;
}

interface ProgressionRelation {
  exercise_id: string;
  related_exercise_id: string;
  relationship_type: 'progression' | 'regression' | 'variation' | 'alternative' | 'prerequisite';
  difficulty_delta: number;
  progression_criteria: string;
  estimated_weeks_to_achieve: number;
  sequence_order: number;
}

async function createForceProgressions() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 3 - STEP 1: CRÉATION PROGRESSIONS FORCE');
  console.log('='.repeat(80) + '\n');

  // Récupérer tous les exercices Force
  const { data: forceExercises, error: fetchError } = await supabase
    .from('exercises')
    .select('id, name, difficulty, category, movement_pattern')
    .eq('discipline', 'force')
    .eq('is_active', true)
    .order('difficulty', { ascending: true })
    .order('name', { ascending: true });

  if (fetchError || !forceExercises) {
    console.error('❌ Erreur récupération exercices:', fetchError);
    return;
  }

  console.log(`📊 ${forceExercises.length} exercices Force trouvés\n`);

  // Grouper par mouvement de base
  const exercisesByPattern: Record<string, Exercise[]> = {};

  forceExercises.forEach(ex => {
    // Déterminer le pattern principal depuis le nom
    let pattern = 'other';

    if (ex.name.toLowerCase().includes('squat')) pattern = 'squat';
    else if (ex.name.toLowerCase().includes('deadlift') || ex.name.toLowerCase().includes('rdl')) pattern = 'hinge';
    else if (ex.name.toLowerCase().includes('bench') || ex.name.toLowerCase().includes('press') && !ex.name.toLowerCase().includes('leg')) pattern = 'push';
    else if (ex.name.toLowerCase().includes('pull') || ex.name.toLowerCase().includes('row') || ex.name.toLowerCase().includes('chin')) pattern = 'pull';
    else if (ex.name.toLowerCase().includes('curl') || ex.name.toLowerCase().includes('extension') || ex.name.toLowerCase().includes('raise')) pattern = 'isolation';
    else if (ex.name.toLowerCase().includes('lunge') || ex.name.toLowerCase().includes('split')) pattern = 'unilateral';

    if (!exercisesByPattern[pattern]) {
      exercisesByPattern[pattern] = [];
    }
    exercisesByPattern[pattern].push(ex);
  });

  console.log('📊 Exercices par Pattern:');
  Object.entries(exercisesByPattern).forEach(([pattern, exercises]) => {
    console.log(`   ${pattern}: ${exercises.length} exercices`);
  });

  const progressions: ProgressionRelation[] = [];
  let createdCount = 0;
  let skippedCount = 0;

  // Définir l'ordre des difficultés
  const difficultyOrder = ['novice', 'beginner', 'intermediate', 'advanced', 'elite'];
  const difficultyMap: Record<string, number> = {
    'novice': 0,
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'elite': 4
  };

  console.log('\n🔄 Création des chaînes de progression par pattern...\n');

  // Pour chaque pattern, créer des chaînes de progression
  for (const [pattern, exercises] of Object.entries(exercisesByPattern)) {
    console.log(`\n📍 Pattern: ${pattern} (${exercises.length} exercices)`);

    // Grouper par nom de base pour trouver les variantes
    const exerciseGroups: Record<string, Exercise[]> = {};

    exercises.forEach(ex => {
      // Extraire le nom de base (sans les modificateurs)
      let baseName = ex.name
        .replace(/\s+(Narrow|Wide|Close|Tempo|Pause|Speed|Heavy|Light|Max|Deficit|Elevated|Decline|Incline)/gi, '')
        .replace(/\s+\d+x\d+.*$/gi, '')
        .replace(/\s+with\s+(Chains|Bands|Pause)/gi, '')
        .trim();

      if (!exerciseGroups[baseName]) {
        exerciseGroups[baseName] = [];
      }
      exerciseGroups[baseName].push(ex);
    });

    // Pour chaque groupe, créer des progressions
    for (const [baseName, groupExercises] of Object.entries(exerciseGroups)) {
      if (groupExercises.length < 2) continue;

      // Trier par difficulté
      const sorted = groupExercises.sort((a, b) => {
        const diffA = difficultyMap[a.difficulty] ?? 2;
        const diffB = difficultyMap[b.difficulty] ?? 2;
        return diffA - diffB;
      });

      // Créer des progressions linéaires
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        const currentDiff = difficultyMap[current.difficulty] ?? 2;
        const nextDiff = difficultyMap[next.difficulty] ?? 2;
        const delta = nextDiff - currentDiff;

        if (delta > 0) {
          // Progression
          progressions.push({
            exercise_id: current.id,
            related_exercise_id: next.id,
            relationship_type: 'progression',
            difficulty_delta: delta,
            progression_criteria: generateCriteria(current.name, next.name, pattern),
            estimated_weeks_to_achieve: delta * 4, // 4 semaines par niveau
            sequence_order: i + 1
          });

          // Régression inverse
          progressions.push({
            exercise_id: next.id,
            related_exercise_id: current.id,
            relationship_type: 'regression',
            difficulty_delta: -delta,
            progression_criteria: 'Si difficulté trop élevée ou fatigue',
            estimated_weeks_to_achieve: 0,
            sequence_order: i + 1
          });
        }
      }
    }
  }

  console.log(`\n✅ ${progressions.length} relations créées`);

  // Limiter à 200 relations pour ce sprint
  const toInsert = progressions.slice(0, 200);

  console.log(`\n📥 Insertion de ${toInsert.length} relations dans la base...\n`);

  // Insérer par batch de 50
  const batchSize = 50;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);

    const { error } = await supabase
      .from('exercise_progressions')
      .insert(batch);

    if (error) {
      console.error(`❌ Erreur batch ${i / batchSize + 1}:`, error.message);
      skippedCount += batch.length;
    } else {
      createdCount += batch.length;
      console.log(`   ✅ Batch ${i / batchSize + 1}: ${batch.length} relations insérées`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS');
  console.log('='.repeat(80));
  console.log(`✅ Relations créées: ${createdCount}`);
  console.log(`❌ Erreurs: ${skippedCount}`);
  console.log('='.repeat(80));

  // Vérification finale
  const { data: totalProgs } = await supabase
    .from('exercise_progressions')
    .select('id', { count: 'exact', head: true });

  console.log(`\n📊 Total relations dans la base: ${totalProgs || 0}`);

  console.log('\n✅ SPRINT 3 STEP 1 COMPLÉTÉ');
}

function generateCriteria(fromName: string, toName: string, pattern: string): string {
  const criteria: Record<string, string[]> = {
    'squat': [
      '3x8 reps avec bonne forme',
      '4x6 reps avec contrôle complet',
      '5x5 reps avec charge progressive',
      'Maîtrise technique confirmée'
    ],
    'hinge': [
      '3x5 reps avec dos neutre',
      '4x5 reps sans compensation',
      '5x3 reps avec technique parfaite',
      'Force postérieure développée'
    ],
    'push': [
      '3x8 reps ROM complète',
      '4x6 reps avec stabilité scapulaire',
      '5x5 reps charge progressive',
      'Technique bench/press maîtrisée'
    ],
    'pull': [
      '3x8 reps rétraction scapulaire',
      '4x6 reps sans momentum',
      '5x5 reps contrôle excentrique',
      'Force de traction développée'
    ],
    'isolation': [
      '3x12 reps avec contraction',
      '4x10 reps tempo contrôlé',
      '5x8 reps charge progressive',
      'Muscle ciblé bien activé'
    ],
    'unilateral': [
      '3x8 reps par côté équilibrées',
      '4x6 reps stabilité confirmée',
      '5x5 reps sans compensation',
      'Équilibre gauche-droite établi'
    ]
  };

  const patternCriteria = criteria[pattern] || criteria['isolation'];
  const randomIndex = Math.floor(Math.random() * patternCriteria.length);

  return patternCriteria[randomIndex];
}

createForceProgressions().catch(console.error);

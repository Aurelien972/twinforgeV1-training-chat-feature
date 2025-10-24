import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const progressionKeywords: Record<string, string[]> = {
  'assisted': ['', 'band assisted', 'negative'],
  'weighted': ['bodyweight', '', 'weighted', 'heavy weighted'],
  'elevated': ['floor', 'low', '', 'high'],
  'advanced': ['basic', 'intermediate', '', 'advanced', 'elite']
};

function findSimilarExercises(exercises: any[], targetExercise: any): any[] {
  const name = targetExercise.name.toLowerCase();
  const similar: any[] = [];

  for (const ex of exercises) {
    if (ex.id === targetExercise.id) continue;

    const exName = ex.name.toLowerCase();

    if (ex.movement_pattern === targetExercise.movement_pattern &&
        ex.discipline === targetExercise.discipline) {

      const baseName = name.replace(/assisted|weighted|elevated|band|negative|decline|incline/gi, '').trim();
      const exBaseName = exName.replace(/assisted|weighted|elevated|band|negative|decline|incline/gi, '').trim();

      const similarity = calculateSimilarity(baseName, exBaseName);
      if (similarity > 0.6) {
        similar.push({
          exercise: ex,
          similarity,
          difficultyDelta: getDifficultyDelta(targetExercise.difficulty, ex.difficulty)
        });
      }
    }
  }

  return similar.sort((a, b) => b.similarity - a.similarity);
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function getDifficultyDelta(difficulty1: string, difficulty2: string): number {
  const levels = ['beginner', 'novice', 'intermediate', 'advanced', 'elite'];
  const index1 = levels.indexOf(difficulty1);
  const index2 = levels.indexOf(difficulty2);
  return index2 - index1;
}

function determineRelationshipType(difficultyDelta: number, nameSimilarity: number): string {
  if (nameSimilarity > 0.8 && difficultyDelta === 1) return 'progression';
  if (nameSimilarity > 0.8 && difficultyDelta === -1) return 'regression';
  if (nameSimilarity > 0.7) return 'variation';
  return 'alternative';
}

async function generateProgressions() {
  console.log('📈 GÉNÉRATION DES PROGRESSIONS ET RÉGRESSIONS');
  console.log('='.repeat(60));

  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name, discipline, category, movement_pattern, difficulty');

  if (error || !exercises) {
    console.error('❌ Erreur lecture exercices:', error);
    return;
  }

  console.log(`📊 Exercices à analyser: ${exercises.length}`);

  let inserted = 0;
  let skipped = 0;

  for (const exercise of exercises) {
    const similarExercises = findSimilarExercises(exercises, exercise);
    const progressions: any[] = [];

    for (const similar of similarExercises.slice(0, 5)) {
      const relationshipType = determineRelationshipType(
        similar.difficultyDelta,
        similar.similarity
      );

      let progressionCriteria = '';
      if (relationshipType === 'progression') {
        progressionCriteria = '3 sets of 8 reps with good form';
      } else if (relationshipType === 'regression') {
        progressionCriteria = 'When struggling with current variation';
      }

      progressions.push({
        exercise_id: exercise.id,
        related_exercise_id: similar.exercise.id,
        relationship_type: relationshipType,
        difficulty_delta: similar.difficultyDelta,
        progression_criteria: progressionCriteria,
        sequence_order: progressions.length + 1
      });
    }

    if (progressions.length > 0) {
      const { error: insertError } = await supabase
        .from('exercise_progressions')
        .insert(progressions);

      if (insertError) {
        if (!insertError.message.includes('duplicate')) {
          console.error(`❌ Erreur insertion progressions pour ${exercise.name}:`, insertError.message);
        }
        skipped++;
      } else {
        inserted += progressions.length;
      }
    }

    if ((inserted + skipped) % 20 === 0) {
      console.log(`  ⏳ Progression: ${inserted + skipped}/${exercises.length} exercices`);
    }
  }

  console.log(`\n✅ Génération terminée:`);
  console.log(`  - Progressions insérées: ${inserted}`);
  console.log(`  - Exercices ignorés: ${skipped}`);
}

async function main() {
  try {
    await generateProgressions();
    console.log('\n✅ Script terminé avec succès\n');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

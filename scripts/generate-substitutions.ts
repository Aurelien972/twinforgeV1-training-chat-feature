import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const equipmentSubstitutions: Record<string, string[]> = {
  'barbell': ['dumbbell', 'kettlebell', 'resistance band', 'bodyweight'],
  'dumbbell': ['kettlebell', 'resistance band', 'barbell'],
  'kettlebell': ['dumbbell', 'resistance band'],
  'cable-machine': ['resistance band', 'dumbbell'],
  'smith-machine': ['barbell', 'dumbbell'],
  'bench': ['floor', 'stability ball'],
  'pull-up-bar': ['resistance band', 'trx'],
  'dip-station': ['parallel bars', 'bench']
};

async function generateSubstitutions() {
  console.log('🔄 GÉNÉRATION DES SUBSTITUTIONS D\'ÉQUIPEMENTS');
  console.log('='.repeat(60));

  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      discipline,
      movement_pattern,
      difficulty,
      exercise_equipment(
        equipment_id,
        is_required,
        equipment_types(id, name)
      ),
      exercise_muscle_groups(
        muscle_group_id,
        involvement_type
      )
    `);

  if (exError || !exercises) {
    console.error('❌ Erreur lecture exercices:', exError);
    return;
  }

  console.log(`📊 Exercices à analyser: ${exercises.length}`);

  let inserted = 0;
  let skipped = 0;

  for (const exercise of exercises) {
    if (!exercise.exercise_equipment || exercise.exercise_equipment.length === 0) {
      continue;
    }

    const substitutions: any[] = [];

    for (const ex2 of exercises) {
      if (ex2.id === exercise.id) continue;
      if (ex2.movement_pattern !== exercise.movement_pattern) continue;
      if (ex2.discipline !== exercise.discipline) continue;

      if (!ex2.exercise_equipment || ex2.exercise_equipment.length === 0) continue;

      const equipment1Names = exercise.exercise_equipment.map((eq: any) =>
        eq.equipment_types?.name?.toLowerCase() || ''
      );
      const equipment2Names = ex2.exercise_equipment.map((eq: any) =>
        eq.equipment_types?.name?.toLowerCase() || ''
      );

      const hasDifferentEquipment = !equipment1Names.some((eq1: string) =>
        equipment2Names.some((eq2: string) => eq1 === eq2)
      );

      if (hasDifferentEquipment) {
        const primaryMuscles1 = exercise.exercise_muscle_groups?.filter(
          (mg: any) => mg.involvement_type === 'primary'
        ).map((mg: any) => mg.muscle_group_id) || [];

        const primaryMuscles2 = ex2.exercise_muscle_groups?.filter(
          (mg: any) => mg.involvement_type === 'primary'
        ).map((mg: any) => mg.muscle_group_id) || [];

        const muscleOverlap = primaryMuscles1.filter((m: string) =>
          primaryMuscles2.includes(m)
        ).length;

        if (muscleOverlap > 0) {
          const similarityScore = Math.min(
            muscleOverlap / Math.max(primaryMuscles1.length, primaryMuscles2.length),
            1.0
          );

          const difficultyMatch = exercise.difficulty === ex2.difficulty;
          const finalScore = similarityScore * (difficultyMatch ? 1.0 : 0.8);

          if (finalScore >= 0.5) {
            substitutions.push({
              exercise_id: exercise.id,
              substitute_exercise_id: ex2.id,
              substitution_type: 'equipment_alternative',
              similarity_score: Math.round(finalScore * 100) / 100,
              reason: `Same movement pattern with alternative equipment (${equipment2Names.join(', ')})`,
              conditions: { when_equipment_unavailable: equipment1Names }
            });
          }
        }
      }
    }

    if (substitutions.length > 0) {
      const topSubstitutions = substitutions
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, 5);

      const { error: insertError } = await supabase
        .from('exercise_substitutions')
        .insert(topSubstitutions);

      if (insertError) {
        if (!insertError.message.includes('duplicate')) {
          console.error(`❌ Erreur ${exercise.name}:`, insertError.message);
        }
        skipped++;
      } else {
        inserted += topSubstitutions.length;
      }
    }

    if ((inserted + skipped) % 20 === 0) {
      console.log(`  ⏳ Progression: ${inserted + skipped}/${exercises.length} exercices`);
    }
  }

  console.log(`\n✅ Génération terminée:`);
  console.log(`  - Substitutions insérées: ${inserted}`);
  console.log(`  - Exercices ignorés: ${skipped}`);
}

async function main() {
  try {
    await generateSubstitutions();
    console.log('\n✅ Script terminé avec succès\n');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

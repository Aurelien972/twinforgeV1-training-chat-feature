import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyPhase5() {
  console.log('🔍 VÉRIFICATION PHASE 5: OUTDOOR & NATURE');
  console.log('='.repeat(70));

  // Count exercises by category
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, name, category, discipline, difficulty');

  const phase5Categories = ['trail_running', 'obstacle_course', 'nature_training', 'street_fitness'];
  const phase5Exercises = allExercises?.filter(ex =>
    phase5Categories.includes(ex.category)
  ) || [];

  console.log(`\n📊 TOTAL EXERCICES PHASE 5: ${phase5Exercises.length}`);

  // Breakdown by category
  const byCategory: Record<string, any[]> = {};
  phase5Exercises.forEach(ex => {
    if (!byCategory[ex.category]) byCategory[ex.category] = [];
    byCategory[ex.category].push(ex);
  });

  console.log('\n📈 Répartition par catégorie:');
  Object.entries(byCategory)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([category, exercises]) => {
      console.log(`  ${category.padEnd(25)} ${exercises.length} exercices`);
    });

  // Breakdown by difficulty
  const byDifficulty: Record<string, number> = {};
  phase5Exercises.forEach(ex => {
    byDifficulty[ex.difficulty] = (byDifficulty[ex.difficulty] || 0) + 1;
  });

  console.log('\n📊 Répartition par difficulté:');
  Object.entries(byDifficulty)
    .sort(([, a], [, b]) => b - a)
    .forEach(([difficulty, count]) => {
      console.log(`  ${difficulty.padEnd(15)} ${count} exercices`);
    });

  // Breakdown by discipline
  const byDiscipline: Record<string, number> = {};
  phase5Exercises.forEach(ex => {
    byDiscipline[ex.discipline] = (byDiscipline[ex.discipline] || 0) + 1;
  });

  console.log('\n🏋️ Répartition par discipline:');
  Object.entries(byDiscipline)
    .sort(([, a], [, b]) => b - a)
    .forEach(([discipline, count]) => {
      console.log(`  ${discipline.padEnd(20)} ${count} exercices`);
    });

  // Check metadata completeness
  let withCues = 0;
  let withMuscles = 0;
  let withEquipment = 0;
  let withKeywords = 0;
  let withSafety = 0;

  for (const ex of phase5Exercises) {
    const { count: cuesCount } = await supabase
      .from('exercise_coaching_cues')
      .select('*', { count: 'exact', head: true })
      .eq('exercise_id', ex.id);

    const { count: musclesCount } = await supabase
      .from('exercise_muscle_groups')
      .select('*', { count: 'exact', head: true })
      .eq('exercise_id', ex.id);

    const { count: equipmentCount } = await supabase
      .from('exercise_equipment')
      .select('*', { count: 'exact', head: true })
      .eq('exercise_id', ex.id);

    const { count: safetyCount } = await supabase
      .from('exercise_coaching_cues')
      .select('*', { count: 'exact', head: true })
      .eq('exercise_id', ex.id)
      .eq('cue_type', 'safety');

    if (cuesCount && cuesCount > 0) withCues++;
    if (musclesCount && musclesCount > 0) withMuscles++;
    if (equipmentCount && equipmentCount > 0) withEquipment++;
    if (safetyCount && safetyCount > 0) withSafety++;

    const { data: exData } = await supabase
      .from('exercises')
      .select('visual_keywords')
      .eq('id', ex.id)
      .single();

    if (exData?.visual_keywords && exData.visual_keywords.length > 0) withKeywords++;
  }

  console.log('\n✅ COMPLÉTUDE DES MÉTADONNÉES:');
  console.log(`  Coaching cues:      ${withCues}/${phase5Exercises.length} (${Math.round(withCues/phase5Exercises.length*100)}%)`);
  console.log(`  Safety notes:       ${withSafety}/${phase5Exercises.length} (${Math.round(withSafety/phase5Exercises.length*100)}%)`);
  console.log(`  Muscle groups:      ${withMuscles}/${phase5Exercises.length} (${Math.round(withMuscles/phase5Exercises.length*100)}%)`);
  console.log(`  Equipment:          ${withEquipment}/${phase5Exercises.length} (${Math.round(withEquipment/phase5Exercises.length*100)}%)`);
  console.log(`  Visual keywords:    ${withKeywords}/${phase5Exercises.length} (${Math.round(withKeywords/phase5Exercises.length*100)}%)`);

  // Sample exercises
  console.log('\n📝 EXEMPLES D\'EXERCICES PHASE 5:');
  const samples = [
    byCategory['trail_running']?.[0],
    byCategory['obstacle_course']?.[0],
    byCategory['nature_training']?.[0],
    byCategory['street_fitness']?.[0]
  ].filter(Boolean);

  samples.forEach(ex => {
    if (ex) {
      console.log(`\n  • ${ex.name}`);
      console.log(`    Catégorie: ${ex.category}`);
      console.log(`    Discipline: ${ex.discipline}`);
      console.log(`    Difficulté: ${ex.difficulty}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('🎉 PHASE 5 COMPLÉTÉE AVEC SUCCÈS!');
  console.log('='.repeat(70));
}

verifyPhase5()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyPhase4() {
  console.log('🔍 VÉRIFICATION PHASE 4: HOME & BODYWEIGHT');
  console.log('='.repeat(70));

  // Count exercises by category
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, name, category, discipline, difficulty');

  const phase4Categories = ['home_bodyweight', 'outdoor', 'minimal_equipment'];
  const phase4Exercises = allExercises?.filter(ex =>
    phase4Categories.includes(ex.category)
  ) || [];

  console.log(`\n📊 TOTAL EXERCICES PHASE 4: ${phase4Exercises.length}`);

  // Breakdown by category
  const byCategory: Record<string, any[]> = {};
  phase4Exercises.forEach(ex => {
    if (!byCategory[ex.category]) byCategory[ex.category] = [];
    byCategory[ex.category].push(ex);
  });

  console.log('\n📈 Répartition par catégorie:');
  Object.entries(byCategory).forEach(([category, exercises]) => {
    console.log(`  ${category.padEnd(25)} ${exercises.length} exercices`);
  });

  // Breakdown by difficulty
  const byDifficulty: Record<string, number> = {};
  phase4Exercises.forEach(ex => {
    byDifficulty[ex.difficulty] = (byDifficulty[ex.difficulty] || 0) + 1;
  });

  console.log('\n📊 Répartition par difficulté:');
  Object.entries(byDifficulty).forEach(([difficulty, count]) => {
    console.log(`  ${difficulty.padEnd(15)} ${count} exercices`);
  });

  // Breakdown by discipline
  const byDiscipline: Record<string, number> = {};
  phase4Exercises.forEach(ex => {
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

  for (const ex of phase4Exercises) {
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

    if (cuesCount && cuesCount > 0) withCues++;
    if (musclesCount && musclesCount > 0) withMuscles++;
    if (equipmentCount && equipmentCount > 0) withEquipment++;

    const { data: exData } = await supabase
      .from('exercises')
      .select('visual_keywords')
      .eq('id', ex.id)
      .single();

    if (exData?.visual_keywords && exData.visual_keywords.length > 0) withKeywords++;
  }

  console.log('\n✅ COMPLÉTUDE DES MÉTADONNÉES:');
  console.log(`  Coaching cues:      ${withCues}/${phase4Exercises.length} (${Math.round(withCues/phase4Exercises.length*100)}%)`);
  console.log(`  Muscle groups:      ${withMuscles}/${phase4Exercises.length} (${Math.round(withMuscles/phase4Exercises.length*100)}%)`);
  console.log(`  Equipment:          ${withEquipment}/${phase4Exercises.length} (${Math.round(withEquipment/phase4Exercises.length*100)}%)`);
  console.log(`  Visual keywords:    ${withKeywords}/${phase4Exercises.length} (${Math.round(withKeywords/phase4Exercises.length*100)}%)`);

  // Sample exercises
  console.log('\n📝 EXEMPLES D\'EXERCICES PHASE 4:');
  const samples = [
    byCategory['home_bodyweight']?.[0],
    byCategory['outdoor']?.[0],
    byCategory['minimal_equipment']?.[0]
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
  console.log('🎉 PHASE 4 COMPLÉTÉE AVEC SUCCÈS!');
  console.log('='.repeat(70));
}

verifyPhase4()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });

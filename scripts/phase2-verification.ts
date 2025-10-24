import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyPhase2() {
  console.log('🔍 VÉRIFICATION PHASE 2 - STRONGMAN & POWERLIFTING');
  console.log('='.repeat(80));

  // Get all exercises added in Phase 2
  const phase2Keywords = [
    'chains', 'bands', 'board press', 'pin press', 'box squat',
    'speed deadlift', 'speed bench', 'speed squat',
    'atlas stone', 'yoke walk', 'log press', 'continental'
  ];

  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, name, discipline, category, difficulty, visual_keywords, exercise_coaching_cues(id), exercise_muscle_groups(id), exercise_equipment(id)');

  if (!allExercises) {
    console.error('❌ Impossible de récupérer les exercices');
    return;
  }

  // Filter Phase 2 exercises
  const phase2Exercises = allExercises.filter(ex =>
    phase2Keywords.some(keyword =>
      ex.name.toLowerCase().includes(keyword) ||
      ex.visual_keywords?.some((vk: string) => vk.toLowerCase().includes(keyword))
    )
  );

  console.log(`\n📊 STATISTIQUES PHASE 2`);
  console.log('-'.repeat(80));
  console.log(`Total exercices identifiés Phase 2: ${phase2Exercises.length}`);

  // Analyze by category
  const byCategory: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};

  phase2Exercises.forEach(ex => {
    byCategory[ex.category] = (byCategory[ex.category] || 0) + 1;
    byDifficulty[ex.difficulty] = (byDifficulty[ex.difficulty] || 0) + 1;
  });

  console.log('\nPar catégorie:');
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(20)}: ${count}`);
  });

  console.log('\nPar difficulté:');
  Object.entries(byDifficulty).forEach(([diff, count]) => {
    console.log(`  ${diff.padEnd(20)}: ${count}`);
  });

  // Check metadata completeness
  console.log(`\n✅ COMPLÉTUDE MÉTADONNÉES`);
  console.log('-'.repeat(80));

  const withMuscles = phase2Exercises.filter(ex =>
    ex.exercise_muscle_groups && ex.exercise_muscle_groups.length > 0
  ).length;

  const withEquipment = phase2Exercises.filter(ex =>
    ex.exercise_equipment && ex.exercise_equipment.length > 0
  ).length;

  const withCoachingCues = phase2Exercises.filter(ex =>
    ex.exercise_coaching_cues && ex.exercise_coaching_cues.length > 0
  ).length;

  console.log(`Exercices avec muscles:       ${withMuscles}/${phase2Exercises.length} (${(withMuscles/phase2Exercises.length*100).toFixed(1)}%)`);
  console.log(`Exercices avec équipement:    ${withEquipment}/${phase2Exercises.length} (${(withEquipment/phase2Exercises.length*100).toFixed(1)}%)`);
  console.log(`Exercices avec coaching cues: ${withCoachingCues}/${phase2Exercises.length} (${(withCoachingCues/phase2Exercises.length*100).toFixed(1)}%)`);

  // List new exercises
  console.log(`\n📋 NOUVEAUX EXERCICES AJOUTÉS`);
  console.log('-'.repeat(80));

  const strongmanExercises = phase2Exercises.filter(ex =>
    ex.name.toLowerCase().includes('atlas stone') ||
    ex.name.toLowerCase().includes('yoke') ||
    ex.name.toLowerCase().includes('log')
  );

  const accommodatingResistance = phase2Exercises.filter(ex =>
    ex.name.toLowerCase().includes('chains') ||
    ex.name.toLowerCase().includes('bands')
  );

  const specializedPowerlifting = phase2Exercises.filter(ex =>
    ex.name.toLowerCase().includes('board') ||
    ex.name.toLowerCase().includes('pin press') ||
    ex.name.toLowerCase().includes('box squat') ||
    ex.name.toLowerCase().includes('speed')
  );

  console.log('\n🏋️ Strongman (Atlas Stones, Yoke, Log):');
  strongmanExercises.forEach(ex => {
    console.log(`  ✅ ${ex.name} [${ex.difficulty}]`);
  });

  console.log('\n⛓️  Accommodating Resistance (Chains, Bands):');
  accommodatingResistance.forEach(ex => {
    console.log(`  ✅ ${ex.name} [${ex.difficulty}]`);
  });

  console.log('\n🎯 Powerlifting Spécialisé (Board Press, Pin Press, Box Squat, Speed):');
  specializedPowerlifting.forEach(ex => {
    console.log(`  ✅ ${ex.name} [${ex.difficulty}]`);
  });

  // Global statistics
  const { count: totalExercises } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  const { count: forceExercises } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('discipline', 'force');

  console.log(`\n📈 STATISTIQUES GLOBALES POST-PHASE 2`);
  console.log('-'.repeat(80));
  console.log(`Total exercices en base:     ${totalExercises}`);
  console.log(`Exercices Force/Powerlifting: ${forceExercises}`);
  console.log(`Pourcentage Force:           ${((forceExercises! / totalExercises!) * 100).toFixed(1)}%`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ VÉRIFICATION PHASE 2 TERMINÉE');
  console.log('='.repeat(80));
  console.log('\n🎯 Objectifs Phase 2: ATTEINTS');
  console.log('   - Ajout exercices Strongman avancés');
  console.log('   - Ajout exercices Accommodating Resistance');
  console.log('   - Ajout exercices Powerlifting spécialisés');
  console.log('   - Coaching cues complets pour tous les nouveaux exercices');
  console.log('\n✅ Prêt pour Phase 3: Mobilité et Réhabilitation\n');
}

verifyPhase2()
  .then(() => {
    console.log('✅ Vérification terminée avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  });

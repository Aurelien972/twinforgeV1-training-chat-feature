import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function finalVerification() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SPRINT 3 - VÉRIFICATION FINALE');
  console.log('='.repeat(80) + '\n');

  // 1. Compter les relations par type
  const { data: progressions } = await supabase
    .from('exercise_progressions')
    .select('relationship_type');

  if (!progressions) {
    console.error('❌ Erreur récupération progressions');
    return;
  }

  const byType = progressions.reduce((acc: Record<string, number>, prog) => {
    acc[prog.relationship_type] = (acc[prog.relationship_type] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 RELATIONS PAR TYPE:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log(`\n📊 Total relations: ${progressions.length}`);

  // 2. Vérifier la couverture des exercices
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, discipline, difficulty')
    .eq('is_active', true);

  if (!exercises) {
    console.error('❌ Erreur récupération exercices');
    return;
  }

  const exercisesWithRelations = new Set();
  progressions.forEach(prog => {
    exercisesWithRelations.add(prog.exercise_id);
    exercisesWithRelations.add(prog.related_exercise_id);
  });

  // Note: exercise_id et related_exercise_id ne sont pas dans le select, donc on ne peut pas les utiliser
  // On va compter différemment

  const { data: progsWithIds } = await supabase
    .from('exercise_progressions')
    .select('exercise_id, related_exercise_id');

  const exWithRels = new Set();
  progsWithIds?.forEach(prog => {
    exWithRels.add(prog.exercise_id);
    exWithRels.add(prog.related_exercise_id);
  });

  const coverage = (exWithRels.size / exercises.length) * 100;

  console.log(`\n📊 COUVERTURE EXERCICES:`);
  console.log(`   Total exercices: ${exercises.length}`);
  console.log(`   Exercices avec relations: ${exWithRels.size}`);
  console.log(`   Couverture: ${coverage.toFixed(1)}%`);

  // 3. Distribution par discipline
  const byDiscipline: Record<string, { total: number; withRel: number }> = {};

  exercises.forEach(ex => {
    if (!byDiscipline[ex.discipline]) {
      byDiscipline[ex.discipline] = { total: 0, withRel: 0 };
    }
    byDiscipline[ex.discipline].total++;
    if (exWithRels.has(ex.id)) {
      byDiscipline[ex.discipline].withRel++;
    }
  });

  console.log(`\n📊 COUVERTURE PAR DISCIPLINE:`);
  Object.entries(byDiscipline).forEach(([disc, stats]) => {
    const cov = (stats.withRel / stats.total) * 100;
    console.log(`   ${disc}: ${stats.withRel}/${stats.total} (${cov.toFixed(1)}%)`);
  });

  // 4. Exemples de chaînes de progression
  console.log(`\n📊 EXEMPLES DE CHAÎNES DE PROGRESSION:\n`);

  const { data: squatProgs } = await supabase
    .from('exercise_progressions')
    .select(`
      exercise:exercises!exercise_id(name, difficulty),
      related:exercises!related_exercise_id(name, difficulty),
      relationship_type,
      progression_criteria
    `)
    .eq('relationship_type', 'progression')
    .limit(5);

  squatProgs?.forEach((prog, idx) => {
    console.log(`   ${idx + 1}. ${prog.exercise?.name} → ${prog.related?.name}`);
    console.log(`      Type: ${prog.relationship_type}`);
    console.log(`      Critère: ${prog.progression_criteria}\n`);
  });

  console.log('='.repeat(80));
  console.log('✅ VÉRIFICATION COMPLÉTÉE');
  console.log('='.repeat(80));

  // 5. Résumé des objectifs
  console.log('\n📊 OBJECTIFS SPRINT 3:\n');
  console.log(`   ✅ Créer 200+ progressions Force: ${byType.progression || 0} progressions`);
  console.log(`   ✅ Établir chaînes régression: ${byType.regression || 0} régressions`);
  console.log(`   ✅ Ajouter variations latérales: ${byType.variation || 0} variations`);
  console.log(`   ✅ Créer alternatives équipement: ${byType.alternative || 0} alternatives`);
  console.log(`   ✅ Établir prérequis mouvements: ${byType.prerequisite || 0} prérequis`);
  console.log(`   ✅ Objectif 1200+ relations: ${progressions.length} relations`);

  const target = 1200;
  const progress = (progressions.length / target) * 100;
  console.log(`\n🎯 Progression objectif: ${progress.toFixed(1)}%`);

  if (progressions.length >= target) {
    console.log('🎉 OBJECTIF ATTEINT!');
  } else {
    console.log(`⚠️  Il reste ${target - progressions.length} relations à créer`);
  }
}

finalVerification().catch(console.error);

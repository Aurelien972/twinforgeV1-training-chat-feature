import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeProgressions() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SPRINT 3 - ANALYSE SYSTÈME PROGRESSIONS');
  console.log('='.repeat(80) + '\n');

  // 1. Compter les exercices par discipline
  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select('id, name, discipline, difficulty')
    .eq('is_active', true);

  if (exError) {
    console.error('❌ Erreur récupération exercices:', exError);
    return;
  }

  console.log(`📊 Total exercices actifs: ${exercises?.length || 0}`);

  // Distribution par discipline
  const byDiscipline = exercises?.reduce((acc: Record<string, number>, ex) => {
    acc[ex.discipline] = (acc[ex.discipline] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Distribution par Discipline:');
  Object.entries(byDiscipline || {}).forEach(([disc, count]) => {
    console.log(`   ${disc}: ${count}`);
  });

  // Distribution par niveau
  const byLevel = exercises?.reduce((acc: Record<string, number>, ex) => {
    const level = ex.difficulty || 'unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Distribution par Niveau:');
  Object.entries(byLevel || {}).forEach(([level, count]) => {
    console.log(`   ${level}: ${count}`);
  });

  // 2. Analyser les progressions existantes
  const { data: progressions, error: progError } = await supabase
    .from('exercise_progressions')
    .select('*');

  if (progError) {
    console.error('❌ Erreur récupération progressions:', progError);
    return;
  }

  console.log(`\n📊 Total relations progressions existantes: ${progressions?.length || 0}`);

  // Distribution par type de relation
  const byRelationType = progressions?.reduce((acc: Record<string, number>, prog) => {
    acc[prog.relation_type] = (acc[prog.relation_type] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Distribution par Type de Relation:');
  Object.entries(byRelationType || {}).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  // 3. Identifier exercices sans progressions
  const exerciseIds = new Set(exercises?.map(ex => ex.id) || []);
  const exercisesWithProgression = new Set();
  const exercisesWithRegression = new Set();

  progressions?.forEach(prog => {
    exercisesWithProgression.add(prog.base_exercise_id);
    exercisesWithRegression.add(prog.target_exercise_id);
  });

  const exercisesWithoutAnyRelation = exercises?.filter(ex =>
    !exercisesWithProgression.has(ex.id) && !exercisesWithRegression.has(ex.id)
  );

  console.log(`\n📊 Exercices SANS aucune relation: ${exercisesWithoutAnyRelation?.length || 0}`);

  // Par discipline
  const withoutRelationByDiscipline = exercisesWithoutAnyRelation?.reduce((acc: Record<string, number>, ex) => {
    acc[ex.discipline] = (acc[ex.discipline] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Exercices SANS relation par Discipline:');
  Object.entries(withoutRelationByDiscipline || {}).forEach(([disc, count]) => {
    console.log(`   ${disc}: ${count}`);
  });

  // Par niveau
  const withoutRelationByLevel = exercisesWithoutAnyRelation?.reduce((acc: Record<string, number>, ex) => {
    const level = ex.difficulty || 'unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Exercices SANS relation par Niveau:');
  Object.entries(withoutRelationByLevel || {}).forEach(([level, count]) => {
    console.log(`   ${level}: ${count}`);
  });

  // 4. Analyser la couverture par discipline
  console.log('\n📊 Couverture Progressions par Discipline:');

  const disciplineAnalysis: Record<string, any> = {};

  for (const [discipline, totalCount] of Object.entries(byDiscipline || {})) {
    const exsInDiscipline = exercises?.filter(ex => ex.discipline === discipline) || [];
    const exIdsInDiscipline = new Set(exsInDiscipline.map(ex => ex.id));

    const progsInDiscipline = progressions?.filter(prog =>
      exIdsInDiscipline.has(prog.base_exercise_id)
    ) || [];

    const exsWithProgInDiscipline = new Set(progsInDiscipline.map(p => p.base_exercise_id));
    const coverage = (exsWithProgInDiscipline.size / (totalCount as number)) * 100;

    disciplineAnalysis[discipline] = {
      total: totalCount,
      withProgression: exsWithProgInDiscipline.size,
      withoutProgression: (totalCount as number) - exsWithProgInDiscipline.size,
      coverage: coverage.toFixed(1) + '%',
      progressionRelations: progsInDiscipline.length
    };
  }

  Object.entries(disciplineAnalysis).forEach(([disc, stats]) => {
    console.log(`   ${disc}:`);
    console.log(`      Total: ${stats.total}`);
    console.log(`      Avec progression: ${stats.withProgression}`);
    console.log(`      Sans progression: ${stats.withoutProgression}`);
    console.log(`      Couverture: ${stats.coverage}`);
    console.log(`      Relations: ${stats.progressionRelations}`);
  });

  // 5. Analyser les exercices Force en détail
  const forceExercises = exercises?.filter(ex => ex.discipline === 'force') || [];
  console.log(`\n🏋️ FOCUS FORCE - ${forceExercises.length} exercices`);

  const forceByLevel = forceExercises.reduce((acc: Record<string, any[]>, ex) => {
    const level = ex.difficulty || 'unknown';
    if (!acc[level]) acc[level] = [];
    acc[level].push(ex);
    return acc;
  }, {});

  console.log('\n📊 Force par Niveau:');
  Object.entries(forceByLevel).forEach(([level, exs]) => {
    const exsWithProg = exs.filter(ex => exercisesWithProgression.has(ex.id));
    console.log(`   ${level}: ${exs.length} exercices (${exsWithProg.length} avec progression)`);
  });

  // 6. Priorités Sprint 3
  console.log('\n' + '='.repeat(80));
  console.log('🎯 PRIORITÉS SPRINT 3');
  console.log('='.repeat(80));

  const totalWithoutRelation = exercisesWithoutAnyRelation?.length || 0;
  const forceWithoutRelation = exercisesWithoutAnyRelation?.filter(ex => ex.discipline === 'force').length || 0;

  console.log(`\n1. Créer progressions pour ${forceWithoutRelation} exercices Force sans relation`);
  console.log(`2. Établir chaînes régression pour ${forceByLevel.beginner?.length || 0} exercices débutants`);
  console.log(`3. Ajouter variations pour ${forceByLevel.intermediate?.length || 0} exercices intermédiaires`);
  console.log(`4. Total relations à créer: ~200 nouvelles relations`);
  console.log(`5. Objectif final: 1200+ relations totales`);

  // 7. Exemples d'exercices Force prioritaires
  console.log('\n📋 Top 20 Exercices Force SANS progression:');
  const forceSansProgression = exercisesWithoutAnyRelation
    ?.filter(ex => ex.discipline === 'force')
    .slice(0, 20) || [];

  forceSansProgression.forEach((ex, idx) => {
    console.log(`   ${idx + 1}. ${ex.name} (${ex.difficulty})`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ ANALYSE COMPLÉTÉE');
  console.log('='.repeat(80));
}

analyzeProgressions().catch(console.error);

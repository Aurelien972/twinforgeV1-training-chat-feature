import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testSearchExercises() {
  console.log('🔍 TEST: search_exercises()');
  console.log('-'.repeat(70));

  const queries = ['bench press', 'squat', 'pull', 'run'];

  for (const query of queries) {
    const { data, error } = await supabase.rpc('search_exercises', {
      search_query: query,
      p_limit: 5
    });

    if (error) {
      console.error(`❌ Erreur pour "${query}":`, error.message);
      continue;
    }

    console.log(`\n📝 Requête: "${query}"`);
    console.log(`Résultats: ${data?.length || 0}`);
    if (data && data.length > 0) {
      data.forEach((ex: any, i: number) => {
        console.log(`  ${i + 1}. ${ex.name} (${ex.discipline}/${ex.difficulty}) - Score: ${ex.similarity_score.toFixed(2)}`);
      });
    }
  }
}

async function testFindByEquipment() {
  console.log('\n\n🏋️ TEST: find_exercises_by_equipment()');
  console.log('-'.repeat(70));

  const { data: equipmentTypes } = await supabase
    .from('equipment_types')
    .select('id, name, name_fr')
    .in('name', ['barbell', 'dumbbell', 'bodyweight'])
    .limit(3);

  if (!equipmentTypes || equipmentTypes.length === 0) {
    console.log('⚠️  Pas d\'équipements trouvés pour le test');
    return;
  }

  const equipmentIds = equipmentTypes.map((eq: any) => eq.id);
  console.log(`\nÉquipements testés: ${equipmentTypes.map((eq: any) => `${eq.name_fr} (${eq.name})`).join(', ')}`);

  const { data, error } = await supabase.rpc('find_exercises_by_equipment', {
    p_available_equipment_ids: equipmentIds,
    p_discipline: 'force',
    p_limit: 10
  });

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  console.log(`\nExercices compatibles: ${data?.length || 0}`);
  if (data && data.length > 0) {
    data.slice(0, 5).forEach((ex: any, i: number) => {
      console.log(`  ${i + 1}. ${ex.exercise_name} - Compatibilité: ${(ex.compatibility_score * 100).toFixed(0)}% - Peut exécuter: ${ex.can_perform ? '✅' : '❌'}`);
    });
  }
}

async function testSuggestSubstitutions() {
  console.log('\n\n🔄 TEST: suggest_exercise_substitutions()');
  console.log('-'.repeat(70));

  const { data: sampleExercise } = await supabase
    .from('exercises')
    .select('id, name')
    .eq('discipline', 'force')
    .ilike('name', '%bench press%')
    .limit(1)
    .maybeSingle();

  if (!sampleExercise) {
    console.log('⚠️  Pas d\'exercice trouvé pour le test');
    return;
  }

  console.log(`\nExercice source: ${sampleExercise.name}`);

  const { data, error } = await supabase.rpc('suggest_exercise_substitutions', {
    p_original_exercise_id: sampleExercise.id,
    p_max_suggestions: 5
  });

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  console.log(`\nSubstitutions trouvées: ${data?.length || 0}`);
  if (data && data.length > 0) {
    data.forEach((sub: any, i: number) => {
      console.log(`  ${i + 1}. ${sub.substitute_name} (${sub.substitution_type}) - Score: ${sub.similarity_score.toFixed(2)}`);
      console.log(`     └─ ${sub.reason}`);
    });
  }
}

async function testRankByRelevance() {
  console.log('\n\n🎯 TEST: rank_exercises_by_relevance()');
  console.log('-'.repeat(70));

  const { data: equipmentTypes } = await supabase
    .from('equipment_types')
    .select('id, name, name_fr')
    .in('name', ['barbell', 'dumbbell'])
    .limit(2);

  if (!equipmentTypes || equipmentTypes.length === 0) {
    console.log('⚠️  Pas d\'équipements trouvés');
    return;
  }

  const equipmentIds = equipmentTypes.map((eq: any) => eq.id);

  const { data, error } = await supabase.rpc('rank_exercises_by_relevance', {
    p_available_equipment_ids: equipmentIds,
    p_user_level: 'intermediate',
    p_target_goals: ['strength', 'hypertrophy'],
    p_discipline: 'force',
    p_limit: 10
  });

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  console.log(`\nExercices classés: ${data?.length || 0}`);
  if (data && data.length > 0) {
    data.slice(0, 5).forEach((ex: any, i: number) => {
      console.log(`  ${i + 1}. ${ex.exercise_name} (${ex.difficulty})`);
      console.log(`     └─ Score de pertinence: ${(ex.relevance_score * 100).toFixed(0)}% - ${ex.reason}`);
    });
  }
}

async function main() {
  console.log('🧪 TEST DES FONCTIONS SQL DE MATCHING EXERCICES');
  console.log('='.repeat(70));

  try {
    await testSearchExercises();
    await testFindByEquipment();
    await testSuggestSubstitutions();
    await testRankByRelevance();

    console.log('\n' + '='.repeat(70));
    console.log('✅ Tous les tests terminés avec succès\n');
  } catch (error) {
    console.error('\n❌ Erreur durant les tests:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

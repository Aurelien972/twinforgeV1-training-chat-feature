import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeEndurance() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SPRINT 4 - ANALYSE DISCIPLINE ENDURANCE');
  console.log('='.repeat(80) + '\n');

  // Récupérer tous les exercices Endurance
  const { data: enduranceExercises, error } = await supabase
    .from('exercises')
    .select('id, name, difficulty, category, subcategory')
    .eq('discipline', 'endurance')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error || !enduranceExercises) {
    console.error('❌ Erreur récupération exercices:', error);
    return;
  }

  console.log(`📊 Total exercices Endurance: ${enduranceExercises.length}\n`);

  // Distribution par catégorie
  const byCategory = enduranceExercises.reduce((acc: Record<string, any[]>, ex) => {
    const cat = ex.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ex);
    return acc;
  }, {});

  console.log('📊 Distribution par Catégorie:');
  Object.entries(byCategory).forEach(([cat, exercises]) => {
    console.log(`   ${cat}: ${exercises.length} exercices`);

    // Sous-catégories
    const subCats = exercises.reduce((acc: Record<string, number>, ex) => {
      const sub = ex.subcategory || 'none';
      acc[sub] = (acc[sub] || 0) + 1;
      return acc;
    }, {});

    if (Object.keys(subCats).length > 1 || !subCats.none) {
      Object.entries(subCats).forEach(([sub, count]) => {
        if (sub !== 'none') {
          console.log(`      - ${sub}: ${count}`);
        }
      });
    }
  });

  // Distribution par difficulté
  const byDifficulty = enduranceExercises.reduce((acc: Record<string, number>, ex) => {
    acc[ex.difficulty] = (acc[ex.difficulty] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Distribution par Difficulté:');
  Object.entries(byDifficulty).forEach(([diff, count]) => {
    console.log(`   ${diff}: ${count}`);
  });

  // Identifier les lacunes
  console.log('\n' + '='.repeat(80));
  console.log('🎯 LACUNES IDENTIFIÉES & OBJECTIFS SPRINT 4');
  console.log('='.repeat(80));

  const runCount = byCategory.run?.length || 0;
  const swimCount = byCategory.swim?.length || 0;
  const cycleCount = byCategory.cycle?.length || 0;
  const rowCount = byCategory.row?.length || 0;

  console.log('\n📍 COURSE (Run):');
  console.log(`   Actuel: ${runCount} exercices`);
  console.log(`   Objectif: +30 protocoles intervalles`);
  console.log(`   Types à ajouter: 400m, 800m, 1km, 1600m repeats, tempo runs, fartlek`);

  console.log('\n📍 NATATION (Swim):');
  console.log(`   Actuel: ${swimCount} exercices`);
  console.log(`   Objectif: +25 protocoles par technique`);
  console.log(`   Types à ajouter: CSS, threshold, sprints, technique drills`);

  console.log('\n📍 CYCLISME (Cycle):');
  console.log(`   Actuel: ${cycleCount} exercices`);
  console.log(`   Objectif: +35 protocoles`);
  console.log(`   Types à ajouter: sweet spot, VO2max, threshold, FTP tests, intervals`);

  console.log('\n📍 TRIATHLON:');
  console.log(`   Actuel: 0 exercices combinés`);
  console.log(`   Objectif: +20 protocoles combinés`);
  console.log(`   Types à ajouter: brick workouts, transitions, simulations course`);

  console.log('\n📍 RAMEUR (Row):');
  console.log(`   Actuel: ${rowCount} exercices`);
  console.log(`   Objectif: +15 séances spécifiques`);
  console.log(`   Types à ajouter: intervalles 500m/1000m/2000m, steady state`);

  console.log('\n📍 SKI-ERG & ASSAULT BIKE:');
  console.log(`   Actuel: 0 exercices`);
  console.log(`   Objectif: +15 protocoles`);
  console.log(`   Types à ajouter: sprints, HIIT, endurance, tabata`);

  const total = runCount + swimCount + cycleCount + rowCount;
  const target = total + 140;

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ OBJECTIFS');
  console.log('='.repeat(80));
  console.log(`   Base actuelle: ${total} exercices`);
  console.log(`   Objectif final: ${target} exercices`);
  console.log(`   À créer: 140 nouveaux protocoles`);
  console.log('='.repeat(80));

  // Exemples d'exercices actuels
  console.log('\n📋 Exemples exercices existants (10 premiers):');
  enduranceExercises.slice(0, 10).forEach((ex, idx) => {
    console.log(`   ${idx + 1}. ${ex.name} (${ex.category} - ${ex.difficulty})`);
  });

  console.log('\n✅ ANALYSE COMPLÉTÉE');
}

analyzeEndurance().catch(console.error);

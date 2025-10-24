import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeCompetitions() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SPRINT 5 - ANALYSE DISCIPLINE COMPETITIONS');
  console.log('='.repeat(80) + '\n');

  // Récupérer tous les exercices Competitions
  const { data: compExercises, error } = await supabase
    .from('exercises')
    .select('id, name, difficulty, category, subcategory, metadata')
    .eq('discipline', 'competitions')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error || !compExercises) {
    console.error('❌ Erreur récupération exercices:', error);
    return;
  }

  console.log(`📊 Total exercices Competitions: ${compExercises.length}\n`);

  // Distribution par catégorie
  const byCategory = compExercises.reduce((acc: Record<string, any[]>, ex) => {
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
  const byDifficulty = compExercises.reduce((acc: Record<string, number>, ex) => {
    acc[ex.difficulty] = (acc[ex.difficulty] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Distribution par Difficulté:');
  Object.entries(byDifficulty).forEach(([diff, count]) => {
    console.log(`   ${diff}: ${count}`);
  });

  // Identifier formats existants
  console.log('\n📊 Formats Identifiés:');

  const hyroxCount = compExercises.filter(ex =>
    ex.name.toLowerCase().includes('hyrox') ||
    ex.category?.toLowerCase() === 'hyrox'
  ).length;

  const dekaCount = compExercises.filter(ex =>
    ex.name.toLowerCase().includes('deka') ||
    ex.category?.toLowerCase() === 'deka'
  ).length;

  const crossfitCount = compExercises.filter(ex =>
    ex.category?.toLowerCase() === 'crossfit' ||
    ex.subcategory?.toLowerCase().includes('girl') ||
    ex.subcategory?.toLowerCase().includes('hero')
  ).length;

  const ocr = compExercises.filter(ex =>
    ex.name.toLowerCase().includes('spartan') ||
    ex.name.toLowerCase().includes('obstacle')
  ).length;

  console.log(`   HYROX: ${hyroxCount} exercices`);
  console.log(`   DEKA: ${dekaCount} exercices`);
  console.log(`   CrossFit (Girls/Hero/Benchmarks): ${crossfitCount} exercices`);
  console.log(`   OCR/Spartan: ${ocr} exercices`);

  // Identifier les lacunes
  console.log('\n' + '='.repeat(80));
  console.log('🎯 LACUNES IDENTIFIÉES & OBJECTIFS SPRINT 5');
  console.log('='.repeat(80));

  console.log('\n📍 HYROX (8 stations):');
  console.log(`   Actuel: ${hyroxCount} exercices`);
  console.log(`   Objectif: +32 exercices (8 stations × 4 variantes)`);
  console.log(`   Stations: SkiErg, Sled Push, Sled Pull, Burpee Broad Jump,`);
  console.log(`            Rowing, Farmers Carry, Sandbag Lunges, Wall Balls`);

  console.log('\n📍 DEKA (10 zones):');
  console.log(`   Actuel: ${dekaCount} exercices`);
  console.log(`   Objectif: +40 exercices (10 zones × 4 progressions)`);
  console.log(`   Zones: Ski, Bike, Row, Lunge, Farmers, Box Jump-Over,`);
  console.log(`         Ball Slam, Air Squat, Dead Ball Burpees, Tank Push/Pull`);

  console.log('\n📍 OCR / SPARTAN RACE:');
  console.log(`   Actuel: ${ocr} exercices`);
  console.log(`   Objectif: +25 exercices obstacles`);
  console.log(`   Types: Rope climb, Spear throw, Hercules hoist, Bucket carry,`);
  console.log(`         Atlas stone, Monkey bars, Walls, etc.`);

  console.log('\n📍 CrossFit BENCHMARKS:');
  console.log(`   Actuel: ${crossfitCount} exercices`);
  console.log(`   Objectif: +15 WODs manquants`);
  console.log(`   Types: Girls WODs non présents, nouveaux benchmarks`);

  console.log('\n📍 HERO WODs:');
  console.log(`   Objectif: +20 Hero WODs complets`);
  console.log(`   Formats: Murph, DT, Kalsu, etc.`);

  console.log('\n📍 FORMATS VARIÉS (EMOM/AMRAP/Chipper):');
  console.log(`   Objectif: +30 formats structurés`);
  console.log(`   Types: EMOM 10-20min, AMRAP 15-30min, Chippers longs`);

  const total = compExercises.length;
  const target = total + 162;

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ OBJECTIFS');
  console.log('='.repeat(80));
  console.log(`   Base actuelle: ${total} exercices`);
  console.log(`   Objectif final: ${target} exercices`);
  console.log(`   À créer: 162 nouveaux formats`);
  console.log(`   Distribution:`);
  console.log(`     - HYROX stations: 32 exercices`);
  console.log(`     - DEKA challenges: 40 exercices`);
  console.log(`     - OCR/Spartan: 25 exercices`);
  console.log(`     - CrossFit benchmarks: 15 exercices`);
  console.log(`     - Hero/Girls WODs: 20 exercices`);
  console.log(`     - EMOM/AMRAP/Chipper: 30 exercices`);
  console.log('='.repeat(80));

  // Exemples d'exercices actuels
  console.log('\n📋 Exemples exercices existants (15 premiers):');
  compExercises.slice(0, 15).forEach((ex, idx) => {
    console.log(`   ${idx + 1}. ${ex.name}`);
    console.log(`      Category: ${ex.category} | Difficulty: ${ex.difficulty}`);
  });

  console.log('\n✅ ANALYSE COMPLÉTÉE');
}

analyzeCompetitions().catch(console.error);

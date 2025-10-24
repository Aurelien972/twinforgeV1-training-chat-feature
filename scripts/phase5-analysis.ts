import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzePhase5() {
  console.log('🔍 ANALYSE PHASE 5: OUTDOOR & NATURE TRAINING');
  console.log('='.repeat(70));

  // Get all exercises
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, name, category, discipline, difficulty');

  console.log(`\n📊 TOTAL EXERCICES CATALOGUE: ${allExercises?.length || 0}`);

  // Outdoor categories
  const outdoorCategories = ['outdoor', 'trail_running', 'obstacle_course', 'nature_training'];
  const outdoorExercises = allExercises?.filter(ex =>
    outdoorCategories.includes(ex.category) ||
    ex.name.toLowerCase().includes('outdoor') ||
    ex.name.toLowerCase().includes('park') ||
    ex.name.toLowerCase().includes('trail')
  ) || [];

  console.log(`\n🌲 EXERCICES OUTDOOR EXISTANTS: ${outdoorExercises.length}`);

  // Breakdown by category
  const byCategory: Record<string, any[]> = {};
  outdoorExercises.forEach(ex => {
    if (!byCategory[ex.category]) byCategory[ex.category] = [];
    byCategory[ex.category].push(ex);
  });

  console.log('\n📈 Répartition par catégorie:');
  Object.entries(byCategory).forEach(([category, exercises]) => {
    console.log(`  ${category.padEnd(30)} ${exercises.length} exercices`);
  });

  // Breakdown by discipline
  const byDiscipline: Record<string, number> = {};
  outdoorExercises.forEach(ex => {
    byDiscipline[ex.discipline] = (byDiscipline[ex.discipline] || 0) + 1;
  });

  console.log('\n🏋️ Répartition par discipline:');
  Object.entries(byDiscipline)
    .sort(([, a], [, b]) => b - a)
    .forEach(([discipline, count]) => {
      console.log(`  ${discipline.padEnd(20)} ${count} exercices`);
    });

  // Analyze equipment usage
  const { data: equipmentTypes } = await supabase
    .from('equipment_types')
    .select('id, name, category');

  console.log('\n🔧 TYPES D\'ÉQUIPEMENT DISPONIBLES:');
  const outdoorEquipment = equipmentTypes?.filter(eq =>
    eq.name.toLowerCase().includes('outdoor') ||
    eq.name.toLowerCase().includes('nature') ||
    eq.name.toLowerCase().includes('trail') ||
    eq.category?.toLowerCase().includes('outdoor')
  ) || [];

  if (outdoorEquipment.length > 0) {
    outdoorEquipment.forEach(eq => {
      console.log(`  - ${eq.name} (${eq.category || 'N/A'})`);
    });
  } else {
    console.log('  ⚠️  Aucun équipement outdoor spécifique trouvé');
  }

  // Gap analysis
  console.log('\n🎯 GAP ANALYSIS - Exercices à ajouter:');
  console.log('\n1. TRAIL RUNNING & HIKING');
  console.log('   - Uphill running techniques');
  console.log('   - Downhill control exercises');
  console.log('   - Technical terrain navigation');
  console.log('   - Long-distance hiking movements');

  console.log('\n2. OBSTACLE COURSE TRAINING');
  console.log('   - Wall climbs and scaling');
  console.log('   - Rope climbs outdoor');
  console.log('   - Balance beams (logs, rails)');
  console.log('   - Crawl variations (mud, terrain)');

  console.log('\n3. NATURE-BASED TRAINING');
  console.log('   - Stone/rock lifting');
  console.log('   - Log carries and throws');
  console.log('   - Beach training exercises');
  console.log('   - Water-based movements');

  console.log('\n4. STREET FITNESS & URBAN');
  console.log('   - Advanced bar work');
  console.log('   - Wall runs and parkour basics');
  console.log('   - Urban obstacle navigation');
  console.log('   - Stair variations complexes');

  console.log('\n5. FUNCTIONAL OUTDOOR');
  console.log('   - Farmer walks outdoor');
  console.log('   - Sled push/pull alternatives');
  console.log('   - Tire flips (outdoor)');
  console.log('   - Sandbag training nature');

  // Recommendations
  console.log('\n💡 RECOMMANDATIONS PHASE 5:');
  console.log('  • Objectif: 100+ exercices outdoor/nature');
  console.log('  • Focus: Trail running (20), Obstacles (25), Nature (20), Street (20), Functional outdoor (15)');
  console.log('  • Équipement: Minimal ou trouvé en nature (roches, logs, terrain)');
  console.log('  • Niveaux: 40% beginner, 40% intermediate, 20% advanced');
  console.log('  • Coaching: 3 niveaux détaillés pour chaque exercice');
  console.log('  • Safety: Emphasis sur sécurité outdoor et conditions météo');

  console.log('\n' + '='.repeat(70));
}

analyzePhase5()
  .then(() => {
    console.log('✅ Analyse terminée\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeForPhase4() {
  console.log('🔍 ANALYSE POUR PHASE 4: HOME & BODYWEIGHT');
  console.log('='.repeat(70));

  // 1. Count current exercises by discipline
  const { data: byDiscipline } = await supabase
    .from('exercises')
    .select('discipline');

  const disciplineCounts: Record<string, number> = {};
  byDiscipline?.forEach(ex => {
    disciplineCounts[ex.discipline] = (disciplineCounts[ex.discipline] || 0) + 1;
  });

  console.log('\n📊 Répartition actuelle par discipline:');
  Object.entries(disciplineCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([discipline, count]) => {
      console.log(`  ${discipline.padEnd(20)} ${count} exercices`);
    });

  // 2. Check bodyweight/home exercises
  const { data: bodyweightExercises } = await supabase
    .from('exercises')
    .select('id, name, category, discipline')
    .or('category.ilike.%bodyweight%,category.ilike.%home%');

  console.log(`\n🏠 Exercices home/bodyweight actuels: ${bodyweightExercises?.length || 0}`);

  // 3. Check equipment usage
  const { data: equipmentUsage } = await supabase
    .from('equipment_types')
    .select('name, name_fr');

  console.log(`\n🏋️ Équipements disponibles: ${equipmentUsage?.length || 0}`);
  console.log('  Exemples:', equipmentUsage?.slice(0, 10).map(e => e.name).join(', '));

  // 4. Check 'none' equipment usage
  const { data: noneEquipment } = await supabase
    .from('equipment_types')
    .select('id')
    .eq('name', 'none')
    .maybeSingle();

  if (noneEquipment) {
    const { count } = await supabase
      .from('exercise_equipment')
      .select('*', { count: 'exact', head: true })
      .eq('equipment_id', noneEquipment.id);

    console.log(`\n✋ Exercices sans équipement (none): ${count || 0}`);
  }

  // 5. Recommendations for Phase 4
  console.log('\n' + '='.repeat(70));
  console.log('📋 RECOMMANDATIONS PHASE 4:');
  console.log('='.repeat(70));
  console.log('\n1. HOME TRAINING (50 exercices)');
  console.log('   - Variations bodyweight des exercices force');
  console.log('   - Exercices avec objets du quotidien');
  console.log('   - Circuits home fitness');

  console.log('\n2. OUTDOOR TRAINING (30 exercices)');
  console.log('   - Park workout (barres, bancs publics)');
  console.log('   - Trail running variations');
  console.log('   - Outdoor calisthenics');

  console.log('\n3. MINIMAL EQUIPMENT (20 exercices)');
  console.log('   - Resistance bands progressions');
  console.log('   - Single dumbbell/kettlebell');
  console.log('   - TRX/suspension training');

  console.log('\n📊 OBJECTIF TOTAL: 100 nouveaux exercices');
  console.log('='.repeat(70));
}

analyzeForPhase4()
  .then(() => {
    console.log('\n✅ Analyse terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Equipment mappings for exercises without equipment
const equipmentMappings: Record<string, string[]> = {
  // Strongman exercises
  'Atlas Stone': ['atlas-stone'],
  'Yoke Walk': ['yoke'],
  'Yoke': ['yoke'],
  'Log Clean': ['log-bar'],
  'Log Press': ['log-bar'],
  'Log': ['log-bar'],
  'Farmers Walk': ['farmers-walk-handles'],
  'Farmers': ['farmers-walk-handles'],
  'Tire Flip': ['tire-strongman'],
  'Tire': ['tire-strongman'],
  'Sandbag Over': ['sandbag-heavy'],
  'Sandbag Carry': ['sandbag-heavy'],
  'Sandbag Load': ['sandbag-heavy'],
  'Keg': ['keg'],
  'Car Deadlift': ['car-deadlift'],
  'Truck Pull': ['truck-pull-harness'],
  'Sled': ['sled'],

  // Machines
  'Hack Squat': ['hack-squat-machine'],
  'Leg Press 45': ['leg-press-45'],
  'Leg Press Horizontal': ['leg-press-horizontal'],
  'Leg Press (': ['leg-press'],
  'Leg Press': ['leg-press'],
  'Smith Machine': ['smith-machine'],
  'Leg Extension Machine': ['leg-extension-machine'],
  'Leg Extension': ['leg-extension-machine'],
  'Leg Curl Lying': ['leg-curl-lying'],
  'Leg Curl Seated': ['leg-curl-seated'],
  'Leg Curl (': ['leg-curl'],
  'Leg Curl': ['leg-curl'],
  'Hip Thrust Machine': ['hip-thrust-machine'],
  'Adductor Machine': ['adductor-machine'],
  'Abductor Machine': ['abductor-machine'],
  'Calf Raise Standing': ['calf-raise-standing'],
  'Calf Raise Seated': ['calf-raise-seated'],
  'Pendulum Squat': ['pendulum-squat'],
  'V-Squat': ['v-squat-machine'],
  'Belt Squat': ['belt-squat-machine'],
  'Reverse Hyper': ['reverse-hyper'],

  // Powerlifting accessories
  'with Chains': ['chains-powerlifting'],
  'Chains': ['chains-powerlifting'],
  'with Bands': ['resistance-bands-heavy'],
  'Bands': ['resistance-bands-heavy'],
  'Board Press': ['boards-bench-press'],
  '2 Boards': ['boards-bench-press'],
  '3 Boards': ['boards-bench-press'],
  'Safety Squat Bar': ['safety-squat-bar'],
  'Cambered Bar': ['cambered-bar'],
  'Swiss Bar': ['swiss-bar'],
  'Bamboo Bar': ['bamboo-bar'],

  // Endurance
  'Rowing Machine': ['rowing-machine-concept2'],
  'Rowing': ['rowing-machine-concept2'],
  'Row (': ['rowing-machine-concept2'],
  'SkiErg': ['ski-erg'],
  'Ski Erg': ['ski-erg'],
  'BikeErg': ['bike-erg'],
  'Bike Erg': ['bike-erg'],
  'Echo Bike': ['echo-bike'],
  'Assault Bike': ['assault-bike'],
  'Air Bike': ['air-bike'],
  'Spin Bike': ['spin-bike'],
  'Treadmill': ['treadmill'],
  'Curved Treadmill': ['curved-treadmill'],
  'Run (': ['treadmill'],
  'Stair Climber': ['stair-climber'],
  'Elliptical': ['elliptical'],

  // Functional
  'GHD': ['ghd'],
  'Pegboard': ['pegboard'],
  'Rope Climb': ['rope-climbing'],
  'Climbing Rope': ['rope-climbing'],
  'Rings': ['gymnastic-rings'],
  'Gymnastic Rings': ['gymnastic-rings'],
  'Parallettes': ['parallettes'],
  'Pull-up Bar': ['pull-up-bar'],
  'Pull-Up': ['pull-up-bar'],
  'Dip Station': ['dip-station'],
  'Dips (': ['dip-station'],
  'Monkey Bars': ['monkey-bars'],
  'Cargo Net': ['cargo-net'],
  'Warped Wall': ['warped-wall'],
  'Multi-Rig': ['multi-rig'],

  // Accessories
  'Ab Wheel': ['ab-wheel'],
  'Balance Board': ['balance-board'],
  'Bosu Ball': ['bosu-ball'],
  'TRX': ['trx-suspension'],
  'Battle Ropes': ['battle-ropes'],
  'Landmine': ['landmine-attachment'],
  'Dip Belt': ['dip-belt'],
  'Weight Vest': ['weight-vest'],
  'Ankle Weights': ['ankle-weights'],
  'Wrist Weights': ['wrist-weights']
};

async function detectAndAssignEquipment() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 2 - STEP 4B: ASSIGNATION ÉQUIPEMENTS AUX EXERCICES');
  console.log('='.repeat(80) + '\n');

  // Get exercises without equipment
  const { data: exercisesWithoutEquipment } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      discipline,
      exercise_equipment(equipment_id)
    `)
    .eq('is_active', true)
    .eq('is_validated', true)
    .neq('discipline', 'calisthenics');

  const exercisesToProcess = (exercisesWithoutEquipment || []).filter(
    ex => !ex.exercise_equipment || ex.exercise_equipment.length === 0
  );

  console.log(`Found ${exercisesToProcess.length} exercises without equipment\n`);

  // Get all equipment types for mapping
  const { data: allEquipment } = await supabase
    .from('equipment_types')
    .select('id, name');

  const equipmentMap = new Map<string, string>();
  (allEquipment || []).forEach(eq => {
    equipmentMap.set(eq.name.toLowerCase(), eq.id);
  });

  let assignedCount = 0;
  let skippedCount = 0;

  for (const exercise of exercisesToProcess) {  // Process all exercises
    console.log(`Processing: ${exercise.name}`);

    // Try to detect equipment from name
    let equipmentIds: string[] = [];

    for (const [keyword, equipmentNames] of Object.entries(equipmentMappings)) {
      if (exercise.name.toLowerCase().includes(keyword.toLowerCase())) {
        for (const eqName of equipmentNames) {
          const eqId = equipmentMap.get(eqName.toLowerCase());
          if (eqId && !equipmentIds.includes(eqId)) {
            equipmentIds.push(eqId);
          }
        }
      }
    }

    if (equipmentIds.length === 0) {
      console.log(`   ⚠️  No equipment detected for: ${exercise.name}`);
      skippedCount++;
      continue;
    }

    // Assign equipment
    for (const equipmentId of equipmentIds) {
      const { error } = await supabase
        .from('exercise_equipment')
        .insert({
          exercise_id: exercise.id,
          equipment_id: equipmentId,
          is_required: true
        });

      if (error && !error.message.includes('duplicate')) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log(`   ✅ Assigned ${equipmentIds.length} equipment(s)`);
    assignedCount++;
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS');
  console.log('='.repeat(80));
  console.log(`✅ Exercices enrichis: ${assignedCount}`);
  console.log(`⚠️  Exercices non traités: ${skippedCount}`);
  console.log('='.repeat(80) + '\n');
}

async function verify() {
  console.log('🔍 VERIFICATION POST-ASSIGNATION\n');

  const { data: allExercises } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      discipline,
      exercise_equipment(equipment_id)
    `)
    .eq('is_active', true)
    .eq('is_validated', true)
    .neq('discipline', 'calisthenics');

  const withEquipment = (allExercises || []).filter(
    ex => ex.exercise_equipment && ex.exercise_equipment.length > 0
  ).length;

  const withoutEquipment = (allExercises || []).length - withEquipment;

  console.log(`✅ Exercices AVEC équipement: ${withEquipment}/${allExercises?.length || 0}`);
  console.log(`❌ Exercices SANS équipement: ${withoutEquipment}`);
  console.log(`📊 Complétude: ${((withEquipment / (allExercises?.length || 1)) * 100).toFixed(1)}%\n`);
}

async function main() {
  try {
    await detectAndAssignEquipment();
    await verify();
    console.log('✅ SPRINT 2 STEP 4B COMPLÉTÉ\n');
  } catch (error) {
    console.error('❌ ERREUR:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

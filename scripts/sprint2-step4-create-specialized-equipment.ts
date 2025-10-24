import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EquipmentToCreate {
  name: string;
  name_fr: string;
  name_en: string;
  category: string;
  description?: string;
}

// Équipements spécialisés à créer
const specializedEquipment: EquipmentToCreate[] = [
  // STRONGMAN EQUIPMENT (using accessory category)
  { name: 'atlas-stone', name_fr: 'Pierre Atlas', name_en: 'Atlas Stone', category: 'accessory', description: 'Spherical stone for loading and carrying' },
  { name: 'yoke', name_fr: 'Yoke', name_en: 'Yoke', category: 'accessory', description: 'Frame for heavy carries' },
  { name: 'log-bar', name_fr: 'Barre Log', name_en: 'Log Bar', category: 'barbell', description: 'Cylindrical bar for pressing movements' },
  { name: 'farmers-walk-handles', name_fr: 'Poignées Farmers Walk', name_en: 'Farmers Walk Handles', category: 'accessory', description: 'Specialized grip handles for heavy carries' },
  { name: 'tire-strongman', name_fr: 'Pneu Strongman', name_en: 'Tire (Strongman)', category: 'accessory', description: 'Heavy tire for flipping' },
  { name: 'sandbag-heavy', name_fr: 'Sandbag Lourd', name_en: 'Sandbag (Heavy)', category: 'accessory', description: 'Heavy sandbag for carries and lifts' },
  { name: 'keg', name_fr: 'Tonneau', name_en: 'Keg', category: 'accessory', description: 'Barrel for loading and pressing' },
  { name: 'chain-heavy', name_fr: 'Chaîne Lourde', name_en: 'Chain (Heavy)', category: 'accessory', description: 'Heavy chains for resistance' },
  { name: 'car-deadlift', name_fr: 'Voiture Deadlift', name_en: 'Car (Deadlift)', category: 'accessory', description: 'Vehicle for deadlift events' },
  { name: 'truck-pull-harness', name_fr: 'Harnais Traction Camion', name_en: 'Truck Pull Harness', category: 'accessory', description: 'Harness for vehicle pulling' },

  // POWERLIFTING ACCESSORIES
  { name: 'chains-powerlifting', name_fr: 'Chaînes Powerlifting', name_en: 'Chains (Powerlifting)', category: 'accessory', description: 'Variable resistance chains' },
  { name: 'resistance-bands-heavy', name_fr: 'Bandes Résistance Lourdes', name_en: 'Resistance Bands (Heavy)', category: 'accessory', description: 'Accommodating resistance bands' },
  { name: 'boards-bench-press', name_fr: 'Planches Bench Press', name_en: 'Boards (Bench Press)', category: 'accessory', description: 'Boards for partial range work' },
  { name: 'belt-squat-machine', name_fr: 'Machine Belt Squat', name_en: 'Belt Squat Machine', category: 'machine', description: 'Machine for belt squats' },
  { name: 'reverse-hyper', name_fr: 'Reverse Hyper', name_en: 'Reverse Hyper', category: 'machine', description: 'Machine for posterior chain' },
  { name: 'cambered-bar', name_fr: 'Barre Cambrée', name_en: 'Cambered Bar', category: 'barbell', description: 'Arched specialty bar' },
  { name: 'swiss-bar', name_fr: 'Barre Suisse', name_en: 'Swiss Bar', category: 'barbell', description: 'Multi-grip specialty bar' },
  { name: 'bamboo-bar', name_fr: 'Barre Bambou', name_en: 'Bamboo Bar', category: 'barbell', description: 'Flexible bar for stability' },

  // MACHINES SPÉCIALISÉES
  { name: 'hack-squat-machine', name_fr: 'Machine Hack Squat', name_en: 'Hack Squat Machine', category: 'machine', description: 'Angled squat machine' },
  { name: 'leg-press-45', name_fr: 'Presse à Cuisses 45°', name_en: 'Leg Press (45 Degree)', category: 'machine', description: 'Angled leg press' },
  { name: 'leg-press-horizontal', name_fr: 'Presse à Cuisses Horizontale', name_en: 'Leg Press (Horizontal)', category: 'machine', description: 'Horizontal leg press' },
  { name: 'pendulum-squat', name_fr: 'Pendulum Squat', name_en: 'Pendulum Squat', category: 'machine', description: 'Arc path squat machine' },
  { name: 'v-squat-machine', name_fr: 'Machine V-Squat', name_en: 'V-Squat Machine', category: 'machine', description: 'V-shaped squat machine' },
  { name: 'leg-extension-machine', name_fr: 'Machine Leg Extension', name_en: 'Leg Extension Machine', category: 'machine', description: 'Quad isolation machine' },
  { name: 'leg-curl-lying', name_fr: 'Leg Curl Couché', name_en: 'Leg Curl Machine (Lying)', category: 'machine', description: 'Hamstring curl machine' },
  { name: 'leg-curl-seated', name_fr: 'Leg Curl Assis', name_en: 'Leg Curl Machine (Seated)', category: 'machine', description: 'Seated hamstring curl' },
  { name: 'hip-thrust-machine', name_fr: 'Machine Hip Thrust', name_en: 'Hip Thrust Machine', category: 'machine', description: 'Machine for hip thrusts' },
  { name: 'adductor-machine', name_fr: 'Machine Adducteurs', name_en: 'Adductor Machine', category: 'machine', description: 'Inner thigh machine' },
  { name: 'abductor-machine', name_fr: 'Machine Abducteurs', name_en: 'Abductor Machine', category: 'machine', description: 'Outer thigh machine' },
  { name: 'calf-raise-standing', name_fr: 'Mollets Debout', name_en: 'Calf Raise Machine (Standing)', category: 'machine', description: 'Standing calf machine' },
  { name: 'calf-raise-seated', name_fr: 'Mollets Assis', name_en: 'Calf Raise Machine (Seated)', category: 'machine', description: 'Seated calf machine' },

  // ENDURANCE EQUIPMENT
  { name: 'rowing-machine-concept2', name_fr: 'Rameur Concept2', name_en: 'Rowing Machine (Concept2)', category: 'cardio', description: 'Indoor rowing ergometer' },
  { name: 'ski-erg', name_fr: 'SkiErg', name_en: 'SkiErg', category: 'cardio', description: 'Ski simulation machine' },
  { name: 'bike-erg', name_fr: 'BikeErg', name_en: 'BikeErg', category: 'cardio', description: 'Stationary bike ergometer' },
  { name: 'echo-bike', name_fr: 'Echo Bike', name_en: 'Echo Bike', category: 'cardio', description: 'Fan bike for conditioning' },
  { name: 'spin-bike', name_fr: 'Vélo Spinning', name_en: 'Spin Bike', category: 'cardio', description: 'Indoor cycling bike' },
  { name: 'curved-treadmill', name_fr: 'Tapis Courbé', name_en: 'Curved Treadmill', category: 'cardio', description: 'Non-motorized curved treadmill' },
  { name: 'stair-climber', name_fr: 'Escalier', name_en: 'Stair Climber', category: 'cardio', description: 'Stair climbing machine' },
  { name: 'elliptical', name_fr: 'Elliptique', name_en: 'Elliptical', category: 'cardio', description: 'Low-impact cardio machine' },

  // FUNCTIONAL/COMPETITIONS
  { name: 'pegboard', name_fr: 'Pegboard', name_en: 'Pegboard', category: 'bodyweight', description: 'Vertical peg climbing board' },
  { name: 'rope-climbing', name_fr: 'Corde à Grimper', name_en: 'Rope (Climbing)', category: 'bodyweight', description: 'Rope for climbing' },
  { name: 'dip-station', name_fr: 'Station Dips', name_en: 'Dip Station', category: 'bodyweight', description: 'Parallel bars for dips' },
  { name: 'monkey-bars', name_fr: 'Monkey Bars', name_en: 'Monkey Bars', category: 'bodyweight', description: 'Overhead ladder' },
  { name: 'cargo-net', name_fr: 'Filet Cargo', name_en: 'Cargo Net', category: 'bodyweight', description: 'Climbing net obstacle' },
  { name: 'warped-wall', name_fr: 'Mur Courbé', name_en: 'Warped Wall', category: 'bodyweight', description: 'Curved wall obstacle' },
  { name: 'multi-rig', name_fr: 'Multi-Rig', name_en: 'Multi-Rig', category: 'bodyweight', description: 'Overhead rig system' },

  // ACCESSORIES
  { name: 'ab-wheel', name_fr: 'Roue Abdos', name_en: 'Ab Wheel', category: 'accessory', description: 'Wheel for core rollouts' },
  { name: 'balance-board', name_fr: 'Planche Équilibre', name_en: 'Balance Board', category: 'accessory', description: 'Unstable surface board' },
  { name: 'bosu-ball', name_fr: 'Bosu Ball', name_en: 'Bosu Ball', category: 'accessory', description: 'Half stability ball' },
  { name: 'trx-suspension', name_fr: 'TRX Suspension', name_en: 'TRX Suspension Trainer', category: 'accessory', description: 'Suspension training system' },
  { name: 'battle-ropes', name_fr: 'Battle Ropes', name_en: 'Battle Ropes', category: 'accessory', description: 'Heavy ropes for conditioning' },
  { name: 'landmine-attachment', name_fr: 'Fixation Landmine', name_en: 'Landmine Attachment', category: 'accessory', description: 'Barbell pivot attachment' },
  { name: 'dip-belt', name_fr: 'Ceinture Dips', name_en: 'Dip Belt', category: 'accessory', description: 'Belt for adding weight to dips/pull-ups' },
  { name: 'weight-vest', name_fr: 'Gilet Lesté', name_en: 'Weight Vest', category: 'accessory', description: 'Vest with weight pockets' },
  { name: 'ankle-weights', name_fr: 'Poids Chevilles', name_en: 'Ankle Weights', category: 'accessory', description: 'Weighted ankle straps' },
  { name: 'wrist-weights', name_fr: 'Poids Poignets', name_en: 'Wrist Weights', category: 'accessory', description: 'Weighted wrist straps' }
];

async function createEquipment() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 2 - STEP 4: CRÉATION ÉQUIPEMENTS SPÉCIALISÉS');
  console.log('='.repeat(80) + '\n');

  let createdCount = 0;
  let existingCount = 0;
  let errorCount = 0;

  for (const equipment of specializedEquipment) {
    // Check if equipment already exists
    const { data: existing } = await supabase
      .from('equipment_types')
      .select('id, name')
      .ilike('name', equipment.name)
      .maybeSingle();

    if (existing) {
      console.log(`   ℹ️  Existe déjà: ${equipment.name}`);
      existingCount++;
      continue;
    }

    // Create equipment
    const { error } = await supabase
      .from('equipment_types')
      .insert({
        name: equipment.name,
        name_fr: equipment.name_fr,
        name_en: equipment.name_en,
        category: equipment.category,
        description: equipment.description
      });

    if (error) {
      console.log(`   ❌ Erreur ${equipment.name}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`   ✅ Créé: ${equipment.name} (${equipment.category})`);
      createdCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS');
  console.log('='.repeat(80));
  console.log(`✅ Équipements créés: ${createdCount}`);
  console.log(`ℹ️  Équipements existants: ${existingCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📊 Total catalogués: ${createdCount + existingCount}`);
  console.log('='.repeat(80) + '\n');
}

async function listEquipmentByCategory() {
  console.log('📋 ÉQUIPEMENTS PAR CATÉGORIE\n');

  const { data: equipment } = await supabase
    .from('equipment_types')
    .select('name, category')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (!equipment) return;

  const byCategory = equipment.reduce((acc: any, eq: any) => {
    if (!acc[eq.category]) acc[eq.category] = [];
    acc[eq.category].push(eq.name);
    return acc;
  }, {});

  for (const [category, items] of Object.entries(byCategory)) {
    console.log(`\n${category.toUpperCase()} (${(items as any[]).length}):`);
    (items as string[]).forEach(name => console.log(`  - ${name}`));
  }

  console.log(`\n✅ Total équipements: ${equipment.length}\n`);
}

async function main() {
  try {
    await createEquipment();
    await listEquipmentByCategory();
    console.log('✅ SPRINT 2 STEP 4 COMPLÉTÉ\n');
  } catch (error) {
    console.error('❌ ERREUR:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const muscleCache = new Map<string, string>();
const equipmentCache = new Map<string, string>();

async function getMuscleId(name: string): Promise<string | null> {
  if (muscleCache.has(name)) return muscleCache.get(name)!;
  const { data } = await supabase.from('muscle_groups').select('id').ilike('name', `%${name}%`).limit(1).maybeSingle();
  if (data) muscleCache.set(name, data.id);
  return data?.id || null;
}

async function getEquipmentId(name: string): Promise<string | null> {
  if (equipmentCache.has(name)) return equipmentCache.get(name)!;
  const { data } = await supabase.from('equipment_types').select('id').ilike('name', `%${name}%`).limit(1).maybeSingle();
  if (data) equipmentCache.set(name, data.id);
  return data?.id || null;
}

async function seedExercise(ex: any) {
  const primaryMuscleIds = (await Promise.all((ex.primary_muscles || []).map(getMuscleId))).filter(Boolean);
  const secondaryMuscleIds = (await Promise.all((ex.secondary_muscles || []).map(getMuscleId))).filter(Boolean);
  const equipmentIds = (await Promise.all((ex.equipment || []).map(getEquipmentId))).filter(Boolean);

  const { data: exercise, error } = await supabase.from('exercises').insert({
    name: ex.name,
    discipline: 'endurance',
    category: ex.category,
    subcategory: ex.subcategory,
    difficulty: ex.difficulty,
    description_short: ex.description,
    movement_pattern: 'cardio',
    is_validated: true,
    typical_sets_min: ex.sets_min || 1,
    typical_sets_max: ex.sets_max || 1,
    typical_duration_min: ex.duration_min,
    typical_duration_max: ex.duration_max,
    typical_rest_sec: ex.rest_sec || 0,
    visual_keywords: ex.visual_keywords || ['endurance', 'cardio', 'zones', 'pacing']
  }).select().single();

  if (error || !exercise) {
    console.error(`❌ ${ex.name}:`, error?.message);
    return;
  }

  if (primaryMuscleIds.length > 0) {
    await supabase.from('exercise_muscle_groups').insert(
      primaryMuscleIds.map(id => ({ exercise_id: exercise.id, muscle_group_id: id, involvement_type: 'primary' }))
    );
  }

  if (secondaryMuscleIds.length > 0) {
    await supabase.from('exercise_muscle_groups').insert(
      secondaryMuscleIds.map(id => ({ exercise_id: exercise.id, muscle_group_id: id, involvement_type: 'secondary' }))
    );
  }

  if (equipmentIds.length > 0) {
    await supabase.from('exercise_equipment').insert(
      equipmentIds.map(id => ({ exercise_id: exercise.id, equipment_id: id, is_required: true }))
    );
  }

  console.log(`✅ ${ex.name}`);
}

const enduranceProtocols = [
  {
    name: 'Zone 1 Active Recovery Run',
    category: 'run',
    subcategory: 'zone_training',
    difficulty: 'beginner',
    description: 'Zone 1 55-65% FCmax récupération active aérobie base endurance fondamentale',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    duration_min: 30,
    duration_max: 90,
    visual_keywords: ['zone 1', 'recovery', 'easy pace', 'aerobic base']
  },
  {
    name: 'Zone 2 Endurance Base Run',
    category: 'run',
    subcategory: 'zone_training',
    difficulty: 'intermediate',
    description: 'Zone 2 65-75% FCmax endurance aérobie capacité lipides conversation possible',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    duration_min: 45,
    duration_max: 150,
    visual_keywords: ['zone 2', 'aerobic base', 'fat burning', 'conversation pace']
  },
  {
    name: 'Zone 3 Tempo Run',
    category: 'run',
    subcategory: 'zone_training',
    difficulty: 'intermediate',
    description: 'Zone 3 75-82% FCmax tempo threshold seuil anaérobie confortable difficile',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    duration_min: 20,
    duration_max: 60,
    visual_keywords: ['zone 3', 'tempo', 'threshold', 'comfortably hard']
  },
  {
    name: 'Zone 4 Lactate Threshold Intervals',
    category: 'run',
    subcategory: 'zone_training',
    difficulty: 'advanced',
    description: 'Zone 4 82-89% FCmax seuil lactique intervalles répétés tolérance lactate',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    sets_min: 4,
    sets_max: 8,
    duration_min: 4,
    duration_max: 8,
    rest_sec: 120,
    visual_keywords: ['zone 4', 'threshold intervals', 'lactate tolerance', 'hard effort']
  },
  {
    name: 'Zone 5 VO2max Intervals',
    category: 'run',
    subcategory: 'zone_training',
    difficulty: 'advanced',
    description: 'Zone 5 89-100% FCmax VO2max intervalles courts maximaux puissance aérobie',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    sets_min: 5,
    sets_max: 10,
    duration_min: 2,
    duration_max: 5,
    rest_sec: 180,
    visual_keywords: ['zone 5', 'VO2max', 'maximal intervals', 'aerobic power']
  },
  {
    name: 'Polarized Training Week Base',
    category: 'run',
    subcategory: 'polarized',
    difficulty: 'intermediate',
    description: 'Polarized training 80% zone 1-2 20% zone 4-5 semaine type endurance optimale',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    duration_min: 240,
    duration_max: 480,
    visual_keywords: ['polarized', 'training week', '80/20 rule', 'optimal endurance']
  },
  {
    name: 'Sweet Spot Intervals Run',
    category: 'run',
    subcategory: 'sweet_spot',
    difficulty: 'intermediate',
    description: 'Sweet spot 86-92% FTP zone 3 haut intervalles longs efficacité maximale',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    sets_min: 3,
    sets_max: 6,
    duration_min: 10,
    duration_max: 20,
    rest_sec: 240,
    visual_keywords: ['sweet spot', 'upper zone 3', 'efficient training', 'long intervals']
  },
  {
    name: 'Coggan Power Zone 1 Cycling',
    category: 'cycle',
    subcategory: 'power_zones',
    difficulty: 'beginner',
    description: 'Coggan Z1 <55% FTP récupération active spinning facile jambes légères',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'fessiers'],
    equipment: ['stationary-bike'],
    duration_min: 30,
    duration_max: 120,
    visual_keywords: ['coggan zone 1', 'recovery ride', 'easy spin', 'active recovery']
  },
  {
    name: 'Coggan Power Zone 2 Cycling',
    category: 'cycle',
    subcategory: 'power_zones',
    difficulty: 'beginner',
    description: 'Coggan Z2 56-75% FTP endurance base aérobie capacité lipidique longue durée',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'fessiers'],
    equipment: ['stationary-bike'],
    duration_min: 60,
    duration_max: 300,
    visual_keywords: ['coggan zone 2', 'endurance', 'aerobic base', 'fat burning']
  },
  {
    name: 'Coggan Power Zone 3 Cycling',
    category: 'cycle',
    subcategory: 'power_zones',
    difficulty: 'intermediate',
    description: 'Coggan Z3 76-90% FTP tempo efforts soutenus conversation difficile',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'fessiers'],
    equipment: ['stationary-bike'],
    duration_min: 20,
    duration_max: 90,
    visual_keywords: ['coggan zone 3', 'tempo', 'sustained effort', 'challenging']
  },
  {
    name: 'Coggan Power Zone 4 Cycling',
    category: 'cycle',
    subcategory: 'power_zones',
    difficulty: 'advanced',
    description: 'Coggan Z4 91-105% FTP seuil lactique intervalles répétés tolérance lactate',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['ischio-jambiers', 'mollets'],
    equipment: ['stationary-bike'],
    sets_min: 4,
    sets_max: 8,
    duration_min: 5,
    duration_max: 12,
    rest_sec: 180,
    visual_keywords: ['coggan zone 4', 'threshold', 'lactate intervals', 'hard']
  },
  {
    name: 'Coggan Power Zone 5 Cycling',
    category: 'cycle',
    subcategory: 'power_zones',
    difficulty: 'advanced',
    description: 'Coggan Z5 106-120% FTP VO2max courts intervalles puissance aérobie maximale',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['ischio-jambiers', 'mollets'],
    equipment: ['stationary-bike'],
    sets_min: 5,
    sets_max: 10,
    duration_min: 3,
    duration_max: 8,
    rest_sec: 240,
    visual_keywords: ['coggan zone 5', 'VO2max', 'maximal power', 'short hard intervals']
  },
  {
    name: 'Coggan Power Zone 6 Cycling',
    category: 'cycle',
    subcategory: 'power_zones',
    difficulty: 'elite',
    description: 'Coggan Z6 121-150% FTP capacité anaérobie sprints courts maximaux lactate',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['ischio-jambiers', 'mollets'],
    equipment: ['stationary-bike'],
    sets_min: 6,
    sets_max: 12,
    duration_min: 30,
    duration_max: 120,
    rest_sec: 300,
    visual_keywords: ['coggan zone 6', 'anaerobic', 'sprints', 'maximal efforts']
  },
  {
    name: 'Coggan Power Zone 7 Cycling',
    category: 'cycle',
    subcategory: 'power_zones',
    difficulty: 'elite',
    description: 'Coggan Z7 >150% FTP puissance neuromusculaire sprints explosifs ultra-courts',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['ischio-jambiers', 'mollets'],
    equipment: ['stationary-bike'],
    sets_min: 8,
    sets_max: 15,
    duration_min: 10,
    duration_max: 30,
    rest_sec: 360,
    visual_keywords: ['coggan zone 7', 'neuromuscular', 'explosive sprints', 'max power']
  },
  {
    name: 'Tabata Protocol Run',
    category: 'run',
    subcategory: 'hiit',
    difficulty: 'advanced',
    description: 'Tabata 20s max 10s repos 8 rounds HIIT extrême VO2max lactate tolérance',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    sets_min: 8,
    sets_max: 8,
    duration_min: 20,
    duration_max: 20,
    rest_sec: 10,
    visual_keywords: ['tabata', 'HIIT', '20/10', 'maximal intervals']
  },
  {
    name: 'Norwegian 4x4 Protocol',
    category: 'run',
    subcategory: 'hiit',
    difficulty: 'advanced',
    description: 'Norwegian 4x4 4min zone 4-5 3min récupération VO2max protocole recherche',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    sets_min: 4,
    sets_max: 4,
    duration_min: 4,
    duration_max: 4,
    rest_sec: 180,
    visual_keywords: ['norwegian 4x4', 'VO2max intervals', 'research protocol', 'hard intervals']
  },
  {
    name: 'Pyramidal Intervals Run',
    category: 'run',
    subcategory: 'intervals',
    difficulty: 'intermediate',
    description: 'Pyramidal 1-2-3-4-3-2-1 minutes intervals croissants décroissants variété',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    sets_min: 7,
    sets_max: 7,
    duration_min: 1,
    duration_max: 4,
    rest_sec: 60,
    visual_keywords: ['pyramid', 'varied intervals', 'ascending descending', 'mixed effort']
  },
  {
    name: 'Fartlek Unstructured Run',
    category: 'run',
    subcategory: 'fartlek',
    difficulty: 'intermediate',
    description: 'Fartlek libre variations allure spontanées jeu vitesse playful intervals',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    duration_min: 30,
    duration_max: 60,
    visual_keywords: ['fartlek', 'speed play', 'unstructured', 'varied pace']
  },
  {
    name: 'Progression Run',
    category: 'run',
    subcategory: 'progression',
    difficulty: 'intermediate',
    description: 'Progression run départ facile accélération progressive finish tempo negative split',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    duration_min: 40,
    duration_max: 90,
    visual_keywords: ['progression', 'negative split', 'building pace', 'finish strong']
  },
  {
    name: 'Long Slow Distance LSD',
    category: 'run',
    subcategory: 'base_training',
    difficulty: 'beginner',
    description: 'LSD long slow distance sortie longue allure conversationnelle base aérobie',
    primary_muscles: ['quadriceps', 'ischio-jambiers'],
    secondary_muscles: ['mollets', 'fessiers'],
    equipment: [],
    duration_min: 90,
    duration_max: 240,
    visual_keywords: ['LSD', 'long run', 'slow distance', 'aerobic base']
  }
];

async function main() {
  console.log('⏱️ SEED ENDURANCE PROTOCOLS - Zones Cardiaques Détaillées');
  console.log('='.repeat(60));
  console.log(`Total exercices à insérer: ${enduranceProtocols.length}\n`);

  for (const ex of enduranceProtocols) {
    await seedExercise(ex);
  }

  console.log('\n✅ Seed endurance protocols terminé avec succès\n');
}

main().then(() => process.exit(0));

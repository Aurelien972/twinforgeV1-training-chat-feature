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
    discipline: 'calisthenics',
    category: ex.category,
    difficulty: ex.difficulty,
    description_short: ex.description,
    movement_pattern: ex.movement_pattern || 'compound',
    is_validated: true,
    typical_sets_min: ex.sets_min || 3,
    typical_sets_max: ex.sets_max || 5,
    typical_reps_min: ex.reps_min || 1,
    typical_reps_max: ex.reps_max || 5,
    typical_rest_sec: ex.rest_sec || 120,
  }).select().single();

  if (error) {
    console.error(`Error inserting ${ex.name}:`, error.message);
    return;
  }

  if (!exercise) return;

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
      equipmentIds.map(id => ({ exercise_id: exercise.id, equipment_type_id: id, is_required: true }))
    );
  }

  console.log(`✅ ${ex.name}`);
}

const plancheProgressions = [
  {
    name: 'Planche Lean Hold',
    category: 'planche_progression',
    difficulty: 'beginner',
    description: 'Planche lean inclinaison avant mains sol pieds sol introduction force poussée',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'Planche Frog Stand',
    category: 'planche_progression',
    difficulty: 'beginner',
    description: 'Planche frog stand genoux sur coudes équilibre base coordination',
    primary_muscles: ['deltoïdes', 'triceps', 'pectoraux'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 60,
  },
  {
    name: 'Planche Tuck Hold',
    category: 'planche_progression',
    difficulty: 'intermediate',
    description: 'Planche tuck genoux poitrine corps horizontal base progression isométrique',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Planche Advanced Tuck Hold',
    category: 'planche_progression',
    difficulty: 'intermediate',
    description: 'Planche advanced tuck genoux hanches position intermédiaire progression',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Planche One Leg Extended Hold',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche une jambe tendue autre tuck asymétrique progression intermédiaire',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'fessiers'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Planche Straddle Hold',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche straddle jambes écartées réduction levier force maximale',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'adducteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Planche Full Hold',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche full corps tendu horizontal maîtrise complète niveau élite',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Planche Tuck Push-ups',
    category: 'planche_progression',
    difficulty: 'intermediate',
    description: 'Planche tuck push-ups pompes position tuck force dynamique poussée',
    primary_muscles: ['pectoraux', 'deltoïdes', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 120,
  },
  {
    name: 'Planche Advanced Tuck Push-ups',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche advanced tuck push-ups pompes position avancée amplitude complète',
    primary_muscles: ['pectoraux', 'deltoïdes', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Planche Straddle Push-ups',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche straddle push-ups pompes jambes écartées force extrême',
    primary_muscles: ['pectoraux', 'deltoïdes', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'adducteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 4,
    rest_sec: 180,
  },
  {
    name: 'Planche Full Push-ups',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche full push-ups pompes corps tendu niveau élite calisthenics',
    primary_muscles: ['pectoraux', 'deltoïdes', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Planche Tuck Negatives',
    category: 'planche_progression',
    difficulty: 'intermediate',
    description: 'Planche tuck negatives descente contrôlée 5-10sec excentrique',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 90,
  },
  {
    name: 'Planche Straddle Negatives',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche straddle negatives descente lente jambes écartées contrôle',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'adducteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Planche Full Negatives',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche full negatives descente contrôlée corps tendu force excentrique max',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Planche Lean Push-ups',
    category: 'planche_progression',
    difficulty: 'beginner',
    description: 'Planche lean push-ups pompes inclinaison avant pieds sol introduction',
    primary_muscles: ['pectoraux', 'deltoïdes', 'triceps'],
    secondary_muscles: ['abdominaux', 'dentelés', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 5,
    reps_max: 10,
    rest_sec: 60,
  },
  {
    name: 'Pseudo Planche Push-ups',
    category: 'planche_progression',
    difficulty: 'intermediate',
    description: 'Pseudo planche push-ups pompes mains reculées simulation planche',
    primary_muscles: ['pectoraux', 'deltoïdes', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 5,
    reps_max: 12,
    rest_sec: 90,
  },
  {
    name: 'Planche Tuck to Straddle Transitions',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche transitions tuck vers straddle changement position dynamique',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'adducteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 120,
  },
  {
    name: 'Planche Straddle to Full Transitions',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche transitions straddle vers full progression dynamique force',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'adducteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Planche Press from Headstand',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche press depuis headstand transition poirier vers planche force',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'trapèzes', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Planche Tuck Swings',
    category: 'planche_progression',
    difficulty: 'intermediate',
    description: 'Planche tuck swings balancement avant arrière position tuck coordination',
    primary_muscles: ['deltoïdes', 'pectoraux', 'abdominaux'],
    secondary_muscles: ['triceps', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 5,
    reps_max: 10,
    rest_sec: 90,
  },
  {
    name: 'Planche Straddle Swings',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche straddle swings balancement jambes écartées contrôle momentum',
    primary_muscles: ['deltoïdes', 'pectoraux', 'abdominaux'],
    secondary_muscles: ['triceps', 'érecteurs', 'adducteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 4,
    reps_max: 8,
    rest_sec: 120,
  },
  {
    name: 'Planche Rings Tuck Hold',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche tuck rings instabilité anneaux force stabilisateurs extrême',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Planche Rings Straddle Hold',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche straddle rings instabilité maximale contrôle stabilité',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'adducteurs'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Planche Rings Full Hold',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche full rings maîtrise complète anneaux niveau élite gymnaste',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: ['gymnastic rings'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Planche Parallettes Tuck Hold',
    category: 'planche_progression',
    difficulty: 'intermediate',
    description: 'Planche tuck parallettes élévation mains facilite position grip neutre',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'Planche Parallettes Straddle Hold',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche straddle parallettes position élevée jambes écartées',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'adducteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Planche Parallettes Full Hold',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche full parallettes corps tendu grip neutre maîtrise complète',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Planche Weighted Tuck Hold',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche tuck lesté gilet poids progression surcharge externe',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Planche Weighted Straddle Hold',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche straddle lesté charge externe force maximale surcharge',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'adducteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Planche to Handstand Press Tuck',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche vers handstand press tuck transition force poussée verticale',
    primary_muscles: ['deltoïdes', 'triceps', 'pectoraux'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Planche to Handstand Press Straddle',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche vers handstand press straddle jambes écartées transition élite',
    primary_muscles: ['deltoïdes', 'triceps', 'pectoraux'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'adducteurs'],
    equipment: [],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 2,
    rest_sec: 180,
  },
  {
    name: 'Planche Maltese Lean Progression',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche maltese lean bras sur côtés progression vers maltese',
    primary_muscles: ['deltoïdes', 'pectoraux', 'dentelés'],
    secondary_muscles: ['triceps', 'abdominaux', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Planche Tuck L-sit Transitions',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche tuck vers L-sit transitions alternance positions coordination',
    primary_muscles: ['deltoïdes', 'abdominaux', 'triceps'],
    secondary_muscles: ['pectoraux', 'fléchisseurs hanches', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 120,
  },
  {
    name: 'Planche Tuck One Arm Support',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche tuck support un bras asymétrique force unilatérale extrême',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Planche Full Hold 360° Rotation',
    category: 'planche_progression',
    difficulty: 'advanced',
    description: 'Planche full rotation 360° position maintenue freestyle coordination',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'dentelés'],
    equipment: [],
    sets_min: 2,
    sets_max: 3,
    reps_min: 1,
    reps_max: 2,
    rest_sec: 180,
  },
];

async function main() {
  console.log('🔥 Seeding Calisthenics Planche Progressions (35 exercises)...\n');

  let success = 0;
  let failed = 0;

  for (const ex of plancheProgressions) {
    try {
      await seedExercise(ex);
      success++;
    } catch (error) {
      console.error(`❌ Failed to seed ${ex.name}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Success: ${success}/${plancheProgressions.length}`);
  console.log(`❌ Failed: ${failed}/${plancheProgressions.length}`);
  console.log('\n🎯 Planche progressions enrichment complete!');
}

main().then(() => process.exit(0));

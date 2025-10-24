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

const backLeverProgressions = [
  {
    name: 'Back Lever Tuck Hold',
    category: 'back_lever_progression',
    difficulty: 'intermediate',
    description: 'Back Lever tuck genoux poitrine position inversée base progression',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Back Lever Advanced Tuck Hold',
    category: 'back_lever_progression',
    difficulty: 'intermediate',
    description: 'Back Lever advanced tuck tibias parallèles progression intermédiaire',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Back Lever One Leg Extended Hold',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever une jambe tendue asymétrique progression vers straddle',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'fessiers'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Back Lever Straddle Hold',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever straddle jambes écartées réduction levier force',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Back Lever Full Hold',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever full corps tendu horizontal complet maîtrise totale',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Back Lever Tuck Raises',
    category: 'back_lever_progression',
    difficulty: 'intermediate',
    description: 'Back Lever tuck raises montée descendue position tuck dynamique',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 120,
  },
  {
    name: 'Back Lever Straddle Raises',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever straddle raises montée descendue jambes écartées',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'Back Lever Full Raises',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever full raises montée descendue corps tendu force maximale',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 4,
    rest_sec: 180,
  },
  {
    name: 'Back Lever Tuck Pull-ups',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever tuck pull-ups traction depuis position tuck inversée',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'pectoraux'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 120,
  },
  {
    name: 'Back Lever Straddle Pull-ups',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever straddle pull-ups traction jambes écartées force extrême',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 4,
    rest_sec: 150,
  },
  {
    name: 'Back Lever Full Pull-ups',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever full pull-ups traction corps tendu complet élite',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'pectoraux'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Back Lever Tuck Negatives',
    category: 'back_lever_progression',
    difficulty: 'intermediate',
    description: 'Back Lever tuck negatives descente contrôlée 5-10sec excentrique',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 90,
  },
  {
    name: 'Back Lever Straddle Negatives',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever straddle negatives descente lente jambes écartées contrôle',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 120,
  },
  {
    name: 'Back Lever Full Negatives',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever full negatives descente contrôlée corps tendu force max',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 150,
  },
  {
    name: 'Back Lever Skin the Cat Progression',
    category: 'back_lever_progression',
    difficulty: 'intermediate',
    description: 'Skin the Cat vers Back Lever transition mobilité rotation complète',
    primary_muscles: ['dorsaux', 'deltoïdes', 'biceps'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 90,
  },
  {
    name: 'Back Lever German Hang Hold',
    category: 'back_lever_progression',
    difficulty: 'intermediate',
    description: 'German Hang maintien position préparation BL mobilité épaules',
    primary_muscles: ['deltoïdes', 'pectoraux', 'biceps'],
    secondary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'Back Lever Rings Tuck Hold',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever tuck rings instabilité anneaux stabilisateurs extrême',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Back Lever Rings Straddle Hold',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever straddle rings instabilité maximale contrôle total',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'adducteurs'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Back Lever Rings Full Hold',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever full rings maîtrise complète anneaux niveau élite',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['gymnastic rings'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Back Lever to Front Lever Tuck',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever vers Front Lever tuck rotation 180° transition',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'pectoraux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 150,
  },
  {
    name: 'Back Lever to Front Lever Straddle',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever vers Front Lever straddle rotation complète jambes écartées',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'pectoraux', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 2,
    rest_sec: 180,
  },
  {
    name: 'Back Lever Tuck Swings',
    category: 'back_lever_progression',
    difficulty: 'intermediate',
    description: 'Back Lever tuck swings balancement contrôlé position tuck coordination',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 5,
    reps_max: 10,
    rest_sec: 90,
  },
  {
    name: 'Back Lever Straddle Swings',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever straddle swings balancement jambes écartées momentum',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 4,
    reps_max: 8,
    rest_sec: 120,
  },
  {
    name: 'Back Lever Weighted Tuck Hold',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever tuck lesté gilet poids surcharge progression force',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Back Lever Weighted Straddle Hold',
    category: 'back_lever_progression',
    difficulty: 'advanced',
    description: 'Back Lever straddle lesté charge externe force maximale',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
];

async function main() {
  console.log('🔄 Seeding Calisthenics Back Lever Progressions (25 exercises)...\n');

  let success = 0;
  let failed = 0;

  for (const ex of backLeverProgressions) {
    try {
      await seedExercise(ex);
      success++;
    } catch (error) {
      console.error(`❌ Failed to seed ${ex.name}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Success: ${success}/${backLeverProgressions.length}`);
  console.log(`❌ Failed: ${failed}/${backLeverProgressions.length}`);
  console.log('\n🎯 Back Lever progressions enrichment complete!');
}

main().then(() => process.exit(0));

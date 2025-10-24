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

const handstandProgressions = [
  {
    name: 'Handstand Wall Hold Belly to Wall',
    category: 'handstand_progression',
    difficulty: 'beginner',
    description: 'Handstand mur ventre face mur introduction équilibre base',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'Handstand Wall Hold Chest to Wall',
    category: 'handstand_progression',
    difficulty: 'intermediate',
    description: 'Handstand mur poitrine face mur ligne droite progression',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'Handstand Freestanding Hold',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand freestanding équilibre libre maintien complet maîtrise',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Handstand Wall Walk-Up',
    category: 'handstand_progression',
    difficulty: 'beginner',
    description: 'Handstand wall walk pieds montent mur mains avancent initiation',
    primary_muscles: ['deltoïdes', 'trapèzes', 'abdominaux'],
    secondary_muscles: ['pectoraux', 'triceps', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 60,
  },
  {
    name: 'Handstand Kick-Up Practice',
    category: 'handstand_progression',
    difficulty: 'intermediate',
    description: 'Handstand kick-up montée élan apprentissage équilibre entrée',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'fléchisseurs hanches'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 5,
    reps_max: 10,
    rest_sec: 60,
  },
  {
    name: 'Handstand Shoulder Taps Wall',
    category: 'handstand_progression',
    difficulty: 'intermediate',
    description: 'Handstand shoulder taps mur toucher épaules unilatéral stabilité',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 6,
    reps_max: 12,
    rest_sec: 90,
  },
  {
    name: 'Handstand Shoulder Taps Freestanding',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand shoulder taps libre équilibre dynamique stabilité extrême',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 4,
    reps_max: 10,
    rest_sec: 120,
  },
  {
    name: 'Handstand Push-up Wall Assisted',
    category: 'handstand_progression',
    difficulty: 'intermediate',
    description: 'Handstand push-up mur assistance pompe verticale force poussée',
    primary_muscles: ['deltoïdes', 'triceps', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 120,
  },
  {
    name: 'Handstand Push-up Strict Freestanding',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand push-up strict freestanding pompe libre amplitude complète',
    primary_muscles: ['deltoïdes', 'triceps', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'Handstand Push-up Deficit Wall',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand push-up deficit mur amplitude augmentée parallettes',
    primary_muscles: ['deltoïdes', 'triceps', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'Handstand Push-up Deficit Freestanding',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand push-up deficit libre amplitude maximale niveau élite',
    primary_muscles: ['deltoïdes', 'triceps', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: [],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 4,
    rest_sec: 180,
  },
  {
    name: 'Handstand Press Tuck to Handstand',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand press tuck montée genoux poitrine force compression',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Handstand Press Straddle to Handstand',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand press straddle jambes écartées montée contrôlée',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'adducteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 4,
    rest_sec: 180,
  },
  {
    name: 'Handstand Press Pike to Handstand',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand press pike jambes tendues compression maximale force',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'ischio-jambiers'],
    equipment: [],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Handstand Walk Forward',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand walk marche avant déplacement équilibre dynamique',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Handstand Walk Backward',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand walk marche arrière coordination avancée contrôle',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Handstand Walk Lateral',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand walk latéral déplacement côté coordination spatiale',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Handstand 90° Turn',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand rotation 90° quart tour position libre coordination',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'obliques'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 120,
  },
  {
    name: 'Handstand 180° Turn',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand rotation 180° demi-tour équilibre rotation complète',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'obliques'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 4,
    rest_sec: 150,
  },
  {
    name: 'Handstand 360° Spin',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand rotation 360° tour complet niveau élite coordination',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'obliques'],
    equipment: [],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 2,
    rest_sec: 180,
  },
  {
    name: 'Handstand Hollow Body Hold',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand hollow body ligne parfaite tension maximale posture',
    primary_muscles: ['deltoïdes', 'abdominaux', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'triceps', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Handstand Arch Body Hold',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand arch body cambré contrôle position alternative',
    primary_muscles: ['deltoïdes', 'érecteurs', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'triceps', 'fessiers'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Handstand Straddle Hold',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand straddle jambes écartées flexibilité mobilité hanches',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['adducteurs', 'abdominaux', 'pectoraux'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Handstand One Leg Hold',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand une jambe levée position asymétrique équilibre avancé',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'fléchisseurs hanches'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Handstand Tuck Hold Freestanding',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand tuck genoux poitrine libre compression force core',
    primary_muscles: ['deltoïdes', 'abdominaux', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'triceps', 'fléchisseurs hanches'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Handstand Rings Hold',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand rings anneaux instabilité extrême stabilisateurs maximaux',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Handstand Rings Push-up',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand rings push-up pompe anneaux instabilité force maximale',
    primary_muscles: ['deltoïdes', 'triceps', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: ['gymnastic rings'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Handstand Parallettes Hold',
    category: 'handstand_progression',
    difficulty: 'intermediate',
    description: 'Handstand parallettes grip neutre position élevée facilité',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'Handstand Parallettes Push-up',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand parallettes push-up pompe grip neutre amplitude',
    primary_muscles: ['deltoïdes', 'triceps', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 120,
  },
  {
    name: 'Handstand One Arm Wall Assisted',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand un bras mur assistance unilatéral progression extrême',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['abdominaux', 'pectoraux', 'obliques'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Handstand Bent Arm Hold',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand bent arm coudes fléchis force isométrique triceps',
    primary_muscles: ['triceps', 'deltoïdes', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Handstand Mexican Hold',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand mexican cambré extrême mobilité épaules dos arche',
    primary_muscles: ['deltoïdes', 'érecteurs', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'triceps', 'fessiers'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Handstand Chest Roll Entry',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand chest roll entrée roulé poitrine technique avancée',
    primary_muscles: ['deltoïdes', 'pectoraux', 'trapèzes'],
    secondary_muscles: ['abdominaux', 'triceps', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 120,
  },
  {
    name: 'Handstand Snap Down Exit',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand snap down sortie contrôlée atterrissage sécurisé',
    primary_muscles: ['deltoïdes', 'abdominaux', 'quadriceps'],
    secondary_muscles: ['trapèzes', 'pectoraux', 'mollets'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 60,
  },
  {
    name: 'Handstand to Bridge Dismount',
    category: 'handstand_progression',
    difficulty: 'advanced',
    description: 'Handstand vers bridge transition pont mobilité complète',
    primary_muscles: ['deltoïdes', 'érecteurs', 'fessiers'],
    secondary_muscles: ['trapèzes', 'ischio-jambiers', 'pectoraux'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 90,
  },
];

async function main() {
  console.log('🤸 Seeding Calisthenics Handstand Progressions (36 exercises)...\n');

  let success = 0;
  let failed = 0;

  for (const ex of handstandProgressions) {
    try {
      await seedExercise(ex);
      success++;
    } catch (error) {
      console.error(`❌ Failed to seed ${ex.name}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Success: ${success}/${handstandProgressions.length}`);
  console.log(`❌ Failed: ${failed}/${handstandProgressions.length}`);
  console.log('\n🎯 Handstand progressions enrichment complete!');
}

main().then(() => process.exit(0));

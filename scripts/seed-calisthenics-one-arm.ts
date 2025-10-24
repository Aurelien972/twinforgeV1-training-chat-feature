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

const oneArmProgressions = [
  {
    name: 'One Arm Pull-up Assisted Band',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm pull-up élastique assistance progression vers unilatéral complet',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'avant-bras'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 180,
  },
  {
    name: 'One Arm Pull-up Assisted Other Hand',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm pull-up assistance autre main poignet progression',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'avant-bras'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 180,
  },
  {
    name: 'One Arm Pull-up Negative',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm pull-up negative descente lente 5-10sec excentrique unilatéral',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'avant-bras'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 180,
  },
  {
    name: 'One Arm Pull-up Full Range',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm pull-up full range amplitude complète niveau élite force max',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'avant-bras'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'One Arm Pull-up Weighted',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm pull-up lesté charge externe surcharge progression extrême',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'avant-bras'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 2,
    rest_sec: 180,
  },
  {
    name: 'One Arm Chin-up Full Range',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm chin-up supination paume face menton biceps maximaux',
    primary_muscles: ['biceps', 'dorsaux'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'One Arm Hanging Hold',
    category: 'one_arm_progression',
    difficulty: 'intermediate',
    description: 'One arm hang maintien suspendu un bras force grip préparation',
    primary_muscles: ['dorsaux', 'avant-bras'],
    secondary_muscles: ['biceps', 'trapèzes', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'One Arm Scapular Pull',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm scapular pull rétraction omoplate unilatérale activation',
    primary_muscles: ['trapèzes', 'dorsaux'],
    secondary_muscles: ['deltoïdes', 'biceps', 'dentelés'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 120,
  },
  {
    name: 'One Arm Typewriter Pull-up',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm typewriter déplacement latéral haut barre unilatéral',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'avant-bras'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'One Arm Archer Pull-up',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm archer traction asymétrique bras tendu préparation OAP',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'avant-bras'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'One Arm Push-up Assisted Elevated',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm push-up mains élevées assistance progression unilatérale',
    primary_muscles: ['pectoraux', 'triceps', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'obliques'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 120,
  },
  {
    name: 'One Arm Push-up Archer Style',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm push-up archer bras tendu sur côté asymétrique progression',
    primary_muscles: ['pectoraux', 'triceps', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'obliques'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'One Arm Push-up Negative',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm push-up negative descente lente contrôlée excentrique',
    primary_muscles: ['pectoraux', 'triceps', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'obliques'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'One Arm Push-up Full Range',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm push-up full range amplitude complète niveau élite poussée',
    primary_muscles: ['pectoraux', 'triceps', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'obliques'],
    equipment: [],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 180,
  },
  {
    name: 'One Arm Push-up Feet Elevated',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm push-up pieds élevés inclinaison augmente difficulté',
    primary_muscles: ['pectoraux', 'deltoïdes', 'triceps'],
    secondary_muscles: ['abdominaux', 'dentelés', 'obliques'],
    equipment: [],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'One Arm Push-up Weighted',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm push-up lesté gilet poids surcharge progression extrême',
    primary_muscles: ['pectoraux', 'triceps', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'obliques'],
    equipment: [],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 2,
    rest_sec: 180,
  },
  {
    name: 'One Arm Diamond Push-up',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm diamond push-up main diamant triceps extrême unilatéral',
    primary_muscles: ['triceps', 'pectoraux', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'obliques'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 4,
    rest_sec: 180,
  },
  {
    name: 'One Arm Plank Hold',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm plank gainage un bras stabilité core anti-rotation',
    primary_muscles: ['abdominaux', 'obliques', 'deltoïdes'],
    secondary_muscles: ['érecteurs', 'dentelés', 'fessiers'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'One Arm Side Plank Hold',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm side plank gainage latéral obliques stabilité latérale',
    primary_muscles: ['obliques', 'abdominaux', 'deltoïdes'],
    secondary_muscles: ['adducteurs', 'abducteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'One Arm Row Inverted',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm row inversé traction horizontale unilatérale rowing',
    primary_muscles: ['dorsaux', 'biceps', 'trapèzes'],
    secondary_muscles: ['abdominaux', 'avant-bras', 'deltoïdes'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 120,
  },
  {
    name: 'One Arm L-sit Hold',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm L-sit maintien jambes tendues un bras force core extrême',
    primary_muscles: ['abdominaux', 'fléchisseurs hanches', 'deltoïdes'],
    secondary_muscles: ['triceps', 'quadriceps', 'avant-bras'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'One Arm Dip Assisted',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm dip assistance élastique progression unilatérale triceps',
    primary_muscles: ['triceps', 'pectoraux', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'trapèzes'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'One Arm Dip Negative',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm dip negative descente contrôlée excentrique unilatéral',
    primary_muscles: ['triceps', 'pectoraux', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'trapèzes'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 180,
  },
  {
    name: 'One Arm Dip Full Range',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm dip full range amplitude complète niveau élite triceps',
    primary_muscles: ['triceps', 'pectoraux', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'trapèzes'],
    equipment: [],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'One Arm Support Hold Parallettes',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm support parallettes maintien un bras stabilité extrême',
    primary_muscles: ['deltoïdes', 'triceps', 'abdominaux'],
    secondary_muscles: ['pectoraux', 'obliques', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'One Arm Muscle-up Assisted',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm muscle-up assistance élastique transition pull vers dip unilatéral',
    primary_muscles: ['dorsaux', 'triceps', 'pectoraux'],
    secondary_muscles: ['biceps', 'deltoïdes', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'One Arm Front Lever Tuck Attempt',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm front lever tuck tentative un bras force maximale élite',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['avant-bras', 'érecteurs', 'obliques'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'One Arm Back Lever Tuck Attempt',
    category: 'one_arm_progression',
    difficulty: 'advanced',
    description: 'One arm back lever tuck tentative position inversée unilatérale',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'avant-bras'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
];

async function main() {
  console.log('💪 Seeding Calisthenics One-Arm Progressions (28 exercises)...\n');

  let success = 0;
  let failed = 0;

  for (const ex of oneArmProgressions) {
    try {
      await seedExercise(ex);
      success++;
    } catch (error) {
      console.error(`❌ Failed to seed ${ex.name}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Success: ${success}/${oneArmProgressions.length}`);
  console.log(`❌ Failed: ${failed}/${oneArmProgressions.length}`);
  console.log('\n🎯 One-Arm progressions enrichment complete!');
}

main().then(() => process.exit(0));

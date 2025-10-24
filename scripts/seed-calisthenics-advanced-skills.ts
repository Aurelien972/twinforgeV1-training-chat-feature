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

const advancedSkills = [
  {
    name: 'Human Flag Hold Bottom Arm Bent',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Human Flag bras bas fléchi progression drapeau humain latéral vertical',
    primary_muscles: ['obliques', 'dorsaux', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'trapèzes'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Human Flag Hold Full Extension',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Human Flag full extension bras tendus corps horizontal drapeau complet',
    primary_muscles: ['obliques', 'dorsaux', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'trapèzes'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Human Flag Raises',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Human Flag raises montée descendue dynamique force obliques',
    primary_muscles: ['obliques', 'dorsaux', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'adducteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 180,
  },
  {
    name: 'Human Flag Straddle Hold',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Human Flag straddle jambes écartées réduction levier facilite',
    primary_muscles: ['obliques', 'dorsaux', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'adducteurs', 'dentelés'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Human Flag Tuck Hold',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Human Flag tuck genoux pliés progression vers extension complète',
    primary_muscles: ['obliques', 'dorsaux', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'trapèzes'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Victorian Hold Rings Tuck',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Victorian tuck rings genoux pliés bras arrière position gymnastes',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['dorsaux', 'abdominaux', 'dentelés'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Victorian Hold Rings Straddle',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Victorian straddle rings jambes écartées position intermédiaire',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['dorsaux', 'abdominaux', 'adducteurs'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Victorian Hold Rings Full',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Victorian full rings corps tendu bras arrière niveau élite gymnastique',
    primary_muscles: ['deltoïdes', 'pectoraux', 'triceps'],
    secondary_muscles: ['dorsaux', 'abdominaux', 'dentelés'],
    equipment: ['gymnastic rings'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Maltese Hold Rings Tuck',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Maltese tuck rings genoux pliés bras côtés position croix élargie',
    primary_muscles: ['deltoïdes', 'pectoraux', 'dentelés'],
    secondary_muscles: ['triceps', 'abdominaux', 'trapèzes'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Maltese Hold Rings Straddle',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Maltese straddle rings jambes écartées progression vers full',
    primary_muscles: ['deltoïdes', 'pectoraux', 'dentelés'],
    secondary_muscles: ['triceps', 'abdominaux', 'adducteurs'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Maltese Hold Rings Full',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Maltese full rings corps tendu bras côtés niveau élite force',
    primary_muscles: ['deltoïdes', 'pectoraux', 'dentelés'],
    secondary_muscles: ['triceps', 'abdominaux', 'trapèzes'],
    equipment: ['gymnastic rings'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Iron Cross Hold Rings',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Iron Cross rings croix fer bras tendus côtés niveau olympique',
    primary_muscles: ['pectoraux', 'deltoïdes', 'biceps'],
    secondary_muscles: ['dorsaux', 'dentelés', 'triceps'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Iron Cross Pull to Inverted',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Iron Cross pull vers inversé traction depuis croix transition dynamique',
    primary_muscles: ['pectoraux', 'dorsaux', 'biceps'],
    secondary_muscles: ['deltoïdes', 'abdominaux', 'dentelés'],
    equipment: ['gymnastic rings'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Iron Cross Rings Negative',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Iron Cross negative descente lente contrôlée excentrique croix',
    primary_muscles: ['pectoraux', 'deltoïdes', 'biceps'],
    secondary_muscles: ['dorsaux', 'dentelés', 'triceps'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Azarian Cross Rings',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Azarian Cross rings croix azarian bras inclinés avant variation élite',
    primary_muscles: ['pectoraux', 'deltoïdes', 'biceps'],
    secondary_muscles: ['dorsaux', 'dentelés', 'abdominaux'],
    equipment: ['gymnastic rings'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Inverted Cross Rings',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Inverted Cross rings croix inversée tête bas bras côtés force',
    primary_muscles: ['dorsaux', 'biceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'trapèzes'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Butterfly Mount Rings',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Butterfly mount rings montée papillon transition élégante gymnastes',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'pectoraux', 'fléchisseurs hanches'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 120,
  },
  {
    name: 'Hefesto Pull Rings',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Hefesto rings traction explosive transition vers support street workout',
    primary_muscles: ['dorsaux', 'biceps', 'pectoraux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'abdominaux'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 150,
  },
  {
    name: 'Impossible Dip Rings',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Impossible dip rings dips position impossible bras inversés force',
    primary_muscles: ['triceps', 'deltoïdes', 'pectoraux'],
    secondary_muscles: ['dorsaux', 'abdominaux', 'dentelés'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Back Lever to Victorian Transition',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Back Lever vers Victorian transition anneaux changement position extrême',
    primary_muscles: ['dorsaux', 'deltoïdes', 'pectoraux'],
    secondary_muscles: ['biceps', 'triceps', 'abdominaux'],
    equipment: ['gymnastic rings'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 2,
    rest_sec: 180,
  },
  {
    name: 'Weighted Pull-ups Heavy 50kg',
    category: 'streetlifting_weighted',
    difficulty: 'advanced',
    description: 'Weighted pull-ups 50kg+ lestage lourd streetlifting force maximale',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 180,
  },
  {
    name: 'Weighted Dips Heavy 50kg',
    category: 'streetlifting_weighted',
    difficulty: 'advanced',
    description: 'Weighted dips 50kg+ lestage lourd streetlifting triceps force max',
    primary_muscles: ['triceps', 'pectoraux', 'deltoïdes'],
    secondary_muscles: ['dentelés', 'abdominaux', 'trapèzes'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 180,
  },
  {
    name: 'Weighted Muscle-ups Heavy 30kg',
    category: 'streetlifting_weighted',
    difficulty: 'advanced',
    description: 'Weighted muscle-ups 30kg+ lestage lourd transition explosive force',
    primary_muscles: ['dorsaux', 'triceps', 'pectoraux'],
    secondary_muscles: ['biceps', 'deltoïdes', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Weighted Chin-ups Heavy 50kg',
    category: 'streetlifting_weighted',
    difficulty: 'advanced',
    description: 'Weighted chin-ups 50kg+ supination lestage lourd biceps force',
    primary_muscles: ['biceps', 'dorsaux'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 5,
    rest_sec: 180,
  },
  {
    name: 'Weighted L-sit Pull-ups 30kg',
    category: 'streetlifting_weighted',
    difficulty: 'advanced',
    description: 'Weighted L-sit pull-ups 30kg+ jambes tendues lestage combinaison',
    primary_muscles: ['dorsaux', 'abdominaux', 'biceps'],
    secondary_muscles: ['fléchisseurs hanches', 'trapèzes', 'avant-bras'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Explosive Clapping Pull-up',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Clapping pull-up explosion relâche barre clap puissance plyométrique',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Explosive Clapping Push-up',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Clapping push-up pompe explosive clap puissance plyométrique pectoraux',
    primary_muscles: ['pectoraux', 'triceps', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 5,
    reps_max: 10,
    rest_sec: 120,
  },
  {
    name: 'Superman Push-up',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Superman push-up pompe envol mains pieds sol puissance explosive',
    primary_muscles: ['pectoraux', 'deltoïdes', 'triceps'],
    secondary_muscles: ['abdominaux', 'érecteurs', 'fessiers'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: '360° Pull-up Bar Spin',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: '360° pull-up rotation complète barre freestyle coordination spatiale',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'obliques'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 150,
  },
  {
    name: 'Bar Hop Switch Grip',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Bar hop changement grip suspension saut main main coordination',
    primary_muscles: ['avant-bras', 'dorsaux', 'deltoïdes'],
    secondary_muscles: ['biceps', 'trapèzes', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 5,
    reps_max: 10,
    rest_sec: 90,
  },
  {
    name: 'Dragon Walk Horizontal Ladder',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Dragon walk échelle horizontale déplacement main main coordination',
    primary_muscles: ['dorsaux', 'biceps', 'avant-bras'],
    secondary_muscles: ['trapèzes', 'deltoïdes', 'abdominaux'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Typewriter Muscle-up',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Typewriter muscle-up déplacement latéral montée transition coordination',
    primary_muscles: ['dorsaux', 'triceps', 'pectoraux'],
    secondary_muscles: ['biceps', 'deltoïdes', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 150,
  },
  {
    name: 'Bar Kip Swing',
    category: 'advanced_skill',
    difficulty: 'intermediate',
    description: 'Kip swing balancement barre momentum gymnastique préparation skills',
    primary_muscles: ['abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['dorsaux', 'deltoïdes', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 5,
    reps_max: 10,
    rest_sec: 60,
  },
  {
    name: 'Glide Kip Muscle-up',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Glide kip muscle-up élan glissé momentum transition gymnastique',
    primary_muscles: ['dorsaux', 'triceps', 'abdominaux'],
    secondary_muscles: ['pectoraux', 'fléchisseurs hanches', 'deltoïdes'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 120,
  },
  {
    name: 'Korean Dip Rings',
    category: 'advanced_skill',
    difficulty: 'advanced',
    description: 'Korean dip rings bras arrière derrière dos force triceps extrême',
    primary_muscles: ['triceps', 'deltoïdes', 'pectoraux'],
    secondary_muscles: ['dorsaux', 'abdominaux', 'dentelés'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 120,
  },
];

async function main() {
  console.log('🌟 Seeding Calisthenics Advanced Skills (35 exercises)...\n');

  let success = 0;
  let failed = 0;

  for (const ex of advancedSkills) {
    try {
      await seedExercise(ex);
      success++;
    } catch (error) {
      console.error(`❌ Failed to seed ${ex.name}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Success: ${success}/${advancedSkills.length}`);
  console.log(`❌ Failed: ${failed}/${advancedSkills.length}`);
  console.log('\n🎯 Advanced Skills enrichment complete!');
}

main().then(() => process.exit(0));

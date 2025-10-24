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

const conditioningExercises = [
  {
    name: 'EMOM 10min Pull-ups + Push-ups',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: 'EMOM 10min 5 Pull-ups 10 Push-ups every minute conditioning basique',
    primary_muscles: ['dorsaux', 'pectoraux', 'biceps'],
    secondary_muscles: ['triceps', 'trapèzes', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'EMOM 12min Muscle-ups',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'EMOM 12min 3-5 Muscle-ups every minute conditioning avancé force',
    primary_muscles: ['dorsaux', 'triceps', 'pectoraux'],
    secondary_muscles: ['biceps', 'deltoïdes', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'EMOM 15min Dips + Squats',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: 'EMOM 15min 10 Dips 15 Squats alternance haut bas corps',
    primary_muscles: ['triceps', 'quadriceps', 'pectoraux'],
    secondary_muscles: ['deltoïdes', 'fessiers', 'mollets'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'EMOM 8min Handstand Push-ups',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'EMOM 8min 3-5 HSPU every minute conditioning vertical poussée',
    primary_muscles: ['deltoïdes', 'triceps', 'trapèzes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'EMOM 20min Mixed Skills',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'EMOM 20min rotation Pull Dips L-sit HSPU skills variés conditioning',
    primary_muscles: ['dorsaux', 'triceps', 'deltoïdes', 'abdominaux'],
    secondary_muscles: ['pectoraux', 'biceps', 'trapèzes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'AMRAP 10min Pull-ups + Dips',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: 'AMRAP 10min 5 Pull-ups 10 Dips maximum rounds endurance',
    primary_muscles: ['dorsaux', 'triceps', 'pectoraux'],
    secondary_muscles: ['biceps', 'deltoïdes', 'trapèzes'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'AMRAP 15min Bodyweight Trio',
    category: 'conditioning_format',
    difficulty: 'beginner',
    description: 'AMRAP 15min 10 Push-ups 15 Squats 20 Sit-ups maximum rounds',
    primary_muscles: ['pectoraux', 'quadriceps', 'abdominaux'],
    secondary_muscles: ['triceps', 'fessiers', 'fléchisseurs hanches'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'AMRAP 20min Calisthenics Complex',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'AMRAP 20min Muscle-up 10 HSPU 15 Pistols complex avancé endurance',
    primary_muscles: ['dorsaux', 'deltoïdes', 'quadriceps', 'triceps'],
    secondary_muscles: ['pectoraux', 'biceps', 'fessiers', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'AMRAP 12min Skills Endurance',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'AMRAP 12min L-sit 20sec 5 Toes-to-Bar 10 Diamond Push-ups skills',
    primary_muscles: ['abdominaux', 'dorsaux', 'triceps'],
    secondary_muscles: ['fléchisseurs hanches', 'pectoraux', 'biceps'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'AMRAP 25min Long Endurance WOD',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'AMRAP 25min 20 Pull-ups 30 Push-ups 40 Squats stamina test',
    primary_muscles: ['dorsaux', 'pectoraux', 'quadriceps'],
    secondary_muscles: ['biceps', 'triceps', 'fessiers'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Tabata 8 Rounds Pull-ups',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Tabata 8 Rounds 20sec Pull-ups 10sec rest high intensity traction',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 8,
    sets_max: 8,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 10,
  },
  {
    name: 'Tabata 8 Rounds Dips',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: 'Tabata 8 Rounds 20sec Dips 10sec rest high intensity poussée',
    primary_muscles: ['triceps', 'pectoraux', 'deltoïdes'],
    secondary_muscles: ['dentelés', 'abdominaux', 'trapèzes'],
    equipment: [],
    sets_min: 8,
    sets_max: 8,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 10,
  },
  {
    name: 'Tabata 8 Rounds Pistol Squats',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Tabata 8 Rounds 20sec Pistols 10sec rest jambes unilatéral intensity',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: [],
    sets_min: 8,
    sets_max: 8,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 10,
  },
  {
    name: 'Tabata 8 Rounds L-sit Hold',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Tabata 8 Rounds 20sec L-sit 10sec rest core endurance isométrique',
    primary_muscles: ['abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['quadriceps', 'triceps', 'deltoïdes'],
    equipment: [],
    sets_min: 8,
    sets_max: 8,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 10,
  },
  {
    name: 'Endurance Hold Plank 5min',
    category: 'endurance_hold',
    difficulty: 'intermediate',
    description: 'Plank hold 5 minutes gainage endurance core stabilité longue durée',
    primary_muscles: ['abdominaux', 'érecteurs'],
    secondary_muscles: ['deltoïdes', 'fessiers', 'quadriceps'],
    equipment: [],
    sets_min: 1,
    sets_max: 3,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Endurance Hold Hollow Body 3min',
    category: 'endurance_hold',
    difficulty: 'advanced',
    description: 'Hollow body hold 3 minutes tension core endurance isométrique avancé',
    primary_muscles: ['abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['quadriceps', 'érecteurs'],
    equipment: [],
    sets_min: 1,
    sets_max: 3,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Endurance Hold L-sit 2min Accumulated',
    category: 'endurance_hold',
    difficulty: 'advanced',
    description: 'L-sit 2 minutes accumulées plusieurs sets endurance core compression',
    primary_muscles: ['abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['quadriceps', 'triceps', 'deltoïdes'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 60,
  },
  {
    name: 'Endurance Hold Handstand 5min Accumulated',
    category: 'endurance_hold',
    difficulty: 'advanced',
    description: 'Handstand 5 minutes accumulées endurance verticale équilibre stamina',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: [],
    sets_min: 5,
    sets_max: 10,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 60,
  },
  {
    name: 'Endurance Hold Dead Hang 3min',
    category: 'endurance_hold',
    difficulty: 'intermediate',
    description: 'Dead hang 3 minutes suspension passive grip endurance avant-bras',
    primary_muscles: ['avant-bras', 'dorsaux'],
    secondary_muscles: ['biceps', 'trapèzes', 'deltoïdes'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 3,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Endurance Hold Support Hold 3min',
    category: 'endurance_hold',
    difficulty: 'intermediate',
    description: 'Support hold 3 minutes bras tendus parallettes endurance triceps',
    primary_muscles: ['triceps', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'dentelés'],
    equipment: [],
    sets_min: 1,
    sets_max: 3,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Max Rep Pull-ups Death Set',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Max rep pull-ups death set maximum répétitions sans pause épuisement',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 100,
    rest_sec: 0,
  },
  {
    name: 'Max Rep Push-ups Death Set',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: 'Max rep push-ups death set maximum répétitions sans pause test endurance',
    primary_muscles: ['pectoraux', 'triceps', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'érecteurs'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 200,
    rest_sec: 0,
  },
  {
    name: 'Max Rep Dips Death Set',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: 'Max rep dips death set maximum répétitions triceps endurance test',
    primary_muscles: ['triceps', 'pectoraux', 'deltoïdes'],
    secondary_muscles: ['dentelés', 'abdominaux', 'trapèzes'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 100,
    rest_sec: 0,
  },
  {
    name: 'Max Rep Muscle-ups For Time',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Max rep muscle-ups for time 50 reps fastest time test force endurance',
    primary_muscles: ['dorsaux', 'triceps', 'pectoraux'],
    secondary_muscles: ['biceps', 'deltoïdes', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 50,
    reps_max: 50,
    rest_sec: 0,
  },
  {
    name: '100 Pull-ups For Time',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: '100 Pull-ups for time fastest completion endurance traction benchmark',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 100,
    reps_max: 100,
    rest_sec: 0,
  },
  {
    name: '200 Push-ups For Time',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: '200 Push-ups for time fastest completion endurance poussée benchmark',
    primary_muscles: ['pectoraux', 'triceps', 'deltoïdes'],
    secondary_muscles: ['abdominaux', 'dentelés', 'érecteurs'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 200,
    reps_max: 200,
    rest_sec: 0,
  },
  {
    name: '300 Squats For Time',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: '300 Squats for time fastest completion endurance jambes volume test',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'érecteurs'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 300,
    reps_max: 300,
    rest_sec: 0,
  },
  {
    name: 'Ladder 1-10 Pull-ups + Push-ups',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: 'Ladder 1-10 Pull-ups Push-ups ascending reps volume accumulation',
    primary_muscles: ['dorsaux', 'pectoraux', 'biceps'],
    secondary_muscles: ['triceps', 'trapèzes', 'deltoïdes'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Pyramid 1-5-1 Muscle-ups',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Pyramid 1-5-1 Muscle-ups montée descente volume test endurance',
    primary_muscles: ['dorsaux', 'triceps', 'pectoraux'],
    secondary_muscles: ['biceps', 'deltoïdes', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Descending Ladder 10-1 Dips + Squats',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: 'Descending ladder 10-1 Dips Squats decreasing reps haut bas alternance',
    primary_muscles: ['triceps', 'quadriceps', 'pectoraux'],
    secondary_muscles: ['deltoïdes', 'fessiers', 'mollets'],
    equipment: [],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Chipper 10 Exercises Bodyweight',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Chipper 10 exercises bodyweight 100 reps each straight through endurance',
    primary_muscles: ['dorsaux', 'pectoraux', 'quadriceps', 'abdominaux'],
    secondary_muscles: ['biceps', 'triceps', 'fessiers', 'mollets'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Every Minute Add 1 Rep Death By',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Death by exercise min1=1 rep min2=2 reps jusqu\'à échec test mental',
    primary_muscles: ['dorsaux', 'pectoraux'],
    secondary_muscles: ['biceps', 'triceps', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Partner WOD Alternating Skills',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: 'Partner WOD alternating skills one works one rests team motivation',
    primary_muscles: ['dorsaux', 'pectoraux', 'quadriceps'],
    secondary_muscles: ['biceps', 'triceps', 'fessiers'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Isometric Hold Circuit 5 Exercises',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Isometric circuit 5 exercises 30sec each Plank L-sit Hollow Wall-sit Support',
    primary_muscles: ['abdominaux', 'quadriceps', 'deltoïdes'],
    secondary_muscles: ['fléchisseurs hanches', 'triceps', 'érecteurs'],
    equipment: [],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 60,
  },
  {
    name: 'Skills Practice EMOM 30min',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Skills practice EMOM 30min rotation levers planche handstand technique endurance',
    primary_muscles: ['dorsaux', 'deltoïdes', 'pectoraux', 'abdominaux'],
    secondary_muscles: ['biceps', 'triceps', 'trapèzes', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 1,
    sets_max: 1,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 0,
  },
  {
    name: 'Grease the Groove Pull-ups Daily',
    category: 'conditioning_format',
    difficulty: 'intermediate',
    description: 'Grease groove pull-ups 10 sets submaximal distributed jour fréquence',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'abdominaux'],
    equipment: ['pull-up bar'],
    sets_min: 10,
    sets_max: 10,
    reps_min: 3,
    reps_max: 5,
    rest_sec: 180,
  },
  {
    name: 'Grease the Groove Handstand Daily',
    category: 'conditioning_format',
    difficulty: 'advanced',
    description: 'Grease groove handstand 10 holds submaximal distributed jour practice',
    primary_muscles: ['deltoïdes', 'trapèzes', 'triceps'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'érecteurs'],
    equipment: [],
    sets_min: 10,
    sets_max: 10,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
];

async function main() {
  console.log('🔥 Seeding Calisthenics Conditioning Formats (38 exercises)...\n');

  let success = 0;
  let failed = 0;

  for (const ex of conditioningExercises) {
    try {
      await seedExercise(ex);
      success++;
    } catch (error) {
      console.error(`❌ Failed to seed ${ex.name}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Success: ${success}/${conditioningExercises.length}`);
  console.log(`❌ Failed: ${failed}/${conditioningExercises.length}`);
  console.log('\n🎯 Conditioning formats enrichment complete!');
}

main().then(() => process.exit(0));

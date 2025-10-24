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

const frontLeverProgressions = [
  {
    name: 'Front Lever Tuck Hold',
    category: 'front_lever_progression',
    difficulty: 'intermediate',
    description: 'Front Lever position tuck genoux poitrine maintien isométrique base progression',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Front Lever Advanced Tuck Hold',
    category: 'front_lever_progression',
    difficulty: 'intermediate',
    description: 'Front Lever advanced tuck tibias parallèles sol progression intermédiaire',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Front Lever One Leg Extended Hold',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever une jambe tendue autre tuck progression asymétrique',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Front Lever Straddle Hold',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever jambes écartées straddle position intermédiaire full lever',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Full Hold',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever full corps tendu horizontal maintien complet maîtrise totale',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Tuck Raises',
    category: 'front_lever_progression',
    difficulty: 'intermediate',
    description: 'Front Lever tuck raises montée descendue contrôlée position tuck dynamique',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 120,
  },
  {
    name: 'Front Lever Advanced Tuck Raises',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever advanced tuck raises montée descendue position avancée',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'Front Lever Straddle Raises',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever straddle raises montée descendue jambes écartées force maximale',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Full Raises',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever full raises montée descendue corps tendu élite calisthenics',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Tuck Pull-ups',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever tuck pull-ups traction depuis position tuck force concentrique',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['érecteurs', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'Front Lever Straddle Pull-ups',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever straddle pull-ups traction jambes écartées force extrême',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['érecteurs', 'deltoïdes', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 4,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Full Pull-ups',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever full pull-ups traction corps tendu horizontal niveau élite',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['érecteurs', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Tuck Negatives',
    category: 'front_lever_progression',
    difficulty: 'intermediate',
    description: 'Front Lever tuck negatives descente contrôlée 5-10sec position tuck',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 120,
  },
  {
    name: 'Front Lever Straddle Negatives',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever straddle negatives descente 5-10sec jambes écartées excentrique',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Front Lever Full Negatives',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever full negatives descente lente corps tendu force excentrique max',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Tuck Rows',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever tuck rows rowing horizontal position tuck force dorsaux',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['trapèzes', 'érecteurs', 'deltoïdes'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 120,
  },
  {
    name: 'Front Lever Straddle Rows',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever straddle rows rowing jambes écartées amplitude contrôlée',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['trapèzes', 'érecteurs', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'Front Lever Full Rows',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever full rows rowing corps tendu complet force maximale',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['trapèzes', 'érecteurs', 'deltoïdes'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 4,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Ice Cream Maker Tuck',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever ice cream maker tuck rotation 360° position tuck technique avancée',
    primary_muscles: ['dorsaux', 'abdominaux', 'biceps'],
    secondary_muscles: ['érecteurs', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Touch Tuck',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever touch tuck toucher barre pieds depuis tuck coordination',
    primary_muscles: ['dorsaux', 'abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['biceps', 'érecteurs', 'deltoïdes'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 120,
  },
  {
    name: 'Front Lever Touch Straddle',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever touch straddle toucher barre pieds jambes écartées mobilité',
    primary_muscles: ['dorsaux', 'abdominaux', 'adducteurs'],
    secondary_muscles: ['biceps', 'érecteurs', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Front Lever Touch Full',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever touch full toucher barre pieds corps tendu compression maximale',
    primary_muscles: ['dorsaux', 'abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['biceps', 'érecteurs', 'ischio-jambiers'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Tuck Press to Handstand',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever tuck press handstand transition FL vers HS force poussée',
    primary_muscles: ['deltoïdes', 'dorsaux', 'abdominaux'],
    secondary_muscles: ['triceps', 'érecteurs', 'trapèzes'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 3,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Skin the Cat',
    category: 'front_lever_progression',
    difficulty: 'intermediate',
    description: 'Front Lever skin the cat rotation complète arrière FL mobilité épaules',
    primary_muscles: ['dorsaux', 'deltoïdes', 'abdominaux'],
    secondary_muscles: ['biceps', 'pectoraux', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 6,
    rest_sec: 90,
  },
  {
    name: 'Front Lever German Hang Tuck',
    category: 'front_lever_progression',
    difficulty: 'intermediate',
    description: 'German Hang tuck position préparation FL mobilité épaules rotation interne',
    primary_muscles: ['deltoïdes', 'pectoraux', 'dorsaux'],
    secondary_muscles: ['biceps', 'abdominaux', 'érecteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 90,
  },
  {
    name: 'Front Lever Dragon Flag Progression',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Dragon Flag progression vers FL renforcement abdominaux érecteurs',
    primary_muscles: ['abdominaux', 'érecteurs', 'fléchisseurs hanches'],
    secondary_muscles: ['dorsaux', 'deltoïdes', 'quadriceps'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 3,
    reps_max: 8,
    rest_sec: 120,
  },
  {
    name: 'Front Lever Rings Tuck Hold',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever tuck rings instabilité anneaux force stabilisateurs',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'pectoraux'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 120,
  },
  {
    name: 'Front Lever Rings Straddle Hold',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever straddle rings instabilité extrême contrôle stabilité',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'pectoraux'],
    equipment: ['gymnastic rings'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Front Lever Rings Full Hold',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever full rings maîtrise complète anneaux niveau élite',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'pectoraux'],
    equipment: ['gymnastic rings'],
    sets_min: 2,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Weighted Tuck Hold',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever tuck lesté gilet poids progression force charge externe',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 150,
  },
  {
    name: 'Front Lever Weighted Straddle Hold',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever straddle lesté charge externe force maximale surcharge',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 1,
    reps_max: 1,
    rest_sec: 180,
  },
  {
    name: 'Front Lever Archer Pull-ups',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever archer pulls traction asymétrique position FL unilatéral',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['érecteurs', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 5,
    rest_sec: 150,
  },
  {
    name: 'Front Lever Typewriter Rows',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever typewriter rows déplacement latéral position FL contrôle',
    primary_muscles: ['dorsaux', 'biceps', 'abdominaux'],
    secondary_muscles: ['trapèzes', 'érecteurs', 'deltoïdes'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 4,
    reps_min: 2,
    reps_max: 6,
    rest_sec: 150,
  },
  {
    name: 'Front Lever Straddle Swings',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever straddle swings balancement contrôlé jambes écartées momentum',
    primary_muscles: ['dorsaux', 'abdominaux', 'deltoïdes'],
    secondary_muscles: ['biceps', 'érecteurs', 'adducteurs'],
    equipment: ['pull-up bar'],
    sets_min: 3,
    sets_max: 5,
    reps_min: 5,
    reps_max: 10,
    rest_sec: 120,
  },
  {
    name: 'Front Lever Full Hold 360° Rotation',
    category: 'front_lever_progression',
    difficulty: 'advanced',
    description: 'Front Lever full rotation 360° position maintenue rotation complète',
    primary_muscles: ['dorsaux', 'abdominaux', 'érecteurs'],
    secondary_muscles: ['biceps', 'deltoïdes', 'fléchisseurs hanches'],
    equipment: ['pull-up bar'],
    sets_min: 2,
    sets_max: 3,
    reps_min: 1,
    reps_max: 2,
    rest_sec: 180,
  },
];

async function main() {
  console.log('🦾 Seeding Calisthenics Front Lever Progressions (35 exercises)...\n');

  let success = 0;
  let failed = 0;

  for (const ex of frontLeverProgressions) {
    try {
      await seedExercise(ex);
      success++;
    } catch (error) {
      console.error(`❌ Failed to seed ${ex.name}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Success: ${success}/${frontLeverProgressions.length}`);
  console.log(`❌ Failed: ${failed}/${frontLeverProgressions.length}`);
  console.log('\n🎯 Front Lever progressions enrichment complete!');
}

main().then(() => process.exit(0));

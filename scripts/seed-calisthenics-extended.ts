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
    discipline: ex.discipline,
    category: ex.category,
    difficulty: ex.difficulty,
    description_short: ex.description,
    movement_pattern: ex.movement_pattern,
    is_validated: true,
    typical_sets_min: ex.sets_min || 3,
    typical_sets_max: ex.sets_max || 5,
    typical_reps_min: ex.reps_min || 6,
    typical_reps_max: ex.reps_max || 12,
    typical_rest_sec: ex.rest_sec || 90,
  }).select().single();

  if (error || !exercise) return;

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
}

const extendedCalisthenicsExercises = [
  // PULL PROGRESSIONS - 25 exercices
  { name: 'Horizontal Row', discipline: 'calisthenics', category: 'pull', difficulty: 'beginner', description: 'Low bar row', primary_muscles: ['dorsaux'], equipment: ['barbell'], sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 15 },
  { name: 'Archer Row', discipline: 'calisthenics', category: 'pull', difficulty: 'advanced', description: 'Single-arm row progression', primary_muscles: ['dorsaux'], equipment: ['barbell'] },
  { name: 'Commando Pull-up', discipline: 'calisthenics', category: 'pull', difficulty: 'advanced', description: 'Parallel grip pull-up', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'] },
  { name: 'L-Pull-up', discipline: 'calisthenics', category: 'pull', difficulty: 'advanced', description: 'Pull-up with L-sit', primary_muscles: ['dorsaux', 'abdominaux'], equipment: ['pull-up-bar'] },
  { name: 'Around the World Pull-up', discipline: 'calisthenics', category: 'pull', difficulty: 'elite', description: 'Circular pull-up', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'] },
  { name: 'Clapping Pull-up', discipline: 'calisthenics', category: 'pull', difficulty: 'elite', description: 'Explosive clap at top', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'] },
  { name: 'Towel Pull-up', discipline: 'calisthenics', category: 'pull', difficulty: 'advanced', description: 'Grip strength pull-up', primary_muscles: ['dorsaux', 'avant-bras'], equipment: ['pull-up-bar'] },
  { name: 'Mixed Grip Pull-up', discipline: 'calisthenics', category: 'pull', difficulty: 'intermediate', description: 'Alternating grip', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'] },
  { name: 'Close Grip Pull-up', discipline: 'calisthenics', category: 'pull', difficulty: 'intermediate', description: 'Narrow grip pull', primary_muscles: ['dorsaux', 'biceps'], equipment: ['pull-up-bar'] },
  { name: 'Neutral Grip Pull-up', discipline: 'calisthenics', category: 'pull', difficulty: 'intermediate', description: 'Parallel bars pull', primary_muscles: ['dorsaux'], equipment: ['parallel-bars'] },
  { name: 'Front Lever Raise', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Lever to pull-up', primary_muscles: ['dorsaux', 'abdominaux'], equipment: ['pull-up-bar'] },
  { name: 'Advanced Tuck Front Lever', discipline: 'calisthenics', category: 'skill', difficulty: 'advanced', description: 'One leg extended', primary_muscles: ['dorsaux', 'abdominaux'], equipment: ['pull-up-bar'] },
  { name: 'Straddle Front Lever', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Legs split lever', primary_muscles: ['dorsaux', 'abdominaux'], equipment: ['pull-up-bar'] },
  { name: 'Half Lay Front Lever', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'One leg straight', primary_muscles: ['dorsaux', 'abdominaux'], equipment: ['pull-up-bar'] },
  { name: 'Ice Cream Maker', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Lever to inverted', primary_muscles: ['dorsaux', 'abdominaux'], equipment: ['pull-up-bar'] },

  // PUSH PROGRESSIONS - 25 exercices
  { name: 'Hindu Push-up', discipline: 'calisthenics', category: 'push', difficulty: 'intermediate', description: 'Diving push-up', primary_muscles: ['pectoraux', 'deltoides'], equipment: ['floor'] },
  { name: 'Spiderman Push-up', discipline: 'calisthenics', category: 'push', difficulty: 'intermediate', description: 'Knee to elbow push', primary_muscles: ['pectoraux', 'obliques'], equipment: ['floor'] },
  { name: 'Typewriter Push-up', discipline: 'calisthenics', category: 'push', difficulty: 'advanced', description: 'Side to side push', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Explosive Push-up', discipline: 'calisthenics', category: 'push', difficulty: 'advanced', description: 'Jump push-up', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Superman Push-up', discipline: 'calisthenics', category: 'push', difficulty: 'elite', description: 'Airborne push-up', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Clapping Push-up', discipline: 'calisthenics', category: 'push', difficulty: 'advanced', description: 'Explosive clap', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Behind Back Clap', discipline: 'calisthenics', category: 'push', difficulty: 'elite', description: 'Clap behind back', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Aztec Push-up', discipline: 'calisthenics', category: 'push', difficulty: 'elite', description: 'Touch toes mid-air', primary_muscles: ['pectoraux', 'abdominaux'], equipment: ['floor'] },
  { name: 'Ring Push-up', discipline: 'calisthenics', category: 'push', difficulty: 'intermediate', description: 'Unstable push-up', primary_muscles: ['pectoraux'], equipment: ['gymnastic-rings'] },
  { name: 'Ring Dip', discipline: 'calisthenics', category: 'push', difficulty: 'advanced', description: 'Ring dips', primary_muscles: ['pectoraux', 'triceps'], equipment: ['gymnastic-rings'] },
  { name: 'Bulgarian Dip', discipline: 'calisthenics', category: 'push', difficulty: 'advanced', description: 'Deep ring dip', primary_muscles: ['pectoraux'], equipment: ['gymnastic-rings'] },
  { name: 'Korean Dip', discipline: 'calisthenics', category: 'push', difficulty: 'elite', description: 'Impossible dip', primary_muscles: ['pectoraux', 'deltoides'], equipment: ['parallel-bars'] },
  { name: 'Elevated Pike Push-up', discipline: 'calisthenics', category: 'push', difficulty: 'advanced', description: 'Feet elevated pike', primary_muscles: ['deltoides'], equipment: ['box', 'floor'] },
  { name: 'Wall Walk', discipline: 'calisthenics', category: 'push', difficulty: 'advanced', description: 'Walk up to handstand', primary_muscles: ['deltoides', 'abdominaux'], equipment: ['wall'] },
  { name: 'Freestanding Handstand', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'No wall balance', primary_muscles: ['deltoides'], equipment: ['floor'] },
  { name: 'Handstand Walking', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Walking on hands', primary_muscles: ['deltoides'], equipment: ['floor'] },
  { name: 'Press to Handstand', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Floor to handstand', primary_muscles: ['deltoides', 'abdominaux'], equipment: ['floor'] },
  { name: 'Straddle Planche', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Legs split planche', primary_muscles: ['deltoides', 'pectoraux'], equipment: ['floor'] },
  { name: 'Half Lay Planche', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'One leg extended', primary_muscles: ['deltoides', 'pectoraux'], equipment: ['floor'] },
  { name: 'Ring Planche', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Planche on rings', primary_muscles: ['deltoides', 'pectoraux'], equipment: ['gymnastic-rings'] },

  // LEGS - 15 exercices
  { name: 'Assisted Pistol Squat', discipline: 'calisthenics', category: 'squat', difficulty: 'intermediate', description: 'TRX pistol squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['resistance-band'] },
  { name: 'Elevated Pistol Squat', discipline: 'calisthenics', category: 'squat', difficulty: 'advanced', description: 'Box pistol squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['box'] },
  { name: 'Weighted Pistol Squat', discipline: 'calisthenics', category: 'squat', difficulty: 'elite', description: 'Loaded single leg', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['dumbbell'] },
  { name: 'Dragon Pistol Squat', discipline: 'calisthenics', category: 'squat', difficulty: 'elite', description: 'Dragon flag to pistol', primary_muscles: ['quadriceps', 'abdominaux'], equipment: ['floor'] },
  { name: 'Assisted Shrimp Squat', discipline: 'calisthenics', category: 'squat', difficulty: 'intermediate', description: 'Band shrimp', primary_muscles: ['quadriceps'], equipment: ['resistance-band'] },
  { name: 'Weighted Shrimp Squat', discipline: 'calisthenics', category: 'squat', difficulty: 'elite', description: 'Loaded shrimp', primary_muscles: ['quadriceps'], equipment: ['dumbbell'] },
  { name: 'Broad Jump', discipline: 'calisthenics', category: 'squat', difficulty: 'intermediate', description: 'Long jump', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['floor'] },
  { name: 'Box Jump', discipline: 'calisthenics', category: 'squat', difficulty: 'intermediate', description: 'Vertical jump', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['box'] },
  { name: 'Depth Jump', discipline: 'calisthenics', category: 'squat', difficulty: 'advanced', description: 'Drop and jump', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['box'] },
  { name: 'Single Leg Calf Raise', discipline: 'calisthenics', category: 'isolation', difficulty: 'intermediate', description: 'One leg calf', primary_muscles: ['mollets'], equipment: ['floor'] },
  { name: 'Elevated Calf Raise', discipline: 'calisthenics', category: 'isolation', difficulty: 'beginner', description: 'Step calf raise', primary_muscles: ['mollets'], equipment: ['box'] },
  { name: 'Jumping Calf Raise', discipline: 'calisthenics', category: 'isolation', difficulty: 'intermediate', description: 'Explosive calf', primary_muscles: ['mollets'], equipment: ['floor'] },

  // CORE - 20 exercices
  { name: 'Ring L-Sit', discipline: 'calisthenics', category: 'core', difficulty: 'advanced', description: 'Unstable L-sit', primary_muscles: ['abdominaux'], equipment: ['gymnastic-rings'] },
  { name: 'Tuck L-Sit', discipline: 'calisthenics', category: 'core', difficulty: 'intermediate', description: 'L-sit progression', primary_muscles: ['abdominaux'], equipment: ['parallettes'] },
  { name: 'One Leg L-Sit', discipline: 'calisthenics', category: 'core', difficulty: 'advanced', description: 'Single leg extended', primary_muscles: ['abdominaux'], equipment: ['parallettes'] },
  { name: 'Manna', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Beyond L-sit', primary_muscles: ['abdominaux', 'deltoides'], equipment: ['parallettes'] },
  { name: 'Archer Plank', discipline: 'calisthenics', category: 'core', difficulty: 'advanced', description: 'Single arm plank', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'RKC Plank', discipline: 'calisthenics', category: 'core', difficulty: 'intermediate', description: 'Max tension plank', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'Long Lever Plank', discipline: 'calisthenics', category: 'core', difficulty: 'advanced', description: 'Arms extended plank', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'Copenhagen Plank', discipline: 'calisthenics', category: 'core', difficulty: 'advanced', description: 'Adductor plank', primary_muscles: ['obliques', 'adducteurs'], equipment: ['bench'] },
  { name: 'Dragon Flag Negative', discipline: 'calisthenics', category: 'core', difficulty: 'advanced', description: 'Eccentric dragon flag', primary_muscles: ['abdominaux'], equipment: ['bench'] },
  { name: 'Dragon Flag Tuck', discipline: 'calisthenics', category: 'core', difficulty: 'advanced', description: 'Tucked dragon flag', primary_muscles: ['abdominaux'], equipment: ['bench'] },
  { name: 'Hanging Windshield Wiper', discipline: 'calisthenics', category: 'core', difficulty: 'elite', description: 'Hanging rotation', primary_muscles: ['obliques', 'abdominaux'], equipment: ['pull-up-bar'] },
  { name: 'Human Flag Hold', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Lateral hold', primary_muscles: ['obliques', 'dorsaux'], equipment: ['pole'] },
  { name: 'Tuck Human Flag', discipline: 'calisthenics', category: 'skill', difficulty: 'advanced', description: 'Tucked flag', primary_muscles: ['obliques', 'dorsaux'], equipment: ['pole'] },
  { name: 'Straddle Human Flag', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Split flag', primary_muscles: ['obliques', 'dorsaux'], equipment: ['pole'] },

  // COMPOUND & SKILLS - 10 exercices
  { name: 'Bar Muscle-up', discipline: 'calisthenics', category: 'compound', difficulty: 'advanced', description: 'Pull to dip transition', primary_muscles: ['dorsaux', 'pectoraux'], equipment: ['pull-up-bar'] },
  { name: 'Slow Muscle-up', discipline: 'calisthenics', category: 'compound', difficulty: 'elite', description: 'Strict muscle-up', primary_muscles: ['dorsaux', 'pectoraux'], equipment: ['pull-up-bar'] },
  { name: 'False Grip Muscle-up', discipline: 'calisthenics', category: 'compound', difficulty: 'elite', description: 'Ring muscle-up prep', primary_muscles: ['dorsaux', 'pectoraux'], equipment: ['gymnastic-rings'] },
  { name: 'Back Lever Tuck', discipline: 'calisthenics', category: 'skill', difficulty: 'intermediate', description: 'Tucked back lever', primary_muscles: ['dorsaux', 'pectoraux'], equipment: ['pull-up-bar'] },
  { name: 'Straddle Back Lever', discipline: 'calisthenics', category: 'skill', difficulty: 'advanced', description: 'Split back lever', primary_muscles: ['dorsaux', 'pectoraux'], equipment: ['pull-up-bar'] },
  { name: 'Ring Back Lever', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Back lever on rings', primary_muscles: ['dorsaux', 'pectoraux'], equipment: ['gymnastic-rings'] },
  { name: 'Maltese', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Extreme ring hold', primary_muscles: ['deltoides', 'pectoraux'], equipment: ['gymnastic-rings'] },
  { name: 'Iron Cross', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Crucifix hold', primary_muscles: ['pectoraux', 'deltoides'], equipment: ['gymnastic-rings'] },
];

async function main() {
  console.log('🚀 Seeding extended Calisthenics exercises...\n');

  let success = 0;
  let failed = 0;

  for (const ex of extendedCalisthenicsExercises) {
    try {
      await seedExercise(ex);
      success++;
      process.stdout.write(`\r✅ Seeded: ${success}/${extendedCalisthenicsExercises.length}`);
    } catch (error) {
      failed++;
      console.error(`\n❌ Failed: ${ex.name}`);
    }
  }

  console.log(`\n\n✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total Calisthenics exercises added: ${extendedCalisthenicsExercises.length}`);
}

main();

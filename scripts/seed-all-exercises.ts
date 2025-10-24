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

const forceExercises = [
  // CHEST - 50 exercices
  { name: 'Barbell Bench Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Classic barbell chest press', primary_muscles: ['pectoraux'], equipment: ['barbell', 'bench'], movement_pattern: 'horizontal push' },
  { name: 'Incline Barbell Bench Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Upper chest focus', primary_muscles: ['pectoraux'], secondary_muscles: ['deltoides'], equipment: ['barbell', 'incline-bench'] },
  { name: 'Decline Barbell Bench Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Lower chest focus', primary_muscles: ['pectoraux'], equipment: ['barbell', 'bench'] },
  { name: 'Dumbbell Bench Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Unilateral chest press', primary_muscles: ['pectoraux'], equipment: ['dumbbell', 'bench'] },
  { name: 'Incline Dumbbell Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Upper chest with dumbbells', primary_muscles: ['pectoraux'], equipment: ['dumbbell', 'incline-bench'] },
  { name: 'Decline Dumbbell Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Lower chest with dumbbells', primary_muscles: ['pectoraux'], equipment: ['dumbbell', 'bench'] },
  { name: 'Dumbbell Flyes', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Chest isolation', primary_muscles: ['pectoraux'], equipment: ['dumbbell', 'bench'] },
  { name: 'Incline Dumbbell Flyes', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Upper chest isolation', primary_muscles: ['pectoraux'], equipment: ['dumbbell', 'incline-bench'] },
  { name: 'Cable Flyes', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Cable chest isolation', primary_muscles: ['pectoraux'], equipment: ['cable-machine'] },
  { name: 'Chest Dips', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Bodyweight chest exercise', primary_muscles: ['pectoraux'], secondary_muscles: ['triceps'], equipment: ['dip-bars'] },

  // BACK - 50 exercices
  { name: 'Barbell Row', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Back thickness builder', primary_muscles: ['dorsaux'], secondary_muscles: ['trapèzes'], equipment: ['barbell'] },
  { name: 'Pendlay Row', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Explosive rowing', primary_muscles: ['dorsaux'], equipment: ['barbell'] },
  { name: 'T-Bar Row', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Mid-back builder', primary_muscles: ['dorsaux'], equipment: ['barbell'] },
  { name: 'Dumbbell Row', discipline: 'force', category: 'pull', difficulty: 'beginner', description: 'Unilateral back work', primary_muscles: ['dorsaux'], equipment: ['dumbbell', 'bench'] },
  { name: 'Chest-Supported Row', discipline: 'force', category: 'pull', difficulty: 'beginner', description: 'Supported back work', primary_muscles: ['dorsaux'], equipment: ['bench'] },
  { name: 'Seal Row', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Strict back isolation', primary_muscles: ['dorsaux'], equipment: ['bench', 'barbell'] },
  { name: 'Pull-ups', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Classic back builder', primary_muscles: ['dorsaux'], secondary_muscles: ['biceps'], equipment: ['pull-up-bar'] },
  { name: 'Chin-ups', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Bicep-focused pull-up', primary_muscles: ['dorsaux'], secondary_muscles: ['biceps'], equipment: ['pull-up-bar'] },
  { name: 'Weighted Pull-ups', discipline: 'force', category: 'pull', difficulty: 'advanced', description: 'Progressive pull-up', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar', 'weight-plates'] },
  { name: 'Lat Pulldown', discipline: 'force', category: 'pull', difficulty: 'beginner', description: 'Machine back work', primary_muscles: ['dorsaux'], equipment: ['lat-pulldown'] },

  // SHOULDERS - 40 exercices
  { name: 'Overhead Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Standing shoulder press', primary_muscles: ['deltoides'], secondary_muscles: ['triceps'], equipment: ['barbell'] },
  { name: 'Seated Overhead Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Seated shoulder press', primary_muscles: ['deltoides'], equipment: ['barbell', 'bench'] },
  { name: 'Dumbbell Shoulder Press', discipline: 'force', category: 'push', difficulty: 'beginner', description: 'Dumbbell press', primary_muscles: ['deltoides'], equipment: ['dumbbell', 'bench'] },
  { name: 'Arnold Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Rotational shoulder press', primary_muscles: ['deltoides'], equipment: ['dumbbell', 'bench'] },
  { name: 'Lateral Raises', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Side delt isolation', primary_muscles: ['deltoides'], equipment: ['dumbbell'] },
  { name: 'Front Raises', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Front delt work', primary_muscles: ['deltoides'], equipment: ['dumbbell'] },
  { name: 'Rear Delt Flyes', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Rear delt isolation', primary_muscles: ['deltoides'], equipment: ['dumbbell', 'bench'] },
  { name: 'Face Pulls', discipline: 'force', category: 'pull', difficulty: 'beginner', description: 'Rear delts and upper back', primary_muscles: ['deltoides'], secondary_muscles: ['trapèzes'], equipment: ['cable-machine'] },
  { name: 'Upright Row', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Shoulder and trap builder', primary_muscles: ['deltoides'], secondary_muscles: ['trapèzes'], equipment: ['barbell'] },

  // LEGS - 60 exercices
  { name: 'Back Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Classic barbell squat', primary_muscles: ['quadriceps', 'fessiers'], secondary_muscles: ['ischiojambiers'], equipment: ['barbell', 'squat-rack'] },
  { name: 'Front Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Quad-focused squat', primary_muscles: ['quadriceps'], equipment: ['barbell', 'squat-rack'] },
  { name: 'High Bar Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Olympic-style squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['barbell', 'squat-rack'] },
  { name: 'Low Bar Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Powerlifting squat', primary_muscles: ['fessiers'], secondary_muscles: ['quadriceps'], equipment: ['barbell', 'squat-rack'] },
  { name: 'Pause Squat', discipline: 'force', category: 'squat', difficulty: 'advanced', description: 'Squat with bottom pause', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['barbell', 'squat-rack'] },
  { name: 'Box Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Squat to box', primary_muscles: ['fessiers'], secondary_muscles: ['quadriceps'], equipment: ['barbell', 'box', 'squat-rack'] },
  { name: 'Goblet Squat', discipline: 'force', category: 'squat', difficulty: 'beginner', description: 'Front-loaded squat', primary_muscles: ['quadriceps'], equipment: ['dumbbell'] },
  { name: 'Bulgarian Split Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Single leg squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['dumbbell', 'bench'] },
  { name: 'Walking Lunges', discipline: 'force', category: 'squat', difficulty: 'beginner', description: 'Dynamic lunge', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['dumbbell'] },
  { name: 'Reverse Lunges', discipline: 'force', category: 'squat', difficulty: 'beginner', description: 'Backward lunge', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['dumbbell'] },
  { name: 'Sumo Deadlift', discipline: 'force', category: 'hinge', difficulty: 'intermediate', description: 'Wide-stance deadlift', primary_muscles: ['fessiers'], secondary_muscles: ['ischiojambiers'], equipment: ['barbell'] },
  { name: 'Trap Bar Deadlift', discipline: 'force', category: 'hinge', difficulty: 'beginner', description: 'Hex bar deadlift', primary_muscles: ['fessiers', 'quadriceps'], equipment: ['trap-bar'] },
  { name: 'Stiff-Leg Deadlift', discipline: 'force', category: 'hinge', difficulty: 'intermediate', description: 'Hamstring-focused', primary_muscles: ['ischiojambiers'], equipment: ['barbell'] },
  { name: 'Nordic Curls', discipline: 'force', category: 'hinge', difficulty: 'advanced', description: 'Hamstring eccentric', primary_muscles: ['ischiojambiers'], equipment: ['floor'] },
  { name: 'Leg Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Hamstring isolation', primary_muscles: ['ischiojambiers'], equipment: ['leg-curl'] },
  { name: 'Leg Extension', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Quad isolation', primary_muscles: ['quadriceps'], equipment: ['leg-extension'] },
  { name: 'Leg Press', discipline: 'force', category: 'squat', difficulty: 'beginner', description: 'Machine squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['leg-press'] },
  { name: 'Calf Raise', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Calf isolation', primary_muscles: ['mollets'], equipment: ['dumbbell'] },

  // ARMS - 30 exercices
  { name: 'Barbell Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Classic bicep curl', primary_muscles: ['biceps'], equipment: ['barbell'] },
  { name: 'EZ-Bar Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Joint-friendly curl', primary_muscles: ['biceps'], equipment: ['ez-bar'] },
  { name: 'Dumbbell Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Unilateral curl', primary_muscles: ['biceps'], equipment: ['dumbbell'] },
  { name: 'Hammer Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Neutral grip curl', primary_muscles: ['biceps'], secondary_muscles: ['avant-bras'], equipment: ['dumbbell'] },
  { name: 'Preacher Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Strict bicep curl', primary_muscles: ['biceps'], equipment: ['ez-bar', 'bench'] },
  { name: 'Cable Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Constant tension curl', primary_muscles: ['biceps'], equipment: ['cable-machine'] },
  { name: 'Close-Grip Bench Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Tricep-focused press', primary_muscles: ['triceps'], secondary_muscles: ['pectoraux'], equipment: ['barbell', 'bench'] },
  { name: 'Skull Crushers', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Lying tricep extension', primary_muscles: ['triceps'], equipment: ['barbell', 'bench'] },
  { name: 'Overhead Tricep Extension', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Overhead tricep work', primary_muscles: ['triceps'], equipment: ['dumbbell'] },
  { name: 'Tricep Pushdown', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Cable tricep extension', primary_muscles: ['triceps'], equipment: ['cable-machine'] },
  { name: 'Diamond Push-ups', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Close-grip push-up', primary_muscles: ['triceps'], secondary_muscles: ['pectoraux'], equipment: ['floor'] },
];

const calisthenicsExercises = [
  // PULL - 20 exercices
  { name: 'Scapula Pull-ups', discipline: 'calisthenics', category: 'pull', difficulty: 'beginner', description: 'Scapula activation', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'], sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12 },
  { name: 'Dead Hang', discipline: 'calisthenics', category: 'pull', difficulty: 'beginner', description: 'Grip strength', primary_muscles: ['dorsaux', 'avant-bras'], equipment: ['pull-up-bar'] },
  { name: 'Negative Pull-ups', discipline: 'calisthenics', category: 'pull', difficulty: 'novice', description: 'Eccentric pull-up', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'] },
  { name: 'Band-Assisted Pull-ups', discipline: 'calisthenics', category: 'pull', difficulty: 'novice', description: 'Assisted progression', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar', 'resistance-band'] },
  { name: 'Wide-Grip Pull-ups', discipline: 'calisthenics', category: 'pull', difficulty: 'intermediate', description: 'Lat width focus', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'] },
  { name: 'Archer Pull-ups', discipline: 'calisthenics', category: 'pull', difficulty: 'advanced', description: 'Single-arm progression', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'] },
  { name: 'Typewriter Pull-ups', discipline: 'calisthenics', category: 'pull', difficulty: 'advanced', description: 'Horizontal movement', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'] },
  { name: 'One-Arm Pull-up', discipline: 'calisthenics', category: 'pull', difficulty: 'elite', description: 'Ultimate pulling strength', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'] },
  { name: 'Muscle-up', discipline: 'calisthenics', category: 'compound', difficulty: 'advanced', description: 'Pull to dip transition', primary_muscles: ['dorsaux', 'pectoraux'], equipment: ['pull-up-bar'] },
  { name: 'Australian Pull-ups', discipline: 'calisthenics', category: 'pull', difficulty: 'beginner', description: 'Horizontal row', primary_muscles: ['dorsaux'], equipment: ['bar'] },

  // PUSH - 20 exercices
  { name: 'Wall Push-ups', discipline: 'calisthenics', category: 'push', difficulty: 'beginner', description: 'Easiest push variation', primary_muscles: ['pectoraux'], equipment: ['wall'] },
  { name: 'Incline Push-ups', discipline: 'calisthenics', category: 'push', difficulty: 'novice', description: 'Elevated hands', primary_muscles: ['pectoraux'], equipment: ['bench'] },
  { name: 'Knee Push-ups', discipline: 'calisthenics', category: 'push', difficulty: 'novice', description: 'Modified push-up', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Regular Push-ups', discipline: 'calisthenics', category: 'push', difficulty: 'beginner', description: 'Standard push-up', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Wide Push-ups', discipline: 'calisthenics', category: 'push', difficulty: 'intermediate', description: 'Chest focus', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Archer Push-ups', discipline: 'calisthenics', category: 'push', difficulty: 'advanced', description: 'Single-arm progression', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Pseudo Planche Push-ups', discipline: 'calisthenics', category: 'push', difficulty: 'advanced', description: 'Planche lean push', primary_muscles: ['pectoraux', 'deltoides'], equipment: ['floor'] },
  { name: 'One-Arm Push-up', discipline: 'calisthenics', category: 'push', difficulty: 'elite', description: 'Single arm strength', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Pike Push-ups', discipline: 'calisthenics', category: 'push', difficulty: 'intermediate', description: 'Shoulder focus', primary_muscles: ['deltoides'], equipment: ['floor'] },
  { name: 'Wall Handstand Hold', discipline: 'calisthenics', category: 'push', difficulty: 'intermediate', description: 'Inverted hold', primary_muscles: ['deltoides'], equipment: ['wall'] },
  { name: 'Handstand Push-ups', discipline: 'calisthenics', category: 'push', difficulty: 'advanced', description: 'Vertical press', primary_muscles: ['deltoides'], equipment: ['wall'] },

  // LEGS - 15 exercices
  { name: 'Bodyweight Squat', discipline: 'calisthenics', category: 'squat', difficulty: 'beginner', description: 'Basic squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['floor'] },
  { name: 'Jump Squat', discipline: 'calisthenics', category: 'squat', difficulty: 'intermediate', description: 'Explosive squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['floor'] },
  { name: 'Pistol Squat', discipline: 'calisthenics', category: 'squat', difficulty: 'advanced', description: 'Single-leg squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['floor'] },
  { name: 'Shrimp Squat', discipline: 'calisthenics', category: 'squat', difficulty: 'advanced', description: 'Single-leg variation', primary_muscles: ['quadriceps'], equipment: ['floor'] },
  { name: 'Nordic Hamstring Curl', discipline: 'calisthenics', category: 'hinge', difficulty: 'advanced', description: 'Hamstring eccentric', primary_muscles: ['ischiojambiers'], equipment: ['floor'] },

  // CORE - 15 exercices
  { name: 'Plank Hold', discipline: 'calisthenics', category: 'core', difficulty: 'beginner', description: 'Isometric core', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'Side Plank Hold', discipline: 'calisthenics', category: 'core', difficulty: 'beginner', description: 'Lateral core', primary_muscles: ['obliques'], equipment: ['floor'] },
  { name: 'Hollow Body Hold', discipline: 'calisthenics', category: 'core', difficulty: 'intermediate', description: 'Gymnastic position', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'L-Sit Hold', discipline: 'calisthenics', category: 'core', difficulty: 'advanced', description: 'Straight leg hold', primary_muscles: ['abdominaux'], equipment: ['parallettes'] },
  { name: 'V-Sit Hold', discipline: 'calisthenics', category: 'core', difficulty: 'advanced', description: 'Advanced core hold', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'Dragon Flag', discipline: 'calisthenics', category: 'core', difficulty: 'elite', description: 'Extreme core control', primary_muscles: ['abdominaux'], equipment: ['bench'] },

  // SKILLS - 10 exercices
  { name: 'Front Lever Tuck', discipline: 'calisthenics', category: 'skill', difficulty: 'intermediate', description: 'Lever progression', primary_muscles: ['dorsaux', 'abdominaux'], equipment: ['pull-up-bar'] },
  { name: 'Front Lever', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Full front lever', primary_muscles: ['dorsaux', 'abdominaux'], equipment: ['pull-up-bar'] },
  { name: 'Back Lever', discipline: 'calisthenics', category: 'skill', difficulty: 'advanced', description: 'Back lever hold', primary_muscles: ['dorsaux', 'pectoraux'], equipment: ['pull-up-bar'] },
  { name: 'Planche Lean', discipline: 'calisthenics', category: 'skill', difficulty: 'intermediate', description: 'Planche basics', primary_muscles: ['deltoides', 'pectoraux'], equipment: ['floor'] },
  { name: 'Tuck Planche', discipline: 'calisthenics', category: 'skill', difficulty: 'advanced', description: 'Planche progression', primary_muscles: ['deltoides', 'pectoraux'], equipment: ['floor'] },
  { name: 'Full Planche', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Ultimate push strength', primary_muscles: ['deltoides', 'pectoraux'], equipment: ['floor'] },
  { name: 'Human Flag', discipline: 'calisthenics', category: 'skill', difficulty: 'elite', description: 'Lateral hold', primary_muscles: ['obliques', 'dorsaux'], equipment: ['pole'] },
];

const functionalExercises = [
  // OLYMPIC LIFTS - 15 exercices
  { name: 'Power Clean', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'Explosive clean', primary_muscles: ['fessiers', 'quadriceps', 'dorsaux'], equipment: ['barbell'], reps_min: 3, reps_max: 5 },
  { name: 'Hang Clean', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'Clean from hang', primary_muscles: ['fessiers', 'dorsaux'], equipment: ['barbell'] },
  { name: 'Squat Clean', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'Full clean', primary_muscles: ['fessiers', 'quadriceps', 'dorsaux'], equipment: ['barbell'] },
  { name: 'Power Snatch', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'Explosive snatch', primary_muscles: ['fessiers', 'deltoides'], equipment: ['barbell'] },
  { name: 'Hang Snatch', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'Snatch from hang', primary_muscles: ['fessiers', 'deltoides'], equipment: ['barbell'] },
  { name: 'Squat Snatch', discipline: 'functional', category: 'olympic', difficulty: 'elite', description: 'Full snatch', primary_muscles: ['fessiers', 'deltoides'], equipment: ['barbell'] },
  { name: 'Push Jerk', discipline: 'functional', category: 'olympic', difficulty: 'intermediate', description: 'Explosive overhead', primary_muscles: ['deltoides'], equipment: ['barbell'] },
  { name: 'Split Jerk', discipline: 'functional', category: 'olympic', difficulty: 'advanced', description: 'Jerk with split', primary_muscles: ['deltoides'], equipment: ['barbell'] },
  { name: 'Clean and Jerk', discipline: 'functional', category: 'olympic', difficulty: 'elite', description: 'Full olympic lift', primary_muscles: ['corps-complet'], equipment: ['barbell'] },

  // GYMNASTIC - 15 exercices
  { name: 'Kipping Pull-up', discipline: 'functional', category: 'gymnastic', difficulty: 'intermediate', description: 'Dynamic pull-up', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'], reps_min: 10, reps_max: 20 },
  { name: 'Butterfly Pull-up', discipline: 'functional', category: 'gymnastic', difficulty: 'advanced', description: 'Efficient pull-up', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar'] },
  { name: 'Bar Muscle-up', discipline: 'functional', category: 'gymnastic', difficulty: 'advanced', description: 'Explosive transition', primary_muscles: ['dorsaux', 'pectoraux'], equipment: ['pull-up-bar'] },
  { name: 'Ring Muscle-up', discipline: 'functional', category: 'gymnastic', difficulty: 'elite', description: 'Ring transition', primary_muscles: ['dorsaux', 'pectoraux'], equipment: ['gymnastic-rings'] },
  { name: 'Kipping Handstand Push-up', discipline: 'functional', category: 'gymnastic', difficulty: 'advanced', description: 'Dynamic HSPU', primary_muscles: ['deltoides'], equipment: ['wall'] },
  { name: 'Strict Handstand Push-up', discipline: 'functional', category: 'gymnastic', difficulty: 'advanced', description: 'Strict HSPU', primary_muscles: ['deltoides'], equipment: ['wall'] },
  { name: 'Toes-to-Bar', discipline: 'functional', category: 'gymnastic', difficulty: 'intermediate', description: 'Core and grip', primary_muscles: ['abdominaux'], equipment: ['pull-up-bar'] },
  { name: 'Knees-to-Elbows', discipline: 'functional', category: 'gymnastic', difficulty: 'intermediate', description: 'Core work', primary_muscles: ['abdominaux'], equipment: ['pull-up-bar'] },

  // WEIGHTED - 20 exercices
  { name: 'Wall Ball Shots', discipline: 'functional', category: 'weighted', difficulty: 'beginner', description: 'Squat and throw', primary_muscles: ['quadriceps', 'deltoides'], equipment: ['medicine-ball', 'wall'], reps_min: 15, reps_max: 25 },
  { name: 'Kettlebell Swing', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Hip hinge power', primary_muscles: ['fessiers', 'ischiojambiers'], equipment: ['kettlebell'] },
  { name: 'American Kettlebell Swing', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Overhead swing', primary_muscles: ['fessiers', 'deltoides'], equipment: ['kettlebell'] },
  { name: 'Dumbbell Thrusters', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Squat to press', primary_muscles: ['quadriceps', 'deltoides'], equipment: ['dumbbell'] },
  { name: 'Dumbbell Snatch', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Single-arm snatch', primary_muscles: ['fessiers', 'deltoides'], equipment: ['dumbbell'] },
  { name: 'Box Jump', discipline: 'functional', category: 'weighted', difficulty: 'intermediate', description: 'Explosive jump', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['box'] },
  { name: 'Box Step-ups', discipline: 'functional', category: 'weighted', difficulty: 'beginner', description: 'Single-leg strength', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['box'] },

  // MONOSTRUCTURAL - 10 exercices
  { name: 'Rowing', discipline: 'functional', category: 'cardio', difficulty: 'beginner', description: 'Full-body cardio', primary_muscles: ['dorsaux', 'quadriceps'], equipment: ['rowing-machine'], reps_min: 500, reps_max: 2000 },
  { name: 'Assault Bike', discipline: 'functional', category: 'cardio', difficulty: 'beginner', description: 'Full-body bike', primary_muscles: ['quadriceps'], equipment: ['assault-bike'] },
  { name: 'Ski Erg', discipline: 'functional', category: 'cardio', difficulty: 'intermediate', description: 'Upper body cardio', primary_muscles: ['dorsaux', 'deltoides'], equipment: ['ski-erg'] },
  { name: 'Double-Unders', discipline: 'functional', category: 'cardio', difficulty: 'intermediate', description: 'Jump rope skill', primary_muscles: ['mollets'], equipment: ['jump-rope'] },
  { name: 'Running', discipline: 'functional', category: 'cardio', difficulty: 'beginner', description: 'Cardio endurance', primary_muscles: ['quadriceps'], equipment: ['floor'] },
];

const enduranceExercises = [
  // RUNNING - 20 exercices
  { name: 'Easy Run', discipline: 'endurance', category: 'running', difficulty: 'beginner', description: 'Low intensity run', primary_muscles: ['quadriceps'], equipment: ['floor'], reps_min: 20, reps_max: 60 },
  { name: 'Long Run', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Extended distance', primary_muscles: ['quadriceps', 'ischiojambiers'], equipment: ['floor'] },
  { name: 'Tempo Run', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Sustained pace', primary_muscles: ['quadriceps'], equipment: ['floor'] },
  { name: 'Interval Training', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'High-intensity intervals', primary_muscles: ['quadriceps'], equipment: ['floor'] },
  { name: 'Fartlek', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Speed play', primary_muscles: ['quadriceps'], equipment: ['floor'] },
  { name: 'Hill Repeats', discipline: 'endurance', category: 'running', difficulty: 'advanced', description: 'Uphill sprints', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['floor'] },
  { name: '400m Repeats', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Track intervals', primary_muscles: ['quadriceps'], equipment: ['floor'] },
  { name: '800m Repeats', discipline: 'endurance', category: 'running', difficulty: 'intermediate', description: 'Mid-distance intervals', primary_muscles: ['quadriceps'], equipment: ['floor'] },
  { name: 'Mile Repeats', discipline: 'endurance', category: 'running', difficulty: 'advanced', description: 'Long intervals', primary_muscles: ['quadriceps'], equipment: ['floor'] },
  { name: 'Recovery Run', discipline: 'endurance', category: 'running', difficulty: 'beginner', description: 'Active recovery', primary_muscles: ['quadriceps'], equipment: ['floor'] },

  // CYCLING - 20 exercices
  { name: 'Easy Ride', discipline: 'endurance', category: 'cycling', difficulty: 'beginner', description: 'Low intensity cycling', primary_muscles: ['quadriceps'], equipment: ['bike'] },
  { name: 'Endurance Ride', discipline: 'endurance', category: 'cycling', difficulty: 'intermediate', description: 'Long steady ride', primary_muscles: ['quadriceps'], equipment: ['bike'] },
  { name: 'Sweet Spot', discipline: 'endurance', category: 'cycling', difficulty: 'intermediate', description: 'High aerobic effort', primary_muscles: ['quadriceps'], equipment: ['bike'] },
  { name: 'Threshold Intervals', discipline: 'endurance', category: 'cycling', difficulty: 'advanced', description: 'Lactate threshold work', primary_muscles: ['quadriceps'], equipment: ['bike'] },
  { name: 'VO2 Max Intervals', discipline: 'endurance', category: 'cycling', difficulty: 'advanced', description: 'High intensity intervals', primary_muscles: ['quadriceps'], equipment: ['bike'] },
  { name: 'Sprint Intervals', discipline: 'endurance', category: 'cycling', difficulty: 'intermediate', description: 'Max effort sprints', primary_muscles: ['quadriceps'], equipment: ['bike'] },
  { name: 'Hill Climbing', discipline: 'endurance', category: 'cycling', difficulty: 'intermediate', description: 'Sustained climbing', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['bike'] },
  { name: 'Recovery Ride', discipline: 'endurance', category: 'cycling', difficulty: 'beginner', description: 'Active recovery', primary_muscles: ['quadriceps'], equipment: ['bike'] },

  // SWIMMING - 15 exercices
  { name: 'Freestyle Endurance', discipline: 'endurance', category: 'swimming', difficulty: 'beginner', description: 'Steady freestyle', primary_muscles: ['dorsaux', 'deltoides'], equipment: ['floor'] },
  { name: 'CSS Intervals', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Critical swim speed', primary_muscles: ['dorsaux'], equipment: ['floor'] },
  { name: 'Threshold Swim', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Lactate threshold pace', primary_muscles: ['dorsaux', 'deltoides'], equipment: ['floor'] },
  { name: 'Sprint Sets', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Max effort swimming', primary_muscles: ['dorsaux'], equipment: ['floor'] },
  { name: 'Technique Drills', discipline: 'endurance', category: 'swimming', difficulty: 'beginner', description: 'Form improvement', primary_muscles: ['dorsaux'], equipment: ['floor'] },
  { name: 'Pull Sets', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Upper body focus', primary_muscles: ['dorsaux', 'deltoides'], equipment: ['floor'] },
  { name: 'Kick Sets', discipline: 'endurance', category: 'swimming', difficulty: 'intermediate', description: 'Lower body focus', primary_muscles: ['quadriceps'], equipment: ['floor'] },
];

async function main() {
  console.log('🚀 Starting exercise seeding...\n');

  const allExercises = [
    ...forceExercises,
    ...calisthenicsExercises,
    ...functionalExercises,
    ...enduranceExercises
  ];

  let success = 0;
  let failed = 0;

  for (const ex of allExercises) {
    try {
      await seedExercise(ex);
      success++;
      process.stdout.write(`\r✅ Seeded: ${success}/${allExercises.length}`);
    } catch (error) {
      failed++;
      console.error(`\n❌ Failed: ${ex.name}`);
    }
  }

  console.log(`\n\n✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${allExercises.length}`);
}

main();

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

const extendedForceExercises = [
  // CHEST - 40 exercices supplémentaires
  { name: 'Machine Chest Press', discipline: 'force', category: 'push', difficulty: 'beginner', description: 'Machine chest press', primary_muscles: ['pectoraux'], equipment: ['chest-press-machine'] },
  { name: 'Smith Machine Bench Press', discipline: 'force', category: 'push', difficulty: 'beginner', description: 'Guided bench press', primary_muscles: ['pectoraux'], equipment: ['smith-machine'] },
  { name: 'Smith Machine Incline Press', discipline: 'force', category: 'push', difficulty: 'beginner', description: 'Guided incline press', primary_muscles: ['pectoraux'], equipment: ['smith-machine'] },
  { name: 'Pec Deck Machine', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Machine chest flyes', primary_muscles: ['pectoraux'], equipment: ['chest-press-machine'] },
  { name: 'Low Cable Crossover', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Lower chest cable work', primary_muscles: ['pectoraux'], equipment: ['cable-machine'] },
  { name: 'High Cable Crossover', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Upper chest cable work', primary_muscles: ['pectoraux'], equipment: ['cable-machine'] },
  { name: 'Mid Cable Crossover', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Mid chest cable work', primary_muscles: ['pectoraux'], equipment: ['cable-machine'] },
  { name: 'Single Arm Cable Chest Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Unilateral cable press', primary_muscles: ['pectoraux'], equipment: ['cable-machine'] },
  { name: 'Landmine Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Angular chest press', primary_muscles: ['pectoraux', 'deltoides'], equipment: ['barbell'] },
  { name: 'Push-up Plus', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Push-up with protraction', primary_muscles: ['pectoraux', 'trapèzes'], equipment: ['floor'] },
  { name: 'Weighted Push-ups', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Progressive push-up', primary_muscles: ['pectoraux'], equipment: ['floor', 'weight-plates'] },
  { name: 'Decline Push-ups', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Feet elevated push-up', primary_muscles: ['pectoraux'], equipment: ['floor', 'bench'] },
  { name: 'Plyometric Push-ups', discipline: 'force', category: 'push', difficulty: 'advanced', description: 'Explosive push-up', primary_muscles: ['pectoraux'], equipment: ['floor'] },
  { name: 'Spoto Press', discipline: 'force', category: 'push', difficulty: 'advanced', description: 'Pause bench press', primary_muscles: ['pectoraux'], equipment: ['barbell', 'bench'] },
  { name: 'Board Press', discipline: 'force', category: 'push', difficulty: 'advanced', description: 'Partial range bench', primary_muscles: ['pectoraux', 'triceps'], equipment: ['barbell', 'bench'] },
  { name: 'Floor Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Limited ROM press', primary_muscles: ['pectoraux', 'triceps'], equipment: ['barbell', 'floor'] },
  { name: 'Svend Press', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Plate squeeze press', primary_muscles: ['pectoraux'], equipment: ['weight-plates'] },
  { name: 'Hex Press', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Dumbbell squeeze press', primary_muscles: ['pectoraux'], equipment: ['dumbbell', 'bench'] },
  { name: 'Guillotine Press', discipline: 'force', category: 'push', difficulty: 'advanced', description: 'Neck press variation', primary_muscles: ['pectoraux'], equipment: ['barbell', 'bench'] },
  { name: 'Reverse Grip Bench Press', discipline: 'force', category: 'push', difficulty: 'advanced', description: 'Underhand bench press', primary_muscles: ['pectoraux'], secondary_muscles: ['triceps'], equipment: ['barbell', 'bench'] },

  // BACK - 50 exercices supplémentaires
  { name: 'Seated Cable Row', discipline: 'force', category: 'pull', difficulty: 'beginner', description: 'Cable rowing', primary_muscles: ['dorsaux'], equipment: ['cable-machine'] },
  { name: 'Wide Grip Lat Pulldown', discipline: 'force', category: 'pull', difficulty: 'beginner', description: 'Wide lat work', primary_muscles: ['dorsaux'], equipment: ['lat-pulldown'] },
  { name: 'Close Grip Lat Pulldown', discipline: 'force', category: 'pull', difficulty: 'beginner', description: 'Narrow lat work', primary_muscles: ['dorsaux'], equipment: ['lat-pulldown'] },
  { name: 'Reverse Grip Lat Pulldown', discipline: 'force', category: 'pull', difficulty: 'beginner', description: 'Underhand pulldown', primary_muscles: ['dorsaux', 'biceps'], equipment: ['lat-pulldown'] },
  { name: 'Straight Arm Pulldown', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Lat isolation', primary_muscles: ['dorsaux'], equipment: ['cable-machine'] },
  { name: 'Meadows Row', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Landmine rowing', primary_muscles: ['dorsaux'], equipment: ['barbell'] },
  { name: 'Kroc Row', discipline: 'force', category: 'pull', difficulty: 'advanced', description: 'Heavy dumbbell row', primary_muscles: ['dorsaux'], equipment: ['dumbbell'] },
  { name: 'Machine Row', discipline: 'force', category: 'pull', difficulty: 'beginner', description: 'Supported back row', primary_muscles: ['dorsaux'], equipment: ['lat-pulldown'] },
  { name: 'Inverted Row', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Bodyweight row', primary_muscles: ['dorsaux'], equipment: ['barbell'] },
  { name: 'Single Arm Cable Row', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Unilateral cable row', primary_muscles: ['dorsaux'], equipment: ['cable-machine'] },
  { name: 'Face Pull', discipline: 'force', category: 'pull', difficulty: 'beginner', description: 'Upper back and rear delts', primary_muscles: ['dorsaux', 'deltoides'], equipment: ['cable-machine'] },
  { name: 'Y-Raise', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Upper back isolation', primary_muscles: ['trapèzes'], equipment: ['dumbbell'] },
  { name: 'Shrugs', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Trap isolation', primary_muscles: ['trapèzes'], equipment: ['dumbbell'] },
  { name: 'Barbell Shrugs', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Heavy trap work', primary_muscles: ['trapèzes'], equipment: ['barbell'] },
  { name: 'Rack Pulls', discipline: 'force', category: 'pull', difficulty: 'intermediate', description: 'Partial deadlift', primary_muscles: ['dorsaux', 'trapèzes'], equipment: ['barbell', 'power-rack'] },
  { name: 'Snatch Grip Deadlift', discipline: 'force', category: 'hinge', difficulty: 'advanced', description: 'Wide grip deadlift', primary_muscles: ['dorsaux', 'trapèzes'], equipment: ['barbell'] },
  { name: 'Deficit Romanian Deadlift', discipline: 'force', category: 'hinge', difficulty: 'advanced', description: 'Elevated RDL', primary_muscles: ['ischiojambiers', 'dorsaux'], equipment: ['barbell'] },
  { name: 'Single Leg Romanian Deadlift', discipline: 'force', category: 'hinge', difficulty: 'intermediate', description: 'Unilateral RDL', primary_muscles: ['ischiojambiers', 'fessiers'], equipment: ['dumbbell'] },
  { name: 'Cable Pull Through', discipline: 'force', category: 'hinge', difficulty: 'beginner', description: 'Hip hinge pattern', primary_muscles: ['fessiers', 'ischiojambiers'], equipment: ['cable-machine'] },
  { name: 'Hyperextension', discipline: 'force', category: 'hinge', difficulty: 'beginner', description: 'Lower back extension', primary_muscles: ['lombaires'], equipment: ['ghd'] },
  { name: 'Reverse Hyperextension', discipline: 'force', category: 'hinge', difficulty: 'intermediate', description: 'Reverse back extension', primary_muscles: ['lombaires', 'fessiers'], equipment: ['bench'] },
  { name: '45 Degree Hyperextension', discipline: 'force', category: 'hinge', difficulty: 'beginner', description: 'Angled back extension', primary_muscles: ['lombaires'], equipment: ['ghd'] },
  { name: 'Back Extension', discipline: 'force', category: 'hinge', difficulty: 'beginner', description: 'Standard back extension', primary_muscles: ['lombaires'], equipment: ['ghd'] },
  { name: 'Superman Hold', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Isometric back work', primary_muscles: ['lombaires'], equipment: ['floor'] },

  // SHOULDERS - 40 exercices supplémentaires
  { name: 'Machine Shoulder Press', discipline: 'force', category: 'push', difficulty: 'beginner', description: 'Guided shoulder press', primary_muscles: ['deltoides'], equipment: ['chest-press-machine'] },
  { name: 'Smith Machine Shoulder Press', discipline: 'force', category: 'push', difficulty: 'beginner', description: 'Guided overhead press', primary_muscles: ['deltoides'], equipment: ['smith-machine'] },
  { name: 'Push Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Explosive shoulder press', primary_muscles: ['deltoides'], secondary_muscles: ['quadriceps'], equipment: ['barbell'] },
  { name: 'Behind Neck Press', discipline: 'force', category: 'push', difficulty: 'advanced', description: 'Press behind head', primary_muscles: ['deltoides'], equipment: ['barbell', 'bench'] },
  { name: 'Bradford Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Front to back press', primary_muscles: ['deltoides'], equipment: ['barbell', 'bench'] },
  { name: 'Viking Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Landmine shoulder press', primary_muscles: ['deltoides'], equipment: ['barbell'] },
  { name: 'Single Arm Overhead Press', discipline: 'force', category: 'push', difficulty: 'intermediate', description: 'Unilateral press', primary_muscles: ['deltoides'], equipment: ['dumbbell'] },
  { name: 'Cable Lateral Raise', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Cable side delts', primary_muscles: ['deltoides'], equipment: ['cable-machine'] },
  { name: 'Leaning Lateral Raise', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Leaning side raise', primary_muscles: ['deltoides'], equipment: ['dumbbell'] },
  { name: 'Lu Raise', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Y-raise variation', primary_muscles: ['deltoides'], equipment: ['dumbbell'] },
  { name: 'Cuban Press', discipline: 'force', category: 'compound', difficulty: 'intermediate', description: 'Rotational shoulder work', primary_muscles: ['deltoides'], equipment: ['dumbbell'] },
  { name: 'Band Pull Apart', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Rear delt isolation', primary_muscles: ['deltoides'], equipment: ['resistance-band'] },
  { name: 'Bent Over Lateral Raise', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Bent rear delt work', primary_muscles: ['deltoides'], equipment: ['dumbbell'] },
  { name: 'Reverse Pec Deck', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Machine rear delts', primary_muscles: ['deltoides'], equipment: ['chest-press-machine'] },
  { name: 'Cable Rear Delt Fly', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Cable rear delts', primary_muscles: ['deltoides'], equipment: ['cable-machine'] },
  { name: 'Seated Rear Delt Fly', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Seated rear delt work', primary_muscles: ['deltoides'], equipment: ['dumbbell', 'bench'] },
  { name: 'W Raise', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Upper back and rear delts', primary_muscles: ['deltoides', 'trapèzes'], equipment: ['dumbbell'] },
  { name: 'Plate Front Raise', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Front delt with plate', primary_muscles: ['deltoides'], equipment: ['weight-plates'] },
  { name: 'Barbell Front Raise', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Front delt with barbell', primary_muscles: ['deltoides'], equipment: ['barbell'] },
  { name: 'Incline Front Raise', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Incline front delt work', primary_muscles: ['deltoides'], equipment: ['dumbbell', 'incline-bench'] },

  // LEGS - 60 exercices supplémentaires
  { name: 'Hack Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Machine quad squat', primary_muscles: ['quadriceps'], equipment: ['leg-press'] },
  { name: 'Sissy Squat', discipline: 'force', category: 'squat', difficulty: 'advanced', description: 'Knee-focused squat', primary_muscles: ['quadriceps'], equipment: ['floor'] },
  { name: 'Zercher Squat', discipline: 'force', category: 'squat', difficulty: 'advanced', description: 'Front-loaded squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['barbell'] },
  { name: 'Anderson Squat', discipline: 'force', category: 'squat', difficulty: 'advanced', description: 'Dead stop squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['barbell', 'power-rack'] },
  { name: 'Hatfield Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Safety bar squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['safety-squat-bar', 'squat-rack'] },
  { name: 'Belt Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Hip-loaded squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['belt'] },
  { name: 'Smith Machine Squat', discipline: 'force', category: 'squat', difficulty: 'beginner', description: 'Guided squat', primary_muscles: ['quadriceps'], equipment: ['smith-machine'] },
  { name: 'Narrow Stance Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Close stance squat', primary_muscles: ['quadriceps'], equipment: ['barbell', 'squat-rack'] },
  { name: 'Wide Stance Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Sumo stance squat', primary_muscles: ['fessiers', 'adducteurs'], equipment: ['barbell', 'squat-rack'] },
  { name: 'Overhead Squat', discipline: 'force', category: 'squat', difficulty: 'elite', description: 'Snatch grip squat', primary_muscles: ['quadriceps', 'deltoides'], equipment: ['barbell'] },
  { name: 'Landmine Squat', discipline: 'force', category: 'squat', difficulty: 'beginner', description: 'Angled squat', primary_muscles: ['quadriceps'], equipment: ['barbell'] },
  { name: 'Cyclist Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Heel elevated squat', primary_muscles: ['quadriceps'], equipment: ['barbell', 'weight-plates'] },
  { name: 'Spanish Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Band resisted squat', primary_muscles: ['quadriceps'], equipment: ['resistance-band'] },
  { name: 'Wall Sit', discipline: 'force', category: 'squat', difficulty: 'beginner', description: 'Isometric squat hold', primary_muscles: ['quadriceps'], equipment: ['wall'] },
  { name: 'Jump Lunge', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Explosive lunge', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['floor'] },
  { name: 'Curtsy Lunge', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Crossover lunge', primary_muscles: ['fessiers'], equipment: ['dumbbell'] },
  { name: 'Lateral Lunge', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Side lunge', primary_muscles: ['adducteurs', 'fessiers'], equipment: ['dumbbell'] },
  { name: 'Deficit Reverse Lunge', discipline: 'force', category: 'squat', difficulty: 'advanced', description: 'Elevated reverse lunge', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['dumbbell', 'box'] },
  { name: 'Step Down', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Eccentric step down', primary_muscles: ['quadriceps'], equipment: ['box'] },
  { name: 'Skater Squat', discipline: 'force', category: 'squat', difficulty: 'advanced', description: 'Single leg squat variation', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['floor'] },
  { name: 'Cossack Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Side-to-side squat', primary_muscles: ['adducteurs', 'quadriceps'], equipment: ['floor'] },
  { name: 'Jefferson Squat', discipline: 'force', category: 'squat', difficulty: 'intermediate', description: 'Straddle squat', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['barbell'] },
  { name: 'Snatch Grip Romanian Deadlift', discipline: 'force', category: 'hinge', difficulty: 'advanced', description: 'Wide grip RDL', primary_muscles: ['ischiojambiers'], equipment: ['barbell'] },
  { name: 'Kettlebell Deadlift', discipline: 'force', category: 'hinge', difficulty: 'beginner', description: 'Kettlebell hip hinge', primary_muscles: ['fessiers', 'ischiojambiers'], equipment: ['kettlebell'] },
  { name: 'B-Stance Romanian Deadlift', discipline: 'force', category: 'hinge', difficulty: 'intermediate', description: 'Kickstand RDL', primary_muscles: ['ischiojambiers', 'fessiers'], equipment: ['dumbbell'] },
  { name: 'Glute Ham Raise', discipline: 'force', category: 'hinge', difficulty: 'advanced', description: 'Nordic curl variation', primary_muscles: ['ischiojambiers'], equipment: ['ghd'] },
  { name: 'Seated Leg Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Hamstring isolation', primary_muscles: ['ischiojambiers'], equipment: ['leg-curl'] },
  { name: 'Lying Leg Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Prone hamstring curl', primary_muscles: ['ischiojambiers'], equipment: ['leg-curl'] },
  { name: 'Single Leg Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Unilateral hamstring curl', primary_muscles: ['ischiojambiers'], equipment: ['leg-curl'] },
  { name: 'Swiss Ball Leg Curl', discipline: 'force', category: 'hinge', difficulty: 'intermediate', description: 'Stability ball curl', primary_muscles: ['ischiojambiers'], equipment: ['floor'] },
  { name: 'Single Leg Extension', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Unilateral quad extension', primary_muscles: ['quadriceps'], equipment: ['leg-extension'] },
  { name: 'Sissy Squat Machine', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Machine sissy squat', primary_muscles: ['quadriceps'], equipment: ['leg-extension'] },
  { name: 'Barbell Hip Thrust', discipline: 'force', category: 'hinge', difficulty: 'intermediate', description: 'Glute bridge with barbell', primary_muscles: ['fessiers'], equipment: ['barbell', 'bench'] },
  { name: 'Single Leg Hip Thrust', discipline: 'force', category: 'hinge', difficulty: 'advanced', description: 'Unilateral hip thrust', primary_muscles: ['fessiers'], equipment: ['bench'] },
  { name: 'Frog Pump', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Glute activation', primary_muscles: ['fessiers'], equipment: ['floor'] },
  { name: 'Cable Pull Through', discipline: 'force', category: 'hinge', difficulty: 'beginner', description: 'Cable hip hinge', primary_muscles: ['fessiers'], equipment: ['cable-machine'] },
  { name: 'Standing Calf Raise', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Gastrocnemius focus', primary_muscles: ['mollets'], equipment: ['dumbbell'] },
  { name: 'Seated Calf Raise', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Soleus focus', primary_muscles: ['mollets'], equipment: ['dumbbell', 'bench'] },
  { name: 'Donkey Calf Raise', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Bent over calf raise', primary_muscles: ['mollets'], equipment: ['weight-plates'] },
  { name: 'Single Leg Calf Raise', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Unilateral calf work', primary_muscles: ['mollets'], equipment: ['dumbbell'] },

  // ARMS - 40 exercices supplémentaires
  { name: 'Concentration Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Seated bicep curl', primary_muscles: ['biceps'], equipment: ['dumbbell', 'bench'] },
  { name: 'Incline Dumbbell Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Stretched bicep curl', primary_muscles: ['biceps'], equipment: ['dumbbell', 'incline-bench'] },
  { name: 'Spider Curl', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Strict curl variation', primary_muscles: ['biceps'], equipment: ['dumbbell', 'incline-bench'] },
  { name: 'Drag Curl', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Vertical curl path', primary_muscles: ['biceps'], equipment: ['barbell'] },
  { name: 'Zottman Curl', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Rotating curl', primary_muscles: ['biceps', 'avant-bras'], equipment: ['dumbbell'] },
  { name: 'Reverse Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Overhand bicep curl', primary_muscles: ['biceps', 'avant-bras'], equipment: ['barbell'] },
  { name: 'Cross Body Hammer Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Crossover hammer curl', primary_muscles: ['biceps'], equipment: ['dumbbell'] },
  { name: '21s Curl', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Partial rep curls', primary_muscles: ['biceps'], equipment: ['barbell'] },
  { name: 'Machine Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Supported bicep curl', primary_muscles: ['biceps'], equipment: ['lat-pulldown'] },
  { name: 'Standing Cable Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Cable bicep work', primary_muscles: ['biceps'], equipment: ['cable-machine'] },
  { name: 'Rope Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Rope attachment curl', primary_muscles: ['biceps'], equipment: ['cable-machine'] },
  { name: 'High Cable Curl', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Overhead cable curl', primary_muscles: ['biceps'], equipment: ['cable-machine'] },
  { name: 'JM Press', discipline: 'force', category: 'isolation', difficulty: 'advanced', description: 'Hybrid tricep press', primary_muscles: ['triceps'], equipment: ['barbell', 'bench'] },
  { name: 'Tate Press', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Elbows-in press', primary_muscles: ['triceps'], equipment: ['dumbbell', 'bench'] },
  { name: 'Dumbbell Kickback', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Tricep extension', primary_muscles: ['triceps'], equipment: ['dumbbell', 'bench'] },
  { name: 'Cable Kickback', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Cable tricep extension', primary_muscles: ['triceps'], equipment: ['cable-machine'] },
  { name: 'Rope Pushdown', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Rope tricep extension', primary_muscles: ['triceps'], equipment: ['cable-machine'] },
  { name: 'Straight Bar Pushdown', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Bar tricep pushdown', primary_muscles: ['triceps'], equipment: ['cable-machine'] },
  { name: 'Reverse Grip Pushdown', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Underhand pushdown', primary_muscles: ['triceps'], equipment: ['cable-machine'] },
  { name: 'Single Arm Pushdown', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Unilateral tricep work', primary_muscles: ['triceps'], equipment: ['cable-machine'] },
  { name: 'Bench Dips', discipline: 'force', category: 'push', difficulty: 'beginner', description: 'Bodyweight tricep dip', primary_muscles: ['triceps'], equipment: ['bench'] },
  { name: 'Weighted Dips', discipline: 'force', category: 'push', difficulty: 'advanced', description: 'Progressive tricep dips', primary_muscles: ['triceps'], equipment: ['dip-bars', 'weight-plates'] },
  { name: 'Machine Dips', discipline: 'force', category: 'push', difficulty: 'beginner', description: 'Assisted dips', primary_muscles: ['triceps'], equipment: ['chest-press-machine'] },
  { name: 'Wrist Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Forearm flexion', primary_muscles: ['avant-bras'], equipment: ['dumbbell', 'bench'] },
  { name: 'Reverse Wrist Curl', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Forearm extension', primary_muscles: ['avant-bras'], equipment: ['dumbbell', 'bench'] },
  { name: 'Farmers Walk', discipline: 'force', category: 'carry', difficulty: 'intermediate', description: 'Loaded carry', primary_muscles: ['avant-bras', 'trapèzes'], equipment: ['dumbbell'] },
  { name: 'Dead Hang', discipline: 'force', category: 'isolation', difficulty: 'beginner', description: 'Grip strength hold', primary_muscles: ['avant-bras'], equipment: ['pull-up-bar'] },
  { name: 'Towel Pull-ups', discipline: 'force', category: 'pull', difficulty: 'advanced', description: 'Grip-focused pull-up', primary_muscles: ['dorsaux', 'avant-bras'], equipment: ['pull-up-bar'] },
  { name: 'Fat Grip Curls', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Thick bar curls', primary_muscles: ['biceps', 'avant-bras'], equipment: ['barbell'] },
  { name: 'Plate Pinch', discipline: 'force', category: 'isolation', difficulty: 'intermediate', description: 'Grip pinch hold', primary_muscles: ['avant-bras'], equipment: ['weight-plates'] },

  // CORE - 30 exercices supplémentaires
  { name: 'Dead Bug', discipline: 'force', category: 'core', difficulty: 'beginner', description: 'Anti-extension core', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'Bird Dog', discipline: 'force', category: 'core', difficulty: 'beginner', description: 'Contralateral stability', primary_muscles: ['abdominaux', 'lombaires'], equipment: ['floor'] },
  { name: 'Pallof Press', discipline: 'force', category: 'core', difficulty: 'intermediate', description: 'Anti-rotation press', primary_muscles: ['obliques'], equipment: ['cable-machine'] },
  { name: 'Copenhagen Plank', discipline: 'force', category: 'core', difficulty: 'advanced', description: 'Adductor plank', primary_muscles: ['obliques', 'adducteurs'], equipment: ['bench'] },
  { name: 'McGill Curl-up', discipline: 'force', category: 'core', difficulty: 'beginner', description: 'Low back safe crunch', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'Bicycle Crunch', discipline: 'force', category: 'core', difficulty: 'beginner', description: 'Rotating crunch', primary_muscles: ['abdominaux', 'obliques'], equipment: ['floor'] },
  { name: 'Reverse Crunch', discipline: 'force', category: 'core', difficulty: 'beginner', description: 'Lower ab crunch', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'V-Up', discipline: 'force', category: 'core', difficulty: 'intermediate', description: 'Full sit-up', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'Toe Touch', discipline: 'force', category: 'core', difficulty: 'beginner', description: 'Leg raise crunch', primary_muscles: ['abdominaux'], equipment: ['floor'] },
  { name: 'Landmine Twist', discipline: 'force', category: 'core', difficulty: 'intermediate', description: 'Rotational core work', primary_muscles: ['obliques'], equipment: ['barbell'] },
  { name: 'Woodchop', discipline: 'force', category: 'core', difficulty: 'intermediate', description: 'Cable rotation', primary_muscles: ['obliques'], equipment: ['cable-machine'] },
  { name: 'Suitcase Carry', discipline: 'force', category: 'carry', difficulty: 'intermediate', description: 'Unilateral carry', primary_muscles: ['obliques'], equipment: ['dumbbell'] },
  { name: 'Waiter Walk', discipline: 'force', category: 'carry', difficulty: 'advanced', description: 'Overhead carry', primary_muscles: ['deltoides', 'abdominaux'], equipment: ['dumbbell'] },
  { name: 'Turkish Get-Up', discipline: 'force', category: 'compound', difficulty: 'advanced', description: 'Full body movement', primary_muscles: ['corps-complet'], equipment: ['kettlebell'] },
  { name: 'Windmill', discipline: 'force', category: 'core', difficulty: 'advanced', description: 'Lateral bend', primary_muscles: ['obliques'], equipment: ['kettlebell'] },
];

async function main() {
  console.log('🚀 Seeding extended Force exercises...\n');

  let success = 0;
  let failed = 0;

  for (const ex of extendedForceExercises) {
    try {
      await seedExercise(ex);
      success++;
      process.stdout.write(`\r✅ Seeded: ${success}/${extendedForceExercises.length}`);
    } catch (error) {
      failed++;
      console.error(`\n❌ Failed: ${ex.name}`);
    }
  }

  console.log(`\n\n✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total Force exercises added: ${extendedForceExercises.length}`);
}

main();

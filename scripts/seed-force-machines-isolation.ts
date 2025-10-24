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
    discipline: 'force',
    category: ex.category,
    difficulty: ex.difficulty,
    description_short: ex.description,
    movement_pattern: ex.movement_pattern,
    is_validated: true,
    typical_sets_min: ex.sets_min || 3,
    typical_sets_max: ex.sets_max || 4,
    typical_reps_min: ex.reps_min || 10,
    typical_reps_max: ex.reps_max || 15,
    typical_rest_sec: ex.rest_sec || 60,
  }).select().single();

  if (error || !exercise) {
    console.error(`Failed to insert ${ex.name}:`, error?.message);
    return;
  }

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

const machinesIsolationExercises = [
  // CHEST MACHINES - 15 exercises
  { name: 'Machine Chest Press Neutral Grip', category: 'push', difficulty: 'beginner', description: 'Développé machine prise neutre', primary_muscles: ['pectoraux'], secondary_muscles: ['triceps'], equipment: ['machine'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15 },
  { name: 'Machine Chest Press Wide Grip', category: 'push', difficulty: 'beginner', description: 'Développé machine prise large', primary_muscles: ['pectoraux'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Machine Incline Press', category: 'push', difficulty: 'beginner', description: 'Développé incliné machine pectoraux haut', primary_muscles: ['pectoraux'], secondary_muscles: ['deltoides'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Machine Decline Press', category: 'push', difficulty: 'beginner', description: 'Développé décliné machine pectoraux bas', primary_muscles: ['pectoraux'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Pec Deck Machine', category: 'isolation', difficulty: 'beginner', description: 'Butterfly machine isolation pectoraux', primary_muscles: ['pectoraux'], equipment: ['pec-deck'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15 },
  { name: 'Machine Fly High', category: 'isolation', difficulty: 'beginner', description: 'Écartés machine haut pectoraux', primary_muscles: ['pectoraux'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Machine Fly Low', category: 'isolation', difficulty: 'beginner', description: 'Écartés machine bas pectoraux', primary_muscles: ['pectoraux'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Machine Fly Mid', category: 'isolation', difficulty: 'beginner', description: 'Écartés machine milieu pectoraux', primary_muscles: ['pectoraux'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Hammer Strength Chest Press', category: 'push', difficulty: 'intermediate', description: 'Hammer strength unilateral chest', primary_muscles: ['pectoraux'], secondary_muscles: ['triceps'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Hammer Strength Incline Press', category: 'push', difficulty: 'intermediate', description: 'Hammer strength incliné', primary_muscles: ['pectoraux'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Converging Chest Press', category: 'push', difficulty: 'beginner', description: 'Développé machine convergent', primary_muscles: ['pectoraux'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Diverging Chest Press', category: 'push', difficulty: 'beginner', description: 'Développé machine divergent', primary_muscles: ['pectoraux'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Machine Chest Dip', category: 'push', difficulty: 'beginner', description: 'Dips machine assistance', primary_muscles: ['pectoraux', 'triceps'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Seated Chest Press Machine', category: 'push', difficulty: 'beginner', description: 'Développé assis machine', primary_muscles: ['pectoraux'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Machine Chest Fly Reverse', category: 'pull', difficulty: 'beginner', description: 'Butterfly inversé rear delt', primary_muscles: ['deltoides'], secondary_muscles: ['trapèzes'], equipment: ['pec-deck'], movement_pattern: 'pull' },

  // BACK MACHINES - 15 exercises
  { name: 'Lat Pulldown Machine Wide Grip', category: 'pull', difficulty: 'beginner', description: 'Tirage vertical prise large', primary_muscles: ['dorsaux'], equipment: ['lat-pulldown'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15 },
  { name: 'Lat Pulldown Machine Close Grip', category: 'pull', difficulty: 'beginner', description: 'Tirage vertical prise serrée', primary_muscles: ['dorsaux'], secondary_muscles: ['biceps'], equipment: ['lat-pulldown'], movement_pattern: 'pull' },
  { name: 'Lat Pulldown Reverse Grip', category: 'pull', difficulty: 'beginner', description: 'Tirage vertical prise supination', primary_muscles: ['dorsaux', 'biceps'], equipment: ['lat-pulldown'], movement_pattern: 'pull' },
  { name: 'Lat Pulldown Neutral Grip', category: 'pull', difficulty: 'beginner', description: 'Tirage vertical prise neutre', primary_muscles: ['dorsaux'], equipment: ['lat-pulldown'], movement_pattern: 'pull' },
  { name: 'Machine Assisted Pull-Up', category: 'pull', difficulty: 'beginner', description: 'Tractions assistées machine', primary_muscles: ['dorsaux'], secondary_muscles: ['biceps'], equipment: ['machine'], movement_pattern: 'pull' },
  { name: 'Seated Cable Row Machine', category: 'pull', difficulty: 'beginner', description: 'Rowing assis machine câble', primary_muscles: ['dorsaux'], equipment: ['cable-machine'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15 },
  { name: 'Machine Low Row', category: 'pull', difficulty: 'beginner', description: 'Rowing bas machine dorsaux', primary_muscles: ['dorsaux'], equipment: ['machine'], movement_pattern: 'pull' },
  { name: 'Machine High Row', category: 'pull', difficulty: 'beginner', description: 'Rowing haut machine trapèzes', primary_muscles: ['dorsaux', 'trapèzes'], equipment: ['machine'], movement_pattern: 'pull' },
  { name: 'Hammer Strength Row', category: 'pull', difficulty: 'intermediate', description: 'Rowing Hammer Strength unilateral', primary_muscles: ['dorsaux'], equipment: ['machine'], movement_pattern: 'pull' },
  { name: 'T-Bar Row Machine', category: 'pull', difficulty: 'intermediate', description: 'T-bar row machine guidé', primary_muscles: ['dorsaux'], equipment: ['machine'], movement_pattern: 'pull' },
  { name: 'Machine Pullover', category: 'pull', difficulty: 'beginner', description: 'Pullover machine dorsaux', primary_muscles: ['dorsaux'], equipment: ['machine'], movement_pattern: 'pull' },
  { name: 'Machine Shrug', category: 'isolation', difficulty: 'beginner', description: 'Shrugs machine trapèzes', primary_muscles: ['trapèzes'], equipment: ['machine'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 20 },
  { name: 'Machine Rear Delt Row', category: 'pull', difficulty: 'beginner', description: 'Rowing deltoïdes arrière machine', primary_muscles: ['deltoides'], secondary_muscles: ['trapèzes'], equipment: ['machine'], movement_pattern: 'pull' },
  { name: 'Machine Face Pull', category: 'pull', difficulty: 'beginner', description: 'Face pulls machine rear delt', primary_muscles: ['deltoides', 'trapèzes'], equipment: ['machine'], movement_pattern: 'pull' },
  { name: 'Lat Pulldown Behind Neck', category: 'pull', difficulty: 'intermediate', description: 'Tirage nuque machine', primary_muscles: ['dorsaux'], equipment: ['lat-pulldown'], movement_pattern: 'pull' },

  // SHOULDER MACHINES - 12 exercises
  { name: 'Machine Shoulder Press Neutral', category: 'push', difficulty: 'beginner', description: 'Développé épaules machine prise neutre', primary_muscles: ['deltoides'], secondary_muscles: ['triceps'], equipment: ['machine'], movement_pattern: 'vertical push', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15 },
  { name: 'Machine Shoulder Press Pronated', category: 'push', difficulty: 'beginner', description: 'Développé épaules machine pronation', primary_muscles: ['deltoides'], equipment: ['machine'], movement_pattern: 'vertical push' },
  { name: 'Hammer Strength Shoulder Press', category: 'push', difficulty: 'intermediate', description: 'Développé épaules Hammer unilateral', primary_muscles: ['deltoides'], equipment: ['machine'], movement_pattern: 'vertical push' },
  { name: 'Machine Lateral Raise', category: 'isolation', difficulty: 'beginner', description: 'Élévations latérales machine', primary_muscles: ['deltoides'], equipment: ['machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15 },
  { name: 'Machine Front Raise', category: 'isolation', difficulty: 'beginner', description: 'Élévations frontales machine', primary_muscles: ['deltoides'], equipment: ['machine'], movement_pattern: 'isolation' },
  { name: 'Machine Reverse Fly', category: 'isolation', difficulty: 'beginner', description: 'Écartés inversés machine rear delt', primary_muscles: ['deltoides'], equipment: ['machine'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15 },
  { name: 'Machine Upright Row', category: 'pull', difficulty: 'beginner', description: 'Rowing vertical machine', primary_muscles: ['deltoides', 'trapèzes'], equipment: ['machine'], movement_pattern: 'pull' },
  { name: 'Smith Machine Overhead Press', category: 'push', difficulty: 'intermediate', description: 'Développé militaire Smith guidé', primary_muscles: ['deltoides'], secondary_muscles: ['triceps'], equipment: ['smith-machine'], movement_pattern: 'vertical push' },
  { name: 'Smith Machine Behind Neck Press', category: 'push', difficulty: 'intermediate', description: 'Développé nuque Smith machine', primary_muscles: ['deltoides'], equipment: ['smith-machine'], movement_pattern: 'vertical push' },
  { name: 'Machine Shoulder Fly', category: 'isolation', difficulty: 'beginner', description: 'Écartés épaules machine', primary_muscles: ['deltoides'], equipment: ['machine'], movement_pattern: 'isolation' },
  { name: 'Seated Machine Press', category: 'push', difficulty: 'beginner', description: 'Développé assis machine verticale', primary_muscles: ['deltoides'], equipment: ['machine'], movement_pattern: 'vertical push' },
  { name: 'Machine Arnold Press', category: 'push', difficulty: 'intermediate', description: 'Arnold press machine rotation', primary_muscles: ['deltoides'], equipment: ['machine'], movement_pattern: 'vertical push' },

  // LEG MACHINES - 25 exercises
  { name: 'Leg Press 45 Degree', category: 'squat', difficulty: 'beginner', description: 'Presse jambes 45 degrés', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['leg-press'], movement_pattern: 'squat', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15 },
  { name: 'Leg Press Vertical', category: 'squat', difficulty: 'intermediate', description: 'Presse jambes verticale', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['leg-press'], movement_pattern: 'squat' },
  { name: 'Leg Press Narrow Stance', category: 'squat', difficulty: 'beginner', description: 'Presse jambes stance étroite', primary_muscles: ['quadriceps'], equipment: ['leg-press'], movement_pattern: 'squat' },
  { name: 'Leg Press Wide Stance', category: 'squat', difficulty: 'beginner', description: 'Presse jambes stance large', primary_muscles: ['fessiers', 'adducteurs'], equipment: ['leg-press'], movement_pattern: 'squat' },
  { name: 'Leg Press Single Leg', category: 'squat', difficulty: 'intermediate', description: 'Presse jambe unilat érale', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['leg-press'], movement_pattern: 'squat' },
  { name: 'Hack Squat Machine', category: 'squat', difficulty: 'intermediate', description: 'Hack squat machine quadriceps', primary_muscles: ['quadriceps'], secondary_muscles: ['fessiers'], equipment: ['hack-squat'], movement_pattern: 'squat', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12 },
  { name: 'Hack Squat Reverse', category: 'hinge', difficulty: 'intermediate', description: 'Hack squat inversé fessiers', primary_muscles: ['fessiers', 'ischiojambiers'], equipment: ['hack-squat'], movement_pattern: 'hinge' },
  { name: 'Sissy Squat Machine', category: 'squat', difficulty: 'advanced', description: 'Sissy squat machine quadriceps', primary_muscles: ['quadriceps'], equipment: ['machine'], movement_pattern: 'squat' },
  { name: 'Smith Machine Squat', category: 'squat', difficulty: 'beginner', description: 'Squat Smith machine guidé', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['smith-machine'], movement_pattern: 'squat' },
  { name: 'Smith Machine Front Squat', category: 'squat', difficulty: 'intermediate', description: 'Front squat Smith quadriceps', primary_muscles: ['quadriceps'], equipment: ['smith-machine'], movement_pattern: 'squat' },
  { name: 'Smith Machine Bulgarian Split', category: 'squat', difficulty: 'intermediate', description: 'Bulgarian Smith unilatéral', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['smith-machine', 'bench'], movement_pattern: 'squat' },
  { name: 'Leg Extension Machine', category: 'isolation', difficulty: 'beginner', description: 'Extensions jambes machine quadriceps', primary_muscles: ['quadriceps'], equipment: ['leg-extension'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 20 },
  { name: 'Leg Extension Single Leg', category: 'isolation', difficulty: 'beginner', description: 'Extension jambe unilatérale', primary_muscles: ['quadriceps'], equipment: ['leg-extension'], movement_pattern: 'isolation' },
  { name: 'Lying Leg Curl', category: 'isolation', difficulty: 'beginner', description: 'Leg curl allongé ischiojambiers', primary_muscles: ['ischiojambiers'], equipment: ['leg-curl'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15 },
  { name: 'Seated Leg Curl', category: 'isolation', difficulty: 'beginner', description: 'Leg curl assis ischiojambiers', primary_muscles: ['ischiojambiers'], equipment: ['leg-curl'], movement_pattern: 'isolation' },
  { name: 'Standing Leg Curl', category: 'isolation', difficulty: 'beginner', description: 'Leg curl debout unilatéral', primary_muscles: ['ischiojambiers'], equipment: ['leg-curl'], movement_pattern: 'isolation' },
  { name: 'Hip Abduction Machine', category: 'isolation', difficulty: 'beginner', description: 'Abduction hanches machine fessiers', primary_muscles: ['fessiers'], equipment: ['machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 15, reps_max: 20 },
  { name: 'Hip Adduction Machine', category: 'isolation', difficulty: 'beginner', description: 'Adduction hanches machine adducteurs', primary_muscles: ['adducteurs'], equipment: ['machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 15, reps_max: 20 },
  { name: 'Glute Kickback Machine', category: 'isolation', difficulty: 'beginner', description: 'Kickbacks fessiers machine', primary_muscles: ['fessiers'], equipment: ['machine'], movement_pattern: 'hinge' },
  { name: 'Hip Thrust Machine', category: 'hinge', difficulty: 'intermediate', description: 'Hip thrust machine fessiers', primary_muscles: ['fessiers'], secondary_muscles: ['ischiojambiers'], equipment: ['machine'], movement_pattern: 'hinge', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15 },
  { name: 'Standing Calf Raise Machine', category: 'isolation', difficulty: 'beginner', description: 'Mollets debout machine', primary_muscles: ['mollets'], equipment: ['calf-machine'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 15, reps_max: 25 },
  { name: 'Seated Calf Raise Machine', category: 'isolation', difficulty: 'beginner', description: 'Mollets assis machine soléaire', primary_muscles: ['mollets'], equipment: ['calf-machine'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 15, reps_max: 25 },
  { name: 'Leg Press Calf Raise', category: 'isolation', difficulty: 'beginner', description: 'Mollets presse jambes', primary_muscles: ['mollets'], equipment: ['leg-press'], movement_pattern: 'isolation' },
  { name: 'Donkey Calf Raise Machine', category: 'isolation', difficulty: 'intermediate', description: 'Mollets donkey machine', primary_muscles: ['mollets'], equipment: ['calf-machine'], movement_pattern: 'isolation' },
  { name: 'Smith Machine Calf Raise', category: 'isolation', difficulty: 'beginner', description: 'Mollets Smith machine', primary_muscles: ['mollets'], equipment: ['smith-machine'], movement_pattern: 'isolation' },

  // ARM MACHINES - 18 exercises
  { name: 'Preacher Curl Machine', category: 'isolation', difficulty: 'beginner', description: 'Curls pupitre machine biceps', primary_muscles: ['biceps'], equipment: ['machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15 },
  { name: 'Machine Bicep Curl', category: 'isolation', difficulty: 'beginner', description: 'Curls biceps machine', primary_muscles: ['biceps'], equipment: ['machine'], movement_pattern: 'isolation' },
  { name: 'Machine Hammer Curl', category: 'isolation', difficulty: 'beginner', description: 'Curls marteau machine', primary_muscles: ['biceps', 'avant-bras'], equipment: ['machine'], movement_pattern: 'isolation' },
  { name: 'Machine Concentration Curl', category: 'isolation', difficulty: 'beginner', description: 'Curls concentration machine', primary_muscles: ['biceps'], equipment: ['machine'], movement_pattern: 'isolation' },
  { name: 'Cable Bicep Curl High Pulley', category: 'isolation', difficulty: 'beginner', description: 'Curls câble poulie haute', primary_muscles: ['biceps'], equipment: ['cable-machine'], movement_pattern: 'isolation' },
  { name: 'Cable Bicep Curl Low Pulley', category: 'isolation', difficulty: 'beginner', description: 'Curls câble poulie basse', primary_muscles: ['biceps'], equipment: ['cable-machine'], movement_pattern: 'isolation' },
  { name: 'Machine Tricep Extension', category: 'isolation', difficulty: 'beginner', description: 'Extensions triceps machine', primary_muscles: ['triceps'], equipment: ['machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15 },
  { name: 'Machine Tricep Dip', category: 'push', difficulty: 'beginner', description: 'Dips triceps machine assistée', primary_muscles: ['triceps'], secondary_muscles: ['pectoraux'], equipment: ['machine'], movement_pattern: 'horizontal push' },
  { name: 'Cable Tricep Pushdown Rope', category: 'isolation', difficulty: 'beginner', description: 'Pushdowns triceps corde', primary_muscles: ['triceps'], equipment: ['cable-machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15 },
  { name: 'Cable Tricep Pushdown Bar', category: 'isolation', difficulty: 'beginner', description: 'Pushdowns triceps barre', primary_muscles: ['triceps'], equipment: ['cable-machine'], movement_pattern: 'isolation' },
  { name: 'Cable Tricep Pushdown Reverse Grip', category: 'isolation', difficulty: 'beginner', description: 'Pushdowns triceps supination', primary_muscles: ['triceps'], equipment: ['cable-machine'], movement_pattern: 'isolation' },
  { name: 'Cable Overhead Tricep Extension', category: 'isolation', difficulty: 'beginner', description: 'Extensions triceps câble overhead', primary_muscles: ['triceps'], equipment: ['cable-machine'], movement_pattern: 'isolation' },
  { name: 'Machine Wrist Curl', category: 'isolation', difficulty: 'beginner', description: 'Curls poignets machine avant-bras', primary_muscles: ['avant-bras'], equipment: ['machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 15, reps_max: 20 },
  { name: 'Cable Wrist Curl', category: 'isolation', difficulty: 'beginner', description: 'Curls poignets câble', primary_muscles: ['avant-bras'], equipment: ['cable-machine'], movement_pattern: 'isolation' },
  { name: 'Cable Reverse Wrist Curl', category: 'isolation', difficulty: 'beginner', description: 'Curls poignets inversés câble', primary_muscles: ['avant-bras'], equipment: ['cable-machine'], movement_pattern: 'isolation' },
  { name: 'Cable Hammer Curl', category: 'isolation', difficulty: 'beginner', description: 'Curls marteau câble', primary_muscles: ['biceps', 'avant-bras'], equipment: ['cable-machine'], movement_pattern: 'isolation' },
  { name: 'Cable Preacher Curl', category: 'isolation', difficulty: 'beginner', description: 'Curls pupitre câble', primary_muscles: ['biceps'], equipment: ['cable-machine', 'preacher-bench'], movement_pattern: 'isolation' },
  { name: 'Smith Machine Close Grip Bench', category: 'push', difficulty: 'intermediate', description: 'Développé prise serrée Smith triceps', primary_muscles: ['triceps'], secondary_muscles: ['pectoraux'], equipment: ['smith-machine'], movement_pattern: 'horizontal push' },

  // CORE MACHINES - 15 exercises
  { name: 'Machine Crunch', category: 'core', difficulty: 'beginner', description: 'Crunchs machine abdominaux', primary_muscles: ['abdominaux'], equipment: ['machine'], movement_pattern: 'core', sets_min: 3, sets_max: 4, reps_min: 15, reps_max: 25 },
  { name: 'Machine Rotation', category: 'core', difficulty: 'beginner', description: 'Rotations machine obliques', primary_muscles: ['obliques'], equipment: ['machine'], movement_pattern: 'core', sets_min: 3, sets_max: 4, reps_min: 15, reps_max: 20 },
  { name: 'Machine Side Bend', category: 'isolation', difficulty: 'beginner', description: 'Flexions latérales machine obliques', primary_muscles: ['obliques'], equipment: ['machine'], movement_pattern: 'isolation' },
  { name: 'Machine Leg Raise', category: 'core', difficulty: 'beginner', description: 'Relevés jambes machine abdos bas', primary_muscles: ['abdominaux'], equipment: ['machine'], movement_pattern: 'core' },
  { name: 'Cable Crunch', category: 'core', difficulty: 'beginner', description: 'Crunchs câble abdominaux', primary_muscles: ['abdominaux'], equipment: ['cable-machine'], movement_pattern: 'core', sets_min: 3, sets_max: 4, reps_min: 15, reps_max: 25 },
  { name: 'Cable Wood Chop High to Low', category: 'core', difficulty: 'intermediate', description: 'Wood chops câble haut-bas obliques', primary_muscles: ['obliques'], secondary_muscles: ['abdominaux'], equipment: ['cable-machine'], movement_pattern: 'core' },
  { name: 'Cable Wood Chop Low to High', category: 'core', difficulty: 'intermediate', description: 'Wood chops câble bas-haut obliques', primary_muscles: ['obliques'], equipment: ['cable-machine'], movement_pattern: 'core' },
  { name: 'Cable Russian Twist', category: 'core', difficulty: 'intermediate', description: 'Russian twists câble obliques', primary_muscles: ['obliques'], equipment: ['cable-machine'], movement_pattern: 'core' },
  { name: 'Cable Side Bend', category: 'isolation', difficulty: 'beginner', description: 'Flexions latérales câble', primary_muscles: ['obliques'], equipment: ['cable-machine'], movement_pattern: 'isolation' },
  { name: 'Machine Back Extension', category: 'hinge', difficulty: 'beginner', description: 'Extensions lombaires machine', primary_muscles: ['dorsaux'], secondary_muscles: ['fessiers', 'ischiojambiers'], equipment: ['machine'], movement_pattern: 'hinge', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 20 },
  { name: 'Machine Hyperextension', category: 'hinge', difficulty: 'beginner', description: 'Hyperextensions machine lombaires', primary_muscles: ['dorsaux', 'fessiers'], equipment: ['hyperextension-bench'], movement_pattern: 'hinge' },
  { name: 'Cable Pallof Press', category: 'core', difficulty: 'intermediate', description: 'Pallof press câble anti-rotation', primary_muscles: ['obliques', 'abdominaux'], equipment: ['cable-machine'], movement_pattern: 'core', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15 },
  { name: 'Machine Torso Rotation', category: 'core', difficulty: 'beginner', description: 'Rotations torse machine obliques', primary_muscles: ['obliques'], equipment: ['machine'], movement_pattern: 'core' },
  { name: 'Cable Knee Raise', category: 'core', difficulty: 'intermediate', description: 'Relevés genoux câble abdos bas', primary_muscles: ['abdominaux'], equipment: ['cable-machine'], movement_pattern: 'core' },
  { name: 'Machine Ab Coaster', category: 'core', difficulty: 'intermediate', description: 'Ab coaster machine abdos complet', primary_muscles: ['abdominaux'], equipment: ['machine'], movement_pattern: 'core' },
];

async function main() {
  console.log('🏋️ Starting Force Machines Isolation exercises seeding...\n');

  let success = 0;
  let failed = 0;

  for (const ex of machinesIsolationExercises) {
    try {
      await seedExercise(ex);
      success++;
      process.stdout.write(`\r✅ Seeded: ${success}/${machinesIsolationExercises.length}`);
    } catch (error) {
      failed++;
      console.error(`\n❌ Failed: ${ex.name}`, error);
    }
  }

  console.log(`\n\n✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${machinesIsolationExercises.length}`);
  console.log(`\n🎯 Force Machines Isolation exercises seeded!`);
}

main();

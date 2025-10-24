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
    typical_sets_max: ex.sets_max || 5,
    typical_reps_min: ex.reps_min || 8,
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

const bodybuildingTechniquesExercises = [
  // DROP SETS - 15 exercises
  { name: 'Dumbbell Chest Press Drop Set', category: 'push', difficulty: 'intermediate', description: 'Développé haltères avec dégressif 3 charges', primary_muscles: ['pectoraux'], secondary_muscles: ['triceps', 'deltoides'], equipment: ['dumbbell', 'bench'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 90 },
  { name: 'Cable Fly Drop Set', category: 'isolation', difficulty: 'intermediate', description: 'Écartés câble dégressif 3 poids', primary_muscles: ['pectoraux'], equipment: ['cable-machine'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 60 },
  { name: 'Lateral Raise Drop Set', category: 'isolation', difficulty: 'intermediate', description: 'Élévations latérales dégressives', primary_muscles: ['deltoides'], equipment: ['dumbbell'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 60 },
  { name: 'Bicep Curl Drop Set', category: 'isolation', difficulty: 'beginner', description: 'Curls biceps dégressifs 3 haltères', primary_muscles: ['biceps'], equipment: ['dumbbell'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 60 },
  { name: 'Tricep Pushdown Drop Set', category: 'isolation', difficulty: 'beginner', description: 'Pushdowns triceps dégressifs câble', primary_muscles: ['triceps'], equipment: ['cable-machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 60 },
  { name: 'Leg Extension Drop Set', category: 'isolation', difficulty: 'beginner', description: 'Extensions jambes dégressives machine', primary_muscles: ['quadriceps'], equipment: ['leg-extension'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 20, rest_sec: 60 },
  { name: 'Leg Curl Drop Set', category: 'isolation', difficulty: 'beginner', description: 'Leg curls dégressifs ischiojambiers', primary_muscles: ['ischiojambiers'], equipment: ['leg-curl'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 20, rest_sec: 60 },
  { name: 'Cable Crossover Drop Set', category: 'isolation', difficulty: 'intermediate', description: 'Crossovers câble dégressifs pectoraux', primary_muscles: ['pectoraux'], equipment: ['cable-machine'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15, rest_sec: 60 },
  { name: 'Machine Shoulder Press Drop Set', category: 'push', difficulty: 'intermediate', description: 'Développé épaules machine dégressif', primary_muscles: ['deltoides'], secondary_muscles: ['triceps'], equipment: ['machine'], movement_pattern: 'vertical push', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 90 },
  { name: 'Seated Calf Raise Drop Set', category: 'isolation', difficulty: 'beginner', description: 'Mollets assis dégressifs', primary_muscles: ['mollets'], equipment: ['calf-machine'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 15, reps_max: 25, rest_sec: 45 },
  { name: 'Dumbbell Row Drop Set', category: 'pull', difficulty: 'intermediate', description: 'Rowing haltère unilatéral dégressif', primary_muscles: ['dorsaux'], equipment: ['dumbbell', 'bench'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 60 },
  { name: 'Lat Pulldown Drop Set', category: 'pull', difficulty: 'beginner', description: 'Tirage vertical dégressif', primary_muscles: ['dorsaux'], equipment: ['lat-pulldown'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 60 },
  { name: 'Preacher Curl Drop Set', category: 'isolation', difficulty: 'intermediate', description: 'Curls pupitre dégressifs', primary_muscles: ['biceps'], equipment: ['preacher-bench', 'ez-bar'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 60 },
  { name: 'Rope Tricep Extension Drop Set', category: 'isolation', difficulty: 'intermediate', description: 'Extensions triceps corde dégressives', primary_muscles: ['triceps'], equipment: ['cable-machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 60 },
  { name: 'Pec Deck Drop Set', category: 'isolation', difficulty: 'beginner', description: 'Pec deck dégressif pectoraux', primary_muscles: ['pectoraux'], equipment: ['pec-deck'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15, rest_sec: 60 },

  // SUPERSETS - 20 exercises
  { name: 'Bench Press + Dumbbell Fly Superset', category: 'push', difficulty: 'intermediate', description: 'Superset développé couché et écartés', primary_muscles: ['pectoraux'], secondary_muscles: ['triceps'], equipment: ['barbell', 'dumbbell', 'bench'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 90 },
  { name: 'Pulldown + Cable Row Superset', category: 'pull', difficulty: 'intermediate', description: 'Superset tirage vertical et horizontal', primary_muscles: ['dorsaux'], equipment: ['lat-pulldown', 'cable-machine'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 12, rest_sec: 90 },
  { name: 'Overhead Press + Lateral Raise Superset', category: 'push', difficulty: 'intermediate', description: 'Superset développé militaire et élévations', primary_muscles: ['deltoides'], secondary_muscles: ['triceps'], equipment: ['dumbbell'], movement_pattern: 'vertical push', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 90 },
  { name: 'Squat + Leg Curl Superset', category: 'squat', difficulty: 'advanced', description: 'Superset squat et leg curl antagoniste', primary_muscles: ['quadriceps', 'ischiojambiers'], equipment: ['barbell', 'squat-rack', 'leg-curl'], movement_pattern: 'squat', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 120 },
  { name: 'Bicep Curl + Tricep Pushdown Superset', category: 'isolation', difficulty: 'beginner', description: 'Superset bras antagonistes', primary_muscles: ['biceps', 'triceps'], equipment: ['dumbbell', 'cable-machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 60 },
  { name: 'Leg Press + Walking Lunge Superset', category: 'squat', difficulty: 'intermediate', description: 'Superset presse et fentes', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['leg-press'], movement_pattern: 'squat', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 90 },
  { name: 'Incline Press + Cable Fly Superset', category: 'push', difficulty: 'intermediate', description: 'Superset incliné pectoraux haut', primary_muscles: ['pectoraux'], secondary_muscles: ['deltoides'], equipment: ['dumbbell', 'incline-bench', 'cable-machine'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 12, rest_sec: 90 },
  { name: 'Romanian Deadlift + Leg Extension Superset', category: 'hinge', difficulty: 'intermediate', description: 'Superset RDL et extension jambes', primary_muscles: ['ischiojambiers', 'quadriceps'], equipment: ['barbell', 'leg-extension'], movement_pattern: 'hinge', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 12, rest_sec: 90 },
  { name: 'Front Raise + Rear Delt Fly Superset', category: 'isolation', difficulty: 'beginner', description: 'Superset deltoïdes avant et arrière', primary_muscles: ['deltoides'], equipment: ['dumbbell'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15, rest_sec: 60 },
  { name: 'Hammer Curl + Reverse Curl Superset', category: 'isolation', difficulty: 'beginner', description: 'Superset curls biceps variations', primary_muscles: ['biceps', 'avant-bras'], equipment: ['dumbbell'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 60 },
  { name: 'Close Grip Bench + Overhead Extension Superset', category: 'push', difficulty: 'intermediate', description: 'Superset triceps 2 angles', primary_muscles: ['triceps'], secondary_muscles: ['pectoraux'], equipment: ['barbell', 'bench', 'dumbbell'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 90 },
  { name: 'Barbell Row + Shrug Superset', category: 'pull', difficulty: 'intermediate', description: 'Superset rowing et shrugs dos', primary_muscles: ['dorsaux', 'trapèzes'], equipment: ['barbell'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 90 },
  { name: 'Leg Curl + Glute Bridge Superset', category: 'hinge', difficulty: 'beginner', description: 'Superset chaîne postérieure', primary_muscles: ['ischiojambiers', 'fessiers'], equipment: ['leg-curl', 'floor'], movement_pattern: 'hinge', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15, rest_sec: 60 },
  { name: 'Cable Pullover + Straight Arm Pushdown Superset', category: 'pull', difficulty: 'intermediate', description: 'Superset dorsaux bras tendus', primary_muscles: ['dorsaux'], equipment: ['cable-machine'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15, rest_sec: 60 },
  { name: 'Dumbbell Pullover + Dumbbell Press Superset', category: 'push', difficulty: 'intermediate', description: 'Superset pectoraux amplitude maximale', primary_muscles: ['pectoraux'], equipment: ['dumbbell', 'bench'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 12, rest_sec: 90 },
  { name: 'Arnold Press + Face Pull Superset', category: 'push', difficulty: 'intermediate', description: 'Superset épaules complet', primary_muscles: ['deltoides'], secondary_muscles: ['trapèzes'], equipment: ['dumbbell', 'cable-machine'], movement_pattern: 'vertical push', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 12, rest_sec: 90 },
  { name: 'Goblet Squat + Calf Raise Superset', category: 'squat', difficulty: 'beginner', description: 'Superset jambes quadri et mollets', primary_muscles: ['quadriceps', 'mollets'], equipment: ['dumbbell'], movement_pattern: 'squat', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15, rest_sec: 60 },
  { name: 'Chest Dip + Push-Up Superset', category: 'push', difficulty: 'intermediate', description: 'Superset dips et pompes pectoraux', primary_muscles: ['pectoraux', 'triceps'], equipment: ['dip-bars', 'floor'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 15, rest_sec: 90 },
  { name: 'Pull-Up + Inverted Row Superset', category: 'pull', difficulty: 'intermediate', description: 'Superset tractions et rows poids corps', primary_muscles: ['dorsaux'], equipment: ['pull-up-bar', 'bar'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 6, reps_max: 12, rest_sec: 90 },
  { name: 'Standing Calf Raise + Seated Calf Raise Superset', category: 'isolation', difficulty: 'beginner', description: 'Superset mollets debout et assis', primary_muscles: ['mollets'], equipment: ['calf-machine'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 15, reps_max: 20, rest_sec: 60 },

  // GIANT SETS - 10 exercises
  { name: 'Chest Giant Set 4 Exercises', category: 'push', difficulty: 'advanced', description: 'Giant set 4 exos pectoraux sans pause', primary_muscles: ['pectoraux'], secondary_muscles: ['triceps', 'deltoides'], equipment: ['barbell', 'dumbbell', 'cable-machine', 'bench'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 120 },
  { name: 'Back Giant Set 4 Exercises', category: 'pull', difficulty: 'advanced', description: 'Giant set 4 exos dorsaux', primary_muscles: ['dorsaux'], secondary_muscles: ['trapèzes', 'biceps'], equipment: ['barbell', 'cable-machine', 'dumbbell'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 120 },
  { name: 'Shoulder Giant Set 4 Exercises', category: 'push', difficulty: 'advanced', description: 'Giant set deltoïdes 4 angles', primary_muscles: ['deltoides'], equipment: ['dumbbell', 'cable-machine'], movement_pattern: 'vertical push', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 120 },
  { name: 'Leg Giant Set 4 Exercises', category: 'squat', difficulty: 'advanced', description: 'Giant set jambes quadri-fessiers-ichio', primary_muscles: ['quadriceps', 'fessiers', 'ischiojambiers'], equipment: ['barbell', 'squat-rack', 'leg-press', 'leg-curl'], movement_pattern: 'squat', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 180 },
  { name: 'Arm Giant Set 4 Exercises', category: 'isolation', difficulty: 'intermediate', description: 'Giant set bras biceps-triceps complet', primary_muscles: ['biceps', 'triceps'], equipment: ['dumbbell', 'cable-machine', 'ez-bar'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 90 },
  { name: 'Quad Giant Set 4 Exercises', category: 'squat', difficulty: 'advanced', description: 'Giant set quadriceps isolation', primary_muscles: ['quadriceps'], equipment: ['leg-press', 'leg-extension', 'squat-rack'], movement_pattern: 'squat', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 20, rest_sec: 120 },
  { name: 'Hamstring Giant Set 4 Exercises', category: 'hinge', difficulty: 'advanced', description: 'Giant set ischiojambiers complet', primary_muscles: ['ischiojambiers'], secondary_muscles: ['fessiers'], equipment: ['barbell', 'leg-curl', 'glute-ham-bench'], movement_pattern: 'hinge', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 120 },
  { name: 'Delt Giant Set 3 Heads', category: 'isolation', difficulty: 'advanced', description: 'Giant set 3 faisceaux deltoïdes', primary_muscles: ['deltoides'], equipment: ['dumbbell', 'cable-machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 15, rest_sec: 90 },
  { name: 'Tricep Giant Set 4 Exercises', category: 'isolation', difficulty: 'intermediate', description: 'Giant set triceps 4 angles', primary_muscles: ['triceps'], equipment: ['cable-machine', 'dumbbell', 'dip-bars'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 90 },
  { name: 'Bicep Giant Set 4 Exercises', category: 'isolation', difficulty: 'intermediate', description: 'Giant set biceps 4 grips', primary_muscles: ['biceps'], equipment: ['barbell', 'dumbbell', 'cable-machine', 'ez-bar'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 12, rest_sec: 90 },

  // REST-PAUSE - 12 exercises
  { name: 'Bench Press Rest-Pause', category: 'push', difficulty: 'advanced', description: 'Développé couché rest-pause 20 sec', primary_muscles: ['pectoraux'], secondary_muscles: ['triceps'], equipment: ['barbell', 'bench'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 6, reps_max: 10, rest_sec: 180 },
  { name: 'Squat Rest-Pause', category: 'squat', difficulty: 'advanced', description: 'Squat rest-pause intensité maximale', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['barbell', 'squat-rack'], movement_pattern: 'squat', sets_min: 3, sets_max: 4, reps_min: 6, reps_max: 10, rest_sec: 180 },
  { name: 'Deadlift Rest-Pause', category: 'hinge', difficulty: 'elite', description: 'Soulevé de terre rest-pause', primary_muscles: ['fessiers', 'ischiojambiers', 'dorsaux'], equipment: ['barbell'], movement_pattern: 'hinge', sets_min: 2, sets_max: 3, reps_min: 5, reps_max: 8, rest_sec: 240 },
  { name: 'Overhead Press Rest-Pause', category: 'push', difficulty: 'advanced', description: 'Développé militaire rest-pause', primary_muscles: ['deltoides'], secondary_muscles: ['triceps'], equipment: ['barbell'], movement_pattern: 'vertical push', sets_min: 3, sets_max: 4, reps_min: 6, reps_max: 10, rest_sec: 180 },
  { name: 'Leg Press Rest-Pause', category: 'squat', difficulty: 'advanced', description: 'Presse jambes rest-pause sécurisé', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['leg-press'], movement_pattern: 'squat', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 120 },
  { name: 'Lat Pulldown Rest-Pause', category: 'pull', difficulty: 'intermediate', description: 'Tirage vertical rest-pause dorsaux', primary_muscles: ['dorsaux'], equipment: ['lat-pulldown'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 90 },
  { name: 'Dumbbell Curl Rest-Pause', category: 'isolation', difficulty: 'intermediate', description: 'Curls haltères rest-pause biceps', primary_muscles: ['biceps'], equipment: ['dumbbell'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 90 },
  { name: 'Machine Fly Rest-Pause', category: 'isolation', difficulty: 'intermediate', description: 'Écartés machine rest-pause pectoraux', primary_muscles: ['pectoraux'], equipment: ['pec-deck'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 90 },
  { name: 'Cable Lateral Raise Rest-Pause', category: 'isolation', difficulty: 'intermediate', description: 'Élévations latérales rest-pause', primary_muscles: ['deltoides'], equipment: ['cable-machine'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 10, reps_max: 15, rest_sec: 60 },
  { name: 'Leg Extension Rest-Pause', category: 'isolation', difficulty: 'intermediate', description: 'Extensions jambes rest-pause quadriceps', primary_muscles: ['quadriceps'], equipment: ['leg-extension'], movement_pattern: 'isolation', sets_min: 3, sets_max: 4, reps_min: 12, reps_max: 20, rest_sec: 60 },
  { name: 'Tricep Dip Rest-Pause', category: 'push', difficulty: 'advanced', description: 'Dips triceps rest-pause', primary_muscles: ['triceps'], secondary_muscles: ['pectoraux'], equipment: ['dip-bars'], movement_pattern: 'horizontal push', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 120 },
  { name: 'Cable Row Rest-Pause', category: 'pull', difficulty: 'intermediate', description: 'Rowing câble rest-pause dorsaux', primary_muscles: ['dorsaux'], equipment: ['cable-machine'], movement_pattern: 'pull', sets_min: 3, sets_max: 4, reps_min: 8, reps_max: 12, rest_sec: 90 },

  // FST-7 & GERMAN VOLUME - 10 exercises
  { name: 'Bicep Curl FST-7', category: 'isolation', difficulty: 'intermediate', description: 'Curls biceps FST-7 7 sets 30 sec repos', primary_muscles: ['biceps'], equipment: ['dumbbell'], movement_pattern: 'isolation', sets_min: 7, sets_max: 7, reps_min: 10, reps_max: 12, rest_sec: 30 },
  { name: 'Cable Fly FST-7', category: 'isolation', difficulty: 'intermediate', description: 'Écartés câble FST-7 congestion pectoraux', primary_muscles: ['pectoraux'], equipment: ['cable-machine'], movement_pattern: 'horizontal push', sets_min: 7, sets_max: 7, reps_min: 10, reps_max: 12, rest_sec: 30 },
  { name: 'Lateral Raise FST-7', category: 'isolation', difficulty: 'intermediate', description: 'Élévations latérales FST-7 deltoïdes', primary_muscles: ['deltoides'], equipment: ['dumbbell'], movement_pattern: 'isolation', sets_min: 7, sets_max: 7, reps_min: 10, reps_max: 12, rest_sec: 30 },
  { name: 'Leg Extension FST-7', category: 'isolation', difficulty: 'intermediate', description: 'Extensions jambes FST-7 quadriceps', primary_muscles: ['quadriceps'], equipment: ['leg-extension'], movement_pattern: 'isolation', sets_min: 7, sets_max: 7, reps_min: 12, reps_max: 15, rest_sec: 30 },
  { name: 'Tricep Pushdown FST-7', category: 'isolation', difficulty: 'intermediate', description: 'Pushdowns triceps FST-7', primary_muscles: ['triceps'], equipment: ['cable-machine'], movement_pattern: 'isolation', sets_min: 7, sets_max: 7, reps_min: 10, reps_max: 12, rest_sec: 30 },
  { name: 'Squat German Volume Training', category: 'squat', difficulty: 'advanced', description: 'Squat GVT 10x10 60 sec repos', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['barbell', 'squat-rack'], movement_pattern: 'squat', sets_min: 10, sets_max: 10, reps_min: 10, reps_max: 10, rest_sec: 60 },
  { name: 'Bench Press German Volume Training', category: 'push', difficulty: 'advanced', description: 'Développé couché GVT 10x10', primary_muscles: ['pectoraux'], secondary_muscles: ['triceps'], equipment: ['barbell', 'bench'], movement_pattern: 'horizontal push', sets_min: 10, sets_max: 10, reps_min: 10, reps_max: 10, rest_sec: 60 },
  { name: 'Barbell Row German Volume Training', category: 'pull', difficulty: 'advanced', description: 'Rowing barre GVT 10x10 dorsaux', primary_muscles: ['dorsaux'], equipment: ['barbell'], movement_pattern: 'pull', sets_min: 10, sets_max: 10, reps_min: 10, reps_max: 10, rest_sec: 60 },
  { name: 'Overhead Press German Volume Training', category: 'push', difficulty: 'advanced', description: 'Développé militaire GVT 10x10', primary_muscles: ['deltoides'], secondary_muscles: ['triceps'], equipment: ['barbell'], movement_pattern: 'vertical push', sets_min: 10, sets_max: 10, reps_min: 10, reps_max: 10, rest_sec: 60 },
  { name: 'Romanian Deadlift German Volume Training', category: 'hinge', difficulty: 'advanced', description: 'RDL GVT 10x10 ischiojambiers', primary_muscles: ['ischiojambiers', 'fessiers'], equipment: ['barbell'], movement_pattern: 'hinge', sets_min: 10, sets_max: 10, reps_min: 10, reps_max: 10, rest_sec: 60 },

  // BLOOD FLOW RESTRICTION - 13 exercises
  { name: 'BFR Bicep Curl', category: 'isolation', difficulty: 'intermediate', description: 'Curls biceps avec BFR bands légères', primary_muscles: ['biceps'], equipment: ['dumbbell', 'bfr-bands'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 15, reps_max: 30, rest_sec: 30 },
  { name: 'BFR Tricep Extension', category: 'isolation', difficulty: 'intermediate', description: 'Extensions triceps BFR', primary_muscles: ['triceps'], equipment: ['dumbbell', 'bfr-bands'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 15, reps_max: 30, rest_sec: 30 },
  { name: 'BFR Leg Extension', category: 'isolation', difficulty: 'intermediate', description: 'Extensions jambes BFR quadriceps', primary_muscles: ['quadriceps'], equipment: ['leg-extension', 'bfr-bands'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 20, reps_max: 40, rest_sec: 30 },
  { name: 'BFR Leg Curl', category: 'isolation', difficulty: 'intermediate', description: 'Leg curls BFR ischiojambiers', primary_muscles: ['ischiojambiers'], equipment: ['leg-curl', 'bfr-bands'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 20, reps_max: 40, rest_sec: 30 },
  { name: 'BFR Bodyweight Squat', category: 'squat', difficulty: 'beginner', description: 'Squats poids corps BFR', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['bfr-bands', 'floor'], movement_pattern: 'squat', sets_min: 4, sets_max: 5, reps_min: 20, reps_max: 40, rest_sec: 30 },
  { name: 'BFR Walking Lunge', category: 'squat', difficulty: 'intermediate', description: 'Fentes marchées BFR jambes', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['bfr-bands'], movement_pattern: 'squat', sets_min: 3, sets_max: 4, reps_min: 15, reps_max: 30, rest_sec: 45 },
  { name: 'BFR Calf Raise', category: 'isolation', difficulty: 'beginner', description: 'Mollets debout BFR', primary_muscles: ['mollets'], equipment: ['bfr-bands'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 20, reps_max: 40, rest_sec: 30 },
  { name: 'BFR Leg Press', category: 'squat', difficulty: 'intermediate', description: 'Presse jambes BFR charge légère', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['leg-press', 'bfr-bands'], movement_pattern: 'squat', sets_min: 4, sets_max: 5, reps_min: 20, reps_max: 40, rest_sec: 30 },
  { name: 'BFR Hammer Curl', category: 'isolation', difficulty: 'beginner', description: 'Curls marteau BFR biceps', primary_muscles: ['biceps'], equipment: ['dumbbell', 'bfr-bands'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 15, reps_max: 30, rest_sec: 30 },
  { name: 'BFR Overhead Extension', category: 'isolation', difficulty: 'intermediate', description: 'Extensions overhead BFR triceps', primary_muscles: ['triceps'], equipment: ['dumbbell', 'bfr-bands'], movement_pattern: 'isolation', sets_min: 4, sets_max: 5, reps_min: 15, reps_max: 30, rest_sec: 30 },
  { name: 'BFR Step-Up', category: 'squat', difficulty: 'intermediate', description: 'Step-ups BFR unilateral jambes', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['box', 'bfr-bands'], movement_pattern: 'squat', sets_min: 4, sets_max: 5, reps_min: 15, reps_max: 25, rest_sec: 45 },
  { name: 'BFR Goblet Squat', category: 'squat', difficulty: 'beginner', description: 'Goblet squat BFR quadriceps', primary_muscles: ['quadriceps'], equipment: ['dumbbell', 'bfr-bands'], movement_pattern: 'squat', sets_min: 4, sets_max: 5, reps_min: 20, reps_max: 40, rest_sec: 30 },
  { name: 'BFR Bulgarian Split Squat', category: 'squat', difficulty: 'intermediate', description: 'Bulgarian split squat BFR', primary_muscles: ['quadriceps', 'fessiers'], equipment: ['bench', 'bfr-bands'], movement_pattern: 'squat', sets_min: 4, sets_max: 5, reps_min: 15, reps_max: 25, rest_sec: 45 },
];

async function main() {
  console.log('💪 Starting Force Bodybuilding Techniques exercises seeding...\n');

  let success = 0;
  let failed = 0;

  for (const ex of bodybuildingTechniquesExercises) {
    try {
      await seedExercise(ex);
      success++;
      process.stdout.write(`\r✅ Seeded: ${success}/${bodybuildingTechniquesExercises.length}`);
    } catch (error) {
      failed++;
      console.error(`\n❌ Failed: ${ex.name}`, error);
    }
  }

  console.log(`\n\n✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${bodybuildingTechniquesExercises.length}`);
  console.log(`\n🎯 Force Bodybuilding Techniques exercises seeded!`);
}

main();

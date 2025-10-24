import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Exercise {
  name: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string[];
}

const muscleCache = new Map<string, string>();
const equipmentCache = new Map<string, string>();

async function getMuscleId(muscleName: string): Promise<string | null> {
  if (muscleCache.has(muscleName)) {
    return muscleCache.get(muscleName)!;
  }
  const { data } = await supabase
    .from('muscle_groups')
    .select('id')
    .ilike('name', muscleName)
    .single();
  if (data) {
    muscleCache.set(muscleName, data.id);
    return data.id;
  }
  return null;
}

async function getEquipmentId(equipmentName: string): Promise<string | null> {
  if (equipmentCache.has(equipmentName)) {
    return equipmentCache.get(equipmentName)!;
  }
  const { data } = await supabase
    .from('equipment_types')
    .select('id')
    .ilike('name', equipmentName)
    .single();
  if (data) {
    equipmentCache.set(equipmentName, data.id);
    return data.id;
  }
  return null;
}

const exercises: Exercise[] = [
  // HYROX Race Simulation (15 exercises)
  {
    name: 'HYROX Full Race Simulation',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'HYROX course complète simulation 8x1km run 8 stations race day prep',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'HYROX Half Simulation 4 Stations',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'HYROX demi simulation 4x1km run 4 stations préparation progression',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'HYROX Station Chipper 8 Stations',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'HYROX chipper 8 stations sans course focus stations transitions',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['deltoïdes', 'trapèzes', 'abdominaux'],
    equipment: ['skierg', 'sled', 'rowing machine', 'kettlebell']
  },
  {
    name: 'HYROX Opening 1km SkiErg Sled Push',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'HYROX ouverture 1km run SkiErg 1000m sled push 50m familiarisation',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled']
  },
  {
    name: 'HYROX Middle Section Row Burpees Carry',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'HYROX section milieu 1km row 1000m burpees farmers carry enchaînement',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['trapèzes', 'pectoraux', 'fessiers'],
    equipment: ['treadmill', 'rowing machine', 'kettlebell']
  },
  {
    name: 'HYROX Closing Lunges Wall Balls',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'HYROX final 1km sandbag lunges wall balls 100 finish strong',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['treadmill', 'sandbag', 'medicine ball']
  },
  {
    name: 'HYROX Transitions Practice Flow',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'HYROX transitions practice course vers station efficacité économie temps',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'HYROX Pacing Strategy 1km Repeats',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'HYROX pacing 8x1km intervalles tempo course stratégie allure optimale',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill']
  },
  {
    name: 'HYROX Station Density Training',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'HYROX density training max stations 20min conditioning capacité travail',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['deltoïdes', 'trapèzes', 'abdominaux'],
    equipment: ['skierg', 'sled', 'rowing machine', 'kettlebell']
  },
  {
    name: 'HYROX Race Week Sharpener',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'HYROX race week sharpener 4x500m run 4 stations légères activation',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'HYROX Doubles Simulation Partner',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'HYROX doubles simulation partenaire stations partagées coordination',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'HYROX Pro Division Pace',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'HYROX pro division pace allure élite sub-60min men sub-70min women',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'HYROX Open Division Strategy',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'HYROX open division stratégie pacing sustainable gestion effort',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'HYROX Recovery Week Active',
    category: 'hyrox_training',
    difficulty: 'beginner',
    description: 'HYROX recovery week active 30min easy stations tempo facile récupération',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'rowing machine']
  },
  {
    name: 'HYROX Peak Week Taper',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'HYROX peak week taper volume réduit intensité maintenue fraîcheur course',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled']
  },

  // Hybrid Run-Strength (12 exercises)
  {
    name: 'Run Sled Push Superset 5 Rounds',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Run 400m sled push 50m superset 5 rounds hybrid force-endurance',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill', 'sled']
  },
  {
    name: 'Run SkiErg Intervals 8x2min',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Run SkiErg intervalles 8x2min alternance cardio hybrid conditioning',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'deltoïdes', 'abdominaux'],
    equipment: ['treadmill', 'skierg']
  },
  {
    name: 'Run Row EMOM 20min Alternating',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Run row EMOM 20min alternance 200m run 250m row conditioning',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'biceps'],
    equipment: ['treadmill', 'rowing machine']
  },
  {
    name: 'Run Farmers Carry Complex',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Run 800m farmers carry 200m complexe grip endurance jambes fatigue',
    primary_muscles: ['quadriceps', 'trapèzes'],
    secondary_muscles: ['ischio-jambiers', 'avant-bras', 'abdominaux'],
    equipment: ['treadmill', 'kettlebell']
  },
  {
    name: 'Run Burpees Ladder Ascending',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Run 400m burpees échelle 5-10-15-20 lactique conditioning brutal',
    primary_muscles: ['quadriceps', 'pectoraux'],
    secondary_muscles: ['ischio-jambiers', 'triceps', 'abdominaux'],
    equipment: ['treadmill']
  },
  {
    name: 'Run Wall Balls Tabata 8 Rounds',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Run 200m wall balls Tabata 8 rounds alternance high intensity',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['treadmill', 'medicine ball']
  },
  {
    name: 'Run Sandbag Clean Complex',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Run 600m sandbag cleans 20 reps complexe force explosive endurance',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['trapèzes', 'fessiers', 'deltoïdes'],
    equipment: ['treadmill', 'sandbag']
  },
  {
    name: 'Brick Workout Run to Stations',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Brick workout 3km run vers 3 stations enchaînement transition fatigue',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'Tempo Run Plus Strength Circuit',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'Tempo run 5km puis circuit strength 4 stations hybrid endurance force',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'deltoïdes'],
    equipment: ['treadmill', 'kettlebell', 'sandbag']
  },
  {
    name: 'Fartlek Run With Station Bursts',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Fartlek run intervalles station bursts variation intensité mixte',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled']
  },
  {
    name: 'Long Run Steady Plus Farmers',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'Long run 10km steady puis farmers carry 400m grip endurance aérobie',
    primary_muscles: ['quadriceps', 'trapèzes'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'avant-bras'],
    equipment: ['treadmill', 'kettlebell']
  },
  {
    name: 'Hill Repeats Plus Sled Work',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Hill repeats 10x2min sled push pull work force spécifique jambes',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill', 'sled']
  },

  // Station Transitions (10 exercises)
  {
    name: 'HYROX Quick Transitions Drill',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'HYROX transitions drill rapides 100m run vers station économie temps',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'Run to SkiErg No Pause',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Run vers SkiErg sans pause transition immédiate adaptation fréquence',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'deltoïdes', 'abdominaux'],
    equipment: ['treadmill', 'skierg']
  },
  {
    name: 'Run to Sled Push Setup Fast',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Run vers sled push setup rapide position efficace temps gagné',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill', 'sled']
  },
  {
    name: 'Station Exit to Run Acceleration',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'Station exit vers run accélération reprise course jambes fatiguées',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill', 'skierg']
  },
  {
    name: 'Multiple Stations Flow Practice',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Multiple stations flow practice 4 stations consécutives fluidité transitions',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['deltoïdes', 'trapèzes', 'abdominaux'],
    equipment: ['skierg', 'sled', 'rowing machine', 'kettlebell']
  },
  {
    name: 'Fatigued Transitions Simulation',
    category: 'hyrox_training',
    difficulty: 'advanced',
    description: 'Transitions simulation fatigue 2km run puis stations enchaînées réaliste',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'Mental Cue Transitions Drill',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'Mental cue transitions drill rappels automatiques checklist efficacité',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled']
  },
  {
    name: 'Equipment Setup Speed Test',
    category: 'hyrox_training',
    difficulty: 'beginner',
    description: 'Equipment setup speed test installation rapide matériel familiarisation',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['skierg', 'sled', 'rowing machine']
  },
  {
    name: 'Breathing Reset Between Stations',
    category: 'hyrox_training',
    difficulty: 'intermediate',
    description: 'Breathing reset entre stations technique respiration récupération rapide',
    primary_muscles: ['abdominaux', 'dorsaux'],
    secondary_muscles: ['quadriceps', 'fessiers', 'deltoïdes'],
    equipment: ['treadmill', 'skierg']
  },
  {
    name: 'Transition Zone Visualization',
    category: 'hyrox_training',
    difficulty: 'beginner',
    description: 'Transition zone visualization mental rehearsal préparation course stratégie',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  }
];

async function insertExercise(exercise: Exercise) {
  try {
    const slug = exercise.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .insert({
        name: exercise.name,
        slug,
        category: exercise.category,
        difficulty: exercise.difficulty,
        description_short: exercise.description,
        discipline: 'competitions'
      })
      .select()
      .single();

    if (exerciseError) {
      if (exerciseError.code === '23505') {
        console.log(`⚠️  Skipped (duplicate): ${exercise.name}`);
        return false;
      }
      throw exerciseError;
    }

    const allMuscles = [...exercise.primary_muscles, ...exercise.secondary_muscles];
    for (const muscleName of allMuscles) {
      const muscleId = await getMuscleId(muscleName);
      if (muscleId && exerciseData) {
        const isPrimary = exercise.primary_muscles.includes(muscleName);
        await supabase.from('exercise_muscle_groups').insert({
          exercise_id: exerciseData.id,
          muscle_group_id: muscleId,
          is_primary: isPrimary
        });
      }
    }

    for (const equipmentName of exercise.equipment) {
      const equipmentId = await getEquipmentId(equipmentName);
      if (equipmentId && exerciseData) {
        await supabase.from('exercise_equipment').insert({
          exercise_id: exerciseData.id,
          equipment_type_id: equipmentId
        });
      }
    }

    console.log(`✅ Inserted: ${exercise.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Error inserting ${exercise.name}:`, error);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Starting HYROX Training Protocols seeding...\n');
  console.log(`Total exercises to insert: ${exercises.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const exercise of exercises) {
    const success = await insertExercise(exercise);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Successfully inserted: ${successCount}/${exercises.length}`);
  console.log(`⚠️  Failed/Skipped: ${failCount}/${exercises.length}`);
  console.log('='.repeat(50));

  const { count: competitionsCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('discipline', 'competitions');

  console.log(`\n🎯 Current Competitions total: ${competitionsCount || 0} exercises`);
  console.log(`Target: 350 exercises`);
  console.log(`Gap: ${350 - (competitionsCount || 0)} exercises remaining\n`);
}

main().then(() => process.exit(0));

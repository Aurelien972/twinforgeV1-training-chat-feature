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
  // DEKA FIT 10 Zones (15 exercises)
  {
    name: 'DEKA FIT Full Race 10 Zones',
    category: 'deka_fit',
    difficulty: 'advanced',
    description: 'DEKA FIT course complète 10 zones endurance-force hybrid 500m runs',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'box', 'kettlebell', 'rowing machine']
  },
  {
    name: 'DEKA Zone 1 Box Jumps 30 Reps',
    category: 'deka_fit',
    difficulty: 'intermediate',
    description: 'DEKA zone 1 box jumps 30 reps explosive jambes plyométrique ouverture',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['box']
  },
  {
    name: 'DEKA Zone 2 Goblet Squats 30 Reps',
    category: 'deka_fit',
    difficulty: 'intermediate',
    description: 'DEKA zone 2 goblet squats 30 reps kettlebell force jambes endurance',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'abdominaux', 'deltoïdes'],
    equipment: ['kettlebell']
  },
  {
    name: 'DEKA Zone 3 Rowing 500m Race',
    category: 'deka_fit',
    difficulty: 'advanced',
    description: 'DEKA zone 3 rowing 500m race pace cardio dorsaux endurance',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'DEKA Zone 4 Reverse Lunges 30 Reps',
    category: 'deka_fit',
    difficulty: 'intermediate',
    description: 'DEKA zone 4 reverse lunges 30 reps jambes stabilité fessiers activation',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'DEKA Zone 5 BikeErg 1500m',
    category: 'deka_fit',
    difficulty: 'advanced',
    description: 'DEKA zone 5 BikeErg 1500m cardio jambes endurance lactique',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['bike erg']
  },
  {
    name: 'DEKA Zone 6 Burpees 30 Reps',
    category: 'deka_fit',
    difficulty: 'advanced',
    description: 'DEKA zone 6 burpees 30 reps conditioning total body lactique',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'DEKA Zone 7 SkiErg 500m Sprint',
    category: 'deka_fit',
    difficulty: 'advanced',
    description: 'DEKA zone 7 SkiErg 500m sprint dorsaux cardio explosif',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'DEKA Zone 8 Russian Twists 30 Reps',
    category: 'deka_fit',
    difficulty: 'intermediate',
    description: 'DEKA zone 8 Russian twists 30 reps obliques rotation core medicine ball',
    primary_muscles: ['obliques', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'fléchisseurs hanches'],
    equipment: ['medicine ball']
  },
  {
    name: 'DEKA Zone 9 Air Bike 30 Calories',
    category: 'deka_fit',
    difficulty: 'advanced',
    description: 'DEKA zone 9 air bike 30 calories total body cardio lactique brutal',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['ischio-jambiers', 'triceps', 'abdominaux'],
    equipment: ['assault bike']
  },
  {
    name: 'DEKA Zone 10 Thrusters 30 Reps',
    category: 'deka_fit',
    difficulty: 'advanced',
    description: 'DEKA zone 10 thrusters 30 reps finisher brutal jambes épaules lactique',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'triceps', 'abdominaux'],
    equipment: ['barbell']
  },
  {
    name: 'DEKA FIT Pacing Strategy Sub-45',
    category: 'deka_fit',
    difficulty: 'advanced',
    description: 'DEKA FIT pacing stratégie sub-45min zones optimal allure gestion',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'box', 'kettlebell', 'rowing machine']
  },
  {
    name: 'DEKA FIT Time Caps Per Zone',
    category: 'deka_fit',
    difficulty: 'intermediate',
    description: 'DEKA FIT time caps zone objectifs temps limites référence benchmarks',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'box', 'kettlebell']
  },
  {
    name: 'DEKA FIT Zone Transitions Practice',
    category: 'deka_fit',
    difficulty: 'intermediate',
    description: 'DEKA FIT transitions practice efficacité économie temps entre zones',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'box', 'kettlebell']
  },
  {
    name: 'DEKA FIT Race Week Taper',
    category: 'deka_fit',
    difficulty: 'intermediate',
    description: 'DEKA FIT race week taper volume réduit intensité maintenue fraîcheur',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'box', 'kettlebell']
  },

  // DEKA MILE (10 exercises)
  {
    name: 'DEKA MILE Full Race Simulation',
    category: 'deka_mile',
    difficulty: 'advanced',
    description: 'DEKA MILE course complète 1 mile run 10 stations sprint endurance',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'box', 'kettlebell', 'rowing machine']
  },
  {
    name: 'DEKA MILE Opening Mile Pace',
    category: 'deka_mile',
    difficulty: 'advanced',
    description: 'DEKA MILE opening mile pace tempo optimal gestion effort sub-7min',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill']
  },
  {
    name: 'DEKA MILE Station Speed Work',
    category: 'deka_mile',
    difficulty: 'advanced',
    description: 'DEKA MILE stations speed work tempo maximal efficacité transitions',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['deltoïdes', 'trapèzes', 'abdominaux'],
    equipment: ['box', 'kettlebell', 'rowing machine']
  },
  {
    name: 'DEKA MILE Box Jump Speed 30 Reps',
    category: 'deka_mile',
    difficulty: 'advanced',
    description: 'DEKA MILE box jumps 30 reps vitesse maximale explosivité transitions',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['box']
  },
  {
    name: 'DEKA MILE Row Sprint 500m Max',
    category: 'deka_mile',
    difficulty: 'advanced',
    description: 'DEKA MILE row 500m sprint maximal watts élevés puissance anaérobie',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'DEKA MILE Burpee Efficiency 30',
    category: 'deka_mile',
    difficulty: 'advanced',
    description: 'DEKA MILE burpees 30 efficacité technique économie mouvement vitesse',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'DEKA MILE Transition Optimization',
    category: 'deka_mile',
    difficulty: 'intermediate',
    description: 'DEKA MILE transitions optimization secondes gagnées économie totale',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'box', 'kettlebell']
  },
  {
    name: 'DEKA MILE Pacing Strategy Sub-25',
    category: 'deka_mile',
    difficulty: 'advanced',
    description: 'DEKA MILE pacing stratégie sub-25min mile run stations gestion',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'box', 'kettlebell', 'rowing machine']
  },
  {
    name: 'DEKA MILE Recovery Between Zones',
    category: 'deka_mile',
    difficulty: 'intermediate',
    description: 'DEKA MILE recovery entre zones respiration technique récupération rapide',
    primary_muscles: ['abdominaux', 'dorsaux'],
    secondary_muscles: ['quadriceps', 'fessiers', 'deltoïdes'],
    equipment: ['treadmill']
  },
  {
    name: 'DEKA MILE Mental Prep Race Day',
    category: 'deka_mile',
    difficulty: 'beginner',
    description: 'DEKA MILE mental prep race day visualization stratégie confiance',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },

  // DEKA STRONG (10 exercises)
  {
    name: 'DEKA STRONG Full Race Max Effort',
    category: 'deka_strong',
    difficulty: 'advanced',
    description: 'DEKA STRONG course complète 10 stations force maximale effort total',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['pectoraux', 'deltoïdes', 'fessiers'],
    equipment: ['barbell', 'box', 'kettlebell', 'sandbag']
  },
  {
    name: 'DEKA STRONG Heavy Deadlifts Max Reps',
    category: 'deka_strong',
    difficulty: 'advanced',
    description: 'DEKA STRONG deadlifts lourds max reps force pure dorsaux chaîne postérieure',
    primary_muscles: ['dorsaux', 'ischio-jambiers'],
    secondary_muscles: ['fessiers', 'trapèzes', 'érecteurs'],
    equipment: ['barbell']
  },
  {
    name: 'DEKA STRONG Back Squats Max Weight',
    category: 'deka_strong',
    difficulty: 'advanced',
    description: 'DEKA STRONG back squats poids maximal force jambes profondeur complète',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'érecteurs', 'abdominaux'],
    equipment: ['barbell']
  },
  {
    name: 'DEKA STRONG Bench Press Max Effort',
    category: 'deka_strong',
    difficulty: 'advanced',
    description: 'DEKA STRONG bench press effort maximal pectoraux triceps force poussée',
    primary_muscles: ['pectoraux', 'triceps'],
    secondary_muscles: ['deltoïdes', 'dorsaux', 'abdominaux'],
    equipment: ['barbell']
  },
  {
    name: 'DEKA STRONG Overhead Press Strength',
    category: 'deka_strong',
    difficulty: 'advanced',
    description: 'DEKA STRONG overhead press force deltoïdes stabilité core strict press',
    primary_muscles: ['deltoïdes', 'triceps'],
    secondary_muscles: ['trapèzes', 'abdominaux', 'pectoraux'],
    equipment: ['barbell']
  },
  {
    name: 'DEKA STRONG Heavy Carries Max Distance',
    category: 'deka_strong',
    difficulty: 'advanced',
    description: 'DEKA STRONG carries lourds distance maximale grip trapèzes endurance force',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'fessiers', 'quadriceps'],
    equipment: ['kettlebell']
  },
  {
    name: 'DEKA STRONG Sandbag Clean Max Reps',
    category: 'deka_strong',
    difficulty: 'advanced',
    description: 'DEKA STRONG sandbag cleans max reps explosive force total body puissance',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['trapèzes', 'fessiers', 'deltoïdes'],
    equipment: ['sandbag']
  },
  {
    name: 'DEKA STRONG Rest Strategy Between Stations',
    category: 'deka_strong',
    difficulty: 'intermediate',
    description: 'DEKA STRONG rest strategy repos optimal récupération ATP entre stations',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['pectoraux', 'deltoïdes', 'fessiers'],
    equipment: ['body weight']
  },
  {
    name: 'DEKA STRONG Max Effort Protocol',
    category: 'deka_strong',
    difficulty: 'advanced',
    description: 'DEKA STRONG max effort protocol activation CNS force maximale neural',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['pectoraux', 'deltoïdes', 'fessiers'],
    equipment: ['barbell', 'kettlebell']
  },
  {
    name: 'DEKA STRONG Recovery Week Deload',
    category: 'deka_strong',
    difficulty: 'beginner',
    description: 'DEKA STRONG recovery week deload volume réduit récupération adaptation',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['pectoraux', 'deltoïdes', 'fessiers'],
    equipment: ['barbell', 'kettlebell']
  },

  // Race Preparation (10 exercises)
  {
    name: 'Race Pace Run 8x1km Goal Tempo',
    category: 'race_prep',
    difficulty: 'advanced',
    description: 'Race pace run 8x1km tempo objectif allure course spécifique HYROX',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill']
  },
  {
    name: 'Brick Workout 5km Plus Stations',
    category: 'race_prep',
    difficulty: 'advanced',
    description: 'Brick workout 5km run puis 4 stations enchaînement fatigue transition',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'Long Run Steady 15km Aerobic Base',
    category: 'race_prep',
    difficulty: 'intermediate',
    description: 'Long run steady 15km base aérobie endurance fondamentale capacité',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill']
  },
  {
    name: 'Tempo Run 10km Race Pace',
    category: 'race_prep',
    difficulty: 'advanced',
    description: 'Tempo run 10km race pace threshold lactique seuil allure compétition',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill']
  },
  {
    name: 'Recovery Run Easy 30min Zone 2',
    category: 'race_prep',
    difficulty: 'beginner',
    description: 'Recovery run easy 30min zone 2 récupération active aérobie légère',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill']
  },
  {
    name: 'Hill Repeats 10x2min Power',
    category: 'race_prep',
    difficulty: 'advanced',
    description: 'Hill repeats 10x2min puissance incline force spécifique jambes',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill']
  },
  {
    name: 'Fartlek Run 45min Varied Pace',
    category: 'race_prep',
    difficulty: 'intermediate',
    description: 'Fartlek run 45min allure variée intervals spontanés adaptation rythme',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['treadmill']
  },
  {
    name: 'Race Simulation Full Distance',
    category: 'race_prep',
    difficulty: 'advanced',
    description: 'Race simulation full distance dress rehearsal stratégie nutrition timing',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg', 'sled', 'rowing machine']
  },
  {
    name: 'Taper Week 2 Pre-Race',
    category: 'race_prep',
    difficulty: 'intermediate',
    description: 'Taper week 2 pre-race volume 50% intensité maintenue fraîcheur course',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'fessiers', 'abdominaux'],
    equipment: ['treadmill', 'skierg']
  },
  {
    name: 'Race Day Activation Warm-up',
    category: 'race_prep',
    difficulty: 'beginner',
    description: 'Race day activation warm-up échauffement dynamique CNS préparation mentale',
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
  console.log('\n🚀 Starting DEKA Complete Protocols seeding...\n');
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

  if (competitionsCount && competitionsCount >= 350) {
    console.log('✅ TARGET REACHED! 350+ exercises achieved!\n');
  } else {
    console.log(`Target: 350 exercises`);
    console.log(`Gap: ${350 - (competitionsCount || 0)} exercises remaining\n`);
  }
}

main().then(() => process.exit(0));

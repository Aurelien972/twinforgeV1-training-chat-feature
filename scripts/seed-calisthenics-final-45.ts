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
  // Pull Variations Unique (12 exercises)
  {
    name: 'Typewriter Pull-ups Continuous',
    category: 'pull',
    difficulty: 'advanced',
    description: 'Pull-ups typewriter déplacement latéral continu gauche droite force contrôle',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['avant-bras', 'deltoïdes', 'trapèzes'],
    equipment: ['pull-up bar']
  },
  {
    name: 'Archer Pull-ups Alternating',
    category: 'pull',
    difficulty: 'advanced',
    description: 'Pull-ups archer alternance asymétrique progression one-arm dynamique',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['avant-bras', 'deltoïdes', 'abdominaux'],
    equipment: ['pull-up bar']
  },
  {
    name: 'L-Sit Chin-ups',
    category: 'pull',
    difficulty: 'advanced',
    description: 'Chin-ups maintenant L-sit jambes tendues core engagement supination',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['biceps', 'fléchisseurs hanches', 'quadriceps'],
    equipment: ['pull-up bar']
  },
  {
    name: 'Clapping Chin-ups',
    category: 'pull',
    difficulty: 'advanced',
    description: 'Chin-ups explosifs clap mains puissance explosive supination plyométrique',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['deltoïdes', 'trapèzes', 'avant-bras'],
    equipment: ['pull-up bar']
  },
  {
    name: 'Behind Neck Wide Pull-ups',
    category: 'pull',
    difficulty: 'intermediate',
    description: 'Pull-ups derrière nuque prise large trapèzes dorsaux activation maximale',
    primary_muscles: ['dorsaux', 'trapèzes'],
    secondary_muscles: ['biceps', 'deltoïdes', 'rhomboïdes'],
    equipment: ['pull-up bar']
  },
  {
    name: 'Kipping Chest-to-Bar Pull-ups',
    category: 'pull',
    difficulty: 'intermediate',
    description: 'Pull-ups kipping poitrine touche barre momentum CrossFit cardio',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['abdominaux', 'deltoïdes', 'pectoraux'],
    equipment: ['pull-up bar']
  },
  {
    name: 'Butterfly Chest-to-Bar',
    category: 'pull',
    difficulty: 'advanced',
    description: 'Butterfly pull-ups poitrine barre fluide continu CrossFit vitesse',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['deltoïdes', 'abdominaux', 'pectoraux'],
    equipment: ['pull-up bar']
  },
  {
    name: 'Dual Towel Pull-ups',
    category: 'pull',
    difficulty: 'advanced',
    description: 'Pull-ups deux serviettes grip crushing avant-bras force préhension extrême',
    primary_muscles: ['dorsaux', 'avant-bras'],
    secondary_muscles: ['biceps', 'trapèzes', 'deltoïdes'],
    equipment: ['pull-up bar', 'towel']
  },
  {
    name: 'Rope Climb No Legs Three Pulls',
    category: 'pull',
    difficulty: 'advanced',
    description: 'Montée corde sans jambes trois tractions consécutives force préhension',
    primary_muscles: ['dorsaux', 'avant-bras'],
    secondary_muscles: ['biceps', 'trapèzes', 'deltoïdes'],
    equipment: ['rope']
  },
  {
    name: 'False Grip Chin-ups',
    category: 'pull',
    difficulty: 'advanced',
    description: 'Chin-ups false grip supination poignets fléchis muscle-up prep force',
    primary_muscles: ['dorsaux', 'avant-bras'],
    secondary_muscles: ['biceps', 'trapèzes', 'pectoraux'],
    equipment: ['pull-up bar']
  },
  {
    name: 'Ten Second Negative Pull-ups',
    category: 'pull',
    difficulty: 'intermediate',
    description: 'Pull-ups descente 10 secondes eccentric ultra-lent temps sous tension maximal',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['trapèzes', 'avant-bras', 'deltoïdes'],
    equipment: ['pull-up bar']
  },
  {
    name: 'Explosive Chin-ups to Chest',
    category: 'pull',
    difficulty: 'advanced',
    description: 'Chin-ups explosifs poitrine touche barre supination puissance plyométrique',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['pectoraux', 'deltoïdes', 'trapèzes'],
    equipment: ['pull-up bar']
  },

  // Push Variations Unique (12 exercises)
  {
    name: 'Sphinx to Push-up Transitions',
    category: 'push',
    difficulty: 'advanced',
    description: 'Push-ups transition avant-bras vers mains sphinx triceps activation maximale',
    primary_muscles: ['pectoraux', 'triceps'],
    secondary_muscles: ['deltoïdes', 'abdominaux', 'avant-bras'],
    equipment: ['body weight']
  },
  {
    name: 'Hindu Push-ups Fast Tempo',
    category: 'push',
    difficulty: 'intermediate',
    description: 'Push-ups hindu rythme rapide plongeon dynamique mobilité vitesse endurance',
    primary_muscles: ['pectoraux', 'deltoïdes'],
    secondary_muscles: ['triceps', 'abdominaux', 'dorsaux'],
    equipment: ['body weight']
  },
  {
    name: 'Divebomber Push-ups Slow',
    category: 'push',
    difficulty: 'intermediate',
    description: 'Push-ups divebomber tempo lent plongeon contrôlé amplitude maximale tension',
    primary_muscles: ['pectoraux', 'deltoïdes'],
    secondary_muscles: ['triceps', 'dorsaux', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Spiderman Push-ups Alternating Fast',
    category: 'push',
    difficulty: 'intermediate',
    description: 'Push-ups spiderman alternance rapide genou coude rotation obliques vitesse',
    primary_muscles: ['pectoraux', 'abdominaux'],
    secondary_muscles: ['obliques', 'triceps', 'deltoïdes'],
    equipment: ['body weight']
  },
  {
    name: 'Archer Push-ups with Hold',
    category: 'push',
    difficulty: 'advanced',
    description: 'Push-ups archer maintien isométrique bas asymétrique tension prolongée',
    primary_muscles: ['pectoraux', 'triceps'],
    secondary_muscles: ['deltoïdes', 'abdominaux', 'obliques'],
    equipment: ['body weight']
  },
  {
    name: 'Typewriter Push-ups Continuous Flow',
    category: 'push',
    difficulty: 'advanced',
    description: 'Push-ups typewriter mouvement continu gauche droite sans pause endurance',
    primary_muscles: ['pectoraux', 'triceps'],
    secondary_muscles: ['deltoïdes', 'abdominaux', 'obliques'],
    equipment: ['body weight']
  },
  {
    name: 'Double Clapping Push-ups',
    category: 'push',
    difficulty: 'advanced',
    description: 'Push-ups explosifs double clap mains puissance plyométrique vitesse extrême',
    primary_muscles: ['pectoraux', 'triceps'],
    secondary_muscles: ['deltoïdes', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Aztec Push-ups with Tuck',
    category: 'push',
    difficulty: 'advanced',
    description: 'Push-ups aztec genoux poitrine mid-air explosivité contrôle acrobatique',
    primary_muscles: ['pectoraux', 'triceps'],
    secondary_muscles: ['deltoïdes', 'abdominaux', 'fléchisseurs hanches'],
    equipment: ['body weight']
  },
  {
    name: 'Single Arm Single Leg Push-ups',
    category: 'push',
    difficulty: 'advanced',
    description: 'Push-ups un bras une jambe opposés équilibre croisé stabilisation maximale',
    primary_muscles: ['pectoraux', 'triceps'],
    secondary_muscles: ['abdominaux', 'deltoïdes', 'obliques'],
    equipment: ['body weight']
  },
  {
    name: 'Five Fingertip Push-ups',
    category: 'push',
    difficulty: 'advanced',
    description: 'Push-ups cinq doigts bout préhension avant-bras force mains développement',
    primary_muscles: ['pectoraux', 'avant-bras'],
    secondary_muscles: ['triceps', 'deltoïdes', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Rotational Knuckle Push-ups',
    category: 'push',
    difficulty: 'intermediate',
    description: 'Push-ups poings rotation corps obliques activation martial arts technique',
    primary_muscles: ['pectoraux', 'triceps'],
    secondary_muscles: ['avant-bras', 'deltoïdes', 'obliques'],
    equipment: ['body weight']
  },
  {
    name: 'Deficit Pike Push-ups',
    category: 'push',
    difficulty: 'advanced',
    description: 'Pike push-ups mains élevées amplitude profonde deltoïdes activation extrême',
    primary_muscles: ['deltoïdes', 'triceps'],
    secondary_muscles: ['pectoraux', 'trapèzes', 'abdominaux'],
    equipment: ['parallettes']
  },

  // Core Advanced Unique (10 exercises)
  {
    name: 'Dragon Flags Negative Five Seconds',
    category: 'core',
    difficulty: 'advanced',
    description: 'Dragon flags descente 5 secondes eccentric contrôle abdominaux tension',
    primary_muscles: ['abdominaux', 'dorsaux'],
    secondary_muscles: ['fléchisseurs hanches', 'obliques', 'érecteurs'],
    equipment: ['bench']
  },
  {
    name: 'Windshield Wipers Hanging Full Range',
    category: 'core',
    difficulty: 'advanced',
    description: 'Windshield wipers suspension amplitude complète 180 degrés obliques force',
    primary_muscles: ['abdominaux', 'obliques'],
    secondary_muscles: ['fléchisseurs hanches', 'dorsaux', 'avant-bras'],
    equipment: ['pull-up bar']
  },
  {
    name: 'V-Sit Hold Thirty Seconds',
    category: 'core',
    difficulty: 'advanced',
    description: 'V-sit maintien 30 secondes équilibre isométrique abdominaux endurance force',
    primary_muscles: ['abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['quadriceps', 'érecteurs', 'deltoïdes'],
    equipment: ['body weight']
  },
  {
    name: 'Hollow Body Rocks Fast Tempo',
    category: 'core',
    difficulty: 'intermediate',
    description: 'Hollow body rocks rythme rapide balancement tension abdominale dynamique',
    primary_muscles: ['abdominaux'],
    secondary_muscles: ['fléchisseurs hanches', 'quadriceps', 'deltoïdes'],
    equipment: ['body weight']
  },
  {
    name: 'Ab Wheel Rollouts Kneeling Extended',
    category: 'core',
    difficulty: 'advanced',
    description: 'Rollouts ab wheel genoux extension maximale abdominaux activation complète',
    primary_muscles: ['abdominaux', 'dorsaux'],
    secondary_muscles: ['deltoïdes', 'pectoraux', 'érecteurs'],
    equipment: ['ab wheel']
  },
  {
    name: 'Toes to Bar Strict Slow',
    category: 'core',
    difficulty: 'advanced',
    description: 'Toes to bar strict tempo lent sans momentum compression abdominale pure',
    primary_muscles: ['abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['dorsaux', 'avant-bras', 'quadriceps'],
    equipment: ['pull-up bar']
  },
  {
    name: 'Turkish Get-up Bodyweight Slow',
    category: 'core',
    difficulty: 'intermediate',
    description: 'Turkish get-up sans charge tempo lent mobilité contrôle stabilisation maximale',
    primary_muscles: ['abdominaux', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'quadriceps', 'obliques'],
    equipment: ['body weight']
  },
  {
    name: 'Hanging Knee Raises Weighted',
    category: 'core',
    difficulty: 'advanced',
    description: 'Knee raises suspension avec poids abdominaux fléchisseurs hanches charge',
    primary_muscles: ['abdominaux', 'fléchisseurs hanches'],
    secondary_muscles: ['avant-bras', 'dorsaux', 'quadriceps'],
    equipment: ['pull-up bar', 'dumbbell']
  },
  {
    name: 'Plank to Pike Dynamic',
    category: 'core',
    difficulty: 'intermediate',
    description: 'Plank vers pike dynamique transition fluide abdominaux deltoïdes mobilité',
    primary_muscles: ['abdominaux', 'deltoïdes'],
    secondary_muscles: ['ischio-jambiers', 'dorsaux', 'triceps'],
    equipment: ['body weight']
  },
  {
    name: 'Side Plank Star Extended',
    category: 'core',
    difficulty: 'advanced',
    description: 'Side plank étoile jambe bras levés obliques équilibre stabilisation extrême',
    primary_muscles: ['obliques', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'fessiers', 'adducteurs'],
    equipment: ['body weight']
  },

  // Legs Unique (6 exercises)
  {
    name: 'Pistol Squat Jumps Single Leg',
    category: 'squat',
    difficulty: 'advanced',
    description: 'Pistol squat saut réception une jambe plyométrique puissance équilibre extrême',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Shrimp Squats Assisted Band',
    category: 'squat',
    difficulty: 'intermediate',
    description: 'Shrimp squats bande assistance progression quadriceps activation contrôle',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'abdominaux', 'mollets'],
    equipment: ['resistance band']
  },
  {
    name: 'Nordic Curls Partner Assisted',
    category: 'hinge',
    difficulty: 'intermediate',
    description: 'Nordic curls partenaire maintien pieds ischio-jambiers eccentric progression',
    primary_muscles: ['ischio-jambiers'],
    secondary_muscles: ['fessiers', 'mollets', 'érecteurs'],
    equipment: ['body weight']
  },
  {
    name: 'Bulgarian Split Squat Jump',
    category: 'squat',
    difficulty: 'advanced',
    description: 'Bulgarian squat saut explosif une jambe plyométrique puissance unilateral',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['bench']
  },
  {
    name: 'Single Leg Romanian Deadlift Reach',
    category: 'hinge',
    difficulty: 'intermediate',
    description: 'Romanian deadlift une jambe reach sol équilibre ischio-jambiers amplitude',
    primary_muscles: ['ischio-jambiers', 'fessiers'],
    secondary_muscles: ['érecteurs', 'abdominaux', 'mollets'],
    equipment: ['body weight']
  },
  {
    name: 'Sissy Squats Weighted',
    category: 'squat',
    difficulty: 'advanced',
    description: 'Sissy squats avec charge inclinaison quadriceps tension extrême résistance',
    primary_muscles: ['quadriceps'],
    secondary_muscles: ['abdominaux', 'fléchisseurs hanches', 'mollets'],
    equipment: ['dumbbell']
  },

  // Skills & Compound (5 exercises)
  {
    name: 'Bar Muscle-up Strict Slow',
    category: 'compound',
    difficulty: 'advanced',
    description: 'Muscle-up barre strict tempo lent transition contrôlée force pure',
    primary_muscles: ['dorsaux', 'pectoraux'],
    secondary_muscles: ['triceps', 'deltoïdes', 'abdominaux'],
    equipment: ['pull-up bar']
  },
  {
    name: 'Ring Muscle-up Kipping',
    category: 'compound',
    difficulty: 'advanced',
    description: 'Muscle-up anneaux kipping momentum transition dynamique technique CrossFit',
    primary_muscles: ['dorsaux', 'pectoraux'],
    secondary_muscles: ['triceps', 'deltoïdes', 'abdominaux'],
    equipment: ['gymnastic rings']
  },
  {
    name: 'Skin the Cat Progression',
    category: 'skill',
    difficulty: 'intermediate',
    description: 'Skin the cat rotation complète anneaux mobilité épaules contrôle',
    primary_muscles: ['dorsaux', 'deltoïdes'],
    secondary_muscles: ['pectoraux', 'abdominaux', 'biceps'],
    equipment: ['gymnastic rings']
  },
  {
    name: 'German Hang to Back Lever',
    category: 'skill',
    difficulty: 'advanced',
    description: 'German hang vers back lever transition mobilité force épaules activation',
    primary_muscles: ['dorsaux', 'pectoraux'],
    secondary_muscles: ['deltoïdes', 'biceps', 'abdominaux'],
    equipment: ['gymnastic rings']
  },
  {
    name: 'Victorian Cross Hold',
    category: 'skill',
    difficulty: 'advanced',
    description: 'Victorian position anneaux bras avant corps horizontal force extrême',
    primary_muscles: ['pectoraux', 'deltoïdes'],
    secondary_muscles: ['biceps', 'dorsaux', 'abdominaux'],
    equipment: ['gymnastic rings']
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
        discipline: 'calisthenics'
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
  console.log('\n🚀 Starting Final 45 Calisthenics Exercises seeding...\n');
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

  const { count: calisthenicsCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('discipline', 'calisthenics');

  console.log(`\n🎯 Current Calisthenics total: ${calisthenicsCount || 0} exercises`);

  if (calisthenicsCount && calisthenicsCount >= 400) {
    console.log('✅ TARGET REACHED! 400+ exercises achieved!\n');
  } else {
    console.log(`⚠️  Still need ${400 - (calisthenicsCount || 0)} more to reach 400\n`);
  }
}

main().then(() => process.exit(0));

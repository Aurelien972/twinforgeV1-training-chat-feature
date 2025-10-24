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
  // SkiErg Station Protocols (15 exercises)
  {
    name: 'HYROX SkiErg Race Pace 1000m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'SkiErg 1000m race pace HYROX tempo compétition rythme course optimisé',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Interval 250m Repeats',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'SkiErg intervalles 250m répétés puissance endurance lactique HYROX prep',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Negative Split 1000m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'SkiErg 1000m negative split accélération progressive pacing stratégie',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Steady State 2000m',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'SkiErg 2000m tempo régulier endurance aérobie capacité travail',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Power Pulls 100m Max',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'SkiErg 100m effort maximal puissance explosive sprint lactique',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg EMOM 10min 100m',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'SkiErg EMOM 100m chaque minute conditioning répétition technique',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Descending Ladder 500-400-300-200-100',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'SkiErg échelle descendante volume intensité progression HYROX',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Tabata 8 Rounds',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'SkiErg Tabata 20s work 10s rest haute intensité conditioning VO2max',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Technical Drills Slow',
    category: 'hyrox_station',
    difficulty: 'beginner',
    description: 'SkiErg drills technique tempo lent apprentissage mouvement efficacité',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Single Arm Alternating',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'SkiErg alternance bras isolé correction déséquilibres force unilatérale',
    primary_muscles: ['dorsaux', 'obliques'],
    secondary_muscles: ['deltoïdes', 'triceps', 'abdominaux'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Speed Pulls High Cadence',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'SkiErg cadence élevée vitesse pulls coordination neuromusculaire',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg 500m Time Trial',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'SkiErg 500m contre-la-montre effort maximal test performance',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Recovery Pace 3000m',
    category: 'hyrox_station',
    difficulty: 'beginner',
    description: 'SkiErg 3000m récupération active tempo facile aérobie base',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Pyramid 100-200-300-200-100',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'SkiErg pyramide distances variation intensité volume mixte',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },
  {
    name: 'SkiErg Pre-Fatigue 500m Post Run',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'SkiErg 500m après course simulation HYROX pré-fatigue jambes transition',
    primary_muscles: ['dorsaux', 'abdominaux'],
    secondary_muscles: ['deltoïdes', 'triceps', 'fessiers'],
    equipment: ['skierg']
  },

  // Sled Push Variations (12 exercises)
  {
    name: 'HYROX Sled Push 50m Race Weight',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled push 50m poids compétition HYROX tempo course technique optimale',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push Heavy Overload 25m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled push 25m surcharge lourde force maximale développement puissance',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push Speed 50m Light',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Sled push 50m léger vitesse maximale technique rapide coordination',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push EMOM 10min 25m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled push EMOM 25m chaque minute conditioning répétition force-endurance',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push Low Position Drive',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Sled push position basse drive puissant quadriceps activation maximale',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push High Handles Speed',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Sled push poignées hautes vitesse course similaire transition efficace',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push 100m Continuous',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled push 100m continu endurance force prolongée capacité lactique',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push Intervals 25m x 8',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled push intervalles 25m répétés lactique répétition conditioning',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push Single Leg Drive',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled push drive une jambe correction déséquilibres force unilatérale',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push Acceleration 15m Max',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled push accélération 15m explosive départ rapide première phase',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push Post-Run Fatigued 50m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled push 50m après course fatigue simulée HYROX transition réaliste',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Push Pyramid 25-50-75-50-25',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled push pyramide distances progression volume intensité variation',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sled']
  },

  // Sled Pull Techniques (12 exercises)
  {
    name: 'HYROX Sled Pull 50m Race Weight',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled pull 50m poids compétition HYROX tempo course technique traction',
    primary_muscles: ['dorsaux', 'ischio-jambiers'],
    secondary_muscles: ['biceps', 'trapèzes', 'fessiers'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull Heavy Overload 25m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled pull 25m surcharge lourde force maximale traction puissance dorsaux',
    primary_muscles: ['dorsaux', 'ischio-jambiers'],
    secondary_muscles: ['biceps', 'trapèzes', 'fessiers'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull Speed 50m Light',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Sled pull 50m léger vitesse maximale traction rapide coordination',
    primary_muscles: ['dorsaux', 'ischio-jambiers'],
    secondary_muscles: ['biceps', 'trapèzes', 'fessiers'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull Backward 50m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled pull reculant 50m quadriceps activation marche arrière contrôle',
    primary_muscles: ['quadriceps', 'dorsaux'],
    secondary_muscles: ['ischio-jambiers', 'biceps', 'fessiers'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull EMOM 10min 25m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled pull EMOM 25m chaque minute conditioning répétition endurance force',
    primary_muscles: ['dorsaux', 'ischio-jambiers'],
    secondary_muscles: ['biceps', 'trapèzes', 'fessiers'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull Hand Over Hand Rope',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Sled pull main sur main corde technique HYROX standard bras alternés',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['avant-bras', 'trapèzes', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull 100m Continuous',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled pull 100m continu endurance traction prolongée capacité travail',
    primary_muscles: ['dorsaux', 'ischio-jambiers'],
    secondary_muscles: ['biceps', 'trapèzes', 'fessiers'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull Intervals 25m x 8',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled pull intervalles 25m répétés lactique conditioning intensité',
    primary_muscles: ['dorsaux', 'ischio-jambiers'],
    secondary_muscles: ['biceps', 'trapèzes', 'fessiers'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull Single Arm Alternating',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled pull bras alternés isolé correction déséquilibres force unilatérale',
    primary_muscles: ['dorsaux', 'biceps'],
    secondary_muscles: ['obliques', 'trapèzes', 'avant-bras'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull Low Stance 50m',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Sled pull position basse stance quadriceps engagement stabilité core',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'abdominaux'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull Post-Run Fatigued 50m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled pull 50m après course fatigue simulée HYROX transition réaliste',
    primary_muscles: ['dorsaux', 'ischio-jambiers'],
    secondary_muscles: ['biceps', 'trapèzes', 'fessiers'],
    equipment: ['sled']
  },
  {
    name: 'Sled Pull Speed Challenge 25m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sled pull 25m vitesse maximale contre-la-montre technique optimale',
    primary_muscles: ['dorsaux', 'ischio-jambiers'],
    secondary_muscles: ['biceps', 'trapèzes', 'fessiers'],
    equipment: ['sled']
  },

  // Burpee Broad Jumps (10 exercises)
  {
    name: 'HYROX Burpee Broad Jump 80m Race',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Burpee broad jump 80m tempo compétition HYROX technique efficace distance',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Burpee Broad Jump Intervals 20m x 5',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Burpee broad jump intervalles 20m répétés lactique conditioning explosivité',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Burpee Broad Jump Max Distance',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Burpee broad jump distance maximale explosive puissance saut qualité',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Burpee Broad Jump Technical Drills',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Burpee broad jump drills technique tempo lent apprentissage efficacité',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Burpee Broad Jump EMOM 10min 5 Reps',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Burpee broad jump EMOM 5 reps chaque minute conditioning répétition',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Burpee Broad Jump Speed 40m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Burpee broad jump 40m vitesse maximale tempo rapide transition efficace',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Burpee Broad Jump Post-Run 40m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Burpee broad jump 40m après course fatigue simulée HYROX transition',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Burpee Broad Jump Chest to Ground Standard',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Burpee broad jump poitrine sol HYROX standard complet amplitude respectée',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Burpee Broad Jump Tabata 8 Rounds',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Burpee broad jump Tabata 20s work 10s rest haute intensité lactique',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },
  {
    name: 'Burpee Broad Jump Single Leg Landing',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Burpee broad jump réception une jambe stabilité contrôle force unilatérale',
    primary_muscles: ['pectoraux', 'quadriceps'],
    secondary_muscles: ['triceps', 'fessiers', 'abdominaux'],
    equipment: ['body weight']
  },

  // Rowing Intervals (12 exercises)
  {
    name: 'HYROX Row 1000m Race Pace',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Rowing 1000m race pace HYROX tempo compétition split optimal stratégie',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row Interval 250m x 4 Max Effort',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Rowing intervalles 250m effort maximal lactique puissance splits rapides',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row Negative Split 1000m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Rowing 1000m negative split accélération progressive pacing intelligence',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row Steady State 2000m',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Rowing 2000m tempo constant endurance aérobie capacité travail base',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row Sprint 100m Max Power',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Rowing 100m sprint maximal puissance explosive watts élevés anaérobie',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row EMOM 10min 150m',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Rowing EMOM 150m chaque minute conditioning répétition tempo contrôlé',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row Descending Ladder 500-400-300-200-100',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Rowing échelle descendante volume progression intensité accélération',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row Tabata 8 Rounds Max',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Rowing Tabata 20s work 10s rest haute intensité VO2max lactique',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row Technical Drills Slow',
    category: 'hyrox_station',
    difficulty: 'beginner',
    description: 'Rowing drills technique tempo lent séquence mouvement catch drive finish',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row 500m Time Trial',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Rowing 500m contre-la-montre effort maximal test performance split',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row Post-Run Fatigued 1000m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Rowing 1000m après course fatigue simulée HYROX transition réaliste',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },
  {
    name: 'Row Pyramid 100-200-300-200-100',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Rowing pyramide distances variation intensité volume mixte progression',
    primary_muscles: ['dorsaux', 'quadriceps'],
    secondary_muscles: ['biceps', 'ischio-jambiers', 'fessiers'],
    equipment: ['rowing machine']
  },

  // Farmers Carry Distances (10 exercises)
  {
    name: 'HYROX Farmers Carry 200m Race Weight',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Farmers carry 200m poids compétition HYROX tempo course grip endurance',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'fessiers', 'quadriceps'],
    equipment: ['kettlebell']
  },
  {
    name: 'Farmers Carry Heavy Overload 100m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Farmers carry 100m surcharge lourde force grip maximale préhension',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'fessiers', 'quadriceps'],
    equipment: ['kettlebell']
  },
  {
    name: 'Farmers Carry Speed 200m Light',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Farmers carry 200m léger vitesse maximale tempo rapide transition',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'fessiers', 'quadriceps'],
    equipment: ['kettlebell']
  },
  {
    name: 'Farmers Carry EMOM 10min 50m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Farmers carry EMOM 50m chaque minute conditioning répétition grip',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'fessiers', 'quadriceps'],
    equipment: ['kettlebell']
  },
  {
    name: 'Farmers Carry Intervals 50m x 8',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Farmers carry intervalles 50m répétés grip endurance conditioning',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'fessiers', 'quadriceps'],
    equipment: ['kettlebell']
  },
  {
    name: 'Farmers Carry Post-Run Fatigued 200m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Farmers carry 200m après course fatigue simulée HYROX transition',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'fessiers', 'quadriceps'],
    equipment: ['kettlebell']
  },
  {
    name: 'Farmers Carry Single Side 100m',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Farmers carry unilatéral 100m core anti-rotation stabilisation obliques',
    primary_muscles: ['trapèzes', 'obliques'],
    secondary_muscles: ['avant-bras', 'abdominaux', 'fessiers'],
    equipment: ['kettlebell']
  },
  {
    name: 'Farmers Carry Shuttle 25m x 8',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Farmers carry navettes 25m transitions direction changement grip lactique',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'fessiers', 'quadriceps'],
    equipment: ['kettlebell']
  },
  {
    name: 'Farmers Carry Max Distance Hold',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Farmers carry distance maximale grip endurance mental force préhension',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'fessiers', 'quadriceps'],
    equipment: ['kettlebell']
  },
  {
    name: 'Farmers Carry Pyramid 50-100-150-100-50',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Farmers carry pyramide distances progression volume grip endurance',
    primary_muscles: ['trapèzes', 'avant-bras'],
    secondary_muscles: ['abdominaux', 'fessiers', 'quadriceps'],
    equipment: ['kettlebell']
  },

  // Sandbag Lunges (10 exercises)
  {
    name: 'HYROX Sandbag Lunges 100m Race Weight',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sandbag lunges 100m poids compétition HYROX tempo course technique fentes',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sandbag']
  },
  {
    name: 'Sandbag Lunges Heavy Overload 50m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sandbag lunges 50m surcharge lourde force maximale jambes stabilité',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sandbag']
  },
  {
    name: 'Sandbag Lunges Speed 100m Light',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Sandbag lunges 100m léger vitesse maximale tempo rapide transition',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sandbag']
  },
  {
    name: 'Sandbag Lunges EMOM 10min 20m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sandbag lunges EMOM 20m chaque minute conditioning répétition jambes',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sandbag']
  },
  {
    name: 'Sandbag Lunges Walking Continuous',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Sandbag lunges marche continue technique perfectionnement amplitude contrôle',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sandbag']
  },
  {
    name: 'Sandbag Lunges Post-Run Fatigued 100m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sandbag lunges 100m après course fatigue simulée HYROX transition',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sandbag']
  },
  {
    name: 'Sandbag Lunges Reverse 50m',
    category: 'hyrox_station',
    difficulty: 'intermediate',
    description: 'Sandbag lunges arrière 50m variation activation ischio-jambiers fessiers',
    primary_muscles: ['fessiers', 'ischio-jambiers'],
    secondary_muscles: ['quadriceps', 'mollets', 'abdominaux'],
    equipment: ['sandbag']
  },
  {
    name: 'Sandbag Lunges Intervals 25m x 8',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sandbag lunges intervalles 25m répétés lactique conditioning jambes',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sandbag']
  },
  {
    name: 'Sandbag Lunges Overhead 50m',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sandbag lunges overhead 50m stabilité core deltoïdes endurance épaules',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'abdominaux', 'trapèzes'],
    equipment: ['sandbag']
  },
  {
    name: 'Sandbag Lunges Max Distance Challenge',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Sandbag lunges distance maximale endurance mentale force jambes capacité',
    primary_muscles: ['quadriceps', 'fessiers'],
    secondary_muscles: ['ischio-jambiers', 'mollets', 'abdominaux'],
    equipment: ['sandbag']
  },

  // Wall Balls Endurance (10 exercises)
  {
    name: 'HYROX Wall Balls 100 Reps Race Pace',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Wall balls 100 reps race pace HYROX tempo compétition rythme optimal',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['medicine ball']
  },
  {
    name: 'Wall Balls EMOM 10min 15 Reps',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Wall balls EMOM 15 reps chaque minute conditioning répétition endurance',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['medicine ball']
  },
  {
    name: 'Wall Balls Intervals 25 Reps x 5',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Wall balls intervalles 25 reps répétés lactique conditioning puissance',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['medicine ball']
  },
  {
    name: 'Wall Balls Steady Pace 150 Reps',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Wall balls 150 reps tempo constant endurance volume capacité travail',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['medicine ball']
  },
  {
    name: 'Wall Balls Speed 50 Reps Max',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Wall balls 50 reps vitesse maximale tempo rapide puissance explosive',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['medicine ball']
  },
  {
    name: 'Wall Balls Technical Drills',
    category: 'hyrox_station',
    difficulty: 'beginner',
    description: 'Wall balls drills technique tempo lent squat profondeur lancer précision',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['medicine ball']
  },
  {
    name: 'Wall Balls Post-Run Fatigued 75 Reps',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Wall balls 75 reps après course fatigue simulée HYROX transition',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['medicine ball']
  },
  {
    name: 'Wall Balls Tabata 8 Rounds',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Wall balls Tabata 20s work 10s rest haute intensité lactique VO2max',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['medicine ball']
  },
  {
    name: 'Wall Balls Descending Ladder 30-25-20-15-10',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Wall balls échelle descendante volume progression intensité accélération',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['medicine ball']
  },
  {
    name: 'Wall Balls Max Unbroken Set',
    category: 'hyrox_station',
    difficulty: 'advanced',
    description: 'Wall balls set maximal sans pause endurance mentale capacité lactique',
    primary_muscles: ['quadriceps', 'deltoïdes'],
    secondary_muscles: ['fessiers', 'pectoraux', 'triceps'],
    equipment: ['medicine ball']
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
  console.log('\n🚀 Starting HYROX Stations Detailed seeding...\n');
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

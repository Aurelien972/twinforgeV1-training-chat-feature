/**
 * Migration Script: Exercises to Supabase
 *
 * Extracts all exercises from TypeScript files and migrates to Supabase database
 *
 * Usage:
 *   npm install --save-dev tsx
 *   npx tsx scripts/migrate-exercises-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// Type Definitions
// ============================================================================

interface ExerciseInsert {
  name: string;
  discipline: string;
  category?: string;
  subcategory?: string;
  difficulty: string;
  description_short: string;
  description_full?: string;
  movement_pattern?: string;
  primary_energy_system?: string;
  technical_complexity?: number;
  injury_risk?: string;
  benefits?: string[];
  safety_notes?: string[];
  common_mistakes?: string[];
  visual_keywords?: string[];
  execution_phases?: string[];
  typical_sets_min?: number;
  typical_sets_max?: number;
  typical_reps_min?: number;
  typical_reps_max?: number;
  typical_rest_sec?: number;
  typical_duration_min?: number;
  typical_duration_max?: number;
  rx_weight_male_kg?: number;
  rx_weight_female_kg?: number;
  scaling_options?: any;
  illustration_priority?: number;
  is_validated: boolean;
  metadata?: any;
}

interface ExecutionDetailInsert {
  exercise_id: string;
  phase_number: number;
  phase_name: string;
  phase_description: string;
  muscle_activation_cues?: string[];
}

interface CoachingCueInsert {
  exercise_id: string;
  target_level: string;
  cue_type: string;
  cue_text: string;
  cue_priority: number;
}

interface ProgressionInsert {
  exercise_id: string;
  related_exercise_id: string;
  relationship_type: string;
  difficulty_delta?: number;
  sequence_order?: number;
}

// ============================================================================
// Calisthenics Exercises Data
// ============================================================================

const CALISTHENICS_EXERCISES = [
  {
    name: 'Scapula Pull-ups',
    category: 'pull',
    difficulty: 'beginner',
    description: 'Activation scapulaire sans flexion des coudes',
    primaryMuscles: ['Trapezius', 'Rhomboids', 'Serratus anterior'],
    equipment: ['pull-up-bar'],
    progressionPath: ['Negative pull-ups', 'Pull-ups'],
    coachingCues: ['Déprimer les épaules', 'Élever le corps sans plier coudes', 'Contracter scapulas'],
    commonMistakes: ['Plier les coudes', 'Hausser les épaules', 'Mouvement trop ample'],
    safetyNotes: ['Mouvement essentiel avant tractions']
  },
  {
    name: 'Negative Pull-ups',
    category: 'pull',
    difficulty: 'beginner',
    description: 'Descente contrôlée de 5 secondes depuis position haute',
    primaryMuscles: ['Lats', 'Biceps', 'Trapezius'],
    equipment: ['pull-up-bar'],
    progressionPath: ['Band-assisted pull-ups', 'Pull-ups'],
    regressionPath: ['Scapula pull-ups'],
    coachingCues: ['Descente de 5 secondes minimum', 'Contrôle total', 'Ne pas lâcher brusquement'],
    commonMistakes: ['Descente trop rapide', 'Perte de tension', 'Épaules haussées'],
    safetyNotes: ['Excellent pour renforcer excentrique']
  },
  {
    name: 'Pull-ups',
    category: 'pull',
    difficulty: 'intermediate',
    description: 'Traction complète menton au-dessus de la barre',
    primaryMuscles: ['Lats', 'Biceps', 'Trapezius'],
    equipment: ['pull-up-bar'],
    progressionPath: ['Archer pull-ups', 'Weighted pull-ups', 'One-arm assisted'],
    regressionPath: ['Negative pull-ups', 'Band-assisted'],
    coachingCues: ['Full ROM', 'Menton au-dessus barre', 'Descente contrôlée', 'Core engagé'],
    commonMistakes: ['Kipping excessif', 'ROM partiel', 'Épaules vers oreilles'],
    safetyNotes: ['Échauffement scapulaire obligatoire', 'Progression graduelle']
  },
  {
    name: 'Archer Pull-ups',
    category: 'pull',
    difficulty: 'advanced',
    description: 'Pull-up avec un bras dominant, un bras tendu latéralement',
    primaryMuscles: ['Lats', 'Biceps'],
    equipment: ['pull-up-bar'],
    progressionPath: ['Typewriter pull-ups', 'One-arm assisted'],
    regressionPath: ['Pull-ups', 'Wide grip pull-ups'],
    coachingCues: ['Un bras tire, un guide', 'Bras tendu reste tendu', 'Alterner côtés'],
    commonMistakes: ['Plier bras passif', 'Rotation excessive', 'Perte forme'],
    safetyNotes: ['Prérequis: 10+ pull-ups stricts']
  },
  {
    name: 'One-arm Pull-up',
    category: 'pull',
    difficulty: 'elite',
    description: 'Traction à un bras complet',
    primaryMuscles: ['Lats', 'Biceps'],
    equipment: ['pull-up-bar'],
    regressionPath: ['One-arm assisted', 'Archer pull-ups'],
    coachingCues: ['Core ultra-stable', 'Éviter rotation', 'Pull explosif initial'],
    commonMistakes: ['Trop de rotation', 'Manque de force', 'ROM partiel'],
    safetyNotes: ['Skill élite: 20+ pull-ups, 5+ archer requis']
  },
  {
    name: 'Wall Push-ups',
    category: 'push',
    difficulty: 'beginner',
    description: 'Pompes debout contre un mur',
    primaryMuscles: ['Pectoraux', 'Triceps', 'Deltoïdes'],
    equipment: ['wall'],
    progressionPath: ['Incline push-ups', 'Push-ups'],
    coachingCues: ['Corps aligné', 'Descente contrôlée', 'Coudes 45°'],
    commonMistakes: ['Fesses en arrière', 'Coudes trop écartés', 'ROM partiel'],
    safetyNotes: ['Idéal débutants absolus']
  },
  {
    name: 'Push-ups',
    category: 'push',
    difficulty: 'intermediate',
    description: 'Pompes classiques au sol',
    primaryMuscles: ['Pectoraux', 'Triceps', 'Deltoïdes'],
    equipment: [],
    progressionPath: ['Diamond push-ups', 'Archer push-ups', 'One-arm assisted'],
    regressionPath: ['Knee push-ups', 'Incline push-ups'],
    coachingCues: ['Planche parfaite', 'Coudes 45°', 'Poitrine au sol', 'Core serré'],
    commonMistakes: ['Hanches qui tombent', 'Coudes trop larges', 'Tête vers sol'],
    safetyNotes: ['Fondation essentielle']
  },
  {
    name: 'Pike Push-ups',
    category: 'push',
    difficulty: 'intermediate',
    description: 'Push-ups en V inversé, progressions handstand',
    primaryMuscles: ['Deltoïdes', 'Triceps'],
    equipment: [],
    progressionPath: ['Elevated pike push-ups', 'Wall HSPU', 'Handstand push-ups'],
    regressionPath: ['Push-ups'],
    coachingCues: ['Hanches hautes', 'Tête vers sol', 'Coudes serrés', 'Poids sur épaules'],
    commonMistakes: ['Hanches trop basses', 'Coudes trop larges', 'ROM partiel'],
    safetyNotes: ['Excellent pour développer épaules']
  },
  {
    name: 'Handstand Push-ups',
    category: 'push',
    difficulty: 'advanced',
    description: 'HSPU complet mur ou freestanding',
    primaryMuscles: ['Deltoïdes', 'Triceps'],
    equipment: ['wall'],
    progressionPath: ['Freestanding HSPU', 'Deficit HSPU'],
    regressionPath: ['Pike push-ups elevated', 'Wall HSPU partial'],
    coachingCues: ['Descente contrôlée', 'Tête touche sol', 'Push explosif', 'Corps aligné'],
    commonMistakes: ['ROM partiel', 'Dos arqué', 'Perte équilibre'],
    safetyNotes: ['Prérequis: handstand hold 45s+']
  },
  {
    name: 'Bench Dips',
    category: 'push',
    difficulty: 'beginner',
    description: 'Dips sur banc ou chaise',
    primaryMuscles: ['Triceps', 'Pectoraux'],
    equipment: ['bench'],
    progressionPath: ['Parallel bar dips'],
    coachingCues: ['Coudes vers arrière', 'Épaules basses', 'Descente contrôlée'],
    commonMistakes: ['Épaules haussées', 'Descente trop profonde', 'Coudes écartés'],
    safetyNotes: ['Attention épaules']
  },
  {
    name: 'Parallel Bar Dips',
    category: 'push',
    difficulty: 'intermediate',
    description: 'Dips sur barres parallèles',
    primaryMuscles: ['Triceps', 'Pectoraux', 'Deltoïdes'],
    equipment: ['parallel-bars'],
    progressionPath: ['Ring dips', 'Weighted dips'],
    regressionPath: ['Bench dips', 'Negative dips'],
    coachingCues: ['Descendre 90° coudes', 'Corps légèrement penché', 'Push explosif'],
    commonMistakes: ['Épaules vers oreilles', 'Pas assez profond', 'Trop de lean'],
    safetyNotes: ['Échauffement épaules obligatoire']
  },
  {
    name: 'Ring Dips',
    category: 'push',
    difficulty: 'advanced',
    description: 'Dips sur anneaux de gymnastique',
    primaryMuscles: ['Triceps', 'Pectoraux', 'Deltoïdes'],
    equipment: ['gymnastic-rings'],
    progressionPath: ['Weighted ring dips'],
    regressionPath: ['Parallel bar dips', 'Ring support hold'],
    coachingCues: ['Stabiliser anneaux', 'Coudes serrés', 'Core ultra-serré'],
    commonMistakes: ['Anneaux instables', 'Perte contrôle', 'ROM partiel'],
    safetyNotes: ['Prérequis: 10+ bar dips stricts']
  },
  {
    name: 'Plank',
    category: 'core',
    difficulty: 'beginner',
    description: 'Gainage ventral statique',
    primaryMuscles: ['Core', 'Abs'],
    equipment: [],
    progressionPath: ['RKC plank', 'Weighted plank'],
    coachingCues: ['Corps aligné', 'Core serré', 'Glutes contractés', 'Respiration normale'],
    commonMistakes: ['Hanches qui tombent', 'Fesses hautes', 'Tête vers sol'],
    safetyNotes: ['Fondation core essentielle']
  },
  {
    name: 'L-sit Tucked',
    category: 'core',
    difficulty: 'intermediate',
    description: 'L-sit genoux repliés vers poitrine',
    primaryMuscles: ['Hip flexors', 'Abs', 'Serratus'],
    equipment: ['parallettes'],
    progressionPath: ['L-sit one leg', 'Full L-sit'],
    regressionPath: ['Knee raises'],
    coachingCues: ['Épaules déprimées', 'Bassin rétroversion', 'Genoux serrés'],
    commonMistakes: ['Épaules haussées', 'Dos rond', 'Respiration bloquée'],
    safetyNotes: ['Poignets échauffés obligatoire']
  },
  {
    name: 'Full L-sit',
    category: 'core',
    difficulty: 'advanced',
    description: 'L-sit jambes tendues horizontales',
    primaryMuscles: ['Hip flexors', 'Abs', 'Serratus'],
    equipment: ['parallettes', 'parallel-bars'],
    progressionPath: ['V-sit', 'Manna progressions'],
    regressionPath: ['L-sit one leg', 'L-sit tucked'],
    coachingCues: ['Compression maximale', 'Jambes verrouillées', 'Orteils pointés'],
    commonMistakes: ['Genoux pliés', 'Jambes qui tombent', 'Perte position'],
    safetyNotes: ['Skill compression critique']
  },
  {
    name: 'Dragon Flag',
    category: 'core',
    difficulty: 'elite',
    description: 'Corps tendu horizontal seulement épaules au support',
    primaryMuscles: ['Abs', 'Core'],
    equipment: ['bench'],
    regressionPath: ['Negative dragon flag', 'Tuck dragon flag'],
    coachingCues: ['Corps rigide', 'Contrôle excentrique', 'Lats activés'],
    commonMistakes: ['Hanches qui cassent', 'Trop rapide', 'Perte tension'],
    safetyNotes: ['Skill élite: core extrêmement fort requis']
  },
  {
    name: 'Front Lever Tuck',
    category: 'skills',
    difficulty: 'intermediate',
    description: 'Front lever genoux vers poitrine',
    primaryMuscles: ['Lats', 'Core', 'Shoulders'],
    equipment: ['pull-up-bar'],
    progressionPath: ['Advanced tuck', 'Straddle', 'Full front lever'],
    regressionPath: ['Tuck dragon flag'],
    coachingCues: ['Corps horizontal', 'Genoux serrés', 'Lats activés', 'Regard neutre'],
    commonMistakes: ['Hanches trop hautes', 'Épaules pas engagées', 'Tête qui lève'],
    safetyNotes: ['Prérequis: 10+ pull-ups']
  },
  {
    name: 'Full Front Lever',
    category: 'skills',
    difficulty: 'elite',
    description: 'Corps complètement horizontal jambes tendues',
    primaryMuscles: ['Lats', 'Core', 'Shoulders'],
    equipment: ['pull-up-bar'],
    progressionPath: ['Front lever pull-ups', 'Front lever touch'],
    regressionPath: ['Straddle', 'One leg'],
    coachingCues: ['Corps rigide planche', 'Lats pull down', 'Glutes serrés'],
    commonMistakes: ['Hanches cassent', 'Jambes tombent', 'Épaules perdent position'],
    safetyNotes: ['Skill élite: patience de 1-2 ans']
  },
  {
    name: 'Muscle-up',
    category: 'skills',
    difficulty: 'advanced',
    description: 'Transition pull-up vers dip en un mouvement',
    primaryMuscles: ['Lats', 'Pectoraux', 'Triceps'],
    equipment: ['pull-up-bar'],
    progressionPath: ['Ring muscle-up', 'Weighted muscle-up'],
    regressionPath: ['High pull-ups', 'Negative muscle-up'],
    coachingCues: ['Pull explosif sternum', 'Transition rapide', 'Push agressif'],
    commonMistakes: ['Pas assez haut pull', 'Transition lente', 'Kip excessif'],
    safetyNotes: ['Prérequis: 10 pull-ups + 15 dips']
  },
  {
    name: 'Human Flag',
    category: 'skills',
    difficulty: 'elite',
    description: 'Corps horizontal perpendiculaire au poteau',
    primaryMuscles: ['Lats', 'Obliques', 'Shoulders'],
    equipment: ['pole'],
    regressionPath: ['Tuck flag', 'Straddle flag'],
    coachingCues: ['Bras bas pousse', 'Bras haut tire', 'Corps rigide'],
    commonMistakes: ['Grip inadéquat', 'Corps pas rigide', 'Hanches cassent'],
    safetyNotes: ['Skill spectaculaire mais difficile']
  }
];

// ============================================================================
// Helper Functions
// ============================================================================

async function getMuscleGroupId(muscleName: string): Promise<string | null> {
  const normalized = muscleName.toLowerCase().replace(/\s+/g, '');

  const { data, error } = await supabase
    .from('muscle_groups')
    .select('id')
    .or(`name_en.ilike.%${muscleName}%,name_fr.ilike.%${muscleName}%`)
    .limit(1)
    .single();

  if (error || !data) {
    console.warn(`⚠️  Muscle group not found: ${muscleName}`);
    return null;
  }

  return data.id;
}

async function getEquipmentId(equipmentName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('equipment_types')
    .select('id')
    .eq('name', equipmentName)
    .limit(1)
    .single();

  if (error || !data) {
    console.warn(`⚠️  Equipment not found: ${equipmentName}`);
    return null;
  }

  return data.id;
}

// ============================================================================
// Migration Functions
// ============================================================================

async function migrateCalisthenicsExercises() {
  console.log('\n🏋️  Migrating Calisthenics Exercises...\n');

  const exerciseMap = new Map<string, string>();

  for (const ex of CALISTHENICS_EXERCISES) {
    console.log(`  → ${ex.name}`);

    // Prepare exercise data
    const exerciseData: ExerciseInsert = {
      name: ex.name,
      discipline: 'calisthenics',
      category: ex.category,
      difficulty: ex.difficulty,
      description_short: ex.description,
      movement_pattern: ex.category === 'pull' ? 'pull' : ex.category === 'push' ? 'push' : ex.category === 'core' ? 'hold' : 'skill',
      safety_notes: ex.safetyNotes,
      common_mistakes: ex.commonMistakes,
      visual_keywords: ['bodyweight', 'calisthenics', ex.category],
      technical_complexity: ex.difficulty === 'beginner' ? 3 : ex.difficulty === 'intermediate' ? 5 : ex.difficulty === 'advanced' ? 7 : 9,
      injury_risk: ex.difficulty === 'beginner' ? 'low' : ex.difficulty === 'elite' ? 'high' : 'moderate',
      illustration_priority: ex.difficulty === 'intermediate' || ex.difficulty === 'advanced' ? 8 : 6,
      is_validated: true,
    };

    // Insert exercise
    const { data: insertedEx, error: exError } = await supabase
      .from('exercises')
      .insert(exerciseData)
      .select('id')
      .single();

    if (exError || !insertedEx) {
      console.error(`    ❌ Failed to insert exercise: ${exError?.message}`);
      continue;
    }

    exerciseMap.set(ex.name, insertedEx.id);

    // Insert muscle groups
    for (const muscle of ex.primaryMuscles) {
      const muscleId = await getMuscleGroupId(muscle);
      if (muscleId) {
        await supabase
          .from('exercise_muscle_groups')
          .insert({
            exercise_id: insertedEx.id,
            muscle_group_id: muscleId,
            involvement_type: 'primary'
          });
      }
    }

    // Insert equipment
    if (ex.equipment && ex.equipment.length > 0) {
      for (const equipment of ex.equipment) {
        const equipmentId = await getEquipmentId(equipment);
        if (equipmentId) {
          await supabase
            .from('exercise_equipment')
            .insert({
              exercise_id: insertedEx.id,
              equipment_id: equipmentId,
              is_required: true
            });
        }
      }
    }

    // Insert coaching cues
    for (let i = 0; i < ex.coachingCues.length; i++) {
      await supabase
        .from('exercise_coaching_cues')
        .insert({
          exercise_id: insertedEx.id,
          target_level: 'all',
          cue_type: 'execution',
          cue_text: ex.coachingCues[i],
          cue_priority: 5
        });
    }

    console.log(`    ✅ Inserted with ${ex.primaryMuscles.length} muscles, ${ex.equipment?.length || 0} equipment, ${ex.coachingCues.length} cues`);
  }

  // Insert progressions
  console.log('\n  → Inserting progressions...');
  for (const ex of CALISTHENICS_EXERCISES) {
    const exerciseId = exerciseMap.get(ex.name);
    if (!exerciseId) continue;

    if (ex.progressionPath) {
      for (let i = 0; i < ex.progressionPath.length; i++) {
        const relatedId = exerciseMap.get(ex.progressionPath[i]);
        if (relatedId) {
          await supabase
            .from('exercise_progressions')
            .insert({
              exercise_id: exerciseId,
              related_exercise_id: relatedId,
              relationship_type: 'progression',
              difficulty_delta: 1,
              sequence_order: i + 1
            });
        }
      }
    }

    if (ex.regressionPath) {
      for (let i = 0; i < ex.regressionPath.length; i++) {
        const relatedId = exerciseMap.get(ex.regressionPath[i]);
        if (relatedId) {
          await supabase
            .from('exercise_progressions')
            .insert({
              exercise_id: exerciseId,
              related_exercise_id: relatedId,
              relationship_type: 'regression',
              difficulty_delta: -1,
              sequence_order: i + 1
            });
        }
      }
    }
  }

  console.log(`\n✅ Migrated ${CALISTHENICS_EXERCISES.length} calisthenics exercises\n`);
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🚀 Starting Exercise Migration to Supabase\n');
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  console.log(`🔐 Using Service Role Key\n`);

  try {
    await migrateCalisthenicsExercises();

    console.log('\n🎉 Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

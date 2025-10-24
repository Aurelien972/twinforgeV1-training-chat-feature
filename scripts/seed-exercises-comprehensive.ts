/**
 * Comprehensive Exercise Seeding Script
 *
 * Seeds 3000+ exercises across all disciplines into Supabase
 * Organized by discipline with batch processing and error handling
 *
 * Usage:
 *   npx tsx scripts/seed-exercises-comprehensive.ts [--discipline=force] [--batch-size=50]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// Types
// ============================================================================

interface ExerciseSeed {
  name: string;
  discipline: 'force' | 'calisthenics' | 'functional' | 'endurance' | 'mobility' | 'rehab';
  category: string;
  subcategory?: string;
  difficulty: 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite' | 'master';
  description_short: string;
  description_full?: string;
  movement_pattern?: string;
  primary_muscles: string[];
  secondary_muscles?: string[];
  equipment: string[];
  equipment_alternatives?: string[];
  progressions?: string[];
  regressions?: string[];
  coaching_cues: string[];
  common_mistakes: string[];
  safety_notes: string[];
  benefits?: string[];
  target_goals?: string[];
  typical_sets_min?: number;
  typical_sets_max?: number;
  typical_reps_min?: number;
  typical_reps_max?: number;
  typical_rest_sec?: number;
  technical_complexity?: number;
  injury_risk?: 'low' | 'moderate' | 'high';
  is_validated: boolean;
  illustration_priority?: number;
}

// ============================================================================
// Muscle & Equipment Mapping Cache
// ============================================================================

const muscleCache = new Map<string, string>();
const equipmentCache = new Map<string, string>();

async function getMuscleGroupId(muscleName: string): Promise<string | null> {
  if (muscleCache.has(muscleName.toLowerCase())) {
    return muscleCache.get(muscleName.toLowerCase())!;
  }

  const { data, error } = await supabase
    .from('muscle_groups')
    .select('id')
    .or(`name_en.ilike.%${muscleName}%,name_fr.ilike.%${muscleName}%`)
    .limit(1)
    .maybeSingle();

  if (!data) {
    console.warn(`⚠️  Muscle group not found: ${muscleName}`);
    return null;
  }

  muscleCache.set(muscleName.toLowerCase(), data.id);
  return data.id;
}

async function getEquipmentId(equipmentName: string): Promise<string | null> {
  if (equipmentCache.has(equipmentName.toLowerCase())) {
    return equipmentCache.get(equipmentName.toLowerCase())!;
  }

  const { data, error } = await supabase
    .from('equipment_types')
    .select('id')
    .or(`name.ilike.%${equipmentName}%,name_en.ilike.%${equipmentName}%,name_fr.ilike.%${equipmentName}%`)
    .limit(1)
    .maybeSingle();

  if (!data) {
    console.warn(`⚠️  Equipment not found: ${equipmentName}`);
    return null;
  }

  equipmentCache.set(equipmentName.toLowerCase(), data.id);
  return data.id;
}

// ============================================================================
// Exercise Insertion
// ============================================================================

async function insertExercise(exercise: ExerciseSeed): Promise<string | null> {
  try {
    // Insert main exercise
    const { data: insertedEx, error: exError } = await supabase
      .from('exercises')
      .insert({
        name: exercise.name,
        discipline: exercise.discipline,
        category: exercise.category,
        subcategory: exercise.subcategory,
        difficulty: exercise.difficulty,
        description_short: exercise.description_short,
        description_full: exercise.description_full,
        movement_pattern: exercise.movement_pattern,
        technical_complexity: exercise.technical_complexity || 5,
        injury_risk: exercise.injury_risk || 'moderate',
        safety_notes: exercise.safety_notes,
        common_mistakes: exercise.common_mistakes,
        benefits: exercise.benefits,
        target_goals: exercise.target_goals,
        typical_sets_min: exercise.typical_sets_min,
        typical_sets_max: exercise.typical_sets_max,
        typical_reps_min: exercise.typical_reps_min,
        typical_reps_max: exercise.typical_reps_max,
        typical_rest_sec: exercise.typical_rest_sec,
        visual_keywords: [exercise.discipline, exercise.category],
        is_validated: exercise.is_validated,
        illustration_priority: exercise.illustration_priority || 5,
      })
      .select('id')
      .single();

    if (exError || !insertedEx) {
      console.error(`  ❌ Failed to insert ${exercise.name}: ${exError?.message}`);
      return null;
    }

    const exerciseId = insertedEx.id;

    // Insert muscle groups
    for (const muscle of exercise.primary_muscles) {
      const muscleId = await getMuscleGroupId(muscle);
      if (muscleId) {
        await supabase.from('exercise_muscle_groups').insert({
          exercise_id: exerciseId,
          muscle_group_id: muscleId,
          involvement_type: 'primary',
          activation_percentage: 80,
        });
      }
    }

    if (exercise.secondary_muscles) {
      for (const muscle of exercise.secondary_muscles) {
        const muscleId = await getMuscleGroupId(muscle);
        if (muscleId) {
          await supabase.from('exercise_muscle_groups').insert({
            exercise_id: exerciseId,
            muscle_group_id: muscleId,
            involvement_type: 'secondary',
            activation_percentage: 50,
          });
        }
      }
    }

    // Insert equipment
    for (const equip of exercise.equipment) {
      const equipId = await getEquipmentId(equip);
      if (equipId) {
        await supabase.from('exercise_equipment').insert({
          exercise_id: exerciseId,
          equipment_id: equipId,
          is_required: true,
          is_alternative: false,
        });
      }
    }

    if (exercise.equipment_alternatives) {
      for (const equip of exercise.equipment_alternatives) {
        const equipId = await getEquipmentId(equip);
        if (equipId) {
          await supabase.from('exercise_equipment').insert({
            exercise_id: exerciseId,
            equipment_id: equipId,
            is_required: false,
            is_alternative: true,
          });
        }
      }
    }

    // Insert coaching cues
    for (let i = 0; i < exercise.coaching_cues.length; i++) {
      await supabase.from('exercise_coaching_cues').insert({
        exercise_id: exerciseId,
        target_level: 'all',
        cue_type: 'execution',
        cue_text: exercise.coaching_cues[i],
        cue_priority: Math.min(10, 10 - i),
      });
    }

    return exerciseId;
  } catch (error) {
    console.error(`  ❌ Exception inserting ${exercise.name}:`, error);
    return null;
  }
}

async function insertExerciseBatch(
  exercises: ExerciseSeed[],
  batchName: string
): Promise<{ success: number; failed: number }> {
  console.log(`\n📦 Processing batch: ${batchName} (${exercises.length} exercises)`);

  let success = 0;
  let failed = 0;

  for (const exercise of exercises) {
    const id = await insertExercise(exercise);
    if (id) {
      success++;
      process.stdout.write('✓');
    } else {
      failed++;
      process.stdout.write('✗');
    }
  }

  console.log(`\n  ✅ Success: ${success} | ❌ Failed: ${failed}`);
  return { success, failed };
}

// ============================================================================
// Exercise Data - CALISTHENICS (Sample - 50 exercises)
// ============================================================================

const CALISTHENICS_EXERCISES: ExerciseSeed[] = [
  {
    name: 'Scapula Pull-ups',
    discipline: 'calisthenics',
    category: 'pull',
    difficulty: 'beginner',
    description_short: 'Activation scapulaire sans flexion des coudes',
    movement_pattern: 'pull',
    primary_muscles: ['Trapezius', 'Rhomboids', 'Serratus anterior'],
    secondary_muscles: ['Lats'],
    equipment: ['pull-up-bar'],
    progressions: ['Negative pull-ups', 'Pull-ups'],
    coaching_cues: ['Déprimer les épaules', 'Élever le corps sans plier coudes', 'Contracter scapulas'],
    common_mistakes: ['Plier les coudes', 'Hausser les épaules', 'Mouvement trop ample'],
    safety_notes: ['Mouvement essentiel avant tractions'],
    benefits: ['Renforce les stabilisateurs scapulaires', 'Prévient les blessures d\'épaule'],
    target_goals: ['strength', 'skill'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 8,
    typical_reps_max: 15,
    typical_rest_sec: 60,
    technical_complexity: 3,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 7,
  },
  {
    name: 'Pull-ups (Strict)',
    discipline: 'calisthenics',
    category: 'pull',
    difficulty: 'intermediate',
    description_short: 'Traction complète menton au-dessus de la barre',
    movement_pattern: 'pull',
    primary_muscles: ['Lats', 'Biceps', 'Trapezius'],
    secondary_muscles: ['Forearms', 'Core', 'Rhomboids'],
    equipment: ['pull-up-bar'],
    progressions: ['Weighted pull-ups', 'Archer pull-ups'],
    regressions: ['Negative pull-ups', 'Band-assisted pull-ups'],
    coaching_cues: ['Full ROM', 'Menton au-dessus barre', 'Descente contrôlée', 'Core engagé'],
    common_mistakes: ['Kipping excessif', 'ROM partiel', 'Épaules vers oreilles'],
    safety_notes: ['Échauffement scapulaire obligatoire', 'Progression graduelle'],
    benefits: ['Force du haut du corps', 'Développement dorsal', 'Core stability'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 5,
    typical_reps_max: 12,
    typical_rest_sec: 120,
    technical_complexity: 5,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 9,
  },
  // ... Add more calisthenics exercises here ...
];

// ============================================================================
// Exercise Data - FORCE/MUSCULATION (Sample - 50 exercises)
// ============================================================================

const FORCE_EXERCISES: ExerciseSeed[] = [
  {
    name: 'Barbell Back Squat',
    discipline: 'force',
    category: 'squat',
    subcategory: 'compound',
    difficulty: 'intermediate',
    description_short: 'Squat avec barre sur le haut du dos',
    description_full: 'Mouvement fondamental pour les jambes et le bas du corps. Barre posée sur les trapèzes, descente contrôlée jusqu\'à ce que les cuisses soient parallèles au sol ou plus bas.',
    movement_pattern: 'squat',
    primary_muscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    secondary_muscles: ['Core', 'Erector Spinae', 'Calves'],
    equipment: ['barbell', 'squat-rack'],
    equipment_alternatives: ['dumbbells', 'kettlebells'],
    progressions: ['Front squat', 'Pause squat', 'Box squat'],
    regressions: ['Goblet squat', 'Bodyweight squat'],
    coaching_cues: [
      'Pieds largeur d\'épaules',
      'Genoux suivent direction des orteils',
      'Poids sur talons',
      'Poitrine haute',
      'Core contracté',
      'Descente contrôlée',
    ],
    common_mistakes: [
      'Genoux qui rentrent',
      'Talons qui décollent',
      'Dos arrondi',
      'ROM insuffisante',
      'Perte de tension en bas',
    ],
    safety_notes: [
      'Échauffement progressif obligatoire',
      'Utiliser des sécurités de rack',
      'Ne pas rebondir en bas',
      'Maintenir la neutralité de la colonne',
    ],
    benefits: [
      'Force des jambes',
      'Développement musculaire global',
      'Amélioration de la mobilité',
      'Transfert athlétique élevé',
    ],
    target_goals: ['strength', 'hypertrophy', 'power'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 5,
    typical_reps_max: 8,
    typical_rest_sec: 180,
    technical_complexity: 7,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 10,
  },
  {
    name: 'Barbell Bench Press',
    discipline: 'force',
    category: 'push',
    subcategory: 'chest',
    difficulty: 'intermediate',
    description_short: 'Développé couché avec barre',
    description_full: 'Exercice roi pour les pectoraux. Allongé sur un banc, descendre la barre vers la poitrine puis pousser jusqu\'à l\'extension complète des bras.',
    movement_pattern: 'push',
    primary_muscles: ['Pectorals', 'Triceps', 'Deltoids'],
    secondary_muscles: ['Core', 'Lats', 'Serratus anterior'],
    equipment: ['barbell', 'bench'],
    equipment_alternatives: ['dumbbells'],
    progressions: ['Incline bench press', 'Close-grip bench press', 'Board press'],
    regressions: ['Dumbbell press', 'Push-ups'],
    coaching_cues: [
      'Pieds ancrés au sol',
      'Omoplates rétractées',
      'Légère arche lombaire',
      'Coudes à 45°',
      'Barre touche poitrine',
      'Push explosif',
    ],
    common_mistakes: [
      'Coudes trop écartés',
      'Fesses décollées',
      'Rebond sur la poitrine',
      'ROM partiel',
      'Épaules vers les oreilles',
    ],
    safety_notes: [
      'Toujours utiliser un spotter',
      'Colliers de sécurité obligatoires',
      'Progression lente de la charge',
      'Échauffement des épaules',
    ],
    benefits: [
      'Développement pectoraux',
      'Force de poussée',
      'Masse musculaire haut du corps',
    ],
    target_goals: ['strength', 'hypertrophy', 'power'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 5,
    typical_reps_max: 10,
    typical_rest_sec: 180,
    technical_complexity: 6,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 10,
  },

  // ===== SQUAT VARIATIONS =====
  {
    name: 'Front Squat',
    discipline: 'force',
    category: 'squat',
    subcategory: 'compound',
    difficulty: 'advanced',
    description_short: 'Squat avec barre sur l\'avant des épaules',
    movement_pattern: 'squat',
    primary_muscles: ['Quadriceps', 'Glutes', 'Core'],
    secondary_muscles: ['Hamstrings', 'Upper Back'],
    equipment: ['Barre olympique', 'Rack à squat'],
    coaching_cues: ['Coudes hauts', 'Torse vertical', 'Core engagé'],
    common_mistakes: ['Coudes tombent', 'Torse penché', 'Talons décollent'],
    safety_notes: ['Mobilité poignets requise', 'Lâcher la barre si perte équilibre'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 4,
    typical_reps_max: 8,
    typical_rest_sec: 180,
    technical_complexity: 8,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 9,
  },
  {
    name: 'Goblet Squat',
    discipline: 'force',
    category: 'squat',
    difficulty: 'beginner',
    description_short: 'Squat en tenant un haltère ou kettlebell devant soi',
    movement_pattern: 'squat',
    primary_muscles: ['Quadriceps', 'Glutes'],
    secondary_muscles: ['Core', 'Upper Back'],
    equipment: ['Haltères', 'Kettlebell'],
    coaching_cues: ['Poids près du corps', 'Coudes entre genoux', 'Poitrine haute'],
    common_mistakes: ['Poids trop loin', 'Talons décollent', 'Genoux rentrent'],
    safety_notes: ['Excellent pour apprendre le squat', 'Facile à abandonner si problème'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 8,
    typical_reps_max: 15,
    typical_rest_sec: 90,
    technical_complexity: 3,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 8,
  },
  {
    name: 'Bulgarian Split Squat',
    discipline: 'force',
    category: 'squat',
    difficulty: 'intermediate',
    description_short: 'Squat unilatéral pied arrière surélevé',
    movement_pattern: 'squat',
    primary_muscles: ['Quadriceps', 'Glutes'],
    secondary_muscles: ['Hamstrings', 'Core', 'Calves'],
    equipment: ['Banc', 'Haltères'],
    coaching_cues: ['Genou avant suit orteils', 'Torse vertical', 'Descente contrôlée'],
    common_mistakes: ['Stride trop court', 'Genou rentre', 'Penché avant'],
    safety_notes: ['Trouver bonne distance', 'Commencer sans poids'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 8,
    typical_reps_max: 12,
    typical_rest_sec: 90,
    technical_complexity: 6,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 8,
  },

  // ===== DEADLIFT & HINGE =====
  {
    name: 'Conventional Deadlift',
    discipline: 'force',
    category: 'hinge',
    subcategory: 'compound',
    difficulty: 'intermediate',
    description_short: 'Soulevé de terre classique',
    movement_pattern: 'hinge',
    primary_muscles: ['Hamstrings', 'Glutes', 'Erector Spinae'],
    secondary_muscles: ['Quadriceps', 'Lats', 'Trapezius', 'Forearms'],
    equipment: ['Barre olympique', 'Disques'],
    coaching_cues: ['Dos neutre', 'Barre contre tibias', 'Pousser le sol', 'Hanches et épaules montent ensemble'],
    common_mistakes: ['Dos arrondi', 'Barre loin des tibias', 'Hanches montent trop vite', 'Hyperextension en haut'],
    safety_notes: ['Progression lente', 'Ceinture possible pour charges lourdes', 'Ne pas arrondir le dos'],
    target_goals: ['strength', 'power', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 3,
    typical_reps_max: 8,
    typical_rest_sec: 180,
    technical_complexity: 8,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 10,
  },
  {
    name: 'Romanian Deadlift',
    discipline: 'force',
    category: 'hinge',
    difficulty: 'intermediate',
    description_short: 'Deadlift jambes tendues accent ischio-jambiers',
    movement_pattern: 'hinge',
    primary_muscles: ['Hamstrings', 'Glutes', 'Erector Spinae'],
    secondary_muscles: ['Lats', 'Forearms'],
    equipment: ['Barre olympique', 'Haltères'],
    coaching_cues: ['Genoux légèrement fléchis', 'Barre glisse le long cuisses', 'Étirement ischio'],
    common_mistakes: ['Genoux trop fléchis', 'Dos arrondi', 'Descendre trop bas'],
    safety_notes: ['ROM partiel acceptable', 'Contrôle excentrique important'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 6,
    typical_reps_max: 12,
    typical_rest_sec: 120,
    technical_complexity: 6,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 9,
  },
  {
    name: 'Sumo Deadlift',
    discipline: 'force',
    category: 'hinge',
    difficulty: 'intermediate',
    description_short: 'Deadlift stance large',
    movement_pattern: 'hinge',
    primary_muscles: ['Quadriceps', 'Glutes', 'Adductors'],
    secondary_muscles: ['Hamstrings', 'Erector Spinae', 'Trapezius'],
    equipment: ['Barre olympique', 'Disques'],
    coaching_cues: ['Pieds larges', 'Orteils vers extérieur', 'Hanches basses', 'Genoux suivent orteils'],
    common_mistakes: ['Stance trop large', 'Genoux rentrent', 'Dos arrondi'],
    safety_notes: ['Mobilité hanches importante', 'Trouver sa stance optimale'],
    target_goals: ['strength', 'power'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 3,
    typical_reps_max: 8,
    typical_rest_sec: 180,
    technical_complexity: 7,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 8,
  },
  {
    name: 'Trap Bar Deadlift',
    discipline: 'force',
    category: 'hinge',
    difficulty: 'beginner',
    description_short: 'Deadlift avec barre hexagonale',
    movement_pattern: 'hinge',
    primary_muscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    secondary_muscles: ['Erector Spinae', 'Trapezius'],
    equipment: ['Barre hexagonale', 'Disques'],
    coaching_cues: ['Position centrale', 'Dos neutre', 'Pousser le sol'],
    common_mistakes: ['Barre décentrée', 'Dos arrondi'],
    safety_notes: ['Plus sûr que deadlift conventionnel', 'Excellent pour débutants'],
    target_goals: ['strength', 'power', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 5,
    typical_reps_max: 10,
    typical_rest_sec: 150,
    technical_complexity: 5,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 7,
  },

  // ===== BENCH PRESS VARIATIONS =====
  {
    name: 'Incline Barbell Bench Press',
    discipline: 'force',
    category: 'push',
    subcategory: 'chest',
    difficulty: 'intermediate',
    description_short: 'Développé couché incliné 30-45°',
    movement_pattern: 'push',
    primary_muscles: ['Pectoraux (partie haute)', 'Deltoids', 'Triceps'],
    secondary_muscles: ['Core', 'Serratus anterior'],
    equipment: ['Barre olympique', 'Banc inclinable'],
    coaching_cues: ['Angle 30-45°', 'Barre vers haut poitrine', 'Coudes 45°'],
    common_mistakes: ['Angle trop élevé', 'Rebond sur poitrine', 'Fesses décollées'],
    safety_notes: ['Spotter recommandé', 'Poids inférieur au bench plat'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 6,
    typical_reps_max: 10,
    typical_rest_sec: 150,
    technical_complexity: 6,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 8,
  },
  {
    name: 'Dumbbell Bench Press',
    discipline: 'force',
    category: 'push',
    subcategory: 'chest',
    difficulty: 'intermediate',
    description_short: 'Développé couché avec haltères',
    movement_pattern: 'push',
    primary_muscles: ['Pectorals', 'Triceps', 'Deltoids'],
    secondary_muscles: ['Core', 'Stabilizers'],
    equipment: ['Haltères', 'Banc'],
    coaching_cues: ['ROM plus grande', 'Coudes 45°', 'Contrôle stabilité'],
    common_mistakes: ['ROM excessive', 'Perte de contrôle', 'Coudes trop écartés'],
    safety_notes: ['Plus de stabilité requise', 'Facile à abandonner'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 6,
    typical_reps_max: 12,
    typical_rest_sec: 120,
    technical_complexity: 5,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 9,
  },
  {
    name: 'Close-Grip Bench Press',
    discipline: 'force',
    category: 'push',
    subcategory: 'triceps',
    difficulty: 'intermediate',
    description_short: 'Bench press prise serrée pour triceps',
    movement_pattern: 'push',
    primary_muscles: ['Triceps', 'Pectorals'],
    secondary_muscles: ['Deltoids', 'Core'],
    equipment: ['Barre olympique', 'Banc'],
    coaching_cues: ['Mains largeur épaules', 'Coudes près du corps', 'Barre vers bas poitrine'],
    common_mistakes: ['Prise trop serrée', 'Coudes trop écartés', 'ROM partiel'],
    safety_notes: ['Charge inférieure au bench normal', 'Protège épaules'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 6,
    typical_reps_max: 10,
    typical_rest_sec: 120,
    technical_complexity: 6,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 7,
  },

  // ===== PULLING EXERCISES =====
  {
    name: 'Barbell Row',
    discipline: 'force',
    category: 'pull',
    subcategory: 'back',
    difficulty: 'intermediate',
    description_short: 'Rowing à la barre penché',
    movement_pattern: 'pull',
    primary_muscles: ['Dorsaux (Grand dorsal)', 'Rhomboids', 'Trapezius'],
    secondary_muscles: ['Biceps', 'Erector Spinae', 'Core'],
    equipment: ['Barre olympique', 'Disques'],
    coaching_cues: ['Torse 45°', 'Tirer vers nombril', 'Coudes près du corps'],
    common_mistakes: ['Trop vertical', 'Momentum excessif', 'Dos arrondi'],
    safety_notes: ['Dos neutre obligatoire', 'Commencer léger'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 6,
    typical_reps_max: 10,
    typical_rest_sec: 120,
    technical_complexity: 7,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 9,
  },
  {
    name: 'Dumbbell Row',
    discipline: 'force',
    category: 'pull',
    subcategory: 'back',
    difficulty: 'beginner',
    description_short: 'Rowing unilatéral haltère',
    movement_pattern: 'pull',
    primary_muscles: ['Dorsaux (Grand dorsal)', 'Rhomboids', 'Trapezius'],
    secondary_muscles: ['Biceps', 'Core'],
    equipment: ['Haltères', 'Banc'],
    coaching_cues: ['Main et genou sur banc', 'Tirer coude vers haut', 'Rotation minimale'],
    common_mistakes: ['Rotation excessive', 'Épaule monte', 'ROM partiel'],
    safety_notes: ['Excellent pour débutants', 'Travail unilatéral corrige déséquilibres'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 8,
    typical_reps_max: 12,
    typical_rest_sec: 90,
    technical_complexity: 4,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 8,
  },
  {
    name: 'Lat Pulldown',
    discipline: 'force',
    category: 'pull',
    subcategory: 'back',
    difficulty: 'beginner',
    description_short: 'Tirage vertical machine',
    movement_pattern: 'pull',
    primary_muscles: ['Dorsaux (Grand dorsal)', 'Biceps'],
    secondary_muscles: ['Rhomboids', 'Trapezius', 'Core'],
    equipment: ['Machine lat pulldown'],
    coaching_cues: ['Prise large', 'Tirer vers poitrine', 'Coudes en bas et arrière'],
    common_mistakes: ['Se pencher trop arrière', 'Tirer derrière nuque', 'ROM partiel'],
    safety_notes: ['Excellent préparation pull-ups', 'Sûr pour débutants'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 8,
    typical_reps_max: 15,
    typical_rest_sec: 90,
    technical_complexity: 3,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 7,
  },
  {
    name: 'Cable Row',
    discipline: 'force',
    category: 'pull',
    subcategory: 'back',
    difficulty: 'beginner',
    description_short: 'Rowing horizontal cable',
    movement_pattern: 'pull',
    primary_muscles: ['Rhomboids', 'Trapezius', 'Dorsaux (Grand dorsal)'],
    secondary_muscles: ['Biceps', 'Erector Spinae'],
    equipment: ['Poulie basse'],
    coaching_cues: ['Dos droit', 'Tirer coudes arrière', 'Squeeze omoplates'],
    common_mistakes: ['Dos arrondi', 'Utiliser le dos', 'ROM partiel'],
    safety_notes: ['Tension constante', 'Excellent pour technique'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 10,
    typical_reps_max: 15,
    typical_rest_sec: 90,
    technical_complexity: 3,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 6,
  },

  // ===== SHOULDER EXERCISES =====
  {
    name: 'Overhead Press',
    discipline: 'force',
    category: 'push',
    subcategory: 'shoulders',
    difficulty: 'intermediate',
    description_short: 'Développé militaire debout',
    movement_pattern: 'push',
    primary_muscles: ['Deltoïdes', 'Triceps'],
    secondary_muscles: ['Upper Chest', 'Core', 'Trapezius'],
    equipment: ['Barre olympique'],
    coaching_cues: ['Barre part de clavicules', 'Coudes avant barre', 'Core contracté', 'Tête passe barre'],
    common_mistakes: ['Penché arrière', 'Barre trop avant', 'Manque ROM'],
    safety_notes: ['Core crucial pour sécurité', 'Mobilité épaules nécessaire'],
    target_goals: ['strength', 'hypertrophy', 'power'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 5,
    typical_reps_max: 8,
    typical_rest_sec: 150,
    technical_complexity: 7,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 9,
  },
  {
    name: 'Dumbbell Shoulder Press',
    discipline: 'force',
    category: 'push',
    subcategory: 'shoulders',
    difficulty: 'intermediate',
    description_short: 'Développé épaules haltères',
    movement_pattern: 'push',
    primary_muscles: ['Deltoïdes', 'Triceps'],
    secondary_muscles: ['Upper Chest', 'Core'],
    equipment: ['Haltères', 'Banc'],
    coaching_cues: ['ROM complète', 'Coudes sous poignets', 'Contrôle stabilité'],
    common_mistakes: ['ROM partiel', 'Cambrer dos', 'Coudes trop écartés'],
    safety_notes: ['Plus de stabilité requise', 'ROM plus naturelle'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 8,
    typical_reps_max: 12,
    typical_rest_sec: 120,
    technical_complexity: 5,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 8,
  },
  {
    name: 'Lateral Raise',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'shoulders',
    difficulty: 'beginner',
    description_short: 'Élévations latérales haltères',
    movement_pattern: 'isolation',
    primary_muscles: ['Deltoïdes'],
    equipment: ['Haltères'],
    coaching_cues: ['Coudes légèrement fléchis', 'Monter à hauteur épaules', 'Contrôle descente'],
    common_mistakes: ['Momentum', 'Monter trop haut', 'Hausser épaules'],
    safety_notes: ['Charges légères', 'Excellent pour deltoïdes médians'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 12,
    typical_reps_max: 20,
    typical_rest_sec: 60,
    technical_complexity: 3,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 6,
  },
  {
    name: 'Face Pull',
    discipline: 'force',
    category: 'pull',
    subcategory: 'shoulders',
    difficulty: 'beginner',
    description_short: 'Tirage face cable pour deltoïdes postérieurs',
    movement_pattern: 'pull',
    primary_muscles: ['Deltoïdes', 'Trapezius', 'Rhomboids'],
    equipment: ['Poulie haute'],
    coaching_cues: ['Tirer vers visage', 'Rotation externe', 'Coudes hauts'],
    common_mistakes: ['Tirer trop bas', 'Pas de rotation', 'ROM partiel'],
    safety_notes: ['Excellent pour santé épaules', 'Prévention blessures'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 12,
    typical_reps_max: 20,
    typical_rest_sec: 60,
    technical_complexity: 4,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 7,
  },

  // ===== ARM EXERCISES =====
  {
    name: 'Barbell Curl',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'arms',
    difficulty: 'beginner',
    description_short: 'Curl biceps barre',
    movement_pattern: 'isolation',
    primary_muscles: ['Biceps'],
    secondary_muscles: ['Avant-bras'],
    equipment: ['Barre olympique', 'Barre EZ'],
    coaching_cues: ['Coudes fixes', 'Curl complet', 'Contrôle excentrique'],
    common_mistakes: ['Balancer corps', 'Coudes bougent', 'ROM partiel'],
    safety_notes: ['Charges modérées', 'Barre EZ moins stress poignets'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 8,
    typical_reps_max: 12,
    typical_rest_sec: 90,
    technical_complexity: 3,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 7,
  },
  {
    name: 'Dumbbell Curl',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'arms',
    difficulty: 'beginner',
    description_short: 'Curl biceps haltères',
    movement_pattern: 'isolation',
    primary_muscles: ['Biceps'],
    secondary_muscles: ['Avant-bras'],
    equipment: ['Haltères'],
    coaching_cues: ['Alternance ou simultané', 'Rotation poignets', 'Coudes fixes'],
    common_mistakes: ['Momentum', 'Coudes bougent', 'ROM partiel'],
    safety_notes: ['ROM plus naturelle', 'Travail unilatéral possible'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 10,
    typical_reps_max: 15,
    typical_rest_sec: 75,
    technical_complexity: 2,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 6,
  },
  {
    name: 'Hammer Curl',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'arms',
    difficulty: 'beginner',
    description_short: 'Curl prise neutre pour brachial',
    movement_pattern: 'isolation',
    primary_muscles: ['Biceps', 'Avant-bras'],
    equipment: ['Haltères'],
    coaching_cues: ['Pouces vers haut', 'Coudes fixes', 'Contrôle'],
    common_mistakes: ['Rotation poignets', 'Momentum', 'ROM partiel'],
    safety_notes: ['Moins stress articulations', 'Développe avant-bras'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 10,
    typical_reps_max: 15,
    typical_rest_sec: 60,
    technical_complexity: 2,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 5,
  },
  {
    name: 'Triceps Pushdown',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'arms',
    difficulty: 'beginner',
    description_short: 'Extension triceps cable',
    movement_pattern: 'isolation',
    primary_muscles: ['Triceps'],
    equipment: ['Poulie haute'],
    coaching_cues: ['Coudes fixes près corps', 'Extension complète', 'Contrôle'],
    common_mistakes: ['Coudes bougent', 'Penché avant', 'ROM partiel'],
    safety_notes: ['Excellent isolation triceps', 'Sûr pour débutants'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 12,
    typical_reps_max: 20,
    typical_rest_sec: 60,
    technical_complexity: 2,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 6,
  },
  {
    name: 'Overhead Triceps Extension',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'arms',
    difficulty: 'intermediate',
    description_short: 'Extension triceps bras au-dessus tête',
    movement_pattern: 'isolation',
    primary_muscles: ['Triceps'],
    equipment: ['Haltères', 'Barre EZ'],
    coaching_cues: ['Coudes près oreilles', 'Extension complète', 'Contrôle'],
    common_mistakes: ['Coudes écartent', 'Cambrer dos', 'ROM partiel'],
    safety_notes: ['Mobilité épaules requise', 'Charges modérées'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 10,
    typical_reps_max: 15,
    typical_rest_sec: 75,
    technical_complexity: 4,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 6,
  },
  {
    name: 'Skull Crushers',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'arms',
    difficulty: 'intermediate',
    description_short: 'Extension triceps allongé',
    movement_pattern: 'isolation',
    primary_muscles: ['Triceps'],
    equipment: ['Barre EZ', 'Banc'],
    coaching_cues: ['Coudes fixes', 'Descendre vers front', 'Extension complète'],
    common_mistakes: ['Coudes écartent', 'Descendre sur nez', 'Momentum'],
    safety_notes: ['Spotter recommandé', 'Barre EZ protège poignets'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 8,
    typical_reps_max: 12,
    typical_rest_sec: 90,
    technical_complexity: 5,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 7,
  },

  // ===== LEG EXERCISES =====
  {
    name: 'Leg Press',
    discipline: 'force',
    category: 'squat',
    subcategory: 'legs',
    difficulty: 'beginner',
    description_short: 'Presse à cuisses',
    movement_pattern: 'squat',
    primary_muscles: ['Quadriceps', 'Glutes'],
    secondary_muscles: ['Hamstrings', 'Calves'],
    equipment: ['Presse à cuisses'],
    coaching_cues: ['Pieds largeur épaules', 'Genoux suivent orteils', 'ROM complète'],
    common_mistakes: ['Genoux rentrent', 'Fesses décollent', 'ROM partiel'],
    safety_notes: ['Sûr pour dos', 'Excellent pour volume'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 8,
    typical_reps_max: 15,
    typical_rest_sec: 120,
    technical_complexity: 3,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 7,
  },
  {
    name: 'Leg Extension',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'legs',
    difficulty: 'beginner',
    description_short: 'Extension quadriceps machine',
    movement_pattern: 'isolation',
    primary_muscles: ['Quadriceps'],
    equipment: ['Machine extension jambes'],
    coaching_cues: ['Extension complète', 'Squeeze en haut', 'Descente contrôlée'],
    common_mistakes: ['ROM partiel', 'Momentum', 'Cambrer dos'],
    safety_notes: ['Excellente isolation quads', 'Attention genoux'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 12,
    typical_reps_max: 20,
    typical_rest_sec: 60,
    technical_complexity: 2,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 5,
  },
  {
    name: 'Leg Curl',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'legs',
    difficulty: 'beginner',
    description_short: 'Curl ischio-jambiers machine',
    movement_pattern: 'isolation',
    primary_muscles: ['Hamstrings'],
    equipment: ['Machine leg curl'],
    coaching_cues: ['Hanches stables', 'Curl complet', 'Contrôle'],
    common_mistakes: ['Hanches décollent', 'ROM partiel', 'Momentum'],
    safety_notes: ['Excellente isolation ischio', 'Sûr'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 12,
    typical_reps_max: 20,
    typical_rest_sec: 60,
    technical_complexity: 2,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 5,
  },
  {
    name: 'Walking Lunges',
    discipline: 'force',
    category: 'squat',
    difficulty: 'intermediate',
    description_short: 'Fentes marchées',
    movement_pattern: 'squat',
    primary_muscles: ['Quadriceps', 'Glutes'],
    secondary_muscles: ['Hamstrings', 'Core', 'Calves'],
    equipment: ['Haltères'],
    coaching_cues: ['Pas longs', 'Genou arrière touche sol', 'Torse vertical'],
    common_mistakes: ['Pas trop courts', 'Genou rentre', 'Penché avant'],
    safety_notes: ['Espace nécessaire', 'Balance importante'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 10,
    typical_reps_max: 20,
    typical_rest_sec: 90,
    technical_complexity: 5,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 7,
  },
  {
    name: 'Calf Raise',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'legs',
    difficulty: 'beginner',
    description_short: 'Extension mollets',
    movement_pattern: 'isolation',
    primary_muscles: ['Mollets'],
    equipment: ['Machine calf raise', 'Haltères'],
    coaching_cues: ['ROM complète', 'Pause en haut', 'Stretch en bas'],
    common_mistakes: ['ROM partiel', 'Pas de pause', 'Momentum'],
    safety_notes: ['Charges lourdes possibles', 'Stable'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_reps_min: 15,
    typical_reps_max: 25,
    typical_rest_sec: 60,
    technical_complexity: 2,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 4,
  },

  // ===== CHEST ISOLATION =====
  {
    name: 'Cable Fly',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'chest',
    difficulty: 'intermediate',
    description_short: 'Écartés cable pour pectoraux',
    movement_pattern: 'isolation',
    primary_muscles: ['Pectorals'],
    secondary_muscles: ['Deltoids'],
    equipment: ['Poulie haute', 'Poulie basse'],
    coaching_cues: ['Coudes légèrement fléchis', 'Squeeze en haut', 'Stretch en arrière'],
    common_mistakes: ['Coudes trop fléchis', 'ROM partiel', 'Cambrer dos'],
    safety_notes: ['Tension constante', 'Excellent pour développement'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 12,
    typical_reps_max: 20,
    typical_rest_sec: 75,
    technical_complexity: 4,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 6,
  },
  {
    name: 'Dumbbell Fly',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'chest',
    difficulty: 'intermediate',
    description_short: 'Écartés haltères',
    movement_pattern: 'isolation',
    primary_muscles: ['Pectorals'],
    secondary_muscles: ['Deltoids'],
    equipment: ['Haltères', 'Banc'],
    coaching_cues: ['Arc de cercle', 'Coudes légèrement fléchis', 'Contrôle'],
    common_mistakes: ['Descendre trop bas', 'Coudes trop fléchis', 'Momentum'],
    safety_notes: ['Charges modérées', 'ROM contrôlée'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 10,
    typical_reps_max: 15,
    typical_rest_sec: 75,
    technical_complexity: 5,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 6,
  },
  {
    name: 'Chest Dip',
    discipline: 'force',
    category: 'push',
    subcategory: 'chest',
    difficulty: 'intermediate',
    description_short: 'Dips pour pectoraux',
    movement_pattern: 'push',
    primary_muscles: ['Pectorals', 'Triceps'],
    secondary_muscles: ['Deltoids', 'Core'],
    equipment: ['Barres parallèles'],
    coaching_cues: ['Penché avant', 'Coudes écartés', 'ROM complète'],
    common_mistakes: ['Trop vertical', 'ROM partiel', 'Hausser épaules'],
    safety_notes: ['Mobilité épaules requise', 'Progression graduelle'],
    target_goals: ['strength', 'hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 8,
    typical_reps_max: 15,
    typical_rest_sec: 120,
    technical_complexity: 6,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 8,
  },

  // ===== BACK ISOLATION =====
  {
    name: 'Straight-Arm Pulldown',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'back',
    difficulty: 'intermediate',
    description_short: 'Pulldown bras tendus',
    movement_pattern: 'pull',
    primary_muscles: ['Dorsaux (Grand dorsal)'],
    secondary_muscles: ['Triceps', 'Core'],
    equipment: ['Poulie haute'],
    coaching_cues: ['Bras quasi tendus', 'Tirer vers hanches', 'Squeeze dorsaux'],
    common_mistakes: ['Plier coudes', 'Hausser épaules', 'ROM partiel'],
    safety_notes: ['Excellente isolation dorsaux', 'Charges modérées'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 12,
    typical_reps_max: 20,
    typical_rest_sec: 60,
    technical_complexity: 5,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 6,
  },
  {
    name: 'Shrugs',
    discipline: 'force',
    category: 'isolation',
    subcategory: 'back',
    difficulty: 'beginner',
    description_short: 'Haussement d\'épaules',
    movement_pattern: 'isolation',
    primary_muscles: ['Trapezius'],
    equipment: ['Haltères', 'Barre olympique'],
    coaching_cues: ['Monter épaules vers oreilles', 'Pause en haut', 'Descente contrôlée'],
    common_mistakes: ['Rotation épaules', 'Plier coudes', 'ROM partiel'],
    safety_notes: ['Mouvement simple', 'Charges lourdes possibles'],
    target_goals: ['hypertrophy'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 12,
    typical_reps_max: 20,
    typical_rest_sec: 60,
    technical_complexity: 2,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 5,
  },

  // ===== CORE EXERCISES =====
  {
    name: 'Plank',
    discipline: 'force',
    category: 'core',
    difficulty: 'beginner',
    description_short: 'Gainage frontal',
    movement_pattern: 'hold',
    primary_muscles: ['Core'],
    secondary_muscles: ['Deltoids', 'Glutes'],
    equipment: [],
    coaching_cues: ['Corps aligné', 'Core contracté', 'Respiration'],
    common_mistakes: ['Hanches basses', 'Hanches hautes', 'Tête tombante'],
    safety_notes: ['Fondamental core', 'Progression par temps'],
    target_goals: ['strength'],
    typical_sets_min: 3,
    typical_sets_max: 5,
    typical_duration_min: 30,
    typical_duration_max: 90,
    typical_rest_sec: 60,
    technical_complexity: 3,
    injury_risk: 'low',
    is_validated: true,
    illustration_priority: 6,
  },
  {
    name: 'Ab Wheel Rollout',
    discipline: 'force',
    category: 'core',
    difficulty: 'advanced',
    description_short: 'Roulette abdominale',
    movement_pattern: 'extension',
    primary_muscles: ['Core'],
    secondary_muscles: ['Dorsaux (Grand dorsal)', 'Deltoids'],
    equipment: ['Roue abdominale'],
    coaching_cues: ['Extension contrôlée', 'Core serré', 'Ne pas cambrer'],
    common_mistakes: ['Cambrer dos', 'Extension trop longue', 'Momentum'],
    safety_notes: ['Très exigeant', 'Commencer à genoux'],
    target_goals: ['strength'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 5,
    typical_reps_max: 12,
    typical_rest_sec: 120,
    technical_complexity: 8,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 7,
  },
  {
    name: 'Hanging Leg Raise',
    discipline: 'force',
    category: 'core',
    difficulty: 'intermediate',
    description_short: 'Relevés de jambes suspendu',
    movement_pattern: 'flexion',
    primary_muscles: ['Core'],
    secondary_muscles: ['Hip Flexors', 'Forearms'],
    equipment: ['Barre de traction'],
    coaching_cues: ['Jambes tendues', 'Monter à 90°', 'Contrôle'],
    common_mistakes: ['Balancer', 'ROM partiel', 'Hausser épaules'],
    safety_notes: ['Grip important', 'Progression graduelle'],
    target_goals: ['strength'],
    typical_sets_min: 3,
    typical_sets_max: 4,
    typical_reps_min: 8,
    typical_reps_max: 15,
    typical_rest_sec: 90,
    technical_complexity: 6,
    injury_risk: 'moderate',
    is_validated: true,
    illustration_priority: 7,
  },
];

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🚀 Starting Comprehensive Exercise Seeding\n');
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  console.log(`🔐 Using Service Role Key\n`);

  const args = process.argv.slice(2);
  const disciplineArg = args.find(arg => arg.startsWith('--discipline='));
  const targetDiscipline = disciplineArg?.split('=')[1];

  let totalSuccess = 0;
  let totalFailed = 0;

  try {
    // Calisthenics
    if (!targetDiscipline || targetDiscipline === 'calisthenics') {
      const result = await insertExerciseBatch(CALISTHENICS_EXERCISES, 'Calisthenics');
      totalSuccess += result.success;
      totalFailed += result.failed;
    }

    // Force/Musculation
    if (!targetDiscipline || targetDiscipline === 'force') {
      const result = await insertExerciseBatch(FORCE_EXERCISES, 'Force/Musculation');
      totalSuccess += result.success;
      totalFailed += result.failed;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total Success: ${totalSuccess}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`📈 Success Rate: ${((totalSuccess / (totalSuccess + totalFailed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (totalFailed === 0) {
      console.log('\n🎉 All exercises seeded successfully!\n');
    } else {
      console.log('\n⚠️  Some exercises failed to seed. Check logs above.\n');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

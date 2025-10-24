/**
 * Exercise Database Service
 * Provides intelligent exercise querying and matching from the Supabase exercise catalog
 */

import { SupabaseClient } from "npm:@supabase/supabase-js@2.54.0";

export interface ExerciseQuery {
  discipline: string;
  availableEquipment?: string[];
  difficulty?: string;
  locationType?: 'home' | 'gym' | 'outdoor' | 'any';
  targetMuscleGroups?: string[];
  limit?: number;
  language?: 'fr' | 'en';
}

export interface ExerciseCatalogEntry {
  id: string;
  name: string;
  name_translated?: string;
  discipline: string;
  category: string;
  difficulty: string;
  movement_pattern: string;
  description_short: string;
  muscle_groups: Array<{
    name: string;
    name_fr: string;
    involvement_type: 'primary' | 'secondary' | 'stabilizer';
  }>;
  equipment: Array<{
    name: string;
    name_fr: string;
    is_required: boolean;
  }>;
  tempo?: string;
  typical_sets_range: string;
  typical_reps_range: string;
  typical_rest_sec?: number;
  visual_keywords: string[];
  safety_notes: string[];
  coaching_cues: string[];
  progressions?: string[];
  regressions?: string[];
  substitutions?: string[];
}

export interface ExerciseDatabaseResponse {
  exercises: ExerciseCatalogEntry[];
  totalCount: number;
  equipmentFiltered: boolean;
  muscleGroupsAvailable: string[];
  metadata: {
    queryTime: number;
    cacheKey: string;
  };
}

/**
 * Query exercises from database with intelligent filtering
 */
export async function queryExercisesByDiscipline(
  supabase: SupabaseClient,
  query: ExerciseQuery
): Promise<ExerciseDatabaseResponse> {
  const startTime = Date.now();

  console.log("[EXERCISE-DB] Querying exercises", {
    discipline: query.discipline,
    equipment: query.availableEquipment?.length || 0,
    difficulty: query.difficulty,
    locationType: query.locationType
  });

  try {
    // If equipment is provided, use the smart matching function
    if (query.availableEquipment && query.availableEquipment.length > 0) {
      return await queryExercisesByEquipment(supabase, query, startTime);
    }

    // Otherwise, query all exercises for the discipline
    return await queryAllExercises(supabase, query, startTime);
  } catch (error) {
    console.error("[EXERCISE-DB] Query failed", error);
    throw error;
  }
}

/**
 * Query exercises matching available equipment
 */
async function queryExercisesByEquipment(
  supabase: SupabaseClient,
  query: ExerciseQuery,
  startTime: number
): Promise<ExerciseDatabaseResponse> {

  // First, get equipment IDs from names
  const { data: equipmentData, error: equipmentError } = await supabase
    .from('equipment_types')
    .select('id, name_fr, name_en')
    .or(`name_fr.in.(${query.availableEquipment!.join(',')}),name_en.in.(${query.availableEquipment!.join(',')})`);

  if (equipmentError) {
    console.error("[EXERCISE-DB] Equipment lookup failed", equipmentError);
    throw equipmentError;
  }

  const equipmentIds = equipmentData?.map(eq => eq.id) || [];

  console.log("[EXERCISE-DB] Found equipment IDs", {
    count: equipmentIds.length,
    equipment: query.availableEquipment
  });

  // Use the find_exercises_by_equipment function
  const { data: matchedExercises, error: matchError } = await supabase
    .rpc('find_exercises_by_equipment', {
      p_available_equipment_ids: equipmentIds,
      p_discipline: query.discipline,
      p_difficulty: query.difficulty || null,
      p_location_type: query.locationType || 'any',
      p_limit: query.limit || 100
    });

  if (matchError) {
    console.error("[EXERCISE-DB] Equipment matching failed", matchError);
    throw matchError;
  }

  console.log("[EXERCISE-DB] Matched exercises", {
    count: matchedExercises?.length || 0,
    canPerform: matchedExercises?.filter((ex: any) => ex.can_perform).length || 0
  });

  // Enrich with full exercise data
  const exerciseIds = matchedExercises?.map((ex: any) => ex.exercise_id) || [];

  return await enrichExerciseData(
    supabase,
    exerciseIds,
    query.language || 'fr',
    startTime,
    true
  );
}

/**
 * Query all exercises for a discipline (no equipment filtering)
 */
async function queryAllExercises(
  supabase: SupabaseClient,
  query: ExerciseQuery,
  startTime: number
): Promise<ExerciseDatabaseResponse> {

  let queryBuilder = supabase
    .from('exercises')
    .select('id')
    .eq('discipline', query.discipline)
    .eq('is_active', true)
    .eq('is_validated', true);

  if (query.difficulty) {
    queryBuilder = queryBuilder.eq('difficulty', query.difficulty);
  }

  if (query.targetMuscleGroups && query.targetMuscleGroups.length > 0) {
    // Filter by muscle groups via join
    const { data: muscleGroupData } = await supabase
      .from('muscle_groups')
      .select('id')
      .or(query.targetMuscleGroups.map(mg => `name_fr.eq.${mg},name_en.eq.${mg}`).join(','));

    const muscleGroupIds = muscleGroupData?.map(mg => mg.id) || [];

    if (muscleGroupIds.length > 0) {
      const { data: exerciseIds } = await supabase
        .from('exercise_muscle_groups')
        .select('exercise_id')
        .in('muscle_group_id', muscleGroupIds)
        .eq('involvement_type', 'primary');

      const filteredIds = exerciseIds?.map(e => e.exercise_id) || [];
      queryBuilder = queryBuilder.in('id', filteredIds);
    }
  }

  queryBuilder = queryBuilder.limit(query.limit || 100);

  const { data: exercises, error } = await queryBuilder;

  if (error) {
    console.error("[EXERCISE-DB] Query failed", error);
    throw error;
  }

  const exerciseIds = exercises?.map(ex => ex.id) || [];

  return await enrichExerciseData(
    supabase,
    exerciseIds,
    query.language || 'fr',
    startTime,
    false
  );
}

/**
 * Enrich exercise IDs with full data including translations, muscle groups, equipment
 */
async function enrichExerciseData(
  supabase: SupabaseClient,
  exerciseIds: string[],
  language: 'fr' | 'en',
  startTime: number,
  equipmentFiltered: boolean
): Promise<ExerciseDatabaseResponse> {

  if (exerciseIds.length === 0) {
    return {
      exercises: [],
      totalCount: 0,
      equipmentFiltered,
      muscleGroupsAvailable: [],
      metadata: {
        queryTime: Date.now() - startTime,
        cacheKey: `empty_${Date.now()}`
      }
    };
  }

  // Get full exercise data
  const { data: exercisesData, error: exercisesError } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      discipline,
      category,
      subcategory,
      difficulty,
      movement_pattern,
      description_short,
      tempo,
      typical_sets_min,
      typical_sets_max,
      typical_reps_min,
      typical_reps_max,
      typical_rest_sec,
      visual_keywords,
      safety_notes,
      common_mistakes
    `)
    .in('id', exerciseIds);

  if (exercisesError) {
    console.error("[EXERCISE-DB] Exercise data fetch failed", exercisesError);
    throw exercisesError;
  }

  // Get translations
  const { data: translations } = await supabase
    .from('exercise_translations')
    .select('exercise_id, name, description_short, safety_notes')
    .in('exercise_id', exerciseIds)
    .eq('language_code', language);

  const translationMap = new Map(
    translations?.map(t => [t.exercise_id, t]) || []
  );

  // Get muscle groups
  const { data: muscleGroupsData } = await supabase
    .from('exercise_muscle_groups')
    .select(`
      exercise_id,
      involvement_type,
      muscle_groups (
        name,
        name_fr,
        name_en
      )
    `)
    .in('exercise_id', exerciseIds);

  const muscleGroupMap = new Map<string, any[]>();
  muscleGroupsData?.forEach((mg: any) => {
    if (!muscleGroupMap.has(mg.exercise_id)) {
      muscleGroupMap.set(mg.exercise_id, []);
    }
    muscleGroupMap.get(mg.exercise_id)!.push({
      name: language === 'fr' ? mg.muscle_groups.name_fr : mg.muscle_groups.name_en,
      name_fr: mg.muscle_groups.name_fr,
      involvement_type: mg.involvement_type
    });
  });

  // Get equipment
  const { data: equipmentData } = await supabase
    .from('exercise_equipment')
    .select(`
      exercise_id,
      is_required,
      equipment_types (
        name,
        name_fr,
        name_en
      )
    `)
    .in('exercise_id', exerciseIds);

  const equipmentMap = new Map<string, any[]>();
  equipmentData?.forEach((eq: any) => {
    if (!equipmentMap.has(eq.exercise_id)) {
      equipmentMap.set(eq.exercise_id, []);
    }
    equipmentMap.get(eq.exercise_id)!.push({
      name: language === 'fr' ? eq.equipment_types.name_fr : eq.equipment_types.name_en,
      name_fr: eq.equipment_types.name_fr,
      is_required: eq.is_required
    });
  });

  // Get coaching cues
  const { data: coachingCues } = await supabase
    .from('exercise_coaching_cues')
    .select('exercise_id, cue_text, cue_priority')
    .in('exercise_id', exerciseIds)
    .order('cue_priority', { ascending: false })
    .limit(3);

  const cuesMap = new Map<string, string[]>();
  coachingCues?.forEach((cue: any) => {
    if (!cuesMap.has(cue.exercise_id)) {
      cuesMap.set(cue.exercise_id, []);
    }
    cuesMap.get(cue.exercise_id)!.push(cue.cue_text);
  });

  // Get progressions and substitutions
  const { data: progressionsData } = await supabase
    .from('exercise_progressions')
    .select(`
      exercise_id,
      relationship_type,
      related_exercise:exercises!exercise_progressions_related_exercise_id_fkey(name)
    `)
    .in('exercise_id', exerciseIds)
    .in('relationship_type', ['progression', 'regression', 'alternative']);

  const progressionMap = new Map<string, { progressions: string[], regressions: string[], substitutions: string[] }>();
  progressionsData?.forEach((prog: any) => {
    if (!progressionMap.has(prog.exercise_id)) {
      progressionMap.set(prog.exercise_id, { progressions: [], regressions: [], substitutions: [] });
    }
    const map = progressionMap.get(prog.exercise_id)!;
    const relatedName = prog.related_exercise?.name || 'Unknown';

    if (prog.relationship_type === 'progression') {
      map.progressions.push(relatedName);
    } else if (prog.relationship_type === 'regression') {
      map.regressions.push(relatedName);
    } else if (prog.relationship_type === 'alternative') {
      map.substitutions.push(relatedName);
    }
  });

  // Combine all data
  const enrichedExercises: ExerciseCatalogEntry[] = exercisesData?.map(ex => {
    const translation = translationMap.get(ex.id);
    const muscleGroups = muscleGroupMap.get(ex.id) || [];
    const equipment = equipmentMap.get(ex.id) || [];
    const cues = cuesMap.get(ex.id) || [];
    const progressions = progressionMap.get(ex.id);

    return {
      id: ex.id,
      name: ex.name,
      name_translated: translation?.name || ex.name,
      discipline: ex.discipline,
      category: ex.category || '',
      difficulty: ex.difficulty,
      movement_pattern: ex.movement_pattern || '',
      description_short: translation?.description_short || ex.description_short || '',
      muscle_groups: muscleGroups,
      equipment: equipment,
      tempo: ex.tempo || undefined,
      typical_sets_range: formatRange(ex.typical_sets_min, ex.typical_sets_max),
      typical_reps_range: formatRange(ex.typical_reps_min, ex.typical_reps_max),
      typical_rest_sec: ex.typical_rest_sec || undefined,
      visual_keywords: ex.visual_keywords || [],
      safety_notes: translation?.safety_notes || ex.safety_notes || [],
      coaching_cues: cues,
      progressions: progressions?.progressions || [],
      regressions: progressions?.regressions || [],
      substitutions: progressions?.substitutions || []
    };
  }) || [];

  // Extract unique muscle groups for filtering info
  const allMuscleGroups = new Set<string>();
  enrichedExercises.forEach(ex => {
    ex.muscle_groups.forEach(mg => allMuscleGroups.add(mg.name_fr));
  });

  const queryTime = Date.now() - startTime;
  const cacheKey = `${exerciseIds.slice(0, 5).join('_')}_${language}_${queryTime}`;

  console.log("[EXERCISE-DB] Query complete", {
    exerciseCount: enrichedExercises.length,
    uniqueMuscleGroups: allMuscleGroups.size,
    queryTime
  });

  return {
    exercises: enrichedExercises,
    totalCount: enrichedExercises.length,
    equipmentFiltered,
    muscleGroupsAvailable: Array.from(allMuscleGroups),
    metadata: {
      queryTime,
      cacheKey
    }
  };
}

/**
 * Format min/max range as string
 */
function formatRange(min?: number, max?: number): string {
  if (!min && !max) return '';
  if (min === max) return `${min}`;
  if (!min) return `${max}`;
  if (!max) return `${min}`;
  return `${min}-${max}`;
}

/**
 * Get substitutions for a specific exercise
 */
export async function getExerciseSubstitutions(
  supabase: SupabaseClient,
  exerciseId: string,
  availableEquipment?: string[],
  language: 'fr' | 'en' = 'fr'
): Promise<ExerciseCatalogEntry[]> {

  console.log("[EXERCISE-DB] Getting substitutions", { exerciseId });

  let equipmentIds: string[] | null = null;

  if (availableEquipment && availableEquipment.length > 0) {
    const { data: equipmentData } = await supabase
      .from('equipment_types')
      .select('id')
      .or(`name_fr.in.(${availableEquipment.join(',')}),name_en.in.(${availableEquipment.join(',')})`);

    equipmentIds = equipmentData?.map(eq => eq.id) || [];
  }

  const { data: substitutions, error } = await supabase
    .rpc('suggest_exercise_substitutions', {
      p_original_exercise_id: exerciseId,
      p_available_equipment_ids: equipmentIds,
      p_max_suggestions: 5
    });

  if (error) {
    console.error("[EXERCISE-DB] Substitutions query failed", error);
    throw error;
  }

  const substituteIds = substitutions?.map((s: any) => s.substitute_id) || [];

  const enriched = await enrichExerciseData(
    supabase,
    substituteIds,
    language,
    Date.now(),
    false
  );

  return enriched.exercises;
}

/**
 * Format exercise catalog for AI prompt
 */
export function formatExercisesForAI(
  exercises: ExerciseCatalogEntry[],
  language: 'fr' | 'en' = 'fr'
): string {
  if (exercises.length === 0) {
    return language === 'fr'
      ? "Aucun exercice disponible dans le catalogue pour ces critères."
      : "No exercises available in the catalog for these criteria.";
  }

  const intro = language === 'fr'
    ? `CATALOGUE D'EXERCICES DISPONIBLES (${exercises.length} exercices):\n\n`
    : `AVAILABLE EXERCISE CATALOG (${exercises.length} exercises):\n\n`;

  const exerciseList = exercises.map((ex, idx) => {
    const primaryMuscles = ex.muscle_groups
      .filter(mg => mg.involvement_type === 'primary')
      .map(mg => mg.name)
      .join(', ');

    const requiredEquipment = ex.equipment
      .filter(eq => eq.is_required)
      .map(eq => eq.name)
      .join(', ') || (language === 'fr' ? 'Poids du corps' : 'Bodyweight');

    return `${idx + 1}. ${ex.name_translated || ex.name}
   - Difficulté: ${ex.difficulty}
   - Muscles: ${primaryMuscles}
   - Équipement: ${requiredEquipment}
   - Sets: ${ex.typical_sets_range}, Reps: ${ex.typical_reps_range}
   ${ex.tempo ? `- Tempo: ${ex.tempo}` : ''}
   ${ex.coaching_cues.length > 0 ? `- Conseil: ${ex.coaching_cues[0]}` : ''}`;
  }).join('\n\n');

  const footer = language === 'fr'
    ? `\n\nUTILISE UNIQUEMENT ces exercices du catalogue. Ne génère PAS de nouveaux exercices.`
    : `\n\nUSE ONLY these exercises from the catalog. Do NOT generate new exercises.`;

  return intro + exerciseList + footer;
}

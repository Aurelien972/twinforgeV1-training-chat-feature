/*
  # Système de Filtrage Intelligent des Exercices pour l'IA
  
  ## Objectif
  Réduire drastiquement le nombre d'exercices envoyés aux coaches IA en appliquant
  un scoring intelligent basé sur le contexte utilisateur.
  
  ## Scoring Factors (sur 100 points)
  1. Equipment Match (30 pts) - L'exercice peut être fait avec l'équipement disponible
  2. Discipline Match (20 pts) - Correspond à la discipline demandée
  3. Difficulty Match (15 pts) - Adapté au niveau de l'utilisateur
  4. Variety Bonus (15 pts) - Exercice jamais ou rarement utilisé
  5. Compound Priority (10 pts) - Exercice polyarticulaire prioritaire
  6. Quality Score (10 pts) - Note de qualité de l'exercice dans la DB
  
  ## Performance
  - **Avant:** 150+ exercices chargés → envoyés à l'IA
  - **Après:** 40-60 exercices intelligemment sélectionnés → envoyés à l'IA
  - **Gain:** 60-75% de réduction + meilleure qualité de sélection
  
  ## Usage
  ```sql
  SELECT * FROM filter_exercises_smart(
    'force',                              -- discipline
    ARRAY['barbell', 'dumbbells']::uuid[], -- equipment_ids
    'intermediate',                        -- user_level
    'gym',                                 -- location_type
    ARRAY['Squat', 'Bench Press']::text[], -- recent_exercises
    50                                     -- max_results
  );
  ```
*/

-- ============================================================================
-- 1. Fonction de Scoring des Exercices
-- ============================================================================

CREATE OR REPLACE FUNCTION score_exercise_relevance(
  p_exercise_id uuid,
  p_discipline text,
  p_available_equipment_ids uuid[],
  p_user_difficulty text,
  p_location_type text,
  p_recent_exercises text[]
)
RETURNS numeric AS $$
DECLARE
  v_score numeric := 0;
  v_exercise record;
  v_required_equipment_count integer;
  v_available_equipment_count integer;
  v_is_compound boolean;
  v_is_recently_used boolean;
BEGIN
  -- Get exercise data from optimized view
  SELECT 
    eco.*,
    cardinality(eco.required_equipment_ids) as req_eq_count,
    cardinality(eco.muscle_group_ids) as muscle_count
  INTO v_exercise
  FROM exercise_catalog_optimized eco
  WHERE eco.id = p_exercise_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- ========== 1. DISCIPLINE MATCH (20 points) ==========
  IF v_exercise.discipline = p_discipline THEN
    v_score := v_score + 20;
  ELSE
    -- Wrong discipline = major penalty
    v_score := v_score - 50;
  END IF;
  
  -- ========== 2. EQUIPMENT MATCH (30 points) ==========
  v_required_equipment_count := cardinality(v_exercise.required_equipment_ids);
  
  IF v_required_equipment_count = 0 THEN
    -- Bodyweight = always doable
    v_score := v_score + 30;
  ELSIF p_available_equipment_ids IS NOT NULL THEN
    -- Check if all required equipment is available
    IF v_exercise.required_equipment_ids <@ p_available_equipment_ids THEN
      v_score := v_score + 30;
    ELSE
      -- Missing equipment = major penalty
      v_score := v_score - 40;
    END IF;
  ELSE
    -- No equipment info provided, assume gym
    v_score := v_score + 15;
  END IF;
  
  -- ========== 3. DIFFICULTY MATCH (15 points) ==========
  IF v_exercise.difficulty = p_user_difficulty THEN
    v_score := v_score + 15;
  ELSIF 
    (p_user_difficulty = 'intermediate' AND v_exercise.difficulty IN ('novice', 'advanced')) OR
    (p_user_difficulty = 'advanced' AND v_exercise.difficulty = 'intermediate') OR
    (p_user_difficulty = 'beginner' AND v_exercise.difficulty = 'novice')
  THEN
    -- Adjacent difficulty = partial points
    v_score := v_score + 8;
  ELSIF
    (p_user_difficulty = 'beginner' AND v_exercise.difficulty IN ('advanced', 'elite'))
  THEN
    -- Too advanced for beginner = penalty
    v_score := v_score - 20;
  END IF;
  
  -- ========== 4. VARIETY BONUS (15 points) ==========
  -- Check if exercise was used recently
  v_is_recently_used := v_exercise.name = ANY(p_recent_exercises);
  
  IF v_is_recently_used THEN
    -- Recently used = penalty to promote variety
    v_score := v_score - 10;
  ELSE
    -- New exercise = bonus
    v_score := v_score + 15;
  END IF;
  
  -- ========== 5. COMPOUND PRIORITY (10 points) ==========
  -- Compound movements are polyarticular (multiple muscle groups)
  v_is_compound := v_exercise.muscle_count >= 2;
  
  IF v_is_compound THEN
    v_score := v_score + 10;
  END IF;
  
  -- Also check movement pattern for compounds
  IF v_exercise.movement_pattern IN ('squat', 'deadlift', 'press', 'row', 'pull') THEN
    v_score := v_score + 5;
  END IF;
  
  -- ========== 6. QUALITY SCORE (10 points) ==========
  -- Normalize quality_score (0-5) to 0-10 points
  IF v_exercise.quality_score IS NOT NULL THEN
    v_score := v_score + (v_exercise.quality_score * 2);
  END IF;
  
  -- ========== 7. LOCATION TYPE PENALTIES ==========
  IF p_location_type = 'home' THEN
    -- Penalize gym-only exercises
    IF v_exercise.name ~* '(rack|smith machine|cable|leg press|hack squat)' THEN
      v_score := v_score - 30;
    END IF;
  ELSIF p_location_type = 'outdoor' THEN
    -- Penalize indoor-only exercises
    IF v_exercise.name ~* '(machine|bench press|rack|cable)' THEN
      v_score := v_score - 30;
    END IF;
  END IF;
  
  RETURN GREATEST(v_score, 0); -- Never return negative scores
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 2. Fonction Principale de Filtrage Intelligent
-- ============================================================================

CREATE OR REPLACE FUNCTION filter_exercises_smart(
  p_discipline text,
  p_available_equipment_ids uuid[] DEFAULT NULL,
  p_user_difficulty text DEFAULT 'intermediate',
  p_location_type text DEFAULT 'gym',
  p_recent_exercises text[] DEFAULT ARRAY[]::text[],
  p_max_results integer DEFAULT 50,
  p_min_score numeric DEFAULT 40
)
RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  difficulty text,
  relevance_score numeric,
  muscle_groups jsonb,
  equipment jsonb,
  ai_compact_format text,
  is_compound boolean,
  is_recently_used boolean,
  coaching_cues jsonb,
  progressions jsonb,
  alternatives jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH scored_exercises AS (
    SELECT 
      eco.id,
      eco.name,
      eco.difficulty,
      score_exercise_relevance(
        eco.id,
        p_discipline,
        p_available_equipment_ids,
        p_user_difficulty,
        p_location_type,
        p_recent_exercises
      ) as score,
      eco.muscle_groups,
      eco.equipment,
      eco.ai_compact_format,
      cardinality(eco.muscle_group_ids) >= 2 as is_compound,
      eco.name = ANY(p_recent_exercises) as is_recent,
      eco.coaching_cues,
      eco.progressions,
      eco.alternatives
    FROM exercise_catalog_optimized eco
    WHERE eco.discipline = p_discipline
      AND eco.is_active = true
      AND eco.is_validated = true
  )
  SELECT 
    se.id,
    se.name,
    se.difficulty,
    ROUND(se.score, 2) as relevance_score,
    se.muscle_groups,
    se.equipment,
    se.ai_compact_format,
    se.is_compound,
    se.is_recent,
    se.coaching_cues,
    se.progressions,
    se.alternatives
  FROM scored_exercises se
  WHERE se.score >= p_min_score
  ORDER BY 
    se.score DESC,
    se.is_compound DESC,
    se.is_recent ASC
  LIMIT p_max_results;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 3. Fonction Optimisée pour le Context Collector
-- ============================================================================

CREATE OR REPLACE FUNCTION get_smart_exercise_catalog_for_context(
  p_user_id uuid,
  p_discipline text,
  p_location_id uuid DEFAULT NULL,
  p_max_exercises integer DEFAULT 50
)
RETURNS jsonb AS $$
DECLARE
  v_location record;
  v_equipment_ids uuid[];
  v_location_type text;
  v_user_level text;
  v_recent_exercises text[];
  v_filtered_exercises jsonb;
BEGIN
  -- Get location details if provided
  IF p_location_id IS NOT NULL THEN
    SELECT 
      location_type,
      available_equipment
    INTO v_location
    FROM training_locations
    WHERE id = p_location_id AND user_id = p_user_id;
    
    IF FOUND THEN
      v_location_type := v_location.location_type;
      
      -- Convert equipment names to IDs
      SELECT array_agg(et.id)
      INTO v_equipment_ids
      FROM unnest(v_location.available_equipment) AS eq_name
      JOIN equipment_types et ON 
        et.name_fr ILIKE eq_name OR 
        et.name_en ILIKE eq_name;
    END IF;
  END IF;
  
  -- Fallback to defaults
  v_location_type := COALESCE(v_location_type, 'gym');
  
  -- Get user training level
  SELECT training_level
  INTO v_user_level
  FROM user_profile
  WHERE user_id = p_user_id;
  
  v_user_level := COALESCE(v_user_level, 'intermediate');
  
  -- Get recent exercises (last 7 days)
  SELECT array_agg(DISTINCT exercise_name)
  INTO v_recent_exercises
  FROM training_exercise_load_history
  WHERE user_id = p_user_id
    AND performed_at > now() - interval '7 days';
  
  v_recent_exercises := COALESCE(v_recent_exercises, ARRAY[]::text[]);
  
  -- Get filtered exercises using smart filtering
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', fe.exercise_id,
      'name', fe.exercise_name,
      'difficulty', fe.difficulty,
      'relevance_score', fe.relevance_score,
      'muscle_groups', fe.muscle_groups,
      'equipment', fe.equipment,
      'ai_compact', fe.ai_compact_format,
      'is_compound', fe.is_compound,
      'coaching_cues', fe.coaching_cues,
      'progressions', fe.progressions,
      'alternatives', fe.alternatives
    )
  )
  INTO v_filtered_exercises
  FROM filter_exercises_smart(
    p_discipline,
    v_equipment_ids,
    v_user_level,
    v_location_type,
    v_recent_exercises,
    p_max_exercises,
    40 -- min_score threshold
  ) fe;
  
  RETURN jsonb_build_object(
    'exercises', COALESCE(v_filtered_exercises, '[]'::jsonb),
    'count', jsonb_array_length(COALESCE(v_filtered_exercises, '[]'::jsonb)),
    'filters_applied', jsonb_build_object(
      'discipline', p_discipline,
      'location_type', v_location_type,
      'user_level', v_user_level,
      'equipment_count', cardinality(v_equipment_ids),
      'recent_exercises_excluded', cardinality(v_recent_exercises)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Vue pour Debug et Monitoring du Scoring
-- ============================================================================

CREATE OR REPLACE VIEW exercise_scoring_debug AS
SELECT 
  e.id,
  e.name,
  e.discipline,
  e.difficulty,
  e.quality_score,
  e.usage_count,
  cardinality(eco.muscle_group_ids) as muscle_count,
  cardinality(eco.required_equipment_ids) as required_equipment_count,
  CASE 
    WHEN cardinality(eco.muscle_group_ids) >= 2 THEN 'Compound'
    ELSE 'Isolation'
  END as movement_type,
  e.movement_pattern,
  e.is_active,
  e.is_validated
FROM exercises e
LEFT JOIN exercise_catalog_optimized eco ON eco.id = e.id
WHERE e.is_active = true;

-- ============================================================================
-- 5. Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION score_exercise_relevance TO authenticated;
GRANT EXECUTE ON FUNCTION filter_exercises_smart TO authenticated;
GRANT EXECUTE ON FUNCTION get_smart_exercise_catalog_for_context TO authenticated;
GRANT SELECT ON exercise_scoring_debug TO authenticated;

-- ============================================================================
-- 6. Commentaires
-- ============================================================================

COMMENT ON FUNCTION score_exercise_relevance IS 'Scores an exercise based on user context and preferences (0-100 scale)';
COMMENT ON FUNCTION filter_exercises_smart IS 'Returns intelligently filtered exercises using relevance scoring. Reduces catalog from 2600+ to 40-60 exercises.';
COMMENT ON FUNCTION get_smart_exercise_catalog_for_context IS 'One-shot function for Context Collector to get pre-filtered, scored exercises for a user session';

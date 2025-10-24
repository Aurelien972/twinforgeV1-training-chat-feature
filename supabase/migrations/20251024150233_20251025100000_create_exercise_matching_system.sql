/*
  # Create Exercise Matching and Substitution System

  ## Overview
  Intelligent system for matching exercises to available equipment and
  suggesting substitutions when specific equipment is unavailable.

  ## Features
  1. Match exercises based on available equipment
  2. Rank exercises by relevance and compatibility
  3. Suggest alternative exercises when equipment missing
  4. Filter by user level, goals, and location type

  ## Tables Created
  - `exercise_substitutions` - Predefined substitution rules
  - `exercise_compatibility_scores` - Cached compatibility calculations

  ## Functions Created
  - `find_exercises_by_equipment()` - Find compatible exercises
  - `suggest_exercise_substitutions()` - Find alternatives
  - `rank_exercises_by_relevance()` - Score and rank results
  - `get_exercises_for_location()` - Location-specific filtering

  ## Security
  - RLS enabled on all tables
  - Public read access for reference data
  - Service role for admin operations
*/

-- ============================================================================
-- DROP existing tables if they exist (idempotent migration)
-- ============================================================================

DROP TABLE IF EXISTS exercise_compatibility_scores CASCADE;
DROP TABLE IF EXISTS exercise_substitutions CASCADE;

-- ============================================================================
-- Exercise Substitutions Table
-- ============================================================================

CREATE TABLE exercise_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Original exercise
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,

  -- Substitute exercise
  substitute_exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,

  -- Substitution metadata
  substitution_type text NOT NULL CHECK (substitution_type IN (
    'equipment_alternative',  -- Same movement, different equipment
    'movement_similar',       -- Similar movement pattern
    'muscle_similar',         -- Similar muscle groups
    'difficulty_similar',     -- Similar difficulty level
    'emergency_fallback'      -- Last resort alternative
  )),

  -- Quality scoring
  similarity_score numeric(3, 2) CHECK (similarity_score >= 0 AND similarity_score <= 1),
  -- 1.0 = perfect substitute, 0.5 = acceptable, 0.0 = poor

  -- Context
  reason text,  -- Why this is a good substitute
  conditions jsonb DEFAULT '{}'::jsonb,  -- When to use this substitute

  -- Usage tracking
  usage_count integer DEFAULT 0,
  user_rating numeric(3, 2),  -- User feedback on substitution quality

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(exercise_id, substitute_exercise_id, substitution_type)
);

-- ============================================================================
-- Exercise Compatibility Scores (Materialized for Performance)
-- ============================================================================

CREATE TABLE exercise_compatibility_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  location_type text NOT NULL CHECK (location_type IN ('home', 'gym', 'outdoor', 'any')),

  -- Compatibility factors
  equipment_availability_score numeric(3, 2),  -- How common is required equipment
  space_requirement_score numeric(3, 2),       -- Space needed
  skill_accessibility_score numeric(3, 2),     -- How accessible to different levels

  -- Overall score
  overall_compatibility numeric(3, 2),

  -- Cached metadata
  required_equipment_count integer,
  alternative_equipment_available boolean DEFAULT false,

  last_calculated_at timestamptz DEFAULT now(),

  UNIQUE(exercise_id, location_type)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX idx_exercise_substitutions_exercise
  ON exercise_substitutions(exercise_id, similarity_score DESC);

CREATE INDEX idx_exercise_substitutions_substitute
  ON exercise_substitutions(substitute_exercise_id);

CREATE INDEX idx_exercise_substitutions_type
  ON exercise_substitutions(substitution_type, similarity_score DESC);

CREATE INDEX idx_exercise_compatibility_location
  ON exercise_compatibility_scores(location_type, overall_compatibility DESC);

CREATE INDEX idx_exercise_compatibility_exercise
  ON exercise_compatibility_scores(exercise_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE exercise_substitutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view substitutions"
  ON exercise_substitutions FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage substitutions"
  ON exercise_substitutions FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE exercise_compatibility_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view compatibility scores"
  ON exercise_compatibility_scores FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage compatibility scores"
  ON exercise_compatibility_scores FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- FUNCTION: find_exercises_by_equipment
-- Find exercises compatible with available equipment
-- ============================================================================

CREATE OR REPLACE FUNCTION find_exercises_by_equipment(
  p_available_equipment_ids uuid[],
  p_discipline text DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  discipline text,
  difficulty text,
  category text,
  required_equipment_count integer,
  available_equipment_count integer,
  compatibility_score numeric,
  can_perform boolean
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH exercise_equipment_requirements AS (
    SELECT
      e.id,
      e.name,
      e.discipline,
      e.difficulty,
      e.category,
      COUNT(DISTINCT ee.equipment_id) FILTER (WHERE ee.is_required = true) as required_count,
      COUNT(DISTINCT ee.equipment_id) FILTER (
        WHERE ee.is_required = true
        AND ee.equipment_id = ANY(p_available_equipment_ids)
      ) as available_count
    FROM exercises e
    LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
    WHERE
      (p_discipline IS NULL OR e.discipline = p_discipline)
      AND (p_difficulty IS NULL OR e.difficulty = p_difficulty)
      AND e.is_active = true
      AND e.is_validated = true
    GROUP BY e.id, e.name, e.discipline, e.difficulty, e.category
  )
  SELECT
    eer.id as exercise_id,
    eer.name as exercise_name,
    eer.discipline,
    eer.difficulty,
    eer.category,
    eer.required_count::integer as required_equipment_count,
    eer.available_count::integer as available_equipment_count,
    CASE
      WHEN eer.required_count = 0 THEN 1.0  -- Bodyweight exercises
      WHEN eer.available_count = eer.required_count THEN 1.0  -- All required equipment available
      WHEN eer.available_count > 0 THEN (eer.available_count::numeric / eer.required_count::numeric) * 0.7  -- Partial match
      ELSE 0.3  -- No equipment match but might have substitutes
    END as compatibility_score,
    (eer.required_count = 0 OR eer.available_count = eer.required_count) as can_perform
  FROM exercise_equipment_requirements eer
  ORDER BY can_perform DESC, compatibility_score DESC, eer.name
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- FUNCTION: suggest_exercise_substitutions
-- Find alternative exercises when equipment is missing
-- ============================================================================

CREATE OR REPLACE FUNCTION suggest_exercise_substitutions(
  p_original_exercise_id uuid,
  p_available_equipment_ids uuid[] DEFAULT NULL,
  p_max_suggestions integer DEFAULT 5
)
RETURNS TABLE (
  substitute_id uuid,
  substitute_name text,
  substitute_difficulty text,
  substitution_type text,
  similarity_score numeric,
  reason text,
  equipment_compatible boolean
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_original_discipline text;
  v_original_category text;
  v_original_difficulty text;
  v_original_movement_pattern text;
BEGIN
  -- Get original exercise details
  SELECT discipline, category, difficulty, movement_pattern
  INTO v_original_discipline, v_original_category, v_original_difficulty, v_original_movement_pattern
  FROM exercises
  WHERE id = p_original_exercise_id;

  RETURN QUERY
  WITH
  -- Predefined substitutions from table
  predefined_subs AS (
    SELECT
      es.substitute_exercise_id as sub_id,
      e.name as sub_name,
      e.difficulty as sub_diff,
      es.substitution_type as sub_type,
      es.similarity_score as score,
      es.reason,
      1 as priority
    FROM exercise_substitutions es
    JOIN exercises e ON e.id = es.substitute_exercise_id
    WHERE es.exercise_id = p_original_exercise_id
      AND e.is_active = true
      AND e.is_validated = true
  ),
  -- Computed similar exercises
  computed_subs AS (
    SELECT
      e.id as sub_id,
      e.name as sub_name,
      e.difficulty as sub_diff,
      CASE
        WHEN e.movement_pattern = v_original_movement_pattern THEN 'movement_similar'
        WHEN e.category = v_original_category THEN 'muscle_similar'
        WHEN e.difficulty = v_original_difficulty THEN 'difficulty_similar'
        ELSE 'emergency_fallback'
      END as sub_type,
      CASE
        WHEN e.movement_pattern = v_original_movement_pattern AND e.category = v_original_category THEN 0.9
        WHEN e.movement_pattern = v_original_movement_pattern THEN 0.75
        WHEN e.category = v_original_category THEN 0.6
        WHEN e.difficulty = v_original_difficulty THEN 0.5
        ELSE 0.3
      END as score,
      'Similar ' || COALESCE(e.movement_pattern, 'exercise') || ' pattern' as reason,
      2 as priority
    FROM exercises e
    WHERE e.id != p_original_exercise_id
      AND e.discipline = v_original_discipline
      AND e.is_active = true
      AND e.is_validated = true
      AND (
        e.movement_pattern = v_original_movement_pattern
        OR e.category = v_original_category
        OR e.difficulty = v_original_difficulty
      )
  ),
  -- Combine and deduplicate
  all_subs AS (
    SELECT * FROM predefined_subs
    UNION
    SELECT * FROM computed_subs
  ),
  -- Check equipment compatibility if provided
  equipment_check AS (
    SELECT
      asub.sub_id,
      asub.sub_name,
      asub.sub_diff,
      asub.sub_type,
      asub.score,
      asub.reason,
      asub.priority,
      CASE
        WHEN p_available_equipment_ids IS NULL THEN true
        WHEN NOT EXISTS (
          SELECT 1 FROM exercise_equipment ee
          WHERE ee.exercise_id = asub.sub_id AND ee.is_required = true
        ) THEN true  -- Bodyweight
        WHEN NOT EXISTS (
          SELECT 1 FROM exercise_equipment ee
          WHERE ee.exercise_id = asub.sub_id
            AND ee.is_required = true
            AND NOT (ee.equipment_id = ANY(p_available_equipment_ids))
        ) THEN true  -- All required equipment available
        ELSE false
      END as equip_compat
    FROM all_subs asub
  )
  SELECT
    ec.sub_id as substitute_id,
    ec.sub_name as substitute_name,
    ec.sub_diff as substitute_difficulty,
    ec.sub_type as substitution_type,
    ec.score as similarity_score,
    ec.reason,
    ec.equip_compat as equipment_compatible
  FROM equipment_check ec
  ORDER BY ec.priority ASC, ec.equip_compat DESC, ec.score DESC
  LIMIT p_max_suggestions;
END;
$$;

-- ============================================================================
-- FUNCTION: rank_exercises_by_relevance
-- Score and rank exercises by multiple criteria
-- ============================================================================

CREATE OR REPLACE FUNCTION rank_exercises_by_relevance(
  p_available_equipment_ids uuid[],
  p_user_level text DEFAULT 'intermediate',
  p_target_goals text[] DEFAULT ARRAY['strength', 'hypertrophy'],
  p_discipline text DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  discipline text,
  difficulty text,
  category text,
  relevance_score numeric,
  equipment_match_score numeric,
  difficulty_match_score numeric,
  goal_alignment_score numeric,
  reason text
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_user_level_rank integer;
BEGIN
  -- Map user level to numeric rank for comparison
  v_user_level_rank := CASE p_user_level
    WHEN 'beginner' THEN 1
    WHEN 'intermediate' THEN 2
    WHEN 'advanced' THEN 3
    WHEN 'elite' THEN 4
    ELSE 2
  END;

  RETURN QUERY
  WITH exercise_scores AS (
    SELECT
      e.id,
      e.name,
      e.discipline,
      e.difficulty,
      e.category,
      -- Equipment match score
      CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM exercise_equipment ee
          WHERE ee.exercise_id = e.id AND ee.is_required = true
        ) THEN 1.0  -- Bodyweight
        WHEN NOT EXISTS (
          SELECT 1 FROM exercise_equipment ee
          WHERE ee.exercise_id = e.id
            AND ee.is_required = true
            AND NOT (ee.equipment_id = ANY(p_available_equipment_ids))
        ) THEN 1.0  -- All required available
        ELSE 0.3  -- Missing equipment
      END as equip_score,
      -- Difficulty match score
      CASE e.difficulty
        WHEN p_user_level THEN 1.0
        WHEN 'intermediate' THEN
          CASE
            WHEN v_user_level_rank IN (2, 3) THEN 0.9
            ELSE 0.6
          END
        WHEN 'advanced' THEN
          CASE
            WHEN v_user_level_rank >= 3 THEN 1.0
            WHEN v_user_level_rank = 2 THEN 0.7
            ELSE 0.3
          END
        WHEN 'beginner' THEN
          CASE
            WHEN v_user_level_rank = 1 THEN 1.0
            ELSE 0.5
          END
        WHEN 'elite' THEN
          CASE
            WHEN v_user_level_rank = 4 THEN 1.0
            ELSE 0.4
          END
        ELSE 0.5
      END as diff_score,
      -- Goal alignment score
      CASE
        WHEN e.category IN ('push', 'pull', 'squat', 'hinge') AND 'strength' = ANY(p_target_goals) THEN 1.0
        WHEN e.category IN ('isolation', 'accessories') AND 'hypertrophy' = ANY(p_target_goals) THEN 0.9
        WHEN e.category IN ('olympic', 'explosive') AND 'power' = ANY(p_target_goals) THEN 1.0
        WHEN e.category IN ('cardio', 'conditioning') AND 'endurance' = ANY(p_target_goals) THEN 1.0
        ELSE 0.6
      END as goal_score
    FROM exercises e
    WHERE
      (p_discipline IS NULL OR e.discipline = p_discipline)
      AND e.is_active = true
      AND e.is_validated = true
  )
  SELECT
    es.id as exercise_id,
    es.name as exercise_name,
    es.discipline,
    es.difficulty,
    es.category,
    ((es.equip_score * 0.4) + (es.diff_score * 0.3) + (es.goal_score * 0.3)) as relevance_score,
    es.equip_score as equipment_match_score,
    es.diff_score as difficulty_match_score,
    es.goal_score as goal_alignment_score,
    'Equipment: ' || ROUND(es.equip_score * 100) || '% | ' ||
    'Difficulty: ' || ROUND(es.diff_score * 100) || '% | ' ||
    'Goals: ' || ROUND(es.goal_score * 100) || '%' as reason
  FROM exercise_scores es
  ORDER BY relevance_score DESC, es.name
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- FUNCTION: get_exercises_for_location
-- Filter exercises by location type and equipment availability
-- ============================================================================

CREATE OR REPLACE FUNCTION get_exercises_for_location(
  p_location_type text,
  p_discipline text DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_limit integer DEFAULT 30
)
RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  discipline text,
  difficulty text,
  category text,
  location_compatibility numeric,
  required_equipment_names text[]
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH location_equipment AS (
    -- Define typical equipment available at each location type
    SELECT CASE p_location_type
      WHEN 'home' THEN ARRAY['dumbbell', 'resistance-band', 'bodyweight', 'bench', 'pull-up-bar']
      WHEN 'gym' THEN ARRAY['barbell', 'dumbbell', 'cable', 'machine', 'rack', 'bench']
      WHEN 'outdoor' THEN ARRAY['bodyweight', 'pull-up-bar', 'parallel-bars']
      ELSE ARRAY['bodyweight']
    END as available_equipment
  ),
  exercise_compatibility AS (
    SELECT
      e.id,
      e.name,
      e.discipline,
      e.difficulty,
      e.category,
      COALESCE(
        ARRAY_AGG(DISTINCT et.name) FILTER (WHERE ee.is_required = true),
        ARRAY[]::text[]
      ) as required_equip,
      CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM exercise_equipment ee2
          WHERE ee2.exercise_id = e.id AND ee2.is_required = true
        ) THEN 1.0  -- Bodyweight
        WHEN COUNT(DISTINCT et.name) FILTER (
          WHERE ee.is_required = true
          AND et.name = ANY((SELECT available_equipment FROM location_equipment))
        ) = COUNT(DISTINCT et.name) FILTER (WHERE ee.is_required = true)
        THEN 1.0  -- All required equipment available
        ELSE 0.4  -- Some equipment missing
      END as compat_score
    FROM exercises e
    LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
    LEFT JOIN equipment_types et ON ee.equipment_id = et.id
    WHERE
      (p_discipline IS NULL OR e.discipline = p_discipline)
      AND (p_difficulty IS NULL OR e.difficulty = p_difficulty)
      AND e.is_active = true
      AND e.is_validated = true
    GROUP BY e.id, e.name, e.discipline, e.difficulty, e.category
  )
  SELECT
    ec.id as exercise_id,
    ec.name as exercise_name,
    ec.discipline,
    ec.difficulty,
    ec.category,
    ec.compat_score as location_compatibility,
    ec.required_equip as required_equipment_names
  FROM exercise_compatibility ec
  WHERE ec.compat_score >= 0.5  -- Only include exercises that are reasonably compatible
  ORDER BY ec.compat_score DESC, ec.name
  LIMIT p_limit;
END;
$$;
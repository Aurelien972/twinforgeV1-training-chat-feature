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
-- Exercise Substitutions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_substitutions (
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

CREATE TABLE IF NOT EXISTS exercise_compatibility_scores (
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

CREATE INDEX IF NOT EXISTS idx_exercise_substitutions_exercise
  ON exercise_substitutions(exercise_id, similarity_score DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_substitutions_substitute
  ON exercise_substitutions(substitute_exercise_id);

CREATE INDEX IF NOT EXISTS idx_exercise_substitutions_type
  ON exercise_substitutions(substitution_type, similarity_score DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_compatibility_location
  ON exercise_compatibility_scores(location_type, overall_compatibility DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_compatibility_exercise
  ON exercise_compatibility_scores(exercise_id);

-- ============================================================================
-- Function: Find Exercises by Available Equipment
-- ============================================================================

CREATE OR REPLACE FUNCTION find_exercises_by_equipment(
  p_available_equipment_ids uuid[],
  p_discipline text DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_location_type text DEFAULT 'gym',
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  discipline text,
  difficulty text,
  required_equipment jsonb,
  missing_equipment jsonb,
  compatibility_score numeric,
  can_perform boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH exercise_equipment_agg AS (
    SELECT
      e.id,
      e.name,
      e.discipline,
      e.difficulty,
      e.description_short,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', et.id,
            'name', et.name_fr,
            'is_required', ee.is_required
          )
        ) FILTER (WHERE et.id IS NOT NULL),
        '[]'::jsonb
      ) as equipment_needed
    FROM exercises e
    LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
    LEFT JOIN equipment_types et ON ee.equipment_id = et.id
    WHERE
      e.is_active = true
      AND e.is_validated = true
      AND (p_discipline IS NULL OR e.discipline = p_discipline)
      AND (p_difficulty IS NULL OR e.difficulty = p_difficulty)
    GROUP BY e.id, e.name, e.discipline, e.difficulty, e.description_short
  ),
  equipment_analysis AS (
    SELECT
      eea.*,
      (
        SELECT jsonb_agg(eq)
        FROM jsonb_array_elements(eea.equipment_needed) eq
        WHERE (eq->>'is_required')::boolean = true
          AND (eq->>'id')::uuid = ANY(p_available_equipment_ids)
      ) as available_required,
      (
        SELECT jsonb_agg(eq)
        FROM jsonb_array_elements(eea.equipment_needed) eq
        WHERE (eq->>'is_required')::boolean = true
          AND NOT ((eq->>'id')::uuid = ANY(p_available_equipment_ids))
      ) as missing_required,
      (
        SELECT COUNT(*)::integer
        FROM jsonb_array_elements(eea.equipment_needed) eq
        WHERE (eq->>'is_required')::boolean = true
      ) as total_required_count,
      (
        SELECT COUNT(*)::integer
        FROM jsonb_array_elements(eea.equipment_needed) eq
        WHERE (eq->>'is_required')::boolean = true
          AND (eq->>'id')::uuid = ANY(p_available_equipment_ids)
      ) as available_required_count
    FROM exercise_equipment_agg eea
  )
  SELECT
    ea.id,
    ea.name,
    ea.discipline,
    ea.difficulty,
    ea.equipment_needed,
    COALESCE(ea.missing_required, '[]'::jsonb),
    CASE
      WHEN ea.total_required_count = 0 THEN 1.0  -- Bodyweight exercise
      WHEN ea.available_required_count = ea.total_required_count THEN 1.0  -- All equipment available
      WHEN ea.available_required_count > 0 THEN
        (ea.available_required_count::numeric / ea.total_required_count::numeric) * 0.7  -- Partial compatibility
      ELSE 0.0  -- No required equipment available
    END as compatibility_score,
    CASE
      WHEN ea.total_required_count = 0 THEN true
      WHEN ea.available_required_count = ea.total_required_count THEN true
      ELSE false
    END as can_perform
  FROM equipment_analysis ea
  WHERE
    ea.total_required_count = 0  -- Bodyweight exercises always included
    OR ea.available_required_count > 0  -- Or at least some equipment available
  ORDER BY
    compatibility_score DESC,
    ea.name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Function: Suggest Exercise Substitutions
-- ============================================================================

CREATE OR REPLACE FUNCTION suggest_exercise_substitutions(
  p_original_exercise_id uuid,
  p_available_equipment_ids uuid[] DEFAULT NULL,
  p_max_suggestions integer DEFAULT 5
)
RETURNS TABLE (
  substitute_id uuid,
  substitute_name text,
  substitution_type text,
  similarity_score numeric,
  reason text,
  can_perform_now boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH direct_substitutes AS (
    -- Pre-defined substitutions
    SELECT
      es.substitute_exercise_id,
      e.name,
      es.substitution_type,
      es.similarity_score,
      es.reason,
      CASE
        WHEN p_available_equipment_ids IS NULL THEN true
        ELSE EXISTS (
          SELECT 1
          FROM find_exercises_by_equipment(
            p_available_equipment_ids,
            NULL,
            NULL,
            'any',
            1000
          ) f
          WHERE f.exercise_id = es.substitute_exercise_id
            AND f.can_perform = true
        )
      END as can_perform
    FROM exercise_substitutions es
    JOIN exercises e ON es.substitute_exercise_id = e.id
    WHERE
      es.exercise_id = p_original_exercise_id
      AND e.is_active = true
      AND e.is_validated = true
  ),
  similar_movement_pattern AS (
    -- Find exercises with similar movement patterns
    SELECT
      e2.id,
      e2.name,
      'movement_similar' as substitution_type,
      0.6 as similarity_score,
      'Similar movement pattern and muscle groups' as reason,
      CASE
        WHEN p_available_equipment_ids IS NULL THEN true
        ELSE EXISTS (
          SELECT 1
          FROM find_exercises_by_equipment(
            p_available_equipment_ids,
            NULL,
            NULL,
            'any',
            1000
          ) f
          WHERE f.exercise_id = e2.id
            AND f.can_perform = true
        )
      END as can_perform
    FROM exercises e1
    JOIN exercises e2 ON
      e1.movement_pattern = e2.movement_pattern
      AND e1.id != e2.id
    WHERE
      e1.id = p_original_exercise_id
      AND e2.is_active = true
      AND e2.is_validated = true
      AND NOT EXISTS (
        SELECT 1 FROM direct_substitutes ds
        WHERE ds.substitute_exercise_id = e2.id
      )
    LIMIT 3
  ),
  similar_muscle_groups AS (
    -- Find exercises targeting similar muscles
    SELECT
      e2.id,
      e2.name,
      'muscle_similar' as substitution_type,
      0.5 as similarity_score,
      'Targets similar muscle groups' as reason,
      CASE
        WHEN p_available_equipment_ids IS NULL THEN true
        ELSE EXISTS (
          SELECT 1
          FROM find_exercises_by_equipment(
            p_available_equipment_ids,
            NULL,
            NULL,
            'any',
            1000
          ) f
          WHERE f.exercise_id = e2.id
            AND f.can_perform = true
        )
      END as can_perform
    FROM exercises e2
    WHERE
      e2.is_active = true
      AND e2.is_validated = true
      AND e2.id != p_original_exercise_id
      AND EXISTS (
        SELECT 1
        FROM exercise_muscle_groups emg1
        JOIN exercise_muscle_groups emg2 ON emg1.muscle_group_id = emg2.muscle_group_id
        WHERE
          emg1.exercise_id = p_original_exercise_id
          AND emg2.exercise_id = e2.id
          AND emg1.involvement_type = 'primary'
          AND emg2.involvement_type = 'primary'
      )
      AND NOT EXISTS (
        SELECT 1 FROM direct_substitutes ds WHERE ds.substitute_exercise_id = e2.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM similar_movement_pattern smp WHERE smp.id = e2.id
      )
    LIMIT 2
  ),
  all_substitutes AS (
    SELECT * FROM direct_substitutes
    UNION ALL
    SELECT * FROM similar_movement_pattern
    UNION ALL
    SELECT * FROM similar_muscle_groups
  )
  SELECT
    substitute_exercise_id as substitute_id,
    substitute_name,
    substitution_type,
    similarity_score,
    reason,
    can_perform_now
  FROM all_substitutes
  ORDER BY
    similarity_score DESC,
    can_perform_now DESC,
    substitute_name ASC
  LIMIT p_max_suggestions;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Function: Get Exercises for Location Type
-- ============================================================================

CREATE OR REPLACE FUNCTION get_exercises_for_location(
  p_location_type text,
  p_discipline text DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  discipline text,
  difficulty text,
  description text,
  compatibility_score numeric
) AS $$
BEGIN
  -- Get equipment typically available at this location
  WITH location_equipment AS (
    SELECT ARRAY_AGG(et.id) as equipment_ids
    FROM equipment_types et
    JOIN equipment_location_compatibility elc ON et.id = elc.equipment_id
    WHERE elc.location_type = p_location_type
      AND elc.is_common = true
  )
  SELECT
    f.exercise_id,
    f.exercise_name,
    f.discipline,
    f.difficulty,
    e.description_short,
    f.compatibility_score
  FROM location_equipment le
  CROSS JOIN LATERAL find_exercises_by_equipment(
    le.equipment_ids,
    p_discipline,
    p_difficulty,
    p_location_type,
    p_limit
  ) f
  JOIN exercises e ON f.exercise_id = e.id
  WHERE f.can_perform = true
  ORDER BY f.compatibility_score DESC, f.exercise_name ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Function: Rank Exercises by Relevance
-- ============================================================================

CREATE OR REPLACE FUNCTION rank_exercises_by_relevance(
  p_available_equipment_ids uuid[],
  p_user_level text DEFAULT 'intermediate',
  p_target_goals text[] DEFAULT NULL,
  p_discipline text DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  discipline text,
  difficulty text,
  relevance_score numeric,
  can_perform boolean,
  reason text
) AS $$
BEGIN
  RETURN QUERY
  WITH base_exercises AS (
    SELECT * FROM find_exercises_by_equipment(
      p_available_equipment_ids,
      p_discipline,
      NULL,
      'any',
      500
    )
  ),
  scored_exercises AS (
    SELECT
      be.exercise_id,
      be.exercise_name,
      be.discipline,
      be.difficulty,
      be.compatibility_score,
      be.can_perform,
      e.target_goals,
      e.skill_level_required,
      -- Calculate relevance score
      (
        be.compatibility_score * 0.3 +  -- 30% equipment compatibility
        CASE
          WHEN be.difficulty = p_user_level THEN 0.4
          WHEN be.difficulty IN ('beginner', 'novice') AND p_user_level IN ('beginner', 'novice') THEN 0.3
          WHEN be.difficulty IN ('intermediate', 'advanced') AND p_user_level IN ('intermediate', 'advanced') THEN 0.3
          ELSE 0.1
        END +  -- 40% level match
        CASE
          WHEN p_target_goals IS NOT NULL AND e.target_goals && p_target_goals THEN 0.3
          ELSE 0.0
        END  -- 30% goal match
      ) as relevance_score
    FROM base_exercises be
    JOIN exercises e ON be.exercise_id = e.id
  )
  SELECT
    se.exercise_id,
    se.exercise_name,
    se.discipline,
    se.difficulty,
    se.relevance_score,
    se.can_perform,
    CASE
      WHEN se.relevance_score >= 0.8 THEN 'Highly recommended for your level and goals'
      WHEN se.relevance_score >= 0.6 THEN 'Good match for your profile'
      WHEN se.relevance_score >= 0.4 THEN 'Suitable option'
      ELSE 'Alternative choice'
    END as reason
  FROM scored_exercises se
  WHERE se.can_perform = true
  ORDER BY se.relevance_score DESC, se.exercise_name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE exercise_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view substitutions"
  ON exercise_substitutions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage substitutions"
  ON exercise_substitutions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE exercise_compatibility_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view compatibility scores"
  ON exercise_compatibility_scores FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage compatibility scores"
  ON exercise_compatibility_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE TRIGGER trigger_exercise_substitutions_updated_at
  BEFORE UPDATE ON exercise_substitutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

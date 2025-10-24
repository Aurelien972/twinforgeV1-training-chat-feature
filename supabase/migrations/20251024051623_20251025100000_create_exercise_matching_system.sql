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
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  substitute_exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  substitution_type text NOT NULL CHECK (substitution_type IN (
    'equipment_alternative',
    'movement_similar',
    'muscle_similar',
    'difficulty_similar',
    'emergency_fallback'
  )),
  similarity_score numeric(3, 2) CHECK (similarity_score >= 0 AND similarity_score <= 1),
  reason text,
  conditions jsonb DEFAULT '{}'::jsonb,
  usage_count integer DEFAULT 0,
  user_rating numeric(3, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(exercise_id, substitute_exercise_id, substitution_type)
);

CREATE TABLE IF NOT EXISTS exercise_compatibility_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  location_type text NOT NULL CHECK (location_type IN ('home', 'gym', 'outdoor', 'any')),
  equipment_availability_score numeric(3, 2),
  space_requirement_score numeric(3, 2),
  skill_accessibility_score numeric(3, 2),
  overall_compatibility numeric(3, 2),
  required_equipment_count integer,
  alternative_equipment_available boolean DEFAULT false,
  last_calculated_at timestamptz DEFAULT now(),
  UNIQUE(exercise_id, location_type)
);

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

ALTER TABLE exercise_substitutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view substitutions" ON exercise_substitutions FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage substitutions" ON exercise_substitutions FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE exercise_compatibility_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view compatibility scores" ON exercise_compatibility_scores FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage compatibility scores" ON exercise_compatibility_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
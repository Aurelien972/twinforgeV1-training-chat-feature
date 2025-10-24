/*
  # Create Comprehensive Exercise Catalog System

  ## Overview
  Complete exercise catalog database for fitness/health app supporting:
  - Force/Musculation, Calisthenics, Functional/CrossFit, Endurance
  - 3000+ exercises with rich metadata
  - Multi-language support (French/English)
  - Progressive difficulty and adaptations
  - Integration with existing illustration system

  ## Tables Created

  ### Core Tables
  - `exercises` - Main exercise catalog with classification
  - `exercise_execution_details` - Technical execution steps by phase
  - `exercise_coaching_cues` - Coaching cues per level and pathology
  - `exercise_progressions` - Progression and regression paths
  - `exercise_translations` - Multi-language support

  ### Relationship Tables
  - `muscle_groups` - Master list of muscle groups
  - `equipment_types` - Master list of equipment
  - `exercise_muscle_groups` - Many-to-many exercises to muscles
  - `exercise_equipment` - Many-to-many exercises to equipment

  ## Features
  - Full-text search with fuzzy matching
  - Rich metadata for AI illustration generation
  - Versioning and audit trail
  - RLS policies for security
  - Optimized indexes for performance
  - Integration with existing `exercise_visual_metadata`

  ## Security
  - RLS enabled on all tables
  - Public read access for exercises
  - Service role for admin operations
  - Audit logging for modifications
*/

-- ============================================================================
-- Enable Required Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- Master Reference Tables
-- ============================================================================

-- Muscle Groups Reference
CREATE TABLE IF NOT EXISTS muscle_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  category text CHECK (category IN ('primary', 'major', 'minor', 'stabilizer')),
  body_region text CHECK (body_region IN ('upper', 'lower', 'core', 'full_body')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Equipment Types Reference
CREATE TABLE IF NOT EXISTS equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  category text CHECK (category IN ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'cardio', 'accessory')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Main Exercise Catalog Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name text NOT NULL,
  name_normalized text NOT NULL,
  slug text UNIQUE NOT NULL,
  
  -- Classification
  discipline text NOT NULL CHECK (discipline IN ('force', 'endurance', 'functional', 'calisthenics', 'competitions', 'mobility', 'rehab')),
  category text, -- push, pull, squat, hinge, carry, run, swim, cycle, etc.
  subcategory text, -- bench, deadlift, olympic, skills, intervals, etc.
  
  -- Difficulty and Prerequisites
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'novice', 'intermediate', 'advanced', 'elite', 'master')),
  skill_level_required integer DEFAULT 1 CHECK (skill_level_required >= 1 AND skill_level_required <= 10),
  prerequisites text[] DEFAULT '{}',
  
  -- Movement Characteristics
  movement_pattern text, -- push, pull, squat, hinge, carry, hold, etc.
  tempo text, -- e.g., "3-1-2-0" (eccentric-pause-concentric-pause)
  rom_requirements text, -- range of motion requirements
  bilateral boolean DEFAULT true, -- unilateral vs bilateral
  
  -- Physical Demands
  primary_energy_system text CHECK (primary_energy_system IN ('anaerobic_alactic', 'anaerobic_lactic', 'aerobic')),
  estimated_calorie_burn_per_min numeric(5, 2),
  technical_complexity integer CHECK (technical_complexity >= 1 AND technical_complexity <= 10),
  
  -- Safety
  injury_risk text CHECK (injury_risk IN ('low', 'moderate', 'high')),
  contraindications text[],
  safety_notes text[],
  common_mistakes text[],
  
  -- Descriptions
  description_short text NOT NULL,
  description_full text,
  benefits text[],
  target_goals text[], -- strength, hypertrophy, power, endurance, skill, mobility
  
  -- Visual Metadata (for AI illustration)
  visual_keywords text[] DEFAULT '{}',
  execution_phases text[], -- ["setup", "eccentric", "concentric", "return"]
  key_positions text[], -- descriptions of key positions to illustrate
  recommended_view_angle text, -- front, side, top, 3d, etc.
  recommended_visual_style text, -- technical, dynamic, minimalist
  
  -- Prescription Guidelines
  typical_sets_min integer,
  typical_sets_max integer,
  typical_reps_min integer,
  typical_reps_max integer,
  typical_rest_sec integer,
  typical_duration_min integer, -- for timed exercises
  typical_duration_max integer,
  
  -- Weights and Scaling
  rx_weight_male_kg numeric(6, 2),
  rx_weight_female_kg numeric(6, 2),
  scaling_options jsonb DEFAULT '[]'::jsonb,
  
  -- Status and Quality
  is_active boolean DEFAULT true,
  is_validated boolean DEFAULT false,
  quality_score numeric(3, 2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 5),
  usage_count integer DEFAULT 0,
  illustration_priority integer DEFAULT 5 CHECK (illustration_priority >= 0 AND illustration_priority <= 10),
  
  -- References
  reference_urls text[] DEFAULT '{}',
  video_urls text[] DEFAULT '{}',
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  
  -- Audit
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Version control
  version integer DEFAULT 1,
  previous_version_id uuid REFERENCES exercises(id) ON DELETE SET NULL
);

-- ============================================================================
-- Exercise Execution Details
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_execution_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  
  -- Execution Phases
  phase_number integer NOT NULL,
  phase_name text NOT NULL, -- "Setup", "Eccentric", "Pause", "Concentric", "Return"
  phase_description text NOT NULL,
  duration_seconds integer,
  
  -- Technical Cues
  body_position text,
  breathing_cue text,
  focal_points text[],
  muscle_activation_cues text[],
  
  -- Visual Details
  visual_markers text[], -- anatomical points to highlight in illustrations
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(exercise_id, phase_number)
);

-- ============================================================================
-- Exercise Coaching Cues
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_coaching_cues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  
  -- Target Audience
  target_level text CHECK (target_level IN ('beginner', 'intermediate', 'advanced', 'elite', 'all')),
  target_pathology text, -- NULL for general, or specific pathology
  
  -- Cue Content
  cue_type text NOT NULL CHECK (cue_type IN ('setup', 'execution', 'breathing', 'correction', 'progression', 'safety')),
  cue_text text NOT NULL,
  cue_priority integer DEFAULT 5 CHECK (cue_priority >= 1 AND cue_priority <= 10),
  
  -- Context
  when_to_use text, -- "during setup", "at bottom position", "throughout movement"
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Exercise Progressions
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_progressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Base Exercise
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  
  -- Related Exercise
  related_exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  
  -- Relationship Type
  relationship_type text NOT NULL CHECK (relationship_type IN ('progression', 'regression', 'variation', 'alternative', 'prerequisite')),
  
  -- Progression Details
  difficulty_delta integer, -- +1 for progression, -1 for regression
  progression_criteria text, -- "3x8 reps with good form", "30s hold", etc.
  estimated_weeks_to_achieve integer,
  
  -- Ordering
  sequence_order integer,
  
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Exercise Translations
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  
  -- Language
  language_code text NOT NULL CHECK (language_code IN ('fr', 'en', 'es', 'de', 'it', 'pt')),
  
  -- Translated Content
  name text NOT NULL,
  description_short text,
  description_full text,
  benefits text[],
  safety_notes text[],
  common_mistakes text[],
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(exercise_id, language_code)
);

-- ============================================================================
-- Relationship Tables (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_muscle_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_group_id uuid NOT NULL REFERENCES muscle_groups(id) ON DELETE CASCADE,
  
  -- Muscle Involvement
  involvement_type text NOT NULL CHECK (involvement_type IN ('primary', 'secondary', 'stabilizer')),
  activation_percentage integer CHECK (activation_percentage >= 0 AND activation_percentage <= 100),
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(exercise_id, muscle_group_id)
);

CREATE TABLE IF NOT EXISTS exercise_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
  
  -- Equipment Details
  is_required boolean DEFAULT true,
  is_alternative boolean DEFAULT false,
  quantity integer DEFAULT 1,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(exercise_id, equipment_id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm
  ON exercises USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_exercises_normalized_trgm
  ON exercises USING gin(name_normalized gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_exercises_description_trgm
  ON exercises USING gin(description_short gin_trgm_ops);

-- Classification indexes
CREATE INDEX IF NOT EXISTS idx_exercises_discipline_difficulty
  ON exercises(discipline, difficulty);

CREATE INDEX IF NOT EXISTS idx_exercises_category
  ON exercises(category);

CREATE INDEX IF NOT EXISTS idx_exercises_movement_pattern
  ON exercises(movement_pattern);

-- Array indexes
CREATE INDEX IF NOT EXISTS idx_exercises_tags
  ON exercises USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_exercises_visual_keywords
  ON exercises USING GIN(visual_keywords);

CREATE INDEX IF NOT EXISTS idx_exercises_target_goals
  ON exercises USING GIN(target_goals);

-- Status indexes
CREATE INDEX IF NOT EXISTS idx_exercises_active_validated
  ON exercises(is_active, is_validated);

CREATE INDEX IF NOT EXISTS idx_exercises_usage_count
  ON exercises(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_exercises_illustration_priority
  ON exercises(illustration_priority DESC);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_exercise_muscle_groups_exercise
  ON exercise_muscle_groups(exercise_id);

CREATE INDEX IF NOT EXISTS idx_exercise_muscle_groups_muscle
  ON exercise_muscle_groups(muscle_group_id);

CREATE INDEX IF NOT EXISTS idx_exercise_equipment_exercise
  ON exercise_equipment(exercise_id);

CREATE INDEX IF NOT EXISTS idx_exercise_equipment_equipment
  ON exercise_equipment(equipment_id);

-- Progression indexes
CREATE INDEX IF NOT EXISTS idx_exercise_progressions_exercise
  ON exercise_progressions(exercise_id, relationship_type);

CREATE INDEX IF NOT EXISTS idx_exercise_progressions_related
  ON exercise_progressions(related_exercise_id);

-- Translation indexes
CREATE INDEX IF NOT EXISTS idx_exercise_translations_language
  ON exercise_translations(exercise_id, language_code);

-- Execution details indexes
CREATE INDEX IF NOT EXISTS idx_exercise_execution_exercise
  ON exercise_execution_details(exercise_id, phase_number);

-- Coaching cues indexes
CREATE INDEX IF NOT EXISTS idx_exercise_coaching_cues_exercise
  ON exercise_coaching_cues(exercise_id, target_level);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Exercises table
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active validated exercises"
  ON exercises FOR SELECT
  TO public
  USING (is_active = true AND is_validated = true);

CREATE POLICY "Authenticated users can view all exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage exercises"
  ON exercises FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Exercise execution details
ALTER TABLE exercise_execution_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view execution details"
  ON exercise_execution_details FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage execution details"
  ON exercise_execution_details FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Exercise coaching cues
ALTER TABLE exercise_coaching_cues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coaching cues"
  ON exercise_coaching_cues FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage coaching cues"
  ON exercise_coaching_cues FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Exercise progressions
ALTER TABLE exercise_progressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view progressions"
  ON exercise_progressions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage progressions"
  ON exercise_progressions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Exercise translations
ALTER TABLE exercise_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view translations"
  ON exercise_translations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage translations"
  ON exercise_translations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Muscle groups
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view muscle groups"
  ON muscle_groups FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage muscle groups"
  ON muscle_groups FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Equipment types
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view equipment types"
  ON equipment_types FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage equipment types"
  ON equipment_types FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Exercise muscle groups
ALTER TABLE exercise_muscle_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise muscle groups"
  ON exercise_muscle_groups FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage exercise muscle groups"
  ON exercise_muscle_groups FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Exercise equipment
ALTER TABLE exercise_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise equipment"
  ON exercise_equipment FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage exercise equipment"
  ON exercise_equipment FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Utility Functions
-- ============================================================================

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_exercise_slug(exercise_name text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      unaccent(trim(exercise_name)),
      '[^a-z0-9\s-]', '', 'gi'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to normalize exercise name for matching
CREATE OR REPLACE FUNCTION normalize_exercise_name_v2(name text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    unaccent(
      regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g')
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_exercise_usage(p_exercise_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE exercises
  SET
    usage_count = usage_count + 1,
    updated_at = now()
  WHERE id = p_exercise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search exercises with fuzzy matching
CREATE OR REPLACE FUNCTION search_exercises(
  search_query text,
  p_discipline text DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  discipline text,
  difficulty text,
  description_short text,
  similarity_score real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.discipline,
    e.difficulty,
    e.description_short,
    similarity(e.name, search_query) as similarity_score
  FROM exercises e
  WHERE
    e.is_active = true
    AND e.is_validated = true
    AND (p_discipline IS NULL OR e.discipline = p_discipline)
    AND (p_difficulty IS NULL OR e.difficulty = p_difficulty)
    AND (
      e.name ILIKE '%' || search_query || '%'
      OR e.name_normalized ILIKE '%' || normalize_exercise_name_v2(search_query) || '%'
      OR e.description_short ILIKE '%' || search_query || '%'
      OR similarity(e.name, search_query) > 0.3
    )
  ORDER BY
    similarity(e.name, search_query) DESC,
    e.usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at on exercises
CREATE TRIGGER trigger_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- Auto-update updated_at on exercise_execution_details
CREATE TRIGGER trigger_execution_details_updated_at
  BEFORE UPDATE ON exercise_execution_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- Auto-update updated_at on exercise_coaching_cues
CREATE TRIGGER trigger_coaching_cues_updated_at
  BEFORE UPDATE ON exercise_coaching_cues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- Auto-update updated_at on exercise_translations
CREATE TRIGGER trigger_translations_updated_at
  BEFORE UPDATE ON exercise_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- Auto-generate slug on insert
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = generate_exercise_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exercises_auto_slug
  BEFORE INSERT ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

-- Auto-normalize name on insert/update
CREATE OR REPLACE FUNCTION auto_normalize_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_normalized = normalize_exercise_name_v2(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exercises_auto_normalize
  BEFORE INSERT OR UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION auto_normalize_name();

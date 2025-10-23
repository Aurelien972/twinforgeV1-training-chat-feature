/*
  # Create Complete Illustration System

  1. New Tables
    - `illustration_library`
      - Unified storage for all illustrations (sessions + exercises)
      - Rich metadata for intelligent matching
      - Usage tracking and quality scoring
      - Support for multiple variations per exercise

    - `exercise_visual_metadata`
      - Enriched catalog for ALL exercises
      - Visual keywords and characteristics
      - Movement patterns and muscle groups
      - Enables intelligent matching even without existing illustration

    - `illustration_generation_queue`
      - Async generation queue with prioritization
      - Retry logic and error tracking
      - Status monitoring

  2. Modifications
    - Extend `training_session_illustrations` with source tracking

  3. Security
    - RLS enabled on all tables
    - Authenticated users can read all
    - Only system can write to library (via Edge Functions)

  4. Indexes
    - Optimized for fast lookup by exercise name, discipline, tags
    - Usage count for analytics
*/

-- ============================================================================
-- Table: illustration_library
-- Central repository for all illustrations (AI-generated and procedural)
-- ============================================================================

CREATE TABLE IF NOT EXISTS illustration_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  type text NOT NULL CHECK (type IN ('session', 'exercise')),
  discipline text NOT NULL CHECK (discipline IN ('force', 'endurance', 'functional', 'competitions', 'calisthenics')),

  -- Exercise identification (NULL for session illustrations)
  exercise_name text,
  exercise_name_normalized text, -- Lowercase, no accents, for matching

  -- Rich metadata for matching
  focus_tags text[] DEFAULT '{}',
  equipment_tags text[] DEFAULT '{}',
  muscle_groups text[] DEFAULT '{}',
  movement_pattern text, -- push, pull, squat, hinge, etc.
  intensity_level text CHECK (intensity_level IN ('beginner', 'intermediate', 'advanced', 'elite')),

  -- Visual characteristics
  visual_style text, -- technical, dynamic, minimalist, etc.
  view_angle text, -- front, side, top, 3d, etc.

  -- Storage
  image_url text NOT NULL,
  thumbnail_url text,
  image_size_bytes integer,
  image_width integer,
  image_height integer,
  image_format text, -- webp, png, jpg

  -- Generation metadata
  generation_source text CHECK (generation_source IN ('flux', 'dalle', 'stable-diffusion', 'procedural', 'manual')),
  generation_prompt text,
  generation_cost_usd numeric(10, 4),

  -- Quality and analytics
  quality_score numeric(3, 2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 5),
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,

  -- Additional metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_illustration_library_type_discipline
  ON illustration_library(type, discipline);

CREATE INDEX IF NOT EXISTS idx_illustration_library_exercise_name
  ON illustration_library(exercise_name_normalized);

CREATE INDEX IF NOT EXISTS idx_illustration_library_focus_tags
  ON illustration_library USING GIN(focus_tags);

CREATE INDEX IF NOT EXISTS idx_illustration_library_equipment_tags
  ON illustration_library USING GIN(equipment_tags);

CREATE INDEX IF NOT EXISTS idx_illustration_library_muscle_groups
  ON illustration_library USING GIN(muscle_groups);

CREATE INDEX IF NOT EXISTS idx_illustration_library_usage_count
  ON illustration_library(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_illustration_library_created_at
  ON illustration_library(created_at DESC);

-- RLS Policies
ALTER TABLE illustration_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view illustrations"
  ON illustration_library FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage illustrations"
  ON illustration_library FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Table: exercise_visual_metadata
-- Enriched catalog for all exercises with visual metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_visual_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Exercise identification
  exercise_name text NOT NULL,
  exercise_name_normalized text NOT NULL UNIQUE,
  discipline text NOT NULL CHECK (discipline IN ('force', 'endurance', 'functional', 'competitions', 'calisthenics')),

  -- Alternative names and synonyms
  aliases text[] DEFAULT '{}',

  -- Physical characteristics
  muscle_groups text[] NOT NULL DEFAULT '{}',
  equipment_required text[] NOT NULL DEFAULT '{}',
  movement_pattern text, -- push, pull, squat, hinge, carry, etc.
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'elite')),

  -- Visual description keywords
  visual_keywords text[] DEFAULT '{}',
  reference_urls text[] DEFAULT '{}',

  -- Illustration priority (0-10, 10 = highest)
  illustration_priority integer DEFAULT 5 CHECK (illustration_priority >= 0 AND illustration_priority <= 10),

  -- Generation hints
  recommended_angle text, -- front, side, 3d, etc.
  recommended_style text, -- technical, dynamic, minimalist

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exercise_visual_metadata_discipline
  ON exercise_visual_metadata(discipline);

CREATE INDEX IF NOT EXISTS idx_exercise_visual_metadata_muscle_groups
  ON exercise_visual_metadata USING GIN(muscle_groups);

CREATE INDEX IF NOT EXISTS idx_exercise_visual_metadata_equipment
  ON exercise_visual_metadata USING GIN(equipment_required);

CREATE INDEX IF NOT EXISTS idx_exercise_visual_metadata_priority
  ON exercise_visual_metadata(illustration_priority DESC);

-- RLS Policies
ALTER TABLE exercise_visual_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise metadata"
  ON exercise_visual_metadata FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage exercise metadata"
  ON exercise_visual_metadata FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Table: illustration_generation_queue
-- Async generation queue with prioritization
-- ============================================================================

CREATE TABLE IF NOT EXISTS illustration_generation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target
  type text NOT NULL CHECK (type IN ('session', 'exercise')),
  exercise_name text,
  discipline text NOT NULL,

  -- Request details
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  generation_params jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Priority (0-10, 10 = highest)
  priority integer DEFAULT 5 CHECK (priority >= 0 AND priority <= 10),

  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,

  -- Results
  result_illustration_id uuid REFERENCES illustration_library(id) ON DELETE SET NULL,
  error_message text,

  -- Processing metadata
  started_at timestamptz,
  completed_at timestamptz,
  processing_duration_ms integer,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_illustration_queue_status_priority
  ON illustration_generation_queue(status, priority DESC, created_at);

CREATE INDEX IF NOT EXISTS idx_illustration_queue_created_at
  ON illustration_generation_queue(created_at DESC);

-- RLS Policies
ALTER TABLE illustration_generation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own queue items"
  ON illustration_generation_queue FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Service role can manage queue"
  ON illustration_generation_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Extend training_session_illustrations with source tracking
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_session_illustrations'
    AND column_name = 'illustration_source'
  ) THEN
    ALTER TABLE training_session_illustrations
    ADD COLUMN illustration_source text CHECK (illustration_source IN ('procedural', 'ai_generated', 'library'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_session_illustrations'
    AND column_name = 'library_id'
  ) THEN
    ALTER TABLE training_session_illustrations
    ADD COLUMN library_id uuid REFERENCES illustration_library(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for tracking source
CREATE INDEX IF NOT EXISTS idx_training_session_illustrations_source
  ON training_session_illustrations(illustration_source);

-- ============================================================================
-- Utility Functions
-- ============================================================================

-- Function to normalize exercise names for matching
CREATE OR REPLACE FUNCTION normalize_exercise_name(name text)
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
CREATE OR REPLACE FUNCTION increment_illustration_usage(illustration_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE illustration_library
  SET
    usage_count = usage_count + 1,
    last_used_at = now(),
    updated_at = now()
  WHERE id = illustration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_illustration_library_updated_at
  BEFORE UPDATE ON illustration_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_visual_metadata_updated_at
  BEFORE UPDATE ON exercise_visual_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_illustration_queue_updated_at
  BEFORE UPDATE ON illustration_generation_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

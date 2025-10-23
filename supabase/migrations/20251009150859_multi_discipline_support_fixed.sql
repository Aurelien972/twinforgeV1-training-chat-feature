/*
  # Multi-Discipline Training Support

  1. New Tables
    - `training_insights` - AI-generated insights per discipline
    - `training_metrics` - Discipline-specific metrics
    - `training_personal_records` - Personal records tracking

  2. Schema Updates
    - Add discipline and coach_type to training_sessions

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users

  4. Indexes
    - Performance indexes for queries by discipline
    - Indexes for time-based queries
*/

-- ============================================================================
-- TRAINING INSIGHTS (AI-generated)
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL,
  discipline TEXT,
  content JSONB NOT NULL,
  recommendations TEXT[],
  priority TEXT DEFAULT 'medium',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_insights_user_expires
  ON training_insights(user_id, expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_insights_discipline
  ON training_insights(discipline)
  WHERE discipline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_insights_priority
  ON training_insights(user_id, priority, created_at DESC);

-- ============================================================================
-- TRAINING METRICS (Discipline-specific)
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  discipline TEXT NOT NULL,

  -- Force/Powerbuilding metrics
  volume_kg NUMERIC,
  max_weight NUMERIC,
  sets_total INTEGER,
  reps_total INTEGER,
  tonnage NUMERIC,

  -- Endurance metrics
  distance_km NUMERIC,
  pace_avg TEXT,
  pace_min TEXT,
  pace_max TEXT,
  tss NUMERIC,
  zones_distribution JSONB,
  heart_rate_avg INTEGER,
  heart_rate_max INTEGER,
  cadence_avg INTEGER,
  power_avg INTEGER,
  elevation_gain INTEGER,

  -- Universal metrics
  calories_estimated INTEGER,
  intensity_score NUMERIC,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_metrics_session
  ON training_metrics(session_id);

CREATE INDEX IF NOT EXISTS idx_training_metrics_discipline
  ON training_metrics(discipline);

CREATE INDEX IF NOT EXISTS idx_training_metrics_created
  ON training_metrics(created_at DESC);

-- ============================================================================
-- PERSONAL RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  discipline TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  record_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  session_id UUID REFERENCES training_sessions(id),
  previous_record NUMERIC,
  improvement NUMERIC,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_exercise_record UNIQUE(user_id, discipline, exercise_name, record_type)
);

CREATE INDEX IF NOT EXISTS idx_pr_user_discipline
  ON training_personal_records(user_id, discipline);

CREATE INDEX IF NOT EXISTS idx_pr_achieved_at
  ON training_personal_records(achieved_at DESC);

CREATE INDEX IF NOT EXISTS idx_pr_discipline_exercise
  ON training_personal_records(discipline, exercise_name);

-- ============================================================================
-- ADD FIELDS TO EXISTING TABLES
-- ============================================================================

-- Add discipline fields to training_sessions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'discipline'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN discipline TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'coach_type'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN coach_type TEXT;
  END IF;
END $$;

-- Create indexes on new columns
CREATE INDEX IF NOT EXISTS idx_sessions_user_discipline
  ON training_sessions(user_id, discipline)
  WHERE discipline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_coach_type
  ON training_sessions(coach_type)
  WHERE coach_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_discipline_status
  ON training_sessions(discipline, status, completed_at DESC)
  WHERE discipline IS NOT NULL;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Training insights policies
ALTER TABLE training_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON training_insights
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON training_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON training_insights
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON training_insights
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Training metrics policies
ALTER TABLE training_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics"
  ON training_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_metrics.session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own metrics"
  ON training_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_metrics.session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

-- Personal records policies
ALTER TABLE training_personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON training_personal_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
  ON training_personal_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
  ON training_personal_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
  ON training_personal_records
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check and update personal records
CREATE OR REPLACE FUNCTION check_personal_record()
RETURNS TRIGGER AS $$
DECLARE
  existing_record NUMERIC;
  discipline_val TEXT;
BEGIN
  -- Extract discipline from session
  SELECT discipline INTO discipline_val
  FROM training_sessions
  WHERE id = NEW.session_id;

  -- This function will be called by application logic
  -- Placeholder for future automatic PR detection

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired insights
CREATE OR REPLACE FUNCTION cleanup_expired_insights()
RETURNS void AS $$
BEGIN
  DELETE FROM training_insights
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE training_insights IS 'AI-generated insights and recommendations per discipline';
COMMENT ON TABLE training_metrics IS 'Discipline-specific metrics extracted from sessions';
COMMENT ON TABLE training_personal_records IS 'Personal records tracking across all disciplines';

COMMENT ON COLUMN training_insights.insight_type IS 'Type: weekly, monthly, progression, deload, plateau';
COMMENT ON COLUMN training_insights.priority IS 'Priority: low, medium, high';
COMMENT ON COLUMN training_metrics.discipline IS 'Sport discipline: strength, running, cycling, etc.';
COMMENT ON COLUMN training_personal_records.record_type IS 'Type: max_weight, best_time, longest_distance, max_reps';
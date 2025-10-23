/*
  # Endurance Tracking System - Complete Schema

  **Version:** 1.0.0
  **Purpose:** Enable live tracking and analysis for endurance training sessions

  ## 1. Extended Training Sessions

  Adds endurance-specific columns to existing training_sessions table:
  - `discipline` (TEXT): running, cycling, swimming, triathlon, cardio
  - `total_distance` (FLOAT): Distance covered in km
  - `avg_heart_rate` (INTEGER): Average heart rate in bpm
  - `estimated_tss` (INTEGER): Training Stress Score
  - `zones_distribution` (JSONB): Time spent in each zone {z1: 600, z2: 1800, ...}
  - `blocks_completed` (INTEGER): Number of workout blocks completed
  - `intervals_completed` (INTEGER): Number of intervals completed

  ## 2. New Tables

  ### training_session_endurance_blocks
  Stores each workout block (warmup, main blocks, cooldown):
  - Block type (continuous, intervals, tempo)
  - Target vs actual duration
  - Target zone and average heart rate
  - RPE feedback per block
  - Completion status

  ### training_session_intervals
  Stores individual intervals within interval blocks:
  - Work/rest phases
  - Duration and zone targets
  - Completion tracking
  - Timestamps for analysis

  ## 3. Security

  - All tables have RLS enabled
  - Users can only access their own data
  - Policies enforce auth.uid() checks

  ## 4. Indexes

  - Optimized for session lookups
  - Fast queries on user_id and timestamps
  - Efficient block and interval retrieval
*/

-- ============================================================================
-- 1. EXTEND TRAINING SESSIONS TABLE
-- ============================================================================

-- Add endurance-specific columns to existing training_sessions table
DO $$
BEGIN
  -- Check and add discipline column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'discipline'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN discipline TEXT;
  END IF;

  -- Check and add total_distance column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'total_distance'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN total_distance FLOAT;
  END IF;

  -- Check and add avg_heart_rate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'avg_heart_rate'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN avg_heart_rate INTEGER;
  END IF;

  -- Check and add estimated_tss column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'estimated_tss'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN estimated_tss INTEGER;
  END IF;

  -- Check and add zones_distribution column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'zones_distribution'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN zones_distribution JSONB;
  END IF;

  -- Check and add blocks_completed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'blocks_completed'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN blocks_completed INTEGER DEFAULT 0;
  END IF;

  -- Check and add intervals_completed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'intervals_completed'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN intervals_completed INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE ENDURANCE BLOCKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS training_session_endurance_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  block_index INTEGER NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('warmup', 'continuous', 'intervals', 'tempo', 'cooldown')),
  block_name TEXT NOT NULL,
  duration_target INTEGER NOT NULL, -- seconds
  duration_actual INTEGER,
  zone_target TEXT, -- 'Z2', 'Z3-Z4', 'Z5', etc.
  avg_heart_rate INTEGER,
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure block_index is unique per session
  UNIQUE(session_id, block_index)
);

-- Enable RLS
ALTER TABLE training_session_endurance_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own endurance blocks"
  ON training_session_endurance_blocks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_endurance_blocks.session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own endurance blocks"
  ON training_session_endurance_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_endurance_blocks.session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own endurance blocks"
  ON training_session_endurance_blocks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_endurance_blocks.session_id
      AND training_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_endurance_blocks.session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own endurance blocks"
  ON training_session_endurance_blocks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_endurance_blocks.session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_endurance_blocks_session_id
  ON training_session_endurance_blocks(session_id);

CREATE INDEX IF NOT EXISTS idx_endurance_blocks_block_index
  ON training_session_endurance_blocks(block_index);

-- ============================================================================
-- 3. CREATE INTERVALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS training_session_intervals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES training_session_endurance_blocks(id) ON DELETE CASCADE,
  interval_index INTEGER NOT NULL,
  phase_type TEXT NOT NULL CHECK (phase_type IN ('work', 'rest')),
  duration_target INTEGER NOT NULL, -- seconds
  duration_actual INTEGER,
  zone_target TEXT,
  avg_heart_rate INTEGER,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure interval_index is unique per block
  UNIQUE(block_id, interval_index)
);

-- Enable RLS
ALTER TABLE training_session_intervals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own intervals"
  ON training_session_intervals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_session_endurance_blocks eb
      JOIN training_sessions s ON s.id = eb.session_id
      WHERE eb.id = training_session_intervals.block_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own intervals"
  ON training_session_intervals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_session_endurance_blocks eb
      JOIN training_sessions s ON s.id = eb.session_id
      WHERE eb.id = training_session_intervals.block_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own intervals"
  ON training_session_intervals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_session_endurance_blocks eb
      JOIN training_sessions s ON s.id = eb.session_id
      WHERE eb.id = training_session_intervals.block_id
      AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_session_endurance_blocks eb
      JOIN training_sessions s ON s.id = eb.session_id
      WHERE eb.id = training_session_intervals.block_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own intervals"
  ON training_session_intervals
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_session_endurance_blocks eb
      JOIN training_sessions s ON s.id = eb.session_id
      WHERE eb.id = training_session_intervals.block_id
      AND s.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intervals_block_id
  ON training_session_intervals(block_id);

CREATE INDEX IF NOT EXISTS idx_intervals_interval_index
  ON training_session_intervals(interval_index);

-- ============================================================================
-- 4. CREATE HELPER VIEWS
-- ============================================================================

-- View for quick session statistics
CREATE OR REPLACE VIEW training_endurance_session_stats AS
SELECT
  s.id AS session_id,
  s.user_id,
  s.discipline,
  s.duration_minutes,
  s.total_distance,
  s.avg_heart_rate,
  s.estimated_tss,
  s.zones_distribution,
  COUNT(DISTINCT eb.id) AS total_blocks,
  COUNT(DISTINCT CASE WHEN eb.completed = true THEN eb.id END) AS blocks_completed,
  COUNT(DISTINCT i.id) AS total_intervals,
  COUNT(DISTINCT CASE WHEN i.completed = true THEN i.id END) AS intervals_completed
FROM training_sessions s
LEFT JOIN training_session_endurance_blocks eb ON eb.session_id = s.id
LEFT JOIN training_session_intervals i ON i.block_id = eb.id
WHERE s.coach_type = 'endurance'
GROUP BY s.id, s.user_id, s.discipline, s.duration_minutes, s.total_distance,
         s.avg_heart_rate, s.estimated_tss, s.zones_distribution;

-- ============================================================================
-- 5. SAMPLE DATA VALIDATION
-- ============================================================================

-- Add comments for documentation
COMMENT ON TABLE training_session_endurance_blocks IS 'Stores workout blocks (warmup, continuous, intervals, tempo, cooldown) for endurance sessions';
COMMENT ON TABLE training_session_intervals IS 'Stores individual work/rest intervals within interval blocks';
COMMENT ON COLUMN training_session_endurance_blocks.block_type IS 'Type of block: warmup, continuous, intervals, tempo, or cooldown';
COMMENT ON COLUMN training_session_endurance_blocks.zone_target IS 'Target heart rate zone (e.g., Z2, Z3-Z4, Z5)';
COMMENT ON COLUMN training_session_intervals.phase_type IS 'Interval phase: work or rest';

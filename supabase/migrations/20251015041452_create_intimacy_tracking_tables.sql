/*
  # Create Intimacy Tracking Tables

  ## New Tables

  ### `menstrual_cycles_history`
  Historical tracking of menstrual cycles for female users
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles)
  - `start_date` (date) - Start date of the menstrual cycle
  - `end_date` (date) - End date of the menstrual cycle
  - `cycle_length_days` (integer) - Number of days in cycle
  - `symptoms` (jsonb) - Symptoms experienced during cycle
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - When record was created

  ### `intimacy_tracking`
  Longitudinal tracking of intimacy and reproductive health data
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles)
  - `recorded_date` (date) - Date of the recorded data
  - `data` (jsonb) - Flexible storage for various intimacy metrics
  - `created_at` (timestamptz) - When record was created

  ## Security
  - Enable RLS on both tables
  - Users can only access their own data
  - Strict privacy policies for sensitive health data

  ## Notes
  - These tables enable detailed temporal tracking
  - Support for advanced analytics and trend analysis
  - Data is highly sensitive and protected by RLS
*/

-- =====================================================
-- 1. CREATE MENSTRUAL CYCLES HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS menstrual_cycles_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  cycle_length_days integer,
  symptoms jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_cycle_dates CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT valid_cycle_length CHECK (cycle_length_days IS NULL OR (cycle_length_days >= 20 AND cycle_length_days <= 45))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_menstrual_cycles_user_id
  ON menstrual_cycles_history(user_id);

CREATE INDEX IF NOT EXISTS idx_menstrual_cycles_start_date
  ON menstrual_cycles_history(start_date DESC);

CREATE INDEX IF NOT EXISTS idx_menstrual_cycles_user_date
  ON menstrual_cycles_history(user_id, start_date DESC);

-- Enable RLS
ALTER TABLE menstrual_cycles_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own menstrual cycles history"
  ON menstrual_cycles_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own menstrual cycles history"
  ON menstrual_cycles_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menstrual cycles history"
  ON menstrual_cycles_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own menstrual cycles history"
  ON menstrual_cycles_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. CREATE INTIMACY TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS intimacy_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recorded_date date NOT NULL DEFAULT CURRENT_DATE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),

  -- Ensure one record per user per date
  CONSTRAINT unique_user_date UNIQUE (user_id, recorded_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intimacy_tracking_user_id
  ON intimacy_tracking(user_id);

CREATE INDEX IF NOT EXISTS idx_intimacy_tracking_recorded_date
  ON intimacy_tracking(recorded_date DESC);

CREATE INDEX IF NOT EXISTS idx_intimacy_tracking_user_date
  ON intimacy_tracking(user_id, recorded_date DESC);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_intimacy_tracking_data
  ON intimacy_tracking USING gin(data);

-- Enable RLS
ALTER TABLE intimacy_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own intimacy tracking"
  ON intimacy_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intimacy tracking"
  ON intimacy_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intimacy tracking"
  ON intimacy_tracking
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own intimacy tracking"
  ON intimacy_tracking
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON TABLE menstrual_cycles_history IS 'Historical tracking of menstrual cycles for detailed temporal analysis';
COMMENT ON TABLE intimacy_tracking IS 'Longitudinal tracking of intimacy and reproductive health metrics';

COMMENT ON COLUMN menstrual_cycles_history.symptoms IS 'Array of symptoms (e.g., ["cramps", "heavy_flow", "mood_changes"])';
COMMENT ON COLUMN intimacy_tracking.data IS 'Flexible JSONB storage for various intimacy metrics over time';

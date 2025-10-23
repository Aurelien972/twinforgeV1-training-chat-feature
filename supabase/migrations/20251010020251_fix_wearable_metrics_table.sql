/*
  # Fix Wearable Metrics Table

  1. Problem
    - training_session_wearable_metrics table does not exist in database
    - App expects this table for wearable device integration
    - 404 errors when querying this table

  2. Solution
    - Create training_session_wearable_metrics table if not exists
    - Set up proper RLS policies for authenticated users
    - Add indexes for performance
    - Link to existing training_sessions table

  3. Table Structure
    - session_id (uuid, primary key, foreign key to training_sessions)
    - user_id (uuid, foreign key to auth.users)
    - hr_data (jsonb): Heart rate timeline
    - avg_hr, max_hr, min_hr (integer): HR statistics
    - zones_distribution (jsonb): Time spent in each zone
    - calories_burned, effort_score (integer): Computed metrics
    - data_quality (text): Quality indicator
    - device_name, device_id (text): Device info
    - session_start_time, session_end_time (timestamptz): Timestamps
    - duration_seconds (integer): Session duration
    - created_at (timestamptz): Record creation time

  4. Security
    - RLS enabled
    - Users can only access their own wearable metrics
    - Policies for SELECT, INSERT, UPDATE, DELETE
*/

-- Create training_session_wearable_metrics table
CREATE TABLE IF NOT EXISTS training_session_wearable_metrics (
  session_id uuid PRIMARY KEY REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hr_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  avg_hr integer,
  max_hr integer,
  min_hr integer,
  zones_distribution jsonb DEFAULT '{
    "zone1": 0,
    "zone2": 0,
    "zone3": 0,
    "zone4": 0,
    "zone5": 0
  }'::jsonb,
  calories_burned integer DEFAULT 0,
  effort_score integer DEFAULT 0,
  data_quality text CHECK (data_quality IN ('excellent', 'good', 'fair', 'poor')),
  device_name text,
  device_id text,
  session_start_time timestamptz,
  session_end_time timestamptz,
  duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wearable_metrics_user_id
  ON training_session_wearable_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_wearable_metrics_created_at
  ON training_session_wearable_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wearable_metrics_device_name
  ON training_session_wearable_metrics(device_name);

-- Enable RLS
ALTER TABLE training_session_wearable_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own wearable metrics" ON training_session_wearable_metrics;
DROP POLICY IF EXISTS "Users can insert their own wearable metrics" ON training_session_wearable_metrics;
DROP POLICY IF EXISTS "Users can update their own wearable metrics" ON training_session_wearable_metrics;
DROP POLICY IF EXISTS "Users can delete their own wearable metrics" ON training_session_wearable_metrics;

-- RLS Policies for training_session_wearable_metrics
CREATE POLICY "Users can view their own wearable metrics"
  ON training_session_wearable_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wearable metrics"
  ON training_session_wearable_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wearable metrics"
  ON training_session_wearable_metrics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wearable metrics"
  ON training_session_wearable_metrics
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add wearable columns to training_sessions table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'wearable_device_used'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN wearable_device_used text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'hr_tracking_enabled'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN hr_tracking_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'wearable_data_quality'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN wearable_data_quality text;
  END IF;
END $$;

-- Create index on hr_tracking_enabled for filtering
CREATE INDEX IF NOT EXISTS idx_training_sessions_hr_tracking
  ON training_sessions(hr_tracking_enabled) WHERE hr_tracking_enabled = true;

-- Create comments for documentation
COMMENT ON TABLE training_session_wearable_metrics IS 'Stores detailed wearable device metrics (heart rate, zones, calories) for training sessions';
COMMENT ON COLUMN training_session_wearable_metrics.hr_data IS 'Array of heart rate data points with timestamps: [{"timestamp": "ISO8601", "bpm": 150, "zone": 3}]';
COMMENT ON COLUMN training_session_wearable_metrics.zones_distribution IS 'Time in seconds spent in each HR zone: {"zone1": 300, "zone2": 600, ...}';
COMMENT ON COLUMN training_session_wearable_metrics.effort_score IS 'Calculated effort score from 0-100 based on HR data and zones';

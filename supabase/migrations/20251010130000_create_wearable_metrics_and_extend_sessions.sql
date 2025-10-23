/*
  # Wearable Integration - Session Metrics & Extensions

  1. New Table: training_session_wearable_metrics
    - Stores detailed heart rate data and metrics from wearable devices
    - One-to-one relationship with training_sessions
    - Columns:
      - session_id (uuid, primary key, foreign key)
      - user_id (uuid, foreign key)
      - hr_data (jsonb): Complete heart rate timeline with timestamps
      - avg_hr (int): Average heart rate during session
      - max_hr (int): Maximum heart rate reached
      - min_hr (int): Minimum heart rate recorded
      - zones_distribution (jsonb): Time spent in each HR zone
      - calories_burned (int): Estimated calories from wearable
      - effort_score (int): 0-100 calculated effort score
      - data_quality (text): excellent/good/fair/poor
      - device_name (text): Name of wearable device
      - device_id (text): Device identifier
      - session_start_time (timestamptz): Session start timestamp
      - session_end_time (timestamptz): Session end timestamp
      - duration_seconds (int): Session duration in seconds
      - created_at (timestamptz): Record creation timestamp

  2. Extensions to training_sessions table
    - Add wearable_device_used (text): Device name if wearable was used
    - Add hr_tracking_enabled (boolean): Whether HR tracking was active
    - Add wearable_data_quality (text): Quality indicator of wearable data

  3. Security
    - Enable RLS on training_session_wearable_metrics
    - Policies for authenticated users to manage their own wearable data

  4. Indexes
    - Index on session_id for fast lookups
    - Index on user_id for user-specific queries
    - Index on created_at for chronological queries
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

-- Add wearable columns to training_sessions table (if not exists)
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

-- Create comment for documentation
COMMENT ON TABLE training_session_wearable_metrics IS 'Stores detailed wearable device metrics (heart rate, zones, calories) for training sessions';
COMMENT ON COLUMN training_session_wearable_metrics.hr_data IS 'Array of heart rate data points with timestamps: [{"timestamp": "ISO8601", "bpm": 150, "zone": 3}]';
COMMENT ON COLUMN training_session_wearable_metrics.zones_distribution IS 'Time in seconds spent in each HR zone: {"zone1": 300, "zone2": 600, ...}';
COMMENT ON COLUMN training_session_wearable_metrics.effort_score IS 'Calculated effort score from 0-100 based on HR data and zones';

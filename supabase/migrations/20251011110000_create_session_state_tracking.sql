/*
  # Create Session State Tracking System

  1. New Tables
    - `training_session_states`
      - `session_id` (uuid, primary key) - Unique session identifier
      - `user_id` (uuid, foreign key) - User who owns this session
      - `generation_triggered` (boolean) - Whether generation was triggered
      - `generation_triggered_at` (timestamptz) - When generation was first triggered
      - `generation_completed_at` (timestamptz) - When generation completed successfully
      - `prescription_exists` (boolean) - Whether a prescription was generated
      - `current_step` (text) - Current pipeline step (preparer, activer, seance, adapter, avancer)
      - `last_activity_at` (timestamptz) - Last user interaction with this session
      - `created_at` (timestamptz) - Session creation time
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `training_session_states` table
    - Add policies for authenticated users to manage their own session states

  3. Indexes
    - Index on (user_id, session_id) for fast lookups
    - Index on (session_id, generation_triggered) for generation checks
    - Index on (user_id, last_activity_at) for cleanup queries

  4. Functions
    - Auto-update updated_at timestamp on row changes
*/

-- Create training_session_states table
CREATE TABLE IF NOT EXISTS training_session_states (
  session_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_triggered boolean DEFAULT false NOT NULL,
  generation_triggered_at timestamptz,
  generation_completed_at timestamptz,
  prescription_exists boolean DEFAULT false NOT NULL,
  current_step text NOT NULL DEFAULT 'preparer',
  last_activity_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT valid_step CHECK (current_step IN ('preparer', 'activer', 'seance', 'adapter', 'avancer')),
  CONSTRAINT generation_logic CHECK (
    (generation_triggered = false AND generation_triggered_at IS NULL) OR
    (generation_triggered = true AND generation_triggered_at IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE training_session_states ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_states_user_session
  ON training_session_states(user_id, session_id);

CREATE INDEX IF NOT EXISTS idx_session_states_generation_check
  ON training_session_states(session_id, generation_triggered)
  WHERE generation_triggered = true;

CREATE INDEX IF NOT EXISTS idx_session_states_user_activity
  ON training_session_states(user_id, last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_states_prescription
  ON training_session_states(user_id, prescription_exists)
  WHERE prescription_exists = true;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_training_session_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_training_session_states_updated_at_trigger
  ON training_session_states;

CREATE TRIGGER update_training_session_states_updated_at_trigger
  BEFORE UPDATE ON training_session_states
  FOR EACH ROW
  EXECUTE FUNCTION update_training_session_states_updated_at();

-- RLS Policies

-- Users can view their own session states
CREATE POLICY "Users can view own session states"
  ON training_session_states
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own session states
CREATE POLICY "Users can create own session states"
  ON training_session_states
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own session states
CREATE POLICY "Users can update own session states"
  ON training_session_states
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own session states
CREATE POLICY "Users can delete own session states"
  ON training_session_states
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper function to check if generation can be triggered
CREATE OR REPLACE FUNCTION can_trigger_generation(p_session_id uuid)
RETURNS boolean AS $$
DECLARE
  v_state RECORD;
  v_elapsed_seconds integer;
BEGIN
  -- Get session state
  SELECT * INTO v_state
  FROM training_session_states
  WHERE session_id = p_session_id;

  -- If no state exists, generation can be triggered
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- If prescription already exists, cannot regenerate
  IF v_state.prescription_exists THEN
    RETURN false;
  END IF;

  -- If never triggered, can trigger
  IF NOT v_state.generation_triggered THEN
    RETURN true;
  END IF;

  -- If triggered, check cooldown (5 seconds)
  v_elapsed_seconds := EXTRACT(EPOCH FROM (now() - v_state.generation_triggered_at));

  IF v_elapsed_seconds > 5 THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to mark generation as triggered
CREATE OR REPLACE FUNCTION mark_generation_triggered(
  p_session_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  INSERT INTO training_session_states (
    session_id,
    user_id,
    generation_triggered,
    generation_triggered_at,
    current_step,
    last_activity_at
  ) VALUES (
    p_session_id,
    p_user_id,
    true,
    now(),
    'activer',
    now()
  )
  ON CONFLICT (session_id) DO UPDATE
  SET
    generation_triggered = true,
    generation_triggered_at = now(),
    current_step = 'activer',
    last_activity_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to mark generation as completed
CREATE OR REPLACE FUNCTION mark_generation_completed(
  p_session_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE training_session_states
  SET
    generation_completed_at = now(),
    prescription_exists = true,
    last_activity_at = now(),
    updated_at = now()
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to update session step
CREATE OR REPLACE FUNCTION update_session_step(
  p_session_id uuid,
  p_step text
)
RETURNS void AS $$
BEGIN
  UPDATE training_session_states
  SET
    current_step = p_step,
    last_activity_at = now(),
    updated_at = now()
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old session states (older than 7 days with no activity)
CREATE OR REPLACE FUNCTION cleanup_old_session_states()
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM training_session_states
  WHERE last_activity_at < now() - interval '7 days'
  RETURNING 1 INTO v_deleted_count;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table and columns
COMMENT ON TABLE training_session_states IS 'Tracks the state of training generation sessions to prevent duplicate generations';
COMMENT ON COLUMN training_session_states.session_id IS 'Unique identifier for the training session (matches training_sessions.id or temporary session ID)';
COMMENT ON COLUMN training_session_states.generation_triggered IS 'Whether AI generation was triggered for this session';
COMMENT ON COLUMN training_session_states.generation_triggered_at IS 'Timestamp when generation was first triggered (for cooldown checks)';
COMMENT ON COLUMN training_session_states.generation_completed_at IS 'Timestamp when generation completed successfully';
COMMENT ON COLUMN training_session_states.prescription_exists IS 'Whether a valid prescription exists for this session (prevents regeneration)';
COMMENT ON COLUMN training_session_states.current_step IS 'Current step in the training pipeline';
COMMENT ON COLUMN training_session_states.last_activity_at IS 'Last user interaction with this session (for cleanup)';

/*
  # Create Progressive Enrichment System for Multi-Coach Training

  1. New Tables
    - `training_enrichment_queue`: Queue system for background enrichment
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (uuid, references training_sessions)
      - `coach_type` (text) - force|endurance|functional|calisthenics|competitions
      - `status` (text) - pending|processing|completed|failed
      - `priority` (integer) - 1 (highest) to 10 (lowest), default 5
      - `attempts` (integer) - number of attempts made
      - `max_attempts` (integer) - maximum attempts allowed (default 3)
      - `error_message` (text) - error details if failed
      - `created_at` (timestamptz)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Updates to Existing Tables
    - Add `enrichment_status` column to `training_sessions`
      - Values: 'fast' (fast generation, pending enrichment), 'enriching' (enrichment in progress), 'enriched' (enrichment completed), 'full' (full generation, no enrichment needed)

  3. Security
    - Enable RLS on `training_enrichment_queue`
    - Add policies for authenticated users to view their own queue items

  4. Performance
    - Add index on status and priority for efficient queue processing
    - Add index on session_id for quick lookups
*/

-- Create enrichment queue table
CREATE TABLE IF NOT EXISTS training_enrichment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  coach_type TEXT NOT NULL CHECK (coach_type IN ('force', 'endurance', 'functional', 'calisthenics', 'competitions')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(session_id) -- One enrichment per session
);

-- Add enrichment_status to training_sessions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'enrichment_status'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN enrichment_status TEXT CHECK (enrichment_status IN ('fast', 'enriching', 'enriched', 'full')) DEFAULT 'full';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status_priority
  ON training_enrichment_queue(status, priority DESC, created_at)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_enrichment_queue_session
  ON training_enrichment_queue(session_id);

CREATE INDEX IF NOT EXISTS idx_enrichment_queue_user_status
  ON training_enrichment_queue(user_id, status);

CREATE INDEX IF NOT EXISTS idx_training_sessions_enrichment_status
  ON training_sessions(enrichment_status)
  WHERE enrichment_status IN ('fast', 'enriching');

-- Enable RLS
ALTER TABLE training_enrichment_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own enrichment queue"
  ON training_enrichment_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrichment queue items"
  ON training_enrichment_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all enrichment queue items
CREATE POLICY "Service role can manage all enrichment queue"
  ON training_enrichment_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to automatically create enrichment queue item when session is created with 'fast' status
CREATE OR REPLACE FUNCTION create_enrichment_queue_item()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create queue item if enrichment_status is 'fast'
  IF NEW.enrichment_status = 'fast' THEN
    INSERT INTO training_enrichment_queue (
      user_id,
      session_id,
      coach_type,
      status,
      priority
    ) VALUES (
      NEW.user_id,
      NEW.id,
      CASE
        WHEN NEW.category = 'force-musculation' THEN 'force'
        WHEN NEW.category = 'endurance' THEN 'endurance'
        WHEN NEW.category = 'functional-crosstraining' THEN 'functional'
        WHEN NEW.category = 'calisthenics-street' THEN 'calisthenics'
        WHEN NEW.category = 'fitness-competitions' THEN 'competitions'
        ELSE 'force' -- default fallback
      END,
      'pending',
      5 -- default priority
    );

    -- Update session status to 'enriching'
    NEW.enrichment_status := 'enriching';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_create_enrichment_queue_item ON training_sessions;
CREATE TRIGGER trigger_create_enrichment_queue_item
  BEFORE INSERT ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_enrichment_queue_item();

-- Function to mark enrichment as completed
CREATE OR REPLACE FUNCTION mark_enrichment_completed(
  p_session_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update session enrichment status
  UPDATE training_sessions
  SET enrichment_status = 'enriched',
      updated_at = now()
  WHERE id = p_session_id;

  -- Update queue item status
  UPDATE training_enrichment_queue
  SET status = 'completed',
      completed_at = now()
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark enrichment as failed
CREATE OR REPLACE FUNCTION mark_enrichment_failed(
  p_session_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
DECLARE
  v_attempts INTEGER;
  v_max_attempts INTEGER;
BEGIN
  -- Get current attempts
  SELECT attempts, max_attempts
  INTO v_attempts, v_max_attempts
  FROM training_enrichment_queue
  WHERE session_id = p_session_id;

  -- Increment attempts
  v_attempts := v_attempts + 1;

  -- Update queue item
  UPDATE training_enrichment_queue
  SET attempts = v_attempts,
      error_message = p_error_message,
      status = CASE
        WHEN v_attempts >= v_max_attempts THEN 'failed'
        ELSE 'pending' -- Retry
      END
  WHERE session_id = p_session_id;

  -- If max attempts reached, keep session in fast mode (don't break the app)
  IF v_attempts >= v_max_attempts THEN
    UPDATE training_sessions
    SET enrichment_status = 'fast' -- Keep fast version, stop trying to enrich
    WHERE id = p_session_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_enrichment_completed(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_enrichment_failed(UUID, TEXT) TO authenticated, service_role;

COMMENT ON TABLE training_enrichment_queue IS 'Queue system for background enrichment of training sessions';
COMMENT ON COLUMN training_enrichment_queue.priority IS 'Priority 1-10, where 1 is highest priority';
COMMENT ON COLUMN training_enrichment_queue.attempts IS 'Number of enrichment attempts made';
COMMENT ON COLUMN training_sessions.enrichment_status IS 'Status of enrichment: fast (pending), enriching (in progress), enriched (completed), full (no enrichment needed)';

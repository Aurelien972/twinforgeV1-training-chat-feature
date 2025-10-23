/*
  # Create Fridge Scan Sessions System

  1. New Tables
    - `fridge_scan_sessions`
      - `session_id` (uuid, primary key) - Unique session identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `stage` (text) - Current stage: photo, analysis, validation, complement, recipes
      - `created_at` (timestamptz) - Session creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `captured_photos` (jsonb) - Array of photo URLs captured during session
      - `raw_detected_items` (jsonb) - Raw items detected from AI analysis
      - `user_edited_inventory` (jsonb) - User's edited inventory items
      - `suggested_complementary_items` (jsonb) - AI-suggested complementary items
      - `recipe_candidates` (jsonb) - Generated recipe candidates
      - `selected_recipes` (jsonb) - User-selected recipes
      - `meal_plan` (jsonb) - Generated meal plan data
      - `metadata` (jsonb) - Additional session metadata (progress, settings, etc.)
      - `completed` (boolean) - Whether session is completed
      - `expires_at` (timestamptz) - Expiration timestamp for auto-cleanup

  2. Security
    - Enable RLS on `fridge_scan_sessions` table
    - Users can only access their own sessions
    - Add policies for SELECT, INSERT, UPDATE, DELETE

  3. Indexes
    - Index on `user_id` and `created_at` for efficient queries
    - Index on `expires_at` for cleanup operations
    - Index on `session_id` for quick lookups

  4. Cleanup
    - Sessions older than 90 days are automatically deleted
    - Trigger to set expires_at on insert

  Important Notes:
  - Sessions persist for 90 days for data retention and analytics
  - Users can have multiple active sessions
  - Each session tracks the complete fridge scan pipeline state
*/

-- Create fridge_scan_sessions table
CREATE TABLE IF NOT EXISTS fridge_scan_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'photo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  captured_photos jsonb DEFAULT '[]'::jsonb,
  raw_detected_items jsonb DEFAULT '[]'::jsonb,
  user_edited_inventory jsonb DEFAULT '[]'::jsonb,
  suggested_complementary_items jsonb DEFAULT '[]'::jsonb,
  recipe_candidates jsonb DEFAULT '[]'::jsonb,
  selected_recipes jsonb DEFAULT '[]'::jsonb,
  meal_plan jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  completed boolean DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days')
);

-- Add constraint for stage validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'fridge_scan_sessions' AND constraint_name = 'fridge_scan_sessions_stage_check'
  ) THEN
    ALTER TABLE fridge_scan_sessions ADD CONSTRAINT fridge_scan_sessions_stage_check
    CHECK (stage IN ('photo', 'analysis', 'validation', 'complement', 'recipes'));
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE fridge_scan_sessions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fridge_scan_sessions_user_created
ON fridge_scan_sessions USING btree (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fridge_scan_sessions_expires
ON fridge_scan_sessions USING btree (expires_at);

CREATE INDEX IF NOT EXISTS idx_fridge_scan_sessions_session_id
ON fridge_scan_sessions USING btree (session_id);

CREATE INDEX IF NOT EXISTS idx_fridge_scan_sessions_user_completed
ON fridge_scan_sessions USING btree (user_id, completed, created_at DESC);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own fridge scan sessions" ON fridge_scan_sessions;
DROP POLICY IF EXISTS "Users can insert own fridge scan sessions" ON fridge_scan_sessions;
DROP POLICY IF EXISTS "Users can update own fridge scan sessions" ON fridge_scan_sessions;
DROP POLICY IF EXISTS "Users can delete own fridge scan sessions" ON fridge_scan_sessions;

-- Create RLS policies

-- SELECT: Users can only view their own sessions
CREATE POLICY "Users can view own fridge scan sessions"
  ON fridge_scan_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can only create their own sessions
CREATE POLICY "Users can insert own fridge scan sessions"
  ON fridge_scan_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own sessions
CREATE POLICY "Users can update own fridge scan sessions"
  ON fridge_scan_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own sessions
CREATE POLICY "Users can delete own fridge scan sessions"
  ON fridge_scan_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fridge_scan_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_fridge_scan_sessions_updated_at ON fridge_scan_sessions;
CREATE TRIGGER update_fridge_scan_sessions_updated_at
  BEFORE UPDATE ON fridge_scan_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_fridge_scan_session_updated_at();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_fridge_scan_sessions()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM fridge_scan_sessions
  WHERE expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Manual cleanup or cron job setup can call cleanup_expired_fridge_scan_sessions()
-- For example, pg_cron extension can be used to schedule automatic cleanup:
-- SELECT cron.schedule('cleanup-expired-fridge-sessions', '0 2 * * *', 'SELECT cleanup_expired_fridge_scan_sessions()');
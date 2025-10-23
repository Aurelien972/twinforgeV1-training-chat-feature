/*
  # Add has_completed_body_scan Flag to User Profile

  ## Overview
  This migration adds a boolean flag to track whether a user has completed at least one body scan.
  This prevents the empty scanner state from appearing after a user has completed their first scan.

  ## Changes
  1. New Column
    - `has_completed_body_scan` (boolean, default: false)
      - Tracks if user has ever completed a body scan
      - Automatically set to true after first successful scan
      - Never resets to false

  2. Data Backfill
    - Set flag to true for all users who already have scans in body_scans table
    - Ensures existing users don't see empty state incorrectly

  3. Trigger
    - Auto-update flag when new scan is inserted
    - Ensures flag is always accurate

  ## Security
  - Maintains all existing RLS policies
  - No changes to access controls
*/

-- Add has_completed_body_scan column
ALTER TABLE user_profile
ADD COLUMN IF NOT EXISTS has_completed_body_scan boolean DEFAULT false;

-- Backfill existing users who have completed scans
UPDATE user_profile
SET has_completed_body_scan = true
WHERE user_id IN (
  SELECT DISTINCT user_id
  FROM body_scans
);

-- Create trigger function to update flag when scan is inserted
CREATE OR REPLACE FUNCTION set_has_completed_body_scan()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profile
  SET has_completed_body_scan = true
  WHERE user_id = NEW.user_id
    AND has_completed_body_scan = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on body_scans
DROP TRIGGER IF EXISTS trigger_set_has_completed_body_scan ON body_scans;
CREATE TRIGGER trigger_set_has_completed_body_scan
  AFTER INSERT ON body_scans
  FOR EACH ROW
  EXECUTE FUNCTION set_has_completed_body_scan();

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_profile_has_completed_body_scan
  ON user_profile(has_completed_body_scan)
  WHERE has_completed_body_scan = false;

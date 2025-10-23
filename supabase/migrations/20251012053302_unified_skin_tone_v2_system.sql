/*
  # Unified Skin Tone V2 System Migration

  1. Purpose
    - Force re-extraction to V2 format for all users
    - Add migration tracking columns
    - Create validation triggers

  2. Changes
    - Add needs_v2_migration to body_scans
    - Add skin_tone_v2_migrated to user_profile
    - Create validation functions and triggers
    - Add indexes for migration queries

  3. Security
    - Maintains all existing RLS policies
    - No data loss - only marks for re-extraction
*/

-- Add migration tracking column to body_scans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'body_scans' AND column_name = 'needs_v2_migration'
  ) THEN
    ALTER TABLE body_scans ADD COLUMN needs_v2_migration boolean DEFAULT false;
  END IF;
END $$;

-- Mark all scans without V2 skin tone for re-extraction
UPDATE body_scans
SET needs_v2_migration = true
WHERE skin_tone IS NULL
   OR NOT (
     skin_tone ? 'schema'
     AND skin_tone->>'schema' = 'v2'
     AND skin_tone ? 'rgb'
     AND skin_tone ? 'linear_f32'
   );

-- Add migration tracking to user_profile table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'skin_tone_v2_migrated'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN skin_tone_v2_migrated boolean DEFAULT false;
  END IF;
END $$;

-- Mark all profiles without V2 skin tone for migration
UPDATE user_profile
SET skin_tone_v2_migrated = false
WHERE skin_tone IS NULL
   OR NOT (
     skin_tone ? 'schema'
     AND skin_tone->>'schema' = 'v2'
     AND skin_tone ? 'rgb'
     AND skin_tone ? 'linear_f32'
   );

-- Create validation function for body_scans
CREATE OR REPLACE FUNCTION validate_body_scan_skin_tone_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.skin_tone IS NOT NULL THEN
    IF NOT (
      NEW.skin_tone ? 'schema'
      AND NEW.skin_tone->>'schema' = 'v2'
      AND NEW.skin_tone ? 'rgb'
      AND NEW.skin_tone ? 'linear_f32'
    ) THEN
      NEW.needs_v2_migration = true;
    ELSE
      NEW.needs_v2_migration = false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for body_scans validation
DROP TRIGGER IF EXISTS trigger_validate_body_scan_skin_tone_v2 ON body_scans;
CREATE TRIGGER trigger_validate_body_scan_skin_tone_v2
  BEFORE INSERT OR UPDATE ON body_scans
  FOR EACH ROW
  EXECUTE FUNCTION validate_body_scan_skin_tone_v2();

-- Create validation function for user_profile
CREATE OR REPLACE FUNCTION validate_user_profile_skin_tone_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.skin_tone IS NOT NULL THEN
    IF NOT (
      NEW.skin_tone ? 'schema'
      AND NEW.skin_tone->>'schema' = 'v2'
      AND NEW.skin_tone ? 'rgb'
      AND NEW.skin_tone ? 'linear_f32'
    ) THEN
      NEW.skin_tone_v2_migrated = false;
    ELSE
      NEW.skin_tone_v2_migrated = true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_profile validation
DROP TRIGGER IF EXISTS trigger_validate_user_profile_skin_tone_v2 ON user_profile;
CREATE TRIGGER trigger_validate_user_profile_skin_tone_v2
  BEFORE INSERT OR UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_profile_skin_tone_v2();

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_body_scans_needs_v2_migration
  ON body_scans(needs_v2_migration)
  WHERE needs_v2_migration = true;

CREATE INDEX IF NOT EXISTS idx_user_profile_skin_tone_v2_migrated
  ON user_profile(skin_tone_v2_migrated)
  WHERE skin_tone_v2_migrated = false;

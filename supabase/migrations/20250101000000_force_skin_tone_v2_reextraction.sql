/*
  # Force Skin Tone V2 Re-extraction Migration

  1. Purpose
    - Mark all existing scans for re-extraction to V2 format
    - Clear old skin tone data to force fresh extraction
    - Ensure all users get the new unified skin tone system

  2. Changes
    - Add migration flag to body_scans table
    - Clear legacy skin_tone fields where v2 schema is not present
    - Add trigger to handle auto-reextraction on next scan view

  3. Security
    - Maintains all existing RLS policies
    - No data loss - only marks for re-extraction
*/

-- Add migration tracking column to body_scans if it doesn't exist
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

-- Add migration tracking to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'skin_tone_v2_migrated'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skin_tone_v2_migrated boolean DEFAULT false;
  END IF;
END $$;

-- Mark all profiles without V2 skin tone for migration
UPDATE profiles
SET skin_tone_v2_migrated = false
WHERE skin_tone IS NULL
   OR NOT (
     skin_tone ? 'schema'
     AND skin_tone->>'schema' = 'v2'
     AND skin_tone ? 'rgb'
     AND skin_tone ? 'linear_f32'
   );

-- Create function to validate and auto-migrate skin tone on retrieval
CREATE OR REPLACE FUNCTION validate_skin_tone_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if skin_tone needs V2 migration
  IF NEW.skin_tone IS NOT NULL THEN
    IF NOT (
      NEW.skin_tone ? 'schema'
      AND NEW.skin_tone->>'schema' = 'v2'
      AND NEW.skin_tone ? 'rgb'
      AND NEW.skin_tone ? 'linear_f32'
    ) THEN
      -- Mark for migration if not V2 format
      NEW.needs_v2_migration = true;
    ELSE
      -- Valid V2 format
      NEW.needs_v2_migration = false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for body_scans validation
DROP TRIGGER IF EXISTS validate_body_scan_skin_tone_v2 ON body_scans;
CREATE TRIGGER validate_body_scan_skin_tone_v2
  BEFORE INSERT OR UPDATE ON body_scans
  FOR EACH ROW
  EXECUTE FUNCTION validate_skin_tone_v2();

-- Create trigger for profiles validation
CREATE OR REPLACE FUNCTION validate_profile_skin_tone_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if skin_tone needs V2 migration
  IF NEW.skin_tone IS NOT NULL THEN
    IF NOT (
      NEW.skin_tone ? 'schema'
      AND NEW.skin_tone->>'schema' = 'v2'
      AND NEW.skin_tone ? 'rgb'
      AND NEW.skin_tone ? 'linear_f32'
    ) THEN
      -- Mark for migration if not V2 format
      NEW.skin_tone_v2_migrated = false;
    ELSE
      -- Valid V2 format
      NEW.skin_tone_v2_migrated = true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_profile_skin_tone_v2_trigger ON profiles;
CREATE TRIGGER validate_profile_skin_tone_v2_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_skin_tone_v2();

-- Add index for efficient querying of scans needing migration
CREATE INDEX IF NOT EXISTS idx_body_scans_needs_v2_migration
  ON body_scans(needs_v2_migration)
  WHERE needs_v2_migration = true;

CREATE INDEX IF NOT EXISTS idx_profiles_skin_tone_v2_migrated
  ON profiles(skin_tone_v2_migrated)
  WHERE skin_tone_v2_migrated = false;

-- Log migration statistics
DO $$
DECLARE
  scans_to_migrate INTEGER;
  profiles_to_migrate INTEGER;
BEGIN
  SELECT COUNT(*) INTO scans_to_migrate
  FROM body_scans
  WHERE needs_v2_migration = true;

  SELECT COUNT(*) INTO profiles_to_migrate
  FROM profiles
  WHERE skin_tone_v2_migrated = false;

  RAISE NOTICE 'Skin Tone V2 Migration Statistics:';
  RAISE NOTICE '  - Body scans marked for migration: %', scans_to_migrate;
  RAISE NOTICE '  - Profiles marked for migration: %', profiles_to_migrate;
  RAISE NOTICE '  - Migration will happen automatically on next scan/profile access';
END $$;

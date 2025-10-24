/*
  # Add Preferred Language to User Profile

  ## Overview
  Add language preference field to user_profile table to support multi-language
  exercise catalog and training generation.

  ## Changes
  1. Add `preferred_language` column to user_profile
  2. Default to 'fr' for existing users (French is primary user base)
  3. Support French (fr) and English (en) initially

  ## Security
  - No RLS changes needed (inherits from existing policies)
*/

-- Add preferred_language column to user_profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE user_profile
    ADD COLUMN preferred_language text DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en', 'es', 'de', 'it', 'pt'));

    -- Add comment
    COMMENT ON COLUMN user_profile.preferred_language IS 'User preferred language for exercise names, translations, and training content';

    -- Create index for language-based queries
    CREATE INDEX IF NOT EXISTS idx_user_profile_preferred_language
      ON user_profile(preferred_language);

    -- Log the change
    RAISE NOTICE 'Added preferred_language column to user_profile';
  ELSE
    RAISE NOTICE 'preferred_language column already exists in user_profile';
  END IF;
END $$;

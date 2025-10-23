/*
  # Add Health V2 Columns to user_profile
  
  1. Changes
    - Add health_schema_version column (TEXT)
    - Add country_health_cache column (JSONB)
    - Add health_enriched_at column (TIMESTAMPTZ)
    - Add full_name column if missing (TEXT)
    - Add email column if missing (TEXT)
    - Add language column if missing (TEXT)
  
  2. Security
    - No RLS policy changes (already configured)
    - Columns are nullable to support existing data
*/

-- Add health_schema_version column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'health_schema_version'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN health_schema_version TEXT DEFAULT '1.0';
    RAISE NOTICE 'Added health_schema_version column';
  ELSE
    RAISE NOTICE 'Column health_schema_version already exists';
  END IF;
END $$;

-- Add country_health_cache column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'country_health_cache'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN country_health_cache JSONB;
    RAISE NOTICE 'Added country_health_cache column';
  ELSE
    RAISE NOTICE 'Column country_health_cache already exists';
  END IF;
END $$;

-- Add health_enriched_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'health_enriched_at'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN health_enriched_at TIMESTAMPTZ;
    RAISE NOTICE 'Added health_enriched_at column';
  ELSE
    RAISE NOTICE 'Column health_enriched_at already exists';
  END IF;
END $$;

-- Add full_name column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN full_name TEXT;
    RAISE NOTICE 'Added full_name column';
  ELSE
    RAISE NOTICE 'Column full_name already exists';
  END IF;
END $$;

-- Add email column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN email TEXT;
    RAISE NOTICE 'Added email column';
  ELSE
    RAISE NOTICE 'Column email already exists';
  END IF;
END $$;

-- Add language column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'language'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN language TEXT DEFAULT 'fr';
    RAISE NOTICE 'Added language column';
  ELSE
    RAISE NOTICE 'Column language already exists';
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_user_profile_health_schema_version 
  ON user_profile(health_schema_version);

-- Validation
DO $$
DECLARE
  v_column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'user_profile'
  AND column_name IN ('health_schema_version', 'country_health_cache', 'health_enriched_at', 'full_name', 'email', 'language');
  
  RAISE NOTICE '=== Health V2 Columns Migration Completed ===';
  RAISE NOTICE 'Health V2 related columns present: %', v_column_count;
  RAISE NOTICE 'Expected: 6 (health_schema_version, country_health_cache, health_enriched_at, full_name, email, language)';
END $$;

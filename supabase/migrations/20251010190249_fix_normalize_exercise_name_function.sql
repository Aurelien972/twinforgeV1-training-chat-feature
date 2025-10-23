/*
  # Fix normalize_exercise_name Function

  ## Problem
  The normalize_exercise_name function is removing too many characters.
  It should preserve all alphanumeric characters after removing accents.

  ## Solution
  1. Ensure unaccent extension is enabled
  2. Fix the normalize function to properly handle accents
  3. Test the function with various inputs

  ## Changes
  - Enable unaccent extension if not exists
  - Update normalize_exercise_name to correctly remove only accents and special chars
*/

-- ============================================================================
-- 1. Enable unaccent extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- 2. Fix normalize_exercise_name function
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_exercise_name(name text)
RETURNS text AS $$
BEGIN
  IF name IS NULL OR name = '' THEN
    RETURN NULL;
  END IF;

  -- Step 1: Convert to lowercase
  -- Step 2: Remove accents using unaccent
  -- Step 3: Remove special characters (keep only letters, numbers, spaces)
  -- Step 4: Normalize whitespace (collapse multiple spaces to one)
  -- Step 5: Trim leading/trailing spaces
  RETURN TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        UNACCENT(LOWER(name)),
        '[^a-z0-9\s]', '', 'g'  -- Remove non-alphanumeric except spaces
      ),
      '\s+', ' ', 'g'  -- Collapse multiple spaces
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 3. Test the function
-- ============================================================================

DO $$
DECLARE
  test_result text;
BEGIN
  -- Test 1: Basic accents
  test_result := normalize_exercise_name('Squat arrière');
  IF test_result != 'squat arriere' THEN
    RAISE EXCEPTION 'Test 1 failed: expected "squat arriere", got "%"', test_result;
  END IF;

  -- Test 2: Mixed case and accents
  test_result := normalize_exercise_name('Développé Couché');
  IF test_result != 'developpe couche' THEN
    RAISE EXCEPTION 'Test 2 failed: expected "developpe couche", got "%"', test_result;
  END IF;

  -- Test 3: Special characters
  test_result := normalize_exercise_name('Tractions (Pull-ups)');
  IF test_result != 'tractions pullups' THEN
    RAISE EXCEPTION 'Test 3 failed: expected "tractions pullups", got "%"', test_result;
  END IF;

  -- Test 4: Multiple spaces
  test_result := normalize_exercise_name('Squat    avant');
  IF test_result != 'squat avant' THEN
    RAISE EXCEPTION 'Test 4 failed: expected "squat avant", got "%"', test_result;
  END IF;

  RAISE NOTICE 'All normalize_exercise_name tests passed!';
END $$;

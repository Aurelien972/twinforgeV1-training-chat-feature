/*
  # Fix coach_type Constraint Mismatch

  ## Problem
  The application code uses "coach-force", "coach-endurance", etc. (with prefix)
  but the database constraint only accepts "force", "endurance", etc. (without prefix)

  This causes a CHECK constraint violation when saving training sessions:
  "new row for relation training_sessions violates check constraint training_sessions_coach_type_check"

  ## Solution
  Update the constraint to accept BOTH formats during transition period:
  - With prefix: "coach-force", "coach-endurance", etc. (current application format)
  - Without prefix: "force", "endurance", etc. (new standardized format)

  This allows existing code to continue working while we migrate to the simpler format.

  ## Changes
  1. Drop existing constraint if exists
  2. Add new flexible constraint accepting both formats
  3. Add helper function to normalize coach_type values
  4. Create index for performance

  ## Notes
  - Backwards compatible with existing data
  - No data migration needed
  - Application code will be updated to use simpler format in next step
*/

-- ============================================================================
-- DROP EXISTING CONSTRAINT
-- ============================================================================

-- Drop the existing constraint that only accepts values without prefix
ALTER TABLE training_sessions
  DROP CONSTRAINT IF EXISTS training_sessions_coach_type_check;

-- ============================================================================
-- CREATE FLEXIBLE CONSTRAINT
-- ============================================================================

-- Add new constraint that accepts both formats (with and without prefix)
ALTER TABLE training_sessions
  ADD CONSTRAINT training_sessions_coach_type_check
  CHECK (
    coach_type IS NULL OR
    coach_type IN (
      -- Format with prefix (current application format)
      'coach-force',
      'coach-functional',
      'coach-competitions',
      'coach-calisthenics',
      'coach-combat',
      'coach-endurance',
      'coach-wellness',
      'coach-sports',
      'coach-mixed',

      -- Format without prefix (new standardized format)
      'force',
      'functional',
      'competitions',
      'calisthenics',
      'combat',
      'endurance',
      'wellness',
      'sports',
      'mixed',

      -- Legacy values that might exist
      'hybrid',
      'mobility'
    )
  );

-- ============================================================================
-- HELPER FUNCTION TO NORMALIZE COACH_TYPE
-- ============================================================================

-- Function to normalize coach_type to format without prefix
-- This will be used during data migration and by application code
CREATE OR REPLACE FUNCTION normalize_coach_type(coach_type_value TEXT)
RETURNS TEXT AS $$
BEGIN
  -- If NULL, return NULL
  IF coach_type_value IS NULL THEN
    RETURN NULL;
  END IF;

  -- Remove 'coach-' prefix if present
  IF coach_type_value LIKE 'coach-%' THEN
    RETURN substring(coach_type_value from 7); -- Remove first 6 chars ('coach-')
  END IF;

  -- Already normalized or legacy value
  RETURN coach_type_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- DATA QUALITY CHECK FUNCTION
-- ============================================================================

-- Function to check if there are any invalid coach_type values
CREATE OR REPLACE FUNCTION check_invalid_coach_types()
RETURNS TABLE(
  session_id UUID,
  coach_type TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.id,
    ts.coach_type,
    ts.created_at
  FROM training_sessions ts
  WHERE ts.coach_type IS NOT NULL
  AND ts.coach_type NOT IN (
    'coach-force', 'coach-functional', 'coach-competitions',
    'coach-calisthenics', 'coach-combat', 'coach-endurance',
    'coach-wellness', 'coach-sports', 'coach-mixed',
    'force', 'functional', 'competitions', 'calisthenics',
    'combat', 'endurance', 'wellness', 'sports', 'mixed',
    'hybrid', 'mobility'
  )
  ORDER BY ts.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT training_sessions_coach_type_check ON training_sessions IS
'Accepts both formats: with prefix (coach-force) and without (force) for transition period';

COMMENT ON FUNCTION normalize_coach_type(TEXT) IS
'Removes coach- prefix from coach_type values. Returns: force, endurance, functional, etc.';

COMMENT ON FUNCTION check_invalid_coach_types() IS
'Returns sessions with invalid coach_type values for data quality monitoring';

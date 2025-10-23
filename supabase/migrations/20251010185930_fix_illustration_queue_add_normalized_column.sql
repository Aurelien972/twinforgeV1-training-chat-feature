/*
  # Fix Illustration Queue - Add Normalized Exercise Name Column

  ## Problem
  The `illustration_generation_queue` table is missing the `exercise_name_normalized` column,
  causing INSERT failures when trying to queue new illustration generations.
  Error: "table has no field exercise_name_normalized"

  ## Solution
  1. Add `exercise_name_normalized` column to store normalized exercise names
  2. Create trigger to auto-populate this column on INSERT/UPDATE
  3. Backfill existing records with normalized names
  4. Update unique constraint to use normalized names for better duplicate detection

  ## Changes
  - Add `exercise_name_normalized` TEXT column
  - Create trigger function for automatic normalization
  - Backfill existing data
  - Update unique indexes to use normalized column

  ## Impact
  - Fixes INSERT failures into illustration_generation_queue
  - Enables better duplicate detection (case-insensitive, accent-insensitive)
  - Maintains data consistency with illustration_library table
*/

-- ============================================================================
-- 1. Add exercise_name_normalized column
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'illustration_generation_queue'
    AND column_name = 'exercise_name_normalized'
  ) THEN
    ALTER TABLE illustration_generation_queue
    ADD COLUMN exercise_name_normalized text;
  END IF;
END $$;

-- ============================================================================
-- 2. Create trigger function to auto-normalize exercise names
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_queue_exercise_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Only normalize if exercise_name is provided
  IF NEW.exercise_name IS NOT NULL AND NEW.exercise_name != '' THEN
    -- Use the existing normalize_exercise_name function
    NEW.exercise_name_normalized := normalize_exercise_name(NEW.exercise_name);
  ELSE
    NEW.exercise_name_normalized := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_normalize_queue_exercise_name ON illustration_generation_queue;

CREATE TRIGGER trigger_normalize_queue_exercise_name
  BEFORE INSERT OR UPDATE OF exercise_name ON illustration_generation_queue
  FOR EACH ROW
  EXECUTE FUNCTION normalize_queue_exercise_name();

-- ============================================================================
-- 3. Backfill existing records with normalized names
-- ============================================================================

UPDATE illustration_generation_queue
SET exercise_name_normalized = normalize_exercise_name(exercise_name)
WHERE exercise_name IS NOT NULL 
  AND exercise_name != ''
  AND (exercise_name_normalized IS NULL OR exercise_name_normalized = '');

-- ============================================================================
-- 4. Update unique constraints to use normalized column
-- ============================================================================

-- Drop old unique indexes if they exist
DROP INDEX IF EXISTS unique_pending_exercise_queue;
DROP INDEX IF EXISTS unique_pending_session_queue;

-- Create new unique indexes using normalized column
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_exercise_queue_normalized
ON illustration_generation_queue(exercise_name_normalized, discipline, type)
WHERE status IN ('pending', 'processing') 
  AND exercise_name_normalized IS NOT NULL;

-- Keep session-type unique index (no exercise name)
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_session_queue
ON illustration_generation_queue(discipline, type)
WHERE status IN ('pending', 'processing') 
  AND type = 'session';

-- ============================================================================
-- 5. Add index for faster lookups by normalized name
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_illustration_queue_normalized_name
ON illustration_generation_queue(exercise_name_normalized)
WHERE exercise_name_normalized IS NOT NULL;

-- ============================================================================
-- 6. Add helpful comment
-- ============================================================================

COMMENT ON COLUMN illustration_generation_queue.exercise_name_normalized IS 
  'Normalized exercise name (lowercase, no accents, no special chars) for consistent duplicate detection. Auto-populated via trigger.';

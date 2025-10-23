/*
  # Add Queue Deduplication Constraint

  ## Problem
  The illustration generation queue allows duplicate entries for the same exercise,
  causing infinite loops where the same illustration is generated multiple times.

  ## Solution
  1. Add unique partial index to prevent duplicate pending/processing items
  2. Add function to check for existing queue items before insertion
  3. Add function to check for existing illustrations before generation

  ## Changes
  - Unique constraint on (exercise_name, discipline, type) for pending/processing items
  - Helper function to check queue duplicates
  - Helper function to check illustration existence

  ## Impact
  - Prevents duplicate queue entries
  - Stops infinite generation loops
  - Reduces OpenAI API costs
*/

-- ============================================================================
-- 1. Add unique constraint to prevent duplicate pending/processing items
-- ============================================================================

-- Partial unique index: prevents duplicates only for pending/processing items
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_exercise_queue
ON illustration_generation_queue(exercise_name, discipline, type)
WHERE status IN ('pending', 'processing') AND exercise_name IS NOT NULL;

-- Index for session-type items (where exercise_name is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_session_queue
ON illustration_generation_queue(discipline, type)
WHERE status IN ('pending', 'processing') AND exercise_name IS NULL;

-- ============================================================================
-- 2. Function to check if item already in queue
-- ============================================================================

CREATE OR REPLACE FUNCTION check_illustration_queue_exists(
  p_exercise_name text,
  p_discipline text,
  p_type text
)
RETURNS uuid AS $$
DECLARE
  existing_id uuid;
BEGIN
  -- Check for existing pending or processing item
  SELECT id INTO existing_id
  FROM illustration_generation_queue
  WHERE exercise_name = p_exercise_name
    AND discipline = p_discipline
    AND type = p_type
    AND status IN ('pending', 'processing')
  LIMIT 1;

  RETURN existing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Function to check if illustration already exists in library
-- ============================================================================

CREATE OR REPLACE FUNCTION check_illustration_exists(
  p_exercise_name text,
  p_discipline text,
  p_type text
)
RETURNS TABLE(
  illustration_id uuid,
  image_url text,
  thumbnail_url text
) AS $$
DECLARE
  normalized_name text;
BEGIN
  -- Normalize the exercise name
  normalized_name := normalize_exercise_name(p_exercise_name);

  -- Check if illustration exists
  RETURN QUERY
  SELECT
    id,
    illustration_library.image_url,
    illustration_library.thumbnail_url
  FROM illustration_library
  WHERE exercise_name_normalized = normalized_name
    AND illustration_library.discipline = p_discipline
    AND illustration_library.type = p_type
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Add indexes for performance on duplicate checks
-- ============================================================================

-- Index for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_illustration_queue_duplicate_check
ON illustration_generation_queue(exercise_name, discipline, type, status)
WHERE status IN ('pending', 'processing');

-- Index for normalized name lookups
CREATE INDEX IF NOT EXISTS idx_illustration_library_normalized_discipline
ON illustration_library(exercise_name_normalized, discipline, type);

-- ============================================================================
-- 5. Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_illustration_queue_exists TO authenticated;
GRANT EXECUTE ON FUNCTION check_illustration_queue_exists TO service_role;

GRANT EXECUTE ON FUNCTION check_illustration_exists TO authenticated;
GRANT EXECUTE ON FUNCTION check_illustration_exists TO service_role;

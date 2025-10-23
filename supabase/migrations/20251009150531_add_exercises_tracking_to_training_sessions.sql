/*
  # Add Exercise Tracking Columns to Training Sessions

  ## Overview
  Add missing columns to track exercise completion in training sessions.
  These columns are required by the frontend code but were missing from the schema.

  ## Changes

  ### 1. New Columns on `training_sessions`
  - `exercises_total` (integer): Total number of exercises in the session prescription
  - `exercises_completed` (integer): Number of exercises actually completed by the user

  ### 2. Constraints
  - exercises_total must be >= 0
  - exercises_completed must be >= 0
  - exercises_completed cannot exceed exercises_total

  ### 3. Data Migration
  - Calculate exercises_total from existing prescription JSONB for all sessions
  - Set exercises_completed based on status (completed sessions = exercises_total, others = 0)

  ## Security
  - No changes to RLS policies needed
  - Existing policies cover these new columns

  ## Performance
  - Index on exercises_completed for filtering completed sessions
*/

-- =====================================================
-- 1. ADD COLUMNS TO TRAINING_SESSIONS
-- =====================================================

-- Add exercises_total column (number of exercises in prescription)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'training_sessions'
    AND column_name = 'exercises_total'
  ) THEN
    ALTER TABLE public.training_sessions
    ADD COLUMN exercises_total INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add exercises_completed column (number of exercises actually completed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'training_sessions'
    AND column_name = 'exercises_completed'
  ) THEN
    ALTER TABLE public.training_sessions
    ADD COLUMN exercises_completed INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- =====================================================
-- 2. ADD CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Ensure exercises_total is non-negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_exercises_total'
  ) THEN
    ALTER TABLE public.training_sessions
    ADD CONSTRAINT valid_exercises_total
    CHECK (exercises_total >= 0);
  END IF;
END $$;

-- Ensure exercises_completed is non-negative and doesn't exceed total
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_exercises_completed'
  ) THEN
    ALTER TABLE public.training_sessions
    ADD CONSTRAINT valid_exercises_completed
    CHECK (exercises_completed >= 0 AND exercises_completed <= exercises_total);
  END IF;
END $$;

-- =====================================================
-- 3. MIGRATE EXISTING DATA
-- =====================================================

-- Function to count exercises in a prescription JSONB
CREATE OR REPLACE FUNCTION count_exercises_in_prescription(prescription_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER := 0;
  block JSONB;
BEGIN
  -- Count exercises in main workout blocks
  IF prescription_data ? 'blocks' THEN
    FOR block IN SELECT jsonb_array_elements(prescription_data->'blocks')
    LOOP
      IF block ? 'exercises' THEN
        total_count := total_count + jsonb_array_length(block->'exercises');
      END IF;
    END LOOP;
  END IF;

  -- Count exercises in mainWorkout (alternative structure)
  IF prescription_data ? 'mainWorkout' THEN
    total_count := total_count + jsonb_array_length(prescription_data->'mainWorkout');
  END IF;

  -- Count exercises in 'exercises' (flat structure)
  IF prescription_data ? 'exercises' THEN
    total_count := total_count + jsonb_array_length(prescription_data->'exercises');
  END IF;

  -- Count stations for competitions discipline
  IF prescription_data ? 'stations' THEN
    total_count := total_count + jsonb_array_length(prescription_data->'stations');
  END IF;

  RETURN COALESCE(total_count, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all existing sessions with calculated values
UPDATE public.training_sessions
SET 
  exercises_total = count_exercises_in_prescription(prescription),
  exercises_completed = CASE
    WHEN status = 'completed' THEN count_exercises_in_prescription(prescription)
    ELSE 0
  END
WHERE exercises_total = 0;

-- =====================================================
-- 4. CREATE INDEX FOR PERFORMANCE
-- =====================================================

-- Index for querying by completion status
CREATE INDEX IF NOT EXISTS training_sessions_exercises_completion_idx
  ON public.training_sessions(user_id, exercises_completed, exercises_total)
  WHERE status = 'completed';

-- =====================================================
-- 5. ADD DOCUMENTATION COMMENTS
-- =====================================================

COMMENT ON COLUMN public.training_sessions.exercises_total IS
  'Total number of exercises prescribed in this session (calculated from prescription JSONB)';

COMMENT ON COLUMN public.training_sessions.exercises_completed IS
  'Number of exercises actually completed by the user during the session';

COMMENT ON FUNCTION count_exercises_in_prescription(JSONB) IS
  'Helper function to count total exercises in a session prescription JSONB structure';
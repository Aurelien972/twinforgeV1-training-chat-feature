/*
  # Add duration_minutes column to training_sessions

  **Description**
  Fixes PGRST204 error by adding the missing duration_minutes column to training_sessions table.
  This column is required by the endurance tracking system to store session duration metrics.

  ## Changes
  
  1. Column Addition
    - `duration_minutes` (INTEGER): Total session duration in minutes
    - Default value: NULL (to be set during session completion)
    - Used by endurance session tracking for metrics persistence

  ## Notes
  
  - This column complements the existing `duration_target_min` and `duration_actual_min` columns
  - `duration_minutes` is specifically used for endurance session metrics
  - The column is conditionally added to avoid errors if it already exists
*/

-- ============================================================================
-- ADD DURATION_MINUTES COLUMN
-- ============================================================================

-- Add duration_minutes column to training_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN duration_minutes INTEGER;
    
    -- Add comment for documentation
    COMMENT ON COLUMN training_sessions.duration_minutes IS 'Total session duration in minutes (used for endurance metrics)';
  END IF;
END $$;

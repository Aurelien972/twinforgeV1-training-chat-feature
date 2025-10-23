/*
  # Add is_active column to training_goals

  ## Changes
  This migration adds the `is_active` column to the `training_goals` table to track whether a goal is currently active or has been archived/paused.

  ## Semantic Difference
  - `is_active = true`: Goal is active and user is currently working towards it
  - `is_active = false`: Goal is paused, archived, or abandoned
  - `is_achieved = true`: Goal has been successfully completed
  - `is_achieved = false`: Goal is not yet achieved

  A goal can be:
  - Active and not achieved (in progress)
  - Active and achieved (completed but still tracking)
  - Not active and not achieved (paused/archived)
  - Not active and achieved (completed and archived)

  ## Changes Made
  1. Add `is_active` column with default value `true`
  2. Create index on `is_active` for query optimization
  3. Set existing records to `is_active = true` (all current goals are considered active)
*/

-- Add is_active column to training_goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'training_goals'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE training_goals ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Create index on is_active for better query performance
CREATE INDEX IF NOT EXISTS idx_training_goals_is_active
  ON training_goals(is_active);

-- Create composite index for common query pattern (user_id + is_active)
CREATE INDEX IF NOT EXISTS idx_training_goals_user_is_active
  ON training_goals(user_id, is_active);

-- Update existing records to set is_active = true (all existing goals are active)
UPDATE training_goals
SET is_active = true
WHERE is_active IS NULL;

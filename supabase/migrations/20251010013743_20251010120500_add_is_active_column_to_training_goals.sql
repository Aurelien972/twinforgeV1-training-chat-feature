/*
  # Add is_active column to training_goals

  1. Changes
    - Add is_active column to track active vs archived goals
    - Default to true for new goals
    - Add index for performance on is_active queries

  2. Security
    - No RLS changes needed - existing policies cover this column
*/

-- Add is_active column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_goals' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE training_goals ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_training_goals_is_active
  ON training_goals(is_active) WHERE is_active = true;

-- Create composite index for user queries
CREATE INDEX IF NOT EXISTS idx_training_goals_user_is_active
  ON training_goals(user_id, is_active);

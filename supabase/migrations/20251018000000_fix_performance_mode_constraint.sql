/*
  # Fix Performance Mode Constraint

  ## Summary
  Updates the performance_mode CHECK constraint to accept the correct values
  used by the application ('high-performance', 'balanced', 'quality') instead
  of the old values ('auto', 'optimized', 'ultra').

  ## Changes
  1. Drop the old constraint that was blocking saves
  2. Add new constraint with correct values
  3. Migrate any existing data to new format:
     - 'auto' -> 'balanced'
     - 'optimized' -> 'high-performance'
     - 'ultra' -> 'quality'

  ## Security
  - Inherits RLS policies from user_preferences table
  - No security changes, only constraint update
*/

-- First, update any existing data to new format
UPDATE user_preferences
SET performance_mode = CASE
  WHEN performance_mode = 'auto' THEN 'balanced'
  WHEN performance_mode = 'optimized' THEN 'high-performance'
  WHEN performance_mode = 'ultra' THEN 'quality'
  ELSE performance_mode
END
WHERE performance_mode IN ('auto', 'optimized', 'ultra');

-- Drop the old constraint
ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_performance_mode_check;

-- Add new constraint with correct values
ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_performance_mode_check
CHECK (performance_mode IN ('high-performance', 'balanced', 'quality'));

-- Update the comment to reflect new values
COMMENT ON COLUMN user_preferences.performance_mode IS
  'Performance mode setting: high-performance = max optimization, balanced = default experience, quality = full visual effects';

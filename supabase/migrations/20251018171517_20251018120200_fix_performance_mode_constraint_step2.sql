/*
  # Fix Performance Mode Constraint - Step 2: Update Data and Add New Constraint

  ## Summary
  Updates existing data to use new performance mode values and adds the correct constraint.

  ## Changes
  1. Update any existing data to new format
  2. Add new constraint with correct values

  ## Security
  - Inherits RLS policies from user_preferences table
*/

-- Update any existing data to new format
UPDATE user_preferences
SET performance_mode = CASE
  WHEN performance_mode = 'auto' THEN 'balanced'
  WHEN performance_mode = 'optimized' THEN 'high-performance'
  WHEN performance_mode = 'ultra' THEN 'quality'
  ELSE performance_mode
END
WHERE performance_mode IN ('auto', 'optimized', 'ultra');

-- Add new constraint with correct values
ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_performance_mode_check
CHECK (performance_mode IN ('high-performance', 'balanced', 'quality'));

-- Update the comment to reflect new values
COMMENT ON COLUMN user_preferences.performance_mode IS
  'Performance mode setting: high-performance = max optimization, balanced = default experience, quality = full visual effects';

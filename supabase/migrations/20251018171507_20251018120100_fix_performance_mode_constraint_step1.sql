/*
  # Fix Performance Mode Constraint - Step 1: Remove Old Constraint

  ## Summary
  Removes the old constraint that prevents updating to new performance mode values.

  ## Changes
  1. Drop the old constraint with incorrect values

  ## Security
  - No security changes, only constraint removal
*/

-- Drop the old constraint
ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_performance_mode_check;

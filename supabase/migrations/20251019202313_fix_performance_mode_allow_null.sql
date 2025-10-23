/*
  # Fix performance_mode constraint to allow NULL

  1. Changes
    - Drop existing constraint that doesn't allow NULL
    - Add new constraint that allows NULL or valid enum values
    - This fixes upsert failures when updating notification/privacy settings

  2. Security
    - No security impact - constraint still validates non-NULL values
*/

-- Drop the existing constraint that doesn't allow NULL
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_performance_mode_check;

-- Add new constraint that allows NULL or valid enum values
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_performance_mode_check 
  CHECK (performance_mode IS NULL OR performance_mode IN ('high-performance', 'balanced', 'quality'));

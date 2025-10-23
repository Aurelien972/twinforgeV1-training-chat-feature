/*
  # Reset Performance Modes to Auto - Emergency Fix

  1. Purpose
    - Reset all user performance modes to 'auto' after CSS bug fix
    - Fixes issue where ultra/optimized modes were hiding components
    - Ensures all users have a working interface

  2. Changes
    - Update all user_preferences records to set performance_mode = 'auto'
    - This is a one-time emergency fix after correcting ultra-performance.css

  3. Security
    - No RLS changes needed
    - Only updates performance_mode column
*/

-- Reset all users to auto performance mode
UPDATE user_preferences
SET
  performance_mode = 'auto',
  updated_at = now()
WHERE performance_mode IN ('ultra', 'optimized');

-- Log the number of affected users
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Reset % user(s) to auto performance mode', affected_count;
END $$;

/*
  # Add Performance Mode to User Preferences

  ## Summary
  Adds a dedicated performance_mode_enabled field to user_preferences table to allow users
  to enable a high-performance mode that disables all expensive visual effects, animations,
  and glassmorphism. This is specifically designed for older devices like iPhone 10, iPhone 8,
  and older Android devices to eliminate flickering and ensure 60fps performance.

  ## Changes
  1. New Column
    - `performance_mode_enabled` (boolean, default false)
      - When true: disables all animations, glassmorphism, glows, particles, and shadows
      - When false: full TwinForge visual experience with all effects
      - Default false to maintain current experience for all users
      - Manually controlled via Settings > General tab

  2. Benefits
    - Eliminates flickering on iPhone 10 and older devices
    - Replaces transparent glass with solid dark blue backgrounds
    - Removes all particle animations and cosmic background movement
    - Disables all icon glows and hover effects
    - Maintains navigation and core functionality intact

  ## Security
  - Inherits RLS policies from user_preferences table
  - Simple boolean preference with safe default value
*/

-- Add performance_mode_enabled column to user_preferences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'performance_mode_enabled'
  ) THEN
    ALTER TABLE user_preferences
    ADD COLUMN performance_mode_enabled boolean DEFAULT false NOT NULL;

    -- Add helpful comment
    COMMENT ON COLUMN user_preferences.performance_mode_enabled IS
      'Enables high-performance mode. True = disables all animations, glassmorphism, and expensive effects for 60fps on older devices. False (default) = full visual experience.';
  END IF;
END $$;

-- Create index for potential queries filtering by performance mode
CREATE INDEX IF NOT EXISTS idx_user_preferences_performance_mode
  ON user_preferences(performance_mode_enabled)
  WHERE performance_mode_enabled = true;

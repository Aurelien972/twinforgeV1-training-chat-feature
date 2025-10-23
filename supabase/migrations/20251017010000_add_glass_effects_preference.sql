/*
  # Add Glass Effects Preference to User Profile

  ## Summary
  Adds a preference field to control glassmorphism effects in the UI. This allows users with
  low-performance devices to disable resource-intensive visual effects while maintaining full
  functionality and color identity.

  ## Changes
  1. New Column
    - `glass_effects_enabled` (boolean, default true)
      - Controls whether glassmorphism effects (backdrop-filter, complex shadows, animations) are rendered
      - Default true to maintain current visual experience for all users
      - Can be toggled in Settings > General tab for performance optimization

  ## Use Case
  - Users with older devices can disable glass effects for better performance
  - Maintains all colors, circuits, and UI structure while removing expensive visual effects
  - Preference is persisted and synced across user's devices
  - Respects user autonomy in choosing performance vs aesthetics

  ## Security
  - No RLS changes needed (inherits from user_profile table policies)
  - Simple boolean preference with safe default value
*/

-- Add glass_effects_enabled column to user_profile table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'glass_effects_enabled'
  ) THEN
    ALTER TABLE user_profile
    ADD COLUMN glass_effects_enabled boolean DEFAULT true NOT NULL;

    -- Add helpful comment
    COMMENT ON COLUMN user_profile.glass_effects_enabled IS
      'Controls glassmorphism effects rendering. True (default) = full effects, False = simplified solid backgrounds for better performance on low-end devices.';
  END IF;
END $$;

-- Create index for potential future queries filtering by this preference
CREATE INDEX IF NOT EXISTS idx_user_profile_glass_effects
  ON user_profile(glass_effects_enabled)
  WHERE glass_effects_enabled = false;

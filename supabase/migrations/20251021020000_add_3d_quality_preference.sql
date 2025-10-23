/*
  # Add 3D Quality Preference to User Preferences

  1. Changes
    - Add `render_quality_3d` column to user_preferences table
    - Values: 'auto' | 'low' | 'medium' | 'high'
    - Default: 'auto' (system detects best quality based on device)
    - 'low': Force pixelRatio 1.0, no antialiasing, minimal lights
    - 'medium': pixelRatio 1.25, no antialiasing, balanced lights
    - 'high': pixelRatio 1.5, antialiasing enabled, enhanced materials

  2. Purpose
    - Allow users to manually control 3D rendering quality
    - Override automatic detection for better performance or quality
    - Solve pixelation issues on mobile by letting users choose higher quality
*/

-- Add 3D quality preference column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'render_quality_3d'
  ) THEN
    ALTER TABLE user_preferences
    ADD COLUMN render_quality_3d text NOT NULL DEFAULT 'auto'
    CHECK (render_quality_3d IN ('auto', 'low', 'medium', 'high'));
  END IF;
END $$;

-- Create index for potential filtering by quality preference
CREATE INDEX IF NOT EXISTS idx_user_preferences_render_quality
ON user_preferences(render_quality_3d)
WHERE render_quality_3d != 'auto';

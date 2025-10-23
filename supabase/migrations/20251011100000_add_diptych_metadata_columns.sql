/*
  # Add Diptych Metadata to Illustration Library

  1. Modifications
    - Add `is_diptych` boolean column to track 2-panel illustrations
    - Add `panel_count` integer column (default 1, 2 for diptychs)
    - Add `image_aspect_ratio` text column (e.g., "1:1", "16:9")
    - Add `arrow_config` jsonb column for storing arrow metadata
    - Add `muscle_highlight_config` jsonb for muscle overlay metadata

  2. Data Migration
    - Set defaults for existing illustrations
    - Ensure backward compatibility

  3. Indexes
    - Add index on is_diptych for fast filtering
    - Add index on aspect_ratio for queries
*/

-- Add diptych metadata columns
ALTER TABLE illustration_library
  ADD COLUMN IF NOT EXISTS is_diptych boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS panel_count integer DEFAULT 1 CHECK (panel_count >= 1 AND panel_count <= 4),
  ADD COLUMN IF NOT EXISTS image_aspect_ratio text DEFAULT '1:1',
  ADD COLUMN IF NOT EXISTS arrow_config jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS muscle_highlight_config jsonb DEFAULT NULL;

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_illustration_library_is_diptych
  ON illustration_library(is_diptych);

CREATE INDEX IF NOT EXISTS idx_illustration_library_aspect_ratio
  ON illustration_library(image_aspect_ratio);

-- Add comments for documentation
COMMENT ON COLUMN illustration_library.is_diptych IS 'True if illustration contains multiple panels (e.g., start + end position)';
COMMENT ON COLUMN illustration_library.panel_count IS 'Number of panels in illustration (1=single, 2=diptych, 3=triptych, etc.)';
COMMENT ON COLUMN illustration_library.image_aspect_ratio IS 'Aspect ratio of image (e.g., "1:1", "16:9", "4:3")';
COMMENT ON COLUMN illustration_library.arrow_config IS 'JSON config for arrows: {"macro": {...}, "micro": [{...}], "colors": {...}}';
COMMENT ON COLUMN illustration_library.muscle_highlight_config IS 'JSON config for muscle highlighting: {"muscles": ["quadriceps", "glutes"], "opacity": 0.3, "color": "#ff0000"}';

-- Migrate existing data (set defaults for backward compatibility)
UPDATE illustration_library
SET
  is_diptych = false,
  panel_count = 1,
  image_aspect_ratio = '1:1'
WHERE is_diptych IS NULL;

-- Create helper function to validate arrow_config structure
CREATE OR REPLACE FUNCTION validate_arrow_config(config jsonb)
RETURNS boolean AS $$
BEGIN
  -- Validate that arrow_config has expected structure
  IF config IS NULL THEN
    RETURN true;
  END IF;

  -- Check for required top-level keys
  IF NOT (config ? 'macro' OR config ? 'micro') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_arrow_config IS 'Validates arrow_config JSON structure';

-- Create helper function to validate muscle_highlight_config
CREATE OR REPLACE FUNCTION validate_muscle_highlight_config(config jsonb)
RETURNS boolean AS $$
BEGIN
  IF config IS NULL THEN
    RETURN true;
  END IF;

  -- Check for muscles array
  IF NOT (config ? 'muscles') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_muscle_highlight_config IS 'Validates muscle_highlight_config JSON structure';

/*
  # Add Diptych Metadata to Illustration Library

  1. New Columns
    - `is_diptych` (boolean): Indicates if illustration is a diptych (2 panels side by side)
    - `panel_count` (integer): Number of panels in illustration (1 for standard, 2 for diptych)
    - `image_aspect_ratio` (text): Aspect ratio of image (e.g., "16:9", "1:1")

  2. Purpose
    - Support Force & Powerbuilding diptych illustrations (concentric + eccentric phases)
    - Track panoramic format images (1536x1024 vs 1024x1024)
    - Enable proper display sizing in frontend based on aspect ratio

  3. Migration Notes
    - Existing illustrations default to standard format (1:1 ratio, single panel)
    - New Force illustrations will use diptych format automatically
    - Non-destructive: existing data preserved
*/

-- Add is_diptych column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'illustration_library'
    AND column_name = 'is_diptych'
  ) THEN
    ALTER TABLE illustration_library
    ADD COLUMN is_diptych boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add panel_count column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'illustration_library'
    AND column_name = 'panel_count'
  ) THEN
    ALTER TABLE illustration_library
    ADD COLUMN panel_count integer DEFAULT 1 NOT NULL CHECK (panel_count >= 1 AND panel_count <= 4);
  END IF;
END $$;

-- Add image_aspect_ratio column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'illustration_library'
    AND column_name = 'image_aspect_ratio'
  ) THEN
    ALTER TABLE illustration_library
    ADD COLUMN image_aspect_ratio text DEFAULT '1:1';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN illustration_library.is_diptych IS 'True if illustration shows 2 panels side by side (concentric + eccentric phases)';
COMMENT ON COLUMN illustration_library.panel_count IS 'Number of panels in illustration: 1 = standard, 2 = diptych, 3-4 = multi-panel progression';
COMMENT ON COLUMN illustration_library.image_aspect_ratio IS 'Aspect ratio of image for proper display sizing, e.g., 1:1 (square), 16:9 (panoramic), 4:3 (standard)';

-- Create index for filtering diptych illustrations
CREATE INDEX IF NOT EXISTS idx_illustration_library_diptych
  ON illustration_library(is_diptych, discipline)
  WHERE is_diptych = true;

-- Create index for aspect ratio filtering
CREATE INDEX IF NOT EXISTS idx_illustration_library_aspect_ratio
  ON illustration_library(image_aspect_ratio);

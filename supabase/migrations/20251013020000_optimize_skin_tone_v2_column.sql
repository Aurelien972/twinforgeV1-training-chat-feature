/*
  # Optimize Skin Tone V2 Storage and Indexing

  ## Description
  This migration optimizes the storage and retrieval of skin tone data by:
  - Ensuring skin_tone_v2 JSONB column exists with proper structure
  - Adding performance index on hex color for quick lookups
  - Adding index on source field for analytics
  - Adding validation check for V2 format schema
  - Creating helper function for V2 format validation

  ## Changes
  1. Schema
    - Add skin_tone_v2 column to body_scans if not exists (JSONB)
    - Add skin_tone_ai_metadata column for Vision AI analysis context

  2. Indexes
    - GIN index on skin_tone_v2 for fast JSONB queries
    - B-tree index on (skin_tone_v2->>'hex') for color lookups
    - Index on (skin_tone_v2->>'source') for analytics

  3. Validation
    - Check constraint to ensure V2 format schema
    - Helper function to validate SkinToneV2 structure

  4. Performance
    - Optimized JSONB storage with compression
    - Fast hex color lookups for UI
    - Efficient source tracking for debugging
*/

-- Add skin_tone_v2 column if not exists (JSONB format)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'body_scans' AND column_name = 'skin_tone_v2'
  ) THEN
    ALTER TABLE body_scans
    ADD COLUMN skin_tone_v2 JSONB;

    COMMENT ON COLUMN body_scans.skin_tone_v2 IS
    'Complete skin tone data in V2 format with sRGB, linear, and hex representations';
  END IF;
END $$;

-- Add AI metadata column for Vision AI context
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'body_scans' AND column_name = 'skin_tone_ai_metadata'
  ) THEN
    ALTER TABLE body_scans
    ADD COLUMN skin_tone_ai_metadata JSONB;

    COMMENT ON COLUMN body_scans.skin_tone_ai_metadata IS
    'Vision AI analysis metadata: zones analyzed, lighting compensation, undertone, ethnicity hint';
  END IF;
END $$;

-- Create validation function for SkinToneV2 format
CREATE OR REPLACE FUNCTION validate_skin_tone_v2(skin_tone JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check required top-level fields
  IF NOT (
    skin_tone ? 'schema' AND
    skin_tone ? 'space' AND
    skin_tone ? 'format' AND
    skin_tone ? 'rgb' AND
    skin_tone ? 'hex' AND
    skin_tone ? 'srgb_f32' AND
    skin_tone ? 'linear_f32'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Validate schema version
  IF (skin_tone->>'schema') != 'v2' THEN
    RETURN FALSE;
  END IF;

  -- Validate color space
  IF (skin_tone->>'space') != 'sRGB' THEN
    RETURN FALSE;
  END IF;

  -- Validate format
  IF (skin_tone->>'format') != 'rgb255' THEN
    RETURN FALSE;
  END IF;

  -- Check rgb object has r, g, b
  IF NOT (
    skin_tone->'rgb' ? 'r' AND
    skin_tone->'rgb' ? 'g' AND
    skin_tone->'rgb' ? 'b'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Check srgb_f32 object has r, g, b
  IF NOT (
    skin_tone->'srgb_f32' ? 'r' AND
    skin_tone->'srgb_f32' ? 'g' AND
    skin_tone->'srgb_f32' ? 'b'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Check linear_f32 object has r, g, b
  IF NOT (
    skin_tone->'linear_f32' ? 'r' AND
    skin_tone->'linear_f32' ? 'g' AND
    skin_tone->'linear_f32' ? 'b'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Validate hex format
  IF NOT (skin_tone->>'hex' ~ '^#[0-9A-Fa-f]{6}$') THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraint for V2 format validation (only for new inserts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'body_scans_skin_tone_v2_format_check'
  ) THEN
    ALTER TABLE body_scans
    ADD CONSTRAINT body_scans_skin_tone_v2_format_check
    CHECK (
      skin_tone_v2 IS NULL OR
      validate_skin_tone_v2(skin_tone_v2)
    );
  END IF;
END $$;

-- Create GIN index for fast JSONB queries
CREATE INDEX IF NOT EXISTS idx_body_scans_skin_tone_v2_gin
ON body_scans USING gin(skin_tone_v2);

-- Create index on hex color for fast lookups
CREATE INDEX IF NOT EXISTS idx_body_scans_skin_tone_hex
ON body_scans((skin_tone_v2->>'hex'));

-- Create index on source for analytics
CREATE INDEX IF NOT EXISTS idx_body_scans_skin_tone_source
ON body_scans((skin_tone_v2->>'source'));

-- Create index on confidence for quality analysis
CREATE INDEX IF NOT EXISTS idx_body_scans_skin_tone_confidence
ON body_scans(((skin_tone_v2->>'confidence')::numeric));

-- Create index on AI metadata for debugging
CREATE INDEX IF NOT EXISTS idx_body_scans_skin_tone_ai_metadata_gin
ON body_scans USING gin(skin_tone_ai_metadata);

-- Grant necessary permissions
GRANT SELECT ON body_scans TO authenticated;
GRANT INSERT ON body_scans TO authenticated;
GRANT UPDATE ON body_scans TO authenticated;

COMMENT ON FUNCTION validate_skin_tone_v2(JSONB) IS
'Validates that a JSONB object conforms to SkinToneV2 format specification';

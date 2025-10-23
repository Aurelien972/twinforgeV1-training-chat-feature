/*
  # Add Complete Payload Fields to body_scans Table

  ## Overview
  This migration adds critical fields to the body_scans table to support complete avatar payload persistence.
  These fields are essential for proper data retrieval on the Avatar and Projection pages.

  ## New Columns Added

  ### 1. `resolved_gender` (text)
  - Purpose: Stores the gender determined during scan processing
  - Values: 'masculine' or 'feminine'
  - Required for: Avatar viewer initialization, projection calculations
  - Impact: Fixes "resolvedGender missing" validation error

  ### 2. `morph3d` to `morph_values` (jsonb)
  - Purpose: Rename for clarity - stores final shape parameters
  - Contains: Morphological values (e.g., bodybuilderSize, pearFigure)
  - Required for: 3D avatar rendering

  ### 3. `gltf_model_id` (text)
  - Purpose: Identifies which 3D model to load
  - Format: gender_version (e.g., 'masculine_v4.13')
  - Required for: Model loader

  ### 4. `material_config_version` (text)
  - Purpose: Tracks material system version
  - Values: 'pbr-v2', 'legacy', etc.
  - Required for: Material configuration

  ### 5. `mapping_version` (text)
  - Purpose: Tracks morphology mapping version used
  - Values: 'v1.0', 'v2.0', etc.
  - Required for: Validation and compatibility

  ### 6. `avatar_version` (text)
  - Purpose: Tracks complete avatar payload version
  - Values: 'v1.0', 'v2.0', etc.
  - Required for: Payload validation

  ### 7. `weight` (numeric)
  - Purpose: User weight at scan time
  - Required for: Projection calculations, BMI

  ### 8. `body_fat_percentage` (numeric)
  - Purpose: Estimated body fat %
  - Required for: Projection calculations

  ### 9. `bmi` (numeric)
  - Purpose: Body Mass Index
  - Required for: Health metrics, projection

  ### 10. `waist_circumference` (numeric)
  - Purpose: Waist measurement in cm
  - Required for: Projection calculations

  ### 11. `raw_measurements` (jsonb)
  - Purpose: All raw measurements from vision analysis
  - Contains: chest_cm, hips_cm, height_cm, etc.
  - Required for: Detailed metrics

  ## Security
  - All columns are nullable to maintain backward compatibility
  - Existing RLS policies continue to apply
  - No breaking changes to existing queries

  ## Migration Notes
  - Safe to run on production (non-destructive)
  - Existing scans will have NULL values for new fields
  - New scans will populate all fields
  - Gradual migration as users perform new scans
*/

-- Add resolved_gender column
ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS resolved_gender text;

-- Rename morph3d to morph_values for clarity (if morph3d exists and morph_values doesn't)
DO $$
BEGIN
  -- Check if morph3d exists and morph_values doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'body_scans' AND column_name = 'morph3d'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'body_scans' AND column_name = 'morph_values'
  ) THEN
    -- Copy data from morph3d to new morph_values column
    ALTER TABLE body_scans ADD COLUMN morph_values jsonb;
    UPDATE body_scans SET morph_values = morph3d WHERE morph3d IS NOT NULL;

    -- Note: We don't drop morph3d to maintain backward compatibility
    -- It will be deprecated in a future migration
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'body_scans' AND column_name = 'morph_values'
  ) THEN
    -- If neither exists, just create morph_values
    ALTER TABLE body_scans ADD COLUMN morph_values jsonb;
  END IF;
END $$;

-- Add model and version tracking columns
ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS gltf_model_id text;

ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS material_config_version text;

ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS mapping_version text;

ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS avatar_version text;

-- Add body metrics columns
ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS weight numeric(5, 2);

ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS body_fat_percentage numeric(5, 2);

ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS bmi numeric(5, 2);

ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS waist_circumference numeric(5, 2);

ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS raw_measurements jsonb;

-- Create index on resolved_gender for faster queries
CREATE INDEX IF NOT EXISTS idx_body_scans_resolved_gender
ON body_scans(resolved_gender)
WHERE resolved_gender IS NOT NULL;

-- Create index on avatar_version for version-specific queries
CREATE INDEX IF NOT EXISTS idx_body_scans_avatar_version
ON body_scans(avatar_version)
WHERE avatar_version IS NOT NULL;

-- Create composite index for user + avatar version queries
CREATE INDEX IF NOT EXISTS idx_body_scans_user_avatar_version
ON body_scans(user_id, avatar_version DESC, created_at DESC)
WHERE avatar_version IS NOT NULL;

-- Create GIN index on morph_values for morphological queries
CREATE INDEX IF NOT EXISTS idx_body_scans_morph_values_gin
ON body_scans USING gin(morph_values)
WHERE morph_values IS NOT NULL;

-- Create GIN index on raw_measurements for metrics queries
CREATE INDEX IF NOT EXISTS idx_body_scans_raw_measurements_gin
ON body_scans USING gin(raw_measurements)
WHERE raw_measurements IS NOT NULL;

-- Add check constraint for resolved_gender values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'body_scans' AND constraint_name = 'check_resolved_gender_valid'
  ) THEN
    ALTER TABLE body_scans
    ADD CONSTRAINT check_resolved_gender_valid
    CHECK (resolved_gender IS NULL OR resolved_gender IN ('masculine', 'feminine'));
  END IF;
END $$;

-- Add check constraint for avatar_version format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'body_scans' AND constraint_name = 'check_avatar_version_format'
  ) THEN
    ALTER TABLE body_scans
    ADD CONSTRAINT check_avatar_version_format
    CHECK (avatar_version IS NULL OR avatar_version ~ '^v[0-9]+\.[0-9]+$');
  END IF;
END $$;

-- Add check constraints for numeric ranges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'body_scans' AND constraint_name = 'check_weight_range'
  ) THEN
    ALTER TABLE body_scans
    ADD CONSTRAINT check_weight_range
    CHECK (weight IS NULL OR (weight >= 20 AND weight <= 500));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'body_scans' AND constraint_name = 'check_body_fat_range'
  ) THEN
    ALTER TABLE body_scans
    ADD CONSTRAINT check_body_fat_range
    CHECK (body_fat_percentage IS NULL OR (body_fat_percentage >= 0 AND body_fat_percentage <= 100));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'body_scans' AND constraint_name = 'check_bmi_range'
  ) THEN
    ALTER TABLE body_scans
    ADD CONSTRAINT check_bmi_range
    CHECK (bmi IS NULL OR (bmi >= 10 AND bmi <= 100));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'body_scans' AND constraint_name = 'check_waist_range'
  ) THEN
    ALTER TABLE body_scans
    ADD CONSTRAINT check_waist_range
    CHECK (waist_circumference IS NULL OR (waist_circumference >= 30 AND waist_circumference <= 300));
  END IF;
END $$;

-- Add comment to table documenting the complete payload structure
COMMENT ON TABLE body_scans IS 'Body scan data with complete avatar payload (v2.0). Includes morphological data, metrics, and material configuration for 3D avatar rendering and projection calculations.';

-- Add comments on key columns
COMMENT ON COLUMN body_scans.resolved_gender IS 'Gender determined during scan processing (masculine|feminine). Required for avatar rendering and projection.';
COMMENT ON COLUMN body_scans.morph_values IS 'Final shape parameters (morphological values) after AI refinement and K5 envelope validation. Used for 3D avatar rendering.';
COMMENT ON COLUMN body_scans.limb_masses IS 'Limb mass distribution values for bone scaling. Applied to skeleton during avatar rendering.';
COMMENT ON COLUMN body_scans.skin_tone IS 'DEPRECATED: Use skin_tone_map_v2. Legacy single-value skin tone.';
COMMENT ON COLUMN body_scans.skin_tone_map_v2 IS 'Multi-zone skin tone map in V2 format. Contains rgb, hex, srgb_f32, linear_f32, and confidence data.';
COMMENT ON COLUMN body_scans.gltf_model_id IS 'Identifier for the 3D model to load (format: gender_version, e.g., masculine_v4.13).';
COMMENT ON COLUMN body_scans.material_config_version IS 'Material system version (pbr-v2, legacy, etc.). Determines which material configurator to use.';
COMMENT ON COLUMN body_scans.mapping_version IS 'Morphology mapping version used for this scan (v1.0, v2.0, etc.).';
COMMENT ON COLUMN body_scans.avatar_version IS 'Complete avatar payload version (v1.0, v2.0, etc.). Used for validation and compatibility checks.';
COMMENT ON COLUMN body_scans.weight IS 'User weight in kg at scan time. Used for BMI calculation and projections.';
COMMENT ON COLUMN body_scans.body_fat_percentage IS 'Estimated body fat percentage (0-100). Derived from vision analysis and measurements.';
COMMENT ON COLUMN body_scans.bmi IS 'Body Mass Index calculated from weight and height.';
COMMENT ON COLUMN body_scans.waist_circumference IS 'Waist measurement in cm. Key metric for health and projection calculations.';
COMMENT ON COLUMN body_scans.raw_measurements IS 'Complete set of raw measurements from vision analysis (chest_cm, hips_cm, height_cm, etc.).';

-- Log migration success
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully: Added complete payload fields to body_scans table';
  RAISE NOTICE '📊 New fields: resolved_gender, morph_values, gltf_model_id, material_config_version, mapping_version, avatar_version';
  RAISE NOTICE '📏 New metrics: weight, body_fat_percentage, bmi, waist_circumference, raw_measurements';
  RAISE NOTICE '🔍 Created 5 new indexes for optimized queries';
  RAISE NOTICE '✨ Backward compatibility maintained - existing scans unaffected';
END $$;

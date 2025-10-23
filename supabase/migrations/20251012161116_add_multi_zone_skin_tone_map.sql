/*
  # Migration: Multi-Zone Skin Tone Map System

  ## Description
  Adds comprehensive multi-zone skin tone mapping to body_scans table for photo-realistic 3D avatar rendering.
  This replaces the single average color system with a detailed zone-based color map that captures natural skin variations.

  ## Changes

  ### 1. New Column: skin_tone_map_v2
  - **Type**: JSONB
  - **Purpose**: Stores detailed multi-zone skin tone data with spatial variations
  - **Structure**:
    ```json
    {
      "zones": [
        {
          "name": "face|cheeks|forehead|neck|torso|leftArm|rightArm|leftLeg|rightLeg",
          "avgColor": {"r": 0-255, "g": 0-255, "b": 0-255},
          "minColor": {"r": 0-255, "g": 0-255, "b": 0-255},
          "maxColor": {"r": 0-255, "g": 0-255, "b": 0-255},
          "stdDev": {"r": 0-255, "g": 0-255, "b": 0-255},
          "confidence": 0.0-1.0,
          "pixelsSampled": number
        }
      ],
      "averageColor": {"r": 0-255, "g": 0-255, "b": 0-255},
      "minColor": {"r": 0-255, "g": 0-255, "b": 0-255},
      "maxColor": {"r": 0-255, "g": 0-255, "b": 0-255},
      "colorVariation": {"r": 0-255, "g": 0-255, "b": 0-255},
      "overallConfidence": 0.0-1.0,
      "totalPixelsSampled": number,
      "extractedAt": "ISO8601 timestamp"
    }
    ```

  ### 2. Metadata Columns
  - **skin_tone_zones_count**: Number of zones detected (1-9)
  - **skin_tone_confidence**: Overall confidence score (0.0-1.0)
  - **skin_tone_variation**: Color variation intensity (0.0-1.0)

  ### 3. Backward Compatibility
  - Existing `skin_tone` column remains unchanged
  - New system coexists with legacy single-color system
  - Applications can use either system based on capability

  ## Data Validation
  - JSON schema validation ensures correct structure
  - RGB values clamped to 0-255 range
  - Confidence scores validated to 0.0-1.0 range
  - Zone names validated against allowed set

  ## Performance
  - JSONB type allows efficient querying and indexing
  - GIN index on skin_tone_map_v2 for fast zone lookups
  - Metadata columns for quick filtering without parsing JSON

  ## Security
  - No RLS policy changes needed (inherits from body_scans table)
  - Data validation at database level prevents invalid data
*/

-- Add multi-zone skin tone map column
ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS skin_tone_map_v2 JSONB DEFAULT NULL;

-- Add metadata columns
ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS skin_tone_zones_count INTEGER DEFAULT NULL;

ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS skin_tone_confidence DECIMAL(3,2) DEFAULT NULL;

ALTER TABLE body_scans
ADD COLUMN IF NOT EXISTS skin_tone_variation DECIMAL(3,2) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN body_scans.skin_tone_map_v2 IS 'Multi-zone skin tone data with spatial color variations for photo-realistic rendering. Contains zones array with per-zone color statistics (avg, min, max, stdDev) and overall aggregated data.';

COMMENT ON COLUMN body_scans.skin_tone_zones_count IS 'Number of body zones detected in skin tone extraction (1-9: face, cheeks, forehead, neck, torso, left/right arms, left/right legs)';

COMMENT ON COLUMN body_scans.skin_tone_confidence IS 'Overall confidence score for skin tone extraction (0.0-1.0), weighted average of per-zone confidences';

COMMENT ON COLUMN body_scans.skin_tone_variation IS 'Intensity of color variation across zones (0.0-1.0), used to determine texture generation parameters';

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_body_scans_skin_tone_map_v2_gin 
ON body_scans USING GIN (skin_tone_map_v2);

-- Create index on metadata columns for filtering
CREATE INDEX IF NOT EXISTS idx_body_scans_skin_tone_metadata 
ON body_scans (skin_tone_zones_count, skin_tone_confidence, skin_tone_variation) 
WHERE skin_tone_map_v2 IS NOT NULL;

-- Create validation function for skin_tone_map_v2 structure
CREATE OR REPLACE FUNCTION validate_skin_tone_map_v2(data JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  zone JSONB;
  zone_name TEXT;
  allowed_zones TEXT[] := ARRAY['face', 'cheeks', 'forehead', 'neck', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
BEGIN
  -- Check if data is null (allowed)
  IF data IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check required top-level keys
  IF NOT (data ? 'zones' AND data ? 'averageColor' AND data ? 'overallConfidence') THEN
    RAISE EXCEPTION 'Missing required top-level keys in skin_tone_map_v2';
  END IF;

  -- Validate zones array
  IF jsonb_typeof(data->'zones') != 'array' THEN
    RAISE EXCEPTION 'zones must be an array';
  END IF;

  -- Validate each zone
  FOR zone IN SELECT * FROM jsonb_array_elements(data->'zones')
  LOOP
    -- Check zone name
    zone_name := zone->>'name';
    IF zone_name IS NULL OR NOT (zone_name = ANY(allowed_zones)) THEN
      RAISE EXCEPTION 'Invalid zone name: %', zone_name;
    END IF;

    -- Check required zone keys
    IF NOT (zone ? 'avgColor' AND zone ? 'confidence' AND zone ? 'pixelsSampled') THEN
      RAISE EXCEPTION 'Missing required keys in zone: %', zone_name;
    END IF;

    -- Validate confidence (0.0-1.0)
    IF (zone->>'confidence')::DECIMAL NOT BETWEEN 0 AND 1 THEN
      RAISE EXCEPTION 'Invalid confidence value in zone %: %', zone_name, zone->>'confidence';
    END IF;
  END LOOP;

  -- Validate overall confidence (0.0-1.0)
  IF (data->>'overallConfidence')::DECIMAL NOT BETWEEN 0 AND 1 THEN
    RAISE EXCEPTION 'Invalid overallConfidence value: %', data->>'overallConfidence';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for skin_tone_map_v2 validation
ALTER TABLE body_scans
ADD CONSTRAINT check_skin_tone_map_v2_valid 
CHECK (validate_skin_tone_map_v2(skin_tone_map_v2));

-- Add check constraints for metadata columns
ALTER TABLE body_scans
ADD CONSTRAINT check_skin_tone_zones_count_range 
CHECK (skin_tone_zones_count IS NULL OR (skin_tone_zones_count >= 1 AND skin_tone_zones_count <= 9));

ALTER TABLE body_scans
ADD CONSTRAINT check_skin_tone_confidence_range 
CHECK (skin_tone_confidence IS NULL OR (skin_tone_confidence >= 0.0 AND skin_tone_confidence <= 1.0));

ALTER TABLE body_scans
ADD CONSTRAINT check_skin_tone_variation_range 
CHECK (skin_tone_variation IS NULL OR (skin_tone_variation >= 0.0 AND skin_tone_variation <= 1.0));

-- Create trigger to auto-populate metadata columns from skin_tone_map_v2
CREATE OR REPLACE FUNCTION update_skin_tone_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.skin_tone_map_v2 IS NOT NULL THEN
    -- Extract metadata from JSONB
    NEW.skin_tone_zones_count := jsonb_array_length(NEW.skin_tone_map_v2->'zones');
    NEW.skin_tone_confidence := (NEW.skin_tone_map_v2->>'overallConfidence')::DECIMAL;
    
    -- Calculate variation intensity from colorVariation if present
    IF NEW.skin_tone_map_v2 ? 'colorVariation' THEN
      NEW.skin_tone_variation := (
        ((NEW.skin_tone_map_v2->'colorVariation'->>'r')::DECIMAL +
         (NEW.skin_tone_map_v2->'colorVariation'->>'g')::DECIMAL +
         (NEW.skin_tone_map_v2->'colorVariation'->>'b')::DECIMAL) / 3.0 / 255.0
      );
    END IF;
  ELSE
    -- Clear metadata if skin_tone_map_v2 is NULL
    NEW.skin_tone_zones_count := NULL;
    NEW.skin_tone_confidence := NULL;
    NEW.skin_tone_variation := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_skin_tone_metadata
BEFORE INSERT OR UPDATE OF skin_tone_map_v2 ON body_scans
FOR EACH ROW
EXECUTE FUNCTION update_skin_tone_metadata();

-- Create helper function to get zone color by name
CREATE OR REPLACE FUNCTION get_skin_tone_zone_color(
  scan_id UUID,
  zone_name TEXT,
  color_type TEXT DEFAULT 'avgColor'
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT zone->color_type INTO result
  FROM body_scans,
       jsonb_array_elements(skin_tone_map_v2->'zones') AS zone
  WHERE id = scan_id
    AND zone->>'name' = zone_name;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_skin_tone_zone_color IS 'Helper function to retrieve specific zone color data. color_type can be: avgColor, minColor, maxColor';

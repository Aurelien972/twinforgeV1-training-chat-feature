/*
  # Add arrow_config and muscle_highlight_config columns
  
  1. Modifications
    - Add `arrow_config` jsonb column for storing arrow metadata
    - Add `muscle_highlight_config` jsonb for muscle overlay metadata
    
  2. Purpose
    - Support diptych illustrations with arrow annotations
    - Enable muscle group highlighting overlays
    
  3. Validation
    - Add helper functions to validate JSON structure
    - Ensure backward compatibility with existing data
*/

-- Add missing jsonb columns
ALTER TABLE illustration_library
  ADD COLUMN IF NOT EXISTS arrow_config jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS muscle_highlight_config jsonb DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN illustration_library.arrow_config IS 'JSON config for arrows: {"macro": {...}, "micro": [{...}], "colors": {...}}';
COMMENT ON COLUMN illustration_library.muscle_highlight_config IS 'JSON config for muscle highlighting: {"muscles": ["quadriceps", "glutes"], "opacity": 0.3, "color": "#ff0000"}';

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

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

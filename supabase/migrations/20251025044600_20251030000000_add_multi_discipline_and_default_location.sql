/*
  # Multi-Discipline & Default Location System

  1. New Columns
    - `preferred_disciplines` (text[]) - Array of user's selected disciplines
    - `default_discipline` (text) - User's primary/default discipline
    - `is_default` (boolean) - Mark default training location
    - `last_used_at` (timestamptz) - Track location usage

  2. Helper Functions
    - `get_user_default_location` - Get user's default training location with full details
    - `set_default_location` - Set a location as default (unsets previous default)
    - `update_location_last_used` - Trigger to update last_used_at automatically

  3. Security
    - All functions use auth.uid() for security
    - RLS policies already exist on user_profile and training_locations
*/

-- Add preferred_disciplines and default_discipline to user_profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'preferred_disciplines'
  ) THEN
    ALTER TABLE user_profile
    ADD COLUMN preferred_disciplines text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'default_discipline'
  ) THEN
    ALTER TABLE user_profile
    ADD COLUMN default_discipline text;
  END IF;
END $$;

-- Add is_default and last_used_at to training_locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_locations' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE training_locations
    ADD COLUMN is_default boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_locations' AND column_name = 'last_used_at'
  ) THEN
    ALTER TABLE training_locations
    ADD COLUMN last_used_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index on is_default for faster queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'training_locations' AND indexname = 'idx_training_locations_default'
  ) THEN
    CREATE INDEX idx_training_locations_default
    ON training_locations(user_id, is_default)
    WHERE is_default = true;
  END IF;
END $$;

-- Function: Get user's default training location with full details
CREATE OR REPLACE FUNCTION get_user_default_location(p_user_id uuid)
RETURNS TABLE (
  id text,
  user_id uuid,
  name text,
  type text,
  photos jsonb,
  equipment jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  is_default boolean,
  last_used_at timestamptz
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est authentifié et correspond
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    tl.id,
    tl.user_id,
    tl.name,
    tl.type,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id', tlp.id,
        'photo_url', tlp.photo_url,
        'order_index', tlp.order_index,
        'uploaded_at', tlp.uploaded_at
      ) ORDER BY jsonb_build_object(
        'id', tlp.id,
        'photo_url', tlp.photo_url,
        'order_index', tlp.order_index,
        'uploaded_at', tlp.uploaded_at
      )->>'order_index'
    ) FILTER (WHERE tlp.id IS NOT NULL) as photos,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id', tle.id,
        'equipment_name', tle.equipment_name,
        'equipment_type', tle.equipment_type,
        'brand', tle.brand,
        'model', tle.model
      )
    ) FILTER (WHERE tle.id IS NOT NULL) as equipment,
    tl.created_at,
    tl.updated_at,
    tl.is_default,
    tl.last_used_at
  FROM training_locations tl
  LEFT JOIN training_location_photos tlp ON tlp.location_id = tl.id
  LEFT JOIN training_location_equipment tle ON tle.location_id = tl.id
  WHERE tl.user_id = p_user_id
    AND tl.is_default = true
  GROUP BY tl.id, tl.user_id, tl.name, tl.type, tl.created_at, tl.updated_at, tl.is_default, tl.last_used_at
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Set a location as default (unsets previous default)
CREATE OR REPLACE FUNCTION set_default_location(
  p_user_id uuid,
  p_location_id text
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est authentifié et correspond
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Vérifier que le lieu appartient à l'utilisateur
  IF NOT EXISTS (
    SELECT 1 FROM training_locations
    WHERE id = p_location_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Location not found or does not belong to user';
  END IF;

  -- Retirer le flag default de tous les lieux de l'utilisateur
  UPDATE training_locations
  SET is_default = false,
      updated_at = now()
  WHERE user_id = p_user_id AND is_default = true;

  -- Définir le nouveau lieu par défaut
  UPDATE training_locations
  SET is_default = true,
      last_used_at = now(),
      updated_at = now()
  WHERE id = p_location_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update last_used_at when location is used in a training session
CREATE OR REPLACE FUNCTION update_location_last_used()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour le last_used_at du lieu référencé
  IF NEW.location_id IS NOT NULL THEN
    UPDATE training_locations
    SET last_used_at = now()
    WHERE id = NEW.location_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_update_location_last_used'
  ) THEN
    CREATE TRIGGER trigger_update_location_last_used
      AFTER INSERT ON training_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_location_last_used();
  END IF;
END $$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_default_location(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION set_default_location(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_location_last_used() TO authenticated;
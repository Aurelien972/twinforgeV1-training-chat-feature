/*
  # Fix: Add GPS Tracking Columns to training_sessions

  ## Summary
  This migration adds the missing GPS tracking columns to the training_sessions table
  that were defined in migration 20251010004508 but not yet applied to the database.

  ## Changes
  1. Add `location_id` column (FK to training_locations)
  2. Add `gps_data` column (JSONB array for GPS coordinates)
  3. Add `route_summary` column (JSONB for route metadata)
  4. Create appropriate indexes for performance

  ## Notes
  - Uses conditional logic to avoid errors if columns already exist
  - GPS data stored as JSONB array: [{lat, lng, timestamp, altitude?, speed?, heartRate?}]
  - Route summary for quick access: {distance, duration, avgPace, elevationGain}
*/

-- =====================================================
-- 1. ADD LOCATION_ID TO TRAINING_SESSIONS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'training_sessions' 
    AND column_name = 'location_id'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN location_id uuid REFERENCES training_locations(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_training_sessions_location_id
    ON training_sessions(location_id);
  END IF;
END $$;

-- =====================================================
-- 2. ADD GPS TRACKING COLUMNS TO TRAINING_SESSIONS
-- =====================================================

DO $$
BEGIN
  -- GPS coordinates array: [{lat, lng, timestamp, altitude?, speed?, heartRate?}]
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'training_sessions' 
    AND column_name = 'gps_data'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN gps_data jsonb DEFAULT '[]'::jsonb;

    -- Create GIN index for efficient JSONB queries
    CREATE INDEX IF NOT EXISTS idx_training_sessions_gps_data
    ON training_sessions USING gin(gps_data);
  END IF;

  -- Route summary: {distance, duration, avgPace, elevationGain, elevationLoss, maxSpeed}
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'training_sessions' 
    AND column_name = 'route_summary'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN route_summary jsonb;
  END IF;
END $$;

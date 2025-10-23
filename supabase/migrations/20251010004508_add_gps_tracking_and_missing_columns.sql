/*
  # Add GPS Tracking and Missing Columns

  1. Changes to training_sessions table
    - Add location_id column (FK to training_locations)
    - Add gps_data JSONB for storing GPS coordinates
    - Add route_summary JSONB for route metadata

  2. Changes to training_goals table
    - Add is_active column to track active goals

  3. Create training_session_wearable_metrics table
    - Store wearable metrics per session
    - Heart rate, HRV, calories, zones distribution

  4. Create profiles table if not exists
    - Basic user profile info

  5. Security
    - Enable RLS on all new tables
    - Add appropriate policies

  ## Best Practices Applied
  - GPS data stored as GeoJSON LineString in JSONB
  - Coordinates array for flexibility: [{lat, lng, timestamp, altitude?, speed?, heartRate?}]
  - Route summary for quick access: {distance, duration, avgPace, elevationGain}
  - Efficient indexing for geospatial queries
*/

-- =====================================================
-- 1. ADD LOCATION_ID TO TRAINING_SESSIONS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'location_id'
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
    WHERE table_name = 'training_sessions' AND column_name = 'gps_data'
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
    WHERE table_name = 'training_sessions' AND column_name = 'route_summary'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN route_summary jsonb;
  END IF;
END $$;

-- =====================================================
-- 3. ADD IS_ACTIVE TO TRAINING_GOALS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_goals' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE training_goals
    ADD COLUMN is_active boolean DEFAULT true;

    CREATE INDEX IF NOT EXISTS idx_training_goals_is_active
    ON training_goals(is_active) WHERE is_active = true;
  END IF;
END $$;

-- =====================================================
-- 4. CREATE PROFILES TABLE IF NOT EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,

  -- Fitness Profile
  fitness_level text, -- beginner, intermediate, advanced, elite
  training_experience_years integer,

  -- Physical Metrics
  birth_date date,
  gender text,
  height_cm integer,
  weight_kg numeric(5,2),

  -- Preferences
  preferred_language text DEFAULT 'fr',
  units_system text DEFAULT 'metric', -- metric or imperial

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_fitness_level CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
  CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  CONSTRAINT valid_units CHECK (units_system IN ('metric', 'imperial'))
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 5. CREATE TRAINING_SESSION_WEARABLE_METRICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS training_session_wearable_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Heart Rate Metrics
  avg_heart_rate integer,
  max_heart_rate integer,
  min_heart_rate integer,
  resting_heart_rate integer,

  -- HRV Metrics
  hrv_avg numeric(5,1), -- ms
  hrv_rmssd numeric(5,1), -- Root mean square of successive differences

  -- Calorie Metrics
  calories_total integer,
  calories_active integer,

  -- Heart Rate Zones (minutes spent in each zone)
  zone_1_minutes integer DEFAULT 0,
  zone_2_minutes integer DEFAULT 0,
  zone_3_minutes integer DEFAULT 0,
  zone_4_minutes integer DEFAULT 0,
  zone_5_minutes integer DEFAULT 0,

  -- Recovery Metrics
  recovery_score integer, -- 0-100
  sleep_hours numeric(4,2),

  -- Performance Metrics
  vo2_max numeric(5,2),
  training_load integer, -- Acute training load
  strain_score numeric(4,1), -- Daily strain

  -- GPS/Movement Metrics (for endurance)
  distance_meters integer,
  avg_pace_min_per_km numeric(5,2),
  avg_speed_kmh numeric(5,2),
  elevation_gain_meters integer,
  elevation_loss_meters integer,

  -- Raw Data Reference
  wearable_device text, -- 'apple_watch', 'garmin', 'whoop', etc.
  raw_data jsonb, -- Store complete raw data from wearable

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_session_metrics UNIQUE (session_id),
  CONSTRAINT valid_heart_rate CHECK (avg_heart_rate IS NULL OR (avg_heart_rate >= 30 AND avg_heart_rate <= 220)),
  CONSTRAINT valid_hrv CHECK (hrv_avg IS NULL OR hrv_avg >= 0),
  CONSTRAINT valid_recovery CHECK (recovery_score IS NULL OR (recovery_score >= 0 AND recovery_score <= 100))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wearable_metrics_session_id ON training_session_wearable_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_wearable_metrics_user_id ON training_session_wearable_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_metrics_created_at ON training_session_wearable_metrics(created_at);

-- Enable RLS
ALTER TABLE training_session_wearable_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own wearable metrics"
  ON training_session_wearable_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wearable metrics"
  ON training_session_wearable_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wearable metrics"
  ON training_session_wearable_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wearable metrics"
  ON training_session_wearable_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS FOR GPS
-- =====================================================

-- Function to calculate distance between two GPS points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_gps_distance(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
) RETURNS numeric AS $$
DECLARE
  earth_radius numeric := 6371000; -- Earth radius in meters
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);

  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate total distance from GPS data
CREATE OR REPLACE FUNCTION calculate_route_distance(gps_data_param jsonb)
RETURNS numeric AS $$
DECLARE
  total_distance numeric := 0;
  point_count integer;
  i integer;
  lat1 numeric;
  lon1 numeric;
  lat2 numeric;
  lon2 numeric;
BEGIN
  point_count := jsonb_array_length(gps_data_param);

  IF point_count < 2 THEN
    RETURN 0;
  END IF;

  FOR i IN 0..(point_count - 2) LOOP
    lat1 := (gps_data_param->i->>'lat')::numeric;
    lon1 := (gps_data_param->i->>'lng')::numeric;
    lat2 := (gps_data_param->(i+1)->>'lat')::numeric;
    lon2 := (gps_data_param->(i+1)->>'lng')::numeric;

    total_distance := total_distance + calculate_gps_distance(lat1, lon1, lat2, lon2);
  END LOOP;

  RETURN total_distance;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

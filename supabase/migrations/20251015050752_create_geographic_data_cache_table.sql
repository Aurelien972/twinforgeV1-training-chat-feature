/*
  # Geographic and Environmental Data System

  1. Purpose
    - Store environmental and weather data for users based on their location
    - Cache geographic data to reduce API calls
    - Enable personalized hydration recommendations based on weather conditions
    - Track air quality and environmental exposure for health insights

  2. New Tables
    - `geographic_data_cache`
      - Stores cached weather, air quality, and environmental data
      - Auto-expires after 1 hour
      - Linked to user_id and location (country_code, city)

  3. Structure
    - user_id (uuid, foreign key to auth.users)
    - country_code (text, required)
    - city (text, optional)
    - location_key (text, unique index for fast lookup)
    - weather_data (jsonb, contains temperature, humidity, conditions)
    - air_quality_data (jsonb, contains AQI, pollutants)
    - environmental_data (jsonb, exposure levels and hazards)
    - hydration_data (jsonb, personalized recommendations)
    - created_at (timestamptz, auto)
    - expires_at (timestamptz, set to created_at + 1 hour)

  4. Security
    - Enable RLS
    - Users can only read/write their own data
    - Automatic cleanup of expired data

  5. Indexes
    - user_id for fast user lookups
    - location_key for cache hits
    - expires_at for cleanup queries
*/

-- Create geographic_data_cache table
CREATE TABLE IF NOT EXISTS geographic_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  city text,
  location_key text NOT NULL,
  weather_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  air_quality_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  environmental_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  hydration_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  CONSTRAINT unique_user_location UNIQUE(user_id, location_key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_geographic_cache_user_id
  ON geographic_data_cache(user_id);

CREATE INDEX IF NOT EXISTS idx_geographic_cache_location_key
  ON geographic_data_cache(location_key);

CREATE INDEX IF NOT EXISTS idx_geographic_cache_expires_at
  ON geographic_data_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_geographic_cache_country_code
  ON geographic_data_cache(country_code);

-- Enable Row Level Security
ALTER TABLE geographic_data_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for geographic_data_cache

-- Users can read their own geographic data
CREATE POLICY "Users can read own geographic data"
  ON geographic_data_cache
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own geographic data
CREATE POLICY "Users can insert own geographic data"
  ON geographic_data_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own geographic data
CREATE POLICY "Users can update own geographic data"
  ON geographic_data_cache
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own geographic data
CREATE POLICY "Users can delete own geographic data"
  ON geographic_data_cache
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean up expired geographic data
CREATE OR REPLACE FUNCTION cleanup_expired_geographic_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM geographic_data_cache
  WHERE expires_at < now();
END;
$$;

-- Create a comment on the function
COMMENT ON FUNCTION cleanup_expired_geographic_data() IS
  'Removes expired geographic data entries from the cache. Should be called periodically via cron or manually.';

-- Add helpful comments
COMMENT ON TABLE geographic_data_cache IS
  'Caches geographic, weather, and air quality data for users. Data expires after 1 hour.';

COMMENT ON COLUMN geographic_data_cache.location_key IS
  'Unique identifier for location (e.g., "FR_Paris" or "US_NewYork"). Used for cache lookups.';

COMMENT ON COLUMN geographic_data_cache.weather_data IS
  'Weather information including temperature, humidity, precipitation, UV index.';

COMMENT ON COLUMN geographic_data_cache.air_quality_data IS
  'Air quality metrics including AQI, PM2.5, PM10, and other pollutants.';

COMMENT ON COLUMN geographic_data_cache.environmental_data IS
  'Environmental exposure data including pollution sources and protective measures.';

COMMENT ON COLUMN geographic_data_cache.hydration_data IS
  'Personalized hydration recommendations based on weather, activity level, and user profile.';
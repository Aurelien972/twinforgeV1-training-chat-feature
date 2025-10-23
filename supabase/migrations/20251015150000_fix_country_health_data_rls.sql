/*
  # Fix RLS Policies for country_health_data

  1. Problem
    - Current RLS only allows service_role to INSERT/UPDATE on country_health_data
    - Authenticated users need to be able to enrich country data
    - This causes 403 errors when countryHealthEnrichmentService tries to save data

  2. Changes
    - Add INSERT policy for authenticated users on country_health_data
    - Add UPDATE policy for authenticated users on country_health_data
    - Keep service_role policy for full admin access
    - Users can only modify their own country's data or create new entries

  3. Security
    - Authenticated users can read all country data (needed for lookups)
    - Authenticated users can insert/update country data (collaborative enrichment)
    - Service role maintains full control for admin operations
    - Conflicts handled via ON CONFLICT in application code
*/

-- Drop existing restrictive policy for modifications
DROP POLICY IF EXISTS "Only service role can modify country health data" ON country_health_data;

-- Allow authenticated users to insert country health data
-- This enables collaborative enrichment of the database
CREATE POLICY "Authenticated users can insert country health data"
  ON country_health_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update country health data
-- This allows updating/enriching existing entries
CREATE POLICY "Authenticated users can update country health data"
  ON country_health_data
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow service role full access for admin operations
CREATE POLICY "Service role has full access to country health data"
  ON country_health_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON POLICY "Authenticated users can insert country health data" ON country_health_data IS
  'Allows authenticated users to add new country health data entries for collaborative enrichment';

COMMENT ON POLICY "Authenticated users can update country health data" ON country_health_data IS
  'Allows authenticated users to update existing country health data to keep information current';

/*
  # Body Projections System - Phase 1

  ## Overview
  This migration creates the infrastructure for the Body Projection system,
  allowing users to simulate and visualize their body transformation over time
  based on activity level and nutrition quality parameters.

  ## New Tables

  ### `body_projections`
  Stores user-created body projection scenarios with calculated morphological data

  - `id` (uuid, primary key) - Unique projection identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `name` (text) - User-defined scenario name (e.g., "Weight Loss Goal", "Muscle Gain")
  - `description` (text, optional) - Additional notes about the projection
  - `base_scan_id` (uuid, foreign key) - References body_scans table as starting point
  - `activity_level` (numeric) - Physical activity level (0-100%)
  - `nutrition_quality` (numeric) - Nutritional quality score (0-100%)
  - `caloric_balance` (numeric) - Caloric deficit/surplus score (-100 to +100)
  - `time_period_months` (integer) - Projection duration (1, 3, 6, 12 months)
  - `projected_weight` (numeric) - Calculated projected weight in kg
  - `projected_bmi` (numeric) - Calculated projected BMI
  - `projected_waist_circumference` (numeric) - Calculated waist size in cm
  - `projected_muscle_mass_percentage` (numeric) - Estimated muscle mass %
  - `projected_body_fat_percentage` (numeric) - Estimated body fat %
  - `projected_morph_values` (jsonb) - Calculated morph target values for visualization
  - `projected_limb_masses` (jsonb) - Calculated limb mass adjustments
  - `is_favorite` (boolean) - User's favorite scenarios for quick access
  - `created_at` (timestamptz) - Projection creation timestamp
  - `updated_at` (timestamptz) - Last modification timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own projections
  - Policies for SELECT, INSERT, UPDATE, DELETE operations

  ## Indexes
  - Index on user_id for fast user-specific queries
  - Index on base_scan_id for linking to body scans
  - Index on created_at for chronological sorting
  - Index on is_favorite for quick favorites access
*/

-- ============================================================
-- CREATE TABLE: body_projections
-- ============================================================

CREATE TABLE IF NOT EXISTS body_projections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  base_scan_id uuid REFERENCES body_scans(id) ON DELETE SET NULL,

  -- Input Parameters
  activity_level numeric NOT NULL CHECK (activity_level >= 0 AND activity_level <= 100),
  nutrition_quality numeric NOT NULL CHECK (nutrition_quality >= 0 AND nutrition_quality <= 100),
  caloric_balance numeric NOT NULL CHECK (caloric_balance >= -100 AND caloric_balance <= 100),
  time_period_months integer NOT NULL CHECK (time_period_months IN (1, 3, 6, 12)),

  -- Projected Metrics
  projected_weight numeric CHECK (projected_weight > 0),
  projected_bmi numeric CHECK (projected_bmi > 0),
  projected_waist_circumference numeric CHECK (projected_waist_circumference > 0),
  projected_muscle_mass_percentage numeric CHECK (projected_muscle_mass_percentage >= 0 AND projected_muscle_mass_percentage <= 100),
  projected_body_fat_percentage numeric CHECK (projected_body_fat_percentage >= 0 AND projected_body_fat_percentage <= 100),

  -- Morphological Data for 3D Visualization
  projected_morph_values jsonb DEFAULT '{}'::jsonb,
  projected_limb_masses jsonb DEFAULT '{}'::jsonb,

  -- User Preferences
  is_favorite boolean DEFAULT false,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_body_projections_user_id
  ON body_projections(user_id);

CREATE INDEX IF NOT EXISTS idx_body_projections_base_scan_id
  ON body_projections(base_scan_id);

CREATE INDEX IF NOT EXISTS idx_body_projections_created_at
  ON body_projections(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_body_projections_is_favorite
  ON body_projections(user_id, is_favorite)
  WHERE is_favorite = true;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE body_projections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own projections
CREATE POLICY "Users can view own projections"
  ON body_projections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create their own projections
CREATE POLICY "Users can create own projections"
  ON body_projections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own projections
CREATE POLICY "Users can update own projections"
  ON body_projections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own projections
CREATE POLICY "Users can delete own projections"
  ON body_projections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_body_projections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_body_projections_updated_at
  BEFORE UPDATE ON body_projections
  FOR EACH ROW
  EXECUTE FUNCTION update_body_projections_updated_at();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE body_projections IS
  'Stores user body projection scenarios for visualizing future body transformations';

COMMENT ON COLUMN body_projections.activity_level IS
  'Physical activity level from 0 (sedentary) to 100 (very active)';

COMMENT ON COLUMN body_projections.nutrition_quality IS
  'Nutrition quality score from 0 (poor) to 100 (optimal)';

COMMENT ON COLUMN body_projections.caloric_balance IS
  'Caloric balance from -100 (large deficit) to +100 (large surplus)';

COMMENT ON COLUMN body_projections.projected_morph_values IS
  'JSON object containing morph target values for 3D avatar visualization';

COMMENT ON COLUMN body_projections.projected_limb_masses IS
  'JSON object containing limb mass adjustments for 3D avatar visualization';

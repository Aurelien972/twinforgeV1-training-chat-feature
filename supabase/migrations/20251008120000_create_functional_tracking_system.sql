/*
  # Functional Training & CrossTraining Tracking System

  **Overview**: Complete tracking system for Functional Training, CrossFit, HIIT, and Circuit Training disciplines.

  ## 1. New Tables

  ### functional_skills
  Tracks user's personal records and skills for all functional movements:
  - Olympic lifts PRs (snatch, clean & jerk, etc.)
  - Gymnastic movements (muscle-ups, handstands, rope climbs)
  - Monostructural benchmarks (row, bike, ski erg times)
  - Weighted movements (thrusters, wall balls, kettlebell swings)

  **Columns**:
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `movement_name` (text, e.g., "Clean & Jerk", "Muscle-up")
  - `movement_category` (text: olympic, gymnastic, monostructural, weighted, bodyweight)
  - `pr_weight_kg` (numeric, for weighted movements)
  - `pr_reps` (integer, for bodyweight/endurance movements)
  - `pr_time_seconds` (numeric, for time-based movements like 500m row)
  - `pr_date` (timestamptz, when PR was achieved)
  - `technique_level` (text: learning, developing, proficient, mastered)
  - `scaling_used` (text: rx, scaled, foundations)
  - `notes` (text, optional notes)
  - `created_at`, `updated_at` (timestamptz)

  ### functional_benchmarks
  Tracks performance on famous benchmark WODs (Girl WODs, Hero WODs, custom):
  - Fran, Grace, Murph, Cindy, etc.
  - Custom benchmark WODs created by user
  - Historical progression tracking

  **Columns**:
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `benchmark_name` (text, e.g., "Fran", "Murph")
  - `benchmark_type` (text: girl, hero, custom)
  - `wod_format` (text: amrap, forTime, emom, tabata, chipper, ladder)
  - `wod_description` (text, full WOD description)
  - `best_score` (text, score representation - time, rounds+reps, reps)
  - `best_score_numeric` (numeric, for comparisons - seconds or total reps)
  - `scaling_level` (text: rx, scaled, foundations)
  - `attempt_count` (integer, how many times attempted)
  - `last_attempt_date` (timestamptz)
  - `pr_date` (timestamptz, when best score achieved)
  - `created_at`, `updated_at` (timestamptz)

  ### functional_wod_data
  Detailed data for each WOD session:
  - Format-specific metrics (rounds, time, reps)
  - Movement breakdown
  - Intensity metrics

  **Columns**:
  - `id` (uuid, primary key)
  - `session_id` (uuid, references training_sessions)
  - `user_id` (uuid, references profiles)
  - `wod_format` (text: amrap, emom, tabata, forTime, chipper, ladder)
  - `wod_name` (text, optional name like "Fran")
  - `time_cap_minutes` (integer, time limit)
  - `rounds_completed` (integer, for AMRAP/Chipper)
  - `additional_reps` (integer, reps beyond last full round)
  - `completion_time_seconds` (integer, for For Time WODs)
  - `total_reps` (integer, total rep count)
  - `calories_burned` (integer, estimated or measured)
  - `movements_performed` (jsonb, array of movements with reps/weights)
  - `scaling_modifications` (jsonb, any scaling applied)
  - `technique_breaks` (integer, times had to break due to technique)
  - `average_heart_rate` (integer, if tracked)
  - `peak_heart_rate` (integer, if tracked)
  - `perceived_difficulty` (integer, 1-10 scale)
  - `metabolic_intensity` (text: low, moderate, high, extreme)
  - `olympic_lifts_performed` (boolean, if includes technical lifts)
  - `gymnastic_skills_performed` (boolean, if includes advanced gymnastics)
  - `notes` (text, optional notes)
  - `created_at`, `updated_at` (timestamptz)

  ### functional_session_data
  Summary analytics for functional training sessions:
  - Volume by movement category
  - Technical execution quality
  - PRs achieved

  **Columns**:
  - `id` (uuid, primary key)
  - `session_id` (uuid, references training_sessions)
  - `user_id` (uuid, references profiles)
  - `total_volume_kg` (integer, total weight moved)
  - `olympic_volume_kg` (integer, Olympic lift volume)
  - `gymnastic_volume_reps` (integer, gymnastic movement reps)
  - `monostructural_calories` (integer, cardio work calories)
  - `movements_by_category` (jsonb, breakdown by category)
  - `prs_achieved` (jsonb, array of new PRs)
  - `technique_quality_score` (numeric, 1-10 average)
  - `consistency_rating` (text: excellent, good, inconsistent, poor)
  - `recommended_rest_hours` (integer, recovery recommendation)
  - `next_focus_areas` (jsonb, array of focus recommendations)
  - `created_at`, `updated_at` (timestamptz)

  ## 2. Security (Row Level Security)

  **Critical**: All tables enable RLS and restrict access to authenticated users viewing their own data only.

  ### Policies Created

  For each table:
  - SELECT: Users can view their own data (`auth.uid() = user_id`)
  - INSERT: Users can create their own data (`auth.uid() = user_id`)
  - UPDATE: Users can update their own data (`auth.uid() = user_id`)
  - DELETE: Users can delete their own data (`auth.uid() = user_id`)

  ## 3. Indexes for Performance

  Optimized indexes for common query patterns:
  - User lookups (user_id on all tables)
  - Movement lookups (movement_name, movement_category)
  - Benchmark lookups (benchmark_name, benchmark_type)
  - Date-based queries (pr_date, last_attempt_date)
  - Session linkage (session_id)

  ## 4. Important Notes

  ### WOD Formats Supported
  - **AMRAP** (As Many Rounds As Possible): Track rounds + additional reps
  - **For Time**: Track completion time, time cap
  - **EMOM** (Every Minute On the Minute): Track rounds completed, consistency
  - **Tabata**: 8 rounds of 20sec work / 10sec rest
  - **Chipper**: Long list of movements done once, track time
  - **Ladder**: Progressive increase/decrease, track completion

  ### Movement Categories
  - **Olympic**: Snatch, Clean & Jerk, variations
  - **Gymnastic**: Muscle-ups, HSPU, rope climbs, toes-to-bar
  - **Monostructural**: Row, bike, ski, run (cardio)
  - **Weighted**: Thrusters, wall balls, KB swings, DB movements
  - **Bodyweight**: Pull-ups, push-ups, burpees, etc.

  ### Benchmark Types
  - **Girl WODs**: Classic short intense workouts (Fran, Grace, Diane, etc.)
  - **Hero WODs**: Tribute workouts, often longer/harder (Murph, DT, etc.)
  - **Custom**: User-defined benchmarks

  ### Scaling Levels
  - **Rx** (As prescribed): Standard CrossFit weights and movements
  - **Scaled**: Modified weights, movements, or reps
  - **Foundations**: Beginner-appropriate modifications

  ## 5. Data Safety

  - All foreign keys reference existing tables with CASCADE on delete
  - All timestamps default to now()
  - All numeric fields use appropriate types (integer vs numeric)
  - JSONB for flexible data structures (movements, modifications, etc.)
  - No hardcoded user IDs or sensitive data
*/

-- ============================================================================
-- 1. functional_skills: Personal Records and Movement Proficiency
-- ============================================================================

CREATE TABLE IF NOT EXISTS functional_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movement_name text NOT NULL,
  movement_category text NOT NULL CHECK (
    movement_category IN ('olympic', 'gymnastic', 'monostructural', 'weighted', 'bodyweight', 'other')
  ),
  pr_weight_kg numeric DEFAULT 0,
  pr_reps integer DEFAULT 0,
  pr_time_seconds numeric DEFAULT 0,
  pr_date timestamptz,
  technique_level text DEFAULT 'learning' CHECK (
    technique_level IN ('learning', 'developing', 'proficient', 'mastered')
  ),
  scaling_used text DEFAULT 'scaled' CHECK (
    scaling_used IN ('rx', 'scaled', 'foundations')
  ),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraint: Each user can have one skill record per movement
  UNIQUE(user_id, movement_name)
);

-- Enable RLS
ALTER TABLE functional_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for functional_skills
CREATE POLICY "Users can view own functional skills"
  ON functional_skills FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own functional skills"
  ON functional_skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own functional skills"
  ON functional_skills FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own functional skills"
  ON functional_skills FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for functional_skills
CREATE INDEX IF NOT EXISTS idx_functional_skills_user_id ON functional_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_functional_skills_movement_name ON functional_skills(movement_name);
CREATE INDEX IF NOT EXISTS idx_functional_skills_movement_category ON functional_skills(movement_category);
CREATE INDEX IF NOT EXISTS idx_functional_skills_pr_date ON functional_skills(pr_date DESC);

-- ============================================================================
-- 2. functional_benchmarks: Benchmark WOD Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS functional_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  benchmark_name text NOT NULL,
  benchmark_type text NOT NULL CHECK (
    benchmark_type IN ('girl', 'hero', 'custom', 'open', 'games')
  ),
  wod_format text NOT NULL CHECK (
    wod_format IN ('amrap', 'forTime', 'emom', 'tabata', 'chipper', 'ladder', 'other')
  ),
  wod_description text NOT NULL,
  best_score text,
  best_score_numeric numeric,
  scaling_level text DEFAULT 'scaled' CHECK (
    scaling_level IN ('rx', 'scaled', 'foundations')
  ),
  attempt_count integer DEFAULT 0,
  last_attempt_date timestamptz,
  pr_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraint: Each user can have one benchmark record per name
  UNIQUE(user_id, benchmark_name)
);

-- Enable RLS
ALTER TABLE functional_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for functional_benchmarks
CREATE POLICY "Users can view own functional benchmarks"
  ON functional_benchmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own functional benchmarks"
  ON functional_benchmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own functional benchmarks"
  ON functional_benchmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own functional benchmarks"
  ON functional_benchmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for functional_benchmarks
CREATE INDEX IF NOT EXISTS idx_functional_benchmarks_user_id ON functional_benchmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_functional_benchmarks_name ON functional_benchmarks(benchmark_name);
CREATE INDEX IF NOT EXISTS idx_functional_benchmarks_type ON functional_benchmarks(benchmark_type);
CREATE INDEX IF NOT EXISTS idx_functional_benchmarks_pr_date ON functional_benchmarks(pr_date DESC);
CREATE INDEX IF NOT EXISTS idx_functional_benchmarks_last_attempt ON functional_benchmarks(last_attempt_date DESC);

-- ============================================================================
-- 3. functional_wod_data: Detailed WOD Session Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS functional_wod_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wod_format text NOT NULL CHECK (
    wod_format IN ('amrap', 'emom', 'tabata', 'forTime', 'chipper', 'ladder', 'other')
  ),
  wod_name text,
  time_cap_minutes integer,
  rounds_completed integer DEFAULT 0,
  additional_reps integer DEFAULT 0,
  completion_time_seconds integer,
  total_reps integer DEFAULT 0,
  calories_burned integer DEFAULT 0,
  movements_performed jsonb DEFAULT '[]'::jsonb,
  scaling_modifications jsonb DEFAULT '[]'::jsonb,
  technique_breaks integer DEFAULT 0,
  average_heart_rate integer,
  peak_heart_rate integer,
  perceived_difficulty integer CHECK (perceived_difficulty BETWEEN 1 AND 10),
  metabolic_intensity text CHECK (
    metabolic_intensity IN ('low', 'moderate', 'high', 'extreme')
  ),
  olympic_lifts_performed boolean DEFAULT false,
  gymnastic_skills_performed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraint: One WOD data entry per session
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE functional_wod_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for functional_wod_data
CREATE POLICY "Users can view own functional wod data"
  ON functional_wod_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own functional wod data"
  ON functional_wod_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own functional wod data"
  ON functional_wod_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own functional wod data"
  ON functional_wod_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for functional_wod_data
CREATE INDEX IF NOT EXISTS idx_functional_wod_data_user_id ON functional_wod_data(user_id);
CREATE INDEX IF NOT EXISTS idx_functional_wod_data_session_id ON functional_wod_data(session_id);
CREATE INDEX IF NOT EXISTS idx_functional_wod_data_format ON functional_wod_data(wod_format);
CREATE INDEX IF NOT EXISTS idx_functional_wod_data_wod_name ON functional_wod_data(wod_name);
CREATE INDEX IF NOT EXISTS idx_functional_wod_data_created_at ON functional_wod_data(created_at DESC);

-- ============================================================================
-- 4. functional_session_data: Session Summary Analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS functional_session_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_volume_kg integer DEFAULT 0,
  olympic_volume_kg integer DEFAULT 0,
  gymnastic_volume_reps integer DEFAULT 0,
  monostructural_calories integer DEFAULT 0,
  movements_by_category jsonb DEFAULT '{}'::jsonb,
  prs_achieved jsonb DEFAULT '[]'::jsonb,
  technique_quality_score numeric CHECK (technique_quality_score BETWEEN 1 AND 10),
  consistency_rating text CHECK (
    consistency_rating IN ('excellent', 'good', 'inconsistent', 'poor')
  ),
  recommended_rest_hours integer DEFAULT 24,
  next_focus_areas jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraint: One session data entry per session
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE functional_session_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for functional_session_data
CREATE POLICY "Users can view own functional session data"
  ON functional_session_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own functional session data"
  ON functional_session_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own functional session data"
  ON functional_session_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own functional session data"
  ON functional_session_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for functional_session_data
CREATE INDEX IF NOT EXISTS idx_functional_session_data_user_id ON functional_session_data(user_id);
CREATE INDEX IF NOT EXISTS idx_functional_session_data_session_id ON functional_session_data(session_id);
CREATE INDEX IF NOT EXISTS idx_functional_session_data_created_at ON functional_session_data(created_at DESC);

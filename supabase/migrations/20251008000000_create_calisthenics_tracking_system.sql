/*
  # Calisthenics & Street Workout Tracking System

  1. New Tables
    - `calisthenics_skills`
      - Tracks user's skill levels and progressions for each calisthenics skill
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `skill_name` (text) - e.g., "Pull-up", "Handstand", "Muscle-up"
      - `skill_category` (text) - e.g., "pull", "push", "core", "legs", "skills"
      - `current_level` (text) - e.g., "beginner", "intermediate", "advanced", "elite"
      - `current_variant` (text) - Current progression variant (e.g., "Assisted", "Regular", "Weighted")
      - `max_reps` (integer) - Maximum reps achieved for this skill
      - `max_hold_time` (integer) - Maximum hold time in seconds (for static skills)
      - `last_performed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `calisthenics_progressions`
      - Tracks progression paths and achievements for skills
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `skill_name` (text)
      - `progression_stage` (text) - e.g., "tuck", "straddle", "full", "weighted"
      - `achieved` (boolean) - Whether this stage has been achieved
      - `achieved_at` (timestamptz)
      - `target_reps` (integer) - Target reps to unlock next progression
      - `target_hold_time` (integer) - Target hold time to unlock next progression
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `calisthenics_session_data`
      - Stores detailed data for each calisthenics training session
      - `id` (uuid, primary key)
      - `session_id` (uuid, references training_sessions)
      - `user_id` (uuid, references auth.users)
      - `total_volume_reps` (integer) - Total repetitions performed
      - `skills_practiced` (jsonb) - Array of skills practiced with details
      - `skills_achieved` (jsonb) - New skills or progressions achieved
      - `average_rpe` (numeric)
      - `difficulty_rating` (text) - Overall session difficulty
      - `form_quality_score` (integer) - Self-assessed form quality (1-10)
      - `favorite_exercise` (text)
      - `hardest_exercise` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Policies check auth.uid() = user_id for all operations

  3. Indexes
    - Indexes on user_id for fast queries
    - Indexes on skill_name for skill lookup
    - Indexes on session_id for session data retrieval
    - Composite indexes for common query patterns
*/

-- Create calisthenics_skills table
CREATE TABLE IF NOT EXISTS calisthenics_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_name text NOT NULL,
  skill_category text NOT NULL DEFAULT 'general',
  current_level text NOT NULL DEFAULT 'beginner',
  current_variant text,
  max_reps integer DEFAULT 0,
  max_hold_time integer DEFAULT 0,
  last_performed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_skill_category CHECK (skill_category IN ('pull', 'push', 'core', 'legs', 'skills', 'flexibility', 'general')),
  CONSTRAINT valid_level CHECK (current_level IN ('beginner', 'novice', 'intermediate', 'advanced', 'elite', 'master')),
  CONSTRAINT valid_reps CHECK (max_reps >= 0),
  CONSTRAINT valid_hold_time CHECK (max_hold_time >= 0),
  UNIQUE(user_id, skill_name)
);

-- Create calisthenics_progressions table
CREATE TABLE IF NOT EXISTS calisthenics_progressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_name text NOT NULL,
  progression_stage text NOT NULL,
  achieved boolean DEFAULT false,
  achieved_at timestamptz,
  target_reps integer,
  target_hold_time integer,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_target_reps CHECK (target_reps IS NULL OR target_reps > 0),
  CONSTRAINT valid_target_hold_time CHECK (target_hold_time IS NULL OR target_hold_time > 0),
  UNIQUE(user_id, skill_name, progression_stage)
);

-- Create calisthenics_session_data table
CREATE TABLE IF NOT EXISTS calisthenics_session_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_volume_reps integer DEFAULT 0,
  skills_practiced jsonb DEFAULT '[]'::jsonb,
  skills_achieved jsonb DEFAULT '[]'::jsonb,
  average_rpe numeric(3, 1),
  difficulty_rating text,
  form_quality_score integer,
  favorite_exercise text,
  hardest_exercise text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_volume CHECK (total_volume_reps >= 0),
  CONSTRAINT valid_rpe CHECK (average_rpe IS NULL OR (average_rpe >= 1 AND average_rpe <= 10)),
  CONSTRAINT valid_difficulty CHECK (difficulty_rating IS NULL OR difficulty_rating IN ('easy', 'moderate', 'challenging', 'hard', 'extreme')),
  CONSTRAINT valid_form_score CHECK (form_quality_score IS NULL OR (form_quality_score >= 1 AND form_quality_score <= 10)),
  UNIQUE(session_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calisthenics_skills_user_id ON calisthenics_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_calisthenics_skills_skill_name ON calisthenics_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_calisthenics_skills_category ON calisthenics_skills(skill_category);
CREATE INDEX IF NOT EXISTS idx_calisthenics_skills_level ON calisthenics_skills(current_level);
CREATE INDEX IF NOT EXISTS idx_calisthenics_skills_user_skill ON calisthenics_skills(user_id, skill_name);

CREATE INDEX IF NOT EXISTS idx_calisthenics_progressions_user_id ON calisthenics_progressions(user_id);
CREATE INDEX IF NOT EXISTS idx_calisthenics_progressions_skill_name ON calisthenics_progressions(skill_name);
CREATE INDEX IF NOT EXISTS idx_calisthenics_progressions_achieved ON calisthenics_progressions(achieved);
CREATE INDEX IF NOT EXISTS idx_calisthenics_progressions_user_skill ON calisthenics_progressions(user_id, skill_name);

CREATE INDEX IF NOT EXISTS idx_calisthenics_session_data_session_id ON calisthenics_session_data(session_id);
CREATE INDEX IF NOT EXISTS idx_calisthenics_session_data_user_id ON calisthenics_session_data(user_id);
CREATE INDEX IF NOT EXISTS idx_calisthenics_session_data_created_at ON calisthenics_session_data(created_at DESC);

-- Enable Row Level Security
ALTER TABLE calisthenics_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE calisthenics_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calisthenics_session_data ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for calisthenics_skills
CREATE POLICY "Users can view their own skills"
  ON calisthenics_skills FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
  ON calisthenics_skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON calisthenics_skills FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
  ON calisthenics_skills FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS Policies for calisthenics_progressions
CREATE POLICY "Users can view their own progressions"
  ON calisthenics_progressions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progressions"
  ON calisthenics_progressions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progressions"
  ON calisthenics_progressions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progressions"
  ON calisthenics_progressions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS Policies for calisthenics_session_data
CREATE POLICY "Users can view their own session data"
  ON calisthenics_session_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session data"
  ON calisthenics_session_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session data"
  ON calisthenics_session_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session data"
  ON calisthenics_session_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calisthenics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calisthenics_skills_updated_at
  BEFORE UPDATE ON calisthenics_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_calisthenics_updated_at();

CREATE TRIGGER update_calisthenics_progressions_updated_at
  BEFORE UPDATE ON calisthenics_progressions
  FOR EACH ROW
  EXECUTE FUNCTION update_calisthenics_updated_at();

CREATE TRIGGER update_calisthenics_session_data_updated_at
  BEFORE UPDATE ON calisthenics_session_data
  FOR EACH ROW
  EXECUTE FUNCTION update_calisthenics_updated_at();

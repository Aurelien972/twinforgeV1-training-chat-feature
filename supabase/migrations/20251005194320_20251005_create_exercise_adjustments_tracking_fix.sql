/*
  # Exercise Load Adjustments Tracking System

  1. New Tables
    - `training_exercise_load_adjustments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `exercise_name` (text)
      - `adjustment_type` (text) - 'load_increase', 'load_decrease', 'sets_increase', 'sets_decrease', 'reps_increase', 'reps_decrease'
      - `old_value` (numeric)
      - `new_value` (numeric)
      - `context` (jsonb) - Additional context (energy level, session type, etc.)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `training_exercise_load_adjustments` table
    - Add policies for authenticated users to manage their own adjustments

  3. Indexes
    - Index on user_id for fast user lookup
    - Index on exercise_name for fast exercise lookup
    - Composite index on (user_id, exercise_name) for personalized recommendations

  4. Functions
    - `get_user_exercise_adjustment_avg` - Calculate average adjustment for a user and exercise
*/

-- Create training_exercise_load_adjustments table
CREATE TABLE IF NOT EXISTS training_exercise_load_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN (
    'load_increase',
    'load_decrease',
    'sets_increase',
    'sets_decrease',
    'reps_increase',
    'reps_decrease'
  )),
  old_value numeric NOT NULL,
  new_value numeric NOT NULL,
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE training_exercise_load_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own adjustments"
  ON training_exercise_load_adjustments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adjustments"
  ON training_exercise_load_adjustments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own adjustments"
  ON training_exercise_load_adjustments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_adjustments_user_id
  ON training_exercise_load_adjustments(user_id);

CREATE INDEX IF NOT EXISTS idx_exercise_adjustments_exercise_name
  ON training_exercise_load_adjustments(exercise_name);

CREATE INDEX IF NOT EXISTS idx_exercise_adjustments_user_exercise
  ON training_exercise_load_adjustments(user_id, exercise_name);

CREATE INDEX IF NOT EXISTS idx_exercise_adjustments_created_at
  ON training_exercise_load_adjustments(created_at DESC);

-- Function to get average adjustment for a user and exercise
CREATE OR REPLACE FUNCTION get_user_exercise_adjustment_avg(
  p_user_id uuid,
  p_exercise_name text,
  p_adjustment_type text,
  p_limit int DEFAULT 10
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_adjustment numeric;
BEGIN
  SELECT AVG(new_value - old_value)
  INTO avg_adjustment
  FROM (
    SELECT old_value, new_value
    FROM training_exercise_load_adjustments
    WHERE user_id = p_user_id
      AND exercise_name = p_exercise_name
      AND adjustment_type = p_adjustment_type
    ORDER BY created_at DESC
    LIMIT p_limit
  ) recent_adjustments;

  RETURN COALESCE(avg_adjustment, 0);
END;
$$;
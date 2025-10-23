/*
  # Create Training Goals Table

  1. New Tables
    - `training_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text) - Goal title
      - `goal_type` (text) - Type: volume, strength, endurance, etc.
      - `target_value` (numeric) - Target to reach
      - `current_value` (numeric) - Current progress
      - `unit` (text) - Unit of measurement
      - `discipline` (text) - Associated training discipline
      - `deadline` (timestamptz) - Goal deadline
      - `status` (text) - active, completed, abandoned
      - `is_active` (boolean) - Quick filter for active goals
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `training_goals` table
    - Add policies for authenticated users to manage their own goals

  3. Indexes
    - Index on user_id + status for quick filtering
    - Index on user_id + is_active for dashboard queries
*/

-- Create training_goals table
CREATE TABLE IF NOT EXISTS training_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  discipline TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_goals_user_status
  ON training_goals(user_id, status);

CREATE INDEX IF NOT EXISTS idx_training_goals_user_active
  ON training_goals(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_training_goals_deadline
  ON training_goals(deadline)
  WHERE deadline IS NOT NULL AND status = 'active';

-- Enable RLS
ALTER TABLE training_goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own goals"
  ON training_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON training_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON training_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON training_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_training_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_goals_updated_at
  BEFORE UPDATE ON training_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_training_goals_updated_at();

-- Function to auto-deactivate goals when completed
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_value >= NEW.target_value AND NEW.status = 'active' THEN
    NEW.status = 'completed';
    NEW.is_active = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_goals_check_completion
  BEFORE UPDATE ON training_goals
  FOR EACH ROW
  WHEN (OLD.current_value IS DISTINCT FROM NEW.current_value)
  EXECUTE FUNCTION check_goal_completion();

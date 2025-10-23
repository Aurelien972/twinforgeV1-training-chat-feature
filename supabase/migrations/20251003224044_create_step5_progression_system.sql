/*
  # Create Step 5 Progression System
  
  ## Description
  Complete system for Step 5 (Avancer) of the training pipeline.
  Manages recommendations, recovery tracking, progression path, and motivational messages.
  
  ## Tables Created
  
  1. `training_recommendations`
     - Stores AI-generated recommendations for next actions
     - Tracks recommendation type, confidence, reasoning
     - Records user acceptance and timing
  
  2. `user_progression_path`
     - Tracks user's training progression journey
     - Stores current level, target level, milestones
     - Manages test scheduling and cycle tracking
  
  3. `recovery_status`
     - Calculates and stores recovery metrics
     - Tracks muscular and systemic recovery percentages
     - Determines optimal next session windows
  
  4. `motivational_messages`
     - Caches AI-generated motivational messages
     - Pattern-based messages (streak, PR, consistency, etc.)
     - Tracks display status
  
  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Read/write policies for authenticated users
  
  ## Notes
  - Recovery status is calculated based on last session data
  - Recommendations use confidence scoring (0-1)
  - Progression path supports milestone tracking via JSONB
*/

-- Create training_recommendations table
CREATE TABLE IF NOT EXISTS training_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'next_session', 'test', 'upgrade', 'deload', 'active_recovery'
  )),
  recommended_date TIMESTAMP,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reasoning JSONB DEFAULT '{}'::jsonb,
  was_accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient user recommendations lookup
CREATE INDEX IF NOT EXISTS idx_training_recommendations_user_date 
  ON training_recommendations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_recommendations_session 
  ON training_recommendations(session_id);

-- Enable RLS
ALTER TABLE training_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_recommendations
CREATE POLICY "Users can view own recommendations"
  ON training_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON training_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON training_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create user_progression_path table
CREATE TABLE IF NOT EXISTS user_progression_path (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_level TEXT NOT NULL DEFAULT 'beginner',
  target_level TEXT,
  sessions_completed INT DEFAULT 0,
  current_cycle_start TIMESTAMP DEFAULT NOW(),
  last_test_date TIMESTAMP,
  next_test_due TIMESTAMP,
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for user lookup
CREATE INDEX IF NOT EXISTS idx_user_progression_path_user 
  ON user_progression_path(user_id);

-- Enable RLS
ALTER TABLE user_progression_path ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_progression_path
CREATE POLICY "Users can view own progression path"
  ON user_progression_path
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progression path"
  ON user_progression_path
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progression path"
  ON user_progression_path
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create recovery_status table
CREATE TABLE IF NOT EXISTS recovery_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  last_session_id UUID,
  last_session_date TIMESTAMP NOT NULL,
  last_session_rpe INT CHECK (last_session_rpe >= 1 AND last_session_rpe <= 10),
  last_session_volume FLOAT DEFAULT 0,
  muscular_recovery_percent INT CHECK (muscular_recovery_percent >= 0 AND muscular_recovery_percent <= 100),
  systemic_recovery_percent INT CHECK (systemic_recovery_percent >= 0 AND systemic_recovery_percent <= 100),
  optimal_next_session_start TIMESTAMP,
  optimal_next_session_end TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for user lookup
CREATE INDEX IF NOT EXISTS idx_recovery_status_user 
  ON recovery_status(user_id);

-- Enable RLS
ALTER TABLE recovery_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recovery_status
CREATE POLICY "Users can view own recovery status"
  ON recovery_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recovery status"
  ON recovery_status
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recovery status"
  ON recovery_status
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create motivational_messages table
CREATE TABLE IF NOT EXISTS motivational_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID,
  message TEXT NOT NULL,
  pattern_type TEXT CHECK (pattern_type IN (
    'streak', 'pr', 'consistency', 'resilience', 'progression', 'technique', 'default'
  )),
  was_displayed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient user messages lookup
CREATE INDEX IF NOT EXISTS idx_motivational_messages_user_date 
  ON motivational_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_motivational_messages_session 
  ON motivational_messages(session_id);

-- Enable RLS
ALTER TABLE motivational_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for motivational_messages
CREATE POLICY "Users can view own motivational messages"
  ON motivational_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own motivational messages"
  ON motivational_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own motivational messages"
  ON motivational_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_progression_path
DROP TRIGGER IF EXISTS update_user_progression_path_updated_at ON user_progression_path;
CREATE TRIGGER update_user_progression_path_updated_at
  BEFORE UPDATE ON user_progression_path
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for recovery_status
DROP TRIGGER IF EXISTS update_recovery_status_updated_at ON recovery_status;
CREATE TRIGGER update_recovery_status_updated_at
  BEFORE UPDATE ON recovery_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

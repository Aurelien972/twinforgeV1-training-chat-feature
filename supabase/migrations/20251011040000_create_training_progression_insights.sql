/*
  # Create Training Progression Insights System

  1. New Tables
    - `training_progression_insights`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `period` (text, check constraint: week/month/quarter)
      - `content` (jsonb, contains AI-generated insights)
      - `sessions_analyzed` (integer, number of sessions used for analysis)
      - `generated_at` (timestamptz, when insights were generated)
      - `expires_at` (timestamptz, when insights expire)
      - `created_at` (timestamptz, record creation time)

  2. Indexes
    - Index on `user_id`, `period`, `expires_at` for fast lookups
    - Unique constraint on `user_id`, `period`, `DATE(generated_at)` to prevent duplicate analyses per day

  3. Security
    - Enable RLS on `training_progression_insights` table
    - Policy for users to view their own insights
    - Policy for system to insert insights (authenticated users)

  4. Purpose
    - Store AI-generated progression insights with 24h cache
    - Reduce API calls to GPT-5-mini
    - Provide fast access to recent analyses
*/

-- Create table
CREATE TABLE IF NOT EXISTS training_progression_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('week', 'month', 'quarter')),
  content JSONB NOT NULL,
  sessions_analyzed INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_period_per_day UNIQUE(user_id, period, DATE(generated_at))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_progression_insights_user_period
  ON training_progression_insights(user_id, period, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_progression_insights_expires
  ON training_progression_insights(expires_at);

-- Enable RLS
ALTER TABLE training_progression_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own insights
CREATE POLICY "Users can view own progression insights"
  ON training_progression_insights
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own insights (via edge function)
CREATE POLICY "Users can insert own progression insights"
  ON training_progression_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: System can delete expired insights (cleanup)
CREATE POLICY "System can delete expired insights"
  ON training_progression_insights
  FOR DELETE
  TO authenticated
  USING (expires_at < NOW());

-- Add comment
COMMENT ON TABLE training_progression_insights IS
  'Stores AI-generated training progression insights with 24h cache. Used by training-progression-analyzer edge function with GPT-5-mini.';

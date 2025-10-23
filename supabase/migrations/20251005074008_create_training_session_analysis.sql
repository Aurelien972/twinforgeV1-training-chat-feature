/*
  # Create Training Session Analysis System

  1. Purpose
    - Store complete AI analysis results from training-coach-analyzer
    - Link analyses to training sessions
    - Enable historical analysis tracking for progression

  2. New Tables
    - `training_session_analysis`
      - `id` (uuid, primary key)
      - `session_id` (uuid, FK to training_sessions) - Links to the analyzed session
      - `user_id` (uuid, FK to auth.users) - User who owns this analysis
      - `analysis_data` (jsonb) - Complete analysis from training-coach-analyzer including:
        - sessionAnalysis (overallPerformance, volumeAnalysis, intensityAnalysis, techniqueAnalysis)
        - exerciseBreakdown (performance scores and recommendations per exercise)
        - personalizedInsights (strengths, areas to improve, key takeaways)
        - progressionRecommendations (next session and long term guidance)
        - achievements (earned badges and milestones)
        - coachRationale (AI explanation of the analysis)
      - `overall_score` (integer) - Quick access to performance score (0-100)
      - `performance_rating` (text) - Quick access to rating: excellent/good/average/needs-improvement
      - `metadata` (jsonb) - AI generation metadata (model, tokens, cost, latency, cached)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Modifications to Existing Tables
    - Add `has_ai_analysis` boolean column to training_sessions
    - Add `ai_recommendations` jsonb column to training_sessions for next session guidance

  4. Security
    - Enable RLS on training_session_analysis
    - Users can only read/write their own analyses
    - Authenticated users only

  5. Indexes
    - Index on session_id for fast lookups
    - Index on user_id + created_at for historical queries
    - Index on performance_rating for filtering

  6. Important Notes
    - This enables the full Step 4 → Step 5 progression loop
    - AI analysis results are persisted for future context collection
    - Recommendations flow from one session to the next
*/

-- Create training_session_analysis table
CREATE TABLE IF NOT EXISTS training_session_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  performance_rating text CHECK (performance_rating IN ('excellent', 'good', 'average', 'needs-improvement')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(session_id)
);

-- Add columns to training_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'has_ai_analysis'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN has_ai_analysis boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'ai_recommendations'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN ai_recommendations jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_session_analysis_session_id
  ON training_session_analysis(session_id);

CREATE INDEX IF NOT EXISTS idx_training_session_analysis_user_created
  ON training_session_analysis(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_session_analysis_rating
  ON training_session_analysis(performance_rating);

-- Enable RLS
ALTER TABLE training_session_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own analyses"
  ON training_session_analysis
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON training_session_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON training_session_analysis
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON training_session_analysis
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_training_session_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_session_analysis_updated_at
  BEFORE UPDATE ON training_session_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_training_session_analysis_updated_at();
/*
  # Create Training Session User Feedback System

  ## Summary
  This migration creates the infrastructure for capturing user feedback after training sessions.
  Users can provide text or voice feedback that will be used by the AI coach to improve future sessions.

  ## Changes

  1. New Tables
    - `training_session_user_feedback`
      - `id` (uuid, primary key)
      - `session_id` (uuid, FK to training_sessions)
      - `user_id` (uuid, FK to auth.users)
      - `feedback_text` (text) - transcribed or typed feedback
      - `feedback_audio_url` (text, nullable) - future use for audio storage
      - `sentiment_score` (numeric, nullable) - AI-analyzed sentiment (-1 to 1)
      - `key_themes` (jsonb, nullable) - extracted themes from feedback
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `training_session_user_feedback` table
    - Add policy for users to insert their own feedback
    - Add policy for users to read their own feedback
    - Add policy for users to update their own feedback within 24h

  3. Indexes
    - Index on `session_id` for fast lookups
    - Index on `user_id` for user-specific queries
    - Index on `created_at` for chronological queries
    - GIN index on `key_themes` for JSONB queries

  4. Functions
    - Function to get recent user feedbacks with aggregated insights
*/

-- Create training_session_user_feedback table
CREATE TABLE IF NOT EXISTS training_session_user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_text text NOT NULL,
  feedback_audio_url text,
  sentiment_score numeric(3, 2),
  key_themes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT feedback_text_not_empty CHECK (length(trim(feedback_text)) > 0),
  CONSTRAINT sentiment_score_range CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id 
  ON training_session_user_feedback(session_id);

CREATE INDEX IF NOT EXISTS idx_session_feedback_user_id 
  ON training_session_user_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_session_feedback_created_at 
  ON training_session_user_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_feedback_key_themes 
  ON training_session_user_feedback USING gin(key_themes);

-- Enable Row Level Security
ALTER TABLE training_session_user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own session feedback"
  ON training_session_user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own session feedback"
  ON training_session_user_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own feedback within 24 hours
CREATE POLICY "Users can update own recent feedback"
  ON training_session_user_feedback
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND created_at > now() - interval '24 hours'
  )
  WITH CHECK (auth.uid() = user_id);

-- Function: Get recent user feedback summaries
CREATE OR REPLACE FUNCTION get_user_recent_feedbacks(
  p_user_id uuid,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  session_id uuid,
  feedback_text text,
  sentiment_score numeric,
  key_themes jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.session_id,
    f.feedback_text,
    f.sentiment_score,
    f.key_themes,
    f.created_at
  FROM training_session_user_feedback f
  WHERE f.user_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get feedback for a specific session
CREATE OR REPLACE FUNCTION get_session_feedback(
  p_session_id uuid,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  feedback_text text,
  sentiment_score numeric,
  key_themes jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.feedback_text,
    f.sentiment_score,
    f.key_themes,
    f.created_at
  FROM training_session_user_feedback f
  WHERE f.session_id = p_session_id
    AND f.user_id = p_user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate average sentiment for user's recent sessions
CREATE OR REPLACE FUNCTION get_user_average_sentiment(
  p_user_id uuid,
  p_days int DEFAULT 30
)
RETURNS numeric AS $$
DECLARE
  avg_sentiment numeric;
BEGIN
  SELECT AVG(sentiment_score)
  INTO avg_sentiment
  FROM training_session_user_feedback
  WHERE user_id = p_user_id
    AND created_at > now() - (p_days || ' days')::interval
    AND sentiment_score IS NOT NULL;
  
  RETURN COALESCE(avg_sentiment, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_training_session_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_training_session_user_feedback_updated_at
  BEFORE UPDATE ON training_session_user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_training_session_user_feedback_updated_at();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_recent_feedbacks(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_feedback(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_average_sentiment(uuid, int) TO authenticated;
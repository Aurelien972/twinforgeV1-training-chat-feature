/*
  # Create AI Cache Tables for Nutrition Analysis

  1. New Tables
    - `ai_daily_summaries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `analysis_date` (date)
      - `summary` (text)
      - `highlights` (jsonb array)
      - `improvements` (jsonb array)
      - `proactive_alerts` (jsonb array)
      - `overall_score` (integer)
      - `recommendations` (jsonb array)
      - `model_used` (text)
      - `tokens_used` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `ai_trend_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `analysis_period` (text)
      - `trends` (jsonb array)
      - `strategic_advice` (jsonb array)
      - `meal_classifications` (jsonb array)
      - `diet_compliance` (jsonb)
      - `model_used` (text)
      - `tokens_used` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on both tables
    - Add policies for users to read/write their own data
    - Add policies for coaches to read client data
  3. Indexes
    - Composite indexes for efficient cache lookups
    - Date-based indexes for cleanup operations
  4. Performance
    - Automatic cleanup of old cache entries
    - Optimized for fast reads and writes
*/

-- Create ai_daily_summaries table
CREATE TABLE IF NOT EXISTS ai_daily_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_date date NOT NULL,
  summary text NOT NULL DEFAULT '',
  highlights jsonb DEFAULT '[]'::jsonb,
  improvements jsonb DEFAULT '[]'::jsonb,
  proactive_alerts jsonb DEFAULT '[]'::jsonb,
  overall_score integer DEFAULT 70 CHECK (overall_score >= 0 AND overall_score <= 100),
  recommendations jsonb DEFAULT '[]'::jsonb,
  model_used text DEFAULT 'gpt-5-mini',
  tokens_used jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, analysis_date)
);

-- Create ai_trend_analyses table
CREATE TABLE IF NOT EXISTS ai_trend_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_period text NOT NULL DEFAULT '7_days' CHECK (analysis_period IN ('7_days', '30_days')),
  trends jsonb DEFAULT '[]'::jsonb,
  strategic_advice jsonb DEFAULT '[]'::jsonb,
  meal_classifications jsonb DEFAULT '[]'::jsonb,
  diet_compliance jsonb DEFAULT '{}'::jsonb,
  model_used text DEFAULT 'gpt-5-mini',
  tokens_used jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, analysis_period)
);

-- Enable Row Level Security
ALTER TABLE ai_daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_trend_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_daily_summaries
CREATE POLICY "Users can manage own daily summaries"
  ON ai_daily_summaries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view client daily summaries"
  ON ai_daily_summaries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients cc
      WHERE cc.coach_id = auth.uid()
        AND cc.client_id = ai_daily_summaries.user_id
        AND cc.status = 'active'
    )
  );

-- RLS Policies for ai_trend_analyses
CREATE POLICY "Users can manage own trend analyses"
  ON ai_trend_analyses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view client trend analyses"
  ON ai_trend_analyses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients cc
      WHERE cc.coach_id = auth.uid()
        AND cc.client_id = ai_trend_analyses.user_id
        AND cc.status = 'active'
    )
  );

-- Indexes for ai_daily_summaries
CREATE INDEX IF NOT EXISTS idx_ai_daily_summaries_user_date 
  ON ai_daily_summaries(user_id, analysis_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_daily_summaries_created_at 
  ON ai_daily_summaries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_daily_summaries_model_used 
  ON ai_daily_summaries(model_used, created_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_ai_daily_summaries_highlights_gin 
  ON ai_daily_summaries USING gin(highlights);

CREATE INDEX IF NOT EXISTS idx_ai_daily_summaries_tokens_gin 
  ON ai_daily_summaries USING gin(tokens_used);

-- Indexes for ai_trend_analyses
CREATE INDEX IF NOT EXISTS idx_ai_trend_analyses_user_period 
  ON ai_trend_analyses(user_id, analysis_period, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_trend_analyses_created_at 
  ON ai_trend_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_trend_analyses_model_used 
  ON ai_trend_analyses(model_used, created_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_ai_trend_analyses_trends_gin 
  ON ai_trend_analyses USING gin(trends);

CREATE INDEX IF NOT EXISTS idx_ai_trend_analyses_advice_gin 
  ON ai_trend_analyses USING gin(strategic_advice);

CREATE INDEX IF NOT EXISTS idx_ai_trend_analyses_classifications_gin 
  ON ai_trend_analyses USING gin(meal_classifications);

CREATE INDEX IF NOT EXISTS idx_ai_trend_analyses_tokens_gin 
  ON ai_trend_analyses USING gin(tokens_used);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_ai_daily_summaries_updated_at
  BEFORE UPDATE ON ai_daily_summaries
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_ai_trend_analyses_updated_at
  BEFORE UPDATE ON ai_trend_analyses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create analytics view for cost monitoring
CREATE OR REPLACE VIEW ai_usage_analytics AS
SELECT 
  DATE(created_at) as analysis_date,
  model_used,
  COUNT(*) as total_analyses,
  SUM((tokens_used->>'total')::int) as total_tokens,
  SUM((tokens_used->>'cost_estimate_usd')::numeric) as total_cost_usd,
  AVG((tokens_used->>'total')::int) as avg_tokens_per_analysis,
  'daily_summary' as analysis_type
FROM ai_daily_summaries 
WHERE tokens_used IS NOT NULL AND tokens_used != '{}'::jsonb
GROUP BY DATE(created_at), model_used

UNION ALL

SELECT 
  DATE(created_at) as analysis_date,
  model_used,
  COUNT(*) as total_analyses,
  SUM((tokens_used->>'total')::int) as total_tokens,
  SUM((tokens_used->>'cost_estimate_usd')::numeric) as total_cost_usd,
  AVG((tokens_used->>'total')::int) as avg_tokens_per_analysis,
  'trend_analysis' as analysis_type
FROM ai_trend_analyses 
WHERE tokens_used IS NOT NULL AND tokens_used != '{}'::jsonb
GROUP BY DATE(created_at), model_used

ORDER BY analysis_date DESC, analysis_type;

-- Create cleanup function for old cache entries
CREATE OR REPLACE FUNCTION cleanup_old_ai_cache()
RETURNS void AS $$
BEGIN
  -- Clean up daily summaries older than 90 days
  DELETE FROM ai_daily_summaries 
  WHERE created_at < now() - interval '90 days';
  
  -- Clean up trend analyses older than 180 days
  DELETE FROM ai_trend_analyses 
  WHERE created_at < now() - interval '180 days';
  
  -- Log cleanup operation
  RAISE NOTICE 'AI cache cleanup completed at %', now();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled cleanup (this would typically be set up as a cron job)
-- For now, we'll just create the function - actual scheduling would be done via pg_cron or external scheduler
COMMENT ON FUNCTION cleanup_old_ai_cache() IS 'Cleanup function for old AI cache entries. Should be scheduled to run weekly.';
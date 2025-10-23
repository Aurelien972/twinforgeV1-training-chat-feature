/*
  # Create AI Cost Analytics Table

  1. New Tables
    - `ai_cost_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `edge_function_name` (text) - Name of the edge function
      - `operation_type` (text) - Type of operation (image-generation, chat-completion, etc.)
      - `openai_model` (text) - OpenAI model used
      - `openai_cost_usd` (numeric) - Actual cost from OpenAI
      - `tokens_charged` (integer) - Tokens charged to user
      - `margin_multiplier` (numeric) - Margin multiplier applied (e.g., 5.0 for 80% margin)
      - `margin_percentage` (numeric) - Margin percentage (e.g., 80.0)
      - `profit_usd` (numeric) - Profit made (revenue - cost)
      - `revenue_usd` (numeric) - Revenue from user (tokens * 0.001)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `ai_cost_analytics` table
    - Add policy for users to read their own analytics
    - Add policy for service role to insert analytics

  3. Indexes
    - Index on user_id for fast user queries
    - Index on edge_function_name for function performance analysis
    - Index on created_at for time-based queries
    - Composite index on (user_id, created_at) for user history queries
*/

-- Create the ai_cost_analytics table
CREATE TABLE IF NOT EXISTS ai_cost_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edge_function_name text NOT NULL,
  operation_type text NOT NULL,
  openai_model text,
  openai_cost_usd numeric(10, 6) NOT NULL DEFAULT 0,
  tokens_charged integer NOT NULL DEFAULT 0,
  margin_multiplier numeric(5, 2) NOT NULL DEFAULT 5.0,
  margin_percentage numeric(5, 2) NOT NULL DEFAULT 80.0,
  profit_usd numeric(10, 6) NOT NULL DEFAULT 0,
  revenue_usd numeric(10, 6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_cost_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own analytics
CREATE POLICY "Users can view own analytics"
  ON ai_cost_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can insert analytics (for edge functions)
CREATE POLICY "Service role can insert analytics"
  ON ai_cost_analytics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_cost_analytics_user_id
  ON ai_cost_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_cost_analytics_edge_function
  ON ai_cost_analytics(edge_function_name);

CREATE INDEX IF NOT EXISTS idx_ai_cost_analytics_created_at
  ON ai_cost_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cost_analytics_user_created
  ON ai_cost_analytics(user_id, created_at DESC);

-- Create a function to get analytics summary for a user
CREATE OR REPLACE FUNCTION get_user_ai_cost_summary(
  p_user_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  total_operations bigint,
  total_cost_usd numeric,
  total_revenue_usd numeric,
  total_profit_usd numeric,
  total_tokens_charged bigint,
  avg_margin_percentage numeric,
  most_used_function text,
  most_expensive_function text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as op_count,
      SUM(openai_cost_usd) as sum_cost,
      SUM(revenue_usd) as sum_revenue,
      SUM(profit_usd) as sum_profit,
      SUM(tokens_charged) as sum_tokens,
      AVG(margin_percentage) as avg_margin,
      edge_function_name
    FROM ai_cost_analytics
    WHERE user_id = p_user_id
      AND created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY edge_function_name
  ),
  most_used AS (
    SELECT edge_function_name
    FROM stats
    ORDER BY op_count DESC
    LIMIT 1
  ),
  most_expensive AS (
    SELECT edge_function_name
    FROM stats
    ORDER BY sum_cost DESC
    LIMIT 1
  )
  SELECT
    (SELECT SUM(op_count) FROM stats)::bigint,
    (SELECT SUM(sum_cost) FROM stats)::numeric,
    (SELECT SUM(sum_revenue) FROM stats)::numeric,
    (SELECT SUM(sum_profit) FROM stats)::numeric,
    (SELECT SUM(sum_tokens) FROM stats)::bigint,
    (SELECT AVG(avg_margin) FROM stats)::numeric,
    (SELECT edge_function_name FROM most_used),
    (SELECT edge_function_name FROM most_expensive);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_ai_cost_summary(uuid, integer) TO authenticated;

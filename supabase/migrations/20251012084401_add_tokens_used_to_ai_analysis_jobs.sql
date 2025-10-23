/*
  # Add tokens_used column to ai_analysis_jobs table

  1. Schema Changes
    - Add `tokens_used` column to `ai_analysis_jobs` table (JSONB type)
    - Stores detailed token usage information for cost tracking

  2. Purpose
    - Essential for accurate cost tracking and analysis
    - Stores input_tokens, output_tokens, reasoning_tokens, total_tokens, and cost information
    - Complements the model_used column for comprehensive AI usage analytics

  3. Notes
    - Resolves missing column error in scan-estimate edge function
    - JSONB format allows flexible schema for different AI models
    - Nullable to support historical records and fallback scenarios
*/

-- Add tokens_used column to ai_analysis_jobs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_analysis_jobs' AND column_name = 'tokens_used'
  ) THEN
    ALTER TABLE ai_analysis_jobs ADD COLUMN tokens_used JSONB DEFAULT NULL;

    -- Add comment explaining the column
    COMMENT ON COLUMN ai_analysis_jobs.tokens_used IS 'Detailed token usage and cost information (input_tokens, output_tokens, reasoning_tokens, total_tokens, cost_estimate_usd, etc.)';
  END IF;
END $$;

-- Create index on tokens_used for cost aggregation queries
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_tokens_used_cost
ON ai_analysis_jobs ((tokens_used->>'cost_estimate_usd'))
WHERE tokens_used IS NOT NULL;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON ai_analysis_jobs TO authenticated, service_role;
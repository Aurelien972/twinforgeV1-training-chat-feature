/*
  # Add model_used column to ai_analysis_jobs table

  1. Schema Changes
    - Add `model_used` column to `ai_analysis_jobs` table (TEXT type)
    - Add default value 'unknown' for existing records
    - Add CHECK constraint to validate model names
    - Create index on model_used for analytics queries

  2. Data Migration
    - Update existing NULL values to 'legacy' for historical records

  3. Performance
    - Index on model_used for filtering and aggregation queries

  4. Notes
    - This column tracks which AI model was used for each analysis
    - Essential for cost tracking and performance analysis
    - Resolves PGRST204 error: "Could not find the 'model_used' column"
*/

-- Add model_used column to ai_analysis_jobs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_analysis_jobs' AND column_name = 'model_used'
  ) THEN
    ALTER TABLE ai_analysis_jobs ADD COLUMN model_used TEXT DEFAULT 'unknown';

    -- Add comment explaining the column
    COMMENT ON COLUMN ai_analysis_jobs.model_used IS 'OpenAI model used for this analysis (e.g., gpt-5, gpt-5-mini, gpt-4o)';
  END IF;
END $$;

-- Add CHECK constraint to validate model names
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_analysis_jobs_model_used_check'
  ) THEN
    ALTER TABLE ai_analysis_jobs ADD CONSTRAINT ai_analysis_jobs_model_used_check
    CHECK (model_used IN (
      'gpt-5', 'gpt-5-mini', 'gpt-5-nano',
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4',
      'gpt-3.5-turbo',
      'fallback', 'legacy', 'unknown'
    ));
  END IF;
END $$;

-- Create index on model_used for analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_model_used
ON ai_analysis_jobs (model_used);

-- Create composite index for model and status for common queries
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_model_status
ON ai_analysis_jobs (model_used, status);

-- Update existing NULL or empty values to 'legacy' for historical records
UPDATE ai_analysis_jobs
SET model_used = 'legacy'
WHERE model_used IS NULL OR model_used = '';

-- Grant necessary permissions
GRANT SELECT, UPDATE ON ai_analysis_jobs TO authenticated, service_role;

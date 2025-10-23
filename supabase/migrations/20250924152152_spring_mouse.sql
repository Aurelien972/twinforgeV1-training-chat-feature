/*
  # Add input_hash column to ai_analysis_jobs table

  1. Changes
    - Add `input_hash` column to `ai_analysis_jobs` table
    - Column type: text
    - Used for caching AI analysis results based on input parameters

  2. Security
    - No RLS changes needed as existing policies will apply to the new column
*/

-- Add input_hash column to ai_analysis_jobs table
ALTER TABLE ai_analysis_jobs 
ADD COLUMN IF NOT EXISTS input_hash text;

-- Add index on input_hash for efficient cache lookups
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_input_hash 
ON ai_analysis_jobs (input_hash) 
WHERE input_hash IS NOT NULL;
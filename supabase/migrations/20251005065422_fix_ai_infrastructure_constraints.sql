/*
  # Fix AI Infrastructure Constraints

  ## Overview
  Adds missing agent_type and cache_type values to support the coach-analyzer agent.

  ## Changes Made

  ### 1. training_ai_generations table
  - Add "coach-analyzer" to valid_agent_type constraint
  - This agent performs post-session analysis using GPT-5-mini
  
  ### 2. training_ai_cache table
  - Add "analysis" to valid_cache_type constraint
  - Used to cache session analysis results

  ## Security
  - No changes to RLS policies
  - Constraints remain restrictive, just adding new valid values

  ## Notes
  - This is a non-destructive migration
  - Existing data is preserved
  - New values enable the Step 4 analysis flow
*/

-- =====================================================
-- 1. DROP OLD CONSTRAINTS
-- =====================================================

-- Drop the old constraint on training_ai_generations
ALTER TABLE training_ai_generations 
DROP CONSTRAINT IF EXISTS valid_agent_type;

-- Drop the old constraint on training_ai_cache
ALTER TABLE training_ai_cache 
DROP CONSTRAINT IF EXISTS valid_cache_type;

-- =====================================================
-- 2. ADD NEW CONSTRAINTS WITH EXPANDED VALUES
-- =====================================================

-- Add updated constraint for training_ai_generations
ALTER TABLE training_ai_generations 
ADD CONSTRAINT valid_agent_type CHECK (agent_type IN (
  'context-collector', 'morphology-analyzer',
  'coach-force', 'coach-functional', 'coach-competitions',
  'coach-calisthenics', 'coach-combat', 'coach-endurance',
  'coach-wellness', 'coach-sports', 'coach-mixed',
  'context-adapter', 'coach-chat',
  'performance-analyzer', 'progressive-adapter', 'strategic-advisor',
  'coach-analyzer'
));

-- Add updated constraint for training_ai_cache
ALTER TABLE training_ai_cache 
ADD CONSTRAINT valid_cache_type CHECK (cache_type IN (
  'context', 'morphology', 'prescription', 'advice', 'analysis'
));

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON CONSTRAINT valid_agent_type ON training_ai_generations IS 
  'Allowed agent types including coach-analyzer for post-session analysis';

COMMENT ON CONSTRAINT valid_cache_type ON training_ai_cache IS 
  'Allowed cache types including analysis for session performance analysis';

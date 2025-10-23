/*
  # Add fasting analysis types to ai_analysis_type enum

  1. Enum Updates
    - Add 'fasting_insights' to ai_analysis_type enum
    - Add 'fasting_progression' to ai_analysis_type enum

  2. Purpose
    - Enable caching of fasting-related AI analysis results
    - Support new fasting insights and progression analysis features
*/

-- Add new values to the ai_analysis_type enum
ALTER TYPE ai_analysis_type ADD VALUE IF NOT EXISTS 'fasting_insights';
ALTER TYPE ai_analysis_type ADD VALUE IF NOT EXISTS 'fasting_progression';
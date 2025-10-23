/*
  # Add Body Scan Analysis Types to AI Analysis Jobs

  1. New Analysis Types
    - `scan_estimate` - Photo analysis and measurement extraction
    - `scan_semantic` - Semantic analysis of body composition
    - `scan_match` - Archetype matching and morphology mapping
    - `scan_refine_morphs` - AI-powered morph refinement
    - `morph_insights` - Generate morphology insights and recommendations

  2. Purpose
    - Enable cost tracking for all Body Scan AI operations
    - Provide granular visibility into AI usage and costs
    - Support extrapolation and budgeting for Body Scan features
*/

-- Add new analysis types to the existing enum
ALTER TYPE ai_analysis_type ADD VALUE IF NOT EXISTS 'scan_estimate';
ALTER TYPE ai_analysis_type ADD VALUE IF NOT EXISTS 'scan_semantic';
ALTER TYPE ai_analysis_type ADD VALUE IF NOT EXISTS 'scan_match';
ALTER TYPE ai_analysis_type ADD VALUE IF NOT EXISTS 'scan_refine_morphs';
ALTER TYPE ai_analysis_type ADD VALUE IF NOT EXISTS 'morph_insights';
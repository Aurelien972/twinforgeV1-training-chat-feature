/*
  # Add Visual Description Enriched System for Ultra-Coherent AI Illustrations

  ## Overview
  Add comprehensive visual description system to replace short keywords with
  detailed 250-400 character descriptions for 95%+ perfect AI illustration generation.

  ## Changes
  1. Add visual_description_enriched column for detailed descriptions
  2. Add quality scoring columns for tracking enrichment progress
  3. Add indexes for efficient querying
  4. Add helper functions for quality validation and batch processing

  ## Security
  - No RLS changes (uses existing exercise table policies)
  - Service role required for bulk updates
*/

-- Add main enriched description column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercises' AND column_name = 'visual_description_enriched'
  ) THEN
    ALTER TABLE exercises ADD COLUMN visual_description_enriched TEXT;
  END IF;
END $$;

-- Add enrichment tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercises' AND column_name = 'enrichment_status'
  ) THEN
    ALTER TABLE exercises ADD COLUMN enrichment_status TEXT
      CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'validated', 'needs_review'))
      DEFAULT 'pending';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercises' AND column_name = 'enrichment_quality_score'
  ) THEN
    ALTER TABLE exercises ADD COLUMN enrichment_quality_score INTEGER
      CHECK (enrichment_quality_score >= 0 AND enrichment_quality_score <= 100)
      DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercises' AND column_name = 'enriched_at'
  ) THEN
    ALTER TABLE exercises ADD COLUMN enriched_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercises' AND column_name = 'enrichment_sprint_number'
  ) THEN
    ALTER TABLE exercises ADD COLUMN enrichment_sprint_number INTEGER;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exercises_enrichment_status
  ON exercises(enrichment_status)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_exercises_enrichment_quality
  ON exercises(enrichment_quality_score DESC)
  WHERE is_active = true AND enrichment_status = 'completed';

CREATE INDEX IF NOT EXISTS idx_exercises_enrichment_sprint
  ON exercises(enrichment_sprint_number, enrichment_status)
  WHERE enrichment_sprint_number IS NOT NULL;

-- Function to calculate enrichment quality score
CREATE OR REPLACE FUNCTION calculate_enrichment_quality_score(
  p_visual_description TEXT,
  p_execution_phases TEXT[],
  p_key_positions TEXT[],
  p_view_angle TEXT,
  p_visual_style TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_desc_length INTEGER;
BEGIN
  IF p_visual_description IS NOT NULL THEN
    v_desc_length := length(p_visual_description);

    IF v_desc_length >= 250 AND v_desc_length <= 400 THEN
      v_score := v_score + 20;
    ELSIF v_desc_length >= 200 THEN
      v_score := v_score + 15;
    ELSIF v_desc_length >= 150 THEN
      v_score := v_score + 10;
    ELSIF v_desc_length > 0 THEN
      v_score := v_score + 5;
    END IF;

    IF p_visual_description ~* '(position|posture|stance|debout|assis)' THEN
      v_score := v_score + 15;
    END IF;

    IF p_visual_description ~* '(barbell|barre|dumbbell|haltère|kettlebell)' THEN
      v_score := v_score + 15;
    END IF;

    IF p_visual_description ~* '(trajectory|trajectoire|arc|vertical|horizontal)' THEN
      v_score := v_score + 20;
    END IF;

    IF p_visual_description ~* '(muscle|activation|contraction|highlight|rouge)' THEN
      v_score := v_score + 15;
    END IF;

    IF p_visual_description ~* '(alignment|alignement|neutral|spine|colonne)' THEN
      v_score := v_score + 10;
    END IF;

    IF p_visual_description ~* '(view|vue|side|lateral|front|profil)' THEN
      v_score := v_score + 5;
    END IF;
  END IF;

  IF p_execution_phases IS NOT NULL AND array_length(p_execution_phases, 1) >= 3 THEN
    v_score := LEAST(v_score + 5, 100);
  END IF;

  IF p_key_positions IS NOT NULL AND array_length(p_key_positions, 1) >= 2 THEN
    v_score := LEAST(v_score + 5, 100);
  END IF;

  IF p_view_angle IS NOT NULL THEN
    v_score := LEAST(v_score + 3, 100);
  END IF;

  IF p_visual_style IS NOT NULL THEN
    v_score := LEAST(v_score + 2, 100);
  END IF;

  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get enrichment statistics
CREATE OR REPLACE FUNCTION get_enrichment_statistics()
RETURNS TABLE (
  total_exercises INTEGER,
  pending INTEGER,
  in_progress INTEGER,
  completed INTEGER,
  validated INTEGER,
  needs_review INTEGER,
  avg_quality_score NUMERIC,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE enrichment_status = 'pending')::INTEGER,
    COUNT(*) FILTER (WHERE enrichment_status = 'in_progress')::INTEGER,
    COUNT(*) FILTER (WHERE enrichment_status = 'completed')::INTEGER,
    COUNT(*) FILTER (WHERE enrichment_status = 'validated')::INTEGER,
    COUNT(*) FILTER (WHERE enrichment_status = 'needs_review')::INTEGER,
    ROUND(AVG(enrichment_quality_score) FILTER (WHERE enrichment_quality_score > 0), 2),
    ROUND(
      (COUNT(*) FILTER (WHERE enrichment_status IN ('completed', 'validated'))::NUMERIC /
       NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
      2
    )
  FROM exercises
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get exercises ready for enrichment
CREATE OR REPLACE FUNCTION get_exercises_for_enrichment_batch(
  p_batch_size INTEGER DEFAULT 220,
  p_sprint_number INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  discipline TEXT,
  category TEXT,
  difficulty TEXT,
  movement_pattern TEXT,
  visual_keywords TEXT[],
  description_short TEXT,
  current_quality_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.discipline,
    e.category,
    e.difficulty,
    e.movement_pattern,
    e.visual_keywords,
    e.description_short,
    e.quality_score
  FROM exercises e
  WHERE
    e.is_active = true
    AND e.enrichment_status = 'pending'
    AND (p_sprint_number IS NULL OR e.enrichment_sprint_number IS NULL)
  ORDER BY
    e.usage_count DESC NULLS LAST,
    e.illustration_priority DESC NULLS LAST,
    e.discipline,
    e.name
  LIMIT p_batch_size;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger for auto-calculate quality score
CREATE OR REPLACE FUNCTION auto_calculate_enrichment_quality()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.visual_description_enriched IS DISTINCT FROM OLD.visual_description_enriched THEN
    NEW.enrichment_quality_score := calculate_enrichment_quality_score(
      NEW.visual_description_enriched,
      NEW.execution_phases,
      NEW.key_positions,
      NEW.recommended_view_angle,
      NEW.recommended_visual_style
    );

    IF NEW.enrichment_quality_score > 0 AND OLD.enriched_at IS NULL THEN
      NEW.enriched_at := now();
    END IF;

    IF NEW.enrichment_quality_score >= 85 THEN
      NEW.enrichment_status := 'completed';
    ELSIF NEW.enrichment_quality_score >= 60 THEN
      NEW.enrichment_status := 'needs_review';
    ELSIF NEW.enrichment_quality_score > 0 THEN
      NEW.enrichment_status := 'in_progress';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_calculate_enrichment_quality ON exercises;

CREATE TRIGGER trigger_auto_calculate_enrichment_quality
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  WHEN (NEW.visual_description_enriched IS DISTINCT FROM OLD.visual_description_enriched)
  EXECUTE FUNCTION auto_calculate_enrichment_quality();

-- Set all existing exercises to pending status
UPDATE exercises
SET enrichment_status = 'pending'
WHERE enrichment_status IS NULL AND is_active = true;

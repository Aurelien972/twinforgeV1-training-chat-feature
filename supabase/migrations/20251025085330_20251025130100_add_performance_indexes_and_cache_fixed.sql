/*
  # Indexes de Performance et Système de Cache Snapshots (Fixed)
  
  ## Objectif
  1. Ajouter indexes optimisés sur la table exercises originale
  2. Créer table de cache snapshots pour stocker des catalogues pré-formatés
  3. Ajouter colonne ready_for_ai pour filtrer rapidement les exercices complets
  4. Optimiser les requêtes de filtrage par équipement et groupes musculaires
*/

-- ============================================================================
-- 1. Ajouter Colonne ready_for_ai sur exercises
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercises' AND column_name = 'ready_for_ai'
  ) THEN
    ALTER TABLE exercises 
    ADD COLUMN ready_for_ai boolean GENERATED ALWAYS AS (
      tempo IS NOT NULL 
      AND typical_sets_min IS NOT NULL 
      AND typical_reps_min IS NOT NULL
      AND is_active = true
      AND is_validated = true
    ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exercises_ready_for_ai
  ON exercises(ready_for_ai)
  WHERE ready_for_ai = true;

-- ============================================================================
-- 2. Indexes Composites Optimisés
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exercises_discipline_active_validated_difficulty
  ON exercises(discipline, is_active, is_validated, difficulty)
  WHERE is_active = true AND is_validated = true;

CREATE INDEX IF NOT EXISTS idx_exercises_category_subcategory
  ON exercises(discipline, category, subcategory)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_exercises_quality_illustration_priority
  ON exercises(quality_score DESC, illustration_priority DESC, usage_count DESC)
  WHERE is_active = true;

-- ============================================================================
-- 3. Table de Cache Snapshots
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_catalog_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline text NOT NULL,
  location_type text CHECK (location_type IN ('gym', 'home', 'outdoor', 'any')),
  difficulty text,
  language_code text NOT NULL DEFAULT 'fr' CHECK (language_code IN ('fr', 'en')),
  equipment_filter_hash text,
  catalog_data jsonb NOT NULL,
  exercise_count integer NOT NULL,
  format_version text NOT NULL DEFAULT '1.0',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_accessed_at timestamptz DEFAULT now(),
  access_count integer DEFAULT 0,
  UNIQUE(discipline, location_type, difficulty, language_code, equipment_filter_hash)
);

CREATE INDEX IF NOT EXISTS idx_catalog_snapshots_expires
  ON exercise_catalog_snapshots(expires_at);

CREATE INDEX IF NOT EXISTS idx_catalog_snapshots_access
  ON exercise_catalog_snapshots(last_accessed_at, access_count);

ALTER TABLE exercise_catalog_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read catalog snapshots"
  ON exercise_catalog_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage catalog snapshots"
  ON exercise_catalog_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. Fonction pour Récupérer ou Créer un Snapshot
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_catalog_snapshot(
  p_discipline text,
  p_location_type text DEFAULT 'gym',
  p_difficulty text DEFAULT NULL,
  p_language_code text DEFAULT 'fr',
  p_equipment_ids uuid[] DEFAULT NULL,
  p_max_exercises integer DEFAULT 50
)
RETURNS jsonb AS $$
DECLARE
  v_equipment_hash text;
  v_snapshot record;
  v_catalog_data jsonb;
  v_snapshot_id uuid;
BEGIN
  IF p_equipment_ids IS NOT NULL AND array_length(p_equipment_ids, 1) > 0 THEN
    v_equipment_hash := md5(array_to_string(p_equipment_ids, ','));
  ELSE
    v_equipment_hash := 'none';
  END IF;
  
  SELECT *
  INTO v_snapshot
  FROM exercise_catalog_snapshots
  WHERE discipline = p_discipline
    AND location_type = p_location_type
    AND (difficulty = p_difficulty OR (difficulty IS NULL AND p_difficulty IS NULL))
    AND language_code = p_language_code
    AND equipment_filter_hash = v_equipment_hash
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_snapshot.id IS NOT NULL THEN
    UPDATE exercise_catalog_snapshots
    SET last_accessed_at = now(), access_count = access_count + 1
    WHERE id = v_snapshot.id;
    
    RETURN jsonb_build_object(
      'cached', true,
      'snapshot_id', v_snapshot.id,
      'exercise_count', v_snapshot.exercise_count,
      'created_at', v_snapshot.created_at,
      'data', v_snapshot.catalog_data
    );
  END IF;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', eco.id,
      'name', CASE 
        WHEN p_language_code = 'fr' AND eco.translation_fr IS NOT NULL 
        THEN eco.translation_fr->>'name'
        WHEN p_language_code = 'en' AND eco.translation_en IS NOT NULL 
        THEN eco.translation_en->>'name'
        ELSE eco.name
      END,
      'discipline', eco.discipline,
      'difficulty', eco.difficulty,
      'muscle_groups', eco.muscle_groups,
      'equipment', eco.equipment,
      'tempo', eco.tempo,
      'sets_range', CONCAT(eco.typical_sets_min, '-', eco.typical_sets_max),
      'reps_range', CONCAT(eco.typical_reps_min, '-', eco.typical_reps_max),
      'coaching_cues', eco.coaching_cues,
      'progressions', eco.progressions,
      'alternatives', eco.alternatives,
      'ai_compact', eco.ai_compact_format
    )
    ORDER BY eco.quality_score DESC, eco.usage_count DESC
  )
  INTO v_catalog_data
  FROM (
    SELECT *
    FROM exercise_catalog_optimized eco
    WHERE eco.discipline = p_discipline
      AND eco.is_active = true
      AND eco.is_validated = true
      AND (p_difficulty IS NULL OR eco.difficulty = p_difficulty)
      AND (
        p_equipment_ids IS NULL 
        OR eco.required_equipment_ids <@ p_equipment_ids
        OR cardinality(eco.required_equipment_ids) = 0
      )
    LIMIT p_max_exercises
  ) eco;
  
  INSERT INTO exercise_catalog_snapshots (
    discipline, location_type, difficulty, language_code,
    equipment_filter_hash, catalog_data, exercise_count, expires_at
  )
  VALUES (
    p_discipline, p_location_type, p_difficulty, p_language_code,
    v_equipment_hash, v_catalog_data, jsonb_array_length(v_catalog_data),
    now() + interval '24 hours'
  )
  RETURNING id INTO v_snapshot_id;
  
  RETURN jsonb_build_object(
    'cached', false,
    'snapshot_id', v_snapshot_id,
    'exercise_count', jsonb_array_length(v_catalog_data),
    'created_at', now(),
    'data', v_catalog_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Fonction de Cleanup
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_catalog_snapshots()
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
  v_additional_deleted integer;
BEGIN
  DELETE FROM exercise_catalog_snapshots WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  DELETE FROM exercise_catalog_snapshots
  WHERE last_accessed_at < now() - interval '7 days' AND access_count < 5;
  GET DIAGNOSTICS v_additional_deleted = ROW_COUNT;
  
  RETURN v_deleted_count + v_additional_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Trigger d'Invalidation
-- ============================================================================

CREATE OR REPLACE FUNCTION invalidate_catalog_snapshots_on_exercise_change()
RETURNS trigger AS $$
BEGIN
  DELETE FROM exercise_catalog_snapshots
  WHERE discipline = COALESCE(NEW.discipline, OLD.discipline);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invalidate_snapshots_on_exercise_update ON exercises;
CREATE TRIGGER trigger_invalidate_snapshots_on_exercise_update
  AFTER INSERT OR UPDATE OR DELETE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_catalog_snapshots_on_exercise_change();

-- ============================================================================
-- 7. Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_or_create_catalog_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_catalog_snapshots TO service_role;

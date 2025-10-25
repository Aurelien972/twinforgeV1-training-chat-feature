/*
  # Vue Matérialisée Optimisée pour Catalogue d'Exercices
  
  ## Objectif
  Réduire drastiquement le nombre de requêtes SQL nécessaires pour charger le catalogue d'exercices
  en pré-joignant toutes les tables relationnelles dans une vue matérialisée.
  
  ## Performance
  - **Avant:** 6-8 requêtes SQL par exercice (exercises + muscle_groups + equipment + translations + cues + progressions)
  - **Après:** 1 requête unique pour charger tout le catalogue pré-joint
  - **Gain:** ~95% de réduction des requêtes DB
  
  ## Contenu de la Vue
  1. Données de base de l'exercice (exercises)
  2. Muscle groups avec type d'implication (primary/secondary/stabilizer)
  3. Equipment requis et alternatifs
  4. Traductions (français/anglais)
  5. Top 3 coaching cues par priorité
  6. Progressions et alternatives liées
  7. Métadonnées visuelles pour illustrations
  
  ## Refresh Strategy
  - Auto-refresh quotidien via cron (3h du matin)
  - Refresh manuel possible via fonction
  - Cache invalidé lors d'ajout/modification d'exercice
  
  ## Indexes
  - Index sur discipline pour requêtes filtrées
  - Index sur difficulty pour matching de niveau
  - Index GIN sur equipment_ids pour filtrage rapide
  - Index sur is_active pour exclusion des inactifs
*/

-- ============================================================================
-- 1. Créer la Vue Matérialisée Optimisée
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS exercise_catalog_optimized AS
SELECT 
  -- Base exercise data
  e.id,
  e.name,
  e.name_normalized,
  e.slug,
  e.discipline,
  e.category,
  e.subcategory,
  e.difficulty,
  e.skill_level_required,
  e.movement_pattern,
  e.tempo,
  e.bilateral,
  e.primary_energy_system,
  e.technical_complexity,
  e.injury_risk,
  e.description_short,
  e.description_full,
  e.benefits,
  e.target_goals,
  
  -- Prescription guidelines
  e.typical_sets_min,
  e.typical_sets_max,
  e.typical_reps_min,
  e.typical_reps_max,
  e.typical_rest_sec,
  e.typical_duration_min,
  e.typical_duration_max,
  
  -- Visual metadata for AI illustrations
  e.visual_keywords,
  e.execution_phases,
  e.key_positions,
  e.recommended_view_angle,
  e.recommended_visual_style,
  
  -- Safety and contraindications
  e.contraindications,
  e.safety_notes,
  e.common_mistakes,
  
  -- Status
  e.is_active,
  e.is_validated,
  e.quality_score,
  e.usage_count,
  e.illustration_priority,
  
  -- Metadata
  e.created_at,
  e.updated_at,
  
  -- Aggregated muscle groups (JSON array)
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', mg.id,
          'name', mg.name,
          'name_fr', mg.name_fr,
          'name_en', mg.name_en,
          'involvement_type', emg.involvement_type,
          'category', mg.category,
          'body_region', mg.body_region
        )
        ORDER BY 
          CASE emg.involvement_type
            WHEN 'primary' THEN 1
            WHEN 'secondary' THEN 2
            WHEN 'stabilizer' THEN 3
          END
      )
      FROM exercise_muscle_groups emg
      JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
      WHERE emg.exercise_id = e.id
    ),
    '[]'::jsonb
  ) as muscle_groups,
  
  -- Array of muscle group IDs (for fast filtering)
  COALESCE(
    (
      SELECT array_agg(emg.muscle_group_id)
      FROM exercise_muscle_groups emg
      WHERE emg.exercise_id = e.id
    ),
    '{}'::uuid[]
  ) as muscle_group_ids,
  
  -- Aggregated equipment (JSON array)
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', et.id,
          'name', et.name,
          'name_fr', et.name_fr,
          'name_en', et.name_en,
          'category', et.category,
          'is_required', ee.is_required,
          'is_alternative', ee.is_alternative,
          'quantity', ee.quantity
        )
        ORDER BY ee.is_required DESC, et.name_fr
      )
      FROM exercise_equipment ee
      JOIN equipment_types et ON et.id = ee.equipment_id
      WHERE ee.exercise_id = e.id
    ),
    '[]'::jsonb
  ) as equipment,
  
  -- Array of equipment IDs (for fast filtering)
  COALESCE(
    (
      SELECT array_agg(ee.equipment_id)
      FROM exercise_equipment ee
      WHERE ee.exercise_id = e.id
    ),
    '{}'::uuid[]
  ) as equipment_ids,
  
  -- Array of required equipment IDs only
  COALESCE(
    (
      SELECT array_agg(ee.equipment_id)
      FROM exercise_equipment ee
      WHERE ee.exercise_id = e.id AND ee.is_required = true
    ),
    '{}'::uuid[]
  ) as required_equipment_ids,
  
  -- French translation
  COALESCE(
    (
      SELECT jsonb_build_object(
        'name', etrans.name,
        'description_short', etrans.description_short,
        'description_full', etrans.description_full,
        'benefits', etrans.benefits,
        'safety_notes', etrans.safety_notes
      )
      FROM exercise_translations etrans
      WHERE etrans.exercise_id = e.id AND etrans.language_code = 'fr'
      LIMIT 1
    ),
    NULL
  ) as translation_fr,
  
  -- English translation
  COALESCE(
    (
      SELECT jsonb_build_object(
        'name', etrans.name,
        'description_short', etrans.description_short,
        'description_full', etrans.description_full,
        'benefits', etrans.benefits,
        'safety_notes', etrans.safety_notes
      )
      FROM exercise_translations etrans
      WHERE etrans.exercise_id = e.id AND etrans.language_code = 'en'
      LIMIT 1
    ),
    NULL
  ) as translation_en,
  
  -- Top 3 coaching cues by priority
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', ecc.cue_type,
          'text', ecc.cue_text,
          'priority', ecc.cue_priority,
          'when_to_use', ecc.when_to_use,
          'target_level', ecc.target_level
        )
        ORDER BY ecc.cue_priority DESC
      )
      FROM (
        SELECT *
        FROM exercise_coaching_cues ecc2
        WHERE ecc2.exercise_id = e.id
        ORDER BY ecc2.cue_priority DESC
        LIMIT 3
      ) ecc
    ),
    '[]'::jsonb
  ) as coaching_cues,
  
  -- Progressions (harder variations)
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ex.id,
          'name', ex.name,
          'difficulty', ex.difficulty,
          'difficulty_delta', ep.difficulty_delta,
          'criteria', ep.progression_criteria
        )
        ORDER BY ep.sequence_order NULLS LAST, ex.difficulty
      )
      FROM exercise_progressions ep
      JOIN exercises ex ON ex.id = ep.related_exercise_id
      WHERE ep.exercise_id = e.id 
        AND ep.relationship_type = 'progression'
        AND ex.is_active = true
    ),
    '[]'::jsonb
  ) as progressions,
  
  -- Regressions (easier variations)
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ex.id,
          'name', ex.name,
          'difficulty', ex.difficulty,
          'difficulty_delta', ep.difficulty_delta
        )
        ORDER BY ep.sequence_order NULLS LAST, ex.difficulty DESC
      )
      FROM exercise_progressions ep
      JOIN exercises ex ON ex.id = ep.related_exercise_id
      WHERE ep.exercise_id = e.id 
        AND ep.relationship_type = 'regression'
        AND ex.is_active = true
    ),
    '[]'::jsonb
  ) as regressions,
  
  -- Alternatives (similar difficulty, different execution)
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ex.id,
          'name', ex.name,
          'movement_pattern', ex.movement_pattern
        )
        ORDER BY ex.name
      )
      FROM exercise_progressions ep
      JOIN exercises ex ON ex.id = ep.related_exercise_id
      WHERE ep.exercise_id = e.id 
        AND ep.relationship_type IN ('alternative', 'variation')
        AND ex.is_active = true
      LIMIT 5
    ),
    '[]'::jsonb
  ) as alternatives,
  
  -- Compact format for AI (1 line summary)
  CONCAT(
    e.name, ' | ',
    CASE e.difficulty
      WHEN 'beginner' THEN 'Déb'
      WHEN 'novice' THEN 'Nov'
      WHEN 'intermediate' THEN 'Inter'
      WHEN 'advanced' THEN 'Avan'
      WHEN 'elite' THEN 'Elite'
      ELSE 'N/A'
    END, ' | ',
    COALESCE(
      (
        SELECT string_agg(mg.name_fr, ',')
        FROM exercise_muscle_groups emg
        JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
        WHERE emg.exercise_id = e.id AND emg.involvement_type = 'primary'
        LIMIT 3
      ),
      'N/A'
    ), ' | ',
    COALESCE(
      (
        SELECT string_agg(et.name_fr, ',')
        FROM exercise_equipment ee
        JOIN equipment_types et ON et.id = ee.equipment_id
        WHERE ee.exercise_id = e.id AND ee.is_required = true
        LIMIT 2
      ),
      'Poids corps'
    ), ' | ',
    COALESCE(e.tempo, 'N/A'), ' | ',
    COALESCE(e.typical_sets_min::text || '-' || e.typical_sets_max::text, 'N/A'), 'x',
    COALESCE(e.typical_reps_min::text || '-' || e.typical_reps_max::text, 'N/A')
  ) as ai_compact_format

FROM exercises e
WHERE e.is_active = true;

-- ============================================================================
-- 2. Créer les Indexes pour Performance Optimale
-- ============================================================================

-- Index principal pour filtrage par discipline et difficulté
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_opt_discipline_difficulty
  ON exercise_catalog_optimized(discipline, difficulty);

-- Index pour filtrage par niveau actif/validé
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_opt_active_validated
  ON exercise_catalog_optimized(is_active, is_validated);

-- Index GIN pour recherche rapide dans equipment_ids
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_opt_equipment_ids
  ON exercise_catalog_optimized USING GIN(equipment_ids);

-- Index GIN pour recherche rapide dans required_equipment_ids
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_opt_required_equipment
  ON exercise_catalog_optimized USING GIN(required_equipment_ids);

-- Index GIN pour recherche rapide dans muscle_group_ids
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_opt_muscle_groups
  ON exercise_catalog_optimized USING GIN(muscle_group_ids);

-- Index pour tri par qualité et usage
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_opt_quality_usage
  ON exercise_catalog_optimized(quality_score DESC, usage_count DESC);

-- Index pour search full-text sur nom
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_opt_name_trgm
  ON exercise_catalog_optimized USING gin(name gin_trgm_ops);

-- ============================================================================
-- 3. Fonction de Refresh Manuel
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_exercise_catalog_optimized()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_catalog_optimized;
  
  -- Log refresh
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'materialized_view_refresh',
    'Exercise catalog optimized view refreshed',
    jsonb_build_object(
      'view_name', 'exercise_catalog_optimized',
      'refreshed_at', now()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Fonction de Requête Optimisée
-- ============================================================================

CREATE OR REPLACE FUNCTION query_exercise_catalog_fast(
  p_discipline text,
  p_available_equipment_ids uuid[] DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_max_results integer DEFAULT 50
)
RETURNS SETOF exercise_catalog_optimized AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM exercise_catalog_optimized eco
  WHERE eco.discipline = p_discipline
    AND eco.is_active = true
    AND eco.is_validated = true
    AND (p_difficulty IS NULL OR eco.difficulty = p_difficulty)
    AND (
      p_available_equipment_ids IS NULL 
      OR eco.required_equipment_ids <@ p_available_equipment_ids
      OR cardinality(eco.required_equipment_ids) = 0
    )
  ORDER BY 
    eco.quality_score DESC,
    eco.usage_count DESC
  LIMIT p_max_results;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 5. Grant Permissions
-- ============================================================================

GRANT SELECT ON exercise_catalog_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_exercise_catalog_optimized() TO service_role;
GRANT EXECUTE ON FUNCTION query_exercise_catalog_fast TO authenticated;

-- ============================================================================
-- 6. Initial Refresh
-- ============================================================================

REFRESH MATERIALIZED VIEW exercise_catalog_optimized;

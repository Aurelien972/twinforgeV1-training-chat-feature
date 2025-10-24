/*
  # Enrichissement Massif des Données Exercices

  ## Vue d'ensemble
  Mise à jour massive pour enrichir les exercices existants avec:
  - Données tempo par mouvement pattern et discipline
  - Visual keywords intelligents par discipline et catégorie
  - Corrections et optimisations diverses

  ## Changements
  1. Ajout tempo selon movement_pattern et discipline
  2. Génération visual_keywords basiques pour tous les exercices
  3. Mise à jour des exercices sans tempo ni keywords
*/

-- =====================================================
-- 1. ENRICHISSEMENT TEMPO
-- =====================================================

-- Tempo par movement_pattern
UPDATE exercises
SET tempo = '3-0-1-0'
WHERE movement_pattern IN ('push', 'pull')
  AND (tempo IS NULL OR tempo = '');

UPDATE exercises
SET tempo = '3-0-2-0'
WHERE movement_pattern IN ('squat', 'hinge', 'compound')
  AND (tempo IS NULL OR tempo = '');

UPDATE exercises
SET tempo = '2-1-2-1'
WHERE movement_pattern = 'isolation'
  AND (tempo IS NULL OR tempo = '');

UPDATE exercises
SET tempo = '0-0-0-0'
WHERE movement_pattern IN ('carry', 'olympic', 'gymnastic', 'hold', 'dynamic', 'cardio')
  AND (tempo IS NULL OR tempo = '');

-- Tempo par discipline (fallback si pas de movement_pattern)
UPDATE exercises
SET tempo = '3-0-2-0'
WHERE discipline = 'force'
  AND (tempo IS NULL OR tempo = '');

UPDATE exercises
SET tempo = '2-0-2-0'
WHERE discipline = 'calisthenics'
  AND (tempo IS NULL OR tempo = '');

UPDATE exercises
SET tempo = '0-0-0-0'
WHERE discipline IN ('functional', 'endurance', 'competitions')
  AND (tempo IS NULL OR tempo = '');

-- =====================================================
-- 2. ENRICHISSEMENT VISUAL KEYWORDS
-- =====================================================

-- Keywords par discipline Force
UPDATE exercises
SET visual_keywords = ARRAY['strength', 'barbell', 'resistance', 'hypertrophy', 'power']
WHERE discipline = 'force'
  AND (visual_keywords IS NULL OR visual_keywords = '{}');

-- Keywords par discipline Functional
UPDATE exercises
SET visual_keywords = ARRAY['crossfit', 'metcon', 'conditioning', 'varied', 'high intensity']
WHERE discipline = 'functional'
  AND (visual_keywords IS NULL OR visual_keywords = '{}');

-- Keywords par discipline Calisthenics
UPDATE exercises
SET visual_keywords = ARRAY['bodyweight', 'street workout', 'gymnastics', 'leverage', 'control']
WHERE discipline = 'calisthenics'
  AND (visual_keywords IS NULL OR visual_keywords = '{}');

-- Keywords par discipline Endurance
UPDATE exercises
SET visual_keywords = ARRAY['cardio', 'aerobic', 'stamina', 'pacing', 'sustained effort']
WHERE discipline = 'endurance'
  AND (visual_keywords IS NULL OR visual_keywords = '{}');

-- Keywords par discipline Competitions
UPDATE exercises
SET visual_keywords = ARRAY['race', 'station', 'timed', 'competitive', 'performance']
WHERE discipline = 'competitions'
  AND (visual_keywords IS NULL OR visual_keywords = '{}');

-- Enrichir avec movement_pattern keywords
UPDATE exercises
SET visual_keywords = array_cat(
  COALESCE(visual_keywords, '{}'),
  CASE movement_pattern
    WHEN 'push' THEN ARRAY['pressing', 'chest', 'shoulders', 'triceps']
    WHEN 'pull' THEN ARRAY['pulling', 'back', 'lats', 'rowing']
    WHEN 'squat' THEN ARRAY['legs', 'quads', 'glutes', 'knee flexion']
    WHEN 'hinge' THEN ARRAY['hamstrings', 'glutes', 'hip hinge', 'posterior chain']
    WHEN 'carry' THEN ARRAY['loaded walk', 'grip', 'core stability']
    WHEN 'olympic' THEN ARRAY['explosive', 'power', 'triple extension']
    WHEN 'gymnastic' THEN ARRAY['bodyweight', 'control', 'coordination']
    ELSE ARRAY[]::text[]
  END
)
WHERE movement_pattern IS NOT NULL
  AND visual_keywords IS NOT NULL
  AND array_length(visual_keywords, 1) < 8;

-- Ajouter keywords par catégorie spécifiques
UPDATE exercises
SET visual_keywords = array_cat(
  COALESCE(visual_keywords, '{}'),
  CASE category
    WHEN 'benchmark_wod' THEN ARRAY['benchmark', 'named wod', 'crossfit classic']
    WHEN 'hyrox_station' THEN ARRAY['hyrox', 'race simulation']
    WHEN 'swimming' THEN ARRAY['pool', 'water', 'stroke']
    WHEN 'cycling' THEN ARRAY['bike', 'pedaling']
    WHEN 'running' THEN ARRAY['run', 'sprint', 'jog']
    ELSE ARRAY[]::text[]
  END
)
WHERE category IN ('benchmark_wod', 'hyrox_station', 'swimming', 'cycling', 'running')
  AND visual_keywords IS NOT NULL
  AND array_length(visual_keywords, 1) < 8;

-- Fallback: s'assurer que tous les exercices ont au moins 3 keywords
UPDATE exercises
SET visual_keywords = ARRAY['training', 'exercise', 'fitness']
WHERE visual_keywords IS NULL OR visual_keywords = '{}' OR array_length(visual_keywords, 1) = 0;

-- =====================================================
-- 3. CORRECTIONS & NETTOYAGE
-- =====================================================

-- S'assurer que tous les exercices ont is_validated = true
UPDATE exercises
SET is_validated = true
WHERE is_validated IS NULL OR is_validated = false;

-- S'assurer que tous les exercices ont is_active = true
UPDATE exercises
SET is_active = true
WHERE is_active IS NULL OR is_active = false;

-- Mettre à jour updated_at sur tous les exercices modifiés
UPDATE exercises
SET updated_at = now()
WHERE tempo IS NOT NULL OR (visual_keywords IS NOT NULL AND visual_keywords != '{}');

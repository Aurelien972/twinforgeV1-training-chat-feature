/*
  # Phase 6 - Step 6: Create Exercise Substitutions

  ## Overview
  Generates exercise substitutions using correct types from schema.

  ## Substitution Types (from constraint)
  - equipment_alternative: Different equipment, same movement
  - movement_similar: Similar movement pattern
  - muscle_similar: Targets same muscle groups
  - difficulty_similar: Same difficulty level
  - emergency_fallback: General backup option

  ## Security
  - No schema changes
  - Data enrichment only
*/

-- ============================================================================
-- 1. EQUIPMENT ALTERNATIVES
-- ============================================================================

-- Barbell <-> Dumbbell
INSERT INTO exercise_substitutions (
  exercise_id,
  substitute_exercise_id,
  substitution_type,
  similarity_score,
  reason
)
SELECT DISTINCT
  e1.id,
  e2.id,
  'equipment_alternative',
  0.90,
  'Dumbbell variation allows unilateral work'
FROM exercises e1
INNER JOIN exercises e2 ON 
  LOWER(e1.name) LIKE '%barbell%press%' AND LOWER(e2.name) LIKE '%dumbbell%press%'
WHERE e1.id != e2.id
LIMIT 100
ON CONFLICT (exercise_id, substitute_exercise_id, substitution_type) DO NOTHING;

-- Pull-up bar <-> Rings
INSERT INTO exercise_substitutions (
  exercise_id,
  substitute_exercise_id,
  substitution_type,
  similarity_score,
  reason
)
SELECT DISTINCT
  e1.id,
  e2.id,
  'equipment_alternative',
  0.85,
  'Rings add instability for increased difficulty'
FROM exercises e1
CROSS JOIN exercises e2
WHERE e1.discipline = 'calisthenics'
  AND e1.category = 'pull'
  AND e1.name ILIKE '%pull-up%'
  AND e1.name NOT ILIKE '%ring%'
  AND e2.discipline = 'calisthenics'
  AND e2.category = 'pull'
  AND e2.name ILIKE '%ring%'
  AND e1.id != e2.id
LIMIT 200
ON CONFLICT (exercise_id, substitute_exercise_id, substitution_type) DO NOTHING;

-- ============================================================================
-- 2. MOVEMENT SIMILAR
-- ============================================================================

-- Running <-> Cycling (similar cardio movement)
INSERT INTO exercise_substitutions (
  exercise_id,
  substitute_exercise_id,
  substitution_type,
  similarity_score,
  reason
)
SELECT DISTINCT
  e1.id,
  e2.id,
  'movement_similar',
  0.70,
  'Low-impact cardiovascular alternative'
FROM exercises e1
CROSS JOIN exercises e2
WHERE e1.discipline = 'endurance'
  AND e1.name ILIKE '%run%'
  AND e2.discipline = 'endurance'
  AND (e2.name ILIKE '%bike%' OR e2.name ILIKE '%cycle%')
  AND e1.id != e2.id
LIMIT 100
ON CONFLICT (exercise_id, substitute_exercise_id, substitution_type) DO NOTHING;

-- Push-up variations (similar push movement)
INSERT INTO exercise_substitutions (
  exercise_id,
  substitute_exercise_id,
  substitution_type,
  similarity_score,
  reason
)
SELECT DISTINCT
  e1.id,
  e2.id,
  'movement_similar',
  0.80,
  'Similar horizontal push pattern'
FROM exercises e1
CROSS JOIN exercises e2
WHERE e1.discipline = 'calisthenics'
  AND e1.category = 'push'
  AND e1.name ILIKE '%push-up%'
  AND e2.discipline = 'calisthenics'
  AND e2.category = 'push'
  AND e2.name ILIKE '%push-up%'
  AND e1.name != e2.name
  AND e1.id != e2.id
LIMIT 500
ON CONFLICT (exercise_id, substitute_exercise_id, substitution_type) DO NOTHING;

-- ============================================================================
-- 3. MUSCLE SIMILAR (Same category = similar muscles)
-- ============================================================================

-- Same discipline and category
INSERT INTO exercise_substitutions (
  exercise_id,
  substitute_exercise_id,
  substitution_type,
  similarity_score,
  reason
)
SELECT DISTINCT
  e1.id,
  e2.id,
  'muscle_similar',
  0.65,
  format('Targets similar muscle groups in %s training', e1.discipline)
FROM exercises e1
INNER JOIN exercises e2 ON 
  e1.discipline = e2.discipline
  AND e1.category = e2.category
  AND e1.id != e2.id
WHERE e1.discipline IN ('force', 'functional', 'calisthenics')
  AND e1.category IS NOT NULL
  AND e2.category IS NOT NULL
LIMIT 1000
ON CONFLICT (exercise_id, substitute_exercise_id, substitution_type) DO NOTHING;

-- ============================================================================
-- 4. DIFFICULTY SIMILAR (Same discipline variations)
-- ============================================================================

-- Pull-ups variations at similar difficulty
INSERT INTO exercise_substitutions (
  exercise_id,
  substitute_exercise_id,
  substitution_type,
  similarity_score,
  reason
)
SELECT DISTINCT
  e1.id,
  e2.id,
  'difficulty_similar',
  0.75,
  'Similar difficulty pull variation'
FROM exercises e1
CROSS JOIN exercises e2
WHERE e1.discipline = 'calisthenics'
  AND e1.category = 'pull'
  AND e2.discipline = 'calisthenics'
  AND e2.category = 'pull'
  AND e1.name != e2.name
  AND e1.id != e2.id
  AND e1.name NOT ILIKE '%assisted%'
  AND e2.name NOT ILIKE '%assisted%'
  AND e1.name NOT ILIKE '%weighted%'
  AND e2.name NOT ILIKE '%weighted%'
LIMIT 300
ON CONFLICT (exercise_id, substitute_exercise_id, substitution_type) DO NOTHING;

-- ============================================================================
-- 5. EMERGENCY FALLBACK (Cross-discipline alternatives)
-- ============================================================================

-- Bodyweight alternatives for equipment exercises
INSERT INTO exercise_substitutions (
  exercise_id,
  substitute_exercise_id,
  substitution_type,
  similarity_score,
  reason
)
SELECT DISTINCT
  e1.id,
  e2.id,
  'emergency_fallback',
  0.50,
  'Bodyweight alternative when equipment unavailable'
FROM exercises e1
CROSS JOIN exercises e2
WHERE e1.discipline = 'force'
  AND e2.discipline = 'calisthenics'
  AND (
    (e1.name ILIKE '%press%' AND e2.category = 'push') OR
    (e1.name ILIKE '%row%' AND e2.category = 'pull') OR
    (e1.name ILIKE '%squat%' AND e2.category = 'squat')
  )
  AND e1.id != e2.id
LIMIT 500
ON CONFLICT (exercise_id, substitute_exercise_id, substitution_type) DO NOTHING;

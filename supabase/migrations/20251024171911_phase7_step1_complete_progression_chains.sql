/*
  # Phase 7 - Step 1: Complete Progression Chains

  ## Overview
  Creates comprehensive progression chains from beginner to advanced.
  Establishes clear paths for skill development across all disciplines.

  ## Strategy
  1. Beginner -> Intermediate -> Advanced chains
  2. Clear prerequisites for complex movements
  3. Regressions for accessibility
  4. Lateral variations for variety
  5. Equipment-based alternatives

  ## Relationship Types
  - progression: Next harder variation (+1 to +3 difficulty)
  - regression: Easier variation (-1 to -3 difficulty)
  - variation: Same level, different stimulus (0 difficulty)
  - prerequisite: Required foundation exercise
  - alternative: Equipment/context substitute

  ## Security
  - No schema changes
  - Data enrichment only
*/

-- ============================================================================
-- 1. CALISTHENICS PUSH PROGRESSIONS (Push-ups)
-- ============================================================================

-- Wall Push-ups -> Incline -> Regular -> Decline -> One-arm
DO $$
DECLARE
  v_wall_id uuid;
  v_incline_id uuid;
  v_regular_id uuid;
  v_decline_id uuid;
  v_diamond_id uuid;
  v_archer_id uuid;
  v_onearm_id uuid;
BEGIN
  -- Find base push-up variations
  SELECT id INTO v_wall_id FROM exercises WHERE name ILIKE '%wall%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_incline_id FROM exercises WHERE name ILIKE '%incline%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_regular_id FROM exercises WHERE name = 'Push-ups' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_decline_id FROM exercises WHERE name ILIKE '%decline%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_diamond_id FROM exercises WHERE name ILIKE '%diamond%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_archer_id FROM exercises WHERE name ILIKE '%archer%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_onearm_id FROM exercises WHERE name ILIKE '%one%arm%push%' AND discipline = 'calisthenics' LIMIT 1;

  -- Wall -> Incline
  IF v_wall_id IS NOT NULL AND v_incline_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_wall_id, v_incline_id, 'progression', 1, '3 sets of 15 reps with good form', 2, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Incline -> Regular
  IF v_incline_id IS NOT NULL AND v_regular_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_incline_id, v_regular_id, 'progression', 1, '3 sets of 12 reps with controlled tempo', 3, 2)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Regular -> Decline
  IF v_regular_id IS NOT NULL AND v_decline_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_regular_id, v_decline_id, 'progression', 1, '3 sets of 20 reps mastered', 4, 3)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Regular -> Diamond (variation)
  IF v_regular_id IS NOT NULL AND v_diamond_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_regular_id, v_diamond_id, 'variation', 0, 'More tricep emphasis, same difficulty', 1, NULL)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Decline -> Archer
  IF v_decline_id IS NOT NULL AND v_archer_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_decline_id, v_archer_id, 'progression', 2, 'Unilateral strength preparation', 6, 4)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Archer -> One-arm
  IF v_archer_id IS NOT NULL AND v_onearm_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_archer_id, v_onearm_id, 'progression', 3, '5 reps per side with full range', 8, 5)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Regressions
  IF v_regular_id IS NOT NULL AND v_incline_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve)
    VALUES (v_regular_id, v_incline_id, 'regression', -1, 'Reduce load for recovery or beginners', 0)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 2. CALISTHENICS PULL PROGRESSIONS (Pull-ups)
-- ============================================================================

-- Scapula pulls -> Negatives -> Band-assisted -> Regular -> Weighted -> One-arm
DO $$
DECLARE
  v_scapula_id uuid;
  v_negative_id uuid;
  v_assisted_id uuid;
  v_regular_id uuid;
  v_weighted_id uuid;
  v_archer_id uuid;
  v_onearm_id uuid;
  v_wide_id uuid;
  v_lsit_id uuid;
BEGIN
  SELECT id INTO v_scapula_id FROM exercises WHERE name ILIKE '%scapula%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_negative_id FROM exercises WHERE name ILIKE '%negative%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_assisted_id FROM exercises WHERE name ILIKE '%assisted%pull%' OR name ILIKE '%band%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_regular_id FROM exercises WHERE name = 'Pull-ups' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_weighted_id FROM exercises WHERE name ILIKE '%weighted%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_archer_id FROM exercises WHERE name ILIKE '%archer%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_onearm_id FROM exercises WHERE name ILIKE '%one%arm%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_wide_id FROM exercises WHERE name ILIKE '%wide%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_lsit_id FROM exercises WHERE name ILIKE '%l-sit%pull%' AND discipline = 'calisthenics' LIMIT 1;

  -- Scapula -> Negatives
  IF v_scapula_id IS NOT NULL AND v_negative_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_scapula_id, v_negative_id, 'progression', 1, 'Control 5-second descent for 5 reps', 2, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Negatives -> Assisted
  IF v_negative_id IS NOT NULL AND v_assisted_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_negative_id, v_assisted_id, 'progression', 1, 'Complete 8 reps with band assistance', 3, 2)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assisted -> Regular
  IF v_assisted_id IS NOT NULL AND v_regular_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_assisted_id, v_regular_id, 'progression', 2, 'First unassisted pull-up with full range', 6, 3)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Regular -> Weighted
  IF v_regular_id IS NOT NULL AND v_weighted_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_regular_id, v_weighted_id, 'progression', 1, '10+ strict pull-ups achieved', 8, 4)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Regular -> Wide (variation)
  IF v_regular_id IS NOT NULL AND v_wide_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve)
    VALUES (v_regular_id, v_wide_id, 'variation', 0, 'Emphasizes lats more', 2)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Regular -> L-sit (variation)
  IF v_regular_id IS NOT NULL AND v_lsit_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve)
    VALUES (v_regular_id, v_lsit_id, 'variation', 1, 'Adds core strength requirement', 4)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Weighted -> Archer
  IF v_weighted_id IS NOT NULL AND v_archer_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_weighted_id, v_archer_id, 'progression', 2, 'Pull-up with +20kg for 5 reps', 12, 5)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Archer -> One-arm
  IF v_archer_id IS NOT NULL AND v_onearm_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_archer_id, v_onearm_id, 'progression', 3, 'Elite unilateral pulling strength', 16, 6)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Prerequisites
  IF v_regular_id IS NOT NULL AND v_scapula_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_regular_id, v_scapula_id, 'prerequisite', -2, 'Master scapular engagement first')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Regressions
  IF v_regular_id IS NOT NULL AND v_assisted_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_regular_id, v_assisted_id, 'regression', -2, 'Band assistance for volume work or deload')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 3. CALISTHENICS CORE PROGRESSIONS
-- ============================================================================

-- Plank -> Hollow hold -> L-sit -> V-sit -> Manna
DO $$
DECLARE
  v_plank_id uuid;
  v_hollow_id uuid;
  v_lsit_id uuid;
  v_vsit_id uuid;
  v_dragon_id uuid;
BEGIN
  SELECT id INTO v_plank_id FROM exercises WHERE name ILIKE 'plank' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_hollow_id FROM exercises WHERE name ILIKE '%hollow%hold%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_lsit_id FROM exercises WHERE name ILIKE 'l-sit' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_vsit_id FROM exercises WHERE name ILIKE 'v-sit' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_dragon_id FROM exercises WHERE name ILIKE '%dragon%flag%' AND discipline = 'calisthenics' LIMIT 1;

  -- Plank -> Hollow hold
  IF v_plank_id IS NOT NULL AND v_hollow_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_plank_id, v_hollow_id, 'progression', 1, 'Hold plank 60 seconds', 4, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Hollow -> L-sit
  IF v_hollow_id IS NOT NULL AND v_lsit_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_hollow_id, v_lsit_id, 'progression', 2, 'Hollow hold 30 seconds + hip flexor strength', 8, 2)
    ON CONFLICT DO NOTHING;
  END IF;

  -- L-sit -> V-sit
  IF v_lsit_id IS NOT NULL AND v_vsit_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve, sequence_order)
    VALUES (v_lsit_id, v_vsit_id, 'progression', 2, 'L-sit 20 seconds + advanced compression', 12, 3)
    ON CONFLICT DO NOTHING;
  END IF;

  -- L-sit -> Dragon Flag
  IF v_lsit_id IS NOT NULL AND v_dragon_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, progression_criteria, estimated_weeks_to_achieve)
    VALUES (v_lsit_id, v_dragon_id, 'variation', 2, 'Advanced core compression skill', 16)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 4. FORCE TRAINING PROGRESSIONS (Compound lifts)
-- ============================================================================

-- Barbell Bench Press progression
DO $$
DECLARE
  v_barbell_bench_id uuid;
  v_incline_bench_id uuid;
  v_decline_bench_id uuid;
  v_close_grip_id uuid;
BEGIN
  SELECT id INTO v_barbell_bench_id FROM exercises WHERE name ILIKE '%barbell%bench%press%' AND name NOT ILIKE '%incline%' AND name NOT ILIKE '%decline%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_incline_bench_id FROM exercises WHERE name ILIKE '%incline%bench%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_decline_bench_id FROM exercises WHERE name ILIKE '%decline%bench%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_close_grip_id FROM exercises WHERE name ILIKE '%close%grip%bench%' AND discipline = 'force' LIMIT 1;

  -- Flat -> Incline (variation)
  IF v_barbell_bench_id IS NOT NULL AND v_incline_bench_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_barbell_bench_id, v_incline_bench_id, 'variation', 0, 'Upper chest emphasis')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Flat -> Decline (variation)
  IF v_barbell_bench_id IS NOT NULL AND v_decline_bench_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_barbell_bench_id, v_decline_bench_id, 'variation', 0, 'Lower chest emphasis')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Flat -> Close grip (variation)
  IF v_barbell_bench_id IS NOT NULL AND v_close_grip_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_barbell_bench_id, v_close_grip_id, 'variation', 0, 'Tricep emphasis')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 5. EQUIPMENT ALTERNATIVES
-- ============================================================================

-- Barbell <-> Dumbbell <-> Bodyweight alternatives
INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
SELECT DISTINCT
  e1.id,
  e2.id,
  'alternative',
  0,
  format('Use %s when barbell unavailable', 
    CASE WHEN e2.name ILIKE '%dumbbell%' THEN 'dumbbells'
         WHEN e2.discipline = 'calisthenics' THEN 'bodyweight'
         ELSE 'alternative equipment'
    END)
FROM exercises e1
CROSS JOIN exercises e2
WHERE e1.discipline = 'force'
  AND e1.name ILIKE '%barbell%bench%'
  AND (e2.name ILIKE '%dumbbell%press%' OR 
       (e2.discipline = 'calisthenics' AND e2.category = 'push'))
  AND e1.id != e2.id
LIMIT 100
ON CONFLICT DO NOTHING;

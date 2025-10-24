/*
  # Phase 7 - Step 2: Establish Regressions and Lateral Variations

  ## Overview
  Creates comprehensive regression paths for accessibility and lateral variations
  for training variety while maintaining the same difficulty level.

  ## Strategy
  1. **Regressions**: Easier variations for deload, recovery, or beginners
     - Band assistance, tempo modifications, range reduction
     - Volume reduction strategies
     - Joint-friendly alternatives

  2. **Lateral Variations**: Same level, different stimulus
     - Grip variations (pronated, supinated, neutral, mixed)
     - Stance variations (wide, narrow, staggered, split)
     - Equipment variations (barbell ↔ dumbbell ↔ kettlebell)
     - Tempo variations (explosive, controlled, isometric)
     - Angle variations (incline, decline, horizontal)

  3. **Goal-Based Paths**: Different training objectives
     - Strength: Low reps, high intensity, long rest
     - Hypertrophy: Moderate reps, moderate intensity, medium rest
     - Endurance: High reps, low intensity, short rest
     - Power: Explosive reps, submaximal intensity, full rest

  ## Relationship Types Used
  - regression: Easier variation for accessibility
  - variation: Same level, different stimulus
  - alternative: Equipment-based substitution
  - prerequisite: Foundation requirement

  ## Security
  - Data enrichment only
  - No schema modifications
*/

-- ============================================================================
-- 1. CALISTHENICS PUSH REGRESSIONS
-- ============================================================================

-- Add comprehensive regressions for push-ups
DO $$
DECLARE
  v_onearm_id uuid;
  v_archer_id uuid;
  v_decline_id uuid;
  v_regular_id uuid;
  v_incline_id uuid;
  v_wall_id uuid;
  v_knee_id uuid;
  v_diamond_id uuid;
  v_wide_id uuid;
  v_pike_id uuid;
  v_pseudo_id uuid;
BEGIN
  -- Find all push-up variations
  SELECT id INTO v_onearm_id FROM exercises WHERE name ILIKE '%one%arm%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_archer_id FROM exercises WHERE name ILIKE '%archer%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_decline_id FROM exercises WHERE name ILIKE '%decline%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_regular_id FROM exercises WHERE name = 'Push-ups' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_incline_id FROM exercises WHERE name ILIKE '%incline%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_wall_id FROM exercises WHERE name ILIKE '%wall%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_knee_id FROM exercises WHERE name ILIKE '%knee%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_diamond_id FROM exercises WHERE name ILIKE '%diamond%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_wide_id FROM exercises WHERE name ILIKE '%wide%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_pike_id FROM exercises WHERE name ILIKE '%pike%push%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_pseudo_id FROM exercises WHERE name ILIKE '%pseudo%planche%push%' AND discipline = 'calisthenics' LIMIT 1;

  -- One-arm regressions
  IF v_onearm_id IS NOT NULL THEN
    IF v_archer_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_onearm_id, v_archer_id, 'regression', -3, 'Archer push-ups for assisted one-arm work')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_decline_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_onearm_id, v_decline_id, 'regression', -5, 'Drop to decline push-ups for volume work')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Archer regressions
  IF v_archer_id IS NOT NULL THEN
    IF v_decline_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_archer_id, v_decline_id, 'regression', -2, 'Decline for building unilateral strength base')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_regular_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_archer_id, v_regular_id, 'regression', -2, 'Regular push-ups for recovery days')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Decline regressions
  IF v_decline_id IS NOT NULL THEN
    IF v_regular_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_decline_id, v_regular_id, 'regression', -1, 'Regular push-ups for deload weeks')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Regular regressions
  IF v_regular_id IS NOT NULL THEN
    IF v_incline_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_incline_id, 'regression', -1, 'Incline for shoulder-friendly variation')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_knee_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_knee_id, 'regression', -2, 'Knee push-ups for beginners or high-volume sets')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Incline regressions
  IF v_incline_id IS NOT NULL THEN
    IF v_wall_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_incline_id, v_wall_id, 'regression', -1, 'Wall push-ups for absolute beginners')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Lateral variations (same difficulty, different stimulus)
  IF v_regular_id IS NOT NULL THEN
    IF v_diamond_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_diamond_id, 'variation', 0, 'Tricep-focused variation, same difficulty')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_wide_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_wide_id, 'variation', 0, 'Chest-focused variation, same difficulty')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_pike_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_pike_id, 'variation', 1, 'Shoulder-focused variation with vertical press component')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Advanced variations
  IF v_decline_id IS NOT NULL AND v_pseudo_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_decline_id, v_pseudo_id, 'variation', 2, 'Planche preparation with forward lean')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 2. CALISTHENICS PULL REGRESSIONS
-- ============================================================================

-- Add comprehensive regressions for pull-ups
DO $$
DECLARE
  v_onearm_id uuid;
  v_archer_id uuid;
  v_weighted_id uuid;
  v_regular_id uuid;
  v_assisted_id uuid;
  v_negative_id uuid;
  v_scapula_id uuid;
  v_chinup_id uuid;
  v_neutral_id uuid;
  v_wide_id uuid;
  v_commando_id uuid;
  v_lsit_id uuid;
BEGIN
  -- Find all pull-up variations
  SELECT id INTO v_onearm_id FROM exercises WHERE name ILIKE '%one%arm%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_archer_id FROM exercises WHERE name ILIKE '%archer%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_weighted_id FROM exercises WHERE name ILIKE '%weighted%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_regular_id FROM exercises WHERE name = 'Pull-ups' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_assisted_id FROM exercises WHERE name ILIKE '%assisted%pull%' OR name ILIKE '%band%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_negative_id FROM exercises WHERE name ILIKE '%negative%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_scapula_id FROM exercises WHERE name ILIKE '%scapula%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_chinup_id FROM exercises WHERE name ILIKE 'chin%up%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_neutral_id FROM exercises WHERE name ILIKE '%neutral%grip%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_wide_id FROM exercises WHERE name ILIKE '%wide%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_commando_id FROM exercises WHERE name ILIKE '%commando%pull%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_lsit_id FROM exercises WHERE name ILIKE '%l-sit%pull%' AND discipline = 'calisthenics' LIMIT 1;

  -- One-arm regressions
  IF v_onearm_id IS NOT NULL THEN
    IF v_archer_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_onearm_id, v_archer_id, 'regression', -3, 'Archer pull-ups for assisted one-arm progression')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_weighted_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_onearm_id, v_weighted_id, 'regression', -4, 'Weighted pull-ups for building bilateral strength')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Archer regressions
  IF v_archer_id IS NOT NULL THEN
    IF v_weighted_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_archer_id, v_weighted_id, 'regression', -2, 'Weighted for straight-bar strength building')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_regular_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_archer_id, v_regular_id, 'regression', -2, 'Regular pull-ups for high-volume training')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Weighted regressions
  IF v_weighted_id IS NOT NULL THEN
    IF v_regular_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_weighted_id, v_regular_id, 'regression', -1, 'Bodyweight for deload or endurance focus')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Regular regressions
  IF v_regular_id IS NOT NULL THEN
    IF v_assisted_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_assisted_id, 'regression', -2, 'Band assistance for volume work or recovery')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_negative_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_negative_id, 'regression', -3, 'Negative-only for building strength')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_chinup_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_chinup_id, 'regression', -1, 'Chin-ups for bicep assistance (easier)')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Assisted regressions
  IF v_assisted_id IS NOT NULL THEN
    IF v_negative_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_assisted_id, v_negative_id, 'regression', -1, 'Focus on eccentric strength building')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_scapula_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_assisted_id, v_scapula_id, 'regression', -2, 'Scapular engagement practice')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Negative regressions
  IF v_negative_id IS NOT NULL THEN
    IF v_scapula_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_negative_id, v_scapula_id, 'regression', -1, 'Back to basics for shoulder health')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Lateral variations (grip changes)
  IF v_regular_id IS NOT NULL THEN
    IF v_chinup_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_chinup_id, 'variation', 0, 'Supinated grip for bicep emphasis')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_neutral_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_neutral_id, 'variation', 0, 'Neutral grip for elbow-friendly variation')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_wide_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_wide_id, 'variation', 0, 'Wide grip for lat emphasis')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_commando_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_commando_id, 'variation', 1, 'Commando grip for core anti-rotation')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_lsit_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_regular_id, v_lsit_id, 'variation', 1, 'L-sit position for core integration')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 3. FORCE TRAINING REGRESSIONS (Barbell Movements)
-- ============================================================================

-- Bench Press regressions and variations
DO $$
DECLARE
  v_barbell_bench_id uuid;
  v_dumbbell_bench_id uuid;
  v_incline_barbell_id uuid;
  v_incline_dumbbell_id uuid;
  v_decline_barbell_id uuid;
  v_close_grip_id uuid;
  v_floor_press_id uuid;
  v_pushup_id uuid;
BEGIN
  SELECT id INTO v_barbell_bench_id FROM exercises WHERE name ILIKE '%barbell%bench%press%' AND name NOT ILIKE '%incline%' AND name NOT ILIKE '%decline%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_dumbbell_bench_id FROM exercises WHERE name ILIKE '%dumbbell%bench%press%' AND name NOT ILIKE '%incline%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_incline_barbell_id FROM exercises WHERE name ILIKE '%incline%barbell%bench%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_incline_dumbbell_id FROM exercises WHERE name ILIKE '%incline%dumbbell%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_decline_barbell_id FROM exercises WHERE name ILIKE '%decline%barbell%bench%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_close_grip_id FROM exercises WHERE name ILIKE '%close%grip%bench%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_floor_press_id FROM exercises WHERE name ILIKE '%floor%press%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_pushup_id FROM exercises WHERE name = 'Push-ups' AND discipline = 'calisthenics' LIMIT 1;

  -- Barbell bench regressions
  IF v_barbell_bench_id IS NOT NULL THEN
    IF v_dumbbell_bench_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_bench_id, v_dumbbell_bench_id, 'regression', -1, 'Dumbbells for shoulder-friendly movement and unilateral balance')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_floor_press_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_bench_id, v_floor_press_id, 'regression', -1, 'Floor press for reduced range (shoulder-friendly)')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_pushup_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_bench_id, v_pushup_id, 'regression', -2, 'Bodyweight push-ups for deload or travel')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Angle variations
  IF v_barbell_bench_id IS NOT NULL THEN
    IF v_incline_barbell_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_bench_id, v_incline_barbell_id, 'variation', 0, 'Upper chest emphasis, same difficulty')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_decline_barbell_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_bench_id, v_decline_barbell_id, 'variation', 0, 'Lower chest emphasis, same difficulty')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_close_grip_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_bench_id, v_close_grip_id, 'variation', 0, 'Tricep emphasis, similar difficulty')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Equipment alternatives (barbell ↔ dumbbell)
  IF v_barbell_bench_id IS NOT NULL AND v_dumbbell_bench_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_barbell_bench_id, v_dumbbell_bench_id, 'alternative', 0, 'Use dumbbells when barbell unavailable')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_incline_barbell_id IS NOT NULL AND v_incline_dumbbell_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_incline_barbell_id, v_incline_dumbbell_id, 'alternative', 0, 'Dumbbell alternative for incline work')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Squat regressions and variations
DO $$
DECLARE
  v_barbell_squat_id uuid;
  v_goblet_squat_id uuid;
  v_front_squat_id uuid;
  v_box_squat_id uuid;
  v_split_squat_id uuid;
  v_bodyweight_squat_id uuid;
  v_bulgarian_id uuid;
BEGIN
  SELECT id INTO v_barbell_squat_id FROM exercises WHERE name ILIKE '%barbell%back%squat%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_goblet_squat_id FROM exercises WHERE name ILIKE '%goblet%squat%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_front_squat_id FROM exercises WHERE name ILIKE '%front%squat%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_box_squat_id FROM exercises WHERE name ILIKE '%box%squat%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_split_squat_id FROM exercises WHERE name ILIKE '%split%squat%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_bodyweight_squat_id FROM exercises WHERE name ILIKE 'squat%' AND discipline = 'calisthenics' LIMIT 1;
  SELECT id INTO v_bulgarian_id FROM exercises WHERE name ILIKE '%bulgarian%split%' AND discipline = 'force' LIMIT 1;

  -- Back squat regressions
  IF v_barbell_squat_id IS NOT NULL THEN
    IF v_goblet_squat_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_squat_id, v_goblet_squat_id, 'regression', -2, 'Goblet squat for learning pattern and deload')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_box_squat_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_squat_id, v_box_squat_id, 'regression', -1, 'Box squat for depth control and confidence')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_bodyweight_squat_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_squat_id, v_bodyweight_squat_id, 'regression', -3, 'Bodyweight for mobility and pattern practice')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Bar position variations
  IF v_barbell_squat_id IS NOT NULL AND v_front_squat_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_barbell_squat_id, v_front_squat_id, 'variation', 0, 'Front squat for quad emphasis and upright torso')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Unilateral variations
  IF v_barbell_squat_id IS NOT NULL THEN
    IF v_split_squat_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_squat_id, v_split_squat_id, 'variation', 0, 'Split squat for unilateral strength')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_bulgarian_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_barbell_squat_id, v_bulgarian_id, 'variation', 0, 'Bulgarian split for single-leg focus')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- Deadlift regressions and variations
DO $$
DECLARE
  v_conventional_id uuid;
  v_sumo_id uuid;
  v_romanian_id uuid;
  v_trap_bar_id uuid;
  v_rack_pull_id uuid;
  v_single_leg_id uuid;
BEGIN
  SELECT id INTO v_conventional_id FROM exercises WHERE name ILIKE '%conventional%deadlift%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_sumo_id FROM exercises WHERE name ILIKE '%sumo%deadlift%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_romanian_id FROM exercises WHERE name ILIKE '%romanian%deadlift%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_trap_bar_id FROM exercises WHERE name ILIKE '%trap%bar%deadlift%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_rack_pull_id FROM exercises WHERE name ILIKE '%rack%pull%' AND discipline = 'force' LIMIT 1;
  SELECT id INTO v_single_leg_id FROM exercises WHERE name ILIKE '%single%leg%deadlift%' AND discipline = 'force' LIMIT 1;

  -- Conventional deadlift regressions
  IF v_conventional_id IS NOT NULL THEN
    IF v_trap_bar_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_conventional_id, v_trap_bar_id, 'regression', -1, 'Trap bar for more forgiving mechanics')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_rack_pull_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_conventional_id, v_rack_pull_id, 'regression', -1, 'Rack pulls for reduced range (back-friendly)')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_romanian_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_conventional_id, v_romanian_id, 'regression', -1, 'Romanian for hamstring focus with less load')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Stance variations
  IF v_conventional_id IS NOT NULL AND v_sumo_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_conventional_id, v_sumo_id, 'variation', 0, 'Sumo stance for hip-dominant pulling')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Unilateral variation
  IF v_romanian_id IS NOT NULL AND v_single_leg_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_romanian_id, v_single_leg_id, 'variation', 0, 'Single-leg for balance and stability')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 4. ENDURANCE TRAINING REGRESSIONS
-- ============================================================================

-- Running intensity regressions
DO $$
DECLARE
  v_sprint_id uuid;
  v_tempo_id uuid;
  v_steady_id uuid;
  v_recovery_id uuid;
  v_interval_id uuid;
  v_fartlek_id uuid;
BEGIN
  SELECT id INTO v_sprint_id FROM exercises WHERE name ILIKE '%sprint%' AND discipline = 'endurance' LIMIT 1;
  SELECT id INTO v_tempo_id FROM exercises WHERE name ILIKE '%tempo%run%' AND discipline = 'endurance' LIMIT 1;
  SELECT id INTO v_steady_id FROM exercises WHERE name ILIKE '%steady%state%' AND discipline = 'endurance' LIMIT 1;
  SELECT id INTO v_recovery_id FROM exercises WHERE name ILIKE '%recovery%run%' AND discipline = 'endurance' LIMIT 1;
  SELECT id INTO v_interval_id FROM exercises WHERE name ILIKE '%interval%' AND discipline = 'endurance' LIMIT 1;
  SELECT id INTO v_fartlek_id FROM exercises WHERE name ILIKE '%fartlek%' AND discipline = 'endurance' LIMIT 1;

  -- Sprint regressions
  IF v_sprint_id IS NOT NULL THEN
    IF v_interval_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_sprint_id, v_interval_id, 'regression', -1, 'Intervals for structured speed work with rest')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_tempo_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_sprint_id, v_tempo_id, 'regression', -2, 'Tempo for controlled pace training')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Tempo regressions
  IF v_tempo_id IS NOT NULL THEN
    IF v_steady_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_tempo_id, v_steady_id, 'regression', -1, 'Steady state for aerobic base building')
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_recovery_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_tempo_id, v_recovery_id, 'regression', -2, 'Recovery pace for active rest')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Variations
  IF v_tempo_id IS NOT NULL AND v_fartlek_id IS NOT NULL THEN
    INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
    VALUES (v_tempo_id, v_fartlek_id, 'variation', 0, 'Fartlek for unstructured speed play')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 5. FUNCTIONAL TRAINING REGRESSIONS
-- ============================================================================

-- Benchmark WOD regressions (CrossFit style)
DO $$
DECLARE
  v_rx_id uuid;
  v_scaled_id uuid;
BEGIN
  -- Find RX vs Scaled versions of benchmark workouts
  FOR v_rx_id, v_scaled_id IN
    SELECT e1.id, e2.id
    FROM exercises e1
    CROSS JOIN exercises e2
    WHERE e1.discipline = 'functional'
      AND e2.discipline = 'functional'
      AND e1.name ILIKE '%rx%'
      AND e2.name ILIKE REPLACE(e1.name, 'RX', 'Scaled')
      AND e1.id != e2.id
    LIMIT 20
  LOOP
    IF v_rx_id IS NOT NULL AND v_scaled_id IS NOT NULL THEN
      INSERT INTO exercise_progressions (exercise_id, related_exercise_id, relationship_type, difficulty_delta, notes)
      VALUES (v_rx_id, v_scaled_id, 'regression', -2, 'Scaled version for building capacity')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 6. GOAL-BASED PROGRESSION PATHS
-- ============================================================================

-- Goal-specific progressions are defined through relationship_type and difficulty_delta:
-- - Progressions (difficulty_delta >= 2): Strength focus - low reps, high intensity
-- - Variations (difficulty_delta = 0): Hypertrophy focus - moderate reps, moderate intensity
-- - Regressions (difficulty_delta <= -1): Endurance/accessibility focus - high reps, lower intensity

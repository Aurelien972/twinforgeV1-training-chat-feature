/*
  # Phase 6 - Step 2: Complete Muscle Groups for All Exercises

  ## Overview
  Assigns muscle groups to 391 exercises missing this critical metadata.
  Uses correct muscle group names from the database.

  ## Strategy
  - Map category/name patterns to appropriate muscle group IDs
  - Use French names where appropriate (trapezes, dorsaux, etc.)
  - Assign primary muscles with high activation (80%)
  - Assign secondary muscles with moderate activation (40%)

  ## Changes
  - Calisthenics: 45 exercises
  - Competitions: 332 exercises  
  - Force: 11 exercises
  - Mobility/Rehab: 3 exercises

  ## Security
  - No schema changes
  - Data enrichment only
*/

DO $$
DECLARE
  v_lats_id uuid;
  v_biceps_id uuid;
  v_chest_id uuid;
  v_triceps_id uuid;
  v_shoulders_id uuid;
  v_quads_id uuid;
  v_glutes_id uuid;
  v_core_id uuid;
  v_dorsaux_id uuid;
  v_trapezes_id uuid;
  v_avant_bras_id uuid;
  v_calves_id uuid;
  v_hip_flexors_id uuid;
  v_corps_complet_id uuid;
BEGIN
  -- Get muscle group IDs (using both English and French names)
  SELECT id INTO v_lats_id FROM muscle_groups WHERE name = 'lats' LIMIT 1;
  SELECT id INTO v_dorsaux_id FROM muscle_groups WHERE name = 'dorsaux' LIMIT 1;
  SELECT id INTO v_biceps_id FROM muscle_groups WHERE name = 'biceps' LIMIT 1;
  SELECT id INTO v_chest_id FROM muscle_groups WHERE name = 'chest' LIMIT 1;
  SELECT id INTO v_triceps_id FROM muscle_groups WHERE name = 'triceps' LIMIT 1;
  SELECT id INTO v_shoulders_id FROM muscle_groups WHERE name = 'shoulders' LIMIT 1;
  SELECT id INTO v_quads_id FROM muscle_groups WHERE name = 'quads' LIMIT 1;
  SELECT id INTO v_glutes_id FROM muscle_groups WHERE name = 'glutes' LIMIT 1;
  SELECT id INTO v_core_id FROM muscle_groups WHERE name = 'core' LIMIT 1;
  SELECT id INTO v_trapezes_id FROM muscle_groups WHERE name = 'trapezes' LIMIT 1;
  SELECT id INTO v_avant_bras_id FROM muscle_groups WHERE name = 'avant-bras' LIMIT 1;
  SELECT id INTO v_calves_id FROM muscle_groups WHERE name = 'calves' LIMIT 1;
  SELECT id INTO v_hip_flexors_id FROM muscle_groups WHERE name = 'hip-flexors' LIMIT 1;
  SELECT id INTO v_corps_complet_id FROM muscle_groups WHERE name = 'corps-complet' LIMIT 1;

  -- ============================================================================
  -- 1. CALISTHENICS EXERCISES
  -- ============================================================================

  -- Core exercises
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_core_id, 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'calisthenics' 
    AND e.category = 'core'
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Pull exercises
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, COALESCE(v_lats_id, v_dorsaux_id), 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'calisthenics' 
    AND e.category = 'pull'
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
    AND (v_lats_id IS NOT NULL OR v_dorsaux_id IS NOT NULL)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_biceps_id, 'secondary', 40
  FROM exercises e
  WHERE e.discipline = 'calisthenics' 
    AND e.category = 'pull'
    AND v_biceps_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id AND emg.muscle_group_id = v_biceps_id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Push exercises (Push-ups)
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_chest_id, 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'calisthenics' 
    AND e.category = 'push'
    AND e.name ILIKE '%push-up%'
    AND v_chest_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Push exercises (Pike = Shoulders)
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_shoulders_id, 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'calisthenics' 
    AND e.category = 'push'
    AND e.name ILIKE '%pike%'
    AND v_shoulders_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Squat exercises
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_quads_id, 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'calisthenics' 
    AND e.category = 'squat'
    AND v_quads_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Compound/Skill exercises (Muscle-ups)
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, COALESCE(v_lats_id, v_dorsaux_id), 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'calisthenics' 
    AND e.category IN ('compound', 'skill')
    AND e.name ILIKE '%muscle-up%'
    AND (v_lats_id IS NOT NULL OR v_dorsaux_id IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- ============================================================================
  -- 2. COMPETITIONS EXERCISES
  -- ============================================================================

  -- Running
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_quads_id, 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'competitions' 
    AND e.name ILIKE '%run%'
    AND v_quads_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- SkiErg / Rowing
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, COALESCE(v_lats_id, v_dorsaux_id), 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'competitions' 
    AND (e.name ILIKE '%ski%' OR e.name ILIKE '%row%')
    AND (v_lats_id IS NOT NULL OR v_dorsaux_id IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Sled Push
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_quads_id, 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'competitions' 
    AND e.name ILIKE '%sled%push%'
    AND v_quads_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Sled Pull  
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, COALESCE(v_lats_id, v_dorsaux_id), 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'competitions' 
    AND e.name ILIKE '%sled%pull%'
    AND (v_lats_id IS NOT NULL OR v_dorsaux_id IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Burpees
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_chest_id, 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'competitions' 
    AND e.name ILIKE '%burpee%'
    AND v_chest_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Wall Balls
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_quads_id, 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'competitions' 
    AND e.name ILIKE '%wall ball%'
    AND v_quads_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Lunges
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_quads_id, 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'competitions' 
    AND e.name ILIKE '%lunge%'
    AND v_quads_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- Farmers Carry
  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_trapezes_id, 'primary', 80
  FROM exercises e
  WHERE e.discipline = 'competitions' 
    AND e.name ILIKE '%farmer%'
    AND v_trapezes_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- ============================================================================
  -- 3. FORCE EXERCISES
  -- ============================================================================

  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, 
    CASE 
      WHEN (e.name ILIKE '%press%' OR e.name ILIKE '%bench%') AND v_chest_id IS NOT NULL THEN v_chest_id
      WHEN (e.name ILIKE '%row%' OR e.name ILIKE '%pull%') AND v_lats_id IS NOT NULL THEN v_lats_id
      WHEN (e.name ILIKE '%squat%' OR e.name ILIKE '%leg%') AND v_quads_id IS NOT NULL THEN v_quads_id
      WHEN e.name ILIKE '%curl%' AND v_biceps_id IS NOT NULL THEN v_biceps_id
      WHEN e.name ILIKE '%extension%' AND v_triceps_id IS NOT NULL THEN v_triceps_id
      ELSE v_core_id
    END,
    'primary',
    80
  FROM exercises e
  WHERE e.discipline = 'force' 
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
    AND (
      (e.name ILIKE '%press%' AND v_chest_id IS NOT NULL) OR
      (e.name ILIKE '%bench%' AND v_chest_id IS NOT NULL) OR
      (e.name ILIKE '%row%' AND v_lats_id IS NOT NULL) OR
      (e.name ILIKE '%pull%' AND v_lats_id IS NOT NULL) OR
      (e.name ILIKE '%squat%' AND v_quads_id IS NOT NULL) OR
      (e.name ILIKE '%leg%' AND v_quads_id IS NOT NULL) OR
      (e.name ILIKE '%curl%' AND v_biceps_id IS NOT NULL) OR
      (e.name ILIKE '%extension%' AND v_triceps_id IS NOT NULL) OR
      v_core_id IS NOT NULL
    )
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

  -- ============================================================================
  -- 4. MOBILITY & REHAB
  -- ============================================================================

  INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_type, activation_percentage)
  SELECT e.id, v_corps_complet_id, 'primary', 60
  FROM exercises e
  WHERE e.discipline IN ('mobility', 'rehab')
    AND v_corps_complet_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_muscle_groups emg WHERE emg.exercise_id = e.id)
  ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

END $$;

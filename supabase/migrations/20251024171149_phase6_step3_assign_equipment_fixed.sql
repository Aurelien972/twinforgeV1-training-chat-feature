/*
  # Phase 6 - Step 3: Assign Equipment to Exercises

  ## Overview
  Assigns equipment to 1508 exercises currently without equipment.
  Uses correct column name: equipment_id (not equipment_type_id).

  ## Strategy
  - Calisthenics: pull-up-bar, rings, parallettes, dip-bars, floor
  - Endurance: treadmill, bike, rowing-machine, ski-erg
  - Competitions: Mix of functional equipment
  - Functional: barbell, kettlebell, box, rope

  ## Changes
  - Maps exercises to appropriate equipment based on patterns
  - Handles bodyweight exercises (none/floor)
  - Assigns gymnastic equipment for skill work

  ## Security
  - No schema changes
  - Data enrichment only
*/

DO $$
DECLARE
  v_pullup_bar_id uuid;
  v_rings_id uuid;
  v_parallettes_id uuid;
  v_dip_bars_id uuid;
  v_parallel_bars_id uuid;
  v_floor_id uuid;
  v_none_id uuid;
  v_box_id uuid;
  v_barbell_id uuid;
  v_dumbbell_id uuid;
  v_kettlebell_id uuid;
  v_treadmill_id uuid;
  v_bike_id uuid;
  v_rowing_id uuid;
  v_ski_erg_id uuid;
  v_sled_id uuid;
  v_rope_id uuid;
  v_sandbag_id uuid;
  v_medicine_ball_id uuid;
BEGIN
  -- Get equipment IDs
  SELECT id INTO v_pullup_bar_id FROM equipment_types WHERE name = 'pull-up-bar' LIMIT 1;
  SELECT id INTO v_rings_id FROM equipment_types WHERE name = 'gymnastic-rings' LIMIT 1;
  SELECT id INTO v_parallettes_id FROM equipment_types WHERE name = 'parallettes' LIMIT 1;
  SELECT id INTO v_dip_bars_id FROM equipment_types WHERE name = 'dip-bars' LIMIT 1;
  SELECT id INTO v_parallel_bars_id FROM equipment_types WHERE name = 'parallel-bars' LIMIT 1;
  SELECT id INTO v_floor_id FROM equipment_types WHERE name = 'floor' LIMIT 1;
  SELECT id INTO v_none_id FROM equipment_types WHERE name = 'none' LIMIT 1;
  SELECT id INTO v_box_id FROM equipment_types WHERE name = 'box' LIMIT 1;
  SELECT id INTO v_barbell_id FROM equipment_types WHERE name = 'barbell' LIMIT 1;
  SELECT id INTO v_dumbbell_id FROM equipment_types WHERE name = 'dumbbell' LIMIT 1;
  SELECT id INTO v_kettlebell_id FROM equipment_types WHERE name = 'kettlebell' LIMIT 1;
  SELECT id INTO v_treadmill_id FROM equipment_types WHERE name = 'treadmill' LIMIT 1;
  SELECT id INTO v_bike_id FROM equipment_types WHERE name = 'bike' LIMIT 1;
  SELECT id INTO v_rowing_id FROM equipment_types WHERE name = 'rowing-machine' LIMIT 1;
  SELECT id INTO v_ski_erg_id FROM equipment_types WHERE name = 'ski-erg' LIMIT 1;
  SELECT id INTO v_sled_id FROM equipment_types WHERE name = 'sled' LIMIT 1;
  SELECT id INTO v_rope_id FROM equipment_types WHERE name = 'rope' LIMIT 1;
  SELECT id INTO v_sandbag_id FROM equipment_types WHERE name = 'sandbag' LIMIT 1;
  SELECT id INTO v_medicine_ball_id FROM equipment_types WHERE name = 'medicine-ball' LIMIT 1;

  -- ============================================================================
  -- 1. CALISTHENICS EQUIPMENT
  -- ============================================================================

  -- Pull-ups and variations (pull category)
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_pullup_bar_id, true
  FROM exercises e
  WHERE e.discipline = 'calisthenics'
    AND (e.name ILIKE '%pull-up%' OR e.name ILIKE '%chin-up%' OR e.category = 'pull')
    AND v_pullup_bar_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Rings exercises
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_rings_id, true
  FROM exercises e
  WHERE e.discipline = 'calisthenics'
    AND e.name ILIKE '%ring%'
    AND v_rings_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Dips and parallel bars
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, COALESCE(v_dip_bars_id, v_parallel_bars_id), true
  FROM exercises e
  WHERE e.discipline = 'calisthenics'
    AND (e.name ILIKE '%dip%' OR e.category = 'dip')
    AND (v_dip_bars_id IS NOT NULL OR v_parallel_bars_id IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Floor/bodyweight exercises (Push-ups, Squats, etc.)
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, COALESCE(v_floor_id, v_none_id), true
  FROM exercises e
  WHERE e.discipline = 'calisthenics'
    AND (e.name ILIKE '%push-up%' OR e.name ILIKE '%squat%' OR e.name ILIKE '%lunge%' 
         OR e.category IN ('push', 'squat', 'core'))
    AND (v_floor_id IS NOT NULL OR v_none_id IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Lever/skill work (use bar or rings)
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_pullup_bar_id, true
  FROM exercises e
  WHERE e.discipline = 'calisthenics'
    AND (e.name ILIKE '%lever%' OR e.name ILIKE '%planche%')
    AND v_pullup_bar_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- ============================================================================
  -- 2. ENDURANCE EQUIPMENT
  -- ============================================================================

  -- Running (optional treadmill)
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, COALESCE(v_treadmill_id, v_none_id), false
  FROM exercises e
  WHERE e.discipline = 'endurance'
    AND e.name ILIKE '%run%'
    AND (v_treadmill_id IS NOT NULL OR v_none_id IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Cycling
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_bike_id, true
  FROM exercises e
  WHERE e.discipline = 'endurance'
    AND (e.name ILIKE '%bike%' OR e.name ILIKE '%cycling%')
    AND v_bike_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Rowing
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_rowing_id, true
  FROM exercises e
  WHERE e.discipline = 'endurance'
    AND e.name ILIKE '%row%'
    AND v_rowing_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Swimming (none)
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_none_id, true
  FROM exercises e
  WHERE e.discipline = 'endurance'
    AND e.name ILIKE '%swim%'
    AND v_none_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- ============================================================================
  -- 3. COMPETITIONS EQUIPMENT (Hyrox/Deka)
  -- ============================================================================

  -- SkiErg
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_ski_erg_id, true
  FROM exercises e
  WHERE e.discipline = 'competitions'
    AND e.name ILIKE '%ski%'
    AND v_ski_erg_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Sled
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_sled_id, true
  FROM exercises e
  WHERE e.discipline = 'competitions'
    AND e.name ILIKE '%sled%'
    AND v_sled_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Wall Balls
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_medicine_ball_id, true
  FROM exercises e
  WHERE e.discipline = 'competitions'
    AND e.name ILIKE '%wall ball%'
    AND v_medicine_ball_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Sandbag exercises
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_sandbag_id, true
  FROM exercises e
  WHERE e.discipline = 'competitions'
    AND e.name ILIKE '%sandbag%'
    AND v_sandbag_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Burpees (floor)
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, COALESCE(v_floor_id, v_none_id), true
  FROM exercises e
  WHERE e.discipline = 'competitions'
    AND e.name ILIKE '%burpee%'
    AND (v_floor_id IS NOT NULL OR v_none_id IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Lunges (floor)
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, COALESCE(v_floor_id, v_none_id), true
  FROM exercises e
  WHERE e.discipline = 'competitions'
    AND e.name ILIKE '%lunge%'
    AND (v_floor_id IS NOT NULL OR v_none_id IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Farmers Carry (kettlebell or dumbbell)
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, COALESCE(v_kettlebell_id, v_dumbbell_id), true
  FROM exercises e
  WHERE e.discipline = 'competitions'
    AND e.name ILIKE '%farmer%'
    AND (v_kettlebell_id IS NOT NULL OR v_dumbbell_id IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Rowing (rowing machine)
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_rowing_id, true
  FROM exercises e
  WHERE e.discipline = 'competitions'
    AND e.name ILIKE '%row%'
    AND v_rowing_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- ============================================================================
  -- 4. FUNCTIONAL EQUIPMENT
  -- ============================================================================

  -- Barbell exercises
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_barbell_id, true
  FROM exercises e
  WHERE e.discipline = 'functional'
    AND (e.name ILIKE '%snatch%' OR e.name ILIKE '%clean%' OR e.name ILIKE '%jerk%'
         OR e.name ILIKE '%deadlift%' OR (e.name ILIKE '%squat%' AND e.name ILIKE '%barbell%'))
    AND v_barbell_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Kettlebell exercises
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_kettlebell_id, true
  FROM exercises e
  WHERE e.discipline = 'functional'
    AND e.name ILIKE '%kettlebell%'
    AND v_kettlebell_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Box jumps
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_box_id, true
  FROM exercises e
  WHERE e.discipline = 'functional'
    AND e.name ILIKE '%box%'
    AND v_box_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

  -- Rope exercises
  INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
  SELECT e.id, v_rope_id, true
  FROM exercises e
  WHERE e.discipline = 'functional'
    AND e.name ILIKE '%rope%'
    AND v_rope_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM exercise_equipment ee WHERE ee.exercise_id = e.id)
  ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

END $$;

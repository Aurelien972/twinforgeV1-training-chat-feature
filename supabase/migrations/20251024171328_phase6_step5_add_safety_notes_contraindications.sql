/*
  # Phase 6 - Step 5: Add Safety Notes and Contraindications

  ## Overview
  Enriches ALL exercises with safety notes and contraindications.
  Critical metadata for injury prevention and user safety.

  ## Strategy
  - Safety notes: practical tips for safe execution
  - Contraindications: medical conditions requiring caution/avoidance
  - Pattern-based assignment by discipline and category

  ## Changes
  - Updates safety_notes array for 2594 exercises
  - Updates contraindications array for all 2665 exercises
  - Provides discipline-specific guidance

  ## Security
  - No schema changes
  - Data enrichment only
*/

-- ============================================================================
-- 1. CALISTHENICS SAFETY NOTES
-- ============================================================================

-- Pull exercises (shoulder safety)
UPDATE exercises
SET safety_notes = ARRAY[
  'Warm up shoulders thoroughly before starting',
  'Avoid if experiencing shoulder pain or impingement',
  'Use full range of motion to prevent muscle imbalances',
  'Progress gradually to avoid overuse injuries',
  'Stop immediately if you feel sharp pain'
]
WHERE discipline = 'calisthenics'
  AND category = 'pull'
  AND (safety_notes IS NULL OR array_length(safety_notes, 1) = 0);

-- Push exercises (wrist and shoulder safety)
UPDATE exercises
SET safety_notes = ARRAY[
  'Keep wrists neutral, use fists if wrist pain occurs',
  'Ensure proper shoulder blade positioning',
  'Avoid if you have acute wrist or shoulder injuries',
  'Scale to knees or incline if form breaks down',
  'Maintain core engagement to protect lower back'
]
WHERE discipline = 'calisthenics'
  AND category = 'push'
  AND (safety_notes IS NULL OR array_length(safety_notes, 1) = 0);

-- Core exercises (spine safety)
UPDATE exercises
SET safety_notes = ARRAY[
  'Keep lower back pressed to floor throughout',
  'Avoid if you have herniated discs without clearance',
  'Stop if you feel strain in neck or lower back',
  'Focus on quality over quantity of reps',
  'Breathe continuously, never hold your breath'
]
WHERE discipline = 'calisthenics'
  AND category = 'core'
  AND (safety_notes IS NULL OR array_length(safety_notes, 1) = 0);

-- Skill/advanced movements
UPDATE exercises
SET safety_notes = ARRAY[
  'Master prerequisites before attempting this skill',
  'Use spotter or safety mats when learning',
  'Progress slowly through skill progressions',
  'High injury risk if attempted without preparation',
  'Consider working with qualified coach'
]
WHERE discipline = 'calisthenics'
  AND category IN ('skill', 'advanced_skill', 'planche_progression', 'front_lever_progression', 'back_lever_progression')
  AND (safety_notes IS NULL OR array_length(safety_notes, 1) = 0);

-- ============================================================================
-- 2. FORCE/STRENGTH SAFETY NOTES
-- ============================================================================

UPDATE exercises
SET safety_notes = ARRAY[
  'Use proper lifting technique and controlled tempo',
  'Never sacrifice form for heavier weight',
  'Warm up with lighter weights before working sets',
  'Use spotter for exercises near failure',
  'Stop if you experience joint pain or discomfort',
  'Ensure equipment is properly adjusted and stable'
]
WHERE discipline = 'force'
  AND (safety_notes IS NULL OR array_length(safety_notes, 1) = 0);

-- ============================================================================
-- 3. FUNCTIONAL/CROSSFIT SAFETY NOTES
-- ============================================================================

UPDATE exercises
SET safety_notes = ARRAY[
  'Master movement pattern before adding load or speed',
  'Use appropriate scaling for your fitness level',
  'Maintain awareness of surroundings in group settings',
  'Pace yourself appropriately for workout format',
  'Drop barbell safely if you lose control',
  'Hydrate adequately during high-intensity workouts'
]
WHERE discipline = 'functional'
  AND (safety_notes IS NULL OR array_length(safety_notes, 1) = 0);

-- ============================================================================
-- 4. ENDURANCE SAFETY NOTES
-- ============================================================================

UPDATE exercises
SET safety_notes = ARRAY[
  'Start conservatively and build duration gradually',
  'Stay within your target heart rate zones',
  'Hydrate before, during, and after session',
  'Stop if you experience chest pain or dizziness',
  'Pay attention to weather conditions for outdoor training',
  'Allow adequate recovery between high-intensity sessions'
]
WHERE discipline = 'endurance'
  AND (safety_notes IS NULL OR array_length(safety_notes, 1) = 0);

-- ============================================================================
-- 5. COMPETITIONS (HYROX/DEKA) SAFETY NOTES
-- ============================================================================

UPDATE exercises
SET safety_notes = ARRAY[
  'Pace yourself for the full event duration',
  'Practice transitions between running and stations',
  'Know your limits and scale when needed',
  'Stay hydrated throughout the competition',
  'Be aware of other competitors in tight spaces',
  'Have exit strategy if you need to stop'
]
WHERE discipline = 'competitions'
  AND (safety_notes IS NULL OR array_length(safety_notes, 1) = 0);

-- ============================================================================
-- 6. MOBILITY/REHAB SAFETY NOTES
-- ============================================================================

UPDATE exercises
SET safety_notes = ARRAY[
  'Move slowly and mindfully through each position',
  'Never force a stretch beyond comfortable range',
  'Breathe deeply and relax into stretches',
  'Stop if you feel sharp or shooting pain',
  'Consistent practice yields better results than intensity',
  'Consult healthcare provider for injury recovery'
]
WHERE discipline IN ('mobility', 'rehab')
  AND (safety_notes IS NULL OR array_length(safety_notes, 1) = 0);

-- ============================================================================
-- CONTRAINDICATIONS BY MOVEMENT PATTERN
-- ============================================================================

-- Overhead movements
UPDATE exercises
SET contraindications = ARRAY[
  'Acute shoulder injury or impingement',
  'Rotator cuff tears without medical clearance',
  'Uncontrolled high blood pressure',
  'Recent shoulder surgery (consult surgeon)',
  'Severe thoracic spine mobility restrictions'
]
WHERE (name ILIKE '%overhead%' OR name ILIKE '%press%' OR name ILIKE '%jerk%'
       OR name ILIKE '%handstand%' OR name ILIKE '%pike%')
  AND (contraindications IS NULL OR array_length(contraindications, 1) = 0);

-- Spinal loading (squats, deadlifts)
UPDATE exercises
SET contraindications = ARRAY[
  'Acute lower back injury or herniated disc',
  'Recent spinal surgery without clearance',
  'Severe osteoporosis',
  'Acute sciatica or nerve pain',
  'Pregnancy (third trimester, modify as needed)'
]
WHERE (name ILIKE '%squat%' OR name ILIKE '%deadlift%' OR name ILIKE '%good morning%')
  AND (contraindications IS NULL OR array_length(contraindications, 1) = 0);

-- High-impact (jumping, running)
UPDATE exercises
SET contraindications = ARRAY[
  'Recent lower limb fractures or surgery',
  'Acute joint inflammation',
  'Severe arthritis in weight-bearing joints',
  'Pregnancy complications requiring low-impact only',
  'Uncontrolled heart conditions',
  'Recent concussion (for explosive movements)'
]
WHERE (name ILIKE '%jump%' OR name ILIKE '%box%' OR name ILIKE '%run%'
       OR name ILIKE '%sprint%' OR name ILIKE '%plyometric%')
  AND (contraindications IS NULL OR array_length(contraindications, 1) = 0);

-- Core/trunk exercises
UPDATE exercises
SET contraindications = ARRAY[
  'Acute lower back injury',
  'Pregnancy (first trimester with caution)',
  'Diastasis recti (modify or avoid)',
  'Recent abdominal surgery',
  'Severe disc herniation'
]
WHERE category = 'core'
  AND (contraindications IS NULL OR array_length(contraindications, 1) = 0);

-- High-intensity cardiovascular
UPDATE exercises
SET contraindications = ARRAY[
  'Uncontrolled heart disease',
  'Recent heart attack without medical clearance',
  'Severe uncontrolled hypertension',
  'Acute respiratory infection',
  'Unstable angina',
  'Severe arrhythmias'
]
WHERE (discipline = 'endurance' OR discipline = 'competitions')
  AND (name ILIKE '%HIIT%' OR name ILIKE '%sprint%' OR name ILIKE '%max%')
  AND (contraindications IS NULL OR array_length(contraindications, 1) = 0);

-- General contraindications for remaining exercises
UPDATE exercises
SET contraindications = ARRAY[
  'Acute injury to muscles or joints involved',
  'Uncontrolled chronic conditions affecting safety',
  'Recent surgery without medical clearance',
  'Severe pain during or after exercise',
  'Consult healthcare provider if uncertain'
]
WHERE (contraindications IS NULL OR array_length(contraindications, 1) = 0);

-- Add general safety notes for any remaining exercises
UPDATE exercises
SET safety_notes = ARRAY[
  'Perform proper warm-up before starting',
  'Use appropriate weight or intensity for your level',
  'Maintain proper form throughout the exercise',
  'Stop if you experience pain beyond normal discomfort',
  'Allow adequate rest between training sessions',
  'Consult professional if unsure about technique'
]
WHERE (safety_notes IS NULL OR array_length(safety_notes, 1) = 0);

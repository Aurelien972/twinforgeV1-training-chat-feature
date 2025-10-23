/*
  # Seed Exercise Visual Metadata

  Populate exercise_visual_metadata table with common exercises
  across all disciplines with rich visual metadata for matching
*/

-- ============================================================================
-- FORCE Exercises
-- ============================================================================

INSERT INTO exercise_visual_metadata (
  exercise_name,
  exercise_name_normalized,
  discipline,
  aliases,
  muscle_groups,
  equipment_required,
  movement_pattern,
  difficulty,
  visual_keywords,
  illustration_priority,
  recommended_angle,
  recommended_style
) VALUES
  ('Squat', 'squat', 'force', ARRAY['Back Squat', 'Barbell Squat'], ARRAY['Quadriceps', 'Glutes', 'Hamstrings'], ARRAY['barbell', 'rack'], 'squat', 'intermediate', ARRAY['compound', 'lower body', 'barbell', 'squat rack'], 10, 'side', 'technical'),
  ('Bench Press', 'bench press', 'force', ARRAY['Barbell Bench Press', 'Flat Bench'], ARRAY['Chest', 'Triceps', 'Shoulders'], ARRAY['barbell', 'bench'], 'push', 'intermediate', ARRAY['compound', 'chest', 'barbell', 'bench'], 10, 'side', 'technical'),
  ('Deadlift', 'deadlift', 'force', ARRAY['Conventional Deadlift'], ARRAY['Back', 'Glutes', 'Hamstrings', 'Traps'], ARRAY['barbell'], 'hinge', 'advanced', ARRAY['compound', 'posterior chain', 'barbell', 'floor'], 10, 'side', 'technical'),
  ('Overhead Press', 'overhead press', 'force', ARRAY['Military Press', 'Shoulder Press'], ARRAY['Shoulders', 'Triceps', 'Core'], ARRAY['barbell'], 'push', 'intermediate', ARRAY['compound', 'shoulders', 'barbell', 'standing'], 9, 'front', 'technical'),
  ('Barbell Row', 'barbell row', 'force', ARRAY['Bent Over Row', 'BB Row'], ARRAY['Back', 'Biceps', 'Lats'], ARRAY['barbell'], 'pull', 'intermediate', ARRAY['compound', 'back', 'barbell', 'bent over'], 9, 'side', 'technical'),

  ('Front Squat', 'front squat', 'force', ARRAY[], ARRAY['Quadriceps', 'Core', 'Glutes'], ARRAY['barbell', 'rack'], 'squat', 'advanced', ARRAY['compound', 'quad focused', 'barbell', 'front rack'], 8, 'side', 'technical'),
  ('Romanian Deadlift', 'romanian deadlift', 'force', ARRAY['RDL'], ARRAY['Hamstrings', 'Glutes', 'Lower Back'], ARRAY['barbell'], 'hinge', 'intermediate', ARRAY['posterior chain', 'barbell', 'hip hinge'], 8, 'side', 'technical'),
  ('Incline Bench Press', 'incline bench press', 'force', ARRAY['Incline Press'], ARRAY['Upper Chest', 'Shoulders', 'Triceps'], ARRAY['barbell', 'bench'], 'push', 'intermediate', ARRAY['chest', 'upper', 'incline', 'barbell'], 7, 'side', 'technical'),
  ('Dumbbell Row', 'dumbbell row', 'force', ARRAY['DB Row', 'One Arm Row'], ARRAY['Back', 'Lats', 'Biceps'], ARRAY['dumbbell', 'bench'], 'pull', 'beginner', ARRAY['back', 'unilateral', 'dumbbell'], 7, 'side', 'technical'),
  ('Bulgarian Split Squat', 'bulgarian split squat', 'force', ARRAY['Rear Foot Elevated Split Squat'], ARRAY['Quadriceps', 'Glutes'], ARRAY['dumbbell', 'bench'], 'squat', 'intermediate', ARRAY['unilateral', 'legs', 'stability'], 7, 'side', 'technical'),

  ('Leg Press', 'leg press', 'force', ARRAY[], ARRAY['Quadriceps', 'Glutes', 'Hamstrings'], ARRAY['machine'], 'push', 'beginner', ARRAY['machine', 'legs', 'quad'], 6, 'side', 'technical'),
  ('Lat Pulldown', 'lat pulldown', 'force', ARRAY['Pulldown'], ARRAY['Lats', 'Biceps', 'Back'], ARRAY['cable', 'machine'], 'pull', 'beginner', ARRAY['back', 'machine', 'cable'], 6, 'front', 'technical'),
  ('Bicep Curl', 'bicep curl', 'force', ARRAY['Barbell Curl', 'EZ Bar Curl'], ARRAY['Biceps'], ARRAY['barbell', 'dumbbell'], 'pull', 'beginner', ARRAY['isolation', 'arms', 'biceps'], 5, 'front', 'technical'),
  ('Tricep Extension', 'tricep extension', 'force', ARRAY['Overhead Extension', 'Skull Crusher'], ARRAY['Triceps'], ARRAY['dumbbell', 'cable'], 'push', 'beginner', ARRAY['isolation', 'arms', 'triceps'], 5, 'side', 'technical'),
  ('Lateral Raise', 'lateral raise', 'force', ARRAY['Side Raise', 'Dumbbell Raise'], ARRAY['Shoulders'], ARRAY['dumbbell'], 'raise', 'beginner', ARRAY['isolation', 'shoulders', 'deltoids'], 5, 'front', 'technical')

ON CONFLICT (exercise_name_normalized) DO NOTHING;

-- ============================================================================
-- ENDURANCE Exercises
-- ============================================================================

INSERT INTO exercise_visual_metadata (
  exercise_name,
  exercise_name_normalized,
  discipline,
  aliases,
  muscle_groups,
  equipment_required,
  movement_pattern,
  difficulty,
  visual_keywords,
  illustration_priority,
  recommended_angle,
  recommended_style
) VALUES
  ('Easy Run', 'easy run', 'endurance', ARRAY['Recovery Run', 'Base Run'], ARRAY['Legs', 'Cardiovascular'], ARRAY[], 'run', 'beginner', ARRAY['running', 'zone 1', 'zone 2', 'outdoor'], 8, 'side', 'dynamic'),
  ('Long Run', 'long run', 'endurance', ARRAY['Endurance Run', 'LSD'], ARRAY['Legs', 'Cardiovascular'], ARRAY[], 'run', 'intermediate', ARRAY['running', 'distance', 'endurance'], 8, 'side', 'dynamic'),
  ('Tempo Run', 'tempo run', 'endurance', ARRAY['Threshold Run'], ARRAY['Legs', 'Cardiovascular'], ARRAY[], 'run', 'intermediate', ARRAY['running', 'tempo', 'threshold'], 7, 'side', 'dynamic'),
  ('Intervals', 'intervals', 'endurance', ARRAY['Speed Intervals', 'Track Intervals'], ARRAY['Legs', 'Cardiovascular'], ARRAY[], 'run', 'advanced', ARRAY['running', 'intervals', 'speed'], 7, 'side', 'dynamic'),

  ('Cycling Endurance', 'cycling endurance', 'endurance', ARRAY['Base Ride', 'Zone 2 Ride'], ARRAY['Legs', 'Cardiovascular'], ARRAY['bike'], 'cycle', 'beginner', ARRAY['cycling', 'endurance', 'outdoor'], 7, 'side', 'dynamic'),
  ('Swimming Endurance', 'swimming endurance', 'endurance', ARRAY['Swim Base'], ARRAY['Full Body', 'Cardiovascular'], ARRAY['pool'], 'swim', 'intermediate', ARRAY['swimming', 'endurance', 'pool'], 6, '3d', 'dynamic'),
  ('Hill Repeats', 'hill repeats', 'endurance', ARRAY['Hill Sprints'], ARRAY['Legs', 'Cardiovascular'], ARRAY[], 'run', 'advanced', ARRAY['running', 'hills', 'strength'], 6, 'side', 'dynamic')

ON CONFLICT (exercise_name_normalized) DO NOTHING;

-- ============================================================================
-- CALISTHENICS Exercises
-- ============================================================================

INSERT INTO exercise_visual_metadata (
  exercise_name,
  exercise_name_normalized,
  discipline,
  aliases,
  muscle_groups,
  equipment_required,
  movement_pattern,
  difficulty,
  visual_keywords,
  illustration_priority,
  recommended_angle,
  recommended_style
) VALUES
  ('Pull-up', 'pull up', 'calisthenics', ARRAY['Pull-ups', 'Chin-up'], ARRAY['Lats', 'Biceps', 'Back'], ARRAY['pull-up bar'], 'pull', 'intermediate', ARRAY['bodyweight', 'pull', 'bar'], 10, 'side', 'minimalist'),
  ('Push-up', 'push up', 'calisthenics', ARRAY['Push-ups'], ARRAY['Chest', 'Triceps', 'Shoulders'], ARRAY[], 'push', 'beginner', ARRAY['bodyweight', 'push', 'floor'], 9, 'side', 'minimalist'),
  ('Dips', 'dips', 'calisthenics', ARRAY['Bar Dips', 'Parallel Bar Dips'], ARRAY['Chest', 'Triceps', 'Shoulders'], ARRAY['dip bars'], 'push', 'intermediate', ARRAY['bodyweight', 'push', 'bars'], 9, 'side', 'minimalist'),
  ('Muscle-up', 'muscle up', 'calisthenics', ARRAY['Bar Muscle-up'], ARRAY['Full Body', 'Lats', 'Chest'], ARRAY['pull-up bar'], 'pull', 'advanced', ARRAY['bodyweight', 'advanced', 'bar'], 8, 'side', 'minimalist'),

  ('Handstand Push-up', 'handstand push up', 'calisthenics', ARRAY['HSPU'], ARRAY['Shoulders', 'Triceps', 'Core'], ARRAY['wall'], 'push', 'advanced', ARRAY['bodyweight', 'inverted', 'balance'], 8, 'front', 'minimalist'),
  ('L-sit', 'l sit', 'calisthenics', ARRAY['L-Sit Hold'], ARRAY['Core', 'Hip Flexors', 'Shoulders'], ARRAY['parallettes'], 'hold', 'intermediate', ARRAY['bodyweight', 'core', 'static'], 7, 'side', 'minimalist'),
  ('Planche', 'planche', 'calisthenics', ARRAY['Full Planche'], ARRAY['Shoulders', 'Core', 'Back'], ARRAY[], 'hold', 'elite', ARRAY['bodyweight', 'advanced', 'static'], 7, 'side', 'minimalist'),
  ('Front Lever', 'front lever', 'calisthenics', ARRAY['FL'], ARRAY['Lats', 'Core', 'Back'], ARRAY['pull-up bar'], 'hold', 'elite', ARRAY['bodyweight', 'advanced', 'pull'], 7, 'side', 'minimalist')

ON CONFLICT (exercise_name_normalized) DO NOTHING;

-- ============================================================================
-- FUNCTIONAL Exercises
-- ============================================================================

INSERT INTO exercise_visual_metadata (
  exercise_name,
  exercise_name_normalized,
  discipline,
  aliases,
  muscle_groups,
  equipment_required,
  movement_pattern,
  difficulty,
  visual_keywords,
  illustration_priority,
  recommended_angle,
  recommended_style
) VALUES
  ('Burpee', 'burpee', 'functional', ARRAY['Burpees'], ARRAY['Full Body'], ARRAY[], 'complex', 'beginner', ARRAY['bodyweight', 'cardio', 'functional'], 9, 'side', 'dynamic'),
  ('Box Jump', 'box jump', 'functional', ARRAY['Box Jumps'], ARRAY['Legs', 'Power'], ARRAY['box'], 'jump', 'intermediate', ARRAY['plyometric', 'explosive', 'box'], 8, 'side', 'dynamic'),
  ('Kettlebell Swing', 'kettlebell swing', 'functional', ARRAY['KB Swing', 'Russian Swing'], ARRAY['Glutes', 'Hamstrings', 'Core'], ARRAY['kettlebell'], 'hinge', 'beginner', ARRAY['kettlebell', 'power', 'hip'], 8, 'side', 'dynamic'),
  ('Wall Ball', 'wall ball', 'functional', ARRAY['Wall Balls'], ARRAY['Legs', 'Shoulders', 'Core'], ARRAY['medicine ball', 'wall'], 'throw', 'beginner', ARRAY['medicine ball', 'power', 'squat'], 7, 'side', 'dynamic'),

  ('Thrusters', 'thrusters', 'functional', ARRAY['Barbell Thrusters'], ARRAY['Full Body'], ARRAY['barbell'], 'complex', 'intermediate', ARRAY['barbell', 'compound', 'crossfit'], 7, 'side', 'dynamic'),
  ('Rope Climb', 'rope climb', 'functional', ARRAY['Climb'], ARRAY['Back', 'Arms', 'Core'], ARRAY['rope'], 'pull', 'advanced', ARRAY['rope', 'climbing', 'functional'], 6, 'side', 'dynamic'),
  ('Farmer Walk', 'farmer walk', 'functional', ARRAY['Farmers Carry'], ARRAY['Full Body', 'Grip', 'Core'], ARRAY['dumbbell', 'kettlebell'], 'carry', 'beginner', ARRAY['carry', 'grip', 'strongman'], 6, 'side', 'dynamic'),
  ('Sled Push', 'sled push', 'functional', ARRAY['Prowler Push'], ARRAY['Legs', 'Full Body'], ARRAY['sled'], 'push', 'intermediate', ARRAY['sled', 'power', 'conditioning'], 6, 'side', 'dynamic')

ON CONFLICT (exercise_name_normalized) DO NOTHING;

-- ============================================================================
-- COMPETITIONS Exercises (HYROX / DEKA)
-- ============================================================================

INSERT INTO exercise_visual_metadata (
  exercise_name,
  exercise_name_normalized,
  discipline,
  aliases,
  muscle_groups,
  equipment_required,
  movement_pattern,
  difficulty,
  visual_keywords,
  illustration_priority,
  recommended_angle,
  recommended_style
) VALUES
  ('Ski Erg', 'ski erg', 'competitions', ARRAY['SkiErg'], ARRAY['Full Body', 'Cardiovascular'], ARRAY['ski erg'], 'pull', 'beginner', ARRAY['machine', 'cardio', 'hyrox'], 8, 'side', 'dynamic'),
  ('Sled Push', 'sled push', 'competitions', ARRAY['Prowler'], ARRAY['Legs', 'Power'], ARRAY['sled'], 'push', 'intermediate', ARRAY['sled', 'hyrox', 'power'], 8, 'side', 'dynamic'),
  ('Sled Pull', 'sled pull', 'competitions', ARRAY['Rope Pull'], ARRAY['Back', 'Arms'], ARRAY['sled', 'rope'], 'pull', 'intermediate', ARRAY['sled', 'hyrox', 'rope'], 8, 'side', 'dynamic'),
  ('Burpee Broad Jump', 'burpee broad jump', 'competitions', ARRAY['BBJ'], ARRAY['Full Body'], ARRAY[], 'complex', 'intermediate', ARRAY['burpee', 'jump', 'hyrox'], 7, 'side', 'dynamic'),

  ('Rowing', 'rowing', 'competitions', ARRAY['Row', 'Erg'], ARRAY['Full Body', 'Cardiovascular'], ARRAY['rowing machine'], 'pull', 'beginner', ARRAY['machine', 'cardio', 'hyrox'], 7, 'side', 'dynamic'),
  ('Sandbag Lunges', 'sandbag lunges', 'competitions', ARRAY['Lunges'], ARRAY['Legs', 'Core'], ARRAY['sandbag'], 'lunge', 'intermediate', ARRAY['sandbag', 'lunges', 'hyrox'], 6, 'side', 'dynamic'),
  ('Wall Balls', 'wall balls', 'competitions', ARRAY['Wall Ball Shots'], ARRAY['Legs', 'Shoulders'], ARRAY['medicine ball'], 'throw', 'beginner', ARRAY['medicine ball', 'hyrox', 'wall'], 6, 'side', 'dynamic')

ON CONFLICT (exercise_name_normalized) DO NOTHING;

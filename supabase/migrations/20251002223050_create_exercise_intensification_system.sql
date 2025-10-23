/*
  # Create Exercise Intensification System
  
  1. New Tables
    - `exercise_intensification_techniques`
      - `id` (text, primary key)
      - `name` (text)
      - `short_name` (text)
      - `description` (text)
      - `category` (text: 'intensification' | 'facilitation')
      - `icon` (text)
      - `color` (text)
      - `difficulty_modifier` (numeric)
      - `created_at` (timestamptz)
  
  2. Modifications to existing tables
    - Extend `training_exercises` with new columns:
      - `intensification_techniques` (jsonb array)
      - `coach_notes` (text)
      - `tempo_execution` (varchar)
      - `focus_muscle` (varchar)
      - `breathing_pattern` (varchar)
  
  3. Security
    - Enable RLS on `exercise_intensification_techniques` table
    - Add policy for authenticated users to read techniques
    - Table is read-only for users, managed by system
*/

-- Create exercise_intensification_techniques table
CREATE TABLE IF NOT EXISTS exercise_intensification_techniques (
  id text PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('intensification', 'facilitation')),
  icon text NOT NULL,
  color text NOT NULL,
  difficulty_modifier numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercise_intensification_techniques ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read techniques
CREATE POLICY "Authenticated users can read techniques"
  ON exercise_intensification_techniques
  FOR SELECT
  TO authenticated
  USING (true);

-- Add new columns to training_exercises if table exists
DO $$
BEGIN
  -- Check if training_exercises table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'training_exercises'
  ) THEN
    -- Add intensification_techniques column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'training_exercises' AND column_name = 'intensification_techniques'
    ) THEN
      ALTER TABLE training_exercises ADD COLUMN intensification_techniques jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add coach_notes column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'training_exercises' AND column_name = 'coach_notes'
    ) THEN
      ALTER TABLE training_exercises ADD COLUMN coach_notes text;
    END IF;
    
    -- Add tempo_execution column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'training_exercises' AND column_name = 'tempo_execution'
    ) THEN
      ALTER TABLE training_exercises ADD COLUMN tempo_execution varchar(50);
    END IF;
    
    -- Add focus_muscle column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'training_exercises' AND column_name = 'focus_muscle'
    ) THEN
      ALTER TABLE training_exercises ADD COLUMN focus_muscle varchar(100);
    END IF;
    
    -- Add breathing_pattern column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'training_exercises' AND column_name = 'breathing_pattern'
    ) THEN
      ALTER TABLE training_exercises ADD COLUMN breathing_pattern varchar(200);
    END IF;
  END IF;
END $$;

-- Insert default intensification techniques
INSERT INTO exercise_intensification_techniques (id, name, short_name, description, category, icon, color, difficulty_modifier)
VALUES
  ('drop-set', 'Drop Set', 'Drop', 'Réduire la charge immédiatement après l''échec et continuer', 'intensification', 'TrendingDown', '#F59E0B', 1.3),
  ('superset', 'Superset', 'Super', 'Enchaîner deux exercices sans repos', 'intensification', 'Zap', '#EF4444', 1.4),
  ('rest-pause', 'Rest-Pause', 'R-P', 'Pauses courtes de 10-15 secondes entre mini-séries', 'intensification', 'Timer', '#F59E0B', 1.35),
  ('tempo', 'Tempo Contrôlé', 'Tempo', 'Exécution à vitesse contrôlée spécifique', 'intensification', 'Clock', '#3B82F6', 1.2),
  ('partial-reps', 'Répétitions Partielles', 'Partial', 'Amplitude réduite pour continuer après l''échec', 'facilitation', 'Minus', '#22C55E', 0.9),
  ('isometric-hold', 'Maintien Isométrique', 'Iso', 'Tenir une position fixe sous tension', 'intensification', 'Pause', '#8B5CF6', 1.25),
  ('cluster-set', 'Cluster Set', 'Cluster', 'Séries fractionnées avec repos intra-série', 'intensification', 'Network', '#EC4899', 1.3),
  ('giant-set', 'Giant Set', 'Giant', 'Enchaîner 3-4 exercices sans repos', 'intensification', 'Rocket', '#DC2626', 1.6),
  ('pre-exhaust', 'Pré-Fatigue', 'Pré', 'Isolation avant exercice composé', 'intensification', 'Target', '#F59E0B', 1.25),
  ('post-exhaust', 'Post-Fatigue', 'Post', 'Isolation après exercice composé', 'intensification', 'Flag', '#F59E0B', 1.2),
  ('eccentric-focus', 'Focus Excentrique', 'Ecc', 'Phase négative lente et contrôlée', 'intensification', 'TrendingDown', '#6366F1', 1.3),
  ('pause-reps', 'Pause Reps', 'Pause', 'Pauses en position spécifique durant la répétition', 'intensification', 'StopCircle', '#8B5CF6', 1.15)
ON CONFLICT (id) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_intensification_techniques_category ON exercise_intensification_techniques(category);

-- If training_exercises table exists, add index on intensification_techniques column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'training_exercises'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_training_exercises_intensification ON training_exercises USING GIN (intensification_techniques);
  END IF;
END $$;

/*
  # Système de Modifications d'Exercices et Historique

  ## Tables Créées

  1. **exercise_modifications**
     - `id` (uuid, primary key) - Identifiant unique
     - `user_id` (uuid, foreign key) - Référence à auth.users
     - `session_id` (text) - ID de la session d'entraînement
     - `exercise_id` (text) - ID de l'exercice modifié
     - `exercise_name` (text) - Nom de l'exercice
     - `modification_type` (text) - Type de modification (sets, reps, load, tempo, rest, substitute, etc.)
     - `original_value` (jsonb) - Valeur originale (format flexible)
     - `new_value` (jsonb) - Nouvelle valeur (format flexible)
     - `reason` (text) - Raison de la modification
     - `adjustment_button_id` (text) - ID du bouton CTA utilisé
     - `created_at` (timestamptz) - Date de création
     - `applied` (boolean) - Si la modification a été appliquée

  2. **exercise_modification_history**
     - `id` (uuid, primary key) - Identifiant unique
     - `user_id` (uuid, foreign key) - Référence à auth.users
     - `session_id` (text) - ID de la session
     - `prescription_version` (int) - Version de la prescription
     - `modifications_summary` (jsonb) - Résumé des modifications
     - `total_modifications` (int) - Nombre total de modifications
     - `created_at` (timestamptz) - Date de création
     - `completed_at` (timestamptz) - Date de complétion

  3. **training_sessions_prescriptions**
     - `id` (uuid, primary key) - Identifiant unique
     - `user_id` (uuid, foreign key) - Référence à auth.users
     - `session_id` (text) - ID de la session
     - `version` (int) - Version de la prescription
     - `prescription_data` (jsonb) - Données complètes de la prescription
     - `modifications_count` (int) - Nombre de modifications appliquées
     - `is_current` (boolean) - Si c'est la version actuelle
     - `created_at` (timestamptz) - Date de création

  ## Sécurité

  - Enable RLS sur toutes les tables
  - Policies restrictives pour authentification et ownership
  - Indexes pour performances optimales
*/

-- Create exercise_modifications table
CREATE TABLE IF NOT EXISTS exercise_modifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  exercise_id text NOT NULL,
  exercise_name text NOT NULL,
  modification_type text NOT NULL,
  original_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  adjustment_button_id text,
  applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercise_modifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exercise_modifications
CREATE POLICY "Users can view own modifications"
  ON exercise_modifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own modifications"
  ON exercise_modifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own modifications"
  ON exercise_modifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own modifications"
  ON exercise_modifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for exercise_modifications
CREATE INDEX IF NOT EXISTS exercise_modifications_user_id_idx ON exercise_modifications(user_id);
CREATE INDEX IF NOT EXISTS exercise_modifications_session_id_idx ON exercise_modifications(session_id);
CREATE INDEX IF NOT EXISTS exercise_modifications_created_at_idx ON exercise_modifications(created_at DESC);
CREATE INDEX IF NOT EXISTS exercise_modifications_exercise_id_idx ON exercise_modifications(exercise_id);

-- Create exercise_modification_history table
CREATE TABLE IF NOT EXISTS exercise_modification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  prescription_version int DEFAULT 1,
  modifications_summary jsonb DEFAULT '[]'::jsonb,
  total_modifications int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE exercise_modification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exercise_modification_history
CREATE POLICY "Users can view own history"
  ON exercise_modification_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON exercise_modification_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history"
  ON exercise_modification_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for exercise_modification_history
CREATE INDEX IF NOT EXISTS exercise_modification_history_user_id_idx ON exercise_modification_history(user_id);
CREATE INDEX IF NOT EXISTS exercise_modification_history_session_id_idx ON exercise_modification_history(session_id);
CREATE INDEX IF NOT EXISTS exercise_modification_history_created_at_idx ON exercise_modification_history(created_at DESC);

-- Create training_sessions_prescriptions table
CREATE TABLE IF NOT EXISTS training_sessions_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  version int DEFAULT 1,
  prescription_data jsonb NOT NULL,
  modifications_count int DEFAULT 0,
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE training_sessions_prescriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for training_sessions_prescriptions
CREATE POLICY "Users can view own prescriptions"
  ON training_sessions_prescriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prescriptions"
  ON training_sessions_prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prescriptions"
  ON training_sessions_prescriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for training_sessions_prescriptions
CREATE INDEX IF NOT EXISTS training_sessions_prescriptions_user_id_idx ON training_sessions_prescriptions(user_id);
CREATE INDEX IF NOT EXISTS training_sessions_prescriptions_session_id_idx ON training_sessions_prescriptions(session_id);
CREATE INDEX IF NOT EXISTS training_sessions_prescriptions_is_current_idx ON training_sessions_prescriptions(is_current);
CREATE INDEX IF NOT EXISTS training_sessions_prescriptions_created_at_idx ON training_sessions_prescriptions(created_at DESC);

-- Create function to get current prescription for a session
CREATE OR REPLACE FUNCTION get_current_prescription(p_session_id text)
RETURNS jsonb AS $$
  SELECT prescription_data
  FROM training_sessions_prescriptions
  WHERE session_id = p_session_id
    AND user_id = auth.uid()
    AND is_current = true
  ORDER BY version DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Create function to apply modifications to prescription
CREATE OR REPLACE FUNCTION apply_exercise_modification(
  p_session_id text,
  p_exercise_id text,
  p_modification_type text,
  p_new_value jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_current_prescription jsonb;
  v_new_version int;
  v_modified_prescription jsonb;
BEGIN
  -- Get current prescription
  SELECT prescription_data, version + 1
  INTO v_current_prescription, v_new_version
  FROM training_sessions_prescriptions
  WHERE session_id = p_session_id
    AND user_id = auth.uid()
    AND is_current = true
  ORDER BY version DESC
  LIMIT 1;

  IF v_current_prescription IS NULL THEN
    RAISE EXCEPTION 'No current prescription found for session %', p_session_id;
  END IF;

  -- Mark current as not current
  UPDATE training_sessions_prescriptions
  SET is_current = false
  WHERE session_id = p_session_id
    AND user_id = auth.uid()
    AND is_current = true;

  -- Create modified prescription (simplified - actual logic would be more complex)
  v_modified_prescription := v_current_prescription;

  -- Insert new version
  INSERT INTO training_sessions_prescriptions (
    user_id,
    session_id,
    version,
    prescription_data,
    modifications_count,
    is_current
  ) VALUES (
    auth.uid(),
    p_session_id,
    v_new_version,
    v_modified_prescription,
    (SELECT modifications_count + 1 FROM training_sessions_prescriptions 
     WHERE session_id = p_session_id AND version = v_new_version - 1 LIMIT 1),
    true
  );

  RETURN v_modified_prescription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

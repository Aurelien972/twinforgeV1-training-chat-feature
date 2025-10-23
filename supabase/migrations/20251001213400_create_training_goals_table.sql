/*
  # Création de la table training_goals pour les objectifs SMART

  1. Nouvelle Table
    - `training_goals`
      - `id` (uuid, primary key) - Identifiant unique de l'objectif
      - `user_id` (uuid, foreign key) - Référence vers auth.users
      - `name` (text) - Nom de l'objectif
      - `description` (text, nullable) - Description détaillée
      - `current_value` (numeric, nullable) - Valeur actuelle
      - `target_value` (numeric) - Valeur cible à atteindre
      - `unit` (text) - Unité de mesure (kg, min, reps, etc.)
      - `deadline` (date, nullable) - Date limite pour atteindre l'objectif
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de dernière modification
      - `is_achieved` (boolean) - Statut de réalisation
      - `achieved_at` (timestamptz, nullable) - Date de réalisation

  2. Sécurité
    - Enable RLS sur `training_goals`
    - Politique SELECT : les utilisateurs peuvent voir leurs propres objectifs
    - Politique INSERT : les utilisateurs peuvent créer leurs propres objectifs
    - Politique UPDATE : les utilisateurs peuvent modifier leurs propres objectifs
    - Politique DELETE : les utilisateurs peuvent supprimer leurs propres objectifs

  3. Index
    - Index sur user_id pour optimiser les requêtes
    - Index sur deadline pour les requêtes de tri par date
*/

CREATE TABLE IF NOT EXISTS training_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  current_value numeric,
  target_value numeric NOT NULL,
  unit text NOT NULL,
  deadline date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_achieved boolean DEFAULT false,
  achieved_at timestamptz
);

-- Enable RLS
ALTER TABLE training_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own training goals"
  ON training_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own training goals"
  ON training_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training goals"
  ON training_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training goals"
  ON training_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_goals_user_id ON training_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_training_goals_deadline ON training_goals(deadline);
CREATE INDEX IF NOT EXISTS idx_training_goals_is_achieved ON training_goals(is_achieved);
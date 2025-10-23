/*
  # Create Training Session Illustrations System

  1. New Tables
    - `training_session_illustrations`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to training_sessions)
      - `coach_type` (text) - force, endurance, functional, competitions, calisthenics
      - `illustration_type` (text) - icon_composition, data_visualization
      - `illustration_data` (jsonb) - Serialized canvas/SVG data or chart config
      - `preview_url` (text, nullable) - Optional data URL for preview
      - `metadata` (jsonb) - Additional metadata (dimensions, colors, etc.)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `training_session_illustrations` table
    - Add policies for authenticated users to manage their own illustrations

  3. Indexes
    - Index on session_id for fast lookup
    - Index on coach_type for filtering
*/

CREATE TABLE IF NOT EXISTS training_session_illustrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  coach_type text NOT NULL CHECK (coach_type IN ('force', 'endurance', 'functional', 'competitions', 'calisthenics')),
  illustration_type text NOT NULL CHECK (illustration_type IN ('icon_composition', 'data_visualization')),
  illustration_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE training_session_illustrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session illustrations"
  ON training_session_illustrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_illustrations.session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session illustrations"
  ON training_session_illustrations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_illustrations.session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session illustrations"
  ON training_session_illustrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_illustrations.session_id
      AND training_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_illustrations.session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session illustrations"
  ON training_session_illustrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_sessions
      WHERE training_sessions.id = training_session_illustrations.session_id
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_training_session_illustrations_session_id
  ON training_session_illustrations(session_id);

CREATE INDEX IF NOT EXISTS idx_training_session_illustrations_coach_type
  ON training_session_illustrations(coach_type);

CREATE INDEX IF NOT EXISTS idx_training_session_illustrations_created_at
  ON training_session_illustrations(created_at DESC);

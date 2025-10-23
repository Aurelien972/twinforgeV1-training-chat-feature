/*
  # Fix Training Sessions Draft System

  ## Summary
  Correction et amélioration du système de sauvegarde de trainings en mode draft.
  Ajout des colonnes manquantes détectées dans l'erreur PGRST204 et amélioration
  de la structure pour supporter correctement les drafts sans plan associé.

  ## Changes Made

  ### 1. New Columns Added to training_sessions
  - `coach_type` (text) - Type de coach assigné (force, functional, endurance, etc.)
  - `context` (jsonb) - Contexte complet de préparation (preparerData)
  - `session_type` (text) - Type de session pour identification rapide

  ### 2. Schema Modifications
  - Rendre `plan_id` nullable pour supporter les drafts sans plan
  - Rendre `session_index` et `week_number` nullable car non applicables aux drafts
  - Mettre à jour les contraintes pour supporter les drafts

  ### 3. Index Performance
  - Ajout d'index sur coach_type pour requêtes filtrées
  - Index composite optimisé pour requêtes de drafts

  ## Notes
  - Compatible avec les données existantes (nullable columns)
  - Les drafts peuvent exister sans plan_id (standalone sessions)
  - Le contexte JSONB permet de stocker toutes les infos de preparerData
*/

-- Rendre plan_id nullable pour supporter les drafts sans plan
ALTER TABLE training_sessions
ALTER COLUMN plan_id DROP NOT NULL;

-- Rendre session_index nullable (non applicable pour drafts)
ALTER TABLE training_sessions
ALTER COLUMN session_index DROP NOT NULL;

-- Rendre week_number nullable (non applicable pour drafts)
ALTER TABLE training_sessions
ALTER COLUMN week_number DROP NOT NULL;

-- Add coach_type column for coach assignment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'coach_type'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN coach_type text DEFAULT 'force' CHECK (coach_type IN ('force', 'functional', 'endurance', 'hybrid', 'mobility'));
  END IF;
END $$;

-- Add context column for storing preparerData
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'context'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN context jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add session_type column for quick identification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'session_type'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN session_type text;
  END IF;
END $$;

-- Create index on coach_type for filtered queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_type
ON training_sessions(coach_type);

-- Create composite index for draft queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_drafts_active
ON training_sessions(user_id, status, draft_expires_at)
WHERE status = 'draft';

-- Add helpful comments for documentation
COMMENT ON COLUMN training_sessions.coach_type IS 'Type of coach assigned to this session (force, functional, endurance, hybrid, mobility)';
COMMENT ON COLUMN training_sessions.context IS 'Complete context from preparer step (energy level, location, equipment, time available, etc.)';
COMMENT ON COLUMN training_sessions.session_type IS 'Session type for quick identification (matches prescription.type)';
COMMENT ON COLUMN training_sessions.plan_id IS 'Reference to training plan (nullable for standalone draft sessions)';

-- Update type column to allow more session types
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS valid_session_type;
END $$;

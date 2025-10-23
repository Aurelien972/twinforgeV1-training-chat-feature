/*
  # Add Draft Support to Training Sessions

  ## Summary
  Extension de la table `training_sessions` pour supporter la sauvegarde de trainings
  en mode draft, permettant aux utilisateurs de sauvegarder et reprendre leur planning
  de séance plus tard.

  ## Changes Made

  ### 1. New Columns Added
  - `status`: Status de la session (draft, scheduled, in_progress, completed, skipped)
  - `custom_name`: Nom personnalisé optionnel pour identifier rapidement un draft
  - `draft_expires_at`: Date d'expiration automatique des drafts (48h par défaut)
  - `draft_saved_at`: Timestamp de sauvegarde du draft pour tracking

  ### 2. Index Performance
  - Index composite sur `user_id` + `status` pour queries rapides des drafts
  - Index sur `draft_expires_at` pour cleanup automatique des drafts expirés

  ### 3. Security
  - RLS policies existantes continuent de s'appliquer
  - Seul l'utilisateur propriétaire peut voir/modifier ses drafts

  ## Notes
  - Les drafts expirent automatiquement après 48h
  - Status par défaut: 'scheduled' pour compatibilité avec sessions existantes
  - Un utilisateur peut avoir plusieurs drafts en même temps
*/

-- Add status column with default 'scheduled' for backward compatibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN status text DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'skipped'));
  END IF;
END $$;

-- Add custom_name column for user-friendly draft identification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'custom_name'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN custom_name text;
  END IF;
END $$;

-- Add draft_expires_at for automatic cleanup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'draft_expires_at'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN draft_expires_at timestamptz;
  END IF;
END $$;

-- Add draft_saved_at for tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions' AND column_name = 'draft_saved_at'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN draft_saved_at timestamptz;
  END IF;
END $$;

-- Create composite index for fast draft queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_status
ON training_sessions(user_id, status);

-- Create index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_training_sessions_draft_expires
ON training_sessions(draft_expires_at)
WHERE status = 'draft';

-- Add comment for documentation
COMMENT ON COLUMN training_sessions.status IS 'Session status: draft (saved for later), scheduled, in_progress, completed, skipped';
COMMENT ON COLUMN training_sessions.custom_name IS 'User-defined name for easy draft identification';
COMMENT ON COLUMN training_sessions.draft_expires_at IS 'Expiration timestamp for draft sessions (typically 48h after creation)';
COMMENT ON COLUMN training_sessions.draft_saved_at IS 'Timestamp when draft was saved';

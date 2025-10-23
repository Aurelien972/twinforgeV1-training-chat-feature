/*
  # Add draft status to training_sessions

  1. Changes
    - Drop and recreate the valid_session_status constraint to include 'draft'
    - This allows saving training sessions as drafts for 48h retention

  2. Security
    - No RLS changes needed - existing policies cover draft sessions
    - Drafts belong to users and are protected by existing RLS
*/

-- Drop existing constraint
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS valid_session_status;

-- Add new constraint with 'draft' included
ALTER TABLE training_sessions ADD CONSTRAINT valid_session_status 
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped', 'draft'));

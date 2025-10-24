/*
  # Make training_sessions compatible with standalone sessions

  ## Overview
  This migration makes training_sessions table compatible with both:
  - Planned sessions (linked to a training_plans)
  - Standalone sessions (generated on-the-fly, drafts, completed sessions)

  ## Changes
  1. Make plan_id NULLABLE to support standalone sessions
  2. Make session_index NULLABLE to support standalone sessions
  3. Make week_number NULLABLE to support standalone sessions
  4. Add constraint to ensure data integrity

  ## Rationale
  The original schema required all sessions to be part of a training plan.
  However, the application generates standalone sessions (drafts and completed)
  that don't belong to any plan. This migration allows both use cases.

  ## Data Integrity
  - If plan_id IS NOT NULL, session_index and week_number must be NOT NULL
  - This ensures planned sessions maintain their structure
  - Standalone sessions can have all three fields as NULL

  ## Security
  - No changes to RLS policies
  - Existing policies remain in effect
*/

-- ============================================================================
-- MAKE COLUMNS NULLABLE FOR STANDALONE SESSIONS
-- ============================================================================

-- Drop the existing foreign key constraint on plan_id
ALTER TABLE training_sessions
  DROP CONSTRAINT IF EXISTS training_sessions_plan_id_fkey;

-- Make plan_id nullable
ALTER TABLE training_sessions
  ALTER COLUMN plan_id DROP NOT NULL;

-- Re-add the foreign key constraint with SET NULL on delete
ALTER TABLE training_sessions
  ADD CONSTRAINT training_sessions_plan_id_fkey
  FOREIGN KEY (plan_id)
  REFERENCES training_plans(id)
  ON DELETE SET NULL;

-- Make session_index nullable
ALTER TABLE training_sessions
  ALTER COLUMN session_index DROP NOT NULL;

-- Make week_number nullable
ALTER TABLE training_sessions
  ALTER COLUMN week_number DROP NOT NULL;

-- ============================================================================
-- ADD DATA INTEGRITY CONSTRAINTS
-- ============================================================================

-- If plan_id is provided, session_index and week_number must be provided too
ALTER TABLE training_sessions
  ADD CONSTRAINT check_plan_requires_session_index
  CHECK (
    (plan_id IS NULL) OR
    (plan_id IS NOT NULL AND session_index IS NOT NULL)
  );

ALTER TABLE training_sessions
  ADD CONSTRAINT check_plan_requires_week_number
  CHECK (
    (plan_id IS NULL) OR
    (plan_id IS NOT NULL AND week_number IS NOT NULL)
  );

-- ============================================================================
-- CREATE INDEX FOR STANDALONE SESSIONS
-- ============================================================================

-- Index for queries filtering standalone sessions (plan_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_training_sessions_standalone
  ON training_sessions(user_id, status, created_at DESC)
  WHERE plan_id IS NULL;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN training_sessions.plan_id IS
  'Foreign key to training_plans. NULL for standalone sessions (drafts, on-the-fly generated sessions)';

COMMENT ON COLUMN training_sessions.session_index IS
  'Position in the plan (0-based). NULL for standalone sessions. Required if plan_id is not NULL';

COMMENT ON COLUMN training_sessions.week_number IS
  'Week number in the plan. NULL for standalone sessions. Required if plan_id is not NULL';

COMMENT ON CONSTRAINT check_plan_requires_session_index ON training_sessions IS
  'Ensures session_index is provided when session belongs to a plan';

COMMENT ON CONSTRAINT check_plan_requires_week_number ON training_sessions IS
  'Ensures week_number is provided when session belongs to a plan';

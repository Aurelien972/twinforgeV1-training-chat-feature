/*
  # Drop Body Projections System

  ## Overview
  This migration removes the complete body projections infrastructure from the database.

  ## Actions
  1. Drop all policies on body_projections table
  2. Drop all triggers on body_projections table
  3. Drop all indexes on body_projections table
  4. Drop the trigger function
  5. Drop the body_projections table

  ## Security
  This operation is irreversible and will delete all user projection data.

  ## Reason
  The body projection feature has been removed from the application.
*/

-- ============================================================
-- DROP POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can delete own projections" ON body_projections;
DROP POLICY IF EXISTS "Users can update own projections" ON body_projections;
DROP POLICY IF EXISTS "Users can create own projections" ON body_projections;
DROP POLICY IF EXISTS "Users can view own projections" ON body_projections;

-- ============================================================
-- DROP TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS set_body_projections_updated_at ON body_projections;

-- ============================================================
-- DROP INDEXES
-- ============================================================

DROP INDEX IF EXISTS idx_body_projections_is_favorite;
DROP INDEX IF EXISTS idx_body_projections_created_at;
DROP INDEX IF EXISTS idx_body_projections_base_scan_id;
DROP INDEX IF EXISTS idx_body_projections_user_id;

-- ============================================================
-- DROP TABLE
-- ============================================================

DROP TABLE IF EXISTS body_projections CASCADE;

-- ============================================================
-- DROP FUNCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS update_body_projections_updated_at() CASCADE;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON SCHEMA public IS
  'Body projections table has been removed as of migration 20251019210000';

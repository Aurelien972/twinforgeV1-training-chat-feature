/*
  # Fix Illustration Queue - Shared Access Model

  ## Problem
  Illustrations are shared resources across all users, not user-specific.
  Current RLS policies are too restrictive (requested_by = auth.uid()).
  Users get 403 errors when trying to queue illustration generation.

  ## Solution
  - All authenticated users can INSERT/SELECT queue items (shared resource)
  - requested_by field kept for tracking/analytics only
  - Service role retains full access for background processing

  ## Security
  - Authenticated users can queue and view all illustrations
  - Only service role can UPDATE/DELETE (for background processing)
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Users can create queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Users can update own queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Users can delete own queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Service role full access" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Authenticated users can queue illustrations" ON illustration_generation_queue;

-- ============================================================================
-- New Shared Access RLS Policies
-- ============================================================================

-- SELECT: All authenticated users can view all queue items (shared resource)
CREATE POLICY "Authenticated users can view queue"
  ON illustration_generation_queue
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: All authenticated users can queue illustrations (shared resource)
CREATE POLICY "Authenticated users can queue illustrations"
  ON illustration_generation_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Only service role (for background processing)
CREATE POLICY "Service role can update queue"
  ON illustration_generation_queue
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DELETE: Only service role (for cleanup/maintenance)
CREATE POLICY "Service role can delete queue"
  ON illustration_generation_queue
  FOR DELETE
  TO service_role
  USING (true);

-- Full access for service role (backup catch-all)
CREATE POLICY "Service role full access"
  ON illustration_generation_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

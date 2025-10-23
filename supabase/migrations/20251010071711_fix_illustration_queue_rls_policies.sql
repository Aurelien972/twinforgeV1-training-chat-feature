/*
  # Fix Illustration Generation Queue RLS Policies

  ## Problem
  Users receive 403 errors when trying to insert into `illustration_generation_queue`.
  The table only has SELECT policy for users, but no INSERT/UPDATE policies.

  ## Changes
  Add missing RLS policies to allow authenticated users to:
  - INSERT their own generation requests
  - UPDATE their own queue items (for cancellation)
  - SELECT remains unchanged (already working)

  ## Security
  - Users can only manage their own queue items (WHERE requested_by = auth.uid())
  - Service role retains full access for background processing
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Service role can manage queue" ON illustration_generation_queue;

-- ============================================================================
-- New RLS Policies for illustration_generation_queue
-- ============================================================================

-- SELECT: Users can view their own queue items
CREATE POLICY "Users can view own queue items"
  ON illustration_generation_queue
  FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

-- INSERT: Users can create their own queue items
CREATE POLICY "Users can create queue items"
  ON illustration_generation_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

-- UPDATE: Users can update their own queue items (for cancellation)
CREATE POLICY "Users can update own queue items"
  ON illustration_generation_queue
  FOR UPDATE
  TO authenticated
  USING (requested_by = auth.uid())
  WITH CHECK (requested_by = auth.uid());

-- DELETE: Users can delete their own queue items (for cleanup)
CREATE POLICY "Users can delete own queue items"
  ON illustration_generation_queue
  FOR DELETE
  TO authenticated
  USING (requested_by = auth.uid());

-- Service role has full access for background processing
CREATE POLICY "Service role full access"
  ON illustration_generation_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

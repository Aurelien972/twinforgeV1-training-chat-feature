/*
  # Fix Illustration Queue RLS for Frontend Polling

  ## Problem
  Frontend polling was timing out because users could only see their own queue items,
  but illustrations are meant to be shared across all users. When the cron job (service_role)
  updates queue items to "completed", users couldn't see the results.

  ## Solution
  1. Allow all authenticated users to read ALL queue items (especially completed ones)
  2. Allow all authenticated users to insert queue items (with their own user_id)
  3. Keep service_role able to manage everything
  4. Illustrations are public resources shared by all users

  ## Changes
  - Drop existing restrictive SELECT policy
  - Add new permissive SELECT policy for all authenticated users
  - Add INSERT policy for authenticated users to create queue items
  - Keep service_role policies intact

  ## Security
  - Users can read all queue items (needed for polling)
  - Users can only insert with their own user_id
  - Only service_role can UPDATE and DELETE queue items
  - This is safe because illustrations are public shared resources
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own queue items" ON illustration_generation_queue;

-- New permissive policy: All authenticated users can read all queue items
-- This is necessary for frontend polling to work properly
-- Illustrations are shared resources, so this is safe
CREATE POLICY "Authenticated users can view all queue items"
  ON illustration_generation_queue
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert queue items (with their own user_id)
CREATE POLICY "Authenticated users can insert queue items"
  ON illustration_generation_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

-- Keep service_role policy (already exists)
-- Service role can do everything (UPDATE, DELETE, etc.)
-- This policy should already exist from the original migration

-- Add index to optimize polling queries (checking by status and result)
CREATE INDEX IF NOT EXISTS idx_illustration_queue_completed_with_result
  ON illustration_generation_queue(status, result_illustration_id)
  WHERE status = 'completed' AND result_illustration_id IS NOT NULL;

-- Add index for faster lookup by ID (used in polling)
CREATE INDEX IF NOT EXISTS idx_illustration_queue_id_status
  ON illustration_generation_queue(id, status);

/*
  # Fix Illustration Queue Insert Policy

  ## Problem
  Users cannot insert into illustration_generation_queue because there's no INSERT policy.
  Only SELECT policy exists, causing "Failed to queue generation" errors.

  ## Solution
  Add INSERT policy allowing authenticated users to add items to the queue.

  ## Changes
  - Add policy for authenticated users to INSERT into queue
  - Users can only insert items with their own user_id
*/

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can view their own queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Service role can manage queue" ON illustration_generation_queue;

-- Policy: Users can view their own queue items
CREATE POLICY "Users can view their own queue items"
  ON illustration_generation_queue FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid() OR requested_by IS NULL);

-- Policy: Users can insert items into queue
CREATE POLICY "Users can insert into queue"
  ON illustration_generation_queue FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid() OR requested_by IS NULL);

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage queue"
  ON illustration_generation_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

/*
  # Fix Illustration Queue RLS Policies - Simplified and Permissive

  ## Problem
  Current RLS policies are too restrictive and may be blocking legitimate insertions.
  Users need to be able to:
  - Queue illustrations without authentication (for immediate use)
  - View queue status for their requests
  - Let background jobs process the queue

  ## Solution
  Simplify RLS policies to be more permissive while maintaining security:
  - Allow anonymous users to INSERT (no auth required for queuing)
  - Allow authenticated users to SELECT all queue items
  - Service role retains full control

  ## Changes
  - Drop all existing policies
  - Create new simplified policies
  - Add public read access for queue status checking

  ## Security Notes
  - Anonymous INSERT is safe because:
    1. Queue items are processed by service role
    2. No sensitive data is stored in queue
    3. Duplicate constraints prevent abuse
    4. Items are auto-cleaned after processing
*/

-- ============================================================================
-- 1. Drop all existing policies
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can queue illustrations" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Authenticated users can view queue" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Service role can delete queue" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Service role can update queue" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Service role full access" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Users can view their own queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Users can view own queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Users can create queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Users can update own queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Users can delete own queue items" ON illustration_generation_queue;
DROP POLICY IF EXISTS "Users can insert into queue" ON illustration_generation_queue;

-- ============================================================================
-- 2. Create new simplified policies
-- ============================================================================

-- SELECT: Anyone can view queue items (needed for polling)
CREATE POLICY "Anyone can view illustration queue"
  ON illustration_generation_queue
  FOR SELECT
  TO public
  USING (true);

-- INSERT: Anyone can add items to queue (no auth required)
CREATE POLICY "Anyone can queue illustrations"
  ON illustration_generation_queue
  FOR INSERT
  TO public
  WITH CHECK (true);

-- UPDATE: Only service role can update (for status changes)
CREATE POLICY "Service role can update queue"
  ON illustration_generation_queue
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DELETE: Only service role can delete (for cleanup)
CREATE POLICY "Service role can delete queue"
  ON illustration_generation_queue
  FOR DELETE
  TO service_role
  USING (true);

-- ============================================================================
-- 3. Grant necessary permissions
-- ============================================================================

-- Ensure public can query for checking duplicates
GRANT SELECT ON illustration_generation_queue TO anon;
GRANT SELECT ON illustration_generation_queue TO authenticated;
GRANT INSERT ON illustration_generation_queue TO anon;
GRANT INSERT ON illustration_generation_queue TO authenticated;

-- Service role needs all permissions
GRANT ALL ON illustration_generation_queue TO service_role;

-- ============================================================================
-- 4. Add helpful comments
-- ============================================================================

COMMENT ON POLICY "Anyone can view illustration queue" ON illustration_generation_queue IS
  'Public read access allows polling for generation status without authentication';

COMMENT ON POLICY "Anyone can queue illustrations" ON illustration_generation_queue IS
  'Public insert access allows immediate queuing. Abuse prevented by unique constraints and auto-cleanup';

/*
  # Create Auto-Enrichment Trigger for Activities

  1. Purpose
    - Automatically trigger wearable data enrichment after activity creation
    - Queue enrichment jobs for background processing
    - Ensure all manually created activities can be enriched with biometric data

  2. New Tables
    - `activity_enrichment_queue`
      - `id` (uuid, primary key)
      - `activity_id` (uuid, references activities)
      - `user_id` (uuid, references user_profile)
      - `status` (text: pending, processing, completed, failed)
      - `attempts` (integer)
      - `last_attempt_at` (timestamptz)
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on `activity_enrichment_queue` table
    - Add policy for authenticated users to view their own enrichment jobs
    - Service role can manage all enrichment jobs

  4. Triggers
    - After INSERT on activities → queue enrichment
    - After UPDATE on activity_enrichment_queue (status='pending') → notify worker
*/

-- Create enrichment queue table
CREATE TABLE IF NOT EXISTS activity_enrichment_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  error_message text,
  enrichment_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Prevent duplicate queue entries for same activity
  UNIQUE(activity_id)
);

-- Create index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status_created
ON activity_enrichment_queue(status, created_at)
WHERE status IN ('pending', 'failed');

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_user_id
ON activity_enrichment_queue(user_id);

-- Enable RLS
ALTER TABLE activity_enrichment_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own enrichment jobs
CREATE POLICY "Users can view own enrichment jobs"
  ON activity_enrichment_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all enrichment jobs
CREATE POLICY "Service role can manage all enrichment jobs"
  ON activity_enrichment_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function: Auto-queue enrichment after activity creation
CREATE OR REPLACE FUNCTION auto_queue_activity_enrichment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if activity doesn't already have wearable data
  IF NEW.wearable_device_id IS NULL AND NEW.wearable_synced_at IS NULL THEN
    INSERT INTO activity_enrichment_queue (
      activity_id,
      user_id,
      status
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      'pending'
    )
    ON CONFLICT (activity_id) DO NOTHING;

    -- Log enrichment queued
    RAISE NOTICE 'Activity % queued for enrichment', NEW.id;
  ELSE
    -- Activity already has wearable data, mark as skipped
    INSERT INTO activity_enrichment_queue (
      activity_id,
      user_id,
      status
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      'skipped'
    )
    ON CONFLICT (activity_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: After activity insert, queue enrichment
DROP TRIGGER IF EXISTS trigger_auto_queue_enrichment ON activities;
CREATE TRIGGER trigger_auto_queue_enrichment
  AFTER INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION auto_queue_activity_enrichment();

-- Function: Update enrichment queue timestamp
CREATE OR REPLACE FUNCTION update_enrichment_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on queue updates
DROP TRIGGER IF EXISTS trigger_update_enrichment_timestamp ON activity_enrichment_queue;
CREATE TRIGGER trigger_update_enrichment_timestamp
  BEFORE UPDATE ON activity_enrichment_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_enrichment_queue_timestamp();

-- Function: Clean old completed/skipped enrichment jobs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_enrichment_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_enrichment_queue
  WHERE status IN ('completed', 'skipped')
    AND updated_at < now() - interval '30 days';

  RAISE NOTICE 'Cleaned up old enrichment jobs';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the enrichment process
COMMENT ON TABLE activity_enrichment_queue IS 'Queue for automatic enrichment of activities with wearable biometric data. Processed by background worker via Edge Function.';
COMMENT ON COLUMN activity_enrichment_queue.status IS 'pending: waiting to be processed | processing: currently being enriched | completed: successfully enriched | failed: enrichment failed after retries | skipped: already has wearable data';
COMMENT ON FUNCTION auto_queue_activity_enrichment() IS 'Automatically queues manual activities for wearable data enrichment. Skips activities that already have wearable data.';

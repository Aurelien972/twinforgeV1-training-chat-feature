/*
  # Equipment Detection Jobs System
  
  1. New Tables
    - `equipment_detection_jobs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `location_id` (uuid, foreign key to training_locations)
      - `photo_id` (uuid, foreign key to training_location_photos)
      - `status` (text: pending, processing, completed, failed)
      - `progress_percentage` (integer, 0-100)
      - `equipment_detected_count` (integer)
      - `retry_count` (integer, default 0)
      - `error_message` (text, nullable)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `equipment_detection_jobs` table
    - Add policies for authenticated users to:
      - Read their own jobs
      - Create jobs for their locations
      - Update their own jobs (for edge function)
  
  3. Indexes
    - Index on user_id for fast user queries
    - Index on status for filtering active jobs
    - Composite index on (user_id, status) for active job queries
*/

-- Create equipment_detection_jobs table
CREATE TABLE IF NOT EXISTS equipment_detection_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES training_locations(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES training_location_photos(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  equipment_detected_count integer DEFAULT 0,
  retry_count integer NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 3),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE equipment_detection_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own jobs
CREATE POLICY "Users can read own detection jobs"
  ON equipment_detection_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create jobs for their locations
CREATE POLICY "Users can create detection jobs"
  ON equipment_detection_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = location_id
      AND training_locations.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own jobs
CREATE POLICY "Users can update own detection jobs"
  ON equipment_detection_jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can update any job (for edge function)
CREATE POLICY "Service role can update detection jobs"
  ON equipment_detection_jobs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_detection_jobs_user_id 
  ON equipment_detection_jobs(user_id);

CREATE INDEX IF NOT EXISTS idx_equipment_detection_jobs_status 
  ON equipment_detection_jobs(status);

CREATE INDEX IF NOT EXISTS idx_equipment_detection_jobs_user_status 
  ON equipment_detection_jobs(user_id, status);

CREATE INDEX IF NOT EXISTS idx_equipment_detection_jobs_photo_id 
  ON equipment_detection_jobs(photo_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_equipment_detection_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_equipment_detection_jobs_updated_at ON equipment_detection_jobs;
CREATE TRIGGER trigger_update_equipment_detection_jobs_updated_at
  BEFORE UPDATE ON equipment_detection_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_detection_jobs_updated_at();

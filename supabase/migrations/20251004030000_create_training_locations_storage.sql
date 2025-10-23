/*
  # Create Storage Bucket for Training Locations

  ## Overview
  Creates the storage bucket for training location photos with proper
  public access configuration and RLS policies.

  ## Bucket Configuration
  - Bucket name: training-locations
  - Public access: enabled
  - File size limit: 10MB
  - Allowed MIME types: image/jpeg, image/png, image/webp

  ## Security
  - RLS enabled on storage.objects
  - Users can upload to their own folders
  - All users can read public files
  - Users can delete their own files
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-locations',
  'training-locations',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public files are accessible to all" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Policy: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'training-locations' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow everyone to read public files
CREATE POLICY "Public files are accessible to all"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'training-locations');

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'training-locations' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'training-locations' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'training-locations' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

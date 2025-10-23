/*
  # Create Storage Bucket for Training Illustrations

  ## Overview
  Creates the storage bucket for training illustrations (sessions + exercises)
  with proper public access configuration and RLS policies.

  ## Bucket Configuration
  - Bucket name: training-illustrations
  - Public access: enabled (for CDN delivery)
  - File size limit: 5MB per image
  - Allowed MIME types: image/webp, image/png, image/jpeg
  - Organized structure: /{discipline}/{type}/{exercise-slug}/{variation}.webp

  ## Security
  - RLS enabled on storage.objects
  - Service role can upload/manage (via Edge Functions)
  - All users can read public files
  - Authenticated users can upload (with validation)
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-illustrations',
  'training-illustrations',
  true,
  5242880, -- 5MB
  ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Service role can upload illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Public illustrations are accessible to all" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete illustrations" ON storage.objects;

-- Policy: Allow service role full access (for Edge Functions)
CREATE POLICY "Service role can upload illustrations"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'training-illustrations');

CREATE POLICY "Service role can update illustrations"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'training-illustrations')
  WITH CHECK (bucket_id = 'training-illustrations');

CREATE POLICY "Service role can delete illustrations"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'training-illustrations');

-- Policy: Allow authenticated users to upload (with path validation)
CREATE POLICY "Authenticated users can upload illustrations"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'training-illustrations' AND
    -- Must follow structure: /{discipline}/{type}/...
    (storage.foldername(name))[1] IN ('force', 'endurance', 'functional', 'competitions', 'calisthenics')
  );

-- Policy: Allow everyone to read public files
CREATE POLICY "Public illustrations are accessible to all"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'training-illustrations');

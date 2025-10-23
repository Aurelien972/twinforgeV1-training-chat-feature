/*
  # Create Illustration Storage Bucket and Fix RLS Policies

  ## Overview
  This migration fixes the illustration system by:
  1. Creating the training-illustrations storage bucket
  2. Adding proper RLS policies for public read access
  3. Fixing illustration_library SELECT policy for all authenticated users

  ## Changes
  1. Storage Bucket
     - Creates `training-illustrations` bucket if not exists
     - Public bucket for CDN delivery
     - 5MB file size limit per image
     - Allowed MIME types: image/webp, image/png, image/jpeg, image/svg+xml

  2. Storage RLS Policies
     - Service role can upload/update/delete (for Edge Functions)
     - Authenticated users can upload (for future manual uploads)
     - Public read access for all (for CDN delivery)

  3. illustration_library RLS Policy
     - Add public SELECT policy for all authenticated users
     - Keep service_role full access for Edge Functions

  ## Security
  - RLS enabled on storage.objects
  - Public read is safe (illustrations are non-sensitive)
  - Write access restricted to service role and authenticated users
*/

-- ============================================================================
-- PART 1: Create Storage Bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-illustrations',
  'training-illustrations',
  true,
  5242880, -- 5MB
  ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

-- ============================================================================
-- PART 2: Storage RLS Policies
-- ============================================================================

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

-- ============================================================================
-- PART 3: Fix illustration_library RLS Policies
-- ============================================================================

-- Drop existing restrictive policy if exists
DROP POLICY IF EXISTS "Anyone can view illustrations" ON illustration_library;
DROP POLICY IF EXISTS "Authenticated users can view illustrations" ON illustration_library;

-- Add public SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view all illustrations"
  ON illustration_library FOR SELECT
  TO authenticated
  USING (true);

-- Also allow anonymous read (for future public gallery features)
CREATE POLICY "Public can view all illustrations"
  ON illustration_library FOR SELECT
  TO anon
  USING (true);

-- Service role keeps full access (already exists from previous migration)
-- No change needed for "Service role can manage illustrations" policy

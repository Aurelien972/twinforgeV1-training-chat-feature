/*
  # Secure Storage Buckets - Privacy Enhancement

  ## Overview
  This migration enhances data privacy by making all sensitive storage buckets private
  and implementing proper RLS (Row Level Security) policies to ensure users can only
  access their own data.

  ## Buckets being secured (public → private):
  1. **body-scans** - User body scan photos (ULTRA-CONFIDENTIAL)
  2. **3d-models** - Custom 3D mesh models per user
  3. **silhouettes** - Body silhouette images
  4. **fast-archetype** - FAST archetype data (if used)
  5. **meal-photos** - User meal photos
  6. **training-locations** - Training location photos (PRIVATE - user requested)

  ## Buckets remaining public:
  - **training-illustrations** - Generic exercise illustrations (non-sensitive)

  ## Security Measures:
  - All sensitive buckets set to `public = false`
  - RLS policies ensure users can only access their own files
  - Service role retains full access for Edge Functions
  - Signed URLs will be required for accessing private content

  ## Changes:
  1. Update bucket configuration to private
  2. Drop and recreate RLS policies with proper user isolation
  3. Add service_role access for backend operations
*/

-- ============================================================================
-- PART 1: Secure body-scans bucket
-- ============================================================================

-- Create bucket if doesn't exist, or update to private
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'body-scans',
  'body-scans',
  false, -- PRIVATE
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload body scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own body scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own body scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own body scans" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access body-scans" ON storage.objects;

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload body scans"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'body-scans' AND
    (storage.foldername(name))[1] = 'scans' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy: Users can view own scans
CREATE POLICY "Users can view own body scans"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'body-scans' AND
    (storage.foldername(name))[1] = 'scans' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy: Users can update own scans
CREATE POLICY "Users can update own body scans"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'body-scans' AND
    (storage.foldername(name))[1] = 'scans' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy: Users can delete own scans
CREATE POLICY "Users can delete own body scans"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'body-scans' AND
    (storage.foldername(name))[1] = 'scans' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy: Service role full access
CREATE POLICY "Service role full access body-scans"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'body-scans')
  WITH CHECK (bucket_id = 'body-scans');

-- ============================================================================
-- PART 2: Secure 3d-models bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '3d-models',
  '3d-models',
  false, -- PRIVATE
  52428800, -- 50MB
  ARRAY['model/gltf-binary', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['model/gltf-binary', 'application/octet-stream'];

DROP POLICY IF EXISTS "Users can view own 3d models" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access 3d-models" ON storage.objects;

CREATE POLICY "Users can view own 3d models"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = '3d-models' AND
    (
      -- Public base models (M_character_uniq.glb, F_character_uniq_4.13.glb)
      name NOT LIKE '%/%' OR
      -- User-specific models
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "Service role full access 3d-models"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = '3d-models')
  WITH CHECK (bucket_id = '3d-models');

-- ============================================================================
-- PART 3: Secure silhouettes bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'silhouettes',
  'silhouettes',
  false, -- PRIVATE
  5242880, -- 5MB
  ARRAY['image/png', 'image/webp', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/webp', 'image/jpeg'];

DROP POLICY IF EXISTS "Users can view own silhouettes" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access silhouettes" ON storage.objects;

CREATE POLICY "Users can view own silhouettes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'silhouettes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Service role full access silhouettes"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'silhouettes')
  WITH CHECK (bucket_id = 'silhouettes');

-- ============================================================================
-- PART 4: Secure fast-archetype bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fast-archetype',
  'fast-archetype',
  false, -- PRIVATE
  5242880, -- 5MB
  ARRAY['image/png', 'image/webp', 'image/jpeg', 'application/json']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/webp', 'image/jpeg', 'application/json'];

DROP POLICY IF EXISTS "Service role full access fast-archetype" ON storage.objects;

CREATE POLICY "Service role full access fast-archetype"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'fast-archetype')
  WITH CHECK (bucket_id = 'fast-archetype');

-- ============================================================================
-- PART 5: Secure meal-photos bucket (previously might have been named 1000-photos)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-photos',
  'meal-photos',
  false, -- PRIVATE
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Users can upload meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access meal-photos" ON storage.objects;

CREATE POLICY "Users can upload meal photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'meal-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own meal photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'meal-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own meal photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'meal-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Service role full access meal-photos"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'meal-photos')
  WITH CHECK (bucket_id = 'meal-photos');

-- ============================================================================
-- PART 6: Secure training-locations bucket
-- ============================================================================

-- Update existing training-locations bucket to PRIVATE (was public)
UPDATE storage.buckets
SET public = false
WHERE id = 'training-locations';

-- Drop existing public policies
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public files are accessible to all" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create new private policies specific to training-locations
DROP POLICY IF EXISTS "Users can upload training locations" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own training locations" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own training locations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own training locations" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access training-locations" ON storage.objects;

CREATE POLICY "Users can upload training locations"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'training-locations' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own training locations"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'training-locations' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own training locations"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'training-locations' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own training locations"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'training-locations' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Service role full access training-locations"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'training-locations')
  WITH CHECK (bucket_id = 'training-locations');

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- All sensitive buckets are now private with proper RLS policies
-- Users can only access their own data
-- Service role retains full access for backend operations
-- Signed URLs will be required for accessing private content (expires in 1 hour by default)

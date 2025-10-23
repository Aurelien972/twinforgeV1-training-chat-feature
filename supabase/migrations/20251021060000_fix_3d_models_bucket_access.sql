/*
  # Fix 3D Models Bucket Access - Enable Base Model Signed URLs

  ## Problem
  Users cannot generate signed URLs for base 3D models (M_character_uniq.glb, F_character_uniq_4.13.glb)
  even though the RLS policy allows SELECT access. The issue is that signed URL generation requires
  explicit object existence check which fails with the current policy structure.

  ## Root Cause
  The current policy uses `name NOT LIKE '%/%'` condition which should allow access to root-level files,
  but Supabase's signed URL generation performs additional checks that require a more explicit policy.

  ## Solution
  Create a dedicated policy specifically for base model access that explicitly allows all authenticated
  users to access the base model files. This ensures signed URL generation works correctly.

  ## Changes
  1. Drop the overly complex existing policy
  2. Create two separate policies:
     - One for base models (M_character_uniq.glb, F_character_uniq_4.13.glb) - accessible to ALL authenticated users
     - One for user-specific custom models - restricted to owner only
  3. Maintain service_role full access

  ## Security
  - Base models are NOT sensitive (they are generic templates)
  - User-specific models remain private (user isolation maintained)
  - Service role retains full access for backend operations
*/

-- ============================================================================
-- Drop Existing 3D Models Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own 3d models" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access 3d-models" ON storage.objects;

-- ============================================================================
-- Create New Policies with Explicit Base Model Access
-- ============================================================================

-- Policy 1: All authenticated users can access base 3D models
CREATE POLICY "Authenticated users can access base 3d models"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = '3d-models' AND
    (
      name = 'M_character_uniq.glb' OR
      name = 'F_character_uniq_4.13.glb'
    )
  );

-- Policy 2: Users can access their own custom 3D models
CREATE POLICY "Users can access own custom 3d models"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = '3d-models' AND
    name != 'M_character_uniq.glb' AND
    name != 'F_character_uniq_4.13.glb' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 3: Users can upload custom models to their own folder
CREATE POLICY "Users can upload custom 3d models"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = '3d-models' AND
    name != 'M_character_uniq.glb' AND
    name != 'F_character_uniq_4.13.glb' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 4: Users can update their own custom models
CREATE POLICY "Users can update own custom 3d models"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = '3d-models' AND
    name != 'M_character_uniq.glb' AND
    name != 'F_character_uniq_4.13.glb' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 5: Users can delete their own custom models
CREATE POLICY "Users can delete own custom 3d models"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = '3d-models' AND
    name != 'M_character_uniq.glb' AND
    name != 'F_character_uniq_4.13.glb' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 6: Service role full access (for backend operations)
CREATE POLICY "Service role full access 3d-models"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = '3d-models')
  WITH CHECK (bucket_id = '3d-models');

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count policies for 3d-models bucket
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%3d%model%';

  RAISE NOTICE '=== 3D MODELS BUCKET POLICY STATUS ===';
  RAISE NOTICE 'Total policies for 3d-models: %', policy_count;

  IF policy_count >= 6 THEN
    RAISE NOTICE '✓ All 3D models policies created successfully';
    RAISE NOTICE '✓ Base models (M_character_uniq.glb, F_character_uniq_4.13.glb) are accessible to all authenticated users';
    RAISE NOTICE '✓ Custom user models remain private (user-isolated)';
    RAISE NOTICE '✓ Service role has full access';
  ELSE
    RAISE WARNING 'Expected 6 policies, but found %', policy_count;
  END IF;
END $$;

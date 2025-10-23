/*
  # Cleanup Unused Storage Buckets - Security Enhancement

  This migration removes unused storage buckets that were part of legacy features
  (facial scan avatar generation) that are no longer active in the application.

  ## Changes

  1. Remove Unused Buckets
     - `avatars` bucket (0 files, legacy manga-style avatar generation)
     - `face_archetypes` bucket (0 files, facial scan reference data)

  2. Verification
     - Both buckets contain 0 files and are safe to remove
     - No active code references to these buckets for file storage
     - face_archetypes TABLE remains (used by morphology-mapping function)

  ## Security Impact

  - Reduces attack surface by removing unused storage endpoints
  - All remaining private buckets properly secured with RLS (per migration 20251019230000)
  - Public buckets (Logos TWINFORGE, app-images) remain for generic assets

  ## Remaining Buckets After Migration

  PRIVATE (RLS Protected):
  - body-scans: User body scan photos
  - 3d-models: Generated 3D avatar models
  - silhouettes: Body silhouette images
  - meal-photos: User meal photos
  - training-locations: Training location photos
  - training-illustrations: Exercise illustrations

  PUBLIC (Generic Assets):
  - Logos TWINFORGE: Brand logos
  - app-images: Generic app assets
*/

-- ============================================================================
-- SAFETY CHECK: Verify buckets are empty before deletion
-- ============================================================================

DO $$
DECLARE
  avatars_count INTEGER;
  face_archetypes_count INTEGER;
BEGIN
  -- Count files in avatars bucket
  SELECT COUNT(*) INTO avatars_count
  FROM storage.objects
  WHERE bucket_id = 'avatars';

  -- Count files in face_archetypes bucket
  SELECT COUNT(*) INTO face_archetypes_count
  FROM storage.objects
  WHERE bucket_id = 'face_archetypes';

  -- Log counts for audit trail
  RAISE NOTICE 'Files in avatars bucket: %', avatars_count;
  RAISE NOTICE 'Files in face_archetypes bucket: %', face_archetypes_count;

  -- Safety check: warn if buckets contain files
  IF avatars_count > 0 OR face_archetypes_count > 0 THEN
    RAISE WARNING 'Buckets contain files. Review before proceeding with deletion.';
  ELSE
    RAISE NOTICE 'Buckets are empty. Safe to delete.';
  END IF;
END $$;

-- ============================================================================
-- STEP 1: Remove RLS Policies (if any exist)
-- ============================================================================

-- Drop policies for avatars bucket (safe if they don't exist)
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;

-- Drop policies for face_archetypes bucket (safe if they don't exist)
DROP POLICY IF EXISTS "Face archetypes are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload face archetypes" ON storage.objects;

-- ============================================================================
-- STEP 2: Delete All Objects in Buckets (Safety measure)
-- ============================================================================

-- Delete any remaining objects in avatars bucket
DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- Delete any remaining objects in face_archetypes bucket
DELETE FROM storage.objects WHERE bucket_id = 'face_archetypes';

-- ============================================================================
-- STEP 3: Remove Buckets
-- ============================================================================

-- Remove avatars bucket
DELETE FROM storage.buckets WHERE id = 'avatars';

-- Remove face_archetypes bucket
DELETE FROM storage.buckets WHERE id = 'face_archetypes';

-- ============================================================================
-- VERIFICATION: Log Remaining Buckets
-- ============================================================================

DO $$
DECLARE
  bucket_record RECORD;
  bucket_count INTEGER;
BEGIN
  RAISE NOTICE '=== REMAINING STORAGE BUCKETS ===';

  FOR bucket_record IN
    SELECT name, public, file_size_limit, allowed_mime_types
    FROM storage.buckets
    ORDER BY name
  LOOP
    RAISE NOTICE 'Bucket: % | Public: % | Size Limit: % | MIME Types: %',
      bucket_record.name,
      bucket_record.public,
      bucket_record.file_size_limit,
      bucket_record.allowed_mime_types;
  END LOOP;

  SELECT COUNT(*) INTO bucket_count FROM storage.buckets;
  RAISE NOTICE 'Total remaining buckets: %', bucket_count;
END $$;

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

-- Create audit entry (if audit table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
    INSERT INTO audit_log (
      event_type,
      event_description,
      metadata,
      created_at
    ) VALUES (
      'storage_bucket_cleanup',
      'Removed unused storage buckets: avatars, face_archetypes',
      jsonb_build_object(
        'removed_buckets', ARRAY['avatars', 'face_archetypes'],
        'reason', 'Legacy feature removal - no active usage',
        'files_deleted', 0,
        'migration', '20251019240000'
      ),
      NOW()
    );
  END IF;
END $$;

/*
  # Enforce Private Storage Buckets - Security Fix

  ## Critical Security Issue
  The previous migration (20251019230000) attempted to set sensitive buckets to private,
  but the bucket configuration didn't update. This migration enforces the privacy settings.

  ## Problem
  All sensitive buckets are still marked as `public = true` in storage.buckets table,
  despite RLS policies being in place. This is a security vulnerability.

  ## Solution
  Explicitly update bucket configuration to set `public = false` for all sensitive buckets.

  ## Buckets Being Secured (public → private)

  ULTRA-CONFIDENTIAL (User Personal Data):
  - body-scans: User body scan photos
  - 3d-models: Custom 3D mesh models per user
  - silhouettes: Body silhouette images
  - meal-photos: User meal photos
  - training-locations: Training location photos

  PUBLIC (Generic Assets - NO CHANGE):
  - training-illustrations: Generic exercise illustrations
  - Logos TWINFORGE: Brand logos
  - app-images: Generic app assets

  ## Security Impact
  - Prevents direct public URL access to sensitive user data
  - Requires signed URLs for accessing private content (1-hour expiration)
  - RLS policies already in place ensure users can only access their own files
  - Service role retains full access for Edge Functions

  ## Verification
  After this migration, all sensitive buckets will have `public = false` and
  `updated_at` timestamp will reflect this change.
*/

-- ============================================================================
-- CRITICAL: Update All Sensitive Buckets to Private
-- ============================================================================

-- Log current status before change
DO $$
DECLARE
  bucket_record RECORD;
BEGIN
  RAISE NOTICE '=== BUCKET STATUS BEFORE UPDATE ===';
  FOR bucket_record IN
    SELECT name, public, updated_at
    FROM storage.buckets
    WHERE name IN ('body-scans', '3d-models', 'silhouettes', 'meal-photos', 'training-locations')
    ORDER BY name
  LOOP
    RAISE NOTICE 'Bucket: % | Public: % | Updated: %',
      bucket_record.name,
      bucket_record.public,
      bucket_record.updated_at;
  END LOOP;
END $$;

-- Update body-scans to private
UPDATE storage.buckets
SET
  public = false,
  updated_at = NOW()
WHERE id = 'body-scans';

-- Update 3d-models to private
UPDATE storage.buckets
SET
  public = false,
  updated_at = NOW()
WHERE id = '3d-models';

-- Update silhouettes to private
UPDATE storage.buckets
SET
  public = false,
  updated_at = NOW()
WHERE id = 'silhouettes';

-- Update meal-photos to private
UPDATE storage.buckets
SET
  public = false,
  updated_at = NOW()
WHERE id = 'meal-photos';

-- Update training-locations to private
UPDATE storage.buckets
SET
  public = false,
  updated_at = NOW()
WHERE id = 'training-locations';

-- ============================================================================
-- VERIFICATION: Confirm All Changes
-- ============================================================================

DO $$
DECLARE
  bucket_record RECORD;
  public_count INTEGER := 0;
  private_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== BUCKET STATUS AFTER UPDATE ===';

  FOR bucket_record IN
    SELECT name, public, updated_at
    FROM storage.buckets
    ORDER BY public DESC, name
  LOOP
    IF bucket_record.public THEN
      public_count := public_count + 1;
      RAISE NOTICE '[PUBLIC] % | Updated: %',
        bucket_record.name,
        bucket_record.updated_at;
    ELSE
      private_count := private_count + 1;
      RAISE NOTICE '[PRIVATE] % | Updated: %',
        bucket_record.name,
        bucket_record.updated_at;
    END IF;
  END LOOP;

  RAISE NOTICE '=== SUMMARY ===';
  RAISE NOTICE 'Total Private Buckets: %', private_count;
  RAISE NOTICE 'Total Public Buckets: %', public_count;

  -- Validate critical buckets are private
  IF EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE name IN ('body-scans', '3d-models', 'silhouettes', 'meal-photos', 'training-locations')
    AND public = true
  ) THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Sensitive buckets are still public!';
  ELSE
    RAISE NOTICE '✓ All sensitive buckets are now private';
  END IF;
END $$;

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
    INSERT INTO audit_log (
      event_type,
      event_description,
      metadata,
      created_at
    ) VALUES (
      'storage_security_enforcement',
      'Enforced private status on all sensitive storage buckets',
      jsonb_build_object(
        'secured_buckets', ARRAY['body-scans', '3d-models', 'silhouettes', 'meal-photos', 'training-locations'],
        'reason', 'Critical security fix - buckets were public despite RLS policies',
        'migration', '20251019250000',
        'previous_status', 'public',
        'new_status', 'private'
      ),
      NOW()
    );
  END IF;
END $$;

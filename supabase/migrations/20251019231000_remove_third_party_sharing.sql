/*
  # Remove Third-Party Sharing Feature

  ## Overview
  This migration removes all traces of the "third-party sharing" feature
  which has been deprecated for enhanced user privacy.

  ## Changes:
  1. Remove third_party_sharing_enabled column from user_preferences
  2. Remove 'third_party_sharing' from consent types in data_privacy_consents
  3. Clean up any existing third-party sharing consents

  ## Privacy Enhancement:
  - Users no longer have the option to share data with third parties
  - All data remains strictly confidential to the user
  - Existing third-party sharing consents are removed
*/

-- ============================================================================
-- PART 1: Remove third_party_sharing_enabled from user_preferences
-- ============================================================================

-- Drop column if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'third_party_sharing_enabled'
  ) THEN
    ALTER TABLE user_preferences DROP COLUMN third_party_sharing_enabled;
  END IF;
END $$;

-- ============================================================================
-- PART 2: Clean up third-party sharing consents
-- ============================================================================

-- Delete all third-party sharing consents
DELETE FROM data_privacy_consents
WHERE consent_type = 'third_party_sharing';

-- ============================================================================
-- PART 3: Add audit log entry
-- ============================================================================

-- Log this privacy enhancement in data access log (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'data_access_log'
  ) THEN
    INSERT INTO data_access_log (
      user_id,
      access_type,
      action_details,
      performed_by,
      accessed_at
    )
    SELECT
      id as user_id,
      'preference_update' as access_type,
      jsonb_build_object(
        'action', 'remove_third_party_sharing_feature',
        'reason', 'privacy_enhancement',
        'timestamp', now()
      ) as action_details,
      'system' as performed_by,
      now() as accessed_at
    FROM auth.users;
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Third-party sharing feature has been completely removed
-- User privacy is enhanced - no data sharing with third parties
-- All existing third-party sharing consents have been revoked

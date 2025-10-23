/*
  # Privacy & RGPD Compliance System - Data Export & Account Deletion

  1. New Tables
    - `data_export_requests` - Track user data export requests
    - `account_deletion_requests` - Track account deletion requests with 30-day grace period
    - `data_privacy_consents` - Track user consent history for legal compliance
    - `data_access_log` - Audit log for all privacy-related actions

  2. Extend user_preferences
    - `data_retention_preference` - minimal, standard, extended
    - `analytics_tracking_enabled` - boolean
    - `third_party_sharing_enabled` - boolean
    - `marketing_communications_enabled` - boolean

  3. Security
    - Enable RLS on all new tables
    - Strict policies for user data access
    - Audit logging for all privacy-related actions

  4. Functions
    - Request data export
    - Request account deletion
    - Cancel deletion request
    - Clean up expired exports
*/

-- =============================================
-- 1. EXTEND user_preferences TABLE
-- =============================================

DO $$
BEGIN
  -- Data retention preference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'data_retention_preference'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN data_retention_preference text NOT NULL DEFAULT 'standard'
      CHECK (data_retention_preference IN ('minimal', 'standard', 'extended'));
  END IF;

  -- Analytics tracking toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'analytics_tracking_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN analytics_tracking_enabled boolean NOT NULL DEFAULT true;
  END IF;

  -- Third-party data sharing toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'third_party_sharing_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN third_party_sharing_enabled boolean NOT NULL DEFAULT false;
  END IF;

  -- Marketing communications toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'marketing_communications_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN marketing_communications_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- =============================================
-- 2. CREATE data_export_requests TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Request details
  request_type text NOT NULL DEFAULT 'full_export' CHECK (request_type IN (
    'full_export',
    'partial_export'
  )),

  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )),

  export_format text NOT NULL DEFAULT 'json' CHECK (export_format IN ('json', 'csv')),

  -- Data categories to include
  included_data jsonb NOT NULL DEFAULT '["profile", "training", "nutrition", "fasting", "body_scans", "activities"]'::jsonb,

  -- Export file details
  file_url text,
  file_size_bytes bigint,
  expires_at timestamptz,

  -- Timestamps
  requested_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,

  -- Error tracking
  error_message text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id
  ON data_export_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_status
  ON data_export_requests(status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_expires_at
  ON data_export_requests(expires_at) WHERE status = 'completed';

-- =============================================
-- 3. CREATE account_deletion_requests TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Deletion status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'scheduled',
    'processing',
    'completed',
    'cancelled'
  )),

  -- Deletion options
  delete_all_data boolean NOT NULL DEFAULT true,
  anonymize_only boolean NOT NULL DEFAULT false,

  -- Scheduling
  deletion_scheduled_at timestamptz NOT NULL,

  -- Optional reason
  reason text,

  -- Timestamps
  requested_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text
);

-- Create unique partial index for one active deletion request per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_deletion_requests_user_active
  ON account_deletion_requests(user_id)
  WHERE status IN ('pending', 'scheduled', 'processing');

-- Create other indexes
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id
  ON account_deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_scheduled
  ON account_deletion_requests(deletion_scheduled_at, status)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status
  ON account_deletion_requests(status, requested_at DESC);

-- =============================================
-- 4. CREATE data_privacy_consents TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS data_privacy_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Consent type
  consent_type text NOT NULL CHECK (consent_type IN (
    'terms_of_service',
    'privacy_policy',
    'marketing',
    'analytics',
    'third_party_sharing'
  )),

  -- Consent details
  consent_given boolean NOT NULL,
  consent_version text NOT NULL,
  consented_at timestamptz DEFAULT now() NOT NULL,

  -- Legal proof
  ip_address inet,
  user_agent text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_data_privacy_consents_user_id
  ON data_privacy_consents(user_id, consent_type);

CREATE INDEX IF NOT EXISTS idx_data_privacy_consents_type
  ON data_privacy_consents(consent_type, consented_at DESC);

-- =============================================
-- 5. CREATE data_access_log TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Action type
  access_type text NOT NULL CHECK (access_type IN (
    'export',
    'deletion',
    'anonymization',
    'consent_update',
    'preference_update'
  )),

  -- Action details
  action_details jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Actor
  performed_by text NOT NULL DEFAULT 'user' CHECK (performed_by IN (
    'user',
    'system',
    'admin'
  )),

  -- Audit information
  ip_address inet,
  accessed_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_data_access_log_user_id
  ON data_access_log(user_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_access_log_type
  ON data_access_log(access_type, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_access_log_accessed_at
  ON data_access_log(accessed_at DESC);

-- =============================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =============================================

-- data_export_requests policies
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own export requests"
  ON data_export_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own export requests"
  ON data_export_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update export requests"
  ON data_export_requests
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- account_deletion_requests policies
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own deletion requests"
  ON account_deletion_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deletion requests"
  ON account_deletion_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deletion requests"
  ON account_deletion_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending', 'scheduled'))
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage deletion requests"
  ON account_deletion_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- data_privacy_consents policies
ALTER TABLE data_privacy_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own consents"
  ON data_privacy_consents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consents"
  ON data_privacy_consents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- data_access_log policies
ALTER TABLE data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own access log"
  ON data_access_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage access log"
  ON data_access_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Function to request data export
CREATE OR REPLACE FUNCTION request_data_export(
  p_user_id uuid,
  p_request_type text DEFAULT 'full_export',
  p_export_format text DEFAULT 'json',
  p_included_data jsonb DEFAULT '["profile", "training", "nutrition", "fasting", "body_scans", "activities"]'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_request_id uuid;
BEGIN
  INSERT INTO data_export_requests (
    user_id,
    request_type,
    export_format,
    included_data,
    status
  ) VALUES (
    p_user_id,
    p_request_type,
    p_export_format,
    p_included_data,
    'pending'
  ) RETURNING id INTO v_request_id;

  INSERT INTO data_access_log (user_id, access_type, action_details, performed_by)
  VALUES (
    p_user_id,
    'export',
    jsonb_build_object(
      'request_id', v_request_id,
      'request_type', p_request_type,
      'format', p_export_format
    ),
    'user'
  );

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request account deletion
CREATE OR REPLACE FUNCTION request_account_deletion(
  p_user_id uuid,
  p_delete_all_data boolean DEFAULT true,
  p_anonymize_only boolean DEFAULT false,
  p_reason text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_request_id uuid;
  v_scheduled_at timestamptz;
BEGIN
  IF EXISTS (
    SELECT 1 FROM account_deletion_requests
    WHERE user_id = p_user_id
      AND status IN ('pending', 'scheduled', 'processing')
  ) THEN
    RAISE EXCEPTION 'An active deletion request already exists for this user';
  END IF;

  v_scheduled_at := NOW() + INTERVAL '30 days';

  INSERT INTO account_deletion_requests (
    user_id,
    status,
    delete_all_data,
    anonymize_only,
    deletion_scheduled_at,
    reason
  ) VALUES (
    p_user_id,
    'pending',
    p_delete_all_data,
    p_anonymize_only,
    v_scheduled_at,
    p_reason
  ) RETURNING id INTO v_request_id;

  INSERT INTO data_access_log (user_id, access_type, action_details, performed_by)
  VALUES (
    p_user_id,
    'deletion',
    jsonb_build_object(
      'request_id', v_request_id,
      'scheduled_at', v_scheduled_at,
      'delete_all', p_delete_all_data,
      'anonymize_only', p_anonymize_only
    ),
    'user'
  );

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel account deletion
CREATE OR REPLACE FUNCTION cancel_account_deletion(
  p_user_id uuid,
  p_cancellation_reason text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_request_id uuid;
BEGIN
  UPDATE account_deletion_requests
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancellation_reason = p_cancellation_reason
  WHERE user_id = p_user_id
    AND status IN ('pending', 'scheduled')
  RETURNING id INTO v_request_id;

  IF v_request_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO data_access_log (user_id, access_type, action_details, performed_by)
  VALUES (
    p_user_id,
    'deletion',
    jsonb_build_object(
      'request_id', v_request_id,
      'action', 'cancelled',
      'reason', p_cancellation_reason
    ),
    'user'
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired data exports
CREATE OR REPLACE FUNCTION cleanup_expired_data_exports()
RETURNS void AS $$
BEGIN
  DELETE FROM data_export_requests
  WHERE status = 'completed'
    AND expires_at < NOW();

  DELETE FROM data_export_requests
  WHERE status = 'failed'
    AND requested_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's privacy dashboard summary
CREATE OR REPLACE FUNCTION get_privacy_dashboard(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'active_deletion_request', (
      SELECT jsonb_build_object(
        'id', id,
        'status', status,
        'scheduled_at', deletion_scheduled_at,
        'requested_at', requested_at
      )
      FROM account_deletion_requests
      WHERE user_id = p_user_id
        AND status IN ('pending', 'scheduled')
      ORDER BY requested_at DESC
      LIMIT 1
    ),
    'recent_exports', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'status', status,
          'format', export_format,
          'requested_at', requested_at,
          'completed_at', completed_at,
          'expires_at', expires_at,
          'file_url', CASE WHEN status = 'completed' THEN file_url ELSE NULL END
        ) ORDER BY requested_at DESC
      )
      FROM data_export_requests
      WHERE user_id = p_user_id
        AND requested_at > NOW() - INTERVAL '90 days'
      LIMIT 5
    ),
    'consents', (
      SELECT jsonb_object_agg(
        consent_type,
        jsonb_build_object(
          'given', consent_given,
          'version', consent_version,
          'date', consented_at
        )
      )
      FROM (
        SELECT DISTINCT ON (consent_type)
          consent_type,
          consent_given,
          consent_version,
          consented_at
        FROM data_privacy_consents
        WHERE user_id = p_user_id
        ORDER BY consent_type, consented_at DESC
      ) latest_consents
    ),
    'recent_access_log', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', access_type,
          'details', action_details,
          'performed_by', performed_by,
          'timestamp', accessed_at
        ) ORDER BY accessed_at DESC
      )
      FROM data_access_log
      WHERE user_id = p_user_id
        AND accessed_at > NOW() - INTERVAL '30 days'
      LIMIT 10
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record consent
CREATE OR REPLACE FUNCTION record_consent(
  p_user_id uuid,
  p_consent_type text,
  p_consent_given boolean,
  p_consent_version text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_consent_id uuid;
BEGIN
  INSERT INTO data_privacy_consents (
    user_id,
    consent_type,
    consent_given,
    consent_version,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_consent_type,
    p_consent_given,
    p_consent_version,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_consent_id;

  INSERT INTO data_access_log (user_id, access_type, action_details, performed_by)
  VALUES (
    p_user_id,
    'consent_update',
    jsonb_build_object(
      'consent_id', v_consent_id,
      'consent_type', p_consent_type,
      'consent_given', p_consent_given,
      'version', p_consent_version
    ),
    'user'
  );

  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

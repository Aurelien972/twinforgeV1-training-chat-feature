/*
  # Create OAuth Flow Initialization Function

  ## Description
  This migration creates a PostgreSQL function to initialize OAuth authentication flows
  for wearable device connections. The function generates a secure state parameter,
  stores it in the device_auth_flows table, and returns it to the frontend for use
  in the OAuth redirect URL.

  ## 1. New Functions

  ### `create_device_auth_flow`
  Initialize a new OAuth authentication flow for a wearable provider
  - Parameters:
    - `p_provider` (text) - Provider name (e.g., 'google_fit', 'strava')
    - `p_redirect_uri` (text) - OAuth callback redirect URI
  - Returns: JSON object with state and expiration timestamp
  - Security: Only accessible to authenticated users
  - Automatically cleans up expired flows for the same user/provider

  ## 2. Security
  - Function uses SECURITY DEFINER but validates auth.uid()
  - RLS policies on device_auth_flows table still apply
  - State parameter is a cryptographically secure UUID
  - Flows expire after 10 minutes

  ## 3. Cleanup
  - Automatically deletes expired flows for the same user/provider before creating new one
  - This prevents database bloat from abandoned OAuth attempts
  - Expired flows are those with status='pending' and expires_at < NOW()

  ## 4. Usage Example
  ```sql
  SELECT create_device_auth_flow('google_fit', 'https://example.com/callback');
  ```

  Returns:
  ```json
  {
    "state": "550e8400-e29b-41d4-a716-446655440000",
    "expires_at": "2025-10-20T05:10:00.000Z"
  }
  ```
*/

-- =====================================================
-- FUNCTION: create_device_auth_flow
-- =====================================================

CREATE OR REPLACE FUNCTION create_device_auth_flow(
  p_provider TEXT,
  p_redirect_uri TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_state TEXT;
  v_expires_at TIMESTAMPTZ;
  v_result JSON;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  -- Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate provider
  IF p_provider IS NULL OR p_provider = '' THEN
    RAISE EXCEPTION 'Provider is required';
  END IF;

  -- Validate redirect URI
  IF p_redirect_uri IS NULL OR p_redirect_uri = '' THEN
    RAISE EXCEPTION 'Redirect URI is required';
  END IF;

  -- Generate secure state parameter
  v_state := gen_random_uuid()::TEXT;

  -- Set expiration (10 minutes from now)
  v_expires_at := NOW() + INTERVAL '10 minutes';

  -- Clean up any expired or pending flows for this user and provider
  -- This prevents database bloat from abandoned OAuth attempts
  DELETE FROM device_auth_flows
  WHERE user_id = v_user_id
    AND provider = p_provider
    AND status = 'pending'
    AND (expires_at < NOW() OR created_at < NOW() - INTERVAL '1 hour');

  -- Insert new auth flow record
  INSERT INTO device_auth_flows (
    user_id,
    provider,
    state,
    redirect_uri,
    status,
    expires_at
  ) VALUES (
    v_user_id,
    p_provider,
    v_state,
    p_redirect_uri,
    'pending',
    v_expires_at
  );

  -- Return state and expiration as JSON
  v_result := json_build_object(
    'state', v_state,
    'expires_at', v_expires_at
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- GRANT EXECUTE TO AUTHENTICATED USERS
-- =====================================================

GRANT EXECUTE ON FUNCTION create_device_auth_flow(TEXT, TEXT) TO authenticated;

-- =====================================================
-- COMMENT FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION create_device_auth_flow(TEXT, TEXT) IS
'Initialize OAuth flow for wearable device connection. Generates secure state parameter, stores it in device_auth_flows table, and returns it for use in OAuth redirect URL. Automatically cleans up expired flows. Only accessible to authenticated users.';

-- =====================================================
-- AUTOMATIC CLEANUP TRIGGER (Optional but recommended)
-- =====================================================

-- Create a function to clean up expired auth flows periodically
CREATE OR REPLACE FUNCTION cleanup_expired_auth_flows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired pending flows older than 1 hour
  DELETE FROM device_auth_flows
  WHERE status = 'pending'
    AND expires_at < NOW() - INTERVAL '1 hour';

  -- Delete completed/failed flows older than 7 days (for audit purposes)
  DELETE FROM device_auth_flows
  WHERE status IN ('completed', 'failed')
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

COMMENT ON FUNCTION cleanup_expired_auth_flows() IS
'Clean up expired and old OAuth authentication flows. Deletes pending flows expired >1 hour ago and completed/failed flows >7 days old. Run periodically via cron or manually.';

-- Note: To schedule automatic cleanup, you can use pg_cron extension:
-- SELECT cron.schedule('cleanup-auth-flows', '0 * * * *', 'SELECT cleanup_expired_auth_flows()');
-- This would run every hour. However, pg_cron needs to be enabled first.

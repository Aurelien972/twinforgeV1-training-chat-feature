/*
  # CSRF Tokens System - Sprint 3 Phase 5.2

  1. New Tables
    - `csrf_tokens` - CSRF token management
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `token` (text, unique) - CSRF token
      - `expires_at` (timestamptz) - Token expiry
      - `used` (boolean) - Whether token has been used
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on csrf_tokens
    - Service role can manage tokens
    - Automatic cleanup of expired tokens
    - Single-use tokens for critical operations

  3. Functions
    - Generate CSRF token
    - Validate CSRF token
    - Cleanup expired tokens

  IMPORTANT: For preventing Cross-Site Request Forgery attacks
*/

-- =============================================================================
-- CSRF TOKENS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.csrf_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS csrf_tokens_user_id_idx ON public.csrf_tokens(user_id);
CREATE INDEX IF NOT EXISTS csrf_tokens_token_idx ON public.csrf_tokens(token);
CREATE INDEX IF NOT EXISTS csrf_tokens_expires_at_idx ON public.csrf_tokens(expires_at);
CREATE INDEX IF NOT EXISTS csrf_tokens_used_idx ON public.csrf_tokens(used);

-- Enable RLS
ALTER TABLE public.csrf_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all tokens
CREATE POLICY "Service role can manage csrf tokens"
  ON public.csrf_tokens FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- CSRF HELPER FUNCTIONS
-- =============================================================================

-- Function: Generate CSRF token
CREATE OR REPLACE FUNCTION public.generate_csrf_token(
  p_user_id uuid,
  p_validity_minutes integer DEFAULT 60
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
  v_expires_at timestamptz;
BEGIN
  -- Generate random token
  v_token := encode(gen_random_bytes(32), 'base64');

  -- Calculate expiry
  v_expires_at := now() + (p_validity_minutes || ' minutes')::interval;

  -- Insert token
  INSERT INTO public.csrf_tokens (user_id, token, expires_at)
  VALUES (p_user_id, v_token, v_expires_at);

  RETURN v_token;
END;
$$;

-- Function: Validate CSRF token
CREATE OR REPLACE FUNCTION public.validate_csrf_token(
  p_user_id uuid,
  p_token text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_record RECORD;
BEGIN
  -- Find token
  SELECT id, expires_at, used
  INTO v_token_record
  FROM public.csrf_tokens
  WHERE user_id = p_user_id
    AND token = p_token;

  -- Check if token exists
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if token is expired
  IF v_token_record.expires_at < now() THEN
    -- Delete expired token
    DELETE FROM public.csrf_tokens WHERE id = v_token_record.id;
    RETURN false;
  END IF;

  -- Check if token has been used
  IF v_token_record.used THEN
    RETURN false;
  END IF;

  -- Mark token as used
  UPDATE public.csrf_tokens
  SET used = true
  WHERE id = v_token_record.id;

  RETURN true;
END;
$$;

-- Function: Cleanup expired CSRF tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_csrf_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM public.csrf_tokens
  WHERE expires_at < now() OR used = true;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- Function: Get active CSRF token count for user
CREATE OR REPLACE FUNCTION public.get_csrf_token_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.csrf_tokens
  WHERE user_id = p_user_id
    AND expires_at > now()
    AND used = false;

  RETURN v_count;
END;
$$;

-- =============================================================================
-- SCHEDULED CLEANUP
-- =============================================================================

-- Schedule: Cleanup expired CSRF tokens every 15 minutes
SELECT cron.schedule(
  'cleanup-expired-csrf-tokens',
  '*/15 * * * *', -- Every 15 minutes
  $$
    SELECT public.cleanup_expired_csrf_tokens();
  $$
);

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.csrf_tokens IS 'CSRF token management for preventing Cross-Site Request Forgery attacks

Usage:
- Generate token when rendering forms or initiating sensitive operations
- Validate token on form submission or sensitive API calls
- Tokens are single-use and expire after configured time
- Automatic cleanup of expired and used tokens

Security:
- Tokens are cryptographically random (32 bytes, base64 encoded)
- Single-use prevents replay attacks
- Expiry prevents long-term token harvesting
- User-specific tokens prevent cross-user attacks
';

COMMENT ON FUNCTION public.generate_csrf_token(uuid, integer) IS 'Generates a new CSRF token for a user with specified validity in minutes (default: 60)';
COMMENT ON FUNCTION public.validate_csrf_token(uuid, text) IS 'Validates a CSRF token and marks it as used if valid';
COMMENT ON FUNCTION public.cleanup_expired_csrf_tokens() IS 'Scheduled job: Runs every 15 minutes to remove expired and used tokens';

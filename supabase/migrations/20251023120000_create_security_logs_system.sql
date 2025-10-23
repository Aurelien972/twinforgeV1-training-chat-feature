/*
  # Security Logging System - Sprint 3 Phase 4.2

  1. New Tables
    - `security_logs` - Main security event logging table
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `event_type` (text) - Type of security event
      - `severity` (text) - low|medium|high|critical
      - `ip_address` (text) - Source IP
      - `user_agent` (text) - Browser/client info
      - `edge_function` (text) - Which function triggered
      - `event_data` (jsonb) - Additional event data
      - `created_at` (timestamptz)

    - `session_tracking` - Active session monitoring
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `session_token` (text, unique) - Session identifier
      - `ip_address` (text)
      - `user_agent` (text)
      - `last_activity` (timestamptz)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only read their own logs
    - Service role can write/read all
    - Indexes for performance

  3. Functions
    - Auto-cleanup old logs (> 90 days)
    - Session expiry cleanup

  IMPORTANT: For monitoring attacks, abuse, and security incidents
*/

-- =============================================================================
-- SECURITY LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address text,
  user_agent text,
  edge_function text,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS security_logs_user_id_idx ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS security_logs_event_type_idx ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS security_logs_severity_idx ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS security_logs_created_at_idx ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS security_logs_edge_function_idx ON public.security_logs(edge_function);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own logs
CREATE POLICY "Users can read own security logs"
  ON public.security_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can insert logs
CREATE POLICY "Service role can insert security logs"
  ON public.security_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can read all logs (for admin dashboard)
CREATE POLICY "Service role can read all security logs"
  ON public.security_logs FOR SELECT
  TO service_role
  USING (true);

-- =============================================================================
-- SESSION TRACKING TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.session_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  ip_address text,
  user_agent text,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS session_tracking_user_id_idx ON public.session_tracking(user_id);
CREATE INDEX IF NOT EXISTS session_tracking_session_token_idx ON public.session_tracking(session_token);
CREATE INDEX IF NOT EXISTS session_tracking_expires_at_idx ON public.session_tracking(expires_at);
CREATE INDEX IF NOT EXISTS session_tracking_last_activity_idx ON public.session_tracking(last_activity DESC);

-- Enable RLS
ALTER TABLE public.session_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON public.session_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all sessions
CREATE POLICY "Service role can insert sessions"
  ON public.session_tracking FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update sessions"
  ON public.session_tracking FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete sessions"
  ON public.session_tracking FOR DELETE
  TO service_role
  USING (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: Log security event
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_severity text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_edge_function text DEFAULT NULL,
  p_event_data jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    severity,
    ip_address,
    user_agent,
    edge_function,
    event_data
  ) VALUES (
    p_user_id,
    p_event_type,
    p_severity,
    p_ip_address,
    p_user_agent,
    p_edge_function,
    p_event_data
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function: Cleanup old security logs (> 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM public.security_logs
  WHERE created_at < now() - interval '90 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- Function: Cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM public.session_tracking
  WHERE expires_at < now();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- Function: Get active session count for user
CREATE OR REPLACE FUNCTION public.get_active_session_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.session_tracking
  WHERE user_id = p_user_id
    AND expires_at > now();

  RETURN v_count;
END;
$$;

-- Function: Update session activity
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.session_tracking
  SET last_activity = now()
  WHERE session_token = p_session_token
    AND expires_at > now();
END;
$$;

-- =============================================================================
-- COMMON SECURITY EVENT TYPES (for reference)
-- =============================================================================

COMMENT ON TABLE public.security_logs IS 'Security event logging table

Common event_type values:
- auth_login_success
- auth_login_failed
- auth_logout
- validation_error
- rate_limit_exceeded
- suspicious_activity
- unauthorized_access
- token_expired
- session_created
- session_terminated
- csrf_validation_failed
- input_validation_failed

Severity levels:
- low: Normal operations, info
- medium: Warning, potential issue
- high: Security concern, needs attention
- critical: Active attack, immediate action required
';

COMMENT ON TABLE public.session_tracking IS 'Active session tracking for concurrent session limiting

Used to:
- Limit concurrent sessions per user
- Track session activity
- Auto-expire inactive sessions
- Security monitoring
';

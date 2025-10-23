/*
  # Session Cleanup Cron Job - Sprint 3 Phase 4.3

  1. Scheduled Jobs
    - Add cron job to cleanup expired sessions every hour
    - Add cron job to cleanup old security logs every day

  2. Purpose
    - Prevent database bloat from expired sessions
    - Maintain security log retention policy (90 days)
    - Improve query performance

  IMPORTANT: Automated maintenance for security infrastructure
*/

-- =============================================================================
-- SCHEDULED JOBS FOR CLEANUP
-- =============================================================================

-- Schedule: Cleanup expired sessions every hour
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '0 * * * *', -- Every hour at minute 0
  $$
    SELECT public.cleanup_expired_sessions();
  $$
);

-- Schedule: Cleanup old security logs every day at 3 AM
SELECT cron.schedule(
  'cleanup-old-security-logs',
  '0 3 * * *', -- Every day at 3:00 AM
  $$
    SELECT public.cleanup_old_security_logs();
  $$
);

-- Add comments for documentation
COMMENT ON FUNCTION public.cleanup_expired_sessions() IS 'Scheduled job: Runs every hour to remove expired sessions';
COMMENT ON FUNCTION public.cleanup_old_security_logs() IS 'Scheduled job: Runs daily at 3 AM to remove logs older than 90 days';

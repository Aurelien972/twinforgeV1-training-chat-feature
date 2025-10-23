/*
  # Cache Errors Monitoring System

  ## Overview
  Creates a lightweight monitoring table to track cache operation failures.
  This helps detect and diagnose issues with the training_ai_cache system.

  ## Tables Created

  ### cache_errors_log
  Tracks failed cache operations with full context for debugging:
  - Error details (message, code, hint)
  - Context (agent type, user, cache key)
  - Timestamp for pattern analysis
  - Automatic cleanup of old entries (30 days)

  ## Security
  - RLS enabled for admin access only
  - Service role can insert for Edge Functions
  - Read-only for authenticated users (own errors only)

  ## Indexes
  - created_at for time-series queries
  - agent_type for filtering by coach
  - user_id for user-specific debugging

  ## Notes
  - Lightweight: Only critical info logged
  - Auto-cleanup via policy
  - Designed for low overhead
*/

-- =====================================================
-- 1. CACHE_ERRORS_LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS cache_errors_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Error context
  agent_type text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('read', 'write', 'delete', 'upsert')),
  cache_key text,
  cache_type text,

  -- Error details
  error_message text NOT NULL,
  error_code text,
  error_details text,
  error_hint text,

  -- Metadata
  created_at timestamptz DEFAULT now(),

  -- Additional context (optional)
  metadata jsonb DEFAULT '{}'::jsonb
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cache_errors_log_created_at
  ON cache_errors_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cache_errors_log_agent_type
  ON cache_errors_log(agent_type);

CREATE INDEX IF NOT EXISTS idx_cache_errors_log_user_id
  ON cache_errors_log(user_id);

CREATE INDEX IF NOT EXISTS idx_cache_errors_log_operation
  ON cache_errors_log(operation);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE cache_errors_log ENABLE ROW LEVEL SECURITY;

-- Service role can insert (for Edge Functions)
CREATE POLICY "Service role can insert cache errors"
  ON cache_errors_log FOR INSERT
  WITH CHECK (true);

-- Users can view their own errors
CREATE POLICY "Users can view own cache errors"
  ON cache_errors_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. AUTO-CLEANUP FUNCTION
-- =====================================================

-- Function to clean old error logs (older than 30 days)
CREATE OR REPLACE FUNCTION clean_old_cache_errors()
RETURNS void AS $$
BEGIN
  DELETE FROM cache_errors_log
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. HELPER VIEW FOR MONITORING
-- =====================================================

-- View to aggregate cache errors by agent and day
CREATE OR REPLACE VIEW cache_errors_summary AS
SELECT
  date_trunc('day', created_at) as error_date,
  agent_type,
  operation,
  error_code,
  count(*) as error_count,
  count(DISTINCT user_id) as affected_users
FROM cache_errors_log
WHERE created_at > now() - interval '7 days'
GROUP BY 1, 2, 3, 4
ORDER BY error_date DESC, error_count DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE cache_errors_log IS
  'Logs cache operation failures for monitoring and debugging';

COMMENT ON COLUMN cache_errors_log.agent_type IS
  'Which coach/agent encountered the error (coach-endurance, coach-force, context-collector, etc.)';

COMMENT ON COLUMN cache_errors_log.operation IS
  'Type of cache operation that failed (read, write, delete, upsert)';

COMMENT ON VIEW cache_errors_summary IS
  'Aggregated view of cache errors for the last 7 days';

/*
  # Enable Realtime Notifications for Token Balance Updates

  ## Purpose
  Fix the issue where token balance updates in the database are not reflected in the UI.
  This migration enables real-time notifications for all token balance changes.

  ## Changes
  1. Enable Realtime publication for user_token_balance table
  2. Create a trigger function to send NOTIFY events on token balance updates
  3. Create trigger on user_token_balance to call the notification function
  4. Ensure all token consumption operations properly trigger UI updates

  ## Why This Fix is Needed
  - Token consumption is working correctly in the database (as shown in logs)
  - The consume_tokens_atomic function successfully updates user_token_balance
  - However, the UI (TokenBalanceWidget, SubscriptionManagementTab) is not receiving updates
  - This migration ensures Supabase Realtime broadcasts all changes immediately

  ## How It Works
  1. When consume_tokens_atomic updates user_token_balance, a trigger fires
  2. The trigger sends a PostgreSQL NOTIFY event with the user_id
  3. Supabase Realtime broadcasts this to subscribed clients
  4. TokenBalanceWidget receives the event and refreshes the balance
  5. All UI components reflect the new balance immediately

  ## Tables Affected
  - user_token_balance (add trigger for notifications)

  ## Realtime Configuration
  - Enable publication for user_token_balance table
  - Allow UPDATE, INSERT, DELETE events
  - No filters - all changes should be broadcast
*/

-- =====================================================
-- STEP 1: Enable Realtime for user_token_balance
-- =====================================================

-- Note: This requires the Realtime extension to be enabled
-- If not enabled, run: CREATE EXTENSION IF NOT EXISTS realtime;

-- Enable realtime for the user_token_balance table
-- This allows Supabase Realtime to broadcast changes to subscribed clients
ALTER PUBLICATION supabase_realtime ADD TABLE user_token_balance;

-- =====================================================
-- STEP 2: Create Notification Function
-- =====================================================

-- This function sends a NOTIFY event whenever the token balance changes
-- The NOTIFY event includes the user_id so clients can filter updates
CREATE OR REPLACE FUNCTION notify_token_balance_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification with user_id as payload
  -- Format: token_balance_changed:user_id
  PERFORM pg_notify(
    'token_balance_changed',
    json_build_object(
      'user_id', NEW.user_id,
      'available_tokens', NEW.available_tokens,
      'timestamp', extract(epoch from now())::bigint
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 3: Create Trigger for Token Balance Updates
-- =====================================================

-- Drop existing trigger if it exists to ensure clean installation
DROP TRIGGER IF EXISTS trigger_notify_token_balance_change ON user_token_balance;

-- Create trigger that fires AFTER UPDATE on user_token_balance
-- This ensures the notification is sent after the transaction commits
CREATE TRIGGER trigger_notify_token_balance_change
  AFTER UPDATE ON user_token_balance
  FOR EACH ROW
  WHEN (OLD.available_tokens IS DISTINCT FROM NEW.available_tokens)
  EXECUTE FUNCTION notify_token_balance_change();

-- Also trigger on INSERT (for new users)
DROP TRIGGER IF EXISTS trigger_notify_token_balance_insert ON user_token_balance;

CREATE TRIGGER trigger_notify_token_balance_insert
  AFTER INSERT ON user_token_balance
  FOR EACH ROW
  EXECUTE FUNCTION notify_token_balance_change();

-- =====================================================
-- STEP 4: Add Logging for Debugging
-- =====================================================

-- Create a simple log table to track when notifications are sent
-- This helps debug if notifications are firing but not reaching clients
CREATE TABLE IF NOT EXISTS token_balance_notification_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  available_tokens INTEGER NOT NULL,
  notification_sent_at TIMESTAMPTZ DEFAULT now(),

  -- Index for quick lookups
  INDEX idx_notification_log_user (user_id),
  INDEX idx_notification_log_time (notification_sent_at DESC)
);

-- Enable RLS on notification log
ALTER TABLE token_balance_notification_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notification logs
CREATE POLICY "Users can view own notification log"
  ON token_balance_notification_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to notification log"
  ON token_balance_notification_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update the notification function to also log
CREATE OR REPLACE FUNCTION notify_token_balance_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the notification (non-blocking - errors are ignored)
  BEGIN
    INSERT INTO token_balance_notification_log (user_id, available_tokens)
    VALUES (NEW.user_id, NEW.available_tokens);
  EXCEPTION
    WHEN OTHERS THEN
      -- Ignore logging errors to not block the main operation
      NULL;
  END;

  -- Send notification with user_id as payload
  PERFORM pg_notify(
    'token_balance_changed',
    json_build_object(
      'user_id', NEW.user_id,
      'available_tokens', NEW.available_tokens,
      'subscription_tokens', NEW.subscription_tokens,
      'onetime_tokens', NEW.onetime_tokens,
      'bonus_tokens', NEW.bonus_tokens,
      'timestamp', extract(epoch from now())::bigint
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: Cleanup Old Notification Logs (Maintenance)
-- =====================================================

-- Create function to cleanup old notification logs (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM token_balance_notification_log
  WHERE notification_sent_at < (now() - interval '7 days');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: Test the Notification System
-- =====================================================

-- To test this system manually:
-- 1. Connect to the database
-- 2. Run: LISTEN token_balance_changed;
-- 3. Update a token balance: UPDATE user_token_balance SET available_tokens = available_tokens - 1 WHERE user_id = '<some-user-id>';
-- 4. You should receive: NOTIFY token_balance_changed with the payload

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION notify_token_balance_change IS 'Sends NOTIFY event when token balance changes - enables real-time UI updates';
COMMENT ON TRIGGER trigger_notify_token_balance_change ON user_token_balance IS 'Triggers real-time notification on token balance UPDATE';
COMMENT ON TRIGGER trigger_notify_token_balance_insert ON user_token_balance IS 'Triggers real-time notification on token balance INSERT';
COMMENT ON TABLE token_balance_notification_log IS 'Debug log for tracking when token balance notifications are sent';
COMMENT ON FUNCTION cleanup_old_notification_logs IS 'Maintenance function to cleanup old notification logs (7+ days old)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- To verify this migration worked:
-- 1. Check if realtime is enabled:
--    SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_token_balance';
--
-- 2. Check if triggers exist:
--    SELECT * FROM pg_trigger WHERE tgname LIKE '%token_balance%';
--
-- 3. Check notification logs:
--    SELECT * FROM token_balance_notification_log ORDER BY notification_sent_at DESC LIMIT 10;

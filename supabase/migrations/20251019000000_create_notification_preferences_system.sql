/*
  # Notification Preferences System - Web Push & In-App Notifications

  1. Schema Extensions
    - Extend `user_preferences` table with notification fields
    - Create `notification_preferences` table for granular notification control
    - Create `push_subscriptions` table for web push endpoints
    - Create `notification_history` table for delivery tracking

  2. New Tables
    - `notification_preferences` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `category` (text) - training, nutrition, fasting, activity, system, social
      - `push_enabled` (boolean)
      - `in_app_enabled` (boolean)
      - `email_enabled` (boolean)
      - `sound_enabled` (boolean)
      - `vibration_enabled` (boolean)
      - `priority_filter` (text) - all, high_only, critical_only
      - `quiet_hours_enabled` (boolean)
      - `quiet_hours_start` (time)
      - `quiet_hours_end` (time)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `push_subscriptions` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `subscription_endpoint` (text, unique)
      - `subscription_keys` (jsonb) - p256dh and auth keys
      - `device_info` (jsonb) - user agent, platform, etc.
      - `is_active` (boolean)
      - `last_used_at` (timestamptz)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz, nullable)

    - `notification_history` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `notification_id` (text)
      - `category` (text)
      - `priority` (text)
      - `delivery_method` (text) - push, in_app, email
      - `status` (text) - sent, delivered, failed, dismissed
      - `sent_at` (timestamptz)
      - `delivered_at` (timestamptz, nullable)
      - `dismissed_at` (timestamptz, nullable)
      - `error_message` (text, nullable)

  3. Security
    - Enable RLS on all new tables
    - Policies for authenticated users to manage their own data
    - Secure push subscription data

  4. Indexes
    - Indexes for fast lookups on user_id and category
    - Index on subscription_endpoint for deduplication
    - Index on notification_history for analytics
*/

-- =============================================
-- 1. EXTEND user_preferences TABLE
-- =============================================

-- Add global notification toggles to user_preferences
DO $$
BEGIN
  -- Global push notifications toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'push_notifications_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN push_notifications_enabled boolean NOT NULL DEFAULT true;
  END IF;

  -- Global in-app notifications toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'in_app_notifications_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN in_app_notifications_enabled boolean NOT NULL DEFAULT true;
  END IF;

  -- Global email notifications toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN email_notifications_enabled boolean NOT NULL DEFAULT false;
  END IF;

  -- Notification sound preference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'notification_sound_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN notification_sound_enabled boolean NOT NULL DEFAULT true;
  END IF;

  -- Notification vibration preference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'notification_vibration_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN notification_vibration_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- =============================================
-- 2. CREATE notification_preferences TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Notification category
  category text NOT NULL CHECK (category IN (
    'training',
    'nutrition',
    'fasting',
    'activity',
    'system',
    'social',
    'achievements'
  )),

  -- Delivery channel toggles
  push_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,

  -- Notification experience
  sound_enabled boolean NOT NULL DEFAULT true,
  vibration_enabled boolean NOT NULL DEFAULT true,

  -- Priority filtering
  priority_filter text NOT NULL DEFAULT 'all' CHECK (priority_filter IN (
    'all',
    'high_only',
    'critical_only'
  )),

  -- Quiet hours
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- One preference per user per category
  UNIQUE(user_id, category)
);

-- Create index for fast user + category lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_category
  ON notification_preferences(user_id, category);

-- =============================================
-- 3. CREATE push_subscriptions TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Web Push subscription details
  subscription_endpoint text NOT NULL,
  subscription_keys jsonb NOT NULL, -- {p256dh: string, auth: string}

  -- Device information for management
  device_info jsonb, -- {userAgent: string, platform: string, browser: string}

  -- Subscription status
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz DEFAULT now() NOT NULL,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz, -- Optional expiration

  -- Unique subscription per endpoint
  UNIQUE(subscription_endpoint)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
  ON push_subscriptions(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
  ON push_subscriptions(subscription_endpoint);

-- =============================================
-- 4. CREATE notification_history TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Notification metadata
  notification_id text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Delivery information
  delivery_method text NOT NULL CHECK (delivery_method IN ('push', 'in_app', 'email')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN (
    'sent',
    'delivered',
    'failed',
    'dismissed',
    'clicked'
  )),

  -- Timestamps
  sent_at timestamptz DEFAULT now() NOT NULL,
  delivered_at timestamptz,
  dismissed_at timestamptz,
  clicked_at timestamptz,

  -- Error tracking
  error_message text,
  retry_count integer DEFAULT 0 NOT NULL
);

-- Create indexes for analytics and history queries
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id
  ON notification_history(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at
  ON notification_history(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_history_category
  ON notification_history(user_id, category, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_history_status
  ON notification_history(status, sent_at DESC);

-- =============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =============================================

-- notification_preferences policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences"
  ON notification_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- push_subscriptions policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own push subscriptions"
  ON push_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- notification_history policies
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification history"
  ON notification_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only system can insert/update notification history (via service role)
CREATE POLICY "Service role can manage notification history"
  ON notification_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 6. TRIGGERS FOR AUTO-UPDATE
-- =============================================

-- Trigger to auto-update updated_at on notification_preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Trigger to update last_used_at on push_subscriptions
CREATE OR REPLACE FUNCTION update_push_subscription_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_push_subscription_last_used ON push_subscriptions;
CREATE TRIGGER trigger_update_push_subscription_last_used
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  WHEN (OLD.is_active = true AND NEW.is_active = true)
  EXECUTE FUNCTION update_push_subscription_last_used();

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Function to initialize default notification preferences for a user
CREATE OR REPLACE FUNCTION initialize_notification_preferences(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert default preferences for all categories if they don't exist
  INSERT INTO notification_preferences (user_id, category, push_enabled, in_app_enabled)
  VALUES
    (p_user_id, 'training', true, true),
    (p_user_id, 'nutrition', true, true),
    (p_user_id, 'fasting', true, true),
    (p_user_id, 'activity', true, true),
    (p_user_id, 'system', true, true),
    (p_user_id, 'social', true, true),
    (p_user_id, 'achievements', true, true)
  ON CONFLICT (user_id, category) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if notifications should be sent (respects quiet hours and global toggles)
CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id uuid,
  p_category text,
  p_priority text,
  p_delivery_method text
)
RETURNS boolean AS $$
DECLARE
  v_global_enabled boolean;
  v_category_enabled boolean;
  v_priority_filter text;
  v_quiet_hours_enabled boolean;
  v_quiet_start time;
  v_quiet_end time;
  v_current_time time;
BEGIN
  -- Check global toggle based on delivery method
  IF p_delivery_method = 'push' THEN
    SELECT push_notifications_enabled INTO v_global_enabled
    FROM user_preferences WHERE user_id = p_user_id;
  ELSIF p_delivery_method = 'in_app' THEN
    SELECT in_app_notifications_enabled INTO v_global_enabled
    FROM user_preferences WHERE user_id = p_user_id;
  ELSIF p_delivery_method = 'email' THEN
    SELECT email_notifications_enabled INTO v_global_enabled
    FROM user_preferences WHERE user_id = p_user_id;
  END IF;

  IF NOT COALESCE(v_global_enabled, false) THEN
    RETURN false;
  END IF;

  -- Check category-specific preferences
  SELECT
    CASE
      WHEN p_delivery_method = 'push' THEN push_enabled
      WHEN p_delivery_method = 'in_app' THEN in_app_enabled
      WHEN p_delivery_method = 'email' THEN email_enabled
    END,
    priority_filter,
    quiet_hours_enabled,
    quiet_hours_start,
    quiet_hours_end
  INTO v_category_enabled, v_priority_filter, v_quiet_hours_enabled, v_quiet_start, v_quiet_end
  FROM notification_preferences
  WHERE user_id = p_user_id AND category = p_category;

  IF NOT COALESCE(v_category_enabled, true) THEN
    RETURN false;
  END IF;

  -- Check priority filter
  IF v_priority_filter = 'high_only' AND p_priority NOT IN ('high', 'critical') THEN
    RETURN false;
  END IF;

  IF v_priority_filter = 'critical_only' AND p_priority != 'critical' THEN
    RETURN false;
  END IF;

  -- Check quiet hours (skip for critical notifications)
  IF p_priority != 'critical' AND COALESCE(v_quiet_hours_enabled, false) THEN
    v_current_time := LOCALTIME;

    -- Handle quiet hours across midnight
    IF v_quiet_start < v_quiet_end THEN
      IF v_current_time >= v_quiet_start AND v_current_time < v_quiet_end THEN
        RETURN false;
      END IF;
    ELSE
      IF v_current_time >= v_quiet_start OR v_current_time < v_quiet_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old notification history (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notification_history()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_history
  WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate expired push subscriptions
CREATE OR REPLACE FUNCTION deactivate_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE push_subscriptions
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

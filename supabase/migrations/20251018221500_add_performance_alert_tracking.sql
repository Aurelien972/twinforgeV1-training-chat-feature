/*
  # Add Performance Alert Tracking

  1. Changes
    - Add `performance_alert_shown` column to `user_preferences` table
    - Track if user has been shown the performance recommendation alert
    - Allow null to support existing users (default false on insert)

  2. Security
    - No RLS changes needed (user_preferences already has proper RLS)
*/

-- Add performance_alert_shown column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences'
    AND column_name = 'performance_alert_shown'
  ) THEN
    ALTER TABLE user_preferences
    ADD COLUMN performance_alert_shown boolean DEFAULT false;
  END IF;
END $$;

-- Update existing rows to have performance_alert_shown = false
UPDATE user_preferences
SET performance_alert_shown = false
WHERE performance_alert_shown IS NULL;

/*
  # Add Performance Alert Tracking Column
  
  1. Changes
    - Add `performance_alert_shown` column to `user_preferences` table
    - Track if user has been shown the performance recommendation alert
    - Default to false for existing and new users
    
  2. Security
    - No RLS changes needed (user_preferences already has proper RLS)
*/

-- Add performance_alert_shown column
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS performance_alert_shown boolean DEFAULT false NOT NULL;

-- Update existing rows to have performance_alert_shown = false (already done by DEFAULT)
COMMENT ON COLUMN user_preferences.performance_alert_shown IS 'Tracks if user has been shown the performance recommendation alert';

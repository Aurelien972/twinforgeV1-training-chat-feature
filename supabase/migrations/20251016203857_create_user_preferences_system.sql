/*
  # User Preferences System - Performance & Theme Settings

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `performance_mode` (text) - 'auto' | 'optimized' | 'ultra'
      - `theme_mode` (text) - 'auto' | 'light' | 'dark'
      - `enable_animations` (boolean)
      - `enable_glassmorphism` (boolean)
      - `enable_3d_effects` (boolean)
      - `show_performance_notifications` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_preferences` table
    - Add policies for authenticated users to manage their own preferences

  3. Indexes
    - Index on user_id for fast lookups

  4. Triggers
    - Auto-update updated_at timestamp
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Performance settings
  performance_mode text NOT NULL DEFAULT 'auto' CHECK (performance_mode IN ('auto', 'optimized', 'ultra')),
  
  -- Theme settings
  theme_mode text NOT NULL DEFAULT 'auto' CHECK (theme_mode IN ('auto', 'light', 'dark')),
  
  -- Feature flags
  enable_animations boolean NOT NULL DEFAULT true,
  enable_glassmorphism boolean NOT NULL DEFAULT true,
  enable_3d_effects boolean NOT NULL DEFAULT true,
  
  -- Notification preferences
  show_performance_notifications boolean NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure one preference per user
  UNIQUE(user_id)
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Function to get or create user preferences with defaults
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id uuid)
RETURNS user_preferences AS $$
DECLARE
  v_preferences user_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_preferences
  FROM user_preferences
  WHERE user_id = p_user_id;
  
  -- If not found, create with defaults
  IF NOT FOUND THEN
    INSERT INTO user_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;
  
  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
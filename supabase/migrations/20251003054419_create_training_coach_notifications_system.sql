/*
  # Training Coach Notifications System

  1. New Tables
    - `training_coach_notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `session_id` (uuid, nullable - pour lier à une session d'entraînement)
      - `notification_id` (text, type de notification)
      - `notification_type` (text, type: motivation, instruction, tip, etc.)
      - `message` (text, contenu du message)
      - `priority` (text, priorité: low, medium, high, critical)
      - `context` (jsonb, contexte JSON avec détails exercice)
      - `was_displayed` (boolean, si affichée ou non)
      - `was_clicked` (boolean, si cliquée par l'utilisateur)
      - `display_duration_ms` (integer, durée d'affichage)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `training_coach_notifications` table
    - Add policies for authenticated users to:
      - Insert their own notifications
      - Read their own notifications
      - Update their own notifications (for tracking interactions)

  3. Indexes
    - Index on user_id for fast queries
    - Index on session_id for session-specific queries
    - Index on created_at for chronological queries
    - Index on notification_id for analytics
*/

-- Create training_coach_notifications table
CREATE TABLE IF NOT EXISTS training_coach_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid,
  notification_id text NOT NULL,
  notification_type text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  context jsonb DEFAULT '{}'::jsonb,
  was_displayed boolean DEFAULT false,
  was_clicked boolean DEFAULT false,
  display_duration_ms integer DEFAULT 3000,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE training_coach_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can insert own notifications"
  ON training_coach_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own notifications"
  ON training_coach_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON training_coach_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_coach_notifications_user_id 
  ON training_coach_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_training_coach_notifications_session_id 
  ON training_coach_notifications(session_id);

CREATE INDEX IF NOT EXISTS idx_training_coach_notifications_created_at 
  ON training_coach_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_coach_notifications_notification_id 
  ON training_coach_notifications(notification_id);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_training_coach_notifications_user_session 
  ON training_coach_notifications(user_id, session_id, created_at DESC);

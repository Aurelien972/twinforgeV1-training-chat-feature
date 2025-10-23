/*
  # Voice Coach System

  1. New Tables
    - `voice_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `mode` (text) - training, nutrition, fasting, general, body-scan
      - `started_at` (timestamptz)
      - `ended_at` (timestamptz, nullable)
      - `duration_seconds` (integer, nullable)
      - `message_count` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `voice_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references voice_conversations)
      - `user_id` (uuid, references auth.users)
      - `role` (text) - user, coach, system
      - `content` (text) - transcription du message
      - `audio_url` (text, nullable) - URL de l'enregistrement audio (si stocké)
      - `duration_ms` (integer, nullable)
      - `emotion` (text, nullable) - émotion détectée
      - `confidence` (numeric, nullable) - niveau de confiance de la transcription
      - `created_at` (timestamptz)

    - `voice_preferences`
      - `user_id` (uuid, primary key, references auth.users)
      - `preferred_voice` (text, default 'alloy') - alloy, echo, fable, onyx, nova, shimmer
      - `voice_speed` (numeric, default 1.0)
      - `default_mode` (text, default 'auto') - auto, push-to-talk, continuous
      - `auto_transcription` (boolean, default true)
      - `voice_enabled` (boolean, default true)
      - `show_visualizations` (boolean, default true)
      - `reduce_animations` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `voice_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `conversation_id` (uuid, references voice_conversations, nullable)
      - `event_type` (text) - session_start, session_end, error, reconnect, mode_switch
      - `mode` (text, nullable)
      - `metadata` (jsonb, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - System can write analytics
*/

-- Create voice_conversations table
CREATE TABLE IF NOT EXISTS voice_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode text NOT NULL CHECK (mode IN ('training', 'nutrition', 'fasting', 'general', 'body-scan')),
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  duration_seconds integer,
  message_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create voice_messages table
CREATE TABLE IF NOT EXISTS voice_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES voice_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'coach', 'system')),
  content text NOT NULL,
  audio_url text,
  duration_ms integer,
  emotion text,
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create voice_preferences table
CREATE TABLE IF NOT EXISTS voice_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_voice text DEFAULT 'alloy' CHECK (preferred_voice IN ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')),
  voice_speed numeric DEFAULT 1.0 CHECK (voice_speed >= 0.5 AND voice_speed <= 2.0),
  default_mode text DEFAULT 'auto' CHECK (default_mode IN ('auto', 'push-to-talk', 'continuous')),
  auto_transcription boolean DEFAULT true,
  voice_enabled boolean DEFAULT true,
  show_visualizations boolean DEFAULT true,
  reduce_animations boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create voice_analytics table
CREATE TABLE IF NOT EXISTS voice_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES voice_conversations(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('session_start', 'session_end', 'error', 'reconnect', 'mode_switch', 'permission_denied', 'fallback_activated')),
  mode text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_conversations_user_id ON voice_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_mode ON voice_conversations(mode);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_started_at ON voice_conversations(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_messages_conversation_id ON voice_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_voice_messages_user_id ON voice_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_messages_created_at ON voice_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_analytics_user_id ON voice_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_analytics_event_type ON voice_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_voice_analytics_created_at ON voice_analytics(created_at DESC);

-- Enable Row Level Security
ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_conversations
CREATE POLICY "Users can view own conversations"
  ON voice_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON voice_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON voice_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON voice_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for voice_messages
CREATE POLICY "Users can view own messages"
  ON voice_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages"
  ON voice_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON voice_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for voice_preferences
CREATE POLICY "Users can view own preferences"
  ON voice_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON voice_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON voice_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for voice_analytics
CREATE POLICY "Users can view own analytics"
  ON voice_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics"
  ON voice_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE voice_conversations
  SET
    message_count = message_count + 1,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update message count
DROP TRIGGER IF EXISTS trigger_update_conversation_message_count ON voice_messages;
CREATE TRIGGER trigger_update_conversation_message_count
  AFTER INSERT ON voice_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_message_count();

-- Function to auto-create voice preferences for new users
CREATE OR REPLACE FUNCTION create_default_voice_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO voice_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences on user creation
DROP TRIGGER IF EXISTS trigger_create_default_voice_preferences ON auth.users;
CREATE TRIGGER trigger_create_default_voice_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_voice_preferences();

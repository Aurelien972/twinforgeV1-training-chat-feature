/*
  # Système de Chat Contextuel Global

  ## Description
  Ce système permet de gérer un chat intelligent et contextuel qui s'adapte automatiquement à la page/fonctionnalité active de l'utilisateur.

  ## 1. Nouvelles Tables

  ### `chat_modes`
  Configuration des différents modes de chat disponibles
  - `id` (uuid, primary key)
  - `name` (text) - Nom du mode (training, dashboard, nutrition, fasting, general, etc.)
  - `display_name` (text) - Nom affiché à l'utilisateur
  - `system_prompt` (text) - Prompt système pour ce mode
  - `capabilities` (jsonb) - Capacités spécifiques (voice, suggestions, etc.)
  - `color` (text) - Couleur associée au mode
  - `icon` (text) - Nom de l'icône
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `chat_conversations`
  Conversations de chat avec contexte
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `mode_id` (uuid, foreign key to chat_modes)
  - `context_data` (jsonb) - Données contextuelles (session_id, prescription, etc.)
  - `is_active` (boolean) - Conversation en cours
  - `started_at` (timestamptz)
  - `ended_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `chat_messages`
  Messages échangés dans les conversations
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, foreign key to chat_conversations)
  - `role` (text) - coach, user, system
  - `type` (text) - text, audio, feedback, system
  - `content` (text) - Contenu du message
  - `metadata` (jsonb) - Métadonnées (exerciseId, feedbackType, etc.)
  - `audio_url` (text, nullable) - URL audio si applicable
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Users can only access their own conversations and messages
  - chat_modes table is readable by all authenticated users
  - Only authenticated users can create conversations and messages

  ## 3. Indexes
  - Index on user_id for fast conversation lookup
  - Index on conversation_id for fast message retrieval
  - Index on is_active for active conversation queries
  - Index on mode_id for mode-based filtering
*/

-- Create chat_modes table
CREATE TABLE IF NOT EXISTS chat_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  system_prompt text NOT NULL,
  capabilities jsonb DEFAULT '{}'::jsonb,
  color text DEFAULT '#18E3FF',
  icon text DEFAULT 'MessageSquare',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode_id uuid REFERENCES chat_modes(id) ON DELETE SET NULL,
  context_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('coach', 'user', 'system')),
  type text NOT NULL CHECK (type IN ('text', 'audio', 'feedback', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  audio_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_modes (readable by all authenticated users)
CREATE POLICY "Authenticated users can read chat modes"
  ON chat_modes FOR SELECT
  TO authenticated
  USING (true);

-- Policies for chat_conversations
CREATE POLICY "Users can view own conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON chat_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for chat_messages
CREATE POLICY "Users can view messages in own conversations"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_is_active ON chat_conversations(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_mode_id ON chat_conversations(mode_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Insert default chat modes
INSERT INTO chat_modes (name, display_name, system_prompt, capabilities, color, icon) VALUES
  (
    'training',
    'Coach Training',
    'Tu es un coach sportif expert et motivant. Tu accompagnes l''utilisateur pendant sa séance de training. Tu donnes des conseils techniques, tu motives, tu adaptes les exercices selon les retours. Reste concis et énergique.',
    '{"voice": true, "suggestions": true, "exerciseFeedback": true}'::jsonb,
    '#FF6B35',
    'Dumbbell'
  ),
  (
    'nutrition',
    'Coach Nutrition',
    'Tu es un nutritionniste expert. Tu aides l''utilisateur à analyser ses repas, à comprendre ses macros, et à faire de meilleurs choix alimentaires. Reste bienveillant et pédagogue.',
    '{"voice": true, "suggestions": true, "mealAnalysis": true}'::jsonb,
    '#10B981',
    'Utensils'
  ),
  (
    'fasting',
    'Coach Jeûne',
    'Tu es un expert du jeûne intermittent. Tu accompagnes l''utilisateur dans sa session de jeûne, tu le motives, tu lui donnes des conseils pour gérer la faim et optimiser les bénéfices. Reste encourageant.',
    '{"voice": true, "suggestions": true, "fastingTips": true}'::jsonb,
    '#F59E0B',
    'Timer'
  ),
  (
    'general',
    'Assistant Général',
    'Tu es l''assistant personnel de TwinForge. Tu aides l''utilisateur à naviguer dans l''application, à comprendre les fonctionnalités, et à atteindre ses objectifs de wellness. Reste amical et serviable.',
    '{"voice": true, "suggestions": true, "navigation": true}'::jsonb,
    '#18E3FF',
    'MessageSquare'
  )
ON CONFLICT (name) DO NOTHING;
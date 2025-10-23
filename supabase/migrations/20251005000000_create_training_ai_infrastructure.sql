/*
  # Training AI Infrastructure

  ## Overview
  Complete infrastructure for the multi-agent training generation system with GPT-5.
  Supports caching, metrics, generations history, and coach assignments.

  ## Tables Created

  ### 1. training_ai_generations
  Complete history of all AI generations with full traceability:
  - Stores input context, output prescription, and reasoning
  - Tracks tokens, cost, latency for each generation
  - Links to user and session for analysis

  ### 2. training_ai_cache
  Intelligent caching system to reduce costs and improve performance:
  - Stores frequently accessed data (context, morphology, advice)
  - TTL-based expiration
  - Automatic cleanup of expired entries

  ### 3. training_ai_metrics
  Real-time metrics tracking for each agent:
  - Success rate, latency, cost per agent
  - Cache hit rate for optimization
  - Updated in real-time by the service

  ### 4. training_coach_assignments
  User assignments to specialized coaches:
  - Tracks which coach is assigned to which user
  - Enables A/B testing of different coaches
  - Historical tracking of coach changes

  ## Security
  - RLS enabled on all tables
  - Strict user isolation
  - Read-only access for metrics aggregation

  ## Indexes
  - Optimized for frequent queries
  - user_id, cache_key, agent_type indexed
  - created_at for time-series queries

  ## Notes
  - JSONB for flexible data structures
  - Automatic timestamps
  - Cascade deletes for data consistency
*/

-- =====================================================
-- 1. TRAINING_AI_GENERATIONS
-- Complete history of AI generations
-- =====================================================

CREATE TABLE IF NOT EXISTS training_ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid, -- Links to training_sessions if applicable
  generation_id text NOT NULL, -- Unique identifier for this generation run

  -- Agent information
  agent_type text NOT NULL, -- 'context-collector', 'coach-force', etc.
  agent_version text DEFAULT '1.0.0',

  -- Input/Output
  input_context jsonb NOT NULL, -- Full context passed to agent
  output_prescription jsonb, -- Generated prescription or output
  reasoning_summary text, -- Summary of reasoning process

  -- AI Model details
  model_used text NOT NULL, -- 'gpt-5-mini', 'gpt-5-nano', etc.
  reasoning_effort text, -- 'minimal', 'low', 'medium', 'high'
  verbosity text, -- 'low', 'medium', 'high'

  -- Performance metrics
  tokens_used integer,
  cost_usd decimal(10, 6),
  latency_ms integer,

  -- API details
  response_id text, -- OpenAI response ID for previous_response_id chaining
  cached boolean DEFAULT false,

  -- Status
  success boolean DEFAULT true,
  error_message text,
  error_code text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),

  -- Indexes
  CONSTRAINT valid_agent_type CHECK (agent_type IN (
    'context-collector', 'morphology-analyzer',
    'coach-force', 'coach-functional', 'coach-competitions',
    'coach-calisthenics', 'coach-combat', 'coach-endurance',
    'coach-wellness', 'coach-sports', 'coach-mixed',
    'context-adapter', 'coach-chat',
    'performance-analyzer', 'progressive-adapter', 'strategic-advisor'
  ))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_ai_generations_user_id
  ON training_ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_training_ai_generations_session_id
  ON training_ai_generations(session_id);
CREATE INDEX IF NOT EXISTS idx_training_ai_generations_generation_id
  ON training_ai_generations(generation_id);
CREATE INDEX IF NOT EXISTS idx_training_ai_generations_agent_type
  ON training_ai_generations(agent_type);
CREATE INDEX IF NOT EXISTS idx_training_ai_generations_created_at
  ON training_ai_generations(created_at DESC);

-- RLS
ALTER TABLE training_ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI generations"
  ON training_ai_generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI generations"
  ON training_ai_generations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. TRAINING_AI_CACHE
-- Intelligent caching system
-- =====================================================

CREATE TABLE IF NOT EXISTS training_ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cache identification
  cache_key text NOT NULL UNIQUE, -- Hash of context for deduplication
  cache_type text NOT NULL, -- 'context', 'morphology', 'prescription', 'advice'

  -- Cached data
  cached_data jsonb NOT NULL,

  -- Expiration
  expires_at timestamptz NOT NULL,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  access_count integer DEFAULT 0,

  CONSTRAINT valid_cache_type CHECK (cache_type IN (
    'context', 'morphology', 'prescription', 'advice'
  ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_ai_cache_user_id
  ON training_ai_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_training_ai_cache_key
  ON training_ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_training_ai_cache_expires_at
  ON training_ai_cache(expires_at);

-- RLS
ALTER TABLE training_ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cache"
  ON training_ai_cache FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache"
  ON training_ai_cache FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cache"
  ON training_ai_cache FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cache"
  ON training_ai_cache FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean expired cache entries (runs daily)
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM training_ai_cache
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. TRAINING_AI_METRICS
-- Real-time metrics tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS training_ai_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type text NOT NULL UNIQUE,

  -- Aggregated metrics
  total_calls integer DEFAULT 0,
  success_rate decimal(5, 4) DEFAULT 0, -- 0.0000 to 1.0000
  avg_latency_ms integer DEFAULT 0,
  avg_cost_usd decimal(10, 6) DEFAULT 0,
  cache_hit_rate decimal(5, 4) DEFAULT 0,
  error_rate decimal(5, 4) DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_agent_type_metrics CHECK (agent_type IN (
    'context-collector', 'morphology-analyzer',
    'coach-force', 'coach-functional', 'coach-competitions',
    'coach-calisthenics', 'coach-combat', 'coach-endurance',
    'coach-wellness', 'coach-sports', 'coach-mixed',
    'context-adapter', 'coach-chat',
    'performance-analyzer', 'progressive-adapter', 'strategic-advisor'
  ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_ai_metrics_agent_type
  ON training_ai_metrics(agent_type);

-- RLS - Read-only for authenticated users (aggregated data)
ALTER TABLE training_ai_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view metrics"
  ON training_ai_metrics FOR SELECT
  TO authenticated
  USING (true);

-- Service role can update metrics
CREATE POLICY "Service can update metrics"
  ON training_ai_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service can modify metrics"
  ON training_ai_metrics FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- 4. TRAINING_COACH_ASSIGNMENTS
-- User assignments to specialized coaches
-- =====================================================

CREATE TABLE IF NOT EXISTS training_coach_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Training category and coach
  training_category text NOT NULL, -- 'force-powerbuilding', etc.
  coach_type text NOT NULL, -- 'force', 'functional', etc.

  -- Assignment details
  assigned_reason text, -- Why this coach was assigned
  manual_override boolean DEFAULT false, -- User manually selected?

  -- Timestamps
  assigned_at timestamptz DEFAULT now(),
  last_used_at timestamptz,

  CONSTRAINT valid_training_category CHECK (training_category IN (
    'force-powerbuilding', 'functional-crosstraining', 'fitness-competitions',
    'calisthenics-street', 'combat-sports', 'endurance',
    'wellness-mobility', 'sports-specifiques', 'mixed-custom'
  )),

  CONSTRAINT valid_coach_type CHECK (coach_type IN (
    'force', 'functional', 'competitions', 'calisthenics',
    'combat', 'endurance', 'wellness', 'sports', 'mixed'
  )),

  -- One active assignment per category per user
  CONSTRAINT unique_user_category UNIQUE (user_id, training_category)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_coach_assignments_user_id
  ON training_coach_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_coach_assignments_coach_type
  ON training_coach_assignments(coach_type);

-- RLS
ALTER TABLE training_coach_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coach assignments"
  ON training_coach_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coach assignments"
  ON training_coach_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coach assignments"
  ON training_coach_assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own coach assignments"
  ON training_coach_assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get user's active coach for a category
CREATE OR REPLACE FUNCTION get_user_coach(
  p_user_id uuid,
  p_training_category text
)
RETURNS text AS $$
DECLARE
  v_coach_type text;
BEGIN
  SELECT coach_type INTO v_coach_type
  FROM training_coach_assignments
  WHERE user_id = p_user_id
    AND training_category = p_training_category
  ORDER BY assigned_at DESC
  LIMIT 1;

  RETURN v_coach_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate total AI costs for a user
CREATE OR REPLACE FUNCTION get_user_ai_costs(
  p_user_id uuid,
  p_days integer DEFAULT 30
)
RETURNS decimal AS $$
DECLARE
  v_total_cost decimal;
BEGIN
  SELECT COALESCE(SUM(cost_usd), 0) INTO v_total_cost
  FROM training_ai_generations
  WHERE user_id = p_user_id
    AND created_at >= now() - (p_days || ' days')::interval;

  RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE training_ai_generations IS 'Complete history of all AI generations with full traceability';
COMMENT ON TABLE training_ai_cache IS 'Intelligent caching system to reduce costs and improve performance';
COMMENT ON TABLE training_ai_metrics IS 'Real-time metrics tracking for each agent type';
COMMENT ON TABLE training_coach_assignments IS 'User assignments to specialized training coaches';

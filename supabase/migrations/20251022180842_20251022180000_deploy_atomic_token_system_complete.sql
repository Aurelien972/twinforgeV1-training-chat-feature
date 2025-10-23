/*
  # Déploiement Système Atomique de Tokens - Complet et Sécurisé
  
  ## Vue d'ensemble
  Migration CRITIQUE pour déployer le système atomique de consommation de tokens.
  Cette migration corrige le bug où les tokens ne se décomptent pas.
  
  ## Problème résolu
  - Aucune fonction de consommation n'existe en base de données
  - Les tokens ne se décomptent jamais (tous les users restent à 15K)
  - Pas de protection contre race conditions ou double consommation
  
  ## Tables créées
  
  1. **token_consumption_locks**
     - Verrous temporaires pour éviter double consommation
     - Détection de requêtes dupliquées (idempotence)
     - Auto-nettoyage après 60 secondes
  
  2. **token_anomalies**
     - Détection de comportements suspects
     - Patterns d'attaque identifiés
     - Système d'alerte pour investigation
  
  ## Fonctions créées
  
  1. **consume_tokens_atomic**
     - Consommation atomique et sécurisée
     - Protection contre race conditions
     - Idempotence garantie avec request_id
     - Rate limiting automatique
  
  2. **add_tokens**
     - Ajout de tokens (achat, reset, bonus)
     - Transaction atomique
  
  3. **cleanup_expired_locks**
     - Nettoyage automatique des verrous expirés
  
  4. **detect_high_frequency_requests**
     - Détection d'attaques haute fréquence
  
  ## Sécurité
  - Transactions ACID complètes
  - RLS sur toutes les tables
  - Logs d'anomalies automatiques
  - Protection anti-spam
*/

-- =====================================================
-- TABLE 1: token_consumption_locks
-- =====================================================

CREATE TABLE IF NOT EXISTS token_consumption_locks (
  request_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edge_function_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  token_amount INTEGER NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'duplicate')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '60 seconds'),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_token_locks_expires ON token_consumption_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_locks_user ON token_consumption_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_token_locks_status ON token_consumption_locks(status);
CREATE INDEX IF NOT EXISTS idx_token_locks_duplicate_detection
  ON token_consumption_locks(user_id, edge_function_name, operation_type, created_at)
  WHERE status = 'pending';

ALTER TABLE token_consumption_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to consumption locks"
  ON token_consumption_locks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TABLE 2: token_anomalies
-- =====================================================

CREATE TABLE IF NOT EXISTS token_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'high_frequency',
    'duplicate_request',
    'race_condition_attempt',
    'suspicious_pattern',
    'balance_mismatch',
    'failed_consumption'
  )),
  
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  edge_function_name TEXT,
  operation_type TEXT,
  description TEXT NOT NULL,
  
  request_count INTEGER,
  time_window_seconds INTEGER,
  attempted_tokens INTEGER,
  actual_balance INTEGER,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  action_taken TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_anomalies_user ON token_anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_token_anomalies_type ON token_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_token_anomalies_severity ON token_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_token_anomalies_unresolved
  ON token_anomalies(created_at DESC)
  WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_token_anomalies_critical
  ON token_anomalies(user_id, created_at DESC)
  WHERE severity = 'critical';

ALTER TABLE token_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to anomalies"
  ON token_anomalies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own anomalies"
  ON token_anomalies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- FONCTION: cleanup_expired_locks
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM token_consumption_locks
  WHERE expires_at < now()
    AND status IN ('pending', 'completed');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: detect_high_frequency_requests
-- =====================================================

CREATE OR REPLACE FUNCTION detect_high_frequency_requests(
  p_user_id UUID,
  p_edge_function_name TEXT,
  p_time_window_seconds INTEGER DEFAULT 5,
  p_threshold INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  v_request_count INTEGER;
  v_is_anomaly BOOLEAN;
BEGIN
  SELECT COUNT(*)
  INTO v_request_count
  FROM token_consumption_locks
  WHERE user_id = p_user_id
    AND edge_function_name = p_edge_function_name
    AND created_at > (now() - (p_time_window_seconds || ' seconds')::interval);
  
  v_is_anomaly := v_request_count >= p_threshold;
  
  IF v_is_anomaly THEN
    INSERT INTO token_anomalies (
      user_id,
      anomaly_type,
      severity,
      edge_function_name,
      description,
      request_count,
      time_window_seconds,
      action_taken
    ) VALUES (
      p_user_id,
      'high_frequency',
      CASE
        WHEN v_request_count >= 50 THEN 'critical'
        WHEN v_request_count >= 30 THEN 'high'
        WHEN v_request_count >= 20 THEN 'medium'
        ELSE 'low'
      END,
      p_edge_function_name,
      format('User made %s requests in %s seconds (threshold: %s)',
             v_request_count, p_time_window_seconds, p_threshold),
      v_request_count,
      p_time_window_seconds,
      'Request logged for review'
    );
  END IF;
  
  RETURN v_is_anomaly;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: consume_tokens_atomic
-- =====================================================

CREATE OR REPLACE FUNCTION consume_tokens_atomic(
  p_request_id UUID,
  p_user_id UUID,
  p_token_amount INTEGER,
  p_edge_function_name TEXT,
  p_operation_type TEXT,
  p_openai_model TEXT DEFAULT NULL,
  p_openai_input_tokens INTEGER DEFAULT NULL,
  p_openai_output_tokens INTEGER DEFAULT NULL,
  p_openai_cost_usd NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_subscription_tokens INTEGER;
  v_onetime_tokens INTEGER;
  v_bonus_tokens INTEGER;
  v_tokens_to_deduct INTEGER;
  v_existing_lock RECORD;
  v_is_high_frequency BOOLEAN;
  v_recent_similar_requests INTEGER;
BEGIN
  -- STEP 1: Vérifier si c'est un duplicate (idempotence)
  SELECT * INTO v_existing_lock
  FROM token_consumption_locks
  WHERE request_id = p_request_id;
  
  IF FOUND THEN
    IF v_existing_lock.status = 'completed' THEN
      RETURN jsonb_build_object(
        'success', true,
        'duplicate', true,
        'message', 'Request already processed',
        'request_id', p_request_id,
        'original_timestamp', v_existing_lock.completed_at
      );
    ELSIF v_existing_lock.status = 'pending' THEN
      INSERT INTO token_anomalies (
        user_id, anomaly_type, severity, edge_function_name, operation_type,
        description, metadata
      ) VALUES (
        p_user_id, 'duplicate_request', 'medium', p_edge_function_name, p_operation_type,
        'Duplicate request_id detected while previous request still pending',
        jsonb_build_object('request_id', p_request_id)
      );
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'duplicate_request_pending',
        'message', 'Duplicate request detected - original request still processing',
        'request_id', p_request_id
      );
    END IF;
  END IF;
  
  -- STEP 2: Détecter haute fréquence
  v_is_high_frequency := detect_high_frequency_requests(
    p_user_id,
    p_edge_function_name,
    5,
    10
  );
  
  IF v_is_high_frequency THEN
    SELECT COUNT(*)
    INTO v_recent_similar_requests
    FROM token_consumption_locks
    WHERE user_id = p_user_id
      AND edge_function_name = p_edge_function_name
      AND created_at > (now() - interval '5 seconds');
    
    IF v_recent_similar_requests >= 50 THEN
      INSERT INTO token_anomalies (
        user_id, anomaly_type, severity, edge_function_name,
        description, action_taken
      ) VALUES (
        p_user_id, 'race_condition_attempt', 'critical', p_edge_function_name,
        format('Blocked: %s requests in 5 seconds - potential attack', v_recent_similar_requests),
        'Request blocked'
      );
      
      RETURN jsonb_build_object(
        'success', false,
        'error', 'rate_limit_exceeded',
        'message', 'Too many requests - please wait a moment',
        'retry_after_seconds', 5
      );
    END IF;
  END IF;
  
  -- STEP 3: Créer le verrou
  INSERT INTO token_consumption_locks (
    request_id, user_id, edge_function_name, operation_type,
    token_amount, status, metadata
  ) VALUES (
    p_request_id, p_user_id, p_edge_function_name, p_operation_type,
    p_token_amount, 'pending', p_metadata
  );
  
  -- STEP 4: Vérifier le solde avec verrou
  SELECT
    available_tokens,
    subscription_tokens,
    onetime_tokens,
    bonus_tokens
  INTO
    v_current_balance,
    v_subscription_tokens,
    v_onetime_tokens,
    v_bonus_tokens
  FROM user_token_balance
  WHERE user_id = p_user_id
  FOR UPDATE NOWAIT;
  
  IF NOT FOUND THEN
    UPDATE token_consumption_locks
    SET status = 'failed', completed_at = now()
    WHERE request_id = p_request_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_token_balance_not_found',
      'message', 'Token balance not initialized for user'
    );
  END IF;
  
  IF v_current_balance < p_token_amount THEN
    UPDATE token_consumption_locks
    SET status = 'failed', completed_at = now(),
        metadata = metadata || jsonb_build_object(
          'failure_reason', 'insufficient_tokens',
          'available', v_current_balance,
          'required', p_token_amount
        )
    WHERE request_id = p_request_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_tokens',
      'message', 'Not enough tokens available',
      'available_tokens', v_current_balance,
      'required_tokens', p_token_amount,
      'request_id', p_request_id
    );
  END IF;
  
  -- STEP 5: Calculer nouveau solde
  v_new_balance := v_current_balance - p_token_amount;
  v_tokens_to_deduct := p_token_amount;
  
  IF v_subscription_tokens >= v_tokens_to_deduct THEN
    v_subscription_tokens := v_subscription_tokens - v_tokens_to_deduct;
  ELSIF v_subscription_tokens > 0 THEN
    v_tokens_to_deduct := v_tokens_to_deduct - v_subscription_tokens;
    v_subscription_tokens := 0;
    
    IF v_onetime_tokens >= v_tokens_to_deduct THEN
      v_onetime_tokens := v_onetime_tokens - v_tokens_to_deduct;
    ELSIF v_onetime_tokens > 0 THEN
      v_tokens_to_deduct := v_tokens_to_deduct - v_onetime_tokens;
      v_onetime_tokens := 0;
      v_bonus_tokens := v_bonus_tokens - v_tokens_to_deduct;
    ELSE
      v_bonus_tokens := v_bonus_tokens - v_tokens_to_deduct;
    END IF;
  ELSIF v_onetime_tokens >= v_tokens_to_deduct THEN
    v_onetime_tokens := v_onetime_tokens - v_tokens_to_deduct;
  ELSIF v_onetime_tokens > 0 THEN
    v_tokens_to_deduct := v_tokens_to_deduct - v_onetime_tokens;
    v_onetime_tokens := 0;
    v_bonus_tokens := v_bonus_tokens - v_tokens_to_deduct;
  ELSE
    v_bonus_tokens := v_bonus_tokens - v_tokens_to_deduct;
  END IF;
  
  -- STEP 6: Appliquer la mise à jour atomiquement
  UPDATE user_token_balance
  SET
    available_tokens = v_new_balance,
    subscription_tokens = v_subscription_tokens,
    onetime_tokens = v_onetime_tokens,
    bonus_tokens = v_bonus_tokens,
    tokens_consumed_this_month = tokens_consumed_this_month + p_token_amount,
    last_consumption = now()
  WHERE user_id = p_user_id;
  
  -- STEP 7: Enregistrer la transaction
  INSERT INTO token_transactions (
    user_id,
    transaction_type,
    token_amount,
    balance_after,
    edge_function_name,
    operation_type,
    openai_model_used,
    openai_tokens_input,
    openai_tokens_output,
    openai_cost_usd,
    metadata
  ) VALUES (
    p_user_id,
    'consumption',
    -p_token_amount,
    v_new_balance,
    p_edge_function_name,
    p_operation_type,
    p_openai_model,
    p_openai_input_tokens,
    p_openai_output_tokens,
    p_openai_cost_usd,
    p_metadata || jsonb_build_object('request_id', p_request_id)
  );
  
  -- STEP 8: Marquer le verrou comme complété
  UPDATE token_consumption_locks
  SET status = 'completed', completed_at = now()
  WHERE request_id = p_request_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tokens_consumed', p_token_amount,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance,
    'request_id', p_request_id,
    'breakdown', jsonb_build_object(
      'subscription_tokens', v_subscription_tokens,
      'onetime_tokens', v_onetime_tokens,
      'bonus_tokens', v_bonus_tokens
    )
  );
  
EXCEPTION
  WHEN lock_not_available THEN
    INSERT INTO token_anomalies (
      user_id, anomaly_type, severity, edge_function_name,
      description, action_taken
    ) VALUES (
      p_user_id, 'race_condition_attempt', 'high', p_edge_function_name,
      'Concurrent modification attempt detected - transaction blocked',
      'Transaction rolled back'
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'concurrent_modification',
      'message', 'Another operation is in progress - please retry',
      'retry_after_seconds', 1
    );
  
  WHEN OTHERS THEN
    UPDATE token_consumption_locks
    SET status = 'failed', completed_at = now(),
        metadata = metadata || jsonb_build_object('error', SQLERRM)
    WHERE request_id = p_request_id;
    
    INSERT INTO token_anomalies (
      user_id, anomaly_type, severity, edge_function_name,
      description, metadata
    ) VALUES (
      p_user_id, 'failed_consumption', 'high', p_edge_function_name,
      'Unexpected error during token consumption',
      jsonb_build_object('error', SQLERRM, 'request_id', p_request_id)
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'An unexpected error occurred',
      'request_id', p_request_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: add_tokens
-- =====================================================

CREATE OR REPLACE FUNCTION add_tokens(
  p_user_id UUID,
  p_token_amount INTEGER,
  p_transaction_type TEXT,
  p_token_category TEXT DEFAULT 'onetime',
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  IF p_transaction_type NOT IN ('purchase', 'monthly_reset', 'bonus', 'refund', 'adjustment') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_transaction_type',
      'message', 'Transaction type must be: purchase, monthly_reset, bonus, refund, or adjustment'
    );
  END IF;
  
  SELECT available_tokens INTO v_current_balance
  FROM user_token_balance
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_token_balance_not_found',
      'message', 'Token balance not initialized for user'
    );
  END IF;
  
  v_new_balance := v_current_balance + p_token_amount;
  
  IF p_token_category = 'subscription' THEN
    UPDATE user_token_balance
    SET
      available_tokens = v_new_balance,
      subscription_tokens = subscription_tokens + p_token_amount
    WHERE user_id = p_user_id;
  ELSIF p_token_category = 'onetime' THEN
    UPDATE user_token_balance
    SET
      available_tokens = v_new_balance,
      onetime_tokens = onetime_tokens + p_token_amount
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_token_balance
    SET
      available_tokens = v_new_balance,
      bonus_tokens = bonus_tokens + p_token_amount
    WHERE user_id = p_user_id;
  END IF;
  
  INSERT INTO token_transactions (
    user_id,
    transaction_type,
    token_amount,
    balance_after,
    stripe_payment_intent_id,
    metadata
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_token_amount,
    v_new_balance,
    p_stripe_payment_intent_id,
    p_metadata
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tokens_added', p_token_amount,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance,
    'token_category', p_token_category
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE token_consumption_locks IS 'Verrous anti-race-condition pour consommation atomique de tokens';
COMMENT ON TABLE token_anomalies IS 'Détection et logging des comportements suspects dans le système de tokens';
COMMENT ON FUNCTION consume_tokens_atomic IS 'Consommation atomique et sécurisée de tokens avec protection complète';
COMMENT ON FUNCTION add_tokens IS 'Ajout atomique de tokens (achat, reset, bonus)';
COMMENT ON FUNCTION detect_high_frequency_requests IS 'Détection de patterns haute fréquence (anti-spam)';
COMMENT ON FUNCTION cleanup_expired_locks IS 'Nettoyage automatique des verrous expirés';

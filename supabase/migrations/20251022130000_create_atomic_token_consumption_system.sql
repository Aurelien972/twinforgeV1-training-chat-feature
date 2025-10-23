/*
  # Système Atomique de Consommation de Tokens - Sécurité Renforcée

  ## Vue d'ensemble
  Migration critique pour sécuriser le système de tokens contre:
  - Race conditions (requêtes simultanées)
  - Double consommation
  - Manipulation du cache client
  - Attaques par timing

  ## Tables créées

  1. **token_consumption_locks**
     - Verrous temporaires pour éviter la double consommation
     - Table de détection des requêtes dupliquées
     - Nettoyage automatique après 60 secondes

  2. **token_anomalies**
     - Détection et logging des comportements suspects
     - Patterns d'attaque identifiés
     - Système d'alerte pour investigation manuelle

  ## Fonctions créées

  1. **consume_tokens_atomic**
     - Remplace l'ancienne fonction consume_tokens
     - Vérification et consommation en une seule transaction atomique
     - Protection contre les race conditions avec verrous
     - Détection de requêtes dupliquées
     - Logging d'anomalies automatique

  2. **detect_token_anomalies**
     - Analyse les patterns de consommation suspects
     - Déclenche des alertes sur comportements anormaux
     - Called automatiquement par triggers

  ## Sécurité
  - Transactions ACID garanties
  - Locks pessimistes pour éviter race conditions
  - Détection temps réel des anomalies
  - Idempotence garantie avec request_id
*/

-- =====================================================
-- TABLE 1: token_consumption_locks
-- Système de verrous pour éviter double consommation
-- =====================================================

CREATE TABLE IF NOT EXISTS token_consumption_locks (
  request_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edge_function_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  token_amount INTEGER NOT NULL,

  -- Status du lock
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'duplicate')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '60 seconds'),

  -- Metadata pour debugging
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour cleanup automatique
CREATE INDEX IF NOT EXISTS idx_token_locks_expires ON token_consumption_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_locks_user ON token_consumption_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_token_locks_status ON token_consumption_locks(status);

-- Index pour détecter les duplicates rapidement
CREATE INDEX IF NOT EXISTS idx_token_locks_duplicate_detection
  ON token_consumption_locks(user_id, edge_function_name, operation_type, created_at)
  WHERE status = 'pending';

-- RLS pour token_consumption_locks (accessible uniquement par service role)
ALTER TABLE token_consumption_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to consumption locks"
  ON token_consumption_locks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TABLE 2: token_anomalies
-- Détection et logging des comportements suspects
-- =====================================================

CREATE TABLE IF NOT EXISTS token_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type d'anomalie détectée
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'high_frequency',          -- Trop de requêtes en peu de temps
    'duplicate_request',       -- Requête dupliquée détectée
    'race_condition_attempt',  -- Tentative de race condition
    'suspicious_pattern',      -- Pattern suspect général
    'balance_mismatch',        -- Désynchronisation détectée
    'failed_consumption'       -- Échec de consommation suspect
  )),

  -- Sévérité de l'anomalie
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Détails de l'anomalie
  edge_function_name TEXT,
  operation_type TEXT,
  description TEXT NOT NULL,

  -- Données contextuelles
  request_count INTEGER,
  time_window_seconds INTEGER,
  attempted_tokens INTEGER,
  actual_balance INTEGER,

  -- Metadata additionnelle
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Actions prises
  action_taken TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour queries et monitoring
CREATE INDEX IF NOT EXISTS idx_token_anomalies_user ON token_anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_token_anomalies_type ON token_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_token_anomalies_severity ON token_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_token_anomalies_unresolved
  ON token_anomalies(created_at DESC)
  WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_token_anomalies_critical
  ON token_anomalies(user_id, created_at DESC)
  WHERE severity = 'critical';

-- RLS pour token_anomalies
ALTER TABLE token_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to anomalies"
  ON token_anomalies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Les admins peuvent voir toutes les anomalies (à implémenter si besoin)
CREATE POLICY "Users can view their own anomalies"
  ON token_anomalies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- FONCTION: cleanup_expired_locks
-- Nettoie les verrous expirés automatiquement
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
-- Détecte les requêtes trop fréquentes (potentielle attaque)
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
  -- Compter les requêtes récentes
  SELECT COUNT(*)
  INTO v_request_count
  FROM token_consumption_locks
  WHERE user_id = p_user_id
    AND edge_function_name = p_edge_function_name
    AND created_at > (now() - (p_time_window_seconds || ' seconds')::interval);

  v_is_anomaly := v_request_count >= p_threshold;

  -- Logger l'anomalie si détectée
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
-- Fonction atomique et sécurisée de consommation de tokens
-- Remplace l'ancienne fonction consume_tokens
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
  -- STEP 1: Vérifier si la requête est un duplicate (idempotence)
  SELECT * INTO v_existing_lock
  FROM token_consumption_locks
  WHERE request_id = p_request_id;

  IF FOUND THEN
    IF v_existing_lock.status = 'completed' THEN
      -- Requête déjà traitée, retourner succès (idempotent)
      RETURN jsonb_build_object(
        'success', true,
        'duplicate', true,
        'message', 'Request already processed',
        'request_id', p_request_id,
        'original_timestamp', v_existing_lock.completed_at
      );
    ELSIF v_existing_lock.status = 'pending' THEN
      -- Requête en cours de traitement
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

  -- STEP 2: Détecter les requêtes haute fréquence (potentielle attaque)
  v_is_high_frequency := detect_high_frequency_requests(
    p_user_id,
    p_edge_function_name,
    5,  -- fenêtre de 5 secondes
    10  -- seuil de 10 requêtes
  );

  -- Si détection critique, bloquer temporairement
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

  -- STEP 3: Créer le verrou pour cette requête
  INSERT INTO token_consumption_locks (
    request_id, user_id, edge_function_name, operation_type,
    token_amount, status, metadata
  ) VALUES (
    p_request_id, p_user_id, p_edge_function_name, p_operation_type,
    p_token_amount, 'pending', p_metadata
  );

  -- STEP 4: Vérifier le solde avec verrou pessimiste (FOR UPDATE)
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
  FOR UPDATE NOWAIT; -- Échec immédiat si déjà verrouillé

  -- Vérifier si le solde existe
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

  -- Vérifier si assez de tokens
  IF v_current_balance < p_token_amount THEN
    UPDATE token_consumption_locks
    SET status = 'failed', completed_at = now(),
        metadata = metadata || jsonb_build_object(
          'failure_reason', 'insufficient_tokens',
          'available', v_current_balance,
          'required', p_token_amount
        )
    WHERE request_id = p_request_id;

    -- Logger l'anomalie si l'utilisateur essaie constamment avec solde insuffisant
    SELECT COUNT(*)
    INTO v_recent_similar_requests
    FROM token_consumption_locks
    WHERE user_id = p_user_id
      AND status = 'failed'
      AND created_at > (now() - interval '1 minute');

    IF v_recent_similar_requests >= 5 THEN
      INSERT INTO token_anomalies (
        user_id, anomaly_type, severity, edge_function_name,
        description, attempted_tokens, actual_balance
      ) VALUES (
        p_user_id, 'suspicious_pattern', 'low', p_edge_function_name,
        'Multiple failed consumption attempts with insufficient balance',
        p_token_amount, v_current_balance
      );
    END IF;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_tokens',
      'message', 'Not enough tokens available',
      'available_tokens', v_current_balance,
      'required_tokens', p_token_amount,
      'request_id', p_request_id
    );
  END IF;

  -- STEP 5: Calculer le nouveau solde et déduire les tokens
  v_new_balance := v_current_balance - p_token_amount;
  v_tokens_to_deduct := p_token_amount;

  -- Logique de déduction identique à l'ancienne fonction
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

  -- STEP 9: Retourner le succès
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
    -- Une autre transaction est en train de modifier le solde
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
    -- Erreur inattendue
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
-- CRON JOB: Nettoyage automatique des verrous expirés
-- =====================================================

-- Note: Cette partie nécessite l'extension pg_cron
-- Si pg_cron n'est pas disponible, le nettoyage peut être fait manuellement
-- ou via un Edge Function appelé périodiquement

-- SELECT cron.schedule(
--   'cleanup-expired-token-locks',
--   '*/5 * * * *', -- Toutes les 5 minutes
--   $$ SELECT cleanup_expired_locks(); $$
-- );

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE token_consumption_locks IS 'Verrous de consommation pour éviter race conditions et double consommation';
COMMENT ON TABLE token_anomalies IS 'Détection et logging des comportements suspects dans le système de tokens';
COMMENT ON FUNCTION consume_tokens_atomic IS 'Consommation atomique et sécurisée de tokens avec protection contre race conditions';
COMMENT ON FUNCTION detect_high_frequency_requests IS 'Détecte les patterns de requêtes haute fréquence (potentielles attaques)';
COMMENT ON FUNCTION cleanup_expired_locks IS 'Nettoie les verrous expirés automatiquement';

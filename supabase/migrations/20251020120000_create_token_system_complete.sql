/*
  # Système de Paiement et Tokens - TwinForgeFit

  ## Vue d'ensemble
  Système complet de gestion des abonnements Stripe avec consommation de tokens
  pour toutes les fonctionnalités IA de l'application.

  ## Tables créées

  1. **token_pricing_config**
     - Configuration des prix et marges pour chaque modèle OpenAI
     - Plans d'abonnement mensuels avec allocation de tokens
     - Prix des packs one-time
     - Version du système pour invalidation de cache

  2. **user_subscriptions**
     - Gestion des abonnements Stripe par utilisateur
     - Lien avec Stripe (customer_id, subscription_id, price_id)
     - Plan actif et statut de l'abonnement
     - Dates de facturation et renouvellement
     - Allocation de tokens selon le plan

  3. **user_token_balance**
     - Solde de tokens en temps réel par utilisateur
     - Tokens disponibles (abonnement + one-time)
     - Historique des consommations mensuelles
     - Timestamps des derniers resets

  4. **token_transactions**
     - Journal complet de toutes les transactions de tokens
     - Type: consumption, purchase, monthly_reset, refund, bonus
     - Metadata détaillées (fonction, modèle, coût réel OpenAI)
     - Traçabilité complète pour audit

  5. **stripe_webhooks_log**
     - Log de tous les événements Stripe reçus
     - Pour debugging et réconciliation
     - Conservation de 90 jours

  ## Sécurité
  - RLS activé sur toutes les tables
  - Utilisateurs voient uniquement leurs propres données
  - Service role a accès complet pour Edge Functions
  - Logs Stripe accessibles uniquement par service role

  ## Index
  - Index optimisés pour les requêtes fréquentes
  - Index composites pour les rapports
  - Index sur les timestamps pour le partitionnement futur
*/

-- =====================================================
-- TABLE 1: token_pricing_config
-- Configuration centrale des prix et marges
-- =====================================================

CREATE TABLE IF NOT EXISTS token_pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_version TEXT NOT NULL DEFAULT '1.0',

  -- Configuration OpenAI Models Pricing (coût réel par 1K tokens)
  openai_models_pricing JSONB NOT NULL DEFAULT '{
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-5-mini": {"input": 0.00025, "output": 0.002},
    "gpt-5-nano": {"input": 0.00005, "output": 0.0004},
    "dall-e-3-standard": {"per_image": 0.04},
    "dall-e-3-hd": {"per_image": 0.08},
    "whisper": {"per_minute": 0.006},
    "gpt-realtime-mini": {"per_minute": 0.06}
  }'::jsonb,

  -- Marges appliquées (multiplicateurs pour calculer tokens utilisateur)
  pricing_margins JSONB NOT NULL DEFAULT '{
    "vision_analysis": 6.0,
    "chat_completion": 5.0,
    "recipe_generation": 6.5,
    "image_generation": 5.0,
    "voice_realtime": 5.5,
    "audio_transcription": 5.0
  }'::jsonb,

  -- Plans d'abonnement mensuels (en tokens et EUR)
  subscription_plans JSONB NOT NULL DEFAULT '{
    "free": {"price_eur": 0, "tokens_monthly": 15000, "stripe_price_id": null, "trial": true},
    "starter_9": {"price_eur": 9, "tokens_monthly": 150000, "stripe_price_id": null},
    "pro_19": {"price_eur": 19, "tokens_monthly": 350000, "stripe_price_id": null},
    "premium_29": {"price_eur": 29, "tokens_monthly": 600000, "stripe_price_id": null},
    "elite_39": {"price_eur": 39, "tokens_monthly": 900000, "stripe_price_id": null},
    "expert_49": {"price_eur": 49, "tokens_monthly": 1200000, "stripe_price_id": null},
    "master_59": {"price_eur": 59, "tokens_monthly": 1600000, "stripe_price_id": null},
    "ultimate_99": {"price_eur": 99, "tokens_monthly": 3000000, "stripe_price_id": null}
  }'::jsonb,

  -- Packs one-time de tokens
  token_packs JSONB NOT NULL DEFAULT '{
    "pack_19": {"price_eur": 19, "tokens": 200000, "bonus_percent": 0},
    "pack_39": {"price_eur": 39, "tokens": 450000, "bonus_percent": 12.5},
    "pack_79": {"price_eur": 79, "tokens": 1000000, "bonus_percent": 26},
    "pack_149": {"price_eur": 149, "tokens": 2100000, "bonus_percent": 40}
  }'::jsonb,

  -- Coûts estimés par opération (en tokens utilisateur)
  operation_costs JSONB NOT NULL DEFAULT '{
    "meal_analysis": 2000,
    "recipe_generation_4recipes": 25000,
    "chat_message_avg": 500,
    "image_generation_dalle3": 8000,
    "voice_minute": 12000,
    "fridge_scan": 3000,
    "body_scan_analysis": 4000
  }'::jsonb,

  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Index pour configuration active
CREATE INDEX IF NOT EXISTS idx_token_pricing_active
  ON token_pricing_config(is_active, config_version)
  WHERE is_active = true;

-- RLS pour token_pricing_config
ALTER TABLE token_pricing_config ENABLE ROW LEVEL SECURITY;

-- Policy: Service role a accès complet
CREATE POLICY "Service role has full access to pricing config"
  ON token_pricing_config FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users peuvent lire la config (pour affichage des plans)
CREATE POLICY "Authenticated users can read active pricing config"
  ON token_pricing_config FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insérer la configuration par défaut
INSERT INTO token_pricing_config (
  config_version,
  notes,
  is_active
) VALUES (
  '1.0',
  'Configuration initiale du système de tokens - Marges optimisées pour rentabilité 75-90%',
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE 2: user_subscriptions
-- Gestion des abonnements Stripe
-- =====================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe IDs
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Plan et statut
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN (
    'free', 'starter_9', 'pro_19', 'premium_29', 'elite_39',
    'expert_49', 'master_59', 'ultimate_99'
  )),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN (
    'active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'
  )),

  -- Allocation de tokens
  tokens_monthly_quota INTEGER NOT NULL DEFAULT 15000,

  -- Dates importantes
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index unique partiel: un utilisateur = un abonnement actif max
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_subscription_per_user
  ON user_subscriptions(user_id)
  WHERE subscription_status IN ('active', 'trialing');

-- Index pour lookups fréquents
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_renewal
  ON user_subscriptions(current_period_end)
  WHERE subscription_status = 'active';

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_subscriptions_timestamp_trigger ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_timestamp_trigger
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_timestamp();

-- RLS pour user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to subscriptions"
  ON user_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TABLE 3: user_token_balance
-- Solde de tokens en temps réel
-- =====================================================

CREATE TABLE IF NOT EXISTS user_token_balance (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Solde actuel
  available_tokens INTEGER NOT NULL DEFAULT 0 CHECK (available_tokens >= 0),

  -- Détail du solde
  subscription_tokens INTEGER NOT NULL DEFAULT 0 CHECK (subscription_tokens >= 0),
  onetime_tokens INTEGER NOT NULL DEFAULT 0 CHECK (onetime_tokens >= 0),
  bonus_tokens INTEGER NOT NULL DEFAULT 0 CHECK (bonus_tokens >= 0),

  -- Statistiques mensuelles
  tokens_consumed_this_month INTEGER NOT NULL DEFAULT 0,
  tokens_consumed_last_month INTEGER NOT NULL DEFAULT 0,

  -- Dates importantes
  last_monthly_reset TIMESTAMPTZ,
  last_consumption TIMESTAMPTZ,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Contrainte: available_tokens = subscription_tokens + onetime_tokens + bonus_tokens
  CONSTRAINT balance_consistency CHECK (
    available_tokens = (subscription_tokens + onetime_tokens + bonus_tokens)
  )
);

-- Index pour lookups
CREATE INDEX IF NOT EXISTS idx_user_token_balance_available ON user_token_balance(available_tokens);
CREATE INDEX IF NOT EXISTS idx_user_token_balance_last_reset ON user_token_balance(last_monthly_reset);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_token_balance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_token_balance_timestamp_trigger ON user_token_balance;
CREATE TRIGGER update_user_token_balance_timestamp_trigger
  BEFORE UPDATE ON user_token_balance
  FOR EACH ROW
  EXECUTE FUNCTION update_user_token_balance_timestamp();

-- RLS pour user_token_balance
ALTER TABLE user_token_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token balance"
  ON user_token_balance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token balance"
  ON user_token_balance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own token balance"
  ON user_token_balance FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to token balance"
  ON user_token_balance FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TABLE 4: token_transactions
-- Journal de toutes les transactions
-- =====================================================

CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type de transaction
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'consumption', 'purchase', 'monthly_reset', 'refund', 'bonus', 'adjustment'
  )),

  -- Montant (positif = crédit, négatif = débit)
  token_amount INTEGER NOT NULL,

  -- Solde après transaction
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),

  -- Détails de la consommation (si transaction_type = 'consumption')
  edge_function_name TEXT,
  operation_type TEXT,
  openai_model_used TEXT,
  openai_tokens_input INTEGER,
  openai_tokens_output INTEGER,
  openai_cost_usd NUMERIC(10, 6),

  -- Métadonnées additionnelles
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Lien avec Stripe (si achat)
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour queries fréquentes
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_type
  ON token_transactions(user_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created
  ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_created
  ON token_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_edge_function
  ON token_transactions(edge_function_name)
  WHERE transaction_type = 'consumption';

-- Index pour analytics
CREATE INDEX IF NOT EXISTS idx_token_transactions_monthly_stats
  ON token_transactions(user_id, created_at)
  WHERE transaction_type = 'consumption';

-- RLS pour token_transactions
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users cannot modify token transactions"
  ON token_transactions FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Service role has full access to token transactions"
  ON token_transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TABLE 5: stripe_webhooks_log
-- Log des événements Stripe
-- =====================================================

CREATE TABLE IF NOT EXISTS stripe_webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Données Stripe
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,

  -- Payload complet
  event_data JSONB NOT NULL,

  -- Statut du traitement
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'processed', 'failed', 'ignored'
  )),
  processing_error TEXT,
  processing_attempts INTEGER DEFAULT 0,

  -- User concerné (si identifiable)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  stripe_created_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Index pour queries et cleanup
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_id ON stripe_webhooks_log(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_type ON stripe_webhooks_log(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_status ON stripe_webhooks_log(processing_status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_user ON stripe_webhooks_log(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_received ON stripe_webhooks_log(received_at);

-- RLS pour stripe_webhooks_log (accessible uniquement par service role)
ALTER TABLE stripe_webhooks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to webhook logs"
  ON stripe_webhooks_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction: Créer un solde de tokens pour un nouvel utilisateur
CREATE OR REPLACE FUNCTION create_user_token_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer automatiquement un solde avec le plan FREE
  INSERT INTO user_token_balance (
    user_id,
    available_tokens,
    subscription_tokens,
    onetime_tokens,
    bonus_tokens,
    last_monthly_reset
  ) VALUES (
    NEW.id,
    15000, -- Essai gratuit
    15000,
    0,
    0,
    now()
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Créer automatiquement un abonnement FREE
  INSERT INTO user_subscriptions (
    user_id,
    plan_type,
    subscription_status,
    tokens_monthly_quota,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    'free',
    'trialing',
    15000,
    now(),
    now() + interval '365 days' -- Essai permanent (pas de renouvellement)
  ) ON CONFLICT DO NOTHING;

  -- Log la transaction d'attribution de l'essai gratuit
  INSERT INTO token_transactions (
    user_id,
    transaction_type,
    token_amount,
    balance_after,
    metadata
  ) VALUES (
    NEW.id,
    'bonus',
    15000,
    15000,
    '{"reason": "free_trial", "description": "Essai gratuit à l'\''inscription"}'::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Créer le solde lors de la création d'un utilisateur
DROP TRIGGER IF EXISTS on_user_created_token_balance ON auth.users;
CREATE TRIGGER on_user_created_token_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_token_balance();

-- Fonction: Consommer des tokens (appelée par Edge Functions)
CREATE OR REPLACE FUNCTION consume_tokens(
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
BEGIN
  -- Vérifier le solde actuel
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
  FOR UPDATE; -- Lock pour éviter les race conditions

  -- Vérifier si assez de tokens
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_token_balance_not_found',
      'message', 'Token balance not initialized for user'
    );
  END IF;

  IF v_current_balance < p_token_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_tokens',
      'message', 'Not enough tokens available',
      'available_tokens', v_current_balance,
      'required_tokens', p_token_amount
    );
  END IF;

  -- Calculer le nouveau solde
  v_new_balance := v_current_balance - p_token_amount;
  v_tokens_to_deduct := p_token_amount;

  -- Déduire d'abord des tokens d'abonnement, puis one-time, puis bonus
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

  -- Mettre à jour le solde
  UPDATE user_token_balance
  SET
    available_tokens = v_new_balance,
    subscription_tokens = v_subscription_tokens,
    onetime_tokens = v_onetime_tokens,
    bonus_tokens = v_bonus_tokens,
    tokens_consumed_this_month = tokens_consumed_this_month + p_token_amount,
    last_consumption = now()
  WHERE user_id = p_user_id;

  -- Enregistrer la transaction
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
    p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'tokens_consumed', p_token_amount,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance,
    'breakdown', jsonb_build_object(
      'subscription_tokens', v_subscription_tokens,
      'onetime_tokens', v_onetime_tokens,
      'bonus_tokens', v_bonus_tokens
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Ajouter des tokens (achat ou reset)
CREATE OR REPLACE FUNCTION add_tokens(
  p_user_id UUID,
  p_token_amount INTEGER,
  p_transaction_type TEXT,
  p_token_category TEXT DEFAULT 'onetime', -- 'subscription', 'onetime', 'bonus'
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Vérifier le type de transaction
  IF p_transaction_type NOT IN ('purchase', 'monthly_reset', 'bonus', 'refund', 'adjustment') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_transaction_type',
      'message', 'Transaction type must be: purchase, monthly_reset, bonus, refund, or adjustment'
    );
  END IF;

  -- Récupérer le solde actuel
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

  -- Mettre à jour le solde selon la catégorie
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
  ELSE -- bonus
    UPDATE user_token_balance
    SET
      available_tokens = v_new_balance,
      bonus_tokens = bonus_tokens + p_token_amount
    WHERE user_id = p_user_id;
  END IF;

  -- Enregistrer la transaction
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

COMMENT ON TABLE token_pricing_config IS 'Configuration centrale des prix, marges et plans du système de tokens';
COMMENT ON TABLE user_subscriptions IS 'Abonnements Stripe actifs par utilisateur';
COMMENT ON TABLE user_token_balance IS 'Solde de tokens en temps réel pour chaque utilisateur';
COMMENT ON TABLE token_transactions IS 'Journal complet de toutes les transactions de tokens';
COMMENT ON TABLE stripe_webhooks_log IS 'Log des événements Stripe pour debugging et réconciliation';

COMMENT ON FUNCTION consume_tokens IS 'Consomme des tokens et enregistre la transaction (appelée par Edge Functions)';
COMMENT ON FUNCTION add_tokens IS 'Ajoute des tokens (achat, reset mensuel, bonus)';
COMMENT ON FUNCTION create_user_token_balance IS 'Initialise le solde de tokens pour un nouvel utilisateur';

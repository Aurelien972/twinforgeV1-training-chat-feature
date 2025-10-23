# Documentation Technique - Système de Tokens TwinForge

## Vue d'ensemble du Système

Le système de tokens TwinForge est une architecture complète de monétisation et de gestion de consommation pour toutes les fonctionnalités IA de la plateforme. Il repose sur trois piliers fondamentaux :

1. **Consommation atomique sécurisée** : Transactions ACID avec protection contre les race conditions
2. **Intégration Stripe complète** : Abonnements mensuels + packs one-time
3. **Tracking analytics en temps réel** : Coûts OpenAI, marges, revenus

---

## Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND REACT                        │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ TokenService │    │ userStore    │                   │
│  └──────┬───────┘    └──────┬───────┘                   │
└─────────┼───────────────────┼───────────────────────────┘
          │                   │
          │ Fetch balance     │ Subscribe
          │                   │ to Realtime
          ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE LAYER                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ Tables:                                        │     │
│  │  - user_token_balance                          │     │
│  │  - token_transactions                          │     │
│  │  - user_subscriptions                          │     │
│  │  - token_pricing_config                        │     │
│  │  - token_consumption_locks (atomic)            │     │
│  │  - token_anomalies                             │     │
│  │  - ai_cost_analytics                           │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ RPC Functions:                                 │     │
│  │  - consume_tokens_atomic()                     │     │
│  │  - add_tokens()                                │     │
│  │  - cleanup_expired_locks()                     │     │
│  │  - detect_high_frequency_requests()            │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ Realtime Subscriptions:                        │     │
│  │  - user_token_balance updates                  │     │
│  │  - token_transactions inserts                  │     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ Call with auth
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              EDGE FUNCTIONS (Deno)                       │
│  ┌────────────────────────────────────────────────┐     │
│  │ _shared/tokenMiddleware.ts                     │     │
│  │  - checkTokenBalance()                         │     │
│  │  - consumeTokensAtomic()                       │     │
│  │  - createInsufficientTokensResponse()          │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ Agent Functions:                               │     │
│  │  - chat-ai                                     │     │
│  │  - meal-analyzer                               │     │
│  │  - activity-analyzer                           │     │
│  │  - recipe-generator                            │     │
│  │  - [tous les autres agents IA]                 │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ Stripe Functions:                              │     │
│  │  - create-checkout-session                     │     │
│  │  - create-portal-session                       │     │
│  │  - stripe-webhooks                             │     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ API calls
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  EXTERNAL APIS                           │
│  ┌──────────────┐     ┌──────────────┐                  │
│  │   OpenAI     │     │    Stripe    │                  │
│  │   GPT-5      │     │   Payments   │                  │
│  └──────────────┘     └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

---

## Schéma de Base de Données Complet

### 1. Table: `token_pricing_config`

Configuration centralisée des prix, marges et plans.

```sql
CREATE TABLE token_pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_version TEXT NOT NULL DEFAULT '1.0',

  -- Pricing OpenAI (coût réel par 1M tokens)
  openai_models_pricing JSONB NOT NULL DEFAULT '{
    "gpt-5": {"input": 1.25, "output": 10.00},
    "gpt-5-mini": {"input": 0.25, "output": 2.00},
    "gpt-5-nano": {"input": 0.05, "output": 0.40},
    "dall-e-3": {"standard": 0.04, "hd": 0.08},
    "whisper-1": {"per_minute": 0.006},
    "gpt-4o-realtime": {"input": 5.00, "output": 20.00, "audio": 100.00}
  }',

  -- Marges appliquées (5x = 80% marge)
  pricing_margins JSONB NOT NULL DEFAULT '{
    "vision_analysis": 6.0,
    "chat_completion": 5.0,
    "recipe_generation": 6.5,
    "image_generation": 5.0,
    "voice_realtime": 5.5
  }',

  -- Plans d'abonnement mensuels
  subscription_plans JSONB NOT NULL DEFAULT '{
    "free": {"price_eur": 0, "tokens_per_month": 15000, "stripe_price_id": null},
    "starter_9": {"price_eur": 9, "tokens_per_month": 150000, "stripe_price_id": "price_xxx"},
    "pro_19": {"price_eur": 19, "tokens_per_month": 350000, "stripe_price_id": "price_yyy"},
    "premium_29": {"price_eur": 29, "tokens_per_month": 600000, "stripe_price_id": "price_zzz"},
    "elite_39": {"price_eur": 39, "tokens_per_month": 900000, "stripe_price_id": "price_aaa"},
    "expert_49": {"price_eur": 49, "tokens_per_month": 1200000, "stripe_price_id": "price_bbb"},
    "master_59": {"price_eur": 59, "tokens_per_month": 1600000, "stripe_price_id": "price_ccc"},
    "ultimate_99": {"price_eur": 99, "tokens_per_month": 3000000, "stripe_price_id": "price_ddd"}
  }',

  -- Packs one-time
  token_packs JSONB NOT NULL DEFAULT '{
    "pack_19": {"price_eur": 19, "tokens": 200000, "bonus_percent": 0},
    "pack_39": {"price_eur": 39, "tokens": 450000, "bonus_percent": 12.5},
    "pack_79": {"price_eur": 79, "tokens": 1000000, "bonus_percent": 26},
    "pack_149": {"price_eur": 149, "tokens": 2100000, "bonus_percent": 40}
  }',

  -- Coûts estimés par opération (en tokens utilisateur)
  operation_costs JSONB NOT NULL DEFAULT '{
    "meal_analysis": 2000,
    "recipe_generation_4recipes": 25000,
    "chat_message_avg": 500,
    "image_generation": 8000,
    "voice_minute": 12000,
    "body_scan_analysis": 4000
  }',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_token_pricing_active ON token_pricing_config(is_active);

-- RLS
ALTER TABLE token_pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active pricing"
  ON token_pricing_config FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role full access"
  ON token_pricing_config FOR ALL
  TO service_role
  USING (true);
```

**Rationale** : Centraliser la configuration permet de modifier les prix sans déployer de code. Les plans sont référencés par clé (`starter_9`, `pro_19`, etc.) pour éviter les erreurs.

---

### 2. Table: `user_subscriptions`

Gestion des abonnements Stripe par utilisateur.

```sql
CREATE TABLE user_subscriptions (
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
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid'
  )),

  -- Allocation de tokens
  tokens_per_month INTEGER NOT NULL DEFAULT 15000,

  -- Dates Stripe
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE UNIQUE INDEX idx_unique_active_subscription
  ON user_subscriptions(user_id)
  WHERE status IN ('active', 'trialing');

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_renewal
  ON user_subscriptions(current_period_end)
  WHERE status = 'active';

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON user_subscriptions FOR ALL
  TO service_role
  USING (true);
```

**Rationale** : Un utilisateur ne peut avoir qu'un seul abonnement actif à la fois (contrainte `idx_unique_active_subscription`). Synchronisation bidirectionnelle avec Stripe via webhooks.

---

### 3. Table: `user_token_balance`

Solde de tokens en temps réel.

```sql
CREATE TABLE user_token_balance (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Solde total
  available_tokens INTEGER NOT NULL DEFAULT 0 CHECK (available_tokens >= 0),

  -- Détail du solde (transparence)
  subscription_tokens INTEGER NOT NULL DEFAULT 0,
  onetime_tokens INTEGER NOT NULL DEFAULT 0,
  bonus_tokens INTEGER NOT NULL DEFAULT 0,

  -- Statistiques mensuelles
  tokens_consumed_this_month INTEGER NOT NULL DEFAULT 0,
  tokens_consumed_last_month INTEGER NOT NULL DEFAULT 0,

  -- Dates
  last_monthly_reset TIMESTAMPTZ,
  last_consumption TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Contrainte de cohérence
  CONSTRAINT balance_consistency CHECK (
    available_tokens = (subscription_tokens + onetime_tokens + bonus_tokens)
  )
);

-- Index
CREATE INDEX idx_token_balance_available ON user_token_balance(available_tokens);
CREATE INDEX idx_token_balance_reset ON user_token_balance(last_monthly_reset);

-- RLS
ALTER TABLE user_token_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own balance"
  ON user_token_balance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON user_token_balance FOR ALL
  TO service_role
  USING (true);

-- Trigger updated_at
CREATE TRIGGER update_token_balance_timestamp
  BEFORE UPDATE ON user_token_balance
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
```

**Rationale** : Contrainte `balance_consistency` garantit l'intégrité du solde. Les tokens sont catégorisés (`subscription`, `onetime`, `bonus`) pour transparence utilisateur.

---

### 4. Table: `token_transactions`

Journal exhaustif de toutes les transactions de tokens.

```sql
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type de transaction
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'consume',          -- Consommation IA
    'add',              -- Ajout manuel/bonus
    'refund',           -- Remboursement
    'monthly_reset',    -- Reset mensuel abonnement
    'purchase'          -- Achat pack
  )),

  -- Montants
  token_amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Contexte de consommation (si applicable)
  edge_function_name TEXT,
  operation_type TEXT,
  openai_model_used TEXT,
  openai_tokens_input INTEGER,
  openai_tokens_output INTEGER,
  openai_cost_usd NUMERIC(10, 6),

  -- Metadata additionnelle
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour queries fréquentes
CREATE INDEX idx_token_tx_user ON token_transactions(user_id);
CREATE INDEX idx_token_tx_type ON token_transactions(transaction_type);
CREATE INDEX idx_token_tx_user_date ON token_transactions(user_id, created_at DESC);
CREATE INDEX idx_token_tx_function ON token_transactions(edge_function_name);

-- Index pour analytics
CREATE INDEX idx_token_tx_model ON token_transactions(openai_model_used);
CREATE INDEX idx_token_tx_operation ON token_transactions(operation_type);

-- RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON token_transactions FOR ALL
  TO service_role
  USING (true);
```

**Rationale** : Audit trail complet pour réconciliation comptable et debugging. Aucune suppression possible (insert-only table).

---

### 5. Table: `token_consumption_locks`

Système de verrous pour consommation atomique.

```sql
CREATE TABLE token_consumption_locks (
  request_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edge_function_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  token_amount INTEGER NOT NULL,

  -- Status du verrou
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'failed', 'duplicate'
  )),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '60 seconds'),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Index
CREATE INDEX idx_locks_expires ON token_consumption_locks(expires_at);
CREATE INDEX idx_locks_user ON token_consumption_locks(user_id);
CREATE INDEX idx_locks_duplicate_detection
  ON token_consumption_locks(user_id, edge_function_name, created_at)
  WHERE status = 'pending';

-- RLS (service role only)
ALTER TABLE token_consumption_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON token_consumption_locks FOR ALL
  TO service_role
  USING (true);
```

**Rationale** : Protection contre race conditions. Le `request_id` (UUID) sert de clé d'idempotence. Les verrous expirent après 60 secondes pour éviter les deadlocks.

---

### 6. Table: `token_anomalies`

Détection et logging des comportements suspects.

```sql
CREATE TABLE token_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type d'anomalie
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'high_frequency',
    'duplicate_request',
    'race_condition_attempt',
    'suspicious_pattern',
    'balance_mismatch',
    'failed_consumption'
  )),

  -- Sévérité
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN (
    'low', 'medium', 'high', 'critical'
  )),

  -- Détails
  edge_function_name TEXT,
  operation_type TEXT,
  description TEXT NOT NULL,
  request_count INTEGER,
  time_window_seconds INTEGER,
  attempted_tokens INTEGER,
  actual_balance INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Actions
  action_taken TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_anomalies_user ON token_anomalies(user_id);
CREATE INDEX idx_anomalies_type ON token_anomalies(anomaly_type);
CREATE INDEX idx_anomalies_severity ON token_anomalies(severity);
CREATE INDEX idx_anomalies_unresolved
  ON token_anomalies(created_at DESC)
  WHERE resolved = false;

-- RLS
ALTER TABLE token_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own anomalies"
  ON token_anomalies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON token_anomalies FOR ALL
  TO service_role
  USING (true);
```

**Rationale** : Détection proactive de tentatives d'abus (rate limiting, requêtes dupliquées, patterns suspects). Alertes automatiques pour investigation manuelle.

---

### 7. Table: `ai_cost_analytics`

Analytics avancées pour suivi des coûts et marges.

```sql
CREATE TABLE ai_cost_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Fonction et opération
  edge_function_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  openai_model TEXT,

  -- Coûts OpenAI réels
  openai_cost_usd NUMERIC(10, 6) NOT NULL,

  -- Tokens facturés utilisateur
  tokens_charged INTEGER NOT NULL,

  -- Calculs de marge
  margin_multiplier NUMERIC(4, 2) NOT NULL,
  margin_percentage NUMERIC(5, 2) NOT NULL,
  profit_usd NUMERIC(10, 6) NOT NULL,
  revenue_usd NUMERIC(10, 6) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour dashboards analytics
CREATE INDEX idx_cost_analytics_date ON ai_cost_analytics(created_at DESC);
CREATE INDEX idx_cost_analytics_function ON ai_cost_analytics(edge_function_name);
CREATE INDEX idx_cost_analytics_model ON ai_cost_analytics(openai_model);
CREATE INDEX idx_cost_analytics_user_date ON ai_cost_analytics(user_id, created_at DESC);

-- RLS
ALTER TABLE ai_cost_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON ai_cost_analytics FOR ALL
  TO service_role
  USING (true);
```

**Rationale** : Séparation des données analytics pour ne pas surcharger `token_transactions`. Permet dashboards business intelligence sans impacter la performance transactionnelle.

---

## Fonctions PostgreSQL Critiques

### Fonction: `consume_tokens_atomic`

Fonction atomique ACID pour consommation sécurisée.

```sql
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
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_existing_lock RECORD;
BEGIN
  -- STEP 1: Vérifier idempotence (duplicate request)
  SELECT * INTO v_existing_lock
  FROM token_consumption_locks
  WHERE request_id = p_request_id;

  IF FOUND THEN
    IF v_existing_lock.status = 'completed' THEN
      RETURN jsonb_build_object(
        'success', true,
        'duplicate', true,
        'message', 'Request already processed'
      );
    END IF;
  END IF;

  -- STEP 2: Créer le lock (atomic avec ON CONFLICT)
  INSERT INTO token_consumption_locks (
    request_id, user_id, edge_function_name,
    operation_type, token_amount, status
  ) VALUES (
    p_request_id, p_user_id, p_edge_function_name,
    p_operation_type, p_token_amount, 'pending'
  )
  ON CONFLICT (request_id) DO UPDATE
    SET status = 'duplicate'
  RETURNING status INTO v_existing_lock;

  IF v_existing_lock.status = 'duplicate' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'race_condition',
      'message', 'Concurrent request detected'
    );
  END IF;

  -- STEP 3: Lock pessimiste sur le solde (FOR UPDATE)
  SELECT available_tokens INTO v_current_balance
  FROM user_token_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- STEP 4: Vérifier solde suffisant
  IF v_current_balance < p_token_amount THEN
    UPDATE token_consumption_locks
    SET status = 'failed', completed_at = now()
    WHERE request_id = p_request_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_tokens',
      'available_tokens', v_current_balance,
      'required', p_token_amount
    );
  END IF;

  -- STEP 5: Déduire les tokens (transaction atomique)
  v_new_balance := v_current_balance - p_token_amount;

  UPDATE user_token_balance
  SET available_tokens = v_new_balance,
      subscription_tokens = GREATEST(0, subscription_tokens - p_token_amount),
      onetime_tokens = CASE
        WHEN subscription_tokens >= p_token_amount THEN onetime_tokens
        ELSE GREATEST(0, onetime_tokens - (p_token_amount - subscription_tokens))
      END,
      tokens_consumed_this_month = tokens_consumed_this_month + p_token_amount,
      last_consumption = now(),
      updated_at = now()
  WHERE user_id = p_user_id;

  -- STEP 6: Enregistrer la transaction
  INSERT INTO token_transactions (
    user_id, transaction_type, token_amount, balance_after,
    edge_function_name, operation_type, openai_model_used,
    openai_tokens_input, openai_tokens_output, openai_cost_usd,
    metadata
  ) VALUES (
    p_user_id, 'consume', p_token_amount, v_new_balance,
    p_edge_function_name, p_operation_type, p_openai_model,
    p_openai_input_tokens, p_openai_output_tokens, p_openai_cost_usd,
    p_metadata
  );

  -- STEP 7: Marquer le lock comme complété
  UPDATE token_consumption_locks
  SET status = 'completed', completed_at = now()
  WHERE request_id = p_request_id;

  -- STEP 8: Retourner succès
  RETURN jsonb_build_object(
    'success', true,
    'tokens_consumed', p_token_amount,
    'balance_after', v_new_balance,
    'request_id', p_request_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automatique par PostgreSQL
    RETURN jsonb_build_object(
      'success', false,
      'error', 'transaction_failed',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Garanties ACID** :
- **Atomicité** : Transaction complète ou rollback total
- **Consistance** : Contraintes CHECK et FOREIGN KEY respectées
- **Isolation** : `FOR UPDATE` lock pessimiste empêche race conditions
- **Durabilité** : Commit synchrone sur disque

---

### Fonction: `add_tokens`

Ajout de tokens (recharge, bonus, refund).

```sql
CREATE OR REPLACE FUNCTION add_tokens(
  p_user_id UUID,
  p_token_amount INTEGER,
  p_source TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock pessimiste
  SELECT available_tokens INTO v_current_balance
  FROM user_token_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Calcul nouveau solde
  v_new_balance := v_current_balance + p_token_amount;

  -- Mise à jour
  UPDATE user_token_balance
  SET available_tokens = v_new_balance,
      onetime_tokens = onetime_tokens + p_token_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Enregistrer transaction
  INSERT INTO token_transactions (
    user_id, transaction_type, token_amount, balance_after, metadata
  ) VALUES (
    p_user_id, 'add', p_token_amount, v_new_balance, p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'added', p_token_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Flux de Consommation Détaillé

### Flux Standard: Agent IA Consomme des Tokens

```
1. Frontend/User Action
   └─> Utilisateur déclenche action IA (chat, scan, analyse)

2. Edge Function Called
   └─> POST /functions/v1/chat-ai (exemple)
       Headers: Authorization (Bearer token)
       Body: { message, user_id, mode }

3. Token Pre-Check
   └─> checkTokenBalance(supabase, userId, estimatedTokens)
       ├─> SELECT available_tokens FROM user_token_balance
       ├─> SELECT status FROM user_subscriptions
       └─> RETURN { hasEnoughTokens, currentBalance, isSubscribed }

4. Insufficient Tokens? → Return 402
   └─> createInsufficientTokensResponse()
       └─> Frontend affiche modal upgrade

5. Proceed with AI Operation
   └─> Call OpenAI API (GPT-5-mini)
       ├─> Send prompt + context
       ├─> Receive response + usage data
       └─> Extract: inputTokens, outputTokens, model

6. Calculate Actual Cost
   └─> costUsd = (input/1M * $0.25) + (output/1M * $2.00)
       tokensToCharge = costUsd * 5.0 * 1000  // 5x margin

7. Atomic Token Consumption
   └─> consumeTokensAtomic(supabase, {
         userId, edgeFunctionName, operationType,
         openaiModel, openaiInputTokens, openaiOutputTokens,
         openaiCostUsd, metadata
       })
       ├─> Generate unique request_id (UUID)
       ├─> Call RPC consume_tokens_atomic(...)
       │   ├─> Check idempotence (duplicate request_id?)
       │   ├─> Create lock (INSERT token_consumption_locks)
       │   ├─> FOR UPDATE lock on user_token_balance
       │   ├─> Verify sufficient balance
       │   ├─> Deduct tokens atomically
       │   ├─> INSERT token_transactions
       │   └─> Mark lock completed
       └─> RETURN { success, remainingBalance, consumed }

8. Log Analytics (non-blocking)
   └─> INSERT ai_cost_analytics
       ├─> openai_cost_usd, tokens_charged
       ├─> margin_multiplier, profit_usd
       └─> For business dashboards

9. Return AI Response to Client
   └─> Response includes AI-generated content
       Frontend updates UI + balance widget

10. Realtime Balance Update (optional)
    └─> Supabase Realtime broadcast
        └─> Frontend auto-updates balance display
```

### Flux Stripe: Utilisateur Achète un Abonnement

```
1. User Clicks "Subscribe to Pro"
   └─> Frontend: TokenService.createCheckoutSession('subscription', 'pro_19')

2. Edge Function: create-checkout-session
   └─> POST /functions/v1/create-checkout-session
       ├─> Authenticate user (JWT)
       ├─> Fetch pricing from token_pricing_config
       ├─> Get/Create Stripe customer
       └─> Stripe.checkout.sessions.create({
             mode: 'subscription',
             line_items: [{ price: 'price_xxx', quantity: 1 }],
             success_url, cancel_url
           })

3. Redirect to Stripe Checkout
   └─> window.location.href = session.url

4. User Completes Payment
   └─> Stripe processes payment
       └─> Redirects to success_url

5. Stripe Webhook: checkout.session.completed
   └─> POST /functions/v1/stripe-webhooks
       ├─> Verify webhook signature (CRITICAL)
       ├─> Extract: customer_id, subscription_id, plan_type
       ├─> UPSERT user_subscriptions
       │   ├─> stripe_customer_id, stripe_subscription_id
       │   ├─> plan_type = 'pro_19'
       │   ├─> status = 'active'
       │   ├─> tokens_per_month = 350000
       │   └─> current_period_start, current_period_end
       └─> UPSERT user_token_balance
           ├─> available_tokens += 350000
           ├─> subscription_tokens = 350000
           └─> last_monthly_reset = now()

6. Stripe Webhook: invoice.payment_succeeded (monthly)
   └─> POST /functions/v1/stripe-webhooks
       ├─> Verify signature
       ├─> Extract subscription_id, billing_reason
       ├─> IF billing_reason = 'subscription_cycle':
       │   └─> RESET monthly tokens
       │       ├─> UPDATE user_token_balance
       │       │   ├─> subscription_tokens = 350000 (reset)
       │       │   ├─> available_tokens = 350000 + onetime_tokens + bonus
       │       │   ├─> tokens_consumed_last_month = tokens_consumed_this_month
       │       │   ├─> tokens_consumed_this_month = 0
       │       │   └─> last_monthly_reset = now()
       │       └─> INSERT token_transactions
       │           └─> transaction_type = 'monthly_reset'

7. Stripe Webhook: customer.subscription.deleted
   └─> POST /functions/v1/stripe-webhooks
       ├─> UPDATE user_subscriptions SET status = 'canceled'
       ├─> UPDATE user_token_balance
       │   └─> subscription_tokens = 0
       │   └─> available_tokens = onetime_tokens + bonus_tokens
       └─> User conserve ses tokens one-time

8. Frontend Polling/Realtime
   └─> Frontend détecte changement de balance
       └─> Refresh UI avec nouveau solde + plan actif
```

---

## Configuration Stripe

### Variables d'Environnement Requises

```bash
# .env (Frontend)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Edge Functions (Supabase Secrets)
STRIPE_SECRET_KEY=sk_live_xxx  # ou sk_test_xxx pour dev
STRIPE_WEBHOOK_SECRET=whsec_xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Stripe Products & Prices Setup

**Produit : "TwinForge Pro"**
- Type: Recurring
- Billing period: Monthly
- Prix: 19€/mois
- Price ID: `price_xxx` → Copier dans `token_pricing_config.subscription_plans.pro_19.stripe_price_id`

**Répéter pour** : starter_9, premium_29, elite_39, expert_49, master_59, ultimate_99

**Produit : "TwinForge Token Pack"**
- Type: One-time
- Variants: 19€, 39€, 79€, 149€
- Price IDs: `price_pack_19`, `price_pack_39`, etc.

### Webhooks Stripe Configuration

**Endpoint URL** : `https://xxx.supabase.co/functions/v1/stripe-webhooks`

**Events to Listen** :
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

**Signing Secret** : `whsec_xxx` → Stocker dans Supabase Secrets

---

## Mapping Opérations → Coûts

### Table de Référence

| Opération | Modèle OpenAI | Coût Moyen USD | Tokens Facturés | Marge |
|-----------|---------------|----------------|-----------------|-------|
| **Chat message court** | gpt-5-mini | $0.001 | 5 | 5x (80%) |
| **Chat message long** | gpt-5-mini | $0.003 | 15 | 5x (80%) |
| **Analyse repas (1 photo)** | gpt-5 Vision | $0.02 | 100 | 5x (80%) |
| **Analyse frigo (6 photos)** | gpt-5 Vision | $0.12 | 600 | 5x (80%) |
| **Génération 4 recettes** | gpt-5-mini | $0.005 | 25 | 5x (80%) |
| **Body scan complet** | gpt-5 Vision | $0.03 | 150 | 5x (80%) |
| **Analyse activité** | gpt-5-mini | $0.002 | 10 | 5x (80%) |
| **Insights biométriques** | gpt-5-mini | $0.012 | 60 | 5x (80%) |
| **Génération image DALL-E** | dall-e-3 | $0.04 | 200 | 5x (80%) |
| **Transcription 1min audio** | whisper-1 | $0.006 | 30 | 5x (80%) |
| **Coach vocal 1min** | gpt-realtime | $0.06 | 300 | 5.5x (82%) |

### Calcul de Conversion

```typescript
// Formule générale
const TOKEN_USD_RATE = 0.001; // 1 token = $0.001
const PROFIT_MARGIN = 5.0;     // Marge de 5x = 80% profit

function convertUsdToTokens(usdCost: number): number {
  const costWithMargin = usdCost * PROFIT_MARGIN;
  return Math.ceil(costWithMargin / TOKEN_USD_RATE);
}

// Exemple: Chat message coûte $0.002 OpenAI
// → $0.002 * 5 = $0.01 coût utilisateur
// → $0.01 / $0.001 = 10 tokens facturés
```

---

## Guide de Synchronisation avec Autre Projet

### Étape 1: Réplication des Tables Supabase

```sql
-- Exécuter dans l'ordre sur le nouveau projet

-- 1. Configuration des prix
\i 20251020120000_create_token_system_complete.sql

-- 2. Système atomique
\i 20251022130000_create_atomic_token_consumption_system.sql

-- 3. Analytics
\i 20251022120000_create_ai_cost_analytics.sql

-- 4. Realtime
\i 20251022190000_enable_realtime_token_balance_notifications.sql

-- Vérifier que toutes les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%token%'
ORDER BY table_name;
```

### Étape 2: Copier les Edge Functions

```bash
# Copier les fichiers essentiels
cp -r supabase/functions/_shared/tokenMiddleware.ts nouveau-projet/supabase/functions/_shared/
cp -r supabase/functions/create-checkout-session nouveau-projet/supabase/functions/
cp -r supabase/functions/create-portal-session nouveau-projet/supabase/functions/
cp -r supabase/functions/stripe-webhooks nouveau-projet/supabase/functions/

# Adapter les imports si nécessaire
```

### Étape 3: Configuration Stripe

```bash
# 1. Créer les produits sur Stripe Dashboard
# 2. Copier les Price IDs
# 3. Mettre à jour token_pricing_config

UPDATE token_pricing_config
SET subscription_plans = '{
  "starter_9": {"price_eur": 9, "tokens_per_month": 150000, "stripe_price_id": "price_NOUVEAU_ID"}
}'::jsonb
WHERE is_active = true;
```

### Étape 4: Frontend Integration

```typescript
// 1. Copier le service
cp src/system/services/tokenService.ts nouveau-projet/src/system/services/

// 2. Intégrer dans le store
import { TokenService } from './services/tokenService';

// 3. Ajouter au shell
<TokenBalanceWidget />

// 4. Subscribe to realtime
useEffect(() => {
  const unsubscribe = TokenService.subscribeToTokenBalance(userId, (balance) => {
    console.log('New balance:', balance);
  });
  return unsubscribe;
}, [userId]);
```

### Étape 5: Intégrer dans les Edge Functions

```typescript
// Dans chaque Edge Function qui consomme des tokens
import { checkTokenBalance, consumeTokensAtomic, createInsufficientTokensResponse } from '../_shared/tokenMiddleware.ts';

Deno.serve(async (req: Request) => {
  const { userId, ... } = await req.json();

  // PRE-CHECK
  const tokenCheck = await checkTokenBalance(supabase, userId, 50);
  if (!tokenCheck.hasEnoughTokens) {
    return createInsufficientTokensResponse(
      tokenCheck.currentBalance,
      50,
      !tokenCheck.isSubscribed,
      corsHeaders
    );
  }

  // Appeler OpenAI...
  const response = await fetch('https://api.openai.com/v1/chat/completions', {...});
  const data = await response.json();

  // POST-CONSUME
  await consumeTokensAtomic(supabase, {
    userId,
    edgeFunctionName: 'chat-ai',
    operationType: 'chat_completion',
    openaiModel: 'gpt-5-mini',
    openaiInputTokens: data.usage.prompt_tokens,
    openaiOutputTokens: data.usage.completion_tokens,
    openaiCostUsd: calculateCost(...),
    metadata: { conversation_id: '...' }
  });

  return new Response(JSON.stringify(data), { headers: corsHeaders });
});
```

---

## Monitoring & Alertes

### Requêtes SQL Utiles

```sql
-- Dashboard: Consommation totale aujourd'hui
SELECT
  COUNT(*) AS transactions_count,
  SUM(token_amount) AS total_consumed,
  SUM(openai_cost_usd) AS total_cost_usd,
  AVG(token_amount) AS avg_per_transaction
FROM token_transactions
WHERE transaction_type = 'consume'
  AND created_at >= CURRENT_DATE;

-- Dashboard: Top consommateurs
SELECT
  user_id,
  SUM(token_amount) AS total_consumed,
  COUNT(*) AS transactions_count
FROM token_transactions
WHERE transaction_type = 'consume'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id
ORDER BY total_consumed DESC
LIMIT 10;

-- Dashboard: Revenus par plan
SELECT
  plan_type,
  COUNT(*) AS subscribers,
  SUM(tokens_per_month) AS total_allocated_tokens
FROM user_subscriptions
WHERE status = 'active'
GROUP BY plan_type
ORDER BY subscribers DESC;

-- Alertes: Anomalies non résolues
SELECT *
FROM token_anomalies
WHERE resolved = false
  AND severity IN ('high', 'critical')
ORDER BY created_at DESC;

-- Analytics: Marge par modèle OpenAI
SELECT
  openai_model,
  COUNT(*) AS usage_count,
  SUM(openai_cost_usd) AS total_openai_cost,
  SUM(revenue_usd) AS total_revenue,
  SUM(profit_usd) AS total_profit,
  AVG(margin_percentage) AS avg_margin
FROM ai_cost_analytics
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY openai_model
ORDER BY total_revenue DESC;
```

### Cron Jobs Recommandés

```sql
-- Nettoyer les verrous expirés (toutes les 5 minutes)
SELECT cron.schedule(
  'cleanup-expired-locks',
  '*/5 * * * *',
  $$ SELECT cleanup_expired_locks(); $$
);

-- Reset mensuel des abonnements (1er de chaque mois à minuit)
SELECT cron.schedule(
  'monthly-token-reset',
  '0 0 1 * *',
  $$
    UPDATE user_token_balance b
    SET
      subscription_tokens = (
        SELECT tokens_per_month
        FROM user_subscriptions s
        WHERE s.user_id = b.user_id
          AND s.status = 'active'
        LIMIT 1
      ),
      available_tokens = subscription_tokens + onetime_tokens + bonus_tokens,
      tokens_consumed_last_month = tokens_consumed_this_month,
      tokens_consumed_this_month = 0,
      last_monthly_reset = NOW()
    WHERE EXISTS (
      SELECT 1 FROM user_subscriptions s
      WHERE s.user_id = b.user_id AND s.status = 'active'
    );
  $$
);
```

---

## Optimisations Possibles

### 1. Cache Intelligent

```typescript
// Éviter les appels répétés pour les mêmes prompts
const cacheKey = `ai-response:${hash(prompt)}`;
const cached = await redis.get(cacheKey);
if (cached) {
  // Pas de consommation de tokens pour cache hit
  return JSON.parse(cached);
}

// Sinon, appeler OpenAI et mettre en cache
const response = await openai.chat.completions.create({...});
await redis.set(cacheKey, JSON.stringify(response), { ex: 3600 });
await consumeTokensAtomic(...);
```

### 2. Modèles Légers

```typescript
// Utiliser gpt-5-nano pour tâches simples
const simpleOperations = ['classification', 'yes-no', 'sentiment'];
const model = simpleOperations.includes(operationType)
  ? 'gpt-5-nano'  // $0.05/1M input vs $0.25/1M
  : 'gpt-5-mini';
```

### 3. Batch Processing

```typescript
// Analyser plusieurs recettes en un seul appel
const recipes = ['Recipe 1...', 'Recipe 2...', 'Recipe 3...'];
const batchPrompt = recipes.map((r, i) => `Recipe ${i+1}:\n${r}`).join('\n\n');

// 1 appel au lieu de 3 → économie de tokens d'overhead
```

---

## Conclusion

Le système de tokens TwinForge est une architecture de production robuste avec :

1. **Sécurité garantie** : Transactions ACID, protection race conditions, détection anomalies
2. **Traçabilité complète** : Chaque jeton consommé est tracé avec métadonnées OpenAI
3. **Scalabilité** : Architecture asynchrone, caching possible, indexes optimisés
4. **Business Intelligence** : Analytics détaillées pour dashboards et optimisations

### Checklist de Synchronisation

- [ ] Tables Supabase créées (7 tables)
- [ ] Fonctions PostgreSQL déployées (consume_tokens_atomic, add_tokens)
- [ ] Edge Functions copiées (tokenMiddleware, stripe webhooks)
- [ ] Stripe configuré (products, prices, webhooks)
- [ ] Frontend intégré (TokenService, TokenBalanceWidget)
- [ ] Variables d'environnement configurées
- [ ] Cron jobs activés (cleanup locks, monthly reset)
- [ ] Monitoring dashboards créés
- [ ] Tests de charge effectués (race conditions, concurrence)

---

*Document créé le 2025-01-23 | Version 1.0*
*TwinForge Engineering Team - Token System Architecture*

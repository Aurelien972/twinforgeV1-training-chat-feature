/*
  # Stripe Product Management Functions

  ## Overview
  Fonctions utilitaires pour faciliter la gestion des produits Stripe et des Price IDs
  dans le système de tokens.

  ## Functions Added

  1. **update_stripe_price_id**
     - Met à jour le stripe_price_id pour un plan spécifique
     - Permet de mettre à jour facilement après la création des produits Stripe
     - Valide que le plan existe avant la mise à jour

  2. **get_active_pricing_config**
     - Récupère la configuration active des prix
     - Fonction helper pour les Edge Functions

  3. **get_plan_by_stripe_price_id**
     - Retrouve le plan correspondant à un Price ID Stripe
     - Utile pour les webhooks Stripe

  ## Security
  - Ces fonctions sont accessibles uniquement par authenticated users et service_role
  - RLS policies en place pour protéger les données

  ## Usage Examples

  ### Mettre à jour un Price ID après création dans Stripe
  ```sql
  SELECT update_stripe_price_id('starter_9', 'price_1ABC123...', 'prod_1ABC123...');
  ```

  ### Récupérer la config active
  ```sql
  SELECT * FROM get_active_pricing_config();
  ```

  ### Retrouver un plan par Price ID
  ```sql
  SELECT * FROM get_plan_by_stripe_price_id('price_1ABC123...');
  ```
*/

-- =====================================================
-- FUNCTION: update_stripe_price_id
-- Met à jour le stripe_price_id pour un plan
-- =====================================================

CREATE OR REPLACE FUNCTION update_stripe_price_id(
  p_plan_key TEXT,
  p_stripe_price_id TEXT,
  p_stripe_product_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_config_id UUID;
  v_current_plans JSONB;
  v_updated_plans JSONB;
BEGIN
  -- Récupérer la configuration active
  SELECT id, subscription_plans
  INTO v_config_id, v_current_plans
  FROM token_pricing_config
  WHERE is_active = true
  LIMIT 1;

  IF v_config_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_active_config',
      'message', 'No active pricing configuration found'
    );
  END IF;

  -- Vérifier que le plan existe
  IF NOT (v_current_plans ? p_plan_key) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_plan_key',
      'message', format('Plan key "%s" does not exist in configuration', p_plan_key),
      'available_plans', jsonb_object_keys(v_current_plans)
    );
  END IF;

  -- Mettre à jour le plan avec les IDs Stripe
  v_updated_plans := jsonb_set(
    v_current_plans,
    array[p_plan_key, 'stripe_price_id'],
    to_jsonb(p_stripe_price_id)
  );

  IF p_stripe_product_id IS NOT NULL THEN
    v_updated_plans := jsonb_set(
      v_updated_plans,
      array[p_plan_key, 'stripe_product_id'],
      to_jsonb(p_stripe_product_id)
    );
  END IF;

  -- Enregistrer les changements
  UPDATE token_pricing_config
  SET
    subscription_plans = v_updated_plans,
    updated_at = now()
  WHERE id = v_config_id;

  RETURN jsonb_build_object(
    'success', true,
    'plan_key', p_plan_key,
    'stripe_price_id', p_stripe_price_id,
    'stripe_product_id', p_stripe_product_id,
    'message', format('Successfully updated Stripe IDs for plan "%s"', p_plan_key)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_active_pricing_config
-- Récupère la configuration active des prix
-- =====================================================

CREATE OR REPLACE FUNCTION get_active_pricing_config()
RETURNS TABLE (
  id UUID,
  config_version TEXT,
  subscription_plans JSONB,
  token_packs JSONB,
  openai_models_pricing JSONB,
  pricing_margins JSONB,
  operation_costs JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tpc.id,
    tpc.config_version,
    tpc.subscription_plans,
    tpc.token_packs,
    tpc.openai_models_pricing,
    tpc.pricing_margins,
    tpc.operation_costs,
    tpc.created_at,
    tpc.updated_at
  FROM token_pricing_config tpc
  WHERE tpc.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_plan_by_stripe_price_id
-- Retrouve le plan correspondant à un Price ID Stripe
-- =====================================================

CREATE OR REPLACE FUNCTION get_plan_by_stripe_price_id(p_stripe_price_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_subscription_plans JSONB;
  v_plan_key TEXT;
  v_plan_data JSONB;
BEGIN
  -- Récupérer les plans
  SELECT subscription_plans
  INTO v_subscription_plans
  FROM token_pricing_config
  WHERE is_active = true
  LIMIT 1;

  IF v_subscription_plans IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_active_config',
      'message', 'No active pricing configuration found'
    );
  END IF;

  -- Parcourir les plans pour trouver le Price ID correspondant
  FOR v_plan_key, v_plan_data IN
    SELECT key, value
    FROM jsonb_each(v_subscription_plans)
  LOOP
    IF v_plan_data->>'stripe_price_id' = p_stripe_price_id THEN
      RETURN jsonb_build_object(
        'success', true,
        'plan_key', v_plan_key,
        'plan_data', v_plan_data,
        'price_eur', (v_plan_data->>'price_eur')::numeric,
        'tokens_per_month', COALESCE((v_plan_data->>'tokens_per_month')::integer, (v_plan_data->>'tokens_monthly')::integer)
      );
    END IF;
  END LOOP;

  -- Price ID non trouvé
  RETURN jsonb_build_object(
    'success', false,
    'error', 'price_id_not_found',
    'message', format('No plan found with stripe_price_id: %s', p_stripe_price_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: validate_stripe_configuration
-- Valide que tous les plans ont des Price IDs configurés
-- =====================================================

CREATE OR REPLACE FUNCTION validate_stripe_configuration()
RETURNS JSONB AS $$
DECLARE
  v_subscription_plans JSONB;
  v_plan_key TEXT;
  v_plan_data JSONB;
  v_missing_count INTEGER := 0;
  v_configured_count INTEGER := 0;
  v_missing_plans TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Récupérer les plans
  SELECT subscription_plans
  INTO v_subscription_plans
  FROM token_pricing_config
  WHERE is_active = true
  LIMIT 1;

  IF v_subscription_plans IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_active_config',
      'message', 'No active pricing configuration found'
    );
  END IF;

  -- Vérifier chaque plan (sauf free)
  FOR v_plan_key, v_plan_data IN
    SELECT key, value
    FROM jsonb_each(v_subscription_plans)
  LOOP
    -- Ignorer le plan gratuit
    IF v_plan_key = 'free' OR (v_plan_data->>'price_eur')::numeric = 0 THEN
      CONTINUE;
    END IF;

    IF v_plan_data->>'stripe_price_id' IS NULL OR v_plan_data->>'stripe_price_id' = '' THEN
      v_missing_count := v_missing_count + 1;
      v_missing_plans := array_append(v_missing_plans, v_plan_key);
    ELSE
      v_configured_count := v_configured_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', v_missing_count = 0,
    'configured_count', v_configured_count,
    'missing_count', v_missing_count,
    'missing_plans', to_jsonb(v_missing_plans),
    'message', CASE
      WHEN v_missing_count = 0 THEN 'All paid plans have Stripe Price IDs configured'
      ELSE format('%s plan(s) missing Stripe Price IDs', v_missing_count)
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION update_stripe_price_id IS 'Met à jour le stripe_price_id pour un plan spécifique dans la configuration';
COMMENT ON FUNCTION get_active_pricing_config IS 'Récupère la configuration active des prix et plans';
COMMENT ON FUNCTION get_plan_by_stripe_price_id IS 'Retrouve le plan correspondant à un Price ID Stripe (utile pour webhooks)';
COMMENT ON FUNCTION validate_stripe_configuration IS 'Valide que tous les plans payants ont des Price IDs Stripe configurés';

-- =====================================================
-- INITIAL VALIDATION
-- =====================================================

-- Afficher l'état de validation initial
DO $$
DECLARE
  v_validation_result JSONB;
BEGIN
  SELECT validate_stripe_configuration() INTO v_validation_result;

  RAISE NOTICE 'Stripe Configuration Status:';
  RAISE NOTICE '  Configured plans: %', v_validation_result->>'configured_count';
  RAISE NOTICE '  Missing Price IDs: %', v_validation_result->>'missing_count';

  IF (v_validation_result->>'missing_count')::integer > 0 THEN
    RAISE NOTICE '  Plans missing Price IDs: %', v_validation_result->'missing_plans';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ACTION REQUIRED: Run the create-stripe-products.js script to generate Stripe products';
    RAISE NOTICE '   Command: node scripts/create-stripe-products.js --mode=test';
  ELSE
    RAISE NOTICE '✅ All paid plans have Stripe Price IDs configured';
  END IF;
END $$;

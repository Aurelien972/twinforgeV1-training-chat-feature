/*
  # Standardisation de la nomenclature tokens_monthly vers tokens_per_month

  1. Modifications
    - Met à jour la structure JSON dans token_pricing_config pour remplacer tokens_monthly par tokens_per_month
    - Garantit la cohérence entre la base de données et le code frontend
    - Conserve tous les stripe_price_id existants

  2. Impact
    - Résout l'affichage "0 tokens/mois" dans l'interface utilisateur
    - Permet la souscription aux plans d'abonnement
    - Maintient la compatibilité avec le code existant
*/

-- Mise à jour de la configuration des prix par défaut avec la nouvelle nomenclature
UPDATE token_pricing_config
SET subscription_plans = jsonb_build_object(
  'free', jsonb_build_object(
    'price_eur', 0,
    'tokens_per_month', 15000,
    'stripe_price_id', NULL,
    'trial', true
  ),
  'starter_9', jsonb_build_object(
    'price_eur', 9,
    'tokens_per_month', 150000,
    'stripe_price_id', COALESCE((subscription_plans->'starter_9'->>'stripe_price_id')::text, NULL)
  ),
  'pro_19', jsonb_build_object(
    'price_eur', 19,
    'tokens_per_month', 350000,
    'stripe_price_id', COALESCE((subscription_plans->'pro_19'->>'stripe_price_id')::text, NULL)
  ),
  'premium_29', jsonb_build_object(
    'price_eur', 29,
    'tokens_per_month', 600000,
    'stripe_price_id', COALESCE((subscription_plans->'premium_29'->>'stripe_price_id')::text, NULL)
  ),
  'elite_39', jsonb_build_object(
    'price_eur', 39,
    'tokens_per_month', 900000,
    'stripe_price_id', COALESCE((subscription_plans->'elite_39'->>'stripe_price_id')::text, NULL)
  ),
  'expert_49', jsonb_build_object(
    'price_eur', 49,
    'tokens_per_month', 1200000,
    'stripe_price_id', COALESCE((subscription_plans->'expert_49'->>'stripe_price_id')::text, NULL)
  ),
  'master_59', jsonb_build_object(
    'price_eur', 59,
    'tokens_per_month', 1600000,
    'stripe_price_id', COALESCE((subscription_plans->'master_59'->>'stripe_price_id')::text, NULL)
  ),
  'ultimate_99', jsonb_build_object(
    'price_eur', 99,
    'tokens_per_month', 3000000,
    'stripe_price_id', COALESCE((subscription_plans->'ultimate_99'->>'stripe_price_id')::text, NULL)
  )
)
WHERE is_active = true;

-- Affichage des plans mis à jour pour vérification
DO $$
DECLARE
  v_plans jsonb;
  v_plan_key text;
  v_plan_data jsonb;
BEGIN
  SELECT subscription_plans INTO v_plans
  FROM token_pricing_config
  WHERE is_active = true;

  RAISE NOTICE 'Plans d''abonnement mis à jour:';

  FOR v_plan_key, v_plan_data IN
    SELECT * FROM jsonb_each(v_plans)
  LOOP
    RAISE NOTICE '  % : tokens_per_month = %, price = %€, stripe_price_id = %',
      v_plan_key,
      v_plan_data->>'tokens_per_month',
      v_plan_data->>'price_eur',
      COALESCE(v_plan_data->>'stripe_price_id', 'NULL');
  END LOOP;
END $$;

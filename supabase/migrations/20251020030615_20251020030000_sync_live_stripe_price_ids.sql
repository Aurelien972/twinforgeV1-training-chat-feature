/*
  # Synchronisation des Price IDs Stripe LIVE

  1. Contexte
    - Les produits Stripe ont été créés en mode LIVE
    - La base de données contenait les anciens Price IDs du mode TEST
    - Cette migration met à jour les Price IDs avec les nouveaux IDs LIVE

  2. Nouveaux Price IDs LIVE
    - Pro (pro_19): price_1SK9JIKVCSnP5L8OgNrEGOSs
    - Champion (elite_39): price_1SK9JJKVCSnP5L8OxXWmfoJV
    - Master (expert_49): price_1SK9JKKVCSnP5L8OEIXQ7YS1
    - Legend (master_59): price_1SK9JKVCSnP5L8O7XkpoODn
    - Essential (starter_9): price_1SK9JLKVCSnP5L8OxdH2TBr2
    - Elite (premium_29): price_1SK9JLKVCSnP5L8OWI0zN5xw
    - Titan (ultimate_99): price_1SK9JMKVCSnP5L8OECKMBei8

  3. Nouveaux Product IDs LIVE
    - Pro: prod_TGggmshvpGYeDW
    - Champion: prod_TGggorw3CP1Lq1
    - Master: prod_TGggmFkbVeOXek
    - Legend: prod_TGgg2HVAwsS5JV
    - Essential: prod_TGggjkbz1bBh4j
    - Elite: prod_TGggBdwgnPpeKn
    - Titan: prod_TGggtcGgkAToN0

  4. Sécurité
    - Cette opération est sûre car elle ne modifie que les Price IDs
    - Les données utilisateur ne sont pas affectées
    - Les montants et tokens restent inchangés
*/

-- Récupérer la configuration actuelle
DO $$
DECLARE
  v_config_id uuid;
  v_current_plans jsonb;
  v_updated_plans jsonb;
BEGIN
  -- Trouver la configuration active
  SELECT id, subscription_plans INTO v_config_id, v_current_plans
  FROM token_pricing_config
  WHERE is_active = true
  LIMIT 1;

  IF v_config_id IS NULL THEN
    RAISE EXCEPTION 'Aucune configuration de pricing active trouvée';
  END IF;

  -- Créer une copie des plans pour mise à jour
  v_updated_plans := v_current_plans;

  -- Mettre à jour chaque plan avec les nouveaux Price IDs et Product IDs LIVE

  -- Essential (starter_9)
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{starter_9,stripe_price_id}',
    '"price_1SK9JLKVCSnP5L8OxdH2TBr2"'::jsonb
  );
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{starter_9,stripe_product_id}',
    '"prod_TGggjkbz1bBh4j"'::jsonb
  );

  -- Pro (pro_19)
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{pro_19,stripe_price_id}',
    '"price_1SK9JIKVCSnP5L8OgNrEGOSs"'::jsonb
  );
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{pro_19,stripe_product_id}',
    '"prod_TGggmshvpGYeDW"'::jsonb
  );

  -- Elite (premium_29)
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{premium_29,stripe_price_id}',
    '"price_1SK9JLKVCSnP5L8OWI0zN5xw"'::jsonb
  );
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{premium_29,stripe_product_id}',
    '"prod_TGggBdwgnPpeKn"'::jsonb
  );

  -- Champion (elite_39)
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{elite_39,stripe_price_id}',
    '"price_1SK9JJKVCSnP5L8OxXWmfoJV"'::jsonb
  );
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{elite_39,stripe_product_id}',
    '"prod_TGggorw3CP1Lq1"'::jsonb
  );

  -- Master (expert_49)
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{expert_49,stripe_price_id}',
    '"price_1SK9JKKVCSnP5L8OEIXQ7YS1"'::jsonb
  );
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{expert_49,stripe_product_id}',
    '"prod_TGggmFkbVeOXek"'::jsonb
  );

  -- Legend (master_59)
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{master_59,stripe_price_id}',
    '"price_1SK9JKVCSnP5L8O7XkpoODn"'::jsonb
  );
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{master_59,stripe_product_id}',
    '"prod_TGgg2HVAwsS5JV"'::jsonb
  );

  -- Titan (ultimate_99)
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{ultimate_99,stripe_price_id}',
    '"price_1SK9JMKVCSnP5L8OECKMBei8"'::jsonb
  );
  v_updated_plans := jsonb_set(
    v_updated_plans,
    '{ultimate_99,stripe_product_id}',
    '"prod_TGggtcGgkAToN0"'::jsonb
  );

  -- Appliquer la mise à jour
  UPDATE token_pricing_config
  SET
    subscription_plans = v_updated_plans,
    updated_at = now(),
    notes = 'Price IDs synchronisés avec Stripe LIVE mode - ' || now()::text
  WHERE id = v_config_id;

  RAISE NOTICE 'Configuration mise à jour avec succès avec les Price IDs LIVE';
  RAISE NOTICE 'Configuration ID: %', v_config_id;
END $$;

-- Vérification : afficher les nouveaux Price IDs
DO $$
DECLARE
  v_plans jsonb;
  v_plan_key text;
BEGIN
  SELECT subscription_plans INTO v_plans
  FROM token_pricing_config
  WHERE is_active = true
  LIMIT 1;

  RAISE NOTICE '=== VÉRIFICATION DES PRICE IDs ===';

  FOR v_plan_key IN SELECT jsonb_object_keys(v_plans) LOOP
    IF v_plan_key != 'free' THEN
      RAISE NOTICE 'Plan %: Price ID = %, Product ID = %',
        v_plan_key,
        v_plans->v_plan_key->>'stripe_price_id',
        v_plans->v_plan_key->>'stripe_product_id';
    END IF;
  END LOOP;
END $$;

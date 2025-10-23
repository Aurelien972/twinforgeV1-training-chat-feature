/*
  # Fix Token Balance Creation for New Users

  ## Problem
  New users were experiencing PGRST116 errors because their token balance
  wasn't being created properly. There was an inconsistency between:
  - The main token system using `user_token_balance` table
  - The trigger using the wrong table name `token_balances`

  ## Changes
  1. Fix the `create_user_token_balance()` trigger function to use correct table and columns
  2. Ensure 15,000 welcome tokens are properly credited
  3. Create proper transaction logging for audit trail
  4. Add backfill for existing users without token balance

  ## Tables Modified
  - `user_token_balance` - Fixed trigger to properly initialize new users
  - `token_transactions` - Added welcome bonus transaction logging
  - `user_subscriptions` - Ensured proper free plan creation

  ## Security
  - RLS policies remain unchanged
  - SECURITY DEFINER ensures proper permissions for trigger execution
*/

-- =====================================================
-- STEP 1: Fix the create_user_token_balance() trigger
-- =====================================================

CREATE OR REPLACE FUNCTION create_user_token_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Create token balance with welcome bonus (15,000 tokens)
  INSERT INTO user_token_balance (
    user_id,
    available_tokens,
    subscription_tokens,
    onetime_tokens,
    bonus_tokens,
    tokens_consumed_this_month,
    tokens_consumed_last_month,
    last_monthly_reset,
    last_consumption
  ) VALUES (
    NEW.id,
    15000,           -- Total available tokens
    0,               -- No subscription tokens yet (free plan)
    0,               -- No one-time purchase tokens
    15000,           -- Welcome bonus tokens
    0,               -- No consumption yet
    0,               -- No previous month consumption
    now(),           -- Initialize reset timestamp
    NULL             -- No consumption yet
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Create free plan subscription
  INSERT INTO user_subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    plan_type,
    subscription_status,
    tokens_monthly_quota,
    trial_start,
    trial_end,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    canceled_at
  ) VALUES (
    NEW.id,
    NULL,            -- No Stripe customer yet
    NULL,            -- No Stripe subscription yet
    NULL,            -- No price ID for free plan
    'free',          -- Free plan
    'trialing',      -- Trial status (permanent for free users)
    15000,           -- Monthly quota (not refreshed for free plan)
    now(),           -- Trial starts now
    NULL,            -- No trial end (permanent trial)
    now(),           -- Period starts now
    now() + interval '365 days', -- Long period for free users
    false,           -- Not canceling
    NULL             -- Not canceled
  ) ON CONFLICT DO NOTHING;

  -- Log the welcome bonus transaction
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
    metadata,
    stripe_payment_intent_id,
    stripe_invoice_id
  ) VALUES (
    NEW.id,
    'bonus',         -- This is a bonus transaction
    15000,           -- Amount credited
    15000,           -- Balance after transaction
    NULL,            -- No edge function involved
    NULL,            -- No operation type
    NULL,            -- No OpenAI model
    NULL,            -- No input tokens
    NULL,            -- No output tokens
    NULL,            -- No cost
    jsonb_build_object(
      'reason', 'welcome_bonus',
      'description', 'Bienvenue ! Tokens offerts à l''inscription',
      'source', 'user_signup',
      'timestamp', now()
    ),               -- Metadata for audit trail
    NULL,            -- No Stripe payment
    NULL             -- No Stripe invoice
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail user creation
    RAISE WARNING 'Failed to create token balance for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 2: Recreate the trigger
-- =====================================================

DROP TRIGGER IF EXISTS on_user_created_token_balance ON auth.users;
CREATE TRIGGER on_user_created_token_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_token_balance();

-- =====================================================
-- STEP 3: Backfill existing users without token balance
-- =====================================================

-- Find users without token balance and create one for them
DO $$
DECLARE
  v_user RECORD;
  v_users_fixed INTEGER := 0;
BEGIN
  FOR v_user IN
    SELECT u.id, u.email
    FROM auth.users u
    LEFT JOIN user_token_balance utb ON u.id = utb.user_id
    WHERE utb.user_id IS NULL
  LOOP
    BEGIN
      -- Create token balance for this user
      INSERT INTO user_token_balance (
        user_id,
        available_tokens,
        subscription_tokens,
        onetime_tokens,
        bonus_tokens,
        tokens_consumed_this_month,
        tokens_consumed_last_month,
        last_monthly_reset
      ) VALUES (
        v_user.id,
        15000,
        0,
        0,
        15000,
        0,
        0,
        now()
      ) ON CONFLICT (user_id) DO NOTHING;

      -- Create free subscription if doesn't exist
      INSERT INTO user_subscriptions (
        user_id,
        plan_type,
        subscription_status,
        tokens_monthly_quota,
        trial_start,
        current_period_start,
        current_period_end
      ) VALUES (
        v_user.id,
        'free',
        'trialing',
        15000,
        now(),
        now(),
        now() + interval '365 days'
      ) ON CONFLICT DO NOTHING;

      -- Log the backfill transaction
      INSERT INTO token_transactions (
        user_id,
        transaction_type,
        token_amount,
        balance_after,
        metadata
      ) VALUES (
        v_user.id,
        'bonus',
        15000,
        15000,
        jsonb_build_object(
          'reason', 'backfill_welcome_bonus',
          'description', 'Crédit rétroactif de bienvenue',
          'source', 'migration_20251020220000',
          'timestamp', now()
        )
      );

      v_users_fixed := v_users_fixed + 1;

      RAISE NOTICE 'Fixed token balance for user % (email: %)', v_user.id, v_user.email;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to fix token balance for user %: %', v_user.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Token balance backfill complete. Fixed % users.', v_users_fixed;
END $$;

-- =====================================================
-- STEP 4: Add helpful comments
-- =====================================================

COMMENT ON FUNCTION create_user_token_balance IS
  'Automatically creates token balance and free subscription for new users.
   Grants 15,000 welcome tokens as bonus tokens.
   Fixed in migration 20251020220000 to use correct table names.';

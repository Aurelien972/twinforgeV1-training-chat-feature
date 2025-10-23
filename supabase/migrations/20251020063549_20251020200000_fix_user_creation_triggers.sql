/*
  # Fix User Creation Triggers

  Fix the triggers that fail during user signup by making them more robust
  and handling errors gracefully.

  Changes:
  1. Recreate triggers with proper error handling
  2. Add SECURITY DEFINER to ensure proper permissions
  3. Add exception handling to prevent signup failures
*/

-- Fix create_user_profile function to handle errors gracefully
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO user_profile (user_id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix create_user_token_balance function with error handling
CREATE OR REPLACE FUNCTION create_user_token_balance()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO token_balances (
      user_id,
      subscription_tokens,
      topup_tokens,
      tokens_used_this_cycle,
      last_reset_at
    )
    VALUES (
      NEW.id,
      0,  -- Will be set when subscription is created
      0,
      0,
      now()
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Failed to create token balance for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix create_default_voice_preferences function with error handling
CREATE OR REPLACE FUNCTION create_default_voice_preferences()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO voice_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Failed to create voice preferences for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure triggers are properly set up (recreate them)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

DROP TRIGGER IF EXISTS on_user_created_token_balance ON auth.users;
CREATE TRIGGER on_user_created_token_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_token_balance();

DROP TRIGGER IF EXISTS trigger_create_default_voice_preferences ON auth.users;
CREATE TRIGGER trigger_create_default_voice_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_voice_preferences();
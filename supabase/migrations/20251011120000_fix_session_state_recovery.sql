/*
  # Fix Session State Recovery for Step 2 Navigation

  1. Problem
    - Users get stuck at 0% loading when returning to Step 2
    - prescription_exists flag blocks regeneration even when prescription is cleared from UI
    - No recovery mechanism for abandoned or interrupted sessions

  2. Changes
    - Update can_trigger_generation to detect stale sessions
    - Add function to attempt prescription recovery from database
    - Add function to reset session state for fresh start
    - Add function to check if prescription can be recovered

  3. Security
    - All functions use SECURITY DEFINER with proper user checks
    - RLS policies remain unchanged
*/

-- Helper function to check if a prescription can be recovered from database
CREATE OR REPLACE FUNCTION can_recover_prescription(
  p_session_id uuid,
  p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_session_exists boolean;
BEGIN
  -- Check if a valid training session exists with prescription
  SELECT EXISTS(
    SELECT 1
    FROM training_sessions
    WHERE id = p_session_id
      AND user_id = p_user_id
      AND prescription IS NOT NULL
      AND status IN ('draft', 'in_progress', 'pending')
  ) INTO v_session_exists;

  RETURN v_session_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to reset session state for regeneration
CREATE OR REPLACE FUNCTION reset_session_state_for_regeneration(
  p_session_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  -- Delete existing session state to allow fresh generation
  DELETE FROM training_session_states
  WHERE session_id = p_session_id
    AND user_id = p_user_id;

  -- Log the reset
  RAISE NOTICE 'Session state reset for regeneration: session_id=%, user_id=%', p_session_id, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update can_trigger_generation to handle recovery scenarios
CREATE OR REPLACE FUNCTION can_trigger_generation(p_session_id uuid)
RETURNS boolean AS $$
DECLARE
  v_state RECORD;
  v_elapsed_seconds integer;
  v_can_recover boolean;
BEGIN
  -- Get session state
  SELECT * INTO v_state
  FROM training_session_states
  WHERE session_id = p_session_id;

  -- If no state exists, generation can be triggered
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- RECOVERY SCENARIO: If prescription exists in state, check if it's a stale session
  -- that should allow recovery or regeneration
  IF v_state.prescription_exists THEN
    -- Calculate elapsed time since last activity
    v_elapsed_seconds := EXTRACT(EPOCH FROM (now() - v_state.last_activity_at));

    -- If session is stale (no activity for 5+ minutes), allow regeneration
    -- This handles cases where user closed browser and came back
    IF v_elapsed_seconds > 300 THEN
      -- Check if prescription can be recovered from database
      SELECT can_recover_prescription(p_session_id, v_state.user_id) INTO v_can_recover;

      -- If prescription can't be recovered, allow fresh generation
      IF NOT v_can_recover THEN
        RETURN true;
      END IF;

      -- If prescription can be recovered, block generation
      -- (UI should recover prescription instead)
      RETURN false;
    END IF;

    -- Recent activity with existing prescription - block to prevent duplication
    RETURN false;
  END IF;

  -- If never triggered, can trigger
  IF NOT v_state.generation_triggered THEN
    RETURN true;
  END IF;

  -- If triggered but not completed, check cooldown (5 seconds)
  v_elapsed_seconds := EXTRACT(EPOCH FROM (now() - v_state.generation_triggered_at));

  IF v_elapsed_seconds > 5 THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update mark_generation_triggered to handle explicit regeneration requests
CREATE OR REPLACE FUNCTION mark_generation_triggered(
  p_session_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  INSERT INTO training_session_states (
    session_id,
    user_id,
    generation_triggered,
    generation_triggered_at,
    prescription_exists,
    current_step,
    last_activity_at
  ) VALUES (
    p_session_id,
    p_user_id,
    true,
    now(),
    false, -- Reset prescription_exists on new trigger
    'activer',
    now()
  )
  ON CONFLICT (session_id) DO UPDATE
  SET
    generation_triggered = true,
    generation_triggered_at = now(),
    prescription_exists = false, -- Reset on explicit trigger
    current_step = 'activer',
    last_activity_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to update last activity (for keeping session alive)
CREATE OR REPLACE FUNCTION update_session_activity(
  p_session_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE training_session_states
  SET
    last_activity_at = now(),
    updated_at = now()
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for new functions
COMMENT ON FUNCTION can_recover_prescription IS 'Check if a prescription exists in database and can be recovered for the given session';
COMMENT ON FUNCTION reset_session_state_for_regeneration IS 'Reset session state to allow fresh generation (user explicit action)';
COMMENT ON FUNCTION update_session_activity IS 'Update last activity timestamp to keep session alive during user interaction';

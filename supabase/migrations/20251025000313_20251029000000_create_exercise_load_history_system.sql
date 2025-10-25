/*
  # Exercise Load History System - Long-term Progression Tracking

  ## Overview
  Creates comprehensive system to track exercise load history over time,
  enabling AI coaches to make informed progression decisions.

  ## Changes
  1. New Table: training_exercise_load_history
  2. Optimized Indexes for fast lookups
  3. Helper Functions for load history queries
  4. Data Migration function to backfill from existing sessions
  5. RLS policies for security

  ## Security
  - RLS enabled, users can only access their own history
*/

CREATE TABLE IF NOT EXISTS public.training_exercise_load_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_display_name TEXT NOT NULL,
  discipline TEXT NOT NULL CHECK (discipline IN ('force', 'functional', 'endurance', 'calisthenics', 'competitions')),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sets_prescribed INTEGER NOT NULL DEFAULT 0 CHECK (sets_prescribed >= 0),
  sets_completed INTEGER NOT NULL DEFAULT 0 CHECK (sets_completed >= 0),
  reps_prescribed JSONB,
  reps_completed JSONB,
  load_prescribed JSONB,
  load_completed JSONB,
  rpe_reported INTEGER CHECK (rpe_reported >= 1 AND rpe_reported <= 10),
  tempo TEXT,
  rest_seconds INTEGER CHECK (rest_seconds >= 0),
  notes TEXT,
  muscle_groups TEXT[],
  equipment_used TEXT[],
  was_modified BOOLEAN DEFAULT false,
  modification_type TEXT CHECK (
    modification_type IS NULL OR
    modification_type IN ('load_increase', 'load_decrease', 'sets_increase', 'sets_decrease', 'reps_increase', 'reps_decrease')
  ),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_load_history_user_exercise_date
  ON public.training_exercise_load_history(user_id, exercise_name, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_load_history_session
  ON public.training_exercise_load_history(session_id);

CREATE INDEX IF NOT EXISTS idx_exercise_load_history_muscle_groups
  ON public.training_exercise_load_history USING GIN(muscle_groups);

CREATE INDEX IF NOT EXISTS idx_exercise_load_history_discipline
  ON public.training_exercise_load_history(user_id, discipline, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_load_history_recent
  ON public.training_exercise_load_history(user_id, performed_at DESC);

ALTER TABLE public.training_exercise_load_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercise history"
  ON public.training_exercise_load_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert exercise history"
  ON public.training_exercise_load_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION get_exercise_load_history(
  p_user_id UUID,
  p_exercise_name TEXT,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  performed_at TIMESTAMPTZ,
  sets_completed INTEGER,
  reps_completed JSONB,
  load_completed JSONB,
  rpe_reported INTEGER,
  was_modified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.performed_at,
    h.sets_completed,
    h.reps_completed,
    h.load_completed,
    h.rpe_reported,
    h.was_modified
  FROM public.training_exercise_load_history h
  WHERE h.user_id = p_user_id
    AND LOWER(h.exercise_name) = LOWER(p_exercise_name)
    AND h.performed_at > now() - (p_months || ' months')::interval
  ORDER BY h.performed_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_last_performed_load(
  p_user_id UUID,
  p_exercise_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_load JSONB;
BEGIN
  SELECT load_completed INTO v_load
  FROM public.training_exercise_load_history
  WHERE user_id = p_user_id
    AND LOWER(exercise_name) = LOWER(p_exercise_name)
    AND load_completed IS NOT NULL
  ORDER BY performed_at DESC
  LIMIT 1;

  RETURN v_load;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_exercise_frequency(
  p_user_id UUID,
  p_exercise_name TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.training_exercise_load_history
  WHERE user_id = p_user_id
    AND LOWER(exercise_name) = LOWER(p_exercise_name)
    AND performed_at > now() - (p_days || ' days')::interval;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_progression_trend(
  p_user_id UUID,
  p_exercise_name TEXT,
  p_months INTEGER DEFAULT 6
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_first_load NUMERIC;
  v_last_load NUMERIC;
  v_sessions_count INTEGER;
BEGIN
  WITH loads AS (
    SELECT
      performed_at,
      CASE
        WHEN jsonb_typeof(load_completed) = 'number' THEN (load_completed::text)::numeric
        WHEN jsonb_typeof(load_completed) = 'array' THEN (
          SELECT AVG((value::text)::numeric)
          FROM jsonb_array_elements(load_completed)
        )
        ELSE 0
      END as avg_load
    FROM public.training_exercise_load_history
    WHERE user_id = p_user_id
      AND LOWER(exercise_name) = LOWER(p_exercise_name)
      AND performed_at > now() - (p_months || ' months')::interval
      AND load_completed IS NOT NULL
    ORDER BY performed_at
  )
  SELECT
    (SELECT avg_load FROM loads ORDER BY performed_at ASC LIMIT 1) as first_load,
    (SELECT avg_load FROM loads ORDER BY performed_at DESC LIMIT 1) as last_load,
    COUNT(*) as sessions
  INTO v_first_load, v_last_load, v_sessions_count
  FROM loads;

  IF v_first_load IS NULL OR v_last_load IS NULL THEN
    RETURN jsonb_build_object(
      'trend', 'insufficient_data',
      'sessions_analyzed', 0
    );
  END IF;

  v_result := jsonb_build_object(
    'first_load', v_first_load,
    'last_load', v_last_load,
    'absolute_increase', v_last_load - v_first_load,
    'percentage_increase', ROUND(((v_last_load - v_first_load) / NULLIF(v_first_load, 0) * 100)::numeric, 2),
    'sessions_analyzed', v_sessions_count,
    'trend', CASE
      WHEN v_last_load > v_first_load * 1.1 THEN 'strong_progression'
      WHEN v_last_load > v_first_load THEN 'moderate_progression'
      WHEN v_last_load = v_first_load THEN 'plateau'
      ELSE 'regression'
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION migrate_exercise_history_from_sessions()
RETURNS TABLE (
  sessions_processed INTEGER,
  exercises_inserted INTEGER,
  errors_count INTEGER
) AS $$
DECLARE
  v_session RECORD;
  v_exercise JSONB;
  v_block JSONB;
  v_sessions_count INTEGER := 0;
  v_exercises_count INTEGER := 0;
  v_errors_count INTEGER := 0;
  v_exercise_name TEXT;
  v_sets INTEGER;
  v_reps JSONB;
  v_load JSONB;
  v_muscle_groups TEXT[];
BEGIN
  FOR v_session IN
    SELECT
      id,
      user_id,
      prescription,
      session_data,
      discipline,
      completed_at,
      rpe,
      muscle_groups_worked
    FROM public.training_sessions
    WHERE status = 'completed'
      AND completed_at IS NOT NULL
      AND prescription IS NOT NULL
    ORDER BY completed_at DESC
  LOOP
    v_sessions_count := v_sessions_count + 1;

    BEGIN
      IF v_session.discipline = 'force' THEN
        IF v_session.prescription ? 'mainWorkout' THEN
          FOR v_exercise IN SELECT * FROM jsonb_array_elements(v_session.prescription->'mainWorkout')
          LOOP
            v_exercise_name := COALESCE(v_exercise->>'name', v_exercise->>'exerciseName');
            v_sets := COALESCE((v_exercise->>'sets')::integer, 0);
            v_reps := v_exercise->'reps';
            v_load := v_exercise->'load';
            v_muscle_groups := COALESCE(
              ARRAY(SELECT jsonb_array_elements_text(v_exercise->'muscleGroups')),
              ARRAY[]::TEXT[]
            );

            IF v_exercise_name IS NOT NULL THEN
              INSERT INTO public.training_exercise_load_history (
                user_id,
                session_id,
                exercise_name,
                exercise_display_name,
                discipline,
                performed_at,
                sets_prescribed,
                sets_completed,
                reps_prescribed,
                reps_completed,
                load_prescribed,
                load_completed,
                rpe_reported,
                muscle_groups
              ) VALUES (
                v_session.user_id,
                v_session.id,
                LOWER(REGEXP_REPLACE(v_exercise_name, '[éèê]', 'e', 'g')),
                v_exercise_name,
                v_session.discipline,
                v_session.completed_at,
                v_sets,
                v_sets,
                v_reps,
                v_reps,
                v_load,
                v_load,
                v_session.rpe,
                v_muscle_groups
              );

              v_exercises_count := v_exercises_count + 1;
            END IF;
          END LOOP;
        END IF;

      ELSIF v_session.discipline = 'functional' THEN
        IF v_session.prescription ? 'blocks' THEN
          FOR v_block IN SELECT * FROM jsonb_array_elements(v_session.prescription->'blocks')
          LOOP
            IF v_block ? 'exercises' THEN
              FOR v_exercise IN SELECT * FROM jsonb_array_elements(v_block->'exercises')
              LOOP
                v_exercise_name := COALESCE(v_exercise->>'name', v_exercise->>'exerciseName');
                v_sets := COALESCE((v_exercise->>'sets')::integer, 0);
                v_reps := v_exercise->'reps';
                v_load := v_exercise->'load';

                IF v_exercise_name IS NOT NULL THEN
                  INSERT INTO public.training_exercise_load_history (
                    user_id,
                    session_id,
                    exercise_name,
                    exercise_display_name,
                    discipline,
                    performed_at,
                    sets_prescribed,
                    sets_completed,
                    reps_prescribed,
                    reps_completed,
                    load_prescribed,
                    load_completed,
                    rpe_reported
                  ) VALUES (
                    v_session.user_id,
                    v_session.id,
                    LOWER(REGEXP_REPLACE(v_exercise_name, '[éèê]', 'e', 'g')),
                    v_exercise_name,
                    v_session.discipline,
                    v_session.completed_at,
                    v_sets,
                    v_sets,
                    v_reps,
                    v_reps,
                    v_load,
                    v_load,
                    v_session.rpe
                  );

                  v_exercises_count := v_exercises_count + 1;
                END IF;
              END LOOP;
            END IF;
          END LOOP;
        END IF;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_errors_count := v_errors_count + 1;
      RAISE WARNING 'Error processing session %: %', v_session.id, SQLERRM;
    END;
  END LOOP;

  RETURN QUERY SELECT v_sessions_count, v_exercises_count, v_errors_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.training_exercise_load_history IS
  'Long-term exercise load history enabling AI coaches to track progression over months/years';

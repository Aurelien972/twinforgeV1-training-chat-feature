/*
  # Synchronisation Training Sessions et Forge Énergétique

  ## Objectif
  Permettre la synchronisation bidirectionnelle entre les sessions de training complétées
  et les activités de la Forge Énergétique pour une vision unifiée de l'activité physique.

  ## Modifications

  ### 1. Table `activities`
  Ajoute les colonnes pour lier une activité à une session de training:
  - `training_session_id` (uuid, nullable, FK): Référence vers training_sessions
  - `is_from_training` (boolean): Indique si l'activité a été auto-générée depuis une session
  - `training_metadata` (jsonb): Métadonnées détaillées de la session (discipline, volume, etc.)

  ### 2. Index
  - Index sur training_session_id pour requêtes rapides
  - Index composite sur user_id + is_from_training pour filtrage

  ### 3. Contraintes
  - Si training_session_id est renseigné, is_from_training doit être true
  - Pas de duplication: une session ne peut être liée qu'à une seule activité

  ## Sécurité
  - Maintien des policies RLS existantes
  - Pas de nouvelle policy nécessaire
*/

-- =====================================================
-- 1. AJOUTER COLONNES À ACTIVITIES
-- =====================================================

-- Ajouter training_session_id (FK vers training_sessions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'activities'
    AND column_name = 'training_session_id'
  ) THEN
    ALTER TABLE public.activities
    ADD COLUMN training_session_id UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ajouter is_from_training (flag pour identifier les activités auto-générées)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'activities'
    AND column_name = 'is_from_training'
  ) THEN
    ALTER TABLE public.activities
    ADD COLUMN is_from_training BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- Ajouter training_metadata (jsonb pour stocker les détails de la session)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'activities'
    AND column_name = 'training_metadata'
  ) THEN
    ALTER TABLE public.activities
    ADD COLUMN training_metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- =====================================================
-- 2. CRÉER LES INDEX POUR PERFORMANCE
-- =====================================================

-- Index sur training_session_id pour jointures rapides
CREATE INDEX IF NOT EXISTS activities_training_session_id_idx
  ON public.activities(training_session_id)
  WHERE training_session_id IS NOT NULL;

-- Index composite pour filtrer les activités par origine
CREATE INDEX IF NOT EXISTS activities_user_training_flag_idx
  ON public.activities(user_id, is_from_training);

-- Index pour requêtes temporelles avec filtrage par origine
CREATE INDEX IF NOT EXISTS activities_user_timestamp_training_idx
  ON public.activities(user_id, timestamp DESC, is_from_training);

-- =====================================================
-- 3. AJOUTER CONTRAINTES DE COHÉRENCE
-- =====================================================

-- Si training_session_id est renseigné, is_from_training doit être true
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'training_session_consistency'
  ) THEN
    ALTER TABLE public.activities
    ADD CONSTRAINT training_session_consistency
    CHECK (
      (training_session_id IS NULL AND is_from_training = false)
      OR
      (training_session_id IS NOT NULL AND is_from_training = true)
    );
  END IF;
END $$;

-- Empêcher la duplication: une session ne peut être liée qu'à une seule activité
CREATE UNIQUE INDEX IF NOT EXISTS activities_unique_training_session_idx
  ON public.activities(training_session_id)
  WHERE training_session_id IS NOT NULL;

-- =====================================================
-- 4. FONCTION HELPER POUR SYNCHRONISATION AUTOMATIQUE
-- =====================================================

-- Fonction pour créer ou mettre à jour une activité depuis une session complétée
CREATE OR REPLACE FUNCTION sync_completed_training_session()
RETURNS TRIGGER AS $$
DECLARE
  activity_type TEXT;
  estimated_calories INTEGER;
  session_duration INTEGER;
  session_discipline TEXT;
  session_metadata JSONB;
BEGIN
  -- Ne rien faire si la session n'est pas complétée
  IF NEW.status != 'completed' OR NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ne rien faire si une activité existe déjà pour cette session
  IF EXISTS (
    SELECT 1 FROM public.activities
    WHERE training_session_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Extraire les métadonnées de la session
  session_discipline := COALESCE(NEW.discipline, NEW.session_type, 'strength');
  session_duration := COALESCE(NEW.duration_actual, NEW.duration_target_min, 45);

  -- Mapper le type de session vers le type d'activité
  activity_type := CASE
    WHEN session_discipline IN ('strength', 'powerlifting', 'bodybuilding', 'strongman') THEN 'musculation'
    WHEN session_discipline IN ('functional', 'crossfit', 'hiit', 'calisthenics') THEN 'functional_training'
    WHEN session_discipline IN ('running', 'trail') THEN 'course'
    WHEN session_discipline IN ('cycling', 'biking') THEN 'velo'
    WHEN session_discipline IN ('swimming') THEN 'natation'
    WHEN session_discipline IN ('triathlon') THEN 'triathlon'
    WHEN session_discipline = 'cardio' THEN 'cardio'
    ELSE 'autre'
  END;

  -- Estimer les calories (formule simplifiée basée sur durée et RPE)
  estimated_calories := CASE
    WHEN session_discipline IN ('strength', 'powerlifting', 'bodybuilding', 'strongman') THEN
      (session_duration * 5) + (COALESCE(NEW.rpe_avg, 5) * 10)
    WHEN session_discipline IN ('functional', 'crossfit', 'hiit') THEN
      (session_duration * 8) + (COALESCE(NEW.rpe_avg, 5) * 15)
    WHEN session_discipline IN ('running', 'cycling', 'swimming') THEN
      (session_duration * 10) + (COALESCE(NEW.rpe_avg, 5) * 12)
    ELSE
      session_duration * 6
  END;

  -- Limiter entre 0 et 2000
  estimated_calories := LEAST(GREATEST(estimated_calories, 0), 2000);

  -- Créer les métadonnées enrichies
  session_metadata := jsonb_build_object(
    'session_id', NEW.id,
    'discipline', session_discipline,
    'session_type', NEW.session_type,
    'rpe_avg', NEW.rpe_avg,
    'effort_perceived', NEW.effort_perceived,
    'enjoyment', NEW.enjoyment,
    'venue', NEW.venue,
    'prescription', NEW.prescription
  );

  -- Insérer l'activité dans la Forge Énergétique
  INSERT INTO public.activities (
    user_id,
    type,
    duration_min,
    intensity,
    calories_est,
    notes,
    timestamp,
    training_session_id,
    is_from_training,
    training_metadata
  ) VALUES (
    NEW.user_id,
    activity_type,
    session_duration,
    CASE
      WHEN COALESCE(NEW.rpe_avg, 5) <= 4 THEN 'low'
      WHEN COALESCE(NEW.rpe_avg, 5) <= 6 THEN 'medium'
      WHEN COALESCE(NEW.rpe_avg, 5) <= 8 THEN 'high'
      ELSE 'very_high'
    END,
    estimated_calories,
    COALESCE(NEW.notes, 'Session générée automatiquement depuis l''Atelier de Training'),
    NEW.completed_at,
    NEW.id,
    true,
    session_metadata
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CRÉER LE TRIGGER POUR SYNCHRONISATION AUTO
-- =====================================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_sync_completed_training_session ON public.training_sessions;

-- Créer le trigger qui se déclenche après INSERT ou UPDATE
CREATE TRIGGER trigger_sync_completed_training_session
  AFTER INSERT OR UPDATE OF status, completed_at
  ON public.training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION sync_completed_training_session();

-- =====================================================
-- 6. COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.activities.training_session_id IS
  'Référence vers la session de training source (si l''activité a été auto-générée)';

COMMENT ON COLUMN public.activities.is_from_training IS
  'Indique si l''activité provient d''une session de training complétée (auto-générée)';

COMMENT ON COLUMN public.activities.training_metadata IS
  'Métadonnées enrichies de la session de training (discipline, RPE, prescription, etc.)';

COMMENT ON FUNCTION sync_completed_training_session() IS
  'Fonction trigger qui crée automatiquement une activité dans la Forge Énergétique quand une session de training est complétée';

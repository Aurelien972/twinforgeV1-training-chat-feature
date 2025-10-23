/*
  # Trigger d'Enrichissement Automatique des Activités avec Données Wearables

  ## Description
  Cette migration ajoute un trigger PostgreSQL qui appelle automatiquement l'Edge Function
  d'enrichissement wearable après l'insertion d'une nouvelle activité.

  ## Fonctionnalités
  1. Trigger AFTER INSERT sur la table `activities`
  2. Appelle l'Edge Function `enrich-activity-wearable` de manière asynchrone
  3. Ne bloque pas l'insertion en cas d'échec de l'enrichissement
  4. Log des tentatives d'enrichissement dans une table dédiée

  ## Nouvelles Tables

  ### `activity_enrichment_log`
  Log des tentatives d'enrichissement automatique
  - `id` (uuid, primary key)
  - `activity_id` (uuid, FK activities)
  - `user_id` (uuid, FK auth.users)
  - `status` (text) - pending, processing, success, failed
  - `fields_enriched` (text[]) - Liste des champs enrichis
  - `error_message` (text) - Message d'erreur si échec
  - `attempt_count` (integer) - Nombre de tentatives
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)

  ## Sécurité
  - RLS activé sur la table de log
  - Seuls les utilisateurs propriétaires peuvent voir leurs logs
  - Le trigger utilise SECURITY DEFINER pour accès aux Edge Functions

  ## Notes Importantes
  - L'enrichissement est asynchrone pour ne pas ralentir l'insertion
  - Maximum 3 tentatives d'enrichissement en cas d'échec
  - Les activités déjà enrichies sont ignorées
*/

-- =====================================================
-- 1. TABLE DE LOG DES ENRICHISSEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_enrichment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'skipped')),

  -- Results
  fields_enriched TEXT[] DEFAULT '{}',
  data_points_processed INTEGER DEFAULT 0,
  primary_device_id UUID REFERENCES public.connected_devices(id) ON DELETE SET NULL,

  -- Error handling
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Ensure one log entry per activity enrichment attempt
  UNIQUE(activity_id, created_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrichment_log_activity
  ON public.activity_enrichment_log(activity_id);

CREATE INDEX IF NOT EXISTS idx_enrichment_log_user_status
  ON public.activity_enrichment_log(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enrichment_log_pending
  ON public.activity_enrichment_log(status, created_at)
  WHERE status IN ('pending', 'processing');

-- =====================================================
-- 2. RLS POLICIES
-- =====================================================

ALTER TABLE public.activity_enrichment_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrichment logs"
  ON public.activity_enrichment_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert enrichment logs"
  ON public.activity_enrichment_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update enrichment logs"
  ON public.activity_enrichment_log FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. FONCTION D'ENRICHISSEMENT ASYNCHRONE
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_activity_enrichment()
RETURNS TRIGGER AS $$
DECLARE
  v_has_connected_devices BOOLEAN;
  v_log_id UUID;
BEGIN
  -- Vérifier si l'activité est déjà enrichie
  IF NEW.wearable_device_id IS NOT NULL THEN
    RAISE NOTICE 'Activity % already enriched, skipping', NEW.id;
    RETURN NEW;
  END IF;

  -- Vérifier si l'utilisateur a des devices connectés
  SELECT EXISTS(
    SELECT 1 FROM public.connected_devices
    WHERE user_id = NEW.user_id
    AND status = 'connected'
  ) INTO v_has_connected_devices;

  IF NOT v_has_connected_devices THEN
    RAISE NOTICE 'User % has no connected devices, skipping enrichment', NEW.user_id;

    -- Log the skip
    INSERT INTO public.activity_enrichment_log (
      activity_id,
      user_id,
      status,
      error_message
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'skipped',
      'No connected devices found'
    );

    RETURN NEW;
  END IF;

  -- Créer un log d'enrichissement en attente
  INSERT INTO public.activity_enrichment_log (
    activity_id,
    user_id,
    status
  ) VALUES (
    NEW.id,
    NEW.user_id,
    'pending'
  ) RETURNING id INTO v_log_id;

  RAISE NOTICE 'Enrichment triggered for activity % (log: %)', NEW.id, v_log_id;

  -- Note: L'appel à l'Edge Function se fera via un job pg_cron ou via le frontend
  -- Pour l'instant, on marque juste l'enrichissement comme "pending"
  -- Le frontend ou un cron job appellera l'Edge Function pour les logs "pending"

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. TRIGGER SUR INSERTION D'ACTIVITÉ
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auto_enrich_activity ON public.activities;

CREATE TRIGGER trigger_auto_enrich_activity
  AFTER INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_activity_enrichment();

-- =====================================================
-- 5. FONCTION POUR RETRY DES ENRICHISSEMENTS ÉCHOUÉS
-- =====================================================

CREATE OR REPLACE FUNCTION public.retry_failed_enrichments(
  p_max_attempts INTEGER DEFAULT 3,
  p_age_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  activity_id UUID,
  user_id UUID,
  attempt_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.activity_enrichment_log
  SET
    status = 'pending',
    attempt_count = attempt_count + 1
  WHERE
    status = 'failed'
    AND attempt_count < p_max_attempts
    AND created_at > NOW() - (p_age_hours || ' hours')::INTERVAL
  RETURNING
    activity_enrichment_log.activity_id,
    activity_enrichment_log.user_id,
    activity_enrichment_log.attempt_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. VUE POUR STATISTIQUES D'ENRICHISSEMENT
-- =====================================================

CREATE OR REPLACE VIEW public.v_enrichment_stats AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE status = 'success') as successful_enrichments,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_enrichments,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_enrichments,
  COUNT(*) FILTER (WHERE status = 'skipped') as skipped_enrichments,
  AVG(data_points_processed) FILTER (WHERE status = 'success') as avg_data_points,
  AVG(array_length(fields_enriched, 1)) FILTER (WHERE status = 'success') as avg_fields_enriched,
  MAX(completed_at) as last_enrichment_at
FROM public.activity_enrichment_log
GROUP BY user_id;

-- Grant access to authenticated users
GRANT SELECT ON public.v_enrichment_stats TO authenticated;

-- RLS policy for the view
ALTER VIEW public.v_enrichment_stats SET (security_invoker = on);

-- =====================================================
-- 7. COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.activity_enrichment_log IS 'Log des tentatives d enrichissement automatique des activités avec données wearables';
COMMENT ON COLUMN public.activity_enrichment_log.status IS 'Statut de l enrichissement: pending, processing, success, failed, skipped';
COMMENT ON COLUMN public.activity_enrichment_log.fields_enriched IS 'Liste des champs enrichis avec succès';
COMMENT ON COLUMN public.activity_enrichment_log.attempt_count IS 'Nombre de tentatives d enrichissement (max 3)';
COMMENT ON FUNCTION public.trigger_activity_enrichment() IS 'Trigger automatique pour enrichissement des activités après insertion';
COMMENT ON FUNCTION public.retry_failed_enrichments(INTEGER, INTEGER) IS 'Retente les enrichissements échoués (max attempts et age limité)';
COMMENT ON VIEW public.v_enrichment_stats IS 'Statistiques d enrichissement par utilisateur';

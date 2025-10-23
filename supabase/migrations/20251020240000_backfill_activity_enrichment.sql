/*
  # Backfill Activity Enrichment

  ## Description
  Cette migration crée une fonction pour enrichir rétroactivement toutes les activités existantes
  qui n'ont pas encore été enrichies avec des données wearables.

  ## Fonctionnalités
  1. Fonction pour identifier les activités non enrichies
  2. Création de logs d'enrichissement en attente pour ces activités
  3. Vue pour suivre l'avancement du backfill

  ## Notes
  - Cette migration ne déclenche PAS automatiquement l'enrichissement
  - Elle prépare seulement les logs pour que l'Edge Function puisse les traiter
  - L'enrichissement réel se fait via appel à l'Edge Function depuis le frontend ou un job
*/

-- =====================================================
-- 1. FONCTION DE BACKFILL
-- =====================================================

CREATE OR REPLACE FUNCTION public.backfill_activity_enrichment_logs(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  activity_id UUID,
  user_id UUID,
  activity_timestamp TIMESTAMPTZ,
  log_created BOOLEAN
) AS $$
DECLARE
  v_activity RECORD;
  v_has_devices BOOLEAN;
  v_log_exists BOOLEAN;
BEGIN
  FOR v_activity IN
    SELECT
      a.id,
      a.user_id,
      a.timestamp
    FROM public.activities a
    WHERE a.wearable_device_id IS NULL
    ORDER BY a.timestamp DESC
    LIMIT p_limit
  LOOP
    -- Vérifier si l'utilisateur a des devices connectés
    SELECT EXISTS(
      SELECT 1 FROM public.connected_devices
      WHERE user_id = v_activity.user_id
      AND status = 'connected'
    ) INTO v_has_devices;

    -- Si pas de devices, skip
    IF NOT v_has_devices THEN
      CONTINUE;
    END IF;

    -- Vérifier si un log existe déjà
    SELECT EXISTS(
      SELECT 1 FROM public.activity_enrichment_log
      WHERE activity_id = v_activity.id
      AND user_id = v_activity.user_id
    ) INTO v_log_exists;

    -- Si le log existe déjà, skip
    IF v_log_exists THEN
      CONTINUE;
    END IF;

    -- Créer un log d'enrichissement en attente
    BEGIN
      INSERT INTO public.activity_enrichment_log (
        activity_id,
        user_id,
        status,
        created_at
      ) VALUES (
        v_activity.id,
        v_activity.user_id,
        'pending',
        NOW()
      );

      -- Retourner le résultat
      activity_id := v_activity.id;
      user_id := v_activity.user_id;
      activity_timestamp := v_activity.timestamp;
      log_created := true;
      RETURN NEXT;

    EXCEPTION WHEN unique_violation THEN
      -- Log déjà créé par un autre process, skip silencieusement
      CONTINUE;
    END;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. VUE POUR SUIVI DU BACKFILL
-- =====================================================

CREATE OR REPLACE VIEW public.v_enrichment_backfill_status AS
SELECT
  COUNT(*) FILTER (WHERE wearable_device_id IS NULL) as activities_not_enriched,
  COUNT(*) FILTER (WHERE wearable_device_id IS NOT NULL) as activities_enriched,
  COUNT(*) as total_activities,
  ROUND(
    (COUNT(*) FILTER (WHERE wearable_device_id IS NOT NULL)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100),
    2
  ) as enrichment_percentage,
  (
    SELECT COUNT(*)
    FROM public.activity_enrichment_log
    WHERE status = 'pending'
  ) as pending_enrichment_logs,
  (
    SELECT COUNT(*)
    FROM public.activity_enrichment_log
    WHERE status = 'success'
  ) as successful_enrichments,
  (
    SELECT COUNT(*)
    FROM public.activity_enrichment_log
    WHERE status = 'failed'
  ) as failed_enrichments
FROM public.activities;

-- Grant access
GRANT SELECT ON public.v_enrichment_backfill_status TO authenticated;

-- RLS pour la vue
ALTER VIEW public.v_enrichment_backfill_status SET (security_invoker = on);

-- =====================================================
-- 3. FONCTION POUR STATISTIQUES PAR UTILISATEUR
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_enrichment_status(p_user_id UUID)
RETURNS TABLE (
  total_activities INTEGER,
  enriched_activities INTEGER,
  unenriched_activities INTEGER,
  pending_logs INTEGER,
  enrichment_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_activities,
    COUNT(*) FILTER (WHERE a.wearable_device_id IS NOT NULL)::INTEGER as enriched_activities,
    COUNT(*) FILTER (WHERE a.wearable_device_id IS NULL)::INTEGER as unenriched_activities,
    (
      SELECT COUNT(*)::INTEGER
      FROM public.activity_enrichment_log el
      WHERE el.user_id = p_user_id
      AND el.status = 'pending'
    ) as pending_logs,
    ROUND(
      (COUNT(*) FILTER (WHERE a.wearable_device_id IS NOT NULL)::NUMERIC /
      NULLIF(COUNT(*), 0) * 100),
      2
    ) as enrichment_percentage
  FROM public.activities a
  WHERE a.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.get_user_enrichment_status(UUID) TO authenticated;

-- =====================================================
-- 4. COMMENTAIRES
-- =====================================================

COMMENT ON FUNCTION public.backfill_activity_enrichment_logs(INTEGER) IS
'Crée des logs d enrichissement en attente pour les activités non enrichies. À appeler depuis le frontend ou un job.';

COMMENT ON VIEW public.v_enrichment_backfill_status IS
'Vue globale du statut d enrichissement des activités (admin)';

COMMENT ON FUNCTION public.get_user_enrichment_status(UUID) IS
'Retourne le statut d enrichissement des activités pour un utilisateur spécifique';

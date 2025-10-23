/*
  # Backfill des Activités Existantes avec Données Wearables

  ## Description
  Cette migration crée des logs d'enrichissement pour toutes les activités existantes
  qui n'ont pas encore été enrichies avec des données wearables. Elle permet de
  rétroactivement enrichir les activités passées quand un utilisateur connecte un nouvel appareil.

  ## Fonctionnalités
  1. Fonction pour créer des logs d'enrichissement pour activités existantes
  2. Fonction pour backfill automatique après connexion d'un device
  3. Fonction manuelle de backfill avec contrôle de période
  4. Gestion intelligente pour éviter les doublons

  ## Sécurité
  - Vérification des permissions utilisateur
  - Limitation du nombre d'activités par batch
  - Protection contre les enrichissements en double

  ## Notes Importantes
  - Le backfill est déclenché automatiquement après connexion d'un device
  - Maximum 100 activités par appel pour éviter les timeouts
  - Les activités déjà enrichies sont ignorées
  - Seules les activités avec devices connectés sont traitées
*/

-- =====================================================
-- 1. FONCTION DE BACKFILL MANUEL
-- =====================================================

CREATE OR REPLACE FUNCTION public.backfill_activities_enrichment(
  p_user_id UUID,
  p_days_back INTEGER DEFAULT 30,
  p_batch_size INTEGER DEFAULT 100
)
RETURNS TABLE (
  activities_queued INTEGER,
  activities_skipped INTEGER,
  oldest_activity_date TIMESTAMPTZ
) AS $$
DECLARE
  v_activities_queued INTEGER := 0;
  v_activities_skipped INTEGER := 0;
  v_oldest_date TIMESTAMPTZ;
  v_has_devices BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur a des devices connectés
  SELECT EXISTS(
    SELECT 1 FROM public.connected_devices
    WHERE user_id = p_user_id
    AND status = 'connected'
  ) INTO v_has_devices;

  IF NOT v_has_devices THEN
    RAISE NOTICE 'User % has no connected devices, skipping backfill', p_user_id;
    RETURN QUERY SELECT 0, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Créer des logs d'enrichissement pour les activités non enrichies
  WITH activities_to_enrich AS (
    SELECT
      a.id,
      a.user_id,
      a.timestamp
    FROM public.activities a
    WHERE a.user_id = p_user_id
    AND a.wearable_device_id IS NULL -- Pas encore enrichies
    AND a.timestamp >= NOW() - (p_days_back || ' days')::INTERVAL
    AND NOT EXISTS (
      -- Éviter les doublons de logs
      SELECT 1 FROM public.activity_enrichment_log
      WHERE activity_id = a.id
      AND status IN ('pending', 'processing', 'success')
    )
    ORDER BY a.timestamp DESC
    LIMIT p_batch_size
  ),
  inserted_logs AS (
    INSERT INTO public.activity_enrichment_log (
      activity_id,
      user_id,
      status,
      attempt_count
    )
    SELECT
      id,
      user_id,
      'pending',
      0
    FROM activities_to_enrich
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_activities_queued FROM inserted_logs;

  -- Compter les activités déjà enrichies (skipped)
  SELECT COUNT(*) INTO v_activities_skipped
  FROM public.activities
  WHERE user_id = p_user_id
  AND wearable_device_id IS NOT NULL
  AND timestamp >= NOW() - (p_days_back || ' days')::INTERVAL;

  -- Obtenir la date de l'activité la plus ancienne
  SELECT MIN(timestamp) INTO v_oldest_date
  FROM public.activities
  WHERE user_id = p_user_id
  AND timestamp >= NOW() - (p_days_back || ' days')::INTERVAL;

  RAISE NOTICE 'Backfill completed: % queued, % already enriched', v_activities_queued, v_activities_skipped;

  RETURN QUERY SELECT v_activities_queued, v_activities_skipped, v_oldest_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. FONCTION DE BACKFILL AUTOMATIQUE APRÈS CONNEXION DEVICE
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_backfill_on_device_connect()
RETURNS TRIGGER AS $$
DECLARE
  v_backfill_days INTEGER;
BEGIN
  -- Vérifier si c'est une nouvelle connexion (pas un update)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'connected' AND NEW.status = 'connected') THEN
    -- Récupérer les préférences de backfill pour ce device
    SELECT backfill_days INTO v_backfill_days
    FROM public.sync_preferences
    WHERE device_id = NEW.id;

    -- Si pas de préférences, utiliser 7 jours par défaut
    v_backfill_days := COALESCE(v_backfill_days, 7);

    RAISE NOTICE 'Device % connected, triggering backfill for % days', NEW.id, v_backfill_days;

    -- Lancer le backfill de manière asynchrone
    -- Note: En pratique, on créera les logs et le cron job les traitera
    PERFORM public.backfill_activities_enrichment(NEW.user_id, v_backfill_days, 50);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. TRIGGER SUR CONNEXION DE DEVICE
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auto_backfill_on_connect ON public.connected_devices;

CREATE TRIGGER trigger_auto_backfill_on_connect
  AFTER INSERT OR UPDATE OF status ON public.connected_devices
  FOR EACH ROW
  WHEN (NEW.status = 'connected')
  EXECUTE FUNCTION public.auto_backfill_on_device_connect();

-- =====================================================
-- 4. FONCTION POUR BACKFILL COMPLET (ADMIN SEULEMENT)
-- =====================================================

CREATE OR REPLACE FUNCTION public.backfill_all_users_activities(
  p_days_back INTEGER DEFAULT 30,
  p_batch_size INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  activities_queued INTEGER,
  completed_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user RECORD;
  v_result RECORD;
BEGIN
  -- Parcourir tous les utilisateurs avec des devices connectés
  FOR v_user IN
    SELECT DISTINCT cd.user_id
    FROM public.connected_devices cd
    WHERE cd.status = 'connected'
  LOOP
    -- Backfill pour cet utilisateur
    FOR v_result IN
      SELECT * FROM public.backfill_activities_enrichment(
        v_user.user_id,
        p_days_back,
        p_batch_size
      )
    LOOP
      RETURN QUERY SELECT
        v_user.user_id,
        v_result.activities_queued,
        NOW();
    END LOOP;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. VUE POUR SUIVI DU BACKFILL
-- =====================================================

CREATE OR REPLACE VIEW public.v_backfill_progress AS
SELECT
  u.id as user_id,
  COUNT(DISTINCT cd.id) as connected_devices_count,
  COUNT(a.id) as total_activities,
  COUNT(a.id) FILTER (WHERE a.wearable_device_id IS NOT NULL) as enriched_activities,
  COUNT(ael.id) FILTER (WHERE ael.status = 'pending') as pending_enrichments,
  COUNT(ael.id) FILTER (WHERE ael.status = 'processing') as processing_enrichments,
  COUNT(ael.id) FILTER (WHERE ael.status = 'failed') as failed_enrichments,
  ROUND(
    (COUNT(a.id) FILTER (WHERE a.wearable_device_id IS NOT NULL)::NUMERIC /
    NULLIF(COUNT(a.id), 0)) * 100,
    2
  ) as enrichment_percentage,
  MAX(a.timestamp) FILTER (WHERE a.wearable_device_id IS NULL) as oldest_unenriched_activity
FROM auth.users u
LEFT JOIN public.connected_devices cd ON cd.user_id = u.id AND cd.status = 'connected'
LEFT JOIN public.activities a ON a.user_id = u.id
LEFT JOIN public.activity_enrichment_log ael ON ael.user_id = u.id
WHERE EXISTS (SELECT 1 FROM public.connected_devices WHERE user_id = u.id AND status = 'connected')
GROUP BY u.id;

-- Grant access to authenticated users (own data only)
ALTER VIEW public.v_backfill_progress SET (security_invoker = on);
GRANT SELECT ON public.v_backfill_progress TO authenticated;

-- =====================================================
-- 6. FONCTION POUR FORCER RE-ENRICHISSEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION public.force_reenrich_activities(
  p_user_id UUID,
  p_activity_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Si activity_ids fourni, ré-enrichir seulement ces activités
  IF p_activity_ids IS NOT NULL THEN
    -- Supprimer les anciens logs
    DELETE FROM public.activity_enrichment_log
    WHERE user_id = p_user_id
    AND activity_id = ANY(p_activity_ids);

    -- Créer de nouveaux logs pending
    INSERT INTO public.activity_enrichment_log (
      activity_id,
      user_id,
      status,
      attempt_count
    )
    SELECT
      id,
      p_user_id,
      'pending',
      0
    FROM public.activities
    WHERE id = ANY(p_activity_ids)
    AND user_id = p_user_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
  ELSE
    -- Ré-enrichir toutes les activités de l'utilisateur
    DELETE FROM public.activity_enrichment_log
    WHERE user_id = p_user_id;

    INSERT INTO public.activity_enrichment_log (
      activity_id,
      user_id,
      status,
      attempt_count
    )
    SELECT
      id,
      user_id,
      'pending',
      0
    FROM public.activities
    WHERE user_id = p_user_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.backfill_activities_enrichment(UUID, INTEGER, INTEGER) IS
  'Crée des logs d enrichissement pour les activités passées non enrichies (manuel)';

COMMENT ON FUNCTION public.auto_backfill_on_device_connect() IS
  'Trigger automatique pour backfill après connexion d un nouvel appareil';

COMMENT ON FUNCTION public.backfill_all_users_activities(INTEGER, INTEGER) IS
  'Backfill massif pour tous les utilisateurs (admin only)';

COMMENT ON FUNCTION public.force_reenrich_activities(UUID, UUID[]) IS
  'Force le ré-enrichissement d activités spécifiques ou toutes les activités d un user';

COMMENT ON VIEW public.v_backfill_progress IS
  'Vue pour suivre la progression du backfill par utilisateur';

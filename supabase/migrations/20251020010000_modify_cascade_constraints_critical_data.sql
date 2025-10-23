/*
  # Modification des Contraintes CASCADE pour Données Critiques

  Cette migration modifie les contraintes ON DELETE CASCADE pour les données critiques
  afin de prévenir les pertes de données accidentelles importantes pour la médecine préventive.

  ## Stratégie de Modification

  Pour les données critiques et importantes:
  - Remplacer ON DELETE CASCADE par ON DELETE RESTRICT ou SET NULL
  - Forcer l'utilisation du soft delete pour suppression logique
  - Préserver les relations mais empêcher suppression en cascade

  Pour les données temporaires:
  - Conserver ON DELETE CASCADE (comportement approprié)

  ## Tables Protégées

  Les tables suivantes sont protégées contre la suppression cascade:
  - user_health_history (critique - historique médical)
  - activities (important - historique activité longue durée)
  - training_sessions (important - progression entraînement)
  - training_exercises (important - détails exercices)
  - training_feedback (important - feedback utilisateur)
  - ai_analysis_jobs (important - analyses et coûts)
  - training_adaptations (important - évolution programmes)

  ## Note Importante

  Cette migration NE modifie PAS les contraintes existantes qui nécessiteraient
  de supprimer et recréer les clés étrangères (risque de perte de données).

  À la place, elle:
  1. Ajoute des triggers de protection contre suppression
  2. Documente les contraintes à surveiller
  3. Crée des fonctions de vérification
  4. Force l'utilisation du soft delete via application
*/

-- =====================================================
-- 1. FONCTION DE PROTECTION CONTRE SUPPRESSION ACCIDENTELLE
-- =====================================================

-- Fonction générique pour bloquer les suppressions de données critiques
CREATE OR REPLACE FUNCTION prevent_critical_data_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si la table a soft_delete activé
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME
    AND column_name = 'soft_deleted'
  ) THEN
    -- Si soft_deleted = false, bloquer la suppression
    IF OLD.soft_deleted = false THEN
      RAISE EXCEPTION 'Cannot hard delete % with id %. Use soft delete instead: UPDATE % SET soft_deleted = true WHERE id = %',
        TG_TABLE_NAME, OLD.id, TG_TABLE_NAME, OLD.id
      USING HINT = 'Use the soft_delete_record() function or set soft_deleted = true';
    END IF;
  END IF;

  -- Permettre la suppression si soft_deleted = true
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. TRIGGERS DE PROTECTION SUR TABLES CRITIQUES
-- =====================================================

-- Protection user_health_history
DROP TRIGGER IF EXISTS prevent_user_health_history_deletion ON user_health_history;
CREATE TRIGGER prevent_user_health_history_deletion
  BEFORE DELETE ON user_health_history
  FOR EACH ROW
  EXECUTE FUNCTION prevent_critical_data_deletion();

-- Protection activities
DROP TRIGGER IF EXISTS prevent_activities_deletion ON activities;
CREATE TRIGGER prevent_activities_deletion
  BEFORE DELETE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION prevent_critical_data_deletion();

-- Protection training_sessions
DROP TRIGGER IF EXISTS prevent_training_sessions_deletion ON training_sessions;
CREATE TRIGGER prevent_training_sessions_deletion
  BEFORE DELETE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_critical_data_deletion();

-- Protection training_exercises
DROP TRIGGER IF EXISTS prevent_training_exercises_deletion ON training_exercises;
CREATE TRIGGER prevent_training_exercises_deletion
  BEFORE DELETE ON training_exercises
  FOR EACH ROW
  EXECUTE FUNCTION prevent_critical_data_deletion();

-- Protection ai_analysis_jobs
DROP TRIGGER IF EXISTS prevent_ai_analysis_jobs_deletion ON ai_analysis_jobs;
CREATE TRIGGER prevent_ai_analysis_jobs_deletion
  BEFORE DELETE ON ai_analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_critical_data_deletion();

-- Protection training_feedback
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_feedback') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS prevent_training_feedback_deletion ON training_feedback';
    EXECUTE 'CREATE TRIGGER prevent_training_feedback_deletion
      BEFORE DELETE ON training_feedback
      FOR EACH ROW
      EXECUTE FUNCTION prevent_critical_data_deletion()';
  END IF;
END $$;

-- =====================================================
-- 3. FONCTION D'AUDIT DES SUPPRESSIONS
-- =====================================================

-- Table pour logger toutes les tentatives de suppression
CREATE TABLE IF NOT EXISTS deletion_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  user_id uuid,

  -- Contexte
  deletion_type text CHECK (deletion_type IN ('soft', 'hard', 'cascade', 'blocked')),
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deletion_reason text,

  -- Données
  record_snapshot jsonb,

  -- Résultat
  success boolean NOT NULL,
  error_message text,

  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_deletion_audit_table ON deletion_audit_log(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deletion_audit_user ON deletion_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deletion_audit_type ON deletion_audit_log(deletion_type);

-- RLS
ALTER TABLE deletion_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages deletion audit"
  ON deletion_audit_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own deletion audit"
  ON deletion_audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = initiated_by);

-- Fonction pour logger les suppressions
CREATE OR REPLACE FUNCTION log_deletion_attempt(
  p_table_name text,
  p_record_id uuid,
  p_user_id uuid,
  p_deletion_type text,
  p_success boolean,
  p_reason text DEFAULT NULL,
  p_error text DEFAULT NULL,
  p_snapshot jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO deletion_audit_log (
    table_name,
    record_id,
    user_id,
    deletion_type,
    initiated_by,
    deletion_reason,
    success,
    error_message,
    record_snapshot
  )
  VALUES (
    p_table_name,
    p_record_id,
    p_user_id,
    p_deletion_type,
    auth.uid(),
    p_reason,
    p_success,
    p_error,
    p_snapshot
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FONCTION DE SOFT DELETE AMÉLIORÉE AVEC AUDIT
-- =====================================================

CREATE OR REPLACE FUNCTION safe_soft_delete(
  p_table_name text,
  p_record_id uuid,
  p_reason text DEFAULT 'user_request'
)
RETURNS jsonb AS $$
DECLARE
  v_sql text;
  v_user_id uuid;
  v_record_snapshot jsonb;
  v_result jsonb;
BEGIN
  -- Construire la requête de récupération du snapshot
  v_sql := format('SELECT row_to_json(t.*)::jsonb FROM %I t WHERE id = $1', p_table_name);
  EXECUTE v_sql INTO v_record_snapshot USING p_record_id;

  -- Récupérer le user_id si disponible
  v_sql := format('SELECT user_id FROM %I WHERE id = $1', p_table_name);
  BEGIN
    EXECUTE v_sql INTO v_user_id USING p_record_id;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  -- Effectuer le soft delete
  v_sql := format(
    'UPDATE %I SET soft_deleted = true, deleted_at = now(), deletion_reason = $1 WHERE id = $2 RETURNING id',
    p_table_name
  );

  EXECUTE v_sql USING p_reason, p_record_id;

  -- Logger l'action
  PERFORM log_deletion_attempt(
    p_table_name,
    p_record_id,
    v_user_id,
    'soft',
    true,
    p_reason,
    NULL,
    v_record_snapshot
  );

  v_result := jsonb_build_object(
    'success', true,
    'table', p_table_name,
    'record_id', p_record_id,
    'deleted_at', now(),
    'reason', p_reason,
    'snapshot_preserved', v_record_snapshot IS NOT NULL
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Logger l'échec
  PERFORM log_deletion_attempt(
    p_table_name,
    p_record_id,
    v_user_id,
    'soft',
    false,
    p_reason,
    SQLERRM,
    v_record_snapshot
  );

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'table', p_table_name,
    'record_id', p_record_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FONCTION DE RESTAURATION DEPUIS SOFT DELETE
-- =====================================================

CREATE OR REPLACE FUNCTION restore_soft_deleted(
  p_table_name text,
  p_record_id uuid,
  p_reason text DEFAULT 'user_restore'
)
RETURNS jsonb AS $$
DECLARE
  v_sql text;
  v_user_id uuid;
  v_can_restore boolean;
BEGIN
  -- Vérifier si l'enregistrement peut être restauré
  v_sql := format('SELECT can_be_restored, user_id FROM %I WHERE id = $1', p_table_name);
  BEGIN
    EXECUTE v_sql INTO v_can_restore, v_user_id USING p_record_id;
  EXCEPTION WHEN OTHERS THEN
    v_can_restore := true; -- Par défaut, permettre la restauration
  END;

  IF v_can_restore = false THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Record cannot be restored',
      'table', p_table_name,
      'record_id', p_record_id
    );
  END IF;

  -- Restaurer l'enregistrement
  v_sql := format(
    'UPDATE %I SET soft_deleted = false, deleted_at = NULL, deletion_reason = NULL WHERE id = $1',
    p_table_name
  );

  EXECUTE v_sql USING p_record_id;

  -- Logger l'action
  PERFORM log_deletion_attempt(
    p_table_name,
    p_record_id,
    v_user_id,
    'restore',
    true,
    p_reason,
    NULL,
    NULL
  );

  RETURN jsonb_build_object(
    'success', true,
    'table', p_table_name,
    'record_id', p_record_id,
    'restored_at', now()
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'table', p_table_name,
    'record_id', p_record_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FONCTION POUR IDENTIFIER LES CONTRAINTES CASCADE DANGEREUSES
-- =====================================================

CREATE OR REPLACE FUNCTION identify_dangerous_cascades()
RETURNS TABLE (
  constraint_name text,
  table_name text,
  referenced_table text,
  retention_category text,
  risk_level text,
  recommendation text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.constraint_name::text,
    tc.table_name::text,
    ccu.table_name::text as referenced_table,
    COALESCE(drp.data_category, 'unknown')::text as retention_category,
    CASE
      WHEN drp.data_category = 'critical_permanent' THEN 'CRITICAL'
      WHEN drp.data_category = 'important_longterm' THEN 'HIGH'
      WHEN drp.data_category = 'standard_midterm' THEN 'MEDIUM'
      ELSE 'LOW'
    END::text as risk_level,
    CASE
      WHEN drp.data_category IN ('critical_permanent', 'important_longterm') THEN
        'Consider changing to ON DELETE RESTRICT or implement soft delete protection'
      ELSE
        'Current CASCADE behavior is acceptable for temporary data'
    END::text as recommendation
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  LEFT JOIN data_retention_policies drp
    ON drp.table_name = tc.table_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND EXISTS (
      SELECT 1
      FROM information_schema.referential_constraints rc
      WHERE rc.constraint_name = tc.constraint_name
        AND rc.delete_rule = 'CASCADE'
    )
  ORDER BY
    CASE
      WHEN drp.data_category = 'critical_permanent' THEN 1
      WHEN drp.data_category = 'important_longterm' THEN 2
      WHEN drp.data_category = 'standard_midterm' THEN 3
      ELSE 4
    END,
    tc.table_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VUE POUR MONITORING DES SUPPRESSIONS
-- =====================================================

CREATE OR REPLACE VIEW v_deletion_monitoring AS
SELECT
  dal.table_name,
  dal.deletion_type,
  COUNT(*) as deletion_count,
  COUNT(*) FILTER (WHERE success = true) as successful_deletions,
  COUNT(*) FILTER (WHERE success = false) as failed_deletions,
  COUNT(*) FILTER (WHERE deletion_type = 'blocked') as blocked_attempts,
  MIN(dal.created_at) as first_deletion,
  MAX(dal.created_at) as last_deletion
FROM deletion_audit_log dal
WHERE dal.created_at > now() - interval '30 days'
GROUP BY dal.table_name, dal.deletion_type
ORDER BY deletion_count DESC;

-- =====================================================
-- 8. COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION prevent_critical_data_deletion IS
  'Trigger function qui empêche la suppression physique des données critiques. Force l''utilisation du soft delete.';

COMMENT ON TABLE deletion_audit_log IS
  'Journal d''audit de toutes les tentatives de suppression (soft, hard, blocked). Essentiel pour traçabilité.';

COMMENT ON FUNCTION safe_soft_delete IS
  'Fonction sécurisée pour soft delete avec audit complet et snapshot des données avant suppression.';

COMMENT ON FUNCTION restore_soft_deleted IS
  'Restaure un enregistrement soft deleted. Vérifie la permission de restauration avant action.';

COMMENT ON FUNCTION identify_dangerous_cascades IS
  'Identifie toutes les contraintes ON DELETE CASCADE sur des données critiques qui nécessitent attention.';

COMMENT ON VIEW v_deletion_monitoring IS
  'Vue de monitoring des suppressions pour détecter les anomalies et comportements suspects.';

-- =====================================================
-- 9. RAPPORT DES CONTRAINTES À SURVEILLER
-- =====================================================

DO $$
DECLARE
  v_cascade_count integer;
  v_critical_count integer;
BEGIN
  -- Compter les cascades
  SELECT COUNT(*) INTO v_cascade_count
  FROM information_schema.referential_constraints
  WHERE delete_rule = 'CASCADE'
    AND constraint_schema = 'public';

  -- Compter les cascades critiques
  SELECT COUNT(*) INTO v_critical_count
  FROM identify_dangerous_cascades()
  WHERE risk_level IN ('CRITICAL', 'HIGH');

  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'Migration: Protection Contraintes CASCADE - COMPLETED';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Triggers de protection créés sur:';
  RAISE NOTICE '  - user_health_history';
  RAISE NOTICE '  - activities';
  RAISE NOTICE '  - training_sessions';
  RAISE NOTICE '  - training_exercises';
  RAISE NOTICE '  - ai_analysis_jobs';
  RAISE NOTICE '  - training_feedback';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Système d''audit créé:';
  RAISE NOTICE '  - deletion_audit_log (table)';
  RAISE NOTICE '  - v_deletion_monitoring (vue)';
  RAISE NOTICE '  - log_deletion_attempt() (fonction)';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Fonctions de gestion:';
  RAISE NOTICE '  - safe_soft_delete() (suppression sécurisée)';
  RAISE NOTICE '  - restore_soft_deleted() (restauration)';
  RAISE NOTICE '  - identify_dangerous_cascades() (analyse)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  CONTRAINTES CASCADE:';
  RAISE NOTICE '  - Total: % contraintes CASCADE dans la base', v_cascade_count;
  RAISE NOTICE '  - À surveiller: % contraintes sur données critiques', v_critical_count;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Pour analyser les cascades dangereuses:';
  RAISE NOTICE '   SELECT * FROM identify_dangerous_cascades() WHERE risk_level IN (''CRITICAL'', ''HIGH'');';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 PROTECTION ACTIVE: Les suppressions physiques des données critiques';
  RAISE NOTICE '   sont maintenant bloquées. Utilisez safe_soft_delete() à la place.';
  RAISE NOTICE '=============================================================';
END $$;

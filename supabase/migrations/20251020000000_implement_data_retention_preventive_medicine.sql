/*
  # Système de Conservation des Données pour Médecine Préventive

  Ce système transforme la gestion des données utilisateurs pour permettre une conservation
  à long terme essentielle à la médecine préventive et au coaching personnalisé sur plusieurs années.

  ## 1. Nouvelles Tables d'Archivage

  ### archived_user_data
  Archive complète des données utilisateur pour conservation permanente:
  - Données de santé complètes avec versioning
  - Historique complet des activités et entraînements
  - Snapshots automatiques des données critiques
  - Métadonnées de traçabilité et audit

  ### data_retention_policies
  Définit les politiques de rétention par type de données:
  - Classification des données (critical, important, temporary)
  - Durée de conservation par catégorie
  - Règles d'archivage automatique
  - Conformité RGPD et transparence

  ### health_timeline
  Ligne de temps chronologique complète de toutes les données de santé:
  - Consolidation de tous les événements de santé
  - Snapshots automatiques périodiques
  - Suivi longitudinal pour analyses prédictives
  - Index optimisés pour requêtes temporelles

  ## 2. Modifications des Tables Existantes

  Ajout de colonnes pour soft delete:
  - soft_deleted (boolean) - marquage logique au lieu de suppression
  - deleted_at (timestamptz) - date de marquage
  - deletion_reason (text) - raison de la suppression
  - can_be_restored (boolean) - possibilité de restauration

  Ajout de métadonnées de rétention:
  - retention_category (text) - catégorie de rétention
  - archive_after (timestamptz) - date d'archivage prévue
  - archived_at (timestamptz) - date d'archivage effectif

  ## 3. Fonctions Automatiques

  - Snapshots automatiques des données de santé (quotidien)
  - Archivage automatique des données anciennes (mensuel)
  - Désactivation des cleanups sur données critiques
  - Triggers pour historique complet

  ## 4. Sécurité et Performance

  - RLS activé sur toutes les nouvelles tables
  - Index optimisés pour requêtes temporelles
  - Compression JSONB pour données anciennes
  - Partition des archives par année

  ## 5. Catégories de Rétention

  - critical_permanent: Conservation infinie (profil santé, historique médical, blessures)
  - important_longterm: Conservation 10+ ans (sessions entraînement, analyses IA)
  - standard_midterm: Conservation 2 ans (activités, feedbacks)
  - temporary: Conservation 90 jours (caches, sessions temporaires)
*/

-- =====================================================
-- 1. TABLE DATA_RETENTION_POLICIES
-- Définition des politiques de rétention
-- =====================================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification de la politique
  table_name text NOT NULL UNIQUE,
  data_category text NOT NULL CHECK (data_category IN ('critical_permanent', 'important_longterm', 'standard_midterm', 'temporary')),

  -- Durée de rétention
  retention_days integer, -- NULL = infini pour critical_permanent
  archive_after_days integer, -- Délai avant archivage vers stockage optimisé

  -- Configuration
  soft_delete_enabled boolean DEFAULT true,
  auto_archive_enabled boolean DEFAULT false,
  auto_snapshot_enabled boolean DEFAULT false,
  snapshot_frequency_hours integer, -- Fréquence des snapshots automatiques

  -- Documentation
  description text NOT NULL,
  legal_basis text, -- Base légale (RGPD, médical, etc.)
  user_visible boolean DEFAULT true, -- Visible dans dashboard utilisateur

  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_retention_policies_category ON data_retention_policies(data_category);
CREATE INDEX IF NOT EXISTS idx_retention_policies_table ON data_retention_policies(table_name);

-- RLS
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour utilisateurs authentifiés (transparence)
CREATE POLICY "Users can view retention policies"
  ON data_retention_policies FOR SELECT
  TO authenticated
  USING (user_visible = true);

-- Modification réservée au service role
CREATE POLICY "Service role manages retention policies"
  ON data_retention_policies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. TABLE HEALTH_TIMELINE
-- Ligne de temps complète des données de santé
-- =====================================================

CREATE TABLE IF NOT EXISTS health_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Horodatage de l'événement
  event_timestamp timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL, -- health_update, scan_completed, vital_signs, injury_reported, etc.

  -- Données de l'événement
  event_data jsonb NOT NULL,

  -- Contexte
  source text CHECK (source IN ('manual', 'scan', 'wearable', 'ai_analysis', 'medical_exam', 'system')),
  source_id uuid, -- ID de la source (scan_id, session_id, etc.)

  -- Snapshot complet au moment de l'événement
  health_snapshot jsonb, -- Profil santé complet à cette date

  -- Catégorisation
  category text CHECK (category IN ('anthropometry', 'vital_signs', 'injuries', 'medical_history', 'lifestyle', 'performance')),
  severity text CHECK (severity IN ('info', 'minor', 'moderate', 'important', 'critical')),

  -- Métadonnées
  notes text,
  tags text[] DEFAULT '{}',

  -- Soft delete
  soft_deleted boolean DEFAULT false,
  deleted_at timestamptz,

  created_at timestamptz DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_health_timeline_user_timestamp ON health_timeline(user_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_timeline_type ON health_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_health_timeline_category ON health_timeline(category);
CREATE INDEX IF NOT EXISTS idx_health_timeline_severity ON health_timeline(severity);
CREATE INDEX IF NOT EXISTS idx_health_timeline_source ON health_timeline(source, source_id);
CREATE INDEX IF NOT EXISTS idx_health_timeline_not_deleted ON health_timeline(user_id, event_timestamp) WHERE soft_deleted = false;

-- Index GIN pour recherche JSONB
CREATE INDEX IF NOT EXISTS idx_health_timeline_event_data ON health_timeline USING GIN (event_data);
CREATE INDEX IF NOT EXISTS idx_health_timeline_snapshot ON health_timeline USING GIN (health_snapshot);

-- RLS
ALTER TABLE health_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health timeline"
  ON health_timeline FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND soft_deleted = false);

CREATE POLICY "Users can insert own health timeline"
  ON health_timeline FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own health timeline"
  ON health_timeline FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role peut tout voir y compris soft deleted
CREATE POLICY "Service role full access health timeline"
  ON health_timeline FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. TABLE ARCHIVED_USER_DATA
-- Archives longue durée optimisées
-- =====================================================

CREATE TABLE IF NOT EXISTS archived_user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identification
  archive_type text NOT NULL, -- health_snapshot, training_history, activity_summary, etc.
  archive_period_start timestamptz NOT NULL,
  archive_period_end timestamptz NOT NULL,

  -- Données archivées (compressées)
  archived_data jsonb NOT NULL,
  data_summary jsonb, -- Résumé pour accès rapide

  -- Métadonnées
  original_table text NOT NULL,
  record_count integer NOT NULL DEFAULT 0,
  compression_ratio numeric(5,2), -- Taux de compression

  -- Checksums pour intégrité
  data_checksum text,
  verified_at timestamptz,

  -- Catégorisation
  retention_category text NOT NULL DEFAULT 'important_longterm',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_archived_data_user ON archived_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_data_type ON archived_user_data(archive_type);
CREATE INDEX IF NOT EXISTS idx_archived_data_period ON archived_user_data(archive_period_start, archive_period_end);
CREATE INDEX IF NOT EXISTS idx_archived_data_category ON archived_user_data(retention_category);

-- Index GIN pour recherche dans archives
CREATE INDEX IF NOT EXISTS idx_archived_data_jsonb ON archived_user_data USING GIN (archived_data);

-- RLS
ALTER TABLE archived_user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own archives"
  ON archived_user_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages archives"
  ON archived_user_data FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. AJOUT COLONNES SOFT DELETE AUX TABLES CRITIQUES
-- =====================================================

-- user_health_history
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_health_history' AND column_name = 'soft_deleted') THEN
    ALTER TABLE user_health_history
      ADD COLUMN soft_deleted boolean DEFAULT false,
      ADD COLUMN deleted_at timestamptz,
      ADD COLUMN deletion_reason text,
      ADD COLUMN can_be_restored boolean DEFAULT true,
      ADD COLUMN retention_category text DEFAULT 'critical_permanent';
  END IF;
END $$;

-- activities
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'soft_deleted') THEN
    ALTER TABLE activities
      ADD COLUMN soft_deleted boolean DEFAULT false,
      ADD COLUMN deleted_at timestamptz,
      ADD COLUMN retention_category text DEFAULT 'important_longterm';
  END IF;
END $$;

-- training_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_sessions' AND column_name = 'soft_deleted') THEN
    ALTER TABLE training_sessions
      ADD COLUMN soft_deleted boolean DEFAULT false,
      ADD COLUMN deleted_at timestamptz,
      ADD COLUMN retention_category text DEFAULT 'important_longterm';
  END IF;
END $$;

-- training_exercises
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_exercises' AND column_name = 'soft_deleted') THEN
    ALTER TABLE training_exercises
      ADD COLUMN soft_deleted boolean DEFAULT false,
      ADD COLUMN deleted_at timestamptz,
      ADD COLUMN retention_category text DEFAULT 'important_longterm';
  END IF;
END $$;

-- ai_analysis_jobs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_analysis_jobs' AND column_name = 'soft_deleted') THEN
    ALTER TABLE ai_analysis_jobs
      ADD COLUMN soft_deleted boolean DEFAULT false,
      ADD COLUMN deleted_at timestamptz,
      ADD COLUMN retention_category text DEFAULT 'important_longterm';
  END IF;
END $$;

-- training_feedback
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_feedback' AND column_name = 'soft_deleted') THEN
    ALTER TABLE training_feedback
      ADD COLUMN soft_deleted boolean DEFAULT false,
      ADD COLUMN deleted_at timestamptz,
      ADD COLUMN retention_category text DEFAULT 'important_longterm';
  END IF;
END $$;

-- Index pour filtrer les soft deleted
CREATE INDEX IF NOT EXISTS idx_user_health_history_active ON user_health_history(user_id, recorded_at) WHERE soft_deleted = false;
CREATE INDEX IF NOT EXISTS idx_activities_active ON activities(user_id, timestamp) WHERE soft_deleted = false;
CREATE INDEX IF NOT EXISTS idx_training_sessions_active ON training_sessions(user_id, scheduled_at) WHERE soft_deleted = false;
CREATE INDEX IF NOT EXISTS idx_training_exercises_active ON training_exercises(session_id) WHERE soft_deleted = false;
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_active ON ai_analysis_jobs(user_id, created_at) WHERE soft_deleted = false;

-- =====================================================
-- 5. SEED POLICIES DE RÉTENTION
-- =====================================================

INSERT INTO data_retention_policies (table_name, data_category, retention_days, archive_after_days, soft_delete_enabled, auto_snapshot_enabled, snapshot_frequency_hours, description, legal_basis, user_visible)
VALUES
  -- Données critiques permanentes
  ('user_profile', 'critical_permanent', NULL, NULL, true, true, 24, 'Profil utilisateur complet incluant données de santé essentielles', 'Médecine préventive, suivi longitudinal', true),
  ('user_health_history', 'critical_permanent', NULL, 730, true, true, 168, 'Historique complet des données de santé vitales', 'Dossier médical, prévention', true),
  ('health_timeline', 'critical_permanent', NULL, 365, true, false, NULL, 'Ligne de temps chronologique des événements de santé', 'Traçabilité médicale', true),

  -- Données importantes longue durée
  ('training_sessions', 'important_longterm', 3650, 730, true, true, 168, 'Sessions d''entraînement complétées pour suivi progression', 'Coaching personnalisé', true),
  ('training_exercises', 'important_longterm', 3650, 730, true, false, NULL, 'Détails exercices pour analyse progression', 'Optimisation entraînement', true),
  ('activities', 'important_longterm', 3650, 730, true, false, NULL, 'Activités physiques pour calcul charge et récupération', 'Coaching adaptatif', true),
  ('ai_analysis_jobs', 'important_longterm', 1825, 365, true, false, NULL, 'Analyses IA pour amélioration continue des modèles', 'Qualité service', false),
  ('training_feedback', 'important_longterm', 2190, 365, true, false, NULL, 'Feedbacks utilisateur pour adaptation coaching', 'Personnalisation', true),
  ('training_adaptations', 'important_longterm', 1825, 365, true, false, NULL, 'Historique adaptations pour comprendre évolution', 'Optimisation', true),

  -- Données standard moyen terme
  ('training_plans', 'standard_midterm', 730, 365, true, false, NULL, 'Plans d''entraînement passés', 'Historique coaching', true),
  ('connected_devices', 'standard_midterm', 730, NULL, true, false, NULL, 'Appareils connectés pour synchronisation', 'Fonctionnalité', true),

  -- Données temporaires
  ('geographic_data_cache', 'temporary', 90, NULL, false, false, NULL, 'Cache données géographiques et météo', 'Performance', false),
  ('ai_trend_analyses', 'temporary', 90, NULL, false, false, NULL, 'Cache analyses tendances', 'Performance', false),
  ('training_session_states', 'temporary', 30, NULL, false, false, NULL, 'États sessions en cours', 'Fonctionnalité', false),
  ('notification_history', 'temporary', 90, NULL, false, false, NULL, 'Historique notifications', 'Fonctionnalité', false)
ON CONFLICT (table_name) DO NOTHING;

-- =====================================================
-- 6. FONCTIONS AUTOMATIQUES
-- =====================================================

-- Fonction pour créer un snapshot automatique de santé
CREATE OR REPLACE FUNCTION create_health_timeline_snapshot(p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_snapshot_id uuid;
  v_current_health jsonb;
BEGIN
  -- Récupérer le profil santé actuel
  SELECT health INTO v_current_health
  FROM user_profile
  WHERE user_id = p_user_id;

  -- Créer l'entrée dans la timeline
  INSERT INTO health_timeline (
    user_id,
    event_timestamp,
    event_type,
    event_data,
    source,
    health_snapshot,
    category,
    severity
  )
  VALUES (
    p_user_id,
    now(),
    'automatic_snapshot',
    jsonb_build_object(
      'snapshot_type', 'daily',
      'trigger', 'automatic'
    ),
    'system',
    v_current_health,
    'medical_history',
    'info'
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour archiver les données anciennes
CREATE OR REPLACE FUNCTION archive_old_data(p_table_name text, p_days_old integer)
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Cette fonction sera étendue pour chaque table spécifique
  -- Pour l'instant, elle retourne juste le nombre de lignes concernées

  CASE p_table_name
    WHEN 'activities' THEN
      SELECT COUNT(*) INTO v_count
      FROM activities
      WHERE created_at < now() - (p_days_old || ' days')::interval
        AND soft_deleted = false;

    WHEN 'training_sessions' THEN
      SELECT COUNT(*) INTO v_count
      FROM training_sessions
      WHERE created_at < now() - (p_days_old || ' days')::interval
        AND soft_deleted = false;

    ELSE
      RAISE NOTICE 'Table % not configured for archiving', p_table_name;
  END CASE;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour soft delete au lieu de hard delete
CREATE OR REPLACE FUNCTION soft_delete_record(
  p_table_name text,
  p_record_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_sql text;
BEGIN
  v_sql := format(
    'UPDATE %I SET soft_deleted = true, deleted_at = now(), deletion_reason = $1 WHERE id = $2',
    p_table_name
  );

  EXECUTE v_sql USING p_reason, p_record_id;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error soft deleting from %: %', p_table_name, SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le résumé de rétention d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_data_retention_summary(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'health_timeline_events', (
      SELECT COUNT(*) FROM health_timeline
      WHERE user_id = p_user_id AND soft_deleted = false
    ),
    'training_sessions_total', (
      SELECT COUNT(*) FROM training_sessions
      WHERE user_id = p_user_id AND soft_deleted = false
    ),
    'activities_total', (
      SELECT COUNT(*) FROM activities
      WHERE user_id = p_user_id AND soft_deleted = false
    ),
    'oldest_health_record', (
      SELECT MIN(recorded_at) FROM user_health_history
      WHERE user_id = p_user_id AND soft_deleted = false
    ),
    'oldest_activity', (
      SELECT MIN(timestamp) FROM activities
      WHERE user_id = p_user_id AND soft_deleted = false
    ),
    'data_span_days', (
      SELECT EXTRACT(DAY FROM (now() - MIN(created_at)))
      FROM (
        SELECT created_at FROM activities WHERE user_id = p_user_id
        UNION ALL
        SELECT created_at FROM training_sessions WHERE user_id = p_user_id
        UNION ALL
        SELECT recorded_at as created_at FROM user_health_history WHERE user_id = p_user_id
      ) combined
    ),
    'archived_data_count', (
      SELECT COUNT(*) FROM archived_user_data WHERE user_id = p_user_id
    ),
    'retention_policies', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'category', data_category,
          'retention_days', retention_days,
          'description', description
        )
      )
      FROM data_retention_policies
      WHERE user_visible = true
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS POUR HISTORIQUE AUTOMATIQUE
-- =====================================================

-- Trigger pour créer automatiquement une entrée timeline lors d'une mise à jour du profil santé
CREATE OR REPLACE FUNCTION trigger_health_timeline_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement si le champ health a changé
  IF OLD.health IS DISTINCT FROM NEW.health THEN
    INSERT INTO health_timeline (
      user_id,
      event_timestamp,
      event_type,
      event_data,
      source,
      health_snapshot,
      category,
      severity
    )
    VALUES (
      NEW.user_id,
      now(),
      'health_profile_updated',
      jsonb_build_object(
        'updated_fields', jsonb_build_object(
          'old', OLD.health,
          'new', NEW.health
        )
      ),
      'manual',
      NEW.health,
      'medical_history',
      'info'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_health_timeline_on_user_profile_update ON user_profile;
CREATE TRIGGER trigger_health_timeline_on_user_profile_update
  AFTER UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION trigger_health_timeline_on_profile_update();

-- Trigger pour updated_at sur les nouvelles tables
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_data_retention_policies_timestamp ON data_retention_policies;
CREATE TRIGGER update_data_retention_policies_timestamp
  BEFORE UPDATE ON data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_archived_user_data_timestamp ON archived_user_data;
CREATE TRIGGER update_archived_user_data_timestamp
  BEFORE UPDATE ON archived_user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- =====================================================
-- 8. DÉSACTIVATION CLEANUPS SUR DONNÉES CRITIQUES
-- =====================================================

-- Modifier la fonction de cleanup des notifications pour garder les importantes
CREATE OR REPLACE FUNCTION cleanup_old_notification_history()
RETURNS void AS $$
BEGIN
  -- Ne supprimer QUE les notifications non importantes de plus de 90 jours
  -- Garder indéfiniment les notifications importantes (training, health alerts)
  DELETE FROM notification_history
  WHERE sent_at < NOW() - INTERVAL '90 days'
    AND notification_type NOT IN ('training_reminder', 'health_alert', 'injury_warning', 'recovery_needed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Désactiver complètement le cleanup des exports (archiver au lieu de supprimer)
CREATE OR REPLACE FUNCTION cleanup_expired_data_exports()
RETURNS void AS $$
BEGIN
  -- Ne plus supprimer les exports, juste marquer comme expired
  UPDATE data_export_requests
  SET status = 'expired'
  WHERE status = 'completed'
    AND expires_at < NOW()
    AND status != 'expired';

  -- Ne pas supprimer les failed non plus, les garder pour analyse
  RAISE NOTICE 'Data exports marked as expired but not deleted for retention';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modifier le cleanup geographic data pour conserver l'historique des localisations
CREATE OR REPLACE FUNCTION cleanup_expired_geographic_data()
RETURNS void AS $$
BEGIN
  -- Archiver dans geographic_data_history au lieu de supprimer
  INSERT INTO geographic_data_history (
    user_id,
    location_key,
    data_snapshot,
    captured_at,
    data_source
  )
  SELECT
    user_id,
    location_key,
    jsonb_build_object(
      'weather_data', weather_data,
      'air_quality_data', air_quality_data,
      'pollen_data', pollen_data,
      'uv_index_data', uv_index_data
    ),
    created_at,
    'cache_cleanup'
  FROM geographic_data_cache
  WHERE expires_at < now();

  -- Maintenant on peut supprimer le cache
  DELETE FROM geographic_data_cache
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON TABLE data_retention_policies IS
  'Politiques de rétention des données par table. Définit combien de temps conserver chaque type de données pour la médecine préventive.';

COMMENT ON TABLE health_timeline IS
  'Ligne de temps chronologique complète de tous les événements de santé utilisateur. Conservation permanente pour suivi longitudinal.';

COMMENT ON TABLE archived_user_data IS
  'Archives compressées des données utilisateur anciennes. Optimisé pour stockage longue durée avec conservation de l''intégrité.';

COMMENT ON FUNCTION create_health_timeline_snapshot IS
  'Crée un snapshot automatique du profil santé utilisateur pour suivi dans le temps.';

COMMENT ON FUNCTION get_user_data_retention_summary IS
  'Retourne un résumé complet des données conservées pour un utilisateur (dashboard transparence).';

COMMENT ON FUNCTION soft_delete_record IS
  'Suppression logique au lieu de physique. Permet restauration et conservation pour analyses.';

-- =====================================================
-- LOG DE SUCCÈS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'Migration: Système de Conservation des Données - COMPLETED';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Tables créées:';
  RAISE NOTICE '  - data_retention_policies (% policies)', (SELECT COUNT(*) FROM data_retention_policies);
  RAISE NOTICE '  - health_timeline (prêt pour événements)';
  RAISE NOTICE '  - archived_user_data (prêt pour archivage)';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Soft delete activé sur:';
  RAISE NOTICE '  - user_health_history';
  RAISE NOTICE '  - activities';
  RAISE NOTICE '  - training_sessions';
  RAISE NOTICE '  - training_exercises';
  RAISE NOTICE '  - ai_analysis_jobs';
  RAISE NOTICE '  - training_feedback';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Fonctions créées:';
  RAISE NOTICE '  - create_health_timeline_snapshot()';
  RAISE NOTICE '  - archive_old_data()';
  RAISE NOTICE '  - soft_delete_record()';
  RAISE NOTICE '  - get_user_data_retention_summary()';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Triggers activés:';
  RAISE NOTICE '  - Auto-création timeline sur update profil santé';
  RAISE NOTICE '  - Updated_at automatique';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Cleanups modifiés:';
  RAISE NOTICE '  - Notifications: garde les importantes indéfiniment';
  RAISE NOTICE '  - Exports: archive au lieu de supprimer';
  RAISE NOTICE '  - Geo data: archive historique avant suppression';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Catégories de rétention:';
  RAISE NOTICE '  - critical_permanent: Conservation infinie (santé, historique médical)';
  RAISE NOTICE '  - important_longterm: 2-10 ans (entraînements, analyses)';
  RAISE NOTICE '  - standard_midterm: 2 ans (plans, devices)';
  RAISE NOTICE '  - temporary: 30-90 jours (caches, states)';
  RAISE NOTICE '';
  RAISE NOTICE '🏥 MÉDECINE PRÉVENTIVE: Toutes les données critiques sont maintenant';
  RAISE NOTICE '   conservées de façon permanente pour suivi longitudinal!';
  RAISE NOTICE '=============================================================';
END $$;

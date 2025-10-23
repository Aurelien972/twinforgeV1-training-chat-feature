/*
  # Enrichissement de la table Activities avec Métriques Wearables

  ## Description
  Cette migration enrichit la table `activities` existante avec des colonnes pour
  stocker les métriques biométriques provenant des objets connectés (montres, capteurs).

  ## Nouvelles Colonnes

  ### Données de Fréquence Cardiaque
  - `hr_avg` (integer): Fréquence cardiaque moyenne pendant l'activité
  - `hr_max` (integer): Fréquence cardiaque maximale atteinte
  - `hr_min` (integer): Fréquence cardiaque minimale enregistrée
  - `hr_resting_pre` (integer): Fréquence cardiaque au repos avant l'activité
  - `hr_recovery_1min` (integer): FC 1 minute après fin d'effort (indicateur de récupération)

  ### Distribution des Zones de Fréquence Cardiaque (Z1-Z5)
  - `hr_zone1_minutes` (integer): Temps en Zone 1 (50-60% FCmax) - Récupération active
  - `hr_zone2_minutes` (integer): Temps en Zone 2 (60-70% FCmax) - Endurance fondamentale
  - `hr_zone3_minutes` (integer): Temps en Zone 3 (70-80% FCmax) - Endurance active
  - `hr_zone4_minutes` (integer): Temps en Zone 4 (80-90% FCmax) - Seuil anaérobie
  - `hr_zone5_minutes` (integer): Temps en Zone 5 (90-100% FCmax) - Intensité maximale

  ### Variabilité de la Fréquence Cardiaque (HRV)
  - `hrv_pre_activity` (numeric): HRV avant l'activité (indicateur de récupération)
  - `hrv_post_activity` (numeric): HRV après l'activité
  - `hrv_avg_overnight` (numeric): HRV moyenne de la nuit précédente

  ### Métriques de Performance
  - `vo2max_estimated` (numeric): VO2max estimé (ml/kg/min)
  - `training_load_score` (numeric): Score de charge d'entraînement (TRIMP ou TSS)
  - `efficiency_score` (numeric): Score d'efficience (vitesse/puissance par battement)
  - `fatigue_index` (numeric): Index de fatigue (0-100, basé sur HRV + charge cumulée)

  ### Métriques de Distance et Mouvement
  - `distance_meters` (numeric): Distance parcourue en mètres
  - `avg_pace` (text): Allure moyenne (format MM:SS/km)
  - `avg_speed_kmh` (numeric): Vitesse moyenne (km/h)
  - `elevation_gain_meters` (numeric): Dénivelé positif accumulé
  - `elevation_loss_meters` (numeric): Dénivelé négatif accumulé

  ### Métriques de Cadence et Puissance
  - `avg_cadence_rpm` (numeric): Cadence moyenne (pas/min pour course, rpm pour vélo)
  - `max_cadence_rpm` (numeric): Cadence maximale
  - `avg_power_watts` (numeric): Puissance moyenne (vélo, course)
  - `max_power_watts` (numeric): Puissance maximale
  - `normalized_power` (numeric): Puissance normalisée (NP pour cyclisme)

  ### Métriques de Récupération et Sommeil
  - `sleep_quality_score` (numeric): Score de qualité du sommeil de la nuit précédente (0-100)
  - `sleep_duration_hours` (numeric): Durée de sommeil la nuit précédente
  - `recovery_score` (numeric): Score de récupération global (0-100)
  - `stress_level_pre` (numeric): Niveau de stress avant l'activité (0-100)
  - `body_battery_pre` (numeric): Énergie corporelle avant l'activité (Garmin Body Battery)

  ### Métadonnées Wearable
  - `wearable_device_id` (uuid): Référence à l'appareil connecté source
  - `wearable_activity_id` (text): ID de l'activité chez le provider
  - `wearable_synced_at` (timestamptz): Date de synchronisation des données wearable
  - `wearable_raw_data` (jsonb): Données brutes complètes du wearable pour debugging

  ### Indicateurs de Qualité
  - `data_completeness_score` (numeric): Score de complétude des données (0-100)
  - `gps_accuracy_meters` (numeric): Précision GPS moyenne (mètres)
  - `sensor_quality_score` (numeric): Score de qualité des capteurs (0-100)

  ## Calculs Automatiques

  La migration inclut une fonction trigger `calculate_derived_wearable_metrics()`
  qui calcule automatiquement certaines métriques dérivées:
  - `efficiency_score`: calculé à partir de vitesse/FC moyenne
  - `data_completeness_score`: pourcentage de champs wearable remplis
  - `training_load_score`: TRIMP basé sur zones HR et durée

  ## Index de Performance

  - Index sur wearable_device_id pour requêtes par appareil
  - Index sur hr_avg pour analyses de tendances FC
  - Index sur vo2max_estimated pour suivi de progression
  - Index sur wearable_synced_at pour données récentes

  ## Sécurité

  - Toutes les colonnes sont nullables (compatibilité avec activités manuelles)
  - Les politiques RLS existantes continuent de s'appliquer
  - Pas de modification des permissions

  ## Notes Importantes

  - **Rétrocompatibilité totale**: Les activités existantes sans données wearable
    conservent NULL dans tous les nouveaux champs
  - **Progressif**: Les utilisateurs sans objets connectés ne sont pas impactés
  - **Extensible**: Nouvelles métriques peuvent être ajoutées facilement
*/

-- =====================================================
-- 1. AJOUT DES COLONNES À LA TABLE ACTIVITIES
-- =====================================================

-- Données de Fréquence Cardiaque
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS hr_avg INTEGER CHECK (hr_avg >= 30 AND hr_avg <= 250),
ADD COLUMN IF NOT EXISTS hr_max INTEGER CHECK (hr_max >= 30 AND hr_max <= 250),
ADD COLUMN IF NOT EXISTS hr_min INTEGER CHECK (hr_min >= 30 AND hr_min <= 250),
ADD COLUMN IF NOT EXISTS hr_resting_pre INTEGER CHECK (hr_resting_pre >= 30 AND hr_resting_pre <= 120),
ADD COLUMN IF NOT EXISTS hr_recovery_1min INTEGER CHECK (hr_recovery_1min >= 30 AND hr_recovery_1min <= 200);

-- Distribution des Zones de Fréquence Cardiaque
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS hr_zone1_minutes INTEGER CHECK (hr_zone1_minutes >= 0 AND hr_zone1_minutes <= 600),
ADD COLUMN IF NOT EXISTS hr_zone2_minutes INTEGER CHECK (hr_zone2_minutes >= 0 AND hr_zone2_minutes <= 600),
ADD COLUMN IF NOT EXISTS hr_zone3_minutes INTEGER CHECK (hr_zone3_minutes >= 0 AND hr_zone3_minutes <= 600),
ADD COLUMN IF NOT EXISTS hr_zone4_minutes INTEGER CHECK (hr_zone4_minutes >= 0 AND hr_zone4_minutes <= 600),
ADD COLUMN IF NOT EXISTS hr_zone5_minutes INTEGER CHECK (hr_zone5_minutes >= 0 AND hr_zone5_minutes <= 600);

-- Variabilité de la Fréquence Cardiaque (HRV)
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS hrv_pre_activity NUMERIC(6, 2) CHECK (hrv_pre_activity >= 0 AND hrv_pre_activity <= 200),
ADD COLUMN IF NOT EXISTS hrv_post_activity NUMERIC(6, 2) CHECK (hrv_post_activity >= 0 AND hrv_post_activity <= 200),
ADD COLUMN IF NOT EXISTS hrv_avg_overnight NUMERIC(6, 2) CHECK (hrv_avg_overnight >= 0 AND hrv_avg_overnight <= 200);

-- Métriques de Performance
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS vo2max_estimated NUMERIC(5, 2) CHECK (vo2max_estimated >= 10 AND vo2max_estimated <= 100),
ADD COLUMN IF NOT EXISTS training_load_score NUMERIC(8, 2) CHECK (training_load_score >= 0 AND training_load_score <= 1000),
ADD COLUMN IF NOT EXISTS efficiency_score NUMERIC(6, 2) CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
ADD COLUMN IF NOT EXISTS fatigue_index NUMERIC(5, 2) CHECK (fatigue_index >= 0 AND fatigue_index <= 100);

-- Métriques de Distance et Mouvement
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS distance_meters NUMERIC(10, 2) CHECK (distance_meters >= 0),
ADD COLUMN IF NOT EXISTS avg_pace TEXT, -- Format MM:SS/km
ADD COLUMN IF NOT EXISTS avg_speed_kmh NUMERIC(6, 2) CHECK (avg_speed_kmh >= 0 AND avg_speed_kmh <= 100),
ADD COLUMN IF NOT EXISTS elevation_gain_meters NUMERIC(8, 2) CHECK (elevation_gain_meters >= 0),
ADD COLUMN IF NOT EXISTS elevation_loss_meters NUMERIC(8, 2) CHECK (elevation_loss_meters >= 0);

-- Métriques de Cadence et Puissance
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS avg_cadence_rpm NUMERIC(6, 2) CHECK (avg_cadence_rpm >= 0 AND avg_cadence_rpm <= 300),
ADD COLUMN IF NOT EXISTS max_cadence_rpm NUMERIC(6, 2) CHECK (max_cadence_rpm >= 0 AND max_cadence_rpm <= 300),
ADD COLUMN IF NOT EXISTS avg_power_watts NUMERIC(7, 2) CHECK (avg_power_watts >= 0 AND avg_power_watts <= 2000),
ADD COLUMN IF NOT EXISTS max_power_watts NUMERIC(7, 2) CHECK (max_power_watts >= 0 AND max_power_watts <= 3000),
ADD COLUMN IF NOT EXISTS normalized_power NUMERIC(7, 2) CHECK (normalized_power >= 0 AND normalized_power <= 2000);

-- Métriques de Récupération et Sommeil
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS sleep_quality_score NUMERIC(5, 2) CHECK (sleep_quality_score >= 0 AND sleep_quality_score <= 100),
ADD COLUMN IF NOT EXISTS sleep_duration_hours NUMERIC(4, 2) CHECK (sleep_duration_hours >= 0 AND sleep_duration_hours <= 24),
ADD COLUMN IF NOT EXISTS recovery_score NUMERIC(5, 2) CHECK (recovery_score >= 0 AND recovery_score <= 100),
ADD COLUMN IF NOT EXISTS stress_level_pre NUMERIC(5, 2) CHECK (stress_level_pre >= 0 AND stress_level_pre <= 100),
ADD COLUMN IF NOT EXISTS body_battery_pre NUMERIC(5, 2) CHECK (body_battery_pre >= 0 AND body_battery_pre <= 100);

-- Métadonnées Wearable
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS wearable_device_id UUID REFERENCES public.connected_devices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS wearable_activity_id TEXT,
ADD COLUMN IF NOT EXISTS wearable_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wearable_raw_data JSONB;

-- Indicateurs de Qualité
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS data_completeness_score NUMERIC(5, 2) CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
ADD COLUMN IF NOT EXISTS gps_accuracy_meters NUMERIC(6, 2) CHECK (gps_accuracy_meters >= 0),
ADD COLUMN IF NOT EXISTS sensor_quality_score NUMERIC(5, 2) CHECK (sensor_quality_score >= 0 AND sensor_quality_score <= 100);

-- =====================================================
-- 2. INDEX DE PERFORMANCE
-- =====================================================

-- Index pour requêtes par appareil connecté
CREATE INDEX IF NOT EXISTS idx_activities_wearable_device
  ON public.activities(wearable_device_id)
  WHERE wearable_device_id IS NOT NULL;

-- Index pour analyses de FC moyenne
CREATE INDEX IF NOT EXISTS idx_activities_hr_avg
  ON public.activities(user_id, hr_avg)
  WHERE hr_avg IS NOT NULL;

-- Index pour suivi de VO2max
CREATE INDEX IF NOT EXISTS idx_activities_vo2max
  ON public.activities(user_id, vo2max_estimated, timestamp DESC)
  WHERE vo2max_estimated IS NOT NULL;

-- Index pour synchronisations récentes
CREATE INDEX IF NOT EXISTS idx_activities_wearable_synced
  ON public.activities(user_id, wearable_synced_at DESC)
  WHERE wearable_synced_at IS NOT NULL;

-- Index pour recherche d'activités avec zones HR
CREATE INDEX IF NOT EXISTS idx_activities_hr_zones
  ON public.activities(user_id, timestamp DESC)
  WHERE hr_zone1_minutes IS NOT NULL OR hr_zone2_minutes IS NOT NULL;

-- Index pour score de récupération
CREATE INDEX IF NOT EXISTS idx_activities_recovery
  ON public.activities(user_id, recovery_score, timestamp DESC)
  WHERE recovery_score IS NOT NULL;

-- =====================================================
-- 3. FONCTION DE CALCUL DES MÉTRIQUES DÉRIVÉES
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_derived_wearable_metrics()
RETURNS TRIGGER AS $$
DECLARE
  total_wearable_fields INTEGER := 30; -- Nombre total de champs wearable
  filled_wearable_fields INTEGER := 0;
  calculated_trimp NUMERIC;
  calculated_efficiency NUMERIC;
BEGIN
  -- Calculer le score de complétude des données
  IF NEW.hr_avg IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.hr_max IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.hr_min IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.hr_zone1_minutes IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.hr_zone2_minutes IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.hr_zone3_minutes IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.hr_zone4_minutes IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.hr_zone5_minutes IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.hrv_pre_activity IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.vo2max_estimated IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.distance_meters IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.avg_pace IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.avg_speed_kmh IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.elevation_gain_meters IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.avg_cadence_rpm IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.avg_power_watts IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.sleep_quality_score IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;
  IF NEW.recovery_score IS NOT NULL THEN filled_wearable_fields := filled_wearable_fields + 1; END IF;

  NEW.data_completeness_score := ROUND((filled_wearable_fields::NUMERIC / total_wearable_fields::NUMERIC) * 100, 2);

  -- Calculer le Training Load Score (TRIMP simplifié)
  IF NEW.hr_zone1_minutes IS NOT NULL OR NEW.hr_zone2_minutes IS NOT NULL THEN
    calculated_trimp :=
      COALESCE(NEW.hr_zone1_minutes, 0) * 1.0 +
      COALESCE(NEW.hr_zone2_minutes, 0) * 2.0 +
      COALESCE(NEW.hr_zone3_minutes, 0) * 3.0 +
      COALESCE(NEW.hr_zone4_minutes, 0) * 4.0 +
      COALESCE(NEW.hr_zone5_minutes, 0) * 5.0;

    NEW.training_load_score := ROUND(calculated_trimp, 2);
  END IF;

  -- Calculer l'Efficiency Score (vitesse par battement de coeur)
  IF NEW.avg_speed_kmh IS NOT NULL AND NEW.hr_avg IS NOT NULL AND NEW.hr_avg > 0 THEN
    calculated_efficiency := (NEW.avg_speed_kmh / NEW.hr_avg) * 1000;
    NEW.efficiency_score := ROUND(LEAST(calculated_efficiency, 100), 2);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour calcul automatique
DROP TRIGGER IF EXISTS trigger_calculate_wearable_metrics ON public.activities;
CREATE TRIGGER trigger_calculate_wearable_metrics
  BEFORE INSERT OR UPDATE ON public.activities
  FOR EACH ROW
  WHEN (
    NEW.hr_avg IS NOT NULL OR
    NEW.hr_zone1_minutes IS NOT NULL OR
    NEW.avg_speed_kmh IS NOT NULL
  )
  EXECUTE FUNCTION public.calculate_derived_wearable_metrics();

-- =====================================================
-- 4. VUE MATÉRIALISÉE POUR ANALYSES RAPIDES
-- =====================================================

-- Vue pour agréger les métriques wearable par utilisateur
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_user_wearable_stats AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE wearable_device_id IS NOT NULL) as total_wearable_activities,
  ROUND(AVG(hr_avg), 0) as avg_heart_rate,
  ROUND(AVG(vo2max_estimated), 2) as avg_vo2max,
  ROUND(AVG(recovery_score), 2) as avg_recovery_score,
  ROUND(AVG(training_load_score), 2) as avg_training_load,
  ROUND(AVG(data_completeness_score), 2) as avg_data_completeness,
  MAX(timestamp) as last_wearable_activity_at
FROM public.activities
WHERE wearable_device_id IS NOT NULL
GROUP BY user_id;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_wearable_stats_user
  ON public.mv_user_wearable_stats(user_id);

-- Fonction pour rafraîchir la vue matérialisée
CREATE OR REPLACE FUNCTION public.refresh_wearable_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_wearable_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.activities.hr_avg IS 'Fréquence cardiaque moyenne (bpm)';
COMMENT ON COLUMN public.activities.hr_max IS 'Fréquence cardiaque maximale (bpm)';
COMMENT ON COLUMN public.activities.hr_zone1_minutes IS 'Temps en Zone 1 (50-60% FCmax) - Récupération';
COMMENT ON COLUMN public.activities.hr_zone2_minutes IS 'Temps en Zone 2 (60-70% FCmax) - Endurance';
COMMENT ON COLUMN public.activities.hr_zone3_minutes IS 'Temps en Zone 3 (70-80% FCmax) - Tempo';
COMMENT ON COLUMN public.activities.hr_zone4_minutes IS 'Temps en Zone 4 (80-90% FCmax) - Seuil';
COMMENT ON COLUMN public.activities.hr_zone5_minutes IS 'Temps en Zone 5 (90-100% FCmax) - VO2max';
COMMENT ON COLUMN public.activities.hrv_pre_activity IS 'HRV avant activité (ms) - Indicateur de récupération';
COMMENT ON COLUMN public.activities.vo2max_estimated IS 'VO2max estimé (ml/kg/min)';
COMMENT ON COLUMN public.activities.training_load_score IS 'Score de charge d entraînement (TRIMP)';
COMMENT ON COLUMN public.activities.efficiency_score IS 'Score d efficience (vitesse/FC)';
COMMENT ON COLUMN public.activities.recovery_score IS 'Score de récupération global (0-100)';
COMMENT ON COLUMN public.activities.data_completeness_score IS 'Score de complétude des données wearable (0-100)';

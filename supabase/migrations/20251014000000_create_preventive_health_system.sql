/*
  # Système de Santé Préventive - Extension Health Profile

  1. Nouvelles Tables
    - `country_health_data` - Données sanitaires enrichies par pays
      - `country_code` (text, primary key) - Code ISO du pays
      - `country_name` (text) - Nom du pays
      - `climate_data` (jsonb) - Données climatiques
      - `endemic_diseases` (text[]) - Maladies endémiques
      - `vaccination_requirements` (jsonb) - Vaccinations recommandées
      - `health_risks` (jsonb) - Risques sanitaires spécifiques
      - `air_quality_index` (numeric) - Indice qualité de l'air
      - `common_deficiencies` (text[]) - Carences nutritionnelles communes
      - `last_updated` (timestamptz) - Dernière mise à jour des données
      - `data_source` (text) - Source des données (WHO, REST Countries, etc.)

    - `user_health_history` - Historique des données de santé
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK auth.users)
      - `recorded_at` (timestamptz) - Date d'enregistrement
      - `vital_signs` (jsonb) - Constantes vitales
      - `health_snapshot` (jsonb) - Snapshot complet santé à cette date
      - `notes` (text) - Notes médicales

  2. Modifications
    - Extension du champ `health` dans `user_profile` avec nouvelle structure enrichie
    - Ajout de champs pour données contextuelles et environnementales

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques restrictives pour données sensibles
    - Chiffrement recommandé côté application pour données médicales critiques

  4. Structure Health Enrichie (JSONB)
    ```json
    {
      "version": "2.0",
      "basic": {
        "bloodType": "A+",
        "height_cm": 175,
        "weight_kg": 70
      },
      "medical_history": {
        "conditions": ["string"],
        "medications": ["string"],
        "allergies": ["string"],
        "surgeries": [{"date": "ISO", "type": "string", "details": "string"}],
        "hospitalizations": [{"date": "ISO", "reason": "string", "duration_days": 0}],
        "chronic_diseases": ["string"],
        "family_history": {
          "cardiovascular": boolean,
          "diabetes": boolean,
          "cancer": ["type"],
          "genetic_conditions": ["string"]
        }
      },
      "vaccinations": {
        "up_to_date": boolean,
        "records": [{"name": "string", "date": "ISO", "next_due": "ISO", "required": boolean}]
      },
      "vital_signs": {
        "blood_pressure_systolic": 120,
        "blood_pressure_diastolic": 80,
        "resting_heart_rate": 60,
        "blood_glucose_mg_dl": 90,
        "last_measured": "ISO"
      },
      "lifestyle": {
        "smoking_status": "never|former|current",
        "smoking_years": 0,
        "alcohol_frequency": "never|occasional|moderate|frequent",
        "sleep_hours_avg": 7,
        "stress_level": 1-10,
        "physical_activity_level": "sedentary|light|moderate|active|athlete"
      },
      "reproductive_health": {
        "menstrual_cycle_regular": boolean,
        "pregnancy_history": [],
        "menopause_status": "pre|peri|post"
      },
      "mental_health": {
        "conditions": ["string"],
        "therapy": boolean,
        "medications": ["string"]
      },
      "medical_devices": {
        "implants": ["string"],
        "devices": ["pacemaker", "insulin_pump", "prosthesis"]
      },
      "physical_limitations": ["string"],
      "last_checkup_date": "ISO",
      "next_checkup_due": "ISO",
      "declaredNoIssues": boolean
    }
    ```
*/

-- =====================================================
-- 1. TABLE COUNTRY_HEALTH_DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS country_health_data (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,

  -- Données climatiques
  climate_data JSONB DEFAULT '{
    "avg_temperature_celsius": null,
    "avg_humidity_percent": null,
    "avg_rainfall_mm": null,
    "climate_zones": [],
    "seasons": []
  }'::jsonb,

  -- Données épidémiologiques
  endemic_diseases TEXT[] DEFAULT '{}',
  epidemic_alerts JSONB DEFAULT '[]'::jsonb,

  -- Vaccinations
  vaccination_requirements JSONB DEFAULT '{
    "required": [],
    "recommended": [],
    "seasonal": []
  }'::jsonb,

  -- Risques sanitaires
  health_risks JSONB DEFAULT '{
    "vector_borne_diseases": [],
    "waterborne_diseases": [],
    "foodborne_risks": [],
    "environmental_hazards": []
  }'::jsonb,

  -- Qualité environnementale
  air_quality_index NUMERIC,
  water_quality_score NUMERIC,
  pollution_level TEXT CHECK (pollution_level IN ('low', 'moderate', 'high', 'severe')),

  -- Carences nutritionnelles
  common_deficiencies TEXT[] DEFAULT '{}',

  -- Métadonnées
  last_updated TIMESTAMPTZ DEFAULT now(),
  data_source TEXT,
  api_response_cache JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche par nom de pays
CREATE INDEX IF NOT EXISTS idx_country_health_name ON country_health_data(country_name);

-- Index pour données récentes
CREATE INDEX IF NOT EXISTS idx_country_health_updated ON country_health_data(last_updated DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_country_health_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_country_health_data_timestamp ON country_health_data;
CREATE TRIGGER update_country_health_data_timestamp
  BEFORE UPDATE ON country_health_data
  FOR EACH ROW
  EXECUTE FUNCTION update_country_health_timestamp();

-- =====================================================
-- 2. TABLE USER_HEALTH_HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS user_health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timestamp de l'enregistrement
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constantes vitales au moment de l'enregistrement
  vital_signs JSONB DEFAULT '{
    "blood_pressure_systolic": null,
    "blood_pressure_diastolic": null,
    "resting_heart_rate": null,
    "blood_glucose_mg_dl": null,
    "weight_kg": null,
    "bmi": null,
    "body_fat_percentage": null,
    "temperature_celsius": null
  }'::jsonb,

  -- Snapshot complet du profil santé à cette date
  health_snapshot JSONB NOT NULL,

  -- Notes et contexte
  notes TEXT,
  source TEXT CHECK (source IN ('manual', 'wearable', 'medical_exam', 'scan', 'ai_analysis')),

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour requêtes par utilisateur et date
CREATE INDEX IF NOT EXISTS idx_health_history_user ON user_health_history(user_id, recorded_at DESC);

-- Index pour recherche par source
CREATE INDEX IF NOT EXISTS idx_health_history_source ON user_health_history(source)
  WHERE source IS NOT NULL;

-- =====================================================
-- 3. EXTENSION USER_PROFILE POUR HEALTH V2
-- =====================================================

-- Ajouter une colonne pour indiquer la version du schéma health
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'health_schema_version'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN health_schema_version TEXT DEFAULT '1.0';
  END IF;
END $$;

-- Ajouter une colonne pour les données de pays enrichies (cache)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'country_health_cache'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN country_health_cache JSONB;
  END IF;
END $$;

-- Ajouter une colonne pour la date du dernier enrichissement
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'health_enriched_at'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN health_enriched_at TIMESTAMPTZ;
  END IF;
END $$;

-- Index pour recherche par version de schéma
CREATE INDEX IF NOT EXISTS idx_user_profile_health_version
  ON user_profile(health_schema_version);

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

-- RLS sur country_health_data (lecture publique pour utilisateurs authentifiés)
ALTER TABLE country_health_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read country health data"
  ON country_health_data FOR SELECT
  TO authenticated
  USING (true);

-- Seuls les admins peuvent modifier (pour future admin interface)
CREATE POLICY "Only service role can modify country health data"
  ON country_health_data FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS sur user_health_history (privé par utilisateur)
ALTER TABLE user_health_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own health history"
  ON user_health_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health history"
  ON user_health_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health history"
  ON user_health_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health history"
  ON user_health_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour créer un snapshot d'historique automatiquement
CREATE OR REPLACE FUNCTION create_health_snapshot(p_user_id UUID, p_source TEXT DEFAULT 'manual')
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_current_health JSONB;
  v_current_vitals JSONB;
BEGIN
  -- Récupérer le profil santé actuel
  SELECT health INTO v_current_health
  FROM user_profile
  WHERE user_id = p_user_id;

  -- Extraire les constantes vitales si disponibles
  v_current_vitals := COALESCE(v_current_health->'vital_signs', '{}'::jsonb);

  -- Créer l'entrée d'historique
  INSERT INTO user_health_history (user_id, health_snapshot, vital_signs, source)
  VALUES (p_user_id, v_current_health, v_current_vitals, p_source)
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer le score de santé préventive (0-100)
CREATE OR REPLACE FUNCTION calculate_preventive_health_score(p_health JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_max_score INTEGER := 100;
BEGIN
  -- Score basé sur la complétude des données critiques

  -- Informations de base (20 points)
  IF p_health ? 'basic' THEN
    IF (p_health->'basic'->>'bloodType') IS NOT NULL THEN v_score := v_score + 5; END IF;
    IF (p_health->'basic'->>'height_cm')::numeric > 0 THEN v_score := v_score + 5; END IF;
    IF (p_health->'basic'->>'weight_kg')::numeric > 0 THEN v_score := v_score + 10; END IF;
  END IF;

  -- Historique médical (25 points)
  IF p_health ? 'medical_history' THEN
    IF jsonb_array_length(COALESCE(p_health->'medical_history'->'conditions', '[]'::jsonb)) >= 0 THEN
      v_score := v_score + 10;
    END IF;
    IF p_health->'medical_history' ? 'family_history' THEN v_score := v_score + 15; END IF;
  END IF;

  -- Vaccinations (15 points)
  IF p_health ? 'vaccinations' THEN
    IF (p_health->'vaccinations'->>'up_to_date')::boolean IS NOT NULL THEN
      v_score := v_score + 15;
    END IF;
  END IF;

  -- Constantes vitales (20 points)
  IF p_health ? 'vital_signs' THEN
    IF (p_health->'vital_signs'->>'blood_pressure_systolic')::numeric > 0 THEN
      v_score := v_score + 10;
    END IF;
    IF (p_health->'vital_signs'->>'resting_heart_rate')::numeric > 0 THEN
      v_score := v_score + 10;
    END IF;
  END IF;

  -- Style de vie (20 points)
  IF p_health ? 'lifestyle' THEN
    IF (p_health->'lifestyle'->>'smoking_status') IS NOT NULL THEN v_score := v_score + 5; END IF;
    IF (p_health->'lifestyle'->>'sleep_hours_avg')::numeric > 0 THEN v_score := v_score + 5; END IF;
    IF (p_health->'lifestyle'->>'stress_level')::numeric > 0 THEN v_score := v_score + 5; END IF;
    IF (p_health->'lifestyle'->>'physical_activity_level') IS NOT NULL THEN v_score := v_score + 5; END IF;
  END IF;

  RETURN LEAST(v_score, v_max_score);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 6. SEED DATA - Quelques pays prioritaires
-- =====================================================

-- Insérer les données de base pour les principaux pays francophones
INSERT INTO country_health_data (country_code, country_name, last_updated, data_source)
VALUES
  ('FR', 'France', now(), 'manual_seed'),
  ('BE', 'Belgique', now(), 'manual_seed'),
  ('CH', 'Suisse', now(), 'manual_seed'),
  ('CA', 'Canada', now(), 'manual_seed'),
  ('MA', 'Maroc', now(), 'manual_seed'),
  ('TN', 'Tunisie', now(), 'manual_seed'),
  ('SN', 'Sénégal', now(), 'manual_seed'),
  ('CI', 'Côte d''Ivoire', now(), 'manual_seed')
ON CONFLICT (country_code) DO NOTHING;

-- =====================================================
-- 7. COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON TABLE country_health_data IS 'Données sanitaires enrichies par pays pour médecine préventive';
COMMENT ON TABLE user_health_history IS 'Historique temporel des données de santé utilisateur';
COMMENT ON COLUMN user_profile.health_schema_version IS 'Version du schéma health (1.0=basic, 2.0=enriched)';
COMMENT ON COLUMN user_profile.country_health_cache IS 'Cache des données sanitaires du pays de l''utilisateur';
COMMENT ON COLUMN user_profile.health_enriched_at IS 'Date du dernier enrichissement automatique des données santé';

-- Log de succès
DO $$
BEGIN
  RAISE NOTICE 'Migration preventive health system completed successfully';
  RAISE NOTICE '  - Table country_health_data created with % seed countries',
    (SELECT COUNT(*) FROM country_health_data);
  RAISE NOTICE '  - Table user_health_history created';
  RAISE NOTICE '  - Extended user_profile with health v2 support';
  RAISE NOTICE '  - RLS policies configured for data security';
END $$;

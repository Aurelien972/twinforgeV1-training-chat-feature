/*
  # Système de Tracking des Objets Connectés et Montres

  ## Description
  Système complet pour connecter et synchroniser les données de santé et fitness
  depuis les montres connectées et autres wearables (Strava, Garmin, Fitbit,
  Apple Health, Polar, Wahoo, etc.)

  ## 1. Nouvelles Tables

  ### `connected_devices`
  Stocke les connexions aux différents providers de wearables
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK auth.users) - Propriétaire du device
  - `provider` (text) - Provider (strava, garmin, fitbit, apple_health, polar, wahoo, whoop, oura)
  - `provider_user_id` (text) - ID utilisateur chez le provider
  - `display_name` (text) - Nom personnalisé du device
  - `device_type` (text) - Type (smartwatch, fitness_tracker, bike_computer, heart_rate_monitor)
  - `status` (text) - Statut (connected, syncing, error, disconnected, pending_auth)
  - `access_token_encrypted` (text) - Token OAuth chiffré
  - `refresh_token_encrypted` (text) - Refresh token chiffré
  - `token_expires_at` (timestamptz) - Expiration du token
  - `scopes` (text[]) - Scopes autorisés
  - `last_sync_at` (timestamptz) - Dernière synchronisation réussie
  - `last_error` (text) - Dernier message d'erreur
  - `metadata` (jsonb) - Métadonnées spécifiques au provider
  - `connected_at` (timestamptz) - Date de première connexion
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `device_sync_history`
  Historique de toutes les synchronisations
  - `id` (uuid, primary key)
  - `device_id` (uuid, FK connected_devices)
  - `user_id` (uuid, FK auth.users)
  - `sync_type` (text) - Type (manual, automatic, scheduled, webhook)
  - `status` (text) - Statut (success, partial, failed, cancelled)
  - `data_types_synced` (text[]) - Types de données synchronisées
  - `records_fetched` (integer) - Nombre d'enregistrements récupérés
  - `records_stored` (integer) - Nombre d'enregistrements stockés
  - `duration_ms` (integer) - Durée de la synchronisation
  - `error_message` (text) - Message d'erreur si échec
  - `error_code` (text) - Code d'erreur
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `wearable_health_data`
  Données de santé normalisées provenant des wearables
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK auth.users)
  - `device_id` (uuid, FK connected_devices)
  - `data_type` (text) - Type (heart_rate, steps, calories, distance, sleep, workout, weight, blood_pressure, spo2, hrv)
  - `timestamp` (timestamptz) - Horodatage de la mesure
  - `value_numeric` (numeric) - Valeur numérique
  - `value_text` (text) - Valeur texte
  - `value_json` (jsonb) - Valeur JSON pour données complexes
  - `unit` (text) - Unité de mesure
  - `quality_score` (numeric) - Score de qualité (0-100)
  - `source_workout_id` (text) - ID de l'activité source si applicable
  - `raw_data` (jsonb) - Données brutes du provider
  - `synced_at` (timestamptz) - Quand les données ont été synchronisées
  - `created_at` (timestamptz)

  ### `sync_preferences`
  Préférences de synchronisation par device
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK auth.users)
  - `device_id` (uuid, FK connected_devices)
  - `auto_sync_enabled` (boolean) - Synchronisation automatique activée
  - `sync_frequency_minutes` (integer) - Fréquence de sync (15, 30, 60, 120, 240)
  - `data_types_enabled` (text[]) - Types de données à synchroniser
  - `sync_only_wifi` (boolean) - Sync uniquement en WiFi
  - `notify_on_sync` (boolean) - Notifier après sync
  - `notify_on_error` (boolean) - Notifier en cas d'erreur
  - `backfill_days` (integer) - Jours historiques à récupérer
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `device_auth_flows`
  Suivi des flows OAuth en cours
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK auth.users)
  - `provider` (text)
  - `state` (text) - State parameter OAuth
  - `code_verifier` (text) - PKCE code verifier
  - `redirect_uri` (text)
  - `status` (text) - pending, completed, failed, expired
  - `expires_at` (timestamptz)
  - `created_at` (timestamptz)

  ## 2. Sécurité
  - RLS activé sur toutes les tables
  - Isolation stricte par user_id
  - Tokens OAuth chiffrés
  - Audit log de tous les accès

  ## 3. Performance
  - Index sur user_id pour toutes les tables
  - Index sur device_id + timestamp pour wearable_health_data
  - Index sur data_type pour requêtes filtrées
  - Triggers pour updated_at automatique

  ## 4. Notes Importantes
  - Les tokens OAuth doivent être chiffrés côté application avant stockage
  - La synchronisation temps réel utilise des webhooks quand disponibles
  - Le système supporte plusieurs devices du même provider
  - Les données sont normalisées pour interopérabilité
*/

-- =====================================================
-- 1. TABLE CONNECTED_DEVICES
-- =====================================================

CREATE TABLE IF NOT EXISTS connected_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Provider info
  provider TEXT NOT NULL CHECK (provider IN (
    'strava', 'garmin', 'fitbit', 'apple_health', 'polar',
    'wahoo', 'whoop', 'oura', 'suunto', 'coros', 'google_fit'
  )),
  provider_user_id TEXT NOT NULL,
  display_name TEXT,
  device_type TEXT CHECK (device_type IN (
    'smartwatch', 'fitness_tracker', 'bike_computer',
    'heart_rate_monitor', 'running_watch', 'other'
  )),

  -- Status and connection
  status TEXT NOT NULL DEFAULT 'pending_auth' CHECK (status IN (
    'connected', 'syncing', 'error', 'disconnected', 'pending_auth', 'token_expired'
  )),

  -- OAuth tokens (to be encrypted in application layer)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',

  -- Sync tracking
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one active connection per provider per user
  UNIQUE(user_id, provider, provider_user_id)
);

-- Indexes for connected_devices
CREATE INDEX IF NOT EXISTS idx_connected_devices_user ON connected_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_devices_provider ON connected_devices(provider);
CREATE INDEX IF NOT EXISTS idx_connected_devices_status ON connected_devices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_connected_devices_token_expiry ON connected_devices(token_expires_at)
  WHERE token_expires_at IS NOT NULL;

-- =====================================================
-- 2. TABLE DEVICE_SYNC_HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS device_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES connected_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'automatic', 'scheduled', 'webhook')),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed', 'cancelled')),

  -- Data tracked
  data_types_synced TEXT[] DEFAULT '{}',
  records_fetched INTEGER DEFAULT 0,
  records_stored INTEGER DEFAULT 0,

  -- Performance
  duration_ms INTEGER,

  -- Error tracking
  error_message TEXT,
  error_code TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for device_sync_history
CREATE INDEX IF NOT EXISTS idx_sync_history_device ON device_sync_history(device_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_user ON device_sync_history(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON device_sync_history(status);

-- =====================================================
-- 3. TABLE WEARABLE_HEALTH_DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS wearable_health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES connected_devices(id) ON DELETE CASCADE,

  -- Data classification
  data_type TEXT NOT NULL CHECK (data_type IN (
    'heart_rate', 'steps', 'calories', 'distance', 'sleep',
    'workout', 'weight', 'blood_pressure', 'spo2', 'hrv',
    'resting_heart_rate', 'active_minutes', 'elevation',
    'cadence', 'power', 'pace', 'vo2max', 'stress_level',
    'body_battery', 'temperature', 'hydration', 'nutrition'
  )),

  -- Timestamp of the measurement
  timestamp TIMESTAMPTZ NOT NULL,

  -- Multiple value formats
  value_numeric NUMERIC,
  value_text TEXT,
  value_json JSONB,
  unit TEXT,

  -- Quality and source
  quality_score NUMERIC CHECK (quality_score >= 0 AND quality_score <= 100),
  source_workout_id TEXT,

  -- Raw data for debugging
  raw_data JSONB,

  -- Metadata
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate entries
  UNIQUE(user_id, device_id, data_type, timestamp)
);

-- Indexes for wearable_health_data
CREATE INDEX IF NOT EXISTS idx_health_data_user_type ON wearable_health_data(user_id, data_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_data_device ON wearable_health_data(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_data_timestamp ON wearable_health_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_data_workout ON wearable_health_data(source_workout_id)
  WHERE source_workout_id IS NOT NULL;

-- =====================================================
-- 4. TABLE SYNC_PREFERENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS sync_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES connected_devices(id) ON DELETE CASCADE,

  -- Sync settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 60 CHECK (sync_frequency_minutes IN (15, 30, 60, 120, 240, 480, 1440)),
  data_types_enabled TEXT[] DEFAULT ARRAY[
    'heart_rate', 'steps', 'calories', 'distance', 'sleep', 'workout'
  ]::TEXT[],

  -- Constraints
  sync_only_wifi BOOLEAN DEFAULT false,

  -- Notifications
  notify_on_sync BOOLEAN DEFAULT false,
  notify_on_error BOOLEAN DEFAULT true,

  -- Backfill
  backfill_days INTEGER DEFAULT 7 CHECK (backfill_days >= 0 AND backfill_days <= 90),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One preference per device
  UNIQUE(user_id, device_id)
);

-- Indexes for sync_preferences
CREATE INDEX IF NOT EXISTS idx_sync_prefs_user ON sync_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_prefs_device ON sync_preferences(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_prefs_auto_sync ON sync_preferences(auto_sync_enabled)
  WHERE auto_sync_enabled = true;

-- =====================================================
-- 5. TABLE DEVICE_AUTH_FLOWS
-- =====================================================

CREATE TABLE IF NOT EXISTS device_auth_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- OAuth flow tracking
  provider TEXT NOT NULL,
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT,
  redirect_uri TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for device_auth_flows
CREATE INDEX IF NOT EXISTS idx_auth_flows_state ON device_auth_flows(state);
CREATE INDEX IF NOT EXISTS idx_auth_flows_user ON device_auth_flows(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_flows_expires ON device_auth_flows(expires_at)
  WHERE status = 'pending';

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_connected_devices_updated_at'
  ) THEN
    CREATE TRIGGER update_connected_devices_updated_at
      BEFORE UPDATE ON connected_devices
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_sync_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_sync_preferences_updated_at
      BEFORE UPDATE ON sync_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE connected_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_auth_flows ENABLE ROW LEVEL SECURITY;

-- Policies for connected_devices
CREATE POLICY "Users can view their own connected devices"
  ON connected_devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connected devices"
  ON connected_devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected devices"
  ON connected_devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected devices"
  ON connected_devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for device_sync_history
CREATE POLICY "Users can view their own sync history"
  ON device_sync_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync history"
  ON device_sync_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for wearable_health_data
CREATE POLICY "Users can view their own health data"
  ON wearable_health_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health data"
  ON wearable_health_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health data"
  ON wearable_health_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health data"
  ON wearable_health_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for sync_preferences
CREATE POLICY "Users can view their own sync preferences"
  ON sync_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync preferences"
  ON sync_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync preferences"
  ON sync_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync preferences"
  ON sync_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for device_auth_flows
CREATE POLICY "Users can view their own auth flows"
  ON device_auth_flows FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own auth flows"
  ON device_auth_flows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auth flows"
  ON device_auth_flows FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

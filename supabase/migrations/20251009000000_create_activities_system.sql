/*
  # Create Activities Tracking System

  Système complet de suivi d'activité pour la Forge Énergétique TwinForge.

  ## Tables Créées

  ### 1. `activities`
  Table principale pour stocker les activités physiques des utilisateurs.
  - `id` (uuid, PK): Identifiant unique de l'activité
  - `user_id` (uuid, FK): Référence vers auth.users
  - `type` (text): Type d'activité (course, musculation, vélo, etc.)
  - `duration_min` (integer): Durée en minutes
  - `intensity` (text): Niveau d'intensité (low, medium, high, very_high)
  - `calories_est` (integer): Calories estimées brûlées
  - `notes` (text, nullable): Notes optionnelles sur l'activité
  - `timestamp` (timestamptz): Date et heure de l'activité
  - `created_at` (timestamptz): Date de création de l'enregistrement
  - `updated_at` (timestamptz): Date de dernière modification

  ### 2. `ai_analysis_jobs`
  Table pour tracker les coûts et performances des analyses IA.
  - `id` (uuid, PK): Identifiant unique du job
  - `user_id` (uuid, FK): Référence vers auth.users
  - `analysis_type` (text): Type d'analyse (transcription, activity_analysis, trend_analysis)
  - `status` (text): Statut du job (pending, processing, completed, failed)
  - `request_payload` (jsonb): Données de la requête
  - `result_payload` (jsonb, nullable): Résultat de l'analyse
  - `cost_usd` (numeric): Coût en USD de l'appel OpenAI
  - `processing_time_ms` (integer): Temps de traitement en millisecondes
  - `error_message` (text, nullable): Message d'erreur si échec
  - `created_at` (timestamptz): Date de création
  - `updated_at` (timestamptz): Date de dernière modification

  ### 3. `ai_trend_analyses`
  Table pour le cache serveur intelligent des analyses de tendances.
  - `id` (uuid, PK): Identifiant unique du cache
  - `user_id` (uuid, FK): Référence vers auth.users
  - `period` (text): Période d'analyse (last7Days, last30Days, last3Months)
  - `result_data` (jsonb): Données de l'analyse (insights, distribution, trends)
  - `activities_count` (integer): Nombre d'activités analysées
  - `cached_until` (timestamptz): Date d'expiration du cache
  - `created_at` (timestamptz): Date de création du cache
  - `updated_at` (timestamptz): Date de dernière mise à jour

  ## Sécurité

  - RLS activé sur toutes les tables
  - Politiques restrictives par défaut (accès uniquement aux données de l'utilisateur)
  - Indexes optimisés pour les requêtes fréquentes

  ## Performance

  - Index sur user_id + timestamp pour activities
  - Index sur user_id + period pour ai_trend_analyses
  - Triggers pour updated_at automatique
*/

-- =====================================================
-- 1. TABLE ACTIVITIES
-- =====================================================

-- Créer la table activities si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  duration_min INTEGER NOT NULL CHECK (duration_min > 0 AND duration_min <= 600),
  intensity TEXT NOT NULL CHECK (intensity IN ('low', 'medium', 'high', 'very_high')),
  calories_est INTEGER NOT NULL CHECK (calories_est >= 0 AND calories_est <= 2000),
  notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS activities_user_id_idx ON public.activities USING btree (user_id);
CREATE INDEX IF NOT EXISTS activities_timestamp_idx ON public.activities USING btree (timestamp DESC);
CREATE INDEX IF NOT EXISTS activities_user_timestamp_idx ON public.activities USING btree (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS activities_type_idx ON public.activities USING btree (type);

-- Activer RLS sur activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Les utilisateurs peuvent voir leurs propres activités
CREATE POLICY IF NOT EXISTS "Users can view their own activities"
  ON public.activities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique INSERT: Les utilisateurs peuvent créer leurs propres activités
CREATE POLICY IF NOT EXISTS "Users can create their own activities"
  ON public.activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE: Les utilisateurs peuvent modifier leurs propres activités
CREATE POLICY IF NOT EXISTS "Users can update their own activities"
  ON public.activities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique DELETE: Les utilisateurs peuvent supprimer leurs propres activités
CREATE POLICY IF NOT EXISTS "Users can delete their own activities"
  ON public.activities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. TABLE AI_ANALYSIS_JOBS (Tracking des coûts IA)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_analysis_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('transcription', 'activity_analysis', 'trend_analysis')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  request_payload JSONB NOT NULL,
  result_payload JSONB,
  cost_usd NUMERIC(10, 6) DEFAULT 0.0,
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche par utilisateur et type
CREATE INDEX IF NOT EXISTS ai_analysis_jobs_user_id_idx ON public.ai_analysis_jobs USING btree (user_id);
CREATE INDEX IF NOT EXISTS ai_analysis_jobs_type_idx ON public.ai_analysis_jobs USING btree (analysis_type);
CREATE INDEX IF NOT EXISTS ai_analysis_jobs_status_idx ON public.ai_analysis_jobs USING btree (status);
CREATE INDEX IF NOT EXISTS ai_analysis_jobs_created_at_idx ON public.ai_analysis_jobs USING btree (created_at DESC);

-- Activer RLS
ALTER TABLE public.ai_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Les utilisateurs peuvent voir leurs propres jobs
CREATE POLICY IF NOT EXISTS "Users can view their own analysis jobs"
  ON public.ai_analysis_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique INSERT: Les utilisateurs peuvent créer leurs propres jobs
CREATE POLICY IF NOT EXISTS "Users can create their own analysis jobs"
  ON public.ai_analysis_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. TABLE AI_TREND_ANALYSES (Cache serveur intelligent)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_trend_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('last7Days', 'last30Days', 'last3Months', 'last6Months', 'last1Year')),
  result_data JSONB NOT NULL,
  activities_count INTEGER NOT NULL DEFAULT 0,
  cached_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, period)
);

-- Index pour recherche par utilisateur et période
CREATE INDEX IF NOT EXISTS ai_trend_analyses_user_period_idx ON public.ai_trend_analyses USING btree (user_id, period);
CREATE INDEX IF NOT EXISTS ai_trend_analyses_cached_until_idx ON public.ai_trend_analyses USING btree (cached_until);

-- Activer RLS
ALTER TABLE public.ai_trend_analyses ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Les utilisateurs peuvent voir leur propre cache
CREATE POLICY IF NOT EXISTS "Users can view their own trend analyses"
  ON public.ai_trend_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique INSERT: Les utilisateurs peuvent créer leur propre cache
CREATE POLICY IF NOT EXISTS "Users can create their own trend analyses"
  ON public.ai_trend_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE: Les utilisateurs peuvent mettre à jour leur propre cache
CREATE POLICY IF NOT EXISTS "Users can update their own trend analyses"
  ON public.ai_trend_analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique DELETE: Les utilisateurs peuvent supprimer leur propre cache
CREATE POLICY IF NOT EXISTS "Users can delete their own trend analyses"
  ON public.ai_trend_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. TRIGGERS POUR UPDATED_AT AUTOMATIQUE
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour activities
DROP TRIGGER IF EXISTS set_activities_updated_at ON public.activities;
CREATE TRIGGER set_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pour ai_analysis_jobs
DROP TRIGGER IF EXISTS set_ai_analysis_jobs_updated_at ON public.ai_analysis_jobs;
CREATE TRIGGER set_ai_analysis_jobs_updated_at
  BEFORE UPDATE ON public.ai_analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pour ai_trend_analyses
DROP TRIGGER IF EXISTS set_ai_trend_analyses_updated_at ON public.ai_trend_analyses;
CREATE TRIGGER set_ai_trend_analyses_updated_at
  BEFORE UPDATE ON public.ai_trend_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

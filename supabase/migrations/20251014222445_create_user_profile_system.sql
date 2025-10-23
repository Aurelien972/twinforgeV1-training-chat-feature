/*
  # Système de Profil Utilisateur
  
  1. Nouvelle Table
    - `user_profile` - Profil utilisateur complet
      - `user_id` (uuid, primary key, FK auth.users)
      - `role` (text) - Rôle utilisateur (toujours 'user')
      - `full_name` (text) - Nom complet
      - `email` (text) - Email
      - `avatar_url` (text) - URL photo de profil
      - `country` (text) - Code pays ISO
      - `language` (text) - Langue préférée
      - `health` (jsonb) - Données de santé complètes
      - `health_schema_version` (text) - Version schéma santé
      - `country_health_cache` (jsonb) - Cache données pays
      - `health_enriched_at` (timestamptz) - Dernière mise à jour enrichissement
      - `constraints` (jsonb) - Contraintes diverses
      - Timestamps standard
  
  2. Sécurité
    - RLS activé
    - Utilisateurs peuvent voir/modifier uniquement leur propre profil
    - Service role a accès complet
  
  3. Indexation
    - Index sur user_id pour lookup rapide
    - Index sur email pour recherche
    - Index GIN sur health JSONB
*/

-- Créer la table user_profile
CREATE TABLE IF NOT EXISTS user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations de base
  role TEXT NOT NULL DEFAULT 'user' CHECK (role = 'user'),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  country TEXT,
  language TEXT DEFAULT 'fr',
  
  -- Données de santé
  health JSONB DEFAULT NULL,
  health_schema_version TEXT DEFAULT '1.0',
  country_health_cache JSONB,
  health_enriched_at TIMESTAMPTZ,
  
  -- Autres données
  constraints JSONB DEFAULT '{}'::jsonb,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index principaux
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON user_profile(email);
CREATE INDEX IF NOT EXISTS idx_user_profile_country ON user_profile(country);
CREATE INDEX IF NOT EXISTS idx_user_profile_health_version ON user_profile(health_schema_version);

-- Index GIN sur health JSONB pour recherche efficace
CREATE INDEX IF NOT EXISTS idx_user_profile_health_gin ON user_profile USING GIN (health);

-- Index pour version du schéma health
CREATE INDEX IF NOT EXISTS idx_user_profile_health_version_expr
  ON user_profile((health->>'version'))
  WHERE health IS NOT NULL;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profile_timestamp_trigger ON user_profile;
CREATE TRIGGER update_user_profile_timestamp_trigger
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_timestamp();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON user_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "Users can create own profile"
  ON user_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON user_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leur propre profil
CREATE POLICY "Users can delete own profile"
  ON user_profile FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role a accès complet
CREATE POLICY "Service role has full access"
  ON user_profile FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour créer un profil automatiquement lors de l'inscription
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profile (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE user_profile IS 'Profil utilisateur complet avec données de santé et préférences';
COMMENT ON COLUMN user_profile.health IS 'Profil de santé complet (V1: basic, V2: enriched preventive medicine)';
COMMENT ON COLUMN user_profile.health_schema_version IS 'Version du schéma health (1.0, 2.0)';
COMMENT ON COLUMN user_profile.country_health_cache IS 'Cache des données sanitaires du pays utilisateur';
COMMENT ON COLUMN user_profile.health_enriched_at IS 'Date du dernier enrichissement automatique';

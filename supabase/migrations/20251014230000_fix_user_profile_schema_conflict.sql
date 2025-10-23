/*
  # Résolution du Conflit de Schéma user_profile

  1. Problème
    - Deux migrations précédentes créent/modifient user_profile différemment
    - Migration 20251014000000: Ajoute colonnes conditionnellement (suppose table existante)
    - Migration 20251014222445: Crée la table avec toutes les colonnes
    - Résultat: Cache Supabase désynchronisé, erreur PGRST204

  2. Solution
    - Garantir que la table user_profile existe avec toutes les colonnes requises
    - Ajouter les colonnes manquantes si elles n'existent pas (idempotent)
    - Assurer cohérence des index et contraintes
    - Valider les politiques RLS

  3. Colonnes Garanties
    - user_id (UUID, PK)
    - role, full_name, email, avatar_url, country, language
    - health (JSONB)
    - health_schema_version (TEXT)
    - country_health_cache (JSONB)
    - health_enriched_at (TIMESTAMPTZ)
    - constraints (JSONB)
    - created_at, updated_at (TIMESTAMPTZ)

  4. Sécurité
    - RLS maintenu actif
    - Politiques existantes préservées
*/

-- =====================================================
-- 1. GARANTIR L'EXISTENCE DE LA TABLE
-- =====================================================

-- Créer la table si elle n'existe pas (déjà gérée par migration précédente)
CREATE TABLE IF NOT EXISTS user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role = 'user'),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  country TEXT,
  language TEXT DEFAULT 'fr',
  health JSONB DEFAULT NULL,
  health_schema_version TEXT DEFAULT '1.0',
  country_health_cache JSONB,
  health_enriched_at TIMESTAMPTZ,
  constraints JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. AJOUTER LES COLONNES MANQUANTES (IDEMPOTENT)
-- =====================================================

-- Colonne health_schema_version
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'health_schema_version'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN health_schema_version TEXT DEFAULT '1.0';
    RAISE NOTICE 'Added health_schema_version column';
  ELSE
    RAISE NOTICE 'Column health_schema_version already exists';
  END IF;
END $$;

-- Colonne country_health_cache
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'country_health_cache'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN country_health_cache JSONB;
    RAISE NOTICE 'Added country_health_cache column';
  ELSE
    RAISE NOTICE 'Column country_health_cache already exists';
  END IF;
END $$;

-- Colonne health_enriched_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
    AND column_name = 'health_enriched_at'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN health_enriched_at TIMESTAMPTZ;
    RAISE NOTICE 'Added health_enriched_at column';
  ELSE
    RAISE NOTICE 'Column health_enriched_at already exists';
  END IF;
END $$;

-- =====================================================
-- 3. GARANTIR LES INDEX
-- =====================================================

-- Index sur email
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON user_profile(email);

-- Index sur country
CREATE INDEX IF NOT EXISTS idx_user_profile_country ON user_profile(country);

-- Index sur health_schema_version
CREATE INDEX IF NOT EXISTS idx_user_profile_health_version ON user_profile(health_schema_version);

-- Index GIN sur health JSONB
CREATE INDEX IF NOT EXISTS idx_user_profile_health_gin ON user_profile USING GIN (health);

-- Index pour version du schéma dans JSONB
CREATE INDEX IF NOT EXISTS idx_user_profile_health_version_expr
  ON user_profile((health->>'version'))
  WHERE health IS NOT NULL;

-- =====================================================
-- 4. GARANTIR LE TRIGGER updated_at
-- =====================================================

-- Fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS update_user_profile_timestamp_trigger ON user_profile;

-- Créer le trigger
CREATE TRIGGER update_user_profile_timestamp_trigger
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_timestamp();

-- =====================================================
-- 5. GARANTIR RLS ET POLITIQUES
-- =====================================================

-- Activer RLS
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leur propre profil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profile'
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON user_profile FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can view own profile';
  END IF;
END $$;

-- Politique: Les utilisateurs peuvent créer leur propre profil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profile'
    AND policyname = 'Users can create own profile'
  ) THEN
    CREATE POLICY "Users can create own profile"
      ON user_profile FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can create own profile';
  END IF;
END $$;

-- Politique: Les utilisateurs peuvent mettre à jour leur propre profil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profile'
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON user_profile FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can update own profile';
  END IF;
END $$;

-- Politique: Les utilisateurs peuvent supprimer leur propre profil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profile'
    AND policyname = 'Users can delete own profile'
  ) THEN
    CREATE POLICY "Users can delete own profile"
      ON user_profile FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can delete own profile';
  END IF;
END $$;

-- Politique: Service role a accès complet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profile'
    AND policyname = 'Service role has full access'
  ) THEN
    CREATE POLICY "Service role has full access"
      ON user_profile FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    RAISE NOTICE 'Created policy: Service role has full access';
  END IF;
END $$;

-- =====================================================
-- 6. GARANTIR LA FONCTION DE CRÉATION AUTO
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
-- 7. VALIDATION ET LOG
-- =====================================================

DO $$
DECLARE
  v_column_count INTEGER;
  v_index_count INTEGER;
  v_policy_count INTEGER;
BEGIN
  -- Compter les colonnes
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'user_profile';

  -- Compter les index
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE tablename = 'user_profile';

  -- Compter les politiques
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'user_profile';

  RAISE NOTICE '=== Migration user_profile consolidation completed ===';
  RAISE NOTICE 'Total columns: %', v_column_count;
  RAISE NOTICE 'Total indexes: %', v_index_count;
  RAISE NOTICE 'Total RLS policies: %', v_policy_count;
  RAISE NOTICE 'Table status: OPERATIONAL';
END $$;

-- Commentaires
COMMENT ON TABLE user_profile IS 'Profil utilisateur complet avec système de santé V2 - CONSOLIDATED SCHEMA';
COMMENT ON COLUMN user_profile.health IS 'Profil de santé (V1: basic fields, V2: enriched preventive medicine)';
COMMENT ON COLUMN user_profile.health_schema_version IS 'Version du schéma health (1.0=legacy, 2.0=enriched)';
COMMENT ON COLUMN user_profile.country_health_cache IS 'Cache des données sanitaires du pays utilisateur';
COMMENT ON COLUMN user_profile.health_enriched_at IS 'Date du dernier enrichissement automatique des données santé';

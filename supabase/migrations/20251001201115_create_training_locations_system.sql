/*
  # Système de Gestion des Lieux d'Entraînement

  ## Vue d'ensemble
  Système complet pour gérer les lieux d'entraînement des utilisateurs avec support
  de deux modes: analyse photo IA ou sélection manuelle d'équipements.

  ## Tables créées

  ### 1. training_locations
  Lieux d'entraînement configurés par l'utilisateur:
  - Type de lieu (home, gym, outdoor)
  - Nom personnalisé
  - Mode de configuration (photo ou manual)
  - Indicateurs: défaut, sélectionné pour génération
  - Timestamps de création et mise à jour

  ### 2. training_location_equipment
  Équipements disponibles par lieu:
  - Référence au lieu
  - Nom de l'équipement
  - Indicateur si équipement custom (ajouté par user)
  - Timestamp de création

  ### 3. training_location_photos
  Photos des environnements d'entraînement:
  - Référence au lieu
  - URL de la photo dans Supabase Storage
  - Ordre d'affichage
  - Timestamp de création

  ## Sécurité
  - RLS activé sur toutes les tables
  - Isolation stricte par user_id
  - Policies CRUD pour authenticated users uniquement
  - Protection données personnelles (lieux, équipements, photos)

  ## Index
  - user_id sur training_locations pour performance
  - location_id sur tables liées pour jointures rapides
  - is_selected_for_generation pour filtrage rapide

  ## Contraintes
  - Au moins un lieu par utilisateur recommandé
  - Maximum 5 photos par lieu
  - Modes: 'photo' ou 'manual'
  - Types de lieu: 'home', 'gym', 'outdoor'
*/

-- =====================================================
-- 1. TRAINING_LOCATIONS
-- Lieux d'entraînement configurés par utilisateur
-- =====================================================

CREATE TABLE IF NOT EXISTS training_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identification du lieu
  name text, -- Nom personnalisé (ex: "Ma salle à domicile", "Basic Fit Centre")
  type text NOT NULL, -- 'home', 'gym', 'outdoor'
  
  -- Mode de configuration
  mode text NOT NULL DEFAULT 'manual', -- 'photo' ou 'manual'
  
  -- Indicateurs
  is_default boolean DEFAULT false, -- Lieu par défaut pour l'utilisateur
  is_selected_for_generation boolean DEFAULT false, -- Lieu sélectionné pour la prochaine génération
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_location_type CHECK (type IN ('home', 'gym', 'outdoor')),
  CONSTRAINT valid_location_mode CHECK (mode IN ('photo', 'manual'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_training_locations_user_id ON training_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_training_locations_is_selected ON training_locations(is_selected_for_generation);
CREATE INDEX IF NOT EXISTS idx_training_locations_type ON training_locations(type);

-- RLS
ALTER TABLE training_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training locations"
  ON training_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training locations"
  ON training_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training locations"
  ON training_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training locations"
  ON training_locations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. TRAINING_LOCATION_EQUIPMENT
-- Équipements disponibles par lieu
-- =====================================================

CREATE TABLE IF NOT EXISTS training_location_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES training_locations(id) ON DELETE CASCADE,
  
  -- Équipement
  equipment_name text NOT NULL,
  is_custom boolean DEFAULT false, -- True si ajouté manuellement par user (pas dans liste prédéfinie)
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  
  -- Contrainte unicité par lieu
  CONSTRAINT unique_equipment_per_location UNIQUE (location_id, equipment_name)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_training_location_equipment_location_id ON training_location_equipment(location_id);

-- RLS
ALTER TABLE training_location_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipment for own locations"
  ON training_location_equipment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_equipment.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert equipment for own locations"
  ON training_location_equipment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_equipment.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update equipment for own locations"
  ON training_location_equipment FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_equipment.location_id
      AND training_locations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_equipment.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete equipment for own locations"
  ON training_location_equipment FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_equipment.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. TRAINING_LOCATION_PHOTOS
-- Photos des environnements d'entraînement
-- =====================================================

CREATE TABLE IF NOT EXISTS training_location_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES training_locations(id) ON DELETE CASCADE,
  
  -- Photo
  photo_url text NOT NULL, -- URL dans Supabase Storage
  photo_order integer DEFAULT 0, -- Ordre d'affichage (0-4 pour max 5 photos)
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_photo_order CHECK (photo_order >= 0 AND photo_order < 5)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_training_location_photos_location_id ON training_location_photos(location_id);
CREATE INDEX IF NOT EXISTS idx_training_location_photos_order ON training_location_photos(photo_order);

-- RLS
ALTER TABLE training_location_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos for own locations"
  ON training_location_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_photos.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos for own locations"
  ON training_location_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_photos.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos for own locations"
  ON training_location_photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_photos.location_id
      AND training_locations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_photos.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos for own locations"
  ON training_location_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_photos.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS pour updated_at
-- =====================================================

-- Trigger pour training_locations
DROP TRIGGER IF EXISTS update_training_locations_updated_at ON training_locations;
CREATE TRIGGER update_training_locations_updated_at
  BEFORE UPDATE ON training_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour s'assurer qu'un seul lieu est marqué comme selected_for_generation par utilisateur
CREATE OR REPLACE FUNCTION ensure_single_selected_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_selected_for_generation = true THEN
    -- Désélectionner tous les autres lieux de cet utilisateur
    UPDATE training_locations
    SET is_selected_for_generation = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour assurer un seul lieu sélectionné
DROP TRIGGER IF EXISTS trigger_ensure_single_selected_location ON training_locations;
CREATE TRIGGER trigger_ensure_single_selected_location
  AFTER INSERT OR UPDATE OF is_selected_for_generation ON training_locations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_selected_location();

-- Fonction pour limiter le nombre de photos par lieu (max 5)
CREATE OR REPLACE FUNCTION check_max_photos_per_location()
RETURNS TRIGGER AS $$
DECLARE
  photo_count integer;
BEGIN
  SELECT COUNT(*) INTO photo_count
  FROM training_location_photos
  WHERE location_id = NEW.location_id;
  
  IF photo_count >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 photos allowed per location';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour limiter les photos
DROP TRIGGER IF EXISTS trigger_check_max_photos ON training_location_photos;
CREATE TRIGGER trigger_check_max_photos
  BEFORE INSERT ON training_location_photos
  FOR EACH ROW
  EXECUTE FUNCTION check_max_photos_per_location();

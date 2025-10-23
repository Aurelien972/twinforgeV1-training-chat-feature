/*
  # Système de Détection Automatique d'Équipements avec GPT-5

  ## Vue d'ensemble
  Système complet pour analyser automatiquement les photos des lieux d'entraînement
  et détecter tous les équipements visibles avec leurs positions précises sur l'image.
  Utilise GPT-5-mini via Edge Function pour analyse vision optimisée.

  ## Tables créées

  ### 1. training_location_equipment_detections
  Résultats d'analyse IA par photo:
  - Référence à la photo analysée
  - Référence au lieu d'entraînement
  - Nom de l'équipement détecté
  - Coordonnées de position (x, y en %)
  - Dimensions de la zone (width, height en %)
  - Score de confiance de la détection (0-1)
  - Numéro de marqueur pour affichage
  - Timestamp d'analyse
  - Métadonnées de l'analyse (modèle utilisé, version)

  ## Sécurité
  - RLS activé sur toutes les tables
  - Isolation stricte par user_id via training_locations
  - Policies CRUD pour authenticated users uniquement
  - Protection des données d'analyse IA

  ## Index
  - photo_id pour récupération rapide par photo
  - location_id pour filtrage par lieu
  - equipment_name pour recherche d'équipements
  - Composé (photo_id, marker_number) pour unicité

  ## Fonctionnalités
  - Cache des résultats d'analyse pour éviter re-détection
  - Support de multiples équipements par photo
  - Coordonnées en pourcentages pour responsive design
  - Numérotation automatique des marqueurs
  - Tracking du modèle et version GPT utilisés
*/

-- =====================================================
-- 1. TRAINING_LOCATION_EQUIPMENT_DETECTIONS
-- Détections d'équipements par analyse IA des photos
-- =====================================================

CREATE TABLE IF NOT EXISTS training_location_equipment_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Références
  photo_id uuid NOT NULL REFERENCES training_location_photos(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES training_locations(id) ON DELETE CASCADE,

  -- Équipement détecté
  equipment_name text NOT NULL,
  equipment_category text, -- ex: 'free-weights', 'machines', 'cardio'

  -- Position et dimensions (en pourcentages 0-100)
  position_x numeric(5,2) NOT NULL CHECK (position_x >= 0 AND position_x <= 100),
  position_y numeric(5,2) NOT NULL CHECK (position_y >= 0 AND position_y <= 100),
  bbox_width numeric(5,2) CHECK (bbox_width >= 0 AND bbox_width <= 100),
  bbox_height numeric(5,2) CHECK (bbox_height >= 0 AND bbox_height <= 100),

  -- Métadonnées de détection
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  marker_number integer NOT NULL, -- Numéro affiché sur le marqueur (1, 2, 3...)

  -- Analyse IA
  detected_by_model text DEFAULT 'gpt-5-mini', -- Modèle utilisé pour la détection
  analysis_metadata jsonb, -- Métadonnées additionnelles de l'analyse

  -- Timestamps
  created_at timestamptz DEFAULT now(),

  -- Contraintes
  CONSTRAINT unique_marker_per_photo UNIQUE (photo_id, marker_number),
  CONSTRAINT valid_marker_number CHECK (marker_number > 0)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_equipment_detections_photo_id
  ON training_location_equipment_detections(photo_id);

CREATE INDEX IF NOT EXISTS idx_equipment_detections_location_id
  ON training_location_equipment_detections(location_id);

CREATE INDEX IF NOT EXISTS idx_equipment_detections_equipment_name
  ON training_location_equipment_detections(equipment_name);

CREATE INDEX IF NOT EXISTS idx_equipment_detections_marker
  ON training_location_equipment_detections(photo_id, marker_number);

-- Index pour recherche par confiance
CREATE INDEX IF NOT EXISTS idx_equipment_detections_confidence
  ON training_location_equipment_detections(confidence_score DESC);

-- RLS
ALTER TABLE training_location_equipment_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view detections for own locations"
  ON training_location_equipment_detections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_equipment_detections.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert detections for own locations"
  ON training_location_equipment_detections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_equipment_detections.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update detections for own locations"
  ON training_location_equipment_detections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_equipment_detections.location_id
      AND training_locations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_equipment_detections.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete detections for own locations"
  ON training_location_equipment_detections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_equipment_detections.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. TABLE D'ANALYSE DE PHOTOS
-- Tracking des analyses effectuées
-- =====================================================

CREATE TABLE IF NOT EXISTS training_location_photo_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Références
  photo_id uuid NOT NULL REFERENCES training_location_photos(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES training_locations(id) ON DELETE CASCADE,

  -- Statut de l'analyse
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message text,

  -- Résultats
  equipment_count integer DEFAULT 0,
  processing_time_ms integer, -- Temps de traitement en millisecondes

  -- Métadonnées
  model_used text DEFAULT 'gpt-5-mini',
  model_config jsonb, -- Configuration utilisée (reasoning, verbosity, etc.)

  -- Timestamps
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,

  -- Contraintes
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_photo_analyses_photo_id
  ON training_location_photo_analyses(photo_id);

CREATE INDEX IF NOT EXISTS idx_photo_analyses_location_id
  ON training_location_photo_analyses(location_id);

CREATE INDEX IF NOT EXISTS idx_photo_analyses_status
  ON training_location_photo_analyses(status);

-- Index pour récupérer la dernière analyse d'une photo
CREATE INDEX IF NOT EXISTS idx_photo_analyses_latest
  ON training_location_photo_analyses(photo_id, completed_at DESC);

-- RLS
ALTER TABLE training_location_photo_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analyses for own locations"
  ON training_location_photo_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_photo_analyses.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analyses for own locations"
  ON training_location_photo_analyses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_photo_analyses.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analyses for own locations"
  ON training_location_photo_analyses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_photo_analyses.location_id
      AND training_locations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_photo_analyses.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete analyses for own locations"
  ON training_location_photo_analyses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_locations
      WHERE training_locations.id = training_location_photo_analyses.location_id
      AND training_locations.user_id = auth.uid()
    )
  );

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour obtenir le prochain numéro de marqueur disponible pour une photo
CREATE OR REPLACE FUNCTION get_next_marker_number(p_photo_id uuid)
RETURNS integer AS $$
DECLARE
  max_marker integer;
BEGIN
  SELECT COALESCE(MAX(marker_number), 0) INTO max_marker
  FROM training_location_equipment_detections
  WHERE photo_id = p_photo_id;

  RETURN max_marker + 1;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si une photo a déjà été analysée
CREATE OR REPLACE FUNCTION is_photo_analyzed(p_photo_id uuid)
RETURNS boolean AS $$
DECLARE
  analysis_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM training_location_photo_analyses
    WHERE photo_id = p_photo_id
    AND status = 'completed'
  ) INTO analysis_exists;

  RETURN analysis_exists;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciennes détections avant nouvelle analyse
CREATE OR REPLACE FUNCTION clear_photo_detections(p_photo_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM training_location_equipment_detections
  WHERE photo_id = p_photo_id;

  DELETE FROM training_location_photo_analyses
  WHERE photo_id = p_photo_id;
END;
$$ LANGUAGE plpgsql;

-- Vue pour récupérer facilement toutes les détections avec infos de photo
CREATE OR REPLACE VIEW v_equipment_detections_with_photos AS
SELECT
  d.id,
  d.photo_id,
  d.location_id,
  d.equipment_name,
  d.equipment_category,
  d.position_x,
  d.position_y,
  d.bbox_width,
  d.bbox_height,
  d.confidence_score,
  d.marker_number,
  d.detected_by_model,
  d.created_at,
  p.photo_url,
  p.photo_order,
  l.name as location_name,
  l.type as location_type,
  l.user_id
FROM training_location_equipment_detections d
JOIN training_location_photos p ON d.photo_id = p.id
JOIN training_locations l ON d.location_id = l.id;

-- Trigger pour mettre à jour le compteur d'équipements après insertion
CREATE OR REPLACE FUNCTION update_analysis_equipment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE training_location_photo_analyses
    SET equipment_count = equipment_count + 1
    WHERE photo_id = NEW.photo_id
    AND status = 'completed';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE training_location_photo_analyses
    SET equipment_count = equipment_count - 1
    WHERE photo_id = OLD.photo_id
    AND status = 'completed';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_analysis_equipment_count ON training_location_equipment_detections;
CREATE TRIGGER trigger_update_analysis_equipment_count
  AFTER INSERT OR DELETE ON training_location_equipment_detections
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_equipment_count();

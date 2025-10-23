/*
  # Simplification du système de lieux d'entraînement - Suppression du mode manuel

  ## Description
  Cette migration simplifie le système de gestion des lieux d'entraînement en supprimant
  le concept de "mode" (photo vs manual). Tous les lieux utilisent désormais uniquement
  le mode photo avec détection IA. Les équipements peuvent être ajoutés manuellement
  via l'interface dédiée après la création du lieu.

  ## Changements

  1. **Suppression de la colonne `mode`**
     - Retire la colonne `mode` de la table `training_locations`
     - Supprime la contrainte CHECK associée
     - Tous les lieux existants sont conservés (les lieux en mode manual auront leurs équipements préservés)

  2. **Nettoyage de la colonne `is_selected_for_generation`**
     - Cette colonne est remplacée par le concept de "lieu favori" via `is_default`
     - Migration des données existantes: si un lieu est marqué comme `is_selected_for_generation`, il devient `is_default`
     - Suppression de la colonne `is_selected_for_generation`
     - Suppression de l'index associé

  ## Impacts

  - Les lieux existants en mode "manual" restent fonctionnels
  - Leurs équipements sont préservés dans `training_location_equipment`
  - Le système de photos devient obligatoire pour les nouveaux lieux
  - La sélection pour génération est remplacée par le système de favori

  ## Notes de sécurité

  - RLS policies inchangées (sécurité maintenue)
  - Aucune perte de données utilisateur
  - Migration réversible si nécessaire
*/

-- =====================================================
-- 1. Migration des données existantes
-- =====================================================

-- Si un lieu est marqué comme sélectionné pour génération, le marquer comme favori
UPDATE training_locations
SET is_default = true
WHERE is_selected_for_generation = true AND is_default = false;

-- =====================================================
-- 2. Suppression de la contrainte CHECK sur le mode
-- =====================================================

ALTER TABLE training_locations
DROP CONSTRAINT IF EXISTS valid_location_mode;

-- =====================================================
-- 3. Suppression de la colonne mode
-- =====================================================

ALTER TABLE training_locations
DROP COLUMN IF EXISTS mode;

-- =====================================================
-- 4. Suppression de is_selected_for_generation
-- =====================================================

-- Supprimer le trigger qui dépend de cette colonne
DROP TRIGGER IF EXISTS trigger_ensure_single_selected_location ON training_locations;
DROP FUNCTION IF EXISTS ensure_single_selected_location();

-- Supprimer l'index associé
DROP INDEX IF EXISTS idx_training_locations_is_selected;

-- Supprimer la colonne
ALTER TABLE training_locations
DROP COLUMN IF EXISTS is_selected_for_generation;

-- =====================================================
-- 5. Ajout d'un index pour les lieux favoris
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_training_locations_is_default
ON training_locations(user_id, is_default)
WHERE is_default = true;

-- =====================================================
-- 6. Commentaires pour documentation
-- =====================================================

COMMENT ON TABLE training_locations IS 'Training locations with AI-powered equipment detection from photos. All locations now use photo mode with automatic equipment detection. Manual equipment additions are supported via training_location_equipment table.';

COMMENT ON COLUMN training_locations.is_default IS 'Favorite location. Automatically preselected in Step 1 of training generation pipeline.';

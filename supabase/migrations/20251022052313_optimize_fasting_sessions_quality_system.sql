/*
  # Optimisation du Système de Jeûne - Qualité et Durées Scientifiques

  ## Résumé
  Cette migration implémente un système de validation scientifique pour les sessions
  de jeûne basé sur les recherches 2024. Elle introduit des seuils minimaux efficaces
  et un système de qualité pour améliorer l'expérience utilisateur et la valeur des données.

  ## 1. Nouvelles Colonnes
    - `outcome_quality` (text) : Qualité de la session basée sur les seuils scientifiques
      - 'excellent' : ≥90% du protocole (bénéfices métaboliques maximaux)
      - 'good' : 70-89% du protocole (bénéfices significatifs)
      - 'fair' : 50-69% du protocole (bénéfices modérés)
      - 'poor' : <50% du protocole (bénéfices limités)
      - null : session active ou annulée
    
    - `metabolic_phase_reached` (text) : Phase métabolique maximale atteinte
      - Basé sur FASTING_PHASES du système
      - Permet de tracker les bénéfices réels obtenus
    
    - `is_scientifically_valid` (boolean) : Session valide scientifiquement
      - true si actual_duration_hours >= 8h
      - false si < 8h (trop court pour bénéfices réels)
      - null pour sessions actives
    
    - `completion_percentage` (numeric) : % de complétion du protocole
      - Calculé : (actual_duration_hours / target_hours) * 100
      - Aide à la gamification et statistiques

  ## 2. Contraintes de Validation
    - actual_duration_hours doit être >= 0.5 (30 minutes minimum pour éviter erreurs)
    - actual_duration_hours < 48 heures (sécurité : jeûnes prolongés nécessitent supervision)
    - outcome_quality limité aux valeurs définies
    - completion_percentage entre 0 et 200% (permet de dépasser l'objectif)

  ## 3. Nettoyage des Données de Test
    - Suppression des sessions < 30 minutes (sessions de test invalides)
    - Préservation de toutes les données valides

  ## 4. Fonctions Automatiques
    - Trigger pour calculer automatiquement outcome_quality à la fin d'une session
    - Trigger pour déterminer is_scientifically_valid basé sur la durée
    - Trigger pour calculer completion_percentage
    - Fonction pour déterminer la phase métabolique atteinte

  ## 5. Index pour Performance
    - Index sur outcome_quality pour statistiques rapides
    - Index sur is_scientifically_valid pour filtrage
    - Index composite (user_id, created_at, outcome_quality) pour dashboards

  ## Références Scientifiques
    - Durée minimale efficace : 16h (études 2024)
    - Bascule métabolique : débute à 12h
    - Cétose : atteinte à 12-18h
    - Autophagie significative : 16h+
*/

-- Étape 0: Nettoyer les sessions de test invalides (< 30 minutes)
-- Ces sessions sont considérées comme des erreurs ou tests
DELETE FROM fasting_sessions 
WHERE actual_duration_hours IS NOT NULL 
  AND actual_duration_hours < 0.5
  AND status = 'completed';

-- Étape 1: Ajouter les nouvelles colonnes
ALTER TABLE fasting_sessions 
ADD COLUMN IF NOT EXISTS outcome_quality text,
ADD COLUMN IF NOT EXISTS metabolic_phase_reached text,
ADD COLUMN IF NOT EXISTS is_scientifically_valid boolean,
ADD COLUMN IF NOT EXISTS completion_percentage numeric(5,2);

-- Étape 2: Ajouter les contraintes de validation
ALTER TABLE fasting_sessions
DROP CONSTRAINT IF EXISTS fasting_sessions_outcome_quality_check;

ALTER TABLE fasting_sessions
ADD CONSTRAINT fasting_sessions_outcome_quality_check 
  CHECK (outcome_quality IN ('excellent', 'good', 'fair', 'poor') OR outcome_quality IS NULL);

ALTER TABLE fasting_sessions
DROP CONSTRAINT IF EXISTS fasting_sessions_duration_min_check;

ALTER TABLE fasting_sessions
ADD CONSTRAINT fasting_sessions_duration_min_check 
  CHECK (actual_duration_hours IS NULL OR actual_duration_hours >= 0.5);

ALTER TABLE fasting_sessions
DROP CONSTRAINT IF EXISTS fasting_sessions_duration_max_check;

ALTER TABLE fasting_sessions
ADD CONSTRAINT fasting_sessions_duration_max_check 
  CHECK (actual_duration_hours IS NULL OR actual_duration_hours < 48);

ALTER TABLE fasting_sessions
DROP CONSTRAINT IF EXISTS fasting_sessions_completion_percentage_check;

ALTER TABLE fasting_sessions
ADD CONSTRAINT fasting_sessions_completion_percentage_check 
  CHECK (completion_percentage IS NULL OR (completion_percentage >= 0 AND completion_percentage <= 200));

-- Étape 3: Créer la fonction pour déterminer la phase métabolique atteinte
CREATE OR REPLACE FUNCTION determine_metabolic_phase(duration_hours numeric)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF duration_hours IS NULL THEN
    RETURN NULL;
  ELSIF duration_hours >= 24 THEN
    RETURN 'extended';
  ELSIF duration_hours >= 18 THEN
    RETURN 'deep_ketosis';
  ELSIF duration_hours >= 12 THEN
    RETURN 'ketosis';
  ELSIF duration_hours >= 8 THEN
    RETURN 'gluconeogenesis';
  ELSIF duration_hours >= 4 THEN
    RETURN 'postabsorptive';
  ELSE
    RETURN 'anabolic';
  END IF;
END;
$$;

-- Étape 4: Créer la fonction de calcul automatique des métriques de qualité
CREATE OR REPLACE FUNCTION calculate_fasting_session_quality()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_completion_pct numeric;
  v_outcome text;
  v_is_valid boolean;
  v_phase text;
BEGIN
  -- Ne calculer que pour les sessions complétées
  IF NEW.status = 'completed' AND NEW.actual_duration_hours IS NOT NULL AND NEW.target_hours IS NOT NULL THEN
    
    -- Calcul du pourcentage de complétion
    v_completion_pct := ROUND((NEW.actual_duration_hours / NEW.target_hours) * 100, 2);
    
    -- Détermination de la qualité basée sur le pourcentage
    IF v_completion_pct >= 90 THEN
      v_outcome := 'excellent';
    ELSIF v_completion_pct >= 70 THEN
      v_outcome := 'good';
    ELSIF v_completion_pct >= 50 THEN
      v_outcome := 'fair';
    ELSE
      v_outcome := 'poor';
    END IF;
    
    -- Validation scientifique : >= 8h pour être considéré efficace
    v_is_valid := NEW.actual_duration_hours >= 8;
    
    -- Détermination de la phase métabolique atteinte
    v_phase := determine_metabolic_phase(NEW.actual_duration_hours);
    
    -- Mise à jour des colonnes
    NEW.completion_percentage := v_completion_pct;
    NEW.outcome_quality := v_outcome;
    NEW.is_scientifically_valid := v_is_valid;
    NEW.metabolic_phase_reached := v_phase;
    
  ELSIF NEW.status = 'cancelled' THEN
    -- Pour les sessions annulées, tout est NULL sauf la phase si durée existe
    NEW.completion_percentage := NULL;
    NEW.outcome_quality := NULL;
    NEW.is_scientifically_valid := NULL;
    IF NEW.actual_duration_hours IS NOT NULL THEN
      NEW.metabolic_phase_reached := determine_metabolic_phase(NEW.actual_duration_hours);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Étape 5: Créer le trigger pour automatiser les calculs
DROP TRIGGER IF EXISTS fasting_session_quality_trigger ON fasting_sessions;

CREATE TRIGGER fasting_session_quality_trigger
  BEFORE INSERT OR UPDATE ON fasting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_fasting_session_quality();

-- Étape 6: Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_outcome_quality 
  ON fasting_sessions(outcome_quality) 
  WHERE outcome_quality IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fasting_sessions_scientifically_valid 
  ON fasting_sessions(is_scientifically_valid) 
  WHERE is_scientifically_valid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user_date_quality 
  ON fasting_sessions(user_id, created_at DESC, outcome_quality) 
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_fasting_sessions_metabolic_phase 
  ON fasting_sessions(metabolic_phase_reached) 
  WHERE metabolic_phase_reached IS NOT NULL;

-- Étape 7: Migrer les données existantes (calcul rétroactif)
UPDATE fasting_sessions
SET 
  completion_percentage = CASE 
    WHEN actual_duration_hours IS NOT NULL AND target_hours IS NOT NULL 
    THEN ROUND((actual_duration_hours / target_hours) * 100, 2)
    ELSE NULL
  END,
  outcome_quality = CASE 
    WHEN actual_duration_hours IS NOT NULL AND target_hours IS NOT NULL THEN
      CASE 
        WHEN (actual_duration_hours / target_hours) * 100 >= 90 THEN 'excellent'
        WHEN (actual_duration_hours / target_hours) * 100 >= 70 THEN 'good'
        WHEN (actual_duration_hours / target_hours) * 100 >= 50 THEN 'fair'
        ELSE 'poor'
      END
    ELSE NULL
  END,
  is_scientifically_valid = CASE 
    WHEN actual_duration_hours IS NOT NULL THEN actual_duration_hours >= 8
    ELSE NULL
  END,
  metabolic_phase_reached = determine_metabolic_phase(actual_duration_hours)
WHERE status = 'completed' AND actual_duration_hours IS NOT NULL;

-- Étape 8: Ajouter des commentaires de documentation
COMMENT ON COLUMN fasting_sessions.outcome_quality IS 
  'Qualité de la session basée sur le % de complétion: excellent (≥90%), good (70-89%), fair (50-69%), poor (<50%)';

COMMENT ON COLUMN fasting_sessions.is_scientifically_valid IS 
  'Session valide scientifiquement si durée ≥ 8h (seuil minimal pour bénéfices métaboliques)';

COMMENT ON COLUMN fasting_sessions.metabolic_phase_reached IS 
  'Phase métabolique maximale atteinte: anabolic, postabsorptive, gluconeogenesis, ketosis, deep_ketosis, extended';

COMMENT ON COLUMN fasting_sessions.completion_percentage IS 
  'Pourcentage de complétion du protocole cible (peut dépasser 100%)';

-- Étape 9: Créer une vue pour les statistiques de qualité
CREATE OR REPLACE VIEW fasting_quality_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE outcome_quality = 'excellent') as excellent_count,
  COUNT(*) FILTER (WHERE outcome_quality = 'good') as good_count,
  COUNT(*) FILTER (WHERE outcome_quality = 'fair') as fair_count,
  COUNT(*) FILTER (WHERE outcome_quality = 'poor') as poor_count,
  COUNT(*) FILTER (WHERE is_scientifically_valid = true) as scientifically_valid_count,
  COUNT(*) FILTER (WHERE is_scientifically_valid = false) as scientifically_invalid_count,
  ROUND(AVG(completion_percentage), 2) as avg_completion_percentage,
  ROUND(AVG(actual_duration_hours) FILTER (WHERE status = 'completed'), 2) as avg_duration_hours,
  COUNT(*) as total_completed_sessions
FROM fasting_sessions
WHERE status = 'completed'
GROUP BY user_id;

GRANT SELECT ON fasting_quality_stats TO authenticated;
/*
  # Suppression complète des fonctionnalités coach/client pour MVP

  1. Suppression des tables coach
    - `user_coach` (relations utilisateur-coach)
    - `coach_clients` (clients des coachs)
    - `coach_videos` (vidéos des coachs)
    - `coach_invites` (invitations coach)
    - `coach_branding` (branding des coachs)
    - `coach_domains` (domaines personnalisés)
    - `invites` (système d'invitations général)

  2. Nettoyage des politiques RLS
    - Suppression de toutes les politiques liées aux coachs
    - Simplification des politiques utilisateur

  3. Simplification du système de rôles
    - Mise à jour de tous les rôles existants vers 'user'
    - Application de la contrainte role simplifiée
*/

-- Étape 1: Mettre à jour tous les rôles existants vers 'user' AVANT d'ajouter la contrainte
UPDATE user_profile SET role = 'user' WHERE role IS NULL OR role != 'user';

-- Étape 2: Supprimer l'ancienne contrainte de rôle si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profile_role_check' 
    AND table_name = 'user_profile'
  ) THEN
    ALTER TABLE user_profile DROP CONSTRAINT user_profile_role_check;
  END IF;
END $$;

-- Étape 3: Ajouter la nouvelle contrainte simplifiée
ALTER TABLE user_profile ADD CONSTRAINT user_profile_role_check 
  CHECK (role = 'user');

-- Étape 4: Supprimer les tables coach dans l'ordre correct (dépendances d'abord)
DROP TABLE IF EXISTS user_coach CASCADE;
DROP TABLE IF EXISTS coach_clients CASCADE;
DROP TABLE IF EXISTS coach_videos CASCADE;
DROP TABLE IF EXISTS coach_invites CASCADE;
DROP TABLE IF EXISTS coach_branding CASCADE;
DROP TABLE IF EXISTS coach_domains CASCADE;
DROP TABLE IF EXISTS invites CASCADE;

-- Étape 5: Nettoyer les politiques RLS sur les tables utilisateur
-- Supprimer les politiques liées aux coachs sur la table meals
DROP POLICY IF EXISTS "Coaches can view client meals" ON meals;
DROP POLICY IF EXISTS "coach_reads_client_meals" ON meals;

-- Supprimer les politiques liées aux coachs sur la table emotions
DROP POLICY IF EXISTS "Coaches can view client emotions" ON emotions;
DROP POLICY IF EXISTS "coach_reads_client_emotions" ON emotions;

-- Supprimer les politiques liées aux coachs sur la table fasting_sessions
DROP POLICY IF EXISTS "Coaches can view client fasting sessions" ON fasting_sessions;
DROP POLICY IF EXISTS "coach_reads_client_fasting" ON fasting_sessions;

-- Supprimer les politiques liées aux coachs sur la table body_scan_history
DROP POLICY IF EXISTS "Coaches can view client scan history" ON body_scan_history;

-- Supprimer les politiques liées aux coachs sur la table ai_daily_summaries
DROP POLICY IF EXISTS "Coaches can view client daily summaries" ON ai_daily_summaries;

-- Supprimer les politiques liées aux coachs sur la table ai_trend_analyses
DROP POLICY IF EXISTS "Coaches can view client trend analyses" ON ai_trend_analyses;

-- Supprimer les politiques liées aux coachs sur la table favorites
DROP POLICY IF EXISTS "coach_reads_client_favorites" ON favorites;

-- Supprimer les politiques liées aux coachs sur la table activities
DROP POLICY IF EXISTS "Coaches can view client activities" ON activities;
DROP POLICY IF EXISTS "coach_reads_client_activities" ON activities;

-- Supprimer les politiques liées aux coachs sur la table user_profile
DROP POLICY IF EXISTS "Coaches can view client profiles" ON user_profile;
DROP POLICY IF EXISTS "coaches_view_client_profiles" ON user_profile;

-- Supprimer les politiques liées aux coachs sur la table body_scans
DROP POLICY IF EXISTS "body_scans_coaches_read_clients" ON body_scans;
DROP POLICY IF EXISTS "coach_reads_client_body_scans" ON body_scans;

-- Étape 6: Simplifier les politiques restantes pour un accès utilisateur uniquement
-- Les politiques "users_manage_own_*" et "client_reads_own_*" restent inchangées
-- car elles gèrent l'accès des utilisateurs à leurs propres données

-- Étape 7: Nettoyer les vues qui pourraient référencer les tables supprimées
-- (Aucune vue identifiée dans le schéma actuel qui dépend des tables coach)

-- Étape 8: Vérification finale - s'assurer que tous les utilisateurs ont le rôle 'user'
UPDATE user_profile SET role = 'user' WHERE role IS NULL OR role != 'user';
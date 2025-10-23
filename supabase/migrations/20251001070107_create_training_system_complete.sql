/*
  # Training System Complete Schema - TwinForge Coach IA

  ## Vue d'ensemble
  Système complet pour le générateur d'entraînement IA avec gestion de plans,
  séances, exercices, feedbacks, adaptations et événements.

  ## Tables créées
  
  ### 1. training_profile
  Extension du profil utilisateur avec données training spécifiques:
  - Lieux d'entraînement disponibles (home, gym, outdoor, office)
  - Horaires préférés et jours disponibles
  - Blessures actuelles et historique douleurs
  - Mouvements à éviter pour sécurité
  - Tests étalons initiaux (force, cardio, endurance)
  - Notes médicales

  ### 2. training_plans
  Plans d'entraînement générés par IA:
  - Objectif global, palier actuel, durée en semaines
  - Contraintes (sessions/semaine, durée, lieux, équipement)
  - Status (draft, active, paused, completed)
  - Versioning pour adaptations
  - Règles d'adaptation (micro/meso)

  ### 3. training_sessions
  Séances individuelles dans un plan:
  - Type de séance (strength, cardio, mixed, etc.)
  - Date planifiée, durée cible
  - Équipement requis
  - Prescription complète (blocs, exercices)
  - Status (scheduled, in_progress, completed, skipped)
  - Intention et objectif de la séance

  ### 4. training_exercises
  Exercices par séance avec cibles précises:
  - ID exercice, variante
  - Cibles (sets, reps, charge, tempo, rest, RPE)
  - Tags de sécurité (articulations OK)
  - Substitutions possibles
  - Pattern de mouvement et stimulus

  ### 5. training_feedback
  Feedbacks utilisateur par exercice et séance:
  - Complétion (% ou valeurs réelles)
  - RPE (Rate of Perceived Exertion 1-10)
  - Douleur signalée, technique, notes
  - Feedback global séance (effort, plaisir)

  ### 6. training_adaptations
  Historique adaptations IA appliquées:
  - Règles déclenchées (micro/meso/macro)
  - Patch JSON avec changements
  - Versioning before/after
  - Explication textuelle

  ### 7. training_events
  Journal d'audit complet:
  - Tous événements système
  - Payload JSON structuré
  - Traçabilité totale

  ## Sécurité
  - RLS activé sur toutes les tables
  - Isolation stricte par user_id
  - Policies SELECT/INSERT/UPDATE pour authenticated users uniquement
  - Protection données sensibles (blessures, notes médicales)

  ## Index
  - user_id sur toutes tables pour performance
  - plan_id, session_id pour jointures rapides
  - created_at pour tri chronologique
  - status pour filtres

  ## Notes importantes
  - JSONB pour flexibilité structures complexes (prescription, feedback, patch)
  - Timestamps automatiques (created_at, updated_at)
  - Cascades DELETE pour cohérence données
  - Pas de modification rétroactive séances complétées
*/

-- =====================================================
-- 1. TRAINING_PROFILE
-- Extension profil utilisateur avec données training
-- =====================================================

CREATE TABLE IF NOT EXISTS training_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lieux et horaires disponibles
  venues text[] DEFAULT '{}', -- ['home', 'gym', 'outdoor', 'office']
  preferred_times text[] DEFAULT '{}', -- ['morning', 'noon', 'evening', 'night']
  available_days jsonb DEFAULT '{}', -- {monday: ['morning', 'evening'], tuesday: [...]}
  
  -- Contraintes et sécurité
  current_injuries jsonb DEFAULT '[]', -- [{joint: 'shoulder', severity: 3, date: '2025-01-15', notes: '...'}]
  pain_history jsonb DEFAULT '[]', -- Historique douleurs récurrentes
  movements_to_avoid text[] DEFAULT '{}', -- ['overhead_press', 'deep_squats']
  medical_notes text, -- Notes libres
  
  -- Tests étalons initiaux
  baseline_tests jsonb DEFAULT '{}', -- {strength: {squat_1rm: 100, bench_1rm: 80}, cardio: {run_5k_min: 25}}
  last_test_date timestamptz, -- Date dernier test étalon complet
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contrainte unicité par utilisateur
  CONSTRAINT training_profile_user_id_unique UNIQUE (user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_training_profile_user_id ON training_profile(user_id);

-- RLS
ALTER TABLE training_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training profile"
  ON training_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training profile"
  ON training_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training profile"
  ON training_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training profile"
  ON training_profile FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. TRAINING_PLANS
-- Plans d'entraînement générés par IA
-- =====================================================

CREATE TABLE IF NOT EXISTS training_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Métadonnées plan
  status text NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
  goal text NOT NULL, -- Description objectif
  palier integer DEFAULT 1, -- Niveau progression
  duration_weeks integer NOT NULL, -- Durée totale en semaines
  
  -- Contraintes utilisateur
  sessions_per_week integer NOT NULL DEFAULT 3,
  preferred_duration_min integer DEFAULT 45,
  venues text[] DEFAULT '{}',
  equipment text[] DEFAULT '{}',
  
  -- Versioning pour adaptations
  version integer DEFAULT 1,
  
  -- Plan complet (structure semaines/séances/exercices)
  plan_data jsonb NOT NULL, -- Structure complète du plan
  
  -- Règles d'adaptation
  adaptation_rules jsonb DEFAULT '{}', -- {microProgression: '...', microDeload: '...', mesoUpgrade: '...'}
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Contraintes
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  CONSTRAINT valid_palier CHECK (palier > 0),
  CONSTRAINT valid_duration CHECK (duration_weeks > 0 AND duration_weeks <= 52),
  CONSTRAINT valid_sessions_per_week CHECK (sessions_per_week > 0 AND sessions_per_week <= 14)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_training_plans_user_id ON training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_status ON training_plans(status);
CREATE INDEX IF NOT EXISTS idx_training_plans_created_at ON training_plans(created_at DESC);

-- RLS
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training plans"
  ON training_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training plans"
  ON training_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training plans"
  ON training_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training plans"
  ON training_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. TRAINING_SESSIONS
-- Séances individuelles dans un plan
-- =====================================================

CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  
  -- Métadonnées séance
  session_index integer NOT NULL, -- Position dans le plan (0-based)
  week_number integer NOT NULL,
  type text NOT NULL, -- strength, cardio, mixed, yoga, etc.
  status text NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, skipped
  
  -- Planning
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Cibles
  duration_target_min integer NOT NULL,
  duration_actual_min integer,
  completion_target integer DEFAULT 95, -- % cible de complétion
  completion_actual integer, -- % réel de complétion
  
  -- Configuration
  equipment_needed text[] DEFAULT '{}',
  venue text, -- Lieu prévu
  
  -- Prescription détaillée
  intention text, -- Texte motivation/objectif séance
  prescription jsonb NOT NULL, -- {warmup: {...}, blocks: [{exercises: [...]}], cooldown: {...}}
  
  -- Feedback global séance (rempli après complétion)
  rpe_avg numeric(3,1), -- RPE moyen 1-10
  effort_perceived integer, -- 1-10
  enjoyment integer, -- 1-10
  notes text,
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_session_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped')),
  CONSTRAINT valid_week_number CHECK (week_number > 0),
  CONSTRAINT valid_completion_target CHECK (completion_target >= 0 AND completion_target <= 100),
  CONSTRAINT valid_rpe CHECK (rpe_avg IS NULL OR (rpe_avg >= 1 AND rpe_avg <= 10))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_plan_id ON training_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_scheduled_at ON training_sessions(scheduled_at);

-- RLS
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training sessions"
  ON training_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training sessions"
  ON training_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training sessions"
  ON training_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training sessions"
  ON training_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. TRAINING_EXERCISES
-- Exercices par séance avec cibles précises
-- =====================================================

CREATE TABLE IF NOT EXISTS training_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  
  -- Identité exercice
  exercise_id text NOT NULL, -- ID exercice (ex: 'bench_press')
  variant text, -- Variante (ex: 'barbell', 'dumbbell')
  exercise_index integer NOT NULL, -- Position dans la séance
  block_type text DEFAULT 'main', -- warmup, main, accessory, cooldown
  
  -- Cibles prescription
  target jsonb NOT NULL, -- {sets: 3, reps: 10, load_kg: 60, tempo: '3-1-1', rest_s: 90, rpe_target: 7}
  
  -- Métadonnées exercice
  movement_pattern text, -- horizontal_push, vertical_pull, squat, hinge, etc.
  stimulus text, -- Muscles ciblés
  safety_tags text[] DEFAULT '{}', -- ['shoulder_ok', 'knee_ok']
  substitutions text[] DEFAULT '{}', -- IDs exercices substituts
  instructions text, -- Instructions courtes
  
  -- Feedback réel (rempli pendant/après exécution)
  actual jsonb, -- {sets_done: 3, reps_done: [10,9,8], load_used_kg: 58, rest_actual_s: [95,100]}
  completed_pct integer, -- % complétion exercice
  rpe_actual numeric(3,1), -- RPE réel
  pain boolean DEFAULT false,
  pain_details jsonb, -- {joint: 'shoulder', severity: 3}
  technique_rating integer, -- 1-5
  notes text,
  was_substituted boolean DEFAULT false,
  substituted_from text, -- Exercise_id original si substitution
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_completed_pct CHECK (completed_pct IS NULL OR (completed_pct >= 0 AND completed_pct <= 100)),
  CONSTRAINT valid_rpe_actual CHECK (rpe_actual IS NULL OR (rpe_actual >= 1 AND rpe_actual <= 10)),
  CONSTRAINT valid_technique CHECK (technique_rating IS NULL OR (technique_rating >= 1 AND technique_rating <= 5))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_training_exercises_user_id ON training_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_training_exercises_session_id ON training_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_training_exercises_exercise_id ON training_exercises(exercise_id);

-- RLS
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training exercises"
  ON training_exercises FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training exercises"
  ON training_exercises FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training exercises"
  ON training_exercises FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training exercises"
  ON training_exercises FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. TRAINING_FEEDBACK
-- Feedbacks utilisateur consolidés
-- =====================================================

CREATE TABLE IF NOT EXISTS training_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES training_exercises(id) ON DELETE CASCADE,
  
  -- Type feedback
  feedback_type text NOT NULL, -- exercise, session
  
  -- Données feedback
  feedback_data jsonb NOT NULL, -- Structure flexible selon type
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('exercise', 'session'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_training_feedback_user_id ON training_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_session_id ON training_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_created_at ON training_feedback(created_at DESC);

-- RLS
ALTER TABLE training_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training feedback"
  ON training_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training feedback"
  ON training_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. TRAINING_ADAPTATIONS
-- Historique adaptations IA appliquées
-- =====================================================

CREATE TABLE IF NOT EXISTS training_adaptations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  session_id uuid REFERENCES training_sessions(id) ON DELETE SET NULL,
  
  -- Règles déclenchées
  rules_fired text[] NOT NULL, -- ['MICRO:+5%', 'MESO:keep']
  adaptation_type text NOT NULL, -- micro, meso, macro
  
  -- Patch appliqué
  patch jsonb NOT NULL, -- [{target: 'session[+1].exercise[squat]', op: 'inc', field: 'load', value: 0.05}]
  
  -- Versioning
  version_before integer NOT NULL,
  version_after integer NOT NULL,
  
  -- Explication
  explanation text NOT NULL, -- Texte généré IA
  summary text, -- Résumé court
  
  -- Acceptation utilisateur
  user_accepted boolean DEFAULT true,
  user_notes text,
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_adaptation_type CHECK (adaptation_type IN ('micro', 'meso', 'macro'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_training_adaptations_user_id ON training_adaptations(user_id);
CREATE INDEX IF NOT EXISTS idx_training_adaptations_plan_id ON training_adaptations(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_adaptations_created_at ON training_adaptations(created_at DESC);

-- RLS
ALTER TABLE training_adaptations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training adaptations"
  ON training_adaptations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training adaptations"
  ON training_adaptations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. TRAINING_EVENTS
-- Journal d'audit complet
-- =====================================================

CREATE TABLE IF NOT EXISTS training_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type événement
  event_type text NOT NULL, -- PLAN.GENERATED, SESSION.STARTED, EXERCISE.SUBSTITUTED, etc.
  
  -- Payload
  payload jsonb NOT NULL, -- Données événement complètes
  
  -- Contexte
  plan_id uuid REFERENCES training_plans(id) ON DELETE SET NULL,
  session_id uuid REFERENCES training_sessions(id) ON DELETE SET NULL,
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  client_trace_id text -- Pour corrélation logs frontend
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_training_events_user_id ON training_events(user_id);
CREATE INDEX IF NOT EXISTS idx_training_events_event_type ON training_events(event_type);
CREATE INDEX IF NOT EXISTS idx_training_events_created_at ON training_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_events_plan_id ON training_events(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_events_session_id ON training_events(session_id);

-- RLS
ALTER TABLE training_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training events"
  ON training_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training events"
  ON training_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_training_profile_updated_at ON training_profile;
CREATE TRIGGER update_training_profile_updated_at
  BEFORE UPDATE ON training_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_plans_updated_at ON training_plans;
CREATE TRIGGER update_training_plans_updated_at
  BEFORE UPDATE ON training_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_sessions_updated_at ON training_sessions;
CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_exercises_updated_at ON training_exercises;
CREATE TRIGGER update_training_exercises_updated_at
  BEFORE UPDATE ON training_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

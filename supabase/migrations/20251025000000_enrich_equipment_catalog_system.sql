/*
  # Enrich Equipment Catalog System

  Migration pour enrichir la table equipment_types avec le catalogue complet
  de 300+ équipements depuis equipment-reference.ts.

  ## Objectifs
  - Migrer tous les équipements du fichier TypeScript vers Supabase
  - Préserver la structure existante et les contraintes
  - Ajouter les métadonnées: subcategory, synonyms
  - Garantir ZÉRO régression sur le système de détection existant

  ## Changements
  1. Ajout de colonnes: subcategory, synonyms
  2. Enrichissement massif des équipements (40 → 300+)
  3. Conservation de tous les équipements existants

  ## Sécurité
  - Aucun changement aux RLS policies
  - Compatibilité totale avec detect-equipment edge function
*/

-- ============================================================================
-- 1. AJOUT DE NOUVELLES COLONNES À equipment_types
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment_types' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE equipment_types ADD COLUMN subcategory text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment_types' AND column_name = 'synonyms'
  ) THEN
    ALTER TABLE equipment_types ADD COLUMN synonyms text[];
  END IF;
END $$;

-- ============================================================================
-- 2. ENRICHISSEMENT: CARDIO (19 équipements)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('treadmill', 'Tapis de course motorisé', 'Motorized treadmill', 'cardio', 'treadmills', 'Tapis roulant motorisé'),
  ('curved-treadmill', 'Tapis de course courbé', 'Curved treadmill', 'cardio', 'treadmills', 'Tapis de course non motorisé courbé'),
  ('stationary-bike', 'Vélo stationnaire', 'Stationary bike', 'cardio', 'bikes', 'Vélo d''appartement standard'),
  ('spin-bike', 'Vélo de spinning', 'Spin bike', 'cardio', 'bikes', 'Vélo de spinning pour cours collectifs'),
  ('recumbent-bike', 'Vélo semi-allongé', 'Recumbent bike', 'cardio', 'bikes', 'Vélo avec dossier'),
  ('assault-bike', 'Assault bike / Air bike', 'Assault bike', 'cardio', 'bikes', 'Vélo avec bras à résistance air'),
  ('fan-bike', 'Vélo à air', 'Fan bike', 'cardio', 'bikes', 'Vélo à résistance par ventilateur'),
  ('rowing-machine', 'Rameur / Aviron', 'Rowing machine', 'cardio', 'rowing', 'Rameur Concept2 ou similaire'),
  ('elliptical', 'Vélo elliptique', 'Elliptical trainer', 'cardio', 'ellipticals', 'Vélo elliptique standard'),
  ('arc-trainer', 'Arc trainer', 'Arc trainer', 'cardio', 'ellipticals', 'Elliptique à mouvement arc'),
  ('air-walker', 'Air walker / Glider extérieur', 'Air walker (outdoor glider)', 'cardio', 'ellipticals', 'Machine elliptique extérieure'),
  ('stair-climber', 'Simulateur d''escalier', 'Stair climber', 'cardio', 'climbers', 'Machine escaliers'),
  ('stairmaster', 'Stairmaster', 'Stairmaster', 'cardio', 'climbers', 'Machine escaliers rotatifs'),
  ('versa-climber', 'VersaClimber', 'VersaClimber', 'cardio', 'climbers', 'Machine escalade verticale'),
  ('jacob-ladder', 'Jacob''s Ladder', 'Jacob''s Ladder', 'cardio', 'climbers', 'Échelle sans fin'),
  ('ski-erg', 'Ski-erg', 'Ski erg', 'cardio', 'ergs', 'Machine simulation ski de fond'),
  ('arm-ergometer', 'Ergomètre bras / Hand bike', 'Upper body ergometer (arm bike)', 'cardio', 'ergs', 'Vélo pour les bras'),
  ('rider-machine', 'Rider extérieur', 'Outdoor rider', 'cardio', 'others', 'Machine de fitness extérieure'),
  ('waist-twister-station', 'Station twister taille', 'Waist twister station', 'cardio', 'spinners', 'Station rotation taille')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 3. ENRICHISSEMENT: PECTORAUX (6 machines)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('chest-press-machine', 'Machine presse pectoraux', 'Chest press machine', 'machine', 'chest', 'Machine guidée développé couché'),
  ('pec-deck', 'Pec deck / Butterfly', 'Pec deck machine', 'machine', 'chest', 'Machine butterfly pectoraux'),
  ('cable-crossover', 'Poulie vis-à-vis', 'Cable crossover', 'cable', 'chest', 'Câbles croisés pour pectoraux'),
  ('incline-press-machine', 'Machine presse inclinée', 'Incline press machine', 'machine', 'chest', 'Machine développé incliné'),
  ('decline-press-machine', 'Machine presse déclinée', 'Decline press machine', 'machine', 'chest', 'Machine développé décliné'),
  ('chest-fly-machine', 'Machine écarté couché', 'Chest fly machine', 'machine', 'chest', 'Machine écartés pectoraux')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 4. ENRICHISSEMENT: DOS (9 machines)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('lat-pulldown', 'Machine tirage vertical / Lat pulldown', 'Lat pulldown machine', 'cable', 'back', 'Machine tirage vertical dorsaux'),
  ('seated-row', 'Machine tirage horizontal assis', 'Seated row machine', 'cable', 'back', 'Machine tirage horizontal'),
  ('low-row-machine', 'Machine tirage bas', 'Low row machine', 'machine', 'back', 'Machine tirage bas pour dos'),
  ('t-bar-row', 'T-bar row', 'T-bar row', 'machine', 'back', 'Machine tirage barre en T'),
  ('assisted-pull-up-machine', 'Machine tractions assistées', 'Assisted pull-up machine', 'machine', 'back', 'Machine assistance tractions'),
  ('back-extension-bench', 'Banc extension lombaires', 'Back extension bench', 'accessory', 'back', 'Banc extensions dos'),
  ('hyperextension-bench', 'Banc hyperextension / Roman chair', 'Hyperextension bench', 'accessory', 'back', 'Banc hyperextensions'),
  ('reverse-hyperextension-machine', 'Machine reverse hyper', 'Reverse hyperextension machine', 'machine', 'back', 'Machine reverse hyperextensions'),
  ('reverse-fly-machine', 'Machine écarté postérieur', 'Reverse fly machine', 'machine', 'back', 'Machine rear delt fly')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 5. ENRICHISSEMENT: ÉPAULES (5 machines)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('shoulder-press-machine', 'Machine développé épaules', 'Shoulder press machine', 'machine', 'shoulders', 'Machine développé militaire'),
  ('lateral-raise-machine', 'Machine élévations latérales', 'Lateral raise machine', 'machine', 'shoulders', 'Machine élévations latérales'),
  ('rear-delt-machine', 'Machine deltoïdes postérieurs', 'Rear delt machine', 'machine', 'shoulders', 'Machine deltoïdes arrière'),
  ('front-raise-machine', 'Machine élévations frontales', 'Front raise machine', 'machine', 'shoulders', 'Machine élévations frontales'),
  ('shrug-machine', 'Machine shrugs / Trapèzes', 'Shrug machine', 'machine', 'shoulders', 'Machine haussements épaules')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 6. ENRICHISSEMENT: BRAS (6 machines)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('bicep-curl-machine', 'Machine curl biceps', 'Bicep curl machine', 'machine', 'arms', 'Machine isolation biceps'),
  ('preacher-curl-bench', 'Pupitre curl / Preacher curl', 'Preacher curl bench', 'accessory', 'arms', 'Banc pupitre pour curls'),
  ('tricep-extension-machine', 'Machine extension triceps', 'Tricep extension machine', 'machine', 'arms', 'Machine isolation triceps'),
  ('tricep-dip-machine', 'Machine dips triceps', 'Tricep dip machine', 'machine', 'arms', 'Machine dips assistés'),
  ('arm-curl-station', 'Station curl bras', 'Arm curl station', 'machine', 'arms', 'Station curls biceps'),
  ('cable-bicep-station', 'Poulie biceps', 'Cable bicep station', 'cable', 'arms', 'Poulie pour curls biceps')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 7. ENRICHISSEMENT: JAMBES ET FESSIERS (22 machines)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('leg-press', 'Presse à cuisses / Leg press', 'Leg press', 'machine', 'legs', 'Machine presse jambes'),
  ('leg-press-45', 'Presse à cuisses 45 degrés', '45-degree leg press', 'machine', 'legs', 'Presse jambes inclinée 45°'),
  ('vertical-leg-press', 'Presse à cuisses verticale', 'Vertical leg press', 'machine', 'legs', 'Presse verticale'),
  ('hack-squat', 'Hack squat', 'Hack squat machine', 'machine', 'legs', 'Machine hack squat'),
  ('pendulum-squat', 'Squat pendulaire', 'Pendulum squat', 'machine', 'legs', 'Machine squat pendulaire'),
  ('belt-squat-machine', 'Machine squat à ceinture', 'Belt squat machine', 'machine', 'legs', 'Machine squat avec ceinture'),
  ('leg-extension', 'Machine extension jambes / Quadriceps', 'Leg extension machine', 'machine', 'legs', 'Machine extension quadriceps'),
  ('leg-curl', 'Machine curl jambes / Ischio', 'Leg curl machine', 'machine', 'legs', 'Machine curl ischio-jambiers'),
  ('seated-leg-curl', 'Machine curl jambes assis', 'Seated leg curl', 'machine', 'legs', 'Leg curl assis'),
  ('lying-leg-curl', 'Machine curl jambes allongé', 'Lying leg curl', 'machine', 'legs', 'Leg curl allongé'),
  ('standing-leg-curl', 'Machine curl jambes debout', 'Standing leg curl', 'machine', 'legs', 'Leg curl debout'),
  ('calf-raise-machine', 'Machine mollets / Calf raise', 'Calf raise machine', 'machine', 'legs', 'Machine élévation mollets'),
  ('standing-calf-raise', 'Machine mollets debout', 'Standing calf raise', 'machine', 'legs', 'Mollets debout'),
  ('seated-calf-raise', 'Machine mollets assis', 'Seated calf raise', 'machine', 'legs', 'Mollets assis'),
  ('donkey-calf-raise', 'Machine mollets donkey', 'Donkey calf raise machine', 'machine', 'legs', 'Mollets donkey'),
  ('hip-abduction-machine', 'Machine abduction hanches', 'Hip abduction machine', 'machine', 'legs', 'Machine abduction hanches'),
  ('hip-adduction-machine', 'Machine adduction hanches', 'Hip adduction machine', 'machine', 'legs', 'Machine adduction hanches'),
  ('hip-thrust-machine', 'Machine hip thrust', 'Hip thrust machine', 'machine', 'legs', 'Machine hip thrust fessiers'),
  ('glute-machine', 'Machine fessiers', 'Glute machine', 'machine', 'legs', 'Machine isolation fessiers'),
  ('glute-kickback-machine', 'Machine kickback fessiers', 'Glute kickback machine', 'machine', 'legs', 'Machine kickback fessiers'),
  ('smith-machine', 'Smith machine / Cadre guidé', 'Smith machine', 'machine', 'legs', 'Barre guidée verticale')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 8. ENRICHISSEMENT: TRONC / ABDOS (8 machines)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('ab-crunch-machine', 'Machine crunch abdominaux', 'Ab crunch machine', 'machine', 'core', 'Machine crunch guidé'),
  ('ab-coaster', 'Machine Ab Coaster', 'Ab Coaster machine', 'machine', 'core', 'Machine ab coaster'),
  ('torso-rotation-machine', 'Machine rotation du tronc', 'Torso rotation machine', 'machine', 'core', 'Machine rotation obliques'),
  ('ab-bench', 'Banc abdominaux', 'Ab bench', 'accessory', 'core', 'Banc pour sit-ups'),
  ('decline-sit-up-bench', 'Banc sit-up décliné', 'Decline sit-up bench', 'accessory', 'core', 'Banc décliné abdos'),
  ('roman-chair', 'Chaise romaine', 'Roman chair', 'accessory', 'core', 'Station relevés de jambes'),
  ('ghd', 'GHD / Glute-Ham Developer', 'Glute-Ham Developer (GHD)', 'machine', 'specialty', 'Machine GHD crossfit'),
  ('ab-mat', 'Ab mat', 'Ab mat', 'accessory', 'core', 'Tapis abdominaux')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- Suite dans le prochain segment...

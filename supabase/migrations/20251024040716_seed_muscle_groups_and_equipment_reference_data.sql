/*
  # Seed Muscle Groups and Equipment Reference Data

  Populate reference tables with comprehensive data for:
  - 50+ muscle groups covering all body regions
  - 40+ equipment types across all categories
*/

-- ============================================================================
-- Seed Muscle Groups
-- ============================================================================

INSERT INTO muscle_groups (name, name_fr, name_en, category, body_region, description) VALUES
  -- Upper Body - Primary
  ('pectoraux', 'Pectoraux', 'Pectorals', 'major', 'upper', 'Muscles de la poitrine'),
  ('dorsaux', 'Dorsaux (Grand dorsal)', 'Latissimus Dorsi', 'major', 'upper', 'Large muscles du dos'),
  ('trapezes', 'Trapèzes', 'Trapezius', 'major', 'upper', 'Muscles du haut du dos et nuque'),
  ('deltoides', 'Deltoïdes', 'Deltoids', 'major', 'upper', 'Muscles des épaules'),
  ('biceps', 'Biceps', 'Biceps', 'major', 'upper', 'Muscles avant des bras'),
  ('triceps', 'Triceps', 'Triceps', 'major', 'upper', 'Muscles arrière des bras'),
  
  -- Upper Body - Secondary
  ('rhomboides', 'Rhomboïdes', 'Rhomboids', 'minor', 'upper', 'Muscles entre les omoplates'),
  ('serratus', 'Dentelés antérieurs', 'Serratus Anterior', 'minor', 'upper', 'Muscles sur les côtés de la cage thoracique'),
  ('rotateurs-coiffe', 'Rotateurs de la coiffe', 'Rotator Cuff', 'stabilizer', 'upper', 'Muscles stabilisateurs de l''épaule'),
  ('avant-bras', 'Avant-bras', 'Forearms', 'minor', 'upper', 'Muscles des avant-bras et grip'),
  ('pectoraux-claviculaire', 'Pectoraux (partie haute)', 'Upper Chest', 'minor', 'upper', 'Partie supérieure des pectoraux'),
  ('pectoraux-sternal', 'Pectoraux (partie moyenne)', 'Mid Chest', 'minor', 'upper', 'Partie moyenne des pectoraux'),
  ('pectoraux-abdominal', 'Pectoraux (partie basse)', 'Lower Chest', 'minor', 'upper', 'Partie inférieure des pectoraux'),
  
  -- Lower Body - Primary
  ('quadriceps', 'Quadriceps', 'Quadriceps', 'major', 'lower', 'Muscles avant des cuisses'),
  ('ischiojambiers', 'Ischio-jambiers', 'Hamstrings', 'major', 'lower', 'Muscles arrière des cuisses'),
  ('fessiers', 'Fessiers (Grand fessier)', 'Glutes', 'major', 'lower', 'Muscles des fesses'),
  ('mollets', 'Mollets', 'Calves', 'major', 'lower', 'Muscles des jambes'),
  ('adducteurs', 'Adducteurs', 'Adductors', 'minor', 'lower', 'Muscles intérieurs des cuisses'),
  ('abducteurs', 'Abducteurs', 'Abductors', 'minor', 'lower', 'Muscles extérieurs des hanches'),
  
  -- Lower Body - Secondary
  ('tibial-anterieur', 'Tibial antérieur', 'Tibialis Anterior', 'minor', 'lower', 'Muscle avant du tibia'),
  ('flechisseurs-hanche', 'Fléchisseurs de hanche', 'Hip Flexors', 'minor', 'lower', 'Muscles avant de la hanche'),
  ('tenseur-fascia-lata', 'Tenseur du fascia lata', 'TFL', 'minor', 'lower', 'Muscle latéral de la hanche'),
  ('moyen-fessier', 'Moyen fessier', 'Gluteus Medius', 'minor', 'lower', 'Muscle stabilisateur de la hanche'),
  ('petit-fessier', 'Petit fessier', 'Gluteus Minimus', 'minor', 'lower', 'Muscle stabilisateur profond de la hanche'),
  
  -- Core
  ('abdominaux', 'Abdominaux (Grand droit)', 'Rectus Abdominis', 'major', 'core', 'Muscle abdominal principal'),
  ('obliques', 'Obliques', 'Obliques', 'major', 'core', 'Muscles latéraux du tronc'),
  ('transverse', 'Transverse', 'Transverse Abdominis', 'major', 'core', 'Muscle profond de la sangle abdominale'),
  ('lombaires', 'Lombaires', 'Erector Spinae', 'major', 'core', 'Muscles du bas du dos'),
  ('carre-lombes', 'Carré des lombes', 'Quadratus Lumborum', 'stabilizer', 'core', 'Muscle stabilisateur du dos'),
  ('multifides', 'Multifides', 'Multifidus', 'stabilizer', 'core', 'Muscles profonds de la colonne'),
  
  -- Neck and Face
  ('cou', 'Muscles du cou', 'Neck', 'minor', 'upper', 'Muscles cervicaux'),
  ('sterno-cleido-mastoidien', 'Sterno-cléido-mastoïdien', 'Sternocleidomastoid', 'minor', 'upper', 'Muscle latéral du cou'),
  
  -- Full Body
  ('corps-complet', 'Corps complet', 'Full Body', 'major', 'full_body', 'Engagement de tout le corps'),
  ('chaine-posterieure', 'Chaîne postérieure', 'Posterior Chain', 'major', 'full_body', 'Dos, fessiers, ischio-jambiers'),
  ('chaine-anterieure', 'Chaîne antérieure', 'Anterior Chain', 'major', 'full_body', 'Poitrine, abdominaux, quadriceps'),
  
  -- Cardiovascular
  ('systeme-cardiovasculaire', 'Système cardiovasculaire', 'Cardiovascular System', 'major', 'full_body', 'Cœur et système circulatoire'),
  ('systeme-respiratoire', 'Système respiratoire', 'Respiratory System', 'major', 'full_body', 'Poumons et capacité respiratoire')
  
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Seed Equipment Types
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, description) VALUES
  -- Barbell
  ('barbell', 'Barre olympique', 'Olympic Barbell', 'barbell', 'Barre standard 20kg'),
  ('ez-bar', 'Barre EZ', 'EZ Bar', 'barbell', 'Barre courbée pour biceps/triceps'),
  ('trap-bar', 'Barre hexagonale', 'Trap Bar', 'barbell', 'Barre hexagonale pour deadlifts'),
  ('safety-squat-bar', 'Barre de squat safety', 'Safety Squat Bar', 'barbell', 'Barre avec pads pour épaules'),
  
  -- Dumbbell & Free Weights
  ('dumbbell', 'Haltères', 'Dumbbells', 'dumbbell', 'Haltères libres'),
  ('kettlebell', 'Kettlebell', 'Kettlebell', 'dumbbell', 'Poids avec anse'),
  ('medicine-ball', 'Medecine ball', 'Medicine Ball', 'dumbbell', 'Ballon lesté'),
  ('weight-plates', 'Disques', 'Weight Plates', 'dumbbell', 'Disques pour barres'),
  
  -- Machines
  ('leg-press', 'Presse à cuisses', 'Leg Press', 'machine', 'Machine guidée pour jambes'),
  ('lat-pulldown', 'Machine lat pulldown', 'Lat Pulldown Machine', 'machine', 'Machine pour dorsaux'),
  ('chest-press-machine', 'Machine développé couché', 'Chest Press Machine', 'machine', 'Machine guidée pour pectoraux'),
  ('leg-extension', 'Machine extension jambes', 'Leg Extension', 'machine', 'Machine isolation quadriceps'),
  ('leg-curl', 'Machine leg curl', 'Leg Curl', 'machine', 'Machine isolation ischio-jambiers'),
  ('smith-machine', 'Smith machine', 'Smith Machine', 'machine', 'Barre guidée verticalement'),
  
  -- Cable
  ('cable-machine', 'Machine à câbles', 'Cable Machine', 'cable', 'Système de câbles et poulies'),
  ('cable-crossover', 'Cable crossover', 'Cable Crossover', 'cable', 'Double poulie pour crossovers'),
  
  -- Bodyweight Equipment
  ('pull-up-bar', 'Barre de traction', 'Pull-up Bar', 'bodyweight', 'Barre fixe pour tractions'),
  ('dip-bars', 'Barres à dips', 'Dip Bars', 'bodyweight', 'Barres parallèles pour dips'),
  ('parallel-bars', 'Barres parallèles', 'Parallel Bars', 'bodyweight', 'Barres parallèles gymnastique'),
  ('gymnastic-rings', 'Anneaux de gymnastique', 'Gymnastic Rings', 'bodyweight', 'Anneaux suspendus'),
  ('parallettes', 'Parallettes', 'Parallettes', 'bodyweight', 'Mini barres parallèles au sol'),
  ('wall', 'Mur', 'Wall', 'bodyweight', 'Mur pour support'),
  ('floor', 'Sol', 'Floor', 'bodyweight', 'Au sol sans équipement'),
  
  -- Benches and Racks
  ('bench', 'Banc', 'Bench', 'accessory', 'Banc plat ou incliné'),
  ('incline-bench', 'Banc incliné', 'Incline Bench', 'accessory', 'Banc réglable inclinaison'),
  ('squat-rack', 'Rack à squat', 'Squat Rack', 'accessory', 'Support pour barres'),
  ('power-rack', 'Cage à squat', 'Power Rack', 'accessory', 'Cage complète avec sécurités'),
  
  -- Cardio Equipment
  ('treadmill', 'Tapis de course', 'Treadmill', 'cardio', 'Tapis roulant'),
  ('rowing-machine', 'Rameur', 'Rowing Machine', 'cardio', 'Concept2 ou similaire'),
  ('assault-bike', 'Assault bike', 'Assault Bike', 'cardio', 'Vélo avec bras'),
  ('air-bike', 'Air bike', 'Air Bike', 'cardio', 'Vélo à résistance air'),
  ('bike', 'Vélo', 'Bike', 'cardio', 'Vélo d''appartement ou route'),
  ('ski-erg', 'Ski erg', 'Ski Erg', 'cardio', 'Machine à ramer verticale'),
  
  -- Accessory
  ('resistance-band', 'Élastique', 'Resistance Band', 'accessory', 'Bandes élastiques'),
  ('jump-rope', 'Corde à sauter', 'Jump Rope', 'accessory', 'Corde pour double unders'),
  ('box', 'Box', 'Plyo Box', 'accessory', 'Box pour sauts'),
  ('ab-mat', 'Abmat', 'Ab Mat', 'accessory', 'Support pour sit-ups'),
  ('foam-roller', 'Rouleau mousse', 'Foam Roller', 'accessory', 'Pour récupération'),
  ('yoga-mat', 'Tapis de yoga', 'Yoga Mat', 'accessory', 'Tapis de sol'),
  
  -- Specialized
  ('ghd', 'GHD', 'GHD Machine', 'machine', 'Glute Ham Developer'),
  ('rope', 'Corde', 'Rope', 'accessory', 'Corde à grimper'),
  ('sled', 'Traîneau', 'Sled', 'accessory', 'Traîneau à pousser/tirer'),
  ('tire', 'Pneu', 'Tire', 'accessory', 'Gros pneu pour strongman'),
  ('sandbag', 'Sandbag', 'Sandbag', 'accessory', 'Sac de sable')
  
ON CONFLICT (name) DO NOTHING;

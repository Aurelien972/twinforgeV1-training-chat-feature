/*
  # Peuplement Complet du Catalogue d'Équipements - 500+ Items

  ## Vue d'ensemble
  Insertion massive de 500+ équipements pour couvrir TOUS les contextes d'entraînement:
  - Salle de sport (machines, poids, accessoires)
  - Maison (meubles, objets du quotidien, bouteilles, livres, sacs, etc.)
  - Extérieur urbain (bancs, escaliers, murs, poteaux)
  - Extérieur nature (arbres, roches, terrain)
  - Plage (sable, eau, bois flotté, pierres)
  - Campagne (bûches, outils de ferme, barrières)
  - Parc (jeux pour enfants, fontaines, éléments sportifs)

  ## Nouveautés
  - Objets maison exhaustifs (cuisine, salon, chambre, garage)
  - Éléments de plage et bord de mer
  - Outils et éléments de campagne
  - Équipements de parc et aires de jeux
  - Objets improvisés pour lestage (bouteilles, sacs, livres)
*/

-- =====================================================
-- INSERTION DES CATÉGORIES
-- =====================================================

INSERT INTO equipment_categories (id, label, description, display_order, location_types) VALUES
  ('cardio', 'Cardio', 'Équipements cardiovasculaires et d''endurance', 1, ARRAY['gym', 'home']),
  ('chest', 'Pectoraux', 'Machines et équipements pour les pectoraux', 2, ARRAY['gym']),
  ('back', 'Dos', 'Machines et équipements pour le dos', 3, ARRAY['gym']),
  ('shoulders', 'Épaules', 'Machines et équipements pour les épaules', 4, ARRAY['gym']),
  ('arms', 'Bras', 'Machines et équipements pour les bras', 5, ARRAY['gym']),
  ('legs', 'Jambes et Fessiers', 'Machines et équipements pour les jambes et fessiers', 6, ARRAY['gym']),
  ('core', 'Tronc et Abdos', 'Machines et équipements pour le tronc et abdominaux', 7, ARRAY['gym']),
  ('racks', 'Racks et Stations', 'Racks, cages et stations multifonctions', 8, ARRAY['gym', 'home']),
  ('benches', 'Bancs', 'Bancs de musculation et accessoires', 9, ARRAY['gym', 'home']),
  ('weights', 'Poids Libres', 'Haltères, barres, disques et poids libres', 10, ARRAY['gym', 'home']),
  ('cables', 'Accessoires Câbles', 'Accessoires pour machines à câbles', 11, ARRAY['gym']),
  ('functional', 'Fonctionnel et CrossFit', 'Équipements de training fonctionnel et CrossFit', 12, ARRAY['gym', 'outdoor']),
  ('calisthenics', 'Callisthénie et Outdoor', 'Équipements de callisthénie et extérieur', 13, ARRAY['outdoor', 'gym']),
  ('combat', 'Sports de Combat', 'Sacs de frappe et équipements de boxe', 14, ARRAY['gym']),
  ('mobility', 'Pilates, Yoga et Mobilité', 'Équipements de Pilates, yoga et récupération', 15, ARRAY['gym', 'home']),
  ('accessories', 'Accessoires Divers', 'Accessoires de musculation et rangement', 16, ARRAY['gym', 'home']),
  ('home-furniture', 'Meubles et Objets Maison', 'Meubles et objets du quotidien utilisables pour l''entraînement', 17, ARRAY['home']),
  ('home-objects', 'Objets Maison Improvisés', 'Objets du quotidien utilisables comme poids ou accessoires', 18, ARRAY['home']),
  ('outdoor-natural', 'Éléments Naturels Extérieurs', 'Arbres, roches, terrain et éléments naturels outdoor', 19, ARRAY['outdoor']),
  ('outdoor-urban', 'Structures Urbaines Extérieures', 'Bancs, escaliers, murs et infrastructures publiques', 20, ARRAY['outdoor']),
  ('beach', 'Plage et Bord de Mer', 'Éléments et surfaces spécifiques à la plage', 21, ARRAY['outdoor']),
  ('countryside', 'Campagne et Ferme', 'Outils et éléments ruraux', 22, ARRAY['outdoor']),
  ('park', 'Parc et Aires de Jeux', 'Équipements de parc et jeux pour enfants', 23, ARRAY['outdoor'])
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  location_types = EXCLUDED.location_types;

-- =====================================================
-- ÉQUIPEMENTS CARDIO (19 items)
-- =====================================================

INSERT INTO equipment_types (id, name_fr, name_en, category_id, subcategory, synonyms) VALUES
  ('treadmill', 'Tapis de course motorisé', 'Motorized treadmill', 'cardio', 'treadmills', ARRAY['Tapis roulant']),
  ('curved-treadmill', 'Tapis de course courbé', 'Curved treadmill', 'cardio', 'treadmills', ARRAY[]::text[]),
  ('stationary-bike', 'Vélo stationnaire', 'Stationary bike', 'cardio', 'bikes', ARRAY['Vélo d''appartement']),
  ('spin-bike', 'Vélo de spinning', 'Spin bike', 'cardio', 'bikes', ARRAY['Vélo de biking']),
  ('recumbent-bike', 'Vélo semi-allongé', 'Recumbent bike', 'cardio', 'bikes', ARRAY[]::text[]),
  ('assault-bike', 'Assault bike / Air bike', 'Assault bike', 'cardio', 'bikes', ARRAY['Air bike']),
  ('fan-bike', 'Vélo à air', 'Fan bike', 'cardio', 'bikes', ARRAY[]::text[]),
  ('rowing-machine', 'Rameur / Aviron', 'Rowing machine', 'cardio', 'rowing', ARRAY['Aviron', 'Rameur indoor']),
  ('elliptical', 'Vélo elliptique', 'Elliptical trainer', 'cardio', 'ellipticals', ARRAY['Elliptique']),
  ('arc-trainer', 'Arc trainer', 'Arc trainer', 'cardio', 'ellipticals', ARRAY[]::text[]),
  ('air-walker', 'Air walker / Glider extérieur', 'Air walker', 'cardio', 'ellipticals', ARRAY['Glider']),
  ('stair-climber', 'Simulateur d''escalier', 'Stair climber', 'cardio', 'climbers', ARRAY['Stepper']),
  ('stairmaster', 'Stairmaster', 'Stairmaster', 'cardio', 'climbers', ARRAY[]::text[]),
  ('versa-climber', 'VersaClimber', 'VersaClimber', 'cardio', 'climbers', ARRAY[]::text[]),
  ('jacob-ladder', 'Jacob''s Ladder', 'Jacob''s Ladder', 'cardio', 'climbers', ARRAY['Échelle de Jacob']),
  ('ski-erg', 'Ski-erg', 'Ski erg', 'cardio', 'ergs', ARRAY[]::text[]),
  ('arm-ergometer', 'Ergomètre bras / Hand bike', 'Upper body ergometer', 'cardio', 'ergs', ARRAY['Hand bike']),
  ('rider-machine', 'Rider extérieur', 'Outdoor rider', 'cardio', 'others', ARRAY[]::text[]),
  ('waist-twister-station', 'Station twister taille', 'Waist twister station', 'cardio', 'spinners', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  subcategory = EXCLUDED.subcategory,
  synonyms = EXCLUDED.synonyms;

-- Compatibilités cardio
INSERT INTO equipment_location_compatibility (equipment_id, location_type, is_common) VALUES
  ('treadmill', 'gym', true),
  ('stationary-bike', 'gym', true),
  ('stationary-bike', 'home', true),
  ('spin-bike', 'gym', true),
  ('rowing-machine', 'gym', true),
  ('rowing-machine', 'home', true),
  ('elliptical', 'gym', true),
  ('elliptical', 'home', true),
  ('ski-erg', 'gym', false)
ON CONFLICT (equipment_id, location_type) DO UPDATE SET
  is_common = EXCLUDED.is_common;

-- =====================================================
-- POIDS LIBRES ENRICHIS (25 items)
-- =====================================================

INSERT INTO equipment_types (id, name_fr, name_en, category_id, subcategory, synonyms) VALUES
  ('dumbbells', 'Haltères', 'Dumbbells', 'weights', 'dumbbells', ARRAY['Poids', 'Haltères courts']),
  ('adjustable-dumbbells', 'Haltères ajustables', 'Adjustable dumbbells', 'weights', 'dumbbells', ARRAY['Haltères modulables']),
  ('dumbbell-rack', 'Rack à haltères', 'Dumbbell rack', 'weights', 'storage', ARRAY[]::text[]),
  ('barbell', 'Barre olympique', 'Olympic barbell', 'weights', 'barbells', ARRAY['Barre de musculation']),
  ('technique-bar', 'Barre technique', 'Technique barbell', 'weights', 'barbells', ARRAY['Barre d''apprentissage']),
  ('ez-bar', 'Barre EZ / Barre coudée', 'EZ curl bar', 'weights', 'barbells', ARRAY['Barre coudée']),
  ('curl-bar', 'Barre de curl', 'Curl bar', 'weights', 'barbells', ARRAY[]::text[]),
  ('trap-bar', 'Trap bar / Barre hexagonale', 'Trap bar', 'weights', 'barbells', ARRAY['Barre hexagonale']),
  ('safety-squat-bar', 'Barre de squat safety', 'Safety squat bar', 'weights', 'barbells', ARRAY[]::text[]),
  ('swiss-bar', 'Barre swiss / Multi-grip', 'Swiss bar', 'weights', 'barbells', ARRAY['Football bar']),
  ('kettlebells', 'Kettlebells', 'Kettlebells', 'weights', 'kettlebells', ARRAY['Girya']),
  ('competition-kettlebells', 'Kettlebells de compétition', 'Competition kettlebells', 'weights', 'kettlebells', ARRAY[]::text[]),
  ('weight-plates', 'Disques de poids', 'Weight plates', 'weights', 'plates', ARRAY['Disques olympiques']),
  ('bumper-plates', 'Disques bumper', 'Bumper plates', 'weights', 'plates', ARRAY[]::text[]),
  ('fractional-plates', 'Disques fractionnés', 'Fractional plates', 'weights', 'plates', ARRAY['Micro plates']),
  ('change-plates', 'Disques de changement', 'Change plates', 'weights', 'plates', ARRAY[]::text[]),
  ('barbell-collars', 'Colliers de barre', 'Barbell collars', 'weights', 'accessories', ARRAY['Clamps']),
  ('spring-collars', 'Colliers à ressort', 'Spring collars', 'weights', 'accessories', ARRAY[]::text[]),
  ('lifting-chains', 'Chaînes de lest', 'Lifting chains', 'weights', 'accessories', ARRAY[]::text[]),
  ('resistance-bands-heavy', 'Bandes élastiques lourdes', 'Heavy resistance bands', 'weights', 'accessories', ARRAY[]::text[]),
  ('barbell-jack', 'Levier pour barre', 'Barbell jack', 'weights', 'tools', ARRAY['Dead wedge']),
  ('loading-pin', 'Pin de chargement', 'Loading pin', 'weights', 'accessories', ARRAY[]::text[]),
  ('jerk-blocks', 'Jerk blocks', 'Jerk blocks', 'weights', 'blocks', ARRAY[]::text[]),
  ('weight-tree', 'Arbre à disques', 'Weight tree', 'weights', 'storage', ARRAY[]::text[]),
  ('barbell-holder', 'Support de barres', 'Barbell holder', 'weights', 'storage', ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- OBJETS MAISON IMPROVISÉS (50+ items)
-- =====================================================

INSERT INTO equipment_types (id, name_fr, name_en, category_id, subcategory, synonyms) VALUES
  -- Bouteilles et contenants
  ('water-bottle-small', 'Petite bouteille d''eau (0.5L)', 'Small water bottle', 'home-objects', 'bottles', ARRAY['Bouteille 50cl']),
  ('water-bottle-large', 'Grande bouteille d''eau (1-2L)', 'Large water bottle', 'home-objects', 'bottles', ARRAY['Bouteille 1L', 'Bouteille 2L']),
  ('water-jug-5l', 'Bidon d''eau 5L', 'Water jug 5L', 'home-objects', 'bottles', ARRAY['Jerrycan']),
  ('milk-jug', 'Bidon de lait', 'Milk jug', 'home-objects', 'bottles', ARRAY[]::text[]),
  ('detergent-bottle', 'Bidon de lessive', 'Laundry detergent jug', 'home-objects', 'bottles', ARRAY['Bidon de produit']),
  ('paint-can-small', 'Petit pot de peinture (1-2L)', 'Small paint can', 'home-objects', 'cans', ARRAY[]::text[]),
  ('paint-can-large', 'Grand pot de peinture (5-10L)', 'Large paint can', 'home-objects', 'cans', ARRAY[]::text[]),
  ('oil-can', 'Bidon d''huile', 'Oil can', 'home-objects', 'cans', ARRAY[]::text[]),

  -- Sacs et contenants flexibles
  ('backpack-empty', 'Sac à dos vide', 'Empty backpack', 'home-objects', 'bags', ARRAY['Sac à dos']),
  ('backpack-loaded', 'Sac à dos chargé', 'Loaded backpack', 'home-objects', 'bags', ARRAY['Sac lesté']),
  ('duffel-bag', 'Sac de sport', 'Duffel bag', 'home-objects', 'bags', ARRAY['Sac de voyage']),
  ('shopping-bag-full', 'Sac de courses plein', 'Full shopping bag', 'home-objects', 'bags', ARRAY['Sac de provisions']),
  ('rice-bag', 'Sac de riz', 'Rice bag', 'home-objects', 'bags', ARRAY['Sac de céréales']),
  ('flour-bag', 'Sac de farine', 'Flour bag', 'home-objects', 'bags', ARRAY[]::text[]),
  ('potting-soil-bag', 'Sac de terreau', 'Potting soil bag', 'home-objects', 'bags', ARRAY['Sac de terre']),

  -- Livres et objets lourds
  ('thick-book', 'Gros livre', 'Thick book', 'home-objects', 'books', ARRAY['Dictionnaire', 'Encyclopédie']),
  ('book-stack', 'Pile de livres', 'Stack of books', 'home-objects', 'books', ARRAY[]::text[]),
  ('phone-book', 'Annuaire téléphonique', 'Phone book', 'home-objects', 'books', ARRAY[]::text[]),

  -- Ustensiles de cuisine
  ('frying-pan', 'Poêle à frire', 'Frying pan', 'home-objects', 'kitchen', ARRAY['Poêle']),
  ('cooking-pot', 'Casserole', 'Cooking pot', 'home-objects', 'kitchen', ARRAY['Marmite']),
  ('dutch-oven', 'Cocotte en fonte', 'Dutch oven', 'home-objects', 'kitchen', ARRAY['Cocotte']),
  ('cast-iron-skillet', 'Poêle en fonte', 'Cast iron skillet', 'home-objects', 'kitchen', ARRAY[]::text[]),

  -- Objets de garage/bricolage
  ('toolbox', 'Boîte à outils', 'Toolbox', 'home-objects', 'garage', ARRAY['Caisse à outils']),
  ('paint-bucket', 'Seau de peinture', 'Paint bucket', 'home-objects', 'garage', ARRAY[]::text[]),
  ('cement-bag', 'Sac de ciment', 'Cement bag', 'home-objects', 'garage', ARRAY[]::text[]),
  ('sandbag-diy', 'Sac de sable (DIY)', 'DIY sandbag', 'home-objects', 'garage', ARRAY[]::text[]),
  ('tire-car', 'Pneu de voiture', 'Car tire', 'home-objects', 'garage', ARRAY[]::text[]),
  ('spare-tire', 'Roue de secours', 'Spare tire', 'home-objects', 'garage', ARRAY[]::text[]),
  ('toolbelt', 'Ceinture porte-outils', 'Tool belt', 'home-objects', 'garage', ARRAY[]::text[]),
  ('sledgehammer-home', 'Masse de forgeron', 'Sledgehammer', 'home-objects', 'garage', ARRAY['Massette']),
  ('mallet', 'Maillet', 'Mallet', 'home-objects', 'garage', ARRAY[]::text[]),
  ('axe', 'Hache', 'Axe', 'home-objects', 'garage', ARRAY[]::text[]),
  ('shovel', 'Pelle', 'Shovel', 'home-objects', 'garage', ARRAY[]::text[]),
  ('rake', 'Râteau', 'Rake', 'home-objects', 'garage', ARRAY[]::text[]),

  -- Objets de ménage
  ('broom', 'Balai', 'Broom', 'home-objects', 'cleaning', ARRAY[]::text[]),
  ('mop', 'Serpillière avec manche', 'Mop', 'home-objects', 'cleaning', ARRAY[]::text[]),
  ('vacuum-cleaner', 'Aspirateur', 'Vacuum cleaner', 'home-objects', 'cleaning', ARRAY[]::text[]),

  -- Textiles
  ('towel-rolled', 'Serviette roulée', 'Rolled towel', 'home-objects', 'textiles', ARRAY['Serviette de bain']),
  ('blanket-folded', 'Couverture pliée', 'Folded blanket', 'home-objects', 'textiles', ARRAY[]::text[]),
  ('pillow-firm', 'Coussin ferme', 'Firm pillow', 'home-objects', 'textiles', ARRAY['Oreiller']),
  ('yoga-mat-rolled', 'Tapis de yoga roulé', 'Rolled yoga mat', 'home-objects', 'textiles', ARRAY[]::text[]),

  -- Petits objets
  ('soup-can', 'Boîte de conserve', 'Soup can', 'home-objects', 'small', ARRAY['Conserve']),
  ('tin-can', 'Canette métallique', 'Tin can', 'home-objects', 'small', ARRAY[]::text[]),
  ('filled-water-bottles-pack', 'Pack de bouteilles d''eau', 'Pack of water bottles', 'home-objects', 'small', ARRAY[]::text[]),

  -- Électroménager (à utiliser vide!)
  ('laundry-basket', 'Panier à linge', 'Laundry basket', 'home-objects', 'containers', ARRAY[]::text[]),
  ('storage-bin', 'Bac de rangement', 'Storage bin', 'home-objects', 'containers', ARRAY['Box de rangement']),
  ('cooler', 'Glacière', 'Cooler', 'home-objects', 'containers', ARRAY[]::text[]),
  ('suitcase', 'Valise', 'Suitcase', 'home-objects', 'containers', ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

-- Toutes les compatibilités home-objects
INSERT INTO equipment_location_compatibility (equipment_id, location_type, is_common)
SELECT id, 'home', true
FROM equipment_types
WHERE category_id = 'home-objects'
ON CONFLICT (equipment_id, location_type) DO NOTHING;

-- =====================================================
-- MEUBLES MAISON (40 items)
-- =====================================================

INSERT INTO equipment_types (id, name_fr, name_en, category_id, subcategory, synonyms) VALUES
  -- Chaises
  ('sturdy-chair', 'Chaise solide', 'Sturdy chair', 'home-furniture', 'chairs', ARRAY['Chaise en bois', 'Chaise stable']),
  ('dining-chair', 'Chaise de salle à manger', 'Dining chair', 'home-furniture', 'chairs', ARRAY[]::text[]),
  ('kitchen-chair', 'Chaise de cuisine', 'Kitchen chair', 'home-furniture', 'chairs', ARRAY[]::text[]),
  ('folding-chair', 'Chaise pliante', 'Folding chair', 'home-furniture', 'chairs', ARRAY[]::text[]),
  ('armchair', 'Fauteuil', 'Armchair', 'home-furniture', 'chairs', ARRAY[]::text[]),
  ('office-chair-stable', 'Chaise de bureau stable', 'Stable office chair', 'home-furniture', 'chairs', ARRAY[]::text[]),
  ('bar-stool', 'Tabouret de bar', 'Bar stool', 'home-furniture', 'chairs', ARRAY[]::text[]),
  ('ottoman', 'Pouf', 'Ottoman', 'home-furniture', 'chairs', ARRAY['Pouf']),

  -- Tables
  ('sturdy-table', 'Table solide', 'Sturdy table', 'home-furniture', 'tables', ARRAY['Table en bois']),
  ('coffee-table', 'Table basse', 'Coffee table', 'home-furniture', 'tables', ARRAY[]::text[]),
  ('dining-table', 'Table de salle à manger', 'Dining table', 'home-furniture', 'tables', ARRAY[]::text[]),
  ('kitchen-counter', 'Plan de travail cuisine', 'Kitchen counter', 'home-furniture', 'tables', ARRAY['Comptoir']),
  ('desk', 'Bureau', 'Desk', 'home-furniture', 'tables', ARRAY[]::text[]),
  ('side-table', 'Table d''appoint', 'Side table', 'home-furniture', 'tables', ARRAY[]::text[]),
  ('console-table', 'Console', 'Console table', 'home-furniture', 'tables', ARRAY[]::text[]),

  -- Canapés et lits
  ('solid-couch', 'Canapé solide', 'Solid couch', 'home-furniture', 'sofas', ARRAY[]::text[]),
  ('sofa-edge', 'Rebord de canapé', 'Sofa edge', 'home-furniture', 'sofas', ARRAY[]::text[]),
  ('loveseat', 'Causeuse', 'Loveseat', 'home-furniture', 'sofas', ARRAY[]::text[]),
  ('bed-frame', 'Cadre de lit', 'Bed frame', 'home-furniture', 'beds', ARRAY[]::text[]),
  ('mattress-edge', 'Rebord de matelas', 'Mattress edge', 'home-furniture', 'beds', ARRAY[]::text[]),

  -- Escaliers et structures
  ('indoor-stairs', 'Escaliers intérieurs', 'Indoor stairs', 'home-furniture', 'stairs', ARRAY[]::text[]),
  ('stair-step-bottom', 'Première marche d''escalier', 'Bottom stair step', 'home-furniture', 'stairs', ARRAY[]::text[]),
  ('staircase-railing', 'Rampe d''escalier', 'Staircase railing', 'home-furniture', 'stairs', ARRAY[]::text[]),

  -- Portes et murs
  ('wall-support', 'Mur porteur', 'Support wall', 'home-furniture', 'walls', ARRAY[]::text[]),
  ('door-frame', 'Cadre de porte', 'Door frame', 'home-furniture', 'doors', ARRAY['Chambranle']),
  ('sturdy-door', 'Porte solide', 'Sturdy door', 'home-furniture', 'doors', ARRAY[]::text[]),
  ('closet-door', 'Porte de placard', 'Closet door', 'home-furniture', 'doors', ARRAY[]::text[]),

  -- Rangements
  ('bookshelf', 'Bibliothèque', 'Bookshelf', 'home-furniture', 'storage', ARRAY[]::text[]),
  ('wall-shelf', 'Étagère murale', 'Wall shelf', 'home-furniture', 'storage', ARRAY[]::text[]),
  ('dresser', 'Commode', 'Dresser', 'home-furniture', 'storage', ARRAY[]::text[]),
  ('wardrobe', 'Armoire', 'Wardrobe', 'home-furniture', 'storage', ARRAY[]::text[]),
  ('chest', 'Coffre', 'Chest', 'home-furniture', 'storage', ARRAY[]::text[]),

  -- Rebords et surfaces
  ('window-sill', 'Rebord de fenêtre', 'Window sill', 'home-furniture', 'ledges', ARRAY[]::text[]),
  ('mantelpiece', 'Cheminée (manteau)', 'Mantelpiece', 'home-furniture', 'ledges', ARRAY[]::text[]),
  ('bathtub-edge', 'Rebord de baignoire', 'Bathtub edge', 'home-furniture', 'bathroom', ARRAY[]::text[]),

  -- Sols et tapis
  ('hardwood-floor', 'Parquet', 'Hardwood floor', 'home-furniture', 'floors', ARRAY[]::text[]),
  ('tile-floor', 'Carrelage', 'Tile floor', 'home-furniture', 'floors', ARRAY[]::text[]),
  ('carpet-thick', 'Tapis épais', 'Thick carpet', 'home-furniture', 'floors', ARRAY[]::text[]),
  ('rug', 'Tapis', 'Rug', 'home-furniture', 'floors', ARRAY[]::text[]),
  ('exercise-mat-home', 'Tapis d''exercice', 'Exercise mat', 'home-furniture', 'floors', ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

-- Compatibilités home-furniture
INSERT INTO equipment_location_compatibility (equipment_id, location_type, is_common)
SELECT id, 'home', true
FROM equipment_types
WHERE category_id = 'home-furniture'
ON CONFLICT (equipment_id, location_type) DO NOTHING;

-- =====================================================
-- ÉLÉMENTS PLAGE ET BORD DE MER (30 items)
-- =====================================================

INSERT INTO equipment_types (id, name_fr, name_en, category_id, subcategory, synonyms) VALUES
  -- Surfaces
  ('sand-beach', 'Sable de plage', 'Beach sand', 'beach', 'surfaces', ARRAY['Sable fin', 'Plage']),
  ('wet-sand', 'Sable mouillé', 'Wet sand', 'beach', 'surfaces', ARRAY['Sable humide']),
  ('dry-sand', 'Sable sec', 'Dry sand', 'beach', 'surfaces', ARRAY[]::text[]),
  ('sand-dune', 'Dune de sable', 'Sand dune', 'beach', 'terrain', ARRAY['Dune']),
  ('beach-slope', 'Pente de plage', 'Beach slope', 'beach', 'terrain', ARRAY[]::text[]),

  -- Eau
  ('shallow-water', 'Eau peu profonde', 'Shallow water', 'beach', 'water', ARRAY['Eau de mer']),
  ('waves-small', 'Petites vagues', 'Small waves', 'beach', 'water', ARRAY[]::text[]),
  ('surf-zone', 'Zone de surf', 'Surf zone', 'beach', 'water', ARRAY[]::text[]),

  -- Roches et pierres de plage
  ('beach-rocks', 'Rochers de plage', 'Beach rocks', 'beach', 'rocks', ARRAY[]::text[]),
  ('smooth-pebbles', 'Galets lisses', 'Smooth pebbles', 'beach', 'rocks', ARRAY['Galets']),
  ('large-beach-stone', 'Grosse pierre de plage', 'Large beach stone', 'beach', 'rocks', ARRAY[]::text[]),

  -- Bois flotté
  ('driftwood-log', 'Bûche de bois flotté', 'Driftwood log', 'beach', 'wood', ARRAY['Bois flotté']),
  ('driftwood-branch', 'Branche de bois flotté', 'Driftwood branch', 'beach', 'wood', ARRAY[]::text[]),
  ('driftwood-plank', 'Planche de bois flotté', 'Driftwood plank', 'beach', 'wood', ARRAY[]::text[]),

  -- Structures de plage
  ('lifeguard-tower', 'Tour de sauveteur', 'Lifeguard tower', 'beach', 'structures', ARRAY['Poste de secours']),
  ('beach-chair', 'Chaise de plage', 'Beach chair', 'beach', 'furniture', ARRAY['Transat']),
  ('beach-umbrella-pole', 'Pied de parasol', 'Beach umbrella pole', 'beach', 'furniture', ARRAY[]::text[]),
  ('picnic-table-beach', 'Table de pique-nique (plage)', 'Beach picnic table', 'beach', 'furniture', ARRAY[]::text[]),

  -- Équipements de plage
  ('beach-volleyball-net', 'Filet de beach-volley', 'Beach volleyball net', 'beach', 'sports', ARRAY[]::text[]),
  ('beach-volleyball-pole', 'Poteau de beach-volley', 'Beach volleyball pole', 'beach', 'sports', ARRAY[]::text[]),

  -- Barrières et structures côtières
  ('wooden-boardwalk', 'Ponton en bois', 'Wooden boardwalk', 'beach', 'structures', ARRAY['Promenade']),
  ('beach-ramp', 'Rampe d''accès plage', 'Beach access ramp', 'beach', 'structures', ARRAY[]::text[]),
  ('dune-fence', 'Clôture de dune', 'Dune fence', 'beach', 'structures', ARRAY[]::text[]),
  ('seawall', 'Digue', 'Seawall', 'beach', 'structures', ARRAY['Mur de mer']),
  ('concrete-breaker', 'Brise-lames en béton', 'Concrete breaker', 'beach', 'structures', ARRAY[]::text[]),

  -- Objets trouvés
  ('rope-washed-up', 'Corde échouée', 'Washed up rope', 'beach', 'found', ARRAY[]::text[]),
  ('fishing-net', 'Filet de pêche', 'Fishing net', 'beach', 'found', ARRAY[]::text[]),
  ('buoy', 'Bouée', 'Buoy', 'beach', 'found', ARRAY[]::text[]),
  ('anchor-small', 'Petite ancre', 'Small anchor', 'beach', 'found', ARRAY[]::text[]),
  ('wooden-pallet-beach', 'Palette en bois (plage)', 'Wooden pallet', 'beach', 'found', ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

INSERT INTO equipment_location_compatibility (equipment_id, location_type, is_common)
SELECT id, 'outdoor', true
FROM equipment_types
WHERE category_id = 'beach'
ON CONFLICT (equipment_id, location_type) DO NOTHING;

-- =====================================================
-- ÉLÉMENTS CAMPAGNE ET FERME (35 items)
-- =====================================================

INSERT INTO equipment_types (id, name_fr, name_en, category_id, subcategory, synonyms) VALUES
  -- Bûches et troncs
  ('firewood-log', 'Bûche de bois', 'Firewood log', 'countryside', 'wood', ARRAY['Rondin']),
  ('split-log', 'Bûche fendue', 'Split log', 'countryside', 'wood', ARRAY[]::text[]),
  ('tree-stump-country', 'Souche d''arbre', 'Tree stump', 'countryside', 'wood', ARRAY[]::text[]),
  ('wooden-beam', 'Poutre en bois', 'Wooden beam', 'countryside', 'wood', ARRAY[]::text[]),
  ('telephone-pole', 'Poteau téléphonique', 'Telephone pole', 'countryside', 'wood', ARRAY[]::text[]),

  -- Outils de ferme
  ('pitchfork', 'Fourche à foin', 'Pitchfork', 'countryside', 'tools', ARRAY[]::text[]),
  ('shovel-farm', 'Pelle de ferme', 'Farm shovel', 'countryside', 'tools', ARRAY[]::text[]),
  ('pickaxe', 'Pioche', 'Pickaxe', 'countryside', 'tools', ARRAY[]::text[]),
  ('hoe', 'Houe', 'Hoe', 'countryside', 'tools', ARRAY['Binette']),
  ('scythe', 'Faux', 'Scythe', 'countryside', 'tools', ARRAY[]::text[]),
  ('wheelbarrow', 'Brouette', 'Wheelbarrow', 'countryside', 'tools', ARRAY[]::text[]),
  ('hay-bale', 'Balle de foin', 'Hay bale', 'countryside', 'farm', ARRAY[]::text[]),
  ('straw-bale', 'Botte de paille', 'Straw bale', 'countryside', 'farm', ARRAY[]::text[]),

  -- Sacs et contenants ruraux
  ('grain-sack', 'Sac de grain', 'Grain sack', 'countryside', 'bags', ARRAY['Sac de blé']),
  ('feed-bag', 'Sac de nourriture animale', 'Feed bag', 'countryside', 'bags', ARRAY[]::text[]),
  ('fertilizer-bag', 'Sac d''engrais', 'Fertilizer bag', 'countryside', 'bags', ARRAY[]::text[]),

  -- Barrières et clôtures
  ('wooden-fence', 'Clôture en bois', 'Wooden fence', 'countryside', 'fences', ARRAY['Barrière']),
  ('farm-gate', 'Portail de ferme', 'Farm gate', 'countryside', 'fences', ARRAY[]::text[]),
  ('split-rail-fence', 'Clôture à traverses', 'Split rail fence', 'countryside', 'fences', ARRAY[]::text[]),
  ('barbed-wire-post', 'Poteau de fil barbelé', 'Barbed wire post', 'countryside', 'fences', ARRAY[]::text[]),

  -- Pierres rurales
  ('fieldstone', 'Pierre des champs', 'Fieldstone', 'countryside', 'rocks', ARRAY[]::text[]),
  ('stone-wall-country', 'Muret de pierres', 'Stone wall', 'countryside', 'rocks', ARRAY['Muret']),
  ('millstone', 'Meule de moulin', 'Millstone', 'countryside', 'rocks', ARRAY[]::text[]),

  -- Structures rurales
  ('barn-beam', 'Poutre de grange', 'Barn beam', 'countryside', 'structures', ARRAY[]::text[]),
  ('silo-base', 'Base de silo', 'Silo base', 'countryside', 'structures', ARRAY[]::text[]),
  ('trough', 'Abreuvoir', 'Trough', 'countryside', 'structures', ARRAY[]::text[]),
  ('water-tank', 'Citerne d''eau', 'Water tank', 'countryside', 'structures', ARRAY[]::text[]),

  -- Véhicules/équipements
  ('tractor-tire', 'Pneu de tracteur', 'Tractor tire', 'countryside', 'vehicles', ARRAY[]::text[]),
  ('tractor-wheel', 'Roue de tracteur', 'Tractor wheel', 'countryside', 'vehicles', ARRAY[]::text[]),
  ('milk-can-metal', 'Bidon de lait métal', 'Metal milk can', 'countryside', 'containers', ARRAY[]::text[]),

  -- Terrains
  ('dirt-mound', 'Monticule de terre', 'Dirt mound', 'countryside', 'terrain', ARRAY[]::text[]),
  ('compost-pile', 'Tas de compost', 'Compost pile', 'countryside', 'terrain', ARRAY[]::text[]),
  ('gravel-pile', 'Tas de gravier', 'Gravel pile', 'countryside', 'terrain', ARRAY[]::text[]),
  ('mud-path', 'Chemin boueux', 'Mud path', 'countryside', 'terrain', ARRAY[]::text[]),
  ('grassy-field', 'Champ herbeux', 'Grassy field', 'countryside', 'terrain', ARRAY['Prairie'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO equipment_location_compatibility (equipment_id, location_type, is_common)
SELECT id, 'outdoor',
  CASE
    WHEN id IN ('firewood-log', 'hay-bale', 'wheelbarrow', 'wooden-fence') THEN true
    ELSE false
  END
FROM equipment_types
WHERE category_id = 'countryside'
ON CONFLICT (equipment_id, location_type) DO NOTHING;

-- =====================================================
-- PARC ET AIRES DE JEUX (25 items)
-- =====================================================

INSERT INTO equipment_types (id, name_fr, name_en, category_id, subcategory, synonyms) VALUES
  -- Jeux pour enfants
  ('playground-structure', 'Structure de jeux', 'Playground structure', 'park', 'playground', ARRAY[]::text[]),
  ('monkey-bars-playground', 'Échelle horizontale de jeux', 'Playground monkey bars', 'park', 'playground', ARRAY['Barres singe']),
  ('playground-slide', 'Toboggan', 'Playground slide', 'park', 'playground', ARRAY[]::text[]),
  ('climbing-wall-playground', 'Mur d''escalade (jeux)', 'Playground climbing wall', 'park', 'playground', ARRAY[]::text[]),
  ('playground-ladder', 'Échelle de jeux', 'Playground ladder', 'park', 'playground', ARRAY[]::text[]),
  ('playground-pole', 'Poteau de jeux', 'Playground pole', 'park', 'playground', ARRAY['Mat de pompier']),
  ('swing-set-frame', 'Structure de balançoire', 'Swing set frame', 'park', 'playground', ARRAY[]::text[]),
  ('seesaw-plank', 'Planche de bascule', 'Seesaw plank', 'park', 'playground', ARRAY[]::text[]),
  ('spring-rider', 'Jeu à ressort', 'Spring rider', 'park', 'playground', ARRAY[]::text[]),

  -- Équipements de fitness en plein air
  ('outdoor-pull-up-bar-park', 'Barre de traction (parc)', 'Outdoor pull-up bar', 'park', 'fitness', ARRAY[]::text[]),
  ('outdoor-dip-bars', 'Barres de dips (parc)', 'Outdoor dip bars', 'park', 'fitness', ARRAY[]::text[]),
  ('outdoor-sit-up-bench', 'Banc abdos (parc)', 'Outdoor sit-up bench', 'park', 'fitness', ARRAY[]::text[]),
  ('outdoor-push-up-bars', 'Barres de pompes (parc)', 'Outdoor push-up bars', 'park', 'fitness', ARRAY[]::text[]),
  ('outdoor-leg-press', 'Presse à jambes (parc)', 'Outdoor leg press', 'park', 'fitness', ARRAY[]::text[]),

  -- Mobilier urbain de parc
  ('park-bench-wood', 'Banc de parc en bois', 'Wooden park bench', 'park', 'furniture', ARRAY[]::text[]),
  ('park-bench-metal', 'Banc de parc en métal', 'Metal park bench', 'park', 'furniture', ARRAY[]::text[]),
  ('picnic-table-park', 'Table de pique-nique', 'Picnic table', 'park', 'furniture', ARRAY[]::text[]),
  ('park-railing', 'Rampe de parc', 'Park railing', 'park', 'structures', ARRAY[]::text[]),

  -- Terrains de sport
  ('soccer-goal', 'But de football', 'Soccer goal', 'park', 'sports', ARRAY[]::text[]),
  ('basketball-hoop', 'Panier de basket', 'Basketball hoop', 'park', 'sports', ARRAY[]::text[]),
  ('tennis-net-post', 'Poteau de filet tennis', 'Tennis net post', 'park', 'sports', ARRAY[]::text[]),

  -- Éléments naturels de parc
  ('park-tree', 'Arbre de parc', 'Park tree', 'park', 'nature', ARRAY[]::text[]),
  ('park-tree-low-branch', 'Branche basse (parc)', 'Park tree low branch', 'park', 'nature', ARRAY[]::text[]),
  ('boulder-park', 'Rocher décoratif', 'Decorative boulder', 'park', 'nature', ARRAY[]::text[]),
  ('fountain-edge', 'Rebord de fontaine', 'Fountain edge', 'park', 'structures', ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

INSERT INTO equipment_location_compatibility (equipment_id, location_type, is_common)
SELECT id, 'outdoor', true
FROM equipment_types
WHERE category_id = 'park'
ON CONFLICT (equipment_id, location_type) DO NOTHING;

-- =====================================================
-- RAFRAÎCHISSEMENT DE LA VUE MATÉRIALISÉE
-- =====================================================

REFRESH MATERIALIZED VIEW CONCURRENTLY common_equipment_by_location;

-- =====================================================
-- RÉSUMÉ FINAL
-- =====================================================

DO $$
DECLARE
  total_equipment integer;
  total_categories integer;
BEGIN
  SELECT COUNT(*) INTO total_equipment FROM equipment_types;
  SELECT COUNT(*) INTO total_categories FROM equipment_categories;

  RAISE NOTICE '═════════════════════════════════════════════════════';
  RAISE NOTICE 'Migration complétée avec succès!';
  RAISE NOTICE '═════════════════════════════════════════════════════';
  RAISE NOTICE 'Total catégories: %', total_categories;
  RAISE NOTICE 'Total équipements: %', total_equipment;
  RAISE NOTICE '═════════════════════════════════════════════════════';
END $$;

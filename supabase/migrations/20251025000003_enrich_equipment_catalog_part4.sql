/*
  # Enrich Equipment Catalog System - Part 4 (Final)

  Dernière partie: équipements maison (furniture/objets) et équipements outdoor
  (naturels et urbains). Total: ~100 équipements supplémentaires.
*/

-- ============================================================================
-- 18. ENRICHISSEMENT: MEUBLES ET OBJETS MAISON (35+ items)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, synonyms, description) VALUES
  -- Chaises et sièges
  ('sturdy-chair', 'Chaise solide', 'Sturdy chair', 'bodyweight', 'chairs', ARRAY['Chaise en bois', 'Chaise stable'], 'Chaise robuste maison'),
  ('dining-chair', 'Chaise de salle à manger', 'Dining chair', 'bodyweight', 'chairs', NULL, 'Chaise salle à manger'),
  ('kitchen-chair', 'Chaise de cuisine', 'Kitchen chair', 'bodyweight', 'chairs', NULL, 'Chaise de cuisine'),
  ('armchair', 'Fauteuil', 'Armchair', 'bodyweight', 'chairs', NULL, 'Fauteuil salon'),
  ('office-chair-stable', 'Chaise de bureau stable', 'Stable office chair', 'bodyweight', 'chairs', NULL, 'Chaise bureau fixe'),

  -- Tables
  ('sturdy-table', 'Table solide', 'Sturdy table', 'bodyweight', 'tables', ARRAY['Table en bois massif'], 'Table robuste'),
  ('coffee-table', 'Table basse', 'Coffee table', 'bodyweight', 'tables', NULL, 'Table basse salon'),
  ('dining-table', 'Table de salle à manger', 'Dining table', 'bodyweight', 'tables', NULL, 'Table salle à manger'),
  ('kitchen-counter', 'Plan de travail cuisine', 'Kitchen counter', 'bodyweight', 'tables', NULL, 'Comptoir cuisine'),
  ('desk', 'Bureau', 'Desk', 'bodyweight', 'tables', NULL, 'Bureau travail'),

  -- Canapés et lits
  ('solid-couch', 'Canapé solide', 'Solid couch', 'bodyweight', 'sofas', NULL, 'Canapé robuste'),
  ('sofa-edge', 'Rebord de canapé', 'Sofa edge', 'bodyweight', 'sofas', NULL, 'Rebord canapé'),
  ('bed-frame', 'Cadre de lit', 'Bed frame', 'bodyweight', 'beds', NULL, 'Structure lit'),

  -- Escaliers et marches
  ('indoor-stairs', 'Escaliers intérieurs', 'Indoor stairs', 'bodyweight', 'stairs', NULL, 'Escaliers maison'),
  ('stair-step', 'Marche d''escalier', 'Stair step', 'bodyweight', 'stairs', NULL, 'Marche individuelle'),
  ('staircase', 'Cage d''escalier', 'Staircase', 'bodyweight', 'stairs', NULL, 'Cage escalier complète'),

  -- Murs et portes
  ('wall', 'Mur porteur', 'Support wall', 'bodyweight', 'walls', NULL, 'Mur pour support'),
  ('wall-support', 'Mur porteur', 'Support wall', 'bodyweight', 'walls', NULL, 'Mur robuste'),
  ('door-frame', 'Cadre de porte', 'Door frame', 'bodyweight', 'doors', NULL, 'Encadrement porte'),
  ('sturdy-door', 'Porte solide', 'Sturdy door', 'bodyweight', 'doors', NULL, 'Porte robuste'),

  -- Étagères et rangements
  ('bookshelf', 'Bibliothèque', 'Bookshelf', 'bodyweight', 'storage', NULL, 'Bibliothèque meuble'),
  ('shelf', 'Étagère murale', 'Wall shelf', 'bodyweight', 'storage', NULL, 'Étagère fixée'),
  ('storage-box', 'Boîte de rangement', 'Storage box', 'bodyweight', 'storage', NULL, 'Boîte plastique/bois'),

  -- Objets lourds utilisables
  ('water-jug', 'Bidon d''eau', 'Water jug', 'dumbbell', 'weights', ARRAY['Bouteille d''eau grande', 'Jerrycan'], 'Bidon eau 5L+'),
  ('backpack-loaded', 'Sac à dos chargé', 'Loaded backpack', 'dumbbell', 'weights', NULL, 'Sac dos lesté'),
  ('heavy-book', 'Gros livre', 'Heavy book', 'dumbbell', 'weights', NULL, 'Livre épais lourd'),
  ('laundry-detergent', 'Bidon de lessive', 'Laundry detergent jug', 'dumbbell', 'weights', NULL, 'Bidon lessive plein'),
  ('paint-can', 'Pot de peinture', 'Paint can', 'dumbbell', 'weights', NULL, 'Pot peinture plein'),

  -- Surfaces et tapis
  ('carpet', 'Tapis', 'Carpet', 'bodyweight', 'floors', NULL, 'Tapis sol'),
  ('rug', 'Tapis épais', 'Thick rug', 'bodyweight', 'floors', NULL, 'Tapis moelleux'),
  ('hardwood-floor', 'Parquet', 'Hardwood floor', 'bodyweight', 'floors', NULL, 'Sol parquet'),
  ('tile-floor', 'Carrelage', 'Tile floor', 'bodyweight', 'floors', NULL, 'Sol carrelé'),
  ('floor', 'Sol', 'Floor', 'bodyweight', 'floors', NULL, 'Sol sans équipement'),

  -- Objets spéciaux
  ('window-sill', 'Rebord de fenêtre', 'Window sill', 'bodyweight', 'ledges', NULL, 'Appui de fenêtre'),
  ('towel', 'Serviette', 'Towel', 'accessory', 'accessories', ARRAY['Serviette de bain'], 'Serviette tissu'),
  ('broom-handle', 'Manche à balai', 'Broom handle', 'accessory', 'poles', NULL, 'Manche long léger'),
  ('pillow', 'Coussin', 'Pillow', 'accessory', 'soft', NULL, 'Coussin/oreiller')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  synonyms = EXCLUDED.synonyms,
  description = EXCLUDED.description;

-- ============================================================================
-- 19. ENRICHISSEMENT: ÉLÉMENTS NATURELS OUTDOOR (25+ items)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, synonyms, description) VALUES
  -- Arbres et bois
  ('tree-trunk', 'Tronc d''arbre', 'Tree trunk', 'bodyweight', 'trees', ARRAY['Arbre debout', 'Tronc vertical'], 'Tronc arbre vertical'),
  ('fallen-log', 'Tronc d''arbre couché', 'Fallen log', 'bodyweight', 'trees', ARRAY['Bûche géante', 'Tronc au sol'], 'Tronc couché sol'),
  ('tree-branch-low', 'Branche d''arbre basse', 'Low tree branch', 'bodyweight', 'trees', NULL, 'Branche accessible'),
  ('tree-branch-high', 'Branche d''arbre haute', 'High tree branch', 'bodyweight', 'trees', NULL, 'Branche en hauteur'),
  ('tree-stump', 'Souche d''arbre', 'Tree stump', 'bodyweight', 'trees', NULL, 'Souche coupée'),
  ('thick-branch', 'Grosse branche', 'Thick branch', 'bodyweight', 'trees', NULL, 'Branche épaisse'),
  ('deadwood', 'Bois mort', 'Dead wood', 'bodyweight', 'trees', NULL, 'Bois sec au sol'),

  -- Roches et pierres
  ('large-rock', 'Grosse roche', 'Large rock', 'dumbbell', 'rocks', ARRAY['Pierre volumineuse', 'Rocher'], 'Grosse pierre naturelle'),
  ('medium-rock', 'Roche moyenne', 'Medium rock', 'dumbbell', 'rocks', NULL, 'Pierre moyenne'),
  ('boulder', 'Rocher', 'Boulder', 'bodyweight', 'rocks', NULL, 'Gros rocher fixe'),
  ('stone-slab', 'Dalle de pierre', 'Stone slab', 'bodyweight', 'rocks', NULL, 'Pierre plate'),
  ('rock-pile', 'Tas de pierres', 'Rock pile', 'bodyweight', 'rocks', NULL, 'Amas de pierres'),

  -- Terrain et relief
  ('hill-slope', 'Pente de colline', 'Hill slope', 'bodyweight', 'slopes', ARRAY['Montée', 'Côte'], 'Pente montante'),
  ('steep-incline', 'Pente raide', 'Steep incline', 'bodyweight', 'slopes', NULL, 'Pente forte'),
  ('grassy-hill', 'Colline herbeuse', 'Grassy hill', 'bodyweight', 'slopes', NULL, 'Colline gazon'),
  ('dirt-path', 'Chemin de terre', 'Dirt path', 'bodyweight', 'paths', NULL, 'Sentier terre'),
  ('sand-area', 'Zone sablonneuse', 'Sandy area', 'bodyweight', 'surfaces', ARRAY['Plage', 'Sable'], 'Surface sable'),
  ('grass-field', 'Champ d''herbe', 'Grass field', 'bodyweight', 'surfaces', ARRAY['Pelouse', 'Prairie'], 'Zone herbeuse'),
  ('gravel-area', 'Zone de gravier', 'Gravel area', 'bodyweight', 'surfaces', NULL, 'Surface graviers'),

  -- Autres éléments naturels
  ('park-grass', 'Pelouse de parc', 'Park grass', 'bodyweight', 'surfaces', NULL, 'Gazon parc public'),
  ('forest-ground', 'Sol forestier', 'Forest ground', 'bodyweight', 'surfaces', NULL, 'Sol forêt'),
  ('tree-root', 'Racine d''arbre', 'Tree root', 'bodyweight', 'obstacles', NULL, 'Racine dépassante'),
  ('mud-patch', 'Zone boueuse', 'Mud patch', 'bodyweight', 'surfaces', NULL, 'Terrain boueux'),
  ('creek-bed', 'Lit de ruisseau', 'Creek bed', 'bodyweight', 'water', NULL, 'Lit cours eau'),
  ('natural-ledge', 'Rebord naturel', 'Natural ledge', 'bodyweight', 'obstacles', NULL, 'Rebord roche')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  synonyms = EXCLUDED.synonyms,
  description = EXCLUDED.description;

-- ============================================================================
-- 20. ENRICHISSEMENT: STRUCTURES URBAINES OUTDOOR (34 items)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, synonyms, description) VALUES
  -- Bancs et sièges publics
  ('park-bench', 'Banc de parc', 'Park bench', 'bodyweight', 'benches', ARRAY['Banc public'], 'Banc parc public'),
  ('concrete-bench', 'Banc en béton', 'Concrete bench', 'bodyweight', 'benches', NULL, 'Banc béton fixe'),
  ('wooden-bench', 'Banc en bois', 'Wooden bench', 'bodyweight', 'benches', NULL, 'Banc bois public'),
  ('picnic-table', 'Table de pique-nique', 'Picnic table', 'bodyweight', 'tables', NULL, 'Table extérieure'),

  -- Escaliers et marches extérieurs
  ('outdoor-stairs', 'Escaliers extérieurs', 'Outdoor stairs', 'bodyweight', 'stairs', ARRAY['Escalier public'], 'Escaliers dehors'),
  ('concrete-steps', 'Marches en béton', 'Concrete steps', 'bodyweight', 'stairs', NULL, 'Marches béton'),
  ('stadium-stairs', 'Gradins de stade', 'Stadium stairs', 'bodyweight', 'stairs', ARRAY['Escaliers de stade'], 'Gradins stade'),
  ('amphitheater-steps', 'Gradins d''amphithéâtre', 'Amphitheater steps', 'bodyweight', 'stairs', NULL, 'Gradins amphi'),

  -- Murs et structures verticales
  ('concrete-wall', 'Mur en béton', 'Concrete wall', 'bodyweight', 'walls', NULL, 'Mur béton urbain'),
  ('brick-wall', 'Mur en briques', 'Brick wall', 'bodyweight', 'walls', NULL, 'Mur briques'),
  ('retaining-wall', 'Mur de soutènement', 'Retaining wall', 'bodyweight', 'walls', NULL, 'Mur de soutien'),
  ('low-wall', 'Muret', 'Low wall', 'bodyweight', 'walls', NULL, 'Petit mur'),

  -- Rampes et pentes
  ('wheelchair-ramp', 'Rampe d''accès', 'Wheelchair ramp', 'bodyweight', 'ramps', NULL, 'Rampe handicap'),
  ('parking-ramp', 'Rampe de parking', 'Parking ramp', 'bodyweight', 'ramps', NULL, 'Pente parking'),
  ('skateboard-ramp', 'Rampe de skate', 'Skateboard ramp', 'bodyweight', 'ramps', NULL, 'Rampe skatepark'),

  -- Poteaux et colonnes
  ('light-post', 'Lampadaire', 'Light post', 'bodyweight', 'poles', ARRAY['Poteau d''éclairage'], 'Poteau lumière'),
  ('signpost', 'Poteau de signalisation', 'Sign post', 'bodyweight', 'poles', NULL, 'Poteau panneau'),
  ('metal-pole', 'Poteau métallique', 'Metal pole', 'bodyweight', 'poles', NULL, 'Poteau métal'),
  ('fence-post', 'Poteau de clôture', 'Fence post', 'bodyweight', 'poles', NULL, 'Poteau barrière'),
  ('slackline-posts', 'Poteaux pour slackline', 'Slackline posts', 'bodyweight', 'poles', NULL, 'Poteaux slackline'),

  -- Barrières et rampes de sécurité
  ('metal-railing', 'Rampe métallique', 'Metal railing', 'bodyweight', 'railings', NULL, 'Garde-corps métal'),
  ('fence', 'Clôture', 'Fence', 'bodyweight', 'barriers', NULL, 'Barrière extérieure'),
  ('guardrail', 'Garde-corps', 'Guardrail', 'bodyweight', 'railings', NULL, 'Garde-corps sécurité'),
  ('bollard', 'Potelet urbain', 'Bollard', 'bodyweight', 'barriers', NULL, 'Borne anti-stationnement'),
  ('bike-rack', 'Arceau vélo', 'Bike rack', 'bodyweight', 'barriers', NULL, 'Support vélos'),
  ('curb', 'Bordure de trottoir', 'Sidewalk curb', 'bodyweight', 'surfaces', NULL, 'Bordure trottoir'),

  -- Équipements sportifs publics
  ('basketball-court', 'Terrain de basket', 'Basketball court', 'bodyweight', 'sports', NULL, 'Court basket extérieur'),
  ('soccer-field', 'Terrain de football', 'Soccer field', 'bodyweight', 'sports', NULL, 'Terrain foot gazon'),
  ('running-track', 'Piste de course', 'Running track', 'bodyweight', 'sports', NULL, 'Piste athlétisme'),
  ('tennis-court', 'Court de tennis', 'Tennis court', 'bodyweight', 'sports', NULL, 'Court tennis'),

  -- Structures de jeux
  ('playground-structure', 'Structure de jeux', 'Playground structure', 'bodyweight', 'playground', NULL, 'Jeux pour enfants'),
  ('monkey-bars-playground', 'Échelle horizontale de jeux', 'Playground monkey bars', 'bodyweight', 'playground', NULL, 'Barres singes parc'),
  ('playground-slide', 'Toboggan', 'Playground slide', 'bodyweight', 'playground', NULL, 'Toboggan jeux'),

  -- Surfaces
  ('asphalt-surface', 'Surface asphaltée', 'Asphalt surface', 'bodyweight', 'surfaces', ARRAY['Bitume', 'Goudron'], 'Revêtement asphalte'),
  ('concrete-surface', 'Surface bétonnée', 'Concrete surface', 'bodyweight', 'surfaces', NULL, 'Dalle béton'),
  ('rubber-surface', 'Surface caoutchoutée', 'Rubber surface', 'bodyweight', 'surfaces', NULL, 'Sol caoutchouc')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  synonyms = EXCLUDED.synonyms,
  description = EXCLUDED.description;

-- ============================================================================
-- INDEXATION ET OPTIMISATION
-- ============================================================================

-- Index sur subcategory pour recherches par sous-catégorie
CREATE INDEX IF NOT EXISTS idx_equipment_types_subcategory ON equipment_types(subcategory);

-- Index GIN pour recherche sur synonyms (tableau)
CREATE INDEX IF NOT EXISTS idx_equipment_types_synonyms ON equipment_types USING GIN(synonyms);

-- Index composite pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_equipment_types_category_subcategory ON equipment_types(category, subcategory);

-- Statistiques pour optimiseur
ANALYZE equipment_types;

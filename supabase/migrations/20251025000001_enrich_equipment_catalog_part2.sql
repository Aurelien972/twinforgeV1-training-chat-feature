/*
  # Enrich Equipment Catalog System - Part 2

  Suite de la migration 20251025000000 pour compléter le catalogue d'équipements.
  Cette partie contient les 200+ équipements restants.
*/

-- ============================================================================
-- 9. ENRICHISSEMENT: STATIONS ET RACKS (21 structures)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('squat-rack', 'Rack à squat', 'Squat rack', 'accessory', 'racks', 'Support barres de squat'),
  ('power-rack', 'Cage à squat / Power rack', 'Power rack', 'accessory', 'racks', 'Cage complète avec sécurités'),
  ('half-rack', 'Half-rack', 'Half rack', 'accessory', 'racks', 'Demi-cage de squat'),
  ('squat-stand', 'Support de squat', 'Squat stand', 'accessory', 'racks', 'Support squat mobile'),
  ('pull-up-bar', 'Barre de traction', 'Pull-up bar', 'bodyweight', 'bars', 'Barre fixe tractions'),
  ('wall-mounted-pull-up-bar', 'Barre de traction murale', 'Wall-mounted pull-up bar', 'bodyweight', 'bars', 'Barre traction fixée au mur'),
  ('doorway-pull-up-bar', 'Barre de traction de porte', 'Doorway pull-up bar', 'bodyweight', 'bars', 'Barre de porte'),
  ('dip-station', 'Station de dips', 'Dip station', 'bodyweight', 'bars', 'Station dips autonome'),
  ('wall-mounted-dip-bars', 'Barres de dips murales', 'Wall-mounted dip bars', 'bodyweight', 'bars', 'Dips murales'),
  ('power-tower', 'Power tower / Chaise du capitaine', 'Power tower', 'bodyweight', 'bars', 'Station multi-exercices'),
  ('captains-chair', 'Chaise du capitaine', 'Captain''s chair', 'bodyweight', 'bars', 'Station relevés jambes'),
  ('monkey-bars', 'Barres de singe', 'Monkey bars', 'bodyweight', 'bars', 'Barres horizontales suspendues'),
  ('rig', 'Rig de crossfit', 'CrossFit rig', 'accessory', 'structures', 'Structure crossfit complète'),
  ('functional-trainer', 'Entraîneur fonctionnel / Station complète', 'Functional trainer', 'cable', 'stations', 'Station câbles multi-angles'),
  ('multi-gym', 'Multi-gym / Station multifonction', 'Multi-gym', 'machine', 'stations', 'Station tout-en-un'),
  ('bench-press-station', 'Station bench press', 'Bench press station', 'accessory', 'stations', 'Station développé couché'),
  ('cable-machine', 'Machine à câbles', 'Cable machine', 'cable', 'stations', 'Système câbles et poulies'),
  ('landmine-station', 'Station landmine', 'Landmine station', 'accessory', 'accessories', 'Pivot pour barre landmine'),
  ('landmine-viking-handle', 'Poignée Viking (landmine)', 'Viking press landmine handle', 'accessory', 'accessories', 'Poignée Viking pour landmine'),
  ('landmine-tbar-row-handle', 'Poignée T-bar row (landmine)', 'T-bar row landmine handle', 'accessory', 'accessories', 'Poignée T-bar pour landmine'),
  ('weightlifting-platform', 'Plateforme d''haltérophilie', 'Weightlifting platform', 'accessory', 'platforms', 'Plateforme amortissante')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 10. ENRICHISSEMENT: BANCS (11 types)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('bench', 'Banc plat', 'Flat bench', 'accessory', 'standard', 'Banc de musculation plat'),
  ('flat-bench', 'Banc plat', 'Flat bench', 'accessory', 'standard', 'Banc de musculation plat'),
  ('adjustable-bench', 'Banc ajustable', 'Adjustable bench', 'accessory', 'standard', 'Banc réglable multi-angles'),
  ('incline-bench', 'Banc incliné', 'Incline bench', 'accessory', 'standard', 'Banc incliné fixe'),
  ('decline-bench', 'Banc décliné', 'Decline bench', 'accessory', 'standard', 'Banc décliné fixe'),
  ('olympic-bench', 'Banc olympique', 'Olympic bench', 'accessory', 'standard', 'Banc développé couché olympique'),
  ('utility-bench', 'Banc utilitaire', 'Utility bench', 'accessory', 'standard', 'Banc polyvalent'),
  ('fid-bench', 'Banc FID (Flat/Incline/Decline)', 'FID bench', 'accessory', 'standard', 'Banc 3 positions'),
  ('hip-thrust-bench', 'Banc hip thrust', 'Hip thrust bench', 'accessory', 'specialty', 'Banc spécial hip thrust'),
  ('sissy-squat-bench', 'Banc sissy squat', 'Sissy squat bench', 'accessory', 'specialty', 'Banc sissy squat'),
  ('plyometric-box', 'Box de pliométrie / Plyo box', 'Plyometric box', 'accessory', 'plyo', 'Box sauts pliométriques'),
  ('step-platform', 'Step / Plateforme aérobic', 'Step platform', 'accessory', 'cardio', 'Step aérobic')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 11. ENRICHISSEMENT: POIDS LIBRES (18 types)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('dumbbell', 'Haltères', 'Dumbbells', 'dumbbell', 'dumbbells', 'Haltères libres'),
  ('dumbbells', 'Haltères', 'Dumbbells', 'dumbbell', 'dumbbells', 'Haltères libres'),
  ('adjustable-dumbbells', 'Haltères ajustables', 'Adjustable dumbbells', 'dumbbell', 'dumbbells', 'Haltères à poids réglables'),
  ('dumbbell-rack', 'Rack à haltères', 'Dumbbell rack', 'accessory', 'racks', 'Support rangement haltères'),
  ('barbell', 'Barre olympique', 'Olympic barbell', 'barbell', 'barbells', 'Barre olympique 20kg'),
  ('technique-bar', 'Barre technique (apprentissage)', 'Technique barbell', 'barbell', 'barbells', 'Barre légère apprentissage'),
  ('ez-bar', 'Barre EZ / Barre coudée', 'EZ curl bar', 'barbell', 'barbells', 'Barre coudée biceps/triceps'),
  ('curl-bar', 'Barre de curl', 'Curl bar', 'barbell', 'barbells', 'Barre spéciale curls'),
  ('trap-bar', 'Trap bar / Barre hexagonale', 'Trap bar', 'barbell', 'barbells', 'Barre hexagonale deadlifts'),
  ('kettlebell', 'Kettlebells', 'Kettlebells', 'dumbbell', 'kettlebells', 'Poids à anse kettlebell'),
  ('kettlebells', 'Kettlebells', 'Kettlebells', 'dumbbell', 'kettlebells', 'Poids à anse kettlebell'),
  ('weight-plates', 'Disques de poids', 'Weight plates', 'dumbbell', 'plates', 'Disques pour barres'),
  ('bumper-plates', 'Disques bumper', 'Bumper plates', 'dumbbell', 'plates', 'Disques caoutchouc amortissants'),
  ('barbell-collars', 'Colliers de barre', 'Barbell collars', 'accessory', 'accessories', 'Colliers de sécurité barre'),
  ('lifting-chains', 'Chaînes de lest / Lifting chains', 'Lifting chains', 'accessory', 'accessories', 'Chaînes pour résistance variable'),
  ('barbell-jack', 'Levier pour barre / Bar jack', 'Barbell jack', 'accessory', 'tools', 'Levier pour charger disques'),
  ('jerk-blocks', 'Jerk blocks', 'Jerk blocks', 'accessory', 'blocks', 'Blocs haltérophilie'),
  ('weight-tree', 'Arbre à disques', 'Weight tree', 'accessory', 'racks', 'Support rangement disques'),
  ('barbell-holder', 'Support de barres', 'Barbell holder', 'accessory', 'racks', 'Support rangement barres')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 12. ENRICHISSEMENT: ACCESSOIRES POULIE (13 types)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('cable-rope', 'Corde triceps', 'Cable rope', 'accessory', 'cables', 'Corde pour poulie'),
  ('tricep-rope', 'Corde à triceps', 'Tricep rope', 'accessory', 'cables', 'Corde triceps poulie'),
  ('straight-bar-attachment', 'Barre droite pour poulie', 'Straight bar attachment', 'accessory', 'cables', 'Barre droite poulie'),
  ('ez-bar-attachment', 'Barre EZ pour poulie', 'EZ bar attachment', 'accessory', 'cables', 'Barre EZ poulie'),
  ('lat-bar', 'Barre de tirage', 'Lat bar', 'accessory', 'cables', 'Barre tirage dorsaux'),
  ('multi-grip-lat-bar', 'Barre lat multi-prises', 'Multi-grip lat pulldown bar', 'accessory', 'cables', 'Barre lat plusieurs prises'),
  ('v-bar-attachment', 'Barre en V', 'V-bar attachment', 'accessory', 'cables', 'Barre V pour poulie'),
  ('close-grip-row-handle', 'Poignée tirage serré', 'Close-grip row handle', 'accessory', 'cables', 'Poignée tirage serré'),
  ('single-handle', 'Poignée simple', 'Single handle', 'accessory', 'cables', 'Poignée simple poulie'),
  ('d-handle', 'Poignée en D', 'D-handle', 'accessory', 'cables', 'Poignée D poulie'),
  ('mag-grip', 'Poignée MAG', 'MAG grip', 'accessory', 'cables', 'Poignée MAG épaisse'),
  ('ankle-strap', 'Sangle de cheville', 'Ankle strap', 'accessory', 'cables', 'Sangle cheville poulie'),
  ('ab-crunch-strap', 'Sangle abdos pour poulie', 'Ab crunch strap', 'accessory', 'cables', 'Sangle abdos poulie')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- Suite dans le prochain segment pour functional, calisthenics, combat, mobility...

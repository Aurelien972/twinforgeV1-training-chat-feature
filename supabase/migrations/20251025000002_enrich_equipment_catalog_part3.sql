/*
  # Enrich Equipment Catalog System - Part 3

  Suite de la migration pour les équipements fonctionnels, calisthenics, combat,
  mobilité et équipements maison/outdoor.
*/

-- ============================================================================
-- 13. ENRICHISSEMENT: FONCTIONNEL / CROSS-TRAINING (36 items)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('battle-ropes', 'Cordes ondulatoires / Battle ropes', 'Battle ropes', 'accessory', 'conditioning', 'Cordes lourdes conditioning'),
  ('sled', 'Traîneau de poussée / Sled', 'Sled', 'accessory', 'conditioning', 'Traîneau à pousser/tirer'),
  ('prowler', 'Prowler', 'Prowler sled', 'accessory', 'conditioning', 'Traîneau prowler'),
  ('sled-harness', 'Harnais de traction (sled)', 'Sled pulling harness', 'accessory', 'conditioning', 'Harnais pour traîneau'),
  ('sledgehammer', 'Masse / Sledgehammer', 'Sledgehammer', 'accessory', 'conditioning', 'Masse pour pneu'),
  ('sprint-parachute', 'Parachute de sprint', 'Speed chute', 'accessory', 'conditioning', 'Parachute résistance course'),
  ('bulgarian-bag', 'Bulgarian bag', 'Bulgarian bag', 'dumbbell', 'conditioning', 'Sac bulgare'),
  ('slam-ball', 'Slam ball', 'Slam ball', 'dumbbell', 'balls', 'Ballon slam'),
  ('wall-ball', 'Wall ball / Medecine ball', 'Wall ball', 'dumbbell', 'balls', 'Medecine ball pour mur'),
  ('medicine-ball', 'Medecine ball', 'Medicine ball', 'dumbbell', 'balls', 'Ballon lesté'),
  ('trx', 'TRX / Sangles de suspension', 'TRX suspension trainer', 'bodyweight', 'suspension', 'Sangles suspension TRX'),
  ('tire', 'Pneu de tracteur', 'Tractor tire', 'accessory', 'strongman', 'Gros pneu strongman'),
  ('sandbag', 'Sac de sable', 'Sandbag', 'dumbbell', 'strongman', 'Sac lesté sable'),
  ('atlas-stone', 'Pierre d''Atlas', 'Atlas stone', 'accessory', 'strongman', 'Pierre ronde strongman'),
  ('strongman-log', 'Log de strongman', 'Strongman log', 'barbell', 'strongman', 'Barre log strongman'),
  ('axle-bar', 'Barre axle (épaisse)', 'Axle bar', 'barbell', 'strongman', 'Barre épaisse strongman'),
  ('circus-dumbbell', 'Haltère circus', 'Circus dumbbell', 'dumbbell', 'strongman', 'Haltère circus strongman'),
  ('keg', 'Fût de strongman (keg)', 'Strongman keg', 'accessory', 'strongman', 'Fût lesté'),
  ('husafell-stone', 'Pierre Husafell', 'Husafell stone', 'accessory', 'strongman', 'Pierre carrée portage'),
  ('farmers-walk-handles', 'Poignées farmer walk', 'Farmer''s walk handles', 'accessory', 'strongman', 'Poignées farmer walk'),
  ('yoke', 'Yoke / Joug', 'Yoke', 'accessory', 'strongman', 'Yoke strongman'),
  ('gymnastic-rings', 'Anneaux de gymnastique', 'Gymnastic rings', 'bodyweight', 'calisthenics', 'Anneaux suspendus'),
  ('parallettes', 'Parallettes', 'Parallettes', 'bodyweight', 'bars', 'Mini barres parallèles sol'),
  ('push-up-bars', 'Barres de pompes', 'Push-up bars', 'bodyweight', 'calisthenics', 'Poignées pompes'),
  ('ninja-grips', 'Prises ninja (boules, cônes, nunchucks)', 'Ninja grips (balls, cones, nunchucks)', 'bodyweight', 'calisthenics', 'Prises obstacle course'),
  ('balance-board', 'Planche d''équilibre', 'Balance board', 'accessory', 'balance', 'Planche instabilité'),
  ('bosu-ball', 'Bosu ball', 'BOSU ball', 'accessory', 'balance', 'Demi-ballon équilibre'),
  ('slackline', 'Slackline', 'Slackline', 'accessory', 'balance', 'Sangle équilibre suspendue'),
  ('balance-beam-gym', 'Poutre d''équilibre (gym)', 'Balance beam', 'bodyweight', 'balance', 'Poutre gymnastique'),
  ('resistance-band', 'Bandes de résistance', 'Resistance bands', 'accessory', 'bands', 'Élastiques résistance'),
  ('resistance-bands', 'Bandes de résistance', 'Resistance bands', 'accessory', 'bands', 'Élastiques résistance'),
  ('pull-up-assist-band', 'Bande d''assistance tractions', 'Pull-up assist band', 'accessory', 'bands', 'Élastique assistance'),
  ('jump-rope', 'Corde à sauter', 'Jump rope', 'accessory', 'cardio', 'Corde à sauter'),
  ('speed-ladder', 'Échelle d''agilité', 'Agility ladder', 'accessory', 'agility', 'Échelle coordination'),
  ('agility-cones', 'Plots de marquage', 'Agility cones', 'accessory', 'agility', 'Plots agilité'),
  ('agility-poles', 'Piquets d''agilité', 'Agility poles', 'accessory', 'agility', 'Piquets coordination'),
  ('mini-hurdles', 'Mini-haies d''agilité', 'Mini agility hurdles', 'accessory', 'agility', 'Petites haies'),
  ('hurdles', 'Haies', 'Hurdles', 'accessory', 'agility', 'Haies athlétisme')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 14. ENRICHISSEMENT: CALISTHENIE / EXTÉRIEUR (18 items)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('parallel-bars', 'Barres parallèles', 'Parallel bars', 'bodyweight', 'bars', 'Barres parallèles gymnastique'),
  ('dip-bars', 'Barres de dips', 'Dip bars', 'bodyweight', 'bars', 'Barres dips fixes'),
  ('stall-bars', 'Espalier', 'Stall bars', 'bodyweight', 'bars', 'Espalier mural'),
  ('pegboard', 'Pegboard', 'Pegboard', 'bodyweight', 'climbing', 'Planche à trous vertical'),
  ('climbing-rope', 'Corde de grimpe', 'Climbing rope', 'bodyweight', 'climbing', 'Corde verticale'),
  ('rope', 'Corde', 'Rope', 'bodyweight', 'climbing', 'Corde à grimper'),
  ('cargo-net', 'Filet d''escalade (cargo net)', 'Cargo net climb', 'bodyweight', 'climbing', 'Filet obstacle'),
  ('salmon-ladder', 'Échelle de saumon', 'Salmon ladder', 'bodyweight', 'climbing', 'Échelle saut vertical'),
  ('traverse-climbing-wall', 'Mur de traversée (prises d''escalade)', 'Traverse climbing wall', 'bodyweight', 'climbing', 'Mur escalade horizontal'),
  ('bouldering-wall', 'Mur de bloc / Bouldering', 'Bouldering wall', 'bodyweight', 'climbing', 'Mur escalade bloc'),
  ('warped-wall', 'Mur incurvé (warped wall)', 'Warped wall', 'bodyweight', 'obstacles', 'Mur incurvé course'),
  ('parkour-vault-box', 'Box de parkour (vault)', 'Parkour vault box', 'bodyweight', 'obstacles', 'Box parkour'),
  ('precision-trainers', 'Plots/rails de précision', 'Precision trainers (rails/pods)', 'bodyweight', 'obstacles', 'Plots précision parkour'),
  ('outdoor-gym-station', 'Station de street workout', 'Outdoor gym station', 'bodyweight', 'stations', 'Station workout extérieure'),
  ('public-pull-up-bar', 'Barre de traction publique', 'Public pull-up bar', 'bodyweight', 'bars', 'Barre traction parc'),
  ('public-bench', 'Banc public', 'Public bench', 'bodyweight', 'furniture', 'Banc de parc'),
  ('stairs', 'Escaliers', 'Stairs', 'bodyweight', 'terrain', 'Escaliers publics')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 15. ENRICHISSEMENT: COMBAT / BOXE (13 items)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('heavy-bag', 'Sac de frappe lourd', 'Heavy punching bag', 'accessory', 'bags', 'Sac frappe suspendu'),
  ('speed-bag', 'Poire de vitesse / Speed bag', 'Speed bag', 'accessory', 'bags', 'Poire vitesse boxe'),
  ('double-end-bag', 'Ballon double attache', 'Double-end bag', 'accessory', 'bags', 'Ballon élastique boxe'),
  ('free-standing-bag', 'Sac de frappe sur pied', 'Free-standing bag', 'accessory', 'bags', 'Sac frappe autonome'),
  ('uppercut-bag', 'Sac uppercut', 'Uppercut bag', 'accessory', 'bags', 'Sac uppercuts'),
  ('aqua-bag', 'Sac à eau / Aqua bag', 'Aqua bag', 'accessory', 'bags', 'Sac rempli eau'),
  ('cobra-reflex-bag', 'Sac reflex (cobra bag)', 'Cobra reflex bag', 'accessory', 'bags', 'Sac reflex cobra'),
  ('focus-mitts', 'Pattes d''ours', 'Focus mitts', 'accessory', 'pads', 'Pattes d''ours boxe'),
  ('thai-pads', 'Paos thaï', 'Thai pads', 'accessory', 'pads', 'Paos muay thaï'),
  ('kick-shield', 'Bouclier de frappe', 'Kick shield', 'accessory', 'pads', 'Bouclier coups pieds'),
  ('boxing-ring', 'Ring de boxe', 'Boxing ring', 'accessory', 'structures', 'Ring de boxe'),
  ('mma-cage', 'Cage MMA / Octogone', 'MMA cage', 'accessory', 'structures', 'Cage MMA octogone'),
  ('grappling-dummy', 'Mannequin de grappling', 'Grappling dummy', 'accessory', 'structures', 'Mannequin lutte')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 16. ENRICHISSEMENT: PILATES / YOGA / MOBILITÉ (14 items)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('yoga-mat', 'Tapis de yoga', 'Yoga mat', 'accessory', 'mats', 'Tapis yoga/pilates'),
  ('yoga-block', 'Brique de yoga', 'Yoga block', 'accessory', 'accessories', 'Bloc mousse yoga'),
  ('yoga-strap', 'Sangle de yoga', 'Yoga strap', 'accessory', 'accessories', 'Sangle étirement yoga'),
  ('yoga-wheel', 'Roue de yoga', 'Yoga wheel', 'accessory', 'accessories', 'Roue étirement dos'),
  ('foam-roller', 'Rouleau de massage / Foam roller', 'Foam roller', 'accessory', 'massage', 'Rouleau auto-massage'),
  ('peanut-roller', 'Rouleau "cacahuète"', 'Peanut massage roller', 'accessory', 'massage', 'Rouleau double boule'),
  ('massage-ball', 'Balle de massage', 'Massage ball', 'accessory', 'massage', 'Balle trigger points'),
  ('massage-stick', 'Bâton de massage', 'Massage stick', 'accessory', 'massage', 'Bâton roulant massage'),
  ('pilates-reformer', 'Reformer Pilates', 'Pilates reformer', 'machine', 'machines', 'Machine reformer pilates'),
  ('pilates-chair', 'Chaise Pilates', 'Pilates chair', 'machine', 'machines', 'Chaise wunda pilates'),
  ('pilates-cadillac', 'Cadillac Pilates', 'Pilates Cadillac', 'machine', 'machines', 'Cadillac trapeze pilates'),
  ('pilates-ring', 'Cercle Pilates', 'Pilates ring (magic circle)', 'accessory', 'machines', 'Cercle résistance pilates'),
  ('exercise-ball', 'Swiss ball / Ballon de gym', 'Exercise ball', 'accessory', 'balls', 'Gros ballon gonflable'),
  ('ab-wheel', 'Roue abdominale', 'Ab wheel', 'accessory', 'core', 'Roulette abdos')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- ============================================================================
-- 17. ENRICHISSEMENT: ACCESSOIRES DIVERS (12 items)
-- ============================================================================

INSERT INTO equipment_types (name, name_fr, name_en, category, subcategory, description) VALUES
  ('dip-belt', 'Ceinture de lest', 'Dip belt', 'accessory', 'belts', 'Ceinture charge additionnelle'),
  ('weight-belt', 'Ceinture de musculation', 'Weight belt', 'accessory', 'belts', 'Ceinture lombaire support'),
  ('lifting-straps', 'Sangles de tirage', 'Lifting straps', 'accessory', 'grips', 'Sangles grip'),
  ('wrist-wraps', 'Bandages de poignet', 'Wrist wraps', 'accessory', 'support', 'Bandages poignets'),
  ('knee-sleeves', 'Manchons de genou', 'Knee sleeves', 'accessory', 'support', 'Manchons genoux'),
  ('weighted-vest', 'Gilet lesté', 'Weighted vest', 'accessory', 'weights', 'Gilet avec poids'),
  ('ankle-weights', 'Poids pour chevilles', 'Ankle weights', 'accessory', 'weights', 'Lests chevilles'),
  ('wrist-weights', 'Poids pour poignets', 'Wrist weights', 'accessory', 'weights', 'Lests poignets'),
  ('grip-strengthener', 'Pince de force', 'Grip strengthener', 'accessory', 'grips', 'Ressort grip'),
  ('fat-gripz', 'Fat Gripz', 'Fat Gripz', 'accessory', 'grips', 'Manchons épais grip'),
  ('plate-storage-rack', 'Rack de rangement disques', 'Plate storage rack', 'accessory', 'racks', 'Support disques'),
  ('accessory-rack', 'Rack accessoires', 'Accessory rack', 'accessory', 'racks', 'Support accessoires')
ON CONFLICT (name) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description;

-- Suite dans le prochain segment pour home furniture et outdoor...

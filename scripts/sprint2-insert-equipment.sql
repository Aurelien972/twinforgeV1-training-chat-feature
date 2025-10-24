-- Insert specialized equipment that doesn't exist yet
INSERT INTO equipment_types (name, name_fr, name_en, category, description) VALUES
('atlas-stone', 'Atlas Stone', 'Atlas Stone', 'accessory', 'Spherical stone for loading'),
('yoke', 'Yoke', 'Yoke', 'accessory', 'Frame for heavy carries'),
('log-bar', 'Barre Log', 'Log Bar', 'barbell', 'Cylindrical pressing bar'),
('hack-squat-machine', 'Machine Hack Squat', 'Hack Squat Machine', 'machine', 'Angled squat machine'),
('leg-press', 'Presse à Cuisses', 'Leg Press', 'machine', 'Leg press machine'),
('sled', 'Luge', 'Sled', 'accessory', 'Weighted sled for pushing/pulling'),
('sandbag', 'Sandbag', 'Sandbag', 'accessory', 'Heavy sandbag'),
('chains-heavy', 'Chaînes Lourdes', 'Heavy Chains', 'accessory', 'Variable resistance chains'),
('bands-heavy', 'Bandes Lourdes', 'Heavy Bands', 'accessory', 'Resistance bands'),
('boards', 'Planches', 'Boards', 'accessory', 'Bench press boards'),
('safety-squat-bar', 'Barre Safety Squat', 'Safety Squat Bar', 'barbell', 'Cambered squat bar'),
('foam-roller', 'Rouleau Mousse', 'Foam Roller', 'accessory', 'Foam roller for mobility')
ON CONFLICT (name) DO NOTHING;

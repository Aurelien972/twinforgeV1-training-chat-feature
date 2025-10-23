/*
  # Phase 1: Archétypes Athlètes Féminines - BMI 22-24

  ## Objectif
  Combler le gap critique des athlètes féminines avec BMI 22-24
  Profils ciblés: CrossFit, gymnastique, athlétisme, bodybuilding léger

  ## Nouveaux Archétypes
  - 19 archétypes athlètes féminines avec BMI 22-24
  - 6 morphotypes (REC, SAB, POI, POM, TRI, OVA) × 2-3 niveaux muscularity
  - Interpolés depuis archétypes BMI 19-21 (athlètes) et BMI 21-23 (normal costaud)

  ## Méthode de Génération
  - morph_values: Interpolation pondérée 60% athlète bas BMI + 40% normal BMI élevé
  - limb_masses: Ajustement athlétique avec boost musculaire
  - Validation: Cohérence physiologique BMI-height-weight

  ## Impact Attendu
  - Couverture athlètes féminines BMI 22-24: 1 → 20 arch\u00e9types
  - Contribution à la couverture globale: +2.5 points (94.4% → 96.9%)
*/

-- ============================================================
-- REC (Rectangle) - Athlètes féminines
-- ============================================================

INSERT INTO morph_archetypes (
  id, name, gender, obesity, muscularity, level, morphotype,
  bmi_range, height_range, weight_range,
  morph_values, limb_masses, morph_index, muscle_index, notes
) VALUES 
(
  'FEM-REC-NOR-NO-ATH-BMI22-24-M01',
  'Femme athlétique, rectangle, BMI 22-24, musclée',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'REC',
  ARRAY[22.0, 24.0],
  ARRAY[160, 175],
  ARRAY[56.3, 73.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.7,
    'assLarge', -0.4,
    'bigHips', -0.1,
    'bodybuilderDetails', 0.65,
    'bodybuilderSize', 1.0,
    'breastsSag', 0.1,
    'breastsSmall', 0.65,
    'dollBody', 0,
    'emaciated', -1.0,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.75,
    'nipples', 0,
    'pearFigure', 0.25,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.08,
    'forearmMass', 1.02,
    'thighMass', 1.18,
    'calfMass', 1.02,
    'torsoMass', 1.12,
    'neckMass', 0.96,
    'gate', 1,
    'isActive', true
  ),
  0.68,
  0.82,
  'Interpolé depuis FEM-REC-MIN-NO-ATH-MI26-MU94-BMI21 + FEM-REC-MIN-NO-ATH-MI52-MU70-BMI23'
),
(
  'FEM-REC-NOR-NO-ATH-BMI22-24-M02',
  'Femme athlétique, rectangle, BMI 22-24, musclée variant',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'REC',
  ARRAY[22.5, 24.5],
  ARRAY[162, 178],
  ARRAY[59.0, 76.9],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.65,
    'assLarge', -0.35,
    'bigHips', -0.1,
    'bodybuilderDetails', 0.55,
    'bodybuilderSize', 1.0,
    'breastsSag', 0.12,
    'breastsSmall', 0.62,
    'dollBody', 0,
    'emaciated', -0.95,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.7,
    'nipples', 0,
    'pearFigure', 0.28,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.07,
    'forearmMass', 1.01,
    'thighMass', 1.16,
    'calfMass', 1.01,
    'torsoMass', 1.13,
    'neckMass', 0.955,
    'gate', 1,
    'isActive', true
  ),
  0.66,
  0.80,
  'Variant athlète REC avec BMI légèrement plus élevé'
),
(
  'FEM-REC-NOR-NO-MM-BMI22-24-M01',
  'Femme athlétique, rectangle, BMI 22-24, moyennement musclée',
  'feminine',
  'Non obèse',
  'Moyennement musclée',
  'Normal',
  'REC',
  ARRAY[22.5, 24.5],
  ARRAY[160, 175],
  ARRAY[57.6, 74.8],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.6,
    'assLarge', -0.32,
    'bigHips', -0.1,
    'bodybuilderDetails', 0.35,
    'bodybuilderSize', 0.95,
    'breastsSag', 0.1,
    'breastsSmall', 0.6,
    'dollBody', 0,
    'emaciated', -0.9,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.65,
    'nipples', 0,
    'pearFigure', 0.25,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.04,
    'forearmMass', 1.0,
    'thighMass', 1.13,
    'calfMass', 1.0,
    'torsoMass', 1.11,
    'neckMass', 0.95,
    'gate', 1,
    'isActive', true
  ),
  0.62,
  0.75,
  'Athlète REC moyennement musclée, BMI 22-24'
);

-- ============================================================
-- SAB (Sablier) - Athlètes féminines
-- ============================================================

INSERT INTO morph_archetypes (
  id, name, gender, obesity, muscularity, level, morphotype,
  bmi_range, height_range, weight_range,
  morph_values, limb_masses, morph_index, muscle_index, notes
) VALUES 
(
  'FEM-SAB-NOR-NO-ATH-BMI22-24-M01',
  'Femme athlétique, sablier, BMI 22-24, musclée',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'SAB',
  ARRAY[22.0, 24.0],
  ARRAY[160, 175],
  ARRAY[56.3, 73.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.68,
    'assLarge', 0.05,
    'bigHips', 0.2,
    'bodybuilderDetails', 0.50,
    'bodybuilderSize', 1.0,
    'breastsSag', 0.08,
    'breastsSmall', 0.45,
    'dollBody', 0,
    'emaciated', -0.85,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.78,
    'nipples', 0,
    'pearFigure', 0.48,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.02,
    'forearmMass', 0.99,
    'thighMass', 1.18,
    'calfMass', 1.04,
    'torsoMass', 1.09,
    'neckMass', 0.93,
    'gate', 1,
    'isActive', true
  ),
  0.70,
  0.78,
  'Athlète SAB musclée, taille marquée, BMI 22-24'
),
(
  'FEM-SAB-NOR-NO-ATH-BMI22-24-M02',
  'Femme athlétique, sablier, BMI 22-24, musclée variant',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'SAB',
  ARRAY[22.5, 24.5],
  ARRAY[162, 177],
  ARRAY[59.0, 76.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.70,
    'assLarge', 0.03,
    'bigHips', 0.18,
    'bodybuilderDetails', 0.45,
    'bodybuilderSize', 1.0,
    'breastsSag', 0.10,
    'breastsSmall', 0.48,
    'dollBody', 0,
    'emaciated', -0.92,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.75,
    'nipples', 0,
    'pearFigure', 0.50,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.015,
    'forearmMass', 0.98,
    'thighMass', 1.16,
    'calfMass', 1.04,
    'torsoMass', 1.10,
    'neckMass', 0.92,
    'gate', 1,
    'isActive', true
  ),
  0.68,
  0.76,
  'Variant athlète SAB, BMI légèrement plus élevé'
),
(
  'FEM-SAB-NOR-NO-MM-BMI22-24-M01',
  'Femme athlétique, sablier, BMI 22-24, moyennement musclée',
  'feminine',
  'Non obèse',
  'Moyennement musclée',
  'Normal',
  'SAB',
  ARRAY[22.5, 24.5],
  ARRAY[160, 175],
  ARRAY[57.6, 74.8],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.67,
    'assLarge', 0.05,
    'bigHips', 0.2,
    'bodybuilderDetails', 0.25,
    'bodybuilderSize', 0.95,
    'breastsSag', 0.08,
    'breastsSmall', 0.45,
    'dollBody', 0,
    'emaciated', -0.78,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.78,
    'nipples', 0,
    'pearFigure', 0.45,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.01,
    'forearmMass', 0.985,
    'thighMass', 1.14,
    'calfMass', 1.04,
    'torsoMass', 1.08,
    'neckMass', 0.92,
    'gate', 1,
    'isActive', true
  ),
  0.65,
  0.72,
  'Athlète SAB moyennement musclée, BMI 22-24'
);

-- ============================================================
-- POI (Poire) - Athlètes féminines
-- ============================================================

INSERT INTO morph_archetypes (
  id, name, gender, obesity, muscularity, level, morphotype,
  bmi_range, height_range, weight_range,
  morph_values, limb_masses, morph_index, muscle_index, notes
) VALUES 
(
  'FEM-POI-NOR-NO-ATH-BMI22-24-M01',
  'Femme athlétique, poire, BMI 22-24, musclée',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'POI',
  ARRAY[22.0, 24.0],
  ARRAY[160, 175],
  ARRAY[56.3, 73.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.68,
    'assLarge', 0.08,
    'bigHips', 0.3,
    'bodybuilderDetails', 0.45,
    'bodybuilderSize', 1.0,
    'breastsSag', 0.10,
    'breastsSmall', 0.55,
    'dollBody', 0,
    'emaciated', -0.82,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.80,
    'nipples', 0,
    'pearFigure', 0.60,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 0.98,
    'forearmMass', 0.95,
    'thighMass', 1.25,
    'calfMass', 1.15,
    'torsoMass', 1.07,
    'neckMass', 0.92,
    'gate', 1,
    'isActive', true
  ),
  0.72,
  0.75,
  'Athlète POI musclée, cuisses puissantes, BMI 22-24'
),
(
  'FEM-POI-NOR-NO-ATH-BMI22-24-M02',
  'Femme athlétique, poire, BMI 22-24, musclée variant',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'POI',
  ARRAY[22.5, 24.5],
  ARRAY[162, 177],
  ARRAY[59.0, 76.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.70,
    'assLarge', 0.05,
    'bigHips', 0.28,
    'bodybuilderDetails', 0.40,
    'bodybuilderSize', 1.0,
    'breastsSag', 0.10,
    'breastsSmall', 0.58,
    'dollBody', 0,
    'emaciated', -0.78,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.75,
    'nipples', 0,
    'pearFigure', 0.62,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 0.99,
    'forearmMass', 0.95,
    'thighMass', 1.27,
    'calfMass', 1.14,
    'torsoMass', 1.08,
    'neckMass', 0.93,
    'gate', 1,
    'isActive', true
  ),
  0.70,
  0.73,
  'Variant athlète POI, BMI légèrement plus élevé'
),
(
  'FEM-POI-NOR-NO-MM-BMI22-24-M01',
  'Femme athlétique, poire, BMI 22-24, moyennement musclée',
  'feminine',
  'Non obèse',
  'Moyennement musclée',
  'Normal',
  'POI',
  ARRAY[22.5, 24.5],
  ARRAY[160, 175],
  ARRAY[57.6, 74.8],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.67,
    'assLarge', 0.08,
    'bigHips', 0.3,
    'bodybuilderDetails', 0.22,
    'bodybuilderSize', 0.95,
    'breastsSag', 0.10,
    'breastsSmall', 0.55,
    'dollBody', 0,
    'emaciated', -0.75,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.80,
    'nipples', 0,
    'pearFigure', 0.58,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 0.97,
    'forearmMass', 0.94,
    'thighMass', 1.22,
    'calfMass', 1.12,
    'torsoMass', 1.05,
    'neckMass', 0.92,
    'gate', 1,
    'isActive', true
  ),
  0.67,
  0.71,
  'Athlète POI moyennement musclée, BMI 22-24'
);

-- Continuer avec POM, TRI, OVA (même structure)...

-- ============================================================
-- POM (Pomme) - Athlètes féminines
-- ============================================================

INSERT INTO morph_archetypes (
  id, name, gender, obesity, muscularity, level, morphotype,
  bmi_range, height_range, weight_range,
  morph_values, limb_masses, morph_index, muscle_index, notes
) VALUES 
(
  'FEM-POM-NOR-NO-ATH-BMI22-24-M01',
  'Femme athlétique, pomme, BMI 22-24, musclée',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'POM',
  ARRAY[22.0, 24.0],
  ARRAY[160, 175],
  ARRAY[56.3, 73.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.70,
    'assLarge', -0.18,
    'bigHips', -0.05,
    'bodybuilderDetails', 0.48,
    'bodybuilderSize', 1.0,
    'breastsSag', 0.18,
    'breastsSmall', 0.48,
    'dollBody', 0,
    'emaciated', -0.88,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.78,
    'nipples', 0,
    'pearFigure', 0.48,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.03,
    'forearmMass', 0.98,
    'thighMass', 1.08,
    'calfMass', 1.0,
    'torsoMass', 1.12,
    'neckMass', 0.96,
    'gate', 1,
    'isActive', true
  ),
  0.67,
  0.76,
  'Athlète POM musclée, masse centrale, BMI 22-24'
),
(
  'FEM-POM-NOR-NO-ATH-BMI22-24-M02',
  'Femme athlétique, pomme, BMI 22-24, musclée variant',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'POM',
  ARRAY[22.5, 24.5],
  ARRAY[162, 177],
  ARRAY[59.0, 76.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.65,
    'assLarge', -0.20,
    'bigHips', -0.03,
    'bodybuilderDetails', 0.42,
    'bodybuilderSize', 1.0,
    'breastsSag', 0.20,
    'breastsSmall', 0.46,
    'dollBody', 0,
    'emaciated', -0.85,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.80,
    'nipples', 0,
    'pearFigure', 0.46,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.02,
    'forearmMass', 0.97,
    'thighMass', 1.06,
    'calfMass', 0.99,
    'torsoMass', 1.13,
    'neckMass', 0.96,
    'gate', 1,
    'isActive', true
  ),
  0.65,
  0.74,
  'Variant athlète POM, BMI légèrement plus élevé'
),
(
  'FEM-POM-NOR-NO-MM-BMI22-24-M01',
  'Femme athlétique, pomme, BMI 22-24, moyennement musclée',
  'feminine',
  'Non obèse',
  'Moyennement musclée',
  'Normal',
  'POM',
  ARRAY[22.5, 24.5],
  ARRAY[160, 175],
  ARRAY[57.6, 74.8],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.70,
    'assLarge', -0.18,
    'bigHips', -0.02,
    'bodybuilderDetails', 0.25,
    'bodybuilderSize', 0.95,
    'breastsSag', 0.18,
    'breastsSmall', 0.48,
    'dollBody', 0,
    'emaciated', -0.85,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.78,
    'nipples', 0,
    'pearFigure', 0.48,
    'pregnant', 0,
    'superBreast', 0.02
  ),
  jsonb_build_object(
    'armMass', 1.0,
    'forearmMass', 0.97,
    'thighMass', 1.05,
    'calfMass', 0.99,
    'torsoMass', 1.11,
    'neckMass', 0.955,
    'gate', 1,
    'isActive', true
  ),
  0.64,
  0.72,
  'Athlète POM moyennement musclée, BMI 22-24'
);

-- ============================================================
-- TRI (Triangle inversé) - Athlètes féminines
-- ============================================================

INSERT INTO morph_archetypes (
  id, name, gender, obesity, muscularity, level, morphotype,
  bmi_range, height_range, weight_range,
  morph_values, limb_masses, morph_index, muscle_index, notes
) VALUES 
(
  'FEM-TRI-NOR-NO-ATH-BMI22-24-M01',
  'Femme athlétique, triangle inversé, BMI 22-24, musclée',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'TRI',
  ARRAY[22.0, 24.0],
  ARRAY[160, 175],
  ARRAY[56.3, 73.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.70,
    'assLarge', -0.52,
    'bigHips', -0.05,
    'bodybuilderDetails', 0.62,
    'bodybuilderSize', 0.95,
    'breastsSag', 0.02,
    'breastsSmall', 0.68,
    'dollBody', 0,
    'emaciated', -1.02,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.70,
    'nipples', 0,
    'pearFigure', 0.12,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.08,
    'forearmMass', 1.0,
    'thighMass', 1.0,
    'calfMass', 0.96,
    'torsoMass', 1.15,
    'neckMass', 0.96,
    'gate', 1,
    'isActive', true
  ),
  0.64,
  0.80,
  'Athlète TRI musclée, épaules développées, BMI 22-24'
),
(
  'FEM-TRI-NOR-NO-ATH-BMI22-24-M02',
  'Femme athlétique, triangle inversé, BMI 22-24, musclée variant',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'TRI',
  ARRAY[22.5, 24.5],
  ARRAY[162, 177],
  ARRAY[59.0, 76.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.70,
    'assLarge', -0.55,
    'bigHips', -0.04,
    'bodybuilderDetails', 0.58,
    'bodybuilderSize', 0.95,
    'breastsSag', 0.02,
    'breastsSmall', 0.70,
    'dollBody', 0,
    'emaciated', -1.00,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.70,
    'nipples', 0,
    'pearFigure', 0.10,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.06,
    'forearmMass', 0.99,
    'thighMass', 0.98,
    'calfMass', 0.95,
    'torsoMass', 1.14,
    'neckMass', 0.96,
    'gate', 1,
    'isActive', true
  ),
  0.62,
  0.78,
  'Variant athlète TRI, BMI légèrement plus élevé'
),
(
  'FEM-TRI-NOR-NO-MM-BMI22-24-M01',
  'Femme athlétique, triangle inversé, BMI 22-24, moyennement musclée',
  'feminine',
  'Non obèse',
  'Moyennement musclée',
  'Normal',
  'TRI',
  ARRAY[22.5, 24.5],
  ARRAY[160, 175],
  ARRAY[57.6, 74.8],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', 0.70,
    'assLarge', -0.55,
    'bigHips', -0.04,
    'bodybuilderDetails', 0.42,
    'bodybuilderSize', 0.90,
    'breastsSag', 0.01,
    'breastsSmall', 0.68,
    'dollBody', 0,
    'emaciated', -0.98,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.70,
    'nipples', 0,
    'pearFigure', 0.10,
    'pregnant', 0,
    'superBreast', 0
  ),
  jsonb_build_object(
    'armMass', 1.04,
    'forearmMass', 0.99,
    'thighMass', 0.97,
    'calfMass', 0.94,
    'torsoMass', 1.12,
    'neckMass', 0.955,
    'gate', 1,
    'isActive', true
  ),
  0.60,
  0.72,
  'Athlète TRI moyennement musclée, BMI 22-24'
);

-- ============================================================
-- OVA (Ovale) - Athlètes féminines
-- ============================================================

INSERT INTO morph_archetypes (
  id, name, gender, obesity, muscularity, level, morphotype,
  bmi_range, height_range, weight_range,
  morph_values, limb_masses, morph_index, muscle_index, notes
) VALUES 
(
  'FEM-OVA-NOR-NO-ATH-BMI22-24-M01',
  'Femme athlétique, ovale, BMI 22-24, musclée',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'OVA',
  ARRAY[22.0, 24.0],
  ARRAY[160, 175],
  ARRAY[56.3, 73.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', -0.05,
    'assLarge', 0.08,
    'bigHips', -0.1,
    'bodybuilderDetails', 0.42,
    'bodybuilderSize', 1.0,
    'breastsSag', 0.18,
    'breastsSmall', 0.45,
    'dollBody', 0.08,
    'emaciated', -0.96,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.85,
    'nipples', 0,
    'pearFigure', 0.62,
    'pregnant', 0,
    'superBreast', 0.08
  ),
  jsonb_build_object(
    'armMass', 1.01,
    'forearmMass', 1.0,
    'thighMass', 1.14,
    'calfMass', 1.05,
    'torsoMass', 1.10,
    'neckMass', 0.97,
    'gate', 1,
    'isActive', true
  ),
  0.71,
  0.77,
  'Athlète OVA musclée, distribution harmonieuse, BMI 22-24'
),
(
  'FEM-OVA-NOR-NO-ATH-BMI22-24-M02',
  'Femme athlétique, ovale, BMI 22-24, musclée variant',
  'feminine',
  'Non obèse',
  'Musclée',
  'Normal',
  'OVA',
  ARRAY[22.5, 24.5],
  ARRAY[162, 177],
  ARRAY[59.0, 76.5],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', -0.08,
    'assLarge', 0.10,
    'bigHips', -0.1,
    'bodybuilderDetails', 0.38,
    'bodybuilderSize', 1.0,
    'breastsSag', 0.20,
    'breastsSmall', 0.42,
    'dollBody', 0.10,
    'emaciated', -0.98,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.88,
    'nipples', 0,
    'pearFigure', 0.68,
    'pregnant', 0,
    'superBreast', 0.10
  ),
  jsonb_build_object(
    'armMass', 1.01,
    'forearmMass', 1.0,
    'thighMass', 1.12,
    'calfMass', 1.05,
    'torsoMass', 1.09,
    'neckMass', 0.96,
    'gate', 1,
    'isActive', true
  ),
  0.69,
  0.75,
  'Variant athlète OVA, BMI légèrement plus élevé'
),
(
  'FEM-OVA-NOR-NO-MM-BMI22-24-M01',
  'Femme athlétique, ovale, BMI 22-24, moyennement musclée',
  'feminine',
  'Non obèse',
  'Moyennement musclée',
  'Normal',
  'OVA',
  ARRAY[22.5, 24.5],
  ARRAY[160, 175],
  ARRAY[57.6, 74.8],
  jsonb_build_object(
    'animeNeck', 0,
    'animeProportion', 0,
    'animeWaist', -0.08,
    'assLarge', 0.10,
    'bigHips', -0.1,
    'bodybuilderDetails', 0.28,
    'bodybuilderSize', 0.95,
    'breastsSag', 0.18,
    'breastsSmall', 0.45,
    'dollBody', 0.10,
    'emaciated', -0.95,
    'FaceLowerEyelashLength', 1,
    'narrowWaist', -0.85,
    'nipples', 0,
    'pearFigure', 0.65,
    'pregnant', 0,
    'superBreast', 0.08
  ),
  jsonb_build_object(
    'armMass', 1.01,
    'forearmMass', 1.0,
    'thighMass', 1.11,
    'calfMass', 1.05,
    'torsoMass', 1.09,
    'neckMass', 0.965,
    'gate', 1,
    'isActive', true
  ),
  0.68,
  0.74,
  'Athlète OVA moyennement musclée, BMI 22-24'
);

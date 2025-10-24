# Audit du Catalogue d'Exercices - État Actuel

**Date**: 2025-10-24
**Objectif**: Migration vers Supabase (3000+ exercices)

---

## 📊 Inventaire Actuel

### Exercises Existants dans le Code

#### 1. Calisthenics (`src/domain/calisthenics/calisthenicsExercises.ts`)
- **Pull Exercises**: 5 exercices (scapula pull-ups → one-arm pull-up)
- **Push Exercises**: 4 exercices (wall push-ups → handstand push-ups)
- **Dips Exercises**: 3 exercices (bench dips → ring dips)
- **Core Exercises**: 4 exercices (plank → dragon flag)
- **Skills Exercises**: 4 exercices (front lever tuck → human flag)
- **TOTAL CALISTHENICS**: **20 exercices**

#### 2. Functional/CrossFit (`src/domain/functional/functionalExercises.ts`)
- **Olympic Lifts**: 5 mouvements (snatch, clean & jerk, etc.)
- **Gymnastic Movements**: 7 mouvements (muscle-up, HSPU, toes-to-bar, etc.)
- **Weighted Movements**: 7 mouvements (thruster, wall ball, kettlebell swing, etc.)
- **Monostructural**: 4 mouvements (rowing, assault bike, ski erg, running)
- **Bodyweight**: 6 mouvements (burpee, box jump, air squat, etc.)
- **Girl WODs**: 7 benchmarks (Fran, Grace, Diane, Cindy, Annie, Karen, Helen)
- **Hero WODs**: 4 benchmarks (Murph, DT, Angie, The Seven)
- **TOTAL FUNCTIONAL**: **29 mouvements + 11 WODs = 40 items**

#### 3. Endurance (`src/domain/exercises/enduranceExercises.ts`)
- **Running Workouts**: 7 séances (easy run, long run, tempo, intervals, etc.)
- **Cycling Workouts**: 7 séances (recovery ride, endurance, sweet spot, etc.)
- **Swimming Workouts**: 5 séances (technique drills, endurance, CSS intervals, etc.)
- **Triathlon Workouts**: 3 séances (brick workouts, swim-bike, multisport)
- **TOTAL ENDURANCE**: **22 séances**

### TOTAL ACTUEL: **82 exercices/séances**

---

## 🎯 Plan pour Atteindre 3000+ Exercices

### Répartition Cible par Discipline

#### Force/Musculation (1200 exercices)
**Actuellement**: 0 dans le code
**Cible**: 1200

**Catégories à créer**:
- **Poitrine (150)**: Développé couché variations, flys, dips lestés, presses inclinées/déclinées
- **Dos (200)**: Tractions variations, tirages, rowing, deadlifts variations, pullover
- **Épaules (150)**: Développés militaires, élévations, rowing menton, rotations
- **Bras (120)**: Biceps curls (tous types), extensions triceps, avant-bras
- **Jambes (300)**: Squats variations, leg press, lunges, leg curls/extensions, mollets
- **Core (150)**: Abdominaux, obliques, lombaires, gainage dynamique
- **Full Body (100)**: Mouvements composés, complexes, circuits
- **Isolation/Accessories (30)**: Petits muscles, stabilisateurs

#### Calisthenics Enrichi (400 exercices)
**Actuellement**: 20
**Cible**: 400

**Enrichissement nécessaire**:
- **Pull Progressions (80)**: 10+ variations pull-ups, rows variations, lever progressions
- **Push Progressions (80)**: 15+ variations push-ups, HSPU progressions, planche work
- **Legs (60)**: Pistol squats progressions, shrimp squats, sissy squats, jumps
- **Core (80)**: L-sits progressions, human flag progressions, hollow/arch variations
- **Skills (50)**: Muscle-ups, levers, flags, planches, back lever, maltese
- **Flexibility/Mobility (50)**: Stretches, bridges, splits progressions

#### Functional/CrossFit Enrichi (600 exercices)
**Actuellement**: 40
**Cible**: 600

**Enrichissement nécessaire**:
- **Olympic Lifts (100)**: Toutes progressions snatch/clean/jerk + complexes
- **Gymnastic (100)**: Skills avancés, kipping, strict, progressions
- **Monostructural (80)**: Variantes cardio, intervalles structurés
- **Weighted (120)**: Tous mouvements barbell/dumbbell/kettlebell
- **WODs Custom (200)**: Formats variés (AMRAP, EMOM, For Time, Chipper, etc.)

#### Endurance Enrichi (400 exercices)
**Actuellement**: 22
**Cible**: 400

**Enrichissement nécessaire**:
- **Running (120)**: Tous types de sorties, toutes distances, tous niveaux
- **Cycling (120)**: Zones de puissance, FTP work, sprints, endurance
- **Swimming (80)**: Technique, vitesse, endurance, drills
- **Triathlon (50)**: Bricks, enchaînements, transitions
- **Multi-sports (30)**: Trail, ultra, duathlon, aquathlon

#### Mobilité & Récupération (200 exercices)
**Actuellement**: 0
**Cible**: 200

**Catégories à créer**:
- **Étirements Statiques (50)**: Par groupe musculaire, par sport
- **Étirements Dynamiques (50)**: Échauffements, mobilité articulaire
- **Foam Rolling (40)**: Automassage, trigger points
- **Yoga/Pilates (40)**: Poses, flows, séquences
- **Respiration (20)**: Techniques de respiration, pranayama

#### Rééducation & Prévention (200 exercices)
**Actuellement**: 0
**Cible**: 200

**Catégories à créer**:
- **Post-blessure par zone (80)**: Épaule, genou, dos, cheville, etc.
- **Renforcement Préventif (60)**: Rotateurs, stabilisateurs, proprioception
- **Corrections Posturales (40)**: Exercices correctifs, alignement
- **Progressions Thérapeutiques (20)**: Retour au sport, charge progressive

---

## 🔧 Infrastructure Existante

### Tables Supabase Déjà Créées ✅
- `exercises` - Table principale avec métadonnées complètes
- `exercise_execution_details` - Phases d'exécution détaillées
- `exercise_coaching_cues` - Cues par niveau et pathologie
- `exercise_progressions` - Relations progression/régression/variation
- `exercise_translations` - Support multi-langue (fr, en, es, de, it, pt)
- `muscle_groups` - 50+ groupes musculaires
- `equipment_types` - 500+ équipements (récemment migré)
- `exercise_muscle_groups` - Many-to-many exercices-muscles
- `exercise_equipment` - Many-to-many exercices-équipements

### Fonctions SQL Disponibles ✅
- `search_exercises()` - Recherche avec fuzzy matching
- `increment_exercise_usage()` - Tracking utilisation
- `generate_exercise_slug()` - Génération automatique slug
- `normalize_exercise_name_v2()` - Normalisation pour matching

### Index & Performance ✅
- Full-text search avec pg_trgm
- Index sur discipline, difficulty, category
- Index sur tags, visual_keywords, target_goals
- Index sur relations muscle_groups et equipment

### RLS & Sécurité ✅
- Lecture publique pour exercices validés
- Lecture complète pour authenticated
- Gestion complète pour service_role

---

## 📋 Script de Migration Existant

**Fichier**: `scripts/migrate-exercises-to-supabase.ts`
**État**: Partiel - seulement 20 exercices calisthenics migrés en exemple

**Fonctionnalités existantes**:
- Insertion exercices avec métadonnées
- Liaison muscle groups
- Liaison equipment
- Insertion coaching cues
- Création des progressions

**À améliorer**:
- Gérer toutes les disciplines
- Batch processing pour éviter timeouts
- Logging détaillé et error handling
- Validation des données
- Génération des traductions

---

## ✅ Actions Immédiates

### Phase 1: Audit Complet (DONE)
- [x] Recenser exercices existants
- [x] Vérifier infrastructure database
- [x] Identifier gaps et besoins

### Phase 2: Préparation Données
- [ ] Vérifier muscle_groups completeness
- [ ] Vérifier equipment_types completeness
- [ ] Créer mapping exercices → muscles
- [ ] Créer mapping exercices → equipment

### Phase 3: Enrichissement Catalogue
- [ ] Force: 1200 exercices
- [ ] Calisthenics: +380 exercices
- [ ] Functional: +560 exercices
- [ ] Endurance: +378 exercices
- [ ] Mobilité: 200 exercices
- [ ] Rééducation: 200 exercices

### Phase 4: Migration
- [ ] Étendre script migration
- [ ] Exécuter migrations par batch
- [ ] Valider intégrité données
- [ ] Tester recherche et filtrage

### Phase 5: Systèmes Intelligents
- [ ] Matching équipement → exercices
- [ ] Système de substitution
- [ ] Suggestions basées contexte
- [ ] Filtres avancés

---

## 📈 Métriques de Succès

- ✅ 3000+ exercices dans la base
- ✅ Tous exercices ont muscle groups liés
- ✅ Tous exercices ont equipment liés (si applicable)
- ✅ Système de recherche performant (<100ms)
- ✅ Matching intelligent équipement-exercices fonctionnel
- ✅ Système de substitution opérationnel
- ✅ Integration avec detect-equipment complète

---

**Prochaine Étape**: Créer le script de migration complet et enrichi

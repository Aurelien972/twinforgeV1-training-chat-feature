# Guide d'Implémentation - Catalogue d'Exercices 3000+

**Date**: 2025-10-24
**Version**: 2.0
**Statut**: Ready for Implementation

---

## 📋 Vue d'Ensemble

Ce guide décrit l'implémentation complète du système de catalogue d'exercices dans Supabase, incluant:

1. **Infrastructure Database** (✅ Complète)
2. **Système de Matching Intelligent** (✅ Créé)
3. **Système de Substitution** (✅ Créé)
4. **Scripts de Migration** (✅ Prêts)
5. **Intégration Edge Functions** (⏳ À faire)

---

## 🏗️ Architecture du Système

### Tables Principales

```
exercises (table principale)
├── exercise_execution_details (phases d'exécution)
├── exercise_coaching_cues (cues par niveau)
├── exercise_progressions (progressions/régressions)
├── exercise_translations (multi-langue)
├── exercise_muscle_groups (many-to-many muscles)
├── exercise_equipment (many-to-many équipements)
├── exercise_substitutions (alternatives)
└── exercise_compatibility_scores (scores de compatibilité)
```

### Fonctions SQL Intelligentes

1. **find_exercises_by_equipment()**
   - Trouve les exercices compatibles avec l'équipement disponible
   - Score de compatibilité (0.0 à 1.0)
   - Identifie l'équipement manquant
   - Filtre par discipline, difficulté, lieu

2. **suggest_exercise_substitutions()**
   - Trouve des alternatives quand équipement manquant
   - Recherche par mouvement similaire
   - Recherche par muscles similaires
   - Score de similarité avec raison

3. **get_exercises_for_location()**
   - Retourne exercices compatibles avec un lieu (gym, home, outdoor)
   - Utilise equipment_location_compatibility
   - Filtre automatique par équipement commun

4. **rank_exercises_by_relevance()**
   - Classe exercices par pertinence pour l'utilisateur
   - Score basé sur: équipement (30%), niveau (40%), objectifs (30%)
   - Retourne les meilleurs matchs

---

## 🚀 Étapes d'Implémentation

### Phase 1: Infrastructure Database ✅

**Statut**: Complété
**Fichiers**:
- `20251024040623_create_comprehensive_exercise_catalog_system.sql`
- `20251024040716_seed_muscle_groups_and_equipment_reference_data.sql`
- `20251025100000_create_exercise_matching_system.sql`

**Actions**:
```bash
# Vérifier que les migrations sont appliquées
supabase db push

# Ou via dashboard Supabase
# SQL Editor → Run migrations
```

**Validation**:
```sql
-- Vérifier les tables
SELECT COUNT(*) FROM exercises;
SELECT COUNT(*) FROM muscle_groups;
SELECT COUNT(*) FROM equipment_types;

-- Tester les fonctions
SELECT * FROM find_exercises_by_equipment(
  ARRAY['uuid-barbell', 'uuid-bench']::uuid[],
  'force',
  'intermediate',
  'gym',
  10
);
```

### Phase 2: Seed Initial Data 🔄

**Statut**: Scripts prêts, exécution à faire
**Fichier**: `scripts/seed-exercises-comprehensive.ts`

**Commandes**:
```bash
# Installer dépendances
npm install tsx

# Seed toutes les disciplines
npx tsx scripts/seed-exercises-comprehensive.ts

# Seed une discipline spécifique
npx tsx scripts/seed-exercises-comprehensive.ts --discipline=force
npx tsx scripts/seed-exercises-comprehensive.ts --discipline=calisthenics
npx tsx scripts/seed-exercises-comprehensive.ts --discipline=functional
```

**Ce qui est seedé**:
- ✅ Exercices avec métadonnées complètes
- ✅ Relations muscle_groups automatiques
- ✅ Relations equipment automatiques
- ✅ Coaching cues par exercice
- ✅ Progressions/régressions

### Phase 3: Enrichissement du Catalogue 📈

**Objectif**: Passer de ~100 exercices à 3000+

**Approche recommandée**:

1. **Enrichir par discipline** (priorité haute)
   ```typescript
   // Ajouter dans seed-exercises-comprehensive.ts
   const FORCE_CHEST_EXERCISES = [
     // Barbell variations
     { name: 'Barbell Bench Press', ... },
     { name: 'Incline Barbell Bench Press', ... },
     { name: 'Decline Barbell Bench Press', ... },
     { name: 'Close-Grip Bench Press', ... },

     // Dumbbell variations
     { name: 'Dumbbell Bench Press', ... },
     { name: 'Incline Dumbbell Press', ... },
     { name: 'Dumbbell Flyes', ... },

     // Machine variations
     { name: 'Chest Press Machine', ... },
     { name: 'Pec Deck', ... },
     { name: 'Cable Crossover', ... },
   ];
   ```

2. **Utiliser des sources externes** (optionnel)
   - ExRx.net pour exercices force
   - GMB Fitness pour calisthenics
   - CrossFit.com pour functional
   - Toutes les sources doivent être adaptées au format ExerciseSeed

3. **Générer avec IA** (optionnel avancé)
   - Utiliser GPT-4 pour générer variations
   - Valider manuellement avant insertion
   - Exemple de prompt fourni dans EXERCISE_AI_GENERATION_PROMPTS.md

**Répartition cible**:
```
Force/Musculation:     1200 exercices
Calisthenics:           400 exercices
Functional/CrossFit:    600 exercices
Endurance:              400 exercices
Mobilité:               200 exercices
Rééducation:            200 exercices
─────────────────────────────────────
TOTAL:                 3000 exercices
```

### Phase 4: Système de Substitution 🔄

**Créer des substitutions intelligentes**:

```sql
-- Exemple: substitutions pour Barbell Bench Press
INSERT INTO exercise_substitutions (
  exercise_id,
  substitute_exercise_id,
  substitution_type,
  similarity_score,
  reason
)
SELECT
  (SELECT id FROM exercises WHERE name = 'Barbell Bench Press'),
  (SELECT id FROM exercises WHERE name = 'Dumbbell Bench Press'),
  'equipment_alternative',
  0.9,
  'Alternative avec haltères, activation similaire'
UNION ALL
SELECT
  (SELECT id FROM exercises WHERE name = 'Barbell Bench Press'),
  (SELECT id FROM exercises WHERE name = 'Push-ups'),
  'movement_similar',
  0.6,
  'Pattern de mouvement similaire, poids du corps'
;
```

**Automatiser les substitutions**:
```sql
-- Créer des substitutions basées sur muscle groups similaires
INSERT INTO exercise_substitutions (
  exercise_id,
  substitute_exercise_id,
  substitution_type,
  similarity_score,
  reason
)
SELECT DISTINCT
  e1.id,
  e2.id,
  'muscle_similar',
  0.5,
  'Cible les mêmes groupes musculaires principaux'
FROM exercises e1
JOIN exercise_muscle_groups emg1 ON e1.id = emg1.exercise_id AND emg1.involvement_type = 'primary'
JOIN exercise_muscle_groups emg2 ON emg1.muscle_group_id = emg2.muscle_group_id AND emg2.involvement_type = 'primary'
JOIN exercises e2 ON emg2.exercise_id = e2.id
WHERE
  e1.id != e2.id
  AND e1.discipline = e2.discipline
  AND ABS((
    SELECT COUNT(*) FROM exercise_equipment WHERE exercise_id = e1.id
  ) - (
    SELECT COUNT(*) FROM exercise_equipment WHERE exercise_id = e2.id
  )) <= 2
ON CONFLICT (exercise_id, substitute_exercise_id, substitution_type) DO NOTHING;
```

### Phase 5: Intégration Edge Function ⏳

**Modifier detect-equipment/index.ts**:

```typescript
import { createClient } from "npm:@supabase/supabase-js@2.54.0";

// Après détection d'équipement
const detectedEquipmentIds: string[] = [/* IDs from detection */];

// Appeler la fonction de matching
const { data: compatibleExercises, error } = await supabase
  .rpc('find_exercises_by_equipment', {
    p_available_equipment_ids: detectedEquipmentIds,
    p_discipline: userPreferredDiscipline,
    p_difficulty: userLevel,
    p_location_type: detectedLocation,
    p_limit: 50
  });

if (error) {
  console.error('Error finding exercises:', error);
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers: corsHeaders
  });
}

// Retourner exercices avec scores de compatibilité
return new Response(JSON.stringify({
  detected_equipment: detectedEquipment,
  compatible_exercises: compatibleExercises,
  total_found: compatibleExercises.length
}), {
  status: 200,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

**Créer nouvelle Edge Function pour substitutions**:

```bash
# Créer suggest-exercise-alternative
supabase functions new suggest-exercise-alternative
```

```typescript
// suggest-exercise-alternative/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.54.0";

Deno.serve(async (req: Request) => {
  const { exercise_id, available_equipment_ids } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase
    .rpc('suggest_exercise_substitutions', {
      p_original_exercise_id: exercise_id,
      p_available_equipment_ids: available_equipment_ids,
      p_max_suggestions: 5
    });

  return new Response(JSON.stringify({ substitutions: data }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Phase 6: Interface Frontend 🖥️

**Créer composants React pour exploiter le système**:

```typescript
// hooks/useExerciseMatcher.ts
export function useExerciseMatcher(equipmentIds: string[]) {
  const { data, isLoading } = useQuery({
    queryKey: ['exercises', 'matched', equipmentIds],
    queryFn: async () => {
      const { data } = await supabase
        .rpc('find_exercises_by_equipment', {
          p_available_equipment_ids: equipmentIds,
          p_limit: 100
        });
      return data;
    }
  });

  return { exercises: data, isLoading };
}

// hooks/useExerciseSubstitutions.ts
export function useExerciseSubstitutions(exerciseId: string) {
  const { data } = useQuery({
    queryKey: ['exercise-substitutions', exerciseId],
    queryFn: async () => {
      const { data } = await supabase
        .rpc('suggest_exercise_substitutions', {
          p_original_exercise_id: exerciseId,
          p_max_suggestions: 5
        });
      return data;
    }
  });

  return { substitutions: data };
}
```

---

## 📊 Métriques et Monitoring

### KPIs à Suivre

```sql
-- Nombre total d'exercices par discipline
SELECT
  discipline,
  COUNT(*) as total_exercises,
  COUNT(*) FILTER (WHERE is_validated = true) as validated,
  ROUND(AVG(quality_score), 2) as avg_quality
FROM exercises
GROUP BY discipline
ORDER BY total_exercises DESC;

-- Couverture des muscle groups
SELECT
  mg.name_fr,
  COUNT(DISTINCT emg.exercise_id) as exercise_count
FROM muscle_groups mg
LEFT JOIN exercise_muscle_groups emg ON mg.id = emg.muscle_group_id
GROUP BY mg.id, mg.name_fr
ORDER BY exercise_count DESC;

-- Exercices sans équipement (bodyweight)
SELECT COUNT(*)
FROM exercises e
WHERE NOT EXISTS (
  SELECT 1 FROM exercise_equipment ee
  WHERE ee.exercise_id = e.id AND ee.is_required = true
);

-- Taux de substitution disponible
SELECT
  COUNT(DISTINCT exercise_id) as exercises_with_substitutes,
  (SELECT COUNT(*) FROM exercises WHERE is_validated = true) as total_exercises,
  ROUND(
    COUNT(DISTINCT exercise_id)::numeric /
    (SELECT COUNT(*) FROM exercises WHERE is_validated = true)::numeric * 100,
    1
  ) as coverage_percent
FROM exercise_substitutions;
```

### Performance des Requêtes

```sql
-- Mesurer performance find_exercises_by_equipment
EXPLAIN ANALYZE
SELECT * FROM find_exercises_by_equipment(
  ARRAY['uuid1', 'uuid2']::uuid[],
  'force',
  'intermediate',
  'gym',
  50
);
```

---

## 🧪 Tests

### Tests SQL

```sql
-- Test 1: Find exercises with barbell only
SELECT * FROM find_exercises_by_equipment(
  ARRAY[(SELECT id FROM equipment_types WHERE name = 'barbell')]::uuid[],
  'force',
  NULL,
  'gym',
  10
);

-- Test 2: Suggest substitutions for an exercise
SELECT * FROM suggest_exercise_substitutions(
  (SELECT id FROM exercises WHERE name = 'Barbell Bench Press' LIMIT 1),
  NULL,
  5
);

-- Test 3: Get exercises for home
SELECT * FROM get_exercises_for_location('home', NULL, 'beginner', 20);

-- Test 4: Rank by relevance
SELECT * FROM rank_exercises_by_relevance(
  ARRAY[(SELECT id FROM equipment_types WHERE name = 'dumbbells')]::uuid[],
  'intermediate',
  ARRAY['strength', 'hypertrophy'],
  'force',
  10
);
```

### Tests End-to-End

1. **Détection d'équipement → Exercices compatibles**
2. **Sélection exercice → Substitutions disponibles**
3. **Choix lieu → Exercices adaptés**
4. **Profil utilisateur → Recommandations personnalisées**

---

## 📚 Documentation des Fonctions SQL

### find_exercises_by_equipment

```sql
find_exercises_by_equipment(
  p_available_equipment_ids uuid[],  -- IDs d'équipements disponibles
  p_discipline text DEFAULT NULL,    -- Filtrer par discipline
  p_difficulty text DEFAULT NULL,    -- Filtrer par difficulté
  p_location_type text DEFAULT 'gym', -- Type de lieu
  p_limit integer DEFAULT 50         -- Nombre max de résultats
) RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  discipline text,
  difficulty text,
  required_equipment jsonb,
  missing_equipment jsonb,
  compatibility_score numeric,  -- 0.0 à 1.0
  can_perform boolean
)
```

**Exemples d'utilisation**:
```sql
-- Tous exercices avec haltères
SELECT * FROM find_exercises_by_equipment(
  ARRAY[(SELECT id FROM equipment_types WHERE name_en = 'Dumbbells')],
  NULL, NULL, 'home', 100
);

-- Force intermédiaire à la maison
SELECT * FROM find_exercises_by_equipment(
  (SELECT ARRAY_AGG(id) FROM equipment_types WHERE name IN ('dumbbells', 'bench')),
  'force',
  'intermediate',
  'home',
  50
);
```

### suggest_exercise_substitutions

```sql
suggest_exercise_substitutions(
  p_original_exercise_id uuid,       -- Exercice à remplacer
  p_available_equipment_ids uuid[] DEFAULT NULL, -- Équipement dispo
  p_max_suggestions integer DEFAULT 5 -- Max alternatives
) RETURNS TABLE (
  substitute_id uuid,
  substitute_name text,
  substitution_type text,    -- 'equipment_alternative', 'movement_similar', etc.
  similarity_score numeric,  -- 0.0 à 1.0
  reason text,
  can_perform_now boolean
)
```

**Exemples**:
```sql
-- Trouver alternatives à Barbell Squat
SELECT * FROM suggest_exercise_substitutions(
  (SELECT id FROM exercises WHERE name = 'Barbell Back Squat'),
  NULL,
  5
);

-- Alternatives possibles avec équipement limité
SELECT * FROM suggest_exercise_substitutions(
  (SELECT id FROM exercises WHERE name = 'Barbell Bench Press'),
  ARRAY[(SELECT id FROM equipment_types WHERE name = 'dumbbells')],
  5
);
```

---

## 🎯 Prochaines Étapes

### Immédiat
1. ✅ Appliquer migration `20251025100000_create_exercise_matching_system.sql`
2. ⏳ Exécuter `seed-exercises-comprehensive.ts` pour seed initial
3. ⏳ Tester fonctions SQL avec données réelles
4. ⏳ Valider performance des requêtes

### Court Terme
1. Enrichir le catalogue (viser 500 exercices d'abord)
2. Créer substitutions pour exercices populaires
3. Intégrer avec detect-equipment Edge Function
4. Créer hooks React pour frontend

### Moyen Terme
1. Atteindre 3000+ exercices
2. Ajouter traductions complètes (fr, en, es)
3. Interface admin pour gérer exercices
4. Analytics sur exercices les plus utilisés

### Long Terme
1. Génération automatique illustrations
2. Vidéos d'exécution
3. Système de validation communautaire
4. Personnalisation IA avancée

---

## ✅ Checklist de Validation

- [x] Migration SQL créée et testée
- [x] Fonctions de matching testées
- [x] Script de seed créé
- [ ] Données initiales seedées
- [ ] Intégration Edge Function complète
- [ ] Hooks React créés
- [ ] Tests end-to-end passés
- [ ] Documentation complète
- [ ] Métriques de monitoring setup

---

**Version**: 2.0
**Dernière mise à jour**: 2025-10-24
**Mainteneur**: Claude Code

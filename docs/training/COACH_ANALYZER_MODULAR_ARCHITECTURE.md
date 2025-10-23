# Coach Analyzer - Architecture Modulaire

**Version:** 2.0.0
**Date:** Janvier 2025
**Statut:** Production Ready

---

## Vue d'Ensemble

Le système `training-coach-analyzer` est une edge function modulaire unique qui analyse automatiquement tous les types de séances d'entraînement en détectant le type de coach approprié et en adaptant son comportement en conséquence.

### Philosophie

**Une seule fonction pour tous les coachs** au lieu de créer une fonction séparée pour chaque type de coach. Cette approche permet:

- **Scalabilité**: Ajout facile de nouveaux types de coachs
- **Maintenance simplifiée**: Un seul point de mise à jour
- **Cache partagé**: Optimisation des coûts et de la latence
- **Cohérence**: Même structure de données pour tous les types

---

## Architecture Technique

### Détection Automatique du Type de Coach

La fonction `detectCoachType` analyse la prescription de séance pour identifier automatiquement le type de coach à utiliser.

```typescript
function detectCoachType(sessionPrescription: any): string {
  // Endurance: détection via mainWorkout (blocs) ou discipline
  if (sessionPrescription.mainWorkout || sessionPrescription.discipline) {
    const discipline = sessionPrescription.discipline?.toLowerCase();
    if (['running', 'cycling', 'swimming', 'triathlon', 'cardio'].includes(discipline)) {
      return 'endurance';
    }
  }

  // Force: détection via type ou category
  const type = sessionPrescription.type?.toLowerCase();
  const category = sessionPrescription.category?.toLowerCase();

  if (['force', 'strength', 'hypertrophy', 'powerlifting', 'bodybuilding'].includes(type)) {
    return 'force';
  }

  if (['force', 'force-powerbuilding', 'strength'].includes(category)) {
    return 'force';
  }

  // Si présence d'exercices (et pas de mainWorkout), c'est probablement force
  if (sessionPrescription.exercises && !sessionPrescription.mainWorkout) {
    return 'force';
  }

  // Fallback
  return 'mixed';
}
```

**Critères de Détection:**

| Type de Coach | Indicateurs |
|---------------|-------------|
| **Endurance** | `mainWorkout` présent OU `discipline` = running/cycling/swimming/triathlon/cardio |
| **Force** | `type` = force/strength/hypertrophy OU `category` = force/strength OU présence `exercises` |
| **Mixed** | Aucun critère clair (fallback) |

---

## Prompts Dynamiques

### Système de Prompts Adaptatifs

La fonction `buildSystemPrompt(coachType)` génère un prompt système spécialisé selon le type de coach détecté.

#### Structure Commune

Tous les prompts partagent une introduction commune:

```
Tu es un coach IA expert en analyse de performance sportive.

# Mission
Analyse la séance d'entraînement complétée et génère des insights ultra-personnalisés pour aider l'athlète à progresser.
```

#### Spécialisations par Type

**1. Coach Endurance**

```
# Type de Training
ENDURANCE (Course, Cyclisme, Natation, Triathlon, Cardio)

# Métriques Clés
- TSS (Training Stress Score)
- Zones cardiaques (Z1, Z2, Z3, Z4, Z5)
- Durée totale
- Pace/Vitesse
- Régularité de l'effort

# Focus Analyse
- Respect des zones cardiaques cibles
- Gestion du rythme (pacing)
- Distribution du temps par zone
- Endurance démontrée
- Recommandations de progression (volume/intensité)
```

**2. Coach Force**

```
# Type de Training
FORCE (Musculation, Powerlifting, Bodybuilding, Strongman)

# Métriques Clés
- Volume Load (Sets × Reps × Charge)
- RPE par série
- Technique d'exécution
- 1RM estimé

# Focus Analyse
- Qualité d'exécution
- Volume réalisé vs prescrit
- Intensité (RPE)
- Progression des charges
- Équilibre musculaire
```

---

## Schéma JSON Universel

Le schéma JSON de sortie est **identique pour tous les types de coachs**, ce qui permet une interface utilisateur unifiée.

### Structure de Base

```json
{
  "sessionAnalysis": {
    "overallPerformance": {
      "score": 85,
      "rating": "good",
      "summary": "..."
    },
    "volumeAnalysis": {
      "totalVolume": 12500,       // kg pour force, secondes pour endurance
      "volumeEfficiency": 92,
      "comparedToTarget": "..."
    },
    "intensityAnalysis": {
      "avgRPE": 7.5,
      "rpeDistribution": {},      // RPE 7-9 pour force, Z1-Z5 pour endurance
      "intensityZones": "..."
    },
    "techniqueAnalysis": {
      "avgTechniqueScore": 8.5,
      "exercisesWithIssues": [],
      "recommendations": []
    }
  },
  "exerciseBreakdown": [],         // Exercices pour force, blocs pour endurance
  "personalizedInsights": {},
  "progressionRecommendations": {
    "nextSession": {},
    "longTerm": {}
  },
  "achievements": [],
  "coachRationale": "..."
}
```

### Adaptation par Contexte

Les champs sont **sémantiquement adaptés** selon le type:

#### Endurance
- `volumeAnalysis.totalVolume` = durée en secondes
- `rpeDistribution` = `{"Z1": 10, "Z2": 60, "Z3": 20, "Z4": 10}`
- `exerciseBreakdown` = liste des blocs (échauffement, corps, cooldown)

#### Force
- `volumeAnalysis.totalVolume` = volume load en kg
- `rpeDistribution` = `{"7": 40, "8": 40, "9": 20}`
- `exerciseBreakdown` = liste des exercices

---

## Intégration Frontend

### Détection Côté Client

Les composants React détectent le type de séance pour adapter l'affichage:

```typescript
const isEnduranceSession = !!(sessionPrescription as any).mainWorkout
  || !!(sessionPrescription as any).discipline;
```

### Composants Adaptatifs

#### PersonalizedMetricsCard

```typescript
if (isEnduranceSession) {
  // Affiche: Durée totale, Calories, RPE moyen, Zones cardiaques
  return <EnduranceMetricsView />;
}

// Affiche: Volume load, RPE, Intensité, Time under tension
return <ForceMetricsView />;
```

#### ExerciseAnalysisCard

```typescript
if (isEnduranceSession) {
  // Affiche l'analyse par bloc (échauffement, corps, cooldown)
  return <BlockAnalysisView />;
}

// Affiche l'analyse par exercice (squat, bench press, etc.)
return <ExerciseAnalysisView />;
```

---

## Système de Cache

### Cache Partagé

**Tous les types de coachs partagent le même système de cache**, avec des clés uniques par utilisateur et session:

```typescript
const cacheKey = `coach-analyzer:${userId}:${sessionId}`;
```

**Avantages:**
- Réduction des coûts (pas de génération redondante)
- Latence optimisée (< 50ms pour cache hit)
- Gestion simplifiée (une seule table)

### TTL par Type de Cache

| Type | TTL | Raison |
|------|-----|--------|
| Analysis | 30 minutes | Données post-séance, rarement consultées plusieurs fois |
| Prescription | 6 heures | Peut être réutilisée pour séances similaires |

---

## Ajout d'un Nouveau Type de Coach

Pour ajouter un nouveau type de coach (ex: Wellness, Mobility, CrossFit):

### 1. Mettre à Jour la Détection

```typescript
function detectCoachType(sessionPrescription: any): string {
  // Ajouter la logique de détection
  if (sessionPrescription.type === 'wellness' || sessionPrescription.category === 'recovery') {
    return 'wellness';
  }

  // ... reste du code
}
```

### 2. Créer le Prompt Spécialisé

```typescript
function buildSystemPrompt(coachType: string): string {
  // ...

  if (coachType === 'wellness') {
    return commonIntro + `
# Type de Training
WELLNESS (Récupération, Mobilité, Yoga, Stretching)

# Métriques Clés
- ROM (Range of Motion)
- Temps de relaxation
- Qualité de mouvement
- Respiration

# Focus Analyse
- Amélioration de la mobilité
- Qualité de la récupération
- État de relaxation
- Points de tension identifiés
`;
  }

  // ... reste du code
}
```

### 3. Adapter les Composants Frontend

```typescript
// PersonalizedMetricsCard.tsx
if (isWellnessSession) {
  return <WellnessMetricsView />;
}
```

**C'est tout !** Le système de cache, la persistence, et l'infrastructure sont déjà en place.

---

## Monitoring et Logs

### Logs de Détection

La fonction edge log automatiquement le type détecté:

```
[COACH-ANALYZER] Coach type detected {
  coachType: 'endurance',
  type: undefined,
  category: undefined,
  discipline: 'running',
  hasMainWorkout: true,
  hasExercises: false
}
```

### Métriques Clés

- **Taux de cache hit/miss** par type de coach
- **Latence moyenne** par type de coach
- **Coût par analyse** (tokens utilisés)
- **Taux de succès** de génération

### Table de Monitoring

```sql
SELECT
  input_context->>'sessionPrescription'->>'type' as coach_type,
  AVG(latency_ms) as avg_latency,
  AVG(tokens_used) as avg_tokens,
  AVG(cost_usd) as avg_cost,
  COUNT(*) as total_analyses
FROM training_ai_generations
WHERE agent_type = 'coach-analyzer'
GROUP BY coach_type;
```

---

## Métriques de Performance

### Benchmarks

| Métrique | Force | Endurance | Cible |
|----------|-------|-----------|-------|
| Latence (cold) | ~3-5s | ~3-5s | < 6s |
| Latence (cached) | ~30ms | ~30ms | < 100ms |
| Tokens utilisés | ~2000 | ~2000 | < 3000 |
| Coût par analyse | ~$0.0006 | ~$0.0006 | < $0.001 |
| Cache hit rate | 40-60% | 40-60% | > 50% |

---

## Best Practices

### Pour les Développeurs

1. **Toujours vérifier le type de coach** avant d'afficher des métriques spécifiques
2. **Utiliser les helpers de détection** (`isEnduranceSession`) plutôt que dupliquer la logique
3. **Logger les cas edge** où le type de coach est 'mixed' ou indéterminé
4. **Tester avec des données réelles** des deux types de coachs

### Pour l'Ajout de Nouveaux Coachs

1. **Commencer par la détection** - assurer qu'elle est non-ambiguë
2. **Créer le prompt spécialisé** - focus sur les métriques pertinentes
3. **Adapter les composants UI** - affichage des métriques appropriées
4. **Tester le cache** - vérifier que le TTL est adapté
5. **Documenter** - ajouter une section dans cette doc

---

## Exemples d'Utilisation

### Appel de la Fonction

```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/training-coach-analyzer`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`,
  },
  body: JSON.stringify({
    userId: 'user-123',
    sessionPrescription: {
      // Pour endurance
      discipline: 'running',
      mainWorkout: [/* blocs */],

      // OU pour force
      type: 'strength',
      exercises: [/* exercices */]
    },
    sessionFeedback: {
      /* données de la séance */
    },
    preparerContext: {
      /* contexte utilisateur */
    }
  })
});

const result = await response.json();
// result.data contient l'analyse adaptée au type de coach
```

### Affichage dans l'UI

```typescript
// Step4Adapter.tsx
<PersonalizedMetricsCard
  sessionPrescription={sessionPrescription}  // La carte détecte le type
  sessionFeedback={sessionFeedback}
  aiAnalysis={analysis}
  stepColor={STEP_COLORS.adapter}
/>

// La carte affiche automatiquement les métriques appropriées
```

---

## FAQ

**Q: Pourquoi une fonction unique plutôt que plusieurs fonctions spécialisées?**

R: Pour simplifier la maintenance, partager le cache, et réduire les coûts d'infrastructure. Ajouter un nouveau coach nécessite seulement d'ajouter un cas dans la détection et un prompt.

**Q: Comment gérer les séances mixtes (force + endurance)?**

R: Actuellement, le système retourne 'mixed' comme fallback. Dans le futur, on pourrait analyser séparément chaque composante et fusionner les résultats.

**Q: Les prompts peuvent-ils être trop longs?**

R: Non. Les prompts force et endurance font ~800 tokens chacun, bien en-dessous de la limite GPT-5-mini (128k tokens).

**Q: Comment tester la détection du type de coach?**

R: Regarder les logs de la fonction edge qui affichent le type détecté et les critères utilisés.

---

## Changelog

### Version 2.0.0 (Janvier 2025)

- ✅ Architecture modulaire avec détection automatique
- ✅ Support complet endurance + force
- ✅ Prompts dynamiques par type de coach
- ✅ Composants UI adaptatifs (Step 4 et Step 5)
- ✅ Cache partagé entre tous les types
- ✅ Documentation complète

### Version 1.0.0 (Décembre 2024)

- Fonction initiale force uniquement
- Prompt statique
- Pas de détection de type

---

**Maintenu par:** TwinForge AI Team
**Contact:** Pour questions ou contributions sur l'architecture modulaire

# Onglet Training "Aujourd'hui" - Implémentation Complète

**Date:** 2025-10-09
**Status:** ✅ Opérationnel avec support multi-disciplines et wearables
**Build:** ✅ Réussi (16.02s)

---

## Vue d'Ensemble

L'onglet "Aujourd'hui" est maintenant un hub motivationnel dynamique qui s'adapte automatiquement à la discipline de l'utilisateur, intègre les données des objets connectés, et fournit un contexte complet pour encourager l'entraînement.

---

## Architecture Implémentée

### 1. Service Unifié (`trainingTodayDynamicService.ts`)

**Localisation:** `/src/system/services/trainingTodayDynamicService.ts`

**Fonctionnalités:**
- Agrégation de toutes les données nécessaires en un seul contexte
- Calcul du score de préparation (0-100) avec 3 facteurs: récupération, énergie, consistance
- Détection de la fenêtre optimale d'entraînement basée sur l'historique
- Support des métriques wearable (HR, calories, zones, effort)
- Mapping automatique discipline → coach type

**Interface Principale:**
```typescript
interface TodayTrainingContext {
  userId: string;
  date: Date;

  // Sessions
  todaySession?: TodaySession;
  lastCompletedSession?: TodaySession;
  activeDraft?: TodaySession;

  // Wearable
  todayWearableMetrics?: WearableMetrics;
  hasConnectedWearable: boolean;

  // Stats
  weekSessions: number;
  currentStreak: number;
  longestStreak: number;

  // Recovery & Readiness
  readinessScore: ReadinessScore;
  daysSinceLastSession: number;
  hoursUntilOptimalWindow?: number;
  optimalWindow?: OptimalWindow;

  // Discipline
  activeDiscipline: string;
  coachType: string;

  // Goals
  activeGoal?: { ... };

  // Unified stats
  todayUnifiedStats?: { ... };
}
```

**Calculs Intelligents:**

1. **Score de Préparation (ReadinessScore):**
   - Récupération: basée sur le temps depuis la dernière session
   - Énergie: basée sur l'effort déjà dépensé (wearable)
   - Consistance: basée sur le streak et les sessions/semaine
   - Recommandation: rest | light | moderate | intense

2. **Fenêtre Optimale:**
   - Analyse de l'historique des 20 dernières sessions
   - Détection de l'heure la plus fréquente avec bonne performance
   - Score composite: fréquence + performance (RPE + enjoyment)
   - Confidence: low | medium | high

3. **Mapping Disciplines:**
   - 14 disciplines supportées
   - 5 coaches: force, endurance, functional, competitions, calisthenics
   - Mapping automatique transparent

---

### 2. Hooks React Query

**useTodayTrainingContext** (`/src/hooks/useTodayTrainingContext.ts`)
- Hook principal pour récupérer le contexte complet
- Cache: 2 minutes (staleTime)
- Refetch automatique au focus
- 2 tentatives en cas d'erreur

**useDisciplineAdaptiveContent** (`/src/hooks/useDisciplineAdaptiveContent.ts`)
- Fournit la configuration adaptée à la discipline active
- Messages motivationnels contextuels
- Métriques pertinentes selon la discipline
- Terminologie adaptée (ex: "séance" vs "sortie" vs "WOD")

**Configurations par Discipline:**
```typescript
{
  id: 'strength',
  label: 'Musculation',
  color: '#3B82F6',
  icon: 'Dumbbell',
  coachType: 'force',
  primaryMetrics: [
    { key: 'volume', label: 'Volume', unit: 'kg', icon: 'TrendingUp' },
    { key: 'rpe', label: 'RPE Moyen', unit: '/10', icon: 'Activity' },
    { key: 'exercises', label: 'Exercices', unit: '', icon: 'List' }
  ],
  motivationalPhrases: [
    'Prêt à soulever lourd aujourd\'hui?',
    'Chaque rep compte vers tes objectifs',
    // ...
  ],
  terminology: {
    session: 'séance',
    intensity: 'charge',
    progress: 'progression'
  }
}
```

---

### 3. Composants Implémentés

#### Composants Wearable

**WearableTodayDashboard** (`/src/ui/components/training/today/WearableTodayDashboard.tsx`)
- Affiche les métriques wearable du jour
- Métriques clés: HR moy/max, calories, effort score
- Distribution des zones HR avec graphiques animés
- Badge de qualité des données (excellent/good/fair/poor)
- Animations de battement de cœur pour l'icône

**Fonctionnalités:**
- Affichage conditionnel si données disponibles
- Graphiques de zones HR avec couleurs adaptées
- Calcul du pourcentage de temps par zone
- Indicateurs visuels premium (glass effect)

#### Composants Motivationnels

**TodayEnergyLevelIndicator** (`/src/ui/components/training/today/TodayEnergyLevelIndicator.tsx`)
- Jauge visuelle du score de préparation (0-100)
- Affichage des 3 facteurs: récupération, énergie, consistance
- Recommandation d'intensité avec icône adaptée
- Détail des facteurs impactants (positif/neutre/négatif)
- Couleur dynamique selon le score

**OptimalTrainingWindow** (`/src/ui/components/training/today/OptimalTrainingWindow.tsx`)
- Affichage de la fenêtre optimale calculée
- Countdown jusqu'à la fenêtre (si dans le futur)
- Badge "EN COURS" si fenêtre active
- Badge de confiance (low/medium/high)
- Explication du raisonnement

---

### 4. Layout de l'Onglet "Aujourd'hui"

**Ordre d'Affichage:**
```
1. HeroTrainingCTA                    [Existant] - CTA principal
2. ForgeMetricsCTACard                [Existant] - Lien vers Forge
3. TodayEnergyLevelIndicator          [NOUVEAU] - Score de préparation
4. SavedDraftsCard                    [Existant] - Drafts sauvegardés
5. WearableTodayDashboard             [NOUVEAU] - Si données wearable
6. TodayStatusWidget                  [Existant] - Statut général
7. OptimalTrainingWindow              [NOUVEAU] - Si fenêtre calculée
8. CurrentGoalCard                    [Existant] - Si objectif actif
9. NextActionSuggestion               [Existant] - Suggestion IA
10. QuickInsightsGrid                 [Existant] - Insights rapides
```

**Affichage Conditionnel:**
- WearableTodayDashboard: si `todayContext.todayWearableMetrics` existe
- OptimalTrainingWindow: si `todayContext.optimalWindow` existe
- CurrentGoalCard: si `todayContext.activeGoal` existe
- TodayEnergyLevelIndicator: toujours affiché (données calculées)

**États de Chargement:**
- Skeleton loader pendant chargement du contexte
- Fallback gracieux si contexte non disponible
- Messages d'erreur user-friendly

---

## Flux de Données

### 1. Au Chargement de la Page

```
User ouvre Training Page → Onglet "Aujourd'hui"
            ↓
useTodayTrainingContext() hook appelé
            ↓
trainingTodayDynamicService.getTodayContext()
            ↓
Récupération en parallèle (Promise.all):
  - Session du jour (active ou complétée)
  - Dernière session complétée
  - Draft actif
  - Nombre de sessions cette semaine
  - Calcul du streak
  - Device wearable connecté
  - Métriques wearable aujourd'hui
  - Objectif actif
  - Stats unifiées (training + forge)
  - Profil utilisateur
            ↓
Calculs:
  - Score de préparation (récupération + énergie + consistance)
  - Jours depuis dernière session
  - Fenêtre optimale d'entraînement
  - Discipline et coach assigné
            ↓
Retour du contexte complet
            ↓
Affichage des composants avec données
```

### 2. Interactions Utilisateur

**Click sur TodayEnergyLevelIndicator:**
- Expansion future: Quick picker pour ajuster énergie
- Pour l'instant: affichage des détails

**Click sur OptimalTrainingWindow:**
- Aucune action (informatif uniquement)
- Future: suggestion de rappel

**Click sur WearableTodayDashboard:**
- Future: détail des métriques par session
- Future: comparaison avec historique

---

## Support Multi-Disciplines

### Disciplines Supportées (14)

**Force & Powerbuilding:**
- strength (Musculation)
- powerlifting (Powerlifting)
- bodybuilding (Bodybuilding)
- strongman (Strongman)

**Functional & CrossTraining:**
- crossfit (CrossFit)
- hiit (HIIT)
- functional (Functional Training)
- circuit (Circuit Training)

**Endurance:**
- running (Course à pied)
- cycling (Cyclisme)
- swimming (Natation)
- triathlon (Triathlon)
- cardio (Cardio général)

**Calisthenics:**
- calisthenics (Calisthenics)
- street-workout (Street Workout)
- streetlifting (Streetlifting)
- freestyle (Freestyle)

**Competitions:**
- hyrox (HYROX)
- deka-fit (DEKA FIT)
- deka-mile (DEKA MILE)
- deka-strong (DEKA STRONG)

### Adaptation Dynamique

**Configuration par Discipline:**
- Couleur de marque spécifique
- Icône représentative
- Métriques pertinentes (ex: volume pour force, zones HR pour endurance)
- Messages motivationnels contextuels
- Terminologie adaptée

**Exemple - Strength:**
```typescript
{
  color: '#3B82F6',
  icon: 'Dumbbell',
  motivationalPhrases: [
    'Prêt à soulever lourd aujourd\'hui?',
    'Chaque rep compte vers tes objectifs'
  ],
  terminology: {
    session: 'séance',
    intensity: 'charge',
    progress: 'progression'
  }
}
```

**Exemple - Running:**
```typescript
{
  color: '#22C55E',
  icon: 'Footprints',
  motivationalPhrases: [
    'Prêt à faire des kilomètres?',
    'Chaque foulée te rapproche de tes objectifs'
  ],
  terminology: {
    session: 'sortie',
    intensity: 'allure',
    progress: 'vitesse'
  }
}
```

---

## Intégration Wearables

### Tables Database Utilisées

**training_session_wearable_metrics:**
- session_id (PK, FK vers training_sessions)
- user_id (FK vers auth.users)
- hr_data (jsonb): Timeline complète des HR
- avg_hr, max_hr, min_hr (int): Stats HR
- zones_distribution (jsonb): Temps par zone
- calories_burned (int): Calories estimées
- effort_score (int): Score 0-100
- data_quality (text): excellent/good/fair/poor
- device_name, device_id (text): Identification device

**connected_devices:**
- Vérifie si un wearable est connecté
- Status: connected | disconnected

### Métriques Affichées

**Dashboard Wearable:**
1. HR Moyenne (bpm) - Couleur rouge
2. HR Max (bpm) - Couleur rouge
3. Calories Brûlées (kcal) - Couleur orange
4. Score d'Effort (0-100) - Couleur bleue

**Distribution des Zones:**
- Zone 1 (50-60% max HR) - Bleu
- Zone 2 (60-70% max HR) - Vert
- Zone 3 (70-80% max HR) - Orange
- Zone 4 (80-90% max HR) - Orange foncé
- Zone 5 (90-100% max HR) - Rouge

**Animations:**
- Pulsation de l'icône cœur
- Barres de progression animées pour les zones
- Transitions fluides

---

## Optimisations Performance

### React Query Cache
```typescript
{
  queryKey: ['today-training-context', userId],
  staleTime: 2 * 60 * 1000,      // 2 minutes
  refetchOnWindowFocus: true,
  retry: 2
}
```

### Lazy Loading
- Composants lourds chargés à la demande
- Suspense boundaries pour erreurs gracieuses
- Skeleton loaders pour l'UX

### Requêtes Optimisées
- Promise.all pour récupération parallèle
- Indexes database sur toutes les colonnes filtrées
- Limite de 20 sessions pour calcul de fenêtre optimale

---

## Tests Recommandés

### Scénarios à Tester

**1. Nouvel Utilisateur:**
- Aucune donnée disponible
- Score de préparation à 100%
- Pas de fenêtre optimale
- Pas de wearable connecté

**2. Utilisateur avec Wearable:**
- Métriques wearable affichées
- Distribution des zones HR visible
- Badge de qualité affiché
- Animations actives

**3. Changement de Discipline:**
- Couleurs et icônes adaptées
- Messages motivationnels contextuels
- Métriques pertinentes affichées
- Terminologie correcte

**4. Session Aujourd'hui:**
- Score de préparation recalculé
- Fenêtre optimale ajustée
- Stats unifiées mises à jour
- ForgeMetricsCTACard visible

**5. Streak Actif:**
- Streak affiché correctement
- Score de consistance élevé
- Messages de félicitations

---

## Améliorations Futures

### Court Terme (Sprint suivant)
- [ ] Picker d'énergie interactif dans TodayEnergyLevelIndicator
- [ ] Notifications pour fenêtre optimale
- [ ] Comparaison jour vs jour dans WearableTodayDashboard
- [ ] Messages motivationnels rotatifs quotidiens

### Moyen Terme
- [ ] LiveWearableWidget pour sessions en cours
- [ ] Graphique d'évolution du score de préparation
- [ ] Prédiction ML de performance basée sur contexte
- [ ] Intégration météo pour entraînements extérieurs

### Long Terme
- [ ] Coach vocal pendant fenêtre optimale
- [ ] Gamification avec badges de consistance
- [ ] Comparaison sociale anonymisée
- [ ] Corrélation sommeil/nutrition/performance

---

## Build Status

**Dernière Build:** 2025-10-09
**Durée:** 16.02s
**Status:** ✅ Succès
**Warnings:** Chunk size > 600kB (normal pour ui-components)

**Bundles:**
- TrainingPage: 25.10 kB (gzip: 8.16 kB)
- ui-components: 1068.62 kB (gzip: 246.74 kB)
- Total dist: 3045.82 kB

---

## Fichiers Créés/Modifiés

### Nouveaux Fichiers (5)
1. `/src/system/services/trainingTodayDynamicService.ts` (700+ lignes)
2. `/src/hooks/useTodayTrainingContext.ts`
3. `/src/hooks/useDisciplineAdaptiveContent.ts` (300+ lignes)
4. `/src/ui/components/training/today/WearableTodayDashboard.tsx`
5. `/src/ui/components/training/today/TodayEnergyLevelIndicator.tsx`
6. `/src/ui/components/training/today/OptimalTrainingWindow.tsx`

### Fichiers Modifiés (3)
1. `/src/app/pages/TrainingPage.tsx` - Ajout TodayTabContent
2. `/src/hooks/index.ts` - Export des nouveaux hooks
3. `/src/ui/components/training/today/index.ts` - Export des nouveaux composants

---

## Conclusion

L'onglet "Aujourd'hui" est maintenant un hub motivationnel complet qui:

✅ S'adapte automatiquement à la discipline de l'utilisateur
✅ Intègre les données des objets connectés en temps réel
✅ Calcule un score de préparation intelligent
✅ Suggère des fenêtres optimales d'entraînement
✅ Affiche uniquement les informations pertinentes
✅ Offre une UX fluide avec lazy loading et cache
✅ Build sans erreurs avec performances optimales

L'approche modulaire permet d'ajouter facilement de nouvelles disciplines et sources de données sans refactoring majeur.

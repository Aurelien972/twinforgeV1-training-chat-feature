# Optimisation Complète : Composant Vision Hebdomadaire

## 🎯 Objectif
Transformer le composant "Vision Hebdomadaire" en un assistant intelligent **spécialisé par coach** qui enrichit le contexte sans brouiller les pistes entre les disciplines.

## ✅ Implémentation Réalisée

### 1. Service de Calcul de Volume Adapté (`volumeCalculationService.ts`)

**Fichier créé** : `/src/system/services/volumeCalculationService.ts`

#### Fonctionnalités clés :
- **Calcul de volume par type de coach** :
  - `coach-force` / `coach-calisthenics` : sets × reps (unité : **reps**)
  - `coach-endurance` : durée en minutes (unité : **min**)
  - `coach-functional` : mixte selon format WOD (reps ou min)
  - `coach-competitions` : stations × rounds (unité : **stations**)

- **Seuils adaptatifs personnalisés** :
  - Basés sur l'historique des 4 dernières semaines
  - Ajustement automatique selon la moyenne personnelle
  - Détection des séances exploratoires (volume < 50% du seuil bas)
  - Évite les fausses alertes de sur-entraînement

- **Fonctions utilitaires** :
  - `calculateSessionVolume()` : Calcule le volume d'une séance
  - `calculateTotalVolume()` : Agrège le volume de plusieurs séances
  - `getAdaptiveThresholds()` : Génère les seuils low/optimal/high
  - `analyzeVolumeStatus()` : Détermine si volume est low/optimal/high
  - `isExploratorySession()` : Détecte les séances de test

### 2. Service d'Enrichissement Contexte Amélioré

**Fichier modifié** : `/src/system/services/preparerContextEnrichmentService.ts`

#### Améliorations majeures :

**A. Filtrage par Coach Spécifique**
```typescript
export async function enrichPreparerContext(
  userId: string,
  baseData: Partial<PreparerData>,
  selectedCoachType?: AgentType  // NOUVEAU paramètre
): Promise<PreparerData>
```

- Filtre les sessions par `coach_type` pour analyser uniquement les séances du coach actif
- Évite les confusions entre disciplines (ne mélange pas Force et Endurance)
- Analyse ciblée sur les patterns de la discipline choisie

**B. Calcul de Volume Intelligent**
- Utilise `volumeCalculationService` au lieu d'un calcul fixe sets × reps
- S'adapte automatiquement au type de coach
- Affiche l'unité correcte selon la discipline

**C. Recommandations Spécialisées par Coach**

Nouvelles fonctions helper créées :

1. **`getFirstSessionPriority(coachType)`**
   - Recommandations adaptées pour la première séance

2. **`getLongRestPriority(days, coachType)`**
   - Reprises progressives spécifiques à chaque discipline
   - Force : activation neuromusculaire, charges légères 50-60%
   - Endurance : Zone 1-2, durée progressive
   - Functional : mouvements gymniques simples
   - Calisthenics : progressions de base, amplitude contrôlée
   - Competitions : stations techniques, rythme modéré

3. **`getHighVolumePriority(weeklyProgress, coachType)`**
   - Récupération active adaptée
   - Force : travail technique <70%, mobilité
   - Endurance : Zone 1-2 récupération, 20-30min
   - Functional : skill work, mobilité
   - Calisthenics : travail technique, contrôle
   - Competitions : technique pure, stations isolées

4. **`getOverusePriority(overusedExercises, coachType)`**
   - Détection d'exercices sur-utilisés (≥3 fois)
   - Suggestions de variations pertinentes
   - Force : variantes d'exercices, angles différents
   - Endurance : modalité alternative, terrain différent
   - Functional : modalité sous-utilisée, format varié

5. **`getLowVolumePriority(coachType)`**
   - Opportunité de progression
   - Charges challengeantes avec sécurité

6. **`getOptimalPriority(weeklyProgress, coachType)`**
   - Conditions idéales pour continuer la progression

**D. Logs Détaillés**
- Traçage des sessions récupérées
- Filtrage par coach
- Analyse de volume avec seuils
- Détection des séances exploratoires
- Priorités générées

### 3. Composant WeeklyInsightCard Amélioré

**Fichier modifié** : `/src/ui/components/training/today/WeeklyInsightCard.tsx`

#### Améliorations UI :

**A. Unités Claires et Explicites**
```typescript
interface WeeklyProgressData {
  sessionsThisWeek: number;
  currentWeekVolume: number;
  intensityAverage: number;
  volumeUnit?: string;  // NOUVEAU
}
```

- Volume affiché avec unité : `591 reps`, `45 min`, `8 stations`
- Label Intensité changé en : **"Intensité Moy. (RPE)"** pour clarifier l'échelle /10

**B. Tooltips Informatifs**
- Icône `?` au survol des métriques
- "Volume total d'entraînement cette semaine"
- "Intensité moyenne ressentie sur une échelle de 1 à 10"

**C. État Vide Amélioré**
- Texte "En attente" au lieu de "-" pour Volume et Intensité
- Plus clair pour le public FR

### 4. Intégration dans Step1Preparer

**Fichier modifié** : `/src/app/pages/Training/Pipeline/steps/Step1Preparer.tsx`

#### Modifications :

**A. Passage du Coach Type**
```typescript
const insights = await enrichPreparerContext(
  profile.id,
  { ...baseData },
  coachType  // Passé explicitement
);
```

**B. Détermination de l'Unité de Volume**
```typescript
const getVolumeUnitForCoach = (coachType: AgentType): string => {
  switch (coachType) {
    case 'coach-force':
    case 'coach-calisthenics':
      return 'reps';
    case 'coach-endurance':
      return 'min';
    case 'coach-functional':
      return 'reps';
    case 'coach-competitions':
      return 'stations';
    default:
      return 'reps';
  }
};
```

**C. Rechargement Dynamique**
- `useEffect` déclenché sur changement de `selectedCoachType`
- Recalcule les insights si l'utilisateur change de discipline

## 🎨 Impact Utilisateur

### Avant
- Volume affiché : `591` (unité inconnue)
- Intensité : `0.0/10` (label "Intensité Moy." ambigu)
- Recommandations génériques suggérant parfois de changer de discipline
- Fausses alertes de sur-entraînement avec peu de volume réel
- Calcul de volume identique pour toutes disciplines (sets × reps)

### Après
- Volume clair : `591 reps` ou `45 min` selon le coach
- Intensité explicite : **Intensité Moy. (RPE)** `7.5/10`
- Tooltips informatifs au survol
- Recommandations **ultra-ciblées** sur la discipline active uniquement
- Pas de suggestion de changer de discipline (reste dans la spécialité du coach)
- Seuils adaptatifs basés sur l'historique personnel
- Détection intelligente des séances de test (pas d'alerte si volume bas volontaire)

## 📊 Exemples de Recommandations par Coach

### Coach Force
**Repos long (3+ jours)** :
- ✅ Priorité : Activation neuromusculaire, charges légères 50-60%, schémas moteurs de base
- ❌ Éviter : Charges lourdes >80%, volume élevé, techniques d'intensification

**Volume élevé** :
- ✅ Priorité : Travail technique pur, charges <70%, mobilité articulaire
- ❌ Éviter : Volume élevé, RPE >7, techniques d'intensification

### Coach Endurance
**Repos long** :
- ✅ Priorité : Zone 1-2, durée progressive, reprise douce
- ❌ Éviter : Intervalles intenses, longue durée immédiate, Zone 4-5

**Volume élevé** :
- ✅ Priorité : Zone 1-2 récupération active, durée courte 20-30min, tempo facile
- ❌ Éviter : Intervalles, longue durée, zones intenses

### Coach Functional
**Exercices sur-utilisés** :
- ✅ Priorité : Modalité sous-utilisée, nouveau stimulus, format varié
- ❌ Éviter : [Exercices détectés comme répétitifs]

### Coach Calisthenics
**Volume bas** :
- ✅ Priorité : Progressions clés, volume optimal, skills ciblés
- ❌ Éviter : Trop de variation, volume excessif

### Coach Competitions
**Conditions optimales** :
- ✅ Priorité : Format compétition, toutes modalités, transitions
- ❌ Éviter : Négligence technique, fatigue excessive

## 🔧 Architecture Technique

### Flux de Données

```
User selects discipline → coachType determined
                              ↓
enrichPreparerContext(userId, baseData, coachType)
                              ↓
Filter sessions by coachType only
                              ↓
calculateTotalVolume(sessions, coachType)
    → Force: sets × reps → 591 reps
    → Endurance: duration → 45 min
    → Competitions: stations → 8 stations
                              ↓
getAdaptiveThresholds(sessions, coachType)
    → Based on personal 4-week average
    → low: avg * 0.7
    → optimal: avg
    → high: avg * 1.3
                              ↓
determinePriorityToday(sessions, days, progress, coachType)
    → Coach-specific recommendations
    → No cross-discipline suggestions
                              ↓
WeeklyInsightCard displays with correct unit
```

### Principe de Séparation

**Un Coach = Une Spécialité = Des Recommandations Ciblées**

- Analyse UNIQUEMENT les sessions du coach actif
- Recommandations 100% pertinentes à la discipline
- Aucun mélange de données Force/Endurance/Functional
- Enrichit le contexte pour affiner la génération, pas pour brouiller

## 📝 Logs de Debugging

Le système génère maintenant des logs détaillés :

```typescript
PREPARER_ENRICHMENT - Fetched sessions: {
  sessionsCount: 12,
  selectedCoachType: 'coach-force'
}

PREPARER_ENRICHMENT - Filtered sessions by coach: {
  totalSessions: 12,
  coachType: 'coach-force',
  coachSessions: 8  // 4 sessions d'autres coaches filtrées
}

VOLUME_CALCULATION - Volume calculated: {
  coachType: 'coach-force',
  sessionsCount: 3,
  totalValue: 591,
  unit: 'reps',
  displayText: '591 reps'
}

PRIORITY_TODAY - Volume analysis: {
  coachType: 'coach-force',
  currentVolume: 591,
  thresholds: { low: 420, optimal: 600, high: 780 },
  volumeStatus: 'optimal',
  isExploratory: false
}

PREPARER_ENRICHMENT - Context enriched successfully: {
  coachType: 'coach-force',
  weeklyVolume: 591,
  avgRpe: 7.2,
  recoveryScore: 85,
  cyclePhase: 'accumulation'
}
```

## ✨ Avantages Clés

1. **Clarté pour l'utilisateur FR** : Unités explicites, tooltips informatifs
2. **Intelligence contextuelle** : Seuils adaptatifs basés sur historique personnel
3. **Spécialisation par coach** : Recommandations ultra-ciblées, pas de mélange
4. **Fini les fausses alertes** : Détection des séances exploratoires
5. **Debugging facilité** : Logs détaillés à chaque étape
6. **Évolutif** : Facile d'ajouter de nouveaux coaches ou ajuster les seuils

## 🚀 Prochaines Étapes Suggérées

1. **Tests utilisateurs** : Valider la pertinence des recommandations par coach
2. **Ajustement des seuils** : Affiner les valeurs low/optimal/high par retours terrain
3. **Graphiques visuels** : Ajouter un mini-graphique de distribution hebdomadaire
4. **Mode détaillé/simplifié** : Adapter l'affichage selon niveau d'expérience utilisateur
5. **Feedback loop** : Permettre à l'utilisateur de signaler si une recommandation était pertinente

## ✅ Build Réussi

```
✓ built in 19.82s
PWA v1.1.0
precache  51 entries (4224.61 KiB)
```

Aucune erreur TypeScript, projet prêt à être testé en conditions réelles !

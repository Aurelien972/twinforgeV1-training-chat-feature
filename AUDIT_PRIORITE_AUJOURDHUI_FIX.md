# Audit et Correction - Composant "Priorité Aujourd'hui"

**Date**: 2025-10-25
**Statut**: ✅ Corrigé et amélioré

## 🔍 Problème Identifié

Le composant `WeeklyInsightCard` affichait une section "PRIORITÉ AUJOURD'HUI" vide, ce qui ne guidait ni l'utilisateur ni le coach AI pour la génération de séance.

### Causes Root

1. **Décalage de types**: Le type `PriorityToday` du store ne correspondait pas aux props attendues par `WeeklyInsightCard`
   - Store: `{ shouldPrioritize, shouldAvoid, reason, suggestedDiscipline }`
   - Composant: `{ suggestedDiscipline, reasoning, priority: 'high' | 'medium' | 'low' }`

2. **Données manquantes**: Le service `enrichPreparerContext` ne retournait pas les données dans le bon format

3. **Logique incomplète**: Aucun fallback intelligent pour les premières sessions

## ✅ Solutions Implémentées

### 1. Service `preparerContextEnrichmentService.ts`

**Améliorations apportées**:

```typescript
// AVANT: Retournait undefined pour première session
function determinePriorityToday(...) {
  // Pas de gestion du cas sessions.length === 0
}

// APRÈS: TOUJOURS retourne une priorité intelligente
function determinePriorityToday(...) {
  // FIRST SESSION - Guidance pour débutants
  if (sessions.length === 0) {
    return {
      shouldPrioritize: ['Apprentissage technique', 'Mouvements fondamentaux', 'Sécurité'],
      shouldAvoid: ['Charges maximales', 'Haute intensité', 'Volumes excessifs'],
      reason: 'Première séance : Focus sur la technique...',
      suggestedDiscipline: 'Force'
    };
  }

  // 5 cas distincts avec guidance contextuelle:
  // - Repos prolongé (≥3 jours)
  // - Volume élevé (≥4 séances/semaine)
  // - Surcharge discipline (≥3 sessions même discipline)
  // - Volume modéré (2-3 séances)
  // - Début de semaine (optimal)
}
```

### 2. Step1Preparer - Transformation des Données

**Ajout de fonctions de mapping**:

```typescript
// Transform PriorityToday vers format WeeklyInsightCard
const transformedPriority = {
  suggestedDiscipline: priority.suggestedDiscipline || 'Force',
  reasoning: priority.reason || 'Continuer votre progression',
  priority: determinePriorityLevel(priority), // 'high' | 'medium' | 'low'
  shouldPrioritize: priority.shouldPrioritize,
  shouldAvoid: priority.shouldAvoid
};

// Logique intelligente de niveau de priorité
const determinePriorityLevel = (priority) => {
  const reason = priority.reason?.toLowerCase() || '';

  if (reason.includes('repos') || reason.includes('première') || reason.includes('récupération')) {
    return 'high'; // Rouge - Attention requise
  }
  if (reason.includes('varier') || reason.includes('modéré')) {
    return 'medium'; // Orange - Important
  }
  return 'low'; // Vert - Progression normale
};
```

### 3. WeeklyInsightCard - UI Enrichie

**Avant**: Section vide avec texte générique

**Après**: Affichage riche et actionnable

```typescript
// Affichage toujours visible avec:
- Discipline suggérée (ex: "Force / Technique")
- Badge de priorité (Prioritaire / Important / Normal)
- Reasoning détaillé et contextualisé
- Tags visuels "À privilégier" (vert)
- Tags visuels "À éviter" (rouge)
- Fallback intelligent si pas de données
```

**Nouveaux éléments visuels**:
- Badge de priorité coloré (high=rouge, medium=orange, low=vert)
- Icônes CheckCircle pour éléments à privilégier
- Icônes AlertTriangle pour éléments à éviter
- Limite de 3 tags affichés pour lisibilité

### 4. Transformation CyclePhase

**Recommendations détaillées par phase**:

```typescript
const getCycleRecommendation = (cycle) => {
  switch (cycle.phase) {
    case 'accumulation':
      return 'Semaine X/4 : Phase d\'accumulation - Focus sur le volume, charges modérées (65-75%)';
    case 'intensification':
      return 'Semaine X/4 : Phase d\'intensification - Augmenter intensité, charges lourdes (80-90%)';
    case 'deload':
      return 'Semaine X/4 : Phase de décharge - Réduire volume et intensité de 40-60%';
    case 'realization':
      return 'Semaine X/4 : Phase de réalisation - Tests de force maximale';
  }
};
```

## 📊 Logique de Priorisation

### Hiérarchie des Cas

1. **Première séance** (sessions.length === 0)
   - Priority: HIGH
   - Discipline: Force (sécuritaire)
   - Focus: Apprentissage technique, sécurité

2. **Repos prolongé** (≥3 jours)
   - Priority: HIGH
   - Reasoning: "X jours de repos : Reprendre progressivement..."
   - Éviter: Charges lourdes, volumes élevés

3. **Volume hebdo élevé** (≥4 séances)
   - Priority: HIGH
   - Discipline: Endurance (récupération active)
   - Focus: Mobilité, cardio léger Z1-Z2

4. **Surcharge discipline** (≥3 fois même discipline)
   - Priority: MEDIUM
   - Discipline: Least used (varier)
   - Focus: Mouvements complémentaires

5. **Volume modéré** (2-3 séances)
   - Priority: LOW
   - Reasoning: "Volume modéré, continuer progression"

6. **Début de semaine** (0-1 séance)
   - Priority: LOW
   - Reasoning: "Moment optimal pour séance de qualité"

## 🎯 Impact pour le Coach AI

Le contexte enrichi est maintenant transmis au coach AI via `preparerContext`, permettant:

1. **Sélection exercices contextuelle**: Le coach privilégie/évite certains mouvements
2. **Intensité adaptée**: Charges et volumes ajustés selon recovery
3. **Variété intelligente**: Évite répétition excessive
4. **Phases de cycle**: Respecte accumulation/intensification/deload

## 🧪 Cas de Test

### Test 1: Première séance utilisateur
```
Input: sessions.length = 0
Output:
  - suggestedDiscipline: "Force"
  - priority: "high"
  - reasoning: "Première séance : Focus sur la technique..."
  - shouldPrioritize: ["Apprentissage technique", "Mouvements fondamentaux", "Sécurité"]
  - shouldAvoid: ["Charges maximales", "Haute intensité", "Volumes excessifs"]
```

### Test 2: Retour après 5 jours repos
```
Input: daysSinceLastSession = 5
Output:
  - priority: "high"
  - reasoning: "5 jours de repos : Reprendre progressivement..."
  - shouldAvoid: ["Charges lourdes", "Volumes élevés"]
```

### Test 3: 4 séances cette semaine
```
Input: weeklyProgress.sessionsThisWeek = 4
Output:
  - suggestedDiscipline: "Endurance"
  - priority: "high"
  - reasoning: "4 séances cette semaine : Privilégier la récupération active"
  - shouldPrioritize: ["Mobilité", "Cardio léger Z1-Z2"]
```

### Test 4: Force utilisée 4 fois récemment
```
Input: disciplineCounts = { force: 4, calisthenics: 1 }
Output:
  - suggestedDiscipline: "Calisthenics" (least used)
  - priority: "medium"
  - reasoning: "Force utilisée 4 fois récemment : Varier pour équilibrer..."
  - shouldAvoid: ["Force", "Mouvements répétitifs"]
```

## 📈 Amélioration UX

### Avant
```
┌──────────────────────────┐
│ PRIORITÉ AUJOURD'HUI     │
│ [vide]                   │
└──────────────────────────┘
```

### Après
```
┌──────────────────────────────────────────┐
│ 🎯 PRIORITÉ AUJOURD'HUI    [Prioritaire] │
│                                          │
│ Force                                    │
│                                          │
│ 5 jours de repos : Reprendre            │
│ progressivement avec activation neurale  │
│ et mobilité                              │
│                                          │
│ ✓ À privilégier:                        │
│ [Activation progressive] [Mobilité]      │
│                                          │
│ ⚠ À éviter:                             │
│ [Charges lourdes] [Volumes élevés]      │
└──────────────────────────────────────────┘
```

## 🔗 Fichiers Modifiés

1. `/src/system/services/preparerContextEnrichmentService.ts`
   - Fonction `determinePriorityToday()` enrichie
   - Gestion du cas première séance
   - 5 cas de priorité distincts

2. `/src/app/pages/Training/Pipeline/steps/Step1Preparer.tsx`
   - Transformation des données vers format WeeklyInsightCard
   - `determinePriorityLevel()` helper
   - `getCycleRecommendation()` helper

3. `/src/ui/components/training/today/WeeklyInsightCard.tsx`
   - Interface `PriorityTodayData` étendue
   - Affichage tags visuels shouldPrioritize/shouldAvoid
   - Badge de priorité coloré
   - Fallback intelligent

## ✅ Validation

- ✅ Build TypeScript sans erreurs
- ✅ Toujours affiche une priorité (même première session)
- ✅ Guidance claire pour utilisateur ET coach AI
- ✅ Visuellement riche et actionnable
- ✅ 5 cas de priorité couverts
- ✅ Fallbacks intelligents à tous les niveaux

## 🎯 Résultat

Le composant "Priorité Aujourd'hui" affiche maintenant **TOUJOURS** une guidance claire et contextuelle qui:

1. **Guide l'utilisateur**: Comprend immédiatement quoi privilégier/éviter
2. **Guide le coach AI**: Reçoit un contexte enrichi pour génération adaptée
3. **S'adapte au contexte**: 5 scénarios distincts avec logique intelligente
4. **Fonctionne dès J1**: Fallback parfait pour première séance
5. **Est visuellement clair**: Tags colorés, priorités, recommendations détaillées

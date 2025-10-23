# Calisthenics Training Components

Composants UI pour les sessions d'entraînement Calisthenics & Street Workout.

## Architecture

Cette implémentation suit l'**Option A: Réutilisation Maximum**. Les composants calisthenics sont des wrappers légers autour des composants Force existants, avec adaptations mineures pour:

1. **Couleur theme**: Cyan (#06B6D4) au lieu de violet
2. **Logique spécifique**: Gestion holdTime, skillLevel, progressionStage
3. **Affichage adapté**: Pas de charge pour certains exercices, focus sur variantes

## Structure

```
calisthenics/
├── CalisthenicsSessionCard.tsx       # Wrapper de ExerciseSessionCard
├── CalisthenicsAdjustmentButtons.tsx # Wrapper de ForceAdjustmentButtons
├── constants.ts                      # Constantes spécifiques (couleur, config)
├── utils.ts                          # Utilitaires spécifiques
├── types.ts                          # Types additionnels
└── index.ts                          # Exports publics
```

## Composants

### CalisthenicsSessionCard
Wrapper autour de `ExerciseSessionCard` avec:
- Couleur theme cyan
- Affichage holdTime si exercice statique
- Affichage skillLevel et progressionStage
- Gestion des variantes au lieu de charge

### CalisthenicsAdjustmentButtons
Wrapper autour de `ForceAdjustmentButtons` avec:
- Logique d'ajustement par variantes (plus facile/plus difficile)
- Pas de modification de charge mais de progression
- Utilise `calisthenicsProgressionService`

## Usage

```typescript
import {
  CalisthenicsSessionCard,
  CalisthenicsAdjustmentButtons
} from '@/ui/components/training/calisthenics';

// Dans Step3Seance
<CalisthenicsSessionCard
  exercise={exercise}
  onComplete={handleComplete}
  onAdjust={handleAdjust}
/>

// Ou réutilisation directe des composants Force avec props adaptées
import { ExerciseSessionCard } from '@/ui/components/training/force';

<ExerciseSessionCard
  exercise={exercise}
  stepColor="#06B6D4" // Cyan pour calisthenics
  showLoad={!!exercise.load} // Masquer si pas de charge
  // ... autres props
/>
```

## Réutilisation des Composants Force

La plupart des composants Force fonctionnent directement pour Calisthenics:

- **FloatingTimerCard**: Compatible tel quel
- **PreparationCountdown**: Compatible tel quel
- **TransitionCountdown**: Compatible tel quel
- **ExerciseSessionCard**: Compatible avec props adaptées
- **ForceAdjustmentButtons**: Nécessite wrapper pour logique variantes

## Couleur Theme

La couleur principale Calisthenics est **Cyan #06B6D4** (définie dans `TRAINING_CATEGORIES` constants).

Utiliser cette couleur pour:
- Bordures de cartes
- Boutons d'action
- Indicateurs de progression
- Badges de niveau

## Différences avec Force

| Aspect | Force | Calisthenics |
|--------|-------|--------------|
| Couleur | Violet #A855F7 | Cyan #06B6D4 |
| Charge | Toujours présente | Optionnelle (lestés uniquement) |
| Progression | Augmentation charge | Changement de variante |
| Métriques | Load, volume | Reps, hold time, skill level |
| Focus | Force absolue | Force relative |

## Convention de Nommage

- Préfixer les composants spécifiques avec `Calisthenics*`
- Garder les composants génériques tels quels
- Utiliser le suffixe `Wrapper` si c'est vraiment un wrapper pur

## Migration

Pour migrer un composant Force vers Calisthenics:

1. Créer un wrapper si nécessaire
2. Adapter la couleur theme (props ou constants)
3. Gérer les spécificités (holdTime, skillLevel)
4. Garder la même API/interface si possible
5. Documenter les différences

## Exemples

Voir les fichiers de composants pour des exemples concrets d'implémentation.

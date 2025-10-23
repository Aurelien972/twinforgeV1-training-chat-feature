# Endurance Training Components

Composants dédiés aux séances d'entraînement d'endurance (cardio, running, cycling).

## Structure

```
endurance/
├── session/          # Composants principaux de session
├── controls/         # Contrôles et headers
├── widgets/          # Petits composants utilitaires
├── charts/           # Composants de visualisation
├── modals/           # Modals et countdowns
├── hooks/            # Hooks personnalisés
├── utils/            # Fonctions utilitaires
├── types/            # Types TypeScript
├── constants/        # Constantes et configurations
└── legacy/           # Composants obsolètes (à supprimer)
```

## Composants Principaux

### Session Components
- **EnduranceSessionDisplay**: Composant principal pour le suivi en direct d'une séance d'endurance
- **EnduranceBlockCard**: Carte pour afficher un bloc d'endurance (warmup, work, cooldown)
- **EndurancePreSessionBriefing**: Briefing avant le début de la séance

### Controls
- **EnduranceStickyHeaderV2**: Header fixe avec timer, zone et contrôles
- **EnduranceAdjustmentButtons**: Boutons d'ajustement d'intensité

### Modals
- **EnduranceStopModal**: Modal de confirmation d'arrêt de séance
- **EnduranceCountdownHelper**: Countdown avant début ou transition de bloc

### Widgets
- **IntervalWorkRestDisplay**: Affichage work/rest pour les intervalles
- **PacingGuideWidget**: Widget de guidance de rythme
- **ZoneDeviationAlert**: Alerte de déviation de zone cardiaque

### Charts
- **PaceEvolutionChart**: Graphique d'évolution du pace
- **ZoneDistributionChart**: Distribution du temps par zone cardiaque

## Hooks

### useEnduranceTimer
Gère la logique du timer pour les séances d'endurance.

```typescript
const { timerRef } = useEnduranceTimer({
  isRunning: true,
  isPaused: false,
  onTick: handleTick
});
```

### useEnduranceNotifications
Gère les notifications du coach pendant la séance.

```typescript
useEnduranceNotifications({
  sessionId: 'session-id',
  isRunning: true,
  isPaused: false,
  sessionTime: 120,
  allBlocks: blocks
});
```

## Utilitaires

- `formatTime(seconds)`: Formate les secondes en MM:SS ou HH:MM:SS
- `calculateBlockProgress(blockTime, duration)`: Calcule le pourcentage de progression d'un bloc
- `calculateTotalProgress(...)`: Calcule la progression totale de la séance
- `getZoneColor(zone)`: Retourne la couleur associée à une zone cardiaque
- `scrollToElement(element, offset)`: Scroll vers un élément avec offset

## Usage

### Import de base
```typescript
import { EnduranceSessionDisplay } from '@/ui/components/training/endurance';
```

### Import spécifique
```typescript
import { EnduranceSessionDisplay } from '@/ui/components/training/endurance/session';
import { useEnduranceTimer } from '@/ui/components/training/endurance/hooks';
import { formatTime } from '@/ui/components/training/endurance/utils';
```

## Architecture

Cette organisation modulaire permet:
- **Meilleure lisibilité**: Fichiers courts et focalisés
- **Maintenabilité**: Séparation claire des responsabilités
- **Réutilisabilité**: Composants et hooks indépendants
- **Performance**: Lazy loading granulaire
- **Évolutivité**: Ajout de fonctionnalités facilité

## Migration depuis l'ancienne structure

Les imports depuis `@/ui/components/training/endurance` continuent de fonctionner grâce au fichier `index.ts` qui ré-exporte tous les composants.

### Avant
```typescript
import EnduranceSessionDisplay from './endurance/EnduranceSessionDisplay';
```

### Après (toujours compatible)
```typescript
import { EnduranceSessionDisplay } from './endurance';
```

## Conventions

- Tous les composants utilisent TypeScript
- Les hooks commencent par `use`
- Les utilitaires sont des fonctions pures
- Les types sont exportés depuis `types/index.ts`
- Les constantes sont dans `constants/`

## Prochaines étapes

1. Supprimer le dossier `legacy/` après vérification
2. Ajouter des tests unitaires pour les hooks
3. Documenter les props de chaque composant avec JSDoc
4. Créer des storybook stories pour les composants visuels

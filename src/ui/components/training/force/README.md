# Force Training Components

Composants React pour les sessions d'entraînement de force (musculation, poids de corps) dans TwinForge.

## 📁 Structure

```
force/
├── cards/           # Cartes d'affichage principales
├── controls/        # Boutons d'ajustement et panneaux
├── timers/          # Composants de minuterie
├── countdowns/      # Comptes à rebours de préparation
├── hooks/           # Hooks React personnalisés
├── utils/           # Fonctions utilitaires
├── adapters/        # Adaptateurs pour services externes
├── types/           # Définitions TypeScript
└── constants/       # Valeurs de configuration
```

## 🎯 Composants Principaux

### Cards

- **TrainingPrescriptionCard**: Carte principale affichant un exercice avec tous ses paramètres (séries, reps, charge, tempo, RPE)

### Controls

- **ForceAdjustmentButtons**: Boutons rapides "Trop facile" / "Trop difficile" pour ajuster un exercice
- **ExerciseAdjustmentPanel**: Panel détaillé avec options d'ajustement par catégorie

### Timers

- **FloatingTimerCard**: Carte flottante affichant le temps de session et de repos

### Countdowns

- **PreparationCountdown**: Compte à rebours de préparation avant un exercice (10, 9, 8... GO!)
- **TransitionCountdown**: Compte à rebours court entre repos et nouvel exercice (3, 2, 1, GO!)

## 🪝 Hooks Personnalisés

### useExerciseAdjustment

Gère les ajustements d'exercices (séries, reps, charge) avec validation.

```typescript
const {
  increaseSets,
  decreaseSets,
  increaseReps,
  decreaseReps,
  increaseLoad,
  decreaseLoad,
} = useExerciseAdjustment();
```

### useExerciseNotifications

Envoie des notifications pour les modifications d'exercice.

```typescript
const {
  notifySetsIncreased,
  notifyLoadDecreased,
  notifyAlternativeSelected,
} = useExerciseNotifications();
```

### useHapticFeedback

Gère le retour haptique centralisé.

```typescript
const { triggerLight, triggerSuccess, trigger } = useHapticFeedback();

trigger('medium'); // Retour haptique moyen
triggerSuccess();  // Retour de succès
```

## 🛠️ Utilitaires

### Exercise Calculations

```typescript
import {
  calculateLoadIncrease,
  calculateRepsDecrease,
  isRampingLoad,
  getLoadProgressionSummary,
} from './utils';

// Calculer une augmentation de charge de 8%
const result = calculateLoadIncrease(100); // { newValue: 108, changeAmount: 8, changeType: 'increase_load' }

// Vérifier si la charge est progressive
const isProgressive = isRampingLoad([60, 70, 80, 90]); // true
```

### Difficulty Utils

```typescript
import {
  getDifficultyBadge,
  calculateEstimated1RM,
  suggestLoad,
} from './utils';

// Obtenir le badge de difficulté basé sur RPE
const badge = getDifficultyBadge(8.5);
// { label: 'Intense', color: '#F59E0B', level: 'intense' }

// Estimer le 1RM
const oneRM = calculateEstimated1RM(100, 5, 8); // ~115kg

// Suggérer une charge pour un objectif
const suggested = suggestLoad(115, 8, 7); // ~90kg
```

### Formatters

```typescript
import {
  formatTime,
  formatLoadDisplay,
  formatRestTime,
} from './utils';

formatTime(125); // "02:05"
formatRestTime(90); // "1min 30s"

const loadDisplay = formatLoadDisplay([60, 70, 80]);
// {
//   value: "60-80kg",
//   label: "Charge progressive",
//   isProgressive: true,
//   summary: "3 paliers • +10.0kg par série"
// }
```

## 📊 Types

Tous les types sont exportés depuis `./types`:

```typescript
import type {
  Exercise,
  DifficultyLevel,
  AdjustmentResult,
  TimerState,
  TrainingPrescriptionCardProps,
} from './force';
```

## 🎨 Constantes

### Timing

```typescript
DEFAULT_REST_TIME = 90;           // secondes
DEFAULT_PREP_TIME = 10;           // secondes
DEFAULT_TRANSITION_TIME = 3;      // secondes
```

### Ajustements

```typescript
LOAD_ADJUSTMENT_PERCENT = 0.08;   // 8%
MIN_REPS = 3;
MAX_REPS = 15;
MIN_SETS = 1;
MAX_SETS = 10;
```

### RPE Thresholds

```typescript
RPE_EASY_MAX = 6;
RPE_MODERATE_MAX = 7;
RPE_INTENSE_MAX = 9;
RPE_VERY_INTENSE = 10;
```

### Colors

```typescript
import { DIFFICULTY_COLORS, ACTION_COLORS, getRpeColor } from './constants/colors';

DIFFICULTY_COLORS.intense;  // '#F59E0B'
ACTION_COLORS.increase;     // '#22C55E'
getRpeColor(8.5);           // '#F59E0B' (intense)
```

### Animations

```typescript
import { EASING, SPRING_CONFIG, fadeIn, scaleIn } from './constants/animations';

// Utiliser avec Framer Motion
<motion.div
  variants={fadeIn}
  transition={{ ease: EASING.smooth }}
/>
```

## 🔌 Adapters

Les adapters isolent les dépendances externes:

```typescript
import { notificationAdapter, useChatStoreAdapter } from './adapters';

// Notifications
notificationAdapter.notifySetsAdjustment('Squat', 5, true);

// Chat store (dans un composant)
const { openChat } = useChatStoreAdapter();
```

## 📝 Utilisation dans Step2Activer

```typescript
import {
  TrainingPrescriptionCard,
  ForceAdjustmentButtons,
  ExerciseAdjustmentPanel,
} from '../ui/components/training/force';

<TrainingPrescriptionCard
  exercise={exercise}
  stepColor={STEP_COLORS.activer}
  onExerciseUpdate={handleUpdate}
  onExerciseSubstitution={handleSubstitution}
  onExerciseRegenerate={handleRegenerate}
/>
```

## 📝 Utilisation dans Step3Seance

```typescript
import {
  PreparationCountdown,
  FloatingTimerCard,
  TransitionCountdown,
} from '../ui/components/training/force';

{showPrepCountdown && (
  <PreparationCountdown
    duration={10}
    exerciseName={exercise.name}
    exerciseVariant={exercise.variant}
    onComplete={handlePrepComplete}
    stepColor={stepColor}
  />
)}

<FloatingTimerCard
  sessionTime={sessionTime}
  restTime={restTime}
  isResting={isResting}
  formatTime={formatTime}
  stepColor={stepColor}
  currentExerciseIndex={currentIndex}
  totalExercises={exercises.length}
  isSessionRunning={isRunning}
  onPlayPause={togglePause}
/>
```

## 🏗️ Architecture

Cette organisation suit les principes:

1. **Separation of Concerns**: Chaque dossier a une responsabilité claire
2. **Single Responsibility**: Chaque fichier a un objectif unique
3. **Dependency Isolation**: Les adapters isolent les services externes
4. **Type Safety**: Types centralisés pour cohérence
5. **Reusability**: Hooks et utils réutilisables
6. **Maintainability**: Structure claire facilite les modifications

## 🔄 Migration depuis l'ancienne structure

Les exports principaux restent compatibles:

```typescript
// ✅ Fonctionne toujours
import { TrainingPrescriptionCard, ForceAdjustmentButtons } from './force';

// ✅ Nouveaux exports disponibles
import { useExerciseAdjustment, getDifficultyBadge } from './force';
```

## 📚 Documentation Complémentaire

- [ARCHITECTURE.md](./ARCHITECTURE.md): Diagramme d'architecture détaillé
- [types/index.ts](./types/index.ts): Référence complète des types
- [constants/](./constants/): Configuration des valeurs par défaut

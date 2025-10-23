# Architecture Force Training Components

## 📐 Vue d'ensemble

Le module `force` est organisé selon une architecture modulaire en couches, séparant les responsabilités pour maximiser la réutilisabilité et la maintenabilité.

## 🏛️ Structure en Couches

```
┌─────────────────────────────────────────┐
│     Presentation Layer (Components)     │
│   cards/ controls/ timers/ countdowns/  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       Business Logic Layer (Hooks)      │
│   useExerciseAdjustment                 │
│   useExerciseNotifications              │
│   useHapticFeedback                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Service Layer (Adapters)           │
│   notificationAdapter                   │
│   chatStoreAdapter                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Infrastructure Layer (Utils)         │
│   exerciseCalculations                  │
│   difficultyUtils                       │
│   formatters                            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Foundation Layer (Types/Constants)   │
│   types/                                │
│   constants/                            │
└─────────────────────────────────────────┘
```

## 📦 Modules et Responsabilités

### 1. Cards (`cards/`)

**Responsabilité**: Composants de présentation pour afficher les exercices

#### TrainingPrescriptionCard
- Affiche un exercice complet avec tous ses paramètres
- Gère l'UI pour les ajustements inline
- Orchestre les sous-composants
- État: Local UI state uniquement
- Dépendances: controls/, utils/, types/

**Flux de données**:
```
Props (exercise, callbacks)
  → TrainingPrescriptionCard
  → ForceAdjustmentButtons
  → exerciseProgressionService (via hooks)
  → callback parent
```

### 2. Controls (`controls/`)

**Responsabilité**: Composants interactifs pour ajuster les exercices

#### ForceAdjustmentButtons
- Boutons rapides "Trop facile/difficile"
- Calculs d'ajustement automatiques (±8% charge, ±1 rep)
- Feedback haptique et audio
- Dépendances: hooks/, utils/, adapters/

#### ExerciseAdjustmentPanel
- Panel détaillé avec catégories d'ajustement
- Filtrage par catégorie (volume, intensité, technique)
- Configuration depuis `exerciseAdjustmentConfig`
- Dépendances: hooks/, config/

**Flux d'ajustement**:
```
User Click
  → ForceAdjustmentButtons
  → useExerciseAdjustment hook
  → exerciseProgressionService
  → useExerciseNotifications hook
  → step2NotificationService
  → useHapticFeedback hook
  → Haptics
```

### 3. Timers (`timers/`)

**Responsabilité**: Affichage du temps de session et repos

#### FloatingTimerCard
- Timer de session global
- Timer de repos entre séries
- Indicateur de progression
- Animation play/pause
- Dépendances: types/, constants/animations

**État géré par**: `useSessionTimer` hook (externe)

### 4. Countdowns (`countdowns/`)

**Responsabilité**: Comptes à rebours de préparation

#### PreparationCountdown
- Countdown 10→1→GO avant nouvel exercice
- Affichage nom et variante d'exercice
- Feedback audio progressif (urgence croissante)
- Feedback haptique (intensité progressive)
- Dépendances: audio/, utils/countdownAudio

#### TransitionCountdown
- Countdown court 3→2→1→GO entre repos et exercice
- Animation simplifiée
- Dépendances: audio/, utils/countdownAudio

**Gestion audio**:
```
countdowns/utils/countdownAudio.ts
  ↓
../../../../../../audio (module audio global)
  ↓
playCountdownTick(count, duration)
playCountdownGo()
```

### 5. Hooks (`hooks/`)

**Responsabilité**: Logique métier réutilisable

#### useExerciseAdjustment
- Encapsule `exerciseProgressionService`
- Validation des valeurs min/max
- Calculs d'ajustement
- Type-safe returns

#### useExerciseNotifications
- Encapsule `step2NotificationService`
- Notifications pour changements d'exercice
- Isolation de la dépendance

#### useHapticFeedback
- Encapsule `Haptics` utility
- API unifiée pour feedback tactile
- Types définis pour intensités

**Pattern d'isolation**:
```
Component
  → useExerciseAdjustment (hook)
  → exerciseProgressionService (adapter)
  → Business logic
```

### 6. Utils (`utils/`)

**Responsabilité**: Fonctions pures, sans état ni side-effects

#### exerciseCalculations.ts
- Calculs de charges, reps, sets
- Détection de charges progressives (ramping)
- Génération de résumés de progression
- **Pure functions**: `(input) => output`

#### difficultyUtils.ts
- Classification par RPE
- Calculs 1RM (formule Epley)
- Suggestions de charge
- Badges de difficulté

#### formatters.ts
- Formatage temps (MM:SS, human-readable)
- Formatage charges (fixe vs progressive)
- Formatage changements (±X kg, ±Y reps)

**Principes**:
- ✅ Pure functions
- ✅ No side effects
- ✅ Testable in isolation
- ✅ Composable

### 7. Adapters (`adapters/`)

**Responsabilité**: Isolation des dépendances externes

#### notificationAdapter
- Interface vers `step2NotificationService`
- Abstraction pour faciliter les tests
- Permet de mocker facilement

#### storeAdapter
- Interface vers `globalChatStore`
- Hook version et non-hook version
- Isolation Zustand

**Pattern Adapter**:
```typescript
// Instead of direct dependency
import { step2NotificationService } from 'services';
step2NotificationService.onSetsIncreased(...);

// Use adapter
import { notificationAdapter } from 'adapters';
notificationAdapter.notifySetsAdjustment(..., true);
```

**Avantages**:
- ✅ Testability (mock adapters)
- ✅ Flexibility (swap implementations)
- ✅ Decoupling (isolate external changes)

### 8. Types (`types/`)

**Responsabilité**: Définitions TypeScript centralisées

- Types métier: `Exercise`, `AdjustmentResult`, `DifficultyLevel`
- Props interfaces: `*Props` suffixes
- Configuration types: `TimerConfig`, `CountdownConfig`
- Re-exports: `Exercise` from trainingPipeline

**Conventions**:
- Props interfaces: `ComponentNameProps`
- State interfaces: `ComponentNameState`
- Config interfaces: `ComponentNameConfig`
- Enums as string unions: `type DifficultyLevel = 'easy' | 'moderate'...`

### 9. Constants (`constants/`)

**Responsabilité**: Valeurs de configuration immuables

#### index.ts
- Timing defaults
- Adjustment percentages
- Boundaries (min/max values)
- RPE thresholds

#### colors.ts
- Palettes de couleurs
- Fonctions de mapping (RPE → color)
- Semantic color names

#### animations.ts
- Framer Motion presets
- Easing curves
- Spring configurations
- Variants

**Pattern**:
```typescript
// Define
export const RPE_INTENSE_MAX = 9;

// Use in utils
if (rpe >= RPE_INTENSE_MAX) return 'very_intense';

// Use in components
style={{ color: rpe >= RPE_INTENSE_MAX ? 'red' : 'amber' }}
```

## 🔄 Flux de Données

### Scénario: User adjusts exercise difficulty

```
1. User clicks "Trop facile"
   ↓
2. ForceAdjustmentButtons.handleTooEasy()
   ↓
3. useExerciseAdjustment().increaseLoad()
   ↓
4. exerciseProgressionService.increaseLoad()
   ↓
5. calculateLoadIncrease(currentLoad) // utils
   ↓
6. onAdjustLoad(newLoad) // callback to parent
   ↓
7. useExerciseNotifications().notifyLoadIncreased()
   ↓
8. step2NotificationService.onLoadIncreased()
   ↓
9. useHapticFeedback().triggerSuccess()
   ↓
10. Haptics.success()
```

### Scénario: Display exercise difficulty

```
1. TrainingPrescriptionCard receives exercise
   ↓
2. getDifficultyBadge(exercise.rpeTarget) // utils
   ↓
3. getDifficultyLevel(rpe)
   ↓
4. if (rpe >= RPE_INTENSE_MAX) return 'very_intense'
   ↓
5. Return { label, color, level }
   ↓
6. Render badge with color from DIFFICULTY_COLORS
```

## 🧪 Testabilité

### Levels of Testing

#### 1. Unit Tests (Utils)
```typescript
// exerciseCalculations.test.ts
test('calculateLoadIncrease adds 8%', () => {
  const result = calculateLoadIncrease(100);
  expect(result.newValue).toBe(108);
});
```

#### 2. Hook Tests
```typescript
// useExerciseAdjustment.test.ts
const { result } = renderHook(() => useExerciseAdjustment());
act(() => {
  result.current.increaseSets(3);
});
expect(result.current).toMatchObject({ newValue: 4 });
```

#### 3. Component Tests (with mocked adapters)
```typescript
// ForceAdjustmentButtons.test.tsx
const mockAdapter = {
  notifySetsAdjustment: jest.fn(),
};

render(<ForceAdjustmentButtons adapter={mockAdapter} />);
// Test component behavior without real service
```

## 📈 Évolutivité

### Adding new adjustment type

1. **Add type**: `types/index.ts`
```typescript
export type ExerciseAdjustmentType = ... | 'new_type';
```

2. **Add calculator**: `utils/exerciseCalculations.ts`
```typescript
export const calculateNewAdjustment = (value) => {...}
```

3. **Add hook method**: `hooks/useExerciseAdjustment.ts`
```typescript
const adjustNew = useCallback((value) => {...}, []);
```

4. **Add UI**: `controls/` or new component

### Adding new component

1. Create in appropriate folder (`cards/`, `controls/`, etc.)
2. Add to folder's `index.ts`
3. Add to main `force/index.ts` with category comment
4. Add types to `types/index.ts`
5. Add constants to `constants/` if needed
6. Add utils to `utils/` if needed
7. Document in `README.md`

## 🔐 Principes de Design

1. **Dependency Inversion**: Components depend on abstractions (hooks, adapters), not concrete implementations
2. **Single Responsibility**: Each module has one reason to change
3. **Open/Closed**: Open for extension, closed for modification
4. **Interface Segregation**: Small, focused interfaces
5. **DRY**: Shared logic in hooks and utils
6. **Composition over Inheritance**: Build complex components from simple ones

## 📊 Métriques de Qualité

- **Cohésion**: Haute (chaque module a un objectif clair)
- **Couplage**: Faible (isolation via adapters et hooks)
- **Complexité**: Faible (fonctions courtes, responsabilités simples)
- **Réutilisabilité**: Haute (hooks, utils, types partagés)
- **Testabilité**: Haute (pure functions, mocked dependencies)

## 🚀 Performance

### Optimizations

1. **React.memo** sur composants lourds
2. **useCallback** pour handlers stables
3. **useMemo** pour calculs coûteux
4. **Lazy loading** possible pour countdowns (peu utilisés)
5. **Code splitting** possible par feature

### Monitoring

- Bundle size par sous-module
- Re-render counts avec React DevTools
- Animation frame rates

## 🔮 Future Improvements

1. **Décomposer TrainingPrescriptionCard** en sous-composants atomiques
2. **Créer BaseCountdown** pour mutualiser logique countdowns
3. **Extraire TimerDisplay** et **ProgressRing** du FloatingTimerCard
4. **Ajouter tests** unitaires et d'intégration
5. **Améliorer types** avec branded types pour validation
6. **Créer Storybook** stories pour chaque composant

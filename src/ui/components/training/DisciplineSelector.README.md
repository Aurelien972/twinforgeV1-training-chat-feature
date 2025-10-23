# DisciplineSelector Component

## Vue d'ensemble

Le composant `DisciplineSelector` (anciennement `SportDisciplineSelector`) permet aux utilisateurs de sélectionner temporairement une discipline d'entraînement différente de celle configurée dans leur profil. Cette sélection temporaire est maintenue pendant la session en cours.

## Caractéristiques

- **Couleur rose (#EC4899)** - Cohérence avec les autres composants de l'application
- **Sélection temporaire** - La discipline sélectionnée est sauvegardée dans sessionStorage
- **Badge "Votre discipline"** - Indique clairement la discipline du profil utilisateur
- **Disciplines non disponibles** - Marquées avec badge "Bientôt" et désactivées
- **Modale de confirmation** - Confirmation avant changement de discipline
- **Mapping automatique** - Associe automatiquement chaque discipline à son coach spécialisé

## Disciplines Disponibles

### Actuellement Opérationnelles

**Force & Powerbuilding (Coach Force):**
- Musculation
- Powerlifting
- Bodybuilding
- Strongman

**Endurance (Coach Endurance):**
- Course à pied
- Cyclisme
- Natation
- Triathlon
- Cardio général

### Bientôt Disponibles

- Functional & CrossTraining (CrossFit, HIIT, Functional, Circuit)
- Compétitions Fitness (HYROX, DEKA FIT, DEKA MILE, DEKA STRONG)
- Calisthenics & Street (Calisthenics, Street Workout, Streetlifting, Freestyle)
- Sports de Combat (Boxe, Kickboxing, MMA, Arts Martiaux)
- Bien-être & Mobilité (Yoga, Pilates, Mobilité, Stretching)
- Sports Spécifiques (Basketball, Football, Tennis, etc.)
- Mixte & Personnalisé (Entraînement mixte, Programme personnalisé)

## Utilisation

### Import

```tsx
import { DisciplineSelector } from '../../ui/components/training';
```

### Exemple basique

```tsx
import { DisciplineSelector } from '../../ui/components/training';
import { useUserStore } from '../../system/store/userStore';
import type { AgentType } from '../../domain/ai/trainingAiTypes';

function MyComponent() {
  const { profile } = useUserStore();

  const handleDisciplineChange = (discipline: string, coachType: AgentType) => {
    console.log('Nouvelle discipline:', discipline);
    console.log('Coach assigné:', coachType);
    // Utiliser la discipline et le coach pour générer l'entraînement
  };

  return (
    <DisciplineSelector
      profileDiscipline={profile?.preferences?.workout?.type || 'strength'}
      onDisciplineChange={handleDisciplineChange}
      compact={false}
      showConfirmation={true}
    />
  );
}
```

### Avec le hook useDisciplineSelector

```tsx
import { DisciplineSelector } from '../../ui/components/training';
import { useDisciplineSelector } from '../../hooks';
import { useUserStore } from '../../system/store/userStore';

function MyComponent() {
  const { profile } = useUserStore();
  const {
    activeDiscipline,
    activeCoachType,
    setTemporaryDiscipline,
    clearTemporaryDiscipline,
    isTemporary
  } = useDisciplineSelector(profile?.preferences?.workout?.type);

  const handleDisciplineChange = (discipline: string, coachType: AgentType) => {
    setTemporaryDiscipline(discipline);
    // Utiliser activeDiscipline et activeCoachType pour l'entraînement
  };

  return (
    <div>
      {isTemporary && (
        <button onClick={clearTemporaryDiscipline}>
          Revenir à ma discipline du profil
        </button>
      )}

      <DisciplineSelector
        profileDiscipline={profile?.preferences?.workout?.type}
        onDisciplineChange={handleDisciplineChange}
      />

      <p>Discipline active: {activeDiscipline}</p>
      <p>Coach assigné: {activeCoachType}</p>
    </div>
  );
}
```

## Props

### DisciplineSelectorProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `profileDiscipline` | `string \| null` | Oui | - | La discipline configurée dans le profil utilisateur |
| `onDisciplineChange` | `(discipline: string, coachType: AgentType) => void` | Oui | - | Callback appelé lors du changement de discipline |
| `compact` | `boolean` | Non | `false` | Affichage compact (1 colonne) ou grille responsive |
| `showConfirmation` | `boolean` | Non | `true` | Afficher la modale de confirmation avant changement |

## Utilitaires

### disciplineMapper

```tsx
import {
  getCoachForDiscipline,
  isDisciplineAvailable,
  getAvailableDisciplines,
  getDisciplineCategory
} from '../../utils/disciplineMapper';

// Obtenir le coach pour une discipline
const coach = getCoachForDiscipline('running'); // 'coach-endurance'

// Vérifier si une discipline est disponible
const available = isDisciplineAvailable('yoga'); // false

// Obtenir toutes les disciplines disponibles
const disciplines = getAvailableDisciplines(); // ['strength', 'powerlifting', ...]

// Obtenir la catégorie d'une discipline
const category = getDisciplineCategory('crossfit'); // 'functional-crosstraining'
```

## Gestion d'État

### SessionStorage

La discipline temporaire est stockée dans `sessionStorage` avec la clé `'temp-discipline'`:

```tsx
// Récupérer la discipline temporaire
const tempDiscipline = sessionStorage.getItem('temp-discipline');

// Définir une discipline temporaire
sessionStorage.setItem('temp-discipline', 'running');

// Supprimer la discipline temporaire
sessionStorage.removeItem('temp-discipline');
```

### Flux de données

1. L'utilisateur clique sur une discipline
2. Si `showConfirmation=true`, une modale s'affiche
3. Lors de la confirmation:
   - La discipline est sauvegardée dans sessionStorage
   - Le callback `onDisciplineChange` est appelé avec la discipline et le coach
4. Le composant affiche la nouvelle discipline comme sélectionnée
5. Au prochain chargement, la discipline temporaire est récupérée automatiquement

## Styles et Couleurs

Le composant utilise une palette rose cohérente:

- **Couleur principale**: `#EC4899` (rose-magenta)
- **Background sélectionné**: `rgba(236, 72, 153, 0.15)`
- **Border sélectionné**: `#EC4899`
- **Shadow sélectionné**: `rgba(236, 72, 153, 0.4)`

## Intégration TrainingPage

Le composant est intégré dans l'onglet "Conseils" de la TrainingPage:

```tsx
<DisciplineSelector
  profileDiscipline={profile?.preferences?.workout?.type || dominantDiscipline || 'strength'}
  onDisciplineChange={handleDisciplineChange}
  compact={false}
  showConfirmation={true}
/>
```

## Notes importantes

1. **Temporaire par session**: La sélection est perdue au refresh du navigateur
2. **Priorité**: Discipline temporaire > Discipline du profil > 'strength' (par défaut)
3. **Coaches disponibles**: Seuls `coach-force` et `coach-endurance` sont opérationnels
4. **Confirmation**: Recommandé de garder `showConfirmation=true` pour éviter les changements accidentels
5. **Coach mapping**: Le mapping discipline → coach est automatique via `disciplineMapper`

## Roadmap

- [ ] Coach Functional (CrossFit, HIIT, Functional, Circuit)
- [ ] Coach Endurance (validation en production)
- [ ] Coach Calisthenics (Calisthenics, Street Workout)
- [ ] Coach Combat (Boxe, MMA, Arts Martiaux)
- [ ] Coach Wellness (Yoga, Pilates, Mobilité)
- [ ] Coach Competitions (HYROX, DEKA)
- [ ] Coach Sports (Basketball, Football, Tennis)
- [ ] Coach Mixed (Entraînement mixte, Programme personnalisé)

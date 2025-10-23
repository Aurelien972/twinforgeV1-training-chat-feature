# Location Components - Architecture Modulaire

Ce dossier contient tous les composants, utilitaires et types liés à la gestion des lieux d'entraînement.

## Architecture

L'architecture suit le pattern **Atomic Design** avec une séparation claire des responsabilités :

```
location/
├── atoms/           # Composants de base réutilisables
├── molecules/       # Compositions de composants simples
├── organisms/       # Composants complexes métier
├── utils/          # Fonctions utilitaires
├── constants/      # Constantes et configurations
├── types/          # Types et interfaces TypeScript
└── index.ts        # Point d'entrée centralisé (barrel export)
```

## Structure détaillée

### 📦 Atoms (Composants de base)
Composants atomiques simples et réutilisables :
- `LocationTypeCard` - Carte de sélection de type de lieu
- `LocationCardSkeleton` - Skeleton loader pour les cartes

### 🧩 Molecules (Compositions simples)
Compositions de composants atomiques :
- `PhotoGallery` - Galerie de photos avec prévisualisation et suppression

### 🏗️ Organisms (Composants complexes)
Composants métier complets avec logique d'état :
- `TrainingLocationManager` - Gestionnaire principal des lieux
- `LocationEditorModal` - Modal d'édition/création de lieu (avec photos)
- `CreateLocationManualModal` - Modal de création manuelle (sans photos)
- `LocationQuickSelector` - Sélecteur rapide de lieu
- `LocationPhotoCapture` - Interface de capture de photos
- `PhotoAnalysisProgress` - Progression de l'analyse IA des photos

### 🛠️ Utils (Utilitaires)
Fonctions utilitaires réutilisables :

#### `locationHelpers.ts`
- `getLocationIcon(type)` - Retourne l'icône pour un type de lieu
- `getLocationColor(type)` - Retourne la couleur associée au type
- `getLocationLabel(type)` - Retourne le label localisé
- `getLocationLabelShort(type)` - Retourne le label court
- `getLocationMetadata(type)` - Retourne toutes les métadonnées d'un lieu

#### `photoHelpers.ts`
- `getPhotoUrl(photo)` - Extrait l'URL d'une photo
- `getPhotoId(photo)` - Extrait l'ID d'une photo
- `isValidImageFile(file)` - Valide le format d'un fichier image
- `isValidFileSize(file, maxSizeMB)` - Valide la taille d'un fichier
- `validatePhotoFiles(files)` - Valide un ensemble de fichiers photos

#### `formatters.ts`
- `formatTime(seconds)` - Formate un temps en "Xm Ys"
- `formatPhotoCount(count)` - Formate le nombre de photos avec pluriel
- `formatEquipmentCount(count)` - Formate le nombre d'équipements avec pluriel
- `formatPercentage(value)` - Formate un pourcentage

### 📋 Constants (Constantes)

#### `locationTypes.ts`
- `LOCATION_TYPES` - Tableau des types de lieux disponibles
- `LOCATION_TYPE_LABELS` - Labels localisés par type
- `LOCATION_TYPE_DESCRIPTIONS` - Descriptions par type
- `LOCATION_NAME_PLACEHOLDERS` - Placeholders pour les noms

#### `colors.ts`
- `LOCATION_COLORS` - Couleurs par type de lieu
- `ANALYSIS_STATUS_COLORS` - Couleurs par statut d'analyse
- `BADGE_COLORS` - Couleurs des badges

#### `photoConfig.ts`
- `MAX_PHOTOS_PER_LOCATION` - Limite de photos par lieu (5)
- `MAX_PHOTO_SIZE_MB` - Taille maximale d'une photo (10Mo)
- `ACCEPTED_IMAGE_FORMATS` - Formats acceptés
- `ANALYSIS_PROGRESS_CONFIG` - Configuration de progression d'analyse
- `PHOTO_TIPS` - Conseils pour les photos

#### `animations.ts`
- Variants et configurations d'animations Framer Motion réutilisables
- `fadeVariants`, `scaleVariants`, `slideRightVariants`, etc.
- Configurations de transitions et d'animations

### 🎯 Types (Types TypeScript)

#### `modal.types.ts`
- `LocationEditorData` - Données pour création/édition avec photos
- `CreateLocationManualData` - Données pour création manuelle sans photos
- `LocationEditorModalProps`, `CreateLocationManualModalProps`

#### `photo.types.ts`
- `AnalysisStatus` - Statut d'analyse d'une photo
- `PhotoAnalysisStatus` - Information complète de statut
- `AnalysisStatusMap` - Map des statuts par ID de photo
- Props pour PhotoAnalysisProgress, PhotoGallery, LocationPhotoCapture

#### `component.types.ts`
- Props pour LocationTypeCard, LocationQuickSelector, etc.

## Utilisation

### Import depuis l'extérieur

Tous les exports sont disponibles via le barrel export principal :

```typescript
import {
  // Atoms
  LocationTypeCard,
  LocationCardSkeleton,

  // Molecules
  PhotoGallery,

  // Organisms
  TrainingLocationManager,
  LocationEditorModal,
  CreateLocationManualModal,
  LocationQuickSelector,
  LocationPhotoCapture,
  PhotoAnalysisProgress,

  // Utils
  getLocationIcon,
  getLocationColor,
  getLocationLabel,
  formatTime,
  formatPhotoCount,

  // Constants
  LOCATION_COLORS,
  MAX_PHOTOS_PER_LOCATION,
  PHOTO_TIPS,

  // Types
  LocationEditorData,
  CreateLocationManualData,
  LocationType,
  TrainingLocationWithDetails
} from '@/ui/components/training/location';
```

### Import depuis l'intérieur

Les imports internes suivent la hiérarchie :
- Atoms peuvent importer depuis utils, constants, types
- Molecules peuvent importer depuis atoms, utils, constants, types
- Organisms peuvent importer depuis atoms, molecules, utils, constants, types

```typescript
// Dans un organism
import { LocationTypeCard } from '../atoms';
import { PhotoGallery } from '../molecules';
import { getLocationIcon } from '../utils';
import { LOCATION_COLORS } from '../constants';
import type { LocationEditorData } from '../types';
```

## Dépendances externes

### Services
- `trainingLocationService` - CRUD des lieux d'entraînement
- `equipmentDetectionService` - Détection IA d'équipements

### Hooks
- `useTrainingLocations` - Hook de gestion des lieux

### Domain
- `trainingLocation` - Types de domaine (LocationType, TrainingLocationWithDetails, etc.)

### UI Shared
- `SpatialIcon` - Composant d'icônes
- `GlassCard` - Carte avec effet de verre
- `GenericDrawer` - Tiroir générique
- `GlowIcon` - Icône avec effet de lueur

## Principes de développement

### 1. Single Responsibility Principle
Chaque composant/fonction a une seule responsabilité bien définie.

### 2. DRY (Don't Repeat Yourself)
Le code dupliqué a été extrait dans les utilitaires et constantes.

### 3. Separation of Concerns
- Logique métier dans les organisms
- Logique de présentation dans atoms/molecules
- Utilitaires dans utils
- Configuration dans constants

### 4. Type Safety
Tous les composants et fonctions sont fortement typés avec TypeScript.

### 5. Unidirectional Dependencies
Les dépendances suivent une direction unique : atoms ← molecules ← organisms

## Maintenance

### Ajouter un nouveau composant atom
1. Créer le fichier dans `atoms/`
2. Utiliser les utils/constants existants
3. Exporter depuis `atoms/index.ts`

### Ajouter un nouvel utilitaire
1. Créer/étendre un fichier dans `utils/`
2. Exporter depuis `utils/index.ts`
3. Documenter avec JSDoc

### Ajouter une nouvelle constante
1. Créer/étendre un fichier dans `constants/`
2. Exporter depuis `constants/index.ts`
3. Utiliser des types stricts

### Modifier un type
1. Modifier dans le fichier approprié de `types/`
2. Vérifier que tous les usages sont toujours valides
3. Exécuter `npm run build` pour valider

## Métriques

- **Fichiers totaux** : 25
- **Composants** : 9 (2 atoms, 1 molecule, 6 organisms)
- **Utilitaires** : 3 fichiers (locationHelpers, photoHelpers, formatters)
- **Constantes** : 4 fichiers (locationTypes, colors, photoConfig, animations)
- **Types** : 3 fichiers (modal, photo, component)
- **Réduction de duplication** : ~35% (fonctions getLocation* consolidées)

## Améliorations futures

- [ ] Ajouter des hooks custom dans `hooks/` pour isoler davantage la logique
- [ ] Créer des composants molecules supplémentaires (badges, status indicators)
- [ ] Ajouter des tests unitaires pour les utilitaires
- [ ] Extraire plus d'animations dans les constantes
- [ ] Créer un Storybook pour documenter visuellement les composants

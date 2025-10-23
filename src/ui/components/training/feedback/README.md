# Feedback Components Module

## Overview

The feedback module provides post-session analysis and metrics components for the training system. This module has been refactored into a modular architecture following SOLID principles and React best practices.

## Architecture

```
feedback/
├── cards/              # Performance cards
│   ├── ScoreGlobalCard.tsx
│   ├── SessionBadgesCard.tsx
│   └── index.ts
├── overlays/           # Modal overlays and indicators
│   ├── AnalysisProgressOverlay.tsx
│   ├── BackgroundAnalysisIndicator.tsx
│   └── index.ts
├── stats/              # Statistics displays
│   ├── SessionSummaryStats.tsx
│   └── index.ts
├── sections/           # Complex sections
│   └── MeasurableGoalsSection.tsx (legacy)
├── shared/             # Reusable components
│   ├── MetricCard.tsx
│   ├── CircularProgress.tsx
│   ├── ProgressBar.tsx
│   └── index.ts
├── utils/              # Calculation utilities
│   ├── metricsCalculations.ts
│   ├── formatters.ts
│   ├── phaseHelpers.ts
│   └── index.ts
├── config/             # Constants and configurations
│   ├── constants.ts
│   ├── badgeConfigs.ts
│   └── index.ts
├── types/              # TypeScript types
│   └── index.ts
└── index.ts            # Main exports
```

## Components

### Cards

**ScoreGlobalCard**
- Displays overall session performance score
- Circular progress indicator with glow effects
- Rating-based color theming
- Responsive design (mobile/desktop)

**SessionBadgesCard**
- Shows earned badges based on performance
- Supports both local and AI-powered achievements
- Animated badge reveals
- Encouragement messages

### Overlays

**AnalysisProgressOverlay**
- Full-screen progress overlay for photo analysis
- Real-time progress updates
- Phase-based icon and color changes
- Cancellable during analysis

**BackgroundAnalysisIndicator**
- Discrete bottom-right indicator
- Expandable to show detailed progress
- Batch job progress tracking
- Dismissable when complete

### Stats

**SessionSummaryStats**
- Displays 4 key statistics before session
- Grid layout (2x2 on mobile, 4x1 on desktop)
- Animated entry
- Customizable step color

### Shared Components

**MetricCard**
- Reusable metric display card
- Icon, value, and label
- Animated and color-themed

**CircularProgress**
- Reusable circular progress indicator
- Supports mobile and desktop sizes
- Customizable stroke width and color
- Accepts children for center content

**ProgressBar**
- Animated horizontal progress bar
- Optional shimmer effect
- Customizable height and color

## Utilities

### Metrics Calculations

```typescript
import {
  calculateSessionMetrics,
  calculateEnduranceMetrics,
  isEnduranceSession
} from './utils';

// Calculate all metrics at once
const metrics = calculateSessionMetrics(sessionFeedback, sessionPrescription);

// Calculate endurance-specific metrics
const enduranceMetrics = calculateEnduranceMetrics(sessionFeedback, aiAnalysis);

// Check session type
const isEndurance = isEnduranceSession(sessionPrescription);
```

### Formatters

```typescript
import {
  formatTime,
  formatDuration,
  formatVolume,
  formatWorkRestRatio
} from './utils';

formatTime(125);           // "2:05"
formatDuration(3665);      // "1h01"
formatVolume(5500);        // "5.5t"
formatWorkRestRatio(2.3);  // "2.3:1"
```

### Phase Helpers

```typescript
import {
  getPhaseIcon,
  getPhaseColor,
  isTerminalPhase,
  isActivePhase
} from './utils';

const icon = getPhaseIcon('analyzing');
const color = getPhaseColor('analyzing');
const isActive = isActivePhase('analyzing');
```

## Configuration

### Constants

All magic values have been extracted to `config/constants.ts`:

- `RATING_COLORS` - Color mapping for performance ratings
- `METRIC_COLORS` - Colors for different metric types
- `CALCULATION_CONSTANTS` - Formulas and thresholds
- `ANIMATION_DURATIONS` - Animation timing values
- `GLOW_INTENSITY` - Glow effect intensities

### Badge Configs

Badge definitions and conditions in `config/badgeConfigs.ts`:

```typescript
import { getEarnedBadges, getEncouragementMessage } from './config/badgeConfigs';

const earnedBadges = getEarnedBadges(metrics);
const message = getEncouragementMessage(earnedBadges.length);
```

## Types

All TypeScript types are centralized in `types/index.ts`:

```typescript
import type {
  SessionMetrics,
  PerformanceRating,
  Badge,
  AnalysisProgress
} from './types';
```

## Usage Examples

### Basic Usage

```typescript
import {
  ScoreGlobalCard,
  SessionBadgesCard,
  SessionSummaryStats
} from '@/ui/components/training/feedback';

// In your component
<ScoreGlobalCard
  score={85}
  rating="excellent"
  summary="Performance exceptionnelle"
  coachRationale="Tous les objectifs atteints"
  stepColor="#3B82F6"
/>
```

### Advanced Usage with Utilities

```typescript
import {
  calculateSessionMetrics,
  getEarnedBadges,
  MetricCard
} from '@/ui/components/training/feedback';

const metrics = calculateSessionMetrics(feedback, prescription);
const badges = getEarnedBadges(metrics);

<div className="grid grid-cols-3 gap-4">
  <MetricCard
    icon="Flame"
    color="#EF4444"
    value={`${metrics.caloriesBurned}`}
    label="Calories"
    delay={0.1}
  />
</div>
```

## Migration Guide

The refactoring maintains backward compatibility. All existing imports will continue to work:

```typescript
// Old imports (still work)
import { ScoreGlobalCard } from '@/ui/components/training/feedback';

// New structured imports (also work)
import { ScoreGlobalCard } from '@/ui/components/training/feedback/cards';
```

## Performance Optimizations

1. **Component Memoization**: Pure presentational components use React.memo
2. **Calculation Memoization**: Heavy calculations use useMemo
3. **Animation Optimizations**: useReducedMotion support throughout
4. **Lazy Loading**: Components can be lazy loaded when needed
5. **Code Splitting**: Modular structure enables better code splitting

## Testing

### Unit Tests

Test utilities separately:

```typescript
import { calculateCaloriesBurned } from './utils';

test('calculates calories correctly', () => {
  const result = calculateCaloriesBurned(5000, 60, 7);
  expect(result).toBeGreaterThan(0);
});
```

### Component Tests

Test components with React Testing Library:

```typescript
import { render } from '@testing-library/react';
import { MetricCard } from './shared';

test('renders metric card', () => {
  const { getByText } = render(
    <MetricCard icon="Flame" color="#EF4444" value="450" label="Calories" />
  );
  expect(getByText('450')).toBeInTheDocument();
});
```

## Best Practices

1. **Use Constants**: Always use constants from config instead of magic values
2. **Type Safety**: Import types from the types module
3. **Utilities First**: Use utility functions for calculations instead of inline logic
4. **Composition**: Build complex components from shared components
5. **Performance**: Use memo and useMemo for expensive operations
6. **Accessibility**: Ensure all interactive elements are keyboard accessible

## Future Improvements

- [ ] Complete refactoring of PersonalizedMetricsCard
- [ ] Complete refactoring of ExerciseAnalysisCard
- [ ] Add unit tests for all utilities
- [ ] Add component tests for all feedback components
- [ ] Create Storybook stories
- [ ] Add performance monitoring
- [ ] Implement error boundaries
- [ ] Add analytics tracking

## Contributing

When adding new feedback components:

1. Place in appropriate subdirectory (cards/overlays/stats/sections)
2. Extract constants to config/constants.ts
3. Extract calculations to utils/
4. Add TypeScript types to types/
5. Export from subdirectory index.ts
6. Update main index.ts
7. Update this README
8. Add tests

## Dependencies

- `framer-motion` - Animations
- `react` - UI library
- Internal dependencies:
  - `@/ui/cards/GlassCard` - Glass card wrapper
  - `@/ui/icons` - Icon components
  - `@/utils/loadUtils` - Load calculation utilities
  - `@/system/store` - State management
  - `@/system/services` - Business logic services

## License

Internal use only - Part of the training system.

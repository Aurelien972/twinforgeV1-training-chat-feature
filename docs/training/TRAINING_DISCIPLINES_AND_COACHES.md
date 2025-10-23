# Training Disciplines & Specialized Coaches

**Version**: 1.0.0 (MVP)
**Last Updated**: October 2025
**Status**: 5 Coaches Operational (MVP Scope)
**Purpose**: Guide to training categories, disciplines, and coach specialization system

---

## Overview

**MVP Scope:** The TwinForge training system currently supports **5 major training categories** with specialized AI coaches. Each category is managed by a dedicated coach with domain expertise, equipment knowledge, and specific programming methodologies.

**Note:** 4 additional categories (Wellness & Mobilité, Sports de Combat, Sports Spécifiques, Mixte & Personnalisé) are planned for Phase 2+ roadmap.

### Coach Assignment Logic

```typescript
// User selects training type in Profile > Training tab
const userTrainingType = profile.preferences?.workout?.type; // e.g., 'strength'

// System finds matching category
const category = TRAINING_CATEGORIES.find(cat =>
  cat.types.some(t => t.value === userTrainingType)
);

// Coach is assigned based on specialization
const assignedCoach = category?.coachSpecialization; // e.g., 'force'
```

---

## Training Categories Structure

### Category Definition

**Location**: `/src/system/store/trainingPipeline/constants.ts`

```typescript
export const TRAINING_CATEGORIES = [
  {
    id: string,                    // Unique category identifier
    label: string,                 // Display name
    description: string,           // Short description
    icon: IconName,                // Lucide icon name
    color: string,                 // Brand color (hex)
    coachSpecialization: string,   // Coach assignment key
    types: [                       // Disciplines within category
      {
        value: string,             // Database value
        label: string,             // Display name
        description: string,       // Short description
        icon: IconName             // Lucide icon
      }
    ]
  }
];
```

---

## 1. Force & Powerbuilding

**Category ID**: `force-powerbuilding`
**Coach**: Coach Force (Operational ✅)
**Color**: `#3B82F6` (Blue)

### Disciplines

| Value | Label | Description | Focus |
|-------|-------|-------------|-------|
| `strength` | Musculation | Force et hypertrophie | Balanced strength & size |
| `powerlifting` | Powerlifting | Force maximale (squat, bench, deadlift) | Maximal strength, competition lifts |
| `bodybuilding` | Bodybuilding | Esthétique et hypertrophie maximale | Muscle size, symmetry, aesthetics |
| `strongman` | Strongman | Force athlétique et fonctionnelle | Functional strength, odd objects |

### Coach Expertise

**Periodization**:
- Linear (beginners)
- Undulating (intermediate)
- Conjugate (advanced)
- Daily Undulating Periodization (DUP)

**Equipment**: 200+ items
- Free weights (barbells, dumbbells, kettlebells)
- Machines (Smith, cable, leg press, etc.)
- Strongman (log, axle, stones, yoke, tire)
- Calisthenics structures

**Programming**:
- Progressive overload strategies
- Auto-regulation via RPE
- Load progression formulas
- Deload protocols

---

## 2. Functional & CrossTraining

**Category ID**: `functional-crosstraining`
**Coach**: Coach Functional (Planned 🔄)
**Color**: `#DC2626` (Red)

### Disciplines

| Value | Label | Description | Focus |
|-------|-------|-------------|-------|
| `crossfit` | CrossFit | Entraînement fonctionnel varié haute intensité | MetCons, Olympic lifts, gymnastics |
| `hiit` | HIIT | High Intensity Interval Training | Short bursts, maximum effort |
| `functional` | Functional Training | Mouvements fonctionnels multi-articulaires | Practical strength, movement patterns |
| `circuit` | Circuit Training | Enchaînements de stations | Endurance, full-body |

### Coach Expertise (Planned)

**Methodology**:
- WOD (Workout of the Day) programming
- AMRAP, EMOM, Tabata formats
- Skill progressions (muscle-ups, handstands)
- Metabolic conditioning

**Equipment**:
- Olympic weightlifting (barbell, bumper plates)
- Gymnastics (rings, parallettes, rope)
- Cardio (rower, assault bike, ski erg)
- Functional (kettlebells, medicine balls, plyo boxes)

---

## 3. Fitness Competitions

**Category ID**: `fitness-competitions`
**Coach**: Coach Competitions (Planned 🔄)
**Color**: `#F59E0B` (Amber)

### Disciplines

| Value | Label | Description | Focus |
|-------|-------|-------------|-------|
| `hyrox` | HYROX | Course et stations fonctionnelles | 8 × 1km run + 8 workout stations |
| `deka-fit` | DEKA FIT | Challenge fitness 10 zones | 10 fitness zones with transitions |
| `deka-mile` | DEKA MILE | Mile run + 10 stations | 1 mile + 10 workout zones |
| `deka-strong` | DEKA STRONG | Force et puissance 10 stations | Strength-focused 10 zones |

### Coach Expertise (Planned)

**Methodology**:
- Event-specific training
- Transition practice
- Pacing strategies
- Peak performance timing

**Equipment**:
- Cardio (rower, ski erg, assault bike)
- Functional strength (sandbags, slam balls, wall balls)
- Bodyweight stations

---

## 4. Calisthenics & Street

**Category ID**: `calisthenics-street`
**Coach**: Coach Calisthenics (Planned 🔄)
**Color**: `#06B6D4` (Cyan)

### Disciplines

| Value | Label | Description | Focus |
|-------|-------|-------------|-------|
| `calisthenics` | Calisthenics | Poids du corps avancé et skills | Muscle-ups, levers, planches |
| `street-workout` | Street Workout | Barres et structures en extérieur | Pull-ups, dips, outdoor training |
| `streetlifting` | Streetlifting | Force au poids du corps (tractions lestées) | Weighted bodyweight movements |
| `freestyle` | Freestyle | Figures acrobatiques et créativité | Skills, combos, flow |

### Coach Expertise (Planned)

**Methodology**:
- Skill progressions (basics → advanced)
- Strength endurance protocols
- Static holds programming
- Dynamic movements

**Equipment**:
- Public structures (bars, parallel bars)
- Minimal equipment (resistance bands, dip belt)

---

## 5. Endurance

**Category ID**: `endurance`
**Coach**: Coach Endurance (Planned 🔄)
**Color**: `#22C55E` (Green)

### Disciplines

| Value | Label | Description | Focus |
|-------|-------|-------------|-------|
| `running` | Course à pied | Running route et trail | Road running, trail running |
| `cycling` | Cyclisme | Vélo route et VTT | Road, MTB, gravel |
| `swimming` | Natation | Entraînement aquatique | Technique, endurance |
| `triathlon` | Triathlon | Natation, vélo, course | Multi-discipline endurance |
| `cardio` | Cardio général | Endurance cardiovasculaire | General cardio fitness |

### Coach Expertise (Planned)

**Methodology**:
- Zone-based training (Z1-Z5)
- Periodization (base, build, peak)
- Interval programming
- Endurance building

**Metrics**:
- Heart rate zones
- Power (watts for cycling)
- Pace (min/km)
- TSS (Training Stress Score)

**Equipment**:
- Running (shoes, GPS watch)
- Cycling (bike, smart trainer, power meter)
- Swimming (pool, equipment)

---

---

## Implementation Status

### MVP (Phase 1) - ✅ Completed

**5 Coaches Operational:**
1. ✅ **Coach Force** - Fully operational
2. ✅ **Coach Endurance** - Fully operational
3. ✅ **Coach Functional** - Implemented (testing phase)
4. ✅ **Coach Competitions** - Implemented (testing phase)
5. ✅ **Coach Calisthenics** - Implemented (testing phase)

**Infrastructure:**
- ✅ 5-step training pipeline operational
- ✅ Equipment catalog (300+ items)
- ✅ Equipment detection (GPT-4o Vision)
- ✅ Database schema complete
- ✅ Edge Functions deployed
- ✅ Training locations management
- ✅ Real-time session tracking

---

### Roadmap: Phase 2+ (Future)

**Planned Categories (Not in MVP):**

1. **Wellness & Mobilité** (Phase 2)
   - Yoga, Pilates, Mobility, Stretching
   - Reason: Lower priority for initial target audience
   - Complexity: Low-Medium

2. **Sports de Combat** (Phase 3)
   - Boxing, Kickboxing, MMA, Martial Arts
   - Reason: Requires specialized technique guidance
   - Complexity: High

3. **Sports Spécifiques** (Phase 3)
   - Basketball, Football, Tennis, Other sports
   - Reason: Highly sport-specific, fragmented user base
   - Complexity: Medium-High

4. **Mixte & Personnalisé** (Phase 2)
   - Mixed training, Custom programs
   - Reason: Requires all other coaches operational first
   - Complexity: High (synthesis of all methodologies)

**Future Enhancements:**
- Multi-coach programs (e.g., Strength + Endurance)
- Coach handoffs (change specialization mid-program)
- Hybrid programming (combine methodologies)
- Wearable integration (Apple Health, Google Fit)
- Advanced ML-based progression predictions

---

## Best Practices for Coach Selection

### For Users

1. **Match training preference** to primary goal
2. **Select specific discipline** for targeted results
3. **Consider equipment** availability
4. **Reassess periodically** (every 12 weeks)

### For Developers

1. **Follow template guide** for new coaches
2. **Reuse existing infrastructure** (context collection, analysis)
3. **Maintain equipment catalog** consistency
4. **Test across fitness levels** (beginner to elite)

---

## Database Integration

### Profile Storage

```sql
-- User's training preference
profiles.preferences.workout.type = 'strength'; -- Selected discipline

-- Coach assignment (computed)
-- Resolved from TRAINING_CATEGORIES[].coachSpecialization
```

### Session Tracking

```sql
training_sessions.coach_type = 'force'; -- Assigned coach
training_sessions.session_type = 'strength'; -- Specific discipline
```

---

## UI Components

### Profile > Training Tab

```typescript
// Dropdown with optgroups
<select name="workout.type">
  {TRAINING_CATEGORIES.map(category => (
    <optgroup key={category.id} label={category.label}>
      {category.types.map(type => (
        <option key={type.value} value={type.value}>
          {type.label} - {type.description}
        </option>
      ))}
    </optgroup>
  ))}
</select>
```

**Helper Text**: "Un coach spécialisé sera assigné selon votre choix"

---

## Testing Scenarios

### Category Assignment

```typescript
// Test: Correct coach assignment
const testCases = [
  { type: 'strength', expectedCoach: 'force' },
  { type: 'powerlifting', expectedCoach: 'force' },
  { type: 'crossfit', expectedCoach: 'functional' },
  { type: 'running', expectedCoach: 'endurance' },
  { type: 'yoga', expectedCoach: 'wellness' }
];
```

### Multi-Coach Scenarios

```typescript
// Test: User changes training type
1. User starts with 'strength' (Coach Force)
2. User changes to 'running' (Coach Endurance)
3. Previous sessions remain with original coach
4. New sessions use new coach
```

---

## See Also

- **[TRAINING_FORGE_MVP.md](./TRAINING_FORGE_MVP.md)** - Complete MVP documentation
- **[TRAINING_SYSTEM_OVERVIEW.md](./TRAINING_SYSTEM_OVERVIEW.md)** - System architecture
- **[COACH_FORCE_SPECIFICATION.md](./COACH_FORCE_SPECIFICATION.md)** - Coach Force details
- **[COACH_ENDURANCE_SPECIFICATION.md](./COACH_ENDURANCE_SPECIFICATION.md)** - Coach Endurance details

---

**Document Version**: 1.0.0 (MVP)
**Maintained By**: TwinForge AI Team
**Last Updated**: October 2025

# Coach Force - Technical Specification

**Coach Type**: Force & Powerbuilding Specialist
**Status**: Production Operational
**Version**: 1.0.0
**Last Updated**: October 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Specializations](#specializations)
3. [AI Prompt Engineering](#ai-prompt-engineering)
4. [Context Collection](#context-collection)
5. [Prescription Generation](#prescription-generation)
6. [Exercise Selection Logic](#exercise-selection-logic)
7. [Progression Strategies](#progression-strategies)
8. [Equipment Adaptation](#equipment-adaptation)
9. [Performance Analysis](#performance-analysis)
10. [Integration Points](#integration-points)

---

## Overview

Coach Force is the first operational specialized training coach in the TwinForge system. It provides expert guidance for:
- **Strength Training** (Musculation)
- **Powerlifting** (Force maximale)
- **Bodybuilding** (Hypertrophie & esthétique)
- **Strongman** (Force fonctionnelle)

### Core Capabilities

```typescript
interface CoachForceCapabilities {
  // Training modalities
  modalities: ['strength', 'powerlifting', 'bodybuilding', 'strongman'];

  // Periodization models
  periodization: ['linear', 'undulating', 'conjugate', 'DUP'];

  // Equipment expertise (300+ items)
  equipment: {
    freeWeights: string[];
    machines: string[];
    strongman: string[];
    calisthenics: string[];
  };

  // Progression intelligence
  progression: {
    beginner: 'linear';
    intermediate: 'wave-loading';
    advanced: 'block-periodization';
    autoRegulation: 'RPE-based';
  };
}
```

---

## Specializations

### 1. Strength Training (Musculation)

**Focus**: Balanced development of force and hypertrophy

**Key Lifts**:
- Squat variations (back, front, safety bar, hack)
- Bench press variations (flat, incline, decline)
- Deadlift variations (conventional, sumo, RDL)
- Overhead press variations
- Row variations

**Rep Ranges**: 3-12 reps
**Set Ranges**: 3-5 sets
**Rest Periods**: 2-5 minutes
**Intensity**: 70-90% 1RM (RPE 7-9)

**Typical Structure**:
```
Day 1: Upper Push (Chest, Shoulders, Triceps)
Day 2: Lower Pull (Deadlift, Hamstrings, Posterior)
Day 3: Upper Pull (Back, Biceps, Rear Delts)
Day 4: Lower Push (Squat, Quads, Calves)
```

---

### 2. Powerlifting

**Focus**: Maximal strength in squat, bench press, deadlift

**Competition Lifts**:
- Back Squat (competition depth)
- Bench Press (competition pause)
- Deadlift (conventional or sumo)

**Accessory Movements**:
- Variations of main lifts
- Weak point specific work
- Movement pattern reinforcement

**Rep Ranges**: 1-6 reps (main), 6-12 (accessories)
**Set Ranges**: 5-10 sets
**Rest Periods**: 3-7 minutes (main), 2-3 min (accessories)
**Intensity**: 75-95% 1RM (RPE 7-10)

**Periodization Example** (12-week cycle):
```
Weeks 1-4: Accumulation (70-80%, 4-6 reps, 5 sets)
Weeks 5-8: Intensification (80-90%, 2-4 reps, 4-6 sets)
Weeks 9-11: Realization (85-95%, 1-3 reps, 3-5 sets)
Week 12: Deload + Peak
```

---

### 3. Bodybuilding

**Focus**: Maximal muscle hypertrophy and aesthetic development

**Muscle Group Split**:
- Push (Chest, Shoulders, Triceps)
- Pull (Back, Biceps, Rear Delts)
- Legs (Quads, Hamstrings, Glutes, Calves)
- Arms (Biceps, Triceps isolation)
- Shoulders & Abs (Delts focus)

**Training Principles**:
- Progressive overload on volume
- Mechanical tension emphasis
- Metabolic stress techniques (drop sets, supersets)
- Time under tension (controlled tempo)

**Rep Ranges**: 6-20 reps
**Set Ranges**: 3-5 sets per exercise, 12-20 sets per muscle group/week
**Rest Periods**: 60-90 seconds
**Intensity**: 60-85% 1RM (RPE 7-9)

**Advanced Techniques**:
- Drop sets
- Supersets (agonist/antagonist)
- Rest-pause sets
- Pre-exhaust
- Post-exhaust

---

### 4. Strongman

**Focus**: Functional strength, odd objects, event-specific training

**Event Categories**:
- Pressing (Log press, Axle press, Circus dumbbell)
- Deadlift (Axle, Elephant bar, Deadlift for reps)
- Carries (Farmer's walk, Yoke walk, Frame carry)
- Loading (Atlas stones, Sandbag to platform, Keg toss)
- Dynamic (Tire flip, Sled drag, Truck pull)

**Training Principles**:
- Event-specific practice
- Max effort days (1-3 reps)
- Dynamic effort days (speed work)
- Conditioning work
- Grip strength focus

**Rep Ranges**: 1-5 reps (max effort), 60-90 seconds (events)
**Intensity**: Event-specific
**Equipment**: Specialized strongman implements

---

## AI Prompt Engineering

### Prompt Structure

Located in: `/src/config/prompts/training/coachForcePrompts.ts`

```typescript
const coachForcePrompt = {
  version: '1.0.0',
  system: `Tu es un coach IA expert en Force & Powerbuilding...`,

  sections: {
    expertise: [
      'Musculation (hypertrophie + force)',
      'Powerlifting (force maximale)',
      'Bodybuilding (esthétique)',
      'Strongman (force fonctionnelle)'
    ],

    periodization: {
      linear: 'Débutants et intermédiaires (+2.5-5kg/semaine)',
      undulating: 'Avancés (variation volume/intensité)',
      conjugate: 'Elite (max + dynamic + repetition effort)',
      DUP: 'Variation quotidienne intensité/volume'
    },

    exerciseSelection: {
      hierarchy: [
        'Composés majeurs (priorité absolue)',
        'Composés secondaires',
        'Isolation (complément)'
      ],

      equipment: {
        catalog: '300+ équipements',
        categories: ['gym', 'home', 'outdoor'],
        adaptation: 'Intelligent equipment matching'
      }
    }
  }
};
```

### Prompt Versioning

```typescript
// Version management for A/B testing and rollback
export const promptRegistry = {
  'coach-force': {
    'v1.0.0': coachForcePromptV1,
    'v1.1.0': coachForcePromptV1_1, // Future iterations
    active: 'v1.0.0'
  }
};
```

### Context Injection

```typescript
function buildCoachContext(user: User, session: Session): string {
  return `
## Contexte Utilisateur
- Niveau: ${user.fitnessLevel}
- Objectif: ${user.trainingGoal}
- Expérience: ${user.trainingAge} mois
- Disponibilité: ${session.context.availableTime} minutes
- Énergie: ${session.context.energy}/10
- Équipement: ${session.context.equipment.join(', ')}
- Douleurs: ${session.context.painAreas.join(', ') || 'Aucune'}

## Historique Récent
${formatRecentSessions(user.recentSessions)}

## Progression Actuelle
${formatProgressionMetrics(user.progression)}
  `;
}
```

---

## Context Collection

### Step 1: Pre-Session Context

**Edge Function**: `training-context-collector`

**Collected Data**:
```typescript
interface PreSessionContext {
  // Immediate state
  energy: number;              // 1-10 scale
  availableTime: number;        // minutes
  readiness: number;            // 1-10 scale

  // Location & equipment
  locationId: string;
  locationType: 'home' | 'gym' | 'outdoor';
  availableEquipment: string[];

  // Physical state
  painAreas: string[];
  soreness: Record<string, number>; // muscle group -> 1-10

  // Recovery metrics
  sleepQuality: number;         // 1-10 scale
  stressLevel: number;          // 1-10 scale
  nutritionStatus: 'fasted' | 'fed' | 'post-meal';

  // Notes
  userNotes?: string;
}
```

### Context Optimization

**Function**: `trainingContextOptimizationService.ts`

**Optimization Steps**:
1. Load user profile (fitness level, goals, preferences)
2. Fetch recent training sessions (last 7 days)
3. Calculate recovery status (time since last session, muscle groups trained)
4. Load available equipment from location
5. Aggregate into optimized context object

**Recovery Intelligence**:
```typescript
function calculateRecoveryStatus(
  recentSessions: TrainingSession[],
  timeSinceLastSession: number
): RecoveryStatus {
  const muscleGroupRecovery = calculateMuscleGroupRecovery(recentSessions);
  const systemicRecovery = timeSinceLastSession / 24; // hours to recovery score

  return {
    ready: muscleGroupRecovery > 0.8 && systemicRecovery > 0.7,
    muscleGroups: muscleGroupRecovery,
    systemic: systemicRecovery,
    recommendation: getRecoveryRecommendation(muscleGroupRecovery, systemicRecovery)
  };
}
```

---

## Prescription Generation

### Edge Function: training-coach-force

**Input Contract**:
```typescript
interface CoachForceInput {
  userId: string;
  context: PreSessionContext;
  profile: UserProfile;
  progression: ProgressionData;
  preferences: TrainingPreferences;
}
```

**Output Contract**:
```typescript
interface CoachForcePrescription {
  sessionType: 'strength' | 'hypertrophy' | 'power' | 'deload';
  targetDuration: number;
  estimatedRPE: number;

  warmup: Exercise[];
  main: Exercise[];
  cooldown: Exercise[];

  totalVolume: number;          // sets × reps × load
  intensityAverage: number;     // average %1RM

  substitutions: Record<string, Exercise[]>;
  coachNotes: string;
  progressionNotes: string;
}

interface Exercise {
  id: string;
  name: string;
  category: 'compound-major' | 'compound-secondary' | 'isolation';
  primaryMuscles: string[];
  secondaryMuscles: string[];

  // Prescription
  sets: number;
  reps: number | string;        // "8-12" or "10"
  load: number | string;         // kg or "%1RM" or "BW" or "AMRAP"
  tempo: string;                 // "3-0-1-0" (eccentric-pause-concentric-pause)
  rest: number;                  // seconds
  targetRPE: number;             // 1-10

  // Equipment
  equipment: string[];
  requiredEquipment: string[];

  // Execution notes
  cues: string[];
  setupInstructions?: string;
  videoUrl?: string;
}
```

### Generation Logic Flow

```typescript
async function generatePrescription(input: CoachForceInput): Promise<CoachForcePrescription> {
  // 1. Determine session type based on context and progression
  const sessionType = determineSessionType(input);

  // 2. Select exercises based on equipment and training type
  const exercises = selectExercises({
    sessionType,
    equipment: input.context.availableEquipment,
    availableTime: input.context.availableTime,
    recentSessions: input.progression.recentSessions,
    muscleGroupBalance: input.progression.muscleGroupVolume
  });

  // 3. Calculate loads based on progression model
  const loads = calculateLoads(exercises, input.profile, input.progression);

  // 4. Structure workout (warmup, main, cooldown)
  const structured = structureWorkout(exercises, loads, sessionType);

  // 5. Generate substitutions for each main exercise
  const substitutions = generateSubstitutions(structured.main, input.context.availableEquipment);

  // 6. Add coach notes and progression guidance
  const coachNotes = generateCoachNotes(structured, input);

  return {
    ...structured,
    substitutions,
    coachNotes,
    progressionNotes: generateProgressionNotes(input.progression)
  };
}
```

---

## Exercise Selection Logic

### Hierarchy Priority

```typescript
const exerciseSelectionHierarchy = {
  // Tier 1: Always include 1-2 major compounds
  majorCompounds: {
    priority: 1,
    exercises: [
      'Squat', 'Bench Press', 'Deadlift',
      'Overhead Press', 'Barbell Row'
    ],
    minPerSession: 1,
    maxPerSession: 2
  },

  // Tier 2: Include 2-3 secondary compounds
  secondaryCompounds: {
    priority: 2,
    exercises: [
      'Lunges', 'Dips', 'Pull-ups', 'Romanian Deadlift',
      'Incline Press', 'T-Bar Row', 'Hip Thrust'
    ],
    minPerSession: 2,
    maxPerSession: 4
  },

  // Tier 3: Include 2-4 isolation movements
  isolation: {
    priority: 3,
    exercises: [
      'Bicep Curl', 'Tricep Extension', 'Lateral Raise',
      'Leg Curl', 'Leg Extension', 'Calf Raise'
    ],
    minPerSession: 0,
    maxPerSession: 4
  }
};
```

### Equipment Matching Algorithm

```typescript
function matchExerciseToEquipment(
  exercise: Exercise,
  availableEquipment: string[]
): ExerciseMatch {
  // 1. Check if all required equipment is available
  const hasRequired = exercise.requiredEquipment.every(
    eq => availableEquipment.includes(eq)
  );

  if (hasRequired) {
    return { match: 'perfect', exercise };
  }

  // 2. Find alternative exercises with same muscle groups
  const alternatives = findAlternativeExercises(
    exercise.primaryMuscles,
    availableEquipment
  );

  if (alternatives.length > 0) {
    return { match: 'alternative', exercise: alternatives[0], alternatives };
  }

  // 3. Find progression/regression with available equipment
  const adaptations = findExerciseAdaptations(exercise, availableEquipment);

  if (adaptations.length > 0) {
    return { match: 'adapted', exercise: adaptations[0], adaptations };
  }

  // 4. No match found
  return { match: 'none', exercise: null };
}
```

### Muscle Group Balancing

```typescript
function balanceMuscleGroups(
  selectedExercises: Exercise[],
  recentVolume: Record<string, number>
): Exercise[] {
  // Calculate current session volume by muscle group
  const currentVolume = calculateVolumeByMuscleGroup(selectedExercises);

  // Calculate total volume (recent + current)
  const totalVolume = mergeVolumes(recentVolume, currentVolume);

  // Identify under-trained muscle groups
  const underTrained = identifyUnderTrainedGroups(totalVolume);

  // Add exercises to target under-trained groups
  if (underTrained.length > 0) {
    const additionalExercises = selectExercisesForMuscleGroups(underTrained);
    return [...selectedExercises, ...additionalExercises];
  }

  return selectedExercises;
}
```

---

## Progression Strategies

### Beginner: Linear Progression

```typescript
function calculateLinearProgression(
  exercise: Exercise,
  lastPerformance: Performance
): Progression {
  // Simple load increase if all reps completed
  if (lastPerformance.repsCompleted >= lastPerformance.targetReps) {
    return {
      load: lastPerformance.load + 2.5, // kg
      sets: lastPerformance.sets,
      reps: lastPerformance.reps,
      reason: 'Completed all reps, increasing load'
    };
  }

  // Maintain if close to target
  if (lastPerformance.repsCompleted >= lastPerformance.targetReps * 0.9) {
    return {
      load: lastPerformance.load,
      sets: lastPerformance.sets,
      reps: lastPerformance.reps,
      reason: 'Maintaining load, build consistency'
    };
  }

  // Decrease if significant failure
  return {
    load: lastPerformance.load * 0.9,
    sets: lastPerformance.sets,
    reps: lastPerformance.reps,
    reason: 'Reducing load, focus on form'
  };
}
```

### Intermediate: Wave Loading

```typescript
function calculateWaveProgression(
  exercise: Exercise,
  lastCycle: Performance[],
  weekInCycle: number
): Progression {
  const baseLoad = calculateEstimated1RM(lastCycle);

  // 3-week wave
  const waveIntensity = {
    1: 0.75, // 75% 1RM, 8 reps
    2: 0.80, // 80% 1RM, 6 reps
    3: 0.85  // 85% 1RM, 4 reps
  };

  const intensity = waveIntensity[weekInCycle];
  const reps = weekInCycle === 1 ? 8 : weekInCycle === 2 ? 6 : 4;

  return {
    load: baseLoad * intensity,
    sets: 4,
    reps,
    reason: `Wave loading week ${weekInCycle}/3`
  };
}
```

### Advanced: Block Periodization

```typescript
function calculateBlockProgression(
  exercise: Exercise,
  currentBlock: Block,
  weekInBlock: number
): Progression {
  const blocks = {
    accumulation: {
      weeks: 4,
      intensity: [0.70, 0.72, 0.75, 0.77],
      volume: 'high',
      reps: [8, 8, 6, 6],
      sets: 5
    },
    intensification: {
      weeks: 4,
      intensity: [0.80, 0.82, 0.85, 0.87],
      volume: 'medium',
      reps: [5, 5, 4, 4],
      sets: 4
    },
    realization: {
      weeks: 3,
      intensity: [0.88, 0.92, 0.95],
      volume: 'low',
      reps: [3, 2, 1],
      sets: 3
    }
  };

  const blockConfig = blocks[currentBlock];
  const baseLoad = exercise.estimated1RM;

  return {
    load: baseLoad * blockConfig.intensity[weekInBlock - 1],
    sets: blockConfig.sets,
    reps: blockConfig.reps[weekInBlock - 1],
    reason: `${currentBlock} block, week ${weekInBlock}/${blockConfig.weeks}`
  };
}
```

### Auto-Regulation (RPE-Based)

```typescript
function calculateRPEBasedProgression(
  exercise: Exercise,
  lastSession: Session,
  targetRPE: number = 8
): Progression {
  const lastRPE = lastSession.actualRPE;
  const lastLoad = lastSession.load;

  // RPE too low → increase load
  if (lastRPE < targetRPE - 1) {
    return {
      load: lastLoad * 1.05, // +5%
      sets: lastSession.sets,
      reps: lastSession.reps,
      targetRPE,
      reason: 'RPE too low, increasing intensity'
    };
  }

  // RPE on target → maintain or slight increase
  if (lastRPE >= targetRPE - 1 && lastRPE <= targetRPE) {
    return {
      load: lastLoad * 1.025, // +2.5%
      sets: lastSession.sets,
      reps: lastSession.reps,
      targetRPE,
      reason: 'RPE on target, progressive overload'
    };
  }

  // RPE too high → reduce load
  return {
    load: lastLoad * 0.95, // -5%
    sets: lastSession.sets,
    reps: lastSession.reps,
    targetRPE,
    reason: 'RPE too high, adjusting intensity'
  };
}
```

---

## Equipment Adaptation

### Home Gym Adaptations

```typescript
const homeGymAdaptations = {
  'Barbell Back Squat': [
    { equipment: ['adjustable-dumbbells'], alternative: 'Goblet Squat' },
    { equipment: ['resistance-bands'], alternative: 'Banded Squat' },
    { equipment: ['bodyweight'], alternative: 'Pistol Squat Progression' }
  ],

  'Bench Press': [
    { equipment: ['dumbbells', 'bench'], alternative: 'Dumbbell Bench Press' },
    { equipment: ['dumbbells', 'floor'], alternative: 'Floor Press' },
    { equipment: ['bodyweight'], alternative: 'Push-up Variations' }
  ],

  'Deadlift': [
    { equipment: ['dumbbells'], alternative: 'Dumbbell Romanian Deadlift' },
    { equipment: ['kettlebell'], alternative: 'Kettlebell Deadlift' },
    { equipment: ['resistance-bands'], alternative: 'Banded Good Morning' }
  ]
};
```

### Outdoor Adaptations

```typescript
const outdoorAdaptations = {
  'Pull-ups': [
    { equipment: ['public-pull-up-bar'], alternative: 'Pull-ups' },
    { equipment: ['tree-branch'], alternative: 'Branch Pull-ups' },
    { equipment: ['resistance-bands'], alternative: 'Banded Lat Pulldown' }
  ],

  'Dips': [
    { equipment: ['parallel-bars'], alternative: 'Parallel Bar Dips' },
    { equipment: ['public-bench'], alternative: 'Bench Dips' },
    { equipment: ['stairs'], alternative: 'Stair Dips' }
  ],

  'Squats': [
    { equipment: ['stairs'], alternative: 'Stair Sprints / Step-ups' },
    { equipment: ['hill'], alternative: 'Hill Sprints' },
    { equipment: ['bodyweight'], alternative: 'Jump Squats' }
  ]
};
```

---

## Performance Analysis

### Step 4: Post-Session Analysis

**Edge Function**: `training-coach-analyzer`

**Metrics Calculated**:
```typescript
interface SessionAnalysis {
  // Volume metrics
  totalVolume: number;          // sets × reps × load
  volumePerMuscle: Record<string, number>;

  // Intensity metrics
  averageIntensity: number;     // average %1RM
  peakIntensity: number;        // max %1RM
  averageRPE: number;

  // Performance metrics
  completionRate: number;       // % of prescribed work completed
  techniqueScore: number;       // AI-evaluated form (if available)
  pacing: 'too-fast' | 'optimal' | 'too-slow';

  // Progression indicators
  personalRecords: PR[];
  volumePRs: VolumePR[];

  // Recovery indicators
  predictedRecoveryTime: number; // hours
  nextSessionRecommendation: Date;
  muscleGroupsToAvoid: string[];
}
```

### Insight Generation

```typescript
function generateInsights(analysis: SessionAnalysis): Insight[] {
  const insights: Insight[] = [];

  // Volume insight
  if (analysis.totalVolume > previousAverage * 1.2) {
    insights.push({
      type: 'volume',
      level: 'positive',
      message: 'Excellent volume progression! You\'re pushing your limits.',
      metric: analysis.totalVolume
    });
  }

  // Intensity insight
  if (analysis.averageRPE > 8.5) {
    insights.push({
      type: 'intensity',
      level: 'warning',
      message: 'High average RPE. Consider deload next session.',
      recommendation: 'Reduce intensity by 10-15% next session'
    });
  }

  // Technique insight (if available)
  if (analysis.techniqueScore < 7) {
    insights.push({
      type: 'technique',
      level: 'warning',
      message: 'Form breakdown detected on heavy sets.',
      recommendation: 'Reduce load and focus on technique'
    });
  }

  // Personal records
  if (analysis.personalRecords.length > 0) {
    insights.push({
      type: 'achievement',
      level: 'positive',
      message: `${analysis.personalRecords.length} new PRs! Great work!`,
      details: analysis.personalRecords
    });
  }

  return insights;
}
```

### Badge System

```typescript
const badges = {
  volume: [
    { id: 'volume-warrior', threshold: 50000, name: 'Volume Warrior' },
    { id: 'volume-titan', threshold: 100000, name: 'Volume Titan' }
  ],

  consistency: [
    { id: 'week-streak-4', threshold: 4, name: '4-Week Streak' },
    { id: 'week-streak-8', threshold: 8, name: '8-Week Streak' }
  ],

  strength: [
    { id: 'squat-bw-2x', condition: 'squat >= bodyweight * 2', name: '2x Bodyweight Squat' },
    { id: 'bench-bw-1.5x', condition: 'bench >= bodyweight * 1.5', name: '1.5x Bodyweight Bench' }
  ],

  technique: [
    { id: 'perfect-form-10', threshold: 10, name: 'Perfect Form (10 sessions)' }
  ]
};
```

---

## Integration Points

### Frontend Integration

**Store**: `trainingPipelineStore`

```typescript
// Step 2: Load prescription
const prescription = await trainingGenerationService.generatePrescription({
  userId,
  context: step1Data,
  profile,
  progression
});

trainingPipelineStore.setState({ sessionPrescription: prescription });
```

**Coach Chat**: `CoachChatInterface.tsx`

```typescript
// Interactive coaching conversation
const handleCoachMessage = async (userMessage: string) => {
  const response = await chatAiService.sendMessage({
    conversationId,
    message: userMessage,
    context: {
      prescription: trainingPipelineStore.sessionPrescription,
      step: 'activate'
    }
  });

  coachChatStore.addMessage(response);
};
```

### Backend Integration

**Context Collection**:
```typescript
// Optimized context for AI
const context = await trainingContextOptimizationService.collectContext(userId);
```

**Prescription Generation**:
```typescript
// Generate via edge function
const prescription = await fetch(
  `${supabaseUrl}/functions/v1/training-coach-force`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, context })
  }
);
```

**Analysis**:
```typescript
// Analyze completed session
const analysis = await fetch(
  `${supabaseUrl}/functions/v1/training-coach-analyzer`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sessionId, userId })
  }
);
```

---

## Performance & Optimization

### Caching Strategy

```typescript
// Cache prescription for re-use during session
const cacheKey = `prescription:${userId}:${sessionId}`;
await cache.set(cacheKey, prescription, { ttl: 7200 }); // 2 hours

// Cache analysis results
const analysisKey = `analysis:${sessionId}`;
await cache.set(analysisKey, analysis, { ttl: 86400 }); // 24 hours
```

### Cost Optimization

**Token Usage**:
- Prescription generation: ~2,000-3,000 tokens
- Analysis: ~1,500-2,500 tokens
- Cost per session: ~$0.01-0.02

**Optimization Techniques**:
1. Context compression (remove redundant data)
2. Prompt caching (reuse common prompts)
3. Batch processing (analyze multiple exercises together)

---

**Document Version**: 1.0.0
**Next Review**: Post Multi-Coach Implementation
**Maintained By**: TwinForge AI Team

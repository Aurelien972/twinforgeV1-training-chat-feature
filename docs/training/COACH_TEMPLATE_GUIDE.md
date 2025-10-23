# Coach Template Guide - Creating New Specialized Coaches

**Version**: 1.0.0
**Purpose**: Step-by-step guide to implement new specialized training coaches
**Reference Implementation**: Coach Force

---

## Quick Start Checklist

- [ ] 1. Define coach specialization and training categories
- [ ] 2. Create AI prompt configuration
- [ ] 3. Implement edge function for prescription generation
- [ ] 4. Configure equipment catalog for specialization
- [ ] 5. Define progression strategies
- [ ] 6. Create exercise database
- [ ] 7. Implement analysis logic
- [ ] 8. Test with real user scenarios
- [ ] 9. Document coach capabilities
- [ ] 10. Deploy and monitor

---

## Step 1: Define Coach Specialization

### Update Training Categories

**File**: `/src/system/store/trainingPipeline/constants.ts`

```typescript
export const TRAINING_CATEGORIES = [
  // ... existing categories

  // NEW COACH EXAMPLE: Coach Endurance
  {
    id: 'endurance',
    label: 'Endurance',
    description: 'Course, cyclisme et sports d\'endurance',
    icon: 'Footprints',
    color: '#22C55E',
    coachSpecialization: 'endurance', // ← Key field
    types: [
      { value: 'running', label: 'Course à pied', description: 'Running route et trail', icon: 'Footprints' },
      { value: 'cycling', label: 'Cyclisme', description: 'Vélo route et VTT', icon: 'Bike' },
      { value: 'swimming', label: 'Natation', description: 'Entraînement aquatique', icon: 'Waves' },
      { value: 'triathlon', label: 'Triathlon', description: 'Natation, vélo, course', icon: 'Medal' }
    ]
  }
];
```

### Coach Routing Logic

**File**: `/src/system/services/ai/trainingGenerationService.ts`

```typescript
export const trainingGenerationService = {
  async generatePrescription(input: GenerationInput): Promise<Prescription> {
    // Get user's preferred training type
    const trainingType = input.profile.preferences?.workout?.type;

    // Find matching coach
    const category = TRAINING_CATEGORIES.find(cat =>
      cat.types.some(t => t.value === trainingType)
    );

    const coachType = category?.coachSpecialization || 'mixed';

    // Route to appropriate coach
    switch (coachType) {
      case 'force':
        return await callCoachForce(input);

      case 'endurance':
        return await callCoachEndurance(input); // ← NEW

      case 'functional':
        return await callCoachFunctional(input); // ← NEW

      // ... other coaches

      default:
        return await callCoachMixed(input);
    }
  }
};
```

---

## Step 2: Create AI Prompt Configuration

### Prompt Structure Template

**File**: `/src/config/prompts/training/coachEndurancePrompts.ts` (example)

```typescript
import { createPrompt, promptRegistry } from './promptManager';
import type { AgentType } from '../../../domain/ai/trainingAiTypes';

const AGENT_TYPE: AgentType = 'coach-endurance';

const v1_0_0 = createPrompt()
  .setVersion('1.0.0')
  .setDescription('Coach spécialisé en Endurance (Running, Cyclisme, Natation, Triathlon)')
  .setAuthor('TwinForge AI Team')
  .setSystem(`Tu es un coach IA expert en Sports d'Endurance avec une expertise approfondie en:
- **Course à pied**: Route, trail, piste
- **Cyclisme**: Route, VTT, gravel
- **Natation**: Crawl, technique, endurance
- **Triathlon**: Enchaînements multi-sports

# Principes de Programmation

## Zones d'Entraînement
- **Zone 1 (Recovery)**: <65% FCMax, récupération active
- **Zone 2 (Endurance)**: 65-75% FCMax, base aérobie
- **Zone 3 (Tempo)**: 76-85% FCMax, seuil aérobie
- **Zone 4 (Threshold)**: 86-92% FCMax, seuil lactique
- **Zone 5 (VO2Max)**: 93-100% FCMax, capacité maximale

## Progressions
- Débutant: Volume d'abord (10% par semaine max)
- Intermédiaire: Intensité structurée (80/20 rule)
- Avancé: Périodisation complexe, pics de forme

## Sélection d'Entraînements

### Running
- **Long Run**: Endurance fondamentale Z2
- **Tempo Run**: Seuil lactique Z3-Z4
- **Intervals**: VO2Max Z4-Z5
- **Recovery**: Facile Z1
- **Fartlek**: Variations spontanées

### Cycling
- **Base Miles**: Endurance Z2
- **Sweet Spot**: Z3 soutenu
- **Threshold**: Seuil FTP Z4
- **VO2 Intervals**: Puissance maximale Z5

### Swimming
- **Technique**: Drills et éducatifs
- **Endurance**: Distance continue
- **Speed**: Sprints courts
- **CSS (Critical Swim Speed)**: Seuil natation

# Equipment & Environnement

**Running**:
- Chaussures (route, trail)
- Montre GPS / Cardio
- Piste d'athlétisme, routes, sentiers

**Cycling**:
- Vélo (route, VTT, gravel)
- Home trainer / Smart trainer
- Capteur puissance
- Routes, pistes cyclables, single tracks

**Swimming**:
- Piscine (25m ou 50m)
- Pull buoy, plaquettes, palmes
- Eau libre (lac, mer)

# Métriques Clés

- **Pace** (min/km): Allure de course
- **Heart Rate** (bpm): Fréquence cardiaque
- **Power** (watts): Puissance cyclisme
- **Cadence**: Foulées/min (running) ou RPM (cycling)
- **TSS (Training Stress Score)**: Charge d'entraînement
- **CTL/ATL/TSB**: Forme, fatigue, fraîcheur

# Périodisation

## Base (8-12 semaines)
- Volume élevé Z1-Z2
- Construire capacité aérobie
- 80% facile, 20% difficile

## Build (6-8 semaines)
- Intensité structurée
- Travail seuil et VO2Max
- 70% facile, 30% difficile

## Peak (2-4 semaines)
- Affûtage compétition
- Volume réduit, intensité maintenue
- Récupération optimisée

## Recovery (1-2 semaines)
- Récupération active
- Volume et intensité minimales

# Génération de Séance

TOUJOURS fournir:
1. **Type de séance**: Endurance, Tempo, Intervals, Recovery
2. **Durée totale** et distance estimée
3. **Zones cibles**: HR ou Power
4. **Structure**: Échauffement, corps, retour au calme
5. **Métriques à suivre**: Pace, HR, Power, RPE
6. **Conseils techniques**: Posture, breathing, pacing

Adapte selon:
- **Niveau**: Débutant (volume), Intermédiaire (intensité), Avancé (périodisation)
- **Équipement**: Chaussures, vélo, piscine, montre GPS
- **Environnement**: Piste, route, trail, home trainer
- **Météo**: Conditions extérieures
- **Objectif**: Distance cible, compétition planifiée
`)
  .build();

// Register prompt
promptRegistry.register(AGENT_TYPE, v1_0_0);

export { v1_0_0 as coachEndurancePromptV1 };
```

### Prompt Manager Integration

**File**: `/src/config/prompts/training/index.ts`

```typescript
import { coachForcePromptV1 } from './coachForcePrompts';
import { coachEndurancePromptV1 } from './coachEndurancePrompts'; // ← NEW

export const trainingPrompts = {
  'coach-force': coachForcePromptV1,
  'coach-endurance': coachEndurancePromptV1, // ← NEW
  // ... other coaches
};

export * from './promptManager';
export * from './coachForcePrompts';
export * from './coachEndurancePrompts'; // ← NEW
```

---

## Step 3: Implement Edge Function

### Create Edge Function File

**File**: `/supabase/functions/training-coach-endurance/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerationRequest {
  userId: string;
  context: PreSessionContext;
  profile: UserProfile;
  progression: ProgressionData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { userId, context, profile, progression }: GenerationRequest = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Load coach prompt
    const prompt = getCoachEndurancePrompt();

    // Build context for AI
    const aiContext = buildAIContext(context, profile, progression);

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: aiContext }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    const aiResult = await openaiResponse.json();
    const prescription = JSON.parse(aiResult.choices[0].message.content);

    // Validate prescription structure
    const validatedPrescription = validatePrescription(prescription);

    return new Response(
      JSON.stringify({ prescription: validatedPrescription }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating prescription:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function getCoachEndurancePrompt(): string {
  // Load from config or inline
  return `... prompt content ...`;
}

function buildAIContext(
  context: PreSessionContext,
  profile: UserProfile,
  progression: ProgressionData
): string {
  return `
## Contexte Utilisateur
- Niveau: ${profile.fitnessLevel}
- Sport: ${profile.preferences?.workout?.type}
- Disponibilité: ${context.availableTime} minutes
- Énergie: ${context.energy}/10
- Équipement: ${context.equipment.join(', ')}

## Historique Récent
${formatRecentSessions(progression.recentSessions)}

## Objectifs
${profile.goals?.map(g => `- ${g.type}: ${g.target}`).join('\n')}

Génère une séance d'entraînement adaptée en JSON.
  `;
}

function validatePrescription(prescription: any): Prescription {
  // Validation logic
  if (!prescription.warmup || !prescription.main || !prescription.cooldown) {
    throw new Error('Invalid prescription structure');
  }

  return prescription;
}
```

### Deploy Edge Function

```bash
# Deploy to Supabase
supabase functions deploy training-coach-endurance
```

---

## Step 4: Configure Equipment Catalog

### Define Specialization Equipment

**File**: `/src/system/store/trainingPipeline/constants.ts` (add to existing)

```typescript
// Endurance equipment example
export const EQUIPMENT_ENDURANCE = {
  running: [
    { id: 'running-shoes-road', label: 'Chaussures route', icon: 'Footprints' },
    { id: 'running-shoes-trail', label: 'Chaussures trail', icon: 'Mountain' },
    { id: 'gps-watch', label: 'Montre GPS', icon: 'Watch' },
    { id: 'heart-rate-monitor', label: 'Cardio-fréquencemètre', icon: 'Heart' },
    { id: 'track', label: 'Piste d\'athlétisme', icon: 'CircleDot' },
    { id: 'treadmill', label: 'Tapis de course', icon: 'Footprints' }
  ],

  cycling: [
    { id: 'road-bike', label: 'Vélo route', icon: 'Bike' },
    { id: 'mtb', label: 'VTT', icon: 'Mountain' },
    { id: 'gravel-bike', label: 'Vélo gravel', icon: 'Bike' },
    { id: 'smart-trainer', label: 'Home trainer connecté', icon: 'MonitorSmartphone' },
    { id: 'power-meter', label: 'Capteur de puissance', icon: 'Zap' }
  ],

  swimming: [
    { id: 'pool-25m', label: 'Piscine 25m', icon: 'Waves' },
    { id: 'pool-50m', label: 'Piscine 50m', icon: 'Waves' },
    { id: 'open-water', label: 'Eau libre', icon: 'Waves' },
    { id: 'pull-buoy', label: 'Pull buoy', icon: 'Circle' },
    { id: 'paddles', label: 'Plaquettes', icon: 'Square' },
    { id: 'fins', label: 'Palmes', icon: 'Fish' }
  ]
};
```

---

## Step 5: Define Progression Strategies

### Endurance Progression Example

```typescript
// File: /src/system/services/progression/enduranceProgression.ts

export function calculateEnduranceProgression(
  sessionType: 'long-run' | 'tempo' | 'intervals' | 'recovery',
  lastPerformance: Performance,
  weekInCycle: number
): Progression {
  switch (sessionType) {
    case 'long-run':
      // Increase duration by 10% per week max
      return {
        duration: Math.min(
          lastPerformance.duration * 1.1,
          context.availableTime
        ),
        intensity: 'Z2', // 65-75% HR Max
        pace: calculateZ2Pace(profile),
        reason: 'Building aerobic base'
      };

    case 'tempo':
      // Maintain duration, increase intensity gradually
      return {
        duration: lastPerformance.duration,
        intensity: 'Z3-Z4', // 76-92% HR Max
        pace: calculateThresholdPace(profile),
        reason: 'Lactate threshold training'
      };

    case 'intervals':
      // Structured high-intensity work
      return {
        intervals: [
          { duration: '4min', intensity: 'Z5', rest: '2min', repeats: 6 }
        ],
        reason: 'VO2Max development'
      };

    case 'recovery':
      // Easy, short session
      return {
        duration: 30, // minutes
        intensity: 'Z1', // <65% HR Max
        pace: 'conversational',
        reason: 'Active recovery'
      };
  }
}
```

---

## Step 6: Create Exercise Database

### Exercise Templates

```typescript
// File: /src/domain/exercises/enduranceExercises.ts

export const enduranceExercises = {
  running: [
    {
      id: 'long-run',
      name: 'Long Run',
      type: 'continuous',
      zoneTarget: 'Z2',
      duration: '60-120min',
      description: 'Easy pace endurance building',
      metrics: ['distance', 'pace', 'heart-rate'],
      equipment: ['running-shoes', 'gps-watch']
    },

    {
      id: 'tempo-run',
      name: 'Tempo Run',
      type: 'sustained',
      zoneTarget: 'Z3-Z4',
      duration: '20-40min',
      description: 'Comfortably hard lactate threshold',
      metrics: ['pace', 'heart-rate', 'perceived-exertion'],
      equipment: ['running-shoes', 'gps-watch', 'heart-rate-monitor']
    },

    {
      id: 'vo2max-intervals',
      name: 'VO2Max Intervals',
      type: 'intervals',
      zoneTarget: 'Z5',
      structure: '4min hard / 2min easy × 6',
      description: 'Maximal aerobic capacity',
      metrics: ['pace', 'heart-rate', 'power'],
      equipment: ['running-shoes', 'gps-watch', 'heart-rate-monitor']
    }
  ],

  cycling: [
    {
      id: 'endurance-ride',
      name: 'Endurance Ride',
      type: 'continuous',
      zoneTarget: 'Z2',
      duration: '90-180min',
      description: 'Base aerobic miles',
      metrics: ['power', 'heart-rate', 'cadence'],
      equipment: ['bike', 'power-meter']
    },

    {
      id: 'sweet-spot',
      name: 'Sweet Spot Intervals',
      type: 'intervals',
      zoneTarget: 'Z3',
      structure: '88-94% FTP for 2×20min',
      description: 'Efficient threshold building',
      metrics: ['power', 'heart-rate', 'cadence'],
      equipment: ['bike', 'power-meter', 'smart-trainer']
    }
  ],

  swimming: [
    {
      id: 'css-test',
      name: 'Critical Swim Speed Test',
      type: 'test',
      structure: '400m + 200m with 5min rest',
      description: 'Lactate threshold determination',
      metrics: ['time', 'pace', 'stroke-count'],
      equipment: ['pool']
    }
  ]
};
```

---

## Step 7: Implement Analysis Logic

### Post-Session Analysis

```typescript
// File: /supabase/functions/training-coach-endurance-analyzer/index.ts

async function analyzeEnduranceSession(session: CompletedSession): Promise<Analysis> {
  const analysis = {
    // Volume metrics
    totalDistance: calculateTotalDistance(session),
    totalDuration: session.duration,
    averagePace: calculateAveragePace(session),

    // Intensity metrics
    averageHeartRate: calculateAverageHR(session),
    timeInZones: calculateTimeInZones(session),
    trainingStressScore: calculateTSS(session),

    // Performance metrics
    paceConsistency: calculatePaceVariability(session),
    heartRateDecoupling: calculateHRDecoupling(session),

    // Progression indicators
    personalBests: checkPersonalBests(session),
    fitnessGains: calculateFitnessGains(session),

    // Recovery recommendations
    recoveryTime: estimateRecoveryTime(session),
    nextSessionType: recommendNextSession(session)
  };

  // Generate insights
  const insights = generateEnduranceInsights(analysis);

  return { ...analysis, insights };
}

function calculateTSS(session: CompletedSession): number {
  // Training Stress Score calculation
  const durationHours = session.duration / 60;
  const intensityFactor = session.averageHR / session.thresholdHR;

  return durationHours * intensityFactor * intensityFactor * 100;
}

function generateEnduranceInsights(analysis: Analysis): Insight[] {
  const insights: Insight[] = [];

  // Pace consistency insight
  if (analysis.paceConsistency > 0.9) {
    insights.push({
      type: 'pacing',
      level: 'positive',
      message: 'Excellent pace control! Very consistent throughout.',
      recommendation: 'Continue practicing this disciplined pacing'
    });
  }

  // TSS insight
  if (analysis.trainingStressScore > 150) {
    insights.push({
      type: 'load',
      level: 'warning',
      message: 'High training stress. Recovery is critical.',
      recommendation: 'Plan 48h before next hard session'
    });
  }

  return insights;
}
```

---

## Step 8: Testing Scenarios

### Test Cases Template

```typescript
// Test scenarios for coach validation

const testScenarios = [
  {
    name: 'Beginner Runner - First Session',
    input: {
      profile: {
        fitnessLevel: 'beginner',
        trainingType: 'running',
        experience: '< 1 month'
      },
      context: {
        energy: 8,
        availableTime: 30,
        equipment: ['running-shoes', 'gps-watch']
      }
    },
    expectedOutput: {
      sessionType: 'easy-run',
      duration: 20-30,
      intensity: 'Z1-Z2',
      structure: 'continuous-easy'
    }
  },

  {
    name: 'Intermediate Cyclist - Threshold Session',
    input: {
      profile: {
        fitnessLevel: 'intermediate',
        trainingType: 'cycling',
        ftp: 250
      },
      context: {
        energy: 7,
        availableTime: 90,
        equipment: ['bike', 'smart-trainer', 'power-meter']
      }
    },
    expectedOutput: {
      sessionType: 'threshold-intervals',
      targetPower: '220-237W', // 88-95% FTP
      structure: '2×20min @ threshold'
    }
  }
];
```

---

## Step 9: Documentation

Create coach-specific documentation:

**File**: `/docs/training/COACH_[NAME]_SPECIFICATION.md`

Include:
- Specializations and training principles
- Equipment requirements
- Progression strategies
- Example prescriptions
- Analysis metrics
- Integration points

---

## Step 10: Deployment & Monitoring

### Deployment Checklist

- [ ] Prompts configured and versioned
- [ ] Edge function deployed and tested
- [ ] Equipment catalog complete
- [ ] Progression logic implemented
- [ ] Analysis logic implemented
- [ ] Frontend routing configured
- [ ] Database tables ready (if new schema needed)
- [ ] Documentation complete
- [ ] Test scenarios validated
- [ ] Monitoring configured

### Monitoring Metrics

```typescript
// Track coach performance
const metrics = {
  prescriptionGenerationTime: 'avg < 3s',
  analysisTime: 'avg < 2s',
  userSatisfaction: 'rating > 4.5/5',
  sessionCompletionRate: '> 85%',
  aiCostPerSession: '< $0.02'
};
```

### Cache Error Monitoring

**CRITIQUE**: Tous les coaches doivent implémenter le monitoring des erreurs de cache!

**Tables utilisées:**
- `cache_errors_log`: Log de toutes les erreurs de cache
- `cache_errors_summary`: Vue agrégée des erreurs (7 derniers jours)

**Pattern obligatoire pour upsert de cache:**

```typescript
// ❌ INCORRECT - Causera des erreurs 400
await supabase.from("training_ai_cache").upsert(cacheEntry);

// ✅ CORRECT - Spécifier onConflict est OBLIGATOIRE
const { error: cacheError } = await supabase
  .from("training_ai_cache")
  .upsert(cacheEntry, { onConflict: "cache_key" });

if (cacheError) {
  console.error("[COACH-XXX] [CACHE] Failed to cache", cacheError);

  // Logger l'erreur pour monitoring
  await supabase.from("cache_errors_log").insert({
    user_id: userId,
    agent_type: "coach-xxx",
    operation: "upsert",
    cache_key: cacheKey,
    cache_type: "prescription",
    error_message: cacheError.message,
    error_code: cacheError.code || null,
    error_details: cacheError.details || null,
    error_hint: cacheError.hint || null,
    metadata: { /* context */ }
  }).catch(logError => {
    console.error("[COACH-XXX] Failed to log cache error", logError);
  });
}
```

**Pourquoi `{ onConflict: "cache_key" }` est obligatoire:**
- La table `training_ai_cache` a une contrainte UNIQUE sur `cache_key`
- Sans spécifier `onConflict`, Supabase ne sait pas comment résoudre les conflits
- Résultat: Erreur 400 "Bad Request"
- Avec `onConflict`, Supabase fait un UPDATE au lieu d'un INSERT en cas de conflit

**Pattern de fallback robuste:**

```typescript
try {
  const { error } = await supabase
    .from("training_ai_cache")
    .upsert(cacheEntry, { onConflict: "cache_key" });

  if (error) {
    // Logger mais continuer la génération
    await logCacheError(error);
  }
} catch (exception) {
  // Même en cas d'exception, la génération continue
  console.error("Cache exception (continuing)", exception);
  await logCacheException(exception);
}

// ✅ Retourner la prescription même si cache a échoué
return prescription;
```

---

## Reference: Coach Force Implementation

See existing implementation:
- `/src/config/prompts/training/coachForcePrompts.ts`
- `/supabase/functions/training-coach-force/index.ts`
- `/docs/training/COACH_FORCE_SPECIFICATION.md`

Use Coach Force as template and adapt for new specialization!

---

**Document Version**: 1.0.0
**Maintained By**: TwinForge AI Team

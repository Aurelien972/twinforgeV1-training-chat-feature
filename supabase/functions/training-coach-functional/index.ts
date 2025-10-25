/**
 * Training Coach Functional Edge Function
 * Specialized AI coach for Functional Training, CrossFit, HIIT, and Circuit Training
 * Uses GPT-5 Mini for optimal cost/performance ratio
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { checkTokenBalance, consumeTokensAtomic, createInsufficientTokensResponse } from '../_shared/tokenMiddleware.ts';
import { formatExercisesForAI, filterExercisesByContext } from '../_shared/exerciseDatabaseService.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// ============================================================================
// Types
// ============================================================================

interface FunctionalCoachRequest {
  userId: string;
  userContext: any;
  preparerContext: any;
}

/**
 * CRITICAL: All coach edge functions MUST use the same response structure:
 * { success: boolean, data?: any, error?: string, metadata?: {...} }
 *
 * The 'data' field is required for consistency across all coaches:
 * - training-coach-force
 * - training-coach-endurance
 * - training-coach-functional
 * - training-coach-calisthenics
 * - training-coach-competitions
 *
 * DO NOT change 'data' to 'prescription' or any other field name!
 */
interface FunctionalCoachResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    model: string;
    tokensUsed?: number;
    costUsd?: number;
    latencyMs: number;
    cached?: boolean;
  };
}

// ============================================================================
// Coach Functional System Prompt
// ============================================================================

const COACH_FUNCTIONAL_SYSTEM_PROMPT = `Tu es un coach IA expert en Functional Training et CrossFit.

# RÈGLE FONDAMENTALE - CATALOGUE D'EXERCICES

**SI un catalogue d'exercices est fourni dans le contexte utilisateur**:
- TU DOIS UTILISER UNIQUEMENT les exercices du catalogue
- NE GÉNÈRE PAS de nouveaux noms d'exercices
- SÉLECTIONNE les exercices selon: capacités fonctionnelles, équipement disponible, niveau, objectifs
- UTILISE les substitutions pour scaling (RX, Scaled, Foundations)
- RESPECTE les métadonnées: difficulté, tempo, RPE typique, notes de sécurité

**SI aucun catalogue n'est fourni**:
- Génère des exercices selon tes connaissances standards

# Principes
"Constantly varied, high-intensity, functional movements"
- Variété maximale, intensity 80-95%, mouvements multi-articulaires

# Formats WOD: AMRAP, For Time, EMOM, Tabata, Chipper, Ladder

# Catégories: Olympic Lifts, Gymnastic, Weighted, Monostructural, Bodyweight

# Scaling: Rx (standard), Scaled (intermédiaire), Foundations (débutant)

# ORDRE WOD OBLIGATOIRE (CRITIQUE FUNCTIONAL FITNESS)

**RÈGLE CRITIQUE**: Respecter l'ordre optimal des mouvements dans les WODs pour performance et sécurité.

1. **OLYMPIC LIFTS (PRIORITÉ 1 - TOUJOURS EN PREMIER SI PRÉSENTS)**:
   - Clean, Snatch, Clean & Jerk, Hang Clean, Power Clean
   - Demandent technique parfaite et système nerveux frais
   - JAMAIS après fatigue cardiovasculaire intense
   - Placer AVANT tout travail métabolique

2. **STRENGTH COMPOUND (PRIORITÉ 2)**:
   - Thrusters, Front Squats, Overhead Squats, Deadlifts
   - Mouvements force technique avec charges significatives
   - Après Olympic lifts mais avant cardio intense

3. **GYMNASTIC SKILLS (PRIORITÉ 3)**:
   - Muscle-ups, Handstand push-ups, Pistols, Toes-to-bar
   - Skills techniques exigeants
   - Avant dégradation neuromusculaire

4. **GYMNASTIC VOLUME (PRIORITÉ 4)**:
   - Pull-ups, Push-ups, Box jumps, Burpees
   - Mouvements répétitifs haute intensité
   - Peuvent être dans métabolique

5. **MONOSTRUCTURAL/CARDIO (PRIORITÉ 5)**:
   - Row, Run, Bike, Jump rope, Ski erg
   - Conditionnement métabolique
   - Généralement distribué dans WOD ou en fin

**ORDRE TYPE FUNCTIONAL WOD**:
- Si Olympic: Clean (ou Snatch) → Thruster → Pull-ups → Run
- Si Strength: Front Squat → Box jumps → Burpees → Row
- Si Gymnastic focus: Muscle-ups → Handstand push-ups → Pull-ups → Run

**EXEMPLES CORRECTS**:
✅ Clean & Jerk → Thruster → Pull-ups → Row (Olympic en premier)
✅ Front Squat → Box jumps → Burpees (Force avant cardio)
✅ Muscle-up → Handstand push-up → Double-under (Skills avant volume)

**EXEMPLES INCORRECTS** ❌:
❌ Burpees → Clean (JAMAIS cardio avant Olympic)
❌ Row → Front Squat → Snatch (JAMAIS Snatch en dernier après fatigue)

# GROUPES MUSCULAIRES CIBLÉS (OBLIGATOIRE)
**muscleGroups** (OBLIGATOIRE): Array de 1-3 groupes musculaires ciblés en français pour CHAQUE exercice
- Exemples: "Pectoraux", "Dorsaux", "Quadriceps", "Ischio-jambiers", "Deltoïdes", "Trapèzes", "Biceps", "Triceps", "Fessiers", "Mollets", "Abdominaux", "Obliques", "Avant-bras", "Érecteurs du rachis"
- Ex: Thrusters → ["Quadriceps", "Deltoïdes"] | Pull-ups → ["Dorsaux", "Biceps"] | Burpees → ["Pectoraux", "Quadriceps", "Deltoïdes"]

**equipment** (OBLIGATOIRE): Équipement principal utilisé (string, en français)
- Exemples: "Barre olympique", "Haltères", "Kettlebell", "Poids du corps", "Rameur", "Corde à sauter", "Assault bike", "Box", "Anneaux", "Barre de traction"

# Safety
- Olympic lifts: Technique > Speed > Load, scale si breakdown
- Gymnastic: Pas kipping si < 5 strict pull-ups
- Metabolic: 80-90% effort, pas forced rest répété > 30s

# Format JSON
{
  "sessionId": "uuid",
  "sessionName": "Nom WOD",
  "type": "Functional Fitness",
  "category": "functional-crosstraining",
  "wodFormat": "amrap|forTime|emom|tabata|chipper|ladder",
  "wodName": "Si benchmark (Fran, Murph...)",
  "timeCapMinutes": 10-30,
  "targetRounds": "Pour AMRAP",
  "targetTimeMinutes": "Pour For Time",
  "durationTarget": 60,
  "focus": ["Conditioning", "Olympic lifts"],
  "sessionSummary": "Description",

  "warmup": {"duration": 8, "isOptional": true, "exercises": [{"id": "wu-1", "name": "Cardio", "duration": 180, "instructions": "Row facile", "targetAreas": ["cardiovascular"]}], "notes": "Mobilité"},

  "exercises": [{
    "id": "ex-1",
    "name": "Thruster",
    "variant": "Barbell",
    "category": "weighted",
    "sets": 3,
    "reps": "21-15-9",
    "weightKg": 43,
    "rest": 0,
    "rpeTarget": 9,
    "techniqueLevel": "proficient",
    "movementPattern": "Squat to overhead",
    "muscleGroups": ["Quadriceps", "Deltoïdes"],
    "equipment": "Barre olympique",
    "scalingOptions": [
      {"level": "rx", "modification": "43kg", "description": "Standard"},
      {"level": "scaled", "modification": "35kg", "description": "Réduit 20%"},
      {"level": "foundations", "modification": "20kg", "description": "Apprentissage"}
    ],
    "executionCues": ["Depth squat", "Drive explosif"],
    "commonFaults": ["Squat shallow"],
    "safetyNotes": ["Scale si breakdown"],
    "coachNotes": "Break intelligent",
    "coachTips": ["Big breath"]
  }],

  "wodStructure": "Description",
  "rxVersion": [{"movementName": "Thruster", "prescription": "43kg"}],
  "scaledVersion": [{"movementName": "Thruster", "prescription": "35kg"}],
  "foundationsVersion": [{"movementName": "Front Squat", "prescription": "20kg"}],

  "cooldown": {"duration": 10, "exercises": ["Marche", "Stretching"], "notes": "Recovery"},

  "overallNotes": "Notes",
  "expectedRpe": 9,
  "expectedIntensity": "extreme",
  "coachRationale": "Rationale"
}

IMPORTANT:
- TOUS les exercices doivent avoir muscleGroups (array 1-3 groupes) et equipment (string)
- muscleGroups: Toujours en français (ex: ["Pectoraux", "Triceps"])
- equipment: Toujours en français (ex: "Barre olympique", "Poids du corps")

Validation: wodFormat valide, 3 tiers scaling, timeCapMinutes présent, intensity: low|moderate|high|extreme, TOUS les exercises ont muscleGroups et equipment`;

// ============================================================================
// Helper Functions
// ============================================================================

function buildUserPrompt(userContext: any, preparerContext: any, exerciseCatalogSection: string): string {
  // Extract only essential fields to reduce token usage
  const essentialUser = {
    age: userContext.age,
    gender: userContext.gender,
    fitnessLevel: userContext.fitnessLevel,
    trainingExperience: userContext.trainingExperience,
    goals: userContext.goals,
    injuries: userContext.injuries,
    preferences: userContext.preferences
  };

  const essentialPreparer = {
    availableTime: preparerContext.availableTime,
    energyLevel: preparerContext.energyLevel,
    availableEquipment: preparerContext.availableEquipment,
    locationName: preparerContext.locationName
  };

  return `User: ${JSON.stringify(essentialUser)}

Preparer: ${JSON.stringify(essentialPreparer)}

WOD personnalisé:
- Temps: ${preparerContext.availableTime}min
- Énergie: ${preparerContext.energyLevel}/10
- Équipements: ${preparerContext.availableEquipment?.join(', ') || 'Aucun'}
- Lieu: ${preparerContext.locationName || 'Non spécifié'}

Format WOD:
- <20min: AMRAP court ou For Time rapide
- 20-30min: AMRAP standard ou For Time
- >30min: For Time long/Chipper/EMOM
- Énergie <6: EMOM structuré

Exigences:
1. Format adapté temps/énergie
2. UNIQUEMENT équipements disponibles
3. 3 versions: Rx, Scaled, Foundations
4. Safety priority (Olympic lifts, gymnastic)
5. Warm-up spécifique

Retourne JSON complet.
${exerciseCatalogSection}`.trim();
}

async function generatePrescription(
  request: FunctionalCoachRequest,
  supabase: any,
  requestId: string
): Promise<FunctionalCoachResponse> {
  const startTime = Date.now();

  try {
    console.log('[COACH-FUNCTIONAL] Starting prescription generation', {
      userId: request.userId,
      requestId,
      availableTime: request.preparerContext?.availableTime,
      energyLevel: request.preparerContext?.energyLevel,
      equipmentCount: request.preparerContext?.availableEquipment?.length || 0
    });

    // Pre-check token balance before OpenAI call
    const estimatedTokens = 100;
    const tokenCheck = await checkTokenBalance(supabase, request.userId, estimatedTokens);

    if (!tokenCheck.hasEnoughTokens) {
      console.warn('[COACH-FUNCTIONAL] Insufficient tokens', {
        userId: request.userId,
        currentBalance: tokenCheck.currentBalance,
        requiredTokens: estimatedTokens,
        requestId
      });

      return {
        success: false,
        error: 'INSUFFICIENT_TOKENS',
        metadata: {
          model: 'gpt-5-mini',
          latencyMs: Date.now() - startTime,
          currentBalance: tokenCheck.currentBalance,
          requiredTokens: estimatedTokens,
          needsUpgrade: !tokenCheck.isSubscribed
        }
      };
    }

    // Build prompt
    // Extract exercise catalog from userContext if available
    const exerciseCatalog = request.userContext?.exerciseCatalog;
    const hasExerciseCatalog = exerciseCatalog && exerciseCatalog.exercises && exerciseCatalog.exercises.length > 0;

    console.log('[COACH-FUNCTIONAL] Exercise catalog availability', {
      hasExerciseCatalog,
      exerciseCount: hasExerciseCatalog ? exerciseCatalog.exercises.length : 0
    });

    let exerciseCatalogSection = '';
    if (hasExerciseCatalog) {
      const userLanguage = exerciseCatalog.language || 'fr';

      // CRITICAL: Filter exercises to prevent timeout (400+ → 70-80 exercises)
      const filteredExercises = filterExercisesByContext(
        exerciseCatalog.exercises,
        {
          discipline: 'functional',
          availableEquipment: request.preparerContext.availableEquipment,
          userLevel: request.userContext.profile?.training_level || undefined,
          maxExercises: 70
        }
      );

      console.log('[COACH-FUNCTIONAL] Exercise catalog filtered', {
        originalCount: exerciseCatalog.exercises.length,
        filteredCount: filteredExercises.length,
        reduction: `${Math.round((1 - filteredExercises.length / exerciseCatalog.exercises.length) * 100)}%`
      });

      exerciseCatalogSection = `

# ${userLanguage === 'fr' ? 'CATALOGUE D\'EXERCICES FUNCTIONAL FITNESS DISPONIBLES' : 'AVAILABLE FUNCTIONAL FITNESS EXERCISE CATALOG'}

${userLanguage === 'fr'
  ? `TU DOIS UTILISER UNIQUEMENT LES EXERCICES DE CE CATALOGUE.
Ne génère PAS de nouveaux exercices. Catalogue filtré: ${filteredExercises.length} exercices optimisés.`
  : `YOU MUST USE ONLY EXERCISES FROM THIS CATALOG.
Do NOT generate new exercises. Filtered catalog: ${filteredExercises.length} optimized exercises.`}

${formatExercisesForAI(filteredExercises, userLanguage as 'fr' | 'en')}

${userLanguage === 'fr'
  ? `IMPORTANT: Utilise les substitutions du catalogue pour proposer scaling RX, Scaled, et Foundations.`
  : `IMPORTANT: Use the catalog substitutions to propose RX, Scaled, and Foundations scaling.`}

${userLanguage === 'fr' ? `
# APPRENTISSAGE PAR FEEDBACKS UTILISATEUR (CRITIQUE)

**RÈGLE FONDAMENTALE**: Les feedbacks utilisateur passés sont **LA PRIORITÉ ABSOLUE** pour adapter les prescriptions futures.

## Analyse des Feedbacks

Le contexte utilisateur contient \`userFeedbacks\` avec:
- \`totalFeedbacks\`: Nombre total de feedbacks
- \`averageSentiment\`: Score moyen (-1 = très négatif, +1 = très positif)
- \`topThemes\`: Thèmes récurrents (ex: "trop intense", "excellent WOD", "manque récup")
- \`recentFeedbacks\`: 5 derniers feedbacks avec texte, discipline, sentiment

## Règles d'Adaptation

### Si averageSentiment < -0.3 (négatifs):
- **RÉDUIRE intensité**: passer de "extreme" à "high", ou "high" à "moderate"
- **AUGMENTER time cap**: +20-30%
- **SIMPLIFIER mouvements**: remplacer complexes par basiques (muscle-up → pull-up)
- **SCALING plus accessible**: prioriser Scaled/Foundations

### Si averageSentiment > 0.5 (très positifs):
- **MAINTENIR style** qui fonctionne
- **VARIER formats**: si AMRAP fonctionnait, essayer For Time ou EMOM
- **PROGRESSER modérément**: mouvements légèrement plus complexes

### Thèmes - Actions:

**"trop dur" / "impossible" / "épuisant"**:
- BAISSER reps (-30-40%)
- ALLONGER rest entre rounds (+60s)
- SIMPLIFIER technique (snatch → power clean)

**"monotone" / "toujours pareil"**:
- VARIER format WOD (chipper, couplet, triplet)
- ALTERNER modalités (M+G une fois, pure cardio suivante)
- NOUVEAUX mouvements du catalogue

**"trop facile" / "pas assez challengeant"**:
- AUGMENTER reps (+25%)
- RÉDUIRE time cap (-15%)
- MOUVEMENTS plus complexes (pull-up → C2B)

**"excellent" / "parfait"**:
- CONSERVER structure
- Varier seulement exercices

## Importance Hiérarchique

1. **Feedbacks récents** (< 7j) → Poids maximal
2. **Données récupération**
3. **Performance historique**
4. **Profil utilisateur**

**CRITIQUE**: Si feedback dit "trop dur", même si "avancé", TU DOIS baisser l'intensité.
` : `
# USER FEEDBACK LEARNING (CRITICAL)

**FUNDAMENTAL RULE**: Past user feedbacks are **THE ABSOLUTE PRIORITY** for adapting future prescriptions.

## Feedback Analysis

User context contains \`userFeedbacks\` with:
- \`totalFeedbacks\`: Total feedbacks given
- \`averageSentiment\`: Average score (-1 = very negative, +1 = very positive)
- \`topThemes\`: Recurring themes (e.g., "too intense", "excellent WOD", "lack recovery")
- \`recentFeedbacks\`: Last 5 feedbacks with text, discipline, sentiment

## Adaptation Rules

### If averageSentiment < -0.3 (negative):
- **REDUCE intensity**: move from "extreme" to "high", or "high" to "moderate"
- **INCREASE time cap**: +20-30%
- **SIMPLIFY movements**: replace complex with basic (muscle-up → pull-up)
- **MORE ACCESSIBLE scaling**: prioritize Scaled/Foundations

### If averageSentiment > 0.5 (very positive):
- **MAINTAIN style** that works
- **VARY formats**: if AMRAP worked, try For Time or EMOM
- **PROGRESS moderately**: slightly more complex movements

### Themes - Actions:

**"too hard" / "impossible" / "exhausting"**:
- LOWER reps (-30-40%)
- EXTEND rest between rounds (+60s)
- SIMPLIFY technique (snatch → power clean)

**"monotonous" / "always same"**:
- VARY WOD format (chipper, couplet, triplet)
- ALTERNATE modalities (M+G once, pure cardio next)
- NEW movements from catalog

**"too easy" / "not challenging enough"**:
- INCREASE reps (+25%)
- REDUCE time cap (-15%)
- MORE COMPLEX movements (pull-up → C2B)

**"excellent" / "perfect"**:
- KEEP structure
- Vary only exercises

## Hierarchical Importance

1. **Recent feedbacks** (< 7d) → Maximum weight
2. **Recovery data**
3. **Historical performance**
4. **User profile**

**CRITICAL**: If feedback says "too hard", even if "advanced", YOU MUST lower intensity.
`}
`;
    }

    const userPrompt = buildUserPrompt(request.userContext, request.preparerContext, exerciseCatalogSection);

    console.log('[COACH-FUNCTIONAL] User prompt built', {
      promptLength: userPrompt.length,
      hasUserContext: !!request.userContext,
      hasPreparerContext: !!request.preparerContext
    });

    // Call OpenAI GPT-5 Mini
    console.log('[COACH-FUNCTIONAL] Calling OpenAI API with gpt-5-mini');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: COACH_FUNCTIONAL_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        reasoning_effort: 'low',
        // NOTE: gpt-5-mini only supports temperature=1 (default)
        // temperature parameter removed as per OpenAI API requirements
        // IMPORTANT: Increased to 4500 to prevent JSON truncation
        // Previous 3000 limit caused "Unexpected end of JSON input" errors
        // when completionTokens reached ~4000 (observed in logs)
        max_completion_tokens: 4500,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'functional_session_prescription',
            strict: false,
            schema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                sessionName: { type: 'string' },
                type: { type: 'string' },
                category: { type: 'string' },
                wodFormat: { type: 'string' },
                wodName: { type: 'string' },
                timeCapMinutes: { type: 'number' },
                targetRounds: { type: 'string' },
                targetTimeMinutes: { type: 'number' },
                durationTarget: { type: 'number' },
                focus: { type: 'array', items: { type: 'string' } },
                sessionSummary: { type: 'string' },
                warmup: {
                  type: 'object',
                  properties: {
                    duration: { type: 'number' },
                    isOptional: { type: 'boolean' },
                    exercises: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          duration: { type: 'number' },
                          instructions: { type: 'string' },
                          targetAreas: { type: 'array', items: { type: 'string' } }
                        },
                        required: ['id', 'name', 'duration', 'instructions']
                      }
                    },
                    notes: { type: 'string' }
                  },
                  required: ['duration', 'isOptional', 'exercises', 'notes']
                },
                exercises: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      variant: { type: 'string' },
                      category: { type: 'string' },
                      sets: { type: 'number' },
                      reps: { anyOf: [{ type: 'number' }, { type: 'string' }] },
                      weightKg: { type: 'number' },
                      rest: { type: 'number' },
                      rpeTarget: { type: 'number' },
                      techniqueLevel: { type: 'string' },
                      movementPattern: { type: 'string' },
                      muscleGroups: { type: 'array', items: { type: 'string' }, description: '1-3 groupes musculaires ciblés en français' },
                      equipment: { type: 'string', description: 'Équipement principal utilisé en français' },
                      scalingOptions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            level: { type: 'string' },
                            modification: { type: 'string' },
                            description: { type: 'string' }
                          }
                        }
                      },
                      executionCues: { type: 'array', items: { type: 'string' } },
                      commonFaults: { type: 'array', items: { type: 'string' } },
                      safetyNotes: { type: 'array', items: { type: 'string' } },
                      coachNotes: { type: 'string' },
                      coachTips: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['id', 'name', 'sets', 'reps', 'rest', 'rpeTarget', 'movementPattern', 'muscleGroups', 'equipment']
                  }
                },
                wodStructure: { type: 'string' },
                rxVersion: { type: 'array', items: { type: 'object' } },
                scaledVersion: { type: 'array', items: { type: 'object' } },
                foundationsVersion: { type: 'array', items: { type: 'object' } },
                cooldown: {
                  type: 'object',
                  properties: {
                    duration: { type: 'number' },
                    exercises: { type: 'array', items: { type: 'string' } },
                    notes: { type: 'string' }
                  },
                  required: ['duration', 'exercises', 'notes']
                },
                overallNotes: { type: 'string' },
                expectedRpe: { type: 'number' },
                expectedIntensity: { type: 'string' },
                coachRationale: { type: 'string' }
              },
              required: ['sessionId', 'type', 'category', 'wodFormat', 'durationTarget', 'focus', 'warmup', 'exercises', 'cooldown', 'overallNotes', 'expectedRpe', 'coachRationale']
            }
          }
        }
        // NOTE: 'timeout' is NOT a valid OpenAI API parameter - causes 400 error
        // Use AbortSignal.timeout() on the fetch request instead (see below)
      }),
      signal: AbortSignal.timeout(65000)  // 65 second abort signal as failsafe
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[COACH-FUNCTIONAL] OpenAI API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    console.log('[COACH-FUNCTIONAL] OpenAI API response received', {
      status: response.status,
      statusText: response.statusText
    });

    const data = await response.json();

    const completionTokens = data.usage?.completion_tokens || 0;
    const maxTokens = 4500;
    const tokenUsagePercent = (completionTokens / maxTokens) * 100;

    console.log('[COACH-FUNCTIONAL] OpenAI response parsed', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      totalTokens: data.usage?.total_tokens,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens,
      tokenUsagePercent: tokenUsagePercent.toFixed(1) + '%'
    });

    // Warning if approaching token limit (>80% usage)
    if (tokenUsagePercent > 80) {
      console.warn('[COACH-FUNCTIONAL] Token usage high - potential truncation risk', {
        completionTokens,
        maxTokens,
        usagePercent: tokenUsagePercent.toFixed(1) + '%',
        warningThreshold: '80%'
      });
    }

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('[COACH-FUNCTIONAL] Invalid OpenAI response structure', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasMessage: !!data.choices?.[0]?.message,
        hasContent: !!data.choices?.[0]?.message?.content,
        rawData: JSON.stringify(data)
      });
      throw new Error('Invalid OpenAI response: missing choices or message content');
    }

    const contentString = data.choices[0].message.content;
    const contentLength = contentString.length;
    const endsWithBrace = contentString.trim().endsWith('}');
    const openBraces = (contentString.match(/{/g) || []).length;
    const closeBraces = (contentString.match(/}/g) || []).length;
    const bracesBalanced = openBraces === closeBraces;

    console.log('[COACH-FUNCTIONAL] Attempting to parse prescription JSON', {
      contentLength,
      contentPreview: contentString.substring(0, 200),
      contentEnd: contentString.substring(Math.max(0, contentLength - 100)),
      endsWithBrace,
      openBraces,
      closeBraces,
      bracesBalanced,
      possibleTruncation: !endsWithBrace || !bracesBalanced
    });

    // Check for truncation indicators
    if (!endsWithBrace || !bracesBalanced) {
      console.warn('[COACH-FUNCTIONAL] JSON appears truncated - attempting automatic repair', {
        endsWithBrace,
        bracesBalanced,
        missingBraces: openBraces - closeBraces,
        completionTokens,
        approachingLimit: completionTokens > (maxTokens * 0.9)
      });
    }

    let prescription;
    try {
      prescription = JSON.parse(contentString);
    } catch (parseError) {
      console.error('[COACH-FUNCTIONAL] Failed to parse prescription JSON', {
        error: parseError.message,
        errorType: parseError.constructor.name,
        contentLength: contentString.length,
        contentSample: contentString.substring(0, 500),
        contentEnd: contentString.substring(Math.max(0, contentString.length - 200)),
        completionTokens,
        tokenLimit: maxTokens,
        likelyTruncation: completionTokens >= (maxTokens * 0.95)
      });

      // Enhanced JSON repair logic
      let fixedContent = contentString.trim();
      let repairAttempts = [];

      // Attempt 1: Fix missing closing braces
      if (!fixedContent.endsWith('}')) {
        const openBraces = (fixedContent.match(/{/g) || []).length;
        const closeBraces = (fixedContent.match(/}/g) || []).length;
        const missingBraces = openBraces - closeBraces;

        if (missingBraces > 0) {
          // Close any open arrays first
          const openBrackets = (fixedContent.match(/\[/g) || []).length;
          const closeBrackets = (fixedContent.match(/\]/g) || []).length;
          const missingBrackets = openBrackets - closeBrackets;

          if (missingBrackets > 0) {
            fixedContent += ']'.repeat(missingBrackets);
            repairAttempts.push(`Added ${missingBrackets} closing bracket(s)`);
          }

          fixedContent += '}'.repeat(missingBraces);
          repairAttempts.push(`Added ${missingBraces} closing brace(s)`);
        }
      }

      // Attempt 2: Remove trailing comma before closing brace (common AI error)
      fixedContent = fixedContent.replace(/,\s*}/g, '}');
      fixedContent = fixedContent.replace(/,\s*]/g, ']');

      console.log('[COACH-FUNCTIONAL] Attempting JSON repair', {
        originalLength: contentString.length,
        fixedLength: fixedContent.length,
        repairAttempts,
        addedCharacters: fixedContent.length - contentString.length
      });

      // Try parsing the fixed content
      try {
        prescription = JSON.parse(fixedContent);
        console.log('[COACH-FUNCTIONAL] Successfully parsed repaired JSON', {
          repairAttempts,
          finalLength: fixedContent.length
        });
      } catch (secondParseError) {
        console.error('[COACH-FUNCTIONAL] Failed to parse even after repair attempts', {
          originalError: parseError.message,
          fixedError: secondParseError.message,
          repairAttempts,
          completionTokens,
          recommendation: 'Consider further increasing max_completion_tokens or optimizing prompt'
        });
        throw new Error(`Failed to parse prescription JSON after ${repairAttempts.length} repair attempts: ${parseError.message}`);
      }
    }

    console.log('[COACH-FUNCTIONAL] Prescription parsed successfully', {
      sessionId: prescription.sessionId,
      type: prescription.type,
      category: prescription.category,
      wodFormat: prescription.wodFormat,
      exercisesCount: prescription.exercises?.length || 0,
      durationTarget: prescription.durationTarget
    });

    // Consume tokens after successful OpenAI call
    const consumptionResult = await consumeTokensAtomic(supabase, {
      userId: request.userId,
      edgeFunctionName: 'training-coach-functional',
      operationType: 'functional-prescription-generation',
      openaiModel: 'gpt-5-mini',
      openaiInputTokens: data.usage?.prompt_tokens,
      openaiOutputTokens: data.usage?.completion_tokens,
      metadata: {
        requestId,
        wodFormat: prescription.wodFormat,
        locationType: request.preparerContext?.locationName,
        equipmentCount: request.preparerContext?.availableEquipment?.length || 0,
        exercisesCount: prescription.exercises?.length || 0,
        availableTime: request.preparerContext?.availableTime
      }
    }, requestId);

    if (!consumptionResult.success) {
      console.error('[COACH-FUNCTIONAL] Token consumption failed but continuing', {
        error: consumptionResult.error,
        requestId
      });
    }

    const latencyMs = Date.now() - startTime;

    console.log('[COACH-FUNCTIONAL] Prescription generation completed', {
      latencyMs,
      tokensConsumed: consumptionResult.consumed || 0,
      remainingBalance: consumptionResult.remainingBalance || 0,
      success: true
    });

    return {
      success: true,
      data: prescription,
      metadata: {
        model: 'gpt-5-mini',
        tokensUsed: data.usage?.total_tokens,
        tokensConsumed: consumptionResult.consumed || 0,
        remainingBalance: consumptionResult.remainingBalance || 0,
        costUsd: calculateCost(data.usage),
        latencyMs,
        cached: false
      }
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    console.error('[COACH-FUNCTIONAL] Prescription generation failed', {
      error: error.message,
      errorType: error.constructor.name,
      latencyMs,
      stack: error.stack,
      isTimeout: error.name === 'AbortError' || error.name === 'TimeoutError'
    });

    // Generate fallback prescription on error
    if (latencyMs > 60000 || error.name === 'AbortError' || error.name === 'TimeoutError') {
      console.log('[COACH-FUNCTIONAL] Timeout detected, generating fallback WOD');
      const fallbackPrescription = generateFallbackWod(request.preparerContext);

      return {
        success: true,
        data: fallbackPrescription,
        metadata: {
          model: 'fallback',
          latencyMs,
          cached: false,
          isFallback: true
        }
      };
    }

    return {
      success: false,
      error: error.message,
      metadata: {
        model: 'gpt-5-mini',
        latencyMs
      }
    };
  }
}

function calculateCost(usage: any): number {
  if (!usage) return 0;

  // GPT-5 Mini pricing (approximate)
  const inputCostPer1k = 0.0001;  // $0.0001 per 1k input tokens
  const outputCostPer1k = 0.0002; // $0.0002 per 1k output tokens

  const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1k;
  const outputCost = (usage.completion_tokens / 1000) * outputCostPer1k;

  return inputCost + outputCost;
}

// ============================================================================
// Fallback WOD Generation
// ============================================================================

function generateFallbackWod(preparerContext: any): any {
  const availableTime = preparerContext?.availableTime || 20;
  const energyLevel = preparerContext?.energyLevel || 7;
  const equipment = preparerContext?.availableEquipment || [];
  const hasBarbell = equipment.includes('barbell');
  const hasPullUpBar = equipment.includes('pull-up-bar');
  const hasKettlebell = equipment.includes('kettlebell');

  console.log('[COACH-FUNCTIONAL] Generating fallback WOD', {
    availableTime,
    energyLevel,
    hasBarbell,
    hasPullUpBar,
    hasKettlebell
  });

  // Classic Cindy - Bodyweight AMRAP (works with minimal equipment)
  if (availableTime >= 15 && energyLevel >= 6 && hasPullUpBar) {
    return {
      sessionId: `fallback-cindy-${Date.now()}`,
      sessionName: 'Cindy - Classic Girl WOD',
      type: 'Functional Fitness',
      category: 'functional-crosstraining',
      wodFormat: 'amrap',
      wodName: 'Cindy',
      timeCapMinutes: Math.min(availableTime - 5, 20),
      targetRounds: '15-20 rounds',
      durationTarget: availableTime,
      focus: ['Conditioning', 'Upper body endurance', 'Core'],
      sessionSummary: 'Classic benchmark WOD Cindy - AMRAP de 5-10-15 Pull-ups, Push-ups, Air Squats. Idéal pour conditioning général.',

      warmup: {
        duration: 5,
        isOptional: false,
        exercises: [
          {
            id: 'wu-1',
            name: 'Cardio léger',
            duration: 120,
            instructions: 'Jumping jacks ou row facile',
            targetAreas: ['cardiovascular']
          },
          {
            id: 'wu-2',
            name: 'Movement prep',
            duration: 180,
            instructions: 'Scapular pull-ups, push-up progressions, air squats',
            targetAreas: ['shoulders', 'chest', 'legs']
          }
        ],
        notes: 'Activation épaules et hanches, mobilité complète'
      },

      exercises: [
        {
          id: 'ex-1',
          name: 'Pull-ups',
          variant: 'Strict or Kipping',
          category: 'gymnastic',
          sets: 1,
          reps: 5,
          rest: 0,
          rpeTarget: 8,
          techniqueLevel: 'developing',
          movementPattern: 'Pulling',
          muscleGroups: ['Dorsaux', 'Biceps'],
          equipment: 'Barre de traction',
          scalingOptions: [
            { level: 'rx', modification: 'Strict or kipping pull-ups', description: 'Chin over bar' },
            { level: 'scaled', modification: 'Jumping pull-ups', description: 'Use jump assistance' },
            { level: 'foundations', modification: 'Ring rows', description: 'Horizontal pulling' }
          ],
          executionCues: ['Active shoulders', 'Full extension', 'Chin over bar'],
          coachNotes: 'Pacing clé - ne pas rush les premières rounds',
          coachTips: ['Break early si nécessaire', 'Maintenir quality']
        },
        {
          id: 'ex-2',
          name: 'Push-ups',
          variant: 'Standard',
          category: 'bodyweight',
          sets: 1,
          reps: 10,
          rest: 0,
          rpeTarget: 7,
          techniqueLevel: 'proficient',
          movementPattern: 'Pushing',
          muscleGroups: ['Pectoraux', 'Triceps'],
          equipment: 'Poids du corps',
          scalingOptions: [
            { level: 'rx', modification: 'Full push-ups', description: 'Chest to floor' },
            { level: 'scaled', modification: 'Knee push-ups', description: 'Reduced difficulty' },
            { level: 'foundations', modification: 'Elevated push-ups', description: 'Hands on box' }
          ],
          executionCues: ['Tight core', 'Full ROM', 'Elbows 45°'],
          coachNotes: 'Maintenir form - pas snake push-ups',
          coachTips: ['Respiration contrôlée', 'Break intelligent']
        },
        {
          id: 'ex-3',
          name: 'Air Squats',
          variant: 'Bodyweight',
          category: 'bodyweight',
          sets: 1,
          reps: 15,
          rest: 0,
          rpeTarget: 6,
          techniqueLevel: 'mastered',
          movementPattern: 'Squatting',
          muscleGroups: ['Quadriceps', 'Fessiers'],
          equipment: 'Poids du corps',
          scalingOptions: [
            { level: 'rx', modification: 'Below parallel depth', description: 'Full depth' },
            { level: 'scaled', modification: 'Parallel depth', description: 'Reduced depth' },
            { level: 'foundations', modification: 'Box squats', description: 'Sit to box' }
          ],
          executionCues: ['Hips below knees', 'Weight in heels', 'Chest up'],
          coachNotes: 'Recovery section du round - respirer',
          coachTips: ['Rythme constant', 'Profiter pour respirer']
        }
      ],

      wodStructure: 'AMRAP 20min: 5 Pull-ups + 10 Push-ups + 15 Air Squats',

      rxVersion: [
        { movementName: 'Pull-ups', prescription: 'Kipping or strict, chin over bar' },
        { movementName: 'Push-ups', prescription: 'Full ROM, chest to floor' },
        { movementName: 'Air Squats', prescription: 'Below parallel' }
      ],

      scaledVersion: [
        { movementName: 'Pull-ups', prescription: 'Jumping pull-ups or ring rows' },
        { movementName: 'Push-ups', prescription: 'Knee push-ups' },
        { movementName: 'Air Squats', prescription: 'Parallel depth' }
      ],

      foundationsVersion: [
        { movementName: 'Ring Rows', prescription: 'Horizontal pulling' },
        { movementName: 'Elevated Push-ups', prescription: 'Hands on box' },
        { movementName: 'Box Squats', prescription: 'Sit to box target' }
      ],

      cooldown: {
        duration: 5,
        exercises: ['Marche lente 2min', 'Stretching épaules et hanches'],
        notes: 'Recovery active, hydratation abondante'
      },

      overallNotes: 'Classic benchmark Girl WOD - bodyweight conditioning',
      expectedRpe: 8,
      expectedIntensity: 'high',
      coachRationale: 'WOD fallback généré automatiquement - Cindy est un benchmark classique adapté à tous niveaux avec scaling facile. Focus conditioning général avec mouvements fondamentaux.'
    };
  }

  // Simple bodyweight AMRAP if no pull-up bar
  return {
    sessionId: `fallback-simple-${Date.now()}`,
    sessionName: 'Bodyweight Conditioning',
    type: 'Functional Fitness',
    category: 'functional-crosstraining',
    wodFormat: 'amrap',
    timeCapMinutes: Math.min(availableTime - 5, 15),
    targetRounds: '10-15 rounds',
    durationTarget: availableTime,
    focus: ['Conditioning', 'Core', 'Lower body'],
    sessionSummary: 'AMRAP bodyweight simple - burpees, air squats, sit-ups. Aucun équipement requis.',

    warmup: {
      duration: 5,
      isOptional: false,
      exercises: [
        {
          id: 'wu-1',
          name: 'Dynamic warm-up',
          duration: 300,
          instructions: 'Jumping jacks, inchworms, air squats, arm circles',
          targetAreas: ['full-body']
        }
      ],
      notes: 'Activation générale, mobilité'
    },

    exercises: [
      {
        id: 'ex-1',
        name: 'Burpees',
        variant: 'Standard',
        category: 'bodyweight',
        sets: 1,
        reps: 10,
        rest: 0,
        rpeTarget: 8,
        techniqueLevel: 'proficient',
        movementPattern: 'Full body',
        muscleGroups: ['Pectoraux', 'Quadriceps', 'Deltoïdes'],
        equipment: 'Poids du corps',
        scalingOptions: [
          { level: 'rx', modification: 'Jump and clap overhead', description: 'Full burpee' },
          { level: 'scaled', modification: 'Step back burpee', description: 'No jump' },
          { level: 'foundations', modification: 'Elevated burpee', description: 'Hands on box' }
        ],
        executionCues: ['Full extension top', 'Chest to floor', 'Hip extension'],
        coachNotes: 'Pacing intelligent - sustainable effort',
        coachTips: ['Respirer au top', 'Rythme constant']
      },
      {
        id: 'ex-2',
        name: 'Air Squats',
        variant: 'Bodyweight',
        category: 'bodyweight',
        sets: 1,
        reps: 15,
        rest: 0,
        rpeTarget: 6,
        techniqueLevel: 'mastered',
        movementPattern: 'Squatting',
        muscleGroups: ['Quadriceps', 'Fessiers'],
        equipment: 'Poids du corps',
        scalingOptions: [
          { level: 'rx', modification: 'Below parallel', description: 'Full depth' },
          { level: 'scaled', modification: 'Parallel', description: 'Reduced depth' },
          { level: 'foundations', modification: 'Box squat', description: 'Sit to target' }
        ],
        executionCues: ['Hips below knees', 'Chest up', 'Heels down'],
        coachNotes: 'Active recovery section',
        coachTips: ['Respirer profondément', 'Quality movement']
      },
      {
        id: 'ex-3',
        name: 'Sit-ups',
        variant: 'Abmat',
        category: 'bodyweight',
        sets: 1,
        reps: 20,
        rest: 0,
        rpeTarget: 7,
        techniqueLevel: 'proficient',
        movementPattern: 'Core flexion',
        muscleGroups: ['Abdominaux'],
        equipment: 'Poids du corps',
        scalingOptions: [
          { level: 'rx', modification: 'Full sit-ups', description: 'Touch toes' },
          { level: 'scaled', modification: 'Partial ROM', description: 'Reduced range' },
          { level: 'foundations', modification: 'Crunches', description: 'Shoulders off floor' }
        ],
        executionCues: ['Control descent', 'Touch toes', 'Shoulders down'],
        coachNotes: 'Core engagement constant',
        coachTips: ['Rythme fluide', 'Pas jerk back']
      }
    ],

    wodStructure: 'AMRAP 15min: 10 Burpees + 15 Air Squats + 20 Sit-ups',

    rxVersion: [
      { movementName: 'Burpees', prescription: 'Jump and clap overhead' },
      { movementName: 'Air Squats', prescription: 'Below parallel' },
      { movementName: 'Sit-ups', prescription: 'Touch toes' }
    ],

    scaledVersion: [
      { movementName: 'Burpees', prescription: 'Step back, no jump' },
      { movementName: 'Air Squats', prescription: 'Parallel depth' },
      { movementName: 'Sit-ups', prescription: 'Partial ROM' }
    ],

    foundationsVersion: [
      { movementName: 'Elevated Burpees', prescription: 'Hands on box' },
      { movementName: 'Box Squats', prescription: 'Sit to box' },
      { movementName: 'Crunches', prescription: 'Shoulders off floor only' }
    ],

    cooldown: {
      duration: 5,
      exercises: ['Marche 2min', 'Stretching hip flexors et abs'],
      notes: 'Recovery active, hydratation'
    },

    overallNotes: 'Simple bodyweight WOD - no equipment required',
    expectedRpe: 8,
    expectedIntensity: 'high',
    coachRationale: 'WOD fallback généré automatiquement - simple et efficace, sans équipement. Focus conditioning général avec mouvements accessibles.'
  };
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Parse request
    const requestData: FunctionalCoachRequest = await req.json();

    // Validate required fields
    if (!requestData.userId || !requestData.userContext || !requestData.preparerContext) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: userId, userContext, preparerContext'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate unique request ID for idempotency
    const requestId = crypto.randomUUID();

    // Generate prescription
    const result = await generatePrescription(requestData, supabase, requestId);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

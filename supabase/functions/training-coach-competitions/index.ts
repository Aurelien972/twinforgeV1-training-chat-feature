/**
 * Training Coach Competitions Edge Function
 * Specialized AI coach for Fitness Competitions (HYROX, DEKA FIT, DEKA MILE, DEKA STRONG)
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

interface CompetitionsCoachRequest {
  userId: string;
  userContext: any;
  preparerContext: any;
}

interface CompetitionsCoachResponse {
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

const COACH_COMPETITIONS_SYSTEM_PROMPT = `Coach IA Compétitions Fitness (HYROX, DEKA). Génère des séances adaptées au format choisi.

# RÈGLE FONDAMENTALE - CATALOGUE D'EXERCICES

**SI un catalogue d'exercices est fourni dans le contexte utilisateur**:
- TU DOIS UTILISER UNIQUEMENT les exercices du catalogue pour les stations
- NE GÉNÈRE PAS de nouveaux noms d'exercices
- SÉLECTIONNE les exercices selon: type de station (cardio/strength/hybrid), équipement, difficulté
- UTILISE les substitutions si équipement manquant
- RESPECTE les métadonnées: difficulté, zones d'intensité, notes de sécurité

**SI aucun catalogue n'est fourni**:
- Génère des exercices selon tes connaissances standards

# Formats
- HYROX: 8×1km + 8 stations (SkiErg, Traîneau, Burpees, Rameur, Porté fermé, Fentes, Wall Balls)
- DEKA FIT: 10 zones cardio/force
- DEKA MILE: 1 mile + 10 zones
- DEKA STRONG: 10 stations force pure

# Principes
- Allure 80% départ, 85-90% maintien, finir fort
- Transitions <10s
- Substitutions si équipement manquant
- Éviter simulations si fatigue élevée

# Types de Séances
- <30min: 2-3 stations isolées
- 30-45min: Hybride (courses courtes + stations)
- 45-60min: Simulation partielle (4-5 stations)
- >60min: Simulation complète (si énergie >7)

# ORDRE STATIONS OBLIGATOIRE (CRITIQUE COMPÉTITIONS)

**RÈGLE CRITIQUE**: Respecter l'ordre officiel des stations pour préparation compétition authentique.

## HYROX (ORDRE OFFICIEL STRICT)
L'ordre DOIT respecter le format compétition:
1. Run 1km → Station 1: SkiErg 1000m
2. Run 1km → Station 2: Sled Push 50m
3. Run 1km → Station 3: Sled Pull 50m
4. Run 1km → Station 4: Burpee Broad Jumps 80m
5. Run 1km → Station 5: Rameur 1000m
6. Run 1km → Station 6: Farmers Carry 200m
7. Run 1km → Station 7: Sandbag Lunges 100m
8. Run 1km → Station 8: Wall Balls 100 reps
9. Run final

**JAMAIS modifier cet ordre** sauf si simulation partielle (alors prendre séquence continue ex: Stations 1-4).

## DEKA FIT (ORDRE OFFICIEL)
1. Tank Push/Pull
2. Ski Erg
3. Box Jump Over
4. Sled Pull
5. Burpees
6. Rowing
7. Air Bike
8. Farmers Carry
9. Wall Balls
10. Défi RAM

## DEKA STRONG (Ordre Flexible Force)
Ordre peut être adapté selon principe force → fatigue:
- Priorité 1: Mouvements lourds/techniques (Deadlift, Clean)
- Priorité 2: Mouvements composés (Thrusters, Lunges)
- Priorité 3: Stations haute répétition (Wall Balls, Burpees)

**EXEMPLES CORRECTS**:
✅ HYROX: Run → SkiErg → Run → Sled Push → Run → Sled Pull (ordre officiel)
✅ DEKA FIT: Tank → Ski Erg → Box Jump (ordre officiel)
✅ DEKA STRONG: Deadlift → Farmers Carry → Wall Balls (lourd → moyen → volume)

**EXEMPLES INCORRECTS** ❌:
❌ HYROX: Run → Rameur → Run → SkiErg (ordre altéré INTERDIT)
❌ DEKA FIT: Burpees → Tank → Ski (ordre altéré INTERDIT)

# GROUPES MUSCULAIRES CIBLÉS (OBLIGATOIRE pour stations force)

**muscleGroups** (OBLIGATOIRE pour stations strength/hybrid): Array de 1-3 groupes en français
- Exemples: "Quadriceps", "Ischio-jambiers", "Fessiers", "Dorsaux", "Pectoraux", "Deltoïdes", "Abdominaux", "Mollets", "Trapèzes"
- Ex: Wall Balls → ["Quadriceps", "Deltoïdes"] | Fentes → ["Quadriceps", "Fessiers"] | Rameur → ["Dorsaux", "Quadriceps"]

# Format JSON
{
  "sessionId": "uuid",
  "sessionName": "string",
  "type": "Compétition Fitness",
  "category": "fitness-competitions",
  "competitionFormat": "hyrox|deka-fit|deka-mile|deka-strong|hybrid",
  "durationTarget": number,
  "focus": ["string"],
  "sessionSummary": "string",
  "warmup": {"duration": number, "isOptional": false, "exercises": [{"id": "string", "name": "string", "duration": number, "instructions": "string", "targetAreas": ["string"]}], "notes": "string"},
  "stations": [{"id": "string", "stationNumber": number, "stationType": "cardio|strength|hybrid", "name": "string", "equipment": ["string"], "muscleGroups": ["string"], "prescription": "string", "targetTime": number, "targetPace": "string", "intensity": "string", "rpeTarget": number, "transitionTime": number, "executionCues": ["string"], "pacingStrategy": "string", "coachNotes": "string", "substitutions": ["string"]}],
  "cooldown": {"duration": number, "exercises": ["string"], "notes": "string"},
  "pacingPlan": {"overall": "string", "runPacing": "string", "stationApproach": "string", "transitionGoal": "string"},
  "overallNotes": "string",
  "expectedRpe": number,
  "expectedIntensity": "string",
  "coachRationale": "string"
}

RÈGLES: Utiliser le tableau "stations". CHAQUE station strength/hybrid DOIT avoir muscleGroups (array 1-3 groupes en français). Inclure stationNumber, stationType, targetTime, transitionTime pour chaque station. Ajouter des substitutions si équipement manquant. TOUT EN FRANÇAIS.
`;

function buildUserPrompt(userContext: any, preparerContext: any, exerciseCatalogSection: string): string {
  const competitionType = preparerContext.tempSport || 'hyrox';
  const hasExerciseCatalog = exerciseCatalogSection.trim().length > 0;
  return `Temps disponible: ${preparerContext.availableTime}min, Énergie: ${preparerContext.energyLevel}/10, Équipement: ${preparerContext.availableEquipment?.slice(0, 5).join(', ') || 'Aucun'}, Format: ${competitionType}. Génère une séance ${competitionType} avec stratégie d'allure, transitions <10s, substitutions si nécessaire. ${hasExerciseCatalog ? '**UTILISER UNIQUEMENT les exercices du catalogue fourni ci-dessous.**' : ''} Format JSON requis. TOUT EN FRANÇAIS.

${exerciseCatalogSection}`.trim();
}

async function generatePrescription(
  request: CompetitionsCoachRequest,
  supabase: any,
  requestId: string
): Promise<CompetitionsCoachResponse> {
  const startTime = Date.now();

  try {
    console.log('[COACH-COMPETITIONS] Starting prescription generation', {
      userId: request.userId,
      requestId,
      availableTime: request.preparerContext?.availableTime,
      energyLevel: request.preparerContext?.energyLevel,
      equipmentCount: request.preparerContext?.availableEquipment?.length || 0,
      competitionType: request.preparerContext?.tempSport
    });

    // Pre-check token balance before OpenAI call
    const estimatedTokens = 100;
    const tokenCheck = await checkTokenBalance(supabase, request.userId, estimatedTokens);

    if (!tokenCheck.hasEnoughTokens) {
      console.warn('[COACH-COMPETITIONS] Insufficient tokens', {
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

    // Extract exercise catalog from userContext if available
    const exerciseCatalog = request.userContext?.exerciseCatalog;
    const hasExerciseCatalog = exerciseCatalog && exerciseCatalog.exercises && exerciseCatalog.exercises.length > 0;

    console.log('[COACH-COMPETITIONS] Exercise catalog availability', {
      hasExerciseCatalog,
      exerciseCount: hasExerciseCatalog ? exerciseCatalog.exercises.length : 0
    });

    let exerciseCatalogSection = '';
    if (hasExerciseCatalog) {
      const userLanguage = exerciseCatalog.language || 'fr';

      // CRITICAL: Filter exercises to prevent timeout (400+ → 60-70 exercises)
      const filteredExercises = filterExercisesByContext(
        exerciseCatalog.exercises,
        {
          discipline: 'competitions',
          availableEquipment: request.preparerContext.availableEquipment,
          userLevel: request.userContext.profile?.training_level || undefined,
          maxExercises: 60
        }
      );

      console.log('[COACH-COMPETITIONS] Exercise catalog filtered', {
        originalCount: exerciseCatalog.exercises.length,
        filteredCount: filteredExercises.length,
        reduction: `${Math.round((1 - filteredExercises.length / exerciseCatalog.exercises.length) * 100)}%`
      });

      exerciseCatalogSection = `

# ${userLanguage === 'fr' ? 'CATALOGUE D\'EXERCICES COMPETITIONS DISPONIBLES' : 'AVAILABLE COMPETITIONS EXERCISE CATALOG'}

${userLanguage === 'fr'
  ? `TU DOIS UTILISER UNIQUEMENT LES EXERCICES DE CE CATALOGUE.
Ne génère PAS de nouveaux exercices. Catalogue filtré: ${filteredExercises.length} exercices optimisés.`
  : `YOU MUST USE ONLY EXERCISES FROM THIS CATALOG.
Do NOT generate new exercises. Filtered catalog: ${filteredExercises.length} optimized exercises.`}

${formatExercisesForAI(filteredExercises, userLanguage as 'fr' | 'en')}

${userLanguage === 'fr'
  ? `IMPORTANT: Utilise les substitutions du catalogue si équipement manquant (ex: SkiErg → Rameur, Sled → Burpees).`
  : `IMPORTANT: Use catalog substitutions if equipment missing (e.g., SkiErg → Rower, Sled → Burpees).`}

${userLanguage === 'fr' ? `
# APPRENTISSAGE PAR FEEDBACKS UTILISATEUR (CRITIQUE)

**RÈGLE FONDAMENTALE**: Les feedbacks utilisateur passés sont **LA PRIORITÉ ABSOLUE** pour adapter les prescriptions futures.

## Analyse des Feedbacks

Le contexte utilisateur contient \`userFeedbacks\` avec:
- \`totalFeedbacks\`: Nombre total de feedbacks
- \`averageSentiment\`: Score moyen (-1 = très négatif, +1 = très positif)
- \`topThemes\`: Thèmes récurrents (ex: "rythme insoutenable", "stations trop dures", "excellent circuit")
- \`recentFeedbacks\`: 5 derniers feedbacks avec texte, discipline, sentiment

## Règles d'Adaptation

### Si averageSentiment < -0.3 (négatifs):
- **RÉDUIRE intensité stations**: -20% reps ou -15% distance
- **AUGMENTER récupération**: +30-60s entre stations
- **SIMPLIFIER mouvements**: Wall Balls 9kg → 6kg, Lunges → Step-ups
- **BAISSER target temps**: +15-20% time cap

### Si averageSentiment > 0.5 (très positifs):
- **MAINTENIR structure** de circuit
- **VARIER ordre**: alterner force-cardio différemment
- **PROGRESSER modérément**: +5-10% volume ou -5% temps récup

### Thèmes - Actions:

**"trop intense" / "impossible à tenir" / "épuisant"**:
- RÉDUIRE reps stations (-25-30%)
- ALLONGER transitions (+45s)
- POIDS plus légers (Wall Balls 9kg → 6kg)

**"monotone" / "toujours même format"**:
- VARIER ordre stations
- ALTERNER AMRAP avec For Time
- INTRODUIRE nouvelles stations du catalogue

**"trop facile" / "pas assez dur"**:
- AUGMENTER reps (+20%)
- RÉDUIRE transitions (-30%)
- POIDS plus lourds

**"parfait" / "idéal pour compet"**:
- CONSERVER structure exacte
- Varier seulement ordre léger

## Importance Hiérarchique

1. **Feedbacks récents** (< 7j) → Poids maximal
2. **Récupération physiologique**
3. **Performance stations historique**
4. **Profil utilisateur**

**CRITIQUE**: Si feedback dit "trop dur", même si "élite", TU DOIS baisser l'intensité.
` : `
# USER FEEDBACK LEARNING (CRITICAL)

**FUNDAMENTAL RULE**: Past user feedbacks are **THE ABSOLUTE PRIORITY** for adapting future prescriptions.

## Feedback Analysis

User context contains \`userFeedbacks\` with:
- \`totalFeedbacks\`: Total feedbacks
- \`averageSentiment\`: Average score (-1 = very negative, +1 = very positive)
- \`topThemes\`: Recurring themes (e.g., "unsustainable pace", "stations too hard", "excellent circuit")
- \`recentFeedbacks\`: Last 5 feedbacks with text, discipline, sentiment

## Adaptation Rules

### If averageSentiment < -0.3 (negative):
- **REDUCE station intensity**: -20% reps or -15% distance
- **INCREASE recovery**: +30-60s between stations
- **SIMPLIFY movements**: Wall Balls 9kg → 6kg, Lunges → Step-ups
- **LOWER target time**: +15-20% time cap

### If averageSentiment > 0.5 (very positive):
- **MAINTAIN circuit** structure
- **VARY order**: alternate strength-cardio differently
- **PROGRESS moderately**: +5-10% volume or -5% recovery time

### Themes - Actions:

**"too intense" / "impossible to sustain" / "exhausting"**:
- REDUCE station reps (-25-30%)
- EXTEND transitions (+45s)
- LIGHTER weights (Wall Balls 9kg → 6kg)

**"monotonous" / "always same format"**:
- VARY station order
- ALTERNATE AMRAP with For Time
- INTRODUCE new stations from catalog

**"too easy" / "not hard enough"**:
- INCREASE reps (+20%)
- REDUCE transitions (-30%)
- HEAVIER weights

**"perfect" / "ideal for comp"**:
- KEEP exact structure
- Vary only slight order

## Hierarchical Importance

1. **Recent feedbacks** (< 7d) → Maximum weight
2. **Physiological recovery**
3. **Historical station performance**
4. **User profile**

**CRITICAL**: If feedback says "too hard", even if "elite", YOU MUST lower intensity.
`}
`;
    }

    const userPrompt = buildUserPrompt(request.userContext, request.preparerContext, exerciseCatalogSection);

    console.log('[COACH-COMPETITIONS] Calling OpenAI API with gpt-5-mini');

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
            content: COACH_COMPETITIONS_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        reasoning_effort: 'low',
        max_completion_tokens: 8000,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'competitions_session_prescription',
            strict: false,
            schema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                sessionName: { type: 'string' },
                type: { type: 'string' },
                category: { type: 'string' },
                competitionFormat: { type: 'string' },
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
                stations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      stationNumber: { type: 'number' },
                      stationType: { type: 'string', description: 'cardio|strength|hybrid' },
                      name: { type: 'string' },
                      equipment: { type: 'array', items: { type: 'string' } },
                      muscleGroups: { type: 'array', items: { type: 'string' }, description: '1-3 groupes musculaires pour stations strength/hybrid' },
                      prescription: { type: 'string' },
                      targetTime: { type: 'number' },
                      targetPace: { type: 'string' },
                      intensity: { type: 'string' },
                      rpeTarget: { type: 'number' },
                      transitionTime: { type: 'number' },
                      executionCues: { type: 'array', items: { type: 'string' } },
                      pacingStrategy: { type: 'string' },
                      coachNotes: { type: 'string' },
                      substitutions: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['id', 'stationNumber', 'stationType', 'name', 'equipment', 'prescription', 'targetTime', 'intensity', 'rpeTarget', 'transitionTime', 'executionCues', 'pacingStrategy', 'coachNotes', 'substitutions']
                  }
                },
                cooldown: {
                  type: 'object',
                  properties: {
                    duration: { type: 'number' },
                    exercises: { type: 'array', items: { type: 'string' } },
                    notes: { type: 'string' }
                  },
                  required: ['duration', 'exercises', 'notes']
                },
                pacingPlan: {
                  type: 'object',
                  properties: {
                    overall: { type: 'string' },
                    runPacing: { type: 'string' },
                    stationApproach: { type: 'string' },
                    transitionGoal: { type: 'string' }
                  },
                  required: ['overall', 'stationApproach', 'transitionGoal']
                },
                overallNotes: { type: 'string' },
                expectedRpe: { type: 'number' },
                expectedIntensity: { type: 'string' },
                coachRationale: { type: 'string' }
              },
              required: ['sessionId', 'sessionName', 'type', 'category', 'competitionFormat', 'durationTarget', 'focus', 'sessionSummary', 'warmup', 'stations', 'cooldown', 'pacingPlan', 'overallNotes', 'expectedRpe', 'expectedIntensity', 'coachRationale']
            }
          }
        }
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[COACH-COMPETITIONS] OpenAI API error', {
        status: response.status,
        error: errorData
      });
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    const completionTokens = data.usage?.completion_tokens || 0;
    const maxTokens = 8000;
    const tokenUsagePercent = (completionTokens / maxTokens) * 100;

    console.log('[COACH-COMPETITIONS] OpenAI response parsed', {
      totalTokens: data.usage?.total_tokens,
      completionTokens,
      tokenUsagePercent: tokenUsagePercent.toFixed(1) + '%'
    });

    if (tokenUsagePercent > 90) {
      console.warn('[COACH-COMPETITIONS] Token usage high - potential truncation risk', {
        completionTokens,
        usagePercent: tokenUsagePercent.toFixed(1) + '%'
      });
    }

    const contentString = data.choices[0].message.content;

    let prescription;
    try {
      prescription = JSON.parse(contentString);
    } catch (parseError) {
      console.error('[COACH-COMPETITIONS] Failed to parse prescription JSON', {
        error: parseError.message,
        contentLength: contentString.length
      });

      let fixedContent = contentString.trim();
      const openBraces = (fixedContent.match(/{/g) || []).length;
      const closeBraces = (fixedContent.match(/}/g) || []).length;
      const missingBraces = openBraces - closeBraces;

      if (missingBraces > 0) {
        const openBrackets = (fixedContent.match(/\[/g) || []).length;
        const closeBrackets = (fixedContent.match(/\]/g) || []).length;
        const missingBrackets = openBrackets - closeBrackets;

        if (missingBrackets > 0) {
          fixedContent += ']'.repeat(missingBrackets);
        }
        fixedContent += '}'.repeat(missingBraces);
      }

      fixedContent = fixedContent.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

      try {
        prescription = JSON.parse(fixedContent);
        console.log('[COACH-COMPETITIONS] Successfully parsed repaired JSON');
      } catch (secondParseError) {
        throw new Error(`Failed to parse prescription JSON: ${parseError.message}`);
      }
    }

    console.log('[COACH-COMPETITIONS] Prescription parsed successfully', {
      sessionId: prescription.sessionId,
      competitionFormat: prescription.competitionFormat,
      stationsCount: prescription.stations?.length || 0
    });

    // Consume tokens after successful OpenAI call
    const consumptionResult = await consumeTokensAtomic(supabase, {
      userId: request.userId,
      edgeFunctionName: 'training-coach-competitions',
      operationType: 'competitions-prescription-generation',
      openaiModel: 'gpt-5-mini',
      openaiInputTokens: data.usage?.prompt_tokens,
      openaiOutputTokens: data.usage?.completion_tokens,
      metadata: {
        requestId,
        competitionFormat: prescription.competitionFormat,
        equipmentCount: request.preparerContext?.availableEquipment?.length || 0,
        stationsCount: prescription.stations?.length || 0,
        availableTime: request.preparerContext?.availableTime
      }
    }, requestId);

    if (!consumptionResult.success) {
      console.error('[COACH-COMPETITIONS] Token consumption failed but continuing', {
        error: consumptionResult.error,
        requestId
      });
    }

    const latencyMs = Date.now() - startTime;

    console.log('[COACH-COMPETITIONS] Prescription generation completed', {
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

    console.error('[COACH-COMPETITIONS] Prescription generation failed', {
      error: error.message,
      latencyMs,
      isTimeout: error.name === 'AbortError' || error.name === 'TimeoutError'
    });

    if (latencyMs > 60000 || error.name === 'AbortError' || error.name === 'TimeoutError') {
      console.log('[COACH-COMPETITIONS] Timeout detected, generating fallback');
      const fallbackPrescription = generateFallbackSession(request.preparerContext);

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
  const inputCostPer1k = 0.0001;
  const outputCostPer1k = 0.0002;
  const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1k;
  const outputCost = (usage.completion_tokens / 1000) * outputCostPer1k;
  return inputCost + outputCost;
}

function generateFallbackSession(preparerContext: any): any {
  const availableTime = preparerContext?.availableTime || 45;
  const energyLevel = preparerContext?.energyLevel || 7;

  return {
    sessionId: `fallback-hyrox-${Date.now()}`,
    sessionName: 'Entraînement Hybride HYROX',
    type: 'Compétition Fitness',
    category: 'fitness-competitions',
    competitionFormat: 'hybrid',
    durationTarget: availableTime,
    focus: ['Gestion allure', 'Endurance stations', 'Transitions'],
    sessionSummary: 'Séance hybride type HYROX : courses + stations enchaînées. Format simplifié adapté équipement minimal.',

    warmup: {
      duration: 8,
      isOptional: false,
      exercises: [
        {
          id: 'wu-1',
          name: 'Cardio léger',
          duration: 240,
          instructions: 'Jogging léger ou machine cardio à intensité facile',
          targetAreas: ['cardiovasculaire']
        },
        {
          id: 'wu-2',
          name: 'Préparation dynamique',
          duration: 240,
          instructions: 'Balancements jambes, fentes, inchworms, rotations épaules',
          targetAreas: ['corps-complet']
        }
      ],
      notes: 'Préparation cardiovasculaire et mobilité dynamique'
    },

    stations: [
      {
        id: 'station-1',
        stationNumber: 1,
        stationType: 'cardio',
        name: 'Course 800m',
        equipment: ['extérieur', 'tapis de course'],
        prescription: '800m',
        targetTime: 240,
        targetPace: '5:00/km',
        intensity: 'modérée',
        rpeTarget: 7,
        transitionTime: 10,
        executionCues: ['Allure constante', 'Respiration contrôlée'],
        pacingStrategy: 'Démarrage contrôlé à 80%, maintenir',
        coachNotes: 'Première course = échauffement spécifique',
        substitutions: ['600m course + 200m rameur', '1000m vélo assault']
      },
      {
        id: 'station-2',
        stationNumber: 2,
        stationType: 'strength',
        name: 'Burpees',
        equipment: ['poids du corps'],
        prescription: '30 répétitions',
        targetTime: 120,
        intensity: 'élevée',
        rpeTarget: 8,
        transitionTime: 5,
        executionCues: ['Poitrine au sol', 'Extension hanches en haut', 'Rythme constant'],
        pacingStrategy: 'Séries de 10, micro-pauses 2-3s',
        coachNotes: 'Économie de mouvement, ne pas chercher vitesse maximale',
        substitutions: ['20 burpees + 20 jump squats']
      },
      {
        id: 'station-3',
        stationNumber: 3,
        stationType: 'cardio',
        name: 'Course 800m',
        equipment: ['extérieur', 'tapis de course'],
        prescription: '800m',
        targetTime: 240,
        targetPace: '5:00/km',
        intensity: 'modérée',
        rpeTarget: 7,
        transitionTime: 10,
        executionCues: ['Maintenir allure', 'Gérer fatigue jambes'],
        pacingStrategy: 'Même allure que course 1',
        coachNotes: 'Régularité est la clé',
        substitutions: ['600m course + 200m rameur']
      },
      {
        id: 'station-4',
        stationNumber: 4,
        stationType: 'strength',
        name: 'Fentes marchées',
        equipment: ['poids du corps', 'haltères'],
        prescription: '50 pas',
        targetTime: 150,
        intensity: 'modérée',
        rpeTarget: 7,
        transitionTime: 5,
        executionCues: ['Profondeur complète', 'Genou aligné', 'Posture verticale'],
        pacingStrategy: 'Rythme constant, sans précipitation',
        coachNotes: 'Simulation porté fermé (farmers carry)',
        substitutions: ['40 fentes + 20 goblet squats']
      }
    ],

    cooldown: {
      duration: 10,
      exercises: ['Marche lente 5min', 'Étirements complets 5min'],
      notes: 'Récupération active, hydratation, nutrition post-entraînement'
    },

    pacingPlan: {
      overall: 'Départ 80%, maintien 85%, finir fort 90%',
      runPacing: '5:00/km régulier',
      stationApproach: 'Technique avant vitesse',
      transitionGoal: 'Transitions < 10s'
    },

    overallNotes: 'Séance de secours type HYROX hybride. Format simplifié 4 stations.',
    expectedRpe: 7.5,
    expectedIntensity: 'élevée',
    coachRationale: 'Séance générée automatiquement - Format hybride accessible développant endurance spécifique aux compétitions.'
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const requestData: CompetitionsCoachRequest = await req.json();

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

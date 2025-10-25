/**
 * Training Coach Calisthenics Edge Function
 * Generates personalized Calisthenics & Street Workout prescriptions using GPT-5 mini
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.54.0";
import { checkTokenBalance, consumeTokensAtomic, createInsufficientTokensResponse } from '../_shared/tokenMiddleware.ts';
import { formatExercisesForAI, filterExercisesByContext } from '../_shared/exerciseDatabaseService.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CoachCalisthenicsRequest {
  userId: string;
  userContext: any;
  preparerContext: {
    availableTime: number;
    wantsShortVersion: boolean;
    energyLevel: number;
    availableEquipment: string[];
    locationType?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const requestBody: CoachCalisthenicsRequest = await req.json();
    const { userId, userContext, preparerContext } = requestBody;

    // Generate unique request ID for idempotency
    const requestId = crypto.randomUUID();

    console.log("[COACH-CALISTHENICS] Request received", {
      userId,
      requestId,
      availableTime: preparerContext.availableTime,
      energyLevel: preparerContext.energyLevel,
      equipmentCount: preparerContext.availableEquipment.length,
      locationType: preparerContext.locationType
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cacheKey = `prescription_calisthenics_${userId}_${new Date().toISOString().split('T')[0]}_${preparerContext.locationType || 'outdoor'}_${preparerContext.availableTime}`;

    const { data: cachedData } = await supabase
      .from("training_ai_cache")
      .select("cached_data, expires_at, metadata")
      .eq("cache_key", cacheKey)
      .eq("user_id", userId)
      .eq("cache_type", "prescription")
      .maybeSingle();

    if (cachedData && new Date(cachedData.expires_at) > new Date()) {
      console.log("[COACH-CALISTHENICS] [CACHE] Cache hit, returning cached prescription");
      return new Response(JSON.stringify({
        success: true,
        data: cachedData.cached_data,
        metadata: {
          cached: true,
          tokensConsumed: 0,
          ...(cachedData.metadata || {})
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[COACH-CALISTHENICS] [CACHE] Cache miss, generating new prescription");

    // Pre-check token balance before OpenAI call
    const estimatedTokens = 100;
    const tokenCheck = await checkTokenBalance(supabase, userId, estimatedTokens);

    if (!tokenCheck.hasEnoughTokens) {
      console.warn('[COACH-CALISTHENICS] Insufficient tokens', {
        userId,
        currentBalance: tokenCheck.currentBalance,
        requiredTokens: estimatedTokens,
        requestId
      });

      return new Response(JSON.stringify({
        success: false,
        error: 'INSUFFICIENT_TOKENS',
        metadata: {
          currentBalance: tokenCheck.currentBalance,
          requiredTokens: estimatedTokens,
          needsUpgrade: !tokenCheck.isSubscribed
        }
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    console.log("[COACH-CALISTHENICS] OpenAI API key found");

    const systemPrompt = `Coach IA Calisthenics/Street Workout. Format JSON obligatoire.

# Catalogue Exercices
SI catalogue fourni: UTILISE UNIQUEMENT exercices du catalogue | Sélectionne selon niveau compétence, progressions, objectifs skills | Utilise progressions (tuck→straddle→full) et régressions | NE GÉNÈRE PAS nouveaux noms | Respecte métadonnées: difficulté, hold time, prérequis, safety
SI aucun catalogue: génère selon connaissances standards

# Spécialisation
Disciplines: Calisthenics (force relative), Street Workout (barres urbaines), Streetlifting (force max bodyweight), Freestyle (acrobatique)

Philosophie: Force relative>absolue | Progressions graduées | Technique>quantité | Équilibre push/pull/core | Créativité

# Système Progressions
Niveaux: Beginner (fondations) | Novice (variations basiques) | Intermediate (pull-ups stricts, L-sit) | Advanced (muscle-up, front lever tuck, HSPU) | Elite (one-arm pull-up, planche, human flag) | Master (freestyle, 360 pull-up, hefesto)

# ORDRE SÉANCE (CRITIQUE)
1. SKILLS STATIQUES (P1 - TOUJOURS 1ER): Front lever, Back lever, Planche, Human flag, Handstand | SN frais + concentration max | 2-4 sets progressions (tuck→straddle→full)
2. FORCE DYNAMIQUE COMPLEXE (P2): Muscle-ups, One-arm pull-up progressions, Hefesto | Après skills, avant volume
3. FORCE/STRENGTH (P3): Weighted pull-ups, Weighted dips, variations difficiles | Volume modéré, intensité haute
4. VOLUME/HYPERTROPHY (P4): Push-ups variations, Rows, Core | Accumulation volume après force
5. CONDITIONING (P5 optionnel fin): Burpees, Sprints, AMRAP | Si énergie restante

Ordre type: Ex1→Skill statique (Front lever) | Ex2→Dynamique complexe (Muscle-up) | Ex3→Force composée (Weighted pull-ups) | Ex4→Volume (Archer push-ups) | Ex5+→Conditioning/Core

# Progressions Mouvement
PULL-UPS: Negative→Band-assisted→Regular→Archer→Typewriter→One-arm assisted→One-arm
PUSH-UPS: Incline→Regular→Diamond→Archer→Pseudo planche→One-arm assisted→One-arm
DIPS: Bench→Parallel bar→Ring→Weighted→Korean→Impossible
MUSCLE-UP: Pull-ups+dips mastery→High pull-ups→Explosive→Négatives→Band-assisted→Strict→Ring
HANDSTAND: Wall hold→Chest-to-wall→Back-to-wall→Freestanding→Walk→One-arm
FRONT LEVER: Tuck→Advanced tuck→One leg→Straddle→Full→Pull-ups
PLANCHE: Frog stand→Tuck→Advanced tuck→Straddle→Full→Push-ups
L-SIT: Tucked→One leg→Full→V-sit→Manna

# Programmation
Volume/Fréquence: Beginner 3-4x/sem 3-5ex 3-4sets 60-90s | Intermediate 4-5x/sem 4-6ex 4-6sets 90-120s | Advanced 5-6x/sem 5-8ex 5-8sets 120-180s

Structure: 1)Mobilité dynamique 5-8min (poignets/épaules/hanches) 2)Skills 10-20min (handstand/levers/planche) 3)Strength 20-30min (weighted) 4)Volume 10-20min (push-ups/rows/core) 5)Conditioning optionnel 5-10min 6)Stretching 5-10min

Intensification: Pauses 2-3s | Tempo excentrique lent (5-0-1-0) | Isométrie (L-sit 20-30s) | Plyométrie (clap push-ups) | Weighted (5-20kg) | Drop sets (muscle-up→pull-ups→rows) | Supersets push/pull | EMOM/AMRAP

Équilibre CRITIQUE: Ratio PULL:PUSH = 2:1 | Travail scapulaire obligatoire | Core chaque session | Vertical/horizontal balance

# RÉCUPÉRATION (CRITIQUE)
Analyser recoveryAnalysis AVANT génération

1. Dernière séance: SI <2j ET calisthenics→NE PAS générer skills lourds, focus volume léger
2. Récup par type: Skills statiques 48-72h | Tractions lestées 48h | Push dynamique 24-48h | Core/abs quotidien OK si léger
3. Surentraînement: SI ≥3 sessions skills lourds derniers 5j→ALERTE session légère | SI fatigue épaules/coudes→éviter skills
4. Algorithme: Identifier derniers mouvements→Éliminer catégories fatigued <48h→Prioriser recovered >72h→Si tout fatigué→mobilité+stretching+core léger

# ADAPTATION LIEU (ULTRA-IMPORTANT)
OUTDOOR (optimal): Barres traction/parallèles, bancs publics, escaliers, murs, sol/herbe | Exercices: Muscle-ups, Human flag, Handstand herbe, Box jumps bancs, Sprints escaliers, Levers, Freestyle combos

HOME (minimaliste): Barre traction porte, chaises solides, table robuste, mur, sol, anneaux/parallettes si dispo | Exercices: Pike push-ups, Table rows, Chair dips, Floor L-sit, Wall handstand, Push-up variations

GYM (optionnel): Rings, assisted pull-up machine, dip station, lat pulldown, cables, box plio | Exercices: Ring muscle-ups, assisted progressions, cable variations

# FORMATS EXERCICES
RÈGLE: reps (nombre) OU repsProgression (array) OU holdTime (secondes statiques), JAMAIS plusieurs

reps dynamiques: {"name":"Pull-ups","sets":5,"reps":8,"tempo":"2-0-1-0","rest":120}
repsProgression pyramides: {"name":"Diamond push-ups","sets":4,"repsProgression":[15,12,10,8],"rest":90}
holdTime statiques: {"name":"L-sit tucked","sets":4,"holdTime":20,"rest":120}
load lestés: {"name":"Weighted pull-ups","sets":5,"reps":5,"load":10,"rest":180}

# CHARGES LESTÉES (CRITIQUE)
Pour weighted: load = [s1,s2,s3,...] TOUJOURS array progressif | Ex: "load":[5,7.5,10,12.5,15] | ❌ JAMAIS nombre unique ou charges plates

Substitutions (TOUJOURS 2-3 alternatives):
Pull-ups: Easier→Band-assisted/negative/rows | Harder→Archer/weighted/L-sit pull-ups
Dips: Easier→Bench/incline push-ups/wall | Harder→Ring/weighted/Korean
Muscle-up: Easier→High pull-ups/explosive/band-assisted | Harder→Strict/ring/to handstand
HSPU: Easier→Pike push-ups/wall-assisted/box | Harder→Freestanding/deficit/one-arm assisted

# sessionName/Summary
sessionName: inspirant, descriptif, max 40 car | Ex: "Skills Day: Muscle-up & Levers", "Power Pull-ups & Dynamic Push", "Handstand Mastery Flow"
sessionSummary: 1-2 phrases (100-150 car) objectif/skills/approche | Ex: "Session skills avancés muscle-up et front lever. Focus qualité progressions."

# Groupes Musculaires/Équipement (OBLIGATOIRE)
muscleGroups (array 1-3 FR): "Dorsaux","Pectoraux","Deltoïdes","Biceps","Triceps","Abdominaux","Quadriceps","Fessiers","Trapèzes","Obliques","Érecteurs du rachis"
Ex: Pull-ups→["Dorsaux","Biceps"] | Push-ups→["Pectoraux","Triceps"] | L-sit→["Abdominaux","Hip flexors"]

equipment (string FR): "Barre de traction","Barres parallèles","Poids du corps","Anneaux","Parallettes","Élastiques","Gilet lesté","Ceinture à dips"

# JSON Structure
{sessionId,sessionName,type:\"Calisthenics Street Workout\",category:\"calisthenics-street\",durationTarget:60,focus:[\"Muscle-up progressions\"],sessionSummary,warmup:{duration:5,isOptional:true,exercises:[{id,name,duration:60,sets:2,reps:10,instructions,targetAreas:[\"wrists\"]}],notes:\"Mobilité poignets/épaules/hanches. Activation scapulaire CRITIQUE.\"},exercises:[{id,name,variant,sets:5,reps:5|holdTime:20|repsProgression:[15,12,10,8],tempo,rest:180,rpeTarget:8,movementPattern,muscleGroups:[\"Dorsaux\",\"Pectoraux\"],equipment:\"Barre de traction\",skillLevel:\"intermediate\",progressionStage,substitutions:[\"High pull-ups\",\"Band-assisted\"],intensificationTechnique,intensificationDetails,executionCues,coachNotes,coachTips,safetyNotes,commonMistakes}],cooldown:{duration:5,exercises,notes},overallNotes,expectedRpe:7.5,coachRationale}

CRITIQUE: Tous noms FR | holdTime statiques, reps dynamiques | TOUJOURS substitutions 2-3 | Si lestés: load array kg | Progressions graduées niveau user
`;

    const equipmentList = preparerContext.availableEquipment.join(", ");
    const equipmentCount = preparerContext.availableEquipment.length;
    const avoidMovements = userContext.training?.movementsToAvoid?.join(", ") || "Aucun";

    let trainingContext = "outdoor street workout";
    const locationType = preparerContext.locationType || "outdoor";
    if (locationType === "outdoor") {
      trainingContext = "outdoor street workout (barres publiques, structures urbaines, espaces verts)";
    } else if (locationType === "home") {
      trainingContext = equipmentCount < 5
        ? "home minimaliste (poids du corps pur, mobilier créatif)"
        : "home gym calisthenics (barre traction, anneaux, parallettes)";
    } else if (locationType === "gym") {
      trainingContext = "gym avec équipements calisthenics (anneaux, barres, machines assistance)";
    }

    // Extract exercise catalog from userContext if available
    const exerciseCatalog = userContext?.exerciseCatalog;
    const hasExerciseCatalog = exerciseCatalog && exerciseCatalog.exercises && exerciseCatalog.exercises.length > 0;

    console.log('[COACH-CALISTHENICS] Exercise catalog availability', {
      hasExerciseCatalog,
      exerciseCount: hasExerciseCatalog ? exerciseCatalog.exercises.length : 0
    });

    let exerciseCatalogSection = '';
    if (hasExerciseCatalog) {
      const userLanguage = exerciseCatalog.language || 'fr';

      // CRITICAL: Filter exercises to prevent timeout (400+ → 50-60 exercises)
      const filteredExercises = filterExercisesByContext(
        exerciseCatalog.exercises,
        {
          discipline: 'calisthenics',
          availableEquipment: preparerContext.availableEquipment,
          userLevel: userContext.profile?.training_level || undefined,
          maxExercises: 50
        }
      );

      console.log('[COACH-CALISTHENICS] Exercise catalog filtered', {
        originalCount: exerciseCatalog.exercises.length,
        filteredCount: filteredExercises.length,
        reduction: `${Math.round((1 - filteredExercises.length / exerciseCatalog.exercises.length) * 100)}%`
      });

      exerciseCatalogSection = `

# ${userLanguage === 'fr' ? 'CATALOGUE CALISTHENICS' : 'CALISTHENICS CATALOG'}
${userLanguage === 'fr' ? `UTILISE UNIQUEMENT exercices catalogue. Filtré: ${filteredExercises.length} exercices. NE génère PAS nouveaux.` : `USE ONLY catalog exercises. Filtered: ${filteredExercises.length} exercises. DO NOT generate new.`}

${formatExercisesForAI(filteredExercises, userLanguage as 'fr' | 'en')}

${userLanguage === 'fr' ? 'IMPORTANT: Progressions (tuck→straddle→full) et régressions catalogue pour adapter niveau.' : 'IMPORTANT: Progressions (tuck→straddle→full) and regressions from catalog to adapt level.'}
`;
    }

    const userPrompt = `Contexte User:
${JSON.stringify(userContext,null,2)}

Preparer:
${JSON.stringify(preparerContext,null,2)}
${exerciseCatalogSection}

Prescription Calisthenics/Street Workout personnalisée.

Contraintes:
Temps: ${preparerContext.availableTime}min | Env: ${trainingContext} | Équip (${equipmentCount}): ${equipmentList} | Énergie: ${preparerContext.energyLevel}/10 | Éviter: ${avoidMovements}${hasExerciseCatalog ? ` | UNIQUEMENT catalogue (${exerciseCatalog.totalCount} exercices)` : ''}

Objectifs: Focus progressions skills adaptées | Force relative (ratio force/poids) | Équilibre pull/push 2:1 | Variantes réalistes historique | Mobilité 5-8min warmup (poignets/épaules obligatoire) | Si wantsShortVersion→warmup 3-5min

Équipements CRÉATIFS: Analyser ${trainingContext} | Maximiser créativité (barres publiques/structures urbaines/mobilier home) | Substitutions 2-3 alternatives | Progressions adaptées niveau | Outdoor→barres/structures | Home→bodyweight+mobilier

Principe: Force relative>absolue

# APPRENTISSAGE PAR FEEDBACKS UTILISATEUR (CRITIQUE)

**RÈGLE FONDAMENTALE**: Les feedbacks utilisateur passés sont **LA PRIORITÉ ABSOLUE** pour adapter les prescriptions futures.

## Analyse des Feedbacks

Le contexte utilisateur contient \`userFeedbacks\` avec:
- \`totalFeedbacks\`: Nombre total de feedbacks
- \`averageSentiment\`: Score moyen (-1 = très négatif, +1 = très positif)
- \`topThemes\`: Thèmes récurrents (ex: "progression trop rapide", "skills impossibles", "excellent tempo")
- \`recentFeedbacks\`: 5 derniers feedbacks avec texte, discipline, sentiment

## Règles d'Adaptation

### Si averageSentiment < -0.3 (négatifs):
- **DESCENDRE progressions**: si planche advanced, revenir à planche tuck
- **RÉDUIRE volume**: -2 sets par exercice ou -20% reps totales
- **AUGMENTER récupération**: +30-60s entre sets
- **PRIORISER fondamentaux**: push-ups/pull-ups basiques vs skills avancés

### Si averageSentiment > 0.5 (très positifs):
- **MAINTENIR progressions** actuelles
- **VARIER légèrement**: changer angle (ring vs barre) ou type (isométrique vs dynamique)
- **PROGRESSER modérément**: étape suivante de la progression

### Thèmes - Actions:

**"trop difficile" / "impossible" / "technique hors portée"**:
- RECULER de 2 étapes dans progressions (ex: tuck planche → lean)
- RÉDUIRE hold times isométriques (-50%)
- SIMPLIFIER combinaisons (muscle-up → pull-up + dip séparés)

**"monotone" / "manque variété"**:
- VARIER équipement (sol → barres → anneaux)
- ALTERNER types: isométrique, concentrique, pliométrique
- INTRODUIRE nouvelles skills du catalogue

**"pas assez challengeant" / "trop facile"**:
- AVANCER progressions (+1 étape)
- AUGMENTER hold times (+30-50%)
- AJOUTER tempo plus lent (5-1-5-1)

**"parfait" / "progression idéale"**:
- CONSERVER structure et progressions
- Varier seulement ordre ou combos

## Importance Hiérarchique

1. **Feedbacks récents** (< 7j) → Poids maximal
2. **Skills mastery level**
3. **Historique progression**
4. **Profil utilisateur**

**CRITIQUE**: Si feedback dit "skills trop durs", même si "avancé", TU DOIS reculer dans progressions.

Génère la prescription complète en JSON.`;

    const openaiRequestBody: any = {
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "session_prescription_calisthenics",
          strict: false,
          schema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
              sessionName: { type: "string", description: "Nom descriptif et motivant de la séance (max 40 char)" },
              type: { type: "string" },
              category: { type: "string" },
              durationTarget: { type: "number" },
              focus: { type: "array", items: { type: "string" } },
              sessionSummary: { type: "string", description: "Résumé narratif de la séance en 1-2 phrases (100-150 char)" },
              warmup: {
                type: "object",
                properties: {
                  duration: { type: "number" },
                  isOptional: { type: "boolean" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        duration: { type: "number" },
                        sets: { type: "number" },
                        reps: { type: "number" },
                        instructions: { type: "string" },
                        targetAreas: { type: "array", items: { type: "string" } }
                      },
                      required: ["id", "name", "instructions", "targetAreas"]
                    }
                  },
                  notes: { type: "string" }
                },
                required: ["duration", "isOptional", "exercises", "notes"]
              },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    variant: { type: "string" },
                    sets: { type: "number" },
                    reps: { type: "number" },
                    holdTime: { type: "number", description: "Pour mouvements statiques/isométriques en secondes" },
                    load: { type: "number", description: "Optionnel pour exercices lestés" },
                    repsProgression: { type: "array", items: { type: "number" }, description: "Optionnel: Reps progressives par série pour pyramides" },
                    tempo: { type: "string" },
                    rest: { type: "number" },
                    rpeTarget: { type: "number" },
                    movementPattern: { type: "string" },
                    muscleGroups: { type: "array", items: { type: "string" }, description: "1-3 groupes musculaires ciblés en français (ex: [\"Dorsaux\", \"Pectoraux\"])" },
                    equipment: { type: "string", description: "Équipement principal utilisé en français (ex: \"Barre de traction\", \"Barres parallèles\", \"Poids du corps\")" },
                    skillLevel: { type: "string", description: "Niveau du skill: beginner, novice, intermediate, advanced, elite, master" },
                    progressionStage: { type: "string", description: "Étape de progression: tuck, straddle, full, weighted, etc." },
                    substitutions: { type: "array", items: { type: "string" } },
                    intensificationTechnique: { type: "string" },
                    intensificationDetails: { type: "string" },
                    executionCues: { type: "array", items: { type: "string" } },
                    coachNotes: { type: "string" },
                    coachTips: { type: "array", items: { type: "string" } },
                    safetyNotes: { type: "array", items: { type: "string" } },
                    commonMistakes: { type: "array", items: { type: "string" } }
                  },
                  required: ["id", "name", "sets", "rest", "rpeTarget", "movementPattern", "muscleGroups", "equipment", "substitutions", "intensificationTechnique", "executionCues", "coachNotes"]
                }
              },
              cooldown: {
                type: "object",
                properties: {
                  duration: { type: "number" },
                  exercises: { type: "array", items: { type: "string" } },
                  notes: { type: "string" }
                },
                required: ["duration", "exercises", "notes"]
              },
              overallNotes: { type: "string" },
              expectedRpe: { type: "number" },
              coachRationale: { type: "string" }
            },
            required: ["sessionId", "type", "category", "durationTarget", "focus", "warmup", "exercises", "cooldown", "overallNotes", "expectedRpe", "coachRationale"]
          }
        }
      }
    };

    console.log("[COACH-CALISTHENICS] Calling OpenAI API");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(openaiRequestBody),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[COACH-CALISTHENICS] OpenAI API Error:", errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log("[COACH-CALISTHENICS] OpenAI response received", {
      hasChoices: !!openaiData.choices,
      choicesLength: openaiData.choices?.length || 0
    });

    const message = openaiData.choices?.[0]?.message;
    if (!message?.content) {
      throw new Error("Invalid OpenAI response: missing content");
    }

    const prescriptionData = JSON.parse(message.content);
    const responseId = openaiData.id;

    console.log("[COACH-CALISTHENICS] Prescription generated successfully", {
      sessionId: prescriptionData.sessionId,
      exercisesCount: prescriptionData.exercises?.length || 0,
      responseId
    });

    // Consume tokens after successful OpenAI call
    const consumptionResult = await consumeTokensAtomic(supabase, {
      userId,
      edgeFunctionName: 'training-coach-calisthenics',
      operationType: 'calisthenics-prescription-generation',
      openaiModel: 'gpt-5-mini',
      openaiInputTokens: openaiData.usage?.prompt_tokens,
      openaiOutputTokens: openaiData.usage?.completion_tokens,
      metadata: {
        requestId,
        locationType: preparerContext.locationType,
        equipmentCount: preparerContext.availableEquipment.length,
        exercisesCount: prescriptionData.exercises?.length || 0,
        availableTime: preparerContext.availableTime
      }
    }, requestId);

    if (!consumptionResult.success) {
      console.error('[COACH-CALISTHENICS] Token consumption failed but continuing', {
        error: consumptionResult.error,
        requestId
      });
    }

    console.log('[COACH-CALISTHENICS] Token consumption completed', {
      tokensConsumed: consumptionResult.consumed || 0,
      remainingBalance: consumptionResult.remainingBalance || 0
    });

    console.log("[COACH-CALISTHENICS] [CACHE] Caching result...");
    const expiresAt = new Date(Date.now() + 1800 * 1000);
    const cacheEntry = {
      cache_key: cacheKey,
      user_id: userId,
      cache_type: "prescription",
      cached_data: prescriptionData,
      expires_at: expiresAt.toISOString(),
      metadata: {
        openai_response_id: responseId,
        generated_at: new Date().toISOString(),
        equipment_count: equipmentCount,
        location_type: locationType,
        coach_type: 'calisthenics'
      }
    };

    await supabase.from("training_ai_cache").upsert(cacheEntry, { onConflict: "cache_key" });
    console.log("[COACH-CALISTHENICS] [CACHE] Cached successfully");

    console.log("[COACH-CALISTHENICS] [VALIDATION] Starting validation...");
    const validationErrors: string[] = [];

    if (!prescriptionData.sessionId) validationErrors.push("Missing sessionId");
    if (!prescriptionData.type) validationErrors.push("Missing type");
    if (!prescriptionData.category) validationErrors.push("Missing category");
    if (!prescriptionData.durationTarget || typeof prescriptionData.durationTarget !== 'number') validationErrors.push("Missing or invalid durationTarget");
    if (!prescriptionData.focus || !Array.isArray(prescriptionData.focus)) validationErrors.push("Missing or invalid focus array");
    if (!prescriptionData.warmup) validationErrors.push("Missing warmup");

    if (!prescriptionData.exercises || !Array.isArray(prescriptionData.exercises)) {
      validationErrors.push("Missing or invalid exercises array");
    } else if (prescriptionData.exercises.length === 0) {
      validationErrors.push("Exercises array is empty");
    } else {
      prescriptionData.exercises.forEach((ex: any, idx: number) => {
        const exErrors: string[] = [];
        if (!ex.id) exErrors.push('id');
        if (!ex.name) exErrors.push('name');
        if (!ex.sets || typeof ex.sets !== 'number') exErrors.push('sets');

        const hasValidReps = (typeof ex.reps === 'number' && ex.reps > 0);
        const hasValidHoldTime = (typeof ex.holdTime === 'number' && ex.holdTime > 0);
        const hasValidRepsProgression = (Array.isArray(ex.repsProgression) && ex.repsProgression.length > 0);

        if (!hasValidReps && !hasValidHoldTime && !hasValidRepsProgression) {
          exErrors.push('reps or holdTime or repsProgression');
        }

        if (ex.rest === undefined || ex.rest === null || typeof ex.rest !== 'number') {
          exErrors.push('rest');
        } else if (ex.rest < 0) {
          exErrors.push('rest (must be >= 0)');
        }

        if (!ex.rpeTarget || typeof ex.rpeTarget !== 'number') exErrors.push('rpeTarget');
        if (!ex.movementPattern) exErrors.push('movementPattern');
        if (!ex.substitutions || !Array.isArray(ex.substitutions)) exErrors.push('substitutions');
        if (!ex.intensificationTechnique) exErrors.push('intensificationTechnique');
        if (!ex.executionCues || !Array.isArray(ex.executionCues)) exErrors.push('executionCues');
        if (!ex.coachNotes) exErrors.push('coachNotes');

        if (exErrors.length > 0) validationErrors.push(`Exercise ${idx} (${ex.name || 'unknown'}) missing: ${exErrors.join(', ')}`);
      });
    }

    if (!prescriptionData.cooldown) validationErrors.push("Missing cooldown");
    if (!prescriptionData.overallNotes) validationErrors.push("Missing overallNotes");
    if (!prescriptionData.expectedRpe || typeof prescriptionData.expectedRpe !== 'number') validationErrors.push("Missing or invalid expectedRpe");
    if (!prescriptionData.coachRationale) validationErrors.push("Missing coachRationale");

    if (validationErrors.length > 0) {
      console.error("[COACH-CALISTHENICS] [VALIDATION] FAILED:", validationErrors);
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    console.log("[COACH-CALISTHENICS] [VALIDATION] SUCCESS");

    return new Response(JSON.stringify({
      success: true,
      data: prescriptionData,
      metadata: {
        openai_response_id: responseId,
        generated_at: new Date().toISOString(),
        equipment_count: equipmentCount,
        location_type: locationType,
        coach_type: 'calisthenics',
        tokensConsumed: consumptionResult.consumed || 0,
        remainingBalance: consumptionResult.remainingBalance || 0,
        cached: false
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[COACH-CALISTHENICS] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
        data: null,
        metadata: {
          error_type: error.name,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

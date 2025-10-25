/**
 * Training Coach Force Edge Function
 * Generates personalized Force & Powerbuilding training prescriptions using GPT-5 mini
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.54.0";
import { checkTokenBalance, consumeTokensAtomic, createInsufficientTokensResponse } from "../_shared/tokenMiddleware.ts";
import { formatExercisesForAI, filterExercisesByContext } from "../_shared/exerciseDatabaseService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CoachForceRequest {
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
    const requestBody: CoachForceRequest = await req.json();
    const { userId, userContext, preparerContext } = requestBody;

    console.log("[COACH-FORCE] Request received", {
      userId,
      availableTime: preparerContext.availableTime,
      energyLevel: preparerContext.energyLevel,
      equipmentCount: preparerContext.availableEquipment.length,
      locationType: preparerContext.locationType
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cacheKey = `prescription_${userId}_${new Date().toISOString().split('T')[0]}_${preparerContext.locationType || 'gym'}_${preparerContext.availableTime}`;
    
    const { data: cachedData } = await supabase
      .from("training_ai_cache")
      .select("cached_data, expires_at, metadata")
      .eq("cache_key", cacheKey)
      .eq("user_id", userId)
      .eq("cache_type", "prescription")
      .maybeSingle();

    if (cachedData && new Date(cachedData.expires_at) > new Date()) {
      console.log("[COACH-FORCE] [CACHE] Cache hit, returning cached prescription (NO TOKEN CONSUMPTION)");
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

    console.log("[COACH-FORCE] [CACHE] Cache miss, generating new prescription");

    // TOKEN PRE-CHECK - Estimate tokens needed for prescription generation
    const estimatedTokens = 100; // GPT-5-mini for force prescription with long prompt
    const tokenCheck = await checkTokenBalance(supabase, userId, estimatedTokens);

    if (!tokenCheck.hasEnoughTokens) {
      console.warn("[COACH-FORCE] Insufficient tokens", {
        userId,
        currentBalance: tokenCheck.currentBalance,
        requiredTokens: estimatedTokens,
        isSubscribed: tokenCheck.isSubscribed
      });

      return createInsufficientTokensResponse(
        tokenCheck.currentBalance,
        estimatedTokens,
        !tokenCheck.isSubscribed,
        corsHeaders
      );
    }

    console.log("[COACH-FORCE] Token balance sufficient, proceeding with generation");

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    console.log("[COACH-FORCE] OpenAI API key found");

    const systemPrompt = `Coach IA Force & Powerbuilding expert.

# CATALOGUE D'EXERCICES
**SI catalogue fourni**: UTILISE UNIQUEMENT ces exercices (groupes musculaires, équipement, niveau). Respecte métadonnées (difficulté, tempo, sets/reps, sécurité).
**SINON**: Génère selon connaissances standards.

# Principes
- Périodisation: Linéaire (déb +2.5-5kg/sem), Ondulée (inter/av)
- Volume: 10-25 sets/groupe/sem | Intensité: Force 85-95%, Hypertrophie 70-85%
- Repos: Force 3-5min, Hypertrophie 60-90s | Tempo: Force explosif, Hypertrophie 3-0-1-0
- RPE cible: 7-8 (2-3 reps réserve)

# Ordre Exercices (CRITIQUE)
1. Composés majeurs (60-70%): Squat, Bench, Deadlift, Press, Row - DÉBUT séance
2. Composés secondaires (20-25%): Fentes, Dips, Tractions, Hip Thrust
3. Isolation (10-15%): Biceps, Triceps, Deltoïdes - FIN séance UNIQUEMENT

# Warmup (OBLIGATOIRE)
3-5min (2-3 si rapide), mobilité articulaire ciblée, mouvements lents, isOptional: true
Structure: {duration, isOptional: true, exercises: [{id, name, duration, sets, reps, instructions, targetAreas}], notes}

# Adaptation Lieu
**Gym**: Machines, barres, ramping, isolation | **Home**: Poids corps, meubles (Chaise/Table/Escaliers/Mur), objets (Bidon/Sac), créativité | **Outdoor**: Fonctionnel, éléments urbains/naturels (Bancs/Escaliers/Branches/Roches)

# Récupération (CRITIQUE)
Analyser recoveryAnalysis AVANT génération:
- **Dernière séance <3j**: Groupes complémentaires (Jambes→Haut, Pecs/Tri→Dos/Bi)
- **recoveryStatus**: fatigued (NE PAS), recovering (Léger RPE 6-7, -50% vol), recovered (Normal)
- **Variation**: frequency≥2 → VARIANTE obligatoire (Squat→Front/Goblet, Bench→Incline/Dips, Row→DB/Poulie, DL→RDL/Sumo)
- **Algorithme**: 1) Analyser fréquences 2) Lister recovered 3) Éliminer fatigued 4) Filtrer freq≥2 5) Nouveaux (freq=0) > Rares (freq=1)

# Champs OBLIGATOIRES
- **muscleGroups**: Array 1-3 groupes FR (ex: ["Quadriceps","Fessiers"])
- **equipment**: String équipement principal FR (ex: "Barre olympique", "Poids du corps")
- **reps** (nombre) OU **repsProgression** (array) - JAMAIS les deux
- **load**: Array progressif pour composés [s1,s2,s3...] (ex: [60,80,100,110,120]) - JAMAIS charge unique
- **rest**: Nombre (secondes) - TOUJOURS inclure
- **substitutions**: Min 2 alternatives
- **intensificationTechnique/Details**, **executionCues**, **coachNotes**: OBLIGATOIRES

# Format JSON
Structure: {sessionId, sessionName (max 40 car), type, category, durationTarget, focus, sessionSummary (100-150 car), warmup {duration, isOptional: true, exercises: [{id, name, duration, sets, reps, instructions, targetAreas}], notes}, exercises: [{id, name, variant, sets, reps, load (array progressif), tempo, rest, rpeTarget, movementPattern, muscleGroups (array FR), equipment (string FR), substitutions (min 2), intensificationTechnique, intensificationDetails, executionCues, coachNotes, coachTips, safetyNotes, commonMistakes}], cooldown {duration, exercises, notes}, overallNotes, expectedRpe, coachRationale}

# Feedbacks Utilisateur (PRIORITÉ ABSOLUE)
Contexte contient userFeedbacks (totalFeedbacks, averageSentiment, topThemes, recentFeedbacks).
**Adaptations**:
- avgSentiment < -0.3: -10-15% charges, -1 set, +30s repos, simplifier
- avgSentiment > 0.5: maintenir structure, varier légèrement, progresser modérément
- "trop dur": RPE 6-7, -20-30% vol, simplifier techniques
- "répétitif": maximiser diversité (freq≥1), alterner techniques
- "facile": RPE 8-9, techniques intensification, +15-20% vol
- "parfait": ne rien changer
**Hiérarchie**: Feedbacks récents > Recovery > Historique > Profil

IMPORTANT: Noms FR (ex: "Squat arrière"), champs muscleGroups/equipment/intensificationTechnique/executionCues/coachNotes OBLIGATOIRES, load = array progressif composés, min 2 substitutions.
`;

    const equipmentList = preparerContext.availableEquipment.join(", ");
    const equipmentCount = preparerContext.availableEquipment.length;
    const avoidMovements = userContext.training?.movementsToAvoid?.join(", ") || "Aucun";

    let trainingContext = "standard";
    const locationType = preparerContext.locationType || "gym";
    if (locationType === "outdoor") {
      trainingContext = "outdoor (structures urbaines, éléments naturels, calisthenics)";
    } else if (locationType === "home") {
      trainingContext = equipmentCount < 10
        ? "home gym minimaliste (focus créativité, poids de corps, meubles)"
        : "home gym complet";
    } else if (locationType === "gym") {
      trainingContext = equipmentCount > 50
        ? "gym professionnel complet (toutes options disponibles)"
        : "gym standard";
    }

    // Extract exercise catalog from userContext if available
    const exerciseCatalog = userContext.exerciseCatalog;
    const hasExerciseCatalog = exerciseCatalog && exerciseCatalog.exercises && exerciseCatalog.exercises.length > 0;

    console.log("[COACH-FORCE] Exercise catalog availability", {
      hasExerciseCatalog,
      exerciseCount: hasExerciseCatalog ? exerciseCatalog.exercises.length : 0
    });

    let exerciseCatalogSection = "";
    if (hasExerciseCatalog) {
      const userLanguage = exerciseCatalog.language || 'fr';

      // CRITICAL: Filter exercises to prevent timeout (400+ → 60-80 exercises)
      const filteredExercises = filterExercisesByContext(
        exerciseCatalog.exercises,
        {
          discipline: 'strength',
          availableEquipment: preparerContext.availableEquipment,
          userLevel: userContext.profile?.training_level || undefined,
          maxExercises: 60
        }
      );

      console.log("[COACH-FORCE] Exercise catalog filtered", {
        originalCount: exerciseCatalog.exercises.length,
        filteredCount: filteredExercises.length,
        reduction: `${Math.round((1 - filteredExercises.length / exerciseCatalog.exercises.length) * 100)}%`
      });

      exerciseCatalogSection = `

# ${userLanguage === 'fr' ? 'CATALOGUE D\'EXERCICES DISPONIBLES' : 'AVAILABLE EXERCISE CATALOG'}

${userLanguage === 'fr'
  ? `TU DOIS UTILISER UNIQUEMENT LES EXERCICES DE CE CATALOGUE.
Ne génère PAS de nouveaux exercices. Catalogue filtré: ${filteredExercises.length} exercices optimisés pour ce contexte.`
  : `YOU MUST USE ONLY EXERCISES FROM THIS CATALOG.
Do NOT generate new exercises. Filtered catalog: ${filteredExercises.length} exercises optimized for this context.`}

${formatExercisesForAI(filteredExercises, userLanguage as 'fr' | 'en')}

${userLanguage === 'fr'
  ? `IMPORTANT: Pour chaque exercice sélectionné, tu peux utiliser les substitutions et progressions listées dans le catalogue.`
  : `IMPORTANT: For each selected exercise, you can use the substitutions and progressions listed in the catalog.`}
`;
    }

    const userPrompt = `# Contexte Utilisateur

${JSON.stringify(userContext, null, 2)}

# Contexte de Préparation

${JSON.stringify(preparerContext, null, 2)}
${exerciseCatalogSection}

# Instructions

Génère une prescription de training Force & Powerbuilding totalement personnalisée.

**Contraintes impératives**:
- Respecter le temps disponible: ${preparerContext.availableTime} minutes
- Type d'environnement: ${trainingContext}
- Utiliser UNIQUEMENT ces équipements (${equipmentCount} disponibles): ${equipmentList}
- Niveau d'énergie: ${preparerContext.energyLevel}/10
- Éviter ces mouvements: ${avoidMovements}
${hasExerciseCatalog ? `- **UTILISER UNIQUEMENT les exercices du catalogue fourni ci-dessus (${exerciseCatalog.totalCount} exercices disponibles)**` : ''}

**Objectifs de Personnalisation**:
- Focus sur la progression et la technique
- Adapter l'intensité au niveau d'énergie
- Prescrire des charges réalistes basées sur l'historique
- **IMPORTANT**: Générer un échauffement articulaire court (3-5 min) dans warmup
- Si wantsShortVersion = true, échauffement minimal (2-3 min, 2-3 mouvements)
${hasExerciseCatalog ? '- **SÉLECTIONNER les exercices du catalogue en fonction des groupes musculaires ciblés et de l\'équipement disponible**' : ''}

**Utilisation INTELLIGENTE des Équipements**:
- ANALYSER le contexte: ${trainingContext}
- MAXIMISER la diversité: Utiliser TOUS les équipements disponibles de manière créative
- SUBSTITUTIONS créatives: Proposer 2-3 alternatives selon équipements disponibles
- PROGRESSIONS adaptées: Adapter la difficulté avec les équipements à disposition
- Si contexte limité (outdoor/home minimaliste): être ULTRA CRÉATIF avec substitutions

**Utilisation Équipements**: Utiliser intelligemment les équipements disponibles ci-dessous. Si équipement spécialisé (GHD, hip thrust machine, log, etc.): l'intégrer. Si limité: alternatives créatives (mobilier, structures urbaines, éléments naturels).

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
          name: "session_prescription",
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
                    load: { anyOf: [{ type: "number" }, { type: "array", items: { type: "number" } }], description: "Charge unique OU array de charges progressives par série" },
                    repsProgression: { type: "array", items: { type: "number" }, description: "Optionnel: Reps progressives par série pour pyramides inverses" },
                    tempo: { type: "string" },
                    rest: { type: "number" },
                    rpeTarget: { type: "number" },
                    movementPattern: { type: "string" },
                    muscleGroups: { type: "array", items: { type: "string" }, description: "1-3 groupes musculaires ciblés en français (ex: [\"Pectoraux\", \"Triceps\"])" },
                    equipment: { type: "string", description: "Équipement principal utilisé en français (ex: \"Barre olympique\", \"Haltères\", \"Poids du corps\")" },
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

    console.log("[COACH-FORCE] Calling OpenAI API");

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
      console.error("[COACH-FORCE] OpenAI API Error:", errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log("[COACH-FORCE] OpenAI response received", {
      hasChoices: !!openaiData.choices,
      choicesLength: openaiData.choices?.length || 0,
      usage: openaiData.usage
    });

    const message = openaiData.choices?.[0]?.message;
    if (!message?.content) {
      throw new Error("Invalid OpenAI response: missing content");
    }

    const prescriptionData = JSON.parse(message.content);
    const responseId = openaiData.id;

    // ATOMIC TOKEN CONSUMPTION - After successful OpenAI response
    const requestId = crypto.randomUUID();
    const consumptionResult = await consumeTokensAtomic(supabase, {
      userId,
      edgeFunctionName: 'training-coach-force',
      operationType: 'force-prescription-generation',
      openaiModel: 'gpt-5-mini',
      openaiInputTokens: openaiData.usage?.prompt_tokens,
      openaiOutputTokens: openaiData.usage?.completion_tokens,
      metadata: {
        requestId,
        locationType,
        equipmentCount,
        exercisesCount: prescriptionData.exercises?.length || 0,
        availableTime: preparerContext.availableTime
      }
    }, requestId);

    if (!consumptionResult.success) {
      console.error("[COACH-FORCE] Token consumption failed", {
        error: consumptionResult.error,
        userId,
        requestId
      });
      // Note: We still return the prescription even if token consumption failed
      // This prevents user from losing their generated content
    } else {
      console.log("[COACH-FORCE] Tokens consumed successfully", {
        consumed: consumptionResult.consumed,
        remainingBalance: consumptionResult.remainingBalance,
        requestId: consumptionResult.requestId
      });
    }

    console.log("[COACH-FORCE] Prescription generated successfully", {
      sessionId: prescriptionData.sessionId,
      exercisesCount: prescriptionData.exercises?.length || 0,
      responseId
    });

    console.log("[COACH-FORCE] [CACHE] Caching result...");
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
        location_type: locationType
      }
    };

    await supabase.from("training_ai_cache").upsert(cacheEntry, { onConflict: "cache_key" });
    console.log("[COACH-FORCE] [CACHE] Cached successfully");

    console.log("[COACH-FORCE] [VALIDATION] Starting validation...");
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
        const hasValidRepsProgression = (Array.isArray(ex.repsProgression) && ex.repsProgression.length > 0);
        if (!hasValidReps && !hasValidRepsProgression) exErrors.push('reps or repsProgression');

        // rest is required but can be 0 for isometric exercises
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
      console.error("[COACH-FORCE] [VALIDATION] FAILED:", validationErrors);
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    console.log("[COACH-FORCE] [VALIDATION] SUCCESS");

    return new Response(JSON.stringify({
      success: true,
      data: prescriptionData,
      metadata: {
        openai_response_id: responseId,
        generated_at: new Date().toISOString(),
        equipment_count: equipmentCount,
        location_type: locationType,
        cached: false,
        tokensConsumed: consumptionResult.consumed || 0,
        remainingBalance: consumptionResult.remainingBalance || 0
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[COACH-FORCE] Error:", error);
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

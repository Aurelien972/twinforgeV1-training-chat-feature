/**
 * Training Coach Endurance Edge Function
 * Generates personalized Endurance training prescriptions (Running, Cycling, Swimming, Triathlon)
 * Using GPT-5 mini with specialized endurance coaching prompts
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.54.0";
import { checkTokenBalance, consumeTokensAtomic, createInsufficientTokensResponse } from "../_shared/tokenMiddleware.ts";
import { formatExercisesForAI, filterExercisesByContext } from '../_shared/exerciseDatabaseService.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CoachEnduranceRequest {
  userId: string;
  userContext: any;
  preparerContext: {
    availableTime: number;
    wantsShortVersion: boolean;
    energyLevel: number;
    availableEquipment: string[];
    locationType?: string;
  };
  discipline?: 'running' | 'cycling' | 'swimming' | 'triathlon' | 'cardio';
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  const requestStartTime = Date.now();

  console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Function invoked`, {
    requestId,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  if (req.method === "OPTIONS") {
    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] OPTIONS request - returning CORS headers`);
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Parsing request body`);
    const requestBody: CoachEnduranceRequest = await req.json();
    const { userId, userContext, preparerContext, discipline: requestDiscipline } = requestBody;

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Request parsed successfully`, {
      requestId,
      userId,
      hasUserContext: !!userContext,
      hasPreparerContext: !!preparerContext,
      requestDiscipline,
      preparerContext: {
        availableTime: preparerContext.availableTime,
        wantsShortVersion: preparerContext.wantsShortVersion,
        energyLevel: preparerContext.energyLevel,
        equipmentCount: preparerContext.availableEquipment?.length || 0,
        locationType: preparerContext.locationType,
        locationName: preparerContext.locationName,
        tempSport: (preparerContext as any).tempSport
      },
      userContextSummary: {
        hasProfile: !!userContext?.profile,
        hasSessions: !!userContext?.sessions,
        sessionsCount: userContext?.sessions?.length || 0
      }
    });

    // PRIORITY 1: Use explicitly requested discipline from Step1 selector
    // PRIORITY 2: Use profile discipline
    // PRIORITY 3: Detect from equipment as last resort
    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Discipline resolution strategy`, {
      requestId,
      step1_requestDiscipline: requestDiscipline,
      step2_tempSportInPreparer: (preparerContext as any).tempSport,
      step3_profileDiscipline: userContext?.profile?.preferences?.workout?.type,
      priorityUsed: requestDiscipline ? 'step1_request' : ((preparerContext as any).tempSport ? 'step2_preparer' : (userContext?.profile?.preferences?.workout?.type ? 'step3_profile' : 'step4_equipment_fallback'))
    });

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Initializing Supabase client`);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Supabase client initialized`);

    // Extract discipline with priority: requestDiscipline > tempSport in preparer > profile > fallback
    const explicitDiscipline = requestDiscipline || (preparerContext as any).tempSport || userContext?.profile?.preferences?.workout?.type;

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Explicit discipline extracted before cache check`, {
      requestId,
      explicitDiscipline,
      source: requestDiscipline ? 'request_parameter' : ((preparerContext as any).tempSport ? 'preparer_tempSport' : (userContext?.profile?.preferences?.workout?.type ? 'profile_preferences' : 'none'))
    });

    // Include discipline in cache key to avoid cross-discipline cache pollution
    const cacheKey = `endurance_prescription_${userId}_${explicitDiscipline || 'unknown'}_${new Date().toISOString().split('T')[0]}_${preparerContext.locationType || 'outdoor'}_${preparerContext.availableTime}`;
    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Cache key generated`, {
      requestId,
      cacheKey,
      userId,
      date: new Date().toISOString().split('T')[0],
      locationType: preparerContext.locationType || 'outdoor',
      availableTime: preparerContext.availableTime
    });

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Checking cache`);
    const { data: cachedData, error: cacheReadError } = await supabase
      .from("training_ai_cache")
      .select("cached_data, expires_at")
      .eq("cache_key", cacheKey)
      .eq("user_id", userId)
      .eq("cache_type", "prescription")
      .maybeSingle();

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Cache check completed`, {
      requestId,
      hasCachedData: !!cachedData,
      hasCacheError: !!cacheReadError,
      expiresAt: cachedData?.expires_at
    });

    if (cacheReadError) {
      console.error(`[COACH-ENDURANCE] [REQ:${requestId}] [CACHE] Error reading cache`, {
        requestId,
        error: cacheReadError.message,
        code: cacheReadError.code,
        details: cacheReadError.details,
        hint: cacheReadError.hint,
        cacheKey
      });

      const { error: logError } = await supabase.from("cache_errors_log").insert({
        user_id: userId,
        agent_type: "coach-endurance",
        operation: "read",
        cache_key: cacheKey,
        cache_type: "prescription",
        error_message: cacheReadError.message,
        error_code: cacheReadError.code || null,
        error_details: cacheReadError.details || null,
        error_hint: cacheReadError.hint || null,
        metadata: {
          discipline: requestDiscipline,
          availableTime: preparerContext.availableTime,
          locationType: preparerContext.locationType
        }
      });

      if (logError) {
        console.error(`[COACH-ENDURANCE] [REQ:${requestId}] [MONITORING] Failed to log cache read error`, {
          requestId,
          logError
        });
      }
    }

    if (cachedData && new Date(cachedData.expires_at) > new Date()) {
      const totalLatency = Date.now() - requestStartTime;
      console.log(`[COACH-ENDURANCE] [REQ:${requestId}] [CACHE] Cache hit, returning cached prescription`, {
        requestId,
        cacheKey,
        expiresAt: cachedData.expires_at,
        totalLatencyMs: totalLatency,
        prescriptionStructure: {
          sessionId: cachedData.cached_data?.sessionId,
          type: cachedData.cached_data?.type,
          discipline: cachedData.cached_data?.discipline,
          hasMainWorkout: !!cachedData.cached_data?.mainWorkout,
          mainWorkoutCount: cachedData.cached_data?.mainWorkout?.length || 0
        }
      });
      return new Response(JSON.stringify({
        success: true,
        data: cachedData.cached_data,
        metadata: {
          cached: true,
          latencyMs: totalLatency,
          tokensConsumed: 0
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] [CACHE] Cache miss, generating new prescription`, {
      requestId,
      cacheKey,
      reason: !cachedData ? 'no_cache_entry' : 'cache_expired'
    });

    // TOKEN PRE-CHECK
    const estimatedTokens = 100;
    const tokenCheck = await checkTokenBalance(supabase, userId, estimatedTokens);

    if (!tokenCheck.hasEnoughTokens) {
      console.warn(`[COACH-ENDURANCE] [REQ:${requestId}] Insufficient tokens`, {
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

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Token balance sufficient, proceeding with generation`);

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Checking OpenAI API key`);
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error(`[COACH-ENDURANCE] [REQ:${requestId}] OpenAI API key not configured`);
      throw new Error("OpenAI API key not configured");
    }
    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] OpenAI API key found`);

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Extracting user context data`);
    const userAge = userContext?.identity?.age || userContext?.demographics?.age || 30;
    const fcMax = 220 - userAge;

    // FIXED: Priority-based discipline resolution
    // 1. requestDiscipline (explicit request parameter from Step1 selector)
    // 2. tempSport in preparerContext (backup from Step1)
    // 3. profile discipline (user's default)
    // 4. determineDiscipline (equipment-based fallback - ONLY if no explicit selection)
    const explicitUserSelection = requestDiscipline || (preparerContext as any).tempSport;
    const discipline = explicitUserSelection || userContext?.profile?.preferences?.workout?.type || determineDiscipline(userContext, preparerContext);

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] User context extracted - DISCIPLINE RESOLUTION`, {
      requestId,
      userAge,
      fcMax,
      finalDiscipline: discipline,
      disciplineSourceBreakdown: {
        step1_requestDiscipline: requestDiscipline,
        step2_preparerTempSport: (preparerContext as any).tempSport,
        step3_profileType: userContext?.profile?.preferences?.workout?.type,
        step4_determinedFromEquipment: !explicitUserSelection && !userContext?.profile?.preferences?.workout?.type ? determineDiscipline(userContext, preparerContext) : 'not_used',
        finalSource: requestDiscipline ? 'request_parameter' : ((preparerContext as any).tempSport ? 'preparer_tempSport' : (userContext?.profile?.preferences?.workout?.type ? 'profile' : 'equipment_fallback'))
      },
      explicitUserSelection,
      usedEquipmentFallback: !explicitUserSelection && !userContext?.profile?.preferences?.workout?.type,
      fitnessLevel: userContext?.profile?.fitnessLevel || userContext?.trainingPreferences?.fitnessLevel,
      userContextKeys: userContext ? Object.keys(userContext) : []
    });

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Building prompts`);
    const systemPrompt = buildEnduranceSystemPrompt();
    // Extract exercise catalog from userContext if available
    const exerciseCatalog = userContext?.exerciseCatalog;
    const hasExerciseCatalog = exerciseCatalog && exerciseCatalog.exercises && exerciseCatalog.exercises.length > 0;

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Exercise catalog availability`, {
      requestId,
      hasExerciseCatalog,
      exerciseCount: hasExerciseCatalog ? exerciseCatalog.exercises.length : 0
    });

    let exerciseCatalogSection = '';
    if (hasExerciseCatalog) {
      const userLanguage = exerciseCatalog.language || 'fr';

      // CRITICAL: Filter exercises to prevent timeout (400+ → 40-50 exercises)
      const filteredExercises = filterExercisesByContext(
        exerciseCatalog.exercises,
        {
          discipline: 'endurance',
          availableEquipment: preparerContext.availableEquipment,
          userLevel: userContext.profile?.training_level || undefined,
          maxExercises: 40
        }
      );

      console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Exercise catalog filtered`, {
        requestId,
        originalCount: exerciseCatalog.exercises.length,
        filteredCount: filteredExercises.length,
        reduction: `${Math.round((1 - filteredExercises.length / exerciseCatalog.exercises.length) * 100)}%`
      });

      exerciseCatalogSection = `

# ${userLanguage === 'fr' ? 'CATALOGUE D\'EXERCICES DRILLS/TECHNIQUES DISPONIBLES' : 'AVAILABLE DRILLS/TECHNIQUES CATALOG'}

${userLanguage === 'fr'
  ? `TU DOIS UTILISER UNIQUEMENT LES EXERCICES DE CE CATALOGUE pour les drills et techniques.
Ne génère PAS de nouveaux noms d'exercices techniques. Catalogue filtré: ${filteredExercises.length} exercices optimisés.`
  : `YOU MUST USE ONLY EXERCISES FROM THIS CATALOG for drills and techniques.
Do NOT generate new technique exercise names. Filtered catalog: ${filteredExercises.length} optimized exercises.`}

${formatExercisesForAI(filteredExercises, userLanguage as 'fr' | 'en')}

${userLanguage === 'fr'
  ? `IMPORTANT: Utilise ces exercices pour les drills techniques, renforcement spécifique, et préparation physique.`
  : `IMPORTANT: Use these exercises for technical drills, specific strengthening, and physical preparation.`}
`;
    }

    const userPrompt = buildUserPrompt(userContext, preparerContext, userAge, fcMax, discipline, exerciseCatalogSection);
    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Prompts built`, {
      requestId,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length
    });

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Calling OpenAI API`, {
      requestId,
      model: 'gpt-5-mini',
      discipline,
      userAge,
      fcMax
    });
    const openaiStartTime = Date.now();

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "endurance_prescription",
            strict: false,
            schema: {
              type: "object",
              properties: {
                sessionId: { type: "string" },
                sessionName: { type: "string" },
                type: { type: "string" },
                category: { type: "string" },
                discipline: { type: "string" },
                durationTarget: { type: "number" },
                distanceTarget: { type: "number" },
                sessionSummary: { type: "string" },
                focusZones: { type: "array", items: { type: "string" } },
                warmup: {
                  type: "object",
                  properties: {
                    duration: { type: "number" },
                    description: { type: "string" },
                    instructions: { type: "string" },
                    targetZone: { type: "string" },
                    targetHR: { type: "string" },
                    dynamicDrills: { type: "array", items: { type: "string" } }
                  },
                  required: ["duration", "description", "instructions", "targetZone"]
                },
                mainWorkout: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: { type: "string" },
                      name: { type: "string" },
                      description: { type: "string" },
                      duration: { type: "number" },
                      distance: { type: "number" },
                      targetZone: { type: "string" },
                      targetPace: { type: "string" },
                      targetHR: { type: "string" },
                      targetPower: { type: "string" },
                      targetCadence: { type: "string" },
                      intervals: {
                        type: "object",
                        properties: {
                          work: {
                            type: "object",
                            properties: {
                              duration: { type: "number" },
                              intensity: { type: "string" },
                              pace: { type: "string" },
                              hr: { type: "string" }
                            },
                            required: ["duration", "intensity"]
                          },
                          rest: {
                            type: "object",
                            properties: {
                              duration: { type: "number" },
                              intensity: { type: "string" },
                              type: { type: "string" }
                            },
                            required: ["duration", "intensity", "type"]
                          },
                          repeats: { type: "number" }
                        },
                        required: ["work", "rest", "repeats"]
                      },
                      cues: { type: "array", items: { type: "string" } },
                      coachNotes: { type: "string" },
                      rpeTarget: { type: "number" }
                    },
                    required: ["id", "type", "name", "duration", "targetZone", "rpeTarget"]
                  }
                },
                cooldown: {
                  type: "object",
                  properties: {
                    duration: { type: "number" },
                    description: { type: "string" },
                    instructions: { type: "string" },
                    targetZone: { type: "string" },
                    stretching: { type: "array", items: { type: "string" } }
                  },
                  required: ["duration", "description", "targetZone"]
                },
                metrics: {
                  type: "object",
                  properties: {
                    estimatedTSS: { type: "number" },
                    estimatedCalories: { type: "number" },
                    estimatedAvgHR: { type: "number" },
                    estimatedAvgPace: { type: "string" },
                    estimatedAvgPower: { type: "string" }
                  }
                },
                overallNotes: { type: "string" },
                expectedRpe: { type: "number" },
                coachRationale: { type: "string" },
                nutritionAdvice: { type: "string" },
                recoveryAdvice: { type: "string" }
              },
              required: ["sessionId", "type", "category", "discipline", "durationTarget", "mainWorkout"]
            }
          }
        }
      }),
    });

    const openaiLatencyMs = Date.now() - openaiStartTime;

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] OpenAI response received`, {
      requestId,
      status: openAIResponse.status,
      statusText: openAIResponse.statusText,
      ok: openAIResponse.ok,
      openaiLatencyMs,
      contentType: openAIResponse.headers.get('content-type')
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error(`[COACH-ENDURANCE] [REQ:${requestId}] OpenAI API error`, {
        requestId,
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        errorText,
        errorTextLength: errorText.length,
        openaiLatencyMs
      });
      throw new Error(`OpenAI API error: ${openAIResponse.status} ${errorText}`);
    }

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Parsing OpenAI JSON response`);
    const openAIData = await openAIResponse.json();
    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] OpenAI response parsed`, {
      requestId,
      openaiLatencyMs,
      hasChoices: !!openAIData.choices,
      choicesLength: openAIData.choices?.length || 0,
      hasUsage: !!openAIData.usage,
      usage: openAIData.usage,
      model: openAIData.model,
      responseId: openAIData.id
    });

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Extracting message content from OpenAI response`);
    const messageContent = openAIData.choices?.[0]?.message?.content;
    if (!messageContent) {
      console.error(`[COACH-ENDURANCE] [REQ:${requestId}] No message content in OpenAI response`, {
        requestId,
        hasChoices: !!openAIData.choices,
        choicesLength: openAIData.choices?.length || 0,
        firstChoice: openAIData.choices?.[0]
      });
      throw new Error('No message content in OpenAI response');
    }

    // ATOMIC TOKEN CONSUMPTION
    const tokenRequestId = crypto.randomUUID();
    const consumptionResult = await consumeTokensAtomic(supabase, {
      userId,
      edgeFunctionName: 'training-coach-endurance',
      operationType: 'endurance-prescription-generation',
      openaiModel: 'gpt-5-mini',
      openaiInputTokens: openAIData.usage?.prompt_tokens,
      openaiOutputTokens: openAIData.usage?.completion_tokens,
      metadata: {
        requestId,
        tokenRequestId,
        discipline,
        locationType: preparerContext.locationType,
        availableTime: preparerContext.availableTime
      }
    }, tokenRequestId);

    if (!consumptionResult.success) {
      console.error(`[COACH-ENDURANCE] [REQ:${requestId}] Token consumption failed`, {
        error: consumptionResult.error,
        userId,
        tokenRequestId
      });
    } else {
      console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Tokens consumed successfully`, {
        consumed: consumptionResult.consumed,
        remainingBalance: consumptionResult.remainingBalance,
        tokenRequestId: consumptionResult.requestId
      });
    }

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Message content extracted`, {
      requestId,
      contentLength: messageContent.length,
      contentPreview: messageContent.substring(0, 200)
    });

    let prescription;
    try {
      console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Parsing prescription JSON`);
      prescription = JSON.parse(messageContent);
      console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Prescription parsed successfully`, {
        requestId,
        prescriptionKeys: Object.keys(prescription),
        hasMainWorkout: !!prescription.mainWorkout,
        mainWorkoutLength: prescription.mainWorkout?.length || 0,
        mainWorkoutType: typeof prescription.mainWorkout,
        mainWorkoutIsArray: Array.isArray(prescription.mainWorkout),
        hasWarmup: !!prescription.warmup,
        hasCooldown: !!prescription.cooldown,
        hasMetrics: !!prescription.metrics,
        sessionId: prescription.sessionId,
        sessionName: prescription.sessionName,
        discipline: prescription.discipline,
        type: prescription.type,
        category: prescription.category,
        durationTarget: prescription.durationTarget,
        distanceTarget: prescription.distanceTarget
      });
    } catch (parseError) {
      console.error(`[COACH-ENDURANCE] [REQ:${requestId}] Failed to parse OpenAI response`, {
        requestId,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown',
        errorStack: parseError instanceof Error ? parseError.stack : undefined,
        messageContentLength: messageContent.length,
        messageContentPreview: messageContent.substring(0, 500)
      });
      throw new Error("Failed to parse AI response as JSON");
    }

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Validating and enriching prescription`);
    prescription = validateAndEnrichPrescription(prescription, preparerContext, userAge, fcMax);

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Prescription validated and enriched`, {
      requestId,
      prescriptionKeys: Object.keys(prescription),
      mainWorkoutCount: prescription.mainWorkout?.length || 0,
      durationTarget: prescription.durationTarget,
      distanceTarget: prescription.distanceTarget,
      sessionId: prescription.sessionId,
      type: prescription.type,
      category: prescription.category,
      hasWarmup: !!prescription.warmup,
      hasCooldown: !!prescription.cooldown,
      hasMetrics: !!prescription.metrics
    });

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Calculating cost`);
    const costUsd = calculateCost(openAIData.usage);
    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Cost calculated`, {
      requestId,
      costUsd,
      usage: openAIData.usage
    });

    const cacheExpiry = new Date();
    cacheExpiry.setHours(cacheExpiry.getHours() + 6);

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Caching prescription`, {
      requestId,
      cacheKey,
      expiresAt: cacheExpiry.toISOString()
    });

    try {
      const cacheEntry = {
        cache_key: cacheKey,
        user_id: userId,
        cache_type: "prescription",
        cached_data: prescription,
        expires_at: cacheExpiry.toISOString()
      };

      console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Upserting cache entry`);
      const { error: cacheError } = await supabase
        .from("training_ai_cache")
        .upsert(cacheEntry, { onConflict: "cache_key" });

      console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Cache upsert completed`, {
        requestId,
        hasCacheError: !!cacheError
      });

      if (cacheError) {
        console.error(`[COACH-ENDURANCE] [REQ:${requestId}] [CACHE] Failed to cache prescription`, {
          requestId,
          cacheKey,
          error: cacheError.message,
          code: cacheError.code,
          details: cacheError.details,
          hint: cacheError.hint
        });

        const { error: logError } = await supabase.from("cache_errors_log").insert({
          user_id: userId,
          agent_type: "coach-endurance",
          operation: "upsert",
          cache_key: cacheKey,
          cache_type: "prescription",
          error_message: cacheError.message,
          error_code: cacheError.code || null,
          error_details: cacheError.details || null,
          error_hint: cacheError.hint || null,
          metadata: {
            discipline,
            availableTime: preparerContext.availableTime,
            locationType: preparerContext.locationType
          }
        });

        if (logError) {
          console.error(`[COACH-ENDURANCE] [REQ:${requestId}] [MONITORING] Failed to log cache error`, {
            requestId,
            logError
          });
        }
      } else {
        console.log(`[COACH-ENDURANCE] [REQ:${requestId}] [CACHE] Prescription cached successfully`, {
          requestId,
          cacheKey,
          expiresAt: cacheExpiry.toISOString()
        });
      }
    } catch (cacheException) {
      console.error(`[COACH-ENDURANCE] [REQ:${requestId}] [CACHE] Cache operation exception (continuing anyway)`, {
        requestId,
        cacheKey,
        error: cacheException instanceof Error ? cacheException.message : "Unknown error",
        errorStack: cacheException instanceof Error ? cacheException.stack : undefined
      });

      const { error: logError } = await supabase.from("cache_errors_log").insert({
        user_id: userId,
        agent_type: "coach-endurance",
        operation: "upsert",
        cache_key: cacheKey,
        cache_type: "prescription",
        error_message: cacheException instanceof Error ? cacheException.message : "Unknown exception",
        error_code: "EXCEPTION",
        error_details: null,
        error_hint: null,
        metadata: {
          discipline,
          exceptionType: cacheException?.constructor?.name
        }
      });

      if (logError) {
        console.error(`[COACH-ENDURANCE] [REQ:${requestId}] [MONITORING] Failed to log cache exception`, {
          requestId,
          logError
        });
      }
    }

    const totalLatency = Date.now() - requestStartTime;
    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Prescription generated successfully`, {
      requestId,
      sessionId: prescription.sessionId,
      sessionName: prescription.sessionName,
      discipline: prescription.discipline,
      type: prescription.type,
      category: prescription.category,
      durationTarget: prescription.durationTarget,
      distanceTarget: prescription.distanceTarget,
      mainWorkoutCount: prescription.mainWorkout?.length || 0,
      hasWarmup: !!prescription.warmup,
      hasCooldown: !!prescription.cooldown,
      totalLatencyMs: totalLatency,
      openaiLatencyMs
    });

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Building final response`);
    const responseData = {
      success: true,
      data: prescription,
      metadata: {
        cached: false,
        tokensUsed: openAIData.usage?.total_tokens || 0,
        tokensConsumed: consumptionResult.consumed || 0,
        remainingBalance: consumptionResult.remainingBalance || 0,
        costUsd,
        model: "gpt-5-mini",
        latencyMs: totalLatency,
        openaiLatencyMs,
        discipline,
        requestId
      }
    };

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Returning successful response`, {
      requestId,
      responseSize: JSON.stringify(responseData).length,
      totalLatencyMs: totalLatency
    });

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const totalLatency = Date.now() - requestStartTime;
    console.error(`[COACH-ENDURANCE] [REQ:${requestId}] Error occurred`, {
      requestId,
      totalLatencyMs: totalLatency,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorDetails: error
    });

    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      metadata: {
        requestId,
        totalLatencyMs: totalLatency,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`[COACH-ENDURANCE] [REQ:${requestId}] Returning error response`, {
      requestId,
      errorMessage: errorResponse.error,
      totalLatencyMs: totalLatency
    });

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/**
 * CRITICAL: This function should ONLY be used as a LAST RESORT fallback
 * when NO explicit discipline has been selected by the user.
 *
 * Priority order (handled by caller):
 * 1. requestDiscipline (explicit from Step1 selector)
 * 2. tempSport in preparerContext (backup)
 * 3. profile.preferences.workout.type (user default)
 * 4. determineDiscipline() <- THIS FUNCTION (equipment-based guess)
 *
 * This function is called ONLY when steps 1-3 have all failed.
 */
function determineDiscipline(userContext: any, preparerContext: any): string {
  console.warn('[COACH-ENDURANCE] [UTIL] ⚠️  FALLBACK: Using equipment-based discipline detection', {
    warning: 'User did not explicitly select discipline - using equipment detection as last resort',
    profileWorkoutType: userContext?.profile?.preferences?.workout?.type,
    trainingPreferencesType: userContext?.trainingPreferences?.preferred_sport,
    hasUserContext: !!userContext,
    hasPreparerContext: !!preparerContext,
    tempSportInPreparer: (preparerContext as any).tempSport
  });

  // Check profile one more time (should have been caught by caller, but defensive)
  const trainingType = userContext?.profile?.preferences?.workout?.type || userContext?.trainingPreferences?.preferred_sport;

  if (['running', 'cycling', 'swimming', 'triathlon', 'cardio'].includes(trainingType)) {
    console.log('[COACH-ENDURANCE] [UTIL] Found profile discipline on second check', {
      trainingType,
      source: userContext?.profile?.preferences?.workout?.type ? 'profile' : 'trainingPreferences'
    });
    return trainingType;
  }

  // Equipment-based detection as absolute last resort
  const equipment = preparerContext.availableEquipment || [];
  console.log('[COACH-ENDURANCE] [UTIL] Analyzing equipment for discipline hints', {
    equipmentCount: equipment.length,
    equipmentList: equipment,
    note: 'This is a guess based on available equipment - may not reflect user intent'
  });

  // Check for bike equipment
  if (equipment.some((eq: string) => {
    const eqLower = eq.toLowerCase();
    return eqLower.includes('bike') || eqLower.includes('vélo') || eqLower.includes('trainer') || eqLower.includes('home trainer');
  })) {
    console.log('[COACH-ENDURANCE] [UTIL] ⚠️  GUESSING discipline from equipment: cycling', {
      warning: 'User may have intended a different discipline'
    });
    return 'cycling';
  }

  // Check for swimming equipment
  if (equipment.some((eq: string) => {
    const eqLower = eq.toLowerCase();
    return eqLower.includes('pool') || eqLower.includes('piscine') || eqLower.includes('swim') || eqLower.includes('natation');
  })) {
    console.log('[COACH-ENDURANCE] [UTIL] ⚠️  GUESSING discipline from equipment: swimming', {
      warning: 'User may have intended a different discipline - e.g., cycling at pool location'
    });
    return 'swimming';
  }

  // Check for running equipment
  if (equipment.some((eq: string) => {
    const eqLower = eq.toLowerCase();
    return eqLower.includes('treadmill') || eqLower.includes('tapis') || eqLower.includes('track') || eqLower.includes('piste');
  })) {
    console.log('[COACH-ENDURANCE] [UTIL] ⚠️  GUESSING discipline from equipment: running', {
      warning: 'User may have intended a different discipline'
    });
    return 'running';
  }

  console.warn('[COACH-ENDURANCE] [UTIL] ⚠️  No discipline indicators found, defaulting to running', {
    warning: 'This is an arbitrary default - user experience may be poor'
  });
  return 'running';
}

function buildEnduranceSystemPrompt(): string {
  return `Tu es un coach IA expert en Sports d'Endurance.

# RÈGLE FONDAMENTALE - CATALOGUE D'EXERCICES

**SI un catalogue d'exercices est fourni dans le contexte utilisateur**:
- TU DOIS UTILISER UNIQUEMENT les exercices du catalogue pour les drills/techniques
- NE GÉNÈRE PAS de nouveaux noms d'exercices techniques
- SÉLECTIONNE les exercices selon: discipline (running, cycling, swimming), niveau, objectifs zones
- UTILISE les exercices de technique, drills, renforcement spécifique du catalogue
- RESPECTE les métadonnées: difficulté, zones cardiaques typiques, durée

**SI aucun catalogue n'est fourni**:
- Génère des exercices selon tes connaissances standards

# Zones d'Entraînement (% FCMax)
Z1: 50-60% (Récupération)
Z2: 60-70% (Endurance Fondamentale)
Z3: 70-80% (Tempo)
Z4: 80-90% (Seuil Lactique)
Z5: 90-100% (VO2Max)

# Principe 80/20
80% du volume en Z1-Z2 (facile), 20% en Z3-Z5 (difficile)

# Types de Séances

**Running**:
- Easy Run: Z1-Z2, conversation fluide
- Long Run: Z2, 60-180min, base aérobie
- Tempo: Z3-Z4, "comfortably hard", 20-40min
- Intervals: Z4-Z5, 3-8min work / 2-3min rest
- Fartlek: Variations allures

**Cycling**:
- Recovery: Z1, 30-60min
- Endurance: Z2, 60-240min, base
- Sweet Spot: 88-94% FTP, intervalles 10-30min
- Threshold: Z4, 5-20min intervalles
- VO2Max: Z5, 2-5min intervalles

**Swimming**:
- Technique Drills: Éducatifs
- Endurance: Z2, 1000-3000m
- CSS: Critical Swim Speed, Z3-Z4
- Intervals: 50-200m répétés
- Sprint: 25-50m maximal

**Triathlon**:
- Brick: Vélo + Course enchaînés
- Transitions: T1/T2 practice
- Multi-sport: 2-3 disciplines

# Progression
Débutant: +10% volume max/semaine, 90% Z1-Z2
Intermédiaire: Structure 80/20, 1-2 séances qualité
Avancé: Périodisation complexe, 75/25

# Format JSON Obligatoire

Retourne:
{
  "sessionId": "uuid",
  "sessionName": "Nom motivant",
  "type": "endurance",
  "category": "endurance",
  "discipline": "running" | "cycling" | "swimming" | "triathlon",
  "durationTarget": 60,
  "distanceTarget": 10,
  "focusZones": ["Z2", "Z4"],
  "warmup": {
    "duration": 10,
    "description": "Échauffement progressif",
    "instructions": "Démarrer très facile, augmenter progressivement",
    "targetZone": "Z1-Z2",
    "dynamicDrills": ["Leg swings", "Arm circles"]
  },
  "mainWorkout": [{
    "id": "main-1",
    "type": "continuous" | "intervals" | "tempo",
    "name": "Long Run",
    "description": "Description",
    "duration": 40,
    "distance": 8,
    "targetZone": "Z2",
    "targetPace": "5:30 min/km",
    "targetHR": "135-150 bpm",
    "targetPower": "200-220W",
    "targetCadence": "85-95 RPM",
    "intervals": {
      "work": {"duration": 5, "intensity": "Z4", "pace": "4:30 min/km"},
      "rest": {"duration": 2, "intensity": "Z1-Z2", "type": "active"},
      "repeats": 6
    },
    "cues": ["Allure régulière", "Respiration contrôlée"],
    "coachNotes": "Focus régularité",
    "rpeTarget": 7
  }],
  "cooldown": {
    "duration": 10,
    "description": "Retour calme",
    "targetZone": "Z1",
    "stretching": ["Quadriceps", "Ischio-jambiers"]
  },
  "metrics": {
    "estimatedTSS": 75,
    "estimatedCalories": 800,
    "estimatedAvgHR": 145,
    "estimatedAvgPace": "5:15 min/km"
  },
  "overallNotes": "Séance clé développement aérobie",
  "expectedRpe": 7,
  "coachRationale": "Pourquoi cette séance",
  "nutritionAdvice": "Hydratation régulière",
  "recoveryAdvice": "48h avant prochaine séance intense"
}

Adapte selon niveau énergie, équipement, temps disponible.`;
}

function buildUserPrompt(
  userContext: any,
  preparerContext: any,
  userAge: number,
  fcMax: number,
  discipline: string,
  exerciseCatalogSection: string = ''
): string {
  const profile = userContext?.profile || {};
  const recentSessions = userContext?.sessions?.slice(0, 3) || [];
  const fitnessLevel = profile.fitnessLevel || 'beginner';

  const equipmentList = preparerContext.availableEquipment?.join(", ") || "Aucun équipement spécifique";

  const zones = {
    Z1: `${Math.round(fcMax * 0.5)}-${Math.round(fcMax * 0.6)} bpm`,
    Z2: `${Math.round(fcMax * 0.6)}-${Math.round(fcMax * 0.7)} bpm`,
    Z3: `${Math.round(fcMax * 0.7)}-${Math.round(fcMax * 0.8)} bpm`,
    Z4: `${Math.round(fcMax * 0.8)}-${Math.round(fcMax * 0.9)} bpm`,
    Z5: `${Math.round(fcMax * 0.9)}-${Math.round(fcMax * 1.0)} bpm`,
  };

  return `# Profil Utilisateur
Âge: ${userAge} ans
FCMax théorique: ${fcMax} bpm
Niveau: ${fitnessLevel}
Discipline: ${discipline}

# Zones FC Personnalisées
Z1 (Récupération): ${zones.Z1}
Z2 (Endurance): ${zones.Z2}
Z3 (Tempo): ${zones.Z3}
Z4 (Seuil): ${zones.Z4}
Z5 (VO2Max): ${zones.Z5}

# Contexte de la Séance
Temps disponible: ${preparerContext.availableTime} minutes
Version courte demandée: ${preparerContext.wantsShortVersion ? 'Oui' : 'Non'}
Niveau d'énergie: ${preparerContext.energyLevel}/10
Équipement disponible: ${equipmentList}
Type de lieu: ${preparerContext.locationType || 'outdoor'}

# Historique Récent
${recentSessions.length > 0
  ? recentSessions.map((s: any, i: number) =>
      `Séance ${i + 1}: ${s.type || 'endurance'} - ${s.duration || 45}min`
    ).join('\n')
  : 'Première séance ou pas d\'historique récent'
}

# Instructions Génération

1. **Adapter selon énergie**:
   - Énergie < 4: Recovery Z1 uniquement
   - Énergie 4-6: Base Z2, technique
   - Énergie 7-10: Séance qualité (tempo, intervals) possible

2. **Respecter temps disponible**:
   - < 30min: Recovery ou HIIT court
   - 30-60min: Tempo ou base
   - > 60min: Long run/ride ou endurance

3. **Appliquer 80/20**:
   - Débutant: 90% Z1-Z2, 10% Z3+
   - Intermédiaire: 80% Z1-Z2, 20% Z3+
   - Avancé: 75% Z1-Z2, 25% Z3+

4. **Type séance selon discipline**:
   - Running: Easy/Long/Tempo/Intervals/Fartlek
   - Cycling: Recovery/Endurance/Sweet Spot/Threshold/VO2Max
   - Swimming: Drills/Endurance/CSS/Intervals
   - Triathlon: Brick/Multi-sport/Transitions

5. **Calculer TSS estimé**:
   - Recovery: 20-40 TSS
   - Base Z2: 40-70 TSS
   - Tempo: 60-90 TSS
   - Intervals: 70-110 TSS

6. **Métriques selon discipline**:
   - Running: pace (min/km), HR, cadence (spm)

${exerciseCatalogSection}
   - Cycling: power (W), HR, cadence (RPM)
   - Swimming: pace (temps/100m), stroke count

# APPRENTISSAGE PAR FEEDBACKS UTILISATEUR (CRITIQUE)

**RÈGLE FONDAMENTALE**: Les feedbacks utilisateur passés sont **LA PRIORITÉ ABSOLUE** pour adapter les prescriptions futures.

## Analyse des Feedbacks

Le contexte utilisateur contient \`userFeedbacks\` avec:
- \`totalFeedbacks\`: Nombre total de feedbacks donnés
- \`averageSentiment\`: Score moyen (-1 = très négatif, 0 = neutre, +1 = très positif)
- \`topThemes\`: Thèmes récurrents (ex: "rythme trop rapide", "distance trop longue", "excellent protocole")
- \`recentFeedbacks\`: Les 5 derniers feedbacks avec texte, discipline, sentiment

## Règles d'Adaptation

### Si averageSentiment < -0.3 (négatifs):
- **RÉDUIRE intensité**: -10-15% allure/puissance, descendre d'une zone (Z4→Z3)
- **RACCOURCIR durée**: -10-20% temps total
- **SIMPLIFIER structure**: moins d'intervalles, récup plus longues (+30-60s)
- **PRIORISER Z1-Z2**: ratio 85/15 au lieu de 80/20

### Si averageSentiment > 0.5 (très positifs):
- **MAINTENIR structure** qui fonctionne
- **VARIER légèrement**: changer type d'intervalle (court→moyen)
- **PROGRESSER modérément**: +5% volume ou +2-3% intensité

### Thèmes - Actions:

**"trop rapide" / "épuisant" / "impossible à tenir"**:
- BAISSER zones cibles (-5-10% allure ou -1 zone)
- AUGMENTER récupérations (+50% temps)
- RÉDUIRE nombre d'intervalles (-25%)

**"monotone" / "ennuyeux" / "répétitif"**:
- VARIER formats: fartlek si seulement intervals, continuous si que intervals
- ALTERNER disciplines (running→cycling→swimming)
- INTRODUIRE nouveaux drills/techniques

**"trop facile" / "pas assez dur"**:
- AUGMENTER intensité (+5-10% allure/puissance)
- RÉDUIRE récupérations (-30%)
- MONTER d'une zone (Z3→Z4)

**"parfait" / "excellent rythme"**:
- CONSERVER allures/zones identiques
- Varier seulement la structure (intervals→tempo)

## Importance Hiérarchique

1. **Feedbacks récents** (< 7j) → Poids maximal
2. **Données wearable** (HRV, recovery)
3. **Historique performance**
4. **Profil utilisateur**

**CRITIQUE**: Si feedback dit "trop rapide", même si profil "avancé", TU DOIS ralentir.

Génère une prescription complète en JSON avec TOUS les champs obligatoires.`;
}

function validateAndEnrichPrescription(
  prescription: any,
  preparerContext: any,
  userAge: number,
  fcMax: number
): any {
  if (!prescription.sessionId) {
    prescription.sessionId = crypto.randomUUID();
  }

  if (!prescription.sessionName) {
    prescription.sessionName = `Séance ${prescription.discipline || 'Endurance'}`;
  }

  if (!prescription.type) {
    prescription.type = 'endurance';
  }

  if (!prescription.category) {
    prescription.category = 'endurance';
  }

  if (!prescription.durationTarget) {
    prescription.durationTarget = preparerContext.availableTime;
  }

  if (!prescription.metrics) {
    prescription.metrics = {
      estimatedTSS: estimateTSS(prescription, preparerContext),
      estimatedCalories: Math.round(prescription.durationTarget * 10),
      estimatedAvgHR: Math.round(fcMax * 0.7),
    };
  }

  if (!prescription.focusZones || prescription.focusZones.length === 0) {
    prescription.focusZones = ['Z2'];
  }

  return prescription;
}

function estimateTSS(prescription: any, preparerContext: any): number {
  const duration = prescription.durationTarget || preparerContext.availableTime;
  const energyLevel = preparerContext.energyLevel || 7;

  if (energyLevel < 4) {
    return Math.round(duration * 0.5);
  } else if (energyLevel < 7) {
    return Math.round(duration * 0.8);
  } else {
    return Math.round(duration * 1.2);
  }
}

function calculateCost(usage: any): number {
  const inputTokens = usage?.prompt_tokens || 0;
  const outputTokens = usage?.completion_tokens || 0;

  const inputCost = (inputTokens / 1000000) * 0.15;
  const outputCost = (outputTokens / 1000000) * 0.60;

  return inputCost + outputCost;
}

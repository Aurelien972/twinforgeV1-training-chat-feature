/**
 * Training Context Collector Edge Function
 * Collects and enriches user context for training generation using GPT-5 mini
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.54.0";
import { queryExercisesByDiscipline, formatExercisesForAI } from "../_shared/exerciseDatabaseService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Cache schema version - increment when structure changes
const CACHE_SCHEMA_VERSION = "2.2.0"; // Incremented for exerciseCatalog addition

interface ContextCollectorRequest {
  userId: string;
}

interface ContextCollectorResponse {
  success: boolean;
  data?: {
    userContext: any;
    summary: string;
    keyFactors: string[];
    warnings: string[];
  };
  error?: string;
  metadata: {
    agentType: string;
    modelUsed: string;
    reasoningEffort: string;
    verbosity: string;
    tokensUsed?: number;
    costUsd?: number;
    latencyMs: number;
    cached: boolean;
  };
}

/**
 * Analyser les groupes musculaires travaillés dans l'historique récent
 */
function analyzeMuscleGroups(sessions: any[]): any {
  const muscleGroupMap: Record<string, {
    count: number;
    lastWorked: string;
    exercises: string[];
  }> = {};

  // Mapping patterns d'exercices -> groupes musculaires (en français et anglais)
  const exerciseToMuscleGroup: Record<string, string> = {
    // Jambes
    'squat': 'jambes',
    'leg press': 'jambes',
    'presse': 'jambes',
    'deadlift': 'jambes',
    'soulevé de terre': 'jambes',
    'fente': 'jambes',
    'lunge': 'jambes',
    'leg curl': 'jambes',
    'leg extension': 'jambes',
    // Pectoraux
    'développé couché': 'pecs',
    'bench press': 'pecs',
    'développé': 'pecs',
    'dips': 'pecs',
    'pompes': 'pecs',
    'push': 'pecs',
    'incliné': 'pecs',
    'décliné': 'pecs',
    // Dos
    'rowing': 'dos',
    'tractions': 'dos',
    'pull': 'dos',
    'tirage': 'dos',
    'deadlift': 'dos',
    'soulevé': 'dos',
    // Épaules
    'développé militaire': 'épaules',
    'military press': 'épaules',
    'overhead press': 'épaules',
    'élévations': 'épaules',
    'lateral': 'épaules',
    'latéral': 'épaules',
    // Bras
    'curl': 'bras',
    'extension': 'bras',
    'triceps': 'bras',
    'biceps': 'bras'
  };

  sessions.forEach(session => {
    const sessionData = session.prescription || {};
    const exercises = sessionData.exercises || [];
    const sessionDate = session.created_at;

    exercises.forEach((ex: any) => {
      const exerciseName = (ex.name || '').toLowerCase();

      // Trouver le groupe musculaire
      let muscleGroup = 'autre';
      for (const [pattern, group] of Object.entries(exerciseToMuscleGroup)) {
        if (exerciseName.includes(pattern)) {
          muscleGroup = group;
          break;
        }
      }

      if (!muscleGroupMap[muscleGroup]) {
        muscleGroupMap[muscleGroup] = {
          count: 0,
          lastWorked: sessionDate,
          exercises: []
        };
      }

      muscleGroupMap[muscleGroup].count++;

      // Garder la date la plus récente
      if (new Date(sessionDate) > new Date(muscleGroupMap[muscleGroup].lastWorked)) {
        muscleGroupMap[muscleGroup].lastWorked = sessionDate;
      }

      // Ajouter l'exercice s'il n'est pas déjà présent
      if (!muscleGroupMap[muscleGroup].exercises.includes(ex.name)) {
        muscleGroupMap[muscleGroup].exercises.push(ex.name);
      }
    });
  });

  return muscleGroupMap;
}

/**
 * Analyser les exercices récemment utilisés
 */
function analyzeRecentExercises(sessions: any[]): any {
  const exerciseMap: Record<string, {
    frequency: number;
    lastUsed: string;
    avgRPE: number;
    totalRPE: number;
    rpeCount: number;
  }> = {};

  sessions.forEach(session => {
    const sessionData = session.prescription || {};
    const exercises = sessionData.exercises || [];
    const feedback = session.feedback_data?.exercises || [];

    exercises.forEach((ex: any, idx: number) => {
      const exerciseName = ex.name;
      const feedbackData = feedback[idx] || {};

      if (!exerciseMap[exerciseName]) {
        exerciseMap[exerciseName] = {
          frequency: 0,
          lastUsed: session.created_at,
          avgRPE: 0,
          totalRPE: 0,
          rpeCount: 0
        };
      }

      exerciseMap[exerciseName].frequency++;

      // Garder la date la plus récente
      if (new Date(session.created_at) > new Date(exerciseMap[exerciseName].lastUsed)) {
        exerciseMap[exerciseName].lastUsed = session.created_at;
      }

      // Calculer moyenne RPE si disponible
      if (feedbackData.rpe && typeof feedbackData.rpe === 'number') {
        exerciseMap[exerciseName].totalRPE += feedbackData.rpe;
        exerciseMap[exerciseName].rpeCount++;
        exerciseMap[exerciseName].avgRPE = exerciseMap[exerciseName].totalRPE / exerciseMap[exerciseName].rpeCount;
      }
    });
  });

  // Cleanup: retirer totalRPE et rpeCount (données internes)
  const cleanedExerciseMap: Record<string, {
    frequency: number;
    lastUsed: string;
    avgRPE: number;
  }> = {};

  for (const [name, data] of Object.entries(exerciseMap)) {
    cleanedExerciseMap[name] = {
      frequency: data.frequency,
      lastUsed: data.lastUsed,
      avgRPE: Math.round(data.avgRPE * 10) / 10 // Arrondir à 1 décimale
    };
  }

  return cleanedExerciseMap;
}

/**
 * Calculer le statut de récupération par groupe musculaire
 */
function calculateRecoveryStatus(sessions: any[]): any {
  const now = new Date();
  const muscleGroups = analyzeMuscleGroups(sessions);
  const recoveryStatus: Record<string, {
    status: 'recovered' | 'recovering' | 'fatigued';
    hoursSinceLastWorkout: number;
    requiredRestHours: number;
  }> = {};

  for (const [group, data] of Object.entries(muscleGroups)) {
    const lastWorked = new Date(data.lastWorked);
    const hoursSinceLastWorkout = Math.round((now.getTime() - lastWorked.getTime()) / (1000 * 60 * 60));

    // Groupes majeurs: 48-72h de repos recommandé
    // Groupes mineurs: 24-48h de repos recommandé
    const isMajorGroup = ['jambes', 'dos', 'pecs'].includes(group);
    const requiredRestHours = isMajorGroup ? 48 : 24;

    let status: 'recovered' | 'recovering' | 'fatigued';

    if (hoursSinceLastWorkout >= requiredRestHours + 24) {
      status = 'recovered'; // Plus de 72h (majeurs) ou 48h (mineurs)
    } else if (hoursSinceLastWorkout >= requiredRestHours) {
      status = 'recovering'; // Entre 48-72h (majeurs) ou 24-48h (mineurs)
    } else {
      status = 'fatigued'; // Moins de 48h (majeurs) ou 24h (mineurs)
    }

    recoveryStatus[group] = {
      status,
      hoursSinceLastWorkout,
      requiredRestHours
    };
  }

  return recoveryStatus;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  let openaiLatencyMs = 0; // Track OpenAI latency for final metrics
  console.log("[CONTEXT-COLLECTOR] Function started", { timestamp: new Date().toISOString() });

  try {
    // Parse request
    const { userId }: ContextCollectorRequest = await req.json();
    console.log("[CONTEXT-COLLECTOR] Request parsed", { userId, timestamp: new Date().toISOString() });

    if (!userId) {
      console.log("[CONTEXT-COLLECTOR] Missing userId - returning 400");
      return new Response(
        JSON.stringify({ success: false, error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("[CONTEXT-COLLECTOR] Supabase client initialized");

    // 1. Fetch user profile data
    console.log("[CONTEXT-COLLECTOR] Fetching user profile...");
    const { data: profile, error: profileError } = await supabase
      .from("user_profile")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[CONTEXT-COLLECTOR] Error fetching profile:", profileError);
    } else {
      console.log("[CONTEXT-COLLECTOR] Profile fetched", { hasProfile: !!profile });
    }

    // 2. Fetch training sessions (last 30)
    console.log("[CONTEXT-COLLECTOR] Fetching training sessions...");
    const { data: sessions, error: sessionsError } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (sessionsError) {
      console.error("[CONTEXT-COLLECTOR] Error fetching sessions:", sessionsError);
    } else {
      console.log("[CONTEXT-COLLECTOR] Sessions fetched", { count: sessions?.length || 0 });
    }

    // 3. Fetch training goals
    console.log("[CONTEXT-COLLECTOR] Fetching training goals...");
    const { data: goals, error: goalsError } = await supabase
      .from("training_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("is_achieved", false);

    if (goalsError) {
      console.error("[CONTEXT-COLLECTOR] Error fetching goals:", goalsError);
    } else {
      console.log("[CONTEXT-COLLECTOR] Goals fetched", { count: goals?.length || 0 });
    }

    // 4. Fetch training locations
    console.log("[CONTEXT-COLLECTOR] Fetching training locations...");
    const { data: locations, error: locationsError } = await supabase
      .from("training_locations")
      .select("*")
      .eq("user_id", userId);

    if (locationsError) {
      console.error("[CONTEXT-COLLECTOR] Error fetching locations:", locationsError);
    } else {
      console.log("[CONTEXT-COLLECTOR] Locations fetched", { count: locations?.length || 0 });
    }

    // 5. Fetch AI analyses (last 10)
    console.log("[CONTEXT-COLLECTOR] Fetching AI analyses...");
    const { data: analyses, error: analysesError } = await supabase
      .from("training_session_analysis")
      .select("session_id, overall_score, performance_rating, analysis_data, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (analysesError) {
      console.error("[CONTEXT-COLLECTOR] Error fetching AI analyses:", analysesError);
    } else {
      console.log("[CONTEXT-COLLECTOR] AI analyses fetched", { count: analyses?.length || 0 });
    }

    // 6. Fetch wearable recovery data if available
    console.log("[CONTEXT-COLLECTOR] Fetching wearable recovery data...");
    let wearableRecoveryData = null;
    try {
      // Get connected devices
      const { data: connectedDevices, error: devicesError } = await supabase
        .from("connected_devices")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "connected")
        .order("last_sync_at", { ascending: false })
        .limit(1);

      if (devicesError) {
        console.log("[CONTEXT-COLLECTOR] [WEARABLE] Error fetching devices:", devicesError);
      } else if (connectedDevices && connectedDevices.length > 0) {
        const device = connectedDevices[0];
        console.log("[CONTEXT-COLLECTOR] [WEARABLE] Found connected device:", {
          provider: device.provider,
          displayName: device.display_name,
          lastSync: device.last_sync_at
        });

        // Get recent health data (last 24h)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        // Fetch HRV data
        const { data: hrvData } = await supabase
          .from("wearable_health_data")
          .select("value_numeric, timestamp")
          .eq("user_id", userId)
          .eq("data_type", "hrv")
          .gte("timestamp", oneDayAgo.toISOString())
          .order("timestamp", { ascending: false })
          .limit(1);

        // Fetch resting heart rate
        const { data: restingHRData } = await supabase
          .from("wearable_health_data")
          .select("value_numeric, timestamp")
          .eq("user_id", userId)
          .eq("data_type", "resting_heart_rate")
          .gte("timestamp", oneDayAgo.toISOString())
          .order("timestamp", { ascending: false })
          .limit(1);

        // Fetch sleep data
        const { data: sleepData } = await supabase
          .from("wearable_health_data")
          .select("value_numeric, timestamp")
          .eq("user_id", userId)
          .eq("data_type", "sleep")
          .gte("timestamp", oneDayAgo.toISOString())
          .order("timestamp", { ascending: false })
          .limit(1);

        // Fetch body battery or recovery score
        const { data: bodyBatteryData } = await supabase
          .from("wearable_health_data")
          .select("value_numeric, timestamp")
          .eq("user_id", userId)
          .eq("data_type", "body_battery")
          .gte("timestamp", oneDayAgo.toISOString())
          .order("timestamp", { ascending: false })
          .limit(1);

        // Build recovery data if we have meaningful data
        const hasHRV = hrvData && hrvData.length > 0;
        const hasRestingHR = restingHRData && restingHRData.length > 0;
        const hasSleep = sleepData && sleepData.length > 0;
        const hasBodyBattery = bodyBatteryData && bodyBatteryData.length > 0;

        if (hasHRV || hasRestingHR || hasSleep || hasBodyBattery) {
          const hrvValue = hasHRV ? hrvData[0].value_numeric : null;
          const restingHR = hasRestingHR ? restingHRData[0].value_numeric : null;
          const sleepHours = hasSleep ? sleepData[0].value_numeric : null;
          const bodyBattery = hasBodyBattery ? bodyBatteryData[0].value_numeric : null;

          // Calculate recovery score (0-100) based on available metrics
          let recoveryScore = null;
          if (bodyBattery) {
            recoveryScore = bodyBattery;
          } else if (hrvValue && restingHR) {
            // Estimate recovery: normalize HRV (higher is better) and resting HR (lower is better)
            // This is a simplified calculation
            const hrvScore = Math.min(100, (hrvValue / 50) * 50); // Assume 50ms is baseline
            const hrScore = Math.max(0, 50 - ((restingHR - 60) / 40) * 50); // Assume 60bpm is baseline
            recoveryScore = Math.round((hrvScore + hrScore) / 2);
          }

          // Assess data quality
          const dataAge = Math.min(
            hasHRV ? Date.now() - new Date(hrvData[0].timestamp).getTime() : Infinity,
            hasRestingHR ? Date.now() - new Date(restingHRData[0].timestamp).getTime() : Infinity
          );
          const dataQuality = dataAge < 3600000 ? 'excellent' : dataAge < 7200000 ? 'good' : dataAge < 14400000 ? 'fair' : 'poor';

          wearableRecoveryData = {
            hasWearableData: true,
            deviceName: device.display_name || device.provider,
            restingHeartRate: restingHR,
            hrv: hrvValue,
            sleepHours: sleepHours ? Math.round(sleepHours / 60 * 10) / 10 : null, // Convert minutes to hours
            recoveryScore,
            bodyBattery,
            lastSyncAt: device.last_sync_at,
            dataQuality
          };

          console.log("[CONTEXT-COLLECTOR] [WEARABLE] Recovery data assembled:", wearableRecoveryData);
        } else {
          console.log("[CONTEXT-COLLECTOR] [WEARABLE] Device connected but no recent recovery data found");
        }
      } else {
        console.log("[CONTEXT-COLLECTOR] [WEARABLE] No connected devices found");
      }
    } catch (wearableError) {
      console.error("[CONTEXT-COLLECTOR] [WEARABLE] Error fetching wearable data:", wearableError);
    }

    // 7. Analyze recent training history (7 days) for recovery intelligence
    console.log("[CONTEXT-COLLECTOR] Analyzing recent training history for recovery intelligence...");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = (sessions || []).filter(s =>
      new Date(s.created_at) >= sevenDaysAgo
    );

    console.log("[CONTEXT-COLLECTOR] Recent sessions (7 days):", {
      count: recentSessions.length,
      dates: recentSessions.map(s => s.created_at)
    });

    // Analyser les groupes musculaires, exercices et récupération
    const muscleGroupAnalysis = analyzeMuscleGroups(recentSessions);
    const exerciseAnalysis = analyzeRecentExercises(recentSessions);
    const recoveryStatus = calculateRecoveryStatus(recentSessions);

    console.log("[CONTEXT-COLLECTOR] Recovery analysis completed:", {
      muscleGroupsCount: Object.keys(muscleGroupAnalysis).length,
      exercisesTracked: Object.keys(exerciseAnalysis).length,
      recoveryStatusGroups: Object.keys(recoveryStatus).length
    });

    // 8. Build user data structure with recovery analysis AND wearable recovery data
    console.log("[CONTEXT-COLLECTOR] Building user data structure...");
    const userData = {
      userId,
      profile: profile || {},
      sessions: sessions || [],
      goals: goals || [],
      locations: locations || [],
      aiAnalyses: analyses || [],
      sessionStats: {
        totalSessions: sessions?.length || 0,
        avgRpe: sessions && sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.overall_rpe || 7), 0) / sessions.length
          : 0,
        recentPerformance: sessions?.slice(0, 5) || [],
        avgPerformanceScore: analyses && analyses.length > 0
          ? analyses.reduce((sum, a) => sum + (a.overall_score || 0), 0) / analyses.length
          : 0,
        recentRatings: analyses?.slice(0, 5).map(a => a.performance_rating) || []
      },
      // NOUVEAU: Analyse de récupération pour intelligence contextuelle
      recoveryAnalysis: {
        muscleGroupsWorked: muscleGroupAnalysis,
        recentExercises: exerciseAnalysis,
        recoveryStatus: recoveryStatus,
        lastWorkoutDate: recentSessions[0]?.created_at || null,
        daysSinceLastWorkout: recentSessions[0]
          ? Math.floor((Date.now() - new Date(recentSessions[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
          : null,
        recentSessionsCount: recentSessions.length
      },
      // NOUVEAU: Données wearable de récupération physiologique
      wearableRecovery: wearableRecoveryData
    };
    console.log("[CONTEXT-COLLECTOR] User data built", {
      hasProfile: !!profile,
      sessionsCount: sessions?.length || 0,
      goalsCount: goals?.length || 0,
      locationsCount: locations?.length || 0,
      analysesCount: analyses?.length || 0,
      hasRecoveryAnalysis: !!userData.recoveryAnalysis,
      lastWorkoutDate: userData.recoveryAnalysis.lastWorkoutDate,
      hasWearableRecovery: !!userData.wearableRecovery,
      wearableDeviceName: userData.wearableRecovery?.deviceName
    });

    // 9. Query Exercise Catalog from Database
    console.log("[CONTEXT-COLLECTOR] Querying exercise catalog from database...");
    let exerciseCatalogData = null;
    try {
      // Get user's preferred training types and equipment
      const trainingTypes = profile?.training_types || [];
      const userLanguage = profile?.preferred_language || 'fr';

      // Query exercises for each training discipline the user is interested in
      const catalogPromises = trainingTypes.map((discipline: string) => {
        const availableEquipment = locations && locations.length > 0
          ? locations[0].available_equipment || []
          : [];

        const locationType = locations && locations.length > 0
          ? locations[0].location_type || 'gym'
          : 'gym';

        return queryExercisesByDiscipline(supabase, {
          discipline: discipline.toLowerCase(),
          availableEquipment,
          locationType: locationType as any,
          difficulty: profile?.training_level || undefined,
          language: userLanguage as 'fr' | 'en',
          limit: 30 // Limit per discipline
        });
      });

      const catalogResults = await Promise.all(catalogPromises);

      // Combine all exercises from different disciplines
      const allExercises = catalogResults.flatMap(result => result.exercises);
      const totalExercises = allExercises.length;

      console.log("[CONTEXT-COLLECTOR] Exercise catalog retrieved", {
        disciplinesQueried: trainingTypes.length,
        totalExercises,
        equipmentFiltered: catalogResults.some(r => r.equipmentFiltered)
      });

      exerciseCatalogData = {
        exercises: allExercises,
        totalCount: totalExercises,
        disciplines: trainingTypes,
        language: userLanguage,
        equipmentAvailable: locations && locations.length > 0
          ? locations[0].available_equipment || []
          : [],
        muscleGroupsAvailable: [...new Set(allExercises.flatMap(ex =>
          ex.muscle_groups.map(mg => mg.name_fr)
        ))]
      };

      // Add to userData
      userData.exerciseCatalog = exerciseCatalogData;

    } catch (exerciseError) {
      console.error("[CONTEXT-COLLECTOR] Error querying exercise catalog:", exerciseError);
      // Continue without exercise catalog - fallback to AI generation
      userData.exerciseCatalog = null;
    }

    // 6. Check cache with validation
    console.log("[CONTEXT-COLLECTOR] [CACHE] Checking cache...");
    const cacheKey = `context-collector:${userId}`;
    console.log("[CONTEXT-COLLECTOR] [CACHE] Cache lookup configuration:", {
      cacheKey,
      expectedSchemaVersion: CACHE_SCHEMA_VERSION,
      currentTimestamp: new Date().toISOString()
    });

    const { data: cachedData, error: cacheError } = await supabase
      .from("training_ai_cache")
      .select("cached_data, expires_at, created_at")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cacheError) {
      console.log("[CONTEXT-COLLECTOR] [CACHE] Cache lookup error (proceeding without cache):", {
        error: cacheError.message,
        code: cacheError.code
      });
    } else if (!cachedData) {
      console.log("[CONTEXT-COLLECTOR] [CACHE] MISS - No valid cache found");
      console.log("[CONTEXT-COLLECTOR] [CACHE] Cache miss reason: No entry found or expired");
    }

    if (cachedData && !cacheError) {
      console.log("[CONTEXT-COLLECTOR] [CACHE] Cache entry found, validating...");
      const cached = cachedData.cached_data;

      console.log("[CONTEXT-COLLECTOR] [CACHE] Cache metadata:", {
        createdAt: cachedData.created_at,
        expiresAt: cachedData.expires_at,
        cacheAge: Date.now() - new Date(cachedData.created_at).getTime(),
        timeUntilExpiry: new Date(cachedData.expires_at).getTime() - Date.now()
      });

      // Validate cache structure and version
      console.log("[CONTEXT-COLLECTOR] [CACHE] Validating cache structure...");
      const validationChecks = {
        hasData: !!cached,
        hasSchemaVersion: !!cached?._schema_version,
        schemaVersionMatches: cached?._schema_version === CACHE_SCHEMA_VERSION,
        hasSummary: !!cached?.summary,
        summaryIsString: typeof cached?.summary === 'string',
        hasKeyFactors: !!cached?.keyFactors,
        keyFactorsIsArray: Array.isArray(cached?.keyFactors),
        hasWarnings: !!cached?.warnings,
        warningsIsArray: Array.isArray(cached?.warnings),
        hasUserContext: !!cached?.userContext,
        userContextIsObject: typeof cached?.userContext === 'object'
      };

      const isValidCache =
        validationChecks.hasData &&
        validationChecks.schemaVersionMatches &&
        validationChecks.hasSummary &&
        validationChecks.summaryIsString &&
        validationChecks.hasKeyFactors &&
        validationChecks.keyFactorsIsArray &&
        validationChecks.hasWarnings &&
        validationChecks.warningsIsArray &&
        validationChecks.hasUserContext &&
        validationChecks.userContextIsObject;

      console.log("[CONTEXT-COLLECTOR] [CACHE] Validation results:", validationChecks);
      console.log("[CONTEXT-COLLECTOR] [CACHE] Overall validation:", isValidCache ? "PASSED" : "FAILED");

      if (isValidCache) {
        const latencyMs = Date.now() - startTime;
        console.log("[CONTEXT-COLLECTOR] [CACHE] ✅ HIT - Valid cache found!", {
          latencyMs: `${latencyMs}ms`,
          schemaVersion: cached._schema_version,
          cachedAt: cached._cached_at,
          summaryPreview: cached.summary.substring(0, 100),
          keyFactorsCount: cached.keyFactors.length,
          warningsCount: cached.warnings.length
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: cached,
            metadata: {
              agentType: "context-collector",
              modelUsed: "gpt-5-mini",
              reasoningEffort: "medium",
              verbosity: "medium",
              latencyMs,
              cached: true
            }
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.log("[CONTEXT-COLLECTOR] [CACHE] ❌ HIT but INVALID - Deleting and regenerating");
        console.log("[CONTEXT-COLLECTOR] [CACHE] Invalid cache details:", {
          schemaVersion: cached?._schema_version,
          expectedVersion: CACHE_SCHEMA_VERSION,
          failedChecks: Object.entries(validationChecks)
            .filter(([_, value]) => !value)
            .map(([key]) => key)
        });

        // Delete invalid cache
        console.log("[CONTEXT-COLLECTOR] [CACHE] Deleting invalid cache entry...");
        const { error: deleteError } = await supabase
          .from("training_ai_cache")
          .delete()
          .eq("cache_key", cacheKey);

        if (deleteError) {
          console.error("[CONTEXT-COLLECTOR] [CACHE] Failed to delete invalid cache:", deleteError);
        } else {
          console.log("[CONTEXT-COLLECTOR] [CACHE] Invalid cache deleted successfully");
        }
      }
    }

    console.log("[CONTEXT-COLLECTOR] [CACHE] MISS - Proceeding to call OpenAI API");

    // 7. Call OpenAI Responses API with GPT-5 mini
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("[CONTEXT-COLLECTOR] OPENAI_API_KEY not configured");
      throw new Error("OPENAI_API_KEY not configured");
    }
    console.log("[CONTEXT-COLLECTOR] OpenAI API key found");

    // Prepare prompt (using Context Collector v1.0.0 prompt - optimized for GPT-5)
    const systemPrompt = `Tu es un agent IA spécialisé dans la collecte et la synthèse de contexte utilisateur pour la génération de programmes d'entraînement personnalisés.

Ton rôle est d'analyser toutes les données disponibles sur l'utilisateur et de produire un contexte structuré, complet et optimisé pour les agents suivants.

# Données à Analyser

1. **Identité**: Sexe, âge, taille, poids, objectif, niveau d'activité
2. **Profil Training**: Type d'entraînement préféré, niveau fitness, fréquence, durée, équipements
3. **Santé**: Blessures actuelles, historique de douleurs, mouvements à éviter, notes médicales
4. **Nutrition**: Objectifs macros, restrictions alimentaires, préférences
5. **Jeûne**: Protocole actuel, fenêtres de jeûne
6. **Body Scan**: Composition corporelle, asymétries, points forts et faibles
7. **Historique**: 30 dernières séances avec métriques (RPE, volume, intensité, completion)
8. **Wearable Recovery**: Données physiologiques des montres connectées (HRV, fréquence cardiaque au repos, sommeil, score de récupération)

# Instructions de Synthèse

- **Concision**: Extraire uniquement les informations pertinentes pour la génération de training
- **Priorisation**: Mettre en avant les éléments critiques (blessures, limitations, objectifs, données wearable)
- **Warnings**: Identifier et signaler les drapeaux rouges (blessures récentes, fatigue, surmenage, récupération insuffisante détectée par wearable)
- **Key Factors**: Identifier les 3-5 facteurs les plus importants pour cette génération
- **Patterns**: Détecter les patterns dans l'historique (récupération, progression, préférences)
- **Recovery Context**: Si des données wearable sont disponibles, les intégrer dans le userContext pour permettre aux coachs d'ajuster l'intensité

# Format de Sortie OBLIGATOIRE

Tu DOIS TOUJOURS retourner un JSON valide avec EXACTEMENT cette structure.
Les 4 champs suivants sont OBLIGATOIRES et ne peuvent JAMAIS être omis:

{
  \"summary\": \"Résumé en 2-3 phrases décrivant le profil utilisateur et ses besoins\",
  \"keyFactors\": [\"Facteur clé 1\", \"Facteur clé 2\", \"Facteur clé 3\"],
  \"warnings\": [\"Warning 1 si applicable\"],
  \"userContext\": {
    \"userId\": \"user-id-here\",
    \"profile\": {...},
    \"trainingHistory\": {...},
    \"goals\": [...],
    \"limitations\": {...},
    \"recovery\": {
      \"hasWearableData\": true/false,
      \"deviceName\": \"Garmin Forerunner 945\" (si applicable),
      \"restingHeartRate\": 58 (si applicable),
      \"hrv\": 65 (si applicable),
      \"sleepHours\": 7.5 (si applicable),
      \"recoveryScore\": 72 (0-100, si applicable),
      \"dataQuality\": \"excellent/good/fair/poor\" (si applicable)
    }
  }
}

CRITIQUE: Le champ userId DOIT TOUJOURS être présent dans userContext avec l'ID utilisateur fourni en entrée.

# Exemple Concret de Sortie

{
  \"summary\": \"Utilisateur homme de 35 ans, objectif prise de masse, niveau intermédiaire, 3-4 séances/semaine. Historique montre bonne progression sur le haut du corps mais fatigue sur le bas du corps.\",
  \"keyFactors\": [
    \"Niveau intermédiaire avec 2 ans d'expérience\",
    \"Objectif prise de masse musculaire\",
    \"Bonne récupération globale (RPE moyen 7/10)\",
    \"Préférence pour entraînements 60-90min\",
    \"Équipement complet disponible\"
  ],
  \"warnings\": [
    \"Légère fatigue détectée sur les jambes - réduire le volume si nécessaire\"
  ],
  \"userContext\": {
    \"userId\": \"abc-123-def-456\",
    \"demographics\": {
      \"age\": 35,
      \"gender\": \"male\",
      \"weight\": 80,
      \"height\": 178
    },
    \"goals\": [\"muscle_gain\"],
    \"experience\": \"intermediate\",
    \"availableEquipment\": [\"barbell\", \"dumbbells\", \"machine\"],
    \"sessionStats\": {
      \"avgRpe\": 7,
      \"consistency\": \"good\"
    }
  }
}

IMPORTANT: Même si les données utilisateur sont minimales, tu DOIS TOUJOURS retourner les 4 champs. Les arrays peuvent être vides [] mais doivent exister. Le champ userId dans userContext est OBLIGATOIRE.`;

    const userPrompt = `# Données Utilisateur

${JSON.stringify(userData, null, 2)}

# Instructions

Analyse ces données et produis un contexte structuré optimisé pour la génération de training.

RAPPEL CRITIQUE:
1. Tu dois OBLIGATOIREMENT retourner un JSON avec les 4 champs: summary, keyFactors, warnings, userContext.
2. Le champ userContext DOIT contenir le userId: "${userId}"
3. Sois pertinent et mets en avant les éléments critiques pour l'entraînement.

IMPORTANT: Assure-toi que userContext contient {"userId": "${userId}", ...autres champs...}`;

    console.log("[CONTEXT-COLLECTOR] Calling OpenAI API...");
    console.log("[CONTEXT-COLLECTOR] [REQUEST-BUILD] Building OpenAI request payload...");

    const requestPayload = {
      model: "gpt-5-mini",
      input: [
        { type: "message", role: "system", content: systemPrompt },
        { type: "message", role: "user", content: userPrompt }
      ],
      reasoning: { effort: "medium" }, // Best practice: medium for data analysis tasks
      text: {
        verbosity: "medium", // Best practice: medium for structured content generation
        format: {
          type: "json_schema",
          name: "context_collector_output",
          strict: false, // Flexible schema for dynamic userContext
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "A 2-3 sentence summary of the user profile and training needs",
                minLength: 10
              },
              keyFactors: {
                type: "array",
                description: "3-5 most important factors for training generation",
                items: { type: "string" },
                minItems: 0
              },
              warnings: {
                type: "array",
                description: "Any red flags or warnings about user health, fatigue, or limitations",
                items: { type: "string" },
                minItems: 0
              },
              userContext: {
                type: "object",
                description: "Complete structured user context for training generation",
                additionalProperties: true
              }
            },
            required: ["summary", "keyFactors", "warnings", "userContext"],
            additionalProperties: false
          }
        }
      },
      max_output_tokens: 4000 // Increased from 3000 to allow more complete context
    };

    console.log("[CONTEXT-COLLECTOR] [REQUEST-BUILD] Request payload built", {
      model: requestPayload.model,
      reasoningEffort: requestPayload.reasoning.effort,
      verbosity: requestPayload.text.verbosity,
      strictMode: requestPayload.text.format.strict,
      maxOutputTokens: requestPayload.max_output_tokens,
      inputMessagesCount: requestPayload.input.length,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length
    });
    console.log("[CONTEXT-COLLECTOR] [REQUEST-BUILD] Full request payload (stringified):", JSON.stringify(requestPayload, null, 2));

    console.log("[CONTEXT-COLLECTOR] [REQUEST-SEND] Sending request to OpenAI...");
    const openaiStartTime = Date.now();
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    openaiLatencyMs = Date.now() - openaiStartTime;
    console.log("[CONTEXT-COLLECTOR] [RESPONSE-RECEIVED] OpenAI response received", {
      status: openaiResponse.status,
      ok: openaiResponse.ok,
      statusText: openaiResponse.statusText,
      latencyMs: openaiLatencyMs,
      headers: {
        contentType: openaiResponse.headers.get("content-type"),
        contentLength: openaiResponse.headers.get("content-length")
      }
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("[CONTEXT-COLLECTOR] [RESPONSE-ERROR] OpenAI API error:", {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        errorData,
        latencyMs: openaiLatencyMs
      });
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorData}`);
    }

    console.log("[CONTEXT-COLLECTOR] [RESPONSE-PARSE] Parsing OpenAI response JSON...");
    const openaiData = await openaiResponse.json();
    console.log("[CONTEXT-COLLECTOR] [RESPONSE-PARSE] OpenAI response JSON parsed successfully");
    console.log("[CONTEXT-COLLECTOR] [RESPONSE-PARSE] Full OpenAI response structure:", JSON.stringify(openaiData, null, 2));
    console.log("[CONTEXT-COLLECTOR] [RESPONSE-PARSE] OpenAI response metadata", {
      responseId: openaiData.id,
      model: openaiData.model,
      hasOutputText: !!openaiData.output_text,
      hasOutput: !!openaiData.output,
      outputLength: openaiData.output?.length || 0,
      hasUsage: !!openaiData.usage,
      tokensUsed: openaiData.usage?.total_tokens || 0
    });

    // Extract response data - multiple fallback strategies
    console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Extracting output text from response...");
    let outputText = "";

    // Strategy 1: Direct output_text field (legacy/alternative format)
    if (openaiData.output_text) {
      outputText = openaiData.output_text;
      console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Using output_text field (Strategy 1)");
    }
    // Strategy 2: OpenAI Responses API format - output[] with type="message" containing content[]
    else if (openaiData.output && Array.isArray(openaiData.output) && openaiData.output.length > 0) {
      console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Searching in output array (Strategy 2)...");
      console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Output array structure:", {
        length: openaiData.output.length,
        types: openaiData.output.map((item: any) => item.type)
      });

      // Find message item (standard Responses API format)
      const messageItem = openaiData.output.find((item: any) => item.type === "message");
      if (messageItem) {
        console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Found message item:", {
          id: messageItem.id,
          type: messageItem.type,
          hasContent: !!messageItem.content,
          contentIsArray: Array.isArray(messageItem.content),
          contentLength: messageItem.content?.length || 0
        });

        // Extract text from content array
        if (messageItem.content && Array.isArray(messageItem.content) && messageItem.content.length > 0) {
          console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Content array structure:", {
            length: messageItem.content.length,
            types: messageItem.content.map((c: any) => c.type)
          });

          // Find output_text content item
          const textContent = messageItem.content.find((c: any) => c.type === "output_text" || c.type === "text");
          if (textContent && textContent.text) {
            outputText = textContent.text;
            console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Found text in message.content[].text (Strategy 2 - Success)");
            console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Text preview:", outputText.substring(0, 200));
          } else {
            console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] No valid text content found in message.content");
          }
        } else {
          console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Message item has no valid content array");
        }
      } else {
        console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] No message item found, trying legacy format...");

        // Fallback: Legacy format - direct text item
        const textItem = openaiData.output.find((item: any) => item.type === "text" || item.text);
        if (textItem) {
          outputText = textItem.text || textItem.content || "";
          console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Using legacy text item format (Strategy 2 - Fallback)");
        } else {
          console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] No text item found in legacy format either");
        }
      }
    }

    console.log("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Output text extracted", {
      outputTextLength: outputText.length,
      outputTextPreview: outputText.substring(0, 300),
      isEmptyOrBraces: outputText === "{}" || outputText.trim() === ""
    });

    if (!outputText || outputText.trim() === "" || outputText === "{}") {
      console.error("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] CRITICAL: Output text is empty or invalid!");
      console.error("[CONTEXT-COLLECTOR] [RESPONSE-EXTRACT] Full response for debugging:", JSON.stringify(openaiData, null, 2));
      throw new Error("OpenAI returned empty or invalid output text");
    }

    // Parse JSON with detailed logging
    console.log("[CONTEXT-COLLECTOR] [JSON-PARSE] Parsing context data from output text...");
    let contextData;
    try {
      contextData = JSON.parse(outputText);
      console.log("[CONTEXT-COLLECTOR] [JSON-PARSE] JSON parsed successfully");
      console.log("[CONTEXT-COLLECTOR] [JSON-PARSE] Parsed context data structure:", JSON.stringify(contextData, null, 2));
    } catch (parseError) {
      console.error("[CONTEXT-COLLECTOR] [JSON-PARSE] JSON parse error:", parseError);
      console.error("[CONTEXT-COLLECTOR] [JSON-PARSE] Raw output text that failed to parse:", outputText);
      console.error("[CONTEXT-COLLECTOR] [JSON-PARSE] Output text first 500 chars:", outputText.substring(0, 500));

      // Try cleaning the output (remove markdown code blocks if present)
      const cleanedText = outputText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      if (cleanedText !== outputText) {
        console.log("[CONTEXT-COLLECTOR] [JSON-PARSE] Attempting to parse cleaned text (removed markdown)...");
        try {
          contextData = JSON.parse(cleanedText);
          console.log("[CONTEXT-COLLECTOR] [JSON-PARSE] Successfully parsed cleaned text!");
        } catch (cleanError) {
          console.error("[CONTEXT-COLLECTOR] [JSON-PARSE] Cleaned text also failed to parse");
          throw new Error(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      } else {
        throw new Error(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }

    console.log("[CONTEXT-COLLECTOR] [VALIDATION] Validating context data structure...");
    console.log("[CONTEXT-COLLECTOR] [VALIDATION] Context data fields present:", {
      hasSummary: !!contextData.summary,
      summaryType: typeof contextData.summary,
      summaryLength: contextData.summary?.length || 0,
      hasKeyFactors: !!contextData.keyFactors,
      keyFactorsType: typeof contextData.keyFactors,
      keyFactorsIsArray: Array.isArray(contextData.keyFactors),
      keyFactorsCount: contextData.keyFactors?.length || 0,
      hasWarnings: !!contextData.warnings,
      warningsType: typeof contextData.warnings,
      warningsIsArray: Array.isArray(contextData.warnings),
      warningsCount: contextData.warnings?.length || 0,
      hasUserContext: !!contextData.userContext,
      userContextType: typeof contextData.userContext,
      userContextKeys: contextData.userContext ? Object.keys(contextData.userContext) : []
    });

    // CRITICAL VALIDATION: Ensure userContext exists and is valid
    console.log("[CONTEXT-COLLECTOR] [VALIDATION] Checking userContext field...");
    if (!contextData.userContext || typeof contextData.userContext !== 'object') {
      console.error("[CONTEXT-COLLECTOR] [VALIDATION] FAILED - userContext missing or invalid", {
        hasUserContext: !!contextData.userContext,
        userContextType: typeof contextData.userContext,
        availableFields: Object.keys(contextData),
        contextDataSample: JSON.stringify(contextData).substring(0, 500)
      });

      // Create fallback userContext from raw userData
      console.log("[CONTEXT-COLLECTOR] [FALLBACK] Creating fallback userContext from userData");
      contextData.userContext = {
        userId,
        profile: userData.profile,
        sessions: userData.sessions,
        goals: userData.goals,
        locations: userData.locations,
        sessionStats: userData.sessionStats,
        _fallback: true,
        _reason: "OpenAI did not generate userContext"
      };
      console.log("[CONTEXT-COLLECTOR] [FALLBACK] Fallback userContext created successfully");
    } else {
      console.log("[CONTEXT-COLLECTOR] [VALIDATION] userContext field is valid");
    }

    // Validate summary field
    console.log("[CONTEXT-COLLECTOR] [VALIDATION] Checking summary field...");
    if (!contextData.summary || typeof contextData.summary !== 'string' || contextData.summary.trim() === "") {
      console.error("[CONTEXT-COLLECTOR] [VALIDATION] FAILED - summary missing or invalid", {
        hasSummary: !!contextData.summary,
        summaryType: typeof contextData.summary,
        summaryValue: contextData.summary
      });

      // Create fallback summary
      console.log("[CONTEXT-COLLECTOR] [FALLBACK] Creating fallback summary");
      const hasProfile = userData.profile && Object.keys(userData.profile).length > 0;
      const hasGoals = userData.goals && userData.goals.length > 0;
      const hasSessions = userData.sessions && userData.sessions.length > 0;

      contextData.summary = hasProfile
        ? `User profile available with ${hasSessions ? userData.sessions.length + ' training sessions' : 'no training history'}. ${hasGoals ? 'Active training goals set.' : 'No goals defined yet.'}`
        : "New user with minimal profile data. Ready for initial training setup.";

      console.log("[CONTEXT-COLLECTOR] [FALLBACK] Fallback summary created:", contextData.summary);
    } else {
      console.log("[CONTEXT-COLLECTOR] [VALIDATION] summary field is valid");
    }

    // Validate keyFactors field
    console.log("[CONTEXT-COLLECTOR] [VALIDATION] Checking keyFactors field...");
    if (!contextData.keyFactors || !Array.isArray(contextData.keyFactors)) {
      console.error("[CONTEXT-COLLECTOR] [VALIDATION] FAILED - keyFactors missing or not an array", {
        hasKeyFactors: !!contextData.keyFactors,
        keyFactorsType: typeof contextData.keyFactors,
        isArray: Array.isArray(contextData.keyFactors)
      });

      // Create fallback keyFactors
      console.log("[CONTEXT-COLLECTOR] [FALLBACK] Creating fallback keyFactors");
      contextData.keyFactors = [];
      if (userData.profile?.training_frequency) {
        contextData.keyFactors.push(`Training frequency: ${userData.profile.training_frequency} sessions/week`);
      }
      if (userData.goals && userData.goals.length > 0) {
        contextData.keyFactors.push(`${userData.goals.length} active training goals`);
      }
      if (userData.locations && userData.locations.length > 0) {
        contextData.keyFactors.push(`${userData.locations.length} training locations available`);
      }
      if (contextData.keyFactors.length === 0) {
        contextData.keyFactors.push("New user - awaiting initial training data");
      }
      console.log("[CONTEXT-COLLECTOR] [FALLBACK] Fallback keyFactors created:", contextData.keyFactors);
    } else {
      console.log("[CONTEXT-COLLECTOR] [VALIDATION] keyFactors field is valid with", contextData.keyFactors.length, "items");
    }

    // Validate warnings field
    console.log("[CONTEXT-COLLECTOR] [VALIDATION] Checking warnings field...");
    if (!contextData.warnings || !Array.isArray(contextData.warnings)) {
      console.error("[CONTEXT-COLLECTOR] [VALIDATION] FAILED - warnings missing or not an array", {
        hasWarnings: !!contextData.warnings,
        warningsType: typeof contextData.warnings,
        isArray: Array.isArray(contextData.warnings)
      });

      // Create fallback warnings (empty is acceptable)
      console.log("[CONTEXT-COLLECTOR] [FALLBACK] Creating fallback warnings array");
      contextData.warnings = [];
      console.log("[CONTEXT-COLLECTOR] [FALLBACK] Fallback warnings created (empty array)");
    } else {
      console.log("[CONTEXT-COLLECTOR] [VALIDATION] warnings field is valid with", contextData.warnings.length, "items");
    }

    console.log("[CONTEXT-COLLECTOR] [VALIDATION] ✅ All validations passed - all required fields present and valid");
    console.log("[CONTEXT-COLLECTOR] [VALIDATION] Final context data structure:", {
      summaryLength: contextData.summary.length,
      keyFactorsCount: contextData.keyFactors.length,
      warningsCount: contextData.warnings.length,
      userContextKeys: Object.keys(contextData.userContext),
      userContextSize: JSON.stringify(contextData.userContext).length
    });

    // Extract metrics from OpenAI response
    console.log("[CONTEXT-COLLECTOR] [METRICS] Calculating generation metrics...");
    const tokensUsed = openaiData.usage?.total_tokens || 0;
    const inputTokens = openaiData.usage?.input_tokens || 0;
    const outputTokens = openaiData.usage?.output_tokens || 0;
    const reasoningTokens = openaiData.usage?.reasoning_tokens || 0;
    const costUsd = calculateCost(tokensUsed, "gpt-5-mini");
    const latencyMs = Date.now() - startTime;
    const responseId = openaiData.id || null;

    console.log("[CONTEXT-COLLECTOR] [METRICS] Generation metrics calculated:", {
      tokensUsed,
      inputTokens,
      outputTokens,
      reasoningTokens,
      costUsd: `$${costUsd.toFixed(6)}`,
      latencyMs: `${latencyMs}ms`,
      latencySeconds: `${(latencyMs / 1000).toFixed(2)}s`,
      responseId,
      modelUsed: "gpt-5-mini",
      reasoningEffort: "medium",
      verbosity: "medium"
    });

    // 8. Cache the result (TTL: 1 hour) with schema version
    console.log("[CONTEXT-COLLECTOR] [CACHE] Caching result...");
    const cacheDataWithVersion = {
      ...contextData,
      _schema_version: CACHE_SCHEMA_VERSION,
      _cached_at: new Date().toISOString(),
      _generation_metadata: {
        tokensUsed,
        costUsd,
        latencyMs,
        responseId,
        modelUsed: "gpt-5-mini"
      }
    };

    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour TTL
    console.log("[CONTEXT-COLLECTOR] [CACHE] Cache configuration:", {
      cacheKey,
      schemaVersion: CACHE_SCHEMA_VERSION,
      ttlMinutes: 60,
      expiresAt: expiresAt.toISOString(),
      cacheDataSize: JSON.stringify(cacheDataWithVersion).length
    });

    const { error: cacheInsertError } = await supabase
      .from("training_ai_cache")
      .upsert({
        cache_key: cacheKey,
        user_id: userId,
        cache_type: "context",
        cached_data: cacheDataWithVersion,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: "cache_key"
      });

    if (cacheInsertError) {
      console.error("[CONTEXT-COLLECTOR] [CACHE] ❌ Failed to cache result:", cacheInsertError);
      console.error("[CONTEXT-COLLECTOR] [CACHE] Cache error details:", {
        code: cacheInsertError.code,
        message: cacheInsertError.message,
        details: cacheInsertError.details
      });
    } else {
      console.log("[CONTEXT-COLLECTOR] [CACHE] ✅ Result cached successfully");
      console.log("[CONTEXT-COLLECTOR] [CACHE] Cache will expire at:", expiresAt.toISOString());
    }

    // 9. Persist generation record
    console.log("[CONTEXT-COLLECTOR] [PERSISTENCE] Persisting generation record...");
    const generationId = crypto.randomUUID();
    console.log("[CONTEXT-COLLECTOR] [PERSISTENCE] Generation record details:", {
      generationId,
      userId,
      agentType: "context-collector",
      agentVersion: "1.0.0",
      modelUsed: "gpt-5-mini",
      reasoningEffort: "medium",
      verbosity: "medium",
      tokensUsed,
      costUsd,
      latencyMs,
      responseId
    });

    const { error: generationInsertError } = await supabase
      .from("training_ai_generations")
      .insert({
        user_id: userId,
        generation_id: generationId,
        agent_type: "context-collector",
        agent_version: "1.0.0",
        input_context: { userData },
        output_prescription: contextData,
        model_used: "gpt-5-mini",
        reasoning_effort: "medium",
        verbosity: "medium",
        tokens_used: tokensUsed,
        cost_usd: costUsd,
        latency_ms: latencyMs,
        response_id: responseId,
        cached: false,
        success: true
      });

    if (generationInsertError) {
      console.error("[CONTEXT-COLLECTOR] [PERSISTENCE] ❌ Failed to persist generation:", generationInsertError);
      console.error("[CONTEXT-COLLECTOR] [PERSISTENCE] Persistence error details:", {
        code: generationInsertError.code,
        message: generationInsertError.message,
        details: generationInsertError.details
      });
    } else {
      console.log("[CONTEXT-COLLECTOR] [PERSISTENCE] ✅ Generation record persisted successfully");
      console.log("[CONTEXT-COLLECTOR] [PERSISTENCE] Record ID:", generationId);
    }

    // 10. Return response
    console.log("[CONTEXT-COLLECTOR] [RESPONSE] Building final response...");
    const response: ContextCollectorResponse = {
      success: true,
      data: contextData,
      metadata: {
        agentType: "context-collector",
        modelUsed: "gpt-5-mini",
        reasoningEffort: "medium",
        verbosity: "medium",
        tokensUsed,
        costUsd,
        latencyMs,
        cached: false
      }
    };

    const totalLatencyMs = Date.now() - startTime;
    console.log("[CONTEXT-COLLECTOR] [RESPONSE] Final response built successfully");
    console.log("[CONTEXT-COLLECTOR] [RESPONSE] Response structure validation:", {
      success: response.success,
      hasData: !!response.data,
      dataFields: {
        hasSummary: !!response.data?.summary,
        summaryLength: response.data?.summary?.length || 0,
        hasKeyFactors: !!response.data?.keyFactors,
        keyFactorsIsArray: Array.isArray(response.data?.keyFactors),
        keyFactorsCount: response.data?.keyFactors?.length || 0,
        hasWarnings: !!response.data?.warnings,
        warningsIsArray: Array.isArray(response.data?.warnings),
        warningsCount: response.data?.warnings?.length || 0,
        hasUserContext: !!response.data?.userContext,
        userContextType: typeof response.data?.userContext
      },
      hasMetadata: !!response.metadata,
      metadata: response.metadata
    });
    console.log("[CONTEXT-COLLECTOR] [RESPONSE] Total execution time:", {
      totalLatencyMs: `${totalLatencyMs}ms`,
      totalLatencySeconds: `${(totalLatencyMs / 1000).toFixed(2)}s`,
      openaiLatencyPercent: `${((openaiLatencyMs / totalLatencyMs) * 100).toFixed(1)}%`
    });
    console.log("[CONTEXT-COLLECTOR] [RESPONSE] ✅ Request completed successfully");

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("[CONTEXT-COLLECTOR] [ERROR] ❌ Fatal error occurred");
    console.error("[CONTEXT-COLLECTOR] [ERROR] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("[CONTEXT-COLLECTOR] [ERROR] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[CONTEXT-COLLECTOR] [ERROR] Error stack:", error instanceof Error ? error.stack : "No stack trace available");
    console.error("[CONTEXT-COLLECTOR] [ERROR] Error context:", {
      totalLatencyMs: latencyMs,
      openaiLatencyMs,
      timestamp: new Date().toISOString()
    });

    // Try to parse more details from error
    if (error instanceof Error) {
      console.error("[CONTEXT-COLLECTOR] [ERROR] Error details:", {
        name: error.name,
        message: error.message,
        cause: error.cause
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        metadata: {
          agentType: "context-collector",
          modelUsed: "gpt-5-mini",
          reasoningEffort: "medium",
          verbosity: "medium",
          latencyMs,
          cached: false
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Calculate estimated cost for GPT-5 mini
 * Pricing (estimated): $0.10 per 1M input tokens, $0.30 per 1M output tokens
 */
function calculateCost(totalTokens: number, model: string): number {
  if (model === "gpt-5-mini") {
    // Simplified: assume 60% input, 40% output
    const inputTokens = totalTokens * 0.6;
    const outputTokens = totalTokens * 0.4;
    return (inputTokens * 0.10 / 1000000) + (outputTokens * 0.30 / 1000000);
  }
  return 0;
}

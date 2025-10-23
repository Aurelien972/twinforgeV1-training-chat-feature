/**
 * Training Progression Analyzer Edge Function
 * Analyzes training progression data and generates AI insights with GPT-5-mini
 * Stores results in training_progression_insights table with 24h cache
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProgressionRequest {
  userId: string;
  period: 'week' | 'month' | 'quarter';
}

interface ProgressionDataPoint {
  weekLabel: string;
  totalVolume: number;
  sessionsCount: number;
  avgRPE: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const requestBody: ProgressionRequest = await req.json();
    const { userId, period } = requestBody;

    console.log("[PROGRESSION-ANALYZER] Request received", { userId, period });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if recent insights exist (< 24h)
    const { data: existingInsights } = await supabase
      .from("training_progression_insights")
      .select("*")
      .eq("user_id", userId)
      .eq("period", period)
      .gte("expires_at", new Date().toISOString())
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingInsights) {
      console.log("[PROGRESSION-ANALYZER] Recent insights found, returning cached data");
      return new Response(
        JSON.stringify({
          success: true,
          insights: existingInsights.content,
          cached: true,
          generatedAt: existingInsights.generated_at,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch training sessions for the period
    const weeks = period === 'week' ? 4 : period === 'month' ? 12 : 24;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const { data: sessions, error: sessionsError } = await supabase
      .from("training_sessions")
      .select(`
        *,
        training_metrics (
          volume_kg,
          distance_km,
          reps_total
        )
      `)
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", startDate.toISOString())
      .order("completed_at", { ascending: true });

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    if (!sessions || sessions.length < 3) {
      console.log("[PROGRESSION-ANALYZER] Insufficient sessions for analysis");

      const starterInsights = {
        paragraph1: "Vous débutez votre parcours d'entraînement. Complétez quelques sessions supplémentaires pour débloquer une analyse détaillée de votre progression.",
        paragraph2: "Concentrez-vous sur la régularité et l'apprentissage des mouvements. Les premières séances servent à établir votre base et à comprendre vos capacités actuelles.",
        recommendations: [
          "Priorisez la constance (2-3 sessions par semaine)",
          "Focus technique avant intensité",
          "Écoutez votre corps pour éviter les blessures précoces"
        ]
      };

      return new Response(
        JSON.stringify({
          success: true,
          insights: starterInsights,
          sessionsAnalyzed: sessions.length,
          isStarter: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate progression metrics
    const progressionData = calculateProgressionMetrics(sessions, weeks);

    // Get disciplines breakdown
    const disciplines = Array.from(new Set(sessions.map(s => s.discipline || s.session_type)));
    const disciplineStats = disciplines.map(disc => {
      const discSessions = sessions.filter(s => (s.discipline || s.session_type) === disc);
      return {
        discipline: disc,
        sessionsCount: discSessions.length,
        percentage: Math.round((discSessions.length / sessions.length) * 100)
      };
    });

    // Call GPT-5-mini for analysis
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const prompt = `Tu es un coach sportif expert. Analyse les données de progression suivantes et génère une analyse en EXACTEMENT 2 paragraphes + recommandations.

Données de progression (période: ${period === 'week' ? '4 semaines' : period === 'month' ? '12 semaines' : '24 semaines'}):
- Sessions totales: ${sessions.length}
- Volume progression: ${JSON.stringify(progressionData.volumeData.slice(-6))}
- RPE moyen: ${progressionData.avgRPE}
- Consistance: ${progressionData.consistencyPercentage}%
- Disciplines: ${JSON.stringify(disciplineStats)}
- Tendance volume: ${progressionData.volumeTrend}
- Tendance sessions: ${progressionData.sessionsTrend}

Génère une analyse structurée ainsi:

{
  "paragraph1": "Analyse factuelle en 2-3 phrases de l'état actuel de la progression, des tendances de volume et d'intensité, et des points forts identifiés.",
  "paragraph2": "Recommandations concrètes en 2-3 phrases sur les ajustements à faire (volume/intensité/fréquence), les zones à surveiller, et les prochaines étapes optimales.",
  "recommendations": ["Recommandation 1 courte et actionnable", "Recommandation 2", "Recommandation 3"]
}

Sois précis, factuel, motivant. Utilise des chiffres concrets. JSON uniquement, pas de markdown.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un coach sportif expert en analyse de progression. Tu réponds UNIQUEMENT en JSON valide."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        reasoning_effort: "low",
        max_completion_tokens: 800,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const analysisText = openaiData.choices[0].message.content;

    // Parse JSON response
    let insights;
    try {
      insights = JSON.parse(analysisText.replace(/```json\n?|\n?```/g, '').trim());
    } catch (e) {
      console.error("[PROGRESSION-ANALYZER] Failed to parse AI response", analysisText);
      throw new Error("Failed to parse AI response");
    }

    // Store insights in database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiration

    const { error: insertError } = await supabase
      .from("training_progression_insights")
      .insert({
        user_id: userId,
        period,
        content: insights,
        sessions_analyzed: sessions.length,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[PROGRESSION-ANALYZER] Failed to save insights", insertError);
    }

    console.log("[PROGRESSION-ANALYZER] Analysis complete", {
      userId,
      period,
      sessionsAnalyzed: sessions.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        insights,
        sessionsAnalyzed: sessions.length,
        cached: false
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("[PROGRESSION-ANALYZER] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Calculate progression metrics from sessions
 */
function calculateProgressionMetrics(sessions: any[], weeks: number) {
  const volumeData: ProgressionDataPoint[] = [];
  const now = new Date();

  // Calculate weekly progression
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - ((weeks - i) * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekSessions = sessions.filter(s => {
      const sessionDate = new Date(s.completed_at);
      return sessionDate >= weekStart && sessionDate < weekEnd;
    });

    const totalVolume = weekSessions.reduce((sum, s) => {
      const metrics = Array.isArray(s.training_metrics) ? s.training_metrics[0] : s.training_metrics;
      return sum + (metrics?.volume_kg || metrics?.distance_km || 0);
    }, 0);

    const avgRPE = weekSessions.length > 0
      ? weekSessions.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / weekSessions.length
      : 0;

    volumeData.push({
      weekLabel: `S${i + 1}`,
      totalVolume: Math.round(totalVolume),
      sessionsCount: weekSessions.length,
      avgRPE: Math.round(avgRPE * 10) / 10,
    });
  }

  // Calculate trends
  const recentWeeks = volumeData.slice(-4);
  const olderWeeks = volumeData.slice(0, Math.floor(weeks / 2));

  const recentAvgVolume = recentWeeks.reduce((sum, w) => sum + w.totalVolume, 0) / recentWeeks.length;
  const olderAvgVolume = olderWeeks.length > 0
    ? olderWeeks.reduce((sum, w) => sum + w.totalVolume, 0) / olderWeeks.length
    : recentAvgVolume;

  const volumeTrend = olderAvgVolume > 0
    ? Math.round(((recentAvgVolume - olderAvgVolume) / olderAvgVolume) * 100)
    : 0;

  const recentAvgSessions = recentWeeks.reduce((sum, w) => sum + w.sessionsCount, 0) / recentWeeks.length;
  const olderAvgSessions = olderWeeks.length > 0
    ? olderWeeks.reduce((sum, w) => sum + w.sessionsCount, 0) / olderWeeks.length
    : recentAvgSessions;

  const sessionsTrend = olderAvgSessions > 0
    ? Math.round(((recentAvgSessions - olderAvgSessions) / olderAvgSessions) * 100)
    : 0;

  const avgRPE = sessions.reduce((sum, s) => sum + (s.rpe_avg || 0), 0) / sessions.length;

  const activeDays = new Set(sessions.map(s => new Date(s.completed_at).toDateString())).size;
  const totalDays = weeks * 7;
  const consistencyPercentage = Math.round((activeDays / totalDays) * 100);

  return {
    volumeData,
    avgRPE: Math.round(avgRPE * 10) / 10,
    volumeTrend,
    sessionsTrend,
    consistencyPercentage,
  };
}
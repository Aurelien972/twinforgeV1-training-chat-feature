/**
 * Training Insights Generator Edge Function
 * Generates personalized AI insights based on user's training history
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InsightsRequest {
  userId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const requestBody: InsightsRequest = await req.json();
    const { userId } = requestBody;

    console.log("[INSIGHTS-GENERATOR] Request received", { userId });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from("user_profile")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[INSIGHTS-GENERATOR] Profile fetch error", profileError);
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: sessions, error: sessionsError } = await supabase
      .from("training_sessions")
      .select(`
        *,
        training_metrics (*)
      `)
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", ninetyDaysAgo.toISOString())
      .order("completed_at", { ascending: false });

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      console.log("[INSIGHTS-GENERATOR] No sessions found, generating starter insights", { userId });

      const starterInsights = generateStarterInsights(profile);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: insertError } = await supabase
        .from("training_insights")
        .insert({
          user_id: userId,
          insight_type: "starter",
          discipline: "all",
          content: starterInsights,
          recommendations: starterInsights.recommendations || [],
          priority: "medium",
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error("[INSIGHTS-GENERATOR] Failed to save starter insights", insertError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          insights: starterInsights,
          sessionsAnalyzed: 0,
          isStarter: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mainDiscipline = sessions[0]?.discipline || profile?.preferences?.workout?.type || "strength";
    const fitnessLevel = profile?.fitness_level || "intermediate";
    const goal = profile?.preferences?.workout?.goal || "strength";

    const prompt = buildInsightsPrompt(sessions, { mainDiscipline, fitnessLevel, goal });

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

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
            content: "Tu es un coach IA expert en analyse de progression sportive. Tu génères des insights personnalisés basés sur l'historique d'entraînement."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        reasoning_effort: "medium",
        max_completion_tokens: 3000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const analysisText = openaiData.choices[0].message.content;
    const analysisResult = JSON.parse(analysisText);

    console.log("[INSIGHTS-GENERATOR] Analysis generated successfully", {
      userId,
      recommendationsCount: analysisResult.recommendations?.length || 0
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: insertError } = await supabase
      .from("training_insights")
      .insert({
        user_id: userId,
        insight_type: "weekly",
        discipline: "all",
        content: analysisResult,
        recommendations: analysisResult.recommendations || [],
        priority: "medium",
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[INSIGHTS-GENERATOR] Failed to save insights", insertError);
      throw new Error(`Failed to save insights: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        insights: analysisResult,
        sessionsAnalyzed: sessions.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("[INSIGHTS-GENERATOR] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateStarterInsights(profile: any) {
  const mainDiscipline = profile?.preferences?.workout?.type || "strength";
  const goal = profile?.preferences?.workout?.goal || "strength";

  return {
    summary: "Bienvenue dans votre atelier de conseils ! Complétez quelques séances pour recevoir des insights personnalisés basés sur votre progression.",
    progressionTrends: {
      volume: { trend: "stable", comment: "Commencez par des séances régulières pour établir votre volume de base" },
      intensity: { trend: "stable", avgRPE: 7, comment: "Écoutez votre corps et progressez graduellement" },
      consistency: { percentage: 0, comment: "La régularité est la clé du progrès. Visez 3-4 séances par semaine." }
    },
    imbalances: [],
    weakPoints: [],
    recommendations: [
      {
        id: "starter-1",
        title: "Commencez en douceur",
        description: `Pour ${mainDiscipline === 'endurance' ? 'l\'endurance' : 'la force'}, privilégiez la technique et la régularité avant l'intensité.`,
        category: "strategy",
        priority: "high",
        actionable: true,
        actionLabel: "Créer une séance"
      },
      {
        id: "starter-2",
        title: "Établissez une routine",
        description: "Fixez des jours et heures réguliers pour vos entraînements. La constance crée l'habitude.",
        category: "strategy",
        priority: "high",
        actionable: false
      },
      {
        id: "starter-3",
        title: "Suivez votre progression",
        description: "Enregistrez toutes vos séances pour obtenir des conseils personnalisés basés sur vos données réelles.",
        category: "strategy",
        priority: "medium",
        actionable: false
      }
    ],
    nextWeekFocus: {
      suggestedSessions: 3,
      focusAreas: ["Établir la routine", "Maîtriser les mouvements de base", "Construire l'endurance de base"],
      intensityDistribution: { light: 2, moderate: 1, intense: 0 },
      restDaysRecommended: 2
    }
  };
}

function buildInsightsPrompt(sessions: any[], profile: any): string {
  const sessionsData = sessions.map(s => ({
    date: s.completed_at,
    discipline: s.discipline,
    duration: s.duration_actual_min,
    rpe: s.rpe_avg,
    metrics: s.training_metrics?.[0] || {}
  }));

  return `Tu es un coach IA expert en analyse de progression sportive.

Analyse l'historique d'entraînement de l'utilisateur et génère des insights personnalisés.

# Profil Utilisateur
- Discipline principale: ${profile.mainDiscipline}
- Niveau: ${profile.fitnessLevel}
- Objectif: ${profile.goal}

# Historique (${sessions.length} séances des 90 derniers jours)
${JSON.stringify(sessionsData, null, 2)}

# Analyse Requise

1. **Tendances de Progression**:
   - Volume/Distance: augmentation, stagnation, ou baisse?
   - Intensité: RPE moyen, évolution
   - Consistance: fréquence régulière ou irrégulière?

2. **Déséquilibres Détectés**:
   - Pour Force: ratio push/pull, upper/lower
   - Pour Endurance: respect du 80/20, distribution zones
   - Groupes musculaires sous-travaillés
   - Périodisation: accumulation, intensification, récupération

3. **Points Faibles**:
   - Exercices/distances avec peu de progression
   - RPE trop élevé systématiquement
   - Signes d'overtraining ou undertraining

4. **Recommendations**:
   - Adjustements volume/intensité
   - Suggestions d'exercices/variations
   - Timing optimal pour deload
   - Focus pour semaine prochaine

# Format de Sortie (JSON strict)

{
  "summary": "Résumé global de l'analyse en 2-3 phrases",
  "progressionTrends": {
    "volume": { "trend": "increasing" | "stable" | "decreasing", "percentage": number, "comment": string },
    "intensity": { "trend": "increasing" | "stable" | "decreasing", "avgRPE": number, "comment": string },
    "consistency": { "percentage": number, "comment": string }
  },
  "imbalances": [
    { "type": "volume" | "frequency" | "zones", "description": string, "severity": "low" | "medium" | "high" }
  ],
  "weakPoints": [
    { "exercise": string, "issue": string, "recommendation": string }
  ],
  "recommendations": [
    {
      "id": string,
      "title": string,
      "description": string,
      "category": "volume" | "intensity" | "recovery" | "technique" | "equipment",
      "priority": "low" | "medium" | "high",
      "actionable": boolean,
      "actionLabel": string
    }
  ],
  "nextWeekFocus": {
    "suggestedSessions": number,
    "focusAreas": string[],
    "intensityDistribution": { "light": number, "moderate": number, "intense": number },
    "restDaysRecommended": number
  }
}

Génère l'analyse complète en JSON.`;
}
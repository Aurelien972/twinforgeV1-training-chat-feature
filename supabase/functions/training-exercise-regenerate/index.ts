/**
 * Training Exercise Regenerate Edge Function
 * Génère un nouvel exercice différent des exercices et alternatives proposés
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.54.0";
import { checkTokenBalance, consumeTokensAtomic, createInsufficientTokensResponse } from '../_shared/tokenMiddleware.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RegenerateRequest {
  userId: string;
  currentExercise: {
    id: string;
    name: string;
    category: string;
    muscleGroup: string;
    equipment: string[];
  };
  existingExercises: string[];
  existingAlternatives: string[];
  availableEquipment: string[];
  userContext?: {
    energyLevel?: number;
    goals?: string[];
  };
}

interface RegenerateResponse {
  success: boolean;
  data?: {
    exercise: {
      id: string;
      name: string;
      variant?: string;
      sets: number;
      reps: number;
      load: number | number[] | null;
      rest: number;
      tempo?: string;
      rpeTarget?: number;
      substitutions: string[];
    };
  };
  error?: string;
  metadata: {
    tokensUsed?: number;
    costUsd?: number;
    latencyMs: number;
    model: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const body: RegenerateRequest = await req.json();
    const { userId, currentExercise, existingExercises, existingAlternatives, availableEquipment, userContext } = body;

    if (!userId || !currentExercise) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: userId, currentExercise",
          metadata: {
            latencyMs: Date.now() - startTime,
            model: "none"
          }
        } as RegenerateResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tokenCheckResult = await checkTokenBalance(supabase, userId, 100);
    if (!tokenCheckResult.hasEnoughTokens) {
      console.log("[EXERCISE-REGENERATE] Insufficient tokens", { userId, required: 100, available: tokenCheckResult.currentBalance });
      return createInsufficientTokensResponse(tokenCheckResult.currentBalance, 100, corsHeaders);
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const allExcludedExercises = [
      currentExercise.name,
      ...existingExercises,
      ...existingAlternatives
    ].filter((name, index, self) => self.indexOf(name) === index);

    const systemPrompt = `Tu es un coach sportif expert en programmation d'entraînement.
Ta mission est de proposer UN SEUL exercice DIFFÉRENT et COHÉRENT pour remplacer l'exercice actuel.

CONTRAINTES STRICTES:
- L'exercice doit cibler le même groupe musculaire (${currentExercise.muscleGroup})
- L'exercice doit être dans la même catégorie (${currentExercise.category})
- L'exercice NE DOIT PAS être dans cette liste: ${allExcludedExercises.join(", ")}
- L'exercice doit être réalisable avec cet équipement: ${availableEquipment.join(", ")}
- Propose 3 alternatives différentes pour cet exercice
- Adapte la charge de manière intelligente selon le type d'exercice

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte supplémentaire.

Format de réponse attendu:
{
  "name": "Nom de l'exercice",
  "variant": "Variante spécifique (optionnel)",
  "sets": number,
  "reps": number,
  "load": number | [number, number, ...] | null,
  "rest": number (en secondes),
  "tempo": "3010" (optionnel),
  "rpeTarget": number (1-10),
  "substitutions": ["Alternative 1", "Alternative 2", "Alternative 3"]
}`;

    const userPrompt = `Contexte utilisateur:
- Niveau d'énergie: ${userContext?.energyLevel || 7}/10
- Objectifs: ${userContext?.goals?.join(", ") || "Progression générale"}

Exercice actuel à remplacer:
- Nom: ${currentExercise.name}
- Catégorie: ${currentExercise.category}
- Groupe musculaire: ${currentExercise.muscleGroup}
- Équipement utilisé: ${currentExercise.equipment.join(", ")}

Exercices déjà proposés (à ÉVITER): ${allExcludedExercises.join(", ")}

Équipement disponible: ${availableEquipment.join(", ")}

Génère un nouvel exercice DIFFÉRENT avec ses paramètres et 3 alternatives.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        reasoning_effort: "low",
        max_completion_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedExercise = JSON.parse(openaiData.choices[0].message.content);

    const usage = openaiData.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;

    const consumptionResult = await consumeTokensAtomic(supabase, {
      userId,
      edgeFunctionName: 'training-exercise-regenerate',
      operationType: 'exercise-regeneration',
      openaiModel: 'gpt-5-mini',
      openaiInputTokens: inputTokens,
      openaiOutputTokens: outputTokens,
      metadata: {
        requestId,
        currentExercise: currentExercise.name,
        muscleGroup: currentExercise.muscleGroup,
        category: currentExercise.category,
        regeneratedExercise: generatedExercise.name
      }
    }, requestId);

    if (!consumptionResult.success) {
      console.error("[EXERCISE-REGENERATE] Token consumption failed", consumptionResult.error);
    }

    const response: RegenerateResponse = {
      success: true,
      data: {
        exercise: {
          id: crypto.randomUUID(),
          name: generatedExercise.name,
          variant: generatedExercise.variant,
          sets: generatedExercise.sets,
          reps: generatedExercise.reps,
          load: generatedExercise.load,
          rest: generatedExercise.rest,
          tempo: generatedExercise.tempo,
          rpeTarget: generatedExercise.rpeTarget,
          substitutions: generatedExercise.substitutions || []
        }
      },
      metadata: {
        tokensUsed: inputTokens + outputTokens,
        costUsd: (inputTokens + outputTokens) * 0.0000015,
        latencyMs: Date.now() - startTime,
        model: "gpt-5-mini",
        newBalance: consumptionResult.newBalance
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in training-exercise-regenerate:", error);

    const response: RegenerateResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      metadata: {
        latencyMs: Date.now() - startTime,
        model: "none"
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

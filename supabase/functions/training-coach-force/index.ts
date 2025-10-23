/**
 * Training Coach Force Edge Function
 * Generates personalized Force & Powerbuilding training prescriptions using GPT-5 mini
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.54.0";
import { checkTokenBalance, consumeTokensAtomic, createInsufficientTokensResponse } from "../_shared/tokenMiddleware.ts";

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

    const systemPrompt = `Tu es un coach IA expert en Force & Powerbuilding.

# Principes Clés

## Périodisation
- Linéaire: Débutants (+2.5-5kg/semaine)
- Ondulée: Intermédiaires/Avancés (variation volume/intensité)
- Auto-régulation: RPE 7-8 (2-3 reps en réserve)

## Sélection Exercices
1. **Composés majeurs**: Squat, Développé couché, Soulevé de terre, Développé militaire, Tirage
2. **Composés secondaires**: Fentes, Dips, Tractions
3. **Isolation**: Biceps, Triceps, Deltoïdes (optionnel)

## Paramètres
- **Volume**: 10-25 sets/groupe/semaine selon niveau
- **Intensité**: Force 85-95%, Hypertrophie 70-85%
- **Repos**: Force 3-5min, Hypertrophie 60-90s
- **Tempo**: Force explosif, Hypertrophie contrôlé (3-0-1-0)

## Échauffement Articulaire (OBLIGATOIRE dans warmup)

**Principes**: 3-5min max (2-3min si wantsShortVersion), mobilité articulaire ciblée, mouvements lents sans charge, isOptional: true.

**Structure JSON**: {duration: 3-5, isOptional: true, exercises: [{id, name, duration, sets, reps, instructions, targetAreas}], notes}

**Focus**: Haut → épaules/thoracique | Bas → hanches/genoux | Full → combinaison

**Instructions**: 3-5 mouvements (2-3 si rapide), 1-2 sets de 8-12 reps, cibler articulations exercices principaux.

## Sécurité
- Toujours inclure échauffement articulaire court dans warmup
- Toujours sets d'approche avec charges progressives
- Respecter limitations/blessures
- Technique > Charge
- RPE cible: 7-8 pour majorité des séries

# ADAPTATION HOME: Mobilier & Objets Domestiques

**Mobilier**: Chaise → step-ups/dips/bulgarian splits | Table → incline/decline push-ups, rowing inversé | Escaliers → cardio/step-ups/mollets | Mur → wall sits/handstands/pike push-ups

**Objets improvisés**: Bidon eau → goblet squats/press/curls | Sac chargé → squats/farmer walks/rowing | Livres → élévations/extensions

**Exercices clés**: Push-ups (variantes), squats/lunges (poids corps), dips (canapé), step-ups (chaise), planches, burpees

**Sécurité**: Tester stabilité avant, bois/métal OK, éviter verre/plastique/roulettes

# ADAPTATION OUTDOOR: Éléments Naturels & Urbains

**Naturel**: Branches → tractions/rows | Roches → atlas lifts/goblet/farmer walks | Troncs/souches → box jumps/step-ups | Pentes → hill sprints/fentes | Sol sablonneux → résistance cardio

**Urbain**: Bancs → step-ups/dips/box jumps | Escaliers → sprints HIIT/fentes/mollets | Barres publiques → pull-ups/dips/L-sits | Murs → wall sits/handstands

**Exercices clés**: Sprints (plat/côte), tractions (branches/barres), dips (bancs), box jumps, burpees, atlas stone lifts, farmer walks

**Sécurité**: Tester solidité branches/roches avant utilisation, herbe > asphalte pour impacts, adapter si pluie

# INTELLIGENCE RECUPERATION (CRITIQUE)

Analyser "recoveryAnalysis" du userContext AVANT génération.

## 1. Dernière Séance
**SI < 3j**: Consulter muscleGroupsWorked, ÉVITER si "fatigued", groupes complémentaires.
**Ex**: Jambes → Haut | Pecs/Triceps → Dos/Biceps | Full Body → Léger

## 2. Récupération
**recoveryStatus**: "fatigued" (< 48h) → NE PAS | "recovering" (48-72h) → Léger (RPE 6-7, -50% vol) | "recovered" (> 72h) → Normal
**Règles**: Jambes/Dos/Pecs min 48h | Épaules/Bras min 24h | Aucun recovered → Mobilité/cardio

## 3. Variation
**recentExercises**: frequency ≥ 2 → NE PAS, VARIANTES (Squat → Front/Goblet/Bulgarian | Bench → Incline/DB/Dips | Row → DB/Poulie/Tractions)

## 4. Surmenage
**SI count ≥ 3**: ALERTE, NE PAS, WARNING notes, compensatoire

## 5. Algorithme
1. Lister "recovered" 2. Éliminer "fatigued" 3. Éliminer frequency ≥ 2 4. Choisir 2-3 complémentaires 5. Nouveaux/peu utilisés 6. Variantes si besoin
**Priorisation**: Jamais/rarement > récurrents | Nouveaux > répétés | Équilibre poussée/traction

# GROUPES MUSCULAIRES CIBLÉS (OBLIGATOIRE)

**RÈGLE**: Chaque exercice DOIT spécifier muscleGroups (1-3 groupes principaux) et equipment (équipement principal).

**muscleGroups** (OBLIGATOIRE): Array de 1-3 groupes musculaires ciblés en français
- Exemples valides: "Pectoraux", "Dorsaux", "Quadriceps", "Ischio-jambiers", "Deltoïdes", "Trapèzes", "Biceps", "Triceps", "Fessiers", "Mollets", "Abdominaux", "Obliques", "Avant-bras", "Érecteurs du rachis"
- Format: ["Groupe principal", "Groupe secondaire"] - Toujours en français
- Ex: Squat → ["Quadriceps", "Fessiers"] | Bench → ["Pectoraux", "Triceps"] | Deadlift → ["Érecteurs du rachis", "Ischio-jambiers", "Dorsaux"]

**equipment** (OBLIGATOIRE): Équipement principal utilisé (string, en français)
- Exemples: "Barre olympique", "Haltères", "Machine", "Poids du corps", "Kettlebell", "Élastiques", "TRX", "Poulie", "Smith machine", "Banc", "Câble"
- Si poids du corps: "Poids du corps" | Si home gym: adapter ("Chaise", "Table", "Bidon d'eau") | Si outdoor: adapter ("Banc public", "Barre de traction", "Escaliers")
- Ex: Squat barre → "Barre olympique" | Push-ups → "Poids du corps" | Curl haltères → "Haltères"

# FORMATS EXERCICES

**RÈGLE**: reps (nombre) OU repsProgression (array), JAMAIS les deux.

**reps** (majorité): Classiques, ramping (même reps, charges ↑), supersets
Ex: {"name": "Squat", "sets": 5, "reps": 6, "load": [60,80,100,110,120], "muscleGroups": ["Quadriceps", "Fessiers"], "equipment": "Barre olympique"}

**repsProgression** (rare): Pyramides (12,10,8,6), drop sets
Ex: {"name": "Bench", "sets": 4, "repsProgression": [12,10,8,6], "load": [60,70,80,85], "muscleGroups": ["Pectoraux", "Triceps"], "equipment": "Barre olympique"}

❌ ERREUR: Sans reps/repsProgression OU les deux OU sans muscleGroups OU sans equipment

# RAMPING SETS

Composés majeurs (Squat/Bench/DL/Row): PROGRESSION charge array obligatoire.

**Format**: load = [s1, s2, ...] Ex: {"name": "Squat", "sets": 5, "reps": 6, "load": [60,80,100,110,120]}

**Principes**: S1-2 warm-up (50-75% cible), S3-5 working, dernière = top set

**Incréments**: Lourds (Squat/DL/Row) → Déb +5kg, Inter +7.5kg, Av +10kg | Moyens (Bench/Press) → Déb +2.5kg, Inter +5kg, Av +7.5kg | Isolation → constante OK

**Historique**: avgRPE 7-8 → +2.5-5kg | >8 → même | <7 → +5-10kg | Nouveau → conservateur (Déb 40-50kg squat, Inter 60-80kg, Av estimer)

**Sécurité**: S1 max 60% finale, saut max 15kg, energyLevel<6 → -10-15%, RPE 8 cible

**Application**: Squat/Bench/DL/Press/Row/Traction lestée → array | Isolation/accessoires → unique OK

# ADAPTATION LIEU (CRITIQUE)

Analyser "locationMode" du preparerContext.

## Gym
Normal: Machines/équipements, composés charges lourdes, ramping barres, machines isolation, câbles/racks
Ex: Squat rack, bench press, leg press, lat pulldown, câble triceps

## Home
Prio poids corps si limité, meubles (Chaise → step-ups/dips/bulgarian | Table → incline/decline push-ups/rows | Escaliers → cardio | Mur → wall sits/handstands | Canapé → dips), objets (Bidon → goblet/press/curls | Sac → squats/walks), haltères si dispo, tempo/pauses/unilatéral
Ex: Push-ups variantes, goblet squats, step-ups, dips, bulgarian, planches, pike push-ups

## Outdoor
Prio fonctionnel poids corps, éléments (Banc → step-ups/dips/box jumps | Escaliers → sprints HIIT | Branches → tractions/rows | Roches → atlas/press/goblet | Pente → hill sprints/fentes | Mur → wall sits/handstands), cardio/burpees/HIIT, plio si herbe, éviter asphalte, adapter météo
Ex: Sprints, push-ups, tractions, step-ups, dips, burpees, farmer walks, wall sits, mountain climbers

**coachNotes/Rationale**: MENTIONNER lieu, POURQUOI adapté, alternatives, sécurité, valoriser (Gym → charges/progression | Home → confort/créativité | Outdoor → air/espace/fonctionnel)

## sessionName - Titre Motivant de la Séance

Le **sessionName** doit être un nom descriptif, motivant et personnalisé (max 40 caractères).

**Exemples selon focus:**
- "Power Squat & Tractions Lestées"
- "Hypertrophie Pectoraux Complet"
- "Force Deadlift & Rowing Lourd"
- "Pump Bras & Épaules Killer"
- "Jambes Complètes Volume"
- "Push Intensif Upper Body"
- "Legs Day Progression"
- "Back & Biceps Massif"

**Le sessionName doit:**
- Refréchir les mouvements principaux ou groupes musculaires
- Indiquer l'intensité/objectif (Force, Volume, Pump, Power, Hypertrophie)
- Être motivant et clair
- Rester concis (max 40 caractères pour affichage mobile)

## sessionSummary - Résumé Narratif

Le **sessionSummary** est un résumé en 1-2 phrases (100-150 caractères) qui explique:
- L'objectif principal de la séance
- Les zones ciblées ou mouvements clés
- L'approche ou la méthode utilisée

**Exemples:**
- "Séance axée force maximale jambes avec travail poussée haut du corps. Objectif: progression sur mouvements composés."
- "Volume intense pour pectoraux et triceps avec techniques d'intensification. Focus hypertrophie."
- "Deadlift lourd suivi de rowing pour développer le dos en épaisseur et force."
- "Circuit training full body dynamique pour endurance musculaire et cardio."

# Format JSON OBLIGATOIRE

RETOURNE UN JSON DÉTAILLÉ avec cette structure EXACTE:
{
  "sessionId": "uuid",
  "sessionName": "Power Squat & Poussée Haute",
  "type": "Force Powerbuilding",
  "category": "force-powerbuilding",
  "durationTarget": 60,
  "focus": ["Squat lourd", "Développé couché progression"],
  "sessionSummary": "Séance axée force maximale jambes avec travail poussée haut du corps. Objectif: progression sur mouvements composés avec technique impeccable.",
  "warmup": {
    "duration": 3,
    "isOptional": true,
    "exercises": [
      {
        "id": "wu-1",
        "name": "Rotations articulaires épaules",
        "duration": 60,
        "sets": 2,
        "reps": 10,
        "instructions": "Rotations lentes amplitude complète",
        "targetAreas": ["shoulders", "scapula"]
      }
    ],
    "notes": "Échauffement articulaire ciblant épaules et thoracique"
  },
  "exercises": [
    {
      "id": "ex-1",
      "name": "Squat arrière",
      "variant": "Barre haute",
      "sets": 4,
      "reps": 6,
      "load": 100,
      "tempo": "3-0-1-0",
      "rest": 180,
      "rpeTarget": 8,
      "movementPattern": "Squat",
      "muscleGroups": ["Quadriceps", "Fessiers"],
      "equipment": "Barre olympique",
      "substitutions": ["Squat avant", "Squat gobelet"],
      "intensificationTechnique": "rest-pause",
      "intensificationDetails": "Sur dernière série: faire 6 reps, pause 15s, faire 2 reps supplémentaires",
      "executionCues": ["Descendre sous les hanches", "Tronc gainé", "Talons au sol"],
      "coachNotes": "Priorité technique sur la charge",
      "coachTips": ["Visualise le mouvement avant chaque série", "Respire profondément entre les reps"],
      "safetyNotes": ["Garde le dos neutre", "Arrête si douleur genoux"],
      "commonMistakes": ["Genoux vers l'intérieur", "Dos rond"]
    }
  ],
  "cooldown": {"duration": 5, "exercises": ["Stretching quadriceps", "Mobilité hanches"], "notes": "Focus sur les zones sollicitées"},
  "overallNotes": "...",
  "expectedRpe": 7.5,
  "coachRationale": "..."
}

IMPORTANT:
- Tous les noms d'exercices doivent être en FRANÇAIS (ex: "Squat arrière" pas "Back Squat")
- Les champs intensificationTechnique, intensificationDetails, executionCues sont OBLIGATOIRES
- Les champs muscleGroups (array) et equipment (string) sont OBLIGATOIRES pour CHAQUE exercice
- muscleGroups: 1-3 groupes musculaires en français (ex: ["Pectoraux", "Triceps"])
- equipment: nom de l'équipement principal en français (ex: "Barre olympique", "Haltères", "Poids du corps")
- TOUJOURS fournir substitutions (minimum 2 alternatives)
- Si poids du corps: load peut être omis OU = 0
- Si charges progressives (ramping): load = array [série1, série2, ...]
- Si charge unique: load = number
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

    const userPrompt = `# Contexte Utilisateur

${JSON.stringify(userContext, null, 2)}

# Contexte de Préparation

${JSON.stringify(preparerContext, null, 2)}

# Instructions

Génère une prescription de training Force & Powerbuilding totalement personnalisée.

**Contraintes impératives**:
- Respecter le temps disponible: ${preparerContext.availableTime} minutes
- Type d'environnement: ${trainingContext}
- Utiliser UNIQUEMENT ces équipements (${equipmentCount} disponibles): ${equipmentList}
- Niveau d'énergie: ${preparerContext.energyLevel}/10
- Éviter ces mouvements: ${avoidMovements}

**Objectifs de Personnalisation**:
- Focus sur la progression et la technique
- Adapter l'intensité au niveau d'énergie
- Prescrire des charges réalistes basées sur l'historique
- **IMPORTANT**: Générer un échauffement articulaire court (3-5 min) dans warmup
- Si wantsShortVersion = true, échauffement minimal (2-3 min, 2-3 mouvements)

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

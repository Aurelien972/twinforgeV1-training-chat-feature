/**
 * Training Coach Analyzer Edge Function
 * Analyzes post-session performance using GPT-5-mini for all training types
 * Generates personalized insights, metrics analysis, and recommendations
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.54.0";

/**
 * Détecte le type de coach depuis la prescription de séance
 */
function detectCoachType(sessionPrescription: any): string {
  // Compétition: détection via competitionFormat ou stations
  if (sessionPrescription.competitionFormat || sessionPrescription.stations) {
    return 'competition';
  }

  // Fonctionnel: détection via wodFormat ou type functional
  if (sessionPrescription.wodFormat || sessionPrescription.type?.toLowerCase() === 'functional' || sessionPrescription.category?.toLowerCase() === 'functional') {
    return 'functional';
  }

  // Calisthenics: détection via type calisthenics
  if (sessionPrescription.type?.toLowerCase() === 'calisthenics' || sessionPrescription.category?.toLowerCase() === 'calisthenics') {
    return 'calisthenics';
  }

  // Endurance: détection via mainWorkout (blocs) ou discipline
  if (sessionPrescription.mainWorkout || sessionPrescription.discipline) {
    const discipline = sessionPrescription.discipline?.toLowerCase();
    if (discipline === 'running' || discipline === 'cycling' || discipline === 'swimming' || discipline === 'triathlon' || discipline === 'cardio') {
      return 'endurance';
    }
  }

  // Force: détection via type ou category
  const type = sessionPrescription.type?.toLowerCase();
  const category = sessionPrescription.category?.toLowerCase();

  if (type === 'force' || type === 'strength' || type === 'hypertrophy' || type === 'powerlifting' || type === 'bodybuilding') {
    return 'force';
  }

  if (category === 'force' || category === 'force-powerbuilding' || category === 'strength') {
    return 'force';
  }

  // Si présence d'exercices (et pas de mainWorkout), c'est probablement force
  if (sessionPrescription.exercises && !sessionPrescription.mainWorkout) {
    return 'force';
  }

  // Fallback
  return 'mixed';
}

/**
 * Génère le prompt système adapté au type de coach
 */
function buildSystemPrompt(coachType: string): string {
  const commonIntro = `Tu es un coach IA expert en analyse de performance sportive.

# Mission
Analyse la séance d'entraînement complétée et génère des insights ultra-personnalisés pour aider l'athlète à progresser.
`;

  if (coachType === 'competition') {
    return commonIntro + `
# Type de Training
COMPÉTITION (Fitness Competition, Multi-Stations, Circuit Challenge)

# Principes d'Analyse pour la Compétition

## Performance Globale
- Évalue la performance multi-stations et la gestion globale du temps
- Compare le temps total réalisé avec les objectifs de chaque station
- Identifie la régularité et la stratégie de pacing entre stations
- Analyse la capacité à maintenir l'intensité sur toute la durée

## Analyse par Station
- Performance individuelle de chaque station
- Temps réalisé vs temps cible par station
- Type de station (cardio, strength, hybrid)
- RPE perçu et intensité maintenue
- Gestion des transitions entre stations

## Métriques Clés Compétition
- **Temps Total**: Durée complète de toutes les stations
- **Temps Moyen par Station**: Régularité de la performance
- **Transitions**: Efficacité des changements entre stations
- **Pacing Strategy**: Gestion de l'énergie sur l'ensemble du circuit
- **Intensité Soutenue**: Capacité à maintenir un effort élevé

## Insights Personnalisés
- Stratégie de pacing (départ rapide, régulier, finish fort)
- Stations les plus fortes et les plus faibles
- Gestion de la fatigue cumulée
- Capacité à maintenir la technique sous fatigue
- Efficacité des transitions

## Recommandations Progression
- Améliorations spécifiques par type de station
- Travail sur les stations faibles
- Stratégies de pacing pour prochaines compétitions
- Optimisation des transitions
- Préparation mentale pour le format multi-stations

# Format JSON OBLIGATOIRE

Retourne un JSON COMPLET avec cette structure EXACTE:
{
  "sessionAnalysis": {
    "overallPerformance": {
      "score": 85,
      "rating": "good",
      "summary": "Excellente performance multi-stations avec pacing bien géré..."
    },
    "volumeAnalysis": {
      "totalVolume": 1800,
      "volumeEfficiency": 90,
      "comparedToTarget": "Temps total conforme aux objectifs"
    },
    "intensityAnalysis": {
      "avgRPE": 8.0,
      "rpeDistribution": {"cardio": 8, "strength": 7, "hybrid": 9},
      "intensityZones": "Intensité élevée maintenue sur toutes les stations"
    },
    "techniqueAnalysis": {
      "avgTechniqueScore": 8.0,
      "exercisesWithIssues": [],
      "recommendations": ["Maintenir la technique en fin de circuit"]
    }
  },
  "exerciseBreakdown": [
    {
      "exerciseId": "station-1",
      "exerciseName": "Station 1: Rowing",
      "performance": {
        "completed": true,
        "volumeScore": 90,
        "rpeScore": 85,
        "techniqueScore": 90
      },
      "insights": ["Bon départ, pacing optimal"],
      "nextSessionRecommendations": ["Maintenir cette approche"]
    }
  ],
  "personalizedInsights": {
    "strengths": ["Excellente gestion du pacing", "Transitions rapides", "Intensité constante"],
    "areasToImprove": ["Améliorer performance sur stations strength"],
    "keyTakeaways": ["Ta capacité à gérer un circuit multi-stations s'améliore"],
    "motivationalMessage": "Superbe séance ! Ta stratégie de pacing est exemplaire..."
  },
  "progressionRecommendations": {
    "nextSession": {
      "volumeAdjustment": "Ajouter 1 station supplémentaire",
      "intensityAdjustment": "Réduire les temps de transition à 8s",
      "focusPoints": ["Améliorer stations strength", "Maintenir pacing"]
    },
    "longTerm": {
      "goalAlignment": "Progression excellente vers objectif compétition",
      "milestoneProgress": "30% du chemin parcouru",
      "strategicAdvice": "Continue à varier les formats de circuit pour préparer toute compétition"
    }
  },
  "achievements": [
    {
      "type": "endurance",
      "title": "Circuit Champion",
      "description": "5 stations complétées sous le temps cible",
      "earned": true
    }
  ],
  "coachRationale": "J'ai analysé ta séance de compétition..."
}

IMPORTANT:
- Analyse chaque station individuellement
- Identifie les patterns de performance (début fort, fin fatigue, etc.)
- Focus sur la stratégie globale et la gestion de l'énergie
- Utilise un ton motivant et compétitif
`;
  }

  if (coachType === 'endurance') {
    return commonIntro + `
# Type de Training
ENDURANCE (Course, Cyclisme, Natation, Triathlon, Cardio)

# Principes d'Analyse pour l'Endurance

## Performance Globale
- Évalue la durée totale et le respect des zones cardiaques cibles
- Compare le temps passé dans chaque zone avec les objectifs
- Identifie la régularité du rythme et l'endurance démontrée

## Analyse par Bloc
- Performance de chaque bloc (échauffement, corps, retour au calme)
- Zones cardiaques atteintes vs zones cibles
- Durée réelle vs durée prescrite
- RPE ressenti

## Métriques Clés Endurance
- **TSS (Training Stress Score)**: Charge d'entraînement totale
- **Zones cardiaques**: Distribution Z1, Z2, Z3, Z4, Z5
- **Durée**: Temps total effectif
- **Pace/Vitesse**: Allure moyenne si disponible
- **Régularité**: Constance de l'effort

## Insights Personnalisés
- Gestion du rythme (pacing)
- Capacité à maintenir les zones cibles
- Endurance cardiovasculaire démontrée
- Points d'amélioration sur la régularité

## Recommandations Progression
- Ajustements durée/intensité pour prochaine séance
- Travail spécifique sur zones faibles
- Stratégies de pacing
- Périodisation (base, build, peak)

# Format JSON OBLIGATOIRE

Retourne un JSON COMPLET avec cette structure EXACTE:
{
  "sessionAnalysis": {
    "overallPerformance": {
      "score": 85,
      "rating": "good",
      "summary": "Excellente séance d'endurance avec zones bien respectées..."
    },
    "volumeAnalysis": {
      "totalVolume": 3600,
      "volumeEfficiency": 92,
      "comparedToTarget": "Durée conforme à l'objectif"
    },
    "intensityAnalysis": {
      "avgRPE": 6.5,
      "rpeDistribution": {"Z1": 10, "Z2": 60, "Z3": 20, "Z4": 10},
      "intensityZones": "Majorité en Z2, excellente base aérobie"
    },
    "techniqueAnalysis": {
      "avgTechniqueScore": 8.0,
      "exercisesWithIssues": [],
      "recommendations": ["Maintenir la régularité du rythme"]
    }
  },
  "exerciseBreakdown": [
    {
      "exerciseId": "block-1",
      "exerciseName": "Échauffement",
      "performance": {
        "completed": true,
        "volumeScore": 90,
        "rpeScore": 85,
        "techniqueScore": 90
      },
      "insights": ["Bonne montée en puissance progressive"],
      "nextSessionRecommendations": ["Conserver cette structure d'échauffement"]
    }
  ],
  "personalizedInsights": {
    "strengths": ["Excellente gestion des zones cardiaques", "Régularité du rythme"],
    "areasToImprove": ["Augmenter progressivement le temps en Z3"],
    "keyTakeaways": ["Ta base aérobie se développe bien"],
    "motivationalMessage": "Excellente séance ! Continue à bâtir ta base..."
  },
  "progressionRecommendations": {
    "nextSession": {
      "volumeAdjustment": "Augmenter de 10% la durée totale",
      "intensityAdjustment": "Ajouter 5 min en Z3",
      "focusPoints": ["Maintenir Z2", "Explorer Z3"]
    },
    "longTerm": {
      "goalAlignment": "Sur la bonne voie pour ton objectif",
      "milestoneProgress": "20% du chemin parcouru",
      "strategicAdvice": "Continue à construire ta base aérobie pendant 4 semaines"
    }
  },
  "achievements": [
    {
      "type": "duration",
      "title": "Endurance développée",
      "description": "60 minutes en Z2",
      "earned": true
    }
  ],
  "coachRationale": "J'ai analysé ta séance d'endurance..."
}

IMPORTANT:
- Sois précis sur les zones cardiaques et la durée
- Adapte les insights au type d'endurance (course, vélo, natation)
- Utilise un ton encourageant et pédagogue`;
  }

  // Force (par défaut)
  return commonIntro + `
# Type de Training
FORCE (Musculation, Powerlifting, Bodybuilding, Strongman)

# Principes d'Analyse pour la Force

## Performance Globale
- Évalue la qualité d'exécution (volume, intensité, technique)
- Compare avec les objectifs prescrits
- Identifie les forces et faiblesses

## Analyse par Exercice
- Performance individuelle de chaque exercice
- RPE vs RPE cible
- Volume réalisé vs volume prescrit
- Qualité technique

## Métriques Clés Force
- **Volume Load**: Sets × Reps × Charge
- **RPE**: Intensité ressentie par série
- **Technique**: Qualité d'exécution
- **1RM estimé**: Calcul de la force maximale

## Insights Personnalisés
- Forces démontrées durant la séance
- Points d'amélioration spécifiques
- Messages motivationnels adaptés au niveau

## Recommandations Progression
- Ajustements pour la prochaine séance
- Conseils stratégiques long terme
- Alignement avec objectifs globaux

# Format JSON OBLIGATOIRE

Retourne un JSON COMPLET avec cette structure EXACTE:
{
  "sessionAnalysis": {
    "overallPerformance": {
      "score": 85,
      "rating": "good",
      "summary": "Excellente séance avec une intensité bien maîtrisée..."
    },
    "volumeAnalysis": {
      "totalVolume": 12500,
      "volumeEfficiency": 92,
      "comparedToTarget": "Légèrement au-dessus du volume cible (+5%)"
    },
    "intensityAnalysis": {
      "avgRPE": 7.5,
      "rpeDistribution": {"7": 40, "8": 40, "9": 20},
      "intensityZones": "Majorité en zone de progression optimale (RPE 7-8)"
    },
    "techniqueAnalysis": {
      "avgTechniqueScore": 8.5,
      "exercisesWithIssues": ["Squat arrière"],
      "recommendations": ["Travailler la profondeur du squat", "Renforcer la stabilité du tronc"]
    }
  },
  "exerciseBreakdown": [
    {
      "exerciseId": "ex-1",
      "exerciseName": "Squat arrière",
      "performance": {
        "completed": true,
        "volumeScore": 90,
        "rpeScore": 85,
        "techniqueScore": 75
      },
      "insights": ["Bonne gestion de la fatigue", "Technique à peaufiner sur dernière série"],
      "nextSessionRecommendations": ["Ajouter 2.5kg", "Focus sur la descente contrôlée"]
    }
  ],
  "personalizedInsights": {
    "strengths": ["Excellente gestion de l'intensité", "Progression constante sur les composés"],
    "areasToImprove": ["Technique sous fatigue", "Récupération entre séries"],
    "keyTakeaways": ["Ta progression est sur la bonne voie", "Continue à prioriser la technique"],
    "motivationalMessage": "Excellente séance ! Tu montres une progression constante..."
  },
  "progressionRecommendations": {
    "nextSession": {
      "volumeAdjustment": "Conserver le volume actuel",
      "intensityAdjustment": "Augmenter de 2.5kg sur les composés majeurs",
      "focusPoints": ["Technique sous fatigue", "Respiration"]
    },
    "longTerm": {
      "goalAlignment": "Tu es sur la bonne trajectoire pour atteindre +10kg en 8 semaines",
      "milestoneProgress": "50% du chemin vers ton objectif de force",
      "strategicAdvice": "Intègre plus de travail technique les 2 prochaines semaines"
    }
  },
  "achievements": [
    {
      "type": "consistency",
      "title": "Régularité exemplaire",
      "description": "3 séances complétées cette semaine",
      "earned": true
    }
  ],
  "coachRationale": "J'ai analysé ta séance et identifié..."
}

IMPORTANT:
- Sois précis et basé sur les données réelles de la séance
- Les insights doivent être actionnables et motivants
- Utilise un ton encourageant mais honnête`;
  }

  if (coachType === 'functional') {
    return commonIntro + `
# Type de Training
FUNCTIONAL FITNESS (CrossTraining, WOD, HIIT Fonctionnel)

# Principes d'Analyse pour le Fonctionnel

## Performance Globale
- Évalue les rounds complétés pour AMRAP ou le temps pour ForTime
- Compare avec le time cap et les benchmarks
- Analyse la stratégie de pacing et transitions

## Analyse WOD
- Format: AMRAP, ForTime, EMOM, Tabata, Chipper, Ladder
- Rounds complétés et reps additionnelles
- Temps total vs time cap
- Respect du scaling (RX, Scaled, Foundations)

## Métriques Clés Fonctionnelles
- **Rounds/Time**: Métrique principale selon format
- **Reps totales**: Volume de travail effectué
- **Transitions**: Efficacité entre mouvements
- **Pacing**: Stratégie de rythme (fast start, steady, negative split)
- **RPE moyen**: Perception d'effort globale

## Insights Personnalisés
- Stratégie de pacing (trop rapide au début, steady, finishing strong)
- Efficacité des transitions entre mouvements
- Gestion de la fatigue métabolique
- Sélection du scaling approprié

## Recommandations Progression
- Ajustements time cap ou target rounds
- Progression vers niveau supérieur (Scaled → RX)
- Mouvements à travailler en isolation
- Stratégies de pacing pour prochaine tentative

# Format JSON OBLIGATOIRE

Retourne un JSON COMPLET avec cette structure EXACTE:
{
  "sessionAnalysis": {
    "overallPerformance": {
      "score": 82,
      "rating": "good",
      "summary": "Solide performance sur ce WOD AMRAP 20min..."
    },
    "volumeAnalysis": {
      "totalVolume": 285,
      "volumeEfficiency": 88,
      "comparedToTarget": "6 rounds + 15 reps, excellent pour ce benchmark"
    },
    "intensityAnalysis": {
      "avgRPE": 8.5,
      "rpeDistribution": {"8": 30, "9": 50, "10": 20},
      "intensityZones": "Haute intensité métabolique maintenue"
    },
    "techniqueAnalysis": {
      "avgTechniqueScore": 7.5,
      "exercisesWithIssues": ["Pull-ups sous fatigue"],
      "recommendations": ["Travailler le kipping strict", "Gérer la fatigue des grip"]
    }
  },
  "exerciseBreakdown": [
    {
      "exerciseId": "wod-movement-1",
      "exerciseName": "Pull-ups",
      "performance": {
        "completed": true,
        "volumeScore": 85,
        "rpeScore": 90,
        "techniqueScore": 75
      },
      "insights": ["Bon rythme sur les 3 premiers rounds", "Fatigue visible rounds 4-5"],
      "nextSessionRecommendations": ["Travailler l'endurance de grip", "Kipping plus économique"]
    }
  ],
  "personalizedInsights": {
    "strengths": ["Excellent pacing sur première moitié", "Transitions efficaces push-ups → sit-ups"],
    "areasToImprove": ["Fatigue prématurée sur pull-ups", "Ralentissement rounds 5-6"],
    "keyTakeaways": ["Ta stratégie de pacing s'améliore", "Les transitions sont un atout majeur"],
    "motivationalMessage": "Super WOD ! Ta gestion du rythme s'améliore séance après séance..."
  },
  "progressionRecommendations": {
    "nextSession": {
      "volumeAdjustment": "Viser 7 rounds si tu retentes ce WOD",
      "intensityAdjustment": "Conserver le scaling actuel, se concentrer sur la vitesse",
      "focusPoints": ["Transitions rapides", "Grip endurance", "Pacing plus agressif rounds 1-3"]
    },
    "longTerm": {
      "goalAlignment": "Progression solide vers RX",
      "milestoneProgress": "Prêt pour tester RX sur WODs plus courts",
      "strategicAdvice": "Intégrer du travail de grip strength 2x/semaine"
    }
  },
  "achievements": [
    {
      "type": "benchmark",
      "title": "PR sur Cindy",
      "description": "Nouveau record personnel: 21 rounds + 8",
      "earned": true
    }
  ],
  "coachRationale": "J'ai analysé ton WOD en détail..."
}

IMPORTANT:
- Analyse spécifique au format WOD (AMRAP, ForTime, etc.)
- Focus sur pacing, transitions et stratégie
- Insights actionnables pour prochain WOD`;
  }

  if (coachType === 'calisthenics') {
    return commonIntro + `
# Type de Training
CALISTHENICS (Poids du corps, Street Workout, Gymnastique)

# Principes d'Analyse pour Calisthenics

## Performance Globale
- Évalue la maîtrise technique des mouvements
- Progression sur skills (muscle-up, handstand, levers)
- Volume et intensité au poids du corps

## Analyse par Exercice
- Forme et contrôle technique
- Progression vers mouvements avancés
- Volume de reps et hold time pour isométriques

## Métriques Clés Calisthenics
- **Control**: Qualité du mouvement et tempo
- **Range of Motion**: Amplitude complète
- **Hold Time**: Pour mouvements isométriques
- **Reps Quality**: Reps propres vs compensations
- **Skill Progression**: Étapes vers moves avancés

## Insights Personnalisés
- Qualité technique sous fatigue
- Progression sur skills (straddle, tuck, full)
- Équilibre push/pull/legs/core
- Prérequis pour moves avancés

## Recommandations Progression
- Progressions pour skills ciblés
- Volume optimal pour force
- Travail technique vs volume
- Déséquilibres musculaires à corriger

# Format JSON OBLIGATOIRE

Retourne un JSON COMPLET avec structure standard (voir Force)

IMPORTANT:
- Focus sur la qualité technique avant le volume
- Identifier les progressions accessibles
- Équilibre des patterns de mouvement`;
  }

  // Fallback pour mixed ou autres types
  return commonIntro + `
# Type de Training
MIXTE ou GÉNÉRAL

# Analyse
Analyse générale basée sur les données disponibles avec focus sur:
- Performance globale et complétion
- Volume et intensité
- Insights personnalisés
- Recommandations de progression

Retourne un JSON COMPLET avec la structure standard.`;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CoachAnalyzerRequest {
  userId: string;
  sessionPrescription: any;
  sessionFeedback: any;
  preparerContext: any;
  previousResponseId?: string;
}

interface CoachAnalyzerResponse {
  success: boolean;
  data?: {
    sessionAnalysis: {
      overallPerformance: {
        score: number;
        rating: 'excellent' | 'good' | 'average' | 'needs-improvement';
        summary: string;
      };
      volumeAnalysis: {
        totalVolume: number;
        volumeEfficiency: number;
        comparedToTarget: string;
      };
      intensityAnalysis: {
        avgRPE: number;
        rpeDistribution: Record<string, number>;
        intensityZones: string;
      };
      techniqueAnalysis: {
        avgTechniqueScore: number;
        exercisesWithIssues: string[];
        recommendations: string[];
      };
    };
    exerciseBreakdown: Array<{
      exerciseId: string;
      exerciseName: string;
      performance: {
        completed: boolean;
        volumeScore: number;
        rpeScore: number;
        techniqueScore: number;
      };
      insights: string[];
      nextSessionRecommendations: string[];
    }>;
    personalizedInsights: {
      strengths: string[];
      areasToImprove: string[];
      keyTakeaways: string[];
      motivationalMessage: string;
    };
    progressionRecommendations: {
      nextSession: {
        volumeAdjustment: string;
        intensityAdjustment: string;
        focusPoints: string[];
      };
      longTerm: {
        goalAlignment: string;
        milestoneProgress: string;
        strategicAdvice: string;
      };
    };
    achievements: Array<{
      type: string;
      title: string;
      description: string;
      earned: boolean;
    }>;
    coachRationale: string;
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
    responseId?: string;
    cached: boolean;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[COACH-ANALYZER] Function started", { timestamp: new Date().toISOString() });

  try {
    // Parse request
    const { userId, sessionPrescription, sessionFeedback, preparerContext, previousResponseId }: CoachAnalyzerRequest = await req.json();
    console.log("[COACH-ANALYZER] Request parsed", {
      userId,
      hasSessionPrescription: !!sessionPrescription,
      hasSessionFeedback: !!sessionFeedback,
      hasPreparerContext: !!preparerContext,
      trainingType: sessionPrescription?.type,
      category: sessionPrescription?.category,
      exercisesCount: sessionPrescription?.exercises?.length,
      hasPreviousResponseId: !!previousResponseId
    });

    if (!userId || !sessionPrescription || !sessionFeedback) {
      console.log("[COACH-ANALYZER] Missing required fields - returning 400");
      return new Response(
        JSON.stringify({
          success: false,
          error: "userId, sessionPrescription, and sessionFeedback are required"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("[COACH-ANALYZER] Supabase client initialized");

    // 1. Check cache
    console.log("[COACH-ANALYZER] Checking cache...");
    const cacheKey = `coach-analyzer:${userId}:${sessionPrescription.sessionId || 'no-id'}`;
    const { data: cachedData, error: cacheError } = await supabase
      .from("training_ai_cache")
      .select("cached_data")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cachedData && !cacheError) {
      const analysis = cachedData.cached_data;
      const isValid = analysis &&
        analysis.sessionAnalysis &&
        analysis.personalizedInsights;

      if (isValid) {
        console.log("[COACH-ANALYZER] Cache HIT - returning VALID cached analysis", {
          latencyMs: Date.now() - startTime
        });
        const latencyMs = Date.now() - startTime;
        return new Response(
          JSON.stringify({
            success: true,
            data: analysis,
            metadata: {
              agentType: "coach-analyzer",
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
        console.warn("[COACH-ANALYZER] Cache HIT but INVALID structure - deleting cache");
        await supabase
          .from("training_ai_cache")
          .delete()
          .eq("cache_key", cacheKey);
        console.log("[COACH-ANALYZER] Invalid cache deleted - proceeding to fresh generation");
      }
    }
    console.log("[COACH-ANALYZER] Cache MISS - calling OpenAI");

    // 2. Call OpenAI Responses API with GPT-5-mini
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("[COACH-ANALYZER] OPENAI_API_KEY not configured");
      throw new Error("OPENAI_API_KEY not configured");
    }
    console.log("[COACH-ANALYZER] OpenAI API key found");

    // Detect coach type automatically
    const coachType = detectCoachType(sessionPrescription);
    console.log("[COACH-ANALYZER] Coach type detected", {
      coachType,
      type: sessionPrescription.type,
      category: sessionPrescription.category,
      discipline: sessionPrescription.discipline,
      hasMainWorkout: !!sessionPrescription.mainWorkout,
      hasExercises: !!sessionPrescription.exercises
    });

    // Build dynamic prompt based on coach type
    const systemPrompt = buildSystemPrompt(coachType);

    // Extract user feedback text if present
    const userFeedbackText = sessionFeedback.userFeedbackText || null;

    const userPrompt = `# Prescription de Séance

${JSON.stringify(sessionPrescription, null, 2)}

# Feedback de Séance

${JSON.stringify(sessionFeedback, null, 2)}

# Contexte de Préparation

${JSON.stringify(preparerContext, null, 2)}

${userFeedbackText ? `# Retour Utilisateur Post-Séance

L'utilisateur a partagé son ressenti après la séance:

"${userFeedbackText}"

**IMPORTANT**: Prends en compte ce feedback dans ton analyse. Si l'utilisateur mentionne des douleurs, de la fatigue excessive, ou des difficultés, ajuste tes recommandations en conséquence. Si le feedback est positif, renforce les aspects qui ont fonctionné.

` : ''}# Instructions

Analyse cette séance d'entraînement complétée et génère une analyse ultra-personnalisée.

**Contraintes**:
- Utilise les données réelles du feedback (RPE, volume, technique)
- Compare avec la prescription initiale
- Identifie patterns et tendances
- Sois spécifique et actionnable
${userFeedbackText ? '- Intègre le retour utilisateur dans ton analyse et tes recommandations' : ''}

**Objectifs**:
- Valoriser les points forts démontrés
- Identifier précisément les axes d'amélioration
- Proposer des ajustements concrets pour la prochaine séance
- Motiver et encourager la progression
${userFeedbackText ? '- Répondre aux préoccupations ou observations de l\'utilisateur' : ''}

Génère l'analyse complète en JSON.`;

    const requestBody: any = {
      model: "gpt-5-mini",
      input: [
        { type: "message", role: "system", content: systemPrompt },
        { type: "message", role: "user", content: userPrompt }
      ],
      reasoning: { effort: "medium" },
      text: {
        verbosity: "medium",
        format: {
          type: "json_schema",
          name: "session_analysis",
          strict: false,
          schema: {
            type: "object",
            properties: {
              sessionAnalysis: {
                type: "object",
                properties: {
                  overallPerformance: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      rating: { type: "string", enum: ["excellent", "good", "average", "needs-improvement"] },
                      summary: { type: "string" }
                    },
                    required: ["score", "rating", "summary"]
                  },
                  volumeAnalysis: {
                    type: "object",
                    properties: {
                      totalVolume: { type: "number" },
                      volumeEfficiency: { type: "number" },
                      comparedToTarget: { type: "string" }
                    },
                    required: ["totalVolume", "volumeEfficiency", "comparedToTarget"]
                  },
                  intensityAnalysis: {
                    type: "object",
                    properties: {
                      avgRPE: { type: "number" },
                      rpeDistribution: { type: "object" },
                      intensityZones: { type: "string" }
                    },
                    required: ["avgRPE", "rpeDistribution", "intensityZones"]
                  },
                  techniqueAnalysis: {
                    type: "object",
                    properties: {
                      avgTechniqueScore: { type: "number" },
                      exercisesWithIssues: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } }
                    },
                    required: ["avgTechniqueScore", "exercisesWithIssues", "recommendations"]
                  }
                },
                required: ["overallPerformance", "volumeAnalysis", "intensityAnalysis", "techniqueAnalysis"]
              },
              exerciseBreakdown: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    exerciseId: { type: "string" },
                    exerciseName: { type: "string" },
                    performance: {
                      type: "object",
                      properties: {
                        completed: { type: "boolean" },
                        volumeScore: { type: "number" },
                        rpeScore: { type: "number" },
                        techniqueScore: { type: "number" }
                      },
                      required: ["completed", "volumeScore", "rpeScore", "techniqueScore"]
                    },
                    insights: { type: "array", items: { type: "string" } },
                    nextSessionRecommendations: { type: "array", items: { type: "string" } }
                  },
                  required: ["exerciseId", "exerciseName", "performance", "insights", "nextSessionRecommendations"]
                }
              },
              personalizedInsights: {
                type: "object",
                properties: {
                  strengths: { type: "array", items: { type: "string" } },
                  areasToImprove: { type: "array", items: { type: "string" } },
                  keyTakeaways: { type: "array", items: { type: "string" } },
                  motivationalMessage: { type: "string" }
                },
                required: ["strengths", "areasToImprove", "keyTakeaways", "motivationalMessage"]
              },
              progressionRecommendations: {
                type: "object",
                properties: {
                  nextSession: {
                    type: "object",
                    properties: {
                      volumeAdjustment: { type: "string" },
                      intensityAdjustment: { type: "string" },
                      focusPoints: { type: "array", items: { type: "string" } }
                    },
                    required: ["volumeAdjustment", "intensityAdjustment", "focusPoints"]
                  },
                  longTerm: {
                    type: "object",
                    properties: {
                      goalAlignment: { type: "string" },
                      milestoneProgress: { type: "string" },
                      strategicAdvice: { type: "string" }
                    },
                    required: ["goalAlignment", "milestoneProgress", "strategicAdvice"]
                  }
                },
                required: ["nextSession", "longTerm"]
              },
              achievements: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    earned: { type: "boolean" }
                  },
                  required: ["type", "title", "description", "earned"]
                }
              },
              coachRationale: { type: "string" }
            },
            required: ["sessionAnalysis", "exerciseBreakdown", "personalizedInsights", "progressionRecommendations", "achievements", "coachRationale"],
            additionalProperties: false
          }
        }
      },
      max_output_tokens: 8000
    };

    // Add previous_response_id if available
    if (previousResponseId) {
      requestBody.previous_response_id = previousResponseId;
      console.log("[COACH-ANALYZER] Using previous response ID for reasoning reuse", { previousResponseId });
    }

    console.log("[COACH-ANALYZER] Calling OpenAI API...");
    const openaiStartTime = Date.now();

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("[COACH-ANALYZER] OpenAI response received", {
      status: openaiResponse.status,
      ok: openaiResponse.ok,
      latencyMs: Date.now() - openaiStartTime
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("[COACH-ANALYZER] OpenAI API error:", {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        errorData
      });
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorData}`);
    }

    const openaiData = await openaiResponse.json();

    // Extract response data
    console.log("[COACH-ANALYZER] Extracting analysis data...");
    let outputText: string | null = null;

    // Find message item with output_text
    if (openaiData.output && Array.isArray(openaiData.output)) {
      const messageItem = openaiData.output.find((item: any) =>
        item.type === 'message' &&
        item.content &&
        Array.isArray(item.content) &&
        item.content.length > 0
      );

      if (messageItem) {
        const textContent = messageItem.content.find((c: any) =>
          (c.type === 'text' || c.type === 'output_text') && c.text
        );
        if (textContent && textContent.text) {
          outputText = textContent.text;
          console.log("[COACH-ANALYZER] Extracted text from message.content", {
            textLength: outputText.length
          });
        }
      }
    }

    if (!outputText || outputText.trim() === "") {
      console.error("[COACH-ANALYZER] No valid output text found");
      throw new Error("OpenAI response contains no valid output text");
    }

    // Parse JSON
    console.log("[COACH-ANALYZER] Parsing analysis JSON...");
    let analysisData: any;
    try {
      analysisData = JSON.parse(outputText);
      console.log("[COACH-ANALYZER] JSON parsed successfully", {
        hasSessionAnalysis: !!analysisData.sessionAnalysis,
        hasExerciseBreakdown: !!analysisData.exerciseBreakdown,
        hasPersonalizedInsights: !!analysisData.personalizedInsights
      });
    } catch (parseError) {
      console.error("[COACH-ANALYZER] JSON parsing error", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawTextPreview: outputText.substring(0, 300)
      });
      throw new Error(`Failed to parse analysis JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    const tokensUsed = openaiData.usage?.total_tokens || 0;
    const costUsd = calculateCost(tokensUsed, "gpt-5-mini");
    const latencyMs = Date.now() - startTime;
    const responseId = openaiData.id || null;

    console.log("[COACH-ANALYZER] Metrics calculated", {
      tokensUsed,
      costUsd,
      latencyMs,
      responseId
    });

    // 3. Cache the result
    console.log("[COACH-ANALYZER] Caching result...");
    const expiresAt = new Date(Date.now() + 1800 * 1000); // 30 minutes
    const cacheEntry = {
      cache_key: cacheKey,
      user_id: userId,
      cache_type: "analysis",
      cached_data: analysisData,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    };

    console.log("[COACH-ANALYZER] Preparing to insert cache entry", {
      cache_key: cacheKey,
      user_id: userId,
      cache_type: cacheEntry.cache_type,
      expires_at: cacheEntry.expires_at,
      dataSize: JSON.stringify(analysisData).length
    });

    const { error: cacheInsertError } = await supabase
      .from("training_ai_cache")
      .upsert(cacheEntry, { onConflict: "cache_key" });

    if (cacheInsertError) {
      console.error("[COACH-ANALYZER] Failed to cache result:", {
        code: cacheInsertError.code,
        message: cacheInsertError.message,
        details: cacheInsertError.details,
        hint: cacheInsertError.hint
      });
    } else {
      console.log("[COACH-ANALYZER] Result cached successfully", {
        cache_key: cacheKey,
        expires_at: expiresAt.toISOString()
      });
    }

    // 4. Persist generation record
    console.log("[COACH-ANALYZER] Persisting generation record...");
    const generationId = crypto.randomUUID();
    const generationRecord = {
      user_id: userId,
      generation_id: generationId,
      agent_type: "coach-analyzer",
      agent_version: "1.0.0",
      input_context: { sessionPrescription, sessionFeedback, preparerContext },
      output_prescription: analysisData,
      model_used: "gpt-5-mini",
      reasoning_effort: "medium",
      verbosity: "medium",
      tokens_used: tokensUsed,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      response_id: responseId,
      cached: false,
      success: true
    };

    console.log("[COACH-ANALYZER] Preparing to insert generation record", {
      generation_id: generationId,
      user_id: userId,
      agent_type: generationRecord.agent_type,
      model_used: generationRecord.model_used,
      tokens_used: tokensUsed,
      cost_usd: costUsd,
      latency_ms: latencyMs
    });

    const { error: generationInsertError } = await supabase
      .from("training_ai_generations")
      .insert(generationRecord);

    if (generationInsertError) {
      console.error("[COACH-ANALYZER] Failed to persist generation:", {
        code: generationInsertError.code,
        message: generationInsertError.message,
        details: generationInsertError.details,
        hint: generationInsertError.hint
      });
    } else {
      console.log("[COACH-ANALYZER] Generation record persisted successfully", {
        generation_id: generationId,
        agent_type: "coach-analyzer"
      });
    }

    // 5. Return response
    const response: CoachAnalyzerResponse = {
      success: true,
      data: analysisData,
      metadata: {
        agentType: "coach-analyzer",
        modelUsed: "gpt-5-mini",
        reasoningEffort: "medium",
        verbosity: "medium",
        tokensUsed,
        costUsd,
        latencyMs,
        responseId,
        cached: false
      }
    };

    console.log("[COACH-ANALYZER] Returning final response", {
      success: true,
      totalLatencyMs: Date.now() - startTime,
      hasSessionAnalysis: !!analysisData.sessionAnalysis,
      hasExerciseBreakdown: !!analysisData.exerciseBreakdown,
      exerciseBreakdownCount: analysisData.exerciseBreakdown?.length || 0,
      hasPersonalizedInsights: !!analysisData.personalizedInsights,
      hasProgressionRecommendations: !!analysisData.progressionRecommendations,
      achievementsCount: analysisData.achievements?.length || 0
    });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[COACH-ANALYZER] Fatal error:", error);
    console.error("[COACH-ANALYZER] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    const latencyMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          agentType: "coach-analyzer",
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
 * Calculate estimated cost for GPT-5-mini
 * Pricing: $0.10 per 1M input tokens, $0.30 per 1M output tokens
 */
function calculateCost(totalTokens: number, model: string): number {
  if (model === "gpt-5-mini") {
    const inputTokens = totalTokens * 0.6;
    const outputTokens = totalTokens * 0.4;
    return (inputTokens * 0.10 / 1000000) + (outputTokens * 0.30 / 1000000);
  }
  return 0;
}

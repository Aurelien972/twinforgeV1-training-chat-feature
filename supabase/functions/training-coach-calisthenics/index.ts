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

    const systemPrompt = `Tu es un coach IA expert en Calisthenics & Street Workout avec une expertise approfondie en poids du corps, skills avancés et freestyle.

# RÈGLE FONDAMENTALE - CATALOGUE D'EXERCICES

**SI un catalogue d'exercices est fourni dans le contexte utilisateur**:
- TU DOIS UTILISER UNIQUEMENT les exercices du catalogue
- NE GÉNÈRE PAS de nouveaux noms d'exercices
- SÉLECTIONNE les exercices selon: niveau de compétence, progressions, objectifs de skills
- UTILISE les progressions (tuck → straddle → full) et régressions fournies dans le catalogue
- RESPECTE les métadonnées: difficulté, hold time, prérequis, notes de sécurité

**SI aucun catalogue n'est fourni**:
- Génère des exercices selon tes connaissances standards

# Spécialisation

## Disciplines Couvertes
- **Calisthenics**: Maîtrise du poids du corps, développement de force relative
- **Street Workout**: Entraînement aux barres, structures urbaines, créativité
- **Streetlifting**: Force maximale au poids du corps (tractions lestées, dips lestés)
- **Freestyle**: Figures acrobatiques, dynamisme, combos créatifs

## Philosophie d'Entraînement
- Force relative > Force absolue (ratio force/poids optimal)
- Progressions graduées (chaque mouvement a ses étapes)
- Qualité technique avant quantité
- Équilibre poussée/traction/core
- Créativité et expression personnelle

# Système de Progressions

## Niveaux de Skills
- **Beginner**: Fondations (push-ups, squats, rows)
- **Novice**: Variations basiques (diamond push-ups, pistol progressions)
- **Intermediate**: Skills intermédiaires (pull-ups stricts, L-sit)
- **Advanced**: Skills avancés (muscle-up, front lever tuck, handstand push-up)
- **Elite**: Skills élite (one arm pull-up, planche, human flag)
- **Master**: Combinaisons et freestyle (360 pull-up, hefesto)

## Progressions par Mouvement

**PULL-UPS (Tractions)**:
1. Negative pull-ups → 2. Band-assisted → 3. Regular pull-ups → 4. Archer pull-ups → 5. Typewriter pull-ups → 6. One-arm assisted → 7. One-arm pull-up

**PUSH-UPS (Pompes)**:
1. Incline push-ups → 2. Regular → 3. Diamond → 4. Archer → 5. Pseudo planche → 6. One-arm assisted → 7. One-arm push-up

**DIPS**:
1. Bench dips → 2. Parallel bar dips → 3. Ring dips → 4. Weighted dips → 5. Korean dips → 6. Impossible dips

**MUSCLE-UP**:
1. Pull-ups + dips mastery → 2. High pull-ups → 3. Explosive pull-ups → 4. Bar muscle-up négatives → 5. Band-assisted → 6. Strict muscle-up → 7. Ring muscle-up

**HANDSTAND**:
1. Wall handstand hold → 2. Chest-to-wall → 3. Back-to-wall → 4. Freestanding hold → 5. Handstand walk → 6. One-arm progressions

**FRONT LEVER**:
1. Tuck → 2. Advanced tuck → 3. One leg extended → 4. Straddle → 5. Full front lever → 6. Front lever pull-ups

**PLANCHE**:
1. Frog stand → 2. Tuck planche → 3. Advanced tuck → 4. Straddle → 5. Full planche → 6. Planche push-ups

**L-SIT**:
1. L-sit tucked → 2. One leg extended → 3. Full L-sit → 4. V-sit → 5. Manna progressions

# Principes de Programmation

## Volume et Fréquence
- **Beginner**: 3-4x/semaine, 3-5 exercices, 3-4 sets, 60-90s repos
- **Intermediate**: 4-5x/semaine, 4-6 exercices, 4-6 sets, 90-120s repos
- **Advanced**: 5-6x/semaine, 5-8 exercices, 5-8 sets, 120-180s repos (skills), split possible

## Structure de Session
1. **Mobilité dynamique** (5-8min): Poignets, épaules, hanches, colonne
2. **Skills work** (10-20min): Travail technique à frais (handstand, levers, planche)
3. **Strength work** (20-30min): Force maximale (tractions lestées, dips lestés, variantes difficiles)
4. **Volume/Hypertrophy** (10-20min): Volume modéré (push-ups, rows, core)
5. **Conditioning** (optionnel, 5-10min): Burpees, sprints, combos dynamiques
6. **Stretching/Cooldown** (5-10min): Étirements passifs, mobilité

## Techniques d'Intensification
- **Pauses**: Pause 2-3s en position difficile (top pull-up, bottom dip)
- **Tempo**: Phases excentriques lentes (5-0-1-0)
- **Isométrie**: Holds statiques (L-sit 20-30s, front lever tuck 10-15s)
- **Plyométrie**: Clap push-ups, explosive pull-ups, box jumps
- **Weighted**: Gilet lesté, ceinture à dips (5-20kg selon niveau)
- **Drop sets**: Muscle-up → pull-ups → rows
- **Supersets**: Push/pull (push-ups + pull-ups), antagonistes
- **EMOM/AMRAP**: Every Minute On Minute, As Many Rounds As Possible

## Équilibre Musculaire CRITIQUE
- Ratio PULL:PUSH = 2:1 (double volume traction vs poussée pour santé épaules)
- Toujours inclure travail scapulaire (scapula pull-ups, shrugs, protractions)
- Core work chaque session (L-sit, hollow body, dragon flags)
- Équilibre vertical/horizontal (handstand + front lever)

# INTELLIGENCE RÉCUPÉRATION (CRITIQUE)

Analyser "recoveryAnalysis" du userContext AVANT génération.

## 1. Dernière Séance
**SI < 2j ET calisthenics**: NE PAS générer skills lourds, focus volume léger
**Ex**: Muscle-up hier → Pull-ups variations légères + push aujourd'hui

## 2. Récupération par Type
**Skills statiques** (levers, planche, handstand): Min 48-72h repos
**Tractions lestées**: Min 48h repos
**Push dynamique**: Min 24-48h repos
**Core/abs**: Possible tous les jours si léger

## 3. Signes de Surentraînement
**SI ≥ 3 sessions skills lourds derniers 5j**: ALERTE, session légère obligatoire
**SI fatigue épaules/coudes**: Éviter skills, focus jambes et core

## 4. Algorithme Récupération
1. Identifier derniers mouvements (pull, push, skills, legs)
2. Éliminer catégories "fatigued" (< 48h)
3. Prioriser catégories "recovered" (> 72h)
4. Si tout fatigué → mobilité + stretching + core léger

# ADAPTATION LIEU (ULTRA-IMPORTANT)

## Outdoor (Contexte Optimal Calisthenics)
**Priorité**: Barres publiques, structures urbaines, éléments naturels
**Équipements**:
- Barres de traction (pull-ups, muscle-ups, front lever, L-sit)
- Barres parallèles (dips, L-sit, handstand, swing tricks)
- Bancs publics (box jumps, step-ups, dips, bulgarian splits)
- Escaliers (sprints, walking lunges, box jumps progressifs)
- Murs/murets (wall runs, handstand, wall sits, decline push-ups)
- Sol/herbe (push-ups, core work, crawling, sprints)
- Barres basses (rows, front lever progressions)

**Exercices signature outdoor**:
- Muscle-ups (barre fixe)
- Human flag (poteau/lampadaire)
- Handstand sur herbe
- Box jumps (bancs/murets 40-80cm)
- Sprints collines/escaliers
- Front lever / back lever (barres)
- Freestyle combos (360 pull-up, kip variations)

## Home (Minimaliste & Créatif)
**Priorité**: Poids du corps pur, mobilier solide, équipement minimal
**Équipements**:
- Barre de traction murale/porte (pull-ups, hanging leg raises)
- Chaises solides (dips, step-ups, bulgarian splits, L-sit practice)
- Table robuste (rows inversés, decline push-ups, box jumps)
- Mur (handstand, wall sits, pike push-ups progressions)
- Sol (push-ups infinies variations, core work, mobilité)
- Anneaux de gymnastique SI disponibles (ultimate tool)
- Parallettes SI disponibles (L-sit, handstand, planche work)

**Exercices signature home**:
- Pike push-ups (progressions handstand)
- Table rows (horizontal pull)
- Chair dips (triceps/chest)
- Floor L-sit (core/compression)
- Wall handstand holds (shoulders/balance)
- Push-up variations (archer, pseudo-planche, diamond)

## Gym (Optionnel, Équipement Avancé)
**Priorité**: Anneaux, barres, machines d'assistance si disponibles
**Équipements spécifiques**:
- Gymnastic rings (muscle-ups, dips, rows, front lever)
- Assisted pull-up machine (progressions)
- Dip station parallèles (dips, L-sit)
- Lat pulldown (assistance progressions pull-ups)
- Cable machines (variations angles pull/push)
- Box pliométrie (box jumps, step-ups)

# FORMATS EXERCICES (SPÉCIFIQUE CALISTHENICS)

**RÈGLE**: reps (nombre) OU repsProgression (array) OU holdTime (secondes pour statiques), JAMAIS plusieurs.

**reps** (dynamiques classiques):
Ex: {"name": "Pull-ups", "sets": 5, "reps": 8, "tempo": "2-0-1-0", "rest": 120}

**repsProgression** (pyramides):
Ex: {"name": "Diamond push-ups", "sets": 4, "repsProgression": [15,12,10,8], "rest": 90}

**holdTime** (isométriques/skills statiques):
Ex: {"name": "L-sit tucked", "sets": 4, "holdTime": 20, "rest": 120}

**load** (optionnel pour lestés):
Ex: {"name": "Weighted pull-ups", "sets": 5, "reps": 5, "load": 10, "rest": 180}

❌ ERREUR: Sans reps/holdTime OU plusieurs à la fois

# SUBSTITUTIONS INTELLIGENTES

**TOUJOURS** fournir 2-3 alternatives adaptées équipement/niveau:

**Pull-ups**:
- Easier: Band-assisted pull-ups, negative pull-ups, rows inversés
- Harder: Archer pull-ups, weighted pull-ups, L-sit pull-ups

**Dips**:
- Easier: Bench dips, incline push-ups, wall dips
- Harder: Ring dips, weighted dips, Korean dips

**Muscle-up**:
- Easier: High pull-ups, explosive pull-ups, band-assisted muscle-up
- Harder: Strict muscle-up, ring muscle-up, muscle-up to handstand

**Handstand push-up**:
- Easier: Pike push-ups, wall-assisted HSPU, box pike push-ups
- Harder: Freestanding HSPU, deficit HSPU, one-arm assisted

# sessionName - Titre Motivant

Le **sessionName** doit être inspirant et descriptif (max 40 caractères).

**Exemples selon focus**:
- "Skills Day: Muscle-up & Levers"
- "Power Pull-ups & Dynamic Push"
- "Handstand Mastery Flow"
- "Weighted Calisthenics Strength"
- "Street Workout Freestyle"
- "Core & Static Holds"
- "Full Body Bodyweight Blast"
- "Advanced Skills Training"

**Doit**:
- Refléter les skills/mouvements principaux
- Indiquer l'intensité (Skills, Power, Strength, Flow)
- Être motivant et clair
- Max 40 caractères mobile

# sessionSummary - Résumé Narratif

Le **sessionSummary** résume en 1-2 phrases (100-150 caractères):
- Objectif principal
- Skills/zones ciblés
- Approche utilisée

**Exemples**:
- "Session skills avancés muscle-up et front lever avec travail technique. Focus qualité et progressions."
- "Strength maximale tractions et dips lestés pour développer force pure. Volume modéré RPE 8."
- "Freestyle dynamique avec combos créatifs aux barres. Explosivité et fluidité."

# GROUPES MUSCULAIRES CIBLÉS (OBLIGATOIRE)

**muscleGroups** (OBLIGATOIRE): Array de 1-3 groupes musculaires ciblés en français pour CHAQUE exercice
- Exemples: "Dorsaux", "Pectoraux", "Deltoïdes", "Biceps", "Triceps", "Abdominaux", "Quadriceps", "Fessiers", "Trapèzes", "Obliques", "Érecteurs du rachis"
- Ex: Pull-ups → ["Dorsaux", "Biceps"] | Push-ups → ["Pectoraux", "Triceps"] | L-sit → ["Abdominaux", "Hip flexors"]

**equipment** (OBLIGATOIRE): Équipement principal utilisé (string, en français)
- Exemples: "Barre de traction", "Barres parallèles", "Poids du corps", "Anneaux", "Parallettes", "Élastiques", "Gilet lesté", "Ceinture à dips"

# Format JSON OBLIGATOIRE

RETOURNE UN JSON DÉTAILLÉ avec cette structure EXACTE:
{
  "sessionId": "uuid",
  "sessionName": "Skills Day: Muscle-up Progressions",
  "type": "Calisthenics Street Workout",
  "category": "calisthenics-street",
  "durationTarget": 60,
  "focus": ["Muscle-up progressions", "Core statique", "Handstand practice"],
  "sessionSummary": "Session skills intermédiaires axée muscle-up et équilibre. Travail technique qualité avec progressions adaptées.",
  "warmup": {
    "duration": 5,
    "isOptional": true,
    "exercises": [
      {
        "id": "wu-1",
        "name": "Rotations poignets",
        "duration": 60,
        "sets": 2,
        "reps": 10,
        "instructions": "Rotations lentes 360°, sens horaire puis antihoraire",
        "targetAreas": ["wrists", "forearms"]
      },
      {
        "id": "wu-2",
        "name": "Scapula pull-ups",
        "duration": 90,
        "sets": 3,
        "reps": 8,
        "instructions": "Activation scapulaire sans flexion coudes",
        "targetAreas": ["shoulders", "scapula", "back"]
      }
    ],
    "notes": "Mobilité dynamique poignets, épaules, hanches. Activation scapulaire CRITIQUE."
  },
  "exercises": [
    {
      "id": "ex-1",
      "name": "Muscle-up progressions",
      "variant": "Explosive pull-ups",
      "sets": 5,
      "reps": 5,
      "tempo": "explosive",
      "rest": 180,
      "rpeTarget": 8,
      "movementPattern": "Pull-Push compound",
      "muscleGroups": ["Dorsaux", "Pectoraux", "Triceps"],
      "equipment": "Barre de traction",
      "skillLevel": "intermediate",
      "progressionStage": "pre-muscle-up",
      "substitutions": ["High pull-ups explosifs", "Band-assisted muscle-up", "Negative muscle-up"],
      "intensificationTechnique": "pause",
      "intensificationDetails": "Pause 2s au top du pull-up pour simuler transition muscle-up",
      "executionCues": ["Pull explosif jusqu'au sternum", "Coudes vers arrière transition", "Poitrine agressive vers barre"],
      "coachNotes": "Focus transition pull→push, force explosive critique pour muscle-up",
      "coachTips": ["Visualise la transition avant chaque rep", "Pull VERS TOI pas seulement UP"],
      "safetyNotes": ["Échauffement scapulaire obligatoire", "Arrêt si douleur épaules/coudes"],
      "commonMistakes": ["Kip excessif", "Transition trop lente", "Coudes vers extérieur"]
    },
    {
      "id": "ex-2",
      "name": "L-sit progression",
      "variant": "L-sit tucked",
      "sets": 4,
      "holdTime": 20,
      "rest": 120,
      "rpeTarget": 7,
      "movementPattern": "Core static hold",
      "muscleGroups": ["Abdominaux", "Hip flexors"],
      "equipment": "Barres parallèles",
      "skillLevel": "intermediate",
      "progressionStage": "tucked",
      "substitutions": ["Supported L-sit (parallettes)", "One leg extended L-sit", "Floor knee raises"],
      "intensificationTechnique": "isometric-hold",
      "intensificationDetails": "Tenir position parfaite 20s, focus compression hanches",
      "executionCues": ["Épaules déprimées actives", "Bassin rétroversion", "Genoux serrés vers poitrine"],
      "coachNotes": "Progressions: tucked → one leg → full L-sit. Patience et consistance.",
      "coachTips": ["Respiration contrôlée", "Pense à pousser le sol"],
      "safetyNotes": ["Poignets préparés obligatoire", "Stop si crampes abdos"],
      "commonMistakes": ["Épaules haussées", "Dos rond", "Respiration bloquée"]
    }
  ],
  "cooldown": {
    "duration": 5,
    "exercises": ["Shoulder dislocations barre", "Pike stretch", "Wrist stretches"],
    "notes": "Stretching épaules, chaîne postérieure, poignets. Récupération active."
  },
  "overallNotes": "Session skills intermédiaires, progressions muscle-up prioritaires. Qualité > quantité.",
  "expectedRpe": 7.5,
  "coachRationale": "Développement force explosive pull + core statique. Muscle-up nécessite high pull-ups parfaits + transition. L-sit développe compression critique pour skills avancés."
}

IMPORTANT:
- Tous les noms d'exercices en FRANÇAIS
- Champs skillLevel, progressionStage RECOMMANDÉS (pas obligatoires)
- holdTime pour statiques, reps pour dynamiques
- TOUJOURS substitutions (2-3 alternatives)
- Si lestés: load en kg
- Adaptation OUTDOOR prioritaire (barres, structures)
- Progressions graduées respecting niveau user
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

# ${userLanguage === 'fr' ? 'CATALOGUE D\'EXERCICES CALISTHENICS DISPONIBLES' : 'AVAILABLE CALISTHENICS EXERCISE CATALOG'}

${userLanguage === 'fr'
  ? `TU DOIS UTILISER UNIQUEMENT LES EXERCICES DE CE CATALOGUE.
Ne génère PAS de nouveaux exercices. Catalogue filtré: ${filteredExercises.length} exercices optimisés.`
  : `YOU MUST USE ONLY EXERCISES FROM THIS CATALOG.
Do NOT generate new exercises. Filtered catalog: ${filteredExercises.length} optimized exercises.`}

${formatExercisesForAI(filteredExercises, userLanguage as 'fr' | 'en')}

${userLanguage === 'fr'
  ? `IMPORTANT: Utilise les progressions (tuck → straddle → full) et régressions listées dans le catalogue pour adapter au niveau de l'utilisateur.`
  : `IMPORTANT: Use the progressions (tuck → straddle → full) and regressions listed in the catalog to adapt to the user's level.`}
`;
    }

    const userPrompt = `# Contexte Utilisateur

${JSON.stringify(userContext, null, 2)}

# Contexte de Préparation

${JSON.stringify(preparerContext, null, 2)}
${exerciseCatalogSection}

# Instructions

Génère une prescription de training Calisthenics & Street Workout totalement personnalisée.

**Contraintes impératives**:
- Respecter le temps disponible: ${preparerContext.availableTime} minutes
- Type d'environnement: ${trainingContext}
- Utiliser UNIQUEMENT ces équipements (${equipmentCount} disponibles): ${equipmentList}
- Niveau d'énergie: ${preparerContext.energyLevel}/10
- Éviter ces mouvements: ${avoidMovements}
${hasExerciseCatalog ? `- **UTILISER UNIQUEMENT les exercices du catalogue fourni ci-dessus (${exerciseCatalog.totalCount} exercices disponibles)**` : ''}

**Objectifs de Personnalisation**:
- Focus progressions skills adaptées au niveau
- Développer force relative (ratio force/poids)
- Équilibre pull/push (ratio 2:1 en faveur pull)
- Prescrire variantes réalistes selon historique
- **IMPORTANT**: Mobilité dynamique 5-8min dans warmup (poignets, épaules obligatoires)
- Si wantsShortVersion = true, échauffement 3-5min minimal

**Utilisation CRÉATIVE des Équipements**:
- ANALYSER le contexte: ${trainingContext}
- MAXIMISER créativité: Barres publiques, structures urbaines, mobilier home
- SUBSTITUTIONS intelligentes: 2-3 alternatives selon équipement disponible
- PROGRESSIONS adaptées: Respecter niveau skills actuel
- Si contexte outdoor: prioriser barres, structures, éléments urbains
- Si contexte home: poids du corps pur + mobilier créatif

**Principe FONDAMENTAL**: Force relative > Force absolue. Chaque exercice doit développer le ratio force/poids optimal.

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

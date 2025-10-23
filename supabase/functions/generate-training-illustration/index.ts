/**
 * Generate Training Illustration Edge Function V2
 * Generates professional illustrations using OpenAI GPT Image 1 (High Quality)
 * Fallback: Icon-based illustration (no low quality generation)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.54.0";
import { generateForceDiptychPrompt, type DiptychPromptParams } from "./diptychPromptGenerator.ts";
import { generateEndurancePrompt, type EndurancePromptParams } from "./endurancePromptGenerator.ts";
import { generateFunctionalPrompt, type FunctionalPromptParams } from "./functionalPromptGenerator.ts";
import { generateCalisthenicsPrompt, type CalisthenicsPromptParams } from "./calisthenicsPromptGenerator.ts";
import { generateCompetitionsPrompt, type CompetitionsPromptParams } from "./competitionsPromptGenerator.ts";

// Discipline normalization mapping
type NormalizedDiscipline = 'force' | 'endurance' | 'functional' | 'competitions' | 'calisthenics';

const DISCIPLINE_MAP: Record<string, NormalizedDiscipline> = {
  'force': 'force',
  'Force': 'force',
  'strength': 'force',
  'Strength': 'force',
  'power': 'force',
  'Power': 'force',
  'musculation': 'force',
  'weights': 'force',
  'endurance': 'endurance',
  'Endurance': 'endurance',
  'running': 'endurance',
  'Running': 'endurance',
  'cycling': 'endurance',
  'Cycling': 'endurance',
  'cardio': 'endurance',
  'functional': 'functional',
  'Functional': 'functional',
  'functional-crosstraining': 'functional',
  'crossfit': 'functional',
  'CrossFit': 'functional',
  'wod': 'functional',
  'competitions': 'competitions',
  'Competitions': 'competitions',
  'fitness-competitions': 'competitions',
  'hyrox': 'competitions',
  'Hyrox': 'competitions',
  'deka': 'competitions',
  'calisthenics': 'calisthenics',
  'Calisthenics': 'calisthenics',
  'bodyweight': 'calisthenics',
};

function normalizeDiscipline(discipline: string): NormalizedDiscipline {
  const normalized = DISCIPLINE_MAP[discipline];
  if (!normalized) {
    console.warn(`[DISCIPLINE_NORMALIZER] Unknown discipline "${discipline}", defaulting to force`);
    return 'force';
  }
  return normalized;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerationRequest {
  type: 'exercise' | 'session';
  exerciseName?: string;
  discipline: string;
  muscleGroups?: string[];
  equipment?: string[];
  movementPattern?: string;
}

interface GenerationResult {
  imageData: string;
  format: string;
  isDiptych?: boolean;
  aspectRatio?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const request: GenerationRequest = await req.json();

    const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.log(`[GPT-IMAGE-1][${requestId}] Request received`, {
      type: request.type,
      exerciseName: request.exerciseName,
      discipline: request.discipline,
      timestamp: new Date().toISOString()
    });

    if (!request.type || !request.discipline) {
      throw new Error('Missing required fields: type, discipline');
    }

    const { type, exerciseName } = request;
    const discipline = normalizeDiscipline(request.discipline);

    console.log(`[GPT-IMAGE-1][${requestId}] Discipline normalized`, {
      original: request.discipline,
      normalized: discipline
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedName = exerciseName
      ? exerciseName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim()
      : null;

    if (normalizedName && type === 'exercise') {
      console.log(`[GPT-IMAGE-1][${requestId}] Checking for existing illustration`, {
        normalizedName,
        discipline,
        type
      });

      const { data: existing, error: checkError } = await supabase
        .from('illustration_library')
        .select('id, image_url, thumbnail_url, generation_source, is_diptych, image_aspect_ratio')
        .eq('type', type)
        .eq('discipline', discipline)
        .eq('exercise_name_normalized', normalizedName)
        .maybeSingle();

      if (existing) {
        console.log(`[GPT-IMAGE-1][${requestId}] Found existing illustration, returning`, {
          illustrationId: existing.id,
          source: existing.generation_source,
          isDiptych: existing.is_diptych,
          aspectRatio: existing.image_aspect_ratio
        });

        return new Response(JSON.stringify({
          success: true,
          data: {
            illustrationId: existing.id,
            imageUrl: existing.image_url,
            thumbnailUrl: existing.thumbnail_url,
            source: existing.generation_source,
            cost: 0.0,
            fromCache: true,
            isDiptych: existing.is_diptych,
            aspectRatio: existing.image_aspect_ratio
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn(`[GPT-IMAGE-1][${requestId}] Error checking existing illustration`, {
          error: checkError.message
        });
      }
    }

    // Create normalized request with corrected discipline
    const normalizedRequest = {
      ...request,
      discipline
    };

    const promptResult = generateDisciplineOptimizedPrompt(normalizedRequest);
    const prompt = promptResult.prompt;
    const isDiptych = promptResult.isDiptych || false;
    const aspectRatio = promptResult.aspectRatio || '1:1';
    const size = aspectRatio === '16:9' ? '1536x1024' : '1024x1024';

    console.log(`[GPT-IMAGE-1][${requestId}] Generated prompt`, {
      promptLength: prompt.length,
      discipline,
      isDiptych,
      aspectRatio,
      size,
      preview: prompt.substring(0, 150) + '...'
    });

    let imageUrl: string | null = null;
    let generationSource = 'gpt-image-1';
    let generationCost = aspectRatio === '16:9' ? 0.100 : 0.080;

    try {
      console.log(`[GPT-IMAGE-1][${requestId}] Starting HIGH quality generation`, {
        isDiptych,
        size,
        aspectRatio
      });
      const gptResult = await generateWithGPTImage1(prompt, requestId, size);

      if (gptResult) {
        console.log(`[GPT-IMAGE-1][${requestId}] Generation successful, uploading to storage`);

        const uploadResult = await uploadBase64ToStorage(
          supabase,
          gptResult.imageData,
          discipline,
          type,
          exerciseName || 'session',
          requestId
        );

        if (uploadResult) {
          imageUrl = uploadResult.publicUrl;
          console.log(`[GPT-IMAGE-1][${requestId}] Upload successful`, {
            publicUrl: imageUrl.substring(0, 100) + '...'
          });
        } else {
          console.warn(`[GPT-IMAGE-1][${requestId}] Upload failed, cannot use base64 directly`);
          imageUrl = null;
        }
      }
    } catch (error) {
      console.error(`[GPT-IMAGE-1][${requestId}] Generation failed`, {
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }

    if (!imageUrl) {
      console.log(`[FALLBACK][${requestId}] GPT Image 1 failed, generating icon-based illustration`);

      const iconIllustration = generateIconIllustration(exerciseName, discipline, type);

      const uploadResult = await uploadDataUriToStorage(
        supabase,
        iconIllustration,
        discipline,
        type,
        exerciseName || 'session'
      );

      if (uploadResult) {
        imageUrl = uploadResult.publicUrl;
      } else {
        imageUrl = iconIllustration;
      }

      generationSource = 'icon-fallback';
      generationCost = 0.0;
    }

    if (!imageUrl) {
      throw new Error('No image URL available after all generation attempts');
    }

    // CRITICAL: Double-check for race condition BEFORE insert to avoid duplicate constraint violation
    // This prevents wasting generation if another request created the same illustration
    if (normalizedName && type === 'exercise') {
      console.log(`[GPT-IMAGE-1][${requestId}] Final check before insert to prevent duplicate`, {
        normalizedName,
        discipline,
        type
      });

      const { data: preInsertCheck, error: preInsertError } = await supabase
        .from('illustration_library')
        .select('id, image_url, thumbnail_url, generation_source, is_diptych, image_aspect_ratio')
        .eq('type', type)
        .eq('discipline', discipline)
        .eq('exercise_name_normalized', normalizedName)
        .maybeSingle();

      if (preInsertCheck) {
        console.log(`[GPT-IMAGE-1][${requestId}] Pre-insert check found existing illustration, returning it (race condition avoided)`, {
          illustrationId: preInsertCheck.id,
          source: preInsertCheck.generation_source
        });

        return new Response(JSON.stringify({
          success: true,
          data: {
            illustrationId: preInsertCheck.id,
            imageUrl: preInsertCheck.image_url,
            thumbnailUrl: preInsertCheck.thumbnail_url,
            source: preInsertCheck.generation_source,
            cost: 0.0,
            fromCache: true,
            raceConditionPrevented: true,
            isDiptych: preInsertCheck.is_diptych,
            aspectRatio: preInsertCheck.image_aspect_ratio
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (preInsertError && preInsertError.code !== 'PGRST116') {
        console.warn(`[GPT-IMAGE-1][${requestId}] Pre-insert check error`, {
          error: preInsertError.message
        });
      }
    }

    const insertData = {
      type,
      discipline,
      exercise_name: exerciseName,
      exercise_name_normalized: normalizedName,
      focus_tags: request.muscleGroups || [],
      equipment_tags: request.equipment || [],
      muscle_groups: request.muscleGroups || [],
      movement_pattern: request.movementPattern,
      visual_style: 'professional',
      view_angle: 'optimal',
      image_url: imageUrl,
      thumbnail_url: null,
      generation_source: generationSource,
      generation_prompt: prompt,
      generation_cost_usd: generationCost,
      quality_score: generationSource === 'gpt-image-1' ? 4.5 : 3.0,
      is_diptych: isDiptych,
      panel_count: isDiptych ? 2 : 1,
      image_aspect_ratio: aspectRatio,
      arrow_config: isDiptych ? {
        macro: { enabled: true, color: 'red' },
        micro: { enabled: true, maxCount: 3 }
      } : null,
      muscle_highlight_config: isDiptych && request.muscleGroups ? {
        muscles: request.muscleGroups,
        opacity: 0.3,
        color: '#FF0000'
      } : null
    };

    console.log(`[GPT-IMAGE-1][${requestId}] Inserting to database`, {
      generation_source: generationSource,
      type,
      discipline,
      exercise_name: exerciseName,
      is_diptych: isDiptych,
      aspect_ratio: aspectRatio
    });

    const { data: illustration, error: dbError } = await supabase
      .from('illustration_library')
      .insert(insertData)
      .select('id, image_url')
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
        console.warn(`[GPT-IMAGE-1][${requestId}] Duplicate constraint violation despite pre-check (race condition), fetching existing`, {
          normalizedName,
          discipline
        });

        const { data: existing } = await supabase
          .from('illustration_library')
          .select('id, image_url, thumbnail_url, generation_source, is_diptych, image_aspect_ratio')
          .eq('type', type)
          .eq('discipline', discipline)
          .eq('exercise_name_normalized', normalizedName)
          .maybeSingle();

        if (existing) {
          console.log(`[GPT-IMAGE-1][${requestId}] Returning existing illustration from fallback race condition handler`, {
            illustrationId: existing.id
          });

          return new Response(JSON.stringify({
            success: true,
            data: {
              illustrationId: existing.id,
              imageUrl: existing.image_url,
              thumbnailUrl: existing.thumbnail_url,
              source: existing.generation_source,
              cost: 0.0,
              fromCache: true,
              raceCondition: true,
              isDiptych: existing.is_diptych,
              aspectRatio: existing.image_aspect_ratio
            }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      console.error(`[GPT-IMAGE-1][${requestId}] Database insert error`, {
        error: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
        generation_source: generationSource
      });
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    console.log(`[GPT-IMAGE-1][${requestId}] Success`, {
      illustrationId: illustration.id,
      source: generationSource,
      cost: generationCost,
      isDiptych,
      aspectRatio
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        illustrationId: illustration.id,
        imageUrl,
        source: generationSource,
        cost: generationCost,
        isDiptych,
        aspectRatio
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(`[GPT-IMAGE-1] Error`, {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'N/A'
    });

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateWithGPTImage1(
  prompt: string,
  requestId: string,
  size: string = '1024x1024'
): Promise<{ imageData: string; format: string } | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

  if (!openaiKey) {
    console.error(`[GPT-IMAGE-1][${requestId}] API key not configured`);
    return null;
  }

  console.log(`[GPT-IMAGE-1][${requestId}] Starting generation with HIGH quality`, {
    promptLength: prompt.length,
    size,
    timestamp: new Date().toISOString()
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[GPT-IMAGE-1][${requestId}] Aborting after 130 seconds timeout`);
      controller.abort();
    }, 130000);

    const startTime = Date.now();
    let progressInterval: number | null = null;

    progressInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`[GPT-IMAGE-1][${requestId}] Generation in progress... ${elapsed}s elapsed`);
    }, 20000);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size,
        quality: "high"
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (progressInterval) clearInterval(progressInterval);

    const duration = Math.floor((Date.now() - startTime) / 1000);

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails = errorText;
      let isParameterError = false;

      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = JSON.stringify(errorJson, null, 2);

        if (errorJson.error?.type === 'invalid_request_error' &&
            errorJson.error?.code === 'unknown_parameter') {
          isParameterError = true;
          console.error(`[GPT-IMAGE-1][${requestId}] ⚠️ UNSUPPORTED PARAMETER ERROR`, {
            parameter: errorJson.error?.param,
            message: errorJson.error?.message,
            note: 'This parameter is not supported by gpt-image-1 model'
          });
        }
      } catch {
      }

      console.error(`[GPT-IMAGE-1][${requestId}] API error after ${duration}s`, {
        status: response.status,
        statusText: response.statusText,
        isParameterError,
        error: errorDetails.substring(0, 500)
      });
      return null;
    }

    const result = await response.json();

    console.log(`[GPT-IMAGE-1][${requestId}] Response received after ${duration}s`, {
      hasData: !!result.data,
      dataLength: result.data?.length || 0,
      firstItemKeys: result.data?.[0] ? Object.keys(result.data[0]) : []
    });

    if (result.data && result.data[0] && result.data[0].b64_json) {
      const base64Data = result.data[0].b64_json;
      const dataSize = Math.floor(base64Data.length / 1024);

      console.log(`[GPT-IMAGE-1][${requestId}] Generation successful`, {
        duration: `${duration}s`,
        dataSizeKB: dataSize,
        format: 'base64/png'
      });

      return {
        imageData: base64Data,
        format: 'png'
      };
    }

    console.error(`[GPT-IMAGE-1][${requestId}] No b64_json in response`, {
      resultStructure: JSON.stringify(result).substring(0, 200)
    });
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[GPT-IMAGE-1][${requestId}] Timeout after 130 seconds`);
    } else {
      console.error(`[GPT-IMAGE-1][${requestId}] Exception`, {
        error: error instanceof Error ? error.message : 'Unknown',
        errorName: error instanceof Error ? error.name : 'N/A',
        stack: error instanceof Error ? error.stack?.substring(0, 300) : 'N/A'
      });
    }
    return null;
  }
}

function generateDisciplineOptimizedPrompt(request: GenerationRequest): { prompt: string; isDiptych: boolean; aspectRatio: string } {
  const { type, exerciseName, discipline, muscleGroups, equipment, movementPattern } = request;

  // Session-level illustrations (not exercise-specific)
  if (type === 'session') {
    const category = (request as any).category;
    const exerciseCount = (request as any).exerciseCount;

    return {
      prompt: generateSessionPrompt(discipline, category, exerciseCount),
      isDiptych: true,
      aspectRatio: '16:9'
    };
  }

  // Exercise-specific illustrations - route to appropriate generator
  if (!exerciseName) {
    throw new Error('Exercise name required for exercise-type illustrations');
  }

  // FORCE/POWERBUILDING - Use existing diptych generator
  if (discipline === 'force') {
    const diptychParams: DiptychPromptParams = {
      exerciseName,
      muscleGroups,
      equipment,
      movementPattern
    };
    return {
      prompt: generateForceDiptychPrompt(diptychParams),
      isDiptych: true,
      aspectRatio: '16:9'
    };
  }

  // ENDURANCE - Use cycle-based generator
  if (discipline === 'endurance') {
    const enduranceParams: EndurancePromptParams = {
      exerciseName,
      sport: detectEnduranceSport(exerciseName),
      zones: (request as any).zones,
      cadence: (request as any).cadence,
      duration: (request as any).duration,
      intensity: (request as any).intensity
    };
    return generateEndurancePrompt(enduranceParams);
  }

  // FUNCTIONAL/CROSSTRAINING - Use explosive movement generator
  if (discipline === 'functional') {
    const functionalParams: FunctionalPromptParams = {
      exerciseName,
      movementType: detectFunctionalMovementType(exerciseName),
      scaling: (request as any).scaling,
      repScheme: (request as any).repScheme,
      timeCap: (request as any).timeCap,
      isUnbroken: (request as any).isUnbroken,
      equipment
    };
    return generateFunctionalPrompt(functionalParams);
  }

  // CALISTHENICS - Use body alignment generator
  if (discipline === 'calisthenics') {
    const calisthenicsParams: CalisthenicsPromptParams = {
      exerciseName,
      skillCategory: detectCalisthenicsCategory(exerciseName),
      progression: (request as any).progression || 'Intermediate',
      variant: (request as any).variant,
      holdDuration: (request as any).holdDuration,
      repTarget: (request as any).repTarget,
      equipment
    };
    return generateCalisthenicsPrompt(calisthenicsParams);
  }

  // COMPETITIONS - Use judge standards generator
  if (discipline === 'competitions') {
    const competitionsParams: CompetitionsPromptParams = {
      exerciseName,
      competitionType: (request as any).competitionType || 'general',
      standard: (request as any).standard || {},
      noRepCriteria: (request as any).noRepCriteria,
      equipment
    };
    return generateCompetitionsPrompt(competitionsParams);
  }

  // Fallback for unknown disciplines - should never reach here due to normalizeDiscipline
  // But include as safety net - defaults to Force generator
  console.warn(`[PROMPT_GENERATOR] Unexpected discipline: ${discipline}, using Force generator fallback`);
  const fallbackParams: DiptychPromptParams = {
    exerciseName,
    muscleGroups,
    equipment,
    movementPattern
  };
  return {
    prompt: generateForceDiptychPrompt(fallbackParams),
    isDiptych: true,
    aspectRatio: '16:9'
  };
}

/**
 * Helper: Detect endurance sport from exercise name
 */
function detectEnduranceSport(exerciseName: string): 'running' | 'cycling' | 'swimming' | 'rowing' | 'triathlon' {
  const lowerName = exerciseName.toLowerCase();
  if (lowerName.includes('run') || lowerName.includes('course')) return 'running';
  if (lowerName.includes('bike') || lowerName.includes('vélo') || lowerName.includes('cycling')) return 'cycling';
  if (lowerName.includes('swim') || lowerName.includes('natation')) return 'swimming';
  if (lowerName.includes('row') || lowerName.includes('erg')) return 'rowing';
  if (lowerName.includes('tri') || lowerName.includes('brick')) return 'triathlon';
  return 'running'; // default
}

/**
 * Helper: Detect functional movement type
 */
function detectFunctionalMovementType(exerciseName: string): 'olympic' | 'gymnastic' | 'monostructural' | 'compound' {
  const lowerName = exerciseName.toLowerCase();
  if (lowerName.includes('snatch') || lowerName.includes('clean') || lowerName.includes('jerk')) return 'olympic';
  if (lowerName.includes('pull-up') || lowerName.includes('muscle-up') || lowerName.includes('handstand')) return 'gymnastic';
  if (lowerName.includes('row') || lowerName.includes('run') || lowerName.includes('bike')) return 'monostructural';
  return 'compound';
}

/**
 * Helper: Detect calisthenics skill category
 */
function detectCalisthenicsCategory(exerciseName: string): 'pull' | 'push' | 'legs' | 'core' | 'static' | 'dynamic' {
  const lowerName = exerciseName.toLowerCase();
  if (lowerName.includes('pull') || lowerName.includes('row')) return 'pull';
  if (lowerName.includes('push') || lowerName.includes('dip')) return 'push';
  if (lowerName.includes('squat') || lowerName.includes('pistol')) return 'legs';
  if (lowerName.includes('plank') || lowerName.includes('hollow')) return 'core';
  if (lowerName.includes('planche') || lowerName.includes('lever') || lowerName.includes('handstand')) return 'static';
  if (lowerName.includes('muscle-up') || lowerName.includes('swing')) return 'dynamic';
  return 'push'; // default
}

function generateSessionPrompt(discipline: string, category?: string, exerciseCount?: number): string {
  const lowerCategory = category?.toLowerCase() || '';
  const isPower = lowerCategory.includes('power');
  const isStrength = lowerCategory.includes('strength') || lowerCategory.includes('force');
  const isHypertrophy = lowerCategory.includes('hypertrophy');

  // Enhanced session prompts with 16:9 panoramic format
  if (discipline === 'force') {
    let focusDescription = 'strength training';
    let atmosphereDetails = 'determined intensity';
    let equipmentDetails = 'Olympic barbells, weight plates, power racks';

    if (isPower) {
      focusDescription = 'explosive power training';
      atmosphereDetails = 'explosive energy and dynamic movement';
      equipmentDetails = 'Olympic barbells, bumper plates, lifting platform';
    } else if (isHypertrophy) {
      focusDescription = 'muscle hypertrophy training';
      atmosphereDetails = 'focused intensity and controlled tempo';
      equipmentDetails = 'dumbbells, machines, cables, benches';
    } else if (isStrength) {
      focusDescription = 'maximal strength training';
      atmosphereDetails = 'raw power and heavy loading';
      equipmentDetails = 'heavy barbells, weight plates, power racks';
    }

    return `Professional strength training gym environment - Panoramic 16:9 format (1536x1024 pixels)

SCENE COMPOSITION:
- Wide-angle view of professional gym interior
- ${equipmentDetails} prominently displayed
- Industrial-modern aesthetic with premium equipment
- Dramatic lighting from overhead and side angles creating depth
- Multiple training zones visible in panoramic layout

ATMOSPHERE & MOOD:
- ${focusDescription} environment
- Motivational and empowering aesthetic
- ${atmosphereDetails}
- Premium fitness facility quality
- Professional sport photography style

VISUAL ELEMENTS:
- Clean, organized equipment arrangement
- Subtle motion blur suggesting activity
- Deep shadows and bright highlights for contrast
- Metallic sheen on barbells and plates
- Textured rubber flooring visible
- Exposed brick or industrial walls in background

COMPOSITION RULES:
- Panoramic 16:9 aspect ratio strictly maintained
- Rule of thirds with equipment placement
- Leading lines from floor patterns and racks
- Depth created through multiple equipment planes
- Professional gym catalog photography quality

COLOR PALETTE:
- Dominant: Deep grays (#1e293b, #334155)
- Accent: Metallic silver and chrome highlights
- Contrast: Dark rubber black flooring
- Warmth: Subtle amber lighting tones
- Professional, high-end commercial gym aesthetic

STYLE: Hyper-realistic gym photography, professional commercial quality, dramatic lighting, premium fitness magazine editorial style`;
  }

  const sessionPrompts: Record<string, string> = {
    endurance: `Professional endurance training visualization - Panoramic 16:9 format
Athletic sports environment with dynamic energy, heart rate zones visualization, pacing strategy elements
Track or road setting with motion and speed indicators, professional sports photography quality`,

    functional: `Professional functional training circuit - Panoramic 16:9 format
High energy CrossFit box environment, varied movement stations visible, industrial athletic aesthetic
Workout intensity visualization with multiple training zones, competition-ready atmosphere`,

    competitions: `Professional competition format visualization - Panoramic 16:9 format
Multi-station race layout, competitive atmosphere with timing elements visible
HYROX or obstacle race aesthetic, professional event photography quality with dynamic action`,

    calisthenics: `Professional calisthenics training space - Panoramic 16:9 format
Progressive bodyweight skill stations, street workout aesthetic with urban elements
Rings, bars, and parallel equipment visible, athlete-focused skill development environment`
  };

  return sessionPrompts[discipline] || sessionPrompts.force;
}

function generateIconIllustration(exerciseName: string | undefined, discipline: string, type: string): string {
  const name = exerciseName || type;

  const colorSchemes: Record<string, { primary: string; secondary: string; icon: string }> = {
    force: { primary: '#DC2626', secondary: '#991B1B', icon: '#FCA5A5' },
    endurance: { primary: '#2563EB', secondary: '#1E40AF', icon: '#93C5FD' },
    functional: { primary: '#EA580C', secondary: '#C2410C', icon: '#FDBA74' },
    competitions: { primary: '#7C3AED', secondary: '#5B21B6', icon: '#C4B5FD' },
    calisthenics: { primary: '#059669', secondary: '#047857', icon: '#6EE7B7' }
  };

  const colors = colorSchemes[discipline] || colorSchemes.force;

  const icons: Record<string, string> = {
    force: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    endurance: 'M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z',
    functional: 'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z',
    competitions: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
    calisthenics: 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z'
  };

  const iconPath = icons[discipline] || icons.force;
  const displayName = name.length > 28 ? name.substring(0, 25) + '...' : name;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.secondary};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors.primary};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="url(#grad)"/>
    <circle cx="400" cy="350" r="140" fill="white" opacity="0.2"/>
    <g transform="translate(400, 350) scale(10)">
      <path d="${iconPath}" fill="white" opacity="0.95" transform="translate(-12, -12)" stroke="white" stroke-width="0.5"/>
    </g>
    <rect x="50" y="550" width="700" height="180" rx="20" fill="rgba(0,0,0,0.5)"/>
    <text x="400" y="630" font-family="system-ui" font-size="40" font-weight="700" fill="white" text-anchor="middle">
      ${displayName}
    </text>
    <rect x="280" y="670" width="240" height="45" rx="22" fill="${colors.icon}" opacity="0.4"/>
    <text x="400" y="700" font-family="system-ui" font-size="22" font-weight="600" fill="white" text-anchor="middle">
      ${discipline.toUpperCase()}
    </text>
  </svg>`;

  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

async function uploadBase64ToStorage(
  supabase: any,
  base64Data: string,
  discipline: string,
  type: string,
  exerciseName: string,
  requestId: string
): Promise<{ publicUrl: string; path: string } | null> {
  try {
    console.log(`[STORAGE][${requestId}] Converting base64 to buffer`, {
      base64Length: base64Data.length,
      estimatedSizeKB: Math.floor(base64Data.length / 1024)
    });

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`[STORAGE][${requestId}] Buffer created`, {
      bufferSize: bytes.length,
      bufferSizeKB: Math.floor(bytes.length / 1024)
    });

    const fileName = generateFileName(type, exerciseName);
    const filePath = `${discipline}/${type}/${fileName}.webp`;

    console.log(`[STORAGE][${requestId}] Uploading to Supabase Storage`, {
      path: filePath,
      discipline,
      type
    });

    const { error } = await supabase.storage
      .from('training-illustrations')
      .upload(filePath, bytes, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false
      });

    if (error) {
      console.error(`[STORAGE][${requestId}] Upload error`, {
        error: error.message,
        code: error.statusCode,
        path: filePath
      });
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('training-illustrations')
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      console.log(`[STORAGE][${requestId}] Upload successful`, {
        publicUrl: urlData.publicUrl.substring(0, 100) + '...',
        path: filePath
      });
      return { publicUrl: urlData.publicUrl, path: filePath };
    }

    return null;
  } catch (error) {
    console.error(`[STORAGE][${requestId}] Exception`, {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack?.substring(0, 300) : 'N/A'
    });
    return null;
  }
}

async function uploadDataUriToStorage(
  supabase: any,
  dataUri: string,
  discipline: string,
  type: string,
  exerciseName: string
): Promise<{ publicUrl: string; path: string } | null> {
  try {
    const base64Match = dataUri.match(/^data:image\/svg\+xml;base64,(.+)$/);
    if (!base64Match) return null;

    const binaryString = atob(base64Match[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = generateFileName(type, exerciseName);
    const filePath = `${discipline}/${type}/${fileName}.svg`;

    const { error } = await supabase.storage
      .from('training-illustrations')
      .upload(filePath, bytes, {
        contentType: 'image/svg+xml',
        cacheControl: '31536000',
        upsert: false
      });

    if (error) return null;

    const { data: urlData } = supabase.storage
      .from('training-illustrations')
      .getPublicUrl(filePath);

    return urlData?.publicUrl ? { publicUrl: urlData.publicUrl, path: filePath } : null;
  } catch (error) {
    return null;
  }
}

function generateFileName(type: string, name: string): string {
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return `${type}-${normalized}-${timestamp}-${random}`;
}

/**
 * Training Enrichment Processor Edge Function
 * Processes background enrichment queue for training sessions
 * Enriches fast-generated sessions with detailed metadata
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EnrichmentQueueItem {
  id: string;
  user_id: string;
  session_id: string;
  coach_type: 'force' | 'endurance' | 'functional' | 'calisthenics' | 'competitions';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  attempts: number;
  max_attempts: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[ENRICHMENT-PROCESSOR] Starting enrichment processing');

    // Get next pending enrichment item (highest priority first)
    const { data: queueItems, error: fetchError } = await supabase
      .from('training_enrichment_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: true }) // 1 = highest priority
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) {
      throw new Error(`Failed to fetch queue items: ${fetchError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('[ENRICHMENT-PROCESSOR] No pending items in queue');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending enrichments',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const queueItem = queueItems[0] as EnrichmentQueueItem;
    console.log('[ENRICHMENT-PROCESSOR] Processing enrichment', {
      queueItemId: queueItem.id,
      sessionId: queueItem.session_id,
      coachType: queueItem.coach_type,
      priority: queueItem.priority,
      attempts: queueItem.attempts
    });

    // Mark as processing
    await supabase
      .from('training_enrichment_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', queueItem.session_id)
      .single();

    if (sessionError || !session) {
      throw new Error(`Failed to fetch session: ${sessionError?.message}`);
    }

    console.log('[ENRICHMENT-PROCESSOR] Session data retrieved', {
      sessionId: session.id,
      category: session.category,
      exercisesCount: session.exercises?.length || 0
    });

    // Enrich the session based on coach type
    const enrichedSession = await enrichSession(session, queueItem.coach_type);

    // Update session with enriched data
    const { error: updateError } = await supabase
      .from('training_sessions')
      .update({
        exercises: enrichedSession.exercises,
        enrichment_status: 'enriched',
        updated_at: new Date().toISOString()
      })
      .eq('id', queueItem.session_id);

    if (updateError) {
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    // Mark enrichment as completed
    await supabase.rpc('mark_enrichment_completed', {
      p_session_id: queueItem.session_id
    });

    const latencyMs = Date.now() - startTime;

    console.log('[ENRICHMENT-PROCESSOR] Enrichment completed successfully', {
      sessionId: queueItem.session_id,
      latencyMs,
      exercisesEnriched: enrichedSession.exercises?.length || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: queueItem.session_id,
        coachType: queueItem.coach_type,
        latencyMs,
        exercisesEnriched: enrichedSession.exercises?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const latencyMs = Date.now() - startTime;

    console.error('[ENRICHMENT-PROCESSOR] Enrichment failed', {
      error: error.message,
      stack: error.stack,
      latencyMs
    });

    // Try to mark as failed in database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const requestBody = await req.clone().json();
      const sessionId = requestBody?.sessionId;

      if (sessionId) {
        await supabase.rpc('mark_enrichment_failed', {
          p_session_id: sessionId,
          p_error_message: error.message
        });
      }
    } catch (dbError) {
      console.error('[ENRICHMENT-PROCESSOR] Failed to mark as failed in DB', dbError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        latencyMs
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Enriches a training session with detailed metadata
 * This is where the "slow but detailed" enrichment happens
 */
async function enrichSession(session: any, coachType: string): Promise<any> {
  console.log('[ENRICHMENT-PROCESSOR] Starting session enrichment', {
    coachType,
    exercisesCount: session.exercises?.length || 0
  });

  // Clone the session to avoid mutating original
  const enriched = { ...session };

  // Enrich each exercise with additional metadata
  if (enriched.exercises && Array.isArray(enriched.exercises)) {
    enriched.exercises = await Promise.all(
      enriched.exercises.map(async (exercise: any) => {
        return await enrichExercise(exercise, coachType);
      })
    );
  }

  // Add coach-specific enrichments
  switch (coachType) {
    case 'force':
      enriched.volume_analysis = calculateVolumeAnalysis(enriched.exercises);
      enriched.intensity_distribution = calculateIntensityDistribution(enriched.exercises);
      break;
    case 'endurance':
      enriched.zone_distribution = calculateZoneDistribution(enriched.exercises);
      enriched.tss_breakdown = calculateTSSBreakdown(enriched.exercises);
      break;
    case 'functional':
      enriched.modal_balance = calculateModalBalance(enriched.exercises);
      enriched.scaling_guidance = generateScalingGuidance(enriched.exercises);
      break;
    case 'calisthenics':
      enriched.skill_progression_path = generateSkillProgressionPath(enriched.exercises);
      enriched.push_pull_ratio = calculatePushPullRatio(enriched.exercises);
      break;
    case 'competitions':
      enriched.station_timing = calculateStationTiming(enriched.exercises);
      enriched.transition_strategy = generateTransitionStrategy(enriched.exercises);
      break;
  }

  return enriched;
}

/**
 * Enriches a single exercise with detailed metadata
 */
async function enrichExercise(exercise: any, coachType: string): Promise<any> {
  const enriched = { ...exercise };

  // Add detailed coaching cues based on skill level (if not already present)
  if (!enriched.coaching_cues_detailed) {
    enriched.coaching_cues_detailed = generateDetailedCoachingCues(exercise, coachType);
  }

  // Add common mistakes to watch for (if not already present)
  if (!enriched.common_mistakes) {
    enriched.common_mistakes = generateCommonMistakes(exercise, coachType);
  }

  // Add progression suggestions (if not already present)
  if (!enriched.progression_suggestions) {
    enriched.progression_suggestions = generateProgressionSuggestions(exercise, coachType);
  }

  // Add technical breakdown (if not already present)
  if (!enriched.technical_breakdown) {
    enriched.technical_breakdown = generateTechnicalBreakdown(exercise, coachType);
  }

  return enriched;
}

// Helper functions for enrichment
function generateDetailedCoachingCues(exercise: any, coachType: string): string[] {
  // Generate detailed coaching cues based on exercise and coach type
  const cues: string[] = [];

  // Basic setup cues
  cues.push(`Position de départ: ${exercise.setup_position || 'Position standard'}`);

  // Movement-specific cues based on coach type
  if (coachType === 'force') {
    cues.push('Phase excentrique contrôlée');
    cues.push('Pause en position basse si prescrit');
    cues.push('Phase concentrique explosive');
  } else if (coachType === 'calisthenics') {
    cues.push('Engagement scapulaire actif');
    cues.push('Alignement corps complet');
    cues.push('Contrôle total du mouvement');
  }

  return cues;
}

function generateCommonMistakes(exercise: any, coachType: string): string[] {
  return [
    'Compensation par d\'autres groupes musculaires',
    'Amplitude de mouvement incomplète',
    'Tempo trop rapide sacrifiant la qualité'
  ];
}

function generateProgressionSuggestions(exercise: any, coachType: string): any {
  return {
    easier: 'Réduire charge/intensité de 20%',
    harder: 'Augmenter charge/intensité de 10%',
    variation: 'Essayer variante unilatérale'
  };
}

function generateTechnicalBreakdown(exercise: any, coachType: string): any {
  return {
    setup: 'Configuration optimale',
    execution: 'Points clés d\'exécution',
    breathing: 'Pattern respiratoire recommandé'
  };
}

// Analysis functions
function calculateVolumeAnalysis(exercises: any[]): any {
  return { totalVolume: 0, volumeByMuscleGroup: {} };
}

function calculateIntensityDistribution(exercises: any[]): any {
  return { light: 0, moderate: 0, heavy: 0 };
}

function calculateZoneDistribution(exercises: any[]): any {
  return { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
}

function calculateTSSBreakdown(exercises: any[]): any {
  return { total: 0, byBlock: [] };
}

function calculateModalBalance(exercises: any[]): any {
  return { gymnastics: 0, weightlifting: 0, monostructural: 0 };
}

function generateScalingGuidance(exercises: any[]): any {
  return { rx: 'Standard', scaled: 'Intermédiaire', foundations: 'Débutant' };
}

function generateSkillProgressionPath(exercises: any[]): any {
  return { currentLevel: 'intermediate', nextSteps: [] };
}

function calculatePushPullRatio(exercises: any[]): any {
  return { push: 0, pull: 0, ratio: '1:2' };
}

function calculateStationTiming(exercises: any[]): any {
  return { stations: [], totalTime: 0 };
}

function generateTransitionStrategy(exercises: any[]): any {
  return { transitions: [], tips: [] };
}

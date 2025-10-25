/**
 * Endurance Prompt Generator
 * Specialized prompt generation for endurance sports (running, cycling, swimming, rowing)
 * Features: Cycle-based arrows, zone badges, cadence markers
 */

import { buildUniversalPrompt, type UniversalPromptParams } from './universalPromptGenerator.ts';

export interface EndurancePromptParams {
  exerciseName: string;
  sport: 'running' | 'cycling' | 'swimming' | 'rowing' | 'triathlon';
  zones?: string[];           // HR zones, power zones (Z1-Z5)
  cadence?: number;           // Target cadence (steps/min, rpm, strokes/min)
  duration?: number;          // Duration in minutes
  intensity?: 'easy' | 'tempo' | 'threshold' | 'vo2max' | 'sprint';
  // Enhanced visual metadata from exercise catalog DB
  visualKeywords?: string[];
  executionPhases?: string[];
  keyPositions?: string[];
  recommendedViewAngle?: string;
  recommendedVisualStyle?: string;
}

/**
 * Detect movement cycle type based on exercise name
 */
function detectCycleType(exerciseName: string, sport: string): string {
  const lowerName = exerciseName.toLowerCase();

  if (sport === 'running' || lowerName.includes('run') || lowerName.includes('course')) {
    return 'stride_cycle';
  } else if (sport === 'cycling' || lowerName.includes('bike') || lowerName.includes('vélo')) {
    return 'pedal_cycle';
  } else if (sport === 'swimming' || lowerName.includes('swim') || lowerName.includes('natation')) {
    return 'swim_cycle';
  } else if (sport === 'rowing' || lowerName.includes('row') || lowerName.includes('erg')) {
    return 'rowing_cycle';
  }

  return 'movement_cycle';
}

/**
 * Generate cycle-specific arrow instructions
 */
function generateCycleArrows(cycleType: string): string {
  const cycleDescriptions: Record<string, { macro: string; micro: string[] }> = {
    stride_cycle: {
      macro: 'Circular GREEN arrow showing complete stride cycle: heel strike → stance → push-off → swing → return',
      micro: [
        'Force vector at ground contact showing downward/forward push',
        'Hip and knee drive angles during stance phase',
        'Ankle dorsiflexion at different cycle points'
      ]
    },
    pedal_cycle: {
      macro: 'Circular GREEN arrow showing pedal stroke cycle: top dead center → power phase (3-5 o\'clock) → bottom → recovery',
      micro: [
        'Force vector on pedal during power phase',
        'Hip angle and seat position relationship',
        'Ankle angle through stroke (heel drop at bottom)'
      ]
    },
    swim_cycle: {
      macro: 'Circular GREEN arrow showing swim stroke cycle: catch → pull → push → recovery',
      micro: [
        'Hand entry angle and catch position',
        'Elbow high position during pull',
        'Body rotation and hip drive'
      ]
    },
    rowing_cycle: {
      macro: 'Circular GREEN arrow showing rowing cycle: catch → drive (legs-body-arms) → finish → recovery (arms-body-legs)',
      micro: [
        'Leg drive force vector',
        'Body angle at catch vs finish',
        'Handle path horizontal to ground'
      ]
    },
    movement_cycle: {
      macro: 'Circular GREEN arrow showing complete movement cycle from start through peak to return',
      micro: [
        'Primary force application points',
        'Joint angle changes',
        'Body position transitions'
      ]
    }
  };

  const cycleInfo = cycleDescriptions[cycleType] || cycleDescriptions.movement_cycle;

  return `ENDURANCE-SPECIFIC ARROWS:

PANEL 1 (LEFT - DRIVE/POWER PHASE):
- ${cycleInfo.macro}
- Maximum 3 thin micro arrows (4px width):
  * ${cycleInfo.micro[0]}
  * ${cycleInfo.micro[1]}
  * ${cycleInfo.micro[2]}
- ALL arrows GREEN color (#10B981)
- Solid GREEN arrows showing power application

PANEL 2 (RIGHT - RECOVERY PHASE):
- Same circular arrow but DASHED GREEN (#059669)
- Shows return/recovery path to starting position
- Micro arrows show relaxation and preparation for next cycle
- Maintain EXACT same camera angle and scale as Panel 1

CYCLE INDICATORS:
- Use small numbered markers (1, 2, 3, 4) at key cycle points
- Add subtle motion blur to indicate continuous movement
- Include cadence rhythm markers if applicable`;
}

/**
 * Generate zone-specific badge content
 */
function generateZoneBadge(zones?: string[], cadence?: number, intensity?: string): string {
  let badgeContent = '';

  if (zones && zones.length > 0) {
    badgeContent += `Zone: ${zones.join(' → ')}`;
  }

  if (cadence) {
    badgeContent += `${badgeContent ? ' | ' : ''}Cadence: ${cadence}`;
  }

  if (intensity) {
    const intensityLabels: Record<string, string> = {
      easy: 'Easy/Aerobic',
      tempo: 'Tempo/Steady',
      threshold: 'Threshold',
      vo2max: 'VO2Max',
      sprint: 'Sprint/Max'
    };
    badgeContent += `${badgeContent ? ' | ' : ''}${intensityLabels[intensity] || intensity}`;
  }

  return badgeContent || 'Endurance Training';
}

/**
 * Generate endurance-specific equipment and environment
 */
function generateEnduranceEnvironment(sport: string, exerciseName: string): string[] {
  const environments: Record<string, string[]> = {
    running: ['Running shoes', 'Track or road environment', 'Athletic running apparel'],
    cycling: ['Road or stationary bike', 'Cycling shoes and cleats', 'Aerodynamic position'],
    swimming: ['Swimming pool', 'Swim cap and goggles', 'Proper lane environment'],
    rowing: ['Rowing ergometer (erg)', 'Proper foot straps', 'Indoor training environment'],
    triathlon: ['Multi-sport transition area', 'Race-specific equipment', 'Competition environment']
  };

  return environments[sport] || ['Athletic equipment', 'Training environment'];
}

/**
 * Generate complete endurance prompt
 */
export function generateEndurancePrompt(params: EndurancePromptParams): {
  prompt: string;
  isDiptych: boolean;
  aspectRatio: '1:1' | '16:9';
} {
  const cycleType = detectCycleType(params.exerciseName, params.sport);
  const cycleArrows = generateCycleArrows(cycleType);
  const zoneBadge = generateZoneBadge(params.zones, params.cadence, params.intensity);
  const equipment = generateEnduranceEnvironment(params.sport, params.exerciseName);

  // Build base prompt using universal generator
  const universalParams: UniversalPromptParams = {
    exerciseName: params.exerciseName,
    discipline: 'endurance',
    equipment,
    metadata: {
      zones: params.zones,
      cadence: params.cadence,
      duration: params.duration
    }
  };

  const basePrompt = buildUniversalPrompt(universalParams);

  // Enhance with endurance-specific details
  const enhancedPrompt = `${basePrompt.prompt}

${cycleArrows}

ENDURANCE VISUAL STYLE:
- Dynamic motion capture aesthetic
- Flow lines indicating continuous cyclical movement
- Aerodynamic body position emphasis
- Professional endurance sports photography quality
- Motion blur on extremities to show speed and rhythm
- Background suggests outdoor athletic environment

ZONE & INTENSITY INDICATORS:
- Badge in top-right: ${zoneBadge}
- Color intensity matches training zone (lighter = easy, brighter = high intensity)
- Optional: Small HR or power indicator if relevant

CRITICAL: Show complete movement CYCLE, not just start/end positions. Emphasis on rhythm, efficiency, and aerobic form.`;

  return {
    prompt: enhancedPrompt,
    isDiptych: true,
    aspectRatio: '16:9'
  };
}

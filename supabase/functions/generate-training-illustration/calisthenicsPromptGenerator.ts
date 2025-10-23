/**
 * Calisthenics Prompt Generator
 * Specialized for bodyweight skills and street workout movements
 * Features: Body alignment lines, progression badges, lever visualization
 */

import { buildUniversalPrompt, type UniversalPromptParams } from './universalPromptGenerator.ts';

export interface CalisthenicsPromptParams {
  exerciseName: string;
  skillCategory: 'pull' | 'push' | 'legs' | 'core' | 'static' | 'dynamic';
  progression: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
  variant?: 'Tuck' | 'Advanced Tuck' | 'Straddle' | 'Full' | 'Weighted';
  holdDuration?: number;        // For static holds (seconds)
  repTarget?: number;           // For dynamic movements
  equipment?: string[];
}

/**
 * Detect skill type and movement pattern
 */
function detectSkillPattern(exerciseName: string, category: string): string {
  const lowerName = exerciseName.toLowerCase();

  // Static holds
  if (lowerName.includes('planche') || lowerName.includes('front lever') || lowerName.includes('back lever') ||
      lowerName.includes('l-sit') || lowerName.includes('handstand')) {
    return 'static_hold';
  }

  // Pull movements
  if (category === 'pull' || lowerName.includes('pull-up') || lowerName.includes('muscle-up') ||
      lowerName.includes('row')) {
    return 'pull_control';
  }

  // Push movements
  if (category === 'push' || lowerName.includes('push-up') || lowerName.includes('dip') ||
      lowerName.includes('hspu')) {
    return 'push_control';
  }

  // Leg movements
  if (category === 'legs' || lowerName.includes('squat') || lowerName.includes('pistol') ||
      lowerName.includes('shrimp')) {
    return 'leg_control';
  }

  // Dynamic skills
  if (category === 'dynamic' || lowerName.includes('muscle-up') || lowerName.includes('swing')) {
    return 'dynamic_transition';
  }

  return 'bodyweight_control';
}

/**
 * Generate calisthenics-specific arrow instructions
 */
function generateCalisthenicsArrows(pattern: string): string {
  const arrowConfigs: Record<string, { macro: string; micro: string[]; alignment: string }> = {
    static_hold: {
      macro: 'Short CYAN arrow (#06B6D4) showing center of mass position relative to support points',
      micro: [
        'Pivot point markers (wrist, shoulder, hip)',
        'Body alignment line: head → shoulder → hip (should be straight)',
        'Push/pull force vectors on hands showing balance'
      ],
      alignment: 'Critical horizontal body line from head to toes with alignment guide'
    },
    pull_control: {
      macro: 'Thick CYAN curved arrow showing pull trajectory toward body',
      micro: [
        'Scapular retraction arc and depression',
        'Elbow pull path (close to body)',
        'Body hollow position line'
      ],
      alignment: 'Body remains in hollow or straight line throughout movement'
    },
    push_control: {
      macro: 'Thick CYAN arrow showing push trajectory away from body',
      micro: [
        'Scapular protraction at top',
        'Elbow position and press path',
        'Body plank position line (head-hip-heel)'
      ],
      alignment: 'Straight body line maintained, no sagging hips or piking'
    },
    leg_control: {
      macro: 'Thick CYAN arrow showing descent and rise of center of mass',
      micro: [
        'Hip hinge or knee flexion arc',
        'Balance point over support foot',
        'Torso alignment (upright or leaning as needed)'
      ],
      alignment: 'Body remains balanced over base of support'
    },
    dynamic_transition: {
      macro: 'Thick CYAN curved arrow showing explosive pull-to-push transition',
      micro: [
        'Pull phase: scapular mechanics',
        'Transition: body swing or kip',
        'Push phase: lockout mechanics'
      ],
      alignment: 'Timing of phases clearly shown with numbered sequence'
    },
    bodyweight_control: {
      macro: 'Thick CYAN arrow showing controlled bodyweight movement path',
      micro: [
        'Primary joint action',
        'Stabilization points',
        'Body position control'
      ],
      alignment: 'Body alignment and control emphasis'
    }
  };

  const config = arrowConfigs[pattern] || arrowConfigs.bodyweight_control;

  return `CALISTHENICS-SPECIFIC ARROWS:

PANEL 1 (LEFT - ENTRY/STARTING POSITION):
- ${config.macro}
- Maximum 3 thin micro arrows (3-4px width, CYAN #06B6D4):
  * ${config.micro[0]}
  * ${config.micro[1]}
  * ${config.micro[2]}
- CRITICAL ALIGNMENT: ${config.alignment}
- Use thin LIGHT CYAN lines (#22D3EE) for body alignment guides
- Pivot points marked with small dots (•)

PANEL 2 (RIGHT - HOLD/FINISH POSITION):
- Same arrow system showing final position or hold
- Emphasize locked/stable position
- Show alignment checkpoints clearly
- Include small gray X if common error (e.g., "Hips should not sag", "Shoulders should not shrug")

BODY MECHANICS EMPHASIS:
- Draw clear line from head → shoulder → hip → heel
- Mark pivot points (wrists, shoulders, hips) with dots
- Show force distribution on contact points (hands, feet)
- Emphasize scapular position (retracted/protracted)`;
}

/**
 * Generate progression badge content
 */
function generateProgressionBadge(
  progression: string,
  variant?: string,
  holdDuration?: number,
  repTarget?: number
): string {
  let badgeContent = progression;

  if (variant) {
    badgeContent += ` | ${variant}`;
  }

  if (holdDuration) {
    badgeContent += ` | Hold: ${holdDuration}s`;
  }

  if (repTarget) {
    badgeContent += ` | Target: ${repTarget} reps`;
  }

  return badgeContent;
}

/**
 * Generate calisthenics-specific equipment
 */
function generateCalisthenicsEquipment(exerciseName: string, providedEquipment?: string[]): string[] {
  if (providedEquipment && providedEquipment.length > 0) {
    return providedEquipment;
  }

  const lowerName = exerciseName.toLowerCase();
  const equipment: string[] = [];

  if (lowerName.includes('pull-up') || lowerName.includes('muscle-up') || lowerName.includes('front lever') ||
      lowerName.includes('back lever')) {
    equipment.push('Pull-up bar or high bar');
  }

  if (lowerName.includes('ring')) {
    equipment.push('Gymnastic rings');
  }

  if (lowerName.includes('dip') || lowerName.includes('l-sit')) {
    equipment.push('Parallel bars or dip station');
  }

  if (lowerName.includes('handstand')) {
    equipment.push('Wall (for handstand) or open space');
  }

  if (lowerName.includes('planche')) {
    equipment.push('Parallettes or floor');
  }

  if (equipment.length === 0) {
    equipment.push('Minimal equipment or bodyweight only');
  }

  return equipment;
}

/**
 * Generate complete calisthenics prompt
 */
export function generateCalisthenicsPrompt(params: CalisthenicsPromptParams): {
  prompt: string;
  isDiptych: boolean;
  aspectRatio: '1:1' | '16:9';
} {
  const pattern = detectSkillPattern(params.exerciseName, params.skillCategory);
  const arrows = generateCalisthenicsArrows(pattern);
  const badge = generateProgressionBadge(params.progression, params.variant, params.holdDuration, params.repTarget);
  const equipment = generateCalisthenicsEquipment(params.exerciseName, params.equipment);

  // Build base prompt
  const universalParams: UniversalPromptParams = {
    exerciseName: params.exerciseName,
    discipline: 'calisthenics',
    equipment,
    metadata: {
      progression: params.progression,
      duration: params.holdDuration
    }
  };

  const basePrompt = buildUniversalPrompt(universalParams);

  // Enhance with calisthenics-specific details
  const enhancedPrompt = `${basePrompt.prompt}

${arrows}

CALISTHENICS VISUAL STYLE:
- High-precision technical drawing with fine lines
- Emphasis on body control and alignment
- Clean urban or minimalist background
- Street workout aesthetic with focus on athlete
- Professional gymnastic quality illustration
- Clear visibility of muscle engagement and body tension

BODY ALIGNMENT EMPHASIS:
- Draw visible alignment line (thin LIGHT CYAN dashed line) from head through shoulder, hip, to heel
- Mark pivot points with small dots (•): wrists, shoulders, hips
- Show force vectors on contact points (hands/feet) with small arrows
- Include ROM bracket markers at key body positions

PROGRESSION INDICATORS:
- Badge in bottom-left: ${badge}
- Show clear difference between progression levels if applicable
- Indicate optimal hold duration or rep quality

CRITICAL: This is PRECISION bodyweight control. Emphasize ALIGNMENT, TENSION, and CONTROLLED movement. Body should show active engagement, not passive hanging or loose form.`;

  return {
    prompt: enhancedPrompt,
    isDiptych: true,
    aspectRatio: '16:9'
  };
}

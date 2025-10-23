/**
 * Functional Training Prompt Generator
 * Specialized for Functional/CrossFit movements and WODs
 * Features: Explosive movement arrows, RX/Scaled badges, compound movement visualization
 */

import { buildUniversalPrompt, type UniversalPromptParams } from './universalPromptGenerator.ts';

export interface FunctionalPromptParams {
  exerciseName: string;
  movementType: 'olympic' | 'gymnastic' | 'monostructural' | 'compound';
  scaling?: 'RX' | 'Scaled' | 'Foundations';
  repScheme?: string;           // e.g., "21-15-9", "AMRAP", "EMOM"
  timeCap?: number;             // Time cap in minutes
  isUnbroken?: boolean;         // Unbroken requirement
  equipment?: string[];
}

/**
 * Detect movement pattern for functional exercises
 */
function detectFunctionalPattern(exerciseName: string, movementType: string): string {
  const lowerName = exerciseName.toLowerCase();

  // Olympic lifts
  if (movementType === 'olympic' || lowerName.includes('snatch') || lowerName.includes('clean') || lowerName.includes('jerk')) {
    return 'olympic_explosive';
  }

  // Gymnastic movements
  if (movementType === 'gymnastic' || lowerName.includes('pull-up') || lowerName.includes('muscle-up') || lowerName.includes('handstand')) {
    return 'gymnastic_control';
  }

  // Hinge patterns
  if (lowerName.includes('deadlift') || lowerName.includes('swing') || lowerName.includes('rdl')) {
    return 'hinge_explosive';
  }

  // Squat patterns
  if (lowerName.includes('squat') || lowerName.includes('thruster') || lowerName.includes('wall ball')) {
    return 'squat_power';
  }

  // Push/Press
  if (lowerName.includes('press') || lowerName.includes('push') || lowerName.includes('dip')) {
    return 'press_power';
  }

  // Pull
  if (lowerName.includes('row') || lowerName.includes('pull')) {
    return 'pull_power';
  }

  return 'compound_movement';
}

/**
 * Generate functional-specific arrow instructions
 */
function generateFunctionalArrows(pattern: string): string {
  const arrowConfigs: Record<string, { macro: string; micro: string[] }> = {
    olympic_explosive: {
      macro: 'Thick ORANGE arrow (#EA580C) showing explosive triple extension: hip-knee-ankle drive from ground to overhead',
      micro: [
        'Hip explosion arc showing powerful extension',
        'Shoulder shrug and high pull path',
        'Bar trajectory staying close to body'
      ]
    },
    gymnastic_control: {
      macro: 'Thick ORANGE arrow showing pull-to-push transition or body control path',
      micro: [
        'Scapular retraction during pull phase',
        'Hollow to arch body position',
        'Lockout and stability at finish'
      ]
    },
    hinge_explosive: {
      macro: 'Thick ORANGE curved arrow showing hip hinge pattern with explosive hip drive',
      micro: [
        'Hip hinge arc (main power source)',
        'Knee tracking and shin angle',
        'Neutral spine maintenance line'
      ]
    },
    squat_power: {
      macro: 'Thick ORANGE arrow showing descent and explosive drive from bottom position',
      micro: [
        'Hip crease below knee (depth marker)',
        'Knee tracking over toes',
        'Upright torso angle'
      ]
    },
    press_power: {
      macro: 'Thick ORANGE arrow showing powerful press from chest/shoulders to lockout',
      micro: [
        'Dip and drive if applicable',
        'Elbow position and press path',
        'Overhead lockout position'
      ]
    },
    pull_power: {
      macro: 'Thick ORANGE arrow showing powerful pull from extended to body',
      micro: [
        'Scapular retraction and depression',
        'Elbow path and finish position',
        'Hip engagement if compound pull'
      ]
    },
    compound_movement: {
      macro: 'Thick ORANGE arrow showing efficient compound movement path',
      micro: [
        'Primary joint action',
        'Force transfer through kinetic chain',
        'Stabilization points'
      ]
    }
  };

  const config = arrowConfigs[pattern] || arrowConfigs.compound_movement;

  return `FUNCTIONAL-SPECIFIC ARROWS:

PANEL 1 (LEFT - SETUP/START):
- ${config.macro}
- Maximum 3 thin micro arrows (5px width, ORANGE):
  * ${config.micro[0]}
  * ${config.micro[1]}
  * ${config.micro[2]}
- Solid ORANGE arrows (#EA580C)
- Emphasize explosive power transfer

PANEL 2 (RIGHT - PEAK/FINISH):
- Same arrows showing completion of movement
- Lockout or full range position
- Emphasis on control at finish
- Add small gray X if common error exists (e.g., "Torso should not lean excessively forward")

POWER INDICATORS:
- Thicker arrows = more force application
- Lightning bolt symbol near explosion point
- Force transfer lines through body (dotted LIGHT ORANGE #FB923C)`;
}

/**
 * Generate scaling and rep scheme badge
 */
function generateFunctionalBadge(
  scaling?: string,
  repScheme?: string,
  timeCap?: number,
  isUnbroken?: boolean
): string {
  let badgeContent = '';

  if (scaling) {
    badgeContent += scaling;
  }

  if (repScheme) {
    badgeContent += `${badgeContent ? ' | ' : ''}${repScheme}`;
  }

  if (timeCap) {
    badgeContent += `${badgeContent ? ' | ' : ''}${timeCap} min cap`;
  }

  if (isUnbroken) {
    badgeContent += `${badgeContent ? ' | ' : ''}Unbroken`;
  }

  return badgeContent || 'Functional Fitness';
}

/**
 * Generate functional-specific equipment context
 */
function generateFunctionalEquipment(exerciseName: string, providedEquipment?: string[]): string[] {
  if (providedEquipment && providedEquipment.length > 0) {
    return providedEquipment;
  }

  const lowerName = exerciseName.toLowerCase();
  const equipment: string[] = [];

  // Olympic bar movements
  if (lowerName.includes('barbell') || lowerName.includes('snatch') || lowerName.includes('clean')) {
    equipment.push('Olympic barbell with bumper plates');
  }

  // Kettlebell
  if (lowerName.includes('kettlebell') || lowerName.includes('swing')) {
    equipment.push('Kettlebell');
  }

  // Dumbbell
  if (lowerName.includes('dumbbell')) {
    equipment.push('Dumbbells');
  }

  // Wall ball
  if (lowerName.includes('wall ball') || lowerName.includes('ball')) {
    equipment.push('Medicine ball (wall ball)');
  }

  // Box
  if (lowerName.includes('box')) {
    equipment.push('Plyometric box');
  }

  // Pull-up bar
  if (lowerName.includes('pull-up') || lowerName.includes('toes to bar') || lowerName.includes('muscle-up')) {
    equipment.push('Pull-up bar or rig');
  }

  // Rings
  if (lowerName.includes('ring')) {
    equipment.push('Gymnastic rings');
  }

  // Rower
  if (lowerName.includes('row') && !lowerName.includes('barbell')) {
    equipment.push('Rowing machine (erg)');
  }

  // Assault bike
  if (lowerName.includes('bike') || lowerName.includes('assault')) {
    equipment.push('Assault bike or air bike');
  }

  if (equipment.length === 0) {
    equipment.push('Functional fitness equipment');
  }

  return equipment;
}

/**
 * Generate complete functional training prompt
 */
export function generateFunctionalPrompt(params: FunctionalPromptParams): {
  prompt: string;
  isDiptych: boolean;
  aspectRatio: '1:1' | '16:9';
} {
  const pattern = detectFunctionalPattern(params.exerciseName, params.movementType);
  const arrows = generateFunctionalArrows(pattern);
  const badge = generateFunctionalBadge(params.scaling, params.repScheme, params.timeCap, params.isUnbroken);
  const equipment = generateFunctionalEquipment(params.exerciseName, params.equipment);

  // Build base prompt
  const universalParams: UniversalPromptParams = {
    exerciseName: params.exerciseName,
    discipline: 'functional',
    equipment,
    metadata: {
      scaling: params.scaling
    }
  };

  const basePrompt = buildUniversalPrompt(universalParams);

  // Enhance with functional-specific details
  const enhancedPrompt = `${basePrompt.prompt}

${arrows}

FUNCTIONAL VISUAL STYLE:
- High-intensity CrossFit box environment
- Industrial athletic aesthetic
- Explosive power and movement quality emphasis
- Professional WOD photography quality
- Visible effort and intensity in athlete posture
- Background: functional training environment with rig/equipment visible

BADGES & STANDARDS:
- Badge in bottom-right: ${badge}
- Small "X" marker for common error (max 1): gray color, subtle
- Example errors to show: "Back should not round", "Hips should not shoot up first", "Bar should not loop away from body"

CRITICAL: Emphasize EFFICIENT power transfer and CYCLING speed. Show movement that maintains quality under fatigue. Professional competition-ready form.`;

  return {
    prompt: enhancedPrompt,
    isDiptych: true,
    aspectRatio: '16:9'
  };
}

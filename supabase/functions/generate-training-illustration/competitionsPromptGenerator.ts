/**
 * Competitions Prompt Generator
 * Specialized for fitness competition standards (HYROX, DEKA, Spartan, etc.)
 * Features: Judge standards, no-rep markers, official ROM requirements
 */

import { buildUniversalPrompt, type UniversalPromptParams } from './universalPromptGenerator.ts';

export interface CompetitionsPromptParams {
  exerciseName: string;
  competitionType: 'hyrox' | 'deka' | 'spartan' | 'crossfit' | 'general';
  standard: {
    load?: string;              // e.g., "20kg sled", "15kg wall ball"
    distance?: string;          // e.g., "50m", "100m"
    height?: string;            // e.g., "3m target", "24\" box"
    depthRequirement?: string;  // e.g., "hip crease below knee"
    lockoutRequirement?: string; // e.g., "full lockout required"
    touchRequirement?: string;  // e.g., "chest to ground", "hand to target"
  };
  noRepCriteria?: string[];    // Common no-rep faults
  equipment?: string[];
  // Enhanced visual metadata from exercise catalog DB
  visualKeywords?: string[];
  executionPhases?: string[];
  keyPositions?: string[];
  recommendedViewAngle?: string;
  recommendedVisualStyle?: string;
}

/**
 * Detect movement pattern for competition exercises
 */
function detectCompetitionPattern(exerciseName: string, competitionType: string): string {
  const lowerName = exerciseName.toLowerCase();

  // HYROX stations
  if (competitionType === 'hyrox') {
    if (lowerName.includes('sled') && lowerName.includes('push')) return 'sled_push';
    if (lowerName.includes('sled') && lowerName.includes('pull')) return 'sled_pull';
    if (lowerName.includes('burpee') && lowerName.includes('broad')) return 'burpee_broad_jump';
    if (lowerName.includes('rowing')) return 'rowing';
    if (lowerName.includes('ski')) return 'ski_erg';
    if (lowerName.includes('sandbag')) return 'sandbag_lunges';
    if (lowerName.includes('wall ball')) return 'wall_balls';
    if (lowerName.includes('farmer')) return 'farmers_carry';
  }

  // DEKA stations
  if (competitionType === 'deka') {
    if (lowerName.includes('bike')) return 'air_bike';
    if (lowerName.includes('floor')) return 'floor_to_overhead';
    if (lowerName.includes('box')) return 'box_jump';
    if (lowerName.includes('deadlift')) return 'deadlift';
    if (lowerName.includes('reverse')) return 'reverse_lunge';
  }

  // General competition movements
  if (lowerName.includes('wall ball')) return 'wall_balls';
  if (lowerName.includes('burpee')) return 'burpees';
  if (lowerName.includes('box')) return 'box_movements';
  if (lowerName.includes('thruster')) return 'thrusters';

  return 'competition_standard';
}

/**
 * Generate competition-specific arrow instructions with judge standards
 */
function generateCompetitionArrows(pattern: string, standard: CompetitionsPromptParams['standard']): string {
  const baseArrows: Record<string, { macro: string; micro: string[]; judgePoints: string[] }> = {
    sled_push: {
      macro: 'Thick YELLOW arrow (#EAB308) showing horizontal sled path with steady force application',
      micro: [
        'Body lean angle (typically 45°)',
        'Arm extension pushing handles',
        'Leg drive and stride pattern'
      ],
      judgePoints: [
        'Hands must stay on handles throughout',
        'Sled must reach target distance line',
        'No pulling or lifting allowed'
      ]
    },
    sled_pull: {
      macro: 'Thick YELLOW arrow showing backward pull trajectory',
      micro: [
        'Hand-over-hand rope pull technique',
        'Body position and balance',
        'Foot placement for stability'
      ],
      judgePoints: [
        'Rope must be pulled past marked line',
        'No stepping on rope',
        'Sled must reach target'
      ]
    },
    wall_balls: {
      macro: 'Thick YELLOW parabolic arrow from squat to target height',
      micro: [
        'Squat depth: hip crease below knee (bracket [)',
        'Ball trajectory to target',
        'Catch position at chest'
      ],
      judgePoints: [
        `Target hit at ${standard.height || '3m'} height`,
        'Full squat depth required (hip below knee)',
        'Ball must hit target line - no-rep if misses'
      ]
    },
    burpees: {
      macro: 'Thick YELLOW arrow showing full ground-to-jump sequence',
      micro: [
        'Chest and thighs touch ground (checkpoint)',
        'Full hip and knee extension at top',
        'Jump and reach or clap overhead'
      ],
      judgePoints: [
        'Chest must touch ground',
        'Full extension at top required',
        'Hands/touch must reach above head'
      ]
    },
    box_movements: {
      macro: 'Thick YELLOW arrow showing ascent to box with clear landing',
      micro: [
        'Jump trajectory to box top',
        'Hip extension at top (lockout)',
        'Controlled step down'
      ],
      judgePoints: [
        `Box height: ${standard.height || '24\"'}`,
        'Full hip and knee extension at top',
        'Step down - no jumping down'
      ]
    },
    thrusters: {
      macro: 'Thick YELLOW arrow showing squat-to-overhead path',
      micro: [
        'Front squat depth (hip below knee)',
        'Continuous drive to overhead',
        'Overhead lockout with bar over hips'
      ],
      judgePoints: [
        'Squat depth: hip crease below knee',
        'Bar must reach full lockout overhead',
        'Bar over or behind ears at finish'
      ]
    },
    competition_standard: {
      macro: 'Thick YELLOW arrow showing movement path with official standards',
      micro: [
        'Starting position checkpoint',
        'ROM requirement markers',
        'Finish position verification'
      ],
      judgePoints: [
        'Follow official movement standard',
        'Complete range of motion required',
        'Clear lockout or finish position'
      ]
    }
  };

  const config = baseArrows[pattern] || baseArrows.competition_standard;

  return `COMPETITION-SPECIFIC ARROWS:

PANEL 1 (LEFT - BOTTOM/START POSITION):
- ${config.macro}
- Maximum 3 thin micro arrows (5px width, YELLOW #EAB308):
  * ${config.micro[0]}
  * ${config.micro[1]}
  * ${config.micro[2]}
- ROM DEPTH MARKERS: Use brackets [ ] at required depth/positions
${standard.depthRequirement ? `- DEPTH STANDARD: ${standard.depthRequirement}` : ''}
- All arrows YELLOW (#EAB308) with high visibility

PANEL 2 (RIGHT - TOP/FINISH POSITION):
- Same arrows showing lockout or finish
${standard.lockoutRequirement ? `- LOCKOUT STANDARD: ${standard.lockoutRequirement}` : ''}
${standard.touchRequirement ? `- TOUCH STANDARD: ${standard.touchRequirement}` : ''}
- Clear checkmark (✓) if position meets standard
- NO-REP indicator (⚠︎) position shown if applicable

JUDGE VERIFICATION POINTS:
${config.judgePoints.map(point => `- ${point}`).join('\n')}

COMPETITION MARKERS:
- Target height lines with measurement (e.g., "3m target line")
- Distance markers if applicable
- Depth brackets [ ] at hip crease for squat movements
- Lockout checkpoint (•) at full extension points`;
}

/**
 * Generate competition badge with standards
 */
function generateCompetitionBadge(
  competitionType: string,
  standard: CompetitionsPromptParams['standard']
): string {
  let badgeContent = competitionType.toUpperCase();

  if (standard.load) {
    badgeContent += ` | ${standard.load}`;
  }

  if (standard.distance) {
    badgeContent += ` | ${standard.distance}`;
  }

  if (standard.height) {
    badgeContent += ` | Target: ${standard.height}`;
  }

  return badgeContent;
}

/**
 * Generate no-rep criteria visual
 */
function generateNoRepSection(noRepCriteria?: string[]): string {
  if (!noRepCriteria || noRepCriteria.length === 0) {
    return '';
  }

  const criteriaList = noRepCriteria.slice(0, 2).map(criteria =>
    `- ⚠︎ NO-REP if: ${criteria}`
  ).join('\n');

  return `\nNO-REP INDICATORS:\n${criteriaList}\n- Show with small yellow warning triangle (⚠︎)\n- Position near the fault point`;
}

/**
 * Generate competition-specific equipment
 */
function generateCompetitionEquipment(
  exerciseName: string,
  competitionType: string,
  standard: CompetitionsPromptParams['standard'],
  providedEquipment?: string[]
): string[] {
  if (providedEquipment && providedEquipment.length > 0) {
    return providedEquipment;
  }

  const lowerName = exerciseName.toLowerCase();
  const equipment: string[] = [];

  // Add competition-specific equipment
  if (lowerName.includes('sled')) {
    equipment.push(`Weighted sled${standard.load ? ` (${standard.load})` : ''}`);
  }

  if (lowerName.includes('wall ball')) {
    equipment.push(`Medicine ball${standard.load ? ` (${standard.load})` : ' (9kg/6kg)'}`);
    equipment.push(`Target at ${standard.height || '3m'}`);
  }

  if (lowerName.includes('box')) {
    equipment.push(`Plyometric box${standard.height ? ` (${standard.height})` : ' (24\"/20\")'}`);
  }

  if (lowerName.includes('barbell') || lowerName.includes('thruster') || lowerName.includes('clean')) {
    equipment.push(`Barbell${standard.load ? ` (${standard.load})` : ''}`);
  }

  if (lowerName.includes('dumbbell')) {
    equipment.push(`Dumbbells${standard.load ? ` (${standard.load})` : ''}`);
  }

  if (lowerName.includes('sandbag')) {
    equipment.push(`Sandbag${standard.load ? ` (${standard.load})` : ' (20kg)'}`);
  }

  if (equipment.length === 0) {
    equipment.push('Competition-standard equipment');
  }

  return equipment;
}

/**
 * Generate complete competitions prompt
 */
export function generateCompetitionsPrompt(params: CompetitionsPromptParams): {
  prompt: string;
  isDiptych: boolean;
  aspectRatio: '1:1' | '16:9';
} {
  const pattern = detectCompetitionPattern(params.exerciseName, params.competitionType);
  const arrows = generateCompetitionArrows(pattern, params.standard);
  const badge = generateCompetitionBadge(params.competitionType, params.standard);
  const noRep = generateNoRepSection(params.noRepCriteria);
  const equipment = generateCompetitionEquipment(
    params.exerciseName,
    params.competitionType,
    params.standard,
    params.equipment
  );

  // Build base prompt
  const universalParams: UniversalPromptParams = {
    exerciseName: params.exerciseName,
    discipline: 'competitions',
    equipment,
    metadata: {
      standard: badge
    }
  };

  const basePrompt = buildUniversalPrompt(universalParams);

  // Enhance with competition-specific details
  const enhancedPrompt = `${basePrompt.prompt}

${arrows}

${noRep}

COMPETITION VISUAL STYLE:
- Professional competition documentation quality
- Clear judge perspective with visibility of all standards
- Bright, high-contrast imagery for event environment
- Official timing and measurement markers visible
- Professional race photography aesthetic
- Emphasis on CLEAR STANDARDS for judges

OFFICIAL STANDARDS EMPHASIS:
- Badge in top-right: ${badge}
- ROM markers MUST be clearly visible with brackets and measurements
- Target heights/distances marked with lines and labels
- Lockout positions shown with checkpoint dots (•)
- No-rep positions indicated with warning symbol (⚠︎)

CRITICAL: This is COMPETITION STANDARD visualization. Every movement must show EXACTLY what a judge will verify. ROM markers, target heights, lockout positions must be CRYSTAL CLEAR. Show both good rep (✓) and no-rep indicators (⚠︎) if applicable.`;

  return {
    prompt: enhancedPrompt,
    isDiptych: true,
    aspectRatio: '16:9'
  };
}

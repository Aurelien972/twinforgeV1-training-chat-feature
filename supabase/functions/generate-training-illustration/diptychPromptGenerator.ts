/**
 * Diptych Prompt Generator for Force/Powerbuilding Exercises
 * Generates enriched prompts with 2 panels, arrows, and muscle highlights
 */

export interface DiptychPromptParams {
  exerciseName: string;
  muscleGroups?: string[];
  equipment?: string[];
  movementPattern?: string;
}

interface MuscleMapping {
  [key: string]: string;
}

const MUSCLE_NAME_MAP: MuscleMapping = {
  quadriceps: 'quadriceps femoris',
  quads: 'quadriceps femoris',
  glutes: 'gluteus maximus',
  gluteus: 'gluteus maximus',
  hamstrings: 'biceps femoris and semitendinosus',
  ischio: 'biceps femoris',
  pectoraux: 'pectoralis major',
  pecs: 'pectoralis major',
  chest: 'pectoralis major',
  dorsaux: 'latissimus dorsi',
  lats: 'latissimus dorsi',
  back: 'latissimus dorsi',
  epaules: 'deltoids',
  shoulders: 'deltoids',
  delts: 'deltoids',
  biceps: 'biceps brachii',
  triceps: 'triceps brachii',
  abdominaux: 'rectus abdominis',
  abs: 'rectus abdominis',
  core: 'rectus abdominis and obliques',
  trapeze: 'trapezius',
  traps: 'trapezius',
  calves: 'gastrocnemius',
  mollets: 'gastrocnemius'
};

const MOVEMENT_ARROW_CONFIG: Record<string, { macro: string; micro: string[] }> = {
  push: {
    macro: 'thick solid red arrow showing upward pushing motion from chest level to full extension',
    micro: ['thin red arrows at shoulders showing rotation', 'thin red arrows at elbows showing extension']
  },
  pull: {
    macro: 'thick solid red arrow showing pulling motion toward body from extended to contracted position',
    micro: ['thin red arrows at shoulders showing retraction', 'thin red arrows at elbows showing flexion']
  },
  squat: {
    macro: 'thick solid red arrow showing vertical descent and ascent of barbell path',
    micro: ['thin red arrows at hips showing flexion/extension', 'thin red arrows at knees showing bending angle', 'thin red arrows at ankles showing dorsiflexion']
  },
  hinge: {
    macro: 'thick solid red curved arrow showing hip hinge pattern from standing to bent position',
    micro: ['thin red arrows at hips showing main hinge point', 'thin red arrows at lower back showing neutral spine maintenance']
  },
  press: {
    macro: 'thick solid red arrow showing pressing motion from shoulder to overhead lockout',
    micro: ['thin red arrows at shoulders showing elevation', 'thin red arrows at elbows showing extension']
  },
  row: {
    macro: 'thick solid red arrow showing horizontal pull from extended arms to body',
    micro: ['thin red arrows at scapula showing retraction', 'thin red arrows at elbows showing pull']
  }
};

function normalizeMuscleNames(muscles: string[]): string[] {
  return muscles.map(muscle => {
    const normalized = muscle.toLowerCase().trim();
    return MUSCLE_NAME_MAP[normalized] || normalized;
  });
}

function determineMovementPattern(exerciseName: string, providedPattern?: string): string {
  if (providedPattern) {
    return providedPattern.toLowerCase();
  }

  const name = exerciseName.toLowerCase();

  if (name.includes('squat')) return 'squat';
  if (name.includes('deadlift') || name.includes('soulev') || name.includes('rdl')) return 'hinge';
  if (name.includes('press') || name.includes('bench') || name.includes('développé')) return 'push';
  if (name.includes('row') || name.includes('rowing') || name.includes('tirage')) return 'pull';
  if (name.includes('curl')) return 'pull';
  if (name.includes('extension')) return 'push';
  if (name.includes('shoulder') || name.includes('épaule')) return 'press';

  return 'push';
}

function generateArrowInstructions(movementPattern: string): string {
  const config = MOVEMENT_ARROW_CONFIG[movementPattern] || MOVEMENT_ARROW_CONFIG.push;

  return `
PANEL 1 (LEFT SIDE - STARTING POSITION):
- ${config.macro} showing concentric phase (lifting/pushing)
- Maximum 3 thin micro arrows: ${config.micro.slice(0, 3).join(', ')}
- ALL arrows MUST be solid red color (#FF0000)
- Arrows MUST be thick and clearly visible (minimum 8px width for macro, 4px for micro)
- Add small bracket marks [ ] at start and end of range of motion

PANEL 2 (RIGHT SIDE - END POSITION):
- Same ${config.macro.replace('red', 'blue').replace('solid', 'dashed')} showing eccentric phase (lowering/returning)
- Same 3 thin micro arrows but DASHED and BLUE color (#0066FF)
- Arrows show return path to starting position
- Add small bracket marks [ ] at ROM endpoints
- Maintain EXACT same camera angle and scale as Panel 1`;
}

function generateMuscleHighlightInstruction(muscles: string[]): string {
  if (!muscles || muscles.length === 0) {
    return '';
  }

  const anatomicalNames = normalizeMuscleNames(muscles);

  return `
MUSCLE HIGHLIGHTING (BOTH PANELS):
- Apply semi-transparent RED overlay (opacity 30%, color #FF0000) to highlight active muscles:
  ${anatomicalNames.map(m => `* ${m}`).join('\n  ')}
- Overlay must be anatomically accurate on realistic muscle structure
- Keep overlay subtle to maintain anatomical detail visibility
- Use gradient edges for natural blending with surrounding tissue`;
}

/**
 * Generate equipment-specific context based on exercise and available equipment
 */
function generateEquipmentContext(exerciseName: string, equipment: string[] | undefined): string {
  const lowerName = exerciseName.toLowerCase();

  // CRITICAL: Defensive programming - ensure equipment is always an array
  const safeEquipment = Array.isArray(equipment) ? equipment : [];
  const hasEquipment = safeEquipment.length > 0;

  // Build equipment list from provided data
  let equipmentList: string[] = [];

  if (hasEquipment) {
    // Use provided equipment - ensure all items are strings
    equipmentList = safeEquipment.map(eq => String(eq).toLowerCase());
  } else {
    // Infer from exercise name
    if (lowerName.includes('barbell') || lowerName.includes('barre')) {
      equipmentList.push('olympic barbell with weight plates');
    } else if (lowerName.includes('dumbbell') || lowerName.includes('haltère')) {
      equipmentList.push('dumbbells');
    } else if (lowerName.includes('cable') || lowerName.includes('poulie') || lowerName.includes('câble')) {
      equipmentList.push('cable machine with handles');
    } else if (lowerName.includes('machine')) {
      equipmentList.push('professional strength machine');
    } else if (lowerName.includes('kettlebell')) {
      equipmentList.push('kettlebell');
    } else if (lowerName.includes('box') || lowerName.includes('saut')) {
      equipmentList.push('plyometric box');
    } else if (lowerName.includes('pull') || lowerName.includes('chin') || lowerName.includes('traction')) {
      equipmentList.push('pull-up bar');
    } else if (lowerName.includes('dip')) {
      equipmentList.push('dip station or parallel bars');
    } else {
      equipmentList.push('barbell and weight plates');
    }
  }

  // Add exercise-specific rack/bench requirements
  let supportEquipment = '';
  if (lowerName.includes('squat')) {
    supportEquipment = '\n- Power rack with safety bars and J-hooks';
  } else if (lowerName.includes('bench press') || lowerName.includes('développé couché')) {
    supportEquipment = '\n- Flat bench with upright supports';
  } else if (lowerName.includes('incline') || lowerName.includes('incliné')) {
    supportEquipment = '\n- Adjustable incline bench';
  } else if (lowerName.includes('row') && lowerName.includes('barbell')) {
    supportEquipment = '\n- Platform or lifting area for proper stance';
  }

  const mainEquipment = equipmentList.length > 0
    ? equipmentList.map(eq => `- ${eq.charAt(0).toUpperCase() + eq.slice(1)}`).join('\n')
    : '- Barbell and weight plates';

  return `${mainEquipment}${supportEquipment}`;
}

export function generateForceDiptychPrompt(params: DiptychPromptParams): string {
  const { exerciseName, muscleGroups = [], equipment = [], movementPattern } = params;

  const detectedPattern = determineMovementPattern(exerciseName, movementPattern);
  const arrowInstructions = generateArrowInstructions(detectedPattern);
  const muscleInstructions = generateMuscleHighlightInstruction(muscleGroups);

  // Enhanced equipment detection with exercise-specific context
  const equipmentContext = generateEquipmentContext(exerciseName, equipment);

  const prompt = `Professional fitness technical illustration DIPTYCH (2 panels side-by-side):

SUBJECT: ${exerciseName}
FORMAT: Panoramic 16:9 ratio (1536x1024 pixels), TWO EQUAL PANELS separated by thin vertical line

STYLE:
- Black and white anatomical drawing style
- Realistic muscular anatomy without exaggeration
- Clean gray neutral background
- Studio lighting with clear shadows
- Educational fitness diagram aesthetic
- Single male athlete in both panels

EQUIPMENT & CONTEXT:
${equipmentContext}
- Professional gym setting with proper lighting

PANEL LAYOUT:
┌─────────────────────────────────────────────────┐
│  PANEL 1: START     │    PANEL 2: END           │
│  (Concentric Phase) │   (Eccentric Phase)       │
│  ● Red solid arrows │   ● Blue dashed arrows    │
│  ● Starting position│   ● Ending position       │
└─────────────────────────────────────────────────┘

${arrowInstructions}

ARROW SYSTEM REQUIREMENTS:
- MACRO ARROW: 1 thick arrow (minimum 10px width) showing primary barbell/body trajectory
- MICRO ARROWS: Maximum 3 thin arrows (4-6px width) showing joint rotations
- Color code: RED = concentric (lifting), BLUE = eccentric (lowering), GRAY = stability cues
- Style: Solid lines for concentric, Dashed lines for eccentric
- Arrows MUST be bold and clearly visible against background

${muscleInstructions}

CAMERA & COMPOSITION:
- Side profile view (or 3/4 angle if movement requires)
- Same exact camera angle, distance, and athlete position in BOTH panels
- Athlete centered in each panel
- Clear visibility of form and technique
- Professional fitness poster quality

TECHNICAL REQUIREMENTS:
- 16:9 aspect ratio (WIDE format for 2 panels)
- High contrast for clarity
- Sharp edges and clean lines
- No text labels or annotations beyond bracket marks for ROM
- Both panels MUST show same athlete, same equipment, same background

CRITICAL: This must be a DIPTYCH with 2 distinct panels showing movement progression from start (left) to finish (right).`;

  return prompt;
}

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

/**
 * Movement Arrow Configuration - OPTIMIZED FOR COHERENCE
 * Each config defines PRECISE geometric arrow directions for Panel 1 and Panel 2
 */
const MOVEMENT_ARROW_CONFIG: Record<string, {
  panel1Position: string;
  panel2Position: string;
  macroArrow: { direction: string; color: string; style: string };
  microArrows: string[];
}> = {
  // PUSH VERTICAL (Shoulder Press, Overhead Press)
  'push-vertical': {
    panel1Position: 'Arms bent at 90 degrees, weight at shoulder level (STARTING POSITION - MUSCLE STRETCHED)',
    panel2Position: 'Arms fully extended overhead, weight locked out above head (ENDING POSITION - MUSCLE CONTRACTED)',
    macroArrow: {
      direction: 'PERFECTLY VERTICAL UPWARD arrow (10px thick) from shoulder height to overhead lockout position',
      color: 'SOLID RED (#FF0000) in Panel 1',
      style: 'Straight vertical line, no curves'
    },
    microArrows: [
      'Thin straight arrow at elbow showing extension from 90° to 180°',
      'Thin straight arrow at shoulder showing upward elevation'
    ]
  },

  // PUSH HORIZONTAL (Bench Press, Push-ups)
  'push-horizontal': {
    panel1Position: 'Barbell touching chest, elbows bent at 90 degrees (STARTING POSITION - MUSCLE STRETCHED)',
    panel2Position: 'Arms fully extended, barbell at arms length above chest (ENDING POSITION - MUSCLE CONTRACTED)',
    macroArrow: {
      direction: 'PERFECTLY VERTICAL UPWARD arrow (10px thick) perpendicular to body from chest to arms extension',
      color: 'SOLID RED (#FF0000) in Panel 1',
      style: 'Straight vertical line relative to gravity, no curves'
    },
    microArrows: [
      'Thin straight arrow at elbow showing extension',
      'Thin straight arrow at shoulder showing horizontal adduction'
    ]
  },

  // PULL VERTICAL (Pull-ups, Lat Pulldown)
  'pull-vertical': {
    panel1Position: 'Arms fully extended upward, hanging from bar or holding cable handle high (STARTING POSITION - MUSCLE STRETCHED)',
    panel2Position: 'Elbows pulled down to sides, bar at chin level or cable pulled to chest (ENDING POSITION - MUSCLE CONTRACTED)',
    macroArrow: {
      direction: 'PERFECTLY VERTICAL DOWNWARD arrow (10px thick) from extended arms position to pulled position',
      color: 'SOLID RED (#FF0000) in Panel 1',
      style: 'Straight vertical line downward, no curves'
    },
    microArrows: [
      'Thin straight arrow at elbow showing flexion from 180° to 90°',
      'Thin straight arrow at shoulder showing depression and retraction'
    ]
  },

  // PULL HORIZONTAL (Seated Row, Barbell Row)
  'pull-horizontal': {
    panel1Position: 'Arms fully extended forward, holding handle or barbell away from body (STARTING POSITION - MUSCLE STRETCHED)',
    panel2Position: 'Elbows pulled back behind torso, handle or barbell against abdomen/chest (ENDING POSITION - MUSCLE CONTRACTED)',
    macroArrow: {
      direction: 'PERFECTLY HORIZONTAL BACKWARD arrow (10px thick) from extended arms to pulled position toward body',
      color: 'SOLID RED (#FF0000) in Panel 1',
      style: 'Straight horizontal line parallel to ground, no curves'
    },
    microArrows: [
      'Thin straight arrow at elbow showing flexion',
      'Thin straight arrow at shoulder blade showing retraction'
    ]
  },

  // SQUAT (Back Squat, Front Squat)
  squat: {
    panel1Position: 'Full depth squat position: hip crease BELOW knee level, thighs parallel or below parallel to ground (STARTING POSITION - BOTTOM)',
    panel2Position: 'Standing upright position: knees and hips fully extended, barbell overhead or on shoulders (ENDING POSITION - TOP)',
    macroArrow: {
      direction: 'PERFECTLY VERTICAL UPWARD arrow (10px thick) showing barbell ascending from bottom to top position',
      color: 'SOLID RED (#FF0000) in Panel 1',
      style: 'Straight vertical line upward, no curves'
    },
    microArrows: [
      'Thin straight arrow at knee showing extension from flexed to straight',
      'Thin straight arrow at hip showing extension from flexed to straight'
    ]
  },

  // HINGE (Deadlift, Romanian Deadlift)
  hinge: {
    panel1Position: 'Barbell on ground or at shin level, torso hinged forward at hips, knees slightly bent (STARTING POSITION - BOTTOM)',
    panel2Position: 'Standing fully upright, hips and knees extended, barbell at hip level (ENDING POSITION - TOP)',
    macroArrow: {
      direction: 'PERFECTLY VERTICAL UPWARD arrow (10px thick) showing barbell path from ground to hip level',
      color: 'SOLID RED (#FF0000) in Panel 1',
      style: 'Straight vertical line close to body, no curves'
    },
    microArrows: [
      'Thin straight arrow at hip showing extension from bent to straight',
      'Thin horizontal arrow along spine showing neutral position maintenance'
    ]
  },

  // EXTENSION (Triceps Extension, Leg Extension)
  extension: {
    panel1Position: 'Joint fully flexed, weight at starting position near body (STARTING POSITION - MUSCLE STRETCHED)',
    panel2Position: 'Joint fully extended, weight pushed away from body (ENDING POSITION - MUSCLE CONTRACTED)',
    macroArrow: {
      direction: 'STRAIGHT arrow (10px thick) in the direction of extension from flexed to extended position',
      color: 'SOLID RED (#FF0000) in Panel 1',
      style: 'Straight line following the extension path, no curves'
    },
    microArrows: [
      'Thin straight arrow at primary joint showing extension angle change'
    ]
  },

  // CURL (Biceps Curl, Hamstring Curl)
  curl: {
    panel1Position: 'Arms or legs fully extended, weight at starting position away from body (STARTING POSITION - MUSCLE STRETCHED)',
    panel2Position: 'Joint fully flexed, weight curled toward body (ENDING POSITION - MUSCLE CONTRACTED)',
    macroArrow: {
      direction: 'CURVED arrow (10px thick) following the curling motion from extended to flexed position',
      color: 'SOLID RED (#FF0000) in Panel 1',
      style: 'Smooth arc following joint rotation, minimal curve'
    },
    microArrows: [
      'Thin curved arrow at joint showing flexion arc'
    ]
  }
};

function normalizeMuscleNames(muscles: string[]): string[] {
  return muscles.map(muscle => {
    const normalized = muscle.toLowerCase().trim();
    return MUSCLE_NAME_MAP[normalized] || normalized;
  });
}

/**
 * Determine precise movement pattern with sub-categorization
 * Returns specific pattern keys that map to exact arrow configurations
 */
function determineMovementPattern(exerciseName: string, providedPattern?: string): string {
  if (providedPattern) {
    return providedPattern.toLowerCase();
  }

  const name = exerciseName.toLowerCase();

  // SQUAT patterns
  if (name.includes('squat')) return 'squat';

  // HINGE patterns (Deadlifts)
  if (name.includes('deadlift') || name.includes('soulev') || name.includes('rdl') ||
      name.includes('soulevé de terre')) return 'hinge';

  // PUSH VERTICAL (Overhead Press)
  if (name.includes('shoulder press') || name.includes('military press') ||
      name.includes('overhead press') || name.includes('développé militaire') ||
      name.includes('développé épaules')) return 'push-vertical';

  // PUSH HORIZONTAL (Bench Press, Push-ups)
  if (name.includes('bench press') || name.includes('développé couché') ||
      name.includes('push-up') || name.includes('pompe') ||
      name.includes('chest press') || name.includes('développé incliné')) return 'push-horizontal';

  // PULL VERTICAL (Pull-ups, Lat Pulldown)
  if (name.includes('pull-up') || name.includes('pulldown') || name.includes('traction') ||
      name.includes('tirage vertical') || name.includes('lat pull')) return 'pull-vertical';

  // PULL HORIZONTAL (Rows)
  if (name.includes('row') || name.includes('rowing') || name.includes('tirage horizontal') ||
      name.includes('rameur') || name.includes('tirage assis')) return 'pull-horizontal';

  // CURL patterns
  if (name.includes('curl') || name.includes('flexion')) return 'curl';

  // EXTENSION patterns
  if (name.includes('extension') || name.includes('triceps')) return 'extension';

  // Default fallback
  if (name.includes('press') || name.includes('développé')) return 'push-horizontal';
  if (name.includes('pull') || name.includes('tirage')) return 'pull-horizontal';

  return 'push-horizontal';
}

/**
 * Generate PRECISE arrow instructions with exact positioning
 * CRITICAL: This function ensures arrows match the actual movement direction
 */
function generateArrowInstructions(movementPattern: string): string {
  const config = MOVEMENT_ARROW_CONFIG[movementPattern] || MOVEMENT_ARROW_CONFIG['push-horizontal'];

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL POSITIONING REQUIREMENTS - PANEL 1 vs PANEL 2:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PANEL 1 (LEFT SIDE - STARTING/STRETCHED POSITION):
ATHLETE POSITION: ${config.panel1Position}

ARROWS IN PANEL 1:
• MACRO ARROW (PRIMARY): ${config.macroArrow.direction}
  - Color: ${config.macroArrow.color}
  - Style: ${config.macroArrow.style}
  - Width: EXACTLY 10 pixels thick
  - Must be PERFECTLY STRAIGHT (no curves unless specified)
  - Arrow points in the direction of CONCENTRIC movement (muscle contraction)

• MICRO ARROWS (MAXIMUM 2):
${config.microArrows.slice(0, 2).map((arrow, i) => `  ${i + 1}. ${arrow} - 4px width, SOLID RED (#FF0000)`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PANEL 2 (RIGHT SIDE - ENDING/CONTRACTED POSITION):
ATHLETE POSITION: ${config.panel2Position}

ARROWS IN PANEL 2:
• MACRO ARROW (PRIMARY): SAME direction as Panel 1 but DASHED and BLUE
  - Direction: ${config.macroArrow.direction.replace('SOLID RED', 'DASHED BLUE')}
  - Color: DASHED BLUE (#0066FF)
  - Style: Dashed line (5px dash, 3px gap)
  - Width: EXACTLY 10 pixels thick
  - Arrow points in the direction of ECCENTRIC movement (muscle lengthening/return)

• MICRO ARROWS (MAXIMUM 2):
${config.microArrows.slice(0, 2).map((arrow, i) => `  ${i + 1}. ${arrow} - 4px width, DASHED BLUE (#0066FF)`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- The athlete's body position MUST BE CLEARLY DIFFERENT between Panel 1 and Panel 2
- Panel 1 shows STARTING position (muscle stretched, weight away)
- Panel 2 shows ENDING position (muscle contracted, weight close)
- Camera angle, equipment position, background: IDENTICAL in both panels
- ONLY the athlete's body and limb positions change between panels
- Arrows must clearly indicate the path of movement
- NO curved arrows unless explicitly specified in config
- ALL arrows must be clearly visible against the gray background`;
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
 * Generate ULTRA-PRECISE equipment descriptions
 * CRITICAL: Equipment must be described with exact specifications to ensure consistency
 */
function generateEquipmentContext(exerciseName: string, equipment: string[]): string {
  const lowerName = exerciseName.toLowerCase();
  const hasEquipment = equipment && equipment.length > 0;

  let equipmentDescription = '';

  // CABLE MACHINE exercises (Pulldown, Cable Row, Triceps Extension, Cable Fly)
  if (lowerName.includes('cable') || lowerName.includes('poulie') || lowerName.includes('câble') ||
      lowerName.includes('pulldown') || lowerName.includes('tirage')) {

    if (lowerName.includes('high') || lowerName.includes('pulldown') || lowerName.includes('vertical') ||
        lowerName.includes('triceps') || lowerName.includes('extension')) {
      // High cable/pulley
      equipmentDescription = `- Cable machine with HIGH pulley attachment (positioned at 2.5 meters height)
- Straight bar handle or rope attachment
- Weight stack positioned at base of machine
- Professional cable column with smooth pulley system
- Athlete stands or sits directly in front of machine`;
    } else if (lowerName.includes('low') || lowerName.includes('row') || lowerName.includes('rameur') ||
               lowerName.includes('seated') || lowerName.includes('assis')) {
      // Low cable/seated row
      equipmentDescription = `- Cable machine with LOW pulley attachment (positioned at floor level)
- Seated row bench with footrest platform (fixed position)
- V-bar handle or straight bar attachment
- Weight stack positioned at base of machine behind athlete
- Professional cable row station with stable bench`;
    } else {
      // Generic cable machine
      equipmentDescription = `- Adjustable cable machine with pulley at mid-height
- Professional cable station with weight stack
- Standard cable handle attachment
- Stable machine frame with clear cable path`;
    }
  }

  // BARBELL exercises
  else if (lowerName.includes('barbell') || lowerName.includes('barre')) {
    if (lowerName.includes('squat')) {
      equipmentDescription = `- Olympic barbell (20kg, 2.2m length) with weight plates
- Power rack with adjustable J-hooks at shoulder height
- Safety bars positioned just below squat depth
- Rubber platform flooring
- Barbell positioned on upper back (high bar) or lower traps (low bar)`;
    } else if (lowerName.includes('bench') || lowerName.includes('développé couché')) {
      equipmentDescription = `- Olympic barbell (20kg, 2.2m length) with weight plates
- Flat bench press bench with vertical uprights
- Uprights positioned to allow proper bar path
- Stable bench with non-slip surface
- Barbell positioned at chest level when lying down`;
    } else if (lowerName.includes('deadlift') || lowerName.includes('soulevé')) {
      equipmentDescription = `- Olympic barbell (20kg, 2.2m length) with standard weight plates
- Rubber lifting platform or gym floor
- Barbell positioned horizontally on ground
- Weight plates touching floor in starting position
- No rack or supports (barbell starts from ground)`;
    } else if (lowerName.includes('row') || lowerName.includes('rowing')) {
      equipmentDescription = `- Olympic barbell (20kg, 2.2m length) with weight plates
- Open floor space or platform for bent-over position
- Barbell positioned horizontally
- No bench or rack required
- Athlete in bent-over stance with barbell hanging`;
    } else {
      equipmentDescription = `- Olympic barbell (20kg, 2.2m length) with weight plates
- Professional gym setting with appropriate support equipment
- Barbell positioned according to exercise requirements`;
    }
  }

  // DUMBBELL exercises
  else if (lowerName.includes('dumbbell') || lowerName.includes('haltère')) {
    if (lowerName.includes('bench') || lowerName.includes('press') || lowerName.includes('fly')) {
      equipmentDescription = `- Pair of identical dumbbells (same weight and size)
- Flat or adjustable bench with stable base
- Dumbbells held at chest level or extended position
- Professional rubber or metal dumbbells
- Bench positioned horizontally for lying position`;
    } else if (lowerName.includes('row')) {
      equipmentDescription = `- Single dumbbell (or pair for bilateral)
- Flat bench for support (if single-arm)
- Professional hex or round dumbbells
- Stable bench with non-slip surface
- Dumbbell positioned for rowing motion`;
    } else {
      equipmentDescription = `- Pair of identical dumbbells (professional grade)
- Open space for movement execution
- Dumbbells with secure grip handles
- Appropriate weight selection visible`;
    }
  }

  // MACHINE exercises (non-cable)
  else if (lowerName.includes('machine') && !lowerName.includes('cable')) {
    if (lowerName.includes('leg')) {
      equipmentDescription = `- Professional leg press or leg extension machine
- Padded seat with backrest at appropriate angle
- Adjustable foot platform or leg pad
- Weight stack with selector pin visible
- Machine frame clearly visible and stable`;
    } else if (lowerName.includes('chest') || lowerName.includes('pectoral')) {
      equipmentDescription = `- Chest press machine with padded seat
- Adjustable handles or press arms
- Backrest positioned for proper pressing angle
- Weight stack at side or rear of machine
- Professional commercial grade machine`;
    } else {
      equipmentDescription = `- Professional strength training machine
- Padded seat and backrest (if applicable)
- Adjustable components for proper fit
- Weight stack with clear selector system
- Stable machine frame clearly visible`;
    }
  }

  // BODYWEIGHT exercises
  else if (lowerName.includes('pull-up') || lowerName.includes('chin') || lowerName.includes('traction')) {
    equipmentDescription = `- Professional pull-up bar (horizontal, 2.2-2.5m height)
- Sturdy frame or wall-mounted bar
- Bar diameter: 28-32mm for proper grip
- Sufficient clearance above and below bar
- No bench or platform (athlete hangs freely)`;
  } else if (lowerName.includes('dip')) {
    equipmentDescription = `- Parallel dip bars (width: 50-60cm apart)
- Bars at same height (approximately waist to chest level)
- Stable frame with no wobble
- Sufficient space for full range of motion
- Professional dip station or power rack attachment`;
  }

  // DEFAULT/FALLBACK
  else {
    if (hasEquipment && equipment.length > 0) {
      equipmentDescription = equipment.map(eq => `- ${eq.charAt(0).toUpperCase() + eq.slice(1)}`).join('\n');
    } else {
      equipmentDescription = `- Standard gym equipment appropriate for exercise
- Professional grade strength training equipment
- Stable and secure setup for safe execution`;
    }
  }

  return equipmentDescription;
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUAL STYLE & RENDERING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Black and white anatomical drawing style
- Realistic muscular anatomy without exaggeration
- Clean neutral gray background (#D3D3D3)
- Studio lighting with clear shadows for depth
- Educational fitness diagram aesthetic
- Single male athlete (same person in both panels)
- Professional medical illustration quality

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EQUIPMENT SPECIFICATIONS (MUST BE IDENTICAL IN BOTH PANELS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${equipmentContext}

CRITICAL EQUIPMENT CONSISTENCY:
- Equipment position: EXACTLY THE SAME in both panels
- Equipment size and scale: EXACTLY THE SAME in both panels
- Equipment orientation: EXACTLY THE SAME in both panels
- Background setting: EXACTLY THE SAME in both panels
- Lighting direction: EXACTLY THE SAME in both panels
- ONLY the athlete's body position changes between panels
- Equipment NEVER moves, floats, or changes size

${arrowInstructions}

${muscleInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMERA & COMPOSITION (ABSOLUTE REQUIREMENTS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Camera angle: EXACTLY THE SAME in both panels (FIXED, NEVER MOVES)
- Camera distance: EXACTLY THE SAME in both panels (FIXED, NEVER ZOOMS)
- Camera height: EXACTLY THE SAME in both panels (FIXED, NEVER CHANGES)
- Viewing angle: Side profile (90° perpendicular to movement plane) or 3/4 view if needed for clarity
- Athlete scale: EXACTLY THE SAME size in both panels
- Athlete position in frame: Centered in both panels
- Background elements: EXACTLY THE SAME in both panels
- Lighting angle: EXACTLY THE SAME in both panels

What CHANGES between panels:
✓ Athlete's limb positions (arms, legs)
✓ Joint angles (elbows, knees, hips, shoulders)
✓ Muscle contraction state (stretched vs contracted)
✓ Arrow colors and styles (red solid vs blue dashed)

What NEVER CHANGES between panels:
✗ Camera position or angle
✗ Equipment position, size, or orientation
✗ Background or setting
✗ Lighting direction or quality
✗ Athlete's scale or proportions
✗ Overall framing or composition

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL RENDERING REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Image dimensions: EXACTLY 1536 x 1024 pixels (16:9 aspect ratio)
- Panel division: EXACTLY 768 pixels width per panel
- Vertical separator: Thin 2-pixel line between panels
- High contrast for clarity (black lines, white highlights, gray midtones)
- Sharp edges and clean lines (no blur or soft edges on anatomy)
- No text labels or annotations except small ROM bracket marks [ ]
- Professional medical illustration quality rendering

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL CRITICAL REMINDER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a DIPTYCH showing TWO DISTINCT BODY POSITIONS of the same exercise.
Panel 1 = STARTING position (muscle STRETCHED, weight AWAY from body)
Panel 2 = ENDING position (muscle CONTRACTED, weight CLOSE to body)

The ONLY difference between panels is the athlete's body position.
Everything else (camera, equipment, background, lighting) remains PERFECTLY IDENTICAL.

Arrows must clearly show the direction of movement and match the actual exercise mechanics.`;

  return prompt;
}

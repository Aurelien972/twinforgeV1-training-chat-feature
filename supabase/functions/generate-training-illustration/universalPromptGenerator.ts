/**
 * Universal Prompt Generator
 * Shared prompt building logic for all training disciplines
 * Provides consistent structure while allowing discipline-specific customization
 */

import { getDisciplineConfig, COMMON_ELEMENTS, type DisciplineConfig } from './disciplinePromptConfig.ts';

export interface UniversalPromptParams {
  exerciseName: string;
  discipline: string;
  muscleGroups?: string[];
  equipment?: string[];
  movementPattern?: string;
  // Discipline-specific metadata
  metadata?: {
    zones?: string[];           // For endurance: HR zones, power zones
    scaling?: string;           // For functional: RX/Scaled
    progression?: string;       // For calisthenics: Tuck/Adv/Full
    standard?: string;          // For competitions: Official standard
    cadence?: number;           // For endurance: target cadence
    duration?: number;          // Hold time, work interval
  };
}

/**
 * Build common prompt header (format, style, background)
 */
export function buildPromptHeader(config: DisciplineConfig, aspectRatio: string): string {
  const isPanoramic = aspectRatio === '16:9';
  const dimensions = isPanoramic ? '1536x1024 pixels' : '1024x1024 pixels';

  return `Professional fitness technical illustration${isPanoramic ? ' DIPTYCH (2 panels side-by-side)' : ''}:

FORMAT: ${aspectRatio} ratio (${dimensions})${isPanoramic ? ', TWO EQUAL PANELS separated by thin vertical line' : ''}

STYLE:
- ${config.visualStyle}
- Clean ${COMMON_ELEMENTS.technical.background}
- ${COMMON_ELEMENTS.technical.lighting}
- ${COMMON_ELEMENTS.technical.quality}
- ${COMMON_ELEMENTS.technical.subject}
- High contrast for clarity`;
}

/**
 * Build equipment and context section
 */
export function buildEquipmentSection(
  exerciseName: string,
  equipment: string[] = [],
  discipline: string
): string {
  const lowerName = exerciseName.toLowerCase();
  let equipmentList: string[] = [];

  // Use provided equipment or infer from exercise name
  if (equipment && equipment.length > 0) {
    equipmentList = equipment;
  } else {
    // Inference logic
    if (lowerName.includes('barbell') || lowerName.includes('barre')) {
      equipmentList.push('Olympic barbell with weight plates');
    } else if (lowerName.includes('dumbbell') || lowerName.includes('haltère')) {
      equipmentList.push('Dumbbells');
    } else if (lowerName.includes('kettlebell')) {
      equipmentList.push('Kettlebell');
    } else if (lowerName.includes('cable') || lowerName.includes('poulie')) {
      equipmentList.push('Cable machine with handles');
    } else if (lowerName.includes('machine')) {
      equipmentList.push('Professional strength machine');
    } else if (lowerName.includes('rings') || lowerName.includes('anneaux')) {
      equipmentList.push('Gymnastic rings');
    } else if (lowerName.includes('pull') || lowerName.includes('chin') || lowerName.includes('traction')) {
      equipmentList.push('Pull-up bar');
    } else if (lowerName.includes('dip')) {
      equipmentList.push('Dip station or parallel bars');
    } else if (lowerName.includes('box')) {
      equipmentList.push('Plyometric box');
    } else if (discipline === 'endurance') {
      // Endurance-specific
      if (lowerName.includes('run') || lowerName.includes('course')) {
        equipmentList.push('Running shoes, open track or road');
      } else if (lowerName.includes('bike') || lowerName.includes('vélo') || lowerName.includes('cycling')) {
        equipmentList.push('Road or stationary bike');
      } else if (lowerName.includes('swim') || lowerName.includes('natation')) {
        equipmentList.push('Swimming pool, goggles');
      } else if (lowerName.includes('row') || lowerName.includes('erg')) {
        equipmentList.push('Rowing ergometer (erg)');
      }
    } else {
      equipmentList.push('Minimal equipment or bodyweight');
    }
  }

  const equipmentText = equipmentList.length > 0
    ? equipmentList.map(eq => `- ${eq.charAt(0).toUpperCase() + eq.slice(1)}`).join('\n')
    : '- Bodyweight or minimal equipment';

  return `EQUIPMENT & CONTEXT:
${equipmentText}
- Professional ${discipline === 'endurance' ? 'athletic' : 'gym'} setting with proper lighting`;
}

/**
 * Build panel layout section (for panoramic/diptych formats)
 */
export function buildPanelLayout(config: DisciplineConfig, discipline: string): string {
  const colors = config.arrowColor;

  let panelDescription = '';

  if (discipline === 'force') {
    panelDescription = `PANEL LAYOUT:
┌─────────────────────────────────────────────────┐
│  PANEL 1: START     │    PANEL 2: END           │
│  (Concentric Phase) │   (Eccentric Phase)       │
│  ● ${colors.primary} solid arrows │   ● ${colors.secondary} dashed arrows    │
│  ● Starting position│   ● Ending position       │
└─────────────────────────────────────────────────┘`;
  } else if (discipline === 'endurance') {
    panelDescription = `PANEL LAYOUT:
┌─────────────────────────────────────────────────┐
│  PANEL 1: DRIVE     │    PANEL 2: RECOVERY      │
│  (Power Phase)      │   (Return Phase)          │
│  ● ${colors.primary} solid cycle │   ● ${colors.secondary} dashed return   │
│  ● Peak force       │   ● Preparation position  │
└─────────────────────────────────────────────────┘`;
  } else if (discipline === 'functional') {
    panelDescription = `PANEL LAYOUT:
┌─────────────────────────────────────────────────┐
│  PANEL 1: SETUP     │    PANEL 2: EXECUTION     │
│  (Starting Setup)   │   (Peak Movement)         │
│  ● ${colors.primary} solid path  │   ● ${colors.primary} completion        │
│  ● Ready position   │   ● Full extension/finish │
└─────────────────────────────────────────────────┘`;
  } else if (discipline === 'calisthenics') {
    panelDescription = `PANEL LAYOUT:
┌─────────────────────────────────────────────────┐
│  PANEL 1: ENTRY     │    PANEL 2: HOLD          │
│  (Transition In)    │   (Static Position)       │
│  ● ${colors.primary} entry path  │   ● Alignment lines       │
│  ● Movement to hold │   ● Final locked position │
└─────────────────────────────────────────────────┘`;
  } else if (discipline === 'competitions') {
    panelDescription = `PANEL LAYOUT:
┌─────────────────────────────────────────────────┐
│  PANEL 1: STANDARD  │    PANEL 2: COMPLETION    │
│  (Bottom Position)  │   (Top Position)          │
│  ● ${colors.primary} with markers│   ● Lockout verification  │
│  ● ROM depth check  │   ● Rep validation        │
└─────────────────────────────────────────────────┘`;
  }

  return panelDescription;
}

/**
 * Build arrow system instructions based on discipline configuration
 */
export function buildArrowInstructions(
  config: DisciplineConfig,
  discipline: string,
  movementPattern?: string
): string {
  const colors = config.arrowColor;
  const macro = config.arrowStyle.macro;
  const micro = config.arrowStyle.micro;

  // Get discipline-specific arrow descriptions
  let macroDescription = '';
  let microExamples = '';

  if (discipline === 'force') {
    macroDescription = `${macro.width} ${macro.pattern} ${colors.primary} arrow showing barbell/weight trajectory from start to finish`;
    microExamples = micro.types.slice(0, 3).join(', ');
  } else if (discipline === 'endurance') {
    macroDescription = `${macro.width} ${macro.pattern} ${colors.primary} showing complete movement cycle (pedal stroke, stride cycle, swim stroke)`;
    microExamples = micro.types.slice(0, 3).join(', ');
  } else if (discipline === 'functional') {
    macroDescription = `${macro.width} ${macro.pattern} ${colors.primary} arrow showing efficient power transfer path through the movement`;
    microExamples = micro.types.slice(0, 3).join(', ');
  } else if (discipline === 'calisthenics') {
    macroDescription = `${macro.width} ${macro.pattern} ${colors.primary} showing center of mass trajectory or body lever path`;
    microExamples = micro.types.slice(0, 3).join(', ');
  } else if (discipline === 'competitions') {
    macroDescription = `${macro.width} ${macro.pattern} ${colors.primary} showing movement path with official ROM markers`;
    microExamples = micro.types.slice(0, 3).join(', ');
  }

  return `ARROW SYSTEM:
- MACRO ARROW (1): ${macroDescription}
- MICRO ARROWS (max ${micro.maxCount}): ${micro.width} thin arrows showing ${microExamples}
- COLOR CODE: ${colors.primary} = primary movement, ${colors.secondary} = return/eccentric${colors.accent ? `, ${colors.accent} = alignment/stability` : ''}
- STYLE: Solid for primary movement, Dashed for return phase
- ARROWS MUST BE BOLD AND CLEARLY VISIBLE against background
- RETURN PATH: Dashed arrows in same color showing eccentric/recovery phase`;
}

/**
 * Build ROM markers and checkpoints section
 */
export function buildROMMarkers(discipline: string): string {
  const rom = COMMON_ELEMENTS.romMarkers;

  let disciplineSpecific = '';

  if (discipline === 'force') {
    disciplineSpecific = 'Start/end of concentric and eccentric phases';
  } else if (discipline === 'endurance') {
    disciplineSpecific = 'Key points in movement cycle (catch, drive, finish, recovery)';
  } else if (discipline === 'functional') {
    disciplineSpecific = 'Hip crease below knee, lockout positions, contact points';
  } else if (discipline === 'calisthenics') {
    disciplineSpecific = 'Body alignment checkpoints (head-shoulder-hip line), pivot points';
  } else if (discipline === 'competitions') {
    disciplineSpecific = 'Official judge standards (depth, height, lockout requirements)';
  }

  return `ROM MARKERS & CHECKPOINTS:
- Start position: ${rom.start}
- End position: ${rom.end}
- Pivot points: ${rom.pivot}
- Alignment guides: ${rom.alignment}
${discipline === 'competitions' ? `- Target markers: ${rom.target}` : ''}
- Specific to movement: ${disciplineSpecific}`;
}

/**
 * Build standardized inset/callout section
 */
export function buildInsetSection(
  exerciseName: string,
  equipment: string[],
  discipline: string,
  metadata?: UniversalPromptParams['metadata']
): string {
  const config = getDisciplineConfig(discipline);
  const badgeConfig = config.badges;

  let badgeText = '';

  if (discipline === 'endurance' && metadata?.zones) {
    badgeText = `Zones: ${metadata.zones.join(', ')}`;
  } else if (discipline === 'functional' && metadata?.scaling) {
    badgeText = `Scaling: ${metadata.scaling}`;
  } else if (discipline === 'calisthenics' && metadata?.progression) {
    badgeText = `Progression: ${metadata.progression}`;
  } else if (discipline === 'competitions' && metadata?.standard) {
    badgeText = `Standard: ${metadata.standard}`;
  }

  const equipmentText = equipment.length > 0 ? equipment.slice(0, 2).join(', ') : 'Minimal equipment';

  return `INSET/CALLOUT (${badgeConfig.position}):
- Exercise name: ${exerciseName}
- Equipment: ${equipmentText}
- ROM checkpoints shown with bracket marks
${badgeText ? `- Badge: ${badgeText}` : ''}
- Max 1 correction marker if needed (gray X for common error)
- Semi-transparent overlay, readable white/light text`;
}

/**
 * Build camera and composition section
 */
export function buildCameraSection(discipline: string, isPanoramic: boolean): string {
  let viewAngle = '';
  let composition = '';

  if (discipline === 'force') {
    viewAngle = 'Side profile view (or 3/4 angle if movement requires)';
    composition = 'Same exact camera angle, distance, and athlete position in BOTH panels';
  } else if (discipline === 'endurance') {
    viewAngle = 'Side or 3/4 view capturing full movement cycle';
    composition = 'Consistent framing showing complete range of motion';
  } else if (discipline === 'functional') {
    viewAngle = '3/4 angle view showing compound movement clearly';
    composition = 'Both panels show progression from setup to peak movement';
  } else if (discipline === 'calisthenics') {
    viewAngle = 'Front or side view showcasing body alignment and control';
    composition = 'Clear view of pivot points and body line alignment';
  } else if (discipline === 'competitions') {
    viewAngle = 'Side view capturing official judge perspective';
    composition = 'Clear visibility of all ROM standards and checkpoints';
  }

  return `CAMERA & COMPOSITION:
- ${viewAngle}
${isPanoramic ? `- ${composition}` : ''}
- Athlete centered in ${isPanoramic ? 'each panel' : 'frame'}
- Clear visibility of form and technique
- Professional fitness ${discipline === 'competitions' ? 'competition' : discipline === 'endurance' ? 'sports' : 'training'} photography quality`;
}

/**
 * Build complete prompt from parameters
 */
export function buildUniversalPrompt(params: UniversalPromptParams): {
  prompt: string;
  isDiptych: boolean;
  aspectRatio: '1:1' | '16:9';
} {
  const config = getDisciplineConfig(params.discipline);
  const aspectRatio = config.aspectRatio;
  const isPanoramic = config.isPanoramic;

  // Build all sections
  const header = buildPromptHeader(config, aspectRatio);
  const equipment = buildEquipmentSection(params.exerciseName, params.equipment, params.discipline);
  const panelLayout = isPanoramic ? buildPanelLayout(config, params.discipline) : '';
  const arrows = buildArrowInstructions(config, params.discipline, params.movementPattern);
  const romMarkers = buildROMMarkers(params.discipline);
  const inset = buildInsetSection(params.exerciseName, params.equipment || [], params.discipline, params.metadata);
  const camera = buildCameraSection(params.discipline, isPanoramic);

  // Combine all sections
  const prompt = `${header}

SUBJECT: ${params.exerciseName}

${equipment}

${panelLayout}

${arrows}

${romMarkers}

${inset}

${camera}

TECHNICAL REQUIREMENTS:
- ${aspectRatio} aspect ratio ${isPanoramic ? '(WIDE format for 2 panels)' : ''}
- High contrast for clarity
- Sharp edges and clean lines
- No text labels beyond inset callout
${isPanoramic ? '- Both panels MUST show same athlete, same equipment, same background' : ''}

${isPanoramic ? 'CRITICAL: This must be a DIPTYCH with 2 distinct panels showing movement progression.' : 'CRITICAL: Single clear illustration showing optimal technique.'}`;

  return {
    prompt,
    isDiptych: isPanoramic,
    aspectRatio
  };
}

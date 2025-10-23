/**
 * Discipline Prompt Configuration
 * Unified configuration for all training disciplines
 * Defines colors, arrow styles, badges, and visual rules per discipline
 */

export interface DisciplineConfig {
  name: string;
  arrowColor: {
    primary: string;        // Main movement color (e.g., RED for force)
    secondary: string;      // Return/eccentric color (e.g., BLUE for force)
    accent?: string;        // Optional accent for stability/alignment
  };
  arrowStyle: {
    macro: {
      description: string;
      width: string;
      pattern: 'solid' | 'dashed' | 'curved' | 'circular';
    };
    micro: {
      maxCount: number;
      width: string;
      types: string[];      // Types of micro arrows for this discipline
    };
  };
  badges: {
    standard: string[];     // Standard badges for this discipline
    position: 'top-right' | 'bottom-right' | 'bottom-left';
  };
  aspectRatio: '1:1' | '16:9';
  isPanoramic: boolean;
  visualStyle: string;      // Description of the visual aesthetic
}

/**
 * Core Discipline Configurations
 */
export const DISCIPLINE_CONFIGS: Record<string, DisciplineConfig> = {
  // FORCE/POWERBUILDING - Red/Blue Diptych System
  force: {
    name: 'Force & Powerbuilding',
    arrowColor: {
      primary: '#FF0000',     // RED - Concentric phase
      secondary: '#0066FF',   // BLUE - Eccentric phase
      accent: '#6B7280'       // GRAY - Stability cues
    },
    arrowStyle: {
      macro: {
        description: 'Thick solid arrow showing barbell/weight trajectory',
        width: '10px',
        pattern: 'solid'
      },
      micro: {
        maxCount: 3,
        width: '4-6px',
        types: [
          'Joint rotation (hip, knee, ankle)',
          'Scapular retraction/protraction',
          'Elbow flexion/extension',
          'Shoulder rotation',
          'Spine neutrality markers'
        ]
      }
    },
    badges: {
      standard: ['Weight progression', 'Sets x Reps', 'RPE/Tempo'],
      position: 'bottom-right'
    },
    aspectRatio: '16:9',
    isPanoramic: true,
    visualStyle: 'Black & white anatomical drawing with muscle highlighting'
  },

  // ENDURANCE - Green Cycle System
  endurance: {
    name: 'Endurance Sports',
    arrowColor: {
      primary: '#10B981',     // GREEN - Movement cycle
      secondary: '#059669',   // DARK GREEN - Return phase
      accent: '#34D399'       // LIGHT GREEN - Secondary cycles
    },
    arrowStyle: {
      macro: {
        description: 'Circular/loop arrow showing complete movement cycle',
        width: '8-10px',
        pattern: 'circular'
      },
      micro: {
        maxCount: 3,
        width: '4px',
        types: [
          'Force vector (push ground/pedal/water)',
          'Trunk inclination angle',
          'Hip/knee drive direction',
          'Arm recovery path',
          'Cadence rhythm markers'
        ]
      }
    },
    badges: {
      standard: ['Cadence/Frequency', 'HR Zone', 'Power/Pace', 'Duration'],
      position: 'top-right'
    },
    aspectRatio: '16:9',
    isPanoramic: true,
    visualStyle: 'Dynamic motion capture with cycle visualization and flow lines'
  },

  // FUNCTIONAL/CROSSTRAINING - Orange Explosive System
  functional: {
    name: 'Functional Training & CrossFit',
    arrowColor: {
      primary: '#EA580C',     // ORANGE - Primary movement
      secondary: '#C2410C',   // DARK ORANGE - Return phase
      accent: '#FB923C'       // LIGHT ORANGE - Force transfer
    },
    arrowStyle: {
      macro: {
        description: 'Thick arrow showing efficient power transfer path',
        width: '10px',
        pattern: 'solid'
      },
      micro: {
        maxCount: 3,
        width: '5px',
        types: [
          'Hip hinge arc',
          'Scapular retraction',
          'Knee tracking',
          'Foot drive vector',
          'Torso stabilization'
        ]
      }
    },
    badges: {
      standard: ['RX / Scaled', 'Unbroken / Cycling', 'Time Cap', 'Reps'],
      position: 'bottom-right'
    },
    aspectRatio: '16:9',
    isPanoramic: true,
    visualStyle: 'High-intensity action capture with explosive movement indicators'
  },

  // CALISTHENICS - Cyan Precision System
  calisthenics: {
    name: 'Calisthenics & Street Workout',
    arrowColor: {
      primary: '#06B6D4',     // CYAN - Movement path
      secondary: '#0891B2',   // DARK CYAN - Return/release
      accent: '#22D3EE'       // LIGHT CYAN - Alignment guides
    },
    arrowStyle: {
      macro: {
        description: 'Center of mass trajectory or lever arm path',
        width: '8px',
        pattern: 'curved'
      },
      micro: {
        maxCount: 3,
        width: '3-4px',
        types: [
          'Joint pivot arcs (wrist/shoulder/hip)',
          'Push/pull force on contact points',
          'Body alignment line (head-shoulder-hip)',
          'Scapular positioning',
          'Grip rotation'
        ]
      }
    },
    badges: {
      standard: ['Progression Level', 'Hold Duration', 'Tuck/Adv/Straddle/Full', 'Reps'],
      position: 'bottom-left'
    },
    aspectRatio: '16:9',
    isPanoramic: true,
    visualStyle: 'High-precision technical drawing with body alignment emphasis'
  },

  // COMPETITIONS - Yellow Standards System
  competitions: {
    name: 'Fitness Competitions',
    arrowColor: {
      primary: '#EAB308',     // YELLOW - Movement path
      secondary: '#CA8A04',   // DARK YELLOW - Return phase
      accent: '#FDE047'       // LIGHT YELLOW - Target markers
    },
    arrowStyle: {
      macro: {
        description: 'Movement path with judge standard markers',
        width: '10px',
        pattern: 'solid'
      },
      micro: {
        maxCount: 3,
        width: '5px',
        types: [
          'ROM depth markers (brackets)',
          'Target height indicators',
          'Ground contact vectors',
          'Lockout checkpoints',
          'Judge visibility angles'
        ]
      }
    },
    badges: {
      standard: ['Standard Load/Distance', 'Rep Count', 'No-Rep Warning ⚠︎', 'Time'],
      position: 'top-right'
    },
    aspectRatio: '16:9',
    isPanoramic: true,
    visualStyle: 'Competition-standard documentation with clear judge markers'
  }
};

/**
 * Common Prompt Elements - Shared Across All Disciplines
 */
export const COMMON_ELEMENTS = {
  // Standard inset/callout box configuration
  inset: {
    position: 'consistent bottom or side placement',
    content: [
      'Exercise name',
      'Equipment required',
      'ROM markers/checkpoints',
      'Max 1 "don\'t" visual correction'
    ],
    style: 'Semi-transparent overlay, readable typography'
  },

  // ROM (Range of Motion) markers
  romMarkers: {
    start: '[ bracket at starting position',
    end: '] bracket at ending position',
    pivot: '• dot at rotation pivot point',
    alignment: '— horizontal/vertical line for proper alignment',
    target: '⊙ circle for target position (competitions)'
  },

  // Arrow return pattern (applies to all disciplines)
  returnPattern: {
    style: 'dashed',
    color: 'Same as primary but dashed pattern',
    width: 'Same as forward path',
    note: 'Shows eccentric/return/recovery phase'
  },

  // "Don't" visual correction markers
  corrections: {
    symbol: 'X or ✗ mark',
    color: 'Gray (#6B7280)',
    usage: 'Max 1 per illustration',
    examples: [
      'Trunk should not lean forward',
      'Knees should not cave inward',
      'Elbows should not flare',
      'Back should not round'
    ]
  },

  // Technical specifications
  technical: {
    format: 'Professional fitness technical illustration',
    background: 'Clean neutral gray or white',
    lighting: 'Studio lighting with clear shadows',
    subject: 'Single athlete (male or female based on exercise)',
    quality: 'Educational fitness diagram aesthetic',
    clarity: 'High contrast for immediate comprehension'
  }
};

/**
 * Get configuration for a specific discipline
 */
export function getDisciplineConfig(discipline: string): DisciplineConfig {
  const config = DISCIPLINE_CONFIGS[discipline.toLowerCase()];

  if (!config) {
    console.warn(`No configuration found for discipline: ${discipline}, using force as fallback`);
    return DISCIPLINE_CONFIGS.force;
  }

  return config;
}

/**
 * Validate if a discipline supports panoramic format
 */
export function isPanoramicDiscipline(discipline: string): boolean {
  const config = getDisciplineConfig(discipline);
  return config.isPanoramic;
}

/**
 * Get aspect ratio for a discipline
 */
export function getAspectRatio(discipline: string): '1:1' | '16:9' {
  const config = getDisciplineConfig(discipline);
  return config.aspectRatio;
}

/**
 * Get arrow color configuration for a discipline
 */
export function getArrowColors(discipline: string): { primary: string; secondary: string; accent?: string } {
  const config = getDisciplineConfig(discipline);
  return config.arrowColor;
}

/**
 * Get badge configuration for a discipline
 */
export function getBadgeConfig(discipline: string): { standard: string[]; position: string } {
  const config = getDisciplineConfig(discipline);
  return config.badges;
}

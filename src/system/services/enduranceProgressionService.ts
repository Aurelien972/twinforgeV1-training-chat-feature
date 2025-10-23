/**
 * Endurance Progression Service
 * Handles progression logic for endurance training (TSS, CTL/ATL/TSB)
 */

export interface EnduranceMetrics {
  tss: number;
  duration: number;
  distance?: number;
  avgHR?: number;
  avgPace?: string;
  avgPower?: number;
}

export interface FitnessMetrics {
  ctl: number;
  atl: number;
  tsb: number;
  form: 'fresh' | 'optimal' | 'tired' | 'overreached';
}

const CTL_TIME_CONSTANT = 42;
const ATL_TIME_CONSTANT = 7;

export function calculateTSS(
  duration: number,
  intensityFactor: number
): number {
  const durationHours = duration / 60;
  const tss = durationHours * intensityFactor * intensityFactor * 100;
  return Math.round(tss);
}

export function estimateTSSFromZone(
  duration: number,
  zone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'
): number {
  const zoneTSSPerHour: Record<string, number> = {
    'Z1': 30,
    'Z2': 50,
    'Z3': 70,
    'Z4': 90,
    'Z5': 120
  };

  const tssPerHour = zoneTSSPerHour[zone] || 50;
  return Math.round((duration / 60) * tssPerHour);
}

export function calculateCTL(
  previousCTL: number,
  todayTSS: number
): number {
  const decay = Math.exp(-1 / CTL_TIME_CONSTANT);
  const ctl = previousCTL * decay + todayTSS * (1 - decay);
  return Math.round(ctl);
}

export function calculateATL(
  previousATL: number,
  todayTSS: number
): number {
  const decay = Math.exp(-1 / ATL_TIME_CONSTANT);
  const atl = previousATL * decay + todayTSS * (1 - decay);
  return Math.round(atl);
}

export function calculateTSB(
  ctl: number,
  atl: number
): number {
  return ctl - atl;
}

export function assessForm(tsb: number): FitnessMetrics['form'] {
  if (tsb > 25) return 'fresh';
  if (tsb >= 5) return 'optimal';
  if (tsb >= -10) return 'tired';
  return 'overreached';
}

export function calculateFitnessMetrics(
  recentSessions: EnduranceMetrics[],
  daysToAnalyze: number = 42
): FitnessMetrics {
  let ctl = 0;
  let atl = 0;

  recentSessions
    .slice(0, daysToAnalyze)
    .reverse()
    .forEach((session) => {
      ctl = calculateCTL(ctl, session.tss);
      atl = calculateATL(atl, session.tss);
    });

  const tsb = calculateTSB(ctl, atl);
  const form = assessForm(tsb);

  return { ctl, atl, tsb, form };
}

export function recommendNextSessionIntensity(
  fitnessMetrics: FitnessMetrics,
  daysSinceLastHard: number
): 'recovery' | 'easy' | 'moderate' | 'hard' | 'rest' {
  const { tsb, form, atl } = fitnessMetrics;

  if (tsb < -15 || atl > 120) {
    return 'rest';
  }

  if (form === 'overreached') {
    return 'recovery';
  }

  if (form === 'tired') {
    return daysSinceLastHard < 2 ? 'recovery' : 'easy';
  }

  if (form === 'fresh') {
    return daysSinceLastHard >= 2 ? 'hard' : 'moderate';
  }

  return daysSinceLastHard >= 2 ? 'hard' : 'easy';
}

export function calculateWeeklyVolumeProgression(
  currentWeeklyVolume: number,
  fitnessLevel: string,
  weeksInCycle: number
): number {
  const maxProgressionRate: Record<string, number> = {
    'beginner': 0.10,
    'novice': 0.10,
    'intermediate': 0.08,
    'advanced': 0.05,
    'expert': 0.03,
    'elite': 0.03
  };

  const rate = maxProgressionRate[fitnessLevel] || 0.10;

  if (weeksInCycle % 4 === 0) {
    return currentWeeklyVolume * 0.7;
  }

  return currentWeeklyVolume * (1 + rate);
}

export function recommendRecoveryTime(
  sessionTSS: number,
  form: FitnessMetrics['form']
): number {
  const baseDays = Math.ceil(sessionTSS / 50);

  const formMultiplier: Record<FitnessMetrics['form'], number> = {
    'fresh': 0.8,
    'optimal': 1.0,
    'tired': 1.3,
    'overreached': 1.5
  };

  return Math.ceil(baseDays * formMultiplier[form]);
}

export function calculatePaceFromHR(
  targetHR: number,
  fcMax: number,
  basePace: number
): number {
  const hrPercent = targetHR / fcMax;

  if (hrPercent < 0.6) {
    return basePace * 1.3;
  } else if (hrPercent < 0.7) {
    return basePace * 1.15;
  } else if (hrPercent < 0.8) {
    return basePace * 1.0;
  } else if (hrPercent < 0.9) {
    return basePace * 0.90;
  } else {
    return basePace * 0.80;
  }
}

export const enduranceProgressionService = {
  calculateTSS,
  estimateTSSFromZone,
  calculateCTL,
  calculateATL,
  calculateTSB,
  assessForm,
  calculateFitnessMetrics,
  recommendNextSessionIntensity,
  calculateWeeklyVolumeProgression,
  recommendRecoveryTime,
  calculatePaceFromHR
};

/**
 * Endurance Motivation Engine
 * Generates contextual motivation and encouragement messages
 */

import type { HeartRateZone, EnduranceDiscipline } from '../../domain/enduranceSession';

export interface MotivationMessage {
  message: string;
  type: 'encouragement' | 'technical' | 'milestone' | 'warning';
  priority: 'low' | 'medium' | 'high';
}

class EnduranceMotivationEngine {
  /**
   * Get message for warmup phase
   */
  getWarmupMessage(progressPercent: number): MotivationMessage {
    const messages = [
      'Prends ton temps, échauffe-toi bien',
      'Monte progressivement en température',
      'Respire calmement, prépare ton corps',
      'Excellent début, continue comme ça',
    ];

    const index = Math.floor((progressPercent / 100) * messages.length);
    return {
      message: messages[Math.min(index, messages.length - 1)],
      type: 'encouragement',
      priority: 'low',
    };
  }

  /**
   * Get message for continuous blocks based on zone
   */
  getContinuousMessage(zone: HeartRateZone, progressPercent: number): MotivationMessage {
    const zoneMessages: Record<HeartRateZone, string[]> = {
      Z1: [
        'Parfait pour récupérer',
        'Allure très confortable, profite',
        'Cette récupération active fait du bien',
      ],
      Z2: [
        'Allure parfaite pour construire ta base',
        'Tu peux tenir ça longtemps, excellente endurance fondamentale',
        'Cette zone développe ton système aérobie',
        'Respiration confortable, c\'est parfait',
      ],
      Z3: [
        '"Comfortably hard", c\'est exactement ça',
        'Zone tempo, tu progresses ici',
        'Maintiens cette intensité, c\'est productif',
      ],
      Z4: [
        'Ça brûle mais c\'est là que tu progresses',
        'Seuil lactique, tu repousses tes limites',
        'Difficile mais tenable, continue',
      ],
      Z5: [
        'Intensité maximale, donne tout',
        'VO2Max, tu développes ta puissance',
        'C\'est dur mais ça marche',
      ],
    };

    const messages = zoneMessages[zone] || zoneMessages.Z2;
    const index = Math.floor((progressPercent / 100) * messages.length);

    return {
      message: messages[Math.min(index, messages.length - 1)],
      type: 'encouragement',
      priority: 'medium',
    };
  }

  /**
   * Get message for interval work phase
   */
  getIntervalWorkMessage(intervalNumber: number, totalIntervals: number): MotivationMessage {
    const isFirst = intervalNumber === 1;
    const isLast = intervalNumber === totalIntervals;
    const isMiddle = intervalNumber === Math.floor(totalIntervals / 2);

    if (isFirst) {
      return {
        message: 'Premier intervalle, mets-toi dedans !',
        type: 'encouragement',
        priority: 'high',
      };
    }

    if (isLast) {
      return {
        message: 'Dernier intervalle, finissons en beauté !',
        type: 'encouragement',
        priority: 'high',
      };
    }

    if (isMiddle) {
      return {
        message: 'Mi-parcours des intervalles, tu gères !',
        type: 'milestone',
        priority: 'medium',
      };
    }

    const messages = [
      'Donne tout, c\'est court',
      'Tu es une machine',
      'Encore un effort',
      'Concentration et puissance',
    ];

    return {
      message: messages[intervalNumber % messages.length],
      type: 'encouragement',
      priority: 'high',
    };
  }

  /**
   * Get message for interval rest phase
   */
  getIntervalRestMessage(nextIntervalNumber: number, totalIntervals: number): MotivationMessage {
    const remaining = totalIntervals - nextIntervalNumber + 1;

    if (remaining === 1) {
      return {
        message: 'Récupère bien, c\'est le dernier après',
        type: 'encouragement',
        priority: 'medium',
      };
    }

    const messages = [
      'Récupère bien, respire profondément',
      `Encore ${remaining} intervalles, tu peux le faire`,
      'Utilise ce temps pour récupérer',
      'Respiration ample, prépare le prochain',
    ];

    return {
      message: messages[nextIntervalNumber % messages.length],
      type: 'encouragement',
      priority: 'low',
    };
  }

  /**
   * Get technical cue for discipline
   */
  getTechnicalCue(discipline: EnduranceDiscipline, zone: HeartRateZone): MotivationMessage {
    const cues: Record<EnduranceDiscipline, Record<string, string[]>> = {
      running: {
        easy: ['Cadence haute, foulées légères', 'Relâche les épaules', 'Regarde devant toi'],
        hard: ['Respire profondément', 'Garde la posture', 'Jambes actives'],
      },
      cycling: {
        easy: ['Cadence fluide 85-90 RPM', 'Position confortable', 'Pédalage rond'],
        hard: ['Cadence haute', 'Reste aéro', 'Puissance constante'],
      },
      swimming: {
        easy: ['Allonge le bras, glisse', 'Expire sous l\'eau', 'Détends-toi'],
        hard: ['Rythme soutenu', 'Jambes actives', 'Respiration bilatérale'],
      },
      triathlon: {
        easy: ['Gère ton énergie', 'Pense aux transitions', 'Économise-toi'],
        hard: ['Change de discipline bientôt', 'Prépare la transition', 'Reste concentré'],
      },
      cardio: {
        easy: ['Respiration contrôlée', 'Mouvement fluide', 'Écoute ton corps'],
        hard: ['Intensité élevée', 'Engage tout le corps', 'Respire fort'],
      },
    };

    const isHardZone = zone === 'Z4' || zone === 'Z5';
    const cueType = isHardZone ? 'hard' : 'easy';
    const disciplineCues = cues[discipline]?.[cueType] || cues.cardio[cueType];
    const randomCue = disciplineCues[Math.floor(Math.random() * disciplineCues.length)];

    return {
      message: randomCue,
      type: 'technical',
      priority: 'low',
    };
  }

  /**
   * Get progress milestone message
   */
  getMilestoneMessage(progressPercent: number): MotivationMessage | null {
    const milestones = [
      { percent: 25, message: 'Excellent début, continue comme ça' },
      { percent: 50, message: 'Mi-parcours ! Tu gères parfaitement' },
      { percent: 75, message: 'Encore un effort, tu touches au but' },
      { percent: 90, message: 'Plus que 10%, finissons fort !' },
    ];

    const milestone = milestones.find(m => Math.abs(m.percent - progressPercent) < 1);
    if (milestone) {
      return {
        message: milestone.message,
        type: 'milestone',
        priority: 'high',
      };
    }

    return null;
  }

  /**
   * Get cooldown message
   */
  getCooldownMessage(): MotivationMessage {
    const messages = [
      'Excellent travail ! Récupère en douceur',
      'Tu l\'as fait ! Reviens progressivement au calme',
      'Bravo pour cette séance, récupère bien',
      'Superbe effort, laisse le corps revenir au repos',
    ];

    return {
      message: messages[Math.floor(Math.random() * messages.length)],
      type: 'encouragement',
      priority: 'medium',
    };
  }

  /**
   * Get completion celebration message
   */
  getCompletionMessage(blocksCompleted: number, intervalsCompleted: number): MotivationMessage {
    const messages = [
      `Séance terminée ! ${blocksCompleted} blocs et ${intervalsCompleted} intervalles complétés`,
      'Tu l\'as fait ! Excellente séance d\'endurance',
      'Bravo ! Tu as respecté ton programme',
      'Superbe travail ! Ton système cardiovasculaire te remercie',
    ];

    return {
      message: messages[Math.floor(Math.random() * messages.length)],
      type: 'milestone',
      priority: 'high',
    };
  }

  /**
   * Get zone deviation warning
   */
  getZoneDeviationWarning(currentZone: HeartRateZone, targetZone: HeartRateZone): MotivationMessage {
    const zoneNumbers: Record<HeartRateZone, number> = {
      Z1: 1,
      Z2: 2,
      Z3: 3,
      Z4: 4,
      Z5: 5,
    };

    const isTooHigh = zoneNumbers[currentZone] > zoneNumbers[targetZone];

    if (isTooHigh) {
      return {
        message: `Tu es en ${currentZone}, reviens en ${targetZone} - ralentis légèrement`,
        type: 'warning',
        priority: 'high',
      };
    }

    return {
      message: `Tu es en ${currentZone}, monte en ${targetZone} - augmente légèrement`,
      type: 'warning',
      priority: 'medium',
    };
  }

  /**
   * Get transition message
   */
  getTransitionMessage(nextBlockName: string, nextBlockType: string): MotivationMessage {
    const typeMessages: Record<string, string> = {
      continuous: `Prêt pour ${nextBlockName} en continu`,
      intervals: `Prépare-toi pour les intervalles: ${nextBlockName}`,
      tempo: `On passe au tempo: ${nextBlockName}`,
      cooldown: 'Dernière phase, retour au calme',
    };

    return {
      message: typeMessages[nextBlockType] || `Prochain bloc: ${nextBlockName}`,
      type: 'encouragement',
      priority: 'high',
    };
  }

  /**
   * Get achievement message
   */
  getAchievementMessage(achievement: string): MotivationMessage {
    const achievements: Record<string, string> = {
      longest_session: '🏆 Record personnel ! Plus longue séance de la semaine',
      first_10k: '🎉 Bravo ! Ton premier 10km en continu',
      best_tss: '💪 Meilleur TSS du mois, tu progresses',
      streak_5: '🔥 5 séances cette semaine, tu es en feu',
      perfect_zones: '🎯 Zones parfaitement respectées, excellent contrôle',
    };

    return {
      message: achievements[achievement] || '🌟 Nouveau record !',
      type: 'milestone',
      priority: 'high',
    };
  }
}

export const enduranceMotivationEngine = new EnduranceMotivationEngine();

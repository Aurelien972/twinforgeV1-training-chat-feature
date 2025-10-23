/**
 * Recovery and Muscle Group Analysis Module
 * Analyzes training history to determine recovery status and muscle group fatigue
 */

/**
 * Mapping patterns d'exercices -> groupes musculaires (en français et anglais)
 */
export const EXERCISE_TO_MUSCLE_GROUP: Record<string, string> = {
  // Jambes
  'squat': 'jambes',
  'leg press': 'jambes',
  'presse': 'jambes',
  'deadlift': 'jambes',
  'soulevé de terre': 'jambes',
  'fente': 'jambes',
  'lunge': 'jambes',
  'leg curl': 'jambes',
  'leg extension': 'jambes',
  'hack squat': 'jambes',
  // Pectoraux
  'développé couché': 'pecs',
  'bench press': 'pecs',
  'développé': 'pecs',
  'dips': 'pecs',
  'pompes': 'pecs',
  'push-up': 'pecs',
  'push': 'pecs',
  'incliné': 'pecs',
  'décliné': 'pecs',
  'pec deck': 'pecs',
  // Dos
  'rowing': 'dos',
  'tractions': 'dos',
  'pull-up': 'dos',
  'pull': 'dos',
  'tirage': 'dos',
  'lat pulldown': 'dos',
  't-bar': 'dos',
  // Épaules
  'développé militaire': 'épaules',
  'military press': 'épaules',
  'overhead press': 'épaules',
  'élévations': 'épaules',
  'lateral': 'épaules',
  'latéral': 'épaules',
  'shoulder': 'épaules',
  // Bras
  'curl': 'bras',
  'extension triceps': 'bras',
  'triceps': 'bras',
  'biceps': 'bras'
};

export interface MuscleGroupData {
  count: number;
  lastWorked: string;
  exercises: string[];
}

export interface RecoveryStatus {
  muscleGroup: string;
  status: 'recovered' | 'recovering' | 'fatigued';
  hoursSinceLastWorkout: number;
  recommendedAction: string;
}

/**
 * Analyser les groupes musculaires travaillés dans l'historique récent
 */
export function analyzeMuscleGroups(sessions: any[]): Record<string, MuscleGroupData> {
  const muscleGroupMap: Record<string, MuscleGroupData> = {};

  sessions.forEach(session => {
    const sessionData = session.prescription_data || {};
    const exercises = sessionData.exercises || [];
    const sessionDate = session.created_at;

    exercises.forEach((ex: any) => {
      const exerciseName = (ex.name || '').toLowerCase();

      // Trouver le groupe musculaire
      let muscleGroup = 'autre';
      for (const [pattern, group] of Object.entries(EXERCISE_TO_MUSCLE_GROUP)) {
        if (exerciseName.includes(pattern)) {
          muscleGroup = group;
          break;
        }
      }

      if (!muscleGroupMap[muscleGroup]) {
        muscleGroupMap[muscleGroup] = {
          count: 0,
          lastWorked: sessionDate,
          exercises: []
        };
      }

      muscleGroupMap[muscleGroup].count++;

      // Garder la date la plus récente
      if (new Date(sessionDate) > new Date(muscleGroupMap[muscleGroup].lastWorked)) {
        muscleGroupMap[muscleGroup].lastWorked = sessionDate;
      }

      // Ajouter l'exercice s'il n'est pas déjà présent
      if (!muscleGroupMap[muscleGroup].exercises.includes(ex.name)) {
        muscleGroupMap[muscleGroup].exercises.push(ex.name);
      }
    });
  });

  return muscleGroupMap;
}

/**
 * Calculer le statut de récupération pour chaque groupe musculaire
 */
export function calculateRecoveryStatus(sessions: any[]): RecoveryStatus[] {
  if (!sessions || sessions.length === 0) {
    return [];
  }

  const muscleGroupMap = analyzeMuscleGroups(sessions);
  const now = new Date();
  const recoveryStatuses: RecoveryStatus[] = [];

  Object.entries(muscleGroupMap).forEach(([muscleGroup, data]) => {
    const lastWorkedDate = new Date(data.lastWorked);
    const hoursSinceLastWorkout = (now.getTime() - lastWorkedDate.getTime()) / (1000 * 60 * 60);

    let status: 'recovered' | 'recovering' | 'fatigued';
    let recommendedAction: string;

    // Règles de récupération (basées sur les groupes musculaires)
    const majorMuscleGroups = ['jambes', 'dos', 'pecs'];
    const isMajorGroup = majorMuscleGroups.includes(muscleGroup);

    if (hoursSinceLastWorkout < 24) {
      status = 'fatigued';
      recommendedAction = 'Repos complet recommandé';
    } else if (hoursSinceLastWorkout < 48 && isMajorGroup) {
      status = 'recovering';
      recommendedAction = 'Travail léger possible (RPE 6-7 max)';
    } else if (hoursSinceLastWorkout < 48 && !isMajorGroup) {
      status = 'recovered';
      recommendedAction = 'Prêt pour entraînement complet';
    } else if (hoursSinceLastWorkout < 72 && isMajorGroup) {
      status = 'recovering';
      recommendedAction = 'Approche progressive recommandée';
    } else {
      status = 'recovered';
      recommendedAction = 'Groupe musculaire complètement récupéré';
    }

    recoveryStatuses.push({
      muscleGroup,
      status,
      hoursSinceLastWorkout: Math.round(hoursSinceLastWorkout),
      recommendedAction
    });
  });

  return recoveryStatuses;
}

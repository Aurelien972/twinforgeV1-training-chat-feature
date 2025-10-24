/**
 * Exercise Frequency Analysis Module
 * Analyzes recently used exercises to help vary training and prevent plateaus
 */

export interface ExerciseData {
  frequency: number;
  lastPerformed: string;
  avgLoad?: number;
  avgRPE?: number;
  avgSets?: number;
  avgReps?: number;
}

/**
 * Analyser les exercices récemment utilisés
 */
export function analyzeRecentExercises(sessions: any[]): Record<string, ExerciseData> {
  const exerciseMap: Record<string, ExerciseData> = {};

  sessions.forEach(session => {
    const sessionData = session.prescription || {};
    const exercises = sessionData.exercises || [];
    const sessionDate = session.created_at;

    exercises.forEach((ex: any) => {
      const exerciseName = ex.name || 'Unknown';

      if (!exerciseMap[exerciseName]) {
        exerciseMap[exerciseName] = {
          frequency: 0,
          lastPerformed: sessionDate,
          avgLoad: 0,
          avgRPE: 0,
          avgSets: 0,
          avgReps: 0
        };
      }

      exerciseMap[exerciseName].frequency++;

      // Garder la date la plus récente
      if (new Date(sessionDate) > new Date(exerciseMap[exerciseName].lastPerformed)) {
        exerciseMap[exerciseName].lastPerformed = sessionDate;
      }

      // Calculer moyennes (simple moving average)
      const freq = exerciseMap[exerciseName].frequency;
      if (ex.load) {
        const currentLoad = Array.isArray(ex.load) ? Math.max(...ex.load) : ex.load;
        exerciseMap[exerciseName].avgLoad =
          ((exerciseMap[exerciseName].avgLoad || 0) * (freq - 1) + currentLoad) / freq;
      }
      if (ex.rpeTarget) {
        exerciseMap[exerciseName].avgRPE =
          ((exerciseMap[exerciseName].avgRPE || 0) * (freq - 1) + ex.rpeTarget) / freq;
      }
      if (ex.sets) {
        exerciseMap[exerciseName].avgSets =
          ((exerciseMap[exerciseName].avgSets || 0) * (freq - 1) + ex.sets) / freq;
      }
      if (ex.reps) {
        exerciseMap[exerciseName].avgReps =
          ((exerciseMap[exerciseName].avgReps || 0) * (freq - 1) + ex.reps) / freq;
      }
    });
  });

  return exerciseMap;
}

/**
 * Obtenir les exercices à éviter (trop répétés récemment)
 */
export function getOverusedExercises(exerciseMap: Record<string, ExerciseData>, threshold: number = 2): string[] {
  return Object.entries(exerciseMap)
    .filter(([_, data]) => data.frequency >= threshold)
    .map(([name, _]) => name);
}

/**
 * Suggérer des variations d'exercices
 */
export function suggestExerciseVariations(exerciseName: string): string[] {
  const variationsMap: Record<string, string[]> = {
    'Squat arrière': ['Front squat', 'Goblet squat', 'Bulgarian split squat', 'Squat box'],
    'Développé couché': ['Développé incliné', 'Développé haltères', 'Dips', 'Pompes lestées'],
    'Rowing barre': ['Rowing haltères', 'Tirage poulie', 'Tractions', 'T-bar row'],
    'Développé militaire': ['Développé haltères', 'Arnold press', 'Push press'],
    'Deadlift': ['Romanian deadlift', 'Trap bar deadlift', 'Deadlift sumo']
  };

  // Recherche avec pattern matching flexible
  for (const [key, variations] of Object.entries(variationsMap)) {
    if (exerciseName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(exerciseName.toLowerCase())) {
      return variations;
    }
  }

  return [];
}

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const keywordsByMovementPattern: Record<string, string[]> = {
  'push': ['chest', 'triceps', 'shoulders', 'pressing', 'extension'],
  'pull': ['back', 'lats', 'biceps', 'pulling', 'rowing', 'retraction'],
  'squat': ['legs', 'quads', 'glutes', 'knee flexion', 'hip flexion', 'standing'],
  'hinge': ['hamstrings', 'glutes', 'lower back', 'hip hinge', 'posterior chain'],
  'carry': ['full body', 'grip', 'core', 'walking', 'loaded'],
  'olympic': ['explosive', 'power', 'triple extension', 'barbell', 'dynamic'],
  'gymnastic': ['bodyweight', 'control', 'coordination', 'skill'],
  'hold': ['isometric', 'static', 'core', 'stability', 'time'],
  'isolation': ['single joint', 'focused', 'controlled'],
  'compound': ['multi-joint', 'full body', 'functional']
};

const keywordsByDiscipline: Record<string, string[]> = {
  'force': ['strength', 'barbell', 'dumbbell', 'resistance', 'hypertrophy'],
  'functional': ['crossfit', 'metcon', 'conditioning', 'varied', 'high intensity'],
  'calisthenics': ['bodyweight', 'street workout', 'gymnastics', 'leverage', 'control'],
  'endurance': ['cardio', 'aerobic', 'stamina', 'pacing', 'sustained effort'],
  'competitions': ['race', 'station', 'timed', 'competitive', 'performance']
};

const keywordsByCategory: Record<string, string[]> = {
  'benchmark_wod': ['benchmark', 'named wod', 'crossfit classic'],
  'metcon': ['metabolic', 'conditioning', 'intervals'],
  'hyrox_station': ['hyrox', 'race simulation', 'station work'],
  'deka_zone': ['deka', 'zone training', 'spartan'],
  'swimming': ['pool', 'water', 'stroke', 'aquatic'],
  'cycling': ['bike', 'pedaling', 'saddle', 'cadence'],
  'running': ['run', 'sprint', 'jog', 'stride'],
  'rowing': ['erg', 'rowing machine', 'stroke'],
  'skills': ['technical', 'progression', 'mastery']
};

function generateKeywords(exercise: any): string[] {
  const keywords = new Set<string>();

  if (exercise.movement_pattern && keywordsByMovementPattern[exercise.movement_pattern]) {
    keywordsByMovementPattern[exercise.movement_pattern].forEach(k => keywords.add(k));
  }

  if (keywordsByDiscipline[exercise.discipline]) {
    keywordsByDiscipline[exercise.discipline].forEach(k => keywords.add(k));
  }

  if (exercise.category && keywordsByCategory[exercise.category]) {
    keywordsByCategory[exercise.category].forEach(k => keywords.add(k));
  }

  const nameLower = exercise.name.toLowerCase();
  if (nameLower.includes('barbell')) keywords.add('barbell');
  if (nameLower.includes('dumbbell')) keywords.add('dumbbell');
  if (nameLower.includes('kettlebell')) keywords.add('kettlebell');
  if (nameLower.includes('cable')) keywords.add('cable machine');
  if (nameLower.includes('machine')) keywords.add('machine');
  if (nameLower.includes('band')) keywords.add('resistance band');
  if (nameLower.includes('trx')) keywords.add('suspension trainer');
  if (nameLower.includes('pull-up')) keywords.add('pull-up bar');
  if (nameLower.includes('push-up')) keywords.add('floor');
  if (nameLower.includes('squat')) keywords.add('squat position');
  if (nameLower.includes('deadlift')) keywords.add('deadlift stance');
  if (nameLower.includes('bench')) keywords.add('bench');
  if (nameLower.includes('row')) keywords.add('rowing motion');
  if (nameLower.includes('press')) keywords.add('pressing');
  if (nameLower.includes('curl')) keywords.add('curling');
  if (nameLower.includes('extension')) keywords.add('extension');
  if (nameLower.includes('fly') || nameLower.includes('flye')) keywords.add('fly motion');

  if (exercise.difficulty === 'advanced' || exercise.difficulty === 'elite') {
    keywords.add('advanced technique');
  }

  return Array.from(keywords).slice(0, 8);
}

async function enrichVisualKeywords() {
  console.log('🎨 ENRICHISSEMENT VISUAL KEYWORDS');
  console.log('='.repeat(60));

  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name, discipline, category, movement_pattern, difficulty, visual_keywords')
    .or('visual_keywords.is.null,visual_keywords.eq.{}');

  if (error || !exercises) {
    console.error('❌ Erreur lecture exercices:', error);
    return;
  }

  console.log(`📊 Exercices à traiter: ${exercises.length}`);

  let updated = 0;
  let skipped = 0;

  const BATCH_SIZE = 100;
  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);

    for (const exercise of batch) {
      const keywords = generateKeywords(exercise);

      if (keywords.length === 0) {
        keywords.push('training', 'exercise', 'fitness');
      }

      const { error: updateError } = await supabase
        .from('exercises')
        .update({ visual_keywords: keywords })
        .eq('id', exercise.id);

      if (updateError) {
        skipped++;
      } else {
        updated++;
      }
    }

    console.log(`  ⏳ Progression: ${Math.min(i + BATCH_SIZE, exercises.length)}/${exercises.length}`);
  }

  console.log(`\n✅ Enrichissement terminé:`);
  console.log(`  - Mis à jour: ${updated}`);
  console.log(`  - Ignorés: ${skipped}`);
}

async function main() {
  try {
    await enrichVisualKeywords();
    console.log('\n✅ Script terminé avec succès\n');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const tempoByMovementPattern: Record<string, string> = {
  'push': '3-0-1-0',
  'pull': '3-0-1-0',
  'squat': '3-0-2-0',
  'hinge': '3-0-2-0',
  'carry': '0-0-0-0',
  'olympic': '0-0-0-0',
  'gymnastic': '0-0-0-0',
  'hold': '0-0-0-0',
  'dynamic': '0-0-0-0',
  'cardio': '0-0-0-0',
  'isolation': '2-1-2-1',
  'compound': '3-0-2-0'
};

const tempoByDiscipline: Record<string, string> = {
  'force': '3-0-2-0',
  'functional': '0-0-0-0',
  'calisthenics': '2-0-2-0',
  'endurance': '0-0-0-0',
  'competitions': '0-0-0-0'
};

async function enrichTempoData() {
  console.log('⏱️  ENRICHISSEMENT DES DONNÉES TEMPO');
  console.log('='.repeat(60));

  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name, discipline, category, movement_pattern, tempo')
    .or('tempo.is.null,tempo.eq.');

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
      let tempoValue = '3-0-2-0';

      if (exercise.movement_pattern && tempoByMovementPattern[exercise.movement_pattern]) {
        tempoValue = tempoByMovementPattern[exercise.movement_pattern];
      } else if (tempoByDiscipline[exercise.discipline]) {
        tempoValue = tempoByDiscipline[exercise.discipline];
      }

      const { error: updateError } = await supabase
        .from('exercises')
        .update({ tempo: tempoValue })
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
    await enrichTempoData();
    console.log('\n✅ Script terminé avec succès\n');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

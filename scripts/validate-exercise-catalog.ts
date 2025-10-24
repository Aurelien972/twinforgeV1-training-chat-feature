import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ValidationReport {
  totalExercises: number;
  byDiscipline: Record<string, number>;
  byDifficulty: Record<string, number>;
  missingMuscles: number;
  missingEquipment: number;
  missingVisualKeywords: number;
  missingCoachingCues: number;
  missingProgressions: number;
  missingTempoData: number;
  orphanedExercises: string[];
  inconsistentCategories: string[];
  errors: string[];
}

async function validateExerciseCatalog(): Promise<ValidationReport> {
  const report: ValidationReport = {
    totalExercises: 0,
    byDiscipline: {},
    byDifficulty: {},
    missingMuscles: 0,
    missingEquipment: 0,
    missingVisualKeywords: 0,
    missingCoachingCues: 0,
    missingProgressions: 0,
    missingTempoData: 0,
    orphanedExercises: [],
    inconsistentCategories: [],
    errors: []
  };

  console.log('🔍 AUDIT DU CATALOGUE D\'EXERCICES');
  console.log('='.repeat(60));

  // 1. Comptage total et par discipline
  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select('id, name, discipline, difficulty, category, movement_pattern, tempo, visual_keywords, is_validated');

  if (exError || !exercises) {
    report.errors.push(`Erreur lecture exercises: ${exError?.message}`);
    return report;
  }

  report.totalExercises = exercises.length;
  console.log(`\n📊 Total exercices: ${report.totalExercises}`);

  // Grouper par discipline
  exercises.forEach(ex => {
    report.byDiscipline[ex.discipline] = (report.byDiscipline[ex.discipline] || 0) + 1;
    report.byDifficulty[ex.difficulty] = (report.byDifficulty[ex.difficulty] || 0) + 1;
  });

  console.log('\n📈 Répartition par discipline:');
  Object.entries(report.byDiscipline).forEach(([disc, count]) => {
    console.log(`  ${disc.padEnd(15)}: ${count}`);
  });

  console.log('\n📊 Répartition par difficulté:');
  Object.entries(report.byDifficulty).forEach(([diff, count]) => {
    console.log(`  ${diff.padEnd(15)}: ${count}`);
  });

  // 2. Vérifier muscles assignés
  console.log('\n🔬 Vérification des relations muscles...');
  const { data: exercisesWithMuscles } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      exercise_muscle_groups(muscle_group_id, involvement_type)
    `);

  if (exercisesWithMuscles) {
    exercisesWithMuscles.forEach(ex => {
      if (!ex.exercise_muscle_groups || ex.exercise_muscle_groups.length === 0) {
        report.missingMuscles++;
        report.orphanedExercises.push(`${ex.name} (no muscles)`);
      }
    });
  }

  console.log(`  ❌ Exercices sans muscles: ${report.missingMuscles}`);

  // 3. Vérifier équipements
  console.log('\n🏋️ Vérification des relations équipements...');
  const { data: exercisesWithEquipment } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      discipline,
      exercise_equipment(equipment_id, is_required)
    `);

  if (exercisesWithEquipment) {
    exercisesWithEquipment.forEach(ex => {
      if (ex.discipline !== 'calisthenics' && (!ex.exercise_equipment || ex.exercise_equipment.length === 0)) {
        report.missingEquipment++;
        if (!report.orphanedExercises.includes(`${ex.name} (no muscles)`)) {
          report.orphanedExercises.push(`${ex.name} (no equipment)`);
        }
      }
    });
  }

  console.log(`  ❌ Exercices sans équipement (hors calisthenics): ${report.missingEquipment}`);

  // 4. Vérifier visual keywords
  console.log('\n🎨 Vérification visual keywords...');
  exercises.forEach(ex => {
    if (!ex.visual_keywords || ex.visual_keywords.length === 0) {
      report.missingVisualKeywords++;
    }
  });
  console.log(`  ❌ Exercices sans visual_keywords: ${report.missingVisualKeywords}`);

  // 5. Vérifier tempo data
  console.log('\n⏱️ Vérification données tempo...');
  exercises.forEach(ex => {
    if (!ex.tempo || ex.tempo === '') {
      report.missingTempoData++;
    }
  });
  console.log(`  ❌ Exercices sans tempo: ${report.missingTempoData}`);

  // 6. Vérifier coaching cues
  console.log('\n💬 Vérification coaching cues...');
  const { data: cuesCount } = await supabase
    .from('exercise_coaching_cues')
    .select('exercise_id', { count: 'exact', head: true });

  const { data: exercisesWithCues } = await supabase
    .from('exercises')
    .select(`
      id,
      exercise_coaching_cues(id)
    `);

  if (exercisesWithCues) {
    exercisesWithCues.forEach(ex => {
      if (!ex.exercise_coaching_cues || ex.exercise_coaching_cues.length === 0) {
        report.missingCoachingCues++;
      }
    });
  }

  console.log(`  ℹ️  Total coaching cues: ${cuesCount || 0}`);
  console.log(`  ❌ Exercices sans coaching cues: ${report.missingCoachingCues}`);

  // 7. Vérifier progressions
  console.log('\n📈 Vérification progressions/regressions...');
  const { data: progressionsCount } = await supabase
    .from('exercise_progressions')
    .select('*', { count: 'exact', head: true });

  const { data: exercisesWithProgressions } = await supabase
    .from('exercises')
    .select(`
      id,
      difficulty,
      exercise_progressions_base:exercise_progressions!exercise_id(id)
    `);

  if (exercisesWithProgressions) {
    exercisesWithProgressions.forEach(ex => {
      if (ex.difficulty !== 'beginner' && (!ex.exercise_progressions_base || ex.exercise_progressions_base.length === 0)) {
        report.missingProgressions++;
      }
    });
  }

  console.log(`  ℹ️  Total progressions/regressions: ${progressionsCount || 0}`);
  console.log(`  ❌ Exercices intermédiaires+ sans progressions: ${report.missingProgressions}`);

  // 8. Vérifier cohérence discipline/category
  console.log('\n🔄 Vérification cohérence discipline/category...');
  const disciplineCategoryMap: Record<string, string[]> = {
    'force': ['push', 'pull', 'squat', 'hinge', 'carry', 'isolation', 'olympic'],
    'functional': ['olympic', 'gymnastic', 'cardio', 'hybrid', 'benchmark_wod', 'metcon'],
    'endurance': ['run', 'cycle', 'swim', 'row', 'ski', 'cardio', 'intervals'],
    'calisthenics': ['push', 'pull', 'squat', 'core', 'skills', 'holds', 'dynamic'],
    'competitions': ['hyrox_station', 'deka_zone', 'ocr_obstacle', 'hybrid']
  };

  exercises.forEach(ex => {
    const validCategories = disciplineCategoryMap[ex.discipline] || [];
    if (ex.category && !validCategories.includes(ex.category)) {
      report.inconsistentCategories.push(`${ex.name}: ${ex.discipline}/${ex.category}`);
    }
  });

  console.log(`  ❌ Incohérences discipline/category: ${report.inconsistentCategories.length}`);

  // 9. Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ DE L\'AUDIT');
  console.log('='.repeat(60));
  console.log(`✅ Exercices validés: ${exercises.filter(e => e.is_validated).length}`);
  console.log(`⚠️  Exercices orphelins: ${report.orphanedExercises.length}`);
  console.log(`⚠️  Incohérences catégories: ${report.inconsistentCategories.length}`);
  console.log(`\n🎯 PRIORISATION DES ACTIONS:`);
  console.log(`  1. Assigner muscles (${report.missingMuscles} exercices)`);
  console.log(`  2. Assigner équipements (${report.missingEquipment} exercices)`);
  console.log(`  3. Ajouter visual keywords (${report.missingVisualKeywords} exercices)`);
  console.log(`  4. Ajouter tempo data (${report.missingTempoData} exercices)`);
  console.log(`  5. Créer coaching cues (${report.missingCoachingCues} exercices)`);
  console.log(`  6. Créer progressions (${report.missingProgressions} exercices)`);

  if (report.orphanedExercises.length > 0) {
    console.log(`\n⚠️  EXERCICES ORPHELINS (premiers 10):`);
    report.orphanedExercises.slice(0, 10).forEach(name => console.log(`  - ${name}`));
  }

  if (report.inconsistentCategories.length > 0) {
    console.log(`\n⚠️  INCOHÉRENCES CATÉGORIES (premiers 10):`);
    report.inconsistentCategories.slice(0, 10).forEach(item => console.log(`  - ${item}`));
  }

  return report;
}

async function main() {
  try {
    const report = await validateExerciseCatalog();
    console.log('\n✅ Audit terminé avec succès\n');
  } catch (error) {
    console.error('❌ Erreur durant l\'audit:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

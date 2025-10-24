import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateStatisticsReport() {
  console.log('📊 RAPPORT STATISTIQUES COMPLET DU CATALOGUE D\'EXERCICES');
  console.log('='.repeat(70));

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*');

  if (!exercises) {
    console.error('❌ Impossible de récupérer les exercices');
    return;
  }

  console.log(`\n📈 TOTAUX GÉNÉRAUX`);
  console.log('-'.repeat(70));
  console.log(`Total exercices: ${exercises.length}`);
  console.log(`Exercices validés: ${exercises.filter(e => e.is_validated).length}`);
  console.log(`Exercices actifs: ${exercises.filter(e => e.is_active).length}`);

  console.log(`\n🎯 RÉPARTITION PAR DISCIPLINE`);
  console.log('-'.repeat(70));
  const byDiscipline: Record<string, any> = {};
  exercises.forEach(ex => {
    if (!byDiscipline[ex.discipline]) {
      byDiscipline[ex.discipline] = {
        total: 0,
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        elite: 0
      };
    }
    byDiscipline[ex.discipline].total++;
    byDiscipline[ex.discipline][ex.difficulty]++;
  });

  Object.entries(byDiscipline).forEach(([discipline, stats]) => {
    console.log(`\n${discipline.toUpperCase()}: ${stats.total} exercices`);
    console.log(`  Beginner:     ${stats.beginner}`);
    console.log(`  Intermediate: ${stats.intermediate}`);
    console.log(`  Advanced:     ${stats.advanced}`);
    console.log(`  Elite:        ${stats.elite}`);
  });

  console.log(`\n📋 RÉPARTITION PAR CATÉGORIE`);
  console.log('-'.repeat(70));
  const byCategory: Record<string, number> = {};
  exercises.forEach(ex => {
    if (ex.category) {
      byCategory[ex.category] = (byCategory[ex.category] || 0) + 1;
    }
  });
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat.padEnd(25)}: ${count}`);
    });

  console.log(`\n🎨 ENRICHISSEMENT VISUEL`);
  console.log('-'.repeat(70));
  const withKeywords = exercises.filter(e => e.visual_keywords && e.visual_keywords.length > 0).length;
  const withTempo = exercises.filter(e => e.tempo && e.tempo !== '').length;
  console.log(`Exercices avec visual_keywords: ${withKeywords}/${exercises.length} (${(withKeywords / exercises.length * 100).toFixed(1)}%)`);
  console.log(`Exercices avec tempo:           ${withTempo}/${exercises.length} (${(withTempo / exercises.length * 100).toFixed(1)}%)`);

  const { count: cuesCount } = await supabase
    .from('exercise_coaching_cues')
    .select('*', { count: 'exact', head: true });

  console.log(`\n💬 COACHING CUES`);
  console.log('-'.repeat(70));
  console.log(`Total coaching cues: ${cuesCount || 0}`);
  if (cuesCount && cuesCount > 0) {
    console.log(`Moyenne par exercice: ${(cuesCount / exercises.length).toFixed(2)}`);

    const { data: cuesByType } = await supabase
      .from('exercise_coaching_cues')
      .select('cue_type');

    if (cuesByType) {
      const typeCount: Record<string, number> = {};
      cuesByType.forEach((cue: any) => {
        typeCount[cue.cue_type] = (typeCount[cue.cue_type] || 0) + 1;
      });

      console.log('\nPar type:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  ${type.padEnd(20)}: ${count}`);
      });
    }
  }

  const { count: progressionsCount } = await supabase
    .from('exercise_progressions')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 PROGRESSIONS & RÉGRESSIONS`);
  console.log('-'.repeat(70));
  console.log(`Total progressions/regressions: ${progressionsCount || 0}`);

  if (progressionsCount && progressionsCount > 0) {
    const { data: progByType } = await supabase
      .from('exercise_progressions')
      .select('relationship_type');

    if (progByType) {
      const typeCount: Record<string, number> = {};
      progByType.forEach((prog: any) => {
        typeCount[prog.relationship_type] = (typeCount[prog.relationship_type] || 0) + 1;
      });

      console.log('\nPar type de relation:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  ${type.padEnd(20)}: ${count}`);
      });
    }
  }

  const { count: substitutionsCount } = await supabase
    .from('exercise_substitutions')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🔄 SUBSTITUTIONS D'ÉQUIPEMENTS`);
  console.log('-'.repeat(70));
  console.log(`Total substitutions: ${substitutionsCount || 0}`);

  if (substitutionsCount && substitutionsCount > 0) {
    const { data: subsByType } = await supabase
      .from('exercise_substitutions')
      .select('substitution_type, similarity_score');

    if (subsByType) {
      const typeCount: Record<string, number> = {};
      let totalScore = 0;

      subsByType.forEach((sub: any) => {
        typeCount[sub.substitution_type] = (typeCount[sub.substitution_type] || 0) + 1;
        totalScore += sub.similarity_score || 0;
      });

      console.log('\nPar type:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  ${type.padEnd(25)}: ${count}`);
      });

      console.log(`\nScore de similarité moyen: ${(totalScore / subsByType.length).toFixed(2)}`);
    }
  }

  const { count: muscleGroupsCount } = await supabase
    .from('exercise_muscle_groups')
    .select('*', { count: 'exact', head: true });

  console.log(`\n💪 RELATIONS MUSCLES`);
  console.log('-'.repeat(70));
  console.log(`Total relations muscles: ${muscleGroupsCount || 0}`);

  if (muscleGroupsCount && muscleGroupsCount > 0) {
    const { data: musclesByType } = await supabase
      .from('exercise_muscle_groups')
      .select('involvement_type');

    if (musclesByType) {
      const typeCount: Record<string, number> = {};
      musclesByType.forEach((mg: any) => {
        typeCount[mg.involvement_type] = (typeCount[mg.involvement_type] || 0) + 1;
      });

      console.log('\nPar type d\'implication:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  ${type.padEnd(20)}: ${count}`);
      });
    }
  }

  const { count: equipmentRelationsCount } = await supabase
    .from('exercise_equipment')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🏋️ RELATIONS ÉQUIPEMENTS`);
  console.log('-'.repeat(70));
  console.log(`Total relations équipements: ${equipmentRelationsCount || 0}`);

  console.log(`\n🎯 COVERAGE PAR COACH IA`);
  console.log('-'.repeat(70));
  const coachMapping: Record<string, string> = {
    'force': 'Coach Force/Powerbuilding',
    'functional': 'Coach Functional/CrossFit',
    'endurance': 'Coach Endurance',
    'calisthenics': 'Coach Calisthenics/Street',
    'competitions': 'Coach Competitions (HYROX/DEKA)'
  };

  Object.entries(byDiscipline).forEach(([discipline, stats]) => {
    const coachName = coachMapping[discipline] || discipline;
    console.log(`\n${coachName}:`);
    console.log(`  Exercices disponibles: ${stats.total}`);
    console.log(`  Niveaux couverts: ${Object.keys(stats).filter(k => k !== 'total' && stats[k] > 0).length}/4`);
  });

  console.log(`\n✅ QUALITÉ GLOBALE DU CATALOGUE`);
  console.log('-'.repeat(70));
  const completenessScore = (
    (withKeywords / exercises.length) * 0.2 +
    (withTempo / exercises.length) * 0.1 +
    ((cuesCount || 0) / exercises.length / 3) * 0.3 +
    ((progressionsCount || 0) / exercises.length / 5) * 0.2 +
    ((substitutionsCount || 0) / exercises.length / 5) * 0.2
  ) * 100;

  console.log(`Score de complétude: ${completenessScore.toFixed(1)}%`);

  if (completenessScore >= 80) {
    console.log('🎉 Excellent! Le catalogue est riche et bien enrichi.');
  } else if (completenessScore >= 60) {
    console.log('👍 Bon! Le catalogue est correctement enrichi.');
  } else if (completenessScore >= 40) {
    console.log('⚠️  Moyen. Il reste des enrichissements à effectuer.');
  } else {
    console.log('❌ Faible. Le catalogue nécessite des enrichissements importants.');
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Rapport terminé\n');
}

async function main() {
  try {
    await generateStatisticsReport();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

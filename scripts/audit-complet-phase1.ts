import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuditReport {
  timestamp: string;
  overview: {
    totalExercises: number;
    validatedExercises: number;
    activeExercises: number;
  };
  byDiscipline: Record<string, DisciplineStats>;
  byDifficulty: Record<string, number>;
  byCategory: Record<string, number>;
  contextCoverage: {
    gym: number;
    home: number;
    outdoor: number;
  };
  metadataCompleteness: {
    withMuscles: number;
    withEquipment: number;
    withVisualKeywords: number;
    withTempo: number;
    withCoachingCues: number;
    withProgressions: number;
  };
  missingData: {
    exercisesWithoutMuscles: Array<{ id: string; name: string }>;
    exercisesWithoutEquipment: Array<{ id: string; name: string; discipline: string }>;
    exercisesWithoutKeywords: Array<{ id: string; name: string }>;
    exercisesWithoutTempo: Array<{ id: string; name: string }>;
    exercisesWithoutCues: Array<{ id: string; name: string }>;
  };
  progressionGaps: {
    exercisesWithoutProgressions: number;
    exercisesWithoutRegressions: number;
  };
  qualityMetrics: {
    averageQualityScore: number;
    exercisesNeedingReview: number;
    completenessPercentage: number;
  };
  recommendations: string[];
}

interface DisciplineStats {
  total: number;
  beginner: number;
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
  master: number;
}

async function runComprehensiveAudit(): Promise<AuditReport> {
  console.log('🔍 AUDIT COMPLET - PHASE 1/12');
  console.log('='.repeat(80));
  console.log('Analyse approfondie de la base de données exercices\n');

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    overview: { totalExercises: 0, validatedExercises: 0, activeExercises: 0 },
    byDiscipline: {},
    byDifficulty: {},
    byCategory: {},
    contextCoverage: { gym: 0, home: 0, outdoor: 0 },
    metadataCompleteness: {
      withMuscles: 0,
      withEquipment: 0,
      withVisualKeywords: 0,
      withTempo: 0,
      withCoachingCues: 0,
      withProgressions: 0
    },
    missingData: {
      exercisesWithoutMuscles: [],
      exercisesWithoutEquipment: [],
      exercisesWithoutKeywords: [],
      exercisesWithoutTempo: [],
      exercisesWithoutCues: []
    },
    progressionGaps: {
      exercisesWithoutProgressions: 0,
      exercisesWithoutRegressions: 0
    },
    qualityMetrics: {
      averageQualityScore: 0,
      exercisesNeedingReview: 0,
      completenessPercentage: 0
    },
    recommendations: []
  };

  // ============================================================================
  // 1. OVERVIEW GÉNÉRAL
  // ============================================================================
  console.log('📊 1. OVERVIEW GÉNÉRAL');
  console.log('-'.repeat(80));

  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select('id, name, discipline, difficulty, category, movement_pattern, tempo, visual_keywords, is_validated, is_active, quality_score');

  if (exError || !exercises) {
    console.error('❌ Erreur lors de la récupération des exercices:', exError?.message);
    return report;
  }

  report.overview.totalExercises = exercises.length;
  report.overview.validatedExercises = exercises.filter(e => e.is_validated).length;
  report.overview.activeExercises = exercises.filter(e => e.is_active).length;

  console.log(`Total exercices:     ${report.overview.totalExercises}`);
  console.log(`Exercices validés:   ${report.overview.validatedExercises} (${(report.overview.validatedExercises / report.overview.totalExercises * 100).toFixed(1)}%)`);
  console.log(`Exercices actifs:    ${report.overview.activeExercises} (${(report.overview.activeExercises / report.overview.totalExercises * 100).toFixed(1)}%)`);

  // ============================================================================
  // 2. RÉPARTITION PAR DISCIPLINE
  // ============================================================================
  console.log('\n🎯 2. RÉPARTITION PAR DISCIPLINE ET NIVEAU');
  console.log('-'.repeat(80));

  exercises.forEach(ex => {
    if (!report.byDiscipline[ex.discipline]) {
      report.byDiscipline[ex.discipline] = {
        total: 0,
        beginner: 0,
        novice: 0,
        intermediate: 0,
        advanced: 0,
        elite: 0,
        master: 0
      };
    }
    report.byDiscipline[ex.discipline].total++;
    if (ex.difficulty) {
      report.byDiscipline[ex.discipline][ex.difficulty as keyof DisciplineStats]++;
    }
    report.byDifficulty[ex.difficulty] = (report.byDifficulty[ex.difficulty] || 0) + 1;
  });

  Object.entries(report.byDiscipline).forEach(([discipline, stats]) => {
    console.log(`\n${discipline.toUpperCase()}: ${stats.total} exercices`);
    console.log(`  Beginner:     ${stats.beginner.toString().padStart(4)} (${(stats.beginner / stats.total * 100).toFixed(1)}%)`);
    console.log(`  Novice:       ${stats.novice.toString().padStart(4)} (${(stats.novice / stats.total * 100).toFixed(1)}%)`);
    console.log(`  Intermediate: ${stats.intermediate.toString().padStart(4)} (${(stats.intermediate / stats.total * 100).toFixed(1)}%)`);
    console.log(`  Advanced:     ${stats.advanced.toString().padStart(4)} (${(stats.advanced / stats.total * 100).toFixed(1)}%)`);
    console.log(`  Elite:        ${stats.elite.toString().padStart(4)} (${(stats.elite / stats.total * 100).toFixed(1)}%)`);
    console.log(`  Master:       ${stats.master.toString().padStart(4)} (${(stats.master / stats.total * 100).toFixed(1)}%)`);
  });

  // ============================================================================
  // 3. RÉPARTITION PAR CATÉGORIE
  // ============================================================================
  console.log('\n📋 3. RÉPARTITION PAR CATÉGORIE');
  console.log('-'.repeat(80));

  exercises.forEach(ex => {
    if (ex.category) {
      report.byCategory[ex.category] = (report.byCategory[ex.category] || 0) + 1;
    }
  });

  const sortedCategories = Object.entries(report.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  console.log('Top 20 catégories:');
  sortedCategories.forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(30)}: ${count}`);
  });

  // ============================================================================
  // 4. COUVERTURE PAR CONTEXTE (ÉQUIPEMENT)
  // ============================================================================
  console.log('\n🏋️ 4. COUVERTURE PAR CONTEXTE D\'ENTRAÎNEMENT');
  console.log('-'.repeat(80));

  const { data: equipmentRelations } = await supabase
    .from('exercise_equipment')
    .select('exercise_id, equipment_id, equipment_types(id, category_id, equipment_categories(location_types))');

  if (equipmentRelations) {
    const gymExercises = new Set<string>();
    const homeExercises = new Set<string>();
    const outdoorExercises = new Set<string>();

    equipmentRelations.forEach((rel: any) => {
      const locationTypes = rel.equipment_types?.equipment_categories?.location_types || [];
      if (locationTypes.includes('gym')) gymExercises.add(rel.exercise_id);
      if (locationTypes.includes('home')) homeExercises.add(rel.exercise_id);
      if (locationTypes.includes('outdoor')) outdoorExercises.add(rel.exercise_id);
    });

    report.contextCoverage.gym = gymExercises.size;
    report.contextCoverage.home = homeExercises.size;
    report.contextCoverage.outdoor = outdoorExercises.size;

    console.log(`Exercices salle de sport:    ${report.contextCoverage.gym}`);
    console.log(`Exercices maison:            ${report.contextCoverage.home}`);
    console.log(`Exercices extérieur:         ${report.contextCoverage.outdoor}`);
  }

  // ============================================================================
  // 5. COMPLÉTUDE DES MÉTADONNÉES
  // ============================================================================
  console.log('\n📝 5. COMPLÉTUDE DES MÉTADONNÉES');
  console.log('-'.repeat(80));

  // Muscles
  const { data: exercisesWithMuscles } = await supabase
    .from('exercises')
    .select('id, name, discipline, exercise_muscle_groups(id)');

  if (exercisesWithMuscles) {
    exercisesWithMuscles.forEach((ex: any) => {
      if (ex.exercise_muscle_groups && ex.exercise_muscle_groups.length > 0) {
        report.metadataCompleteness.withMuscles++;
      } else {
        report.missingData.exercisesWithoutMuscles.push({ id: ex.id, name: ex.name });
      }
    });
  }

  // Équipement
  const { data: exercisesWithEquipment } = await supabase
    .from('exercises')
    .select('id, name, discipline, exercise_equipment(id)');

  if (exercisesWithEquipment) {
    exercisesWithEquipment.forEach((ex: any) => {
      const hasEquipment = ex.exercise_equipment && ex.exercise_equipment.length > 0;
      const isCalisthenics = ex.discipline === 'calisthenics';

      if (hasEquipment) {
        report.metadataCompleteness.withEquipment++;
      } else if (!isCalisthenics) {
        report.missingData.exercisesWithoutEquipment.push({
          id: ex.id,
          name: ex.name,
          discipline: ex.discipline
        });
      }
    });
  }

  // Visual keywords
  exercises.forEach(ex => {
    if (ex.visual_keywords && ex.visual_keywords.length > 0) {
      report.metadataCompleteness.withVisualKeywords++;
    } else {
      report.missingData.exercisesWithoutKeywords.push({ id: ex.id, name: ex.name });
    }
  });

  // Tempo
  exercises.forEach(ex => {
    if (ex.tempo && ex.tempo !== '') {
      report.metadataCompleteness.withTempo++;
    } else {
      report.missingData.exercisesWithoutTempo.push({ id: ex.id, name: ex.name });
    }
  });

  // Coaching cues
  const { data: cuesData } = await supabase
    .from('exercise_coaching_cues')
    .select('exercise_id');

  const exercisesWithCues = new Set(cuesData?.map(c => c.exercise_id) || []);
  report.metadataCompleteness.withCoachingCues = exercisesWithCues.size;

  exercises.forEach(ex => {
    if (!exercisesWithCues.has(ex.id)) {
      report.missingData.exercisesWithoutCues.push({ id: ex.id, name: ex.name });
    }
  });

  console.log(`Exercices avec muscles:         ${report.metadataCompleteness.withMuscles}/${report.overview.totalExercises} (${(report.metadataCompleteness.withMuscles / report.overview.totalExercises * 100).toFixed(1)}%)`);
  console.log(`Exercices avec équipement:      ${report.metadataCompleteness.withEquipment}/${report.overview.totalExercises} (${(report.metadataCompleteness.withEquipment / report.overview.totalExercises * 100).toFixed(1)}%)`);
  console.log(`Exercices avec visual_keywords: ${report.metadataCompleteness.withVisualKeywords}/${report.overview.totalExercises} (${(report.metadataCompleteness.withVisualKeywords / report.overview.totalExercises * 100).toFixed(1)}%)`);
  console.log(`Exercices avec tempo:           ${report.metadataCompleteness.withTempo}/${report.overview.totalExercises} (${(report.metadataCompleteness.withTempo / report.overview.totalExercises * 100).toFixed(1)}%)`);
  console.log(`Exercices avec coaching cues:   ${report.metadataCompleteness.withCoachingCues}/${report.overview.totalExercises} (${(report.metadataCompleteness.withCoachingCues / report.overview.totalExercises * 100).toFixed(1)}%)`);

  // ============================================================================
  // 6. PROGRESSIONS ET RÉGRESSIONS
  // ============================================================================
  console.log('\n🔄 6. CHAÎNES DE PROGRESSION');
  console.log('-'.repeat(80));

  const { data: progressions } = await supabase
    .from('exercise_progressions')
    .select('exercise_id, relationship_type');

  const exercisesWithProgressions = new Set<string>();
  const exercisesWithRegressions = new Set<string>();

  progressions?.forEach(prog => {
    if (prog.relationship_type === 'progression') {
      exercisesWithProgressions.add(prog.exercise_id);
    }
    if (prog.relationship_type === 'regression') {
      exercisesWithRegressions.add(prog.exercise_id);
    }
  });

  report.metadataCompleteness.withProgressions = exercisesWithProgressions.size;
  report.progressionGaps.exercisesWithoutProgressions = report.overview.totalExercises - exercisesWithProgressions.size;
  report.progressionGaps.exercisesWithoutRegressions = report.overview.totalExercises - exercisesWithRegressions.size;

  console.log(`Total relations progression:     ${progressions?.length || 0}`);
  console.log(`Exercices avec progressions:     ${exercisesWithProgressions.size}/${report.overview.totalExercises} (${(exercisesWithProgressions.size / report.overview.totalExercises * 100).toFixed(1)}%)`);
  console.log(`Exercices avec régressions:      ${exercisesWithRegressions.size}/${report.overview.totalExercises} (${(exercisesWithRegressions.size / report.overview.totalExercises * 100).toFixed(1)}%)`);
  console.log(`Exercices isolés (sans lien):    ${report.progressionGaps.exercisesWithoutProgressions}`);

  // ============================================================================
  // 7. MÉTRIQUES DE QUALITÉ
  // ============================================================================
  console.log('\n⭐ 7. MÉTRIQUES DE QUALITÉ');
  console.log('-'.repeat(80));

  const totalQualityScore = exercises.reduce((sum, ex) => sum + (ex.quality_score || 0), 0);
  report.qualityMetrics.averageQualityScore = totalQualityScore / exercises.length;
  report.qualityMetrics.exercisesNeedingReview = exercises.filter(ex => !ex.is_validated || (ex.quality_score || 0) < 3).length;

  // Calculate completeness percentage
  const totalMetadataPoints = report.overview.totalExercises * 5; // 5 metadata points per exercise
  const actualMetadataPoints =
    report.metadataCompleteness.withMuscles +
    report.metadataCompleteness.withEquipment +
    report.metadataCompleteness.withVisualKeywords +
    report.metadataCompleteness.withTempo +
    report.metadataCompleteness.withCoachingCues;

  report.qualityMetrics.completenessPercentage = (actualMetadataPoints / totalMetadataPoints) * 100;

  console.log(`Score qualité moyen:             ${report.qualityMetrics.averageQualityScore.toFixed(2)}/5.0`);
  console.log(`Exercices nécessitant révision:  ${report.qualityMetrics.exercisesNeedingReview} (${(report.qualityMetrics.exercisesNeedingReview / report.overview.totalExercises * 100).toFixed(1)}%)`);
  console.log(`Complétude métadonnées globale:  ${report.qualityMetrics.completenessPercentage.toFixed(1)}%`);

  // ============================================================================
  // 8. RECOMMANDATIONS
  // ============================================================================
  console.log('\n💡 8. RECOMMANDATIONS PRIORITAIRES');
  console.log('-'.repeat(80));

  // Generate recommendations based on gaps
  if (report.missingData.exercisesWithoutMuscles.length > 50) {
    report.recommendations.push(`🔴 CRITIQUE: ${report.missingData.exercisesWithoutMuscles.length} exercices sans muscles assignés - Impact majeur sur prescription IA`);
  }

  if (report.missingData.exercisesWithoutEquipment.length > 100) {
    report.recommendations.push(`🟠 IMPORTANT: ${report.missingData.exercisesWithoutEquipment.length} exercices sans équipement - Limite détection contexte`);
  }

  if (report.missingData.exercisesWithoutKeywords.length > 0) {
    report.recommendations.push(`🟡 MOYEN: ${report.missingData.exercisesWithoutKeywords.length} exercices sans visual_keywords - Affecte génération illustrations`);
  }

  if (report.metadataCompleteness.withCoachingCues < report.overview.totalExercises * 0.5) {
    report.recommendations.push(`🟠 IMPORTANT: Seulement ${((report.metadataCompleteness.withCoachingCues / report.overview.totalExercises) * 100).toFixed(1)}% des exercices ont des coaching cues`);
  }

  if (report.progressionGaps.exercisesWithoutProgressions > report.overview.totalExercises * 0.7) {
    report.recommendations.push(`🟠 IMPORTANT: ${((report.progressionGaps.exercisesWithoutProgressions / report.overview.totalExercises) * 100).toFixed(1)}% des exercices n'ont pas de progressions définies`);
  }

  if (report.contextCoverage.home < 200) {
    report.recommendations.push(`🟡 MOYEN: Seulement ${report.contextCoverage.home} exercices disponibles pour contexte maison`);
  }

  if (report.contextCoverage.outdoor < 100) {
    report.recommendations.push(`🟡 MOYEN: Seulement ${report.contextCoverage.outdoor} exercices disponibles pour contexte extérieur`);
  }

  if (report.byDiscipline.force?.total > 700 && (!report.byDiscipline.mobility || report.byDiscipline.mobility.total < 50)) {
    report.recommendations.push(`🔴 CRITIQUE: Déséquilibre disciplines - Force: ${report.byDiscipline.force?.total || 0}, Mobilité: ${report.byDiscipline.mobility?.total || 0}`);
  }

  report.recommendations.forEach(rec => console.log(rec));

  // ============================================================================
  // 9. LACUNES SPÉCIFIQUES PAR DISCIPLINE
  // ============================================================================
  console.log('\n🎯 9. LACUNES SPÉCIFIQUES PAR DISCIPLINE');
  console.log('-'.repeat(80));

  // Analyze gaps per discipline
  Object.entries(report.byDiscipline).forEach(([discipline, stats]) => {
    const gaps: string[] = [];

    if (stats.beginner < stats.total * 0.15) {
      gaps.push(`manque exercices débutants (${stats.beginner})`);
    }
    if (stats.advanced + stats.elite < stats.total * 0.2) {
      gaps.push(`manque exercices avancés/élite (${stats.advanced + stats.elite})`);
    }

    if (gaps.length > 0) {
      console.log(`${discipline}: ${gaps.join(', ')}`);
    }
  });

  // ============================================================================
  // 10. EXPORT DÉTAILS MANQUANTS
  // ============================================================================
  console.log('\n📄 10. DÉTAILS DES DONNÉES MANQUANTES');
  console.log('-'.repeat(80));

  console.log(`\nTop 10 exercices sans muscles:`);
  report.missingData.exercisesWithoutMuscles.slice(0, 10).forEach(ex => {
    console.log(`  - ${ex.name} (${ex.id})`);
  });

  console.log(`\nTop 10 exercices sans équipement (hors calisthenics):`);
  report.missingData.exercisesWithoutEquipment.slice(0, 10).forEach(ex => {
    console.log(`  - ${ex.name} [${ex.discipline}] (${ex.id})`);
  });

  console.log(`\nTop 10 exercices sans coaching cues:`);
  report.missingData.exercisesWithoutCues.slice(0, 10).forEach(ex => {
    console.log(`  - ${ex.name} (${ex.id})`);
  });

  // ============================================================================
  // RÉSUMÉ FINAL
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ EXÉCUTIF - AUDIT PHASE 1');
  console.log('='.repeat(80));

  console.log(`\n✅ Points forts:`);
  console.log(`   - ${report.overview.totalExercises} exercices au catalogue`);
  console.log(`   - ${(report.metadataCompleteness.withVisualKeywords / report.overview.totalExercises * 100).toFixed(1)}% ont des visual keywords`);
  console.log(`   - ${(report.metadataCompleteness.withTempo / report.overview.totalExercises * 100).toFixed(1)}% ont des données tempo`);
  console.log(`   - Bonne couverture discipline Force (${report.byDiscipline.force?.total || 0} exercices)`);

  console.log(`\n⚠️  Axes d'amélioration prioritaires:`);
  console.log(`   - Enrichir ${report.missingData.exercisesWithoutMuscles.length} exercices sans muscles`);
  console.log(`   - Compléter ${report.missingData.exercisesWithoutCues.length} exercices sans coaching cues`);
  console.log(`   - Créer ${report.progressionGaps.exercisesWithoutProgressions} chaînes de progression`);
  console.log(`   - Ajouter exercices mobilité/réhabilitation (actuellement ${report.byDiscipline.mobility?.total || 0})`);
  console.log(`   - Augmenter couverture contexte maison/outdoor`);

  console.log(`\n🎯 Score de complétude global: ${report.qualityMetrics.completenessPercentage.toFixed(1)}%`);

  if (report.qualityMetrics.completenessPercentage >= 80) {
    console.log('   Statut: ✅ EXCELLENT - Base solide pour le coach IA');
  } else if (report.qualityMetrics.completenessPercentage >= 65) {
    console.log('   Statut: ✅ BON - Enrichissements recommandés pour optimisation');
  } else if (report.qualityMetrics.completenessPercentage >= 50) {
    console.log('   Statut: ⚠️  MOYEN - Enrichissements nécessaires');
  } else {
    console.log('   Statut: ❌ FAIBLE - Enrichissements critiques requis');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ AUDIT PHASE 1 TERMINÉ - Passez à la Phase 2\n');

  return report;
}

// Execute audit
runComprehensiveAudit()
  .then(() => {
    console.log('✅ Audit complet terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de l\'audit:', error);
    process.exit(1);
  });

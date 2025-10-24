import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as fs from 'fs';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuditReport {
  // Metadata generales
  executionDate: string;
  totalExercises: number;
  
  // Distribution
  byDiscipline: Record<string, number>;
  byDifficulty: Record<string, number>;
  byCategory: Record<string, number>;
  
  // Completude metadata
  missingMuscles: number;
  missingEquipment: number;
  missingVisualKeywords: number;
  missingCoachingCues: number;
  missingProgressions: number;
  missingTempoData: number;
  missingDescriptions: number;
  missingSafetyNotes: number;
  
  // Progressions
  totalProgressions: number;
  progressionsByType: Record<string, number>;
  exercisesWithProgressions: number;
  exercisesWithRegressions: number;
  
  // Qualite
  qualityScoreDistribution: Record<string, number>;
  avgQualityScore: number;
  exercisesNeedingReview: number;
  
  // Listes detaillees
  exercisesWithoutMuscles: Array<{id: string, name: string, discipline: string}>;
  exercisesWithoutEquipment: Array<{id: string, name: string, discipline: string}>;
  exercisesWithoutCoachingCues: Array<{id: string, name: string, discipline: string, difficulty: string}>;
  exercisesWithoutProgressions: Array<{id: string, name: string, difficulty: string}>;
  duplicatedExercises: Array<{name: string, count: number}>;
  inconsistentCategories: Array<{id: string, name: string, discipline: string, category: string}>;
  
  // Foreign key integrity
  orphanedMuscleRelations: number;
  orphanedEquipmentRelations: number;
  orphanedProgressionRelations: number;
  
  // Priorites d'action
  topPriorities: Array<{priority: number, action: string, count: number, impact: string}>;
}

async function executeAudit(): Promise<AuditReport> {
  const report: AuditReport = {
    executionDate: new Date().toISOString(),
    totalExercises: 0,
    byDiscipline: {},
    byDifficulty: {},
    byCategory: {},
    missingMuscles: 0,
    missingEquipment: 0,
    missingVisualKeywords: 0,
    missingCoachingCues: 0,
    missingProgressions: 0,
    missingTempoData: 0,
    missingDescriptions: 0,
    missingSafetyNotes: 0,
    totalProgressions: 0,
    progressionsByType: {},
    exercisesWithProgressions: 0,
    exercisesWithRegressions: 0,
    qualityScoreDistribution: {},
    avgQualityScore: 0,
    exercisesNeedingReview: 0,
    exercisesWithoutMuscles: [],
    exercisesWithoutEquipment: [],
    exercisesWithoutCoachingCues: [],
    exercisesWithoutProgressions: [],
    duplicatedExercises: [],
    inconsistentCategories: [],
    orphanedMuscleRelations: 0,
    orphanedEquipmentRelations: 0,
    orphanedProgressionRelations: 0,
    topPriorities: []
  };

  console.log('\n' + '='.repeat(80));
  console.log('🔍 SPRINT 1: AUDIT COMPLET DE LA BASE DE DONNEES D\'EXERCICES');
  console.log('='.repeat(80));
  console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
  console.log('='.repeat(80) + '\n');

  // ============================================================================
  // ETAPE 1: COMPTAGES GLOBAUX
  // ============================================================================
  console.log('📊 ETAPE 1/10: Comptages globaux...\n');
  
  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select('*');

  if (exError || !exercises) {
    console.error('❌ Erreur lecture exercises:', exError);
    throw exError;
  }

  report.totalExercises = exercises.length;
  console.log(`   ✅ Total exercices: ${report.totalExercises}`);

  // Distribution par discipline
  exercises.forEach(ex => {
    report.byDiscipline[ex.discipline] = (report.byDiscipline[ex.discipline] || 0) + 1;
    report.byDifficulty[ex.difficulty] = (report.byDifficulty[ex.difficulty] || 0) + 1;
    if (ex.category) {
      report.byCategory[ex.category] = (report.byCategory[ex.category] || 0) + 1;
    }
  });

  console.log('\n   📈 Distribution par discipline:');
  Object.entries(report.byDiscipline)
    .sort((a, b) => b[1] - a[1])
    .forEach(([disc, count]) => {
      const percent = ((count / report.totalExercises) * 100).toFixed(1);
      console.log(`      ${disc.padEnd(20)}: ${String(count).padStart(5)} (${percent}%)`);
    });

  console.log('\n   📊 Distribution par difficulte:');
  Object.entries(report.byDifficulty)
    .sort((a, b) => b[1] - a[1])
    .forEach(([diff, count]) => {
      const percent = ((count / report.totalExercises) * 100).toFixed(1);
      console.log(`      ${diff.padEnd(20)}: ${String(count).padStart(5)} (${percent}%)`);
    });

  // ============================================================================
  // ETAPE 2: VERIFICATION MUSCLES
  // ============================================================================
  console.log('\n\n🔬 ETAPE 2/10: Verification relations muscles...\n');

  const { data: exercisesWithMuscles } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      discipline,
      exercise_muscle_groups(muscle_group_id, involvement_type)
    `);

  if (exercisesWithMuscles) {
    exercisesWithMuscles.forEach(ex => {
      if (!ex.exercise_muscle_groups || ex.exercise_muscle_groups.length === 0) {
        report.missingMuscles++;
        report.exercisesWithoutMuscles.push({
          id: ex.id,
          name: ex.name,
          discipline: ex.discipline
        });
      }
    });
  }

  console.log(`   ℹ️  Exercices avec muscles: ${report.totalExercises - report.missingMuscles}`);
  console.log(`   ❌ Exercices SANS muscles: ${report.missingMuscles}`);
  
  if (report.missingMuscles > 0) {
    const percent = ((report.missingMuscles / report.totalExercises) * 100).toFixed(1);
    console.log(`   📉 Pourcentage incomplet: ${percent}%`);
  }

  // ============================================================================
  // ETAPE 3: VERIFICATION EQUIPEMENT
  // ============================================================================
  console.log('\n\n🏋️ ETAPE 3/10: Verification relations equipements...\n');

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
      // Calisthenics peut etre bodyweight only
      if (ex.discipline !== 'calisthenics' && (!ex.exercise_equipment || ex.exercise_equipment.length === 0)) {
        report.missingEquipment++;
        report.exercisesWithoutEquipment.push({
          id: ex.id,
          name: ex.name,
          discipline: ex.discipline
        });
      }
    });
  }

  console.log(`   ℹ️  Exercices avec equipement: ${report.totalExercises - report.missingEquipment}`);
  console.log(`   ❌ Exercices SANS equipement (hors calisthenics): ${report.missingEquipment}`);

  // ============================================================================
  // ETAPE 4: VERIFICATION COACHING CUES
  // ============================================================================
  console.log('\n\n💬 ETAPE 4/10: Verification coaching cues...\n');

  const { data: exercisesWithCues } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      discipline,
      difficulty,
      exercise_coaching_cues(id, cue_type, target_level)
    `);

  if (exercisesWithCues) {
    exercisesWithCues.forEach(ex => {
      if (!ex.exercise_coaching_cues || ex.exercise_coaching_cues.length === 0) {
        report.missingCoachingCues++;
        report.exercisesWithoutCoachingCues.push({
          id: ex.id,
          name: ex.name,
          discipline: ex.discipline,
          difficulty: ex.difficulty
        });
      }
    });
  }

  console.log(`   ℹ️  Exercices avec coaching cues: ${report.totalExercises - report.missingCoachingCues}`);
  console.log(`   ❌ Exercices SANS coaching cues: ${report.missingCoachingCues}`);
  
  if (report.missingCoachingCues > 0) {
    const percent = ((report.missingCoachingCues / report.totalExercises) * 100).toFixed(1);
    console.log(`   📉 Pourcentage incomplet: ${percent}%`);
  }

  // ============================================================================
  // ETAPE 5: VERIFICATION PROGRESSIONS
  // ============================================================================
  console.log('\n\n📈 ETAPE 5/10: Verification progressions et regressions...\n');

  const { data: allProgressions } = await supabase
    .from('exercise_progressions')
    .select('*');

  if (allProgressions) {
    report.totalProgressions = allProgressions.length;
    
    allProgressions.forEach(prog => {
      const type = prog.relationship_type;
      report.progressionsByType[type] = (report.progressionsByType[type] || 0) + 1;
    });

    // Compter exercices avec progressions
    const exercisesWithProgSet = new Set(allProgressions.map(p => p.exercise_id));
    report.exercisesWithProgressions = exercisesWithProgSet.size;

    // Compter exercices avec regressions (ceux qui sont related_exercise_id d'une regression)
    const exercisesWithRegSet = new Set(
      allProgressions
        .filter(p => p.relationship_type === 'regression')
        .map(p => p.related_exercise_id)
    );
    report.exercisesWithRegressions = exercisesWithRegSet.size;
  }

  console.log(`   ℹ️  Total relations de progression: ${report.totalProgressions}`);
  console.log(`   ℹ️  Exercices avec progressions: ${report.exercisesWithProgressions} (${((report.exercisesWithProgressions / report.totalExercises) * 100).toFixed(1)}%)`);
  console.log(`   ℹ️  Exercices avec regressions: ${report.exercisesWithRegressions}`);
  console.log('\n   📊 Repartition par type:');
  Object.entries(report.progressionsByType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percent = ((count / report.totalProgressions) * 100).toFixed(1);
      console.log(`      ${type.padEnd(20)}: ${String(count).padStart(5)} (${percent}%)`);
    });

  // Identifier exercices sans progressions (intermediaire+)
  exercises.forEach(ex => {
    if (ex.difficulty !== 'beginner' && ex.difficulty !== 'novice') {
      const hasProgression = allProgressions?.some(p => p.exercise_id === ex.id);
      if (!hasProgression) {
        report.missingProgressions++;
        report.exercisesWithoutProgressions.push({
          id: ex.id,
          name: ex.name,
          difficulty: ex.difficulty
        });
      }
    }
  });

  console.log(`\n   ❌ Exercices intermediaire+ SANS progressions: ${report.missingProgressions}`);

  // ============================================================================
  // ETAPE 6: VERIFICATION METADATA COMPLEMENTAIRES
  // ============================================================================
  console.log('\n\n🎨 ETAPE 6/10: Verification metadata complementaires...\n');

  exercises.forEach(ex => {
    if (!ex.visual_keywords || ex.visual_keywords.length === 0) {
      report.missingVisualKeywords++;
    }
    if (!ex.tempo || ex.tempo === '') {
      report.missingTempoData++;
    }
    if (!ex.description_short || ex.description_short === '') {
      report.missingDescriptions++;
    }
    if (!ex.safety_notes || ex.safety_notes.length === 0) {
      report.missingSafetyNotes++;
    }
  });

  console.log(`   ❌ Sans visual_keywords: ${report.missingVisualKeywords}`);
  console.log(`   ❌ Sans tempo: ${report.missingTempoData}`);
  console.log(`   ❌ Sans description: ${report.missingDescriptions}`);
  console.log(`   ❌ Sans safety notes: ${report.missingSafetyNotes}`);

  // ============================================================================
  // ETAPE 7: VERIFICATION QUALITY SCORES
  // ============================================================================
  console.log('\n\n⭐ ETAPE 7/10: Analyse quality scores...\n');

  let totalQuality = 0;
  let countWithQuality = 0;

  exercises.forEach(ex => {
    const score = ex.quality_score || 0;
    totalQuality += score;
    if (score > 0) countWithQuality++;
    
    const scoreRange = Math.floor(score);
    report.qualityScoreDistribution[scoreRange] = (report.qualityScoreDistribution[scoreRange] || 0) + 1;
    
    if (score < 3.0) {
      report.exercisesNeedingReview++;
    }
  });

  report.avgQualityScore = countWithQuality > 0 ? totalQuality / countWithQuality : 0;

  console.log(`   ℹ️  Score moyen: ${report.avgQualityScore.toFixed(2)}/5.0`);
  console.log(`   ℹ️  Exercices avec score: ${countWithQuality}/${report.totalExercises}`);
  console.log(`   ⚠️  Exercices necessitant review (< 3.0): ${report.exercisesNeedingReview}`);

  // ============================================================================
  // ETAPE 8: DETECTION DOUBLONS
  // ============================================================================
  console.log('\n\n🔍 ETAPE 8/10: Detection doublons...\n');

  const nameCount: Record<string, number> = {};
  exercises.forEach(ex => {
    const normalized = ex.name.toLowerCase().trim();
    nameCount[normalized] = (nameCount[normalized] || 0) + 1;
  });

  Object.entries(nameCount).forEach(([name, count]) => {
    if (count > 1) {
      report.duplicatedExercises.push({ name, count });
    }
  });

  if (report.duplicatedExercises.length === 0) {
    console.log(`   ✅ Aucun doublon detecte`);
  } else {
    console.log(`   ⚠️  ${report.duplicatedExercises.length} noms d'exercices dupliques trouves`);
    report.duplicatedExercises.slice(0, 5).forEach(dup => {
      console.log(`      - "${dup.name}" (${dup.count} fois)`);
    });
  }

  // ============================================================================
  // ETAPE 9: VERIFICATION COHERENCE DISCIPLINE/CATEGORY
  // ============================================================================
  console.log('\n\n🔄 ETAPE 9/10: Verification coherence discipline/category...\n');

  const validCombinations: Record<string, string[]> = {
    'force': ['push', 'pull', 'squat', 'hinge', 'carry', 'isolation', 'compound', 'strongman'],
    'functional': ['olympic', 'gymnastic', 'cardio', 'hybrid', 'benchmark_wod', 'metcon', 'metcon format', 'wod combination'],
    'endurance': ['run', 'cycle', 'swim', 'row', 'ski', 'cardio', 'intervals', 'triathlon'],
    'calisthenics': ['push', 'pull', 'squat', 'core', 'skills', 'holds', 'dynamic', 'planche progression', 'front lever progression', 'handstand progression'],
    'competitions': ['hyrox_station', 'deka_zone', 'ocr_obstacle', 'hybrid', 'hyrox training'],
    'mobility': ['stretch', 'flexibility', 'recovery', 'warm-up'],
    'rehab': ['prehab', 'corrective', 'therapy', 'recovery']
  };

  exercises.forEach(ex => {
    if (ex.category) {
      const validCats = validCombinations[ex.discipline] || [];
      const categoryLower = ex.category.toLowerCase();
      if (!validCats.some(cat => categoryLower.includes(cat) || cat.includes(categoryLower))) {
        report.inconsistentCategories.push({
          id: ex.id,
          name: ex.name,
          discipline: ex.discipline,
          category: ex.category
        });
      }
    }
  });

  if (report.inconsistentCategories.length === 0) {
    console.log(`   ✅ Toutes les categories sont coherentes`);
  } else {
    console.log(`   ⚠️  ${report.inconsistentCategories.length} incoherences detectees`);
    report.inconsistentCategories.slice(0, 5).forEach(inc => {
      console.log(`      - ${inc.name}: ${inc.discipline}/${inc.category}`);
    });
  }

  // ============================================================================
  // ETAPE 10: VERIFICATION INTEGRITE FOREIGN KEYS
  // ============================================================================
  console.log('\n\n🔗 ETAPE 10/10: Verification integrite foreign keys...\n');

  // Verifier muscle_groups orphelins
  const { data: orphanedMuscles } = await supabase
    .from('exercise_muscle_groups')
    .select('id, exercise_id')
    .not('exercise_id', 'in', `(${exercises.map(e => `'${e.id}'`).join(',')})`);

  report.orphanedMuscleRelations = orphanedMuscles?.length || 0;

  // Verifier equipment orphelins
  const { data: orphanedEquipment } = await supabase
    .from('exercise_equipment')
    .select('id, exercise_id')
    .not('exercise_id', 'in', `(${exercises.map(e => `'${e.id}'`).join(',')})`);

  report.orphanedEquipmentRelations = orphanedEquipment?.length || 0;

  console.log(`   ℹ️  Relations muscle_groups orphelines: ${report.orphanedMuscleRelations}`);
  console.log(`   ℹ️  Relations equipment orphelines: ${report.orphanedEquipmentRelations}`);

  if (report.orphanedMuscleRelations === 0 && report.orphanedEquipmentRelations === 0) {
    console.log(`   ✅ Integrite des foreign keys: PARFAITE`);
  }

  // ============================================================================
  // GENERATION PRIORITES D'ACTION
  // ============================================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('🎯 PRIORITES D\'ACTION');
  console.log('='.repeat(80) + '\n');

  report.topPriorities = [
    {
      priority: 1,
      action: 'Completer coaching cues manquants',
      count: report.missingCoachingCues,
      impact: 'CRITIQUE - Coach IA ne peut pas guider correctement'
    },
    {
      priority: 2,
      action: 'Assigner muscles aux exercices',
      count: report.missingMuscles,
      impact: 'MAJEUR - Matching et substitution impactes'
    },
    {
      priority: 3,
      action: 'Assigner equipements',
      count: report.missingEquipment,
      impact: 'MAJEUR - Detection contexte impossible'
    },
    {
      priority: 4,
      action: 'Creer progressions/regressions',
      count: report.missingProgressions,
      impact: 'IMPORTANT - Adaptation automatique limitee'
    },
    {
      priority: 5,
      action: 'Completer safety notes',
      count: report.missingSafetyNotes,
      impact: 'IMPORTANT - Securite utilisateur'
    },
    {
      priority: 6,
      action: 'Ajouter visual keywords',
      count: report.missingVisualKeywords,
      impact: 'MOYEN - Generation illustrations'
    }
  ].filter(p => p.count > 0).sort((a, b) => a.priority - b.priority);

  report.topPriorities.forEach(prio => {
    const percent = ((prio.count / report.totalExercises) * 100).toFixed(1);
    console.log(`   ${prio.priority}. ${prio.action}`);
    console.log(`      📊 Exercices concernes: ${prio.count} (${percent}%)`);
    console.log(`      💥 Impact: ${prio.impact}`);
    console.log('');
  });

  return report;
}

async function generateMarkdownReport(report: AuditReport): Promise<void> {
  const markdown = `# SPRINT 1: RAPPORT D'AUDIT COMPLET
**Date d'execution:** ${new Date(report.executionDate).toLocaleString('fr-FR')}
**Total exercices:** ${report.totalExercises}

---

## 📊 STATISTIQUES GLOBALES

### Distribution par Discipline
${Object.entries(report.byDiscipline)
  .sort((a, b) => b[1] - a[1])
  .map(([disc, count]) => {
    const percent = ((count / report.totalExercises) * 100).toFixed(1);
    return `- **${disc}**: ${count} exercices (${percent}%)`;
  })
  .join('\n')}

### Distribution par Difficulte
${Object.entries(report.byDifficulty)
  .sort((a, b) => b[1] - a[1])
  .map(([diff, count]) => {
    const percent = ((count / report.totalExercises) * 100).toFixed(1);
    return `- **${diff}**: ${count} exercices (${percent}%)`;
  })
  .join('\n')}

---

## 🔍 COMPLETUDE DES METADATA

| Metadata | Complets | Manquants | % Completude |
|----------|----------|-----------|--------------|
| Muscles | ${report.totalExercises - report.missingMuscles} | ${report.missingMuscles} | ${(((report.totalExercises - report.missingMuscles) / report.totalExercises) * 100).toFixed(1)}% |
| Equipement | ${report.totalExercises - report.missingEquipment} | ${report.missingEquipment} | ${(((report.totalExercises - report.missingEquipment) / report.totalExercises) * 100).toFixed(1)}% |
| Coaching Cues | ${report.totalExercises - report.missingCoachingCues} | ${report.missingCoachingCues} | ${(((report.totalExercises - report.missingCoachingCues) / report.totalExercises) * 100).toFixed(1)}% |
| Visual Keywords | ${report.totalExercises - report.missingVisualKeywords} | ${report.missingVisualKeywords} | ${(((report.totalExercises - report.missingVisualKeywords) / report.totalExercises) * 100).toFixed(1)}% |
| Tempo | ${report.totalExercises - report.missingTempoData} | ${report.missingTempoData} | ${(((report.totalExercises - report.missingTempoData) / report.totalExercises) * 100).toFixed(1)}% |
| Safety Notes | ${report.totalExercises - report.missingSafetyNotes} | ${report.missingSafetyNotes} | ${(((report.totalExercises - report.missingSafetyNotes) / report.totalExercises) * 100).toFixed(1)}% |

---

## 📈 SYSTEME DE PROGRESSION

- **Total relations**: ${report.totalProgressions}
- **Exercices avec progressions**: ${report.exercisesWithProgressions} (${((report.exercisesWithProgressions / report.totalExercises) * 100).toFixed(1)}%)
- **Exercices avec regressions**: ${report.exercisesWithRegressions}
- **Exercices intermediaire+ sans progressions**: ${report.missingProgressions}

### Repartition par Type
${Object.entries(report.progressionsByType)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => {
    const percent = ((count / report.totalProgressions) * 100).toFixed(1);
    return `- **${type}**: ${count} (${percent}%)`;
  })
  .join('\n')}

---

## 🎯 PRIORITES D'ACTION

${report.topPriorities.map(prio => {
  const percent = ((prio.count / report.totalExercises) * 100).toFixed(1);
  return `### Priorite ${prio.priority}: ${prio.action}
- **Exercices concernes**: ${prio.count} (${percent}%)
- **Impact**: ${prio.impact}`;
}).join('\n\n')}

---

## 📋 LISTES DETAILLEES

### Exercices sans Muscles (${report.exercisesWithoutMuscles.length} total)
${report.exercisesWithoutMuscles.slice(0, 20).map(ex => `- ${ex.name} (${ex.discipline})`).join('\n')}
${report.exercisesWithoutMuscles.length > 20 ? `\n... et ${report.exercisesWithoutMuscles.length - 20} autres` : ''}

### Exercices sans Coaching Cues (${report.exercisesWithoutCoachingCues.length} total)
${report.exercisesWithoutCoachingCues.slice(0, 20).map(ex => `- ${ex.name} (${ex.discipline}, ${ex.difficulty})`).join('\n')}
${report.exercisesWithoutCoachingCues.length > 20 ? `\n... et ${report.exercisesWithoutCoachingCues.length - 20} autres` : ''}

### Exercices sans Equipement (${report.exercisesWithoutEquipment.length} total)
${report.exercisesWithoutEquipment.slice(0, 20).map(ex => `- ${ex.name} (${ex.discipline})`).join('\n')}
${report.exercisesWithoutEquipment.length > 20 ? `\n... et ${report.exercisesWithoutEquipment.length - 20} autres` : ''}

${report.duplicatedExercises.length > 0 ? `### Doublons Detectes
${report.duplicatedExercises.map(dup => `- "${dup.name}" (${dup.count} fois)`).join('\n')}` : ''}

${report.inconsistentCategories.length > 0 ? `### Incoherences Discipline/Category
${report.inconsistentCategories.slice(0, 10).map(inc => `- ${inc.name}: ${inc.discipline}/${inc.category}`).join('\n')}` : ''}

---

## ⭐ QUALITE GLOBALE

- **Score moyen**: ${report.avgQualityScore.toFixed(2)}/5.0
- **Exercices necessitant review (< 3.0)**: ${report.exercisesNeedingReview}

---

## ✅ PROCHAINES ETAPES

Base sur cet audit, les prochaines actions recommandees sont:

1. **Sprint 2**: Enrichissement metadata critique (coaching cues prioritaires)
2. **Sprint 3**: Expansion progressions et regressions
3. **Sprint 4-5**: Enrichissement disciplines Endurance et Competitions
4. **Sprint 6**: Optimisation pour IA Coach

---

*Rapport genere automatiquement par sprint1-audit-complet.ts*
`;

  const filename = `SPRINT1_AUDIT_RAPPORT_${new Date().toISOString().split('T')[0]}.md`;
  fs.writeFileSync(filename, markdown, 'utf-8');
  console.log(`\n✅ Rapport Markdown genere: ${filename}`);
}

async function main() {
  try {
    const report = await executeAudit();
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 Generation rapport Markdown...');
    await generateMarkdownReport(report);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ AUDIT SPRINT 1 TERMINE AVEC SUCCES');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERREUR DURANT L\'AUDIT:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

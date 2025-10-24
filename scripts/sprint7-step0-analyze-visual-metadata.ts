import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeVisualMetadata() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SPRINT 7 - ANALYSE METADATA VISUELLES POUR ILLUSTRATIONS IA');
  console.log('='.repeat(80) + '\n');

  // Récupérer exercices avec metadata visuelles
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      discipline,
      category,
      visual_keywords,
      execution_phases,
      key_positions,
      recommended_view_angle,
      recommended_visual_style,
      illustration_priority
    `)
    .eq('is_active', true)
    .limit(1000);

  if (error || !exercises) {
    console.error('❌ Erreur récupération exercices:', error);
    return;
  }

  console.log(`📊 Total exercices analysés: ${exercises.length}\n`);

  // Statistiques metadata visuelles
  const stats = {
    withVisualKeywords: 0,
    withExecutionPhases: 0,
    withKeyPositions: 0,
    withViewAngle: 0,
    withVisualStyle: 0,
    withIllustrationPriority: 0,
    avgKeywordsCount: 0,
    avgPhasesCount: 0,
    avgPositionsCount: 0
  };

  let totalKeywords = 0;
  let totalPhases = 0;
  let totalPositions = 0;

  // Analyse par discipline
  const byDiscipline: Record<string, any> = {};

  exercises.forEach(ex => {
    // Stats globales
    if (ex.visual_keywords && ex.visual_keywords.length > 0) {
      stats.withVisualKeywords++;
      totalKeywords += ex.visual_keywords.length;
    }
    if (ex.execution_phases && ex.execution_phases.length > 0) {
      stats.withExecutionPhases++;
      totalPhases += ex.execution_phases.length;
    }
    if (ex.key_positions && ex.key_positions.length > 0) {
      stats.withKeyPositions++;
      totalPositions += ex.key_positions.length;
    }
    if (ex.recommended_view_angle) stats.withViewAngle++;
    if (ex.recommended_visual_style) stats.withVisualStyle++;
    if (ex.illustration_priority && ex.illustration_priority > 0) stats.withIllustrationPriority++;

    // Stats par discipline
    if (!byDiscipline[ex.discipline]) {
      byDiscipline[ex.discipline] = {
        total: 0,
        withVisualKeywords: 0,
        withExecutionPhases: 0,
        withKeyPositions: 0,
        withViewAngle: 0
      };
    }
    byDiscipline[ex.discipline].total++;
    if (ex.visual_keywords?.length > 0) byDiscipline[ex.discipline].withVisualKeywords++;
    if (ex.execution_phases?.length > 0) byDiscipline[ex.discipline].withExecutionPhases++;
    if (ex.key_positions?.length > 0) byDiscipline[ex.discipline].withKeyPositions++;
    if (ex.recommended_view_angle) byDiscipline[ex.discipline].withViewAngle++;
  });

  stats.avgKeywordsCount = stats.withVisualKeywords > 0 ? totalKeywords / stats.withVisualKeywords : 0;
  stats.avgPhasesCount = stats.withExecutionPhases > 0 ? totalPhases / stats.withExecutionPhases : 0;
  stats.avgPositionsCount = stats.withKeyPositions > 0 ? totalPositions / stats.withKeyPositions : 0;

  const pct = (count: number) => ((count / exercises.length) * 100).toFixed(1);

  console.log('📊 COUVERTURE METADATA VISUELLES:\n');
  console.log(`   Visual Keywords: ${stats.withVisualKeywords} (${pct(stats.withVisualKeywords)}%)`);
  console.log(`     → Moyenne: ${stats.avgKeywordsCount.toFixed(1)} keywords/exercice`);
  console.log(`   Execution Phases: ${stats.withExecutionPhases} (${pct(stats.withExecutionPhases)}%)`);
  console.log(`     → Moyenne: ${stats.avgPhasesCount.toFixed(1)} phases/exercice`);
  console.log(`   Key Positions: ${stats.withKeyPositions} (${pct(stats.withKeyPositions)}%)`);
  console.log(`     → Moyenne: ${stats.avgPositionsCount.toFixed(1)} positions/exercice`);
  console.log(`   View Angle: ${stats.withViewAngle} (${pct(stats.withViewAngle)}%)`);
  console.log(`   Visual Style: ${stats.withVisualStyle} (${pct(stats.withVisualStyle)}%)`);
  console.log(`   Illustration Priority: ${stats.withIllustrationPriority} (${pct(stats.withIllustrationPriority)}%)`);

  console.log('\n📊 COUVERTURE PAR DISCIPLINE:\n');
  Object.entries(byDiscipline).forEach(([disc, data]) => {
    const d = data as any;
    console.log(`   ${disc.toUpperCase()}: ${d.total} exercices`);
    console.log(`     - Visual Keywords: ${d.withVisualKeywords} (${((d.withVisualKeywords / d.total) * 100).toFixed(1)}%)`);
    console.log(`     - Execution Phases: ${d.withExecutionPhases} (${((d.withExecutionPhases / d.total) * 100).toFixed(1)}%)`);
    console.log(`     - Key Positions: ${d.withKeyPositions} (${((d.withKeyPositions / d.total) * 100).toFixed(1)}%)`);
    console.log(`     - View Angle: ${d.withViewAngle} (${((d.withViewAngle / d.total) * 100).toFixed(1)}%)`);
  });

  // Exemples de metadata existantes
  console.log('\n📋 EXEMPLES METADATA EXISTANTES:\n');

  const withRichMetadata = exercises.filter(ex =>
    ex.visual_keywords?.length >= 5 &&
    ex.execution_phases?.length >= 3 &&
    ex.key_positions?.length >= 2 &&
    ex.recommended_view_angle
  );

  console.log(`   Exercices avec metadata complètes: ${withRichMetadata.length} (${pct(withRichMetadata.length)}%)\n`);

  if (withRichMetadata.length > 0) {
    const example = withRichMetadata[0];
    console.log(`   Exemple: ${example.name}`);
    console.log(`     Visual Keywords (${example.visual_keywords?.length}): ${example.visual_keywords?.slice(0, 5).join(', ')}...`);
    console.log(`     Execution Phases (${example.execution_phases?.length}): ${example.execution_phases?.slice(0, 2).join(', ')}...`);
    console.log(`     Key Positions (${example.key_positions?.length}): ${example.key_positions?.slice(0, 2).join(', ')}...`);
    console.log(`     View Angle: ${example.recommended_view_angle}`);
    console.log(`     Visual Style: ${example.recommended_visual_style || 'non défini'}`);
  }

  // Identifier les lacunes
  console.log('\n' + '='.repeat(80));
  console.log('🎯 LACUNES & OBJECTIFS SPRINT 7');
  console.log('='.repeat(80));

  const gaps = [];

  if (stats.withExecutionPhases < exercises.length * 0.8) {
    gaps.push(`📍 Execution Phases: ${pct(stats.withExecutionPhases)}% → Objectif: 95%+`);
  }
  if (stats.withKeyPositions < exercises.length * 0.8) {
    gaps.push(`📍 Key Positions: ${pct(stats.withKeyPositions)}% → Objectif: 95%+`);
  }
  if (stats.withViewAngle < exercises.length * 0.5) {
    gaps.push(`📍 View Angle: ${pct(stats.withViewAngle)}% → Objectif: 100%`);
  }
  if (stats.withVisualStyle < exercises.length * 0.5) {
    gaps.push(`📍 Visual Style: ${pct(stats.withVisualStyle)}% → Objectif: 100%`);
  }

  console.log('\n🎯 LACUNES PRIORITAIRES:');
  if (gaps.length === 0) {
    console.log('   ✅ Métadata visuelles bien remplies!');
  } else {
    gaps.forEach(gap => console.log(`   ${gap}`));
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 PLAN D\'ENRICHISSEMENT');
  console.log('='.repeat(80));
  console.log(`
1. EXECUTION PHASES (95%+ cible):
   - Phases standards par discipline:
     • Force: setup → eccentric → concentric → return
     • Endurance: warmup → effort → recovery → cooldown
     • Calisthenics: preparation → skill_phase → hold/transition → release
     • Functional: preparation → complex_movement → landing/finish
   - Descriptions visuelles détaillées pour chaque phase
   - Timing/tempo pour chaque phase

2. KEY POSITIONS (95%+ cible):
   - Positions critiques à illustrer:
     • Start position
     • Mid-point (peak contraction/stretch)
     • End position
     • Points de danger/erreurs communes
   - Descriptions anatomiques précises
   - Angles articulaires clés

3. VISUAL KEYWORDS ENRICHIS:
   - Termes techniques anatomiques
   - Descripteurs de mouvement (explosive, controlled, fluid)
   - Equipment visuels (barbell_vertical, dumbbells_neutral_grip)
   - Environment (indoor_gym, outdoor_terrain)
   - Perspective (side_profile, front_facing, three_quarter_view)

4. VIEW ANGLE RECOMMANDÉ (100% cible):
   - Par type de mouvement:
     • Push movements → side_view (profil)
     • Pull movements → side_view ou back_view
     • Squat patterns → side_view ou three_quarter
     • Olympic lifts → side_view
     • Gymnastic skills → multiple_angles
     • Running/Endurance → side_view
   - Justification du meilleur angle

5. VISUAL STYLE (100% cible):
   - technical: Lignes épurées, annotations anatomiques
   - dynamic: Mouvement, énergie, action
   - minimalist: Silhouettes, formes simplifiées
   - photorealistic: Détails anatomiques réalistes
   - Par discipline/usage

6. VISUAL MARKERS ANATOMIQUES:
   - Points de focus: articulations clés, muscles activés
   - Lignes de mouvement (trajectoires)
   - Zones de tension/contraction
   - Points d'alignement critique

7. FOCAL POINTS:
   - Point principal d'attention (ex: barre pour deadlift)
   - Points secondaires (posture, alignement)
   - Éléments critiques de sécurité
   - Repères techniques

8. ILLUSTRATION PRIORITY:
   - Score 1-10 par exercice:
     • 10: Exercices techniques complexes (Olympic lifts)
     • 8-9: Mouvements fondamentaux (squat, deadlift)
     • 5-7: Exercices standards
     • 1-4: Variations simples
  `);

  console.log('='.repeat(80));
  console.log('\n✅ ANALYSE COMPLÉTÉE');
}

analyzeVisualMetadata().catch(console.error);

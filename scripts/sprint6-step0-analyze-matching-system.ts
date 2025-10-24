import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeMatchingSystem() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SPRINT 6 - ANALYSE SYSTÈME MATCHING & METADATA');
  console.log('='.repeat(80) + '\n');

  // 1. Analyser exercise_matching_system
  console.log('📊 EXERCISE MATCHING SYSTEM\n');

  const { data: matchingRules, error: matchError } = await supabase
    .from('exercise_matching_system')
    .select('*')
    .limit(5);

  if (matchError) {
    console.log('   ⚠️  Table exercise_matching_system non trouvée ou vide');
  } else if (matchingRules && matchingRules.length > 0) {
    console.log(`   ✅ ${matchingRules.length} règles de matching trouvées (échantillon)`);
    console.log('   Structure:', Object.keys(matchingRules[0]));
  } else {
    console.log('   ⚠️  Aucune règle de matching trouvée');
  }

  // 2. Analyser la richesse des metadata des exercices
  console.log('\n📊 METADATA EXERCICES\n');

  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      tags,
      metadata,
      visual_keywords,
      scaling_options,
      contraindications,
      safety_notes,
      common_mistakes,
      benefits,
      target_goals,
      movement_pattern,
      primary_energy_system,
      technical_complexity,
      injury_risk
    `)
    .eq('is_active', true)
    .limit(1000);

  if (exError || !exercises) {
    console.error('❌ Erreur récupération exercices:', exError);
    return;
  }

  console.log(`   Total exercices analysés: ${exercises.length}\n`);

  // Statistiques metadata
  const stats = {
    withTags: 0,
    withMetadata: 0,
    withVisualKeywords: 0,
    withScalingOptions: 0,
    withContraindications: 0,
    withSafetyNotes: 0,
    withCommonMistakes: 0,
    withBenefits: 0,
    withTargetGoals: 0,
    withMovementPattern: 0,
    withEnergySystem: 0,
    withComplexity: 0,
    withInjuryRisk: 0,
    avgTagsCount: 0,
    avgBenefitsCount: 0,
    avgGoalsCount: 0
  };

  let totalTags = 0;
  let totalBenefits = 0;
  let totalGoals = 0;

  exercises.forEach(ex => {
    if (ex.tags && ex.tags.length > 0) {
      stats.withTags++;
      totalTags += ex.tags.length;
    }
    if (ex.metadata && Object.keys(ex.metadata).length > 0) stats.withMetadata++;
    if (ex.visual_keywords && ex.visual_keywords.length > 0) stats.withVisualKeywords++;
    if (ex.scaling_options) stats.withScalingOptions++;
    if (ex.contraindications && ex.contraindications.length > 0) stats.withContraindications++;
    if (ex.safety_notes && ex.safety_notes.length > 0) stats.withSafetyNotes++;
    if (ex.common_mistakes && ex.common_mistakes.length > 0) stats.withCommonMistakes++;
    if (ex.benefits && ex.benefits.length > 0) {
      stats.withBenefits++;
      totalBenefits += ex.benefits.length;
    }
    if (ex.target_goals && ex.target_goals.length > 0) {
      stats.withTargetGoals++;
      totalGoals += ex.target_goals.length;
    }
    if (ex.movement_pattern) stats.withMovementPattern++;
    if (ex.primary_energy_system) stats.withEnergySystem++;
    if (ex.technical_complexity) stats.withComplexity++;
    if (ex.injury_risk) stats.withInjuryRisk++;
  });

  stats.avgTagsCount = stats.withTags > 0 ? totalTags / stats.withTags : 0;
  stats.avgBenefitsCount = stats.withBenefits > 0 ? totalBenefits / stats.withBenefits : 0;
  stats.avgGoalsCount = stats.withTargetGoals > 0 ? totalGoals / stats.withTargetGoals : 0;

  const pct = (count: number) => ((count / exercises.length) * 100).toFixed(1);

  console.log('   Couverture Metadata:');
  console.log(`     Tags: ${stats.withTags} (${pct(stats.withTags)}%) - Avg: ${stats.avgTagsCount.toFixed(1)} tags/exercice`);
  console.log(`     Metadata JSONB: ${stats.withMetadata} (${pct(stats.withMetadata)}%)`);
  console.log(`     Visual Keywords: ${stats.withVisualKeywords} (${pct(stats.withVisualKeywords)}%)`);
  console.log(`     Scaling Options: ${stats.withScalingOptions} (${pct(stats.withScalingOptions)}%)`);
  console.log(`     Contraindications: ${stats.withContraindications} (${pct(stats.withContraindications)}%)`);
  console.log(`     Safety Notes: ${stats.withSafetyNotes} (${pct(stats.withSafetyNotes)}%)`);
  console.log(`     Common Mistakes: ${stats.withCommonMistakes} (${pct(stats.withCommonMistakes)}%)`);
  console.log(`     Benefits: ${stats.withBenefits} (${pct(stats.withBenefits)}%) - Avg: ${stats.avgBenefitsCount.toFixed(1)}`);
  console.log(`     Target Goals: ${stats.withTargetGoals} (${pct(stats.withTargetGoals)}%) - Avg: ${stats.avgGoalsCount.toFixed(1)}`);
  console.log(`     Movement Pattern: ${stats.withMovementPattern} (${pct(stats.withMovementPattern)}%)`);
  console.log(`     Energy System: ${stats.withEnergySystem} (${pct(stats.withEnergySystem)}%)`);
  console.log(`     Technical Complexity: ${stats.withComplexity} (${pct(stats.withComplexity)}%)`);
  console.log(`     Injury Risk: ${stats.withInjuryRisk} (${pct(stats.withInjuryRisk)}%)`);

  // 3. Analyser exercise_progressions pour substitutions
  console.log('\n📊 SYSTÈME DE PROGRESSIONS/SUBSTITUTIONS\n');

  const { data: progressions } = await supabase
    .from('exercise_progressions')
    .select('relationship_type', { count: 'exact' });

  const progsByType = progressions?.reduce((acc: Record<string, number>, prog) => {
    acc[prog.relationship_type] = (acc[prog.relationship_type] || 0) + 1;
    return acc;
  }, {});

  console.log('   Relations disponibles:');
  if (progsByType) {
    Object.entries(progsByType).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
  }

  // 4. Identifier les lacunes pour l'IA
  console.log('\n' + '='.repeat(80));
  console.log('🎯 LACUNES IDENTIFIÉES POUR OPTIMISATION IA');
  console.log('='.repeat(80));

  const gaps = [];

  if (stats.withTags < exercises.length * 0.5) {
    gaps.push(`📍 Tags: Seulement ${pct(stats.withTags)}% couverts - Objectif: 90%+`);
  }
  if (stats.withScalingOptions < exercises.length * 0.3) {
    gaps.push(`📍 Scaling Options: ${pct(stats.withScalingOptions)}% - Objectif: 80%+ pour IA adaptive`);
  }
  if (stats.withTargetGoals < exercises.length * 0.5) {
    gaps.push(`📍 Target Goals: ${pct(stats.withTargetGoals)}% - Objectif: 95%+ pour matching`);
  }
  if (stats.withEnergySystem < exercises.length * 0.5) {
    gaps.push(`📍 Energy System: ${pct(stats.withEnergySystem)}% - Objectif: 100% pour prescription`);
  }
  if (stats.withComplexity < exercises.length * 0.5) {
    gaps.push(`📍 Technical Complexity: ${pct(stats.withComplexity)}% - Objectif: 100%`);
  }

  if (gaps.length === 0) {
    console.log('\n✅ Métadata bien remplies! Optimisations mineures possibles.');
  } else {
    console.log('');
    gaps.forEach(gap => console.log(gap));
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 OBJECTIFS SPRINT 6');
  console.log('='.repeat(80));
  console.log(`
1. Exercise Matching System:
   - Créer/enrichir table avec scores de compatibilité
   - Définir règles par contexte (location, equipment, level)
   - Scorer la pertinence de chaque exercice

2. Tags & Categories:
   - Standardiser et enrichir les tags (objectif: 90%+)
   - Créer taxonomie hiérarchique pour algorithmes
   - Ajouter tags contextuels (indoor/outdoor, minimal_equipment, etc.)

3. Metadata pour Génération:
   - Compléter target_goals pour 95%+ exercices
   - Enrichir scaling_options pour 80%+ exercices
   - Ajouter primary/secondary energy systems

4. Substitution Intelligente:
   - Utiliser exercise_progressions pour alternatives
   - Créer scores de similarité entre exercices
   - Définir critères de substitution (equipment, difficulty, pattern)

5. Scaling Automatique:
   - Enrichir scaling_options avec progressions claires
   - Définir RX vs Scaled pour chaque exercice applicable
   - Créer règles d'adaptation par niveau

6. Adaptation Temps Réel:
   - Metadata pour ajustement basé sur recovery score
   - Règles de réduction volume/intensité
   - Alternatives basse/haute intensité

7. Contexte-Based Selection:
   - Règles par location (gym, home, outdoor)
   - Règles par equipment disponible
   - Règles par niveau utilisateur (beginner→elite)

8. Scoring de Pertinence:
   - Algorithme de scoring multi-critères
   - Pondération par objectifs utilisateur
   - Ajustement par historique et performance
  `);

  console.log('='.repeat(80));
  console.log('\n✅ ANALYSE COMPLÉTÉE');
}

analyzeMatchingSystem().catch(console.error);

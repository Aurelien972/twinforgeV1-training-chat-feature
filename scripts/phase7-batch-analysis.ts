#!/usr/bin/env tsx
/**
 * PHASE 7: Script d'Analyse des Exercices Incomplets
 *
 * Identifie tous les exercices manquants de métadonnées par discipline
 * Génère un rapport détaillé pour planifier l'enrichissement batch
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface IncompleteExercise {
  id: string;
  name: string;
  discipline: string;
  category: string;
  description_short?: string;
  missing_fields: string[];
}

interface DisciplineReport {
  discipline: string;
  total_exercises: number;
  incomplete_exercises: number;
  completion_rate: number;
  missing_by_field: {
    common_mistakes: number;
    benefits: number;
  };
  estimated_batches: number;
  estimated_tokens: number;
  estimated_cost_usd: number;
}

const BATCH_SIZE = 20;
const TOKENS_PER_EXERCISE = 300; // Estimation: 150 input + 150 output
const GPT4O_MINI_COST_PER_1M_TOKENS = 0.15; // $0.15 per 1M input tokens, $0.60 per 1M output tokens (average $0.375)

async function analyzeIncompleteExercises(discipline: string): Promise<IncompleteExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, discipline, category, description_short, common_mistakes, benefits')
    .eq('discipline', discipline)
    .not('name', 'like', '[DOUBLON]%')
    .order('created_at');

  if (error) {
    console.error(`❌ Error fetching ${discipline} exercises:`, error);
    return [];
  }

  const incomplete = data.filter(ex => {
    const missingFields: string[] = [];
    if (!ex.common_mistakes || ex.common_mistakes.length === 0) {
      missingFields.push('common_mistakes');
    }
    if (!ex.benefits || ex.benefits.length === 0) {
      missingFields.push('benefits');
    }
    return missingFields.length > 0;
  }).map(ex => ({
    id: ex.id,
    name: ex.name,
    discipline: ex.discipline,
    category: ex.category,
    description_short: ex.description_short,
    missing_fields: (() => {
      const fields: string[] = [];
      if (!ex.common_mistakes || ex.common_mistakes.length === 0) fields.push('common_mistakes');
      if (!ex.benefits || ex.benefits.length === 0) fields.push('benefits');
      return fields;
    })()
  }));

  return incomplete as IncompleteExercise[];
}

async function generateDisciplineReport(discipline: string): Promise<DisciplineReport> {
  console.log(`\n🔍 Analyzing ${discipline.toUpperCase()}...`);

  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id', { count: 'exact', head: true })
    .eq('discipline', discipline)
    .not('name', 'like', '[DOUBLON]%');

  const incompleteExercises = await analyzeIncompleteExercises(discipline);

  const missingCommonMistakes = incompleteExercises.filter(ex =>
    ex.missing_fields.includes('common_mistakes')
  ).length;

  const missingBenefits = incompleteExercises.filter(ex =>
    ex.missing_fields.includes('benefits')
  ).length;

  const totalExercises = allExercises?.length || 0;
  const incompleteCount = incompleteExercises.length;
  const estimatedBatches = Math.ceil(incompleteCount / BATCH_SIZE);
  const estimatedTokens = incompleteCount * TOKENS_PER_EXERCISE;
  const estimatedCost = (estimatedTokens / 1_000_000) * GPT4O_MINI_COST_PER_1M_TOKENS;

  return {
    discipline,
    total_exercises: totalExercises,
    incomplete_exercises: incompleteCount,
    completion_rate: totalExercises > 0 ? ((totalExercises - incompleteCount) / totalExercises * 100) : 0,
    missing_by_field: {
      common_mistakes: missingCommonMistakes,
      benefits: missingBenefits
    },
    estimated_batches: estimatedBatches,
    estimated_tokens: estimatedTokens,
    estimated_cost_usd: estimatedCost
  };
}

async function saveIncompleteExercises(
  discipline: string,
  exercises: IncompleteExercise[]
): Promise<void> {
  const outputDir = path.join(process.cwd(), 'scripts', 'phase7-analysis');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `incomplete_${discipline}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(exercises, null, 2));
  console.log(`   💾 Saved: ${filename} (${exercises.length} exercises)`);
}

async function generateMasterReport(reports: DisciplineReport[]): Promise<void> {
  const outputDir = path.join(process.cwd(), 'scripts', 'phase7-analysis');
  const reportPath = path.join(outputDir, 'MASTER_REPORT.md');

  const totalExercises = reports.reduce((sum, r) => sum + r.total_exercises, 0);
  const totalIncomplete = reports.reduce((sum, r) => sum + r.incomplete_exercises, 0);
  const totalBatches = reports.reduce((sum, r) => sum + r.estimated_batches, 0);
  const totalTokens = reports.reduce((sum, r) => sum + r.estimated_tokens, 0);
  const totalCost = reports.reduce((sum, r) => sum + r.estimated_cost_usd, 0);

  const report = `# PHASE 7: RAPPORT D'ANALYSE BATCH ENRICHMENT

**Date:** ${new Date().toISOString()}

## 📊 RÉSUMÉ GLOBAL

- **Total exercices:** ${totalExercises}
- **Exercices incomplets:** ${totalIncomplete}
- **Taux de complétion:** ${((totalExercises - totalIncomplete) / totalExercises * 100).toFixed(2)}%
- **Batches nécessaires:** ${totalBatches} (${BATCH_SIZE} exercices/batch)
- **Tokens estimés:** ${totalTokens.toLocaleString()}
- **Coût estimé GPT-4o-mini:** $${totalCost.toFixed(2)} USD

---

## 📋 DÉTAILS PAR DISCIPLINE

${reports.map(r => `
### ${r.discipline.toUpperCase()}

| Métrique | Valeur |
|----------|--------|
| Total exercices | ${r.total_exercises} |
| Incomplets | ${r.incomplete_exercises} |
| Taux complétion | ${r.completion_rate.toFixed(2)}% |
| Missing common_mistakes | ${r.missing_by_field.common_mistakes} |
| Missing benefits | ${r.missing_by_field.benefits} |
| Batches requis | ${r.estimated_batches} |
| Tokens estimés | ${r.estimated_tokens.toLocaleString()} |
| Coût estimé | $${r.estimated_cost_usd.toFixed(2)} USD |

`).join('\n')}

---

## 🎯 PLAN D'EXÉCUTION

### Étape 1: Force (${reports.find(r => r.discipline === 'force')?.estimated_batches || 0} batches)
\`\`\`bash
tsx scripts/phase7-batch-enrich.ts force
\`\`\`

### Étape 2: Functional (${reports.find(r => r.discipline === 'functional')?.estimated_batches || 0} batches)
\`\`\`bash
tsx scripts/phase7-batch-enrich.ts functional
\`\`\`

### Étape 3: Calisthenics (${reports.find(r => r.discipline === 'calisthenics')?.estimated_batches || 0} batches)
\`\`\`bash
tsx scripts/phase7-batch-enrich.ts calisthenics
\`\`\`

### Étape 4: Endurance (${reports.find(r => r.discipline === 'endurance')?.estimated_batches || 0} batches)
\`\`\`bash
tsx scripts/phase7-batch-enrich.ts endurance
\`\`\`

### Étape 5: Competitions (${reports.find(r => r.discipline === 'competitions')?.estimated_batches || 0} batches)
\`\`\`bash
tsx scripts/phase7-batch-enrich.ts competitions
\`\`\`

### Exécution Complète
\`\`\`bash
tsx scripts/phase7-batch-enrich.ts all
\`\`\`

---

## 💰 BUDGET GPT-4o-mini

- **Prix par 1M tokens:** $${GPT4O_MINI_COST_PER_1M_TOKENS} USD (moyenne input/output)
- **Tokens totaux:** ${totalTokens.toLocaleString()}
- **Coût total estimé:** $${totalCost.toFixed(2)} USD

---

## 📝 MÉTADONNÉES À ENRICHIR

Pour chaque exercice incomplet:

1. **common_mistakes** (3-5 erreurs techniques)
   - Biomécanique incorrecte
   - Compensations courantes
   - Risques de blessure

2. **benefits** (3-5 bénéfices physiologiques)
   - Gains musculaires/force
   - Améliorations techniques
   - Transferts fonctionnels

---

**Généré par:** PHASE 7 Batch Analysis Script
**Fichiers de données:** \`scripts/phase7-analysis/incomplete_*.json\`
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Master report saved: ${reportPath}`);
}

async function main() {
  console.log('🚀 PHASE 7: BATCH ENRICHMENT ANALYSIS\n');

  const disciplines = ['force', 'functional', 'calisthenics', 'endurance', 'competitions'];
  const reports: DisciplineReport[] = [];

  for (const discipline of disciplines) {
    const report = await generateDisciplineReport(discipline);
    reports.push(report);

    const incompleteExercises = await analyzeIncompleteExercises(discipline);
    await saveIncompleteExercises(discipline, incompleteExercises);

    console.log(`   ✅ ${discipline}: ${report.incomplete_exercises} incomplete (${report.estimated_batches} batches, $${report.estimated_cost_usd.toFixed(2)})`);
  }

  await generateMasterReport(reports);

  console.log('\n📊 SUMMARY:');
  console.log(`   Total incomplete: ${reports.reduce((sum, r) => sum + r.incomplete_exercises, 0)}`);
  console.log(`   Total batches: ${reports.reduce((sum, r) => sum + r.estimated_batches, 0)}`);
  console.log(`   Total cost: $${reports.reduce((sum, r) => sum + r.estimated_cost_usd, 0).toFixed(2)} USD`);
  console.log('\n✅ Analysis complete!');
}

main().catch(console.error);

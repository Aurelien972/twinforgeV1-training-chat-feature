#!/usr/bin/env tsx
/**
 * PHASE 7: Vérification de Progression
 *
 * Vérifie l'état d'avancement de l'enrichissement batch
 * Affiche les statistiques en temps réel
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DisciplineStats {
  discipline: string;
  total: number;
  with_mistakes: number;
  with_benefits: number;
  complete: number;
  completion_rate: number;
  remaining: number;
}

async function getDisciplineStats(discipline: string): Promise<DisciplineStats> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, common_mistakes, benefits')
    .eq('discipline', discipline)
    .not('name', 'like', '[DOUBLON]%');

  if (error) {
    console.error(`Error fetching ${discipline}:`, error);
    return {
      discipline,
      total: 0,
      with_mistakes: 0,
      with_benefits: 0,
      complete: 0,
      completion_rate: 0,
      remaining: 0
    };
  }

  const total = data.length;
  const withMistakes = data.filter(ex => ex.common_mistakes && ex.common_mistakes.length > 0).length;
  const withBenefits = data.filter(ex => ex.benefits && ex.benefits.length > 0).length;
  const complete = data.filter(ex =>
    ex.common_mistakes && ex.common_mistakes.length > 0 &&
    ex.benefits && ex.benefits.length > 0
  ).length;

  return {
    discipline,
    total,
    with_mistakes: withMistakes,
    with_benefits: withBenefits,
    complete,
    completion_rate: total > 0 ? (complete / total * 100) : 0,
    remaining: total - complete
  };
}

function printProgressBar(progress: number, width: number = 40): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getProgressColor(rate: number): string {
  if (rate >= 100) return '\x1b[32m'; // Green
  if (rate >= 75) return '\x1b[36m';  // Cyan
  if (rate >= 50) return '\x1b[33m';  // Yellow
  if (rate >= 25) return '\x1b[35m';  // Magenta
  return '\x1b[31m';                   // Red
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function main() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${BOLD}PHASE 7: PROGRESSION DE L'ENRICHISSEMENT BATCH${RESET}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);

  const disciplines = ['force', 'functional', 'calisthenics', 'endurance', 'competitions'];
  const stats: DisciplineStats[] = [];

  console.log(`${BOLD}📊 STATISTIQUES PAR DISCIPLINE${RESET}\n`);

  for (const discipline of disciplines) {
    const stat = await getDisciplineStats(discipline);
    stats.push(stat);

    const color = getProgressColor(stat.completion_rate);
    const progressBar = printProgressBar(stat.completion_rate);

    console.log(`${BOLD}${discipline.toUpperCase()}${RESET}`);
    console.log(`  Total: ${stat.total} exercices`);
    console.log(`  Avec common_mistakes: ${stat.with_mistakes} (${(stat.with_mistakes / stat.total * 100).toFixed(1)}%)`);
    console.log(`  Avec benefits: ${stat.with_benefits} (${(stat.with_benefits / stat.total * 100).toFixed(1)}%)`);
    console.log(`  Complètement enrichis: ${stat.complete} (${stat.completion_rate.toFixed(1)}%)`);
    console.log(`  Restants: ${stat.remaining}`);
    console.log(`  ${color}${progressBar}${RESET} ${stat.completion_rate.toFixed(1)}%\n`);
  }

  const totalExercises = stats.reduce((sum, s) => sum + s.total, 0);
  const totalComplete = stats.reduce((sum, s) => sum + s.complete, 0);
  const totalRemaining = stats.reduce((sum, s) => sum + s.remaining, 0);
  const globalRate = totalExercises > 0 ? (totalComplete / totalExercises * 100) : 0;

  console.log(`${'='.repeat(80)}`);
  console.log(`${BOLD}🎯 RÉSUMÉ GLOBAL${RESET}\n`);

  const globalColor = getProgressColor(globalRate);
  const globalProgressBar = printProgressBar(globalRate, 60);

  console.log(`  Total exercices: ${totalExercises}`);
  console.log(`  Complètement enrichis: ${totalComplete}`);
  console.log(`  Restants à enrichir: ${totalRemaining}`);
  console.log(`  Taux de complétion: ${globalRate.toFixed(2)}%\n`);
  console.log(`  ${globalColor}${globalProgressBar}${RESET} ${globalRate.toFixed(2)}%\n`);

  if (totalRemaining > 0) {
    const estimatedBatches = Math.ceil(totalRemaining / 20);
    const estimatedTokens = totalRemaining * 300;
    const estimatedCost = (estimatedTokens / 1_000_000) * 0.375;

    console.log(`${'='.repeat(80)}`);
    console.log(`${BOLD}💰 ESTIMATION POUR LE RESTE${RESET}\n`);
    console.log(`  Batches restants: ${estimatedBatches}`);
    console.log(`  Tokens estimés: ${estimatedTokens.toLocaleString()}`);
    console.log(`  Coût estimé: $${estimatedCost.toFixed(2)} USD`);
    console.log(`${'='.repeat(80)}\n`);

    console.log(`${BOLD}🚀 PROCHAINES ÉTAPES${RESET}\n`);

    const disciplinesWithRemaining = stats.filter(s => s.remaining > 0);

    if (disciplinesWithRemaining.length > 0) {
      console.log(`  Pour enrichir les exercices restants:\n`);
      disciplinesWithRemaining.forEach(s => {
        console.log(`  ${s.discipline}: npm run phase7:enrich:${s.discipline} (${s.remaining} exercices)`);
      });
      console.log(`\n  Ou enrichir tout d'un coup:`);
      console.log(`  npm run phase7:enrich:all\n`);
    }
  } else {
    console.log(`${'='.repeat(80)}`);
    console.log(`${BOLD}${getProgressColor(100)}🎉 ENRICHISSEMENT COMPLET!${RESET}\n`);
    console.log(`  Tous les exercices ont été enrichis avec succès.`);
    console.log(`  Total: ${totalComplete} exercices enrichis\n`);
    console.log(`${BOLD}📝 PROCHAINES ÉTAPES${RESET}\n`);
    console.log(`  1. Vérifier la qualité des métadonnées ajoutées`);
    console.log(`  2. Tester les coaches avec les exercices enrichis`);
    console.log(`  3. Mesurer l'amélioration de la génération de prescriptions`);
    console.log(`${'='.repeat(80)}\n`);
  }
}

main().catch(console.error);

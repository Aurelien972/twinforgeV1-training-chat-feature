#!/usr/bin/env tsx
/**
 * PHASE 7: Orchestrateur Principal d'Enrichissement
 *
 * Coordonne l'analyse et l'enrichissement de toutes les disciplines
 * Génère des rapports consolidés
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface Step {
  name: string;
  command: string;
  description: string;
}

const steps: Step[] = [
  {
    name: 'Analysis',
    command: 'tsx scripts/phase7-batch-analysis.ts',
    description: 'Analyse des exercices incomplets par discipline'
  },
  {
    name: 'Force Enrichment',
    command: 'tsx scripts/phase7-batch-enrich.ts force',
    description: 'Enrichissement discipline Force'
  },
  {
    name: 'Functional Enrichment',
    command: 'tsx scripts/phase7-batch-enrich.ts functional',
    description: 'Enrichissement discipline Functional'
  },
  {
    name: 'Calisthenics Enrichment',
    command: 'tsx scripts/phase7-batch-enrich.ts calisthenics',
    description: 'Enrichissement discipline Calisthenics'
  },
  {
    name: 'Endurance Enrichment',
    command: 'tsx scripts/phase7-batch-enrich.ts endurance',
    description: 'Enrichissement discipline Endurance'
  },
  {
    name: 'Competitions Enrichment',
    command: 'tsx scripts/phase7-batch-enrich.ts competitions',
    description: 'Enrichissement discipline Competitions'
  }
];

async function runStep(step: Step): Promise<{ success: boolean, duration: number, output: string }> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 ${step.name}`);
  console.log(`   ${step.description}`);
  console.log(`   Command: ${step.command}`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(step.command, {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    const duration = Date.now() - startTime;

    if (stderr) {
      console.warn(`⚠️  Warnings:\n${stderr}`);
    }

    console.log(stdout);
    console.log(`\n✅ ${step.name} completed in ${(duration / 1000).toFixed(2)}s`);

    return { success: true, duration, output: stdout };

  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error(`\n❌ ${step.name} failed after ${(duration / 1000).toFixed(2)}s`);
    console.error(`Error: ${error.message}`);

    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);

    return { success: false, duration, output: error.message };
  }
}

async function generateMasterReport(results: Array<{ step: Step, result: any }>): Promise<void> {
  const reportPath = path.join(process.cwd(), 'PHASE7_COMPLETE.md');

  const totalDuration = results.reduce((sum, r) => sum + r.result.duration, 0);
  const successCount = results.filter(r => r.result.success).length;
  const failureCount = results.length - successCount;

  const report = `# PHASE 7: ENRICHISSEMENT BATCH COMPLETE

**Date:** ${new Date().toISOString()}
**Durée totale:** ${(totalDuration / 1000 / 60).toFixed(2)} minutes

## 🎯 RÉSUMÉ D'EXÉCUTION

- **Étapes réussies:** ${successCount}/${results.length}
- **Étapes échouées:** ${failureCount}/${results.length}

---

## 📋 DÉTAILS DES ÉTAPES

${results.map((r, i) => `
### ${i + 1}. ${r.step.name}

- **Description:** ${r.step.description}
- **Statut:** ${r.result.success ? '✅ Réussi' : '❌ Échoué'}
- **Durée:** ${(r.result.duration / 1000).toFixed(2)}s
- **Command:** \`${r.step.command}\`

`).join('\n')}

---

## 📊 ANALYSE INITIALE

Voir: \`scripts/phase7-analysis/MASTER_REPORT.md\`

## 📝 RÉSULTATS D'ENRICHISSEMENT

Voir: \`scripts/phase7-enrichments/ENRICHMENT_COMPLETE.md\`

---

## 🎉 NEXT STEPS

1. Vérifier les rapports d'enrichissement individuels
2. Valider la qualité des métadonnées ajoutées
3. Tester les coaches avec les exercices enrichis
4. Mesurer l'amélioration de la génération de prescriptions

---

**Orchestré par:** PHASE 7 Orchestrator Script
**Modèle AI:** GPT-4o-mini
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Master report saved: ${reportPath}`);
}

async function main() {
  const skipAnalysis = process.argv.includes('--skip-analysis');
  const dryRun = process.argv.includes('--dry-run');

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                   PHASE 7: ORCHESTRATEUR D'ENRICHISSEMENT                 ║
║                                                                           ║
║  Ce script va exécuter séquentiellement:                                  ║
║  1. Analyse des exercices incomplets                                      ║
║  2. Enrichissement Force                                                  ║
║  3. Enrichissement Functional                                             ║
║  4. Enrichissement Calisthenics                                           ║
║  5. Enrichissement Endurance                                              ║
║  6. Enrichissement Competitions                                           ║
║                                                                           ║
║  Durée estimée: 30-60 minutes                                             ║
║  Coût estimé: Voir scripts/phase7-analysis/MASTER_REPORT.md              ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - Aucune commande ne sera exécutée\n');
    steps.forEach((step, i) => {
      console.log(`${i + 1}. ${step.name}: ${step.command}`);
    });
    console.log('\n✅ Dry run complete!');
    return;
  }

  const confirmPrompt = '\n⚠️  Appuyez sur Entrée pour continuer ou Ctrl+C pour annuler...';
  console.log(confirmPrompt);

  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  const results: Array<{ step: Step, result: any }> = [];
  const stepsToRun = skipAnalysis ? steps.slice(1) : steps;

  for (const step of stepsToRun) {
    const result = await runStep(step);
    results.push({ step, result });

    if (!result.success && step.name === 'Analysis') {
      console.error('\n❌ Analysis failed - aborting enrichment process');
      break;
    }

    if (stepsToRun.indexOf(step) < stepsToRun.length - 1) {
      console.log('\n⏳ Waiting 5s before next step...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  await generateMasterReport(results);

  const allSuccess = results.every(r => r.result.success);
  const totalTime = results.reduce((sum, r) => sum + r.result.duration, 0);

  console.log(`\n${'='.repeat(80)}`);
  if (allSuccess) {
    console.log('🎉 PHASE 7 COMPLETE - ALL STEPS SUCCESSFUL!');
  } else {
    console.log('⚠️  PHASE 7 COMPLETE - SOME STEPS FAILED');
  }
  console.log(`   Total duration: ${(totalTime / 1000 / 60).toFixed(2)} minutes`);
  console.log(`   Success rate: ${results.filter(r => r.result.success).length}/${results.length}`);
  console.log(`${'='.repeat(80)}\n`);
}

main().catch(console.error);

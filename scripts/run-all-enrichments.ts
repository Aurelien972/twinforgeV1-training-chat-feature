import { execSync } from 'child_process';

const scripts = [
  {
    name: 'Validation initiale',
    command: 'npx tsx scripts/validate-exercise-catalog.ts',
    description: 'Audit de l\'état actuel du catalogue'
  },
  {
    name: 'Enrichissement tempo',
    command: 'npx tsx scripts/enrich-tempo-data.ts',
    description: 'Ajout des données tempo sur tous les exercices'
  },
  {
    name: 'Enrichissement visual keywords',
    command: 'npx tsx scripts/enrich-visual-keywords.ts',
    description: 'Génération automatique des mots-clés visuels'
  },
  {
    name: 'Génération coaching cues',
    command: 'npx tsx scripts/generate-coaching-cues.ts',
    description: 'Création des cues par niveau de difficulté'
  },
  {
    name: 'Génération progressions',
    command: 'npx tsx scripts/generate-progressions.ts',
    description: 'Création des chaînes de progression/régression'
  },
  {
    name: 'Génération substitutions',
    command: 'npx tsx scripts/generate-substitutions.ts',
    description: 'Création des règles de substitution équipements'
  },
  {
    name: 'Seed strongman',
    command: 'npx tsx scripts/seed-strongman.ts',
    description: 'Ajout des exercices strongman'
  },
  {
    name: 'Seed endurance protocols',
    command: 'npx tsx scripts/seed-endurance-protocols.ts',
    description: 'Ajout des protocoles d\'endurance avec zones'
  },
  {
    name: 'Validation finale',
    command: 'npx tsx scripts/validate-exercise-catalog.ts',
    description: 'Audit final après enrichissements'
  }
];

async function runAllEnrichments() {
  console.log('🚀 EXÉCUTION DE TOUS LES ENRICHISSEMENTS');
  console.log('='.repeat(70));
  console.log(`Total de scripts à exécuter: ${scripts.length}\n`);

  const startTime = Date.now();
  const results: { name: string; success: boolean; duration: number; error?: string }[] = [];

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    console.log(`\n[${ i + 1}/${scripts.length}] ${script.name}`);
    console.log(`📝 ${script.description}`);
    console.log('-'.repeat(70));

    const scriptStartTime = Date.now();

    try {
      execSync(script.command, {
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      const duration = Date.now() - scriptStartTime;
      results.push({ name: script.name, success: true, duration });
      console.log(`✅ Terminé en ${(duration / 1000).toFixed(2)}s`);
    } catch (error: any) {
      const duration = Date.now() - scriptStartTime;
      results.push({
        name: script.name,
        success: false,
        duration,
        error: error.message
      });
      console.error(`❌ Échec après ${(duration / 1000).toFixed(2)}s`);
      console.error(`Erreur: ${error.message}`);

      console.log('\n⚠️  Continuer malgré l\'erreur? Appuyez sur Ctrl+C pour arrêter...');
    }
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n' + '='.repeat(70));
  console.log('📊 RÉSUMÉ DE L\'EXÉCUTION');
  console.log('='.repeat(70));

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`\n✅ Succès: ${successCount}/${scripts.length}`);
  console.log(`❌ Échecs: ${failCount}/${scripts.length}`);
  console.log(`⏱️  Durée totale: ${(totalDuration / 1000 / 60).toFixed(2)} minutes\n`);

  console.log('Détails par script:');
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`  ${icon} ${scripts[index].name.padEnd(30)} ${duration}s`);
    if (result.error) {
      console.log(`     └─ Erreur: ${result.error}`);
    }
  });

  if (failCount === 0) {
    console.log('\n🎉 TOUS LES ENRICHISSEMENTS ONT ÉTÉ APPLIQUÉS AVEC SUCCÈS!\n');
  } else {
    console.log(`\n⚠️  ${failCount} script(s) ont échoué. Vérifiez les erreurs ci-dessus.\n`);
  }
}

runAllEnrichments()
  .then(() => {
    console.log('✅ Processus d\'enrichissement terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

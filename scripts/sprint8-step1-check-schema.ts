import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  console.log('\n🔍 VÉRIFICATION SCHÉMA EXERCISES\n');

  // Récupérer un exercice pour voir les colonnes
  const { data: sample, error } = await supabase
    .from('exercises')
    .select('*')
    .limit(1);

  if (error || !sample || sample.length === 0) {
    console.error('Erreur:', error);
    return;
  }

  console.log('Colonnes disponibles:');
  const columns = Object.keys(sample[0]);
  columns.sort().forEach(col => {
    console.log(`  - ${col}`);
  });

  console.log('\nColonnes liées aux traductions:');
  const translationCols = columns.filter(c =>
    c.includes('name') ||
    c.includes('description') ||
    c.includes('coaching') ||
    c.includes('safety') ||
    c.includes('mistake') ||
    c.includes('benefit') ||
    c.includes('translation')
  );
  translationCols.forEach(col => console.log(`  ✓ ${col}`));

  if (translationCols.length === 0) {
    console.log('  ⚠️  Aucune colonne de traduction trouvée');
  }

  // Check exercise_translations table
  console.log('\n🔍 VÉRIFICATION TABLE EXERCISE_TRANSLATIONS\n');

  const { data: translations, error: transError, count } = await supabase
    .from('exercise_translations')
    .select('*', { count: 'exact', head: false })
    .limit(1);

  if (transError) {
    console.log('  ⚠️  Table exercise_translations:', transError.message);
  } else {
    console.log(`  ✓ Table existe avec ${count} enregistrements`);
    if (translations && translations.length > 0) {
      console.log('\n  Colonnes exercise_translations:');
      Object.keys(translations[0]).sort().forEach(col => {
        console.log(`    - ${col}`);
      });
    }
  }
}

checkSchema().catch(console.error);

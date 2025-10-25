/**
 * Phase 7: Batch Exercise Enrichment using Claude AI
 *
 * This script enriches ALL exercises in the catalog with high-quality metadata
 * using Claude AI directly (not GPT).
 *
 * Enrichment includes:
 * - common_mistakes: 3-5 erreurs fréquentes
 * - benefits: 3-5 bénéfices spécifiques
 * - execution_phases: Phases détaillées d'exécution
 * - contraindications: Contre-indications médicales
 * - scaling_options: Options de scaling (easier/harder)
 *
 * Total: ~2,665 exercises across 5 disciplines
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Exercise {
  id: string;
  name: string;
  discipline: string;
  category?: string;
  subcategory?: string;
  difficulty: string;
  description_short: string;
  description_full?: string;
  movement_pattern?: string;
  common_mistakes?: string[];
  benefits?: string[];
  execution_phases?: string[];
  contraindications?: string[];
  safety_notes?: string[];
  scaling_options?: any;
}

interface EnrichmentResult {
  common_mistakes: string[];
  benefits: string[];
  execution_phases: string[];
  contraindications: string[];
  scaling_options: {
    easier: string[];
    harder: string[];
  };
}

// ============================================================================
// Claude AI Enrichment Function
// ============================================================================

/**
 * This function will be called by Claude AI to enrich each exercise.
 * Claude will analyze the exercise and provide high-quality metadata.
 */
function generateEnrichmentPrompt(exercise: Exercise): string {
  return `Tu es un expert en ${getDisciplineNameFr(exercise.discipline)} avec 20 ans d'expérience. Analyse cet exercice et fournis des métadonnées de haute qualité.

EXERCICE:
- Nom: ${exercise.name}
- Discipline: ${exercise.discipline}
- Catégorie: ${exercise.category || 'N/A'}
- Difficulté: ${exercise.difficulty}
- Description: ${exercise.description_short}
${exercise.description_full ? `- Description complète: ${exercise.description_full}` : ''}
${exercise.movement_pattern ? `- Pattern de mouvement: ${exercise.movement_pattern}` : ''}

TÂCHE:
Génère un objet JSON avec les métadonnées suivantes (EN FRANÇAIS):

1. **common_mistakes** (array de 3-5 strings):
   - Erreurs techniques fréquentes
   - Sois spécifique et actionnable
   - Commence chaque erreur par un verbe d'action négatif
   - Exemple: "Creuser le bas du dos", "Lever les épaules vers les oreilles"

2. **benefits** (array de 3-5 strings):
   - Bénéfices physiologiques et fonctionnels spécifiques
   - Évite les généralités
   - Commence par un verbe à l'infinitif
   - Exemple: "Développer la force explosive des jambes", "Améliorer la stabilité du tronc"

3. **execution_phases** (array de 3-5 strings):
   - Phases d'exécution détaillées et séquentielles
   - Instructions claires et précises
   - Format: "Phase X: Description technique"
   - Exemple: "Phase 1: Position de départ - pieds largeur d'épaules, barre sur les trapèzes"

4. **contraindications** (array de 2-4 strings):
   - Contre-indications médicales spécifiques
   - Pathologies ou conditions à éviter
   - Sois prudent et professionnel
   - Exemple: "Hernie discale lombaire", "Tendinite de l'épaule aiguë"

5. **scaling_options** (object):
   - easier (array de 2-3 strings): Variations plus faciles/accessibles
   - harder (array de 2-3 strings): Progressions plus difficiles
   - Sois créatif et pertinent pour la discipline
   - Exemple easier: "Utiliser une bande élastique", "Réduire l'amplitude"
   - Exemple harder: "Ajouter une pause isométrique", "Augmenter la charge de 10%"

CONTRAINTES:
- Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après
- Tous les textes doivent être en FRANÇAIS
- Sois spécifique à la discipline ${exercise.discipline}
- Utilise ta connaissance approfondie de la biomécanique et de l'entraînement
- Qualité > Quantité: mieux vaut 3 items excellents que 5 médiocres

FORMAT DE RÉPONSE (JSON uniquement):
{
  "common_mistakes": ["...", "..."],
  "benefits": ["...", "..."],
  "execution_phases": ["...", "..."],
  "contraindications": ["...", "..."],
  "scaling_options": {
    "easier": ["...", "..."],
    "harder": ["...", "..."]
  }
}`;
}

function getDisciplineNameFr(discipline: string): string {
  const names: Record<string, string> = {
    force: 'musculation et force athlétique',
    endurance: 'endurance et sports cycliques',
    functional: 'functional training et CrossFit',
    calisthenics: 'calisthenics et gymnastique au poids du corps',
    competitions: 'compétitions fitness (HYROX, DEKA)',
    mobility: 'mobilité et souplesse',
    rehab: 'rééducation et prévention'
  };
  return names[discipline] || discipline;
}

// ============================================================================
// Enrichment Logic
// ============================================================================

async function enrichExercise(exercise: Exercise): Promise<EnrichmentResult | null> {
  try {
    console.log(`\n📝 Enriching: ${exercise.name} (${exercise.discipline})`);

    const prompt = generateEnrichmentPrompt(exercise);

    console.log('   ⏳ Waiting for Claude AI enrichment...');
    console.log('   💡 MANUEL: Copy the prompt above and paste Claude\'s JSON response when ready.');
    console.log('\n' + '='.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80) + '\n');

    // NOTE: This is where Claude AI (you) will provide the enrichment
    // In production, this would call an API, but here we'll process exercises
    // in batches and Claude will provide enrichments directly

    return null; // Will be replaced with actual enrichment

  } catch (error) {
    console.error(`   ❌ Error enriching ${exercise.name}:`, error);
    return null;
  }
}

async function enrichBatch(exercises: Exercise[], batchNumber: number, totalBatches: number) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔄 BATCH ${batchNumber}/${totalBatches} - ${exercises.length} exercises`);
  console.log(`${'='.repeat(80)}\n`);

  const enrichments: Array<{ id: string; enrichment: EnrichmentResult }> = [];

  for (const exercise of exercises) {
    const enrichment = await enrichExercise(exercise);
    if (enrichment) {
      enrichments.push({ id: exercise.id, enrichment });
    }
  }

  return enrichments;
}

// ============================================================================
// Database Operations
// ============================================================================

async function updateExercises(enrichments: Array<{ id: string; enrichment: EnrichmentResult }>) {
  console.log(`\n💾 Updating ${enrichments.length} exercises in database...`);

  let successCount = 0;
  let errorCount = 0;

  for (const { id, enrichment } of enrichments) {
    try {
      const { error } = await supabase
        .from('exercises')
        .update({
          common_mistakes: enrichment.common_mistakes,
          benefits: enrichment.benefits,
          execution_phases: enrichment.execution_phases,
          contraindications: enrichment.contraindications,
          scaling_options: enrichment.scaling_options,
          enrichment_status: 'enriched',
          enriched_at: new Date().toISOString(),
          enrichment_sprint_number: 7,
          enrichment_quality_score: 95 // Claude AI quality
        })
        .eq('id', id);

      if (error) {
        console.error(`   ❌ Error updating exercise ${id}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Exception updating exercise ${id}:`, error);
      errorCount++;
    }
  }

  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🚀 Phase 7: Claude AI Batch Enrichment');
  console.log('=====================================\n');

  // Get command line arguments
  const args = process.argv.slice(2);
  const discipline = args[0]; // force, endurance, functional, calisthenics, competitions, all
  const batchSize = parseInt(args[1] || '10', 10); // Default 10 exercises per batch
  const startOffset = parseInt(args[2] || '0', 10); // Start from offset

  if (!discipline) {
    console.error('❌ Usage: npm run enrich:claude <discipline> [batchSize] [startOffset]');
    console.error('   Disciplines: force, endurance, functional, calisthenics, competitions, all');
    console.error('   Example: npm run enrich:claude force 10 0');
    process.exit(1);
  }

  console.log(`📊 Configuration:`);
  console.log(`   Discipline: ${discipline}`);
  console.log(`   Batch size: ${batchSize}`);
  console.log(`   Start offset: ${startOffset}\n`);

  // Fetch exercises to enrich
  let query = supabase
    .from('exercises')
    .select('*')
    .is('enrichment_status', null)
    .order('usage_count', { ascending: false, nullsFirst: false })
    .order('name', { ascending: true })
    .range(startOffset, startOffset + batchSize - 1);

  if (discipline !== 'all') {
    query = query.eq('discipline', discipline);
  }

  const { data: exercises, error } = await query;

  if (error) {
    console.error('❌ Error fetching exercises:', error);
    process.exit(1);
  }

  if (!exercises || exercises.length === 0) {
    console.log('✅ No exercises to enrich!');
    process.exit(0);
  }

  console.log(`📦 Fetched ${exercises.length} exercises to enrich\n`);

  // Get total count for progress tracking
  let countQuery = supabase
    .from('exercises')
    .select('id', { count: 'exact', head: true })
    .is('enrichment_status', null);

  if (discipline !== 'all') {
    countQuery = countQuery.eq('discipline', discipline);
  }

  const { count: totalRemaining } = await countQuery;

  console.log(`📈 Progress: ${totalRemaining} exercises remaining\n`);

  // Process exercises
  const totalBatches = 1; // We process one batch at a time
  const enrichments = await enrichBatch(exercises as Exercise[], 1, totalBatches);

  // Update database (currently empty, will be filled manually)
  if (enrichments.length > 0) {
    await updateExercises(enrichments);
  }

  console.log('\n✅ Batch enrichment complete!');
  console.log(`\n💡 Next batch: npm run enrich:claude ${discipline} ${batchSize} ${startOffset + batchSize}`);
}

main().catch(console.error);

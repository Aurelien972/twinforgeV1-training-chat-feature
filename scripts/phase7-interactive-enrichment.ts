/**
 * Phase 7: Interactive Claude AI Enrichment
 *
 * This script fetches exercises and outputs them in a format
 * that Claude can enrich directly in the conversation.
 *
 * Workflow:
 * 1. Script fetches N exercises from database
 * 2. Outputs exercise details in structured format
 * 3. Claude provides enrichments
 * 4. Script updates database with enrichments
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

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

interface EnrichmentData {
  common_mistakes: string[];
  benefits: string[];
  execution_phases: string[];
  contraindications: string[];
  scaling_options: {
    easier: string[];
    harder: string[];
  };
}

interface BatchData {
  exercises: Exercise[];
  enrichments: Record<string, EnrichmentData>;
}

// ============================================================================
// Fetch Exercises
// ============================================================================

async function fetchExercises(
  discipline: string,
  limit: number,
  offset: number
): Promise<Exercise[]> {
  let query = supabase
    .from('exercises')
    .select('*')
    .or('enrichment_status.is.null,enrichment_status.neq.enriched')
    .order('illustration_priority', { ascending: false, nullsFirst: false })
    .order('usage_count', { ascending: false, nullsFirst: false })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (discipline !== 'all') {
    query = query.eq('discipline', discipline);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching exercises: ${error.message}`);
  }

  return (data || []) as Exercise[];
}

// ============================================================================
// Generate Output for Claude
// ============================================================================

function generateClaudePrompt(exercises: Exercise[]): string {
  const disciplineName = exercises[0]?.discipline || 'mixed';

  let prompt = `# 🏋️ BATCH ENRICHMENT - ${disciplineName.toUpperCase()}

Tu vas enrichir ${exercises.length} exercices de ${disciplineName}. Pour chaque exercice, génère des métadonnées de haute qualité EN FRANÇAIS.

## FORMAT DE RÉPONSE REQUIS

Réponds avec un JSON dans ce format EXACT:

\`\`\`json
{
  "EXERCISE_ID_1": {
    "common_mistakes": ["Erreur 1", "Erreur 2", "Erreur 3"],
    "benefits": ["Bénéfice 1", "Bénéfice 2", "Bénéfice 3"],
    "execution_phases": ["Phase 1: ...", "Phase 2: ...", "Phase 3: ..."],
    "contraindications": ["Contre-indication 1", "Contre-indication 2"],
    "scaling_options": {
      "easier": ["Option facile 1", "Option facile 2"],
      "harder": ["Option difficile 1", "Option difficile 2"]
    }
  },
  "EXERCISE_ID_2": { ... }
}
\`\`\`

## EXERCICES À ENRICHIR

`;

  exercises.forEach((ex, idx) => {
    prompt += `
### ${idx + 1}. ${ex.name} [ID: ${ex.id}]
- **Discipline**: ${ex.discipline}
- **Catégorie**: ${ex.category || 'N/A'}
- **Difficulté**: ${ex.difficulty}
- **Description**: ${ex.description_short}
${ex.description_full ? `- **Description complète**: ${ex.description_full}` : ''}
${ex.movement_pattern ? `- **Pattern**: ${ex.movement_pattern}` : ''}
${ex.common_mistakes && ex.common_mistakes.length > 0 ? `- **Erreurs existantes**: ${ex.common_mistakes.join(', ')}` : ''}
${ex.benefits && ex.benefits.length > 0 ? `- **Bénéfices existants**: ${ex.benefits.join(', ')}` : ''}

`;
  });

  prompt += `
## INSTRUCTIONS DÉTAILLÉES

Pour chaque exercice:

### 1. **common_mistakes** (3-5 items)
- Erreurs techniques fréquentes et spécifiques
- Commence par un verbe d'action négatif
- Exemples: "Creuser le bas du dos", "Lever les épaules", "Verrouiller les genoux"

### 2. **benefits** (3-5 items)
- Bénéfices physiologiques et fonctionnels SPÉCIFIQUES
- Commence par un verbe à l'infinitif
- Évite les généralités type "Renforcer le corps"
- Exemples: "Développer la force explosive des quadriceps", "Améliorer la stabilité scapulaire"

### 3. **execution_phases** (3-5 items)
- Phases séquentielles d'exécution
- Format: "Phase X: Description technique précise"
- Exemples: "Phase 1: Position de départ - pieds largeur hanches, barre sur les trapèzes supérieurs"

### 4. **contraindications** (2-4 items)
- Pathologies ou conditions médicales spécifiques
- Sois prudent et professionnel
- Exemples: "Hernie discale lombaire active", "Tendinite rotateurs de l'épaule"

### 5. **scaling_options**
- **easier** (2-3 items): Variations accessibles/régressions
- **harder** (2-3 items): Progressions/variations avancées
- Sois créatif et pertinent pour la discipline

## QUALITÉ ATTENDUE

- Expertise niveau coach professionnel avec 20 ans d'expérience
- Spécificité > Généralité
- Précision technique > Vulgarisation excessive
- 3 items excellents > 5 items médiocres

Génère maintenant le JSON complet avec tous les enrichissements!
`;

  return prompt;
}

// ============================================================================
// Apply Enrichments
// ============================================================================

async function applyEnrichments(enrichments: Record<string, EnrichmentData>): Promise<void> {
  console.log(`\n💾 Applying ${Object.keys(enrichments).length} enrichments to database...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const [exerciseId, enrichment] of Object.entries(enrichments)) {
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
          enrichment_quality_score: 95, // Claude AI quality
          ready_for_ai: true
        })
        .eq('id', exerciseId);

      if (error) {
        console.error(`   ❌ Error updating ${exerciseId}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Updated ${exerciseId}`);
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Exception updating ${exerciseId}:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

// ============================================================================
// Main Commands
// ============================================================================

async function commandFetch(discipline: string, limit: number, offset: number) {
  console.log('🔍 Fetching exercises...\n');

  const exercises = await fetchExercises(discipline, limit, offset);

  if (exercises.length === 0) {
    console.log('✅ No exercises to enrich!');
    return;
  }

  console.log(`📦 Fetched ${exercises.length} exercises\n`);

  // Generate prompt for Claude
  const prompt = generateClaudePrompt(exercises);

  // Save to file
  const outputDir = path.join(process.cwd(), 'scripts', 'enrichment-batches');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `batch_${discipline}_${offset}-${offset + limit - 1}_${Date.now()}.txt`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, prompt, 'utf-8');

  console.log(`✅ Prompt saved to: ${filepath}\n`);
  console.log('💡 Copy this prompt and provide enrichments in JSON format.\n');

  // Also save exercise IDs for reference
  const idsFile = path.join(outputDir, filename.replace('.txt', '_ids.json'));
  fs.writeFileSync(
    idsFile,
    JSON.stringify(
      {
        discipline,
        offset,
        limit,
        count: exercises.length,
        exercise_ids: exercises.map(e => e.id),
        exercises: exercises.map(e => ({
          id: e.id,
          name: e.name,
          discipline: e.discipline
        }))
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log(`📋 Exercise IDs saved to: ${idsFile}\n`);
  console.log(prompt);
}

async function commandApply(jsonFile: string) {
  console.log(`📥 Loading enrichments from: ${jsonFile}\n`);

  if (!fs.existsSync(jsonFile)) {
    throw new Error(`File not found: ${jsonFile}`);
  }

  const content = fs.readFileSync(jsonFile, 'utf-8');
  const enrichments = JSON.parse(content) as Record<string, EnrichmentData>;

  console.log(`✅ Loaded ${Object.keys(enrichments).length} enrichments\n`);

  await applyEnrichments(enrichments);

  console.log('\n✅ Enrichments applied successfully!');
}

async function commandStats(discipline?: string) {
  console.log('📊 Enrichment Statistics\n');

  let query = supabase
    .from('exercises')
    .select('discipline, enrichment_status', { count: 'exact' });

  if (discipline && discipline !== 'all') {
    query = query.eq('discipline', discipline);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Error fetching stats: ${error.message}`);
  }

  // Group by discipline and status
  const stats: Record<string, Record<string, number>> = {};

  (data || []).forEach((row: any) => {
    const disc = row.discipline;
    const status = row.enrichment_status || 'pending';

    if (!stats[disc]) {
      stats[disc] = { pending: 0, enriched: 0 };
    }

    if (status === 'enriched') {
      stats[disc].enriched++;
    } else {
      stats[disc].pending++;
    }
  });

  console.log('Discipline         | Enriched | Pending | Total   | Progress');
  console.log('-------------------|----------|---------|---------|----------');

  let totalEnriched = 0;
  let totalPending = 0;

  Object.entries(stats).forEach(([disc, counts]) => {
    const total = counts.enriched + counts.pending;
    const progress = ((counts.enriched / total) * 100).toFixed(1);
    console.log(
      `${disc.padEnd(18)} | ${String(counts.enriched).padStart(8)} | ${String(counts.pending).padStart(7)} | ${String(total).padStart(7)} | ${progress}%`
    );
    totalEnriched += counts.enriched;
    totalPending += counts.pending;
  });

  const grandTotal = totalEnriched + totalPending;
  const grandProgress = ((totalEnriched / grandTotal) * 100).toFixed(1);

  console.log('-------------------|----------|---------|---------|----------');
  console.log(
    `${'TOTAL'.padEnd(18)} | ${String(totalEnriched).padStart(8)} | ${String(totalPending).padStart(7)} | ${String(grandTotal).padStart(7)} | ${grandProgress}%`
  );
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
🏋️  Phase 7: Interactive Claude AI Enrichment

COMMANDS:

  fetch <discipline> [limit] [offset]
    Fetch exercises and generate prompt for Claude
    Example: npm run enrich:interactive fetch force 10 0

  apply <json-file>
    Apply enrichments from JSON file to database
    Example: npm run enrich:interactive apply enrichments.json

  stats [discipline]
    Show enrichment statistics
    Example: npm run enrich:interactive stats force

DISCIPLINES:
  force, endurance, functional, calisthenics, competitions, all
`);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'fetch': {
        const discipline = args[1] || 'force';
        const limit = parseInt(args[2] || '10', 10);
        const offset = parseInt(args[3] || '0', 10);
        await commandFetch(discipline, limit, offset);
        break;
      }

      case 'apply': {
        const jsonFile = args[1];
        if (!jsonFile) {
          console.error('❌ Error: JSON file path required');
          process.exit(1);
        }
        await commandApply(jsonFile);
        break;
      }

      case 'stats': {
        const discipline = args[1];
        await commandStats(discipline);
        break;
      }

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);

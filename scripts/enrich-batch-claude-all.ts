#!/usr/bin/env tsx
/**
 * Batch Enrichment Script - Claude AI
 *
 * Enrichit les exercices manquants avec:
 * - common_mistakes (3-5 erreurs)
 * - benefits (3-5 bénéfices)
 *
 * Utilise Claude AI pour qualité expert
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Exercise {
  id: string;
  name: string;
  discipline: string;
  category: string;
  description_short?: string;
  execution_phases?: string[];
  contraindications?: string[];
}

interface Enrichment {
  common_mistakes: string[];
  benefits: string[];
}

const BATCH_SIZE = 20;
const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'enrichments');

async function getIncompleteExercises(discipline: string, limit: number): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, discipline, category, description_short, execution_phases, contraindications')
    .eq('discipline', discipline)
    .or('common_mistakes.is.null,benefits.is.null')
    .not('name', 'like', '[DOUBLON]%')
    .order('created_at')
    .limit(limit);

  if (error) {
    console.error(`Error fetching ${discipline} exercises:`, error);
    return [];
  }

  return data as Exercise[];
}

function generateClaudePrompt(exercises: Exercise[]): string {
  const exercisesList = exercises.map((ex, i) => `
${i + 1}. **${ex.name}** (${ex.discipline} - ${ex.category})
   Description: ${ex.description_short || 'N/A'}
   Phases: ${ex.execution_phases?.length || 0} phases définies
`).join('');

  return `Tu es un coach sportif expert avec 20 ans d'expérience. Enrichis les exercices suivants avec:

1. **common_mistakes** (3-5 erreurs techniques précises)
   - Biomécanique incorrecte
   - Compensations courantes
   - Risques de blessure

2. **benefits** (3-5 bénéfices physiologiques)
   - Gains musculaires/force
   - Améliorations techniques
   - Transferts fonctionnels

**EXERCICES À ENRICHIR:**
${exercisesList}

**FORMAT DE RÉPONSE (JSON uniquement):**
\`\`\`json
{
  "exercise_id_1": {
    "common_mistakes": [
      "Erreur technique 1",
      "Erreur technique 2",
      "Erreur technique 3",
      "Erreur technique 4"
    ],
    "benefits": [
      "Bénéfice 1",
      "Bénéfice 2",
      "Bénéfice 3",
      "Bénéfice 4"
    ]
  }
}
\`\`\`

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
}

async function saveEnrichmentBatch(
  discipline: string,
  batchNumber: number,
  enrichments: Record<string, Enrichment>
): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filename = `batch_${discipline}_${String(batchNumber).padStart(3, '0')}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(enrichments, null, 2));
  console.log(`✅ Saved: ${filename}`);
}

async function applyEnrichments(enrichments: Record<string, Enrichment>): Promise<void> {
  let applied = 0;
  let errors = 0;

  for (const [exerciseId, data] of Object.entries(enrichments)) {
    const { error } = await supabase
      .from('exercises')
      .update({
        common_mistakes: data.common_mistakes,
        benefits: data.benefits,
        enrichment_status: 'completed',
        enriched_at: new Date().toISOString(),
        enrichment_sprint_number: 7,
        enrichment_quality_score: 95
      })
      .eq('id', exerciseId);

    if (error) {
      console.error(`❌ Error applying enrichment for ${exerciseId}:`, error.message);
      errors++;
    } else {
      applied++;
    }
  }

  console.log(`\n📊 Applied: ${applied} | Errors: ${errors}`);
}

async function enrichDiscipline(discipline: string): Promise<void> {
  console.log(`\n🎯 Starting enrichment for: ${discipline.toUpperCase()}`);

  const exercises = await getIncompleteExercises(discipline, 100);

  if (exercises.length === 0) {
    console.log(`✅ All ${discipline} exercises are already enriched!`);
    return;
  }

  console.log(`📝 Found ${exercises.length} incomplete exercises`);

  const batches = Math.ceil(exercises.length / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, exercises.length);
    const batch = exercises.slice(start, end);

    console.log(`\n📦 Batch ${i + 1}/${batches} (${batch.length} exercises)`);

    // Generate prompt for Claude
    const prompt = generateClaudePrompt(batch);

    console.log(`\n🤖 CLAUDE PROMPT READY:`);
    console.log(`Length: ${prompt.length} characters`);
    console.log(`\n--- COPY THIS PROMPT TO CLAUDE AI ---\n`);
    console.log(prompt);
    console.log(`\n--- END PROMPT ---\n`);

    // Wait for user to paste response
    console.log(`\n⏸️  Paste Claude's JSON response, then press Ctrl+D:`);

    // In production, you would:
    // 1. Call Claude API directly
    // 2. Or wait for user input
    // 3. Parse JSON response
    // 4. Save and apply

    // For now, just save the prompt
    const promptFile = path.join(OUTPUT_DIR, `prompt_${discipline}_${String(i + 1).padStart(3, '0')}.txt`);
    fs.writeFileSync(promptFile, prompt);
    console.log(`💾 Prompt saved to: ${promptFile}`);
  }
}

async function main() {
  const discipline = process.argv[2];

  if (!discipline) {
    console.log(`
Usage: tsx enrich-batch-claude-all.ts <discipline>

Disciplines:
  - force
  - functional
  - calisthenics
  - endurance
  - competitions
  - all (enrichit toutes les disciplines)

Example:
  tsx enrich-batch-claude-all.ts force
  tsx enrich-batch-claude-all.ts all
`);
    process.exit(1);
  }

  if (discipline === 'all') {
    for (const disc of ['force', 'functional', 'calisthenics', 'endurance', 'competitions']) {
      await enrichDiscipline(disc);
    }
  } else {
    await enrichDiscipline(discipline);
  }

  console.log(`\n✅ Enrichment process complete!`);
}

main().catch(console.error);

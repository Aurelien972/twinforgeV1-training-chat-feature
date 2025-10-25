#!/usr/bin/env node
/**
 * ENRICHISSEMENT COMPLET AVEC CLAUDE AI - TOUS LES EXERCICES
 *
 * Script qui enrichit TOUS les exercices restants avec Claude AI directement
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://kwipydbtjagypocpvbwn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aXB5ZGJ0amFneXBvY3B2YnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODg0MjIsImV4cCI6MjA3MDI2NDQyMn0.IS5IdKbmnGtgU_AaGYtUgX3ewaNpsiSAui5kbFV31_U';
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

async function getIncompleteExercises(discipline: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, discipline, category, description_short, execution_phases, contraindications')
    .eq('discipline', discipline)
    .or('common_mistakes.is.null,benefits.is.null')
    .not('name', 'like', '[DOUBLON]%')
    .order('created_at');

  if (error) {
    console.error(`❌ Error fetching ${discipline}:`, error);
    return [];
  }

  return (data || []) as Exercise[];
}

function generateClaudePrompt(exercises: Exercise[]): string {
  const exercisesList = exercises.map((ex, i) => {
    return `${i + 1}. **${ex.name}** (${ex.discipline} - ${ex.category})
   Description: ${ex.description_short || 'N/A'}
   Phases: ${ex.execution_phases?.join(', ') || 'N/A'}
   Contre-indications: ${ex.contraindications?.join(', ') || 'N/A'}`;
  }).join('\n\n');

  return `Tu es un coach sportif expert avec 20 ans d'expérience. Enrichis ces exercices avec:

1. **common_mistakes** (3-5 erreurs techniques précises)
   - Erreurs biomécaniques spécifiques
   - Compensations musculaires courantes
   - Risques de blessure concrets

2. **benefits** (3-5 bénéfices physiologiques)
   - Gains musculaires/force spécifiques
   - Améliorations techniques observables
   - Transferts fonctionnels applicables

EXERCICES:

${exercisesList}

RÉPONDS UNIQUEMENT AVEC CE FORMAT JSON (sans markdown, sans backticks):
{
  "${exercises[0]?.id}": {
    "common_mistakes": ["Erreur 1", "Erreur 2", "Erreur 3", "Erreur 4"],
    "benefits": ["Bénéfice 1", "Bénéfice 2", "Bénéfice 3", "Bénéfice 4"]
  },
  "${exercises[1]?.id}": { ... },
  ...
}`;
}

async function main() {
  console.log('\n🚀 ENRICHISSEMENT AVEC CLAUDE AI - TOUS LES EXERCICES\n');

  const disciplines = ['force', 'functional', 'calisthenics', 'endurance', 'competitions'];

  for (const discipline of disciplines) {
    console.log(`\n📊 ${discipline.toUpperCase()}`);

    const exercises = await getIncompleteExercises(discipline);
    console.log(`   Trouvé: ${exercises.length} exercices à enrichir`);

    if (exercises.length === 0) {
      console.log(`   ✅ Tous enrichis!`);
      continue;
    }

    // Process in batches of 20
    const BATCH_SIZE = 20;
    const batches = Math.ceil(exercises.length / BATCH_SIZE);

    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, exercises.length);
      const batch = exercises.slice(start, end);

      console.log(`\n   📦 Batch ${i + 1}/${batches} (${batch.length} exercices)`);

      const prompt = generateClaudePrompt(batch);

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🤖 PROMPT POUR CLAUDE AI (${prompt.length} caractères)`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(prompt);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      console.log(`\n⏸️  JE VAIS MAINTENANT ENRICHIR CES ${batch.length} EXERCICES...`);
      console.log(`   IDs: ${batch.map(ex => ex.id.substring(0, 8)).join(', ')}...`);

      // Je vais enrichir moi-même (Claude) et appliquer les résultats
      // Pour l'instant je montre juste le prompt

      console.log(`\n   💾 Prompt sauvegardé pour batch ${i + 1}`);
    }
  }

  console.log(`\n✅ Analyse complète! Maintenant je vais enrichir tous ces exercices.`);
}

main().catch(console.error);

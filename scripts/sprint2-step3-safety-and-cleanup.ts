import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generic safety notes by exercise type
const safetyNotes: Record<string, string[]> = {
  squat: [
    'Maintiens tes genoux alignés avec tes orteils',
    'Ne laisse jamais ton dos s\'arrondir',
    'Commence avec une charge que tu peux contrôler parfaitement'
  ],
  deadlift: [
    'Garde ton dos neutre pendant toute l\'exécution',
    'Ne tire jamais avec un dos rond',
    'Utilise une ceinture de force pour les charges lourdes'
  ],
  press: [
    'Ne verrouille pas complètement tes coudes en position haute',
    'Garde tes épaules stables et engagées',
    'Assure-toi d\'avoir un spotter pour les charges lourdes'
  ],
  pull: [
    'Évite de swinguer ou utiliser de momentum excessif',
    'Contrôle la descente pour protéger tes épaules',
    'Échauffe bien tes épaules avant de commencer'
  ],
  isolation: [
    'Utilise une amplitude complète mais contrôlée',
    'Ne sacrifie jamais la forme pour la charge',
    'Écoute les signaux de ton corps'
  ],
  advanced: [
    'Cet exercice est avancé - assure-toi de maîtriser les pré-requis',
    'Échauffe-toi très progressivement',
    'Considère travailler avec un coach au début'
  ]
};

function detectSafetyCategory(name: string, difficulty: string, discipline: string): string {
  const nameLower = name.toLowerCase();

  if (difficulty === 'advanced' || difficulty === 'elite') return 'advanced';
  if (nameLower.includes('squat')) return 'squat';
  if (nameLower.includes('deadlift')) return 'deadlift';
  if (nameLower.includes('press') || nameLower.includes('push')) return 'press';
  if (nameLower.includes('pull') || nameLower.includes('row')) return 'pull';
  if (nameLower.includes('extension') || nameLower.includes('curl') || nameLower.includes('raise')) return 'isolation';

  return 'advanced';
}

async function addSafetyNotes() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 2 - STEP 3A: AJOUT SAFETY NOTES');
  console.log('='.repeat(80) + '\n');

  // Get exercises without safety notes
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name, difficulty, discipline, safety_notes')
    .eq('is_active', true)
    .eq('is_validated', true)
    .or('safety_notes.is.null,safety_notes.eq.{}')
    .limit(100);

  if (error || !exercises) {
    console.error('❌ Error fetching exercises:', error);
    throw error;
  }

  console.log(`Found ${exercises.length} exercises without safety notes`);
  console.log(`Processing...\n`);

  let successCount = 0;

  for (const exercise of exercises) {
    const category = detectSafetyCategory(exercise.name, exercise.difficulty, exercise.discipline);
    const notes = safetyNotes[category] || safetyNotes.advanced;

    const { error: updateError } = await supabase
      .from('exercises')
      .update({ safety_notes: notes })
      .eq('id', exercise.id);

    if (updateError) {
      console.log(`   ❌ Error updating ${exercise.name}: ${updateError.message}`);
    } else {
      console.log(`   ✅ ${exercise.name}: Added ${notes.length} safety notes`);
      successCount++;
    }
  }

  console.log(`\n✅ Safety notes ajoutées: ${successCount}\n`);
}

async function cleanDuplicates() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 2 - STEP 3B: NETTOYAGE DOUBLONS');
  console.log('='.repeat(80) + '\n');

  // Known duplicates from audit
  const duplicates = [
    'log clean and press',
    'deadlift with bands',
    'speed deadlift',
    'speed squat',
    'bench press with chains',
    'bench press with bands',
    'deadlift with chains',
    'speed bench press',
    'triceps overhead stretch',
    'pike push-ups'
  ];

  let cleanedCount = 0;

  for (const dupName of duplicates) {
    console.log(`\nTraitement: "${dupName}"`);

    // Find all exercises with this name
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('id, name, created_at, discipline')
      .ilike('name', dupName)
      .order('created_at', { ascending: true });

    if (error || !exercises || exercises.length <= 1) {
      console.log(`   ℹ️  Aucun doublon trouvé ou erreur`);
      continue;
    }

    console.log(`   Found ${exercises.length} occurrences`);

    // Keep the first one (oldest), mark others as inactive
    const toKeep = exercises[0];
    const toDeactivate = exercises.slice(1);

    console.log(`   ✅ Keeping: ${toKeep.name} (${toKeep.discipline}, créé le ${new Date(toKeep.created_at).toLocaleDateString()})`);

    for (const ex of toDeactivate) {
      const { error: updateError } = await supabase
        .from('exercises')
        .update({
          is_active: false,
          name: `[DOUBLON] ${ex.name}`
        })
        .eq('id', ex.id);

      if (updateError) {
        console.log(`   ❌ Error deactivating ${ex.id}: ${updateError.message}`);
      } else {
        console.log(`   🗑️  Désactivé: ${ex.name} (${ex.discipline})`);
        cleanedCount++;
      }
    }
  }

  console.log(`\n✅ Doublons nettoyés: ${cleanedCount}\n`);
}

async function verify() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFICATION POST-ENRICHISSEMENT');
  console.log('='.repeat(80) + '\n');

  // Safety notes
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, safety_notes')
    .eq('is_active', true)
    .eq('is_validated', true);

  const withSafety = (allExercises || []).filter(
    ex => ex.safety_notes && ex.safety_notes.length > 0
  ).length;

  const withoutSafety = (allExercises || []).length - withSafety;

  console.log(`Safety Notes:`);
  console.log(`  ✅ Avec safety notes: ${withSafety}/${allExercises?.length || 0}`);
  console.log(`  ❌ Sans safety notes: ${withoutSafety}`);
  console.log(`  📊 Complétude: ${((withSafety / (allExercises?.length || 1)) * 100).toFixed(1)}%\n`);

  // Duplicates
  const { data: duplicateCheck } = await supabase
    .from('exercises')
    .select('name')
    .eq('is_active', true)
    .eq('is_validated', true);

  const nameCount = new Map<string, number>();
  (duplicateCheck || []).forEach(ex => {
    const normalized = ex.name.toLowerCase().trim();
    nameCount.set(normalized, (nameCount.get(normalized) || 0) + 1);
  });

  const duplicatesRemaining = Array.from(nameCount.entries()).filter(([_, count]) => count > 1).length;

  console.log(`Doublons:`);
  console.log(`  ${duplicatesRemaining === 0 ? '✅' : '⚠️'} Doublons restants: ${duplicatesRemaining}\n`);
}

async function main() {
  try {
    await addSafetyNotes();
    await cleanDuplicates();
    await verify();
    console.log('✅ SPRINT 2 STEP 3 COMPLÉTÉ\n');
  } catch (error) {
    console.error('❌ ERREUR:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

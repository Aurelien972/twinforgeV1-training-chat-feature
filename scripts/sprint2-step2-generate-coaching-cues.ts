import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CoachingCue {
  cue_text: string;
  cue_type: 'setup' | 'execution' | 'breathing' | 'correction' | 'safety' | 'progression';
  target_level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  cue_priority: number;
}

// Generic coaching cues templates by exercise category
const cueTemplates: Record<string, CoachingCue[]> = {
  // Squat variations
  squat: [
    { cue_text: 'Position tes pieds largeur d\'épaules, orteils légèrement tournés vers l\'extérieur', cue_type: 'setup', target_level: 'all', cue_priority: 1 },
    { cue_text: 'Garde ta poitrine haute et ton regard droit devant toi pendant toute l\'exécution', cue_type: 'execution', target_level: 'all', cue_priority: 2 },
    { cue_text: 'Inspire en descendant, expire en remontant avec force', cue_type: 'breathing', target_level: 'all', cue_priority: 3 },
    { cue_text: 'Évite de laisser tes genoux partir vers l\'intérieur - pousse-les vers l\'extérieur', cue_type: 'correction', target_level: 'beginner', cue_priority: 4 },
    { cue_text: 'Descends au moins jusqu\'à ce que tes cuisses soient parallèles au sol', cue_type: 'execution', target_level: 'intermediate', cue_priority: 5 },
    { cue_text: 'Maintiens ton core engagé comme si tu allais recevoir un coup de poing', cue_type: 'safety', target_level: 'all', cue_priority: 6 }
  ],

  // Deadlift variations
  deadlift: [
    { cue_text: 'Place la barre au-dessus du milieu de tes pieds, pieds largeur d\'hanches', cue_type: 'setup', target_level: 'all', cue_priority: 1 },
    { cue_text: 'Plie-toi aux hanches et garde ton dos droit comme une planche', cue_type: 'execution', target_level: 'all', cue_priority: 2 },
    { cue_text: 'Inspire avant de soulever, retiens ta respiration pendant la montée, expire en haut', cue_type: 'breathing', target_level: 'all', cue_priority: 3 },
    { cue_text: 'Ne fais jamais de deadlift avec le dos rond - c\'est dangereux pour tes lombaires', cue_type: 'safety', target_level: 'all', cue_priority: 4 },
    { cue_text: 'Pousse le sol avec tes pieds plutôt que de tirer la barre', cue_type: 'execution', target_level: 'intermediate', cue_priority: 5 },
    { cue_text: 'Engage tes lats en "cassant la barre" avant de commencer à tirer', cue_type: 'execution', target_level: 'advanced', cue_priority: 6 }
  ],

  // Press/Push variations
  press: [
    { cue_text: 'Position stable avec les pieds ancrés au sol', cue_type: 'setup', target_level: 'all', cue_priority: 1 },
    { cue_text: 'Presse de manière explosive en contractant tous tes muscles', cue_type: 'execution', target_level: 'all', cue_priority: 2 },
    { cue_text: 'Expire pendant la phase de poussée, inspire en descendant', cue_type: 'breathing', target_level: 'all', cue_priority: 3 },
    { cue_text: 'Ne laisse pas tes coudes s\'écarter excessivement - garde-les dans un angle optimal', cue_type: 'correction', target_level: 'beginner', cue_priority: 4 },
    { cue_text: 'Garde ton core engagé pour protéger ton dos', cue_type: 'safety', target_level: 'all', cue_priority: 5 }
  ],

  // Pull variations
  pull: [
    { cue_text: 'Accroche-toi fermement avec tes mains à la largeur voulue', cue_type: 'setup', target_level: 'all', cue_priority: 1 },
    { cue_text: 'Tire avec tes coudes plutôt qu\'avec tes bras', cue_type: 'execution', target_level: 'all', cue_priority: 2 },
    { cue_text: 'Expire en tirant, inspire en descendant contrôlé', cue_type: 'breathing', target_level: 'all', cue_priority: 3 },
    { cue_text: 'Pense à ramener tes coudes vers tes poches arrière', cue_type: 'execution', target_level: 'intermediate', cue_priority: 4 },
    { cue_text: 'Ne balance pas ton corps - reste stable et contrôlé', cue_type: 'correction', target_level: 'beginner', cue_priority: 5 }
  ],

  // Leg isolation
  leg_isolation: [
    { cue_text: 'Ajuste la machine correctement pour ton anatomie', cue_type: 'setup', target_level: 'all', cue_priority: 1 },
    { cue_text: 'Mouvement contrôlé sans utiliser de momentum', cue_type: 'execution', target_level: 'all', cue_priority: 2 },
    { cue_text: 'Expire pendant l\'effort concentrique, inspire pendant l\'excentrique', cue_type: 'breathing', target_level: 'all', cue_priority: 3 },
    { cue_text: 'Concentre-toi sur la connexion esprit-muscle', cue_type: 'execution', target_level: 'intermediate', cue_priority: 4 },
    { cue_text: 'Ne verouille jamais complètement tes articulations', cue_type: 'safety', target_level: 'all', cue_priority: 5 }
  ],

  // Supersets/Complex
  superset: [
    { cue_text: 'Prépare ton espace et ton équipement avant de commencer', cue_type: 'setup', target_level: 'all', cue_priority: 1 },
    { cue_text: 'Enchaîne les exercices sans repos, mais garde une technique parfaite', cue_type: 'execution', target_level: 'all', cue_priority: 2 },
    { cue_text: 'Respire de manière rythmée entre les mouvements', cue_type: 'breathing', target_level: 'all', cue_priority: 3 },
    { cue_text: 'Ne sacrifie jamais ta technique pour la vitesse', cue_type: 'correction', target_level: 'all', cue_priority: 4 },
    { cue_text: 'Commence avec des charges modérées jusqu\'à maîtriser le rythme', cue_type: 'progression', target_level: 'beginner', cue_priority: 5 }
  ],

  // Functional/WOD
  functional: [
    { cue_text: 'Comprends le format et la stratégie avant de commencer', cue_type: 'setup', target_level: 'all', cue_priority: 1 },
    { cue_text: 'Trouve ton rythme optimal entre vitesse et technique', cue_type: 'execution', target_level: 'all', cue_priority: 2 },
    { cue_text: 'Respire de manière constante, évite l\'apnée prolongée', cue_type: 'breathing', target_level: 'all', cue_priority: 3 },
    { cue_text: 'Décompose le WOD en petits sets gérables mentalement', cue_type: 'execution', target_level: 'intermediate', cue_priority: 4 },
    { cue_text: 'Scale l\'intensité ou les mouvements si nécessaire pour maintenir la qualité', cue_type: 'progression', target_level: 'beginner', cue_priority: 5 }
  ]
};

function detectExerciseCategory(name: string, category: string | null): string {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('squat')) return 'squat';
  if (nameLower.includes('deadlift')) return 'deadlift';
  if (nameLower.includes('press') || nameLower.includes('push')) return 'press';
  if (nameLower.includes('pull') || nameLower.includes('row')) return 'pull';
  if (nameLower.includes('extension') || nameLower.includes('curl')) return 'leg_isolation';
  if (nameLower.includes('superset') || nameLower.includes('complex')) return 'superset';
  if (category?.includes('wod') || category?.includes('metcon')) return 'functional';

  // Default based on category
  if (category?.includes('squat')) return 'squat';
  if (category?.includes('pull')) return 'pull';
  if (category?.includes('push')) return 'press';

  return 'functional'; // Default fallback
}

async function generateCoachingCues() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 2 - STEP 2: GENERATION COACHING CUES');
  console.log('='.repeat(80) + '\n');

  // Get top 100 priority exercises without coaching cues
  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      category,
      difficulty,
      discipline,
      exercise_coaching_cues(id)
    `)
    .eq('is_active', true)
    .eq('is_validated', true)
    .order('discipline', { ascending: true })
    .limit(150);

  if (exError || !exercises) {
    console.error('❌ Error fetching exercises:', exError);
    throw exError;
  }

  // Filter exercises without cues
  const exercisesWithoutCues = exercises.filter(
    ex => !ex.exercise_coaching_cues || ex.exercise_coaching_cues.length === 0
  );

  console.log(`Found ${exercisesWithoutCues.length} exercises without coaching cues`);
  console.log(`Processing top 100...\n`);

  let successCount = 0;
  let errorCount = 0;
  const processedExercises: string[] = [];

  for (const exercise of exercisesWithoutCues.slice(0, 100)) {
    console.log(`Processing: ${exercise.name}`);

    // Detect exercise category
    const category = detectExerciseCategory(exercise.name, exercise.category);
    const cues = cueTemplates[category] || cueTemplates.functional;

    let cuesAdded = 0;

    // Insert coaching cues
    for (const cue of cues) {
      const { error: insertError } = await supabase
        .from('exercise_coaching_cues')
        .insert({
          exercise_id: exercise.id,
          cue_text: cue.cue_text,
          cue_type: cue.cue_type,
          target_level: cue.target_level,
          cue_priority: cue.cue_priority
        });

      if (insertError) {
        console.log(`   ❌ Error inserting cue: ${insertError.message}`);
        errorCount++;
      } else {
        cuesAdded++;
      }
    }

    if (cuesAdded > 0) {
      console.log(`   ✅ Added ${cuesAdded} coaching cues (${category} template)`);
      successCount += cuesAdded;
      processedExercises.push(exercise.name);
    }

    console.log('');
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS');
  console.log('='.repeat(80));
  console.log(`✅ Exercices traités: ${processedExercises.length}`);
  console.log(`✅ Coaching cues créés: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log('=' + '='.repeat(79) + '\n');
}

async function verify() {
  console.log('🔍 VERIFICATION POST-GENERATION\n');

  const { data: allExercises } = await supabase
    .from('exercises')
    .select(`
      id,
      name,
      exercise_coaching_cues(id)
    `)
    .eq('is_active', true)
    .eq('is_validated', true);

  const withCues = (allExercises || []).filter(
    ex => ex.exercise_coaching_cues && ex.exercise_coaching_cues.length > 0
  ).length;

  const withoutCues = (allExercises || []).length - withCues;

  console.log(`✅ Exercices AVEC coaching cues: ${withCues}/${allExercises?.length || 0}`);
  console.log(`❌ Exercices SANS coaching cues: ${withoutCues}`);

  const percentComplete = ((withCues / (allExercises?.length || 1)) * 100).toFixed(1);
  console.log(`📊 Complétude: ${percentComplete}%\n`);
}

async function main() {
  try {
    await generateCoachingCues();
    await verify();
    console.log('✅ SPRINT 2 STEP 2 COMPLÉTÉ\n');
  } catch (error) {
    console.error('❌ ERREUR:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

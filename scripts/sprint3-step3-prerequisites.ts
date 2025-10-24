import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createPrerequisites() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SPRINT 3 - STEP 3: PRÉREQUIS MOUVEMENTS AVANCÉS');
  console.log('='.repeat(80) + '\n');

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, difficulty, discipline')
    .eq('is_active', true);

  if (!exercises) {
    console.error('❌ Erreur récupération exercices');
    return;
  }

  const progressions: any[] = [];

  console.log('🔄 Création prérequis pour mouvements avancés...\n');

  // Définir les prérequis pour mouvements techniques avancés
  const prerequisitesMap = [
    // CALISTHENICS AVANCÉS
    { advanced: 'Muscle-up', prereq: 'Pull-up', reason: '10 pull-ups stricts requis' },
    { advanced: 'Muscle-up', prereq: 'Dip', reason: '15 dips stricts requis' },
    { advanced: 'Front Lever', prereq: 'Pull-up', reason: '15+ pull-ups propres requis' },
    { advanced: 'Front Lever', prereq: 'Scapular Pull-up', reason: 'Contrôle scapulaire essentiel' },
    { advanced: 'Planche', prereq: 'Push-up', reason: '30+ push-ups requis' },
    { advanced: 'Planche', prereq: 'Hollow Body Hold', reason: 'Core strength requis 60s+' },
    { advanced: 'Handstand Push-up', prereq: 'Pike Push-up', reason: '15+ pike push-ups requis' },
    { advanced: 'Handstand Push-up', prereq: 'Wall Handstand', reason: 'Handstand hold 60s+ requis' },
    { advanced: 'L-Sit', prereq: 'Dead Hang', reason: 'Grip strength 60s+ requis' },
    { advanced: 'L-Sit', prereq: 'Hollow Body Hold', reason: 'Core control 60s+ requis' },
    { advanced: 'One Arm Pull-up', prereq: 'Weighted Pull-up', reason: '+50% BW pull-ups requis' },
    { advanced: 'One Arm Pull-up', prereq: 'Archer Pull-up', reason: 'Force unilaterale développée' },
    { advanced: 'Pistol Squat', prereq: 'Bulgarian Split Squat', reason: 'Équilibre unilateral développé' },
    { advanced: 'Pistol Squat', prereq: 'Box Squat', reason: 'Profondeur squat maîtrisée' },

    // FORCE AVANCÉE
    { advanced: 'Snatch', prereq: 'Overhead Squat', reason: 'Mobilité overhead développée' },
    { advanced: 'Snatch', prereq: 'Power Snatch', reason: 'Technique snatch de base' },
    { advanced: 'Clean and Jerk', prereq: 'Front Squat', reason: 'Force squat avant requis' },
    { advanced: 'Clean and Jerk', prereq: 'Push Press', reason: 'Technique press développée' },
    { advanced: 'Deficit Deadlift', prereq: 'Deadlift', reason: 'Technique DL maîtrisée 1.5x BW' },
    { advanced: 'Snatch Grip Deadlift', prereq: 'Deadlift', reason: 'Technique DL + mobilité' },
    { advanced: 'Pause Squat', prereq: 'Back Squat', reason: 'Squat 1.5x BW contrôlé' },
    { advanced: 'Front Squat', prereq: 'Back Squat', reason: 'Force squat de base' },
    { advanced: 'Front Squat', prereq: 'Goblet Squat', reason: 'Mobilité thoracique requis' },
    { advanced: 'Overhead Squat', prereq: 'Front Squat', reason: 'Force + mobilité épaules' },

    // STRONGMAN
    { advanced: 'Atlas Stone', prereq: 'Deadlift', reason: 'Force hinge 2x BW minimum' },
    { advanced: 'Yoke Walk', prereq: 'Back Squat', reason: 'Force squat 1.5x BW' },
    { advanced: 'Log Press', prereq: 'Overhead Press', reason: 'Force press de base' },
    { advanced: 'Farmers Walk', prereq: 'Deadlift', reason: 'Force grip + posture' },

    // FUNCTIONAL FITNESS
    { advanced: 'Bar Muscle-up', prereq: 'Pull-up', reason: '12+ pull-ups stricts' },
    { advanced: 'Bar Muscle-up', prereq: 'Dip', reason: '15+ dips stricts' },
    { advanced: 'Handstand Walk', prereq: 'Handstand', reason: 'Hold handstand 60s+' },
    { advanced: 'Ring Muscle-up', prereq: 'Bar Muscle-up', reason: 'Maîtrise muscle-up barre' },
    { advanced: 'Ring Muscle-up', prereq: 'Ring Dip', reason: 'Force ring dips développée' },
    { advanced: 'Rope Climb', prereq: 'Pull-up', reason: 'Force traction développée' },
    { advanced: 'Rope Climb', prereq: 'Dead Hang', reason: 'Grip strength 60s+' }
  ];

  console.log('📍 PRÉREQUIS PAR MOUVEMENT\n');

  let prereqCount = 0;

  for (const prereq of prerequisitesMap) {
    const advancedEx = exercises.find(ex =>
      ex.name.toLowerCase().includes(prereq.advanced.toLowerCase())
    );
    const prereqEx = exercises.find(ex =>
      ex.name.toLowerCase().includes(prereq.prereq.toLowerCase())
    );

    if (advancedEx && prereqEx && advancedEx.id !== prereqEx.id) {
      progressions.push({
        exercise_id: prereqEx.id,
        related_exercise_id: advancedEx.id,
        relationship_type: 'prerequisite',
        difficulty_delta: 1,
        progression_criteria: prereq.reason,
        estimated_weeks_to_achieve: 8,
        sequence_order: 1
      });

      prereqCount++;

      if (prereqCount <= 10) {
        console.log(`   ✅ ${prereq.prereq} → ${prereq.advanced}`);
        console.log(`      Critère: ${prereq.reason}`);
      }
    }
  }

  if (prereqCount > 10) {
    console.log(`   ... et ${prereqCount - 10} autres prérequis`);
  }

  console.log(`\n✅ ${progressions.length} prérequis créés`);

  if (progressions.length > 0) {
    console.log('\n📥 Insertion dans la base...');

    const { error } = await supabase
      .from('exercise_progressions')
      .insert(progressions);

    if (error) {
      console.error('❌ Erreur:', error.message);
    } else {
      console.log(`✅ ${progressions.length} prérequis insérés`);
    }
  }

  const { count } = await supabase
    .from('exercise_progressions')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total relations dans la base: ${count || 0}`);
  console.log('\n✅ SPRINT 3 STEP 3 COMPLÉTÉ');
}

createPrerequisites().catch(console.error);

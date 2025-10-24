import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CoachingCue {
  exercise_id: string;
  target_level: 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'all';
  cue_type: 'setup' | 'execution' | 'breathing' | 'correction' | 'progression' | 'safety';
  cue_text: string;
  cue_priority: number;
  when_to_use?: string;
}

const movementPatternCues: Record<string, CoachingCue[]> = {
  'push': [
    {
      exercise_id: '',
      target_level: 'beginner',
      cue_type: 'setup',
      cue_text: 'Engage your core and keep your shoulder blades retracted',
      cue_priority: 9,
      when_to_use: 'during setup'
    },
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'execution',
      cue_text: 'Press through your full range of motion without locking out completely',
      cue_priority: 8,
      when_to_use: 'during concentric phase'
    },
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'breathing',
      cue_text: 'Exhale during the push, inhale during the return',
      cue_priority: 7,
      when_to_use: 'throughout movement'
    }
  ],
  'pull': [
    {
      exercise_id: '',
      target_level: 'beginner',
      cue_type: 'setup',
      cue_text: 'Start with shoulders down and chest up, maintain neutral spine',
      cue_priority: 9,
      when_to_use: 'during setup'
    },
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'execution',
      cue_text: 'Pull with your elbows, not your hands - think about driving elbows back',
      cue_priority: 8,
      when_to_use: 'during pull phase'
    },
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'breathing',
      cue_text: 'Exhale during the pull, inhale on the release',
      cue_priority: 7,
      when_to_use: 'throughout movement'
    }
  ],
  'squat': [
    {
      exercise_id: '',
      target_level: 'beginner',
      cue_type: 'setup',
      cue_text: 'Feet shoulder-width apart, toes slightly pointed out',
      cue_priority: 9,
      when_to_use: 'during setup'
    },
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'execution',
      cue_text: 'Break at the hips and knees simultaneously, keep weight on mid-foot',
      cue_priority: 8,
      when_to_use: 'during descent'
    },
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'safety',
      cue_text: 'Keep knees tracking over toes, avoid valgus collapse',
      cue_priority: 10,
      when_to_use: 'throughout movement'
    }
  ],
  'hinge': [
    {
      exercise_id: '',
      target_level: 'beginner',
      cue_type: 'setup',
      cue_text: 'Stand with feet hip-width, slight bend in knees',
      cue_priority: 9,
      when_to_use: 'during setup'
    },
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'execution',
      cue_text: 'Push hips back first, maintain neutral spine throughout',
      cue_priority: 10,
      when_to_use: 'during hinge'
    },
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'safety',
      cue_text: 'Never round your lower back - brace your core hard',
      cue_priority: 10,
      when_to_use: 'throughout movement'
    }
  ]
};

const disciplineCues: Record<string, CoachingCue[]> = {
  'calisthenics': [
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'execution',
      cue_text: 'Focus on body tension and hollow body position',
      cue_priority: 8,
      when_to_use: 'throughout movement'
    },
    {
      exercise_id: '',
      target_level: 'intermediate',
      cue_type: 'progression',
      cue_text: 'Once you can perform 3x8 with good form, progress to the next variation',
      cue_priority: 6,
      when_to_use: 'when ready to progress'
    }
  ],
  'endurance': [
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'execution',
      cue_text: 'Maintain steady pace and rhythm, avoid going out too fast',
      cue_priority: 9,
      when_to_use: 'during effort'
    },
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'breathing',
      cue_text: 'Establish consistent breathing pattern matched to your movement',
      cue_priority: 8,
      when_to_use: 'throughout session'
    }
  ],
  'functional': [
    {
      exercise_id: '',
      target_level: 'all',
      cue_type: 'execution',
      cue_text: 'Move with speed and purpose while maintaining form',
      cue_priority: 8,
      when_to_use: 'during WOD'
    },
    {
      exercise_id: '',
      target_level: 'beginner',
      cue_type: 'safety',
      cue_text: 'Scale the movement if form breaks down - intensity is secondary to technique',
      cue_priority: 10,
      when_to_use: 'when fatigued'
    }
  ]
};

async function generateCoachingCues() {
  console.log('💬 GÉNÉRATION DES COACHING CUES');
  console.log('='.repeat(60));

  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name, discipline, movement_pattern, difficulty');

  if (error || !exercises) {
    console.error('❌ Erreur lecture exercices:', error);
    return;
  }

  console.log(`📊 Exercices à traiter: ${exercises.length}`);

  let inserted = 0;
  let skipped = 0;

  for (const exercise of exercises) {
    const cuesToInsert: CoachingCue[] = [];

    if (exercise.movement_pattern && movementPatternCues[exercise.movement_pattern]) {
      movementPatternCues[exercise.movement_pattern].forEach(cue => {
        cuesToInsert.push({
          ...cue,
          exercise_id: exercise.id
        });
      });
    }

    if (disciplineCues[exercise.discipline]) {
      disciplineCues[exercise.discipline].forEach(cue => {
        cuesToInsert.push({
          ...cue,
          exercise_id: exercise.id
        });
      });
    }

    if (exercise.difficulty === 'advanced' || exercise.difficulty === 'elite') {
      cuesToInsert.push({
        exercise_id: exercise.id,
        target_level: exercise.difficulty,
        cue_type: 'correction',
        cue_text: 'Focus on tempo control and mind-muscle connection for maximum effectiveness',
        cue_priority: 7,
        when_to_use: 'during working sets'
      });
    }

    if (cuesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('exercise_coaching_cues')
        .insert(cuesToInsert);

      if (insertError) {
        if (!insertError.message.includes('duplicate')) {
          console.error(`❌ Erreur insertion cues pour ${exercise.name}:`, insertError.message);
        }
        skipped++;
      } else {
        inserted += cuesToInsert.length;
      }
    }

    if ((inserted + skipped) % 50 === 0) {
      console.log(`  ⏳ Progression: ${inserted + skipped}/${exercises.length} exercices`);
    }
  }

  console.log(`\n✅ Génération terminée:`);
  console.log(`  - Cues insérées: ${inserted}`);
  console.log(`  - Exercices ignorés: ${skipped}`);
}

async function main() {
  try {
    await generateCoachingCues();
    console.log('\n✅ Script terminé avec succès\n');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));

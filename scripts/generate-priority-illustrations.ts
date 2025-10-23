/**
 * Pre-Generation Script for Priority Exercise Illustrations
 * Generates 50 highest priority exercise illustrations
 * Run with: npx tsx scripts/generate-priority-illustrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ExerciseMetadata {
  id: string;
  exercise_name: string;
  discipline: string;
  muscle_groups: string[];
  equipment_required: string[];
  movement_pattern: string;
  illustration_priority: number;
  recommended_angle: string;
  recommended_style: string;
}

async function main() {
  console.log('🎨 Starting priority illustration pre-generation\n');

  const { data: exercises, error } = await supabase
    .from('exercise_visual_metadata')
    .select('*')
    .order('illustration_priority', { ascending: false })
    .limit(50);

  if (error || !exercises) {
    console.error('❌ Failed to fetch exercises:', error);
    return;
  }

  console.log(`📋 Found ${exercises.length} priority exercises to generate\n`);

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i] as ExerciseMetadata;
    const progress = `[${i + 1}/${exercises.length}]`;

    console.log(`${progress} Processing: ${exercise.exercise_name} (${exercise.discipline})`);

    const existing = await supabase
      .from('illustration_library')
      .select('id')
      .eq('exercise_name', exercise.exercise_name)
      .eq('discipline', exercise.discipline)
      .maybeSingle();

    if (existing.data) {
      console.log(`  ⏭️  Already exists, skipping`);
      skippedCount++;
      continue;
    }

    const { data, error } = await supabase
      .from('illustration_generation_queue')
      .insert({
        type: 'exercise',
        exercise_name: exercise.exercise_name,
        discipline: exercise.discipline,
        generation_params: {
          type: 'exercise',
          exerciseName: exercise.exercise_name,
          discipline: exercise.discipline,
          muscleGroups: exercise.muscle_groups,
          equipment: exercise.equipment_required,
          movementPattern: exercise.movement_pattern,
          style: exercise.recommended_style,
          viewAngle: exercise.recommended_angle
        },
        priority: exercise.illustration_priority,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.log(`  ❌ Failed to queue: ${error.message}`);
      failureCount++;
    } else {
      console.log(`  ✅ Queued for generation (ID: ${data.id})`);
      successCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Pre-Generation Summary:');
  console.log(`✅ Queued: ${successCount}`);
  console.log(`⏭️  Skipped (already exist): ${skippedCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log('='.repeat(60));

  if (successCount > 0) {
    console.log('\n💡 Next steps:');
    console.log('1. Set up FLUX_API_KEY or OPENAI_API_KEY in Supabase Edge Function secrets');
    console.log('2. Process queue items manually or set up automatic processing');
    console.log('3. Monitor generation progress in illustration_generation_queue table');
  }
}

main().catch(console.error);

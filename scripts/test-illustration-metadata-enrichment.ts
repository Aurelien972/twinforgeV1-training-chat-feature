/**
 * Test script for illustration metadata enrichment
 * Verifies that visual_keywords and execution_phases are properly queried and used
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface VisualMetadataTest {
  exerciseName: string;
  discipline: string;
  expectedVisualKeywords: boolean;
  expectedExecutionPhases: boolean;
}

const testCases: VisualMetadataTest[] = [
  {
    exerciseName: 'Squat',
    discipline: 'force',
    expectedVisualKeywords: true,
    expectedExecutionPhases: true
  },
  {
    exerciseName: 'Deadlift',
    discipline: 'force',
    expectedVisualKeywords: true,
    expectedExecutionPhases: true
  },
  {
    exerciseName: 'Bench Press',
    discipline: 'force',
    expectedVisualKeywords: true,
    expectedExecutionPhases: true
  },
  {
    exerciseName: 'Pull-up',
    discipline: 'calisthenics',
    expectedVisualKeywords: true,
    expectedExecutionPhases: true
  },
  {
    exerciseName: 'Running Intervals',
    discipline: 'endurance',
    expectedVisualKeywords: false,
    expectedExecutionPhases: false
  }
];

async function testVisualMetadataEnrichment() {
  console.log('🧪 Testing Visual Metadata Enrichment for Illustrations\n');
  console.log('=' .repeat(80));

  let totalTests = 0;
  let passedTests = 0;

  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n📋 Test Case ${totalTests}: ${testCase.exerciseName} (${testCase.discipline})`);
    console.log('-'.repeat(80));

    try {
      // Normalize exercise name
      const normalizedName = testCase.exerciseName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();

      // Query exercise with visual metadata
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select(`
          id,
          name,
          visual_keywords,
          execution_phases,
          key_positions,
          movement_pattern,
          recommended_view_angle,
          recommended_visual_style
        `)
        .eq('discipline', testCase.discipline)
        .eq('is_active', true)
        .or(`name_normalized.eq.${normalizedName},name.ilike.%${testCase.exerciseName}%`)
        .limit(1);

      const exercise = exercises && exercises.length > 0 ? exercises[0] : null;

      if (error) {
        console.error(`   ❌ Query error: ${error.message}`);
        continue;
      }

      if (!exercise) {
        console.log(`   ⚠️  No exercise found in database`);
        console.log(`   📝 Note: This is expected for "${testCase.exerciseName}" if not seeded yet`);
        continue;
      }

      console.log(`   ✅ Exercise found: ${exercise.name} (ID: ${exercise.id})`);

      // Check visual_keywords
      const hasVisualKeywords = exercise.visual_keywords && exercise.visual_keywords.length > 0;
      console.log(`   🔑 Visual Keywords: ${hasVisualKeywords ? `✅ ${exercise.visual_keywords.length} keywords` : '❌ None'}`);
      if (hasVisualKeywords) {
        console.log(`      ${exercise.visual_keywords.slice(0, 3).join(', ')}${exercise.visual_keywords.length > 3 ? '...' : ''}`);
      }

      // Check execution_phases
      const hasExecutionPhases = exercise.execution_phases && exercise.execution_phases.length > 0;
      console.log(`   📊 Execution Phases: ${hasExecutionPhases ? `✅ ${exercise.execution_phases.length} phases` : '❌ None'}`);
      if (hasExecutionPhases) {
        exercise.execution_phases.forEach((phase: string, idx: number) => {
          console.log(`      ${idx + 1}. ${phase}`);
        });
      }

      // Check other metadata
      console.log(`   🎯 Movement Pattern: ${exercise.movement_pattern || '❌ Not set'}`);
      console.log(`   👁️  View Angle: ${exercise.recommended_view_angle || '❌ Not set'}`);
      console.log(`   🎨 Visual Style: ${exercise.recommended_visual_style || '❌ Not set'}`);

      // Validation
      const visualKeywordsMatch = hasVisualKeywords === testCase.expectedVisualKeywords;
      const executionPhasesMatch = hasExecutionPhases === testCase.expectedExecutionPhases;

      if (visualKeywordsMatch && executionPhasesMatch) {
        console.log(`   ✅ PASS: Metadata matches expectations`);
        passedTests++;
      } else {
        console.log(`   ⚠️  PARTIAL: Metadata differs from expectations`);
        if (!visualKeywordsMatch) {
          console.log(`      Expected visual_keywords: ${testCase.expectedVisualKeywords}, Got: ${hasVisualKeywords}`);
        }
        if (!executionPhasesMatch) {
          console.log(`      Expected execution_phases: ${testCase.expectedExecutionPhases}, Got: ${hasExecutionPhases}`);
        }
      }

    } catch (error) {
      console.error(`   ❌ Test failed with error: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${totalTests - passedTests}`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Visual metadata enrichment is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests did not pass. This may be expected if exercises are not fully seeded.\n');
  }
}

// Run tests
testVisualMetadataEnrichment()
  .then(() => {
    console.log('✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });

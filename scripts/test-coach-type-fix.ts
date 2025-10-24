/**
 * Test script to validate coach_type constraint fix
 *
 * This script:
 * 1. Tests the database constraint accepts both formats
 * 2. Validates the normalize_coach_type function
 * 3. Checks for any invalid coach_type values in existing data
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testCoachTypeConstraint() {
  console.log('\n🧪 Testing coach_type Constraint Fix\n');
  console.log('=' .repeat(60));

  // Test 1: Check constraint definition
  console.log('\n📋 Test 1: Checking constraint definition...');
  try {
    const { data, error } = await supabase.rpc('check_invalid_coach_types');

    if (error) {
      console.log('❌ Error checking constraint:', error.message);
    } else {
      console.log('✅ Constraint check function is working');
      if (data && data.length > 0) {
        console.log(`⚠️  Found ${data.length} sessions with invalid coach_type values:`);
        data.forEach((session: any) => {
          console.log(`   - Session ${session.session_id}: "${session.coach_type}"`);
        });
      } else {
        console.log('✅ No invalid coach_type values found');
      }
    }
  } catch (error: any) {
    console.log('❌ Test 1 failed:', error.message);
  }

  // Test 2: Test normalize_coach_type function
  console.log('\n🔄 Test 2: Testing normalize_coach_type function...');
  const testCases = [
    { input: 'coach-force', expected: 'force' },
    { input: 'coach-endurance', expected: 'endurance' },
    { input: 'force', expected: 'force' },
    { input: 'endurance', expected: 'endurance' },
    { input: null, expected: null }
  ];

  for (const testCase of testCases) {
    try {
      const { data, error } = await supabase
        .rpc('normalize_coach_type', { coach_type_value: testCase.input });

      if (error) {
        console.log(`❌ normalize_coach_type("${testCase.input}") failed:`, error.message);
      } else {
        const passed = data === testCase.expected;
        const icon = passed ? '✅' : '❌';
        console.log(`${icon} normalize_coach_type("${testCase.input}") = "${data}" ${passed ? '' : `(expected "${testCase.expected}")`}`);
      }
    } catch (error: any) {
      console.log(`❌ Error testing normalize_coach_type("${testCase.input}"):`, error.message);
    }
  }

  // Test 3: Count sessions by coach_type
  console.log('\n📊 Test 3: Current coach_type distribution...');
  try {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('coach_type');

    if (error) {
      console.log('❌ Error fetching sessions:', error.message);
    } else {
      const distribution: Record<string, number> = {};
      data.forEach((session: any) => {
        const coachType = session.coach_type || 'null';
        distribution[coachType] = (distribution[coachType] || 0) + 1;
      });

      console.log('✅ Coach type distribution:');
      Object.entries(distribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([coachType, count]) => {
          const hasPrefix = coachType.startsWith('coach-');
          const icon = hasPrefix ? '⚠️ ' : '✅';
          console.log(`   ${icon} ${coachType}: ${count} session(s)`);
        });

      const withPrefix = Object.keys(distribution).filter(k => k.startsWith('coach-')).length;
      if (withPrefix > 0) {
        console.log(`\n💡 Suggestion: ${withPrefix} coach_type value(s) still use the old format with prefix.`);
        console.log('   Consider running a data migration to normalize them.');
      }
    }
  } catch (error: any) {
    console.log('❌ Test 3 failed:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');
}

// Run tests
testCoachTypeConstraint().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: exercises, count } = await supabase
    .from('exercises')
    .select('name, category', { count: 'exact' })
    .eq('discipline', 'calisthenics')
    .order('category');

  console.log('\n📊 Current Calisthenics Count:', count);
  console.log('🎯 Target: 400 exercises');
  console.log('⚠️  Gap:', 400 - (count || 0), 'exercises needed\n');

  const categoryGroups = exercises?.reduce((acc: any, ex) => {
    acc[ex.category] = (acc[ex.category] || 0) + 1;
    return acc;
  }, {});

  console.log('📋 Breakdown by category:');
  console.log('='.repeat(50));
  Object.entries(categoryGroups || {})
    .sort(([, a]: any, [, b]: any) => b - a)
    .forEach(([cat, cnt]) => {
      console.log(`  ${cat}: ${cnt}`);
    });
  console.log('='.repeat(50));
}

main().then(() => process.exit(0));

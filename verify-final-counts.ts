import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyCounts() {
  const { count: enduranceCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('discipline', 'endurance');

  const { count: functionalCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('discipline', 'functional');

  const { count: forceCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('discipline', 'force');

  const { count: totalCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  console.log('\n📊 Exercise Count Summary:');
  console.log('='.repeat(50));
  console.log(`Force:      ${forceCount || 0} exercises`);
  console.log(`Endurance:  ${enduranceCount || 0} exercises (target: 500)`);
  console.log(`Functional: ${functionalCount || 0} exercises (target: 550)`);
  console.log('='.repeat(50));
  console.log(`TOTAL:      ${totalCount || 0} exercises\n`);
}

verifyCounts().then(() => process.exit(0));

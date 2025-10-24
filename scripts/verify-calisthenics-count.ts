import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { count: calisthenicsCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('discipline', 'calisthenics');

  const { count: totalCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  console.log('\n📊 Calisthenics Exercise Count Summary:');
  console.log('='.repeat(50));
  console.log(`Calisthenics: ${calisthenicsCount || 0} exercises (target: 400)`);
  console.log('='.repeat(50));
  console.log(`TOTAL ALL DISCIPLINES: ${totalCount || 0} exercises\n`);

  if (calisthenicsCount && calisthenicsCount >= 400) {
    console.log('✅ TARGET REACHED! Calisthenics enrichment complete!\n');
  } else {
    const remaining = 400 - (calisthenicsCount || 0);
    console.log(`⚠️  Still need ${remaining} more exercises to reach target\n`);
  }
}

main().then(() => process.exit(0));

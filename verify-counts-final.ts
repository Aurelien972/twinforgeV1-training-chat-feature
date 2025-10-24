import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const disciplines = ['force', 'endurance', 'functional'];
  
  console.log('\n📊 Exercise Count Summary:');
  console.log('='.repeat(50));
  
  for (const discipline of disciplines) {
    const { count } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('discipline', discipline);
    
    let target = '';
    if (discipline === 'endurance') target = ' (target: 500)';
    if (discipline === 'functional') target = ' (target: 550)';
    
    console.log(`${discipline.charAt(0).toUpperCase() + discipline.slice(1).padEnd(10)}: ${count || 0} exercises${target}`);
  }
  
  const { count: total } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });
  
  console.log('='.repeat(50));
  console.log(`TOTAL:      ${total || 0} exercises\n`);
}

main().then(() => process.exit(0));

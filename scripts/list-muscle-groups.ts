import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listMuscleGroups() {
  const { data, error } = await supabase
    .from('muscle_groups')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nAvailable Muscle Groups:\n');
  data?.forEach(mg => {
    console.log(`  - ${mg.name}`);
  });
  console.log(`\nTotal: ${data?.length}\n`);
}

listMuscleGroups().then(() => process.exit(0));

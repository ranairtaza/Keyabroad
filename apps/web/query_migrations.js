const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function main() {
  const { data, error } = await supabase
    .from('supabase_migrations.schema_migrations')
    .select('*')
    .eq('version', '20260929121651');

  if (error) {
    // maybe we can't query supabase_migrations using anon key
    console.error("Error querying schema_migrations:", error);
  } else {
    console.log("Migration:", JSON.stringify(data, null, 2));
  }
}

main();

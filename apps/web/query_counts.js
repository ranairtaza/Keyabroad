const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function main() {
  const { data: b, error: eb } = await supabase.from('blogs').select('slug');
  console.log('Blogs:', b?.length, b?.map(x => x.slug).slice(0, 3));
  if (eb) console.error("Error:", eb);
}

main();

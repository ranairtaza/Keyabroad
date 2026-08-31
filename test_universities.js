const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('universities')
    .select(`
      id,
      name,
      intake_months,
      intakes
    `);

  console.log('Error:', error);
  console.log('Data count:', data?.length);
  
  if (data) {
    for (const uni of data) {
      if (uni.intake_months && !Array.isArray(uni.intake_months)) {
        console.log(`Bad intake_months for ${uni.name}:`, uni.intake_months, typeof uni.intake_months);
      }
      if (uni.intakes && !Array.isArray(uni.intakes)) {
        console.log(`Bad intakes for ${uni.name}:`, uni.intakes, typeof uni.intakes);
      }
    }
  }
}

test();

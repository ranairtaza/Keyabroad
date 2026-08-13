/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://recztpctppoywqdcnrdr.supabase.co',
  'sb_secret_deKkD7LThiIzgYpQJPM9VA_-PvhK4C0'
);

async function check() {
  const { data: policies } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Notifications:", policies);
}
check();

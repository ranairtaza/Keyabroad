/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://recztpctppoywqdcnrdr.supabase.co',
  'sb_secret_deKkD7LThiIzgYpQJPM9VA_-PvhK4C0'
);

async function check() {
  const { data, error } = await supabase.from('office_tasks').select('*').order('created_at', { ascending: false });
  console.log("Rows fetched via service role:", data ? data.length : error);
}
check();

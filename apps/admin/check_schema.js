const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://recztpctppoywqdcnrdr.supabase.co',
  'sb_secret_deKkD7LThiIzgYpQJPM9VA_-PvhK4C0'
);

async function check() {
  const { data, error } = await supabase.from('office_tasks').select('*');
  console.log("Columns:", data && data.length > 0 ? Object.keys(data[0]) : "Still no rows");
  console.log("Row:", data);
}
check();

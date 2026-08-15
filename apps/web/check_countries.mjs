import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("Missing SUPABASE_URL");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function checkData() {
  const { data: anonData, error: anonError } = await createClient(supabaseUrl, supabaseKey).from('countries').select('id, name, status, verification_status');
  console.log("Anon RLS view:", anonData, anonError);

  if (supabaseServiceKey) {
    const { data: adminData, error: adminError } = await supabase.from('countries').select('id, name, status, verification_status');
    console.log("Admin (bypass RLS) view:", adminData, adminError);
  }
}

checkData();

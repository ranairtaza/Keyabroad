import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'biometric_devices';" });
  console.log('RPC Error:', error);
  
  if (error && error.code === 'PGRST202') {
     // No RPC, query directly if possible, or just insert and catch error
     const { error: insErr } = await supabaseAdmin.from('biometric_devices').insert({ id: '00000000-0000-0000-0000-000000000000', device_name: 'test', "mode": "TEST" } as any);
     console.log('Insert Error:', insErr);
  }
}

run();

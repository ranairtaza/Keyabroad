import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/admin/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('payments').select(`
    id, amount, currency_code, method, reference_number, payment_date, status,
    received_by:profiles!payments_received_by_fkey(full_name),
    invoices ( id, invoice_number, students ( name ) )
  `).limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

test();

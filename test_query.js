import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/admin/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log("Checking payments query...")
  const { data, error, count } = await supabase
    .from('payments')
    .select(`
      id, amount, currency_code, method, reference_number, payment_date, status,
      received_by:profiles!payments_received_by_fkey(full_name),
      invoices ( id, invoice_number, students ( name ) )
    `, { count: 'exact' })
    .order('payment_date', { ascending: false })
    .limit(1)

  if (error) {
    console.error("Error:", error)
    process.exit(1)
  }
  
  console.log("Success! Data fetched:", JSON.stringify(data, null, 2))
  console.log("Count:", count)
}

check()

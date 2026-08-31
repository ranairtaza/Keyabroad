import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/admin/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .limit(1)

  if (error) {
    console.error("Error:", error)
    process.exit(1)
  }
  
  console.log("Students schema:", data.length ? Object.keys(data[0]) : "No data")
}

check()

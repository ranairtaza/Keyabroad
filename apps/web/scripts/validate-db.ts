import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log("NOT READY: Missing Supabase credentials in .env.local. Cannot perform DB dry run.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runDryRun() {
  console.log("--- FINAL DB MIGRATION DRY RUN ---");
  
  // 1. Check existing tables
  const { data: tables, error: tableError } = await supabase.rpc('get_tables_dry_run').select('*').limit(1);
  // Actually, without a custom RPC or direct postgres access (which the supabase-js client doesn't have natively for information_schema), we can just try to SELECT from them.
  
  const tablesToCheck = ['countries', 'country_features', 'universities', 'programs', 'scholarships'];
  const existingTables = [];
  const missingTables = [];
  
  for (const table of tablesToCheck) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error && error.code === '42P01') {
      missingTables.push(table);
    } else {
      existingTables.push(table);
    }
  }

  console.log(`\nExisting Tables: ${existingTables.join(', ') || 'None'}`);
  console.log(`Newly Created Tables (Will be created): ${missingTables.join(', ') || 'None'}`);

  // 2. Check Scholarship Violations
  let scholarshipViolations = 0;
  if (existingTables.includes('scholarships')) {
    const { data: violations, error: vError } = await supabase
      .from('scholarships')
      .select('id')
      .is('university_id', null)
      .is('country_id', null);
      
    if (!vError && violations) {
      scholarshipViolations = violations.length;
    }
  }
  
  console.log(`\nExisting scholarship rows violating parent requirement: ${scholarshipViolations}`);
  
  if (scholarshipViolations > 0) {
    console.log("NOT READY: There are existing scholarship records that would violate the new chk_scholarship_parent constraint.");
  } else {
    console.log("\nREADY FOR EXECUTION");
  }
}

runDryRun().catch(console.error);

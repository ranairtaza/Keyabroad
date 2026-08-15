import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We require a SUPABASE_URL and SUPABASE_ANON_KEY to simulate a client, 
// but since we are testing an RPC, we might need SUPABASE_SERVICE_ROLE_KEY to bypass RLS for the setup.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("=== GATE 3 CONCURRENCY TEST ===");
  
  // 1. Setup: Create a student and an invoice
  console.log("1. Setting up test data...");
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .insert({ full_name: 'Concurrency Test Student' })
    .select()
    .single();
    
  if (studentErr) {
    console.error("Failed to create student. Make sure you have a .env.local with service role key if testing externally.", studentErr.message);
    return;
  }

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      student_id: student.id,
      status: 'ISSUED',
      total_amount: 1000,
      currency_code: 'USD'
    })
    .select()
    .single();

  if (invErr) {
    console.error("Failed to create invoice:", invErr.message);
    return;
  }

  // To simulate the item total, we just artificially bypassed it using service role, 
  // but let's just make sure amount_paid is 0.
  console.log(`Created Invoice ${invoice.id} for $1,000`);

  // We do a pre-payment of $600
  console.log("Recording initial $600 payment...");
  await supabase.rpc('record_payment', {
    p_invoice_id: invoice.id,
    p_amount: 600,
    p_method: 'CASH',
    p_reference_number: 'INIT'
  });

  const { data: midInvoice } = await supabase.from('invoices').select('amount_paid').eq('id', invoice.id).single();
  console.log(`Current amount_paid: $${midInvoice?.amount_paid}. Remaining: $${1000 - (midInvoice?.amount_paid || 0)}`);

  // 2. Concurrency Test
  console.log("\n2. Executing concurrent payments (A=$300, B=$300) against remaining $400 balance...");
  
  const paymentA = supabase.rpc('record_payment', {
    p_invoice_id: invoice.id,
    p_amount: 300,
    p_method: 'CASH',
    p_reference_number: 'CONC-A'
  });

  const paymentB = supabase.rpc('record_payment', {
    p_invoice_id: invoice.id,
    p_amount: 300,
    p_method: 'CASH',
    p_reference_number: 'CONC-B'
  });

  const results = await Promise.allSettled([paymentA, paymentB]);
  
  results.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      if (res.value.error) {
         console.log(`Payment ${i === 0 ? 'A' : 'B'} FAILED as expected: ${res.value.error.message}`);
      } else {
         console.log(`Payment ${i === 0 ? 'A' : 'B'} SUCCEEDED.`);
      }
    } else {
      console.log(`Payment ${i === 0 ? 'A' : 'B'} REJECTED:`, res.reason);
    }
  });

  // 3. Final Verification
  const { data: finalInvoice } = await supabase.from('invoices').select('amount_paid, status').eq('id', invoice.id).single();
  
  console.log(`\nFinal Invoice State: amount_paid = $${finalInvoice?.amount_paid}, status = ${finalInvoice?.status}`);
  
  if (finalInvoice?.amount_paid > 1000) {
    console.error("❌ CONCURRENCY TEST FAILED: Overpayment occurred.");
  } else if (finalInvoice?.amount_paid === 900) {
    console.log("✅ CONCURRENCY TEST PASSED: Only one payment succeeded, balance protected by SELECT FOR UPDATE.");
  } else {
    console.log("⚠️ UNEXPECTED STATE:", finalInvoice);
  }

  // Cleanup
  console.log("\nCleaning up test data...");
  await supabase.from('students').delete().eq('id', student.id);
  console.log("Cleanup complete.");
}

runTest();

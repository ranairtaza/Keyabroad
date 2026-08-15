import { NextResponse } from "next/server";

// Verify secret token for cron job auth
const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key';

export async function POST(request: Request) {
  const startTime = Date.now();
  let jobRunId: string | null = null;
  let supabase: any = null;

  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role for cron automation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabase = (await import('@supabase/supabase-js')).createClient(supabaseUrl, supabaseServiceKey);

    // 1. Initialize Job Run Telemetry
    const { data: jobRun, error: jobError } = await supabase
      .from('job_runs')
      .insert({
        job_name: 'automation_check_invoices',
        status: 'running',
        context: { initiated_at: new Date().toISOString() }
      })
      .select('id')
      .single();

    if (jobError) console.error("Telemetry Error: Could not create job_run", jobError);
    if (jobRun) jobRunId = jobRun.id;

    // 2. Identify Invoices that are or should be OVERDUE
    const { data: eligibleInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, student_id, invoice_number, assigned_counselor_id, status')
      .lt('due_date', new Date().toISOString())
      .in('status', ['ISSUED', 'PARTIAL', 'OVERDUE']);

    if (fetchError) throw fetchError;
    
    let tasksCreated = 0;
    let auditsCreated = 0;
    let invoicesUpdated = 0;

    if (eligibleInvoices && eligibleInvoices.length > 0) {
      // 3. Prevent Duplicate Tasks (Idempotency against partial failures)
      // Check which overdue tasks already exist
      const { data: existingTasks } = await supabase
        .from('crm_tasks')
        .select('title')
        .like('title', 'Follow up on Overdue Invoice:%');

      const existingTaskTitles = new Set(existingTasks?.map((t: any) => t.title) || []);

      const invoicesNeedingUpdate = eligibleInvoices.filter((inv: any) => inv.status !== 'OVERDUE');
      const invoicesNeedingTasks = eligibleInvoices.filter((inv: any) => 
        !existingTaskTitles.has(`Follow up on Overdue Invoice: ${inv.invoice_number}`)
      );

      // 4. Transition statuses
      if (invoicesNeedingUpdate.length > 0) {
        const idsToUpdate = invoicesNeedingUpdate.map((inv: any) => inv.id);
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: 'OVERDUE', updated_at: new Date().toISOString() })
          .in('id', idsToUpdate);
        
        if (updateError) throw updateError;
        invoicesUpdated = idsToUpdate.length;
      }

      // 5. Create Missing Tasks and Audits
      const tasksToInsert = [];
      const auditsToInsert = [];
      
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

      for (const invoice of invoicesNeedingTasks) {
        // Construct CRM Task directly from the Snapshot Ownership
        if (invoice.assigned_counselor_id) {
          tasksToInsert.push({
            assigned_to: invoice.assigned_counselor_id, // SNAPSHOT OWNERSHIP
            related_student_id: invoice.student_id,
            title: `Follow up on Overdue Invoice: ${invoice.invoice_number}`,
            description: `Invoice ${invoice.invoice_number} is now officially overdue. Please contact the student immediately to arrange payment.`,
            due_date: twoDaysFromNow.toISOString(),
            priority: 'HIGH',
            status: 'pending'
          });
        }

        // Only create audit log if we also actually just updated the invoice, or if it was missed previously
        auditsToInsert.push({
          entity_name: `Invoice ${invoice.invoice_number}`,
          entity_type: 'INVOICE',
          entity_id: invoice.id,
          actor_id: null, // System Action
          action: 'STATUS_OVERDUE',
          new_data: { status: 'OVERDUE', transition_reason: 'Automated due_date expiration' }
        });
      }

      // Batch Inserts
      if (tasksToInsert.length > 0) {
        const { error: taskError } = await supabase.from('crm_tasks').insert(tasksToInsert);
        if (taskError) throw taskError;
        tasksCreated = tasksToInsert.length;
      }

      if (auditsToInsert.length > 0) {
        const { error: auditError } = await supabase.from('audit_logs').insert(auditsToInsert);
        if (auditError) console.error("Audit Logging Error:", auditError);
        else auditsCreated = auditsToInsert.length;
      }
    }

    const durationMs = Date.now() - startTime;
    const resultContext = { invoices_marked_overdue: invoicesUpdated, tasks_created: tasksCreated, audits_created: auditsCreated };

    // 6. Complete Job Run Telemetry
    if (jobRunId) {
      await supabase.from('job_runs').update({
        status: 'success',
        duration_ms: durationMs,
        context: resultContext
      }).eq('id', jobRunId);
    }

    return NextResponse.json({ success: true, ...resultContext, duration_ms: durationMs });

  } catch (error: any) {
    console.error("Cron Error (check-invoices):", error);
    
    // Log Failure Telemetry
    if (jobRunId && supabase) {
      await supabase.from('job_runs').update({
        status: 'failure',
        duration_ms: Date.now() - startTime,
        error: error.message
      }).eq('id', jobRunId);
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

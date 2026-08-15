import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@keyabroad/database';

export const maxDuration = 60; // Vercel function timeout
export const revalidate = 0;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // 1. CRON Security
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Service Role Client Initialization
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const startTime = Date.now();
  let tasksCreated = 0;
  let leadsProcessed = 0;
  
  try {
    // 3. Automation: Stale Leads
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 7);
    
    // Using simple query for leads
    const { data: staleLeads, error: leadsError } = await supabaseAdmin
      .from('crm_leads')
      .select('id, student_id, updated_at, students(counselor_id)')
      .lt('updated_at', staleDate.toISOString())
      .limit(100);

    if (leadsError) throw leadsError;

    if (staleLeads) {
      leadsProcessed = staleLeads.length;
      
      for (const lead of staleLeads) {
        // Idempotency check
        const { data: existingTask } = await supabaseAdmin
          .from('crm_tasks')
          .select('id')
          .eq('related_student_id', lead.student_id!)
          .eq('title', 'Follow up Stale Lead')
          .neq('status', 'completed')
          .maybeSingle();

        if (!existingTask) {
          // Determine assignee (default to a system user or leave null if no counselor)
          // @ts-expect-error - relation missing
          const assignee = lead.students?.counselor_id || null;
          
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow
          
          await supabaseAdmin.from('crm_tasks').insert({
            title: 'Follow up Stale Lead',
            description: `Lead has been inactive since ${new Date(lead.updated_at).toLocaleDateString()}. Please follow up.`,
            status: 'pending',
            priority: 'high',
            due_date: dueDate.toISOString(),
            related_student_id: lead.student_id,
            assigned_to: assignee
          });
          tasksCreated++;
        }
      }
    }

    // 4. Log Job Run
    const durationMs = Date.now() - startTime;
    await supabaseAdmin.from('job_runs').insert({
      job_name: 'sla-check-automation',
      status: 'completed',
      duration_ms: durationMs,
      metadata: {
        tasks_created: tasksCreated,
        leads_processed: leadsProcessed
      }
    });

    return NextResponse.json({ success: true, tasksCreated, durationMs });

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    
    // Log failure
    await supabaseAdmin.from('job_runs').insert({
      job_name: 'sla-check-automation',
      status: 'failed',
      duration_ms: durationMs,
      error_message: error.message || 'Unknown error during SLA check'
    });

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@keyabroad/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@keyabroad/ui/components/card";
import { Activity, AlertCircle, Clock, FileWarning, Briefcase, Users } from "lucide-react";

export const revalidate = 0;

export default async function CommandCenterPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore for server components
          }
        },
      },
    }
  );

  // Authenticate user & Get Role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div>Unauthorized. Please log in.</div>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('staff_role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'branch_manager'].includes(profile.staff_role as string)) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">Command Center is restricted to management roles.</p>
      </div>
    );
  }

  // 1. Stale Leads (No update in 7 days)
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 7);
  const { count: staleLeadsCount } = await supabase
    .from('crm_leads')
    .select('*', { count: 'exact', head: true })
    .lt('updated_at', staleDate.toISOString());

  // 2. Active Applications (Not draft, rejected, withdrawn, completed)
  const { count: activeAppsCount } = await supabase
    .from('student_applications')
    .select('*', { count: 'exact', head: true })
    .in('status', ['submitted', 'under_review', 'conditional_offer', 'unconditional_offer']);

  // 3. Pending Documents
  const { count: pendingDocsCount } = await supabase
    .from('student_documents')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending');

  // 4. Rejected Documents
  const { count: rejectedDocsCount } = await supabase
    .from('student_documents')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'rejected');

  // 5. Overdue Tasks
  const { count: overdueTasksCount } = await supabase
    .from('crm_tasks')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'completed')
    .lt('due_date', new Date().toISOString());

  // 6. Tasks Due Today
  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date();
  endOfDay.setHours(23,59,59,999);
  
  const { count: tasksTodayCount } = await supabase
    .from('crm_tasks')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'completed')
    .gte('due_date', startOfDay.toISOString())
    .lte('due_date', endOfDay.toISOString());

  // 7. Active Automations (Job runs today)
  const { count: automationsRunCount } = await supabase
    .from('job_runs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString());

  const { count: automationsFailedCount } = await supabase
    .from('job_runs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('created_at', startOfDay.toISOString());

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Operations Command Center</h1>
        <p className="text-muted-foreground">
          Real-time system health and operational business intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workload */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAppsCount || 0}</div>
            <p className="text-xs text-muted-foreground">In active pipeline</p>
          </CardContent>
        </Card>
        
        {/* Stale Leads */}
        <Card className={staleLeadsCount && staleLeadsCount > 0 ? "border-amber-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stale Leads</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staleLeadsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Inactive &gt; 7 days</p>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className={overdueTasksCount && overdueTasksCount > 0 ? "border-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasksCount || 0}</div>
            <p className="text-xs text-muted-foreground">Requires immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksTodayCount || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled follow-ups</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Document Verification Queue</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <FileWarning className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDocsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting counselor verification</p>
          </CardContent>
        </Card>
        <Card className={rejectedDocsCount && rejectedDocsCount > 0 ? "border-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Documents</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedDocsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Require student re-upload</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Automation Engine Health</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Run (Today)</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationsRunCount || 0}</div>
            <p className="text-xs text-muted-foreground">SLA and trigger executions</p>
          </CardContent>
        </Card>
        <Card className={automationsFailedCount && automationsFailedCount > 0 ? "border-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{automationsFailedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Require IT attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

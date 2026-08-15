import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@keyabroad/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@keyabroad/ui/components/card";
import { CheckCircle2, Clock, Users, ShieldAlert, BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function PerformanceDashboardPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return <div>Access Denied</div>;

  const isManagement = ['super_admin', 'admin', 'branch_manager'].includes(profile.staff_role as string);

  // Define scope for queries based on role
  // Counselors see only their stats. Managers see global stats for now (could be scoped by branch later).
  const counselorFilter = isManagement ? null : user.id;

  // 1. Total Assigned Students
  let studentsQuery = supabase.from('students').select('*', { count: 'exact', head: true });
  if (counselorFilter) studentsQuery = studentsQuery.eq('counselor_id', counselorFilter);
  const { count: assignedStudents } = await studentsQuery;

  // 2. Completed Tasks
  let completedTasksQuery = supabase.from('crm_tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed');
  if (counselorFilter) completedTasksQuery = completedTasksQuery.eq('assigned_to', counselorFilter);
  const { count: completedTasks } = await completedTasksQuery;

  // 3. Overdue Tasks
  let overdueTasksQuery = supabase.from('crm_tasks')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'completed')
    .lt('due_date', new Date().toISOString());
  if (counselorFilter) overdueTasksQuery = overdueTasksQuery.eq('assigned_to', counselorFilter);
  const { count: overdueTasks } = await overdueTasksQuery;

  // 4. Stale Leads
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 7);
  let staleLeadsQuery = supabase.from('crm_leads')
    .select('*, student:students!inner(counselor_id)', { count: 'exact', head: true })
    .lt('updated_at', staleDate.toISOString());
  if (counselorFilter) staleLeadsQuery = staleLeadsQuery.eq('students.counselor_id', counselorFilter);
  const { count: staleLeads } = await staleLeadsQuery;

  // Calculate task completion rate
  const totalTasks = (completedTasks || 0) + (overdueTasks || 0); // simplistic representation
  const completionRate = totalTasks > 0 ? Math.round(((completedTasks || 0) / totalTasks) * 100) : 100;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Performance Dashboard</h1>
        <p className="text-muted-foreground">
          {isManagement ? "Organization-wide SLA compliance and counselor workloads." : "Your personal CRM performance metrics."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Students</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Active in pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className={overdueTasks && overdueTasks > 0 ? "border-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Breaches (Tasks)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks || 0}</div>
            <p className="text-xs text-muted-foreground">Overdue action items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">Relative to overdue backlog</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

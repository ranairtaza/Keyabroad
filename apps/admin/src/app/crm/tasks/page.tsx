import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/lib/db";
import { Card, CardContent } from "@/lib/ui/components/card";
import { Badge } from "@/lib/ui/components/badge";
import { CheckCircle2, Circle, AlertCircle, Clock, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const revalidate = 0;

interface TasksPageProps {
  searchParams: { filter?: string };
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
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

  const filter = searchParams.filter || 'my_tasks';

  let query = supabase
    .from('crm_tasks')
    .select(`
      *,
      student:students(
        id,
        first_name,
        last_name
      )
    `)
    .order('due_date', { ascending: true });

  const now = new Date();
  
  if (filter === 'my_tasks') {
    query = query.eq('assigned_to', user.id).neq('status', 'completed');
  } else if (filter === 'overdue') {
    query = query.lt('due_date', now.toISOString()).neq('status', 'completed');
  } else if (filter === 'today') {
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);
    query = query.gte('due_date', startOfDay.toISOString())
                 .lte('due_date', endOfDay.toISOString())
                 .neq('status', 'completed');
  } else if (filter === 'high_priority') {
    query = query.eq('priority', 'high').neq('status', 'completed');
  }

  const { data: tasks, error } = await query.limit(50);

  if (error) {
    console.error(error);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">Monitor workloads and SLA compliance.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b pb-4">
        <Link href="?filter=my_tasks">
          <Badge variant={filter === 'my_tasks' ? 'default' : 'secondary'} className="cursor-pointer">My Tasks</Badge>
        </Link>
        <Link href="?filter=overdue">
          <Badge variant={filter === 'overdue' ? 'destructive' : 'secondary'} className="cursor-pointer">Overdue SLA</Badge>
        </Link>
        <Link href="?filter=today">
          <Badge variant={filter === 'today' ? 'default' : 'secondary'} className="cursor-pointer">Due Today</Badge>
        </Link>
        <Link href="?filter=high_priority">
          <Badge variant={filter === 'high_priority' ? 'default' : 'secondary'} className="cursor-pointer">High Priority</Badge>
        </Link>
      </div>

      <div className="space-y-4">
        {(!tasks || tasks.length === 0) && (
          <div className="text-center py-12 text-slate-500">
            No tasks found for this filter.
          </div>
        )}
        {tasks?.map(task => {
          const isOverdue = new Date(task.due_date) < now && task.status !== 'completed';
          
          return (
            <Card key={task.id} className={isOverdue ? "border-red-200 bg-red-50/50" : ""}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="text-green-500 h-6 w-6 shrink-0" />
                  ) : isOverdue ? (
                    <AlertCircle className="text-red-500 h-6 w-6 shrink-0" />
                  ) : (
                    <Circle className="text-slate-300 h-6 w-6 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{task.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> 
                        {isOverdue ? (
                          <span className="text-red-600 font-medium">Overdue ({new Date(task.due_date).toLocaleDateString()})</span>
                        ) : (
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                      </span>
                      
                      {task.student && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <Link href={`/crm/students/${task.related_student_id}`} className="hover:underline text-blue-600">
                            {task.student.first_name} {task.student.last_name}
                          </Link>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="uppercase">
                    {task.priority}
                  </Badge>
                  {task.related_student_id && (
                    <Link href={`/crm/students/${task.related_student_id}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">
                        Student 360 &rarr;
                      </Badge>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@keyabroad/database";
import { Card, CardContent, CardHeader, CardTitle } from "@keyabroad/ui/components/card";
import { Badge } from "@keyabroad/ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@keyabroad/ui/components/tabs";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle, AlertCircle, Clock, FileWarning, Briefcase, FileText, Activity } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function Student360Page({ params }: { params: { id: string } }) {
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

  const studentId = params.id;

  // 1. Fetch Student Profile
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    return <div className="p-8 text-red-500">Student not found or unauthorized.</div>;
  }

  // 2. Fetch CRM Lead
  const { data: lead } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  // 3. Fetch Priority Engine (RPC)
  const { data: priorityData } = await supabase.rpc('get_student_priority', { p_student_id: studentId });
  const priority = (priorityData as any) || { score: 0, priority: 'LOW', reasons: [] };

  // 4. Fetch Applications
  const { data: applications } = await supabase
    .from('student_applications')
    .select('*')
    .eq('student_id', studentId);

  // 5. Fetch Documents
  const { data: documents } = await supabase
    .from('student_documents')
    .select('*')
    .eq('student_id', studentId);

  // 6. Fetch Open Tasks
  const { data: tasks } = await supabase
    .from('crm_tasks')
    .select('*')
    .eq('related_student_id', studentId)
    .neq('status', 'completed')
    .order('due_date', { ascending: true });

  // 7. Fetch Timeline (RPC)
  const { data: timelineData } = await supabase.rpc('get_student_timeline', { p_student_id: studentId });
  const timeline = (timelineData as any[]) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER & PRIORITY */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Student 360 Workspace
            {lead && lead.status !== 'new' && <Badge variant="outline" className="uppercase">{lead.status}</Badge>}
          </p>
        </div>

        <Card className="md:w-1/3">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Operational Priority</span>
              <Badge variant={priority.priority === 'HIGH' ? 'destructive' : priority.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                {priority.priority} SCORE: {priority.score}
              </Badge>
            </div>
            {priority.reasons.length > 0 ? (
              <ul className="text-xs text-red-600 space-y-1 mt-2">
                {priority.reasons.map((r: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {r.reason || r}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> All SLAs healthy
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Profile Identity</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium">{student.email_address}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium">{student.phone_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Country</span>
                  <span className="font-medium">{student.country || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Action Items</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Link href={`/crm/tasks?filter=my_tasks`} className="flex items-center justify-between p-3 bg-slate-50 rounded border hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <h4 className="font-semibold text-sm">Open Tasks</h4>
                      <p className="text-xs text-slate-500">{tasks?.length || 0} pending action(s)</p>
                    </div>
                  </div>
                  <span className="text-blue-500 text-sm">&rarr;</span>
                </Link>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                  <div className="flex items-center gap-3">
                    <FileWarning className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="font-semibold text-sm">Document Verification</h4>
                      <p className="text-xs text-slate-500">{documents?.filter(d => d.verification_status === 'pending').length || 0} pending review</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications" className="pt-6">
          <div className="grid gap-4">
            {applications?.map(app => (
              <Card key={app.id}>
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-blue-600 p-1.5 bg-blue-100 rounded" />
                    <div>
                      <h3 className="font-semibold text-lg">{app.university_name}</h3>
                      <p className="text-sm text-slate-500">{app.program_name} • {app.country}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant="outline" className="uppercase text-xs">{app.status.replace('_', ' ')}</Badge>
                    <div className="text-xs text-slate-500 text-right space-y-1">
                      {app.application_deadline && <div>App Deadline: <span className="font-medium">{new Date(app.application_deadline).toLocaleDateString()}</span></div>}
                      {app.visa_deadline && <div>Visa Deadline: <span className="font-medium">{new Date(app.visa_deadline).toLocaleDateString()}</span></div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!applications || applications.length === 0) && (
              <div className="text-center p-8 text-slate-500">No applications created yet.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="pt-6">
          <div className="grid gap-4">
            {documents?.map(doc => (
              <Card key={doc.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-slate-600 p-1.5 bg-slate-100 rounded" />
                    <div>
                      <h3 className="font-semibold">{doc.file_name}</h3>
                      <p className="text-xs text-slate-500 uppercase">{doc.category}</p>
                    </div>
                  </div>
                  <Badge variant={doc.verification_status === 'verified' ? 'default' : doc.verification_status === 'rejected' ? 'destructive' : 'secondary'}>
                    {doc.verification_status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {(!documents || documents.length === 0) && (
              <div className="text-center p-8 text-slate-500">No documents uploaded.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="pt-6">
           <div className="grid gap-4">
            {tasks?.map(task => {
              const isOverdue = new Date(task.due_date) < new Date();
              return (
                <Card key={task.id} className={isOverdue ? "border-red-200" : ""}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isOverdue ? <AlertCircle className="text-red-500 w-5 h-5" /> : <Circle className="text-slate-300 w-5 h-5" />}
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="uppercase">
                      {task.priority}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
             {(!tasks || tasks.length === 0) && (
              <div className="text-center p-8 text-slate-500">No open tasks.</div>
            )}
           </div>
        </TabsContent>

        <TabsContent value="timeline" className="pt-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5"/> Activity Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="relative border-l border-slate-200 ml-3 space-y-6">
                {timeline.map((event: any, idx: number) => (
                  <div key={`${event.entity_id}-${idx}`} className="pl-6 relative">
                    <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-1.5 top-1 border-2 border-white" />
                    <div className="text-sm font-medium uppercase text-blue-600 mb-1 flex items-center justify-between">
                      {event.type}
                      <span className="text-xs text-slate-400 font-normal">{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-slate-600">{event.description}</p>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <pre className="text-xs bg-slate-50 p-2 mt-2 rounded border border-slate-100 overflow-x-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
                {timeline.length === 0 && (
                  <div className="pl-6 text-slate-500 text-sm">No activity recorded yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

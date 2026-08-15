'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@keyabroad/auth/client';
import { Card, CardHeader, CardTitle, CardContent } from '@keyabroad/ui/components/card';
import { GraduationCap, Briefcase, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchApplications = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get internal student ID
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();
        
      if (!studentData) return;

      const { data } = await supabase
        .from('student_applications')
        .select(`
          id,
          status,
          visa_status,
          visa_appointment_date,
          created_at,
          universities(name, country),
          programs(name, degree_level)
        `)
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });

      if (data) {
        setApplications(data);
      }
      setLoading(false);
    };

    fetchApplications();
  }, [supabase]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'accepted': return <CheckCircle className="text-green-500 w-5 h-5" />;
      case 'rejected': return <XCircle className="text-red-500 w-5 h-5" />;
      case 'under_review': return <Clock className="text-blue-500 w-5 h-5" />;
      default: return <Clock className="text-yellow-500 w-5 h-5" />;
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return 'Pending Submission';
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">My Applications</h1>
        <p className="text-muted-foreground mt-2">
          Track the status of your university and visa applications.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading applications...</div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You do not have any active applications yet. Please contact your counselor to start the process!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <Card key={app.id} className="overflow-hidden">
              <div className="border-b bg-slate-50 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 font-semibold">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  {app.universities?.name || 'University Application'}
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border shadow-sm text-sm font-medium">
                  {getStatusIcon(app.status)}
                  {formatStatus(app.status)}
                </div>
              </div>
              <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                
                {/* University Track */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider border-b pb-2">University Track</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-muted-foreground">Program:</span> <span className="font-medium text-right">{app.programs?.name || 'N/A'}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Level:</span> <span className="font-medium">{app.programs?.degree_level || 'N/A'}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Country:</span> <span className="font-medium">{app.universities?.country || 'N/A'}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Started On:</span> <span className="font-medium">{new Date(app.created_at).toLocaleDateString()}</span></p>
                  </div>
                </div>

                {/* Visa Track */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider border-b pb-2">Visa Track</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center justify-between">
                      <span className="text-muted-foreground">Visa Status:</span> 
                      <span className="font-medium bg-slate-100 px-2 py-0.5 rounded">{formatStatus(app.visa_status)}</span>
                    </p>
                    {app.visa_appointment_date && (
                      <p className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> Appointment:</span> 
                        <span className="font-medium">{new Date(app.visa_appointment_date).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

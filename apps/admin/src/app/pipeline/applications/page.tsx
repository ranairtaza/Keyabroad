'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@keyabroad/auth/client';
import { Card, CardHeader, CardTitle, CardContent } from '@keyabroad/ui/components/card';
import { Button } from '@keyabroad/ui/components/button';

export default function ApplicationPipelinePage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchApplications = async () => {
    setLoading(true);
    // Fetch applications with joined data from students, universities, and counselors (if available)
    const { data, error } = await supabase
      .from('student_applications')
      .select(`
        id,
        status,
        visa_status,
        visa_appointment_date,
        created_at,
        student_id,
        students!student_id (full_name, user_id)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [supabase]);

  // Group applications by status for a basic kanban-like visualization
  const groupedApps = {
    pending: applications.filter(a => a.status === 'pending' || !a.status),
    under_review: applications.filter(a => a.status === 'under_review'),
    accepted: applications.filter(a => a.status === 'accepted'),
    rejected: applications.filter(a => a.status === 'rejected')
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-primary">Application Pipeline</h1>
          <p className="text-muted-foreground mt-2">
            Track student university and visa applications.
          </p>
        </div>
        <Button onClick={fetchApplications} variant="outline">Refresh Pipeline</Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading pipeline...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Column 1 */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
            <h2 className="font-bold text-slate-700 uppercase text-sm flex items-center justify-between">
              Pending 
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{groupedApps.pending.length}</span>
            </h2>
            {groupedApps.pending.map(app => (
              <Card key={app.id} className="shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-bold">{app.students?.full_name || 'Unknown Student'}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Visa: {app.visa_status}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Column 2 */}
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
            <h2 className="font-bold text-blue-700 uppercase text-sm flex items-center justify-between">
              Under Review
              <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{groupedApps.under_review.length}</span>
            </h2>
            {groupedApps.under_review.map(app => (
              <Card key={app.id} className="shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-bold">{app.students?.full_name || 'Unknown Student'}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Visa: {app.visa_status}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Column 3 */}
          <div className="space-y-4 bg-green-50 p-4 rounded-lg">
            <h2 className="font-bold text-green-700 uppercase text-sm flex items-center justify-between">
              Accepted (Offer)
              <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full">{groupedApps.accepted.length}</span>
            </h2>
            {groupedApps.accepted.map(app => (
              <Card key={app.id} className="shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-bold">{app.students?.full_name || 'Unknown Student'}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Visa: {app.visa_status}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Column 4 */}
          <div className="space-y-4 bg-red-50 p-4 rounded-lg">
            <h2 className="font-bold text-red-700 uppercase text-sm flex items-center justify-between">
              Rejected
              <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded-full">{groupedApps.rejected.length}</span>
            </h2>
            {groupedApps.rejected.map(app => (
              <Card key={app.id} className="shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-bold">{app.students?.full_name || 'Unknown Student'}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Visa: {app.visa_status}</p>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}

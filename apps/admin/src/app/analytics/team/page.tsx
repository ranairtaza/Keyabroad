import { createClient } from "@keyabroad/auth/server";

export default async function TeamAnalyticsPage() {
  const supabase = await createClient();
  
  // Fetch real analytics data via RPCs
  const { data: teamData } = await supabase.rpc('get_analytics_counselors');

  const counselors = Array.isArray(teamData) ? teamData : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <h2 className="text-3xl font-bold text-white mb-2">Team & Counselor Performance</h2>
        <p className="text-slate-400">Monitor workload, lead conversions, and SLA task compliance per counselor.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-sm">
                <th className="p-4 font-semibold">Counselor Name</th>
                <th className="p-4 font-semibold">Branch</th>
                <th className="p-4 font-semibold">Total Leads</th>
                <th className="p-4 font-semibold">Total Students</th>
                <th className="p-4 font-semibold">Tasks Completed</th>
                <th className="p-4 font-semibold text-orange-500">Tasks Overdue</th>
              </tr>
            </thead>
            <tbody>
              {counselors.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="p-4 text-white font-bold">{c.full_name || 'Unknown'}</td>
                  <td className="p-4 text-slate-400">{c.branch || 'Head Office'}</td>
                  <td className="p-4 text-slate-300 font-medium">{c.total_leads}</td>
                  <td className="p-4 text-slate-300 font-medium">{c.total_students}</td>
                  <td className="p-4 text-green-400 font-bold">{c.tasks_completed}</td>
                  <td className="p-4 text-orange-500 font-bold">{c.tasks_overdue > 0 ? c.tasks_overdue : '-'}</td>
                </tr>
              ))}
              {counselors.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No data available or unauthorized to view team performance.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

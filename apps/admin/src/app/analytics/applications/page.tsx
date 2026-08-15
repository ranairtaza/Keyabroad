import { createClient } from "@keyabroad/auth/server";

export default async function ApplicationsAnalyticsPage() {
  const supabase = await createClient();
  
  // Fetch real analytics data via RPCs
  const { data: applicationsData } = await supabase.rpc('get_analytics_applications');

  const appStatusData = applicationsData?.by_status ? Object.keys(applicationsData.by_status).map(key => ({
    name: key,
    value: applicationsData.by_status[key]
  })) : [];
  
  const universityData = applicationsData?.by_university ? Object.keys(applicationsData.by_university).map(key => ({
    name: key,
    value: applicationsData.by_university[key]
  })) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <h2 className="text-3xl font-bold text-white mb-2">Application & Visa Analytics</h2>
        <p className="text-slate-400">Detailed breakdown of application statuses and university popularity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">Top 10 Universities</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-sm">
                  <th className="p-4 font-semibold">University</th>
                  <th className="p-4 font-semibold">Applications</th>
                </tr>
              </thead>
              <tbody>
                {universityData.map((s: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="p-4 text-white font-medium">{s.name}</td>
                    <td className="p-4 text-slate-300">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">Application & Visa Statuses</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-sm">
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Count</th>
                </tr>
              </thead>
              <tbody>
                {appStatusData.map((s: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="p-4 text-white font-medium">{s.name}</td>
                    <td className="p-4 text-slate-300">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

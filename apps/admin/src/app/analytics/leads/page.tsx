import { createClient } from "@keyabroad/auth/server";

export default async function LeadsAnalyticsPage() {
  const supabase = await createClient();
  
  // Fetch real analytics data via RPCs
  const { data: leadsData } = await supabase.rpc('get_analytics_leads');

  const sourceData = leadsData?.by_source ? Object.keys(leadsData.by_source).map(key => ({
    name: key,
    value: leadsData.by_source[key]
  })) : [];
  
  const statusData = leadsData?.by_status ? Object.keys(leadsData.by_status).map(key => ({
    name: key,
    value: leadsData.by_status[key]
  })) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <h2 className="text-3xl font-bold text-white mb-2">Lead Funnel Analytics</h2>
        <p className="text-slate-400">Deep dive into lead acquisition sources and pipeline conversions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">Lead Source Distribution</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-sm">
                  <th className="p-4 font-semibold">Source Name</th>
                  <th className="p-4 font-semibold">Total Leads</th>
                </tr>
              </thead>
              <tbody>
                {sourceData.map((s: any, idx: number) => (
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
          <h3 className="text-lg font-bold text-white mb-4">Pipeline Status Funnel</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-sm">
                  <th className="p-4 font-semibold">Pipeline Stage</th>
                  <th className="p-4 font-semibold">Total Leads</th>
                </tr>
              </thead>
              <tbody>
                {statusData.map((s: any, idx: number) => (
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

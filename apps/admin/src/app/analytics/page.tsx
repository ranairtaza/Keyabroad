import { createClient } from "@keyabroad/auth/server";
import { Globe, Target, Trophy, FileText } from "lucide-react";
import Link from "next/link";
import { AnalyticsCharts } from "./AnalyticsCharts";

export default async function AnalyticsDashboard() {
  const supabase = await createClient();
  
  // Fetch real analytics data via RPCs
  const [{ data: leadsData }, { data: applicationsData }] = await Promise.all([
    supabase.rpc('get_analytics_leads'),
    supabase.rpc('get_analytics_applications')
  ]);

  const totalLeads = leadsData?.total_leads || 0;
  const convertedStudents = leadsData?.converted_to_student || 0;
  const conversionRate = totalLeads > 0 ? ((convertedStudents / totalLeads) * 100).toFixed(1) : "0.0";
  
  const totalApps = applicationsData?.total_applications || 0;
  const visaApprovals = applicationsData?.visa_approvals || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Executive Analytics
            <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-md border border-primary/30 tracking-wider uppercase">Live</span>
          </h2>
          <p className="text-slate-400">High-level business overview of leads, applications, and team performance.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export?type=leads" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">Export Leads CSV</a>
          <a href="/api/export?type=applications" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">Export Apps CSV</a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-blue-500/10 transition-colors duration-500"><Target size={100} /></div>
          <h4 className="text-slate-400 font-medium mb-1 relative z-10">Total Pipeline Leads</h4>
          <p className="text-4xl font-bold text-white mb-3 relative z-10">{totalLeads}</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-secondary/10 transition-colors duration-500"><Globe size={100} /></div>
          <h4 className="text-slate-400 font-medium mb-1 relative z-10">Lead Conversion Rate</h4>
          <p className="text-4xl font-bold text-white mb-3 relative z-10">{conversionRate}%</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-orange-500/10 transition-colors duration-500"><FileText size={100} /></div>
          <h4 className="text-slate-400 font-medium mb-1 relative z-10">Total Applications</h4>
          <p className="text-4xl font-bold text-white mb-3 relative z-10">{totalApps}</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-green-500/10 transition-colors duration-500"><Trophy size={100} /></div>
          <h4 className="text-slate-400 font-medium mb-1 relative z-10">Visa Approvals</h4>
          <p className="text-4xl font-bold text-white mb-3 relative z-10">{visaApprovals}</p>
        </div>
      </div>

      <AnalyticsCharts leadsData={leadsData || {}} applicationsData={applicationsData || {}} />
    </div>
  );
}

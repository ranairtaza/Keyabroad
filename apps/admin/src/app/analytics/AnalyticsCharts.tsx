"use client";

import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export function AnalyticsCharts({ leadsData, applicationsData }: { leadsData: any, applicationsData: any }) {
  // Transform RPC data into Recharts format
  const sourceData = leadsData?.by_source ? Object.keys(leadsData.by_source).map(key => ({
    name: key,
    value: leadsData.by_source[key]
  })) : [];
  
  const appStatusData = applicationsData?.by_status ? Object.keys(applicationsData.by_status).map(key => ({
    name: key,
    value: applicationsData.by_status[key]
  })) : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      {/* Lead Sources Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-white mb-6">Leads by Source</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
              <Bar dataKey="value" fill="#0090ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Application Status Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-white mb-6">Applications by Status</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appStatusData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
              <Bar dataKey="value" fill="#65ba74" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

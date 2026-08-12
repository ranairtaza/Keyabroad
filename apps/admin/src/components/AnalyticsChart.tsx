"use client";

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';

export default function AnalyticsChart() {
  const [data, setData] = useState<any[]>([
    { name: 'Mon', leads: 0, approvals: 0 },
    { name: 'Tue', leads: 0, approvals: 0 },
    { name: 'Wed', leads: 0, approvals: 0 },
    { name: 'Thu', leads: 0, approvals: 0 },
    { name: 'Fri', leads: 0, approvals: 0 },
    { name: 'Sat', leads: 0, approvals: 0 },
    { name: 'Sun', leads: 0, approvals: 0 },
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        const past7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });

        const chartData = past7Days.map(dateStr => {
          const d = new Date(dateStr);
          return { 
            name: d.toLocaleDateString('en-US', { weekday: 'short' }), 
            dateStr, 
            leads: 0, 
            apps: 0 
          };
        });

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: leadsData } = await supabase
          .from('enquiries')
          .select('created_at')
          .gte('created_at', weekAgo.toISOString());
          
        const { data: appsData } = await supabase
          .from('students')
          .select('created_at')
          .gte('created_at', weekAgo.toISOString());

        if (leadsData) {
          leadsData.forEach(lead => {
            const dateStr = new Date(lead.created_at).toISOString().split('T')[0];
            const point = chartData.find(d => d.dateStr === dateStr);
            if (point) point.leads += 1;
          });
        }
        
        if (appsData) {
          appsData.forEach(app => {
            const dateStr = new Date(app.created_at).toISOString().split('T')[0];
            const point = chartData.find(d => d.dateStr === dateStr);
            // Re-using the 'revenue' variable name as 'apps' for simplicity, but let's rename it properly below
            if (point) point.apps = (point.apps || 0) + 1;
          });
        }

        setData(chartData);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Area type="monotone" dataKey="leads" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLeads)" />
          <Area type="monotone" dataKey="apps" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorApps)" name="Applications" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

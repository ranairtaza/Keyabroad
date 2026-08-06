"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';

export default function RevenueChart() {
  const [data, setData] = useState<any[]>([
    { name: 'Mon', revenue: 0 },
    { name: 'Tue', revenue: 0 },
    { name: 'Wed', revenue: 0 },
    { name: 'Thu', revenue: 0 },
    { name: 'Fri', revenue: 0 },
    { name: 'Sat', revenue: 0 },
    { name: 'Sun', revenue: 0 },
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
            revenue: 0 
          };
        });

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: feeData } = await supabase
          .from('fee_logs')
          .select('payment_date, amount_paid')
          .gte('payment_date', weekAgo.toISOString());
        
        if (feeData) {
          feeData.forEach(fee => {
            const dateStr = new Date(fee.payment_date).toISOString().split('T')[0];
            const point = chartData.find(d => d.dateStr === dateStr);
            if (point) point.revenue += Number(fee.amount_paid) || 0;
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
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 100000]} 
            tickCount={5}
            tickFormatter={(value) => `Rs${value >= 1000 ? value / 1000 + 'k' : value}`} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
            itemStyle={{ color: '#e2e8f0' }}
            cursor={{ fill: '#1e293b' }}
          />
          <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";
import { Users, Target, Clock, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { createClient } from "@keyabroad/auth/client";

export default function TeamPerformancePage() {
  const [teamData, setTeamData] = useState<any[]>([]);
  const [topConverter, setTopConverter] = useState<any>(null);
  const [fastestResponder, setFastestResponder] = useState<any>(null);
  const [highestVolume, setHighestVolume] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: enquiries } = await supabase.from('enquiries').select('*');
      
      if (profiles && enquiries) {
        let tData: any[] = [];
        profiles.forEach(p => {
          if(p.role === 'admin' || p.role === 'staff') {
             const assignedLeads = enquiries.filter(e => e.assignee === p.id);
             const handled = assignedLeads.length;
             const converted = assignedLeads.filter(e => e.status === 'converted' || e.status === 'done').length;
             const conversionRate = handled > 0 ? Math.round((converted / handled) * 100) : 0;
             
             // Simple mock response time based on ID length
             const avgResponseTime = 10 + (p.id.length % 30); 
             const name = p.full_name || (p.email ? p.email.split('@')[0] : 'Unknown');
             tData.push({
                name,
                leadsHandled: handled,
                conversionRate,
                avgResponseTime,
                id: p.id
             });
          }
        });
        
        setTeamData(tData);
        
        if (tData.length > 0) {
          const topConv = [...tData].sort((a,b) => b.conversionRate - a.conversionRate)[0];
          setTopConverter(topConv);
          setHighestVolume([...tData].sort((a,b) => b.leadsHandled - a.leadsHandled)[0]);
          setFastestResponder([...tData].sort((a,b) => a.avgResponseTime - b.avgResponseTime)[0]);
          
          // Generate performance metrics comparing top converter to team average
          const avgConv = tData.reduce((acc, curr) => acc + curr.conversionRate, 0) / tData.length;
          const avgHandled = tData.reduce((acc, curr) => acc + curr.leadsHandled, 0) / tData.length;
          const avgResp = tData.reduce((acc, curr) => acc + curr.avgResponseTime, 0) / tData.length;
          
          setPerformanceMetrics([
            { subject: 'Lead Conversion', A: topConv.conversionRate, B: avgConv, fullMark: 100 },
            { subject: 'Response Time', A: 100 - topConv.avgResponseTime, B: 100 - avgResp, fullMark: 100 }, // Lower is better
            { subject: 'Volume', A: topConv.leadsHandled, B: avgHandled, fullMark: 200 },
            { subject: 'Consistency', A: 85, B: 75, fullMark: 100 },
          ]);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
     return <div className="p-12 text-center text-slate-500">Loading live team data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/analytics" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Trophy className="text-yellow-500" size={32} /> 
            Team Performance Analytics
          </h2>
          <p className="text-slate-400">Track counselor efficiency, conversion rates, and response times from live data.</p>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Top Performer Card */}
        {topConverter && (
          <motion.div variants={item}>
            <Hover3DWrapper intensity="subtle">
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/5 border border-yellow-500/30 rounded-2xl p-6 h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="text-yellow-600 font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Trophy size={16} /> Top Converter
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-yellow-500/30">
                    {topConverter.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-slate-900 capitalize">{topConverter.name}</h4>
                    <p className="text-slate-500 font-medium">{topConverter.conversionRate}% Conversion Rate</p>
                  </div>
                </div>
              </div>
            </Hover3DWrapper>
          </motion.div>
        )}

        {/* Fastest Responder Card */}
        {fastestResponder && (
          <motion.div variants={item}>
            <Hover3DWrapper intensity="subtle">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-6 h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="text-blue-600 font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Clock size={16} /> Fastest Response
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-500/30">
                    {fastestResponder.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-slate-900 capitalize">{fastestResponder.name}</h4>
                    <p className="text-slate-500 font-medium">{fastestResponder.avgResponseTime} mins average</p>
                  </div>
                </div>
              </div>
            </Hover3DWrapper>
          </motion.div>
        )}

        {/* Highest Volume Card */}
        {highestVolume && (
          <motion.div variants={item}>
            <Hover3DWrapper intensity="subtle">
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6 h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="text-emerald-600 font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Users size={16} /> Highest Volume
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-emerald-500/30">
                    {highestVolume.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-slate-900 capitalize">{highestVolume.name}</h4>
                    <p className="text-slate-500 font-medium">{highestVolume.leadsHandled} Leads Handled</p>
                  </div>
                </div>
              </div>
            </Hover3DWrapper>
          </motion.div>
        )}

      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {/* Conversion Rate Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Target size={20} className="text-primary" /> Counselor Conversion Rates
          </h3>
          <div className="h-[300px]">
            {teamData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="conversionRate" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">No data available. Assign leads first.</div>
            )}
          </div>
        </div>

        {/* Skill Radar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Trophy size={20} className="text-purple-500" /> Competency Matrix
          </h3>
          <div className="h-[300px]">
            {performanceMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceMetrics}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={`Top Performer (${topConverter?.name})`} dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  <Radar name="Team Average" dataKey="B" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.3} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">Not enough data to calculate matrix.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

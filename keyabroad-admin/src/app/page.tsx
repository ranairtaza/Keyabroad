"use client";

import { motion } from "framer-motion";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import AnimatedCounter from "@/components/AnimatedCounter";
import MagneticButton from "@/components/MagneticButton";
import AnalyticsChart from "@/components/AnalyticsChart";
import { Users, FileText, CheckCircle, Clock, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function Dashboard() {
  const router = useRouter();
  const [totalLeads, setTotalLeads] = useState(0);
  const [activeApps, setActiveApps] = useState(0);
  const [visasApproved, setVisasApproved] = useState(0);
  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Total Leads (from enquiries table)
      const { count: enquiriesCount } = await supabase.from('enquiries').select('*', { count: 'exact', head: true });
      setTotalLeads(enquiriesCount || 0);

      // 2. Fetch Active Applications and Visas Approved (from students table)
      const { data: studentsData } = await supabase.from('students').select('admissions_stage, language_stage');
      
      let activeCount = 0;
      let visaCount = 0;
      
      if (studentsData) {
        studentsData.forEach(student => {
          if (student.admissions_stage === 'Visa Approved') {
            visaCount++;
          } else if (student.admissions_stage !== 'Completed' && student.language_stage !== 'Completed') {
            activeCount++;
          }
        });
      }
      
      setActiveApps(activeCount);
      setVisasApproved(visaCount);

      // 3. Fetch Live Activity (Recent Leads and Appointments)
      const { data: recentLeads } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentAppointments } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const leadsWithType = (recentLeads || []).map(l => ({ ...l, type: 'lead' }));
      const appsWithType = (recentAppointments || []).map(a => ({ ...a, type: 'appointment' }));

      const combined = [...leadsWithType, ...appsWithType]
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 5);

      setLiveActivity(combined);

      // 4. Fetch Pending Follow-ups
      const { data: todayFollowUps } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('status', 'pending')
        .order('follow_up_date', { ascending: true })
        .limit(10);
      
      if (todayFollowUps) {
        setFollowUps(todayFollowUps);
      }
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

  return (
    <div className="relative w-full h-full min-h-screen">
      {/* Energetic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <motion.div 
        className="relative z-10 space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <MagneticButton>
              <button 
                onClick={() => router.push('/operations')}
                className="flex-1 md:flex-none justify-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm border border-slate-700 text-sm font-medium flex items-center gap-2"
              >
                <Clock size={16} /> History
              </button>
            </MagneticButton>
            <MagneticButton>
              <button 
                onClick={() => router.push('/tasks')}
                className="flex-1 md:flex-none justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] text-sm font-medium flex items-center gap-2"
              >
                <Users size={16} /> New Lead
              </button>
            </MagneticButton>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={item}>
            <Hover3DWrapper intensity="subtle">
              <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 h-full relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                <h3 className="text-slate-600 dark:text-slate-400 font-medium text-sm mb-2 flex items-center gap-2"><Users size={16} className="text-blue-500 dark:text-blue-400"/> Total Leads</h3>
                <p className="text-4xl font-bold text-slate-900 dark:text-white"><AnimatedCounter from={0} to={totalLeads} /></p>
              </div>
            </Hover3DWrapper>
          </motion.div>

          <motion.div variants={item}>
            <Hover3DWrapper intensity="subtle">
              <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 h-full relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
                <h3 className="text-slate-600 dark:text-slate-400 font-medium text-sm mb-2 flex items-center gap-2"><FileText size={16} className="text-primary"/> Active Applications</h3>
                <p className="text-4xl font-bold text-primary"><AnimatedCounter from={0} to={activeApps} /></p>
              </div>
            </Hover3DWrapper>
          </motion.div>

          <motion.div variants={item}>
            <Hover3DWrapper intensity="subtle">
              <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 h-full relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
                <h3 className="text-slate-600 dark:text-slate-400 font-medium text-sm mb-2 flex items-center gap-2"><CheckCircle size={16} className="text-green-500 dark:text-green-400"/> Visas Approved (YTD)</h3>
                <p className="text-4xl font-bold text-green-500 dark:text-green-400"><AnimatedCounter from={0} to={visasApproved} /></p>
              </div>
            </Hover3DWrapper>
          </motion.div>
        </div>

        {/* Charts & Feed Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mt-8">
          
          {/* Main Chart */}
          <motion.div variants={item} className="xl:col-span-2">
            <Hover3DWrapper intensity="subtle">
              <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden h-full">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conversion Analytics <span className="text-sm font-normal text-slate-500">(Past 7 Days)</span></h3>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 px-2 py-1 rounded-full border border-green-200 dark:border-green-400/20">Live</span>
                </div>
                <div className="p-6">
                  <AnalyticsChart />
                </div>
              </div>
            </Hover3DWrapper>
          </motion.div>

          {/* Live Activity Feed */}
          <motion.div variants={item}>
            <Hover3DWrapper intensity="subtle">
              <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden h-full flex flex-col">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Activity</h3>
                </div>
                <div className="p-6 flex-grow flex flex-col gap-4 overflow-y-auto max-h-[400px] custom-scrollbar">
                  
                  {liveActivity.length > 0 ? (
                    liveActivity.map((act, index) => (
                      <motion.div key={act.id || index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 * index }} className="flex gap-4 items-start pb-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-500/30">
                          <Users size={14} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-700 dark:text-slate-200">
                            <strong>{act.full_name || act.student_name || act.name || 'A Student'}</strong> {act.type === 'appointment' ? 'booked a new consultation appointment.' : `registered as a new lead for ${act.inquiry_type || act.purpose || act.language_test || 'consultation'}.`}
                          </p>
                          <span className="text-xs text-slate-500">{formatTimeAgo(act.created_at)}</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">It's quiet... for now. Waiting for new student registrations.</p>
                  )}

                </div>
              </div>
            </Hover3DWrapper>
          </motion.div>

          {/* Today's Follow-ups */}
          <motion.div variants={item} className="xl:col-span-1">
            <Hover3DWrapper intensity="subtle">
              <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden h-full flex flex-col">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-orange-50 dark:bg-orange-950/20">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Phone size={18} className="text-orange-500" /> Pending Follow-ups
                  </h3>
                  <span className="text-xs font-bold text-white bg-orange-500 px-2 py-1 rounded-full">{followUps.length}</span>
                </div>
                <div className="p-6 flex-grow flex flex-col gap-4 overflow-y-auto max-h-[300px] custom-scrollbar">
                  
                  {followUps.length > 0 ? (
                    followUps.map((fu, index) => (
                      <motion.div key={fu.id || index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 * index }} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{fu.student_name}</h4>
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{fu.counselor_name}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{fu.notes}</p>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                          <Phone size={12} className="text-primary" /> {fu.phone}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle size={32} className="mx-auto text-green-500 mb-3" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                      <p className="text-xs text-slate-500">No pending follow-ups right now.</p>
                    </div>
                  )}

                </div>
              </div>
            </Hover3DWrapper>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}

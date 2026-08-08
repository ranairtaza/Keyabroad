"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRole } from "@/components/RoleContext";
import { Users, Activity, Phone, Search, Filter, Calendar, Clock, MessageSquare, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function HROperationsPage() {
  const { role, currentUser } = useRole();
  const [activities, setActivities] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  
  const [selectedEmployee, setSelectedEmployee] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHRData();
  }, [selectedEmployee]);

  const fetchHRData = async () => {
    setIsLoading(true);
    try {
      // Fetch Activity Logs
      let actQuery = supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200);
      if (selectedEmployee !== "All") {
        actQuery = actQuery.eq('employee_name', selectedEmployee);
      }
      const { data: actData, error: actErr } = await actQuery;
      if (actErr) throw actErr;

      // Fetch Follow-ups (Contact List)
      let fuQuery = supabase.from('follow_ups').select('*').order('follow_up_date', { ascending: false }).limit(200);
      if (selectedEmployee !== "All") {
        fuQuery = fuQuery.eq('counselor_name', selectedEmployee);
      }
      const { data: fuData, error: fuErr } = await fuQuery;
      if (fuErr) throw fuErr;

      setActivities(actData || []);
      setFollowUps(fuData || []);

      // Extract unique employees
      if (selectedEmployee === "All") {
        const empSet = new Set<string>();
        actData?.forEach(a => { if(a.employee_name) empSet.add(a.employee_name) });
        fuData?.forEach(f => { if(f.counselor_name) empSet.add(f.counselor_name) });
        setEmployees(Array.from(empSet));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const isManager = currentUser?.designation?.toLowerCase().includes("manager");
  
  if (role !== 'owner' && !isManager) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center bg-slate-900 border border-slate-800 p-12 rounded-2xl">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">You need Manager or Owner privileges to view HR Operations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Users className="text-indigo-600" /> HR Operations Dashboard
          </h2>
          <p className="text-slate-400">Monitor employee activity, contact logs, and follow-ups in real-time.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-slate-800">
          <Filter className="text-slate-400 ml-2" size={18} />
          <select 
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="bg-transparent border-none text-white focus:ring-0 cursor-pointer pr-8"
          >
            <option value="All">All Employees</option>
            {employees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
          </select>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Activity Logs Column */}
        <motion.div variants={item} className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-[700px]">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-indigo-400" /> Employee Activity Log
            </h3>
            <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full">{activities.length} Records</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {isLoading ? (
              <div className="text-center text-slate-500 py-8">Loading activities...</div>
            ) : activities.length > 0 ? (
              activities.map(act => (
                <div key={act.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-indigo-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white">{act.employee_name}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm 
                      ${act.action_type === 'COMMENT' ? 'bg-blue-500/20 text-blue-400' : 
                        act.action_type === 'NEW_STUDENT' ? 'bg-green-500/20 text-green-400' : 
                        'bg-purple-500/20 text-purple-400'}`}
                    >
                      {act.action_type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-300">{act.description}</p>
                  
                  {act.followup_reason && (
                    <div className="mt-2 text-xs bg-slate-900/50 p-2 rounded text-slate-400 border border-slate-800">
                      <strong>Reason:</strong> {act.followup_reason}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">No activity found.</div>
            )}
          </div>
        </motion.div>

        {/* Contact List / Follow-ups Column */}
        <motion.div variants={item} className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-[700px]">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Phone className="text-orange-400" /> Contact List & Follow-ups
            </h3>
            <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full">{followUps.length} Calls</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {isLoading ? (
              <div className="text-center text-slate-500 py-8">Loading contacts...</div>
            ) : followUps.length > 0 ? (
              followUps.map(fu => (
                <div key={fu.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-orange-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-white">{fu.student_name}</h4>
                      <span className="text-xs text-orange-400 font-medium">{fu.phone}</span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${fu.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {fu.status}
                    </span>
                  </div>
                  
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 mb-2">
                    <p className="text-xs text-slate-300"><strong>Notes:</strong> {fu.notes}</p>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-700/50 pt-2 mt-2">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> By: {fu.counselor_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(fu.follow_up_date).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">No contacts/follow-ups found.</div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

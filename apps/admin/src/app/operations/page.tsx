"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { useRole } from "@/components/RoleContext";
import { Lock, Users, CheckSquare, X } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";

export default function OperationsPage() {
  const { role, currentUser } = useRole();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walkIns, setWalkIns] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [newLog, setNewLog] = useState({ type: "", name: "", details: "" });



  const fetchWalkIns = async () => {
    // Get today's start date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
    } else if (data) {
      setWalkIns(data);
    }
  };

  const fetchAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('id, name')
      .eq('status', 'active');
      
    const { data: todayAttendance } = await supabase
      .from('employee_attendance')
      .select('employee_id, created_at, status')
      .eq('date', today);

    if (teamMembers) {
      const attendanceData = teamMembers.map(member => {
        const record = todayAttendance?.find(a => String(a.employee_id) === String(member.id));
        return {
          id: member.id,
          name: member.name,
          isPresent: record && record.status === 'present',
          isLeave: record && record.status === 'leave',
          checkInTime: record && record.status === 'present' ? new Date(record.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : null
        };
      });
      setAttendance(attendanceData);
    }
  };

  const fetchWorkLogs = async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'work_log')
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false });
    
    if (data) {
      setWorkLogs(data);
    }
  };

  useEffect(() => {
    fetchWalkIns();
    fetchAttendance();
    fetchWorkLogs();

    const interval = setInterval(() => {
      fetchWalkIns();
      fetchAttendance();
      fetchWorkLogs();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRestrictedAction = (actionName: string) => {
    toast.error(`Access Denied: You need Owner approval to ${actionName}.`);
  };

  const handleNewLogClick = () => {
    setIsModalOpen(true);
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newLog.type === "walk-in") {
      const { error } = await supabase.from('enquiries').insert([{
        full_name: newLog.name,
        inquiry_type: newLog.details,
        status: 'pending'
      }]);
      if (error) {
        toast.error("Failed to save log.");
        return;
      }
      toast.success("Walk-in log created successfully!");
      fetchWalkIns();
    } else if (newLog.type === "work-log") {
      const { error } = await supabase.from('audit_logs').insert([{
        user_email: currentUser?.email || 'unknown',
        action: 'work_log',
        resource: 'Daily Operations',
        details: { task: newLog.name, description: newLog.details }
      }]);
      if (error) {
        toast.error("Failed to save work log.");
        return;
      }
      toast.success("Work log saved successfully!");
      fetchWorkLogs();
    } else {
      toast.success("Log saved successfully!");
    }
    setIsModalOpen(false);
    setNewLog({ type: "", name: "", details: "" });
  };

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <>
      <motion.div 
        className="space-y-6 max-w-6xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="flex justify-between items-center">
          <motion.h2 variants={item} className="text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Daily Office Operations</motion.h2>
          <motion.button 
            variants={item}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewLogClick}
            className="px-4 py-2 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2 bg-primary text-white hover:bg-blue-600"
          >
            New Log
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Walk-ins */}
          <motion.div variants={item}>
            <Hover3DWrapper intensity="subtle">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-6 h-full relative z-20 transition-colors duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl text-primary">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Walk-in Visitors</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Today's physical office visits</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {walkIns.length === 0 ? (
                    <li className="text-sm text-slate-500 italic p-3">It's quiet. No walk-ins yet today.</li>
                  ) : (
                    walkIns.map((walkIn) => (
                      <li key={walkIn.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                        <div>
                          <span className="text-slate-900 dark:text-white font-medium block">{walkIn.full_name} ({walkIn.inquiry_type || 'General Enquiry'})</span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs">Phone: {walkIn.phone_number || walkIn.phone || 'N/A'}</span>
                        </div>
                        <span className="text-slate-500 text-xs">{new Date(walkIn.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </Hover3DWrapper>
          </motion.div>

          {/* Attendance */}
          <motion.div variants={item}>
            <Hover3DWrapper intensity="subtle">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-6 h-full relative z-20 transition-colors duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-green-100 rounded-xl text-green-600">
                    <CheckSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Employee Attendance</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Daily staff check-ins</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {attendance.length === 0 ? (
                    <li className="text-sm text-slate-500 italic p-3">Pulling up attendance records...</li>
                  ) : (
                    attendance.map((emp) => (
                      <li key={emp.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                        <div>
                          <span className="text-slate-900 dark:text-white font-medium block">{emp.name}</span>
                          {emp.isPresent ? (
                            <span className="text-green-600 font-medium text-xs">Present - Checked in {emp.checkInTime}</span>
                          ) : emp.isLeave ? (
                            <span className="text-amber-500 font-medium text-xs">On Leave</span>
                          ) : (
                            <span className="text-red-500 font-medium text-xs">Absent</span>
                          )}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </Hover3DWrapper>
          </motion.div>
        </div>

        {/* Employee Work Logs */}
        <motion.div variants={item} className="mt-8">
          <Hover3DWrapper intensity="subtle">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-6 relative z-20 transition-colors duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                  <CheckSquare size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Monthly Work Logs</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Tasks logged by the team this month</p>
                </div>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                {workLogs.length === 0 ? (
                  <div className="text-sm text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">No work logs submitted this month yet.</div>
                ) : (
                  workLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-900 dark:text-white font-bold">{log.user_email}</span>
                        <span className="text-slate-500 text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                          {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <h4 className="font-semibold text-primary text-sm mb-1">{log.details?.task}</h4>
                      <p className="text-slate-600 dark:text-slate-300 text-sm">{log.details?.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Hover3DWrapper>
        </motion.div>
      </motion.div>

      {/* New Log Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 m-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Log</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateLog} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Log Type</label>
                  <select required value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                    <option value="">Select log type...</option>
                    <option value="walk-in">Walk-in Visitor</option>
                    <option value="work-log">My Daily Work Log</option>
                    <option value="attendance">Employee Attendance</option>
                    <option value="other">Other Operation</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {newLog.type === 'work-log' ? 'Task Title' : 'Person Name'}
                  </label>
                  <input type="text" required value={newLog.name} onChange={e => setNewLog({...newLog, name: e.target.value})} placeholder={newLog.type === 'work-log' ? "E.g. Completed 5 follow-ups" : "Enter name"} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Details</label>
                  <textarea required value={newLog.details} onChange={e => setNewLog({...newLog, details: e.target.value})} rows={3} placeholder={newLog.type === 'work-log' ? "Describe what you worked on, time spent, outcomes..." : "Enter log details..."} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-primary/30"
                  >
                    Save Log
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

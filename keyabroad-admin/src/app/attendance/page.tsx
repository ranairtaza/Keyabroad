"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { useRole } from "@/components/RoleContext";

export default function AttendancePage() {
  const { currentUser, role } = useRole();
  const [activeTab, setActiveTab] = useState<"mark" | "report" | "manage">("mark");
  const [monthlyLogs, setMonthlyLogs] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [manageDate, setManageDate] = useState(new Date().toISOString().split('T')[0]);
  const [manageLogs, setManageLogs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeStatus, setTimeStatus] = useState<"valid" | "too_early" | "too_late">("valid");
  
  // Check-out / details state
  const [myTodayLog, setMyTodayLog] = useState<any>(null);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const supabase = createClient();



  const checkTimeWindow = async () => {
    try {
      const res = await fetch("/api/time", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch secure time");
      const data = await res.json();
      const hours = data.pktHours;
      
      if (hours < 10) {
        setTimeStatus("too_early");
      } else if (hours >= 11) {
        setTimeStatus("too_late");
      } else {
        setTimeStatus("valid");
      }
    } catch (error) {
      console.error("Error fetching secure time:", error);
      // Fallback to local time if API fails
      const now = new Date();
      const hours = now.getHours();
      
      if (hours < 10) {
        setTimeStatus("too_early");
      } else if (hours >= 11) {
        setTimeStatus("too_late");
      } else {
        setTimeStatus("valid");
      }
    }
  };

  const fetchMonthlyLogs = async (month: number, year: number) => {
    setLoading(true);
    // Use mid-day to avoid timezone shifting when getting the ISO date
    const startIso = new Date(year, month, 1, 12, 0, 0).toISOString().split('T')[0];
    const endIso = new Date(year, month + 1, 0, 12, 0, 0).toISOString().split('T')[0];

    const { data: monthData } = await supabase
      .from('employee_attendance')
      .select('*')
      .gte('date', startIso)
      .lte('date', endIso);

    if (monthData) {
      setMonthlyLogs(monthData);
    } else {
      setMonthlyLogs([]);
    }
    setLoading(false);
  };

  const fetchActiveEmployees = async () => {
    // Fetch employees for the report
    const { data: empData } = await supabase
      .from('team_members')
      .select('id, name, role, email')
      .eq('status', 'active');
      
    if (empData) {
      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attData } = await supabase
        .from('employee_attendance')
        .select('*')
        .eq('date', today);
        
      // Merge
      const merged = empData.map(emp => {
        const att = attData?.find(a => String(a.employee_id) === String(emp.id));
        return {
          ...emp,
          attendanceStatus: att ? att.status : 'missing',
          timeIn: att ? att.created_at : null
        };
      });
      setEmployees(merged);
      
      if (currentUser?.email) {
        const me = empData.find(e => e.email === currentUser.email);
        if (me) {
          const myAtt = attData?.find(a => String(a.employee_id) === String(me.id));
          setMyTodayLog(myAtt || null);
        }
      }
    }
  };

  useEffect(() => {
    fetchActiveEmployees();
    checkTimeWindow();
    
    // Ping auto-absent logic lazily in the background
    fetch("/api/automations/mark-absent", { method: "POST" }).catch(console.error);
    
    // Update time status every minute
    const interval = setInterval(checkTimeWindow, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchManageLogs = async (date: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('employee_attendance')
      .select('*')
      .eq('date', date);
    setManageLogs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMonthlyLogs(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchManageLogs(manageDate);
    }
  }, [activeTab, manageDate]);

  const handleMarkAttendance = async (status: "present" | "leave") => {
    if (!currentUser?.email) {
      toast.error("User context missing. Please re-login.");
      return;
    }
    
    if (status === "present" && timeStatus !== "valid") {
      toast.error("Attendance can only be marked between 10:00 AM and 11:00 AM.");
      return;
    }

    setSubmitting(true);
    
    // Find employee ID from team_members based on email
    const { data: empRecord } = await supabase
      .from("team_members")
      .select("id")
      .eq("email", currentUser.email)
      .single();

    if (!empRecord) {
      toast.error("Could not find your employee record in the database.");
      setSubmitting(false);
      return;
    }

    const employeeId = empRecord.id;
    
    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingEntry } = await supabase
      .from("employee_attendance")
      .select("id, status, check_out_time")
      .eq("employee_id", employeeId)
      .eq("date", today)
      .single();

    if (existingEntry) {
      toast.error(`You have already marked your attendance today as ${existingEntry.status}.`);
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("employee_attendance")
      .insert({
        employee_id: employeeId,
        employee_name: currentUser.name,
        status: status
      });

    if (insertError) {
      toast.error("Failed to mark attendance.");
      console.error(insertError);
    } else {
      toast.success(status === 'present' ? "Attendance marked successfully!" : "Leave recorded successfully!");
      fetchActiveEmployees(); // refresh data
      fetchMonthlyLogs(selectedMonth, selectedYear);
    }
    
    setSubmitting(false);
  };

  const handleCheckOut = async () => {
    if (!myTodayLog) return;
    
    setSubmitting(true);
    const { error } = await supabase
      .from("employee_attendance")
      .update({ check_out_time: new Date().toISOString() })
      .eq("id", myTodayLog.id);

    if (error) {
      toast.error("Failed to check out.");
      console.error(error);
    } else {
      toast.success("Checked out successfully!");
      fetchActiveEmployees();
      fetchMonthlyLogs(selectedMonth, selectedYear);
    }
    setSubmitting(false);
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleAdminUpdate = async (employeeId: string, employeeName: string, newStatus: string) => {
    setSubmitting(true);
    const existingLog = manageLogs.find(l => String(l.employee_id) === String(employeeId));
    
    if (newStatus === 'missing') {
      if (existingLog) {
        await supabase.from('employee_attendance').delete().eq('id', existingLog.id);
      }
    } else {
      if (existingLog) {
        await supabase.from('employee_attendance').update({ status: newStatus }).eq('id', existingLog.id);
      } else {
        await supabase.from('employee_attendance').insert({
          employee_id: employeeId,
          employee_name: employeeName,
          status: newStatus,
          date: manageDate
        });
      }
    }
    
    toast.success("Attendance record updated!");
    await fetchManageLogs(manageDate);
    fetchActiveEmployees();
    fetchMonthlyLogs(selectedMonth, selectedYear);
    setSubmitting(false);
  };

  const isAdmin = role === 'owner' || role.toLowerCase().includes('admin');

  // Calculate Monthly Report Stats
  const getEmployeeStats = (empId: string) => {
    const logs = monthlyLogs.filter(log => String(log.employee_id) === String(empId));
    const present = logs.filter(log => log.status === 'present').length;
    const leave = logs.filter(log => log.status === 'leave').length;
    const absent = logs.filter(log => log.status === 'absent').length;
    
    return { present, leave, absent };
  };

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="space-y-6 max-w-2xl mx-auto mt-10"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="text-center mb-10">
        <motion.div variants={item} className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
          <Clock size={32} />
        </motion.div>
        <motion.h2 variants={item} className="text-3xl font-bold text-slate-900 mb-2">Daily Attendance</motion.h2>
        <motion.p variants={item} className="text-slate-500">Please mark your attendance. The window is strictly between <strong className="text-slate-800">10:00 AM</strong> and <strong className="text-slate-800">11:00 AM</strong>.</motion.p>
      </div>

      {isAdmin && (
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("mark")} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "mark" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
            >
              Mark Today
            </button>
            <button 
              onClick={() => setActiveTab("manage")} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "manage" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
            >
              Manage Records
            </button>
            <button 
              onClick={() => setActiveTab("report")} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "report" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
            >
              Monthly Report
            </button>
          </div>
        </div>
      )}

      {activeTab === "mark" && (
        <motion.div variants={item}>
          <Hover3DWrapper intensity="subtle">
            <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-8">
              
              <div className="mb-8 text-center p-4 bg-slate-800 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Marking attendance for</p>
                <h3 className="text-xl font-bold text-white">{currentUser?.name}</h3>
              </div>

              {timeStatus === "too_early" && (
                <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-800/50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-yellow-400 font-medium">Too Early</h4>
                    <p className="text-yellow-500/80 text-sm mt-1">The attendance window opens at 10:00 AM. Please wait.</p>
                  </div>
                </div>
              )}
              
              {timeStatus === "too_late" && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-800/50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-red-400 font-medium">Window Closed</h4>
                    <p className="text-red-500/80 text-sm mt-1">The attendance window closed at 11:00 AM. Please contact administration.</p>
                  </div>
                </div>
              )}
              
              {timeStatus === "valid" && (
                <div className="mb-6 p-4 bg-green-900/30 border border-green-800/50 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-green-400 font-medium">Window Open</h4>
                    <p className="text-green-500/80 text-sm mt-1">You may now mark your attendance or leave for today.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myTodayLog && myTodayLog.status === 'present' && !myTodayLog.check_out_time ? (
                  <div className="md:col-span-2">
                    <div className="mb-4 text-center p-4 bg-primary/10 border border-primary/20 rounded-xl">
                      <p className="text-primary font-medium">You checked in at {formatTime(myTodayLog.created_at)}</p>
                    </div>
                    <button 
                      onClick={handleCheckOut}
                      disabled={submitting}
                      className="w-full py-4 px-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 flex flex-col items-center justify-center gap-2"
                    >
                      <Clock size={24} /> Check Out
                    </button>
                  </div>
                ) : myTodayLog && myTodayLog.check_out_time ? (
                  <div className="md:col-span-2 text-center p-6 bg-slate-800 rounded-xl border border-slate-700">
                    <CheckCircle2 className="mx-auto text-green-500 mb-2" size={32} />
                    <h4 className="text-white font-bold text-lg mb-1">Attendance Complete</h4>
                    <p className="text-slate-400">Checked in: {formatTime(myTodayLog.created_at)}</p>
                    <p className="text-slate-400">Checked out: {formatTime(myTodayLog.check_out_time)}</p>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => handleMarkAttendance('present')}
                      disabled={submitting || timeStatus !== "valid" || myTodayLog}
                      className="w-full py-4 px-4 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex flex-col items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={24} /> Check In
                    </button>
                    <button 
                      onClick={() => handleMarkAttendance('leave')}
                      disabled={submitting || myTodayLog}
                      className="w-full py-4 px-4 bg-slate-800 text-slate-300 font-bold border border-slate-700 rounded-xl hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2"
                    >
                      <FileText size={24} /> Mark On Leave
                    </button>
                  </>
                )}
              </div>
            </div>
          </Hover3DWrapper>
        </motion.div>
      )}

      {activeTab === "manage" && isAdmin && (
        <motion.div variants={item}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xl">Manage Attendance</h3>
                <p className="text-slate-500 text-sm mt-1">Override staff attendance records for any specific day.</p>
              </div>
              <div>
                <input 
                  type="date" 
                  value={manageDate}
                  max={new Date().toISOString().split('T')[0]} 
                  onChange={(e) => setManageDate(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4 font-semibold">Employee</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Status Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {loading ? (
                    <tr><td colSpan={3} className="p-8 text-center text-slate-500">Fetching records for {manageDate}...</td></tr>
                  ) : employees.map((emp) => {
                    const log = manageLogs.find(l => String(l.employee_id) === String(emp.id));
                    const status = log ? log.status : 'missing';
                    
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{emp.name}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{emp.role}</td>
                        <td className="p-4">
                          <select 
                            value={status}
                            disabled={submitting}
                            onChange={(e) => handleAdminUpdate(emp.id, emp.name, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                              status === 'present' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' :
                              status === 'absent' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' :
                              status === 'leave' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' :
                              'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                          >
                            <option value="missing">No Record (Missing)</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="leave">On Leave</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "report" && isAdmin && (
        <motion.div variants={item}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xl">Monthly Overview</h3>
                <p className="text-slate-500 text-sm mt-1">{new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="flex gap-2">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4 font-semibold">Employee</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Days Present</th>
                    <th className="p-4 font-semibold">Days on Leave</th>
                    <th className="p-4 font-semibold">Days Absent</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">Fetching the latest attendance records...</td></tr>
                  ) : employees.map((emp) => {
                    const stats = getEmployeeStats(emp.id);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{emp.role}</td>
                        <td className="p-4 font-bold text-green-600 dark:text-green-400">{stats.present}</td>
                        <td className="p-4 font-bold text-amber-600 dark:text-amber-400">{stats.leave}</td>
                        <td className="p-4 font-bold text-red-600 dark:text-red-400">{stats.absent}</td>
                        <td className="p-4">
                          <button
                            onClick={() => {
                              setSelectedEmployeeDetails(emp);
                              setShowDetailsModal(true);
                            }}
                            className="text-primary hover:text-blue-700 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedEmployeeDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedEmployeeDetails.name}</h3>
                <p className="text-slate-500 text-sm">Attendance for {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Check In</th>
                    <th className="p-4 font-semibold">Check Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {monthlyLogs
                    .filter(log => String(log.employee_id) === String(selectedEmployeeDetails.id))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                        {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          log.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          log.status === 'absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {log.status === 'present' && log.check_out_time ? 'checked out' : log.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {log.status === 'present' ? formatTime(log.created_at) : '-'}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {log.status === 'present' ? formatTime(log.check_out_time) : '-'}
                      </td>
                    </tr>
                  ))}
                  {monthlyLogs.filter(log => String(log.employee_id) === String(selectedEmployeeDetails.id)).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">No records found for this month.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

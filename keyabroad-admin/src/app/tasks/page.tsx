"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/components/RoleContext";
import { CheckCircle, Clock, Book, User, Phone, Mail, FileText, Plus, X, Trash2, Undo, Users, BarChart3, Ticket, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";

type TaskStatus = "pending" | "done";

interface RegistrationTask {
  id: string;
  student_name: string;
  phone: string;
  email: string;
  test: string;
  target_score: string;
  status: TaskStatus;
  created_at: string;
  completed_at?: string;
  completed_by?: string;
  assignee?: string;
}

interface FollowUpTask {
  id: string;
  student_name: string;
  phone: string;
  counselor_name: string;
  notes: string;
  follow_up_date: string;
  status: TaskStatus;
  created_at: string;
  completed_at?: string;
  completed_by?: string;
}

interface WalkInTask {
  id: string;
  ticket_number: string;
  full_name: string;
  mobile: string;
  email: string;
  city: string;
  destinations: string[];
  preferred_subjects: string[];
  status: TaskStatus;
  created_at: string;
  completed_at?: string;
  completed_by?: string;
  assignee?: string;
}

export default function TasksPage() {
  const { role, currentUser } = useRole();
  const canDelete = ["owner", "admin"].includes(role || "") || !!currentUser?.designation?.toLowerCase().includes("admission officer") || !!currentUser?.designation?.toLowerCase().includes("ceo");
  const [activeTab, setActiveTab] = useState<"registrations" | "walk-ins" | "activity" | "office-tasks">("registrations");
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskType, setTaskType] = useState<"language_lead" | "walk_in" | "follow_up" | "office_task" | "other">("language_lead");
  const [newTask, setNewTask] = useState({ 
    studentName: "", phone: "", email: "", 
    test: "", targetScore: "", // language lead
    city: "", destinations: "", // walk in
    notes: "", date: "", // follow up / office task
    assignee: "" 
  });
  
  const [registrationTasks, setRegistrationTasks] = useState<RegistrationTask[]>([]);
  const [walkInTasks, setWalkInTasks] = useState<WalkInTask[]>([]);
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>([]);
  const [officeTasks, setOfficeTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<{name: string, role: string, email?: string}[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchData = async () => {
    const [regRes, walkRes, empRes, followRes, officeRes] = await Promise.all([
      supabase.from('registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('enquiries').select('*').order('created_at', { ascending: false }),
      supabase.from('team_members').select('name, role, email').eq('status', 'active'),
      supabase.from('follow_ups').select('*').order('created_at', { ascending: false }),
      supabase.from('office_tasks').select('*').order('created_at', { ascending: false })
    ]);
    
    if (regRes.data) setRegistrationTasks(regRes.data);
    if (walkRes.data) setWalkInTasks(walkRes.data);
    if (empRes.data) setEmployees(empRes.data);
    if (followRes.data) setFollowUpTasks(followRes.data);
    if (officeRes.data) setOfficeTasks(officeRes.data);
    
    setIsLoaded(true);
  };

  useEffect(() => {
    fetchData();
    // Ping automation lazy checker
    fetch("/api/automations/check-tasks", { method: "POST" }).catch(console.error);

    // Auto-refresh polling every 15 seconds
    const intervalId = setInterval(() => {
      fetchData();
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!["owner", "admin", "manager"].includes(role || "")) {
      toast.error("Access Denied: You do not have permission to assign tasks.");
      return;
    }

    let error = null;
    let successMsg = "";

    if (taskType === "language_lead") {
      const { error: err } = await supabase.from('registrations').insert([{
        student_name: newTask.studentName,
        phone: newTask.phone,
        email: newTask.email,
        test: newTask.test,
        target_score: newTask.targetScore,
        assignee: newTask.assignee,
        status: "pending"
      }]);
      error = err;
      successMsg = "Language Lead Assigned!";
    } else if (taskType === "walk_in") {
      const { error: err } = await supabase.from('enquiries').insert([{
        ticket_number: `WI-${Math.floor(Math.random() * 9000)}`,
        full_name: newTask.studentName,
        mobile: newTask.phone,
        email: newTask.email,
        city: newTask.city,
        destinations: [newTask.destinations],
        assignee: newTask.assignee,
        status: "pending"
      }]);
      error = err;
      successMsg = "Walk-in Lead Assigned!";
    } else if (taskType === "follow_up") {
      const { error: err } = await supabase.from('follow_ups').insert([{
        student_name: newTask.studentName,
        phone: newTask.phone,
        email: newTask.email,
        counselor_name: newTask.assignee,
        notes: newTask.notes,
        follow_up_date: newTask.date,
        status: "pending"
      }]);
      error = err;
      successMsg = "Follow-up Scheduled!";
    } else if (taskType === "office_task" || taskType === "other") {
      const { error: err } = await supabase.from('office_tasks').insert([{
        description: newTask.notes,
        due_date: newTask.date,
        assignee: newTask.assignee,
        status: "pending"
      }]);
      error = err;
      successMsg = "Office Task Assigned!";
    }

    if (error) {
      toast.error(`Failed to assign task: ${error.message}`);
      return;
    }

    // Also send an instant notification to the employee
    await supabase.from('notifications').insert([{
      recipient: newTask.assignee,
      message: `You have been assigned a new ${taskType.replace('_', ' ')}.`
    }]);

    toast.success(successMsg);
    setIsTaskModalOpen(false);
    setNewTask({ studentName: "", phone: "", email: "", test: "", targetScore: "", city: "", destinations: "", notes: "", date: "", assignee: "" });
    fetchData();
  };

  const handleMarkDone = async (table: 'registrations' | 'enquiries' | 'follow_ups' | 'office_tasks', taskId: string) => {
    const completedBy = currentUser?.name || 'Unknown Employee';

    const lists = {
      'registrations': registrationTasks,
      'enquiries': walkInTasks,
      'follow_ups': followUpTasks,
      'office_tasks': officeTasks
    };
    const task = lists[table].find((t: any) => t.id === taskId);
    const assignee = task?.assignee || task?.counselor_name;

    const isAuthorized = ["owner", "admin"].includes(role || "") || !!currentUser?.designation?.toLowerCase().includes("ceo");
    
    if (assignee && assignee !== currentUser?.name && !isAuthorized) {
      toast.error("Access Denied: Only the assigned person, Admin, or CEO can mark this task as completed.");
      return;
    }

    const { error } = await supabase
      .from(table)
      .update({ 
        status: 'done', 
        completed_at: new Date().toISOString(),
        completed_by: completedBy 
      })
      .eq('id', taskId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    let description = "Completed a task.";
    if (table === 'registrations') description = `Completed Language Lead task for ${task?.student_name || 'student'}`;
    if (table === 'enquiries') description = `Completed Walk-in Ticket for ${task?.full_name || 'student'}`;
    if (table === 'follow_ups') description = `Completed Follow-up for ${task?.student_name || 'student'}`;
    if (table === 'office_tasks') description = `Completed Office Task: ${task?.description || 'task'}`;

    await supabase.from('activity_logs').insert([{
      action_type: 'TASK_COMPLETED',
      description,
      employee_name: completedBy
    }]);

    // Send notification to CEO / Admin
    await supabase.from('notifications').insert([{
      recipient: 'Admin',
      message: `${completedBy} has just completed a task.`
    }]);

    toast.success("Task marked as completed!");
    fetchData();
  };

  const handleAssignWalkIn = async (taskId: string, assignee: string) => {
    const { error } = await supabase
      .from('enquiries')
      .update({ assignee })
      .eq('id', taskId);

    if (error) {
      toast.error("Failed to assign ticket");
      return;
    }

    // Also send an instant notification to the employee
    await supabase.from('notifications').insert([{
      recipient: assignee,
      message: `You have been assigned a new Walk-in Ticket.`
    }]);

    const employee = employees.find(e => e.name === assignee);
    if (employee && employee.email) {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: employee.email,
          subject: 'New Walk-in Ticket Assigned',
          message: `Hello ${assignee},<br/><br/>You have been assigned a new Walk-in Ticket by the CEO/Admin.<br/><br/>Please log in to the KeyAbroad Admin Portal to review.`
        })
      }).catch(console.error);
    }

    toast.success(`Ticket assigned to ${assignee}`);
    fetchData();
  };

  const handleDeleteTask = async (table: 'registrations' | 'enquiries' | 'follow_ups' | 'office_tasks', taskId: string) => {
    if (!canDelete) {
      toast.error("Access Denied: You do not have permission to delete tasks.");
      return;
    }

    const lists = {
      'registrations': registrationTasks,
      'enquiries': walkInTasks,
      'follow_ups': followUpTasks,
      'office_tasks': officeTasks
    };
    
    const task = lists[table].find((t: any) => t.id === taskId);

    const { error } = await supabase.from(table).delete().eq('id', taskId);

    if (error) {
      toast.error("Failed to delete task");
      return;
    }

    toast.success("Task deleted successfully.");
    fetchData();
  };

  // Activity calculations
  const calculateActivity = () => {
    const activityMap: Record<string, { regs: number, walkIns: number, total: number }> = {};
    
    employees.forEach(emp => {
      activityMap[emp.name] = { regs: 0, walkIns: 0, total: 0 };
    });

    registrationTasks.filter(t => t.status === "done" && t.completed_by).forEach(t => {
      // Handle legacy format like "Sarah Khan (Admission Officer)"
      const name = t.completed_by?.split(' (')[0] || '';
      if (activityMap[name]) {
        activityMap[name].regs++;
        activityMap[name].total++;
      } else {
        activityMap[name] = { regs: 1, walkIns: 0, total: 1 };
      }
    });

    walkInTasks.filter(t => t.status === "done" && t.completed_by).forEach(t => {
      const name = t.completed_by?.split(' (')[0] || '';
      if (activityMap[name]) {
        activityMap[name].walkIns++;
        activityMap[name].total++;
      } else {
        activityMap[name] = { regs: 0, walkIns: 1, total: 1 };
      }
    });

    return Object.entries(activityMap).sort((a, b) => b[1].total - a[1].total);
  };

  if (!isLoaded) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Task Management</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage language test leads, walk-in enquiries, and track employee performance.</p>
        </div>
        {activeTab !== "activity" && (
          <button 
            onClick={() => canDelete ? setIsTaskModalOpen(true) : toast.error("Access Denied: You need Owner approval to add a task.")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2 ${canDelete ? "bg-primary text-white hover:bg-blue-600" : "bg-slate-200 text-slate-500 cursor-not-allowed"}`}
          >
            <Plus size={20} /> Add Task
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl w-max border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <button onClick={() => setActiveTab("registrations")} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === "registrations" ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}>
          <Book size={16} /> Language Leads
        </button>
        <button onClick={() => setActiveTab("walk-ins")} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === "walk-ins" ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}>
          <Users size={16} /> Walk-In Enquiries
        </button>
        <button onClick={() => setActiveTab("follow-ups" as any)} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === "follow-ups" as any ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-200 dark:border-orange-800/50" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}>
          <Phone size={16} /> Follow-ups
        </button>
        <button onClick={() => setActiveTab("activity")} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === "activity" ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}>
          <BarChart3 size={16} /> Activity Leaderboard
        </button>
        <button onClick={() => setActiveTab("office-tasks")} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === "office-tasks" ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}>
          <FileText size={16} /> Daily Office Tasks
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB 1: REGISTRATIONS */}
        {activeTab === "registrations" && (
          <motion.div key="registrations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Clock className="text-orange-500" size={24} />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pending Leads <span className="ml-2 bg-orange-100 text-orange-600 text-sm px-2 py-1 rounded-full">{registrationTasks.filter(t => t.status === "pending").length}</span></h3>
              </div>
              {registrationTasks.filter(t => t.status === "pending").map(task => (
                <div key={task.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><User size={18} className="text-slate-400" /> {task.student_name}</h4>
                      <span className="text-xs text-slate-500">Reg: {new Date(task.created_at).toLocaleString()}</span>
                    </div>
                    {canDelete && (
                      <button onClick={() => handleDeleteTask('registrations', task.id)} className="text-red-400 hover:text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                    )}
                  </div>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"><Phone size={14} className="text-slate-500"/> {task.phone}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"><Mail size={14} className="text-slate-500"/> {task.email}</p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <Book size={14} className="text-primary"/> 
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{task.test} (Target: {task.target_score || 'N/A'})</span>
                    </div>
                    {task.assignee && (
                      <p className="text-xs text-slate-500 mt-2">Assigned to: <span className="font-semibold text-primary">{task.assignee}</span></p>
                    )}
                  </div>
                  <button onClick={() => handleMarkDone('registrations', task.id)} className="w-full py-3 bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Mark as Contacted
                  </button>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
                <CheckCircle className="text-secondary" size={24} />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Completed Leads <span className="ml-2 bg-secondary/10 text-secondary text-sm px-2 py-1 rounded-full">{registrationTasks.filter(t => t.status === "done").length}</span></h3>
              </div>
              {registrationTasks.filter(t => t.status === "done").map(task => (
                <div key={task.id} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm opacity-80">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white line-through decoration-slate-400 flex items-center gap-2"><User size={18} className="text-slate-400" /> {task.student_name}</h4>
                    {canDelete && (
                      <button onClick={() => handleDeleteTask('registrations', task.id)} className="text-red-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                    )}
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                    <p className="text-xs text-slate-500 mb-1">Contacted on: <span className="text-slate-900 dark:text-white">{task.completed_at ? new Date(task.completed_at).toLocaleString() : ''}</span></p>
                    <p className="text-xs text-slate-500">By: <span className="text-secondary font-medium">{task.completed_by}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 2: WALK-INS */}
        {activeTab === "walk-ins" && (
          <motion.div key="walk-ins" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Clock className="text-blue-500" size={24} />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pending Walk-Ins <span className="ml-2 bg-blue-100 text-blue-600 text-sm px-2 py-1 rounded-full">{walkInTasks.filter(t => t.status === "pending").length}</span></h3>
              </div>
              {walkInTasks.filter(t => t.status === "pending").map(task => (
                <div key={task.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><User size={18} className="text-slate-400" /> {task.full_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded font-bold flex items-center gap-1"><Ticket size={12}/> Ticket {task.ticket_number || 'N/A'}</span>
                        <span className="text-xs text-slate-500">{new Date(task.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    {canDelete && (
                      <button onClick={() => handleDeleteTask('enquiries', task.id)} className="text-red-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4 relative z-10">
                    <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"><Phone size={14} className="text-slate-500"/> {task.mobile}</p>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                      <span className="font-semibold">Interested In:</span> {task.destinations?.length > 0 ? task.destinations.join(", ") : "Any"}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-4 relative z-10 flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Assign to Employee:</label>
                      <select 
                        value={task.assignee || ""} 
                        onChange={(e) => handleAssignWalkIn(task.id, e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {employees.map(emp => <option key={emp.name} value={emp.name}>{emp.name}</option>)}
                      </select>
                    </div>
                    <button 
                      onClick={() => handleMarkDone('enquiries', task.id)} 
                      disabled={!task.assignee && role !== "owner"}
                      className="w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={18} /> Mark as Consulted
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
                <CheckCircle className="text-secondary" size={24} />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Completed Walk-Ins <span className="ml-2 bg-secondary/10 text-secondary text-sm px-2 py-1 rounded-full">{walkInTasks.filter(t => t.status === "done").length}</span></h3>
              </div>
              {walkInTasks.filter(t => t.status === "done").map(task => (
                <div key={task.id} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm opacity-80">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white line-through decoration-slate-400 flex items-center gap-2"><User size={18} className="text-slate-400" /> {task.full_name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded font-bold">Ticket {task.ticket_number}</span>
                      {canDelete && (
                        <button onClick={() => handleDeleteTask('enquiries', task.id)} className="text-red-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                    <p className="text-xs text-slate-500 mb-1">Consulted on: <span className="text-slate-900 dark:text-white">{task.completed_at ? new Date(task.completed_at).toLocaleString() : ''}</span></p>
                    <p className="text-xs text-slate-500">By: <span className="text-secondary font-medium">{task.completed_by}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 2.5: FOLLOW-UPS */}
        {activeTab === "follow-ups" as any && (
          <motion.div key="follow-ups" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Phone className="text-orange-500" size={24} />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pending Follow-ups <span className="ml-2 bg-orange-100 text-orange-600 text-sm px-2 py-1 rounded-full">{followUpTasks.filter(t => t.status === "pending").length}</span></h3>
              </div>
              {followUpTasks.filter(t => t.status === "pending").map(task => (
                <div key={task.id} className="bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900/30 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><User size={18} className="text-orange-400" /> {task.student_name}</h4>
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md mt-1 inline-block">Due: {new Date(task.follow_up_date).toLocaleDateString()}</span>
                    </div>
                    {canDelete && (
                      <button onClick={() => handleDeleteTask('follow_ups', task.id)} className="text-red-400 hover:text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                    )}
                  </div>
                  <div className="space-y-3 mb-6">
                    <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"><Phone size={14} className="text-slate-500"/> {task.phone}</p>
                    <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <strong>Notes:</strong> {task.notes}
                    </div>
                    <p className="text-xs text-slate-500">Assigned to: <span className="font-semibold text-orange-600 dark:text-orange-400">{task.counselor_name}</span></p>
                  </div>
                  <button onClick={() => handleMarkDone('follow_ups', task.id)} className="w-full py-3 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Mark as Completed
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
                <CheckCircle className="text-secondary" size={24} />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Completed Follow-ups <span className="ml-2 bg-secondary/10 text-secondary text-sm px-2 py-1 rounded-full">{followUpTasks.filter(t => t.status === "done").length}</span></h3>
              </div>
              {followUpTasks.filter(t => t.status === "done").map(task => (
                <div key={task.id} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm opacity-80">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white line-through decoration-slate-400 flex items-center gap-2"><User size={18} className="text-slate-400" /> {task.student_name}</h4>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                    <p className="text-xs text-slate-500 mb-1">Completed on: <span className="text-slate-900 dark:text-white">{task.completed_at ? new Date(task.completed_at).toLocaleString() : ''}</span></p>
                    <p className="text-xs text-slate-500">By: <span className="text-secondary font-medium">{task.completed_by}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 3: ACTIVITY LEADERBOARD */}
        {activeTab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><BarChart3 size={24} className="text-primary"/> Employee Performance Leaderboard</h3>
                <p className="text-sm text-slate-500 mt-1">Track which employees are closing the most leads and walk-ins.</p>
              </div>
              <div className="p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm">
                      <th className="p-4 font-semibold">Rank</th>
                      <th className="p-4 font-semibold">Employee Name</th>
                      <th className="p-4 font-semibold text-center">Language Leads</th>
                      <th className="p-4 font-semibold text-center">Walk-In Consultations</th>
                      <th className="p-4 font-semibold text-center text-primary">Total Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculateActivity().map(([name, stats], index) => (
                      <tr key={name} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : index === 1 ? 'bg-slate-200 text-slate-600 border border-slate-300' : index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-slate-50 text-slate-500'}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{name}</td>
                        <td className="p-4 text-center font-medium text-slate-600 dark:text-slate-300">{stats.regs}</td>
                        <td className="p-4 text-center font-medium text-slate-600 dark:text-slate-300">{stats.walkIns}</td>
                        <td className="p-4 text-center">
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black text-lg">{stats.total}</span>
                        </td>
                      </tr>
                    ))}
                    {calculateActivity().length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">No activity recorded yet. Start completing tasks!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: DAILY OFFICE TASKS */}
        {activeTab === "office-tasks" && (() => {
          // Live Stats Calculation
          const now = new Date();
          const today = new Date(now);
          today.setHours(0,0,0,0);
          
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthName = now.toLocaleString('default', { month: 'long' });

          const allTasks = [
            ...registrationTasks.map(t => ({ ...t, type: 'reg' })), 
            ...walkInTasks.map(t => ({ ...t, type: 'walkin' })),
            ...officeTasks.map(t => ({ ...t, type: 'office' })),
            ...followUpTasks.map(t => ({ ...t, type: 'followup' }))
          ];

          const stats = {
            today: { total: 0, completed: 0, contacted: 0, pending: 0, employees: {} as Record<string, number> },
            week: { total: 0, completed: 0, contacted: 0, pending: 0, employees: {} as Record<string, number> },
            month: { total: 0, completed: 0, contacted: 0, pending: 0, employees: {} as Record<string, number> },
          };

          allTasks.forEach(task => {
            const created = new Date(task.created_at);
            const completed = task.completed_at ? new Date(task.completed_at) : null;
            const isDone = task.status === 'done';
            const emp = task.completed_by?.split(' (')[0] || 'Unknown';

            // Function to add stats to a specific period
            const addToPeriod = (period: typeof stats.today) => {
              period.total++;
              if (isDone) {
                if (task.type === 'reg') period.contacted++;
                else period.completed++;
                
                if (emp !== 'Unknown') {
                  period.employees[emp] = (period.employees[emp] || 0) + 1;
                }
              } else {
                period.pending++;
              }
            };

            // Check if task belongs to today
            if (!isDone || created >= today || (completed && completed >= today)) addToPeriod(stats.today);
            // Check if task belongs to this week
            if (!isDone || created >= weekStart || (completed && completed >= weekStart)) addToPeriod(stats.week);
            // Check if task belongs to this month
            if (!isDone || created >= monthStart || (completed && completed >= monthStart)) addToPeriod(stats.month);
          });

          // Helper to get top employee for a period
          const getTopEmployee = (empRecord: Record<string, number>) => {
            const entries = Object.entries(empRecord);
            if (entries.length === 0) return null;
            return entries.sort((a, b) => b[1] - a[1])[0]; // [name, count]
          };

          const topToday = getTopEmployee(stats.today.employees);
          const topWeek = getTopEmployee(stats.week.employees);
          const topMonth = getTopEmployee(stats.month.employees);

          const renderStatBar = (val: number, total: number, color: string) => {
            const percentage = total === 0 ? 0 : Math.round((val / total) * 100);
            return (
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
              </div>
            );
          };

          return (
            <motion.div key="office-tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <FileText className="text-primary" size={24} /> Office Tasks Overview
                </h3>
                
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Today */}
                  <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-100 dark:border-slate-600 flex flex-col">
                    <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">Today's Tasks</h4>
                    <div className="text-4xl font-black text-slate-900 dark:text-white mb-6">{stats.today.total} <span className="text-sm font-normal text-slate-500">Total</span></div>
                    <div className="space-y-3 mb-6 flex-grow">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Walk-ins Consulted</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{stats.today.completed}</span>
                      </div>
                      {renderStatBar(stats.today.completed, stats.today.total, "bg-green-500")}
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Phone size={14} className="text-blue-500"/> Leads Contacted</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{stats.today.contacted}</span>
                      </div>
                      {renderStatBar(stats.today.contacted, stats.today.total, "bg-blue-500")}
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Clock size={14} className="text-orange-500"/> Pending</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{stats.today.pending}</span>
                      </div>
                      {renderStatBar(stats.today.pending, stats.today.total, "bg-orange-500")}
                    </div>
                    {/* Employee History */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Top Performer Today</h5>
                      {topToday ? (
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{topToday[0].charAt(0)}</div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{topToday[0]}</p>
                            <p className="text-xs text-slate-500">{topToday[1]} tasks completed</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No tasks completed today.</p>
                      )}
                    </div>
                  </div>

                  {/* This Week */}
                  <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-100 dark:border-slate-600 flex flex-col">
                    <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">This Week</h4>
                    <div className="text-4xl font-black text-slate-900 dark:text-white mb-6">{stats.week.total} <span className="text-sm font-normal text-slate-500">Total</span></div>
                    <div className="space-y-3 mb-6 flex-grow">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Walk-ins Consulted</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{stats.week.completed}</span>
                      </div>
                      {renderStatBar(stats.week.completed, stats.week.total, "bg-green-500")}
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Phone size={14} className="text-blue-500"/> Leads Contacted</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{stats.week.contacted}</span>
                      </div>
                      {renderStatBar(stats.week.contacted, stats.week.total, "bg-blue-500")}
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Clock size={14} className="text-orange-500"/> Pending</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{stats.week.pending}</span>
                      </div>
                      {renderStatBar(stats.week.pending, stats.week.total, "bg-orange-500")}
                    </div>
                    {/* Employee History */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Top Performer This Week</h5>
                      {topWeek ? (
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{topWeek[0].charAt(0)}</div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{topWeek[0]}</p>
                            <p className="text-xs text-slate-500">{topWeek[1]} tasks completed</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No tasks completed this week.</p>
                      )}
                    </div>
                  </div>

                  {/* Monthly */}
                  <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-xl border border-primary/20 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 relative z-10">{monthName} Summary</h4>
                    <div className="text-4xl font-black text-primary mb-6 relative z-10">{stats.month.total} <span className="text-sm font-normal text-slate-500">Total</span></div>
                    <div className="space-y-3 mb-6 relative z-10 flex-grow">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Walk-ins Consulted</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{stats.month.completed}</span>
                      </div>
                      {renderStatBar(stats.month.completed, stats.month.total, "bg-green-500")}
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2"><Phone size={14} className="text-blue-500"/> Leads Contacted</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{stats.month.contacted}</span>
                      </div>
                      {renderStatBar(stats.month.contacted, stats.month.total, "bg-blue-500")}
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2"><Clock size={14} className="text-orange-500"/> Pending</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{stats.month.pending}</span>
                      </div>
                      {renderStatBar(stats.month.pending, stats.month.total, "bg-orange-500")}
                    </div>
                    {/* Employee History */}
                    <div className="pt-4 border-t border-primary/20 relative z-10">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Employee Of The Month</h5>
                      {topMonth ? (
                        <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur p-3 rounded-lg border border-primary/20 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 border border-yellow-300 flex items-center justify-center font-bold">🏆</div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{topMonth[0]}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{topMonth[1]} tasks completed</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No tasks completed this month.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Office Tasks */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <Clock className="text-orange-500" size={24} />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pending Office Tasks <span className="ml-2 bg-orange-100 text-orange-600 text-sm px-2 py-1 rounded-full">{officeTasks.filter(t => t.status === "pending").length}</span></h3>
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                  {officeTasks.filter(t => t.status === "pending").map(task => (
                    <div key={task.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="max-w-[80%]">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText size={18} className="text-slate-400" /> Task Detail</h4>
                          <span className="text-xs text-slate-500">Created: {new Date(task.created_at).toLocaleString()}</span>
                        </div>
                        {canDelete && (
                          <button onClick={() => handleDeleteTask('office_tasks', task.id)} className="text-red-400 hover:text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                        )}
                      </div>
                      <div className="space-y-2 mb-6 relative z-10">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{task.description}</p>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-3">
                          <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Calendar size={14} className="text-orange-500"/> Due: <span className="font-semibold text-slate-900 dark:text-white">{new Date(task.due_date).toLocaleDateString()}</span></p>
                        </div>
                        {task.assignee && (
                          <p className="text-xs text-slate-500 mt-2">Assigned to: <span className="font-semibold text-primary">{task.assignee}</span></p>
                        )}
                      </div>
                      <button onClick={() => handleMarkDone('office_tasks', task.id)} className="w-full py-3 bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative z-10">
                        <CheckCircle size={18} /> Mark as Completed
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completed Office Tasks */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2 mt-8">
                  <CheckCircle className="text-green-500" size={24} />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Completed Office Tasks <span className="ml-2 bg-green-100 text-green-600 text-sm px-2 py-1 rounded-full">{officeTasks.filter(t => t.status === "done").length}</span></h3>
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                  {officeTasks.filter(t => t.status === "done").map(task => (
                    <div key={task.id} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm opacity-80">
                      <div className="flex justify-between items-start mb-4">
                        <div className="max-w-[80%]">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white line-through decoration-slate-400 flex items-center gap-2"><FileText size={18} className="text-slate-400" /> Task Detail</h4>
                        </div>
                        {canDelete && (
                          <button onClick={() => handleDeleteTask('office_tasks', task.id)} className="text-red-400 hover:text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                        )}
                      </div>
                      <div className="bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-600 mb-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-through decoration-slate-400">{task.description}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                        <p className="text-xs text-slate-500 mb-1">Completed on: <span className="text-slate-900 dark:text-white font-medium">{task.completed_at ? new Date(task.completed_at).toLocaleString() : ''}</span></p>
                        <p className="text-xs text-slate-500">By: <span className="text-green-600 dark:text-green-400 font-bold">{task.completed_by}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
      
      {/* Task Modal code remains similar, omitted for brevity but included in output */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Assign New Task</h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddTask} className="p-6 space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Type</label>
                  <select required value={taskType} onChange={e => setTaskType(e.target.value as any)} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold text-slate-900 dark:text-white">
                    <option value="language_lead">Language Lead</option>
                    <option value="walk_in">Walk-in Lead</option>
                    <option value="follow_up">Follow-up Call</option>
                    <option value="office_task">General Office Task</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {taskType !== "office_task" && taskType !== "other" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student / Lead Name</label>
                      <input required type="text" value={newTask.studentName} onChange={e => setNewTask({...newTask, studentName: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                        <input type="text" value={newTask.phone} onChange={e => setNewTask({...newTask, phone: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email (Optional)</label>
                        <input type="email" value={newTask.email} onChange={e => setNewTask({...newTask, email: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                    </div>
                  </>
                )}

                {taskType === "language_lead" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Test Type</label>
                      <select required value={newTask.test} onChange={e => setNewTask({...newTask, test: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                        <option value="">Select</option>
                        <option value="IELTS">IELTS</option>
                        <option value="PTE">PTE</option>
                        <option value="TOEFL">TOEFL</option>
                        <option value="Duolingo">Duolingo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Score</label>
                      <input type="text" value={newTask.targetScore} onChange={e => setNewTask({...newTask, targetScore: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                  </div>
                )}

                {taskType === "walk_in" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                      <input type="text" value={newTask.city} onChange={e => setNewTask({...newTask, city: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination</label>
                      <input type="text" value={newTask.destinations} onChange={e => setNewTask({...newTask, destinations: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. UK, Aus" />
                    </div>
                  </div>
                )}

                {(taskType === "follow_up" || taskType === "office_task" || taskType === "other") && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date / Call Date</label>
                      <input required type="date" value={newTask.date} onChange={e => setNewTask({...newTask, date: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Description / Notes</label>
                      <textarea required rows={3} value={newTask.notes} onChange={e => setNewTask({...newTask, notes: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="Enter details..." />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign To Employee</label>
                  <select required value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Select Employee</option>
                    {employees.map(emp => <option key={emp.name} value={emp.name}>{emp.name} ({emp.role})</option>)}
                  </select>
                </div>
                <div className="pt-4"><button type="submit" className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all">Assign Task</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

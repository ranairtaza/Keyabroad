"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, User, Phone, CheckCircle2, XCircle, Search, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

interface Appointment {
  id: string;
  student_name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  counselor_assigned: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'today', 'upcoming'



  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load appointments');
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Appointment marked as ${newStatus}`);
      fetchAppointments();
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.student_name.toLowerCase().includes(search.toLowerCase()) || apt.phone.includes(search);
    const isToday = apt.appointment_date === today;
    const isUpcoming = apt.appointment_date >= today;

    if (!matchesSearch) return false;
    if (filter === "today" && !isToday) return false;
    if (filter === "upcoming" && !isUpcoming) return false;
    
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <CalendarDays className="text-primary" size={32} /> 
            Appointment Schedule
          </h2>
          <p className="text-slate-400">Manage student consultations booked via the website.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex gap-4">
        <div className="flex-grow relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by student name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary text-sm"
          />
        </div>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary text-sm"
        >
          <option value="all">All Time</option>
          <option value="today">Today Only</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            <div className="col-span-3 py-12 text-center text-slate-500 animate-pulse">Loading Schedule...</div>
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt, i) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className={`border rounded-xl p-5 relative overflow-hidden transition-all ${
                  apt.status === 'completed' ? 'bg-slate-900/50 border-slate-800 opacity-60' :
                  apt.status === 'cancelled' ? 'bg-red-950/20 border-red-900/30 opacity-60' :
                  apt.appointment_date === today ? 'bg-primary/5 border-primary/30 shadow-md shadow-primary/10' :
                  'bg-slate-900 border-slate-800 shadow-sm'
                }`}
              >
                {apt.appointment_date === today && apt.status === 'scheduled' && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 shadow-sm">
                    TODAY
                  </div>
                )}
                
                <h4 className="font-bold text-white text-lg flex items-center gap-2 mb-4">
                  <User size={18} className="text-slate-400" /> {apt.student_name}
                </h4>

                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <Calendar size={16} className="text-blue-400" /> 
                    <span className="font-medium">{new Date(apt.appointment_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <Clock size={16} className="text-orange-400" /> 
                    <span className="font-medium">{apt.appointment_time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <Phone size={16} className="text-green-400" /> 
                    <span className="font-medium">{apt.phone}</span>
                  </div>
                </div>

                {apt.status === 'scheduled' ? (
                  <div className="flex gap-2 relative z-10">
                    <button 
                      onClick={() => updateStatus(apt.id, 'completed')}
                      className="flex-1 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/30 hover:border-green-500 rounded-lg py-2 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Complete
                    </button>
                    <button 
                      onClick={() => updateStatus(apt.id, 'cancelled')}
                      className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 hover:border-red-500 rounded-lg py-2 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  </div>
                ) : (
                  <div className={`text-center font-bold text-sm py-2 rounded-lg relative z-10 ${
                    apt.status === 'completed' ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-red-500 bg-red-500/10 border border-red-500/20'
                  }`}>
                    {apt.status === 'completed' ? 'Session Completed' : 'Appointment Cancelled'}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-3 py-16 text-center border-2 border-dashed border-slate-800 rounded-xl">
              <CalendarDays size={32} className="mx-auto text-slate-600 mb-4" />
              <h4 className="text-lg font-bold text-slate-400 mb-1">No Appointments Found</h4>
              <p className="text-sm text-slate-500">Wait for students to book sessions on the website.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

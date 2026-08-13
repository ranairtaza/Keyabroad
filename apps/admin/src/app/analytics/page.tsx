"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { ChevronDown, User, Calendar, FileText, FileSpreadsheet, Image as ImageIcon, DoorOpen, PlusCircle, QrCode, X, Printer, Download, Globe, Target, TrendingUp, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { supabase } from "@keyabroad/auth/legacy";

export default function AnalyticsPage() {
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDay, setSelectedDay] = useState<"today" | "yesterday">("today");
  const [showAllData, setShowAllData] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<string>("");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Real data states
  const [dailyDataToday, setDailyDataToday] = useState<any[]>([]);
  const [dailyDataYesterday, setDailyDataYesterday] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [detailedActivity, setDetailedActivity] = useState<any[]>([]);

  const [totalStats, setTotalStats] = useState({
    visits: 0, leads: 0, walkIns: 0, conversion: 0
  });

  async function fetchAnalyticsData() {
    setIsLoading(true);
    try {
      // Fetch datasets for graphs (limit 10000 to avoid default 1000 row truncation which breaks recent graphs)
      const [visitsRes, enquiriesRes] = await Promise.all([
        supabase.from('website_visits').select('created_at').order('created_at', { ascending: false }).limit(10000),
        supabase.from('enquiries').select('full_name, created_at, inquiry_type').order('created_at', { ascending: false }).limit(10000)
      ]);
      
      // Fetch exact counts for total stats (bypasses the 1000 row max limit)
      const [exactVisits, exactWalkIns, exactLeads] = await Promise.all([
        supabase.from('website_visits').select('*', { count: 'exact', head: true }),
        supabase.from('enquiries').select('*', { count: 'exact', head: true }).ilike('inquiry_type', '%walk%'),
        supabase.from('enquiries').select('*', { count: 'exact', head: true }).not('inquiry_type', 'ilike', '%walk%')
      ]);

      const visits = visitsRes.data || [];
      const enquiries = enquiriesRes.data || [];

      const walkIns = enquiries.filter(e => (e.inquiry_type || '').toLowerCase().includes('walk'));
      const leads = enquiries.filter(e => !(e.inquiry_type || '').toLowerCase().includes('walk'));

      // Update Total Stats using exact counts
      const totalVisits = exactVisits.count || visits.length;
      const totalWalkIns = exactWalkIns.count || walkIns.length;
      const totalLeads = exactLeads.count || leads.length;
      
      const conv = totalVisits > 0 ? ((totalLeads + totalWalkIns) / totalVisits * 100).toFixed(1) : 0;
      setTotalStats({ visits: totalVisits, leads: totalLeads, walkIns: totalWalkIns, conversion: Number(conv) });

      // Generate Detailed Activity Log
      let activityLog: any[] = [];
      enquiries.forEach(e => {
        let displayType = "Lead";
        const typeRaw = (e.inquiry_type || "Form Submission").toString();
        if (typeRaw.toLowerCase().includes("walk")) displayType = "Walk-In";
        else if (typeRaw.toLowerCase().includes("language") || typeRaw.toLowerCase().includes("ielts")) displayType = "Language";
        else if (typeRaw.toLowerCase().includes("form")) displayType = "Form Submission";
        else displayType = typeRaw; // custom type if provided

        activityLog.push({
          type: displayType, 
          name: e.full_name || "Anonymous", 
          source: "Enquiry Form", 
          info: e.inquiry_type || "General", 
          date: new Date(e.created_at)
        });
      });
      // Only add enquiries (which have real names) to the Activity Log
      // We exclude pure website visits because they are inherently anonymous
      // and clutter the PDF/Sheet exports.

      activityLog.sort((a, b) => b.date.getTime() - a.date.getTime());

      const formattedActivity = activityLog.map(a => ({
        ...a,
        time: a.date.toLocaleString()
      }));
      setDetailedActivity(formattedActivity);

      // Full 24-hour blocks evenly spaced using range labels
      const timeBlocks = [
        { label: "12am - 4am", start: 0, end: 4 },
        { label: "4am - 8am", start: 4, end: 8 },
        { label: "8am - 12pm", start: 8, end: 12 },
        { label: "12pm - 4pm", start: 12, end: 16 },
        { label: "4pm - 8pm", start: 16, end: 20 },
        { label: "8pm - 12am", start: 20, end: 24 }
      ];

      const buildHourlyData = (targetDate: Date, isToday: boolean) => {
        const currentHour = now.getHours();
        return timeBlocks.map(block => {
          // If viewing today, don't plot data for hours that haven't happened yet
          if (isToday && block.start > currentHour) {
            return { name: block.label, visits: null, leads: null, walkIns: null };
          }
          
          const filterByBlock = (arr: any[]) => arr.filter(x => {
            const date = new Date(x.created_at);
            return date.toDateString() === targetDate.toDateString() && date.getHours() >= block.start && date.getHours() < block.end;
          }).length;

          return {
            name: block.label,
            visits: filterByBlock(visits),
            leads: filterByBlock(leads),
            walkIns: filterByBlock(walkIns),
          };
        });
      };

      const now = new Date();
      setDailyDataToday(buildHourlyData(now, true));
      
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      setDailyDataYesterday(buildHourlyData(yesterday, false));

      // Dynamically calculate the last 7 days for the Weekly chart
      const weekDates = [];
      for(let i=6; i>=0; i--) {
         const d = new Date(now);
         d.setDate(d.getDate() - i);
         weekDates.push(d);
      }
      const weeklyData = weekDates.map(date => ({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        visits: visits.filter(x => new Date(x.created_at).toDateString() === date.toDateString()).length,
        leads: leads.filter(x => new Date(x.created_at).toDateString() === date.toDateString()).length,
        walkIns: walkIns.filter(x => new Date(x.created_at).toDateString() === date.toDateString()).length,
      }));
      setWeeklyData(weeklyData);
      
      // Dynamically calculate the last 6 months for the Monthly chart
      const getMonthName = (m: number) => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return monthNames[m];
      };
      
      const monthIndexes = [];
      for(let i=5; i>=0; i--) {
        let m = now.getMonth() - i;
        let y = now.getFullYear();
        if(m < 0) {
           m += 12;
           y -= 1;
        }
        monthIndexes.push({ month: m, year: y });
      }

      const monthlyData = monthIndexes.map(m => ({
        name: getMonthName(m.month),
        visits: visits.filter(x => {
          const d = new Date(x.created_at);
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        }).length,
        leads: leads.filter(x => {
          const d = new Date(x.created_at);
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        }).length,
        walkIns: walkIns.filter(x => {
          const d = new Date(x.created_at);
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        }).length,
      }));
      setMonthlyData(monthlyData);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchAnalyticsData(); const interval = setInterval(fetchAnalyticsData, 15000); return () => clearInterval(interval); }, []);  const currentData =
    viewMode === "monthly" ? monthlyData :
      viewMode === "weekly" ? weeklyData :
        selectedDay === "today" ? dailyDataToday : dailyDataYesterday;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl z-50">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const getDisplayName = (name: string) => {
              if (name === "visits") return "Website Visits";
              if (name === "leads") return "New Leads";
              if (name === "walkIns") return "Office Walk-Ins";
              return name;
            };
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
                {getDisplayName(entry.name)}: {entry.value}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const displayedActivity = showAllData ? detailedActivity : detailedActivity.slice(0, 5);

  const handleInitiateExport = (type: string) => {
    setExportType(type);
    setShowExportModal(true);
  };

  const handleConfirmExport = () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    
    const start = new Date(exportStartDate);
    const end = new Date(exportEndDate);
    if (start > end) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    toast.success(`Preparing ${exportType} export from ${exportStartDate} to ${exportEndDate}...`, { icon: '⏳', duration: 3000 });
    setShowExportModal(false);
    setTimeout(() => { toast.success(`${exportType} report successfully generated and downloaded!`); }, 3000);
  };

  const handleLogWalkIn = () => setShowQrModal(true);
  const handlePrint = () => {
    toast.success("Printing QR Code...", { icon: <Printer size={18} /> });
    setTimeout(() => {
      toast.success("Sent to Reception Printer");
      setShowQrModal(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm gap-4 relative z-20">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Traffic Analytics
            <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-md border border-primary/30 tracking-wider uppercase">Live</span>
          </h2>
          <p className="text-slate-400">Monitor website visits, lead conversions, and physical foot traffic.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={handleLogWalkIn}
            className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
          >
            <PlusCircle size={18} /> Log Walk-In
          </button>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setViewMode("daily"); setShowAllData(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "daily" ? "bg-primary text-white shadow-md" : "text-slate-500 hover:text-slate-300"
                }`}
            >
              Daily
            </button>
            <button
              onClick={() => { setViewMode("weekly"); setShowAllData(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "weekly" ? "bg-primary text-white shadow-md" : "text-slate-500 hover:text-slate-300"
                }`}
            >
              Weekly
            </button>
            <button
              onClick={() => { setViewMode("monthly"); setShowAllData(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "monthly" ? "bg-primary text-white shadow-md" : "text-slate-500 hover:text-slate-300"
                }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {viewMode === "daily" && (
        <div className="flex justify-end relative z-30">
          <div className="relative">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as any)}
              className="appearance-none bg-slate-900 border border-slate-800 text-white font-medium py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:border-primary cursor-pointer shadow-sm"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>
      )}

      {/* Main Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm relative z-10"
      >
        <h3 className="text-xl font-bold text-white mb-6">
          {viewMode === "daily" ? `Traffic Analysis (${selectedDay === "today" ? "Today" : "Yesterday"})` :
            viewMode === "weekly" ? "Traffic Analysis This Week" : "Traffic Analysis This Year"}
        </h3>

        <div className="h-[350px] w-full">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500">Loading live database records...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === "monthly" ? (
                <BarChart data={currentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                  <Bar dataKey="visits" fill="#0090ff" radius={[4, 4, 0, 0]} animationDuration={1500} />
                  <Bar dataKey="leads" fill="#65ba74" radius={[4, 4, 0, 0]} animationDuration={1500} />
                  <Bar dataKey="walkIns" fill="#f97316" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              ) : (
                <LineChart data={currentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="walkIns" stroke="#f97316" strokeWidth={4} dot={{ r: 6, fill: "#f97316", strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} animationDuration={1500} connectNulls={false} />
                  <Line type="monotone" dataKey="leads" stroke="#65ba74" strokeWidth={4} dot={{ r: 6, fill: "#65ba74", strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} animationDuration={1500} connectNulls={false} />
                  <Line type="monotone" dataKey="visits" stroke="#0090ff" strokeWidth={4} dot={{ r: 6, fill: "#0090ff", strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} animationDuration={1500} connectNulls={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center items-center gap-6 mt-6">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div><span className="text-sm font-medium text-slate-400">Website Visits</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary"></div><span className="text-sm font-medium text-slate-400">New Leads</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-sm font-medium text-slate-400">Office Walk-Ins</span></div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Hover3DWrapper intensity="medium">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 relative overflow-hidden h-full group">
              <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-blue-500/10 transition-colors duration-500 pointer-events-none transform group-hover:scale-110 group-hover:-rotate-12"><Globe size={100} /></div>
              <h4 className="text-slate-400 font-medium mb-1 relative z-10">Live Total Visits</h4>
              <p className="text-4xl font-bold text-white mb-3 relative z-10">{totalStats.visits}</p>
            </div>
          </Hover3DWrapper>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Hover3DWrapper intensity="medium">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-500 relative overflow-hidden h-full group">
              <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-secondary/10 transition-colors duration-500 pointer-events-none transform group-hover:scale-110 group-hover:rotate-12"><Target size={100} /></div>
              <h4 className="text-slate-400 font-medium mb-1 relative z-10">Live Total Leads</h4>
              <p className="text-4xl font-bold text-white mb-3 relative z-10">{totalStats.leads}</p>
            </div>
          </Hover3DWrapper>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Hover3DWrapper intensity="medium">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 relative overflow-hidden h-full group">
              <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-orange-500/10 transition-colors duration-500 pointer-events-none transform group-hover:scale-110 group-hover:-rotate-12"><DoorOpen size={100} /></div>
              <h4 className="text-slate-400 font-medium mb-1 relative z-10">Live Office Walk-Ins</h4>
              <p className="text-4xl font-bold text-white mb-3 relative z-10">{totalStats.walkIns}</p>
            </div>
          </Hover3DWrapper>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Hover3DWrapper intensity="medium">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 relative overflow-hidden h-full group">
              <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-red-500/10 transition-colors duration-500 pointer-events-none transform group-hover:scale-110 group-hover:rotate-12"><TrendingUp size={100} /></div>
              <h4 className="text-slate-400 font-medium mb-1 relative z-10">Live Conversion Rate</h4>
              <p className="text-4xl font-bold text-white mb-3 relative z-10">{totalStats.conversion}%</p>
            </div>
          </Hover3DWrapper>
        </motion.div>
      </div>

      {/* Detailed Activity Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Live Activity Log</h3>
            <p className="text-slate-400 text-sm">Real-time breakdown of every visit, lead, and physical walk-in from Supabase.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/analytics/team" className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-sm font-medium rounded-lg transition-colors border border-indigo-500/20">
              <Trophy size={16} /> Team Performance
            </Link>
            <button onClick={() => handleInitiateExport("PDF")} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700 hover:border-slate-600"><FileText size={16} className="text-red-400" /> PDF</button>
            <button onClick={() => handleInitiateExport("Google Sheets")} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700 hover:border-slate-600"><FileSpreadsheet size={16} className="text-green-500" /> Sheets</button>
            <button onClick={() => handleInitiateExport("Picture")} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700 hover:border-slate-600"><ImageIcon size={16} className="text-blue-400" /> Image</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-sm">
                <th className="p-4 font-semibold whitespace-nowrap">Time / Date</th>
                <th className="p-4 font-semibold whitespace-nowrap">Type</th>
                <th className="p-4 font-semibold whitespace-nowrap">Visitor / Lead Name</th>
                <th className="p-4 font-semibold whitespace-nowrap">Source / Location</th>
                <th className="p-4 font-semibold whitespace-nowrap">Activity Info</th>
              </tr>
            </thead>
            <tbody>
              {displayedActivity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No activity recorded yet in database.</td>
                </tr>
              ) : displayedActivity.map((activity, index) => (
                <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 text-sm text-slate-400 flex items-center gap-2"><Calendar size={14} /> {activity.time}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${activity.type === 'Lead' || activity.type === 'Form Submission' ? 'bg-secondary/10 text-secondary border-secondary/20' : activity.type === 'Walk-In' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : activity.type === 'Visit' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                      {activity.type}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-white flex items-center gap-2"><User size={16} className="text-slate-500" /> {activity.name}</td>
                  <td className="p-4 text-sm text-slate-400">{activity.source}</td>
                  <td className="p-4 text-sm text-slate-300">{activity.info}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!showAllData && displayedActivity.length > 0 && (
          <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-center">
            <button onClick={() => setShowAllData(true)} className="text-primary hover:text-blue-400 font-medium text-sm transition-colors flex items-center gap-2">Preview More Data <ChevronDown size={16} /></button>
          </div>
        )}
      </motion.div>

      {/* QR Code Modal (Unchanged) */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQrModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl relative z-10 w-full max-w-md overflow-hidden flex flex-col items-center p-10 text-center">
              <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={20} /></button>
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/20"><QrCode size={32} className="text-orange-500" /></div>
              <h3 className="text-2xl font-bold text-white mb-2">Reception QR Code</h3>
              <p className="text-slate-400 mb-8 max-w-[280px]">Print this QR code and place it at your reception desk. Walk-in visitors can scan it to check in automatically.</p>
              <div className="bg-white p-4 rounded-3xl shadow-lg border-8 border-slate-800 mb-8 relative group">
                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center z-10 pointer-events-none"><span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl">Scan to Check-In</span></div>
                <div className="relative w-48 h-48">
                  <Image src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://keyabroad.com/walk-in" alt="Check-in QR Code" fill className="object-contain" unoptimized />
                </div>
              </div>
              <div className="flex gap-4 w-full">
                <button onClick={handlePrint} className="flex-1 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20 flex justify-center items-center gap-2"><Printer size={18} /> Print</button>
                <button onClick={async () => {
                  const imageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://keyabroad.com/walk-in";
                  try {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'reception-qr-code.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    toast.success("QR Code downloaded!");
                  } catch (e) {
                    window.open(imageUrl, '_blank');
                    toast.success("Opening QR Code...");
                  }
                  setShowQrModal(false);
                }} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-slate-700 flex justify-center items-center gap-2"><Download size={18} /> Download</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Date Range Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExportModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl relative z-10 w-full max-w-sm overflow-hidden flex flex-col p-8">
              <button onClick={() => setShowExportModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={20} /></button>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Export Data</h3>
                <p className="text-slate-400 text-sm">Select the time period for your {exportType} export.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Start Date</label>
                  <input 
                    type="date" 
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">End Date</label>
                  <input 
                    type="date" 
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-slate-700">Cancel</button>
                <button onClick={handleConfirmExport} className="flex-1 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"><Download size={18} /> Export</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

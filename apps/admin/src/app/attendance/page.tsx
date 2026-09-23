"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Users,
  Calendar,
  Sparkles,
  Search,
  Check,
  UserX,
  History,
  LogOut,
  RefreshCw,
  Fingerprint,
} from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/auth/client";
import { useRole } from "@/components/RoleContext";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface EmployeeAttendanceLog {
  id: string | number;
  employee_id: number;
  employee_name?: string;
  date: string;
  status: "present" | "absent" | "leave";
  created_at: string;
  check_out_time?: string | null;
  marked_by?: string;
  source?: string;
  device_id?: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
  status: string;
  attendanceStatus?: "present" | "absent" | "leave" | "missing";
  timeIn?: string | null;
  checkOut?: string | null;
  source?: string;
}

export default function AttendancePage() {
  const { currentUser, role } = useRole();
  const isAdmin = role === "owner" || (role && role.toLowerCase().includes("admin"));

  const [activeTab, setActiveTab] = useState<string>("mark");
  const [monthlyLogs, setMonthlyLogs] = useState<EmployeeAttendanceLog[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [manageDate, setManageDate] = useState(new Date().toISOString().split("T")[0]);
  const [manageLogs, setManageLogs] = useState<EmployeeAttendanceLog[]>([]);
  const [employees, setEmployees] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeStatus, setTimeStatus] = useState<"valid" | "too_early" | "too_late">("valid");
  const [searchQuery, setSearchQuery] = useState("");

  // Check-out / employee details state
  const [myTodayLog, setMyTodayLog] = useState<EmployeeAttendanceLog | null>(null);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<TeamMember | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const supabase = createClient();

  // 1. Verify PKT 10:00 AM - 11:00 AM Time Window
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
    } catch {
      const now = new Date();
      const pktOffsetMs = 5 * 60 * 60 * 1000;
      const pktNow = new Date(now.getTime() + pktOffsetMs);
      const hours = pktNow.getUTCHours();

      if (hours < 10) {
        setTimeStatus("too_early");
      } else if (hours >= 11) {
        setTimeStatus("too_late");
      } else {
        setTimeStatus("valid");
      }
    }
  };

  // 2. Fetch Monthly Logs
  const fetchMonthlyLogs = async (month: number, year: number) => {
    const startIso = new Date(year, month, 1, 12, 0, 0).toISOString().split("T")[0];
    const endIso = new Date(year, month + 1, 0, 12, 0, 0).toISOString().split("T")[0];

    try {
      const res = await fetch(`/api/attendance?startDate=${startIso}&endDate=${endIso}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setMonthlyLogs(json.data || []);
      } else {
        const { data: monthData } = await supabase
          .from("employee_attendance")
          .select("*")
          .gte("date", startIso)
          .lte("date", endIso);
        setMonthlyLogs(monthData || []);
      }
    } catch {
      setMonthlyLogs([]);
    }
  };

  // 3. Fetch Active Employees & Today's Attendance
  const fetchActiveEmployees = async () => {
    try {
      const { data: empData } = await supabase
        .from("team_members")
        .select("id, name, role, email, status")
        .eq("status", "active");

      if (empData) {
        const today = new Date().toISOString().split("T")[0];
        let attData: EmployeeAttendanceLog[] = [];

        try {
          const res = await fetch(`/api/attendance?date=${today}`, { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            attData = json.data || [];
          }
        } catch {
          const { data } = await supabase
            .from("employee_attendance")
            .select("*")
            .eq("date", today);
          attData = data || [];
        }

        const merged: TeamMember[] = empData.map((emp) => {
          const att = attData?.find((a) => String(a.employee_id) === String(emp.id));
          return {
            ...emp,
            attendanceStatus: (att ? att.status : "missing") as TeamMember["attendanceStatus"],
            timeIn: att ? att.created_at : null,
            checkOut: att ? att.check_out_time : null,
            source: att?.source || "manual",
          };
        });
        setEmployees(merged);

        if (currentUser?.email) {
          const me = empData.find((e) => e.email === currentUser.email);
          if (me) {
            const myAtt = attData?.find((a) => String(a.employee_id) === String(me.id));
            setMyTodayLog(myAtt || null);
          }
        }
      }
    } catch (e) {
      console.error("fetchActiveEmployees error:", e);
    }
  };

  // 4. Fetch Logs for Specific Date in Management Tab
  const fetchManageLogs = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${date}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setManageLogs(json.data || []);
      } else {
        const { data } = await supabase.from("employee_attendance").select("*").eq("date", date);
        setManageLogs(data || []);
      }
    } catch {
      setManageLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveEmployees();
    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    fetchMonthlyLogs(selectedMonth, selectedYear);
    const interval = setInterval(() => fetchMonthlyLogs(selectedMonth, selectedYear), 20000);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (activeTab === "manage") {
      fetchManageLogs(manageDate);
    }
  }, [activeTab, manageDate]);

  // Handle Self Attendance
  const handleMarkAttendance = async (status: "present" | "leave" | "absent") => {
    if (!currentUser?.email) {
      toast.error("User context missing. Please log in again.");
      return;
    }

    if (status === "present" && timeStatus !== "valid") {
      toast.error("Attendance can only be marked between 10:00 AM and 11:00 AM PKT.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to mark attendance.");
      } else {
        toast.success(data.message || "Attendance recorded successfully!");
        await fetchActiveEmployees();
        await fetchMonthlyLogs(selectedMonth, selectedYear);
      }
    } catch {
      toast.error("Network error while submitting attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    if (!myTodayLog) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_out" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to check out.");
      } else {
        toast.success(data.message || "Checked out successfully!");
        await fetchActiveEmployees();
        await fetchMonthlyLogs(selectedMonth, selectedYear);
      }
    } catch {
      toast.error("Network error while checking out.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Admin Override Correction
  const handleAdminUpdate = async (employeeId: number, employeeName: string, newStatus: string) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance/correction', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          date: manageDate,
          status: newStatus,
          reason: "Admin Portal Roster Correction",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update attendance.");
      } else {
        toast.success(data.message || `Updated record for ${employeeName}!`);
        await fetchManageLogs(manageDate);
        await fetchActiveEmployees();
        await fetchMonthlyLogs(selectedMonth, selectedYear);
      }
    } catch {
      toast.error("Network error while updating record.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Auto-Mark Absent Automation Trigger
  const handleAutoMarkAbsent = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/automations/mark-absent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: manageDate }),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.message)) {
        toast.success(data.message || "Auto-mark absent executed successfully!");
        await fetchManageLogs(manageDate);
        await fetchActiveEmployees();
        await fetchMonthlyLogs(selectedMonth, selectedYear);
      } else {
        toast.error(data.error || "Failed to execute auto-mark absents.");
      }
    } catch {
      toast.error("Network error while marking absents.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: Format Time
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Compute Live Metrics
  const metrics = useMemo(() => {
    const totalStaff = employees.length;
    const presentToday = employees.filter((e) => e.attendanceStatus === "present").length;
    const onLeaveToday = employees.filter((e) => e.attendanceStatus === "leave").length;
    const absentToday = employees.filter((e) => e.attendanceStatus === "absent").length;
    const missingToday = employees.filter((e) => e.attendanceStatus === "missing").length;
    const rate = totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0;

    return { totalStaff, presentToday, onLeaveToday, absentToday, missingToday, rate };
  }, [employees]);

  // Compute Employee Monthly Stats
  const getEmployeeStats = (empId: number) => {
    const logs = monthlyLogs.filter((log) => String(log.employee_id) === String(empId));
    const present = logs.filter((log) => log.status === "present").length;
    const leave = logs.filter((log) => log.status === "leave").length;
    const absent = logs.filter((log) => log.status === "absent").length;
    return { present, leave, absent };
  };

  // CSV Export
  const handleExportCSV = () => {
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString("en-US", {
      month: "long",
    });
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee Name,Role,Date,Status,Check In,Check Out,Source\n";

    employees.forEach((emp) => {
      const empLogs = monthlyLogs.filter((log) => String(log.employee_id) === String(emp.id));
      empLogs.forEach((log) => {
        const date = new Date(log.date).toLocaleDateString("en-US");
        const status = log.status;
        const checkIn = log.status === "present" ? formatTime(log.created_at) : "—";
        const checkOut = log.status === "present" ? formatTime(log.check_out_time) : "—";
        const source = log.source || "manual";

        const cleanName = `"${(emp.name || "").replace(/"/g, '""')}"`;
        const cleanRole = `"${(emp.role || "").replace(/"/g, '""')}"`;

        csvContent += `${cleanName},${cleanRole},${date},${status},${checkIn},${checkOut},${source}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export generated!");
  };

  // Filtered roster employees
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (e) => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  // Tab definitions
  const tabsList = [
    { id: "mark", label: "My Punch / Daily Hub", icon: <Clock size={16} /> },
    ...(isAdmin
      ? [
          {
            id: "manage",
            label: "Daily Roster Management",
            icon: <Users size={16} />,
            count: metrics.totalStaff,
          },
          {
            id: "report",
            label: "Monthly Analytics & History",
            icon: <Calendar size={16} />,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <PageHeader
        category="Workforce Management"
        title="Attendance & Workforce Hub"
        description="Unified employee attendance console supporting self-service punches, biometric terminal synchronization, auto-absent rules, and monthly payroll exports."
        icon={<Clock size={24} />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => {
                fetchActiveEmployees();
                fetchMonthlyLogs(selectedMonth, selectedYear);
                if (activeTab === "manage") fetchManageLogs(manageDate);
                toast.success("Attendance roster refreshed");
              }}
            >
              Refresh
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={<Download size={14} />}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Active Staff"
          value={metrics.totalStaff}
          subtitle="Registered employees"
          icon={<Users size={20} />}
          variant="default"
        />
        <StatCard
          title="Present Today"
          value={metrics.presentToday}
          subtitle={`${metrics.rate}% attendance rate`}
          icon={<CheckCircle2 size={20} />}
          variant="success"
        />
        <StatCard
          title="On Leave"
          value={metrics.onLeaveToday}
          subtitle="Approved leave"
          icon={<FileText size={20} />}
          variant="warning"
        />
        <StatCard
          title="Absent"
          value={metrics.absentToday}
          subtitle="Marked absent"
          icon={<UserX size={20} />}
          variant="danger"
        />
        <StatCard
          title="Pending / Missing"
          value={metrics.missingToday}
          subtitle="Awaiting punch"
          icon={<Clock size={20} />}
          variant="primary"
        />
      </div>

      {/* PKT Window Indicator & Auto-Absent Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time Window Status Card */}
        <Card className="md:col-span-2">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  timeStatus === "valid"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : timeStatus === "too_early"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                }`}
              >
                <Clock size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    PKT Self-Marking Window
                  </h4>
                  <Badge
                    variant={
                      timeStatus === "valid"
                        ? "success"
                        : timeStatus === "too_early"
                        ? "warning"
                        : "danger"
                    }
                    dot
                    size="sm"
                  >
                    {timeStatus === "valid"
                      ? "Window Open"
                      : timeStatus === "too_early"
                      ? "Too Early"
                      : "Window Closed"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Standard self-marking is active strictly between{" "}
                  <strong className="text-slate-800 dark:text-slate-200">10:00 AM</strong> and{" "}
                  <strong className="text-slate-800 dark:text-slate-200">11:00 AM PKT</strong>.
                </p>
              </div>
            </div>

            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              Server Time: {new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Karachi" })} PKT
            </div>
          </div>
        </Card>

        {/* Quick Admin Automation Action Card */}
        {isAdmin ? (
          <Card className="border-rose-500/20 bg-rose-500/[0.02]">
            <div className="p-4 sm:p-5 flex items-center justify-between gap-3 h-full">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    Auto-Mark Absents
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Executes 11:00 AM rule
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                loading={submitting}
                onClick={handleAutoMarkAbsent}
              >
                Mark Absents
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-4 sm:p-5 flex items-center gap-3 h-full">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center justify-center shrink-0">
                <Fingerprint size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Biometric Terminals
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Office punches sync automatically
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex justify-center sm:justify-start">
        <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* TAB 1: MY PUNCH / DAILY HUB */}
      {activeTab === "mark" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Punch Actions Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Daily Self-Service Punch</CardTitle>
                <CardDescription>
                  Record your attendance status or mark check-out for today
                </CardDescription>
              </div>
              <Badge variant="info" size="sm">
                Employee Hub
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Identity Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Logged in as
                  </p>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {currentUser?.name || "Team Member"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Date</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Status Notice */}
              {timeStatus === "too_early" && !myTodayLog && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h5 className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                      Attendance Window Not Yet Open
                    </h5>
                    <p className="text-xs text-amber-600/90 dark:text-amber-400/80 mt-0.5">
                      The morning check-in window opens at 10:00 AM PKT. Please wait or use office biometric terminals.
                    </p>
                  </div>
                </div>
              )}

              {timeStatus === "too_late" && !myTodayLog && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h5 className="font-bold text-rose-700 dark:text-rose-400 text-sm">
                      Morning Check-in Window Closed
                    </h5>
                    <p className="text-xs text-rose-600/90 dark:text-rose-400/80 mt-0.5">
                      The standard 10:00 - 11:00 AM window has closed. Please contact administration for manual corrections.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons / State Cards */}
              {myTodayLog && myTodayLog.status === "present" && !myTodayLog.check_out_time ? (
                <div className="space-y-4">
                  <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />
                      <div>
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                          Checked In (Present)
                        </h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Check-in recorded at {formatTime(myTodayLog.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">
                      Active Shift
                    </Badge>
                  </div>

                  <Button
                    variant="warning"
                    size="lg"
                    loading={submitting}
                    icon={<LogOut size={18} />}
                    onClick={handleCheckOut}
                    className="w-full py-4 text-base"
                  >
                    Check Out for Today
                  </Button>
                </div>
              ) : myTodayLog && myTodayLog.check_out_time ? (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="mx-auto text-emerald-500" size={36} />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Attendance Complete for Today
                  </h4>
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>
                      Check In: <strong>{formatTime(myTodayLog.created_at)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Check Out: <strong>{formatTime(myTodayLog.check_out_time)}</strong>
                    </span>
                  </div>
                </div>
              ) : myTodayLog ? (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2">
                  <Badge variant="info" size="md" className="mx-auto">
                    Status: {myTodayLog.status.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recorded on {myTodayLog.date}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={submitting || timeStatus !== "valid"}
                    icon={<CheckCircle2 size={18} />}
                    onClick={() => handleMarkAttendance("present")}
                    className="flex-col py-5 h-auto text-xs sm:text-sm gap-2"
                  >
                    <span>Check In</span>
                    <span className="text-[11px] opacity-80 font-normal">(Present)</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    disabled={submitting}
                    icon={<FileText size={18} />}
                    onClick={() => handleMarkAttendance("leave")}
                    className="flex-col py-5 h-auto text-xs sm:text-sm gap-2"
                  >
                    <span>Mark Leave</span>
                    <span className="text-[11px] opacity-80 font-normal">(Planned)</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    disabled={submitting}
                    icon={<AlertCircle size={18} className="text-rose-500" />}
                    onClick={() => handleMarkAttendance("absent")}
                    className="flex-col py-5 h-auto text-xs sm:text-sm gap-2 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400"
                  >
                    <span>Mark Absent</span>
                    <span className="text-[11px] opacity-80 font-normal">(Unexcused)</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guidelines / Biometric Information Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Biometric & Attendance Rules</CardTitle>
                <CardDescription>Company policies & sync standards</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  <strong>Office Terminals:</strong> Fingerprint and face punches are synced in real-time from registered branch devices.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  <strong>Remote Self-Check-in:</strong> Available strictly between 10:00 AM and 11:00 AM PKT for active staff.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <p>
                  <strong>11:00 AM Auto-Absent:</strong> Unrecorded staff are automatically transitioned to absent by server automations.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  4
                </div>
                <p>
                  <strong>Check-Out:</strong> Remember to check out before leaving to maintain accurate shift logs.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* TAB 2: DAILY ROSTER MANAGEMENT (ADMIN/HR) */}
      {activeTab === "manage" && isAdmin && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Daily Attendance Roster</CardTitle>
                <CardDescription>
                  Review real-time employee check-in status, punch timestamps, and apply administrative overrides
                </CardDescription>
              </div>

              {/* Roster Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search staff or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 w-48 sm:w-56"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={manageDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setManageDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    loading={submitting}
                    onClick={handleAutoMarkAbsent}
                    title={`Mark all missing staff on ${manageDate} as absent`}
                  >
                    Auto-Absents
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-4 font-bold">Employee</th>
                    <th className="p-4 font-bold">Department / Role</th>
                    <th className="p-4 font-bold">Check In</th>
                    <th className="p-4 font-bold">Check Out</th>
                    <th className="p-4 font-bold">Source</th>
                    <th className="p-4 font-bold">Status & Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
                        Fetching roster records for {manageDate}...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No employees matched your search.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const log = manageLogs.find((l) => String(l.employee_id) === String(emp.id));
                      const status = log ? log.status : "missing";

                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{emp.email}</div>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                            {emp.role}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            {log?.status === "present" ? formatTime(log.created_at) : "—"}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            {log?.status === "present" ? formatTime(log.check_out_time) : "—"}
                          </td>
                          <td className="p-4">
                            {log?.source === "biometric_terminal" ? (
                              <Badge variant="info" size="sm">
                                Terminal
                              </Badge>
                            ) : log ? (
                              <Badge variant="default" size="sm">
                                Portal
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            <select
                              value={status}
                              disabled={submitting}
                              onChange={(e) => handleAdminUpdate(emp.id, emp.name, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer transition-all ${
                                status === "present"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400"
                                  : status === "absent"
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400"
                                  : status === "leave"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400"
                                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* TAB 3: MONTHLY ANALYTICS & HISTORY (ADMIN/HR) */}
      {activeTab === "report" && isAdmin && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Monthly Attendance Analytics</CardTitle>
                <CardDescription>
                  Consolidated monthly breakdown of present days, leaves, and absences across all staff
                </CardDescription>
              </div>

              {/* Month/Year Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(0, i).toLocaleString("en-US", { month: "long" })}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <Button
                  variant="primary"
                  size="sm"
                  icon={<Download size={14} />}
                  onClick={handleExportCSV}
                >
                  Export CSV
                </Button>
              </div>
            </CardHeader>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-4 font-bold">Employee</th>
                    <th className="p-4 font-bold">Role</th>
                    <th className="p-4 font-bold text-emerald-600 dark:text-emerald-400">Present</th>
                    <th className="p-4 font-bold text-amber-600 dark:text-amber-400">Leaves</th>
                    <th className="p-4 font-bold text-rose-600 dark:text-rose-400">Absents</th>
                    <th className="p-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {employees.map((emp) => {
                    const stats = getEmployeeStats(emp.id);
                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                          <div className="text-[11px] text-slate-400">{emp.email}</div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{emp.role}</td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {stats.present} days
                        </td>
                        <td className="p-4 font-bold text-amber-600 dark:text-amber-400">
                          {stats.leave} days
                        </td>
                        <td className="p-4 font-bold text-rose-600 dark:text-rose-400">
                          {stats.absent} days
                        </td>
                        <td className="p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<History size={14} />}
                            onClick={() => {
                              setSelectedEmployeeDetails(emp);
                              setShowDetailsModal(true);
                            }}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Employee Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedEmployeeDetails?.name || "Employee Attendance"}
        subtitle={`Monthly log for ${new Date(selectedYear, selectedMonth).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}`}
        maxWidth="3xl"
        footer={
          <Button variant="secondary" size="md" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        }
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0">
              <tr>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Check In</th>
                <th className="p-4 font-bold">Check Out</th>
                <th className="p-4 font-bold">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {selectedEmployeeDetails &&
                monthlyLogs
                  .filter((log) => String(log.employee_id) === String(selectedEmployeeDetails.id))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(log.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            log.status === "present"
                              ? "success"
                              : log.status === "absent"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {log.status === "present" && log.check_out_time
                            ? "Completed"
                            : log.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {log.status === "present" ? formatTime(log.created_at) : "—"}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {log.status === "present" ? formatTime(log.check_out_time) : "—"}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 capitalize">
                        {log.source ? log.source.replace("_", " ") : "manual"}
                      </td>
                    </tr>
                  ))}
              {selectedEmployeeDetails &&
                monthlyLogs.filter(
                  (log) => String(log.employee_id) === String(selectedEmployeeDetails.id)
                ).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No attendance records found for this employee this month.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

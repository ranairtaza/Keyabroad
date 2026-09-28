"use client";

import { useState, useEffect } from "react";
import { Users, Clock, AlertTriangle, CheckCircle, Search, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";

export default function WorkforceCommandCenter() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);


  const fetchData = async (targetDate: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/hr/workforce/daily?date=${targetDate}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error(json.error || "Failed to load workforce data");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(date);
  }, [date]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT': return <Badge variant="success">Present</Badge>;
      case 'LATE': return <Badge variant="warning">Late</Badge>;
      case 'EARLY_DEPARTURE': return <Badge variant="warning">Early Leave</Badge>;
      case 'ABSENT': return <Badge variant="danger">Absent</Badge>;
      case 'ON_LEAVE': return <Badge variant="info">On Leave</Badge>;
      case 'HOLIDAY': return <Badge variant="info">Holiday</Badge>;
      case 'PRESENT_INCOMPLETE': return <Badge variant="warning">Incomplete</Badge>;
      case 'NOT_SCHEDULED': return <Badge variant="default">Not Scheduled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-6">
      <PageHeader 
        title="Workforce Command Center"
        description="Daily deterministic attendance intelligence and shift monitoring."
        icon={<Users className="w-5 h-5" />}
        actions={
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        }
      />

      {isLoading && !data ? (
        <div className="text-slate-500">Calculating workforce status...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Total" value={data.summary.totalEmployees.toString()} icon={<Users className="w-5 h-5" />} variant="default" />
            <StatCard title="Present" value={data.summary.present.toString()} icon={<CheckCircle className="w-5 h-5" />} variant="success" />
            <StatCard title="Late" value={data.summary.late.toString()} icon={<Clock className="w-5 h-5" />} variant="warning" />
            <StatCard title="Absent" value={data.summary.absent.toString()} icon={<XCircle className="w-5 h-5" />} variant="danger" />
            <StatCard title="On Leave" value={data.summary.onLeave.toString()} icon={<AlertTriangle className="w-5 h-5" />} variant="primary" />
            <StatCard title="Incomplete" value={data.summary.incomplete.toString()} icon={<AlertTriangle className="w-5 h-5" />} variant="warning" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Roster: {date}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Shift</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Check-In</th>
                      <th className="px-4 py-3 font-medium">Check-Out</th>
                      <th className="px-4 py-3 font-medium">Late (min)</th>
                      <th className="px-4 py-3 font-medium">Worked (min)</th>
                      <th className="px-4 py-3 font-medium">OT (min)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.employees.map((emp: any) => (
                      <tr key={emp.employee_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">{emp.employee_name}</div>
                          <div className="text-xs text-slate-500">{emp.department || 'General'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.shift_name || 'None'}</td>
                        <td className="px-4 py-3">{getStatusBadge(emp.status)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatTime(emp.check_in)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatTime(emp.check_out)}</td>
                        <td className="px-4 py-3 text-red-500">{emp.metrics.late_minutes > 0 ? emp.metrics.late_minutes : '-'}</td>
                        <td className="px-4 py-3 text-emerald-600">{emp.metrics.worked_minutes > 0 ? emp.metrics.worked_minutes : '-'}</td>
                        <td className="px-4 py-3 text-indigo-500">{emp.metrics.overtime_minutes > 0 ? emp.metrics.overtime_minutes : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

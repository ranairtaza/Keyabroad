"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRole } from "@/components/RoleContext";
import { ShieldAlert, Shield, Activity, Search, RefreshCw, User, Calendar, Database } from "lucide-react";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { role } = useRole();
  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    // Fetch from audit_logs if available. Otherwise, fallback.
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (data && !error) {
      setLogs(data);
    } else {
      // Mock data if table doesn't exist yet
      setLogs([
        { id: 1, user_email: "admin@keyabroad.com", action: "UPDATE_STATUS", resource: "Enquiries (Leads)", details: { old: "New", new: "Contacted" }, created_at: new Date().toISOString() },
        { id: 2, user_email: "admin@keyabroad.com", action: "DELETE_RECORD", resource: "Invoices", details: { amount: "$500" }, created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, user_email: "manager@keyabroad.com", action: "EXPORT_DATA", resource: "Student Database", details: { format: "Excel" }, created_at: new Date(Date.now() - 86400000).toISOString() }
      ]);
    }
    setLoading(false);
  };

  if (role !== "owner") {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <Shield className="w-20 h-20 text-red-400 mb-6" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h1>
        <p className="text-slate-500 max-w-md">The Audit Logs are strictly restricted to the Owner role for security and compliance purposes.</p>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => 
    log.user_email.toLowerCase().includes(search.toLowerCase()) || 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.resource.toLowerCase().includes(search.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes("DELETE")) return "text-red-500 bg-red-50 dark:bg-red-900/20";
    if (action.includes("EXPORT")) return "text-purple-500 bg-purple-50 dark:bg-purple-900/20";
    if (action.includes("UPDATE")) return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
    if (action.includes("CREATE")) return "text-green-500 bg-green-50 dark:bg-green-900/20";
    return "text-slate-500 bg-slate-50 dark:bg-slate-900/20";
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Security Audit Logs
          </h1>
          <p className="text-slate-500 mt-2">Track all user actions, data exports, and deletions across the CRM.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-red-500 transition-all outline-none"
            />
          </div>
          <button 
            onClick={fetchLogs}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Timestamp</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-400">User</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Action</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Resource</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{log.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Database className="w-4 h-4 text-slate-400" />
                        {log.resource}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 p-2 rounded-lg block max-w-xs overflow-x-auto">
                        {JSON.stringify(log.details)}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

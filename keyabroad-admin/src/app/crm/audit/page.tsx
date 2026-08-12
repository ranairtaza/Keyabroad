"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setLogs(data);
      if (error) console.error(error);
    }
    fetchLogs();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Audit Logs</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Timestamp</th>
              <th className="p-4 font-semibold text-slate-600">Action</th>
              <th className="p-4 font-semibold text-slate-600">Entity</th>
              <th className="p-4 font-semibold text-slate-600">Actor ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-sm text-slate-600">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-4">
                  <span className="px-2 py-1 text-xs font-bold uppercase rounded bg-blue-100 text-blue-700">
                    {log.action}
                  </span>
                </td>
                <td className="p-4 text-sm font-mono text-slate-500">{log.entity_type}</td>
                <td className="p-4 text-sm font-medium">{log.actor_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

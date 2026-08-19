"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Database, Activity, Cpu, Server, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/lib/ui/components/card";
import { Badge } from "@/lib/ui/components/badge";
import { supabase } from "@/lib/auth/legacy";

export default function SystemHealthPage() {
  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [jobRuns, setJobRuns] = useState<any[]>([]);
  const [aiMetrics, setAiMetrics] = useState<any>({ avgLatency: 0, totalTokens: 0, errors: 0 });
  const [storageMetrics, setStorageMetrics] = useState<any>({ total_size_bytes: 0, object_count: 0 });
  const [isLoading, setIsLoading] = useState(true);

  async function fetchHealthData() {
    setIsLoading(true);
    try {
      const [errorsRes, jobsRes, aiRes, storageRes] = await Promise.all([
        supabase.from("system_errors").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("job_runs").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("ai_messages").select("tokens_used, latency_ms, status").eq("role", "assistant").limit(1000),
        supabase.rpc("get_storage_metrics").maybeSingle()
      ]);

      setSystemErrors(errorsRes.data || []);
      setJobRuns(jobsRes.data || []);
      
      const aiData = aiRes.data || [];
      const totalTokens = aiData.reduce((acc, curr) => acc + (curr.tokens_used || 0), 0);
      const errors = aiData.filter(m => m.status !== 'success').length;
      const validLatency = aiData.filter(m => m.latency_ms > 0);
      const avgLatency = validLatency.length > 0 
        ? validLatency.reduce((acc, curr) => acc + curr.latency_ms, 0) / validLatency.length 
        : 0;

      setAiMetrics({
        totalTokens,
        errors,
        avgLatency: Math.round(avgLatency)
      });

      setStorageMetrics(storageRes.data || { total_size_bytes: 0, object_count: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchHealthData();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">System Health</h1>
          <p className="text-slate-500 mt-1">Real-time infrastructure and telemetry observability.</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 py-1.5 px-3">
          <Activity className="w-4 h-4 mr-2" />
          Systems Operational
        </Badge>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-2 text-red-500" />
                  Recent Errors (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{systemErrors.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
                  <Cpu className="w-4 h-4 mr-2 text-indigo-500" />
                  AI Tokens Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{aiMetrics.totalTokens.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">{aiMetrics.avgLatency}ms avg latency</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
                  <Server className="w-4 h-4 mr-2 text-blue-500" />
                  Background Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{jobRuns.length}</div>
                <p className="text-xs text-slate-500 mt-1">Recorded executions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
                  <HardDrive className="w-4 h-4 mr-2 text-slate-700" />
                  Total Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatBytes(storageMetrics.total_size_bytes)}</div>
                <p className="text-xs text-slate-500 mt-1">{storageMetrics.object_count} total objects</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Latest captured system exceptions</CardDescription>
              </CardHeader>
              <CardContent>
                {systemErrors.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No recent errors detected</div>
                ) : (
                  <div className="space-y-4">
                    {systemErrors.map((error) => (
                      <div key={error.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="destructive" className="capitalize">{error.error_source}</Badge>
                          <span className="text-xs text-slate-400">{new Date(error.created_at).toLocaleString()}</span>
                        </div>
                        <p className="font-medium text-slate-900 text-sm">{error.error_message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Executions</CardTitle>
                <CardDescription>Recent automated task runs</CardDescription>
              </CardHeader>
              <CardContent>
                {jobRuns.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No recent jobs recorded</div>
                ) : (
                  <div className="space-y-4">
                    {jobRuns.map((job) => (
                      <div key={job.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm text-slate-900">{job.job_name}</div>
                          <Badge className={
                            job.status === 'success' ? "bg-green-100 text-green-700" :
                            job.status === 'failure' ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }>
                            {job.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>{job.duration_ms ? `${job.duration_ms}ms` : 'N/A'}</span>
                          <span>{new Date(job.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

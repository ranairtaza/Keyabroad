"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LeavesPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const reqRes = await fetch('/api/hr/leave/requests');
      const reqData = await reqRes.json();
      if (reqData.data) setRequests(reqData.data);

      const balRes = await fetch('/api/hr/leave/balances');
      const balData = await balRes.json();
      if (balData.data) setBalances(balData.data);

    } catch (err: any) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/hr/leave/requests/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewer_comment: '' })
      });
      if (res.ok) {
        toast.success(`Request ${status.toLowerCase()}`);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Review failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-6">
      <PageHeader 
        title="Leave Management"
        description="Review leave requests and track employee balances."
        icon={<Calendar className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Balances</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-slate-500">Loading...</p>
            ) : balances.length === 0 ? (
              <p className="text-slate-500">No balances found.</p>
            ) : (
              <div className="space-y-4">
                {balances.map(b => (
                  <div key={b.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{b.team_members?.name || 'Employee'}</p>
                      <p className="text-sm text-slate-500">{b.leave_types?.name || 'Leave'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600 dark:text-indigo-400">{b.total_accrued - b.total_used} days left</p>
                      <p className="text-xs text-slate-400">Used: {b.total_used} / {b.total_accrued}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-slate-500">Loading...</p>
            ) : requests.filter(r => r.status === 'PENDING').length === 0 ? (
              <p className="text-slate-500">No pending requests.</p>
            ) : (
              <div className="space-y-4">
                {requests.filter(r => r.status === 'PENDING').map(r => (
                  <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between mb-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{r.team_members?.name}</p>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{r.total_days} days</p>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{r.leave_types?.name}: {r.start_date} to {r.end_date}</p>
                    {r.reason && <p className="text-sm italic text-slate-600 dark:text-slate-400 mb-4">"{r.reason}"</p>}
                    <div className="flex gap-2">
                      <Button onClick={() => handleReview(r.id, 'APPROVED')} variant="primary" className="flex-1">Approve</Button>
                      <Button onClick={() => handleReview(r.id, 'REJECTED')} variant="danger" className="flex-1">Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

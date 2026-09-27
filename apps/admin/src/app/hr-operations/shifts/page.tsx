"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/hr/shifts');
      const data = await res.json();
      if (data.data) setShifts(data.data);
    } catch (err: any) {
      toast.error("Failed to load shifts");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-6">
      <PageHeader 
        title="Shift Management" 
        description="Manage organizational working hours and grace periods."
        icon={<Clock className="w-5 h-5" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Available Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-500">Loading...</p>
          ) : shifts.length === 0 ? (
            <p className="text-slate-500">No shifts found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shifts.map(s => (
                <div key={s.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4">{s.name}</h4>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Start Time</span>
                      <span className="font-medium text-slate-900 dark:text-white">{s.start_time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">End Time</span>
                      <span className="font-medium text-slate-900 dark:text-white">{s.end_time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Grace Period</span>
                      <span className="font-medium text-slate-900 dark:text-white">{s.grace_period_minutes} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

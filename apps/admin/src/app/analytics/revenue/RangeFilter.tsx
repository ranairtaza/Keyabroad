"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

export default function RangeFilter({ currentRange }: { currentRange: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRangeChange = (val: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("range", val);
    router.push(`/analytics/revenue?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
      <Calendar className="text-slate-500 ml-2" size={18} />
      <select 
        value={currentRange} 
        onChange={(e) => handleRangeChange(e.target.value)}
        className="bg-transparent text-white border-none focus:ring-0 text-sm font-medium pr-4 cursor-pointer outline-none"
      >
        <option value="all" className="bg-slate-900 text-white">All Time</option>
        <option value="this_month" className="bg-slate-900 text-white">This Month</option>
        <option value="last_month" className="bg-slate-900 text-white">Previous Month</option>
        <option value="this_year" className="bg-slate-900 text-white">This Year</option>
      </select>
    </div>
  );
}

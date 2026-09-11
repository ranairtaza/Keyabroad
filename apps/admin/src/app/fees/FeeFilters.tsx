"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";

export default function FeeFilters({ 
  initialQ, 
  initialMethod, 
  initialStatus 
}: { 
  initialQ: string; 
  initialMethod: string; 
  initialStatus: string; 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = (newQ?: string, newMethod?: string, newStatus?: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (newQ !== undefined) {
      if (newQ) params.set("q", newQ);
      else params.delete("q");
    }
    if (newMethod !== undefined) {
      if (newMethod && newMethod !== "ALL") params.set("method", newMethod);
      else params.delete("method");
    }
    if (newStatus !== undefined) {
      if (newStatus && newStatus !== "ALL") params.set("status", newStatus);
      else params.delete("status");
    }
    params.set("page", "1");
    router.push(`/fees?${params.toString()}`);
  };

  return (
    <div className="p-4 border-b border-slate-800 flex flex-wrap items-center gap-4">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const qVal = (form.elements.namedItem("q") as HTMLInputElement)?.value;
          updateFilters(qVal, undefined, undefined);
        }}
        className="relative w-full max-w-md flex-1"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          name="q"
          defaultValue={initialQ}
          type="text" 
          placeholder="Search by reference number..." 
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
        />
      </form>

      <div className="flex items-center gap-2">
        <Filter size={18} className="text-slate-500" />
        
        <select 
          defaultValue={initialMethod || "ALL"} 
          onChange={(e) => updateFilters(undefined, e.target.value, undefined)} 
          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 cursor-pointer"
        >
          <option value="ALL">All Methods</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CASH">Cash</option>
          <option value="CREDIT_CARD">Credit Card</option>
          <option value="CHEQUE">Cheque</option>
          <option value="ONLINE_GATEWAY">Online Gateway</option>
        </select>

        <select 
          defaultValue={initialStatus || "ALL"} 
          onChange={(e) => updateFilters(undefined, undefined, e.target.value)} 
          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REVERSED">Reversed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>
    </div>
  );
}

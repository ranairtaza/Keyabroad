"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";

export default function InvoiceFilters({ initialQ, initialStatus }: { initialQ: string; initialStatus: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = (newQ?: string, newStatus?: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (newQ !== undefined) {
      if (newQ) params.set("q", newQ);
      else params.delete("q");
    }
    if (newStatus !== undefined) {
      if (newStatus && newStatus !== "ALL") params.set("status", newStatus);
      else params.delete("status");
    }
    params.set("page", "1");
    router.push(`/invoices?${params.toString()}`);
  };

  return (
    <div className="p-4 border-b border-slate-800 flex flex-wrap items-center gap-4">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const qVal = (form.elements.namedItem("q") as HTMLInputElement)?.value;
          updateFilters(qVal, undefined);
        }}
        className="relative w-full max-w-md flex-1"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          name="q"
          defaultValue={initialQ}
          type="text" 
          placeholder="Search by invoice number..." 
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
        />
      </form>

      <div className="flex items-center gap-2">
        <Filter size={18} className="text-slate-500" />
        <select 
          defaultValue={initialStatus || "ALL"} 
          onChange={(e) => updateFilters(undefined, e.target.value)} 
          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>
  );
}

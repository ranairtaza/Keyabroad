"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Printer, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReceiptPage() {
  const params = useParams();
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLog() {
      if (!params.id) return;
      const { data, error } = await supabase
        .from("fee_logs")
        .select("*, students(name, ticket_number, email)")
        .eq("id", params.id)
        .single();
        
      if (data) setLog(data);
      setLoading(false);
    }
    fetchLog();
  }, [params.id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading receipt...</div>;
  }

  if (!log) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
      <h2 className="text-2xl font-bold mb-4">Receipt Not Found</h2>
      <Link href="/fees" className="text-primary hover:underline">Return to Fees</Link>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 print:bg-white print:py-0 print:px-0 flex flex-col items-center">
      {/* Action Bar (Hidden when printing) */}
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center print:hidden">
        <Link href="/fees" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-lg border shadow-sm font-medium">
          <ArrowLeft size={18} /> Back to Fees
        </Link>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all"
        >
          <Printer size={18} /> Print Receipt
        </button>
      </div>

      {/* Receipt Paper */}
      <div className="w-full max-w-4xl bg-white p-12 shadow-xl print:shadow-none text-black font-sans relative">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          {/* Replace this img src with your actual logo file in the public folder */}
          <img src="/logo.png" alt="KeyAbroad Logo" className="mx-auto h-24 object-contain" onError={(e) => {
             // Fallback text if logo.png doesn't exist yet
             (e.target as HTMLImageElement).style.display = 'none';
             document.getElementById('fallback-logo')?.classList.remove('hidden');
          }} />
          <div id="fallback-logo" className="hidden">
             <h1 className="text-4xl font-black tracking-tighter flex items-center justify-center gap-1">
               KeyAbr<span className="text-blue-500">o</span>ad
             </h1>
             <p className="text-sm font-semibold tracking-wide">Open the door to success</p>
          </div>
          <h2 className="text-3xl font-serif font-bold mt-6 mb-8">Receipt</h2>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-base mt-8">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="text-gray-600">Date:</span>
              <span className="font-bold">{new Date(log.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            
            <div className="mt-6 space-y-1">
              <div className="flex gap-2">
                <span className="text-gray-600">Received From:</span>
                <span className="font-bold">{log.students?.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Course:</span>
                <span className="font-bold">IELTS</span> {/* Assuming IELTS or can be dynamic if available */}
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Received by:</span>
                <span className="font-bold">Admin</span>
              </div>
            </div>

            <div className="mt-6">
               <div className="flex gap-2">
                 <span className="text-gray-600">Course Ending:</span>
                 <span className="font-bold">{new Date(log.next_due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ /g, '-')}</span>
               </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-bold">{log.amount_paid.toLocaleString()} Payment</span>
            </div>

            <div className="mt-6 space-y-1">
              <div className="flex gap-2">
                <span className="text-gray-600">Method:</span>
                <span className="font-bold">Cash</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Paid Amount:</span>
                <span className="font-bold">{log.amount_paid.toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Remaining Amount:</span>
                <span className="font-bold">Nil</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex gap-2">
                <span className="text-gray-600">Deadline:</span>
                <span className="font-bold">Nil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Line */}
        <div className="mt-16 flex items-end">
          <span className="text-gray-600 mr-2">Signature:</span>
          <div className="border-b border-gray-400 w-64 h-4"></div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center font-bold text-gray-900 pb-16 border-b border-dotted border-gray-400">
          Thank you for choosing KeyAbroad!
        </div>
      </div>
    </div>
  );
}

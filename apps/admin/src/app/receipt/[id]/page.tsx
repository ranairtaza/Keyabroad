"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@keyabroad/auth/legacy";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReceiptPage() {
  const params = useParams();
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLog() {
      if (!params.id) return;
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          received_by:profiles!payments_received_by_fkey(full_name),
          invoices (
            invoice_number,
            total_amount,
            amount_paid,
            status,
            students ( full_name, email )
          )
        `)
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
      <Link href="/fees" className="text-primary hover:underline">Return to Ledger</Link>
    </div>;
  }

  const invoice = log.invoices;
  const student = invoice?.students;
  const remainingAmount = Math.max(0, invoice.total_amount - invoice.amount_paid);

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 print:bg-white print:py-0 print:px-0 flex flex-col items-center">
      {/* Action Bar */}
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center print:hidden">
        <Link href="/fees" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-lg border shadow-sm font-medium">
          <ArrowLeft size={18} /> Back to Ledger
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
        <div className="text-center mb-8">
          <img src="/logo.png" alt="KeyAbroad Logo" className="mx-auto h-24 object-contain" onError={(e) => {
             (e.target as HTMLImageElement).style.display = 'none';
             document.getElementById('fallback-logo')?.classList.remove('hidden');
          }} />
          <div id="fallback-logo" className="hidden">
             <h1 className="text-4xl font-black tracking-tighter flex items-center justify-center gap-1">
               KeyAbr<span className="text-blue-500">o</span>ad
             </h1>
             <p className="text-sm font-semibold tracking-wide">Open the door to success</p>
          </div>
          <h2 className="text-3xl font-serif font-bold mt-6 mb-8 uppercase tracking-widest text-slate-800 border-b-2 border-slate-800 pb-2 inline-block">Official Receipt</h2>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-base mt-8">
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="text-gray-500 w-32">Receipt ID:</span>
              <span className="font-mono text-sm">{log.id.split('-')[0]}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-32">Date:</span>
              <span className="font-bold">{new Date(log.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            
            <div className="mt-6 space-y-1 pt-4 border-t border-slate-100">
              <div className="flex gap-2">
                <span className="text-gray-500 w-32">Received From:</span>
                <span className="font-bold">{student?.full_name || 'Unknown Student'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32">Invoice Ref:</span>
                <span className="font-bold">{invoice?.invoice_number || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32">Received By:</span>
                <span className="font-bold">{log.received_by?.full_name || 'System Admin'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <span className="text-gray-500 mr-2">Payment Status:</span>
              <span className={`font-bold uppercase tracking-wider ${log.status === 'CONFIRMED' ? 'text-green-600' : 'text-red-600'}`}>
                {log.status}
              </span>
            </div>
            
            <div className="mt-6 space-y-2 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Total:</span>
                <span className="font-medium">{log.currency_code} {Number(invoice?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Method:</span>
                <span className="font-medium">{log.method.replace('_', ' ')} {log.reference_number ? `(${log.reference_number})` : ''}</span>
              </div>
              <div className="flex justify-between text-lg border-t border-slate-200 mt-2 pt-2">
                <span className="text-gray-800 font-bold">Amount Paid:</span>
                <span className="font-bold text-green-700">{log.currency_code} {Number(log.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm pt-2">
                <span className="text-gray-500">Remaining Balance:</span>
                <span className="font-medium">{log.currency_code} {remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {log.notes && (
          <div className="mt-8 p-4 bg-slate-50 text-sm text-slate-600 italic border-l-4 border-slate-300">
            " {log.notes} "
          </div>
        )}

        <div className="mt-16 flex items-end">
          <span className="text-gray-600 mr-2">Authorized Signature:</span>
          <div className="border-b border-gray-400 w-64 h-4"></div>
        </div>

        <div className="mt-16 text-center font-bold text-gray-400 pb-16 border-b border-dotted border-gray-300 text-sm uppercase tracking-widest">
          Thank you for choosing KeyAbroad!
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-slate-100 py-12 px-4 print:bg-white print:py-0 print:px-0">
      {/* Action Bar (Hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/fees" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-lg border shadow-sm font-medium">
          <ArrowLeft size={18} /> Back to Fees
        </Link>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all"
          >
            <Printer size={18} /> Print Receipt
          </button>
        </div>
      </div>

      {/* Receipt Paper */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-start print:bg-white print:text-black print:border-b-4 print:border-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded flex items-center justify-center font-black text-xl">K</div>
              <h1 className="text-2xl font-black tracking-tight">KeyAbroad</h1>
            </div>
            <p className="text-slate-400 print:text-slate-600 text-sm">123 Education Lane<br/>Lahore, Pakistan<br/>contact@keyabroad.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-slate-200 print:text-slate-900 mb-1">RECEIPT</h2>
            <p className="text-slate-400 print:text-slate-500 font-medium">#{log.id.toString().padStart(6, '0')}</p>
            <p className="text-slate-400 print:text-slate-500 font-medium mt-2">Date: {new Date(log.payment_date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="flex justify-between mb-12">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
              <p className="text-lg font-bold text-slate-900">{log.students?.name}</p>
              <p className="text-slate-600">Ticket ID: {log.students?.ticket_number}</p>
              <p className="text-slate-600">{log.students?.email}</p>
            </div>
          </div>

          <table className="w-full text-left mb-12">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 text-sm font-bold text-slate-400 uppercase tracking-wider">Description</th>
                <th className="py-3 text-sm font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4">
                  <p className="font-bold text-slate-900">Visa Processing & Consultation Fees</p>
                  <p className="text-sm text-slate-500">Coverage for {log.months_covered} month(s)</p>
                </td>
                <td className="py-4 text-right font-bold text-slate-900">Rs {log.amount_paid.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end mb-16">
            <div className="w-64">
              <div className="flex justify-between py-3 border-b border-slate-200">
                <span className="font-medium text-slate-600">Subtotal</span>
                <span className="font-bold text-slate-900">Rs {log.amount_paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="font-bold text-slate-900 text-lg">Total Paid</span>
                <span className="font-black text-green-600 text-xl">Rs {log.amount_paid.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Info</p>
              <p className="text-slate-600 font-medium">Status: <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Paid</span></p>
            </div>
            
            <div className="text-center w-48">
              <div className="border-b-2 border-slate-800 mb-2 pb-2">
                <span className="font-brush text-2xl text-slate-800 italic">KeyAbroad Authorized</span>
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Authorized Signature</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 p-6 text-center text-sm text-slate-500 border-t border-slate-100 print:bg-white print:border-none">
          Thank you for trusting KeyAbroad with your future!
        </div>
      </div>
    </div>
  );
}

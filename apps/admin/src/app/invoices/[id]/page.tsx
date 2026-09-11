import { createClient } from "@/lib/auth/server";
import { ArrowLeft, CheckCircle, FileText, AlertCircle, Ban, Building2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { issueInvoice, cancelInvoice } from "../actions";
import PrintInvoiceButton from "./PrintInvoiceButton";

export default async function InvoiceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const invoiceId = resolvedParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('staff_role, branch').eq('id', user.id).maybeSingle();
  const role = profile?.staff_role?.toLowerCase() || '';
  const canManage = !role || ['admin', 'ceo', 'owner', 'super_admin', 'branch_manager', 'counselor'].includes(role);

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      students ( * ),
      invoice_items ( * ),
      payments ( * )
    `)
    .eq('id', invoiceId)
    .maybeSingle();

  if (error || !invoice) {
    return notFound();
  }

  let counselorName = null;
  if (invoice.assigned_counselor_id) {
    const { data: cProfile } = await supabase.from('profiles').select('full_name').eq('id', invoice.assigned_counselor_id).maybeSingle();
    if (cProfile) counselorName = cProfile.full_name;
  }

  const studentName = invoice.students?.name || invoice.students?.full_name || invoice.student || 'Valued Student';
  const studentEmail = invoice.students?.email || 'N/A';
  const studentPhone = invoice.students?.phone || 'N/A';

  const totalAmount = Number(invoice.total_amount) || Number(invoice.amount) || 0;
  const amountPaid = Number(invoice.amount_paid) || Number(invoice.paid_amount) || 0;
  const outstanding = Math.max(0, totalAmount - amountPaid);
  const currency = invoice.currency_code || 'PKR';

  // Fallback item if no invoice_items defined
  const items = (invoice.invoice_items && invoice.invoice_items.length > 0) 
    ? invoice.invoice_items 
    : [
        {
          id: 'default-item',
          description: invoice.type || invoice.course || 'Educational Consulting & Admission Processing Fee',
          quantity: 1,
          unit_amount: totalAmount,
          total_amount: totalAmount,
        }
      ];

  const formattedDate = invoice.issued_at 
    ? new Date(invoice.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : (invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A');

  const formattedDueDate = invoice.due_date 
    ? new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Upon Receipt';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none">
      {/* Top Header & Navigation - Hidden in print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              Invoice {invoice.invoice_number || 'DRAFT'}
              <span className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                (invoice.status || '').toUpperCase() === 'PAID' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                (invoice.status || '').toUpperCase() === 'OVERDUE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                (invoice.status || '').toUpperCase() === 'PARTIAL' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                (invoice.status || '').toUpperCase() === 'DRAFT' ? 'bg-slate-700/50 text-slate-300 border border-slate-600' :
                (invoice.status || '').toUpperCase() === 'CANCELLED' ? 'bg-slate-800 text-slate-500 border border-slate-700' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {invoice.status || 'DRAFT'}
              </span>
            </h2>
            <p className="text-slate-400 mt-1">Student: <span className="text-slate-200 font-medium">{studentName}</span></p>
          </div>
        </div>

        {/* Action Button: Print / PDF */}
        <div className="flex items-center gap-3">
          <PrintInvoiceButton />
        </div>
      </div>

      {/* Printable Invoice Sheet Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none print:p-8">
        
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 print:border-slate-300 pb-8 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl print:border print:border-blue-700">
                KA
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white print:text-slate-900">KeyAbroad</h1>
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600 max-w-xs leading-relaxed">
              International Education & Student Visa Services<br />
              info@keyabroad.com | www.keyabroad.com<br />
              {invoice.branch ? `Branch: ${invoice.branch}` : 'Pakistan Head Office'}
            </p>
          </div>

          <div className="sm:text-right">
            <h2 className="text-3xl font-extrabold uppercase tracking-widest text-white print:text-slate-900 mb-1">INVOICE</h2>
            <p className="text-sm font-mono text-blue-400 print:text-blue-700 font-bold mb-3">#{invoice.invoice_number || 'DRAFT'}</p>
            <div className="text-xs text-slate-400 print:text-slate-600 space-y-1">
              <div><span className="font-semibold text-slate-300 print:text-slate-700">Issue Date:</span> {formattedDate}</div>
              <div><span className="font-semibold text-slate-300 print:text-slate-700">Due Date:</span> {formattedDueDate}</div>
              {counselorName && <div><span className="font-semibold text-slate-300 print:text-slate-700">Counselor:</span> {counselorName}</div>}
              {invoice.received_by && <div><span className="font-semibold text-slate-300 print:text-slate-700">Authorized By:</span> {invoice.received_by}</div>}
            </div>
          </div>
        </div>

        {/* Billed To Details */}
        <div className="py-6 border-b border-slate-800 print:border-slate-300 flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 print:text-slate-600 mb-2">Billed To</h3>
            <p className="text-lg font-bold text-white print:text-slate-900">{studentName}</p>
            <p className="text-sm text-slate-400 print:text-slate-600">{studentEmail}</p>
            {studentPhone !== 'N/A' && <p className="text-sm text-slate-400 print:text-slate-600">{studentPhone}</p>}
          </div>
          <div className="sm:text-right">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 print:text-slate-600 mb-2">Payment Status</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              (invoice.status || '').toUpperCase() === 'PAID' ? 'bg-green-500/20 text-green-400 border border-green-500/30 print:bg-green-100 print:text-green-800' :
              (invoice.status || '').toUpperCase() === 'OVERDUE' ? 'bg-red-500/20 text-red-400 border border-red-500/30 print:bg-red-100 print:text-red-800' :
              (invoice.status || '').toUpperCase() === 'PARTIAL' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 print:bg-orange-100 print:text-orange-800' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30 print:bg-blue-100 print:text-blue-800'
            }`}>
              {invoice.status || 'DRAFT'}
            </span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-700 text-xs uppercase tracking-wider">
                <th className="py-3 px-2">Item Description</th>
                <th className="py-3 px-2 text-center">Qty</th>
                <th className="py-3 px-2 text-right">Unit Price</th>
                <th className="py-3 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 text-sm">
              {items.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="py-4 px-2 font-medium text-slate-200 print:text-slate-900">
                    {item.description}
                  </td>
                  <td className="py-4 px-2 text-center text-slate-400 print:text-slate-700">{item.quantity || 1}</td>
                  <td className="py-4 px-2 text-right text-slate-400 print:text-slate-700">
                    {currency} {Number(item.unit_amount || item.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-2 text-right font-bold text-white print:text-slate-900">
                    {currency} {Number(item.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between text-sm text-slate-400 print:text-slate-700">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-200 print:text-slate-900">{currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm text-green-400 print:text-green-700">
              <span>Amount Paid</span>
              <span className="font-semibold">-{currency} {amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-3 border-t border-slate-800 print:border-slate-300 flex justify-between text-lg font-extrabold text-white print:text-slate-900">
              <span>Balance Due</span>
              <span className={outstanding > 0 ? "text-orange-400 print:text-orange-700" : "text-green-400 print:text-green-700"}>
                {currency} {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payments Ledger Section */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800 print:border-slate-300">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 print:text-slate-600 mb-3">Recorded Transactions</h4>
            <div className="space-y-2">
              {invoice.payments.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-800/80 bg-slate-950/50 print:bg-slate-50 print:border-slate-200 text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 print:text-slate-900">{p.method ? String(p.method).replace('_', ' ') : 'Payment'}</span>
                    <span className="text-slate-500 mx-2">•</span>
                    <span className="font-mono text-slate-400 print:text-slate-600">Ref: {p.reference_number || 'N/A'}</span>
                    <span className="text-slate-500 mx-2">•</span>
                    <span className="text-slate-400 print:text-slate-600">{new Date(p.payment_date).toLocaleDateString()}</span>
                  </div>
                  <div className="font-bold text-green-400 print:text-green-700">
                    {p.currency_code || currency} {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 print:border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs text-slate-500 print:text-slate-600">
          <div>
            <p className="font-medium text-slate-400 print:text-slate-700">Thank you for choosing KeyAbroad Education!</p>
            <p className="mt-1">For financial or invoice inquiries, please contact info@keyabroad.com</p>
          </div>
          <div className="sm:text-right border-t sm:border-t-0 border-slate-800 print:border-slate-300 pt-4 sm:pt-0 w-full sm:w-auto">
            <div className="w-48 h-10 border-b border-dashed border-slate-700 print:border-slate-400 mb-1 ml-auto"></div>
            <p className="font-semibold text-slate-400 print:text-slate-700">Authorized Signature & Stamp</p>
          </div>
        </div>
      </div>

      {/* Admin Action Buttons (Issue, Pay, Cancel) - Hidden on Print */}
      {canManage && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="text-sm text-slate-400">
            <span className="font-bold text-white">Invoice Management:</span> Perform ledger updates or record payments.
          </div>
          
          <div className="flex items-center gap-3">
            {invoice.status === 'DRAFT' && (
              <form action={async () => {
                "use server";
                await issueInvoice(invoice.id);
              }}>
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-all">
                  <CheckCircle size={18} /> Issue Invoice
                </button>
              </form>
            )}

            {((invoice.status || '').toUpperCase() === 'ISSUED' || (invoice.status || '').toUpperCase() === 'PARTIAL' || (invoice.status || '').toUpperCase() === 'OVERDUE') && outstanding > 0 && (
              <Link href={`/invoices/${invoice.id}/pay`} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md transition-all">
                <CheckCircle size={18} /> Record Payment
              </Link>
            )}

            {(invoice.status === 'DRAFT' || (invoice.status || '').toUpperCase() === 'ISSUED') && (
              <form action={async () => {
                "use server";
                await cancelInvoice(invoice.id);
              }}>
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-red-400 font-semibold rounded-lg border border-slate-700 transition-all">
                  <Ban size={18} /> Cancel Invoice
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

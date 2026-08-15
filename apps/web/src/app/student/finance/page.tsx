import { createClient } from "@keyabroad/auth/server";
import { Receipt, FileText, Download, Clock, CreditCard, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StudentFinancePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).single();
  
  if (!student) {
    return (
      <div className="p-12 text-center text-slate-400">
        You must be a registered student to access this portal.
      </div>
    );
  }

  // Fetch Invoices (Exclude Draft & Cancelled)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, amount_paid, status, due_date, currency_code')
    .eq('student_id', student.id)
    .in('status', ['ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'])
    .order('created_at', { ascending: false });

  // Fetch Payments (Only Confirmed or Refunds)
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, currency_code, method, reference_number, payment_date, status, invoices!inner(invoice_number)')
    .eq('invoices.student_id', student.id)
    .in('status', ['CONFIRMED', 'REFUNDED'])
    .order('payment_date', { ascending: false });

  const invoiceList = invoices || [];
  const paymentList = payments || [];

  const outstandingBalance = invoiceList
    .filter(inv => inv.status !== 'PAID')
    .reduce((sum, inv) => sum + Math.max(0, inv.total_amount - inv.amount_paid), 0);

  // Defaulting display currency to USD if mixed, though ideally all invoices are the same currency per student
  const displayCurrency = invoiceList.length > 0 ? invoiceList[0].currency_code : 'USD';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 pt-8 px-4">
      {/* Header & Balance Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 flex-1">
          <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            Finances & Billing
            <Receipt className="text-blue-500" size={28} />
          </h2>
          <p className="text-slate-500">View your tuition invoices, track payment status, and download official receipts.</p>
        </div>
        <div className="bg-slate-50 p-8 md:w-72 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-center items-center">
          <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Outstanding</span>
          <span className={`text-4xl font-black ${outstandingBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {displayCurrency} {outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          {outstandingBalance === 0 && (
            <span className="text-green-600 text-sm font-medium mt-2 flex items-center gap-1">
              <CreditCard size={14} /> Fully Paid
            </span>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <FileText size={18} className="text-blue-500" />
            My Invoices
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-semibold">Invoice #</th>
                <th className="p-4 font-semibold">Total Amount</th>
                <th className="p-4 font-semibold">Amount Paid</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoiceList.map((inv: any) => (
                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-slate-800 font-bold">{inv.invoice_number}</td>
                  <td className="p-4 text-slate-700 font-medium">{inv.currency_code} {Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-4 text-green-600 font-medium">{inv.currency_code} {Number(inv.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-700 border border-green-200' :
                      inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700 border border-red-200' :
                      inv.status === 'PARTIAL' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 flex items-center gap-2">
                    <Clock size={14} className={new Date(inv.due_date) < new Date() && inv.status !== 'PAID' ? 'text-red-500' : ''} />
                    <span className={new Date(inv.due_date) < new Date() && inv.status !== 'PAID' ? 'text-red-600 font-medium' : ''}>
                      {new Date(inv.due_date).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
              {invoiceList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-slate-300" />
                      <p>You have no active invoices at this time.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <CreditCard size={18} className="text-green-500" />
            Payment History & Receipts
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Invoice #</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {paymentList.map((pay: any) => (
                <tr key={pay.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-slate-600">{new Date(pay.payment_date).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-800 font-medium">{pay.invoices?.invoice_number}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-medium">{pay.method.replace('_', ' ')}</span>
                      <span className="text-slate-400 text-xs font-mono">{pay.reference_number || 'No Ref'}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-green-600">
                    {pay.currency_code} {Number(pay.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/student/finance/receipt/${pay.id}`} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors border border-blue-200 inline-flex items-center gap-1">
                      <Download size={14} />
                      Receipt
                    </Link>
                  </td>
                </tr>
              ))}
              {paymentList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Receipt size={48} className="text-slate-300" />
                      <p>No confirmed payments found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { createClient } from "@keyabroad/auth/server";
import { ArrowLeft, CheckCircle, FileText, AlertCircle, Ban } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { issueInvoice, cancelInvoice } from "../actions";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('staff_role, branch').eq('id', user.id).single();
  const role = profile?.staff_role;
  const canManage = role === 'super_admin' || role === 'admin' || role === 'branch_manager' || role === 'counselor';

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      students ( full_name, email ),
      assigned_counselor:profiles!invoices_assigned_counselor_id_fkey(full_name),
      invoice_items ( * ),
      payments ( * )
    `)
    .eq('id', params.id)
    .single();

  if (error || !invoice) {
    return notFound();
  }

  const outstanding = Math.max(0, invoice.total_amount - invoice.amount_paid);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/invoices" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            Invoice {invoice.invoice_number || 'DRAFT'}
            <span className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
              invoice.status === 'PAID' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              invoice.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              invoice.status === 'PARTIAL' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
              invoice.status === 'DRAFT' ? 'bg-slate-700/50 text-slate-300 border border-slate-600' :
              invoice.status === 'CANCELLED' ? 'bg-slate-800 text-slate-500 border border-slate-700' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {invoice.status}
            </span>
          </h2>
          <p className="text-slate-400 mt-1">Student: {invoice.students?.full_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-lg font-semibold text-white">Line Items</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4">Description</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Unit</th>
                  <th className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoice.invoice_items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="p-4 text-slate-300">{item.description}</td>
                    <td className="p-4 text-slate-400">{item.quantity}</td>
                    <td className="p-4 text-slate-400">{invoice.currency_code} {Number(item.unit_amount).toFixed(2)}</td>
                    <td className="p-4 text-right text-white font-medium">{invoice.currency_code} {Number(item.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-lg font-semibold text-white">Payments & Ledger</h3>
            </div>
            <div className="p-6">
              {invoice.payments?.length > 0 ? (
                <div className="space-y-4">
                  {invoice.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-800 bg-slate-950">
                      <div>
                        <div className="text-sm text-slate-300 font-medium">{p.method} • {p.reference_number || 'No Ref'}</div>
                        <div className="text-xs text-slate-500">{new Date(p.payment_date).toLocaleString()}</div>
                        {p.status === 'CONFIRMED' && canManage && (
                          <form action={async () => {
                            "use server";
                            const { reversePaymentAction } = await import("../actions");
                            await reversePaymentAction(p.id, invoice.id);
                          }}>
                            <button type="submit" className="text-xs text-red-400 hover:text-red-300 mt-2 underline">Reverse Payment</button>
                          </form>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${p.status === 'CONFIRMED' ? 'text-green-400' : 'text-slate-500 line-through'}`}>
                          {p.currency_code} {Number(p.amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500 uppercase">{p.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No payments recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span>{invoice.currency_code} {Number(invoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Amount Paid</span>
                <span>-{invoice.currency_code} {Number(invoice.amount_paid).toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between text-white font-bold text-lg">
                <span>Amount Due</span>
                <span>{invoice.currency_code} {outstanding.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-2">Actions</h3>
            
            {invoice.status === 'DRAFT' && canManage && (
              <form action={async () => {
                "use server";
                await issueInvoice(invoice.id);
              }}>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-all">
                  <CheckCircle size={18} /> Issue Invoice
                </button>
              </form>
            )}

            {(invoice.status === 'ISSUED' || invoice.status === 'PARTIAL' || invoice.status === 'OVERDUE') && canManage && outstanding > 0 && (
              <Link href={`/invoices/${invoice.id}/pay`} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md transition-all">
                <CheckCircle size={18} /> Record Payment
              </Link>
            )}

            {(invoice.status === 'DRAFT' || invoice.status === 'ISSUED') && canManage && (
              <form action={async () => {
                "use server";
                await cancelInvoice(invoice.id);
              }}>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-red-400 font-semibold rounded-lg border border-slate-700 transition-all">
                  <Ban size={18} /> Cancel Invoice
                </button>
              </form>
            )}

            {invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
              <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-lg flex items-start gap-3 mt-4">
                <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-blue-200">
                  This invoice is issued and immutable. Financial values cannot be directly modified.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

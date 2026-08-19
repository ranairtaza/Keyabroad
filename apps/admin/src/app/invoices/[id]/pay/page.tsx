import { createClient } from "@/lib/auth/server";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { recordPaymentAction } from "../../actions";
import { notFound, redirect } from "next/navigation";

export default async function RecordPaymentPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, students(full_name)')
    .eq('id', params.id)
    .single();

  if (error || !invoice) return notFound();

  // Financial calculations
  const outstanding = Math.max(0, invoice.total_amount - invoice.amount_paid);

  if (outstanding <= 0) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl shadow-sm mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Invoice Fully Paid</h2>
        <p className="text-slate-400 mb-6">There is no outstanding balance remaining on this invoice.</p>
        <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">
          Return to Invoice Details
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-4">
        <Link href={`/invoices/${invoice.id}`} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            Record Payment
            <CreditCard className="text-green-500" size={28} />
          </h2>
          <p className="text-slate-400 mt-1">Invoice {invoice.invoice_number} • {invoice.students?.full_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-4">Invoice Balances</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-300">
                <span>Total</span>
                <span>{invoice.currency_code} {Number(invoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Paid</span>
                <span>-{invoice.currency_code} {Number(invoice.amount_paid).toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between text-white font-bold text-lg">
                <span>Outstanding</span>
                <span>{invoice.currency_code} {outstanding.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="md:col-span-2">
          <form action={recordPaymentAction} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <input type="hidden" name="invoice_id" value={invoice.id} />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Payment Amount ({invoice.currency_code})</label>
              <input 
                required
                name="amount"
                type="number" 
                min="0.01"
                step="0.01"
                max={outstanding}
                defaultValue={outstanding.toFixed(2)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white font-bold text-xl focus:outline-none focus:border-green-500"
              />
              <p className="text-xs text-slate-500">Maximum payable amount is {invoice.currency_code} {outstanding.toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Payment Method</label>
                <select required name="method" defaultValue="BANK_TRANSFER" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500">
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE_GATEWAY">Online Gateway</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Reference Number</label>
                <input 
                  required
                  name="reference_number"
                  type="text" 
                  placeholder="Txn ID / Cheque No"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Notes (Optional)</label>
              <textarea 
                name="notes"
                rows={3}
                placeholder="Any additional details..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
              ></textarea>
            </div>

            <div className="border-t border-slate-800 pt-6 flex justify-end gap-3">
              <Link href={`/invoices/${invoice.id}`} className="px-6 py-2.5 text-slate-300 hover:text-white font-medium transition-colors">
                Cancel
              </Link>
              <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md transition-all">
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

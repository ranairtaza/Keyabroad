import { createClient } from "@/lib/auth/server";
import { Receipt, Search, CreditCard, Download, Filter } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pagination } from "@/components/shared/Pagination";
import { Suspense } from "react";

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    const resolvedParams = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('staff_role').eq('id', user.id).single();
  const role = profile?.staff_role?.toLowerCase() || '';
  const canManage = ['admin', 'ceo', 'owner', 'super_admin', 'branch_manager', 'counselor'].includes(role);

  const q = typeof resolvedParams?.q === 'string' ? resolvedParams.q : '';
  const method = typeof resolvedParams?.method === 'string' ? resolvedParams.method : '';
  const status = typeof resolvedParams?.status === 'string' ? resolvedParams.status : '';
  
  const pageParam = typeof resolvedParams?.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const PAGE_SIZE = 25;
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  let query = supabase
    .from('payments')
    .select(`
      id, amount, currency_code, method, reference_number, payment_date, status,
      received_by,
      invoices ( id, invoice_number, students ( * ) )
    `, { count: 'exact' })
    .order('payment_date', { ascending: false });

  if (q) {
    query = query.or(`reference_number.ilike.%${q}%`); 
  }
  if (method && method !== 'ALL') query = query.eq('method', method);
  if (status && status !== 'ALL') query = query.eq('status', status);

  const { data: payments, error, count } = await query.range(start, end);
  
  if (error) {
    return (
      <div className="p-10 bg-red-900/50 border border-red-500 rounded-xl m-10 text-white">
        <h2 className="text-2xl font-bold mb-4">Supabase Query Error (Fees)</h2>
        <p className="font-mono text-red-300">{error.message}</p>
        <p className="font-mono text-sm mt-2">Code: {error.code}</p>
        <p className="font-mono text-sm mt-2">Details: {error.details}</p>
        <p className="text-sm mt-4 text-slate-300">Please screenshot this and show the AI.</p>
      </div>
    );
  }

  const paymentList = payments || [];
  
  // Fetch receiver names separately to avoid FK join issues
  const receiverIds = paymentList.map((p: any) => p.received_by).filter(Boolean);
  if (receiverIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', receiverIds);
    if (profiles) {
      paymentList.forEach((pay: any) => {
        if (pay.received_by) {
          const profile = profiles.find((p: any) => p.id === pay.received_by);
          if (profile) {
            pay.received_by_profile = profile;
          }
        }
      });
    }
  }

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Payments Ledger
            <Receipt className="text-green-500" size={28} />
          </h2>
          <p className="text-slate-400">View all recorded payments, verify reference numbers, and download receipts.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center gap-4">
          <form className="relative w-full max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              name="q"
              defaultValue={q}
              type="text" 
              placeholder="Search by reference number..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
            />
          </form>

          <form className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            
            <select name="method" defaultValue={method} onChange={(e) => e.target.form?.submit()} className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500">
              <option value="ALL">All Methods</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CHEQUE">Cheque</option>
              <option value="ONLINE_GATEWAY">Online Gateway</option>
            </select>

            <select name="status" defaultValue={status} onChange={(e) => e.target.form?.submit()} className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500">
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REVERSED">Reversed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            {q && <input type="hidden" name="q" value={q} />}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-sm">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Invoice #</th>
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Method / Ref</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Received By</th>
                <th className="p-4 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {paymentList.map((pay: any) => (
                <tr key={pay.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="p-4 text-slate-300">
                    {pay.payment_date ? new Date(pay.payment_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 font-medium">
                    <Link href={`/invoices/${pay.invoices?.id}`} className="text-white hover:text-primary transition-colors">
                      {pay.invoices?.invoice_number || 'Unknown'}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-400">{pay.invoices?.students?.name || pay.invoices?.students?.full_name || 'Unknown'}</td>
                  <td className={`p-4 font-bold ${pay.status === 'CONFIRMED' ? 'text-green-400' : 'text-slate-500 line-through'}`}>
                    {pay.currency_code} {pay.amount ? Number(pay.amount).toFixed(2) : '0.00'}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-slate-300">{pay.method ? String(pay.method).replace('_', ' ') : 'N/A'}</span>
                      <span className="text-slate-500 text-xs font-mono">{pay.reference_number || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                      pay.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      pay.status === 'REVERSED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-slate-700/50 text-slate-300 border border-slate-600'
                    }`}>
                      {pay.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-xs">{pay.received_by_profile?.full_name || 'System'}</td>
                  <td className="p-4 text-right">
                    <Link href={`/receipt/${pay.id}`} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors inline-flex items-center gap-1" title="View Receipt">
                      <Download size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
              {paymentList.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <Receipt size={48} className="text-slate-700" />
                      <p>No payments have been recorded matching the criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <Suspense fallback={<div className="h-10"></div>}>
          <Pagination currentPage={page} totalPages={totalPages} totalItems={count || 0} />
        </Suspense>
      </div>
    </div>
  );
  } catch (err: any) {
    return (
      <div className="p-10 bg-red-900/80 border border-red-500 rounded-xl m-10 text-white overflow-auto max-w-full">
        <h2 className="text-2xl font-bold mb-4">Production JS Error (Fees)</h2>
        <p className="font-mono text-red-300 mb-4">{err?.message || 'Unknown error'}</p>
        <pre className="text-xs text-slate-300">{err?.stack}</pre>
      </div>
    );
  }
}

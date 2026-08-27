import { createClient } from "@/lib/auth/server";
import { FileText, Plus, Search, Calendar, Filter } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pagination } from "@/components/shared/Pagination";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('staff_role').eq('id', user.id).single();
  const role = profile?.staff_role?.toLowerCase() || '';
  const canManage = ['admin', 'ceo', 'owner', 'super_admin', 'branch_manager', 'counselor'].includes(role);

  // Extract search params safely
  const q = typeof resolvedParams?.q === 'string' ? resolvedParams.q : '';
  const status = typeof resolvedParams?.status === 'string' ? resolvedParams.status : '';
  const pageParam = typeof resolvedParams?.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const PAGE_SIZE = 25;
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  // Start query
  let query = supabase
    .from('invoices')
    .select(`
      id, invoice_number, total_amount, amount_paid, status, due_date, currency_code, branch, assigned_counselor_id,
      students ( full_name, email )
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (q) {
    query = query.or(`invoice_number.ilike.%${q}%`); 
  }
  if (status && status !== 'ALL') {
    query = query.eq('status', status);
  }

  const { data: invoices, error, count } = await query.range(start, end);

  if (error) {
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }

  const invoiceList = invoices || [];
  
  // Fetch counselor names separately to avoid FK join issues
  const counselorIds = invoiceList.map((i: any) => i.assigned_counselor_id).filter(Boolean);
  if (counselorIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', counselorIds);
    if (profiles) {
      invoiceList.forEach((inv: any) => {
        if (inv.assigned_counselor_id) {
          const profile = profiles.find((p: any) => p.id === inv.assigned_counselor_id);
          inv.assigned_counselor = profile ? { full_name: profile.full_name } : null;
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
            Invoices & Billing
            <FileText className="text-primary" size={28} />
          </h2>
          <p className="text-slate-400">Manage student invoices, track due dates, and monitor payment statuses.</p>
        </div>
        {canManage && (
          <Link href="/invoices/create" className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-md transition-all">
            <Plus size={18} />
            <span>Create Draft Invoice</span>
          </Link>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center gap-4">
          <form className="relative w-full max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              name="q"
              defaultValue={q}
              type="text" 
              placeholder="Search by invoice number..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </form>

          <form className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <select name="status" defaultValue={status} onChange={(e) => e.target.form?.submit()} className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary">
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {q && <input type="hidden" name="q" value={q} />}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-sm">
                <th className="p-4 font-semibold">Invoice #</th>
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold">Total Amount</th>
                <th className="p-4 font-semibold">Outstanding</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Due Date</th>
                <th className="p-4 font-semibold">Branch</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoiceList.map((inv: any) => {
                const outstanding = Math.max(0, inv.total_amount - inv.amount_paid);
                return (
                <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="p-4 text-white font-medium">
                    <Link href={`/invoices/${inv.id}`} className="hover:text-primary transition-colors">
                      {inv.invoice_number || 'DRAFT'}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-300 font-medium">{inv.students?.full_name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{inv.assigned_counselor?.full_name || 'No Counselor'}</div>
                  </td>
                  <td className="p-4 text-slate-300 font-medium">{inv.currency_code} {Number(inv.total_amount).toFixed(2)}</td>
                  <td className="p-4 text-orange-400 font-medium">{inv.currency_code} {outstanding.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                      inv.status === 'PAID' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      inv.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      inv.status === 'PARTIAL' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      inv.status === 'DRAFT' ? 'bg-slate-700/50 text-slate-300 border border-slate-600' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(inv.due_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-slate-400">
                    {inv.branch || 'N/A'}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/invoices/${inv.id}`} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-medium transition-colors">
                      View
                    </Link>
                  </td>
                </tr>
              )})}
              {invoiceList.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-slate-700" />
                      <p>No invoices found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination currentPage={page} totalPages={totalPages} totalItems={count || 0} />
      </div>
    </div>
  );
}

import { createClient } from "@/lib/auth/server";
import { FileText, Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pagination } from "@/components/shared/Pagination";
import { Suspense } from "react";
import InvoiceFilters from "./InvoiceFilters";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    const resolvedParams = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('staff_role').eq('id', user.id).maybeSingle();
    const role = profile?.staff_role?.toLowerCase() || '';
    const canManage = !role || ['admin', 'ceo', 'owner', 'super_admin', 'branch_manager', 'counselor'].includes(role);

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
      students ( * )
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
    return (
      <div className="p-10 bg-red-900/50 border border-red-500 rounded-xl m-10 text-white">
        <h2 className="text-2xl font-bold mb-4">Supabase Query Error (Invoices)</h2>
        <p className="font-mono text-red-300">{error.message}</p>
        <p className="font-mono text-sm mt-2">Code: {error.code}</p>
        <p className="font-mono text-sm mt-2">Details: {error.details}</p>
        <p className="text-sm mt-4 text-slate-300">Please screenshot this and show the AI.</p>
      </div>
    );
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
        <InvoiceFilters initialQ={q} initialStatus={status} />

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
                const total = inv.total_amount ? Number(inv.total_amount) : 0;
                const paid = inv.amount_paid ? Number(inv.amount_paid) : 0;
                const outstanding = Math.max(0, total - paid);
                return (
                <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="p-4 text-white font-medium">
                    <Link href={`/invoices/${inv.id}`} className="hover:text-primary transition-colors">
                      {inv.invoice_number || 'DRAFT'}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-300 font-medium">{inv.students?.name || inv.students?.full_name || 'Unknown Student'}</div>
                    <div className="text-xs text-slate-500">{inv.assigned_counselor?.full_name || 'No Counselor'}</div>
                  </td>
                  <td className="p-4 text-slate-300 font-medium">{inv.currency_code || 'PKR'} {total.toFixed(2)}</td>
                  <td className="p-4 text-orange-400 font-medium">{inv.currency_code || 'PKR'} {outstanding.toFixed(2)}</td>
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
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
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
        
        <div className="mt-6 flex justify-end">
        <Suspense fallback={<div className="h-10"></div>}>
          <Pagination currentPage={page} totalPages={totalPages} totalItems={count || 0} />
        </Suspense>
      </div>
      </div>
    </div>
  );
  } catch (err: any) {
    return (
      <div className="p-10 bg-red-900/80 border border-red-500 rounded-xl m-10 text-white overflow-auto max-w-full">
        <h2 className="text-2xl font-bold mb-4">Production JS Error (Invoices)</h2>
        <p className="font-mono text-red-300 mb-4">{err?.message || 'Unknown error'}</p>
        <pre className="text-xs text-slate-300">{err?.stack}</pre>
      </div>
    );
  }
}

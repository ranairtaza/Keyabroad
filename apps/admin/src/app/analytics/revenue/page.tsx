import { createClient } from "@/lib/auth/server";
import { DollarSign, TrendingUp, AlertCircle, Building, Filter, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import AnalyticsCharts from "./AnalyticsCharts";

export default async function RevenueAnalyticsPage({
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
    
    if (!canManage) {
      return (
        <div className="p-12 text-center text-slate-400">
          You do not have permission to view revenue analytics.
        </div>
      );
    }

    const range = typeof resolvedParams.range === 'string' ? resolvedParams.range : 'all';
    let startDate = null;
    let endDate = null;
    const now = new Date();

    if (range === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    } else if (range === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    } else if (range === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      endDate = new Date(now.getFullYear(), 11, 31).toISOString();
    }

    // Fetch data directly from tables to ensure 100% resilience against RPC type/schema drift
    let invQuery = supabase.from('invoices').select('id, total_amount, amount_paid, status, currency_code, created_at');
    if (startDate) invQuery = invQuery.gte('created_at', startDate);
    if (endDate) invQuery = invQuery.lte('created_at', endDate);

    let payQuery = supabase.from('payments').select('id, amount, status, currency_code, payment_date');
    if (startDate) payQuery = payQuery.gte('payment_date', startDate);
    if (endDate) payQuery = payQuery.lte('payment_date', endDate);

    let commQuery = supabase.from('university_commissions').select('id, expected_amount, received_amount, status, currency_code, created_at');
    if (startDate) commQuery = commQuery.gte('created_at', startDate);
    if (endDate) commQuery = commQuery.lte('created_at', endDate);

    const [{ data: invoices }, { data: payments }, { data: comms }] = await Promise.all([
      invQuery,
      payQuery,
      commQuery,
    ]);

    const currencyMap: Record<string, any> = {};

    (invoices || []).forEach((inv: any) => {
      const cur = inv.currency_code || 'USD';
      if (!currencyMap[cur]) {
        currencyMap[cur] = {
          currency_code: cur,
          total_invoiced: 0,
          total_collected: 0,
          total_outstanding: 0,
          total_overdue: 0,
          invoice_count: 0,
          paid_invoice_count: 0,
          partial_invoice_count: 0,
          overdue_invoice_count: 0,
        };
      }
      const grp = currencyMap[cur];
      const total = Number(inv.total_amount) || 0;
      const paid = Number(inv.amount_paid) || 0;
      const remaining = Math.max(0, total - paid);

      grp.invoice_count++;
      grp.total_invoiced += total;
      grp.total_outstanding += remaining;

      const st = (inv.status || '').toUpperCase();
      if (st === 'PAID') grp.paid_invoice_count++;
      else if (st === 'PARTIAL') grp.partial_invoice_count++;
      else if (st === 'OVERDUE') {
        grp.overdue_invoice_count++;
        grp.total_overdue += remaining;
      }
    });

    (payments || []).forEach((pay: any) => {
      const cur = pay.currency_code || 'USD';
      if (!currencyMap[cur]) {
        currencyMap[cur] = {
          currency_code: cur,
          total_invoiced: 0,
          total_collected: 0,
          total_outstanding: 0,
          total_overdue: 0,
          invoice_count: 0,
          paid_invoice_count: 0,
          partial_invoice_count: 0,
          overdue_invoice_count: 0,
        };
      }
      if ((pay.status || '').toUpperCase() === 'CONFIRMED') {
        currencyMap[cur].total_collected += Number(pay.amount) || 0;
      }
    });

    const commMap: Record<string, any> = {};
    (comms || []).forEach((c: any) => {
      const cur = c.currency_code || 'USD';
      if (!commMap[cur]) {
        commMap[cur] = {
          currency_code: cur,
          expected_commissions: 0,
          received_commissions: 0,
        };
      }
      commMap[cur].expected_commissions += Number(c.expected_amount) || 0;
      commMap[cur].received_commissions += Number(c.received_amount) || 0;
    });

    const revenueData = Object.values(currencyMap);
    const commissionData = Object.values(commMap);

    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              Revenue Intelligence
              <span className="bg-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-md border border-primary/30 tracking-wider uppercase">Live</span>
            </h2>
            <p className="text-slate-400">Monitor financial performance, outstanding balances, and B2B commissions.</p>
          </div>

          <form className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <Calendar className="text-slate-500 ml-2" size={18} />
            <select 
              name="range" 
              defaultValue={range} 
              onChange={(e) => e.target.form?.submit()}
              className="bg-transparent text-white border-none focus:ring-0 text-sm font-medium pr-4 cursor-pointer outline-none"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Previous Month</option>
              <option value="this_year">This Year</option>
            </select>
          </form>
        </div>

        {revenueData.length === 0 ? (
          <div className="text-center p-12 text-slate-500 bg-slate-900/50 border border-slate-800 rounded-3xl">
            <DollarSign size={48} className="mx-auto text-slate-700 mb-4" />
            <p>No financial data found for the selected period.</p>
          </div>
        ) : (
          revenueData.map((currencyGroup: any) => (
            <div key={currencyGroup.currency_code} className="space-y-6">
              <h3 className="text-xl font-bold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                {currencyGroup.currency_code} Pipeline
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-blue-500/10 transition-colors duration-500"><TrendingUp size={100} /></div>
                  <h4 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Total Invoiced</h4>
                  <p className="text-4xl font-bold text-white mb-3 relative z-10">{currencyGroup.currency_code} {Number(currencyGroup.total_invoiced).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                     <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: currencyGroup.total_invoiced > 0 ? `${(currencyGroup.total_collected/currencyGroup.total_invoiced)*100}%` : '0%' }}></div>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-xs text-slate-400 font-medium">
                     <span>{currencyGroup.currency_code} {Number(currencyGroup.total_collected).toLocaleString(undefined, { minimumFractionDigits: 2 })} Collected</span>
                     <span>{currencyGroup.total_invoiced > 0 ? Math.round((currencyGroup.total_collected/currencyGroup.total_invoiced)*100) : 0}%</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-orange-500/10 transition-colors duration-500"><DollarSign size={100} /></div>
                  <h4 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Outstanding</h4>
                  <p className="text-4xl font-bold text-white mb-3 relative z-10">{currencyGroup.currency_code} {Number(currencyGroup.total_outstanding).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-slate-500 mt-6 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Across {currencyGroup.partial_invoice_count + (currencyGroup.invoice_count - currencyGroup.paid_invoice_count - currencyGroup.overdue_invoice_count - currencyGroup.partial_invoice_count)} Active Invoices
                  </p>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-red-500/10 transition-colors duration-500"><AlertCircle size={100} /></div>
                  <h4 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Overdue</h4>
                  <p className="text-4xl font-bold text-red-400 mb-3 relative z-10">{currencyGroup.currency_code} {Number(currencyGroup.total_overdue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-slate-500 mt-6 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    {currencyGroup.overdue_invoice_count} Overdue Invoices
                  </p>
                </div>

                {/* Commissions if matches currency */}
                {commissionData.find((c: any) => c.currency_code === currencyGroup.currency_code) && (
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-slate-800 group-hover:text-purple-500/10 transition-colors duration-500"><Building size={100} /></div>
                    <h4 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Commissions</h4>
                    <p className="text-4xl font-bold text-white mb-3 relative z-10">{currencyGroup.currency_code} {Number(commissionData.find((c: any) => c.currency_code === currencyGroup.currency_code).expected_commissions).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                       <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: commissionData.find((c: any) => c.currency_code === currencyGroup.currency_code).expected_commissions > 0 ? `${(commissionData.find((c: any) => c.currency_code === currencyGroup.currency_code).received_commissions/commissionData.find((c: any) => c.currency_code === currencyGroup.currency_code).expected_commissions)*100}%` : '0%' }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs text-slate-400 font-medium">
                       <span>{currencyGroup.currency_code} {Number(commissionData.find((c: any) => c.currency_code === currencyGroup.currency_code).received_commissions).toLocaleString(undefined, { minimumFractionDigits: 2 })} Received</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Series & Advanced Charts - Rendered dynamically via Client Component */}
              <div className="mt-8">
                <AnalyticsCharts currency={currencyGroup.currency_code} startDate={startDate} endDate={endDate} />
              </div>
            </div>
          ))
        )}
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-10 bg-red-900/80 border border-red-500 rounded-xl m-10 text-white overflow-auto max-w-full">
        <h2 className="text-2xl font-bold mb-4">Production JS Error (Revenue)</h2>
        <p className="font-mono text-red-300 mb-4">{err?.message || 'Unknown error'}</p>
        <pre className="text-xs text-slate-300">{err?.stack}</pre>
      </div>
    );
  }
}

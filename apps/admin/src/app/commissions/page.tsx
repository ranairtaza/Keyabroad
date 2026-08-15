import { createClient } from "@keyabroad/auth/server";
import { Search, Building, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CommissionsPage() {
  const supabase = await createClient();
  
  // Verify access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('staff_role').eq('id', user.id).single();
  const role = profile?.staff_role;
  const canManage = role === 'super_admin' || role === 'admin' || role === 'branch_manager';

  if (!canManage) {
    return (
      <div className="p-12 text-center text-slate-400">
        You do not have permission to view university commissions.
      </div>
    );
  }

  // Fetch Commissions
  const { data: commissions, error } = await supabase
    .from('university_commissions')
    .select(`
      id, expected_amount, received_amount, status, notes, updated_at,
      student_applications ( university_id, students ( full_name ) )
    `)
    .order('updated_at', { ascending: false });

  if (error && error.code !== '42P01') {
    console.error("Error fetching commissions:", error);
  }

  const commList = commissions || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            University Commissions
            <Building className="text-purple-500" size={28} />
          </h2>
          <p className="text-slate-400">Track B2B commissions expected and received from partner universities.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by student or university..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-sm">
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold">University ID</th>
                <th className="p-4 font-semibold">Expected</th>
                <th className="p-4 font-semibold">Received</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Last Updated</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commList.map((comm: any) => (
                <tr key={comm.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="p-4 text-white font-medium">{comm.student_applications?.students?.full_name || 'Unknown'}</td>
                  <td className="p-4 text-slate-300">{comm.student_applications?.university_id || 'Unknown'}</td>
                  <td className="p-4 text-slate-300 font-medium">${comm.expected_amount}</td>
                  <td className="p-4 text-green-400 font-medium">${comm.received_amount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                      comm.status === 'RECEIVED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      comm.status === 'PENDING' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      comm.status === 'PARTIAL' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-slate-700/50 text-slate-300 border border-slate-600'
                    }`}>
                      {comm.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">
                    {new Date(comm.updated_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-medium transition-colors">
                      Update
                    </button>
                  </td>
                </tr>
              ))}
              {commList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <Building size={48} className="text-slate-700" />
                      <p>No commissions tracked yet.</p>
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

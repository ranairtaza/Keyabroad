import { BarChart3, FileText, CheckCircle, Phone, Clock, Calendar, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export function ActivityLeaderboard({ calculateActivity }: { calculateActivity: () => any[] }) {
  return (
    <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><BarChart3 size={24} className="text-primary"/> Employee Performance Leaderboard</h3>
          <p className="text-sm text-slate-500 mt-1">Track which employees are closing the most leads and walk-ins.</p>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm">
                <th className="p-4 font-semibold">Rank</th>
                <th className="p-4 font-semibold">Employee Name</th>
                <th className="p-4 font-semibold text-center">Language Leads</th>
                <th className="p-4 font-semibold text-center">Walk-In Consultations</th>
                <th className="p-4 font-semibold text-center text-primary">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {calculateActivity().map(([name, stats], index) => (
                <tr key={name} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : index === 1 ? 'bg-slate-200 text-slate-600 border border-slate-300' : index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-slate-50 text-slate-500'}`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{name}</td>
                  <td className="p-4 text-center font-medium text-slate-600 dark:text-slate-300">{stats.regs}</td>
                  <td className="p-4 text-center font-medium text-slate-600 dark:text-slate-300">{stats.walkIns}</td>
                  <td className="p-4 text-center">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black text-lg">{stats.total}</span>
                  </td>
                </tr>
              ))}
              {calculateActivity().length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No activity recorded yet. Start completing tasks!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

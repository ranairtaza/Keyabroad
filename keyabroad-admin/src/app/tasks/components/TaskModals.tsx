import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskType: "language_lead" | "walk_in" | "follow_up" | "office_task" | "other";
  setTaskType: (type: "language_lead" | "walk_in" | "follow_up" | "office_task" | "other") => void;
  newTask: any;
  setNewTask: (task: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  employees: { name: string; role: string; email?: string }[];
}

export function AddTaskModal({
  isOpen,
  onClose,
  taskType,
  setTaskType,
  newTask,
  setNewTask,
  onSubmit,
  employees
}: AddTaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Assign New Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Type</label>
            <select required value={taskType} onChange={e => setTaskType(e.target.value as any)} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold text-slate-900 dark:text-white">
              <option value="language_lead">Language Lead</option>
              <option value="walk_in">Walk-in Lead</option>
              <option value="follow_up">Follow-up Call</option>
              <option value="office_task">General Office Task</option>
              <option value="other">Other</option>
            </select>
          </div>

          {taskType !== "office_task" && taskType !== "other" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student / Lead Name</label>
                <input required type="text" value={newTask.studentName} onChange={e => setNewTask({...newTask, studentName: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input type="text" value={newTask.phone} onChange={e => setNewTask({...newTask, phone: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email (Optional)</label>
                  <input type="email" value={newTask.email} onChange={e => setNewTask({...newTask, email: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
            </>
          )}

          {taskType === "language_lead" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Test Type</label>
                <select required value={newTask.test} onChange={e => setNewTask({...newTask, test: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Select</option>
                  <option value="IELTS">IELTS</option>
                  <option value="PTE">PTE</option>
                  <option value="TOEFL">TOEFL</option>
                  <option value="Duolingo">Duolingo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Score</label>
                <input type="text" value={newTask.targetScore} onChange={e => setNewTask({...newTask, targetScore: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
          )}

          {taskType === "walk_in" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                <input type="text" value={newTask.city} onChange={e => setNewTask({...newTask, city: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination</label>
                <input type="text" value={newTask.destinations} onChange={e => setNewTask({...newTask, destinations: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. UK, Aus" />
              </div>
            </div>
          )}

          {(taskType === "follow_up" || taskType === "office_task" || taskType === "other") && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date / Call Date</label>
                <input required type="date" value={newTask.date} onChange={e => setNewTask({...newTask, date: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Description / Notes</label>
                <textarea required rows={3} value={newTask.notes} onChange={e => setNewTask({...newTask, notes: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="Enter details..." />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign To Employee</label>
            <select required value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none">
              <option value="">Select Employee</option>
              {employees.map(emp => <option key={emp.name} value={emp.name}>{emp.name} ({emp.role})</option>)}
            </select>
          </div>
          <div className="pt-4"><button type="submit" className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all">Assign Task</button></div>
        </form>
      </motion.div>
    </div>
  );
}

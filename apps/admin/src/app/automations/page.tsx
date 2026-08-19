"use client";
import { useState, useEffect } from "react";
import { Zap, Plus, ArrowRight, Save, Trash2, Power, X } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/auth/client";

const supabase = createClient();

type Automation = {
  id: string;
  name: string;
  trigger_type: string;
  trigger_conditions: any;
  action_type: string;
  action_payload: any;
  is_active: boolean;
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal Form State
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("lead_created");
  const [newAction, setNewAction] = useState("create_task");
  
  const fetchAutomations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('workflow_automations')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      toast.error("Failed to load automations");
    } else {
      setAutomations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const toggleAutomation = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, is_active: !currentStatus } : a
    ));
    
    const { error } = await supabase
      .from('workflow_automations')
      .update({ is_active: !currentStatus })
      .eq('id', id);
      
    if (error) {
      toast.error("Failed to update status");
      fetchAutomations(); // revert on error
    } else {
      toast.success("Automation status updated");
    }
  };

  const deleteAutomation = async (id: string) => {
    const { error } = await supabase
      .from('workflow_automations')
      .delete()
      .eq('id', id);
      
    if (error) {
      toast.error("Failed to delete rule");
    } else {
      toast.success("Rule deleted");
      fetchAutomations();
    }
  };

  const handleSaveNew = async () => {
    if (!newName) return toast.error("Please provide a name");
    
    const newRule = {
      name: newName,
      trigger_type: newTrigger,
      trigger_conditions: newTrigger === 'lead_status_updated' ? { target_status: 'Offer Received' } : {},
      action_type: newAction,
      action_payload: newAction === 'create_task' ? { task_title: `Follow up regarding: ${newName}` } : { template: 'welcome_email' },
      is_active: true
    };
    
    const { error } = await supabase
      .from('workflow_automations')
      .insert([newRule]);
      
    if (error) {
      toast.error("Failed to create rule");
    } else {
      toast.success("Rule created successfully!");
      setIsModalOpen(false);
      fetchAutomations();
      // Reset form
      setNewName("");
      setNewTrigger("lead_created");
      setNewAction("create_task");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-y-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <Zap className="text-yellow-500 fill-yellow-500" /> Workflow Automations
          </h1>
          <p className="text-slate-500">Automate your busywork with simple If/Then rules.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> New Rule
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
      ) : automations.length === 0 ? (
        <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 mb-4">No automations created yet.</p>
          <button onClick={() => setIsModalOpen(true)} className="text-primary font-bold">Create your first rule</button>
        </div>
      ) : (
        <div className="space-y-4">
          {automations.map(auto => (
            <div key={auto.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between transition-colors hover:border-blue-200 dark:hover:border-blue-900/50">
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between md:justify-start gap-4">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{auto.name}</h3>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${auto.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {auto.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm font-medium bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex-1">
                    <span className="text-slate-400 uppercase text-xs font-bold mb-1 block">When (Trigger)</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {auto.trigger_type === 'lead_created' ? "New Lead is created" : "Lead Status changes"}
                    </span>
                  </div>
                  <ArrowRight className="text-slate-300 hidden md:block" />
                  <div className="flex-1">
                    <span className="text-blue-400 uppercase text-xs font-bold mb-1 block">Then (Action)</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {auto.action_type === 'create_task' ? `Create Task: ${auto.action_payload?.task_title || ''}` : "Send Email"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:flex-col md:items-end">
                <button 
                  onClick={() => toggleAutomation(auto.id, auto.is_active)}
                  className={`p-2 rounded-lg transition-colors ${auto.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                  title={auto.is_active ? "Pause Automation" : "Resume Automation"}
                >
                  <Power size={20} />
                </button>
                <button 
                  onClick={() => deleteAutomation(auto.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" 
                  title="Delete"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
            </div>
          ))}
        </div>
      )}

      {/* NEW RULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap size={18} className="text-primary" /> Create New Automation
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rule Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Welcome Email to New Leads"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 text-blue-500 uppercase tracking-wide">WHEN (TRIGGER)</label>
                <select 
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="lead_created">New Lead is Created</option>
                  <option value="lead_status_updated">Lead Status Changes to 'Offer Received'</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 text-primary uppercase tracking-wide">THEN (ACTION)</label>
                <select 
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="create_task">Create a Follow-up Task</option>
                  <option value="send_email">Send Welcome Email</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNew}
                className="px-5 py-2.5 rounded-xl font-medium text-white bg-primary hover:bg-blue-600 transition-colors shadow-sm"
              >
                Save Automation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

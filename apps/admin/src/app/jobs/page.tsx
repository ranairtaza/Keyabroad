"use client";
import { useState, useEffect } from "react";
import { Search, Plus, X, Briefcase, MapPin, Building, Activity, FileText } from "lucide-react";
import { createClient } from "@/lib/auth/client";
import toast from "react-hot-toast";

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  status: string;
  created_at: string;
};

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    department: "",
    location: "Faisalabad, Pakistan",
    employment_type: "Full-Time",
    description: "",
    status: "published"
  });

  const supabase = createClient();

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (data) setJobs(data);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('jobs').insert([newJob]).select();
    
    if (error) {
      toast.error("Failed to post job");
      console.error(error);
    } else if (data) {
      toast.success("Job posted successfully!");
      setJobs([data[0], ...jobs]);
      setIsModalOpen(false);
      setNewJob({ title: "", department: "", location: "Faisalabad, Pakistan", employment_type: "Full-Time", description: "", status: "published" });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newValue = currentStatus === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('jobs').update({ status: newValue }).eq('id', id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Job marked as ${newValue}`);
      setJobs(jobs.map(j => j.id === id ? { ...j, status: newValue } : j));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete job");
    } else {
      toast.success("Job deleted");
      setJobs(jobs.filter(j => j.id !== id));
    }
  };

  const filtered = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Careers & Hiring</h1>
          <p className="text-slate-500">Manage your company's open positions and job board.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Post New Job
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search job titles or departments..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filtered.map(j => (
            <div key={j.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Briefcase size={24} />
                </div>
                <button 
                  onClick={() => handleToggleStatus(j.id, j.status)}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${j.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {j.status === 'published' ? 'Live' : 'Draft'}
                </button>
              </div>
              
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{j.title}</h3>
              
              <div className="space-y-2 mb-6 flex-grow">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Building size={16} className="mr-2" /> {j.department}
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <MapPin size={16} className="mr-2" /> {j.location}
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Activity size={16} className="mr-2" /> {j.employment_type}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Posted: {new Date(j.created_at).toLocaleDateString()}</span>
                <button onClick={() => handleDelete(j.id)} className="text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>
              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Briefcase size={48} className="mx-auto text-slate-400 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No jobs posted</h3>
              <p className="text-slate-500">Click "Post New Job" to add your first vacancy.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Post New Job</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddJob} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title *</label>
                <input required type="text" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Senior Admissions Counselor" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department *</label>
                  <input required type="text" value={newJob.department} onChange={e => setNewJob({...newJob, department: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Sales, Marketing" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employment Type</label>
                  <select value={newJob.employment_type} onChange={e => setNewJob({...newJob, employment_type: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location *</label>
                <input required type="text" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Faisalabad or Remote" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Description *</label>
                <textarea required rows={5} value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="Enter the job requirements and responsibilities..."></textarea>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-medium bg-primary text-white hover:bg-blue-600 rounded-lg">Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

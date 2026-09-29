"use client";
import { useState, useEffect } from "react";
import { Search, MapPin, Calendar, Award, Banknote, Plus, X, Globe, Building, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/auth/client";
import toast from "react-hot-toast";

type University = { id: string; name: string };

type Program = {
  id: string;
  name: string;
  degree_level: string;
  tuition_fee: number;
  currency: string;
  duration: string;
  minimum_cgpa: number;
  university_id: string | null;
  status: string;
  verification_status: string;
  universities?: { name: string };
};

export default function ProgramsPage() {
  const [search, setSearch] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProgram, setNewProgram] = useState({
    name: "",
    degree_level: "Bachelors",
    tuition_fee: 0,
    currency: "USD",
    duration: "4 Years",
    minimum_cgpa: 0,
    university_id: "",
    status: "published",
    verification_status: "verified",
    slug: ""
  });

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const [progRes, unRes] = await Promise.all([
      supabase.from('programs').select('*, universities(name)').order('created_at', { ascending: false }),
      supabase.from('universities').select('id, name').order('name')
    ]);

    if (progRes.data) setPrograms(progRes.data);
    if (unRes.data) setUniversities(unRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgram.university_id) {
      toast.error("Please select a University");
      return;
    }

    const slug = newProgram.slug || newProgram.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const payload = {
      ...newProgram,
      slug,
      tuition_fee: Number(newProgram.tuition_fee),
      minimum_cgpa: Number(newProgram.minimum_cgpa),
    };

    const { data, error } = await supabase.from('programs').insert([payload]).select('*, universities(name)');
    
    if (error) {
      toast.error("Failed to add program");
      console.error(error);
    } else if (data) {
      toast.success("Program added successfully!");
      setPrograms([data[0], ...programs]);
      setIsModalOpen(false);
      setNewProgram({ 
        name: "", degree_level: "Bachelors", tuition_fee: 0, currency: "USD", duration: "4 Years", minimum_cgpa: 0,
        university_id: "", status: "published", verification_status: "verified", slug: "" 
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string, field: 'status' | 'verification_status') => {
    let newValue = "";
    if (field === 'status') {
      newValue = currentStatus === 'published' ? 'draft' : 'published';
    } else {
      newValue = currentStatus === 'verified' ? 'unverified' : 'verified';
    }
    
    const { error } = await supabase.from('programs').update({ [field]: newValue }).eq('id', id);
    if (error) {
      toast.error(`Failed to update ${field}`);
    } else {
      toast.success("Updated successfully");
      setPrograms(programs.map(p => p.id === id ? { ...p, [field]: newValue } : p));
    }
  };

  const filtered = programs.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.universities?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Programs & Courses</h1>
          <p className="text-slate-500">Manage degree programs, tuition fees, and admission requirements.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Add Program
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search programs..." 
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
          {filtered.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <GraduationCap size={24} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleStatus(p.id, p.verification_status, 'verification_status')}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${p.verification_status === 'verified' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {p.verification_status}
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(p.id, p.status, 'status')}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                  >
                    {p.status}
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{p.name}</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Award size={16} className="mr-2" />
                  {p.degree_level}
                </div>
                {p.universities?.name && (
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Building size={16} className="mr-2" />
                    {p.universities.name}
                  </div>
                )}
                <div className="flex items-center text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2">
                  Tuition: {p.currency} {p.tuition_fee}
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Calendar size={16} className="mr-2" />
                  Duration: {p.duration}
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  Min CGPA: {p.minimum_cgpa}
                </div>
              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <GraduationCap size={48} className="mx-auto text-slate-400 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No programs found</h3>
              <p className="text-slate-500">Get started by adding a new program.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Program Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add New Program</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddProgram} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Program Name</label>
                <input required type="text" value={newProgram.name} onChange={e => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                  setNewProgram({...newProgram, name, slug});
                }} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL Slug *</label>
                <input required type="text" value={newProgram.slug} onChange={e => setNewProgram({...newProgram, slug: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">University *</label>
                <select required value={newProgram.university_id} onChange={e => setNewProgram({...newProgram, university_id: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                  <option value="">Select University</option>
                  {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Degree Level</label>
                  <select value={newProgram.degree_level} onChange={e => setNewProgram({...newProgram, degree_level: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                    <option value="Bachelors">Bachelors</option>
                    <option value="Masters">Masters</option>
                    <option value="PhD">PhD</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration</label>
                  <input required type="text" value={newProgram.duration} onChange={e => setNewProgram({...newProgram, duration: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Annual Tuition Fee</label>
                  <input required type="number" value={newProgram.tuition_fee} onChange={e => setNewProgram({...newProgram, tuition_fee: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                  <select value={newProgram.currency} onChange={e => setNewProgram({...newProgram, currency: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Minimum CGPA Required (out of 4.0)</label>
                <input required type="number" step="0.1" max="4.0" min="0" value={newProgram.minimum_cgpa} onChange={e => setNewProgram({...newProgram, minimum_cgpa: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 font-medium bg-primary text-white hover:bg-blue-600 rounded-lg transition-colors">
                  Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

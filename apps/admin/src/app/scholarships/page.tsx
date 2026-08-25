"use client";
import { useState, useEffect } from "react";
import { Search, MapPin, Calendar, Award, Banknote, Plus, X, Globe, Building } from "lucide-react";
import { createClient } from "@/lib/auth/client";
import toast from "react-hot-toast";

type Country = { id: string; name: string };
type University = { id: string; name: string };

type Scholarship = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  description: string;
  deadline: string;
  university_id: string | null;
  country_id: string | null;
  status: string;
  verification_status: string;
  universities?: { name: string };
  countries?: { name: string };
};

export default function ScholarshipsPage() {
  const [search, setSearch] = useState("");
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newScholarship, setNewScholarship] = useState({
    name: "",
    amount: 0,
    currency: "USD",
    description: "",
    deadline: "",
    university_id: "",
    country_id: "",
    status: "published",
    verification_status: "verified"
  });

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const [scRes, coRes, unRes] = await Promise.all([
      supabase.from('scholarships').select('*, universities(name), countries(name)').order('created_at', { ascending: false }),
      supabase.from('countries').select('id, name').order('name'),
      supabase.from('universities').select('id, name').order('name')
    ]);

    if (scRes.data) setScholarships(scRes.data);
    if (coRes.data) setCountries(coRes.data);
    if (unRes.data) setUniversities(unRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScholarship.university_id && !newScholarship.country_id) {
      toast.error("Please select either a Country or a University");
      return;
    }

    const payload = {
      ...newScholarship,
      university_id: newScholarship.university_id || null,
      country_id: newScholarship.country_id || null,
      amount: Number(newScholarship.amount),
      deadline: newScholarship.deadline ? new Date(newScholarship.deadline).toISOString() : null,
    };

    const { data, error } = await supabase.from('scholarships').insert([payload]).select('*, universities(name), countries(name)');
    
    if (error) {
      toast.error("Failed to add scholarship");
      console.error(error);
    } else if (data) {
      toast.success("Scholarship added successfully!");
      setScholarships([data[0], ...scholarships]);
      setIsModalOpen(false);
      setNewScholarship({ 
        name: "", amount: 0, currency: "USD", description: "", deadline: "", 
        university_id: "", country_id: "", status: "published", verification_status: "verified" 
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
    
    const { error } = await supabase.from('scholarships').update({ [field]: newValue }).eq('id', id);
    if (error) {
      toast.error(`Failed to update ${field}`);
    } else {
      toast.success("Updated successfully");
      setScholarships(scholarships.map(s => s.id === id ? { ...s, [field]: newValue } : s));
    }
  };

  const filtered = scholarships.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.universities?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.countries?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Scholarships & Funding</h1>
          <p className="text-slate-500">Manage available scholarships, grants, and discounts for students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Add Scholarship
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search scholarships..." 
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
          {filtered.map(s => (
            <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                  <Banknote size={24} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleStatus(s.id, s.verification_status, 'verification_status')}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${s.verification_status === 'verified' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {s.verification_status}
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(s.id, s.status, 'status')}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${s.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                  >
                    {s.status}
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{s.name}</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Globe size={16} className="mr-2" />
                  {s.countries?.name || 'All Countries'}
                </div>
                {s.universities?.name && (
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Building size={16} className="mr-2" />
                    {s.universities.name}
                  </div>
                )}
                <div className="flex items-center text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2">
                  Amount: {s.currency} {s.amount}
                </div>
              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Banknote size={48} className="mx-auto text-slate-400 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No scholarships found</h3>
              <p className="text-slate-500">Get started by adding a new scholarship.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Scholarship Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add New Scholarship</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddScholarship} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Scholarship Name</label>
                <input required type="text" value={newScholarship.name} onChange={e => setNewScholarship({...newScholarship, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                  <input required type="number" value={newScholarship.amount} onChange={e => setNewScholarship({...newScholarship, amount: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                  <select value={newScholarship.currency} onChange={e => setNewScholarship({...newScholarship, currency: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country (Optional)</label>
                  <select value={newScholarship.country_id} onChange={e => setNewScholarship({...newScholarship, country_id: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">University (Optional)</label>
                  <select value={newScholarship.university_id} onChange={e => setNewScholarship({...newScholarship, university_id: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                    <option value="">Select University</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                <input type="date" value={newScholarship.deadline} onChange={e => setNewScholarship({...newScholarship, deadline: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea rows={3} value={newScholarship.description} onChange={e => setNewScholarship({...newScholarship, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"></textarea>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 font-medium bg-primary text-white hover:bg-blue-600 rounded-lg transition-colors">
                  Save Scholarship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

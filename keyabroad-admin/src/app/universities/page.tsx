"use client";
import { useState, useEffect } from "react";
import { Search, MapPin, Calendar, Award, Banknote, Plus, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

type University = {
  id: string;
  name: string;
  country: string;
  reqs: string;
  intake: string;
  deadline: string;
  commission: string;
};

export default function UniversitiesPage() {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUni, setNewUni] = useState({
    name: "", country: "UK", reqs: "", intake: "", deadline: "", commission: ""
  });

  const supabase = createClient();

  const fetchUniversities = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('universities').select('*').order('created_at', { ascending: false });
    if (data) setUniversities(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('universities').insert([newUni]).select();
    
    if (error) {
      toast.error("Failed to add university");
      console.error(error);
    } else if (data) {
      toast.success("University added successfully!");
      setUniversities([data[0], ...universities]);
      setIsModalOpen(false);
      setNewUni({ name: "", country: "UK", reqs: "", intake: "", deadline: "", commission: "" });
    }
  };

  const filtered = universities.filter(u => 
    (countryFilter === "All" || u.country === countryFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.country.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">University Knowledge Base</h1>
          <p className="text-slate-500">Track partner universities, intake deadlines, and entry requirements in real-time.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Add University
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search universities..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
            />
          </div>
          <select 
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
          >
            <option value="All">All Countries</option>
            <option value="UK">UK</option>
            <option value="USA">USA</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="New Zealand">New Zealand</option>
            <option value="Germany">Germany</option>
            <option value="Ireland">Ireland</option>
            <option value="Sweden">Sweden</option>
            <option value="Finland">Finland</option>
            <option value="Cyprus">Cyprus</option>
            <option value="Malaysia">Malaysia</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading universities...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(uni => (
            <div key={uni.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{uni.name}</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                  <MapPin size={18} className="mt-0.5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm">{uni.country}</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                  <Award size={18} className="mt-0.5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm"><strong className="text-slate-700 dark:text-slate-300">Reqs:</strong> {uni.reqs}</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                  <Calendar size={18} className="mt-0.5 text-orange-500 flex-shrink-0" />
                  <div className="text-sm">
                    <strong className="text-slate-700 dark:text-slate-300">Next Intake:</strong> {uni.intake}<br/>
                    <span className="text-red-500 font-medium">Deadline: {uni.deadline}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                  <Banknote size={18} className="mt-0.5 text-green-500 flex-shrink-0" />
                  <span className="text-sm"><strong className="text-slate-700 dark:text-slate-300">Est. Commission:</strong> {uni.commission}</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No universities found. Add one above!
            </div>
          )}
        </div>
      )}

      {/* Add University Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New University</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddUniversity} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">University Name</label>
                <input required type="text" value={newUni.name} onChange={e => setNewUni({...newUni, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. Oxford University" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                <select value={newUni.country} onChange={e => setNewUni({...newUni, country: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary">
                  <option value="UK">UK</option>
                  <option value="USA">USA</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Cyprus">Cyprus</option>
                  <option value="Finland">Finland</option>
                  <option value="Malaysia">Malaysia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Requirements</label>
                <input required type="text" value={newUni.reqs} onChange={e => setNewUni({...newUni, reqs: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. GPA 3.0, IELTS 6.5" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Intake</label>
                  <input required type="text" value={newUni.intake} onChange={e => setNewUni({...newUni, intake: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. Fall 2026" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                  <input required type="text" value={newUni.deadline} onChange={e => setNewUni({...newUni, deadline: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. Jan 15, 2026" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Est. Commission</label>
                <input required type="text" value={newUni.commission} onChange={e => setNewUni({...newUni, commission: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary" placeholder="e.g. $1,500" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-primary/20 transition-colors">
                  Save University
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

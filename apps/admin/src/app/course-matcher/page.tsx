"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, DollarSign, BookOpen, Filter, GraduationCap, Building2, Plus, X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRole } from "@/components/RoleContext";
import toast from "react-hot-toast";

interface University {
  id: string;
  name: string;
  country: string;
  tuition_fee: number;
  min_ielts: number;
  min_pte: number;
  subjects_offered: string[];
}

export default function CourseMatcherPage() {
  const { role } = useRole();
  const isAdmin = role === 'owner';
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUni, setNewUni] = useState({ name: "", country: "", tuition_fee: "", min_ielts: "", min_pte: "", subjects: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [budget, setBudget] = useState<number | "">("");
  const [country, setCountry] = useState("All");
  const [subject, setSubject] = useState("");
  const [ielts, setIelts] = useState<number | "">("");
  const [pte, setPte] = useState<number | "">("");



  const fetchUniversities = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('universities').select('*');
    if (data) {
      setUniversities(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUni.name || !newUni.country) {
      toast.error("Name and Country are required.");
      return;
    }
    
    setIsSubmitting(true);
    const subjectsArray = newUni.subjects.split(',').map(s => s.trim()).filter(s => s !== "");
    
    const { error } = await supabase.from('universities').insert([{
      name: newUni.name,
      country: newUni.country,
      tuition_fee: newUni.tuition_fee ? Number(newUni.tuition_fee) : 0,
      min_ielts: newUni.min_ielts ? Number(newUni.min_ielts) : 0,
      min_pte: newUni.min_pte ? Number(newUni.min_pte) : 0,
      subjects_offered: subjectsArray
    }]);

    setIsSubmitting(false);

    if (error) {
      toast.error(`Failed to add university: ${error.message}`);
    } else {
      toast.success("University added successfully!");
      setIsAddModalOpen(false);
      setNewUni({ name: "", country: "", tuition_fee: "", min_ielts: "", min_pte: "", subjects: "" });
      fetchUniversities(); // Refresh the list
    }
  };

  const filteredUnis = universities.filter(u => {
    if (country !== "All" && u.country !== country) return false;
    if (budget !== "" && u.tuition_fee > Number(budget)) return false;
    if (ielts !== "" && u.min_ielts > Number(ielts)) return false;
    if (pte !== "" && u.min_pte > Number(pte)) return false;
    if (subject !== "" && !u.subjects_offered.some(sub => sub.toLowerCase().includes(subject.toLowerCase()))) return false;
    return true;
  });

  const uniqueCountries = ["All", ...Array.from(new Set(universities.map(u => u.country)))];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <GraduationCap className="text-primary" size={32} /> 
            Course Matcher Engine
          </h2>
          <p className="text-slate-400">Find the perfect university for your students instantly.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Add University
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm sticky top-4">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Filter size={18} className="text-primary" /> Filter Requirements
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Target Country</label>
                <select 
                  value={country} 
                  onChange={e => setCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                >
                  {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Max Tuition Budget ($)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="number" 
                    placeholder="e.g. 20000"
                    value={budget} 
                    onChange={e => setBudget(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Subject of Interest</label>
                <div className="relative">
                  <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="e.g. Business, IT..."
                    value={subject} 
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Test Scores</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">IELTS</label>
                    <input 
                      type="number" 
                      step="0.5"
                      placeholder="e.g. 6.5"
                      value={ielts} 
                      onChange={e => setIelts(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">PTE</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 60"
                      value={pte} 
                      onChange={e => setPte(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setBudget(""); setCountry("All"); setSubject(""); setIelts(""); setPte(""); }}
                className="w-full py-2 mt-4 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-slate-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="mb-4 text-slate-400 font-medium">
            Found <span className="text-primary font-bold">{filteredUnis.length}</span> Matching Universities
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <AnimatePresence>
              {loading ? (
                <div className="col-span-2 py-12 text-center text-slate-500 animate-pulse">Loading University Database...</div>
              ) : filteredUnis.length > 0 ? (
                filteredUnis.map((uni, i) => (
                  <motion.div
                    key={uni.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors translate-x-1/3 -translate-y-1/3"></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h4 className="font-bold text-white text-lg flex items-center gap-2">
                          <Building2 size={18} className="text-primary" />
                          {uni.name}
                        </h4>
                        <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                          <MapPin size={14} /> {uni.country}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                      <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Tuition Fee</div>
                        <div className="font-semibold text-green-400">${uni.tuition_fee.toLocaleString()}</div>
                      </div>
                      <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800 flex justify-around">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">IELTS</div>
                          <div className="font-semibold text-white">{uni.min_ielts}</div>
                        </div>
                        <div className="w-px bg-slate-800 h-full"></div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">PTE</div>
                          <div className="font-semibold text-white">{uni.min_pte}</div>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Key Subjects</div>
                      <div className="flex flex-wrap gap-1.5">
                        {uni.subjects_offered.map(sub => (
                          <span key={sub} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 py-16 text-center border-2 border-dashed border-slate-800 rounded-xl">
                  <Search size={32} className="mx-auto text-slate-600 mb-4" />
                  <h4 className="text-lg font-bold text-slate-400 mb-1">No Matches Found</h4>
                  <p className="text-sm text-slate-500">Try lowering the test scores or increasing the budget.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Add University Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="text-primary" /> Add New University
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddUniversity} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400">University Name *</label>
                  <input required type="text" value={newUni.name} onChange={e => setNewUni({...newUni, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="e.g. Harvard University" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400">Country *</label>
                  <input required type="text" value={newUni.country} onChange={e => setNewUni({...newUni, country: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="e.g. USA" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400">Tuition Fee (USD)</label>
                  <input type="number" value={newUni.tuition_fee} onChange={e => setNewUni({...newUni, tuition_fee: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="e.g. 25000" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-400">Min IELTS</label>
                    <input type="number" step="0.5" value={newUni.min_ielts} onChange={e => setNewUni({...newUni, min_ielts: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="e.g. 6.5" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-400">Min PTE</label>
                    <input type="number" value={newUni.min_pte} onChange={e => setNewUni({...newUni, min_pte: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="e.g. 60" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400">Key Subjects (Comma Separated)</label>
                  <input type="text" value={newUni.subjects} onChange={e => setNewUni({...newUni, subjects: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="e.g. Business, IT, Engineering" />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                    <Save size={18} /> {isSubmitting ? "Saving..." : "Add University"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

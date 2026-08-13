"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Filter, Mail, Phone, MapPin, Book, Calendar, ChevronDown, Upload, X, FileSpreadsheet, CheckCircle2, FileText, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@keyabroad/auth/legacy";
import StudentProfileModal from '@/components/StudentProfileModal';
import { useRole } from "@/components/RoleContext";

interface StudentRecord {
  id: string;
  ticket_number: string;
  name: string;
  father_name: string;
  phone: string;
  email: string;
  test_date_time: string | null;
  target_destination: string;
  language_test: string;
  pipeline_type: string;
  university_applied: string | null;
  target_score: string | null;
  file_urls: string[];
  countries?: string;
  qualifications?: string;
}

const ALL_DESTINATIONS = [
  "UK", "USA", "Canada", "Ireland", "Malta", "Cyprus", 
  "Germany", "Australia", "France", "Sweden", "Italy", 
  "Finland", "Netherlands", "Malaysia", "Dubai"
];

const ALL_LANGUAGES = ["IELTS", "PTE", "TOEFL", "Duolingo", "Other", "None"];

export default function StudentDatabasePage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const { role } = useRole();
  
  // Add Student Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile / Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<StudentRecord | null>(null);

  // Follow-up Modal State
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedStudentForFollowUp, setSelectedStudentForFollowUp] = useState<StudentRecord | null>(null);
  const [followUpData, setFollowUpData] = useState({
    date: "",
    notes: "",
    assignTo: "Admin"
  });

  // Form State
  const [formData, setFormData] = useState({
    ticket_number: "STU-NEW",
    name: "",
    father_name: "",
    phone: "",
    email: "",
    target_destination: "UK",
    language_test: "IELTS",
    test_date_time: "",
    pipeline_type: "Admissions",
    university_applied: "",
    target_score: "",
    initial_fee: "",
    initial_fee_months: "1"
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load database');
    } else {
      setStudents(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (role !== "owner") {
      toast.error("Access Denied: Only Admin or Owner can delete records.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this record? This cannot be undone.")) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) toast.error(`Error deleting: ${error.message}`);
    else { toast.success("Record deleted"); fetchStudents(); }
  };

  useEffect(() => {
    fetchStudents();
    const interval = setInterval(fetchStudents, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone?.includes(searchQuery) ||
      student.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = countryFilter === "All" || student.target_destination === countryFilter;
    const matchesLanguage = languageFilter === "All" || student.language_test === languageFilter;

    return matchesSearch && matchesCountry && matchesLanguage;
  });

  const uniqueCountries = ["All", ...ALL_DESTINATIONS];
  const uniqueLanguages = ["All", ...ALL_LANGUAGES];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Insert Student
      const { error: insertError, data: newStudent } = await supabase
        .from('students')
        .insert([{
          ticket_number: formData.ticket_number,
          name: formData.name,
          father_name: formData.father_name,
          phone: formData.phone,
          email: formData.email,
          target_destination: formData.target_destination,
          language_test: formData.language_test,
          test_date_time: formData.test_date_time ? new Date(formData.test_date_time).toISOString() : null,
          pipeline_type: formData.pipeline_type,
          university_applied: formData.university_applied || null,
          target_score: formData.target_score || null
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Log creation activity
      await supabase.from('activity_logs').insert([{
        action_type: 'NEW_STUDENT',
        description: `Added new student record`,
        student_id: newStudent.id,
        employee_name: 'Admin'
      }]);

      // Handle Initial Fee if provided
      if (formData.initial_fee && Number(formData.initial_fee) > 0 && newStudent) {
         const pDate = new Date();
         const nextDue = new Date(pDate);
         nextDue.setMonth(nextDue.getMonth() + parseInt(formData.initial_fee_months));
         
         await supabase.from('fee_logs').insert([{
           student_id: newStudent.id,
           amount_paid: parseFloat(formData.initial_fee),
           months_covered: parseInt(formData.initial_fee_months),
           payment_date: pDate.toISOString(),
           next_due_date: nextDue.toISOString()
         }]);
      }

      toast.success("Student added successfully!");
      setIsModalOpen(false);
      fetchStudents();
      
      // Reset form
      setFormData({
        ticket_number: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: "",
        father_name: "",
        phone: "",
        email: "",
        target_destination: "UK",
        language_test: "IELTS",
        test_date_time: "",
        pipeline_type: "Admissions",
        university_applied: "",
        target_score: "",
        initial_fee: "",
        initial_fee_months: "1"
      });

    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForFollowUp) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('follow_ups').insert([{
        student_name: selectedStudentForFollowUp.name || (selectedStudentForFollowUp as any).full_name || 'Unknown',
        phone: selectedStudentForFollowUp.phone || (selectedStudentForFollowUp as any).mobile || 'Unknown',
        email: selectedStudentForFollowUp.email || '',
        counselor_name: followUpData.assignTo,
        follow_up_date: followUpData.date,
        notes: followUpData.notes,
        status: 'pending'
      }]);

      if (error) throw error;
      toast.success("Follow-up scheduled!");
      setIsFollowUpModalOpen(false);
      setFollowUpData({ date: "", notes: "", assignTo: "Admin" });
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Student Database</h2>
          <p className="text-slate-400">Comprehensive CRM view of all student records.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-slate-400 font-medium bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-lg shadow-sm">
            Total Records: <span className="text-white font-bold ml-1">{filteredStudents.length}</span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-bold"
          >
            <Plus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-grow relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by ticket, name, email, or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative min-w-[160px]">
            <select 
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              {uniqueCountries.map(c => (
                <option key={c} value={c}>{c === "All" ? "All Countries" : c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
          </div>

          <div className="relative min-w-[160px]">
            <select 
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              {uniqueLanguages.map(l => (
                <option key={l} value={l}>{l === "All" ? "All Languages" : l}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-sm">
                <th className="p-4 font-semibold whitespace-nowrap">Student Details</th>
                <th className="p-4 font-semibold whitespace-nowrap">Contact Info</th>
                <th className="p-4 font-semibold whitespace-nowrap">Target Destination</th>
                <th className="p-4 font-semibold whitespace-nowrap">Language Test</th>
                <th className="p-4 font-semibold whitespace-nowrap">Files</th>
                <th className="p-4 font-semibold whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500">Loading students...</td></tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={student.id} 
                    className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-white text-base">{student.name}</div>
                      <div className="text-xs text-slate-500 mt-1">S/O {student.father_name}</div>
                      <div className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">{student.ticket_number}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Phone size={14} className="text-slate-500" /> {student.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Mail size={14} className="text-slate-500" /> {student.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-2 bg-blue-900/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-900/30">
                        <MapPin size={16} /> <span className="font-semibold">{student.target_destination || student.countries || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex flex-col items-start gap-1">
                        <div className="inline-flex items-center gap-2 bg-emerald-900/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-900/30">
                          <Book size={16} /> <span className="font-semibold">{student.language_test || student.qualifications || '-'}</span>
                        </div>
                        {student.test_date_time && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar size={12} /> {new Date(student.test_date_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {student.file_urls && student.file_urls.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {student.file_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                              <FileText size={12} /> View File {i + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">No files</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudentForProfile(student);
                            setIsProfileModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:border-indigo-500 transition-colors text-xs font-bold"
                        >
                          Edit / Timeline
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentForFollowUp(student);
                            setIsFollowUpModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-1 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg border border-orange-500/30 hover:border-orange-500 transition-colors text-xs font-bold"
                        >
                          <Calendar size={12} /> Follow-up
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="flex items-center justify-center gap-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-500 transition-colors text-xs font-bold"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <Filter size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium text-lg text-slate-400">No students found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up Modal */}
      <AnimatePresence>
        {isFollowUpModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsFollowUpModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsFollowUpModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold text-white mb-1">Set Follow-up</h3>
              <p className="text-slate-400 mb-6 text-sm">Schedule a call with {selectedStudentForFollowUp?.name}</p>

              <form onSubmit={handleFollowUpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Follow-up Date</label>
                  <input 
                    type="date" 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    value={followUpData.date} 
                    onChange={e => setFollowUpData({...followUpData, date: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-primary transition-colors [color-scheme:dark]" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Assign To</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Admin, Counselor Name"
                    value={followUpData.assignTo} 
                    onChange={e => setFollowUpData({...followUpData, assignTo: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-primary transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Notes / Purpose</label>
                  <textarea 
                    required 
                    rows={3}
                    placeholder="e.g. Call to discuss missing documents..."
                    value={followUpData.notes} 
                    onChange={e => setFollowUpData({...followUpData, notes: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-primary transition-colors resize-none" 
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsFollowUpModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg font-bold transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50">
                    {isSubmitting ? "Saving..." : "Set Follow-up"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold text-white mb-1">Add New Student</h3>
              <p className="text-slate-400 mb-4 text-sm">Fill out the form below to create a new student record and import their files.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Ticket Number</label>
                    <input type="text" required value={formData.ticket_number} onChange={e => setFormData({...formData, ticket_number: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Full Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Father's Name</label>
                    <input type="text" value={formData.father_name} onChange={e => setFormData({...formData, father_name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Phone Number</label>
                    <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email Address</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-primary transition-colors" />
                  </div>
                </div>

                {/* Pipeline & Fee Section */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Pipeline Type</label>
                      <select value={formData.pipeline_type} onChange={e => setFormData({...formData, pipeline_type: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary transition-colors">
                        <option value="Admissions">Admissions</option>
                        <option value="Language">Language Center</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    {(formData.pipeline_type === "Admissions" || formData.pipeline_type === "Both") && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300">Target Destination</label>
                          <select value={formData.target_destination} onChange={e => setFormData({...formData, target_destination: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary transition-colors">
                            {ALL_DESTINATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-300">University Applied / Target</label>
                          <input type="text" placeholder="e.g. Aston University" value={formData.university_applied} onChange={e => setFormData({...formData, university_applied: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary transition-colors" />
                        </div>
                      </>
                    )}
                    
                    {(formData.pipeline_type === "Language" || formData.pipeline_type === "Both") && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300">Language Test</label>
                          <select value={formData.language_test} onChange={e => setFormData({...formData, language_test: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary transition-colors">
                            {ALL_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300">Test Date & Time (Optional)</label>
                          <input type="datetime-local" value={formData.test_date_time} onChange={e => setFormData({...formData, test_date_time: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary transition-colors [color-scheme:dark]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-300">Target Score / Band</label>
                          <input type="text" placeholder="e.g. 7.5 Band or 105 Score" value={formData.target_score} onChange={e => setFormData({...formData, target_score: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary transition-colors" />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="border-t border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-green-400">Initial Fee Paid (Rs)</label>
                      <input type="number" placeholder="0.00" min="0" value={formData.initial_fee} onChange={e => setFormData({...formData, initial_fee: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-green-500 transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Months Covered</label>
                      <input type="number" min="1" value={formData.initial_fee_months} onChange={e => setFormData({...formData, initial_fee_months: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-slate-900 pb-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg text-slate-300 font-medium hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50">
                    {isSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
                    ) : (
                      "Save Student Record"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        student={selectedStudentForProfile}
        onUpdate={fetchStudents}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { supabase } from "@keyabroad/auth/legacy";
import toast from "react-hot-toast";
import { CheckCircle2, Trash2, Plus, X, Save } from "lucide-react";
import { useRole } from "@/components/RoleContext";
import { Input } from "@keyabroad/ui/components/input";

export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState<"admissions" | "language">("admissions");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    phone: "",
    email: "",
    target_destination: "UK",
    pipeline_type: "Admissions",
    university_applied: "",
  });
  const { role } = useRole();

  // Columns definitions
  const admissionColumns = ["New", "Documents Pending", "Applied", "Offer Received", "Visa Processing", "Visa Approved"];
  const languageColumns = ["Enrolled", "In Preparation", "Mock Test", "Final Exam"];



  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load pipeline data");
      console.error(error);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    const interval = setInterval(fetchStudents, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data, error } = await supabase.from('students').insert([{
      name: newStudentForm.name,
      phone: newStudentForm.phone,
      email: newStudentForm.email,
      target_destination: newStudentForm.target_destination,
      pipeline_type: newStudentForm.pipeline_type,
      university_applied: newStudentForm.university_applied,
      ticket_number: `APP-${Math.floor(Math.random() * 9000) + 1000}`,
      admissions_stage: 'New',
      language_stage: 'Enrolled'
    }]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Application added successfully!");
      setIsAddModalOpen(false);
      setNewStudentForm({ name: "", phone: "", email: "", target_destination: "UK", pipeline_type: "Admissions", university_applied: "" });
      fetchStudents();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (role !== "owner") {
      toast.error("Access Denied: Only Admin or Owner can delete records.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this record?")) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) toast.error(`Error deleting: ${error.message}`);
    else { toast.success("Record deleted"); fetchStudents(); }
  };

  const updateStage = async (studentId: string, type: "admissions_stage" | "language_stage", newStage: string) => {
    // Optimistic update
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, [type]: newStage } : s));
    
    const { error } = await supabase
      .from("students")
      .update({ [type]: newStage })
      .eq("id", studentId);

    if (error) {
      toast.error(`Failed to update status: ${error.message}`);
      fetchStudents(); // Revert
    } else {
      if (newStage === "Completed") {
        toast.success("Student marked as Completed & Archived!");
        // Generate and copy feedback link
        const link = `https://admin.keyabroad.com/feedback/${studentId}`;
        try {
          await navigator.clipboard.writeText(link);
          toast.success("Feedback link copied to clipboard! Send this to the student.");
        } catch (err) {
          console.error("Clipboard failed", err);
          toast((t) => (
            <div>
              <b>Link generated!</b><br/>
              <a href={link} target="_blank" className="text-blue-500 underline">{link}</a>
            </div>
          ), { duration: 10000 });
        }
      } else {
        toast.success("Stage updated successfully!");
    }
  }
  };

  // Filter students by active tab type
  const activeStudents = students.filter(s => 
    activeTab === "admissions" 
      ? (s.pipeline_type === "Admissions" || s.pipeline_type === "Both")
      : (s.pipeline_type === "Language" || s.pipeline_type === "Both")
  );

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="space-y-6 h-full flex flex-col"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="flex flex-col lg:flex-row justify-between items-start lg:items-center flex-shrink-0 gap-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Application Pipeline</h2>
        
        {/* Tabs */}
        <div className="flex flex-wrap bg-slate-900 rounded-lg p-1 border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("admissions")}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === "admissions" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Admissions
          </button>
          <button
            onClick={() => setActiveTab("language")}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === "language" ? "bg-secondary text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Language Center
          </button>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Add Application
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
           <div className="flex-1 flex items-center justify-center text-slate-500 font-medium">Loading Pipeline...</div>
        ) : activeTab === "admissions" ? (
          <motion.div 
            key="admissions"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex gap-6 overflow-x-auto pb-4"
          >
            {admissionColumns.map(column => {
              const colStudents = activeStudents.filter(s => (s.admissions_stage || "New") === column);
              return (
              <div 
                key={column} 
                className="bg-slate-900/80 backdrop-blur-md rounded-2xl w-80 flex-shrink-0 flex flex-col max-h-[75vh] border border-slate-800/50 shadow-inner"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const studentId = e.dataTransfer.getData("studentId");
                  if (studentId) updateStage(studentId, "admissions_stage", column);
                }}
              >
                <div className="p-4 font-bold text-white border-b border-slate-800/50 sticky top-0 bg-slate-950/80 rounded-t-2xl z-10 flex justify-between items-center">
                  {column}
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                    {colStudents.length}
                  </span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                  {colStudents.map(student => (
                    <Hover3DWrapper key={student.id} intensity="strong">
                      <motion.div 
                        draggable
                        onDragStart={(e: any) => e.dataTransfer.setData("studentId", student.id)}
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-800 transition-shadow relative z-20 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white">{student.name}</h4>
                          <button onClick={() => handleDelete(student.id)} className="text-red-500/50 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                        <div className="mt-2 text-sm text-slate-400 flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span>{student.target_destination || "N/A"}</span>
                            <span className="font-medium text-primary truncate max-w-[120px]">{student.university_applied || "Pending Uni"}</span>
                          </div>
                          
                          {/* Quick Stage Update Dropdown */}
                          <div className="mt-2 pt-2 border-t border-slate-800">
                             <select 
                               value={student.admissions_stage || "New"}
                               onChange={(e) => updateStage(student.id, "admissions_stage", e.target.value)}
                               className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white focus:outline-none focus:border-primary"
                             >
                               {admissionColumns.map(col => (
                                 <option key={col} value={col}>{col}</option>
                               ))}
                             </select>
                             <button 
                               onClick={() => updateStage(student.id, "admissions_stage", "Completed")}
                               className="w-full mt-2 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30 hover:border-green-500 rounded p-1.5 text-xs font-medium transition-all flex items-center justify-center gap-1"
                             >
                               <CheckCircle2 size={14} /> Mark as Completed
                             </button>
                          </div>
                        </div>
                      </motion.div>
                    </Hover3DWrapper>
                  ))}
                  {colStudents.length === 0 && (
                    <div className="text-center text-slate-500 text-sm py-8 border-2 border-dashed border-slate-800 rounded-xl">
                      No students in this stage
                    </div>
                  )}
                </div>
              </div>
            )})}
          </motion.div>
        ) : (
          <motion.div 
            key="language"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex gap-6 overflow-x-auto pb-4"
          >
            {languageColumns.map(column => {
              const colStudents = activeStudents.filter(s => (s.language_stage || "Enrolled") === column);
              return (
              <div 
                key={column} 
                className="bg-slate-900/80 backdrop-blur-md rounded-2xl w-80 flex-shrink-0 flex flex-col max-h-[75vh] border border-slate-800/50 shadow-inner"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const studentId = e.dataTransfer.getData("studentId");
                  if (studentId) updateStage(studentId, "language_stage", column);
                }}
              >
                <div className="p-4 font-bold text-white border-b border-slate-800/50 sticky top-0 bg-slate-950/80 rounded-t-2xl z-10 flex justify-between items-center">
                  {column}
                  <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full text-xs">
                    {colStudents.length}
                  </span>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                  {colStudents.map(student => (
                    <Hover3DWrapper key={student.id} intensity="strong">
                      <motion.div 
                        draggable
                        onDragStart={(e: any) => e.dataTransfer.setData("studentId", student.id)}
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-800 transition-shadow relative z-20 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white">{student.name}</h4>
                          <button onClick={() => handleDelete(student.id)} className="text-red-500/50 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                        <div className="mt-2 text-sm text-slate-400 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="bg-slate-800 px-2 py-1 rounded text-xs font-medium text-secondary">{student.language_test || "N/A"}</span>
                            <span className="font-medium text-slate-300">Target: {student.target_score || "N/A"}</span>
                          </div>
                          
                          {/* Quick Stage Update Dropdown */}
                          <div className="mt-2 pt-2 border-t border-slate-800">
                             <select 
                               value={student.language_stage || "Enrolled"}
                               onChange={(e) => updateStage(student.id, "language_stage", e.target.value)}
                               className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-white focus:outline-none focus:border-secondary"
                             >
                               {languageColumns.map(col => (
                                 <option key={col} value={col}>{col}</option>
                               ))}
                             </select>
                             <button 
                               onClick={() => updateStage(student.id, "language_stage", "Completed")}
                               className="w-full mt-2 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30 hover:border-green-500 rounded p-1.5 text-xs font-medium transition-all flex items-center justify-center gap-1"
                             >
                               <CheckCircle2 size={14} /> Mark as Completed
                             </button>
                          </div>
                        </div>
                      </motion.div>
                    </Hover3DWrapper>
                  ))}
                  {colStudents.length === 0 && (
                    <div className="text-center text-slate-500 text-sm py-8 border-2 border-dashed border-slate-800 rounded-xl">
                      No enrolled students
                    </div>
                  )}
                </div>
              </div>
            )})}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl relative z-10 w-full max-w-md overflow-hidden flex flex-col p-8">
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={20} /></button>
              
              <h3 className="text-2xl font-bold text-white mb-6">New Application</h3>
              
              <form onSubmit={handleAddApplication} className="space-y-4">
                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-1">Student Name</label>
                  <input required type="text" value={newStudentForm.name} onChange={e => setNewStudentForm({...newStudentForm, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-1">Phone Number</label>
                  <input required type="tel" value={newStudentForm.phone} onChange={e => setNewStudentForm({...newStudentForm, phone: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-1">Email</label>
                  <input required type="email" value={newStudentForm.email} onChange={e => setNewStudentForm({...newStudentForm, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-xs uppercase block mb-1">Pipeline Type</label>
                    <select value={newStudentForm.pipeline_type} onChange={e => setNewStudentForm({...newStudentForm, pipeline_type: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary">
                      <option value="Admissions">Admissions</option>
                      <option value="Language">Language</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs uppercase block mb-1">Destination</label>
                    <input type="text" value={newStudentForm.target_destination} onChange={e => setNewStudentForm({...newStudentForm, target_destination: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-1">Target University (Optional)</label>
                  <input type="text" value={newStudentForm.university_applied} onChange={e => setNewStudentForm({...newStudentForm, university_applied: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" />
                </div>
                
                <div className="pt-4">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2">
                    {isSubmitting ? "Saving..." : <><Save size={18} /> Add Application</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

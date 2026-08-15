"use client";

import { useState, useEffect } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { useRole } from "@/components/RoleContext";
import { Lock, X, Save, Plus, Download, FileSpreadsheet, CheckSquare, Trash2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@keyabroad/auth/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function LeadsPage() {
  const { role, currentUser } = useRole();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'walk-in'>('all');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [customChecklistItems, setCustomChecklistItems] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [newLeadForm, setNewLeadForm] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    city: "",
    inquiry_type: ""
  });
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const supabase = createClient();



  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setProfiles(data);
  };

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load leads");
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
    fetchProfiles();

    const interval = setInterval(() => {
      fetchLeads();
      fetchProfiles();
    }, 15000);

    
    // Load custom checklist items
    const savedItems = localStorage.getItem("keyabroad_custom_checklist");
    if (savedItems) {
      try {
        setCustomChecklistItems(JSON.parse(savedItems));
      } catch (e) {}
    }
    
    // Load daily checked state
    const savedChecks = localStorage.getItem("keyabroad_checklist_state");
    if (savedChecks) {
      try {
        const { date, checks } = JSON.parse(savedChecks);
        const today = new Date().toISOString().split('T')[0];
        if (date === today) {
          setCheckedItems(checks || {});
        } else {
          // If it's a new day, we automatically reset
          setCheckedItems({});
        }
      } catch (e) {}
    }
  }, []);

  const handleToggleCheck = (id: string) => {
    const updated = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(updated);
  };

  const handleSaveChecklist = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem("keyabroad_checklist_state", JSON.stringify({
      date: today,
      checks: checkedItems
    }));
    toast.success("Checklist progress saved for today!");
  };

  const handleResetChecklist = () => {
    setCheckedItems({});
    localStorage.removeItem("keyabroad_checklist_state");
    toast.success("Checklist cleared!");
  };

  const handleAddCustomChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const updated = [...customChecklistItems, newChecklistItem.trim()];
    setCustomChecklistItems(updated);
    setNewChecklistItem("");
    localStorage.setItem("keyabroad_custom_checklist", JSON.stringify(updated));
  };

  const handleRemoveCustomChecklistItem = (index: number) => {
    const updated = customChecklistItems.filter((_, i) => i !== index);
    setCustomChecklistItems(updated);
    localStorage.setItem("keyabroad_custom_checklist", JSON.stringify(updated));
  };

  const handleRestrictedAction = (actionName: string) => {
    toast.error(`Access Denied: You need Owner approval to ${actionName}.`);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const lead = leads.find(l => l.id === id);
    const oldStatus = lead?.status || 'pending';
    
    const { error } = await supabase
      .from("enquiries")
      .update({ status: newStatus })
      .eq("id", id);
      
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Lead status updated!");
      
      // Automated Follow-up Trigger
      if (newStatus === 'in_progress' && oldStatus !== 'in_progress' && lead) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 3);
        
        await supabase.from('follow_ups').insert([{
          student_name: lead.full_name || lead.name || 'Unknown',
          phone: lead.phone_number || lead.phone || 'N/A',
          counselor_name: lead.assignee || 'Unassigned', // Note: This might be an ID or Name depending on schema
          notes: 'Automated follow-up reminder after 3 days of In Progress status.',
          follow_up_date: followUpDate.toISOString(),
          status: 'pending'
        }]);
        toast.success("Automated follow-up task created for 3 days from now.");
      }
      
      fetchLeads();
      setSelectedLead(null);
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    
    // Enforce standardized schema (drop the legacy `.name`, `.phone`, `.purpose` etc if saving)
    const { error } = await supabase
      .from("enquiries")
      .update({
        full_name: selectedLead.full_name || selectedLead.name,
        phone_number: selectedLead.phone_number || selectedLead.phone,
        email: selectedLead.email,
        city: selectedLead.city || selectedLead.location,
        inquiry_type: selectedLead.inquiry_type || selectedLead.purpose,
        status: selectedLead.status || 'pending',
        assignee: selectedLead.assignee || null
      })
      .eq("id", selectedLead.id);
      
    if (error) {
      toast.error("Failed to save lead");
      console.error(error);
    } else {
      toast.success("Lead updated successfully!");
      fetchLeads();
      setSelectedLead(null);
    }
  };

  const handleConvertToApplication = async () => {
    if (!selectedLead) return;
    setIsConverting(true);

    // Insert into students table
    const { error: insertError } = await supabase.from('students').insert([{
      name: selectedLead.full_name || selectedLead.name,
      phone: selectedLead.phone_number || selectedLead.phone,
      email: selectedLead.email,
      target_destination: 'UK', // Default, can be changed later
      pipeline_type: 'Admissions',
      ticket_number: `APP-${Math.floor(Math.random() * 9000) + 1000}`,
      admissions_stage: 'New',
      language_stage: 'Enrolled'
    }]);

    if (insertError) {
      toast.error("Failed to convert lead: " + insertError.message);
      setIsConverting(false);
      return;
    }

    // Mark lead as completed
    const { error: updateError } = await supabase.from('enquiries').update({ status: 'completed' }).eq('id', selectedLead.id);
    
    if (updateError) {
      toast.error("Converted to Application, but failed to update Lead status.");
    } else {
      toast.success("Lead successfully converted to an Application!");
      fetchLeads();
      setSelectedLead(null);
    }
    setIsConverting(false);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingLead(true);
    
    // Automated Lead Assignment
    let assignee = null;
    let assigneeName = null;
    let assigneeEmail = null;
    if (profiles && profiles.length > 0) {
      const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
      assignee = randomProfile.id;
      assigneeName = randomProfile.name || randomProfile.full_name || 'Counselor';
      assigneeEmail = randomProfile.email;
    }
    
    const { error } = await supabase.from("enquiries").insert([{
      full_name: newLeadForm.full_name,
      phone_number: newLeadForm.phone_number,
      email: newLeadForm.email,
      city: newLeadForm.city,
      inquiry_type: newLeadForm.inquiry_type,
      status: 'pending',
      source: 'walk-in',
      assignee: assignee, // In standard schema, we might want to store the ID or Name. The current UI shows we store ID here.
      ticket_number: `T-M${Math.floor(Math.random() * 900) + 100}`
    }]);

    if (error) {
      toast.error("Failed to add lead.");
    } else {
      toast.success("Lead successfully added & assigned!");
      
      // Send Realtime Notification
      if (assigneeName) {
        await supabase.from('notifications').insert([{
          recipient: assigneeName,
          message: `New Lead Assigned: ${newLeadForm.full_name} from ${newLeadForm.city}`
        }]);
        
        // Trigger Email (using existing simulation or real email)
        if (assigneeEmail) {
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to_email: assigneeEmail,
              subject: 'New Walk-in Lead Assigned',
              message: `Hello ${assigneeName},<br/><br/>You have been assigned a new Walk-in Lead (<b>${newLeadForm.full_name}</b>).<br/><br/>Please log in to the CRM to review.`
            })
          }).catch(console.error);
        }
      }

      setIsAddLeadModalOpen(false);
      setNewLeadForm({ full_name: "", phone_number: "", email: "", city: "", inquiry_type: "" });
      fetchLeads();
    }
    setIsAddingLead(false);
  };

  const handleDelete = async (id: string) => {
    if (role !== "owner") {
      toast.error("Access Denied: Only Admin or Owner can delete leads.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this lead?")) return;
    const { error } = await supabase.from('enquiries').delete().eq('id', id);
    if (error) toast.error(`Error deleting: ${error.message}`);
    else { toast.success("Lead deleted"); fetchLeads(); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Leads Database Report", 14, 15);
    const tableData = leads.map(l => [
      l.full_name || l.name, 
      l.phone_number || l.phone || 'N/A', 
      l.email || 'N/A', 
      l.city || l.location || 'N/A', 
      l.status || 'pending'
    ]);
    
    autoTable(doc, {
      head: [['Name', 'Phone', 'Email', 'Location', 'Status']],
      body: tableData,
      startY: 20
    });
    
    doc.save("Leads_Report.pdf");
    
    // Log audit event
    supabase.from('audit_logs').insert([{
      user_email: currentUser?.email,
      action: "EXPORT_PDF",
      resource: "Leads"
    }]).then();
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(leads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "Leads_Report.xlsx");
    
    // Log audit event
    supabase.from('audit_logs').insert([{
      user_email: currentUser?.email,
      action: "EXPORT_EXCEL",
      resource: "Leads"
    }]).then();
  };

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: any = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="flex justify-between items-center flex-wrap gap-4">
        <motion.h2 variants={item} className="text-3xl font-bold text-slate-900">Leads & Walk-ins</motion.h2>
        <motion.div variants={item} className="flex gap-2">
          <button 
            onClick={exportPDF}
            className="px-3 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700 text-sm"
          >
            <Download size={16} /> PDF
          </button>
          <button 
            onClick={exportExcel}
            className="px-3 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 text-sm"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button 
            onClick={() => setIsChecklistModalOpen(true)}
            className="px-3 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 text-sm"
          >
            <CheckSquare size={16} /> SOP Checklist
          </button>
          <button 
            onClick={() => setIsAddLeadModalOpen(true)}
            className="px-4 py-2 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2 bg-primary text-white hover:bg-blue-600"
          >
            <Plus size={16} /> Add Lead
          </button>
        </motion.div>
      </div>

      <motion.div variants={item} className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium transition-all relative ${activeTab === 'all' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
        >
          All Leads
          {activeTab === 'all' && <motion.div layoutId="activeTabLeads" className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab('online')}
          className={`px-4 py-2 text-sm font-medium transition-all relative ${activeTab === 'online' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
        >
          Online (Website)
          {activeTab === 'online' && <motion.div layoutId="activeTabLeads" className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab('walk-in')}
          className={`px-4 py-2 text-sm font-medium transition-all relative ${activeTab === 'walk-in' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
        >
          Walk-ins (Manual)
          {activeTab === 'walk-in' && <motion.div layoutId="activeTabLeads" className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </motion.div>

      <motion.div variants={item}>
        <Hover3DWrapper intensity="subtle">
          <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-300 font-medium border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Name & Source</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Purpose</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        Retrieving your data securely...
                      </td>
                    </tr>
                  ) : leads.filter(l => activeTab === 'all' || (l.source || 'online') === activeTab).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        No {activeTab !== 'all' ? activeTab : ''} leads found.
                      </td>
                    </tr>
                  ) : leads.filter(l => activeTab === 'all' || (l.source || 'online') === activeTab).map((lead, idx) => {
                    // SLA check: pending for > 24 hours
                    const isSlaBreached = lead.status === 'pending' && lead.created_at && 
                      (new Date().getTime() - new Date(lead.created_at).getTime() > 24 * 60 * 60 * 1000);
                      
                    return (
                    <motion.tr 
                      key={lead.id} 
                      className={`transition-colors ${isSlaBreached ? 'bg-red-950/20 hover:bg-red-900/30' : 'hover:bg-slate-800'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 + 0.3 }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{lead.full_name || lead.name}</div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mt-1 inline-block rounded-full ${(lead.source || 'online') === 'walk-in' ? 'bg-purple-900/40 text-purple-400 border border-purple-800/50' : 'bg-blue-900/40 text-blue-400 border border-blue-800/50'}`}>
                          {(lead.source || 'online') === 'walk-in' ? 'Walk-in' : 'Website'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-200 font-medium">{lead.phone_number || lead.phone || 'No Phone'}</span>
                          <span className="text-slate-500 text-xs">{lead.email || 'No Email'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{lead.city || lead.location || 'N/A'}</td>
                      <td className="px-6 py-4 font-semibold text-xs tracking-wider text-slate-300">
                        {lead.inquiry_type || lead.purpose || (
                          lead.destinations?.length > 0 ? `Study in ${lead.destinations.join(', ')}` :
                          lead.language_test ? `${lead.language_test} Prep` :
                          'General Assessment'
                        )}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${
                          lead.status === 'pending' ? 'bg-yellow-900/50 text-yellow-500' :
                          lead.status === 'in_progress' ? 'bg-blue-900/50 text-blue-400' :
                          'bg-green-900/50 text-green-400'
                        }`}>
                          {lead.status || 'pending'}
                        </span>
                        {isSlaBreached && (
                          <span title="Over 24h pending SLA breach" className="text-red-500 animate-pulse">⚠️</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex gap-3">
                        <button 
                          onClick={() => role === "owner" ? setSelectedLead(lead) : handleRestrictedAction("view lead details")}
                          className={`font-medium relative z-20 ${role === "owner" ? "text-primary hover:underline" : "text-slate-600 cursor-not-allowed"}`}
                        >
                          View/Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(lead.id)}
                          className="font-medium relative z-20 text-red-500 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </Hover3DWrapper>
      </motion.div>

      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLead(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl relative z-10 w-full max-w-lg overflow-hidden flex flex-col p-8">
              <button onClick={() => setSelectedLead(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={20} /></button>
              
              <h3 className="text-2xl font-bold text-white mb-6">Edit Lead Details</h3>
              
              <form onSubmit={handleSaveLead} className="space-y-4 mb-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-xs uppercase block mb-1">Name</label>
                    <input type="text" required value={selectedLead.full_name || selectedLead.name || ''} onChange={(e) => setSelectedLead({...selectedLead, full_name: e.target.value, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs uppercase block mb-1">Phone</label>
                    <input type="tel" required value={selectedLead.phone_number || selectedLead.phone || ''} onChange={(e) => setSelectedLead({...selectedLead, phone_number: e.target.value, phone: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs uppercase block mb-1">Email</label>
                    <input type="email" value={selectedLead.email || ''} onChange={(e) => setSelectedLead({...selectedLead, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs uppercase block mb-1">Location</label>
                    <input type="text" value={selectedLead.city || selectedLead.location || ''} onChange={(e) => setSelectedLead({...selectedLead, city: e.target.value, location: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs uppercase block mb-1">Assign To</label>
                    <select 
                      value={selectedLead.assignee || ''} 
                      onChange={(e) => setSelectedLead({...selectedLead, assignee: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                    >
                      <option value="">Unassigned</option>
                      {profiles.map(profile => (
                        <option key={profile.id} value={profile.id}>
                          {profile.email} ({profile.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-1">Purpose / Ticket Details</label>
                  <input type="text" required value={selectedLead.inquiry_type || selectedLead.purpose || ''} onChange={(e) => setSelectedLead({...selectedLead, inquiry_type: e.target.value, purpose: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" />
                  {selectedLead.ticket_number && (
                     <p className="text-blue-400 mt-2 font-mono bg-blue-900/30 inline-block px-2 py-1 rounded">Ticket: {selectedLead.ticket_number}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-2">Status</label>
                  <select 
                    value={selectedLead.status || 'pending'} 
                    onChange={(e) => setSelectedLead({...selectedLead, status: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary [color-scheme:dark]"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed / Enrolled</option>
                  </select>
                </div>

                  <button type="submit" className="flex-[2] bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2">
                    <Save size={18} /> Save Changes
                  </button>
                  <button 
                    type="button" 
                    onClick={handleConvertToApplication}
                    disabled={isConverting}
                    className="flex-[1] bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
                  >
                    {isConverting ? "Converting..." : <><ArrowRight size={18} /> Convert to Application</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddLeadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddLeadModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl relative z-10 w-full max-w-md overflow-hidden flex flex-col p-8">
              <button onClick={() => setIsAddLeadModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={20} /></button>
              
              <h3 className="text-2xl font-bold text-white mb-6">Manually Add Lead</h3>
              <p className="text-slate-400 text-sm mb-6">Record a lead from a phone call or manual consultation.</p>
              
              <form onSubmit={handleAddLead} className="space-y-4">
                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-1">Full Name</label>
                  <input required type="text" value={newLeadForm.full_name} onChange={e => setNewLeadForm({...newLeadForm, full_name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" placeholder="Enter full name" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-1">Phone Number</label>
                  <input required type="tel" value={newLeadForm.phone_number} onChange={e => setNewLeadForm({...newLeadForm, phone_number: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" placeholder="Enter phone number" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-1">Email (Optional)</label>
                  <input type="email" value={newLeadForm.email} onChange={e => setNewLeadForm({...newLeadForm, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" placeholder="Enter email" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-1">City/Location</label>
                  <input type="text" value={newLeadForm.city} onChange={e => setNewLeadForm({...newLeadForm, city: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" placeholder="e.g. Lahore" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs uppercase block mb-1">Purpose / Inquiry Type</label>
                  <input required type="text" value={newLeadForm.inquiry_type} onChange={e => setNewLeadForm({...newLeadForm, inquiry_type: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary" placeholder="e.g. Study in UK, IELTS Prep" />
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={isAddingLead} className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/30 flex justify-center items-center gap-2">
                    {isAddingLead ? "Saving..." : <><Save size={18} /> Save Lead</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChecklistModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsChecklistModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl relative z-10 w-full max-w-lg overflow-hidden flex flex-col p-8">
              <button onClick={() => setIsChecklistModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={20} /></button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/20 p-2 rounded-lg text-primary">
                  <CheckSquare size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white">SOP Checklist</h3>
              </div>
              
              <div className="space-y-4 text-slate-300 text-sm overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                <div className="flex gap-3">
                  <input type="checkbox" checked={!!checkedItems['default_0']} onChange={() => handleToggleCheck('default_0')} className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-slate-600 bg-slate-800" />
                  <div>
                    <strong className="text-white block">1. Review Lead Details</strong>
                    <span className="text-slate-400">Check the dashboard for the new lead. Ensure name, contact, and location are correct.</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <input type="checkbox" checked={!!checkedItems['default_1']} onChange={() => handleToggleCheck('default_1')} className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-slate-600 bg-slate-800" />
                  <div>
                    <strong className="text-white block">2. Verify the "Inquiry Type"</strong>
                    <span className="text-slate-400">Identify exactly what the student wants. If unclear, ask them immediately during first contact.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input type="checkbox" checked={!!checkedItems['default_2']} onChange={() => handleToggleCheck('default_2')} className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-slate-600 bg-slate-800" />
                  <div>
                    <strong className="text-white block">3. Confirm Assignment</strong>
                    <span className="text-slate-400">Verify it was assigned to you, or manually assign a counselor.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input type="checkbox" checked={!!checkedItems['default_3']} onChange={() => handleToggleCheck('default_3')} className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-slate-600 bg-slate-800" />
                  <div>
                    <strong className="text-white block">4. Make First Contact (Within 24 Hours)</strong>
                    <span className="text-slate-400">Call, WhatsApp, or email the student. Avoid hitting the 24-hour red SLA warning.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input type="checkbox" checked={!!checkedItems['default_4']} onChange={() => handleToggleCheck('default_4')} className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-slate-600 bg-slate-800" />
                  <div>
                    <strong className="text-white block">5. Update CRM Status</strong>
                    <span className="text-slate-400">Immediately change the lead status from <span className="text-yellow-400 font-mono">Pending</span> to <span className="text-blue-400 font-mono">In Progress</span>.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input type="checkbox" checked={!!checkedItems['default_5']} onChange={() => handleToggleCheck('default_5')} className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-slate-600 bg-slate-800" />
                  <div>
                    <strong className="text-white block">6. Schedule Follow-Up</strong>
                    <span className="text-slate-400">Book a formal consultation time or set a reminder to try again tomorrow.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input type="checkbox" checked={!!checkedItems['default_6']} onChange={() => handleToggleCheck('default_6')} className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-slate-600 bg-slate-800" />
                  <div>
                    <strong className="text-white block">7. Log Notes & Ticket Details</strong>
                    <span className="text-slate-400">Add important notes (budget, missing documents) to the lead profile.</span>
                  </div>
                </div>

                {/* Custom Items */}
                {customChecklistItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 group relative">
                    <input type="checkbox" checked={!!checkedItems[`custom_${idx}`]} onChange={() => handleToggleCheck(`custom_${idx}`)} className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-slate-600 bg-slate-800" />
                    <div className="flex-1 pr-6">
                      <strong className="text-white block">{8 + idx}. Custom Step</strong>
                      <span className="text-slate-400">{item}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveCustomChecklistItem(idx)}
                      className="absolute right-0 top-1 text-red-500 hover:text-red-400 p-1 bg-slate-800/80 rounded"
                      title="Remove this step"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <input 
                  type="text" 
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomChecklistItem()}
                  placeholder="Add custom SOP step..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                />
                <button 
                  onClick={handleAddCustomChecklistItem}
                  className="bg-primary hover:bg-blue-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              <div className="pt-6 mt-4 border-t border-slate-800 flex gap-2">
                <button onClick={handleResetChecklist} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-all border border-slate-700">
                  Clear
                </button>
                <button onClick={handleSaveChecklist} className="flex-[2] bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20">
                  Save Progress
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
